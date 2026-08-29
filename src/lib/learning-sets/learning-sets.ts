import type { SupabaseClient } from "@supabase/supabase-js";

import { loadLearnContent, type LearnContentDocument } from "@/lib/learn/content";
import { PROGRAM_ID } from "@/lib/progress/program-constants";

export const LEARNING_SET_TYPES = ["vocabulary", "kanji"] as const;
export type LearningSetType = (typeof LEARNING_SET_TYPES)[number];

export type LearningSetResult =
  | { state: "available"; data: Record<string, unknown> }
  | { state: "content_pending" }
  | { state: "learning_set_invalid" }
  | { state: "item_not_found" }
  | { state: "item_already_known" }
  | { state: "database_error" };

export function parseLearningSetType(value: unknown): LearningSetType | null {
  return typeof value === "string" &&
      (LEARNING_SET_TYPES as readonly string[]).includes(value)
    ? (value as LearningSetType)
    : null;
}

function validatePool(content: LearnContentDocument, type: LearningSetType) {
  const expectedTarget = type === "vocabulary" ? 50 : 30;
  if (
    content.target !== expectedTarget ||
    content.pool_size !== content.items.length ||
    content.items.length > 100
  ) {
    throw new Error("CONTENT_INVALID");
  }
  return expectedTarget;
}

function responseData(
  studyDay: number,
  type: LearningSetType,
  ids: number[],
  target: number,
) {
  return {
    study_day: studyDay,
    item_type: type,
    learning_set_ids: ids,
    active_count: ids.length,
    target,
    pool_exhausted: ids.length < target,
  };
}

export function selectInitialLearningSet(
  poolIds: number[],
  knownIds: Iterable<number>,
  target: number,
): number[] {
  const known = new Set(knownIds);
  return poolIds.filter((id) => !known.has(id)).slice(0, target);
}

export function selectReplacement(
  poolIds: number[],
  activeIds: Iterable<number>,
  knownIds: Iterable<number>,
  removedItemId: number,
): number | null {
  const active = new Set(activeIds);
  const known = new Set(knownIds);
  return poolIds.find(
    (id) => id !== removedItemId && !active.has(id) && !known.has(id),
  ) ?? null;
}

export async function ensureLearningSet(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  type: LearningSetType,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent(type, studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };
  const target = validatePool(contentResult.data, type);

  const { data: existing, error: existingError } = await supabase
    .from("learning_sets")
    .select("item_ids")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("item_type", type)
    .maybeSingle();
  if (existingError) return { state: "database_error" };
  if (existing) {
    const ids = (existing as { item_ids: number[] }).item_ids;
    const pool = new Set(contentResult.data.items.map(({ id }) => id));
    if (ids.some((id) => !pool.has(id)) || ids.length > target) {
      return { state: "learning_set_invalid" };
    }
    return { state: "available", data: responseData(studyDay, type, ids, target) };
  }

  const { data: knownRows, error: knownError } = await supabase
    .from("known_items")
    .select("item_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("item_type", type);
  if (knownError) return { state: "database_error" };

  const known = new Set(
    (knownRows ?? []).map((row) => (row as { item_id: number }).item_id),
  );
  const initialIds = selectInitialLearningSet(
    contentResult.data.items.map(({ id }) => id),
    known,
    target,
  );

  const { error: insertError } = await supabase.from("learning_sets").upsert(
    {
      user_id: userId,
      program_id: PROGRAM_ID,
      study_day: studyDay,
      item_type: type,
      item_ids: initialIds,
    },
    {
      onConflict: "user_id,program_id,study_day,item_type",
      ignoreDuplicates: true,
    },
  );
  if (insertError) return { state: "database_error" };

  const { data: frozen, error: frozenError } = await supabase
    .from("learning_sets")
    .select("item_ids")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("item_type", type)
    .single();
  if (frozenError || !frozen) return { state: "database_error" };

  const ids = (frozen as { item_ids: number[] }).item_ids;
  return { state: "available", data: responseData(studyDay, type, ids, target) };
}

export async function markKnownAndReplace(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  type: LearningSetType,
  itemId: number,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent(type, studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };
  const target = validatePool(contentResult.data, type);
  const poolIds = contentResult.data.items.map(({ id }) => id);
  if (!poolIds.includes(itemId)) return { state: "item_not_found" };

  const [setQuery, knownQuery] = await Promise.all([
    supabase
      .from("learning_sets")
      .select("item_ids")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay)
      .eq("item_type", type)
      .maybeSingle(),
    supabase
      .from("known_items")
      .select("item_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("item_type", type),
  ]);
  if (setQuery.error || knownQuery.error) return { state: "database_error" };
  if (!setQuery.data) return { state: "learning_set_invalid" };

  const activeIds = (setQuery.data as { item_ids: number[] }).item_ids;
  const knownIds = new Set(
    (knownQuery.data ?? []).map((row) => (row as { item_id: number }).item_id),
  );
  if (!activeIds.includes(itemId)) {
    return knownIds.has(itemId) ? { state: "item_already_known" } : { state: "item_not_found" };
  }

  const replacement = selectReplacement(poolIds, activeIds, knownIds, itemId);

  const { data, error } = await supabase.rpc("mark_known_and_replace", {
    p_user_id: userId,
    p_program_id: PROGRAM_ID,
    p_study_day: studyDay,
    p_item_type: type,
    p_item_id: itemId,
    p_replacement_item_id: replacement,
  });
  if (error || !Array.isArray(data)) return { state: "database_error" };

  const learningSetIds = data as number[];
  return {
    state: "available",
    data: {
      marked_known: itemId,
      replacement_item_id: replacement,
      learning_set_ids: learningSetIds,
      active_count: learningSetIds.length,
      target,
      pool_exhausted: replacement === null && learningSetIds.length < target,
    },
  };
}
