import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addCalendarDays,
  currentIsoDateInTimeZone,
  PROGRAM_TIME_ZONE,
} from "@/lib/progress/program-dates";
import { PROGRAM_ID } from "@/lib/progress/program-constants";
import { loadProgramRoadmap, type RoadmapTask } from "@/lib/roadmap/program-roadmap";
import { getScheduleDay } from "@/lib/schedule/schedule";
import type { CalendarStatus } from "@/types";

type CompletionRow = {
  study_day: number;
  task_type: string;
  task_id: string;
  completed_at: string;
};

export type CalendarDayEntry = {
  date: string;
  study_day: number;
  status: CalendarStatus;
};

export type CalendarResult =
  | { state: "available"; data: Record<string, unknown> }
  | { state: "program_not_configured" }
  | { state: "roadmap_pending" }
  | { state: "database_error" };

export function parseCalendarMonth(value: string | null): string | null {
  if (!value || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return null;
  return value;
}

export function completionDateInTimeZone(
  timestamp: string,
  timeZone = PROGRAM_TIME_ZONE,
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_COMPLETION_TIMESTAMP");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function deriveCalendarStatus(
  plannedDate: string,
  requiredTasks: RoadmapTask[],
  completions: CompletionRow[],
  today = currentIsoDateInTimeZone(),
): CalendarStatus {
  if (requiredTasks.length === 0) return null;
  const completionByTask = new Map(
    completions.map((completion) => [
      `${completion.task_type}:${completion.task_id}`,
      completion.completed_at,
    ]),
  );
  const timestamps = requiredTasks.map((task) =>
    completionByTask.get(`${task.type}:${task.task_id}`),
  );
  if (timestamps.every((timestamp): timestamp is string => typeof timestamp === "string")) {
    return timestamps.some((timestamp) => completionDateInTimeZone(timestamp) > plannedDate)
      ? "late_finished"
      : "finished";
  }
  return plannedDate < today ? "not_finished" : null;
}

async function loadCalendarBase(supabase: SupabaseClient, userId: string) {
  const [programQuery, roadmapResult, progressQuery] = await Promise.all([
    supabase
      .from("user_programs")
      .select("progress_start_date")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID)
      .maybeSingle(),
    loadProgramRoadmap(),
    supabase
      .from("task_progress")
      .select("study_day,task_type,task_id,completed_at")
      .eq("user_id", userId)
      .eq("program_id", PROGRAM_ID),
  ]);
  if (programQuery.error || progressQuery.error) return { state: "database_error" as const };
  if (!programQuery.data) return { state: "program_not_configured" as const };
  if (roadmapResult.state === "pending") return { state: "roadmap_pending" as const };
  return {
    state: "available" as const,
    progressStartDate: (programQuery.data as { progress_start_date: string }).progress_start_date,
    roadmap: roadmapResult.data,
    completions: (progressQuery.data ?? []) as CompletionRow[],
  };
}

export async function getCalendarMonth(
  supabase: SupabaseClient,
  userId: string,
  month: string,
  today = currentIsoDateInTimeZone(),
): Promise<CalendarResult> {
  const base = await loadCalendarBase(supabase, userId);
  if (base.state !== "available") return base;

  const days: CalendarDayEntry[] = base.roadmap.days.flatMap((day) => {
    const plannedDate = addCalendarDays(base.progressStartDate, day.day - 1);
    if (!plannedDate.startsWith(`${month}-`)) return [];
    return [{
      date: plannedDate,
      study_day: day.day,
      status: deriveCalendarStatus(
        plannedDate,
        day.tasks.filter((task) => task.required),
        base.completions.filter((completion) => completion.study_day === day.day),
        today,
      ),
    }];
  });
  return { state: "available", data: { month, days } };
}

export async function getCalendarDay(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  today = currentIsoDateInTimeZone(),
): Promise<CalendarResult> {
  const base = await loadCalendarBase(supabase, userId);
  if (base.state !== "available") return base;
  const day = base.roadmap.days[studyDay - 1];
  if (!day || day.day !== studyDay) throw new Error("CONTENT_INVALID");

  const schedule = await getScheduleDay(supabase, userId, studyDay);
  if (schedule.state !== "available") return schedule;
  const plannedDate = addCalendarDays(base.progressStartDate, studyDay - 1);
  return {
    state: "available",
    data: {
      date: plannedDate,
      study_day: studyDay,
      status: deriveCalendarStatus(
        plannedDate,
        day.tasks.filter((task) => task.required),
        base.completions.filter((completion) => completion.study_day === studyDay),
        today,
      ),
      title: day.title,
      phase: day.phase,
      tasks: schedule.data.tasks,
    },
  };
}
