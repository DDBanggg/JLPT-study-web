import { describe, expect, it } from "vitest";

import {
  deriveNextTask,
  getRoadmapDay,
  getTaskContentPath,
  loadProgramRoadmap,
  parseStudyDay,
} from "../../src/lib/roadmap/program-roadmap";
import {
  buildScheduleTaskDto,
  loadTaskContentSummary,
} from "../../src/lib/schedule/schedule";

describe("roadmap and Schedule derivation", () => {
  it("loads the canonical 100-day roadmap and validates Study Day input", async () => {
    const result = await loadProgramRoadmap();
    expect(result.state).toBe("available");
    if (result.state !== "available") return;

    expect(result.data.days).toHaveLength(100);
    expect(parseStudyDay("1")).toBe(1);
    expect(parseStudyDay("100")).toBe(100);
    expect(["0", "01", "101", "2.5", "abc"].map(parseStudyDay)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("keeps roadmap order and derives Grammar → Grammar Test → Vocabulary", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");
    const day = getRoadmapDay(result.data, 2);

    expect(day.tasks.map(({ type }) => type).slice(0, 4)).toEqual([
      "daily_test",
      "grammar",
      "grammar_test",
      "vocabulary",
    ]);
    expect(deriveNextTask(day, "grammar_day_2")).toEqual({
      task_type: "grammar_test",
      href: "/test/grammar/grammar-test-002",
      label: "Làm Grammar Test",
    });
    expect(deriveNextTask(day, "grammar-test-002")).toEqual({
      task_type: "vocabulary",
      href: "/learn/vocabulary/day/2/list",
      label: "Học Vocabulary tiếp",
    });
  });

  it("loads the published Daily Test Day 2 summary", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");
    const dailyTest = getRoadmapDay(result.data, 2).tasks[0];

    expect(getTaskContentPath(dailyTest, 2)).toBe("tests/daily/day-002.json");
    await expect(loadTaskContentSummary(dailyTest, 2)).resolves.toEqual({
      state: "available",
      itemIds: [],
      total: 45,
    });
  });

  it("keeps Day 11 N5/N4-only and starts N3 C1L1P1 on Day 12", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");

    expect(getRoadmapDay(result.data, 11).tasks.map(({ type }) => type)).toEqual([
      "daily_test",
      "end_test",
    ]);
    const day12 = getRoadmapDay(result.data, 12);
    expect(day12.tasks.map(({ type }) => type)).toEqual([
      "grammar",
      "grammar_test",
      "vocabulary",
      "kanji",
      "reading",
      "listening",
    ]);
    await expect(loadTaskContentSummary(day12.tasks[0], 12)).resolves.toEqual({
      state: "available",
      itemIds: [1201, 1202, 1203, 1204],
      total: 4,
    });

    const day13 = getRoadmapDay(result.data, 13);
    expect(day13.tasks[0].resource_id).toBe("daily-013");
    await expect(loadTaskContentSummary(day13.tasks[0], 13)).resolves.toEqual({
      state: "available",
      itemIds: [],
      total: 40,
    });
  });

  it("publishes Chapter 1 Reading/Listening and keeps the Day 18 task order", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");

    for (let day = 12; day <= 17; day += 1) {
      const roadmapDay = getRoadmapDay(result.data, day);
      const reading = roadmapDay.tasks.find(({ type }) => type === "reading");
      const listening = roadmapDay.tasks.find(({ type }) => type === "listening");
      if (!reading || !listening) throw new Error(`Foundation task missing on Day ${day}`);
      await expect(loadTaskContentSummary(reading, day)).resolves.toMatchObject({ state: "available" });
      await expect(loadTaskContentSummary(listening, day)).resolves.toEqual({
        state: "available",
        itemIds: [day * 100 + 1],
        total: 1,
      });
    }

    expect(getRoadmapDay(result.data, 18).tasks.map(({ type }) => type)).toEqual([
      "daily_test",
      "weekly_test",
      "listening",
    ]);
  });

  it("publishes Chapter 2 on Day 19–25 and leaves Day 26 pending", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");

    expect(getRoadmapDay(result.data, 19).tasks.map(({ type }) => type)).toEqual([
      "grammar",
      "grammar_test",
      "vocabulary",
      "kanji",
      "reading",
      "listening",
    ]);
    for (let day = 20; day <= 24; day += 1) {
      expect(getRoadmapDay(result.data, day).tasks.map(({ type }) => type)).toEqual([
        "daily_test",
        "grammar",
        "grammar_test",
        "vocabulary",
        "kanji",
        "reading",
        "listening",
      ]);
    }
    expect(getRoadmapDay(result.data, 25).tasks.map(({ type }) => type)).toEqual([
      "daily_test",
      "weekly_test",
      "listening",
    ]);

    for (let day = 19; day <= 25; day += 1) {
      const summaries = await Promise.all(
        getRoadmapDay(result.data, day).tasks.map((task) => loadTaskContentSummary(task, day)),
      );
      expect(summaries.every(({ state }) => state === "available")).toBe(true);
    }
    expect(getRoadmapDay(result.data, 26)).toMatchObject({
      roadmap_state: "pending",
      tasks: [],
    });
  });

  it("derives available, in-progress and finished task DTOs", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");
    const grammar = getRoadmapDay(result.data, 2).tasks.find(
      ({ type }) => type === "grammar",
    );
    if (!grammar) throw new Error("Grammar task missing");
    const content = await loadTaskContentSummary(grammar, 2);
    if (content.total === null) throw new Error("Grammar content total missing");

    const inProgress = buildScheduleTaskDto(grammar, 2, content, [], [201]);
    expect(inProgress.content_state).toBe("available");
    expect(inProgress.task_state).toBe("in_progress");
    expect(inProgress.progress).toEqual({ current: 1, total: content.total });

    const finished = buildScheduleTaskDto(
      grammar,
      2,
      content,
      [{ task_type: "grammar", task_id: "grammar_day_2" }],
      [201],
    );
    expect(finished.task_state).toBe("finished");
    expect(finished.progress).toEqual({ current: content.total, total: content.total });
  });
});
