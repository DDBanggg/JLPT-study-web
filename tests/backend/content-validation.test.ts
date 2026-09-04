import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

  it.each([
    [2, [20, 25], ["grammar", "vocabulary"]],
    [3, [15, 15, 15], ["grammar", "vocabulary", "kanji"]],
  ])("accepts the canonical Daily Test distribution for Day %i", async (day, counts, categories) => {
    const document = dailyTestDocument(day as number);
    const errors = await validateTemporaryDailyDocument(document);
    expect(errors).toEqual([]);
    expect(document.coverage).toEqual({ from_day: (day as number) - 1, to_day: (day as number) - 1 });
    expect(document.sections.map((section) => section.questions.length)).toEqual(counts);
    expect(document.sections.map((section) => section.max_score)).toEqual(counts);
    expect(document.sections.map((section) => section.id)).toEqual(categories);
    expect(document.sections.flatMap((section) => section.questions)).toHaveLength(45);
  });

  it.each([
    ["Day 2 with Kanji", () => {
      const document = dailyTestDocument(2);
      document.sections.push(dailySection("kanji", 15, 46, 1));
      return document;
    }, "must contain exactly 2 sections"],
    ["Day 2 with 15/15 only", () => {
      const document = dailyTestDocument(2);
      document.sections.forEach((section) => {
        section.max_score = 15;
        section.questions = section.questions.slice(0, 15);
      });
      return document;
    }, "grammar section max_score must equal 20"],
    ["standard day with wrong distribution", () => {
      const document = dailyTestDocument(3);
      document.sections[0].max_score = 16;
      return document;
    }, "grammar section max_score must equal 15"],
    ["wrong coverage day", () => {
      const document = dailyTestDocument(3);
      document.coverage = { from_day: 3, to_day: 3 };
      return document;
    }, "coverage must equal Study Day 2"],
    ["wrong category count", () => {
      const document = dailyTestDocument(3);
      document.sections[0].questions[0].category = "vocabulary";
      return document;
    }, "category must equal 'grammar'"],
    ["source_item_ref from the wrong Study Day", () => {
      const document = dailyTestDocument(3);
      document.sections[0].questions[0].source_item_refs = ["grammar:301"];
      return document;
    }, "must resolve to grammar Study Day 2"],
  ])("rejects Daily Test with %s", async (_label, createDocument, expectedError) => {
    const errors = await validateTemporaryDailyDocument(createDocument());
    expect(errors.some((error) => error.includes(expectedError as string))).toBe(true);
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

  it("accepts every Reading v1.4 question type, legacy MCQ, and questions:null", async () => {
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
    document.items.push({ id: 202, passage_jp: "本文です。", questions: null });

    try {
      await writeFile(path.join(contentRoot, "reading.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toEqual([]);
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });

  it.each([
    ["legacy passage-only", readingItem({ translation_vi: undefined }), []],
    ["text with translation", readingItem({ translation_vi: "Đây là nội dung." }), []],
    [
      "visual-only",
      readingItem({
        passage_jp: undefined,
        media: [readingMedia("visual", "/reading/assets/visual.webp")],
      }),
      ["/reading/assets/visual.webp"],
    ],
    [
      "mixed",
      readingItem({
        translation_vi: "Hãy xem sơ đồ.",
        media: [readingMedia("diagram", "/reading/assets/diagrams/map.jpeg", "Sơ đồ")],
      }),
      ["/reading/assets/diagrams/map.jpeg"],
    ],
    [
      "image MCQ",
      readingItem({ questions: [imageMcq()] }),
      ["/reading/assets/options/a.png", "/reading/assets/options/b.jpg"],
    ],
    [
      "image matching",
      readingItem({ questions: [imageMatchingQuestion()] }),
      ["/reading/assets/people/tanaka.png", "/reading/assets/objects/bag.webp"],
    ],
  ])("accepts Reading v1.4 %s content", async (_label, item, assets) => {
    const errors = await validateTemporaryReadingItems([item], assets as string[]);
    expect(errors).toEqual([]);
  });

  it("rejects Reading without a passage or media stimulus", async () => {
    const errors = await validateTemporaryReadingItems([
      readingItem({ passage_jp: undefined }),
    ]);
    expect(errors.some((error) => error.includes("requires non-empty passage_jp or media"))).toBe(true);
  });

  it("rejects Reading translation without a passage", async () => {
    const asset = "/reading/assets/visual.png";
    const errors = await validateTemporaryReadingItems([
      readingItem({
        passage_jp: undefined,
        translation_vi: "Bản dịch không có đoạn văn.",
        media: [readingMedia("visual", asset)],
      }),
    ], [asset]);
    expect(errors.some((error) => error.includes("translation_vi requires passage_jp"))).toBe(true);
  });

  it("rejects an empty Reading translation", async () => {
    const errors = await validateTemporaryReadingItems([
      readingItem({ translation_vi: "  " }),
    ]);
    expect(errors.some((error) => error.includes("translation_vi must be non-empty"))).toBe(true);
  });

  it("rejects duplicate Reading media IDs", async () => {
    const asset = "/reading/assets/duplicate.png";
    const errors = await validateTemporaryReadingItems([
      readingItem({
        passage_jp: undefined,
        media: [readingMedia("same", asset), readingMedia("same", asset)],
      }),
    ], [asset]);
    expect(errors.some((error) => error.includes("media IDs must be unique"))).toBe(true);
  });

  it.each([
    ["non-array media", "image", "media must be an array"],
    ["empty media id", [{ ...readingMedia(), id: " " }], "id must be non-empty"],
    ["unsupported media type", [{ ...readingMedia(), type: "video" }], "type must equal 'image'"],
    ["empty media alt", [{ ...readingMedia(), alt: " " }], "alt must be non-empty"],
    ["unsupported media fields", [{ ...readingMedia(), width: 640 }], "contains unsupported fields"],
  ])("rejects Reading %s", async (_label, media, expectedError) => {
    const errors = await validateTemporaryReadingItems([
      readingItem({ media }),
    ], ["/reading/assets/image.png"]);
    expect(errors.some((error) => error.includes(expectedError as string))).toBe(true);
  });

  it.each([
    ["path outside the root", "/images/option.png"],
    ["remote URL", "https://example.com/option.png"],
    ["parent traversal", "/reading/assets/../option.png"],
    ["backslash traversal", "/reading/assets/..\\option.png"],
  ])("rejects Reading asset %s", async (_label, src) => {
    const errors = await validateTemporaryReadingItems([
      readingItem({ passage_jp: undefined, media: [readingMedia("invalid", src)] }),
    ]);
    expect(errors.some((error) => error.includes("must be a valid Reading asset path"))).toBe(true);
  });

  it("rejects a valid Reading asset path when its file is missing", async () => {
    const missingAsset = "/reading/assets/missing.png";
    const errors = await validateTemporaryReadingItems([
      readingItem({ passage_jp: undefined, media: [readingMedia("missing", missingAsset)] }),
    ]);
    expect(errors).toContain(
      `reading.json: Reading asset '${missingAsset}' does not exist under publicRoot`,
    );
  });

  it("rejects a Reading option with neither text nor image", async () => {
    const errors = await validateTemporaryReadingItems([
      readingItem({
        questions: [{ ...legacyMcq(), options: [{ id: "A" }] }],
      }),
    ]);
    expect(errors.some((error) => error.includes("requires text or image_src"))).toBe(true);
  });

  it.each([
    ["empty text", { id: "A", text: " " }, "text must be non-empty"],
    ["invalid image path", { id: "A", image_src: "/outside/answer.png" }, "valid Reading asset path"],
  ])("rejects a Reading option with %s", async (_label, option, expectedError) => {
    const errors = await validateTemporaryReadingItems([
      readingItem({ questions: [{ ...legacyMcq(), options: [option] }] }),
    ]);
    expect(errors.some((error) => error.includes(expectedError as string))).toBe(true);
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

async function validateTemporaryDailyDocument(document: ReturnType<typeof dailyTestDocument>) {
  const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-daily-test-"));
  try {
    await writeFile(path.join(contentRoot, "daily.json"), JSON.stringify(document));
    for (const day of [1, 2, 3]) {
      const dayText = String(day).padStart(3, "0");
      await writeFile(path.join(contentRoot, `grammar-${dayText}.json`), JSON.stringify({
        schema_version: 1,
        id: `grammar-day-${dayText}`,
        study_day: day,
        items: [{ id: day * 100 + 1 }],
      }));
      await writeFile(path.join(contentRoot, `vocabulary-${dayText}.json`), JSON.stringify({
        schema_version: 1,
        id: `vocabulary-day-${dayText}`,
        study_day: day,
        target: 50,
        pool_size: 1,
        items: [{ id: day * 100 + 11, hiragana: "ことば", kanji: null }],
      }));
      await writeFile(path.join(contentRoot, `kanji-${dayText}.json`), JSON.stringify({
        schema_version: 1,
        id: `kanji-day-${dayText}`,
        study_day: day,
        items: [{ id: day * 100 + 21, kanji: "日", han_viet: "nhật", meaning_vi: "ngày" }],
      }));
    }
    return (await validateContentRoot(contentRoot)).errors;
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
  }
}

function dailySection(category: string, count: number, firstQuestion: number, coveredDay: number) {
  const sourceOffset = category === "grammar" ? 1 : category === "vocabulary" ? 11 : 21;
  return {
    id: category,
    title: category,
    max_score: count,
    questions: Array.from({ length: count }, (_, index) => ({
      id: `q${String(firstQuestion + index).padStart(3, "0")}`,
      category,
      prompt: "問題です。",
      stimulus_id: null,
      options: ["A", "B", "C", "D"].map((id) => ({ id, text: id })),
      correct_option_id: "A",
      source_item_refs: [`${category}:${coveredDay * 100 + sourceOffset}`],
    })),
  };
}

function dailyTestDocument(day: number) {
  const coveredDay = day - 1;
  const definitions = day === 2
    ? [["grammar", 20], ["vocabulary", 25]] as const
    : [["grammar", 15], ["vocabulary", 15], ["kanji", 15]] as const;
  let firstQuestion = 1;
  const sections = definitions.map(([category, count]) => {
    const section = dailySection(category, count, firstQuestion, coveredDay);
    firstQuestion += count;
    return section;
  });
  return {
    schema_version: 1,
    id: `daily-${String(day).padStart(3, "0")}`,
    type: "daily",
    title: `Daily Test — Day ${day}`,
    study_day: day,
    coverage: { from_day: coveredDay, to_day: coveredDay },
    stimuli: [],
    sections,
  };
}

async function validateTemporaryReadingItems(
  items: unknown[],
  assetPaths: string[] = [],
): Promise<string[]> {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "n3-reading-v1-4-"));
  const contentRoot = path.join(temporaryRoot, "content");
  const publicRoot = path.join(temporaryRoot, "public");
  try {
    await Promise.all([
      mkdir(contentRoot, { recursive: true }),
      mkdir(publicRoot, { recursive: true }),
    ]);
    for (const assetPath of assetPaths) {
      const target = path.join(publicRoot, ...assetPath.slice(1).split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "test asset");
    }
    await writeFile(
      path.join(contentRoot, "reading.json"),
      JSON.stringify({
        schema_version: 1,
        id: "reading-day-002",
        study_day: 2,
        items,
      }),
    );
    return (await validateContentRoot(contentRoot, { publicRoot })).errors;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
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

function imageMcq() {
  return {
    id: "image-mcq",
    question_jp: "正しい絵はどれですか。",
    options: [
      { id: "A", image_src: "/reading/assets/options/a.png" },
      { id: "B", text: "選択肢B", image_src: "/reading/assets/options/b.jpg" },
    ],
    correct_option_id: "A",
  };
}

function imageMatchingQuestion() {
  return {
    id: "image-matching",
    question_type: "matching",
    question_jp: "組み合わせてください。",
    left_items: [
      { id: "L1", image_src: "/reading/assets/people/tanaka.png" },
      { id: "L2", text: "山田" },
    ],
    right_items: [
      { id: "R1", text: "本" },
      { id: "R2", text: "かばん", image_src: "/reading/assets/objects/bag.webp" },
    ],
    correct_pairs: [
      { left_id: "L1", right_id: "R2" },
      { left_id: "L2", right_id: "R1" },
    ],
  };
}

function readingMedia(id = "image", src = "/reading/assets/image.png", alt?: string) {
  return { id, type: "image", src, ...(alt === undefined ? {} : { alt }) };
}

function readingItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    passage_jp: "本文です。",
    questions: [],
    ...overrides,
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
  items: Array<{ id: number; passage_jp: string; questions: unknown[] | null }>;
} {
  return {
    schema_version: 1,
    id: "reading-day-002",
    study_day: 2,
    items: [{ id: 201, passage_jp: "本文です。", questions }],
  };
}
