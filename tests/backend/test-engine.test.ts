import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  findTestLocation,
  loadTestContent,
  sanitizeTestContent,
  scoreTest,
  validateSubmittedAnswers,
  type TestDocument,
} from "../../src/lib/scoring/tests";
import { loadProgramRoadmap } from "../../src/lib/roadmap/program-roadmap";

async function loadDocument(relativePath: string): Promise<TestDocument> {
  return JSON.parse(
    await readFile(path.resolve(process.cwd(), "content", relativePath), "utf8"),
  ) as TestDocument;
}

function correctAnswers(document: TestDocument) {
  return document.sections.flatMap((section) =>
    section.questions.map((question) => ({
      question_id: question.id,
      option_id: question.correct_option_id,
    })),
  );
}

function createDailyTestDocument(): TestDocument {
  const sections = [
    ["grammar", "Grammar"],
    ["vocabulary", "Vocabulary"],
    ["kanji", "Kanji"],
  ].map(([id, title]) => ({
    id,
    title,
    max_score: 15,
    questions: Array.from({ length: 15 }, (_, index) => ({
      id: `${id}-${String(index + 1).padStart(2, "0")}`,
      category: id,
      prompt: "?",
      stimulus_id: null,
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
      ],
      correct_option_id: "A",
      explanation_vi: "",
    })),
  }));

  return {
    schema_version: 1,
    id: "daily-003",
    type: "daily",
    title: "Daily Test — Day 3",
    study_day: 3,
    coverage: { from_day: 2, to_day: 2 },
    stimuli: [],
    sections,
  };
}

describe("shared Test Engine", () => {
  it("locates published and pending tests from the roadmap", async () => {
    const roadmap = await loadProgramRoadmap();
    if (roadmap.state !== "available") throw new Error("Roadmap missing");
    const published = findTestLocation(roadmap.data, "grammar-test-002");
    const dailyDay2 = findTestLocation(roadmap.data, "daily-002");
    const pending = findTestLocation(roadmap.data, "daily-011");
    if (!published || !dailyDay2 || !pending) throw new Error("Roadmap test missing");

    expect((await loadTestContent(published)).state).toBe("available");
    const dailyResult = await loadTestContent(dailyDay2);
    expect(dailyResult.state).toBe("available");
    if (dailyResult.state !== "available") throw new Error("Daily Test Day 2 missing");
    expect(dailyResult.data.coverage).toEqual({ from_day: 1, to_day: 1 });
    expect(dailyResult.data.sections.map(({ id, max_score, questions }) => ({
      id,
      max_score,
      questions: questions.length,
    }))).toEqual([
      { id: "grammar", max_score: 20, questions: 20 },
      { id: "vocabulary", max_score: 25, questions: 25 },
    ]);
    expect(await loadTestContent(pending)).toEqual({ state: "pending" });
  });

  it("strips answers and explanations from active payloads", async () => {
    const document = await loadDocument("tests/grammar/day-002.json");
    const sanitized = sanitizeTestContent(document);
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("correct_option_id");
    expect(serialized).not.toContain("explanation_vi");
    expect(serialized).toContain("q001");
  });

  it("validates all question/option IDs and raw-scores Grammar Test", async () => {
    const document = await loadDocument("tests/grammar/day-002.json");
    const answers = correctAnswers(document);
    expect(validateSubmittedAnswers(document, answers)).toEqual(answers);
    const scored = scoreTest(document, answers);
    expect(scored.result).toMatchObject({
      test_id: "grammar-test-002",
      test_type: "grammar",
      score: 25,
      max_score: 25,
      total_score: null,
    });
    expect(scored.review.every(({ correct }) => correct)).toBe(true);

    const invalid = answers.slice(0, -1);
    expect(validateSubmittedAnswers(document, invalid)).toBeNull();
    expect(validateSubmittedAnswers(document, [
      ...answers.slice(0, -1),
      { question_id: answers.at(-1)!.question_id, option_id: "INVALID" },
    ])).toBeNull();
  });

  it("raw-scores the 45-question Daily Test", () => {
    const document = createDailyTestDocument();
    const answers = correctAnswers(document);
    answers[0].option_id = null as unknown as string;
    expect(scoreTest(document, answers).result).toMatchObject({
      test_type: "daily",
      score: 44,
      max_score: 45,
    });
  });

  it("linearly scores JLPT-style sections to 60/60/60", () => {
    const sections = ["language", "reading", "listening"].map((id) => ({
      id,
      title: id,
      max_score: 60,
      questions: Array.from({ length: 4 }, (_, index) => ({
        id: `${id}-${index}`,
        category: id,
        prompt: "?",
        stimulus_id: null,
        options: [{ id: "A", text: "A" }, { id: "B", text: "B" }],
        correct_option_id: "A",
        explanation_vi: "",
      })),
    }));
    const document: TestDocument = {
      schema_version: 1,
      id: "weekly-test",
      type: "weekly",
      title: "Weekly",
      study_day: 7,
      coverage: { from_day: 1, to_day: 6 },
      stimuli: [],
      sections,
    };
    const answers = correctAnswers(document).map((answer, index) => ({
      ...answer,
      option_id: index % 4 === 0 ? "B" : answer.option_id,
    }));
    expect(scoreTest(document, answers).result).toEqual({
      test_id: "weekly-test",
      test_type: "weekly",
      score: null,
      max_score: null,
      language_score: 45,
      reading_score: 45,
      listening_score: 45,
      total_score: 135,
    });
  });
});
