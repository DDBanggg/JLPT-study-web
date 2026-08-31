import type { SupabaseClient } from "@supabase/supabase-js";

import { deriveKanjiActiveSet } from "@/lib/learning-sets/learning-sets";
import { PROGRAM_ID } from "@/lib/progress/program-constants";

import { loadLearnContent, type LearnContentDocument, type LearnType } from "./content";

type LearnStateResult =
  | { state: "available"; data: Record<string, unknown> }
  | { state: "pending"; data: Record<string, unknown> }
  | { state: "database_error" };

function canonicalTaskId(type: LearnType, studyDay: number): string {
  return `${type}_day_${studyDay}`;
}

async function taskCompleted(
  supabase: SupabaseClient,
  userId: string,
  type: LearnType,
  studyDay: number,
) {
  const { data, error } = await supabase
    .from("task_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("task_type", type)
    .eq("task_id", canonicalTaskId(type, studyDay))
    .maybeSingle();
  return { completed: Boolean(data), error };
}

async function getGrammarState(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  content: LearnContentDocument,
) {
  const [{ data, error }, completion] = await Promise.all([
    supabase
      .from("grammar_viewed")
      .select("grammar_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay),
    taskCompleted(supabase, userId, "grammar", studyDay),
  ]);
  if (error || completion.error) return null;

  const validIds = new Set(content.items.map(({ id }) => id));
  const viewedIds = [...new Set(
    (data ?? [])
      .map((row) => (row as { grammar_id: number }).grammar_id)
      .filter((id) => validIds.has(id)),
  )];
  return {
    viewed_ids: viewedIds,
    viewed_count: viewedIds.length,
    total_count: content.items.length,
    completed: completion.completed,
  };
}

async function getVocabularyLearningSetState(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  content: LearnContentDocument,
) {
  const [setQuery, knownQuery, completion] = await Promise.all([
    supabase
      .from("learning_sets")
      .select("item_ids")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("item_type", "vocabulary")
    .maybeSingle(),
    supabase
      .from("known_items")
      .select("item_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("item_type", "vocabulary"),
    taskCompleted(supabase, userId, "vocabulary", studyDay),
  ]);
  if (setQuery.error || knownQuery.error || completion.error) return null;

  const poolIds = new Set(content.items.map(({ id }) => id));
  const knownIds = (knownQuery.data ?? [])
    .map((row) => (row as { item_id: number }).item_id)
    .filter((id) => poolIds.has(id));
  return {
    learning_set_ids: (setQuery.data as { item_ids: number[] } | null)?.item_ids ?? [],
    known_ids_in_pool: knownIds,
    completed: completion.completed,
  };
}

async function getKanjiLearningState(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  content: LearnContentDocument,
) {
  const [knownQuery, completion] = await Promise.all([
    supabase
      .from("known_items")
      .select("item_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("item_type", "kanji"),
    taskCompleted(supabase, userId, "kanji", studyDay),
  ]);
  if (knownQuery.error || completion.error) return null;

  const sourceIds = content.items.map(({ id }) => id);
  const sourceIdSet = new Set(sourceIds);
  const knownIds = (knownQuery.data ?? [])
    .map((row) => (row as { item_id: number }).item_id)
    .filter((id) => sourceIdSet.has(id));
  return {
    learning_set_ids: deriveKanjiActiveSet(sourceIds, knownIds),
    known_ids_in_pool: knownIds,
    completed: completion.completed,
  };
}

async function getCompletionItemsState(
  supabase: SupabaseClient,
  userId: string,
  type: Extract<LearnType, "reading" | "listening">,
  studyDay: number,
  content: LearnContentDocument,
) {
  const [{ data, error }, completion] = await Promise.all([
    supabase
      .from("task_progress")
      .select("task_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay)
      .eq("task_type", type),
    taskCompleted(supabase, userId, type, studyDay),
  ]);
  if (error || completion.error) return null;

  const validIds = new Set(content.items.map(({ id }) => id));
  const prefix = `${type}_`;
  const completedItemIds = (data ?? [])
    .map((row) => (row as { task_id: string }).task_id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((id) => validIds.has(id));
  return {
    completed_item_ids: [...new Set(completedItemIds)],
    completed: completion.completed,
  };
}

export async function getLearnDay(
  supabase: SupabaseClient,
  userId: string,
  type: LearnType,
  studyDay: number,
): Promise<LearnStateResult> {
  const contentResult = await loadLearnContent(type, studyDay);
  if (contentResult.state === "pending") {
    return {
      state: "pending",
      data: { content_state: "pending", study_day: studyDay, type, content: null, user_state: null },
    };
  }

  const content = contentResult.data;
  const userState = type === "grammar"
    ? await getGrammarState(supabase, userId, studyDay, content)
    : type === "vocabulary"
      ? await getVocabularyLearningSetState(supabase, userId, studyDay, content)
      : type === "kanji"
        ? await getKanjiLearningState(supabase, userId, studyDay, content)
      : await getCompletionItemsState(supabase, userId, type, studyDay, content);

  if (!userState) return { state: "database_error" };
  return {
    state: "available",
    data: { content_state: "available", study_day: studyDay, type, content, user_state: userState },
  };
}
