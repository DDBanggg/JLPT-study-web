import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addCalendarDays,
  currentIsoDateInTimeZone,
  PROGRAM_TIME_ZONE,
} from "@/lib/progress/program-dates";
import { PROGRAM_ID } from "@/lib/progress/program-constants";
import {
  loadProgramRoadmap,
  TOTAL_STUDY_DAYS,
  type RoadmapState,
  type RoadmapTask,
} from "@/lib/roadmap/program-roadmap";
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
  roadmap_state: RoadmapState;
  status: CalendarStatus;
};

export type CalendarResult =
  | { state: "available"; data: Record<string, unknown> }
  | { state: "program_not_configured" }
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
  return {
    state: "available" as const,
    progressStartDate: (programQuery.data as { progress_start_date: string }).progress_start_date,
    roadmap: roadmapResult.state === "available" ? roadmapResult.data : null,
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

  const roadmapDays = base.roadmap?.days ?? Array.from(
    { length: TOTAL_STUDY_DAYS },
    (_, index) => ({
      day: index + 1,
      roadmap_state: "pending" as const,
      tasks: [] as RoadmapTask[],
    }),
  );
  const days: CalendarDayEntry[] = roadmapDays.flatMap((day) => {
    const plannedDate = addCalendarDays(base.progressStartDate, day.day - 1);
    if (!plannedDate.startsWith(`${month}-`)) return [];
    return [{
      date: plannedDate,
      study_day: day.day,
      roadmap_state: day.roadmap_state,
      status: day.roadmap_state === "pending"
        ? null
        : deriveCalendarStatus(
          plannedDate,
          day.tasks.filter((task) => task.required),
          base.completions.filter((completion) => completion.study_day === day.day),
          today,
        ),
    }];
  });
  return {
    state: "available",
    data: {
      month,
      roadmap_state: days.some((day) => day.roadmap_state === "pending")
        ? "pending"
        : "planned",
      days,
    },
  };
}

export async function getCalendarDay(
  supabase: SupabaseClient,
  userId: string,
  studyDay: number,
  today = currentIsoDateInTimeZone(),
): Promise<CalendarResult> {
  const base = await loadCalendarBase(supabase, userId);
  if (base.state !== "available") return base;
  const plannedDate = addCalendarDays(base.progressStartDate, studyDay - 1);
  if (base.roadmap === null) {
    return {
      state: "available",
      data: {
        date: plannedDate,
        study_day: studyDay,
        roadmap_state: "pending",
        status: null,
        title: null,
        phase: null,
        tasks: [],
        next_task: null,
      },
    };
  }
  const day = base.roadmap.days[studyDay - 1];
  if (!day || day.day !== studyDay) throw new Error("CONTENT_INVALID");

  if (day.roadmap_state === "pending") {
    return {
      state: "available",
      data: {
        date: plannedDate,
        study_day: studyDay,
        roadmap_state: "pending",
        status: null,
        title: day.title,
        phase: day.phase,
        tasks: [],
        next_task: null,
      },
    };
  }

  const schedule = await getScheduleDay(supabase, userId, studyDay);
  if (schedule.state !== "available") return schedule;
  return {
    state: "available",
    data: {
      date: plannedDate,
      study_day: studyDay,
      roadmap_state: day.roadmap_state,
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
