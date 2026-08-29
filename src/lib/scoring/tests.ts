import type { SupabaseClient } from "@supabase/supabase-js";

import { loadJsonContent } from "@/lib/data/content";
import { PROGRAM_ID } from "@/lib/progress/program-constants";
import {
  deriveNextTask,
  getTaskContentPath,
  getTaskHref,
  loadProgramRoadmap,
  type ProgramRoadmap,
  type RoadmapDay,
  type RoadmapTask,
} from "@/lib/roadmap/program-roadmap";
import type { TaskType, TestType } from "@/types";

export const TEST_TYPES = ["grammar", "daily", "weekly", "monthly", "end", "mock"] as const;

type TestOption = { id: string; text: string };
type TestQuestion = {
  id: string;
  category: string;
  prompt: string;
  stimulus_id: string | null;
  options: TestOption[];
  correct_option_id: string;
  explanation_vi: string;
  [key: string]: unknown;
};
type TestSection = {
  id: string;
  title: string;
  max_score: number;
  questions: TestQuestion[];
  [key: string]: unknown;
};
export type TestDocument = {
  schema_version: number;
  id: string;
  type: TestType;
  title: string;
  study_day: number;
  coverage: { from_day: number; to_day: number };
  stimuli: unknown[];
  sections: TestSection[];
  [key: string]: unknown;
};

export type SubmittedAnswer = { question_id: string; option_id: string | null };

export type TestResultDto = {
  test_id: string;
  test_type: TestType;
  score: number | null;
  max_score: number | null;
  language_score: number | null;
  reading_score: number | null;
  listening_score: number | null;
  total_score: number | null;
};

export type TestReviewItem = {
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string;
  correct: boolean;
  explanation_vi: string;
};

export type TestLocation = { day: RoadmapDay; task: RoadmapTask };

export function parseTestType(value: string | null): TestType | null {
  return value && (TEST_TYPES as readonly string[]).includes(value) ? (value as TestType) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateQuestion(value: unknown): value is TestQuestion {
  if (!isRecord(value) || !Array.isArray(value.options)) return false;
  const optionIds = value.options.map((option) => isRecord(option) ? option.id : null);
  return (
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.prompt === "string" &&
    (value.stimulus_id === null || typeof value.stimulus_id === "string") &&
    value.options.length >= 2 &&
    optionIds.every((id) => typeof id === "string") &&
    new Set(optionIds).size === optionIds.length &&
    typeof value.correct_option_id === "string" &&
    optionIds.includes(value.correct_option_id) &&
    typeof value.explanation_vi === "string"
  );
}

function validateTestDocument(
  value: unknown,
  task: RoadmapTask,
  studyDay: number,
): value is TestDocument {
  if (!isRecord(value) || !isRecord(value.coverage) || !Array.isArray(value.sections)) return false;
  if (
    value.schema_version !== 1 ||
    value.id !== task.resource_id ||
    value.study_day !== studyDay ||
    typeof value.type !== "string" ||
    !parseTestType(value.type) ||
    typeof value.title !== "string" ||
    !Array.isArray(value.stimuli) ||
    value.sections.length < 1
  ) {
    return false;
  }
  const documentType = parseTestType(value.type as string);
  if (!documentType || testTypeToTaskType(documentType) !== task.type) return false;
  if (
    !Number.isInteger(value.coverage.from_day) ||
    !Number.isInteger(value.coverage.to_day)
  ) {
    return false;
  }

  const questionIds: string[] = [];
  for (const section of value.sections) {
    if (
      !isRecord(section) ||
      typeof section.id !== "string" ||
      typeof section.title !== "string" ||
      !Number.isInteger(section.max_score) ||
      (section.max_score as number) < 1 ||
      !Array.isArray(section.questions) ||
      section.questions.length < 1 ||
      !section.questions.every(validateQuestion)
    ) {
      return false;
    }
    questionIds.push(...section.questions.map((question) => (question as TestQuestion).id));
  }
  if (new Set(questionIds).size !== questionIds.length) return false;

  const sections = value.sections as TestSection[];
  if (documentType === "grammar") {
    return (
      value.coverage.from_day === studyDay &&
      value.coverage.to_day === studyDay &&
      sections.length === 1 &&
      sections[0].id === "grammar" &&
      sections[0].max_score === 25 &&
      sections[0].questions.length === 25 &&
      sections[0].questions.every((question) => question.category === "grammar")
    );
  }
  if (documentType === "daily") {
    const expected = ["grammar", "vocabulary", "kanji"];
    return (
      value.coverage.from_day === studyDay - 1 &&
      value.coverage.to_day === studyDay - 1 &&
      sections.length === 3 &&
      sections.every(
        (section, index) =>
          section.id === expected[index] &&
          section.max_score === 15 &&
          section.questions.length === 15 &&
          section.questions.every((question) => question.category === expected[index]),
      )
    );
  }

  const expectedScaled = ["language", "reading", "listening"];
  return sections.length === 3 && sections.every(
    (section, index) => section.id === expectedScaled[index] && section.max_score === 60,
  );
}

export function testTypeToTaskType(type: TestType): TaskType {
  return type === "grammar" ? "grammar_test" : `${type}_test` as TaskType;
}

export function taskTypeToTestType(type: TaskType): TestType | null {
  if (type === "grammar_test") return "grammar";
  const candidate = type.endsWith("_test") ? type.slice(0, -5) : "";
  return parseTestType(candidate);
}

export function findTestLocation(roadmap: ProgramRoadmap, testId: string): TestLocation | null {
  for (const day of roadmap.days) {
    const task = day.tasks.find(
      (candidate) => candidate.resource_id === testId && candidate.type.endsWith("_test"),
    );
    if (task) return { day, task };
  }
  return null;
}

export async function loadTestContent(location: TestLocation) {
  const result = await loadJsonContent<unknown>(
    getTaskContentPath(location.task, location.day.day),
  );
  if (result.state === "pending") return result;
  if (!validateTestDocument(result.data, location.task, location.day.day)) {
    throw new Error("TEST_INVALID");
  }
  return { state: "available" as const, data: result.data };
}

export function sanitizeTestContent(document: TestDocument): Record<string, unknown> {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => {
        const sanitized: Partial<TestQuestion> = { ...question };
        delete sanitized.correct_option_id;
        delete sanitized.explanation_vi;
        return sanitized;
      }),
    })),
  };
}

export function validateSubmittedAnswers(
  document: TestDocument,
  value: unknown,
): SubmittedAnswer[] | null {
  if (!Array.isArray(value)) return null;
  const questions = document.sections.flatMap((section) => section.questions);
  if (value.length !== questions.length) return null;

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const answers: SubmittedAnswer[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.question_id !== "string") return null;
    if (entry.option_id !== null && typeof entry.option_id !== "string") return null;
    const question = questionById.get(entry.question_id);
    if (!question) return null;
    if (
      typeof entry.option_id === "string" &&
      !question.options.some((option) => option.id === entry.option_id)
    ) {
      return null;
    }
    answers.push({ question_id: entry.question_id, option_id: entry.option_id as string | null });
  }
  return new Set(answers.map(({ question_id }) => question_id)).size === questions.length
    ? answers
    : null;
}

export function scoreTest(
  document: TestDocument,
  answers: SubmittedAnswer[],
): { result: TestResultDto; review: TestReviewItem[] } {
  const selected = new Map(answers.map((answer) => [answer.question_id, answer.option_id]));
  const review = document.sections.flatMap((section) =>
    section.questions.map((question) => {
      const selectedOption = selected.get(question.id) ?? null;
      return {
        question_id: question.id,
        selected_option_id: selectedOption,
        correct_option_id: question.correct_option_id,
        correct: selectedOption === question.correct_option_id,
        explanation_vi: question.explanation_vi,
      };
    }),
  );

  if (document.type === "grammar" || document.type === "daily") {
    return {
      result: {
        test_id: document.id,
        test_type: document.type,
        score: review.filter(({ correct }) => correct).length,
        max_score: document.sections.reduce((sum, section) => sum + section.max_score, 0),
        language_score: null,
        reading_score: null,
        listening_score: null,
        total_score: null,
      },
      review,
    };
  }

  const sectionScores = Object.fromEntries(
    document.sections.map((section) => {
      const correct = section.questions.filter(
        (question) => selected.get(question.id) === question.correct_option_id,
      ).length;
      return [section.id, Math.round(correct / section.questions.length * section.max_score)];
    }),
  );
  const languageScore = sectionScores.language ?? 0;
  const readingScore = sectionScores.reading ?? 0;
  const listeningScore = sectionScores.listening ?? 0;
  return {
    result: {
      test_id: document.id,
      test_type: document.type,
      score: null,
      max_score: null,
      language_score: languageScore,
      reading_score: readingScore,
      listening_score: listeningScore,
      total_score: languageScore + readingScore + listeningScore,
    },
    review,
  };
}

const RESULT_COLUMNS = "test_id,test_type,completed_at,score,max_score,language_score,reading_score,listening_score,total_score";

export async function getLatestTestResult(
  supabase: SupabaseClient,
  userId: string,
  testId: string,
) {
  return supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("test_id", testId)
    .maybeSingle();
}

export async function submitTestResult(
  supabase: SupabaseClient,
  studyDay: number,
  task: RoadmapTask,
  result: TestResultDto,
) {
  return supabase.rpc("record_test_submission", {
    p_program_id: PROGRAM_ID,
    p_study_day: studyDay,
    p_test_id: result.test_id,
    p_test_type: result.test_type,
    p_task_type: task.type,
    p_task_id: task.task_id,
    p_score: result.score,
    p_max_score: result.max_score,
    p_language_score: result.language_score,
    p_reading_score: result.reading_score,
    p_listening_score: result.listening_score,
    p_total_score: result.total_score,
  }).single();
}

export async function getTestList(
  supabase: SupabaseClient,
  userId: string,
  type: TestType,
) {
  const roadmapResult = await loadProgramRoadmap();
  if (roadmapResult.state === "pending") return { state: "roadmap_pending" as const };
  const taskType = testTypeToTaskType(type);
  const locations = roadmapResult.data.days.flatMap((day) =>
    day.tasks
      .filter((task) => task.type === taskType)
      .map((task) => ({ day, task })),
  );
  const { data: results, error } = await supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .eq("test_type", type);
  if (error) return { state: "database_error" as const };
  const resultById = new Map(
    (results ?? []).map((result) => [(result as { test_id: string }).test_id, result]),
  );

  const tests = await Promise.all(locations.map(async (location) => {
    const content = await loadTestContent(location);
    return {
      test_id: location.task.resource_id,
      test_type: type,
      study_day: location.day.day,
      label: location.task.label,
      content_state: content.state,
      title: content.state === "available" ? content.data.title : null,
      coverage: content.state === "available" ? content.data.coverage : null,
      latest_result: resultById.get(location.task.resource_id) ?? null,
      href: getTaskHref(location.task, location.day.day),
    };
  }));
  return { state: "available" as const, data: { type, tests } };
}

export async function getTestContext(testId: string) {
  const roadmapResult = await loadProgramRoadmap();
  if (roadmapResult.state === "pending") return { state: "roadmap_pending" as const };
  const location = findTestLocation(roadmapResult.data, testId);
  if (!location) return { state: "not_found" as const };
  const content = await loadTestContent(location);
  return { state: "available" as const, roadmap: roadmapResult.data, location, content };
}

export function nextTaskAfterTest(location: TestLocation) {
  return deriveNextTask(location.day, location.task.task_id);
}
