import { loadJsonContent } from "@/lib/data/content";
import type { TaskType } from "@/types";

import { PROGRAM_ID } from "../progress/program-constants";

export const TOTAL_STUDY_DAYS = 100;

const TASK_TYPES = new Set<TaskType>([
  "grammar",
  "grammar_test",
  "vocabulary",
  "kanji",
  "reading",
  "listening",
  "daily_test",
  "weekly_test",
  "monthly_test",
  "end_test",
  "mock_test",
]);

export type RoadmapState = "planned" | "pending";

export type RoadmapTask = {
  task_id: string;
  type: TaskType;
  label: string;
  required: boolean;
  order: number;
  resource_id: string;
};

export type RoadmapDay = {
  day: number;
  roadmap_state: RoadmapState;
  phase: string;
  title: string;
  tasks: RoadmapTask[];
};

export type ProgramRoadmap = {
  schema_version: number;
  program_id: string;
  title: string;
  total_days: number;
  days: RoadmapDay[];
};

export type NextTask = {
  task_type: TaskType;
  href: string;
  label: string;
};

export class RoadmapInvalidError extends Error {
  constructor() {
    super("CONTENT_INVALID");
    this.name = "RoadmapInvalidError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTaskType(value: unknown): value is TaskType {
  return typeof value === "string" && TASK_TYPES.has(value as TaskType);
}

function isRoadmapTask(value: unknown): value is RoadmapTask {
  if (!isRecord(value)) return false;
  return (
    typeof value.task_id === "string" &&
    isTaskType(value.type) &&
    typeof value.label === "string" &&
    typeof value.required === "boolean" &&
    Number.isInteger(value.order) &&
    (value.order as number) > 0 &&
    typeof value.resource_id === "string"
  );
}

function isRoadmapDay(value: unknown): value is RoadmapDay {
  if (!isRecord(value) || !Array.isArray(value.tasks)) return false;
  if (
    !Number.isInteger(value.day) ||
    value.roadmap_state !== "planned" && value.roadmap_state !== "pending" ||
    typeof value.phase !== "string" ||
    typeof value.title !== "string" ||
    !value.tasks.every(isRoadmapTask)
  ) {
    return false;
  }

  const orders = value.tasks.map((task) => task.order);
  const taskIds = value.tasks.map((task) => task.task_id);
  return new Set(orders).size === orders.length && new Set(taskIds).size === taskIds.length;
}

export function validateProgramRoadmap(value: unknown): value is ProgramRoadmap {
  if (!isRecord(value) || !Array.isArray(value.days)) return false;
  if (
    value.schema_version !== 1 ||
    value.program_id !== PROGRAM_ID ||
    typeof value.title !== "string" ||
    value.total_days !== TOTAL_STUDY_DAYS ||
    value.days.length !== TOTAL_STUDY_DAYS ||
    !value.days.every(isRoadmapDay)
  ) {
    return false;
  }

  const dayNumbers = value.days.map((day) => day.day);
  return dayNumbers.every((day, index) => day === index + 1);
}

export async function loadProgramRoadmap() {
  const result = await loadJsonContent<unknown>("roadmap/program.json");
  if (result.state === "pending") return result;
  if (!validateProgramRoadmap(result.data)) throw new RoadmapInvalidError();
  return { state: "available" as const, data: result.data };
}

export function parseStudyDay(value: string): number | null {
  if (!/^(?:[1-9]|[1-9]\d|100)$/.test(value)) return null;
  return Number(value);
}

export function getRoadmapDay(roadmap: ProgramRoadmap, studyDay: number): RoadmapDay {
  const day = roadmap.days[studyDay - 1];
  if (!day || day.day !== studyDay) throw new RoadmapInvalidError();
  return day;
}

function paddedDay(studyDay: number): string {
  return String(studyDay).padStart(3, "0");
}

export function getTaskContentPath(task: RoadmapTask, studyDay: number): string {
  const dayFile = `day-${paddedDay(studyDay)}.json`;
  switch (task.type) {
    case "grammar":
    case "vocabulary":
    case "kanji":
    case "reading":
    case "listening":
      return `${task.type}/${dayFile}`;
    case "grammar_test":
      return `tests/grammar/${dayFile}`;
    case "daily_test":
      return `tests/daily/${dayFile}`;
    case "weekly_test":
      return `tests/weekly/${dayFile}`;
    case "monthly_test":
      return `tests/monthly/${dayFile}`;
    case "end_test":
      return `tests/end/${dayFile}`;
    case "mock_test":
      return `tests/mock/${dayFile}`;
  }
}

export function getTaskHref(task: RoadmapTask, studyDay: number): string {
  switch (task.type) {
    case "grammar":
      return `/learn/grammar/day/${studyDay}`;
    case "vocabulary":
      return `/learn/vocabulary/day/${studyDay}/list`;
    case "kanji":
      return `/learn/kanji/day/${studyDay}/list`;
    case "reading":
      return `/learn/reading/day/${studyDay}`;
    case "listening":
      return `/learn/listening/day/${studyDay}`;
    case "grammar_test":
      return `/test/grammar/${task.resource_id}`;
    case "daily_test":
      return `/test/daily/${task.resource_id}`;
    case "weekly_test":
      return `/test/weekly/${task.resource_id}`;
    case "monthly_test":
      return `/test/monthly/${task.resource_id}`;
    case "end_test":
      return `/test/end/${task.resource_id}`;
    case "mock_test":
      return `/test/mock/${task.resource_id}`;
  }
}

function nextTaskLabel(task: RoadmapTask): string {
  if (task.type === "grammar_test" || task.type.endsWith("_test")) {
    return `Làm ${task.label}`;
  }
  return `Học ${task.label} tiếp`;
}

export function deriveNextTask(
  day: RoadmapDay,
  completedTaskId: string,
): NextTask | null {
  const completed = day.tasks.find((task) => task.task_id === completedTaskId);
  if (!completed) return null;

  const next = day.tasks
    .filter((task) => task.required && task.order > completed.order)
    .sort((left, right) => left.order - right.order)[0];
  if (!next) return null;

  return {
    task_type: next.type,
    href: getTaskHref(next, day.day),
    label: nextTaskLabel(next),
  };
}
