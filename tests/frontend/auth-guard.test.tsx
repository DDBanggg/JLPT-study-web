import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AppShell } from "../../src/components/layout/AppShell";
import { ProgramDto } from "../../src/components/layout/TopProgressHeader";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Authenticated Layout & AppShell Program Integration", () => {
  it("renders AppShell with live program data", () => {
    const mockProgram: ProgramDto = {
      program_id: "jlpt_n3_100_days_v1",
      progress_start_date: "2026-08-27",
      exam_date: "2026-12-06",
      projected_day_100_date: "2026-12-04",
      current_study_day: 2,
      completed_study_days: 1,
      progress_percent: 1,
      days_until_exam: 100,
    };

    const html = renderToString(
      <AppShell program={mockProgram}>
        <div data-testid="page-content">Schedule Task Content</div>
      </AppShell>
    );

    // Header should reflect live program stats
    expect(html).toContain("1");
    expect(html).toContain("/ 100");
    expect(html).toContain("1%");
    expect(html).toContain("100");
    expect(html).toContain("06/12/2026");
    expect(html).toContain("Schedule Task Content");
  });

  it("handles loading/null program state safely without crashing", () => {
    const html = renderToString(
      <AppShell program={null}>
        <div>Loading placeholder</div>
      </AppShell>
    );

    expect(html).toContain("—");
    expect(html).toContain("/ 100");
    expect(html).toContain("0%");
    expect(html).toContain("Loading placeholder");
  });
});
