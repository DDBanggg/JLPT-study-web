import { describe, expect, it } from "vitest";

import {
  deriveCurrentStudyDay,
  deriveDaysUntilExam,
  deriveProgressPercent,
  currentIsoDateInTimeZone,
  parseIsoDate,
  projectedDay100Date,
} from "../../src/lib/progress/program-dates";

describe("program date derivation", () => {
  it("projects Day 100 inclusively from Day 1", () => {
    expect(projectedDay100Date("2026-08-27")).toBe("2026-12-04");
  });

  it("derives and clamps the current Study Day", () => {
    expect(deriveCurrentStudyDay("2026-08-27", "2026-08-28")).toBe(2);
    expect(deriveCurrentStudyDay("2026-08-27", "2026-08-01")).toBe(1);
    expect(deriveCurrentStudyDay("2026-08-27", "2027-01-01")).toBe(100);
  });

  it("clamps an overdue exam countdown at zero", () => {
    expect(deriveDaysUntilExam("2026-12-06", "2026-12-07")).toBe(0);
  });

  it("validates real calendar dates", () => {
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("2026-2-09")).toBeNull();
    expect(parseIsoDate("2028-02-29")).not.toBeNull();
  });

  it("maps completed Study Days directly to the 100-day percentage", () => {
    expect(deriveProgressPercent(37)).toBe(37);
    expect(deriveProgressPercent(101)).toBe(100);
  });

  it("derives the calendar date in the program timezone", () => {
    const nearMidnightUtc = new Date("2026-08-28T18:30:00.000Z");
    expect(currentIsoDateInTimeZone("Asia/Ho_Chi_Minh", nearMidnightUtc)).toBe("2026-08-29");
  });
});
