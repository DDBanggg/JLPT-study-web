import { describe, expect, it } from "vitest";

import {
  completionDateInTimeZone,
  deriveCalendarStatus,
  parseCalendarMonth,
} from "../../src/lib/calendar/calendar";
import type { RoadmapTask } from "../../src/lib/roadmap/program-roadmap";

const requiredTasks: RoadmapTask[] = [
  {
    task_id: "grammar_day_1",
    type: "grammar",
    label: "Grammar",
    required: true,
    order: 1,
    resource_id: "grammar-day-001",
  },
  {
    task_id: "grammar-test-001",
    type: "grammar_test",
    label: "Grammar Test",
    required: true,
    order: 2,
    resource_id: "grammar-test-001",
  },
];

function completions(timestamp: string) {
  return requiredTasks.map((task) => ({
    study_day: 1,
    task_type: task.type,
    task_id: task.task_id,
    completed_at: timestamp,
  }));
}

describe("Calendar derivation", () => {
  it("validates YYYY-MM query input", () => {
    expect(parseCalendarMonth("2026-08")).toBe("2026-08");
    expect(parseCalendarMonth("2026-8")).toBeNull();
    expect(parseCalendarMonth("2026-13")).toBeNull();
  });

  it("uses Asia/Ho_Chi_Minh calendar dates for completion timestamps", () => {
    expect(completionDateInTimeZone("2026-08-26T18:00:00Z")).toBe("2026-08-27");
  });

  it("derives Finished and Late Finished from all required tasks", () => {
    expect(
      deriveCalendarStatus("2026-08-27", requiredTasks, completions("2026-08-27T20:00:00+07:00")),
    ).toBe("finished");
    expect(
      deriveCalendarStatus("2026-08-27", requiredTasks, completions("2026-08-28T08:00:00+07:00")),
    ).toBe("late_finished");
  });

  it("derives Not Finished only after the planned date", () => {
    expect(deriveCalendarStatus("2026-08-27", requiredTasks, [], "2026-08-28")).toBe(
      "not_finished",
    );
    expect(deriveCalendarStatus("2026-08-27", requiredTasks, [], "2026-08-27")).toBeNull();
    expect(deriveCalendarStatus("2026-08-28", requiredTasks, [], "2026-08-27")).toBeNull();
  });

  it("keeps roadmap-pending days neutral", () => {
    expect(deriveCalendarStatus("2026-10-01", [], [], "2026-10-02")).toBeNull();
  });
});
