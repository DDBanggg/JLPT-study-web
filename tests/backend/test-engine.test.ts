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

  it("loads and raw-scores the 40-question N3 Daily Test", async () => {
    const roadmap = await loadProgramRoadmap();
    if (roadmap.state !== "available") throw new Error("Roadmap missing");
    const location = findTestLocation(roadmap.data, "daily-013");
    if (!location) throw new Error("N3 Daily Test missing from roadmap");
    const loaded = await loadTestContent(location);
    if (loaded.state !== "available") throw new Error("N3 Daily Test content missing");

    const answers = correctAnswers(loaded.data);
    answers[0].option_id = null as unknown as string;
    expect(scoreTest(loaded.data, answers).result).toMatchObject({
      test_type: "daily",
      score: 39,
      max_score: 40,
    });
  });

  it("loads and scores Weekly with two sections, /120 total and null Listening", async () => {
    const roadmap = await loadProgramRoadmap();
    if (roadmap.state !== "available") throw new Error("Roadmap missing");
    const location = findTestLocation(roadmap.data, "weekly-01");
    if (!location) throw new Error("Weekly Test missing from roadmap");
    const loaded = await loadTestContent(location);
    if (loaded.state !== "available") throw new Error("Weekly Test content missing");

    expect(loaded.data.sections.map(({ id, max_score, questions }) => ({
      id,
      max_score,
      questions: questions.length,
    }))).toEqual([
      { id: "language", max_score: 60, questions: 30 },
      { id: "reading", max_score: 60, questions: 12 },
    ]);
    expect(scoreTest(loaded.data, correctAnswers(loaded.data)).result).toMatchObject({
      test_type: "weekly",
      language_score: 60,
      reading_score: 60,
      listening_score: null,
      total_score: 120,
    });
  });

  it("keeps Monthly/End/Mock scoring on three sections and /180", () => {
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
      id: "mock-test",
      type: "mock",
      title: "Mock",
      study_day: 100,
      coverage: { from_day: 1, to_day: 99 },
      stimuli: [],
      sections,
    };
    const answers = correctAnswers(document).map((answer, index) => ({
      ...answer,
      option_id: index % 4 === 0 ? "B" : answer.option_id,
    }));
    expect(scoreTest(document, answers).result).toEqual({
      test_id: "mock-test",
      test_type: "mock",
      score: null,
      max_score: null,
      language_score: 45,
      reading_score: 45,
      listening_score: 45,
      total_score: 135,
    });
  });
});
