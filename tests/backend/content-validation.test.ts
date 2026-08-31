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

  it.each([
    ["canonical fields", kanjiItem()],
    ["valid optional fields", kanjiItem({
      onyomi: [],
      kunyomi: [],
      compounds: [{ word: "学校", reading: "がっこう", meaning_vi: "trường học" }],
      examples: [{ jp: "学校です。", reading: "がっこうです。", vi: "Là trường học." }],
      notes_vi: [],
      source_ref: "Assigned source",
    })],
    ["legacy quota fields", kanjiItem({ target: 30, pool_size: 999 })],
  ])("accepts Kanji with %s", async (_label, item) => {
    const errors = await validateTemporaryDocument({
      schema_version: 1,
      id: "kanji-day-002",
      study_day: 2,
      items: [item],
    }, "n3-kanji-valid-");
    expect(errors).toEqual([]);
  });

  it.each([
    ["duplicate IDs", [kanjiItem(), kanjiItem()], "duplicate item id"],
    ["non-positive ID", [kanjiItem({ id: 0 })], "id must be a positive integer"],
    ["non-integer ID", [kanjiItem({ id: 201.5 })], "id must be a positive integer"],
    ["missing kanji", [kanjiItem({ kanji: undefined })], "kanji must be a non-empty string"],
    ["empty kanji", [kanjiItem({ kanji: "" })], "kanji must be a non-empty string"],
    ["missing han_viet", [kanjiItem({ han_viet: undefined })], "han_viet must be a non-empty string"],
    ["empty han_viet", [kanjiItem({ han_viet: "" })], "han_viet must be a non-empty string"],
    ["missing meaning_vi", [kanjiItem({ meaning_vi: undefined })], "meaning_vi must be a non-empty string"],
    ["empty meaning_vi", [kanjiItem({ meaning_vi: "" })], "meaning_vi must be a non-empty string"],
    ["malformed onyomi", [kanjiItem({ onyomi: ["", 1] })], "onyomi must be an array of non-empty strings"],
    ["malformed kunyomi", [kanjiItem({ kunyomi: "まなぶ" })], "kunyomi must be an array of non-empty strings"],
    ["malformed compound", [kanjiItem({ compounds: [{ word: "学校" }] })], "compound 0 requires"],
    ["malformed example", [kanjiItem({ examples: [{ jp: "学校です。" }] })], "example 0 requires"],
    ["malformed notes_vi", [kanjiItem({ notes_vi: ["", 1] })], "notes_vi must be an array of non-empty strings"],
    ["empty source_ref", [kanjiItem({ source_ref: "  " })], "source_ref must be a non-empty string"],
  ])("rejects Kanji with %s", async (_label, items, expectedError) => {
    const errors = await validateTemporaryDocument({
      schema_version: 1,
      id: "kanji-day-002",
      study_day: 2,
      items,
    }, "n3-kanji-invalid-");
    expect(errors.some((error) => error.includes(expectedError as string))).toBe(true);
  });

  it.each([
    ["missing target", { pool_size: 1 }],
    ["wrong target", { target: 30, pool_size: 1 }],
    ["missing pool_size", { target: 50 }],
    ["wrong pool_size", { target: 50, pool_size: 2 }],
  ])("keeps Vocabulary quota validation for %s", async (_label, metadata) => {
    const errors = await validateTemporaryDocument({
      schema_version: 1,
      id: "vocabulary-day-002",
      study_day: 2,
      ...metadata,
      items: [{ id: 201, hiragana: "がっこう", kanji: "学校" }],
    }, "n3-vocabulary-quota-");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects Vocabulary pools larger than 100", async () => {
    const errors = await validateTemporaryDocument({
      schema_version: 1,
      id: "vocabulary-day-002",
      study_day: 2,
      target: 50,
      pool_size: 101,
      items: Array.from({ length: 101 }, (_, index) => ({
        id: index + 1,
        hiragana: "がっこう",
        kanji: "学校",
      })),
    }, "n3-vocabulary-large-");
    expect(errors.some((error) => error.includes("vocabulary pool cannot exceed 100 items"))).toBe(true);
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

async function validateTemporaryDocument(document: unknown, prefix: string): Promise<string[]> {
  const contentRoot = await mkdtemp(path.join(tmpdir(), prefix));
  try {
    await writeFile(path.join(contentRoot, "content.json"), JSON.stringify(document));
    return (await validateContentRoot(contentRoot)).errors;
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
  }
}

function kanjiItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    kanji: "学",
    han_viet: "HỌC",
    meaning_vi: "học",
    ...overrides,
  };
}

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
