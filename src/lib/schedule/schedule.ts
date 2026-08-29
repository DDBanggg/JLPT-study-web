import type { SupabaseClient } from "@supabase/supabase-js";

import { loadJsonContent } from "@/lib/data/content";
import { addCalendarDays } from "@/lib/progress/program-dates";
import { PROGRAM_ID } from "@/lib/progress/program-constants";
import {
  getRoadmapDay,
  getTaskContentPath,
  getTaskHref,
  loadProgramRoadmap,
  type RoadmapDay,
  type RoadmapTask,
} from "@/lib/roadmap/program-roadmap";
import type { ContentState, TaskState, TaskType } from "@/types";

type ContentDocument = {
  id: string;
  study_day: number;
  items?: Array<{ id: string | number }>;
  sections?: Array<{
    max_score?: number;
    questions?: unknown[];
  }>;
};

type TaskProgressRow = {
  task_type: string;
  task_id: string;
};

type TestResultRow = {
  test_id: string;
  score: number | null;
  max_score: number | null;
  total_score: number | null;
};

type ContentSummary = {
  state: ContentState;
  itemIds: Array<string | number>;
  total: number | null;
};

export type TaskProgressDto = { current: number; total: number } | null;

export type ScheduleTaskDto = {
  task_id: string;
  task_type: TaskType;
  label: string;
  order: number;
  required: boolean;
  content_state: ContentState;
  task_state: TaskState;
  progress: TaskProgressDto;
  href: string;
};

export type ScheduleDayDto = {
  program_id: string;
  study_day: number;
  total_days: number;
  planned_date: string;
  roadmap_state: RoadmapDay["roadmap_state"];
  phase: string;
  title: string;
  tasks: ScheduleTaskDto[];
};

export type ScheduleDayResult =
  | { state: "available"; data: ScheduleDayDto }
  | { state: "program_not_configured" }
  | { state: "roadmap_pending" }
  | { state: "database_error" };

function isContentDocument(value: unknown): value is ContentDocument {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getContentTotal(document: ContentDocument): number | null {
  if (Array.isArray(document.items)) return document.items.length;
  if (!Array.isArray(document.sections)) return null;

  return document.sections.reduce((total, section) => {
    if (typeof section.max_score === "number") return total + section.max_score;
    return total + (Array.isArray(section.questions) ? section.questions.length : 0);
  }, 0);
}

export async function loadTaskContentSummary(
  task: RoadmapTask,
  studyDay: number,
): Promise<ContentSummary> {
  const result = await loadJsonContent<unknown>(getTaskContentPath(task, studyDay));
  if (result.state === "pending") {
    return { state: "pending", itemIds: [], total: null };
  }

  if (
    !isContentDocument(result.data) ||
    result.data.id !== task.resource_id ||
    result.data.study_day !== studyDay
  ) {
    throw new Error("CONTENT_INVALID");
  }

  const total = getContentTotal(result.data);
  if (total === null || total < 1) throw new Error("CONTENT_INVALID");

  return {
    state: "available",
    itemIds: result.data.items?.map(({ id }) => id) ?? [],
    total,
  };
}

function exactTaskCompleted(task: RoadmapTask, rows: TaskProgressRow[]): boolean {
  return rows.some(
    (row) => row.task_type === task.type && row.task_id === task.task_id,
  );
}

function getPartialCount(
  task: RoadmapTask,
  content: ContentSummary,
  rows: TaskProgressRow[],
  viewedGrammarIds: number[],
  result: TestResultRow | undefined,
): number {
  if (task.type === "grammar") {
    const validIds = new Set(content.itemIds.map(String));
    return new Set(viewedGrammarIds.map(String).filter((id) => validIds.has(id))).size;
  }

  if (task.type === "reading" || task.type === "listening") {
    const validIds = new Set(content.itemIds.map((id) => `${task.type}_${id}`));
    return new Set(
      rows
        .filter((row) => row.task_type === task.type && validIds.has(row.task_id))
        .map((row) => row.task_id),
    ).size;
  }

  if (task.type.endsWith("_test") && result) {
    return result.total_score ?? result.score ?? 0;
  }

  return 0;
}

export function buildScheduleTaskDto(
  task: RoadmapTask,
  studyDay: number,
  content: ContentSummary,
  completedRows: TaskProgressRow[],
  viewedGrammarIds: number[] = [],
  testResult?: TestResultRow,
): ScheduleTaskDto {
  const finished = exactTaskCompleted(task, completedRows);
  const partial = content.state === "available"
    ? getPartialCount(task, content, completedRows, viewedGrammarIds, testResult)
    : 0;
  const total = content.total;
  const current = finished && total !== null ? total : Math.min(partial, total ?? partial);

  return {
    task_id: task.task_id,
    task_type: task.type,
    label: task.label,
    order: task.order,
    required: task.required,
    content_state: content.state,
    task_state: finished ? "finished" : current > 0 ? "in_progress" : "pending",
    progress: total === null ? null : { current, total },
    href: getTaskHref(task, studyDay),
  };
}

export async function getScheduleDay(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
): Promise<ScheduleDayResult> {
  const { data: program, error: programError } = await supabase
    .from("user_programs")
    .select("progress_start_date")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .maybeSingle();

  if (programError) return { state: "database_error" };
  if (!program) return { state: "program_not_configured" };

  const roadmapResult = await loadProgramRoadmap();
  if (roadmapResult.state === "pending") return { state: "roadmap_pending" };
  const roadmap = roadmapResult.data;
  const day = getRoadmapDay(roadmap, studyDay);

  const [progressQuery, grammarQuery, testQuery, content] = await Promise.all([
    supabase
      .from("task_progress")
      .select("task_type,task_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay),
    supabase
      .from("grammar_viewed")
      .select("grammar_id")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay),
    supabase
      .from("test_results")
      .select("test_id,score,max_score,total_score")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .eq("study_day", studyDay),
    Promise.all(day.tasks.map((task) => loadTaskContentSummary(task, studyDay))),
  ]);

  if (progressQuery.error || grammarQuery.error || testQuery.error) {
    return { state: "database_error" };
  }

  const progressRows = (progressQuery.data ?? []) as TaskProgressRow[];
  const viewedGrammarIds = (grammarQuery.data ?? []).map(
    (row) => (row as { grammar_id: number }).grammar_id,
  );
  const testResults = (testQuery.data ?? []) as TestResultRow[];

  const tasks = day.tasks
    .map((task, index) =>
      buildScheduleTaskDto(
        task,
        studyDay,
        content[index],
        progressRows,
        viewedGrammarIds,
        testResults.find((result) => result.test_id === task.resource_id),
      ),
    )
    .sort((left, right) => left.order - right.order);

  return {
    state: "available",
    data: {
      program_id: roadmap.program_id,
      study_day: studyDay,
      total_days: roadmap.total_days,
      planned_date: addCalendarDays(
        (program as { progress_start_date: string }).progress_start_date,
        studyDay - 1,
      ),
      roadmap_state: day.roadmap_state,
      phase: day.phase,
      title: day.title,
      tasks,
    },
  };
}
