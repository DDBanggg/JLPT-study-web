import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadJsonContent } = vi.hoisted(() => ({ loadJsonContent: vi.fn() }));

vi.mock("@/lib/data/content", () => ({ loadJsonContent }));

import { loadLearnContent } from "../../src/lib/learn/content";

describe("Learn content runtime schema v1.4 validation", () => {
  beforeEach(() => loadJsonContent.mockReset());

  it("preserves Vocabulary surface while accepting a legacy item", async () => {
    const data = {
      schema_version: 1,
      id: "vocabulary-day-002",
      study_day: 2,
      items: [
        { id: 201, surface: "スプーン", hiragana: "すぷーん", kanji: null },
        { id: 202, hiragana: "がっこう", kanji: "学校" },
      ],
    };
    loadJsonContent.mockResolvedValue({ state: "available", data });

    const result = await loadLearnContent("vocabulary", 2);

    expect(result).toEqual({ state: "available", data });
    if (result.state === "available") expect(result.data.items[0].surface).toBe("スプーン");
  });

  it("accepts canonical Kanji without target or pool_size", async () => {
    const data = kanjiDocument([kanjiItem(201)]);
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("kanji", 2)).resolves.toEqual({ state: "available", data });
  });

  it("accepts legacy Kanji quota fields and preserves all source items", async () => {
    const data = kanjiDocument(
      Array.from({ length: 33 }, (_, index) => kanjiItem(index + 201)),
      { target: 30, pool_size: 999 },
    );
    loadJsonContent.mockResolvedValue({ state: "available", data });

    const result = await loadLearnContent("kanji", 2);

    expect(result).toEqual({ state: "available", data });
    if (result.state === "available") expect(result.data.items).toHaveLength(33);
  });

  it("preserves a source with 27 Kanji items without slicing", async () => {
    const data = kanjiDocument(Array.from({ length: 27 }, (_, index) => kanjiItem(index + 201)));
    loadJsonContent.mockResolvedValue({ state: "available", data });

    const result = await loadLearnContent("kanji", 2);

    expect(result).toEqual({ state: "available", data });
    if (result.state === "available") expect(result.data.items).toHaveLength(27);
  });

  it.each([
    ["duplicate IDs", [kanjiItem(201), kanjiItem(201)]],
    ["empty kanji", [{ ...kanjiItem(201), kanji: "" }]],
    ["empty han_viet", [{ ...kanjiItem(201), han_viet: "" }]],
    ["empty meaning_vi", [{ ...kanjiItem(201), meaning_vi: "" }]],
    ["malformed onyomi", [{ ...kanjiItem(201), onyomi: ["", 1] }]],
    ["malformed compound", [{ ...kanjiItem(201), compounds: [{ word: "学校" }] }]],
    ["malformed example", [{ ...kanjiItem(201), examples: [{ jp: "学校です。" }] }]],
    ["malformed notes_vi", [{ ...kanjiItem(201), notes_vi: ["", 1] }]],
    ["empty source_ref", [{ ...kanjiItem(201), source_ref: "  " }]],
  ])("rejects Kanji with %s", async (_label, items) => {
    loadJsonContent.mockResolvedValue({ state: "available", data: kanjiDocument(items) });
    await expect(loadLearnContent("kanji", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it("accepts all Reading types, legacy MCQ, and questions:null", async () => {
    const data = readingDocument([
      legacyMcq("legacy"),
      { ...legacyMcq("explicit"), question_type: "mcq" },
      { id: "tf", question_type: "true_false", question_jp: "?", correct_answer: true },
      { id: "short", question_type: "short_answer", question_jp: "?", accepted_answers: ["7時", "七時"] },
      matchingQuestion(),
    ]);
    data.items.push({ id: 202, title: "No questions", passage_jp: "...", questions: null });
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).resolves.toEqual({ state: "available", data });
  });

  it("accepts passage-only, visual-only, and mixed Reading stimuli", async () => {
    const data = readingDocument([]);
    data.items = [
      { id: 201, title: "Legacy passage", passage_jp: "本文です。", questions: [] },
      {
        id: 202,
        title: "Visual only",
        passage_jp: null,
        translation_vi: null,
        media: [readingMedia("map", "/reading/assets/day-002/map.webp")],
        questions: [imageMcq()],
      },
      {
        id: 203,
        title: "Mixed",
        passage_jp: "図を見てください。",
        translation_vi: "Hãy nhìn vào hình.",
        media: [readingMedia("figure", "/reading/assets/figure.jpeg", "Sơ đồ")],
      },
    ];
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).resolves.toEqual({ state: "available", data });
  });

  it("accepts text, image, and combined options in MCQ and matching questions", async () => {
    const matching = {
      ...matchingQuestion(),
      left_items: [
        { id: "L1", image_src: "/reading/assets/people/tanaka.png" },
        { id: "L2", text: "山田", image_src: "/reading/assets/people/yamada.jpg" },
      ],
      right_items: [
        { id: "R1", text: "本" },
        { id: "R2", image_src: "/reading/assets/objects/bag.webp" },
      ],
    };
    const data = readingDocument([imageMcq(), matching]);
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).resolves.toEqual({ state: "available", data });
  });

  it.each([
    ["missing both passage and media", { id: 201, title: "No stimulus", questions: [] }],
    ["null passage and empty media", { id: 201, title: "No stimulus", passage_jp: null, media: [], questions: [] }],
    ["blank passage and no media", { id: 201, title: "No stimulus", passage_jp: "  ", questions: [] }],
  ])("rejects Reading with %s", async (_label, item) => {
    const data = readingDocument([]);
    data.items = [item];
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it.each([
    ["duplicate IDs", [readingMedia("same"), readingMedia("same")]],
    ["unsupported type", [{ ...readingMedia(), type: "video" }]],
    ["empty alt", [{ ...readingMedia(), alt: " " }]],
    ["width metadata", [{ ...readingMedia(), width: 640 }]],
    ["height metadata", [{ ...readingMedia(), height: 480 }]],
    ["remote URL", [{ ...readingMedia(), src: "https://example.com/image.png" }]],
    ["data URL", [{ ...readingMedia(), src: "data:image/png;base64,AAAA" }]],
    ["parent traversal", [{ ...readingMedia(), src: "/reading/assets/../secret.png" }]],
    ["encoded parent traversal", [{ ...readingMedia(), src: "/reading/assets/%2e%2e/secret.png" }]],
    ["backslash traversal", [{ ...readingMedia(), src: "/reading/assets/..\\secret.png" }]],
    ["double-dot filename", [{ ...readingMedia(), src: "/reading/assets/image..png" }]],
    ["path outside asset root", [{ ...readingMedia(), src: "/reading/image.png" }]],
    ["unsupported extension", [{ ...readingMedia(), src: "/reading/assets/image.svg" }]],
  ])("rejects Reading media with %s", async (_label, media) => {
    const data = readingDocument([]);
    data.items = [{ id: 201, title: "Media", media, questions: [] }];
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it.each([
    ["neither text nor image", { id: "A" }],
    ["empty text", { id: "A", text: " " }],
    ["invalid image path", { id: "A", image_src: "/other/image.png" }],
    ["valid text and invalid image", { id: "A", text: "答え", image_src: "data:image/png;base64,AAAA" }],
  ])("rejects a Reading option with %s", async (_label, option) => {
    const data = readingDocument([{ ...legacyMcq(), options: [option] }]);
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it.each([
    ["translation without passage", { id: 201, title: "Visual", media: [readingMedia()], translation_vi: "Bản dịch", questions: [] }],
    ["empty translation", { id: 201, title: "Passage", passage_jp: "本文", translation_vi: " ", questions: [] }],
  ])("rejects Reading with %s", async (_label, item) => {
    const data = readingDocument([]);
    data.items = [item];
    loadJsonContent.mockResolvedValue({ state: "available", data });

    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it.each([
    [{ ...legacyMcq(), question_type: "essay" }],
    [{ ...legacyMcq(), correct_option_id: "Z" }],
    [{ id: "q1", question_type: "true_false", question_jp: "?", correct_answer: "true" }],
    [{ id: "q1", question_type: "short_answer", question_jp: "?", accepted_answers: [] }],
    [{ id: "q1", question_type: "short_answer", question_jp: "?", accepted_answers: ["が", "か\u3099"] }],
    [{ ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "Z" }, { left_id: "L2", right_id: "R1" }] }],
    [{ ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R1" }, { left_id: "L1", right_id: "R2" }] }],
    [{ ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R1" }, { left_id: "L2", right_id: "R1" }] }],
    [{ ...matchingQuestion(), correct_pairs: [{ left_id: "L1", right_id: "R2" }] }],
  ])("rejects malformed type-specific Reading content", async (question) => {
    loadJsonContent.mockResolvedValue({ state: "available", data: readingDocument([question]) });
    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });

  it("rejects duplicate question IDs within one Reading item", async () => {
    loadJsonContent.mockResolvedValue({
      state: "available",
      data: readingDocument([legacyMcq("same"), legacyMcq("same")]),
    });
    await expect(loadLearnContent("reading", 2)).rejects.toThrow("CONTENT_INVALID");
  });
});

function legacyMcq(id = "q1") {
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
    question_type: "mcq",
    question_jp: "正しい絵はどれですか。",
    options: [
      { id: "A", image_src: "/reading/assets/options/a.png" },
      { id: "B", text: "B", image_src: "/reading/assets/options/b.jpg" },
    ],
    correct_option_id: "A",
  };
}

function readingMedia(id = "image", src = "/reading/assets/image.png", alt?: string) {
  return { id, type: "image", src, ...(alt === undefined ? {} : { alt }) };
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

function kanjiItem(id: number) {
  return {
    id,
    kanji: "学",
    han_viet: "HỌC",
    meaning_vi: "học",
    onyomi: ["ガク"],
    kunyomi: ["まなぶ"],
    compounds: [{ word: "学校", reading: "がっこう", meaning_vi: "trường học" }],
    examples: [{ jp: "学校です。", reading: "がっこうです。", vi: "Là trường học." }],
    notes_vi: [],
    source_ref: "Source",
  };
}

function kanjiDocument(items: unknown[], extras: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    id: "kanji-day-002",
    study_day: 2,
    ...extras,
    items,
  };
}

function readingDocument(questions: unknown[]): {
  schema_version: number;
  id: string;
  study_day: number;
  items: Array<Record<string, unknown>>;
} {
  return {
    schema_version: 1,
    id: "reading-day-002",
    study_day: 2,
    items: [{ id: 201, title: "Reading", passage_jp: "...", questions }],
  };
}
