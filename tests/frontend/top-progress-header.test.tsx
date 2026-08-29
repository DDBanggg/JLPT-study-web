import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { TopProgressHeader, ProgramDto, ProgramProgressData } from "../../src/components/layout/TopProgressHeader";

describe("TopProgressHeader Component", () => {
  it("renders with placeholder '—' when program data is absent", () => {
    const html = renderToString(<TopProgressHeader />);
    expect(html).toContain("Tiến độ học tập");
    expect(html).toContain("—");
    expect(html).toContain("/ 100");
    expect(html).toContain("0%");
    expect(html).toContain("Kỳ thi JLPT N3");
    expect(html).toContain("ngày còn lại");
    expect(html).toContain("(—)");
    // Must NOT fake dates
    expect(html).not.toContain("06/12/2026");
  });

  it("renders completed_study_days instead of current_study_day for progress", () => {
    const mockProgram: ProgramDto = {
      program_id: "jlpt_n3_100_days_v1",
      progress_start_date: "2026-08-27",
      exam_date: "2026-12-06",
      projected_day_100_date: "2026-12-04",
      current_study_day: 15,
      completed_study_days: 14,
      progress_percent: 14,
      days_until_exam: 86,
    };

    const html = renderToString(<TopProgressHeader program={mockProgram} />);
    // Should show completed_study_days (14), not current_study_day (15)
    expect(html).toContain("14");
    expect(html).toContain("/ 100");
    expect(html).toContain("14%");
    expect(html).toContain("86");
    expect(html).toContain("06/12/2026");
  });

  it("supports camelCase ProgramProgressData DTO mapping", () => {
    const mockProgram: ProgramProgressData = {
      currentStudyDay: 20,
      completedStudyDays: 18,
      daysUntilExam: 82,
      examDate: "2026-12-06",
    };

    const html = renderToString(<TopProgressHeader program={mockProgram} />);
    expect(html).toContain("18");
    expect(html).toContain("/ 100");
    expect(html).toContain("18%");
    expect(html).toContain("82");
    expect(html).toContain("06/12/2026");
  });
});
