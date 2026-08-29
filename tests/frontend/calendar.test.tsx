import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "../../src/components/calendar/CalendarView";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/calendar",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F11 — Calendar Real DOM Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders calendar month view with accessible Study Day buttons, and opens day detail modal", async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const firstDayIso = `${currentMonth}-01`;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/calendar/day/1")) {
        return Promise.resolve({
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              study_day: 1,
              date: firstDayIso,
              roadmap_state: "planned",
              status: "finished",
              title: "Ngày 1",
              tasks: [
                {
                  task_id: "grammar_day_1",
                  task_type: "grammar",
                  label: "Grammar Day 1",
                  required: true,
                  task_state: "finished",
                  content_state: "available",
                  progress: { current: 3, total: 3 },
                  href: "/learn/grammar/day/1",
                },
              ],
            },
          }),
        } as Response);
      }

      // Month fetch
      return Promise.resolve({
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            month: currentMonth,
            program_id: "prog_1",
            progress_start_date: firstDayIso,
            exam_date: "2026-12-06",
            days: [
              {
                date: firstDayIso,
                study_day: 1,
                roadmap_state: "planned",
                status: "finished",
              },
            ],
          },
        }),
      } as Response);
    });

    render(<CalendarView />);

    // Check legend items
    expect(screen.getByText("Lịch học tập (Calendar)")).toBeDefined();
    expect(screen.getByText(/Hoàn thành \(Green\)/i)).toBeDefined();

    // Find accessible Study Day button
    const day1Button = await screen.findByRole("button", {
      name: /Ngày 1, Ngày học 1/i,
    });
    expect(day1Button).toBeDefined();

    // Click Day 1 button to open modal
    await userEvent.click(day1Button);

    // Modal should appear and display Day 1 details
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Grammar Day 1")).toBeDefined();
      const link = screen.getByRole("link", { name: /Mở ngày học/i });
      expect(link.getAttribute("href")).toBe("/schedule/day/1");
    });
  });
});
