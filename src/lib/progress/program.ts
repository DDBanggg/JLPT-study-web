import type { SupabaseClient } from "@supabase/supabase-js";

import { loadJsonContent } from "../data/content";
import {
  currentIsoDateInTimeZone,
  deriveCurrentStudyDay,
  deriveDaysUntilExam,
  deriveProgressPercent,
  projectedDay100Date,
} from "./program-dates";

export const PROGRAM_ID = "jlpt_n3_100_days_v1";

type ProgramRow = {
  program_id: string;
  progress_start_date: string;
  exam_date: string;
};

type RoadmapTask = {
  task_id: string;
  type: string;
  required: boolean;
};

type Roadmap = {
  program_id: string;
  total_days: number;
  days: Array<{ day: number; tasks: RoadmapTask[] }>;
};

type TaskProgressRow = {
  study_day: number;
  task_type: string;
  task_id: string;
};

export type ProgramData = ProgramRow & {
  projected_day_100_date: string;
  current_study_day: number;
  completed_study_days: number;
  progress_percent: number;
  days_until_exam: number;
};

export type CompletedStudyDaysResult =
  | { state: "available"; count: number }
  | { state: "pending" }
  | { state: "error" };

export function countCompletedStudyDays(
  roadmap: Roadmap,
  completedTasks: TaskProgressRow[],
): number {
  const completedKeys = new Set(
    completedTasks.map(({ study_day, task_type, task_id }) =>
      `${study_day}:${task_type}:${task_id}`,
    ),
  );

  return roadmap.days.filter(({ day, tasks }) => {
    const requiredTasks = tasks.filter((task) => task.required);
    return (
      requiredTasks.length > 0 &&
      requiredTasks.every((task) => completedKeys.has(`${day}:${task.type}:${task.task_id}`))
    );
  }).length;
}

export function deriveProgramData(
  row: ProgramRow,
  completedStudyDays: number,
  today = currentIsoDateInTimeZone(),
): ProgramData {
  return {
    ...row,
    projected_day_100_date: projectedDay100Date(row.progress_start_date),
    current_study_day: deriveCurrentStudyDay(row.progress_start_date, today),
    completed_study_days: completedStudyDays,
    progress_percent: deriveProgressPercent(completedStudyDays),
    days_until_exam: deriveDaysUntilExam(row.exam_date, today),
  };
}

export async function getCompletedStudyDayCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<CompletedStudyDaysResult> {
  const { data, error } = await supabase
    .from("task_progress")
    .select("study_day,task_type,task_id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID);

  if (error) {
    return { state: "error" };
  }

  const completedTasks = (data ?? []) as TaskProgressRow[];
  if (completedTasks.length === 0) {
    return { state: "available", count: 0 };
  }

  const roadmapResult = await loadJsonContent<Roadmap>("roadmap/program.json");
  if (roadmapResult.state === "pending") {
    return { state: "pending" };
  }

  const roadmap = roadmapResult.data;
  if (roadmap.program_id !== PROGRAM_ID || roadmap.total_days !== 100) {
    return { state: "error" };
  }

  return { state: "available", count: countCompletedStudyDays(roadmap, completedTasks) };
}
