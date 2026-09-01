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

export type ReadingMedia = {
  id: string;
  type: "image";
  src: string;
  alt?: string;
};

export type ReadingQuestionOption = {
  id: string;
  text?: string;
  image_src?: string;
};

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasUniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function isVocabularyItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.hiragana) &&
    (value.kanji === null || isNonEmptyString(value.kanji)) &&
    (!Object.hasOwn(value, "surface") || isNonEmptyString(value.surface));
}

function isNonEmptyStringArrayField(value: Record<string, unknown>, field: string): boolean {
  return !Object.hasOwn(value, field) ||
    (Array.isArray(value[field]) && value[field].every(isNonEmptyString));
}

function isKanjiCompound(value: unknown): boolean {
  return isRecord(value) &&
    isNonEmptyString(value.word) &&
    isNonEmptyString(value.reading) &&
    isNonEmptyString(value.meaning_vi);
}

function isKanjiExample(value: unknown): boolean {
  return isRecord(value) &&
    isNonEmptyString(value.jp) &&
    isNonEmptyString(value.reading) &&
    isNonEmptyString(value.vi);
}

function isKanjiItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (
    !Number.isInteger(value.id) ||
    (value.id as number) < 1 ||
    !isNonEmptyString(value.kanji) ||
    !isNonEmptyString(value.han_viet) ||
    !isNonEmptyString(value.meaning_vi) ||
    !isNonEmptyStringArrayField(value, "onyomi") ||
    !isNonEmptyStringArrayField(value, "kunyomi") ||
    !isNonEmptyStringArrayField(value, "notes_vi") ||
    (Object.hasOwn(value, "source_ref") && !isNonEmptyString(value.source_ref))
  ) {
    return false;
  }

  if (Object.hasOwn(value, "compounds") &&
      (!Array.isArray(value.compounds) || !value.compounds.every(isKanjiCompound))) {
    return false;
  }
  if (Object.hasOwn(value, "examples") &&
      (!Array.isArray(value.examples) || !value.examples.every(isKanjiExample))) {
    return false;
  }
  return true;
}

const READING_ASSET_ROOT = "/reading/assets/";
const READING_ASSET_EXTENSION = /\.(?:png|jpe?g|webp)$/;

function isReadingAssetPath(value: unknown): value is string {
  if (!isNonEmptyString(value) || !value.startsWith(READING_ASSET_ROOT)) return false;
  if (value.includes("\\") || value.includes("?") || value.includes("#")) return false;

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (decodedValue.includes("..") || decodedValue.includes("\\") ||
      decodedValue.includes("?") || decodedValue.includes("#")) {
    return false;
  }

  const relativePath = decodedValue.slice(READING_ASSET_ROOT.length);
  const segments = relativePath.split("/");
  return segments.length > 0 &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..") &&
    READING_ASSET_EXTENSION.test(value);
}

function isReadingMedia(value: unknown): value is ReadingMedia {
  if (!isRecord(value)) return false;
  const allowedFields = new Set(["id", "type", "src", "alt"]);
  return Object.keys(value).every((field) => allowedFields.has(field)) &&
    isNonEmptyString(value.id) &&
    value.type === "image" &&
    isReadingAssetPath(value.src) &&
    (!Object.hasOwn(value, "alt") || isNonEmptyString(value.alt));
}

function isQuestionOption(value: unknown): value is ReadingQuestionOption {
  if (!isRecord(value) || !isNonEmptyString(value.id)) return false;
  const hasText = Object.hasOwn(value, "text");
  const hasImage = Object.hasOwn(value, "image_src");
  return (hasText || hasImage) &&
    (!hasText || isNonEmptyString(value.text)) &&
    (!hasImage || isReadingAssetPath(value.image_src));
}

function isReadingQuestion(value: unknown): boolean {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.question_jp)) {
    return false;
  }

  const questionType = value.question_type ?? "mcq";
  if (questionType === "mcq") {
    if (!Array.isArray(value.options) || value.options.length === 0 || !value.options.every(isQuestionOption)) {
      return false;
    }
    const optionIds = value.options.map((option) => option.id);
    return hasUniqueStrings(optionIds) &&
      isNonEmptyString(value.correct_option_id) &&
      optionIds.includes(value.correct_option_id);
  }

  if (questionType === "true_false") return typeof value.correct_answer === "boolean";

  if (questionType === "short_answer") {
    if (!Array.isArray(value.accepted_answers) || value.accepted_answers.length === 0) return false;
    if (!value.accepted_answers.every(isNonEmptyString)) return false;
    const normalized = value.accepted_answers.map((answer) => answer.normalize("NFC").trim());
    return hasUniqueStrings(normalized);
  }

  if (questionType !== "matching") return false;
  if (
    !Array.isArray(value.left_items) || value.left_items.length === 0 ||
    !Array.isArray(value.right_items) || value.right_items.length === 0 ||
    !value.left_items.every(isQuestionOption) || !value.right_items.every(isQuestionOption) ||
    !Array.isArray(value.correct_pairs)
  ) {
    return false;
  }
  const leftIds = value.left_items.map((item) => item.id);
  const rightIds = value.right_items.map((item) => item.id);
  if (!hasUniqueStrings(leftIds) || !hasUniqueStrings(rightIds)) return false;
  if (!value.correct_pairs.every((pair) =>
    isRecord(pair) && isNonEmptyString(pair.left_id) && isNonEmptyString(pair.right_id) &&
    leftIds.includes(pair.left_id) && rightIds.includes(pair.right_id)
  )) {
    return false;
  }
  const pairLeftIds = value.correct_pairs.map((pair) => (pair as { left_id: string }).left_id);
  const pairRightIds = value.correct_pairs.map((pair) => (pair as { right_id: string }).right_id);
  return pairLeftIds.length === leftIds.length &&
    hasUniqueStrings(pairLeftIds) && hasUniqueStrings(pairRightIds) &&
    leftIds.every((leftId) => pairLeftIds.includes(leftId));
}

function isReadingItem(value: unknown): boolean {
  if (!isRecord(value) || !isNonEmptyString(value.title)) {
    return false;
  }

  const hasPassage = isNonEmptyString(value.passage_jp);
  if (Object.hasOwn(value, "passage_jp") && value.passage_jp !== null && !hasPassage) return false;

  if (Object.hasOwn(value, "media") &&
      (!Array.isArray(value.media) || !value.media.every(isReadingMedia))) {
    return false;
  }
  const media = Array.isArray(value.media) ? value.media : [];
  if (!hasPassage && media.length === 0) return false;
  const mediaIds = media.map((item) => (item as ReadingMedia).id);
  if (!hasUniqueStrings(mediaIds)) return false;

  if (Object.hasOwn(value, "translation_vi") && value.translation_vi !== null &&
      (!hasPassage || !isNonEmptyString(value.translation_vi))) {
    return false;
  }

  if (!Object.hasOwn(value, "questions") || value.questions === null) return true;
  if (!Array.isArray(value.questions) || !value.questions.every(isReadingQuestion)) return false;
  const questionIds = value.questions.map((question) => (question as { id: string }).id);
  return hasUniqueStrings(questionIds);
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
  if (!ids.every((id) => Number.isInteger(id) && (id as number) > 0) ||
    new Set(ids).size !== ids.length) {
    return false;
  }
  if (type === "vocabulary" && !value.items.every(isVocabularyItem)) return false;
  if (type === "kanji" && !value.items.every(isKanjiItem)) return false;
  if (type === "reading" && !value.items.every(isReadingItem)) return false;
  return true;
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
