import { loadJsonContent } from "@/lib/data/content";

export const LEARN_TYPES = [
  "grammar",
  "vocabulary",
  "kanji",
  "reading",
  "listening",
] as const;

export type LearnType = (typeof LEARN_TYPES)[number];

export type LearnItem = { id: number; [key: string]: unknown };

export type LearnContentDocument = {
  schema_version: number;
  id: string;
  study_day: number;
  target?: number;
  pool_size?: number;
  items: LearnItem[];
  [key: string]: unknown;
};

export type LearnContentResult =
  | { state: "available"; data: LearnContentDocument }
  | { state: "pending" };

export function parseLearnType(value: string): LearnType | null {
  return (LEARN_TYPES as readonly string[]).includes(value) ? (value as LearnType) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLearnDocument(
  value: unknown,
  type: LearnType,
  studyDay: number,
): value is LearnContentDocument {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;
  const expectedId = `${type}-day-${String(studyDay).padStart(3, "0")}`;
  if (
    value.schema_version !== 1 ||
    value.id !== expectedId ||
    value.study_day !== studyDay ||
    value.items.length < 1
  ) {
    return false;
  }

  const ids = value.items.map((item) => isRecord(item) ? item.id : null);
  return ids.every((id) => Number.isInteger(id) && (id as number) > 0) &&
    new Set(ids).size === ids.length;
}

export async function loadLearnContent(
  type: LearnType,
  studyDay: number,
): Promise<LearnContentResult> {
  const result = await loadJsonContent<unknown>(
    `${type}/day-${String(studyDay).padStart(3, "0")}.json`,
  );
  if (result.state === "pending") return result;
  if (!isLearnDocument(result.data, type, studyDay)) throw new Error("CONTENT_INVALID");
  return { state: "available", data: result.data };
}
