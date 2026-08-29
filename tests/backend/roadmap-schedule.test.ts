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

  it("returns Content Pending for an unpublished roadmap resource", async () => {
    const result = await loadProgramRoadmap();
    if (result.state !== "available") throw new Error("Roadmap missing");
    const dailyTest = getRoadmapDay(result.data, 2).tasks[0];

    expect(getTaskContentPath(dailyTest, 2)).toBe("tests/daily/day-002.json");
    await expect(loadTaskContentSummary(dailyTest, 2)).resolves.toEqual({
      state: "pending",
      itemIds: [],
      total: null,
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
