import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateContentRoot } from "../../scripts/content-validation/validate-content.mjs";

describe("content validation foundation", () => {
  it("runs against the rolling-content directory without crashing", async () => {
    const result = await validateContentRoot(path.resolve(process.cwd(), "content"));
    expect(result.errors).toEqual([]);
  });

  it("enforces the canonical Grammar Test grouping", async () => {
    const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-grammar-test-"));

    try {
      const questions = Array.from({ length: 25 }, (_, index) => ({
        id: `q${String(index + 1).padStart(3, "0")}`,
        category: "grammar",
      }));
      const document = {
        schema_version: 1,
        id: "grammar-test-002",
        type: "grammar",
        study_day: 2,
        coverage: { from_day: 2, to_day: 2 },
        lesson_groups: Array.from({ length: 5 }, (_, index) => ({
          lesson: index + 6,
          question_ids: questions.slice(index * 5, index * 5 + 5).map(({ id }) => id),
        })),
        sections: [{ id: "grammar", max_score: 25, questions }],
      };

      await writeFile(path.join(contentRoot, "day-002.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toEqual([]);

      document.lesson_groups[0].question_ids.pop();
      await writeFile(path.join(contentRoot, "day-002.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toContain(
        "day-002.json: every grammar test lesson_group must contain 5 question_ids",
      );
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });

  it("accepts Vocabulary surface and legacy items but rejects an empty surface", async () => {
    const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-vocabulary-surface-"));
    const vocabulary = {
      schema_version: 1,
      id: "vocabulary-day-002",
      study_day: 2,
      target: 50,
      pool_size: 2,
      items: [
        { id: 201, surface: "スプーン", hiragana: "すぷーん", kanji: null },
        { id: 202, hiragana: "がっこう", kanji: "学校" },
      ],
    };

    try {
      await writeFile(path.join(contentRoot, "vocabulary.json"), JSON.stringify(vocabulary));
      expect((await validateContentRoot(contentRoot)).errors).toEqual([]);

      vocabulary.items[0].surface = "  ";
      await writeFile(path.join(contentRoot, "vocabulary.json"), JSON.stringify(vocabulary));
      expect((await validateContentRoot(contentRoot)).errors).toContain(
        "vocabulary.json: vocabulary item '201' surface must be a non-empty string",
      );
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });

  it("accepts every Reading v1.2 question type, legacy MCQ, and questions:null", async () => {
    const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-reading-types-"));
    const document = readingDocument([
      legacyMcq(),
      { ...legacyMcq("explicit"), question_type: "mcq" },
      {
        id: "tf",
        question_type: "true_false",
        question_jp: "正しいですか。",
        correct_answer: true,
      },
      {
        id: "short",
        question_type: "short_answer",
        question_jp: "何時ですか。",
        accepted_answers: ["7時", "七時"],
      },
      matchingQuestion(),
    ]);
    document.items.push({ id: 202, questions: null });

    try {
      await writeFile(path.join(contentRoot, "reading.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toEqual([]);
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });

  it.each([
    ["unsupported type", { ...legacyMcq(), question_type: "essay" }, "unsupported Reading question_type 'essay'"],
    ["unknown MCQ option", { ...legacyMcq(), correct_option_id: "Z" }, "correct_option_id must reference an option"],
    ["string true/false", { id: "q1", question_type: "true_false", question_jp: "?", correct_answer: "true" }, "correct_answer must be boolean"],
    ["empty accepted answers", { id: "q1", question_type: "short_answer", question_jp: "?", accepted_answers: [] }, "accepted_answers must be non-empty"],
    ["normalized duplicate answers", { id: "q1", question_type: "short_answer", question_jp: "?", accepted_answers: ["が", "か\u3099"] }, "accepted_answers must be unique after normalization"],
    ["unknown matching right", { ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "Z" }, { left_id: "L2", right_id: "R1" }] }, "correct_pairs must reference known IDs"],
    ["duplicate left mapping", { ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R1" }, { left_id: "L1", right_id: "R2" }] }, "cannot map a left item more than once"],
    ["duplicate right mapping", { ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R1" }, { left_id: "L2", right_id: "R1" }] }, "cannot reuse a right item"],
    ["missing left mapping", { ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R2" }] }, "must map every left item exactly once"],
  ])("rejects Reading content with %s", async (_label, question, expectedError) => {
    const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-reading-invalid-"));
    try {
      await writeFile(
        path.join(contentRoot, "reading.json"),
        JSON.stringify(readingDocument([question])),
      );
      expect((await validateContentRoot(contentRoot)).errors.some((error) =>
        error.includes(expectedError as string)
      )).toBe(true);
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });
});

function legacyMcq(id = "legacy") {
  return {
    id,
    question_jp: "何時ですか。",
    options: [{ id: "A", text: "7時" }, { id: "B", text: "8時" }],
    correct_option_id: "A",
  };
}

function matchingQuestion() {
  return {
    id: "matching",
    question_type: "matching",
    question_jp: "組み合わせてください。",
    left_items: [{ id: "L1", text: "田中" }, { id: "L2", text: "山田" }],
    right_items: [{ id: "R1", text: "本" }, { id: "R2", text: "かばん" }],
    correct_pairs: [{ left_id: "L1", right_id: "R2" }, { left_id: "L2", right_id: "R1" }],
  };
}

function readingDocument(questions: unknown[]): {
  schema_version: number;
  id: string;
  study_day: number;
  items: Array<{ id: number; questions: unknown[] | null }>;
} {
  return {
    schema_version: 1,
    id: "reading-day-002",
    study_day: 2,
    items: [{ id: 201, questions }],
  };
}
