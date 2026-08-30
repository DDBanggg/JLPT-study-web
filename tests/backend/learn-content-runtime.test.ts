import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadJsonContent } = vi.hoisted(() => ({ loadJsonContent: vi.fn() }));

vi.mock("@/lib/data/content", () => ({ loadJsonContent }));

import { loadLearnContent } from "../../src/lib/learn/content";

describe("Learn content runtime schema v1.2 validation", () => {
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
  items: Array<{
    id: number;
    title: string;
    passage_jp: string;
    questions: unknown[] | null;
  }>;
} {
  return {
    schema_version: 1,
    id: "reading-day-002",
    study_day: 2,
    items: [{ id: 201, title: "Reading", passage_jp: "...", questions }],
  };
}
