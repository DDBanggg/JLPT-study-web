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

function validateVocabularyPool(content: LearnContentDocument) {
  if (
    content.target !== 50 ||
    content.pool_size !== content.items.length ||
    content.items.length > 100
  ) {
    throw new Error("CONTENT_INVALID");
  }
  return 50;
}

function vocabularyResponseData(studyDay: number, ids: number[], target: number) {
  return {
    study_day: studyDay,
    item_type: "vocabulary",
    learning_set_ids: ids,
    active_count: ids.length,
    target,
    pool_exhausted: ids.length < target,
  };
}

function kanjiResponseData(studyDay: number, sourceIds: number[], knownIds: Iterable<number>) {
  const activeIds = deriveKanjiActiveSet(sourceIds, knownIds);
  return {
    study_day: studyDay,
    item_type: "kanji",
    learning_set_ids: activeIds,
    active_count: activeIds.length,
    source_count: sourceIds.length,
  };
}

async function getKnownIds(
  supabase: SupabaseClient,
  userId: string,
  type: LearningSetType,
): Promise<number[] | null> {
  const { data, error } = await supabase
    .from("known_items")
    .select("item_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("item_type", type);
  if (error) return null;
  return (data ?? []).map((row) => (row as { item_id: number }).item_id);
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

export function deriveKanjiActiveSet(
  sourceIds: number[],
  knownIds: Iterable<number>,
): number[] {
  const known = new Set(knownIds);
  return sourceIds.filter((id) => !known.has(id));
}

async function ensureVocabularyLearningSet(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent("vocabulary", studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };
  const target = validateVocabularyPool(contentResult.data);

  const { data: existing, error: existingError } = await supabase
    .from("learning_sets")
    .select("item_ids")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("item_type", "vocabulary")
    .maybeSingle();
  if (existingError) return { state: "database_error" };
  if (existing) {
    const ids = (existing as { item_ids: number[] }).item_ids;
    const pool = new Set(contentResult.data.items.map(({ id }) => id));
    if (ids.some((id) => !pool.has(id)) || ids.length > target) {
      return { state: "learning_set_invalid" };
    }
    return { state: "available", data: vocabularyResponseData(studyDay, ids, target) };
  }

  const knownIds = await getKnownIds(supabase, userId, "vocabulary");
  if (knownIds === null) return { state: "database_error" };
  const initialIds = selectInitialLearningSet(
    contentResult.data.items.map(({ id }) => id),
    knownIds,
    target,
  );

  const { error: insertError } = await supabase.from("learning_sets").upsert(
    {
      user_id: userId,
      program_id: PROGRAM_ID,
      study_day: studyDay,
      item_type: "vocabulary",
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
    .eq("item_type", "vocabulary")
    .single();
  if (frozenError || !frozen) return { state: "database_error" };

  const ids = (frozen as { item_ids: number[] }).item_ids;
  return { state: "available", data: vocabularyResponseData(studyDay, ids, target) };
}

async function ensureKanjiActiveSet(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent("kanji", studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };

  const knownIds = await getKnownIds(supabase, userId, "kanji");
  if (knownIds === null) return { state: "database_error" };
  const sourceIds = contentResult.data.items.map(({ id }) => id);
  return { state: "available", data: kanjiResponseData(studyDay, sourceIds, knownIds) };
}

export async function ensureLearningSet(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  type: LearningSetType,
): Promise<LearningSetResult> {
  return type === "vocabulary"
    ? ensureVocabularyLearningSet(supabase, userId, studyDay)
    : ensureKanjiActiveSet(supabase, userId, studyDay);
}

async function markVocabularyKnownAndReplace(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  itemId: number,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent("vocabulary", studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };
  const target = validateVocabularyPool(contentResult.data);
  const poolIds = contentResult.data.items.map(({ id }) => id);
  if (!poolIds.includes(itemId)) return { state: "item_not_found" };

  const [setQuery, knownIds] = await Promise.all([
    supabase
      .from("learning_sets")
      .select("item_ids")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay)
      .eq("item_type", "vocabulary")
      .maybeSingle(),
    getKnownIds(supabase, userId, "vocabulary"),
  ]);
  if (setQuery.error || knownIds === null) return { state: "database_error" };
  if (!setQuery.data) return { state: "learning_set_invalid" };

  const activeIds = (setQuery.data as { item_ids: number[] }).item_ids;
  const known = new Set(knownIds);
  if (!activeIds.includes(itemId)) {
    return known.has(itemId) ? { state: "item_already_known" } : { state: "item_not_found" };
  }

  const replacement = selectReplacement(poolIds, activeIds, known, itemId);
  const { data, error } = await supabase.rpc("mark_known_and_replace", {
    p_user_id: userId,
    p_program_id: PROGRAM_ID,
    p_study_day: studyDay,
    p_item_type: "vocabulary",
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

async function markKanjiKnown(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  itemId: number,
): Promise<LearningSetResult> {
  const contentResult = await loadLearnContent("kanji", studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };

  const sourceIds = contentResult.data.items.map(({ id }) => id);
  if (!sourceIds.includes(itemId)) return { state: "item_not_found" };

  const knownIds = await getKnownIds(supabase, userId, "kanji");
  if (knownIds === null) return { state: "database_error" };
  if (knownIds.includes(itemId)) return { state: "item_already_known" };

  const { error } = await supabase.from("known_items").insert({
    user_id: userId,
    program_id: PROGRAM_ID,
    item_type: "kanji",
    item_id: itemId,
  });
  if ((error as { code?: string } | null)?.code === "23505") {
    return { state: "item_already_known" };
  }
  if (error) return { state: "database_error" };

  return { state: "available", data: { marked_known: itemId } };
}

export async function markKnownAndReplace(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  type: LearningSetType,
  itemId: number,
): Promise<LearningSetResult> {
  return type === "vocabulary"
    ? markVocabularyKnownAndReplace(supabase, userId, studyDay, itemId)
    : markKanjiKnown(supabase, userId, studyDay, itemId);
}
