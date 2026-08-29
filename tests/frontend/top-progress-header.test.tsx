import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { TopProgressHeader, ProgramProgressData } from "../../src/components/layout/TopProgressHeader";

describe("TopProgressHeader Component", () => {
  it("renders with default fallback values when no program is passed", () => {
    const html = renderToString(<TopProgressHeader />);
    expect(html).toContain("Tiến độ học tập");
    expect(html).toContain("Ngày 1");
    expect(html).toContain("/ 100");
    expect(html).toContain("0%");
    expect(html).toContain("Kỳ thi JLPT N3");
    expect(html).toContain("100");
    expect(html).toContain("ngày còn lại");
  });

  it("renders program progress data correctly", () => {
    const mockProgram: ProgramProgressData = {
      programId: "jlpt_n3_100_days_v1",
      progressStartDate: "2026-08-27",
      examDate: "2026-12-06",
      projectedDay100Date: "2026-12-04",
      currentStudyDay: 15,
      completedStudyDays: 14,
      progressPercent: 14,
      daysUntilExam: 86,
    };

    const html = renderToString(<TopProgressHeader program={mockProgram} />);
    expect(html).toContain("Ngày 15");
    expect(html).toContain("14%");
    expect(html).toContain("86");
    expect(html).toContain("06/12/2026");
  });

  it("calculates progress percent fallback when progressPercent is omitted", () => {
    const mockProgram: ProgramProgressData = {
      currentStudyDay: 25,
      completedStudyDays: 25,
    };

    const html = renderToString(<TopProgressHeader program={mockProgram} />);
    expect(html).toContain("Ngày 25");
    expect(html).toContain("25%");
  });
});
