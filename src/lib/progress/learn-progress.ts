import type { SupabaseClient } from "@supabase/supabase-js";

import { loadLearnContent, type LearnType } from "@/lib/learn/content";
import { PROGRAM_ID } from "@/lib/progress/program-constants";
import {
  deriveNextTask,
  getRoadmapDay,
  loadProgramRoadmap,
  type RoadmapTask,
} from "@/lib/roadmap/program-roadmap";

export type ProgressMutationResult =
  | { state: "available"; data: Record<string, unknown> }
  | { state: "content_pending" }
  | { state: "item_not_found" }
  | { state: "task_not_found" }
  | { state: "database_error" };

function isLearnTaskType(value: string): value is LearnType {
  return ["grammar", "vocabulary", "kanji", "reading", "listening"].includes(value);
}

export function parseLearnTaskType(value: unknown): LearnType | null {
  return typeof value === "string" && isLearnTaskType(value) ? value : null;
}

async function insertCompletion(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  taskType: LearnType,
  taskId: string,
) {
  const { error } = await supabase.from("task_progress").upsert(
    {
      user_id: userId,
      program_id: PROGRAM_ID,
      study_day: studyDay,
      task_type: taskType,
      task_id: taskId,
      completion_source: "web",
    },
    {
      onConflict: "user_id,program_id,study_day,task_type,task_id",
      ignoreDuplicates: true,
    },
  );
  if (error) return null;

  const { data, error: selectError } = await supabase
    .from("task_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay)
    .eq("task_type", taskType)
    .eq("task_id", taskId)
    .single();
  if (selectError || !data) return null;
  return (data as { completed_at: string }).completed_at;
}

async function isStudyDayComplete(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  tasks: RoadmapTask[],
) {
  const { data, error } = await supabase
    .from("task_progress")
    .select("task_type,task_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay);
  if (error) return null;

  const completed = new Set(
    (data ?? []).map((row) => {
      const typed = row as { task_type: string; task_id: string };
      return `${typed.task_type}:${typed.task_id}`;
    }),
  );
  return tasks
    .filter((task) => task.required)
    .every((task) => completed.has(`${task.type}:${task.task_id}`));
}

export async function markGrammarViewed(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  grammarId: number,
): Promise<ProgressMutationResult> {
  const contentResult = await loadLearnContent("grammar", studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };
  const validIds = new Set(contentResult.data.items.map(({ id }) => id));
  if (!validIds.has(grammarId)) return { state: "item_not_found" };

  const { error } = await supabase.from("grammar_viewed").upsert(
    {
      user_id: userId,
      program_id: PROGRAM_ID,
      study_day: studyDay,
      grammar_id: grammarId,
    },
    {
      onConflict: "user_id,program_id,study_day,grammar_id",
      ignoreDuplicates: true,
    },
  );
  if (error) return { state: "database_error" };

  const { data, error: selectError } = await supabase
    .from("grammar_viewed")
    .select("grammar_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("study_day", studyDay);
  if (selectError) return { state: "database_error" };

  const viewedIds = new Set(
    (data ?? [])
      .map((row) => (row as { grammar_id: number }).grammar_id)
      .filter((id) => validIds.has(id)),
  );
  return {
    state: "available",
    data: {
      grammar_id: grammarId,
      viewed_count: viewedIds.size,
      total_count: validIds.size,
      all_viewed: viewedIds.size === validIds.size,
    },
  };
}

function itemIdFromTaskId(taskType: LearnType, taskId: string): number | null {
  if (taskType !== "reading" && taskType !== "listening") return null;
  const match = new RegExp(`^${taskType}_(\\d+)$`).exec(taskId);
  return match ? Number(match[1]) : null;
}

export async function completeLearnTask(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  taskType: LearnType,
  taskId: string,
): Promise<ProgressMutationResult> {
  const roadmapResult = await loadProgramRoadmap();
  if (roadmapResult.state === "pending") return { state: "content_pending" };
  const day = getRoadmapDay(roadmapResult.data, studyDay);
  const roadmapTask = day.tasks.find((task) => task.type === taskType);
  if (!roadmapTask) return { state: "task_not_found" };

  const contentResult = await loadLearnContent(taskType, studyDay);
  if (contentResult.state === "pending") return { state: "content_pending" };

  const itemId = itemIdFromTaskId(taskType, taskId);
  const isCanonical = taskId === roadmapTask.task_id;
  if (!isCanonical && itemId === null) return { state: "task_not_found" };
  if (itemId !== null && !contentResult.data.items.some(({ id }) => id === itemId)) {
    return { state: "item_not_found" };
  }

  const completedAt = await insertCompletion(
    supabase,
    userId,
    studyDay,
    taskType,
    taskId,
  );
  if (!completedAt) return { state: "database_error" };

  let canonicalCompleted = isCanonical;
  if (!isCanonical && (taskType === "reading" || taskType === "listening")) {
    const { data, error } = await supabase
      .from("task_progress")
      .select("task_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay)
      .eq("task_type", taskType);
    if (error) return { state: "database_error" };

    const completedItemIds = new Set(
      (data ?? [])
        .map((row) => itemIdFromTaskId(taskType, (row as { task_id: string }).task_id))
        .filter((id): id is number => id !== null),
    );
    canonicalCompleted = contentResult.data.items.every(({ id }) => completedItemIds.has(id));
    if (canonicalCompleted) {
      const canonicalAt = await insertCompletion(
        supabase,
        userId,
        studyDay,
        taskType,
        roadmapTask.task_id,
      );
      if (!canonicalAt) return { state: "database_error" };
    }
  }

  const dayCompleted = await isStudyDayComplete(supabase, userId, studyDay, day.tasks);
  if (dayCompleted === null) return { state: "database_error" };

  return {
    state: "available",
    data: {
      completed: true,
      completed_at: completedAt,
      study_day_completed: dayCompleted,
      next_task: canonicalCompleted ? deriveNextTask(day, roadmapTask.task_id) : null,
    },
  };
}
