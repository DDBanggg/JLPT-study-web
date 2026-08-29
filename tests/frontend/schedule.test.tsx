import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SchedulePage from "../../src/app/(authenticated)/schedule/page";
import { ScheduleHeader } from "../../src/components/schedule/ScheduleHeader";
import { TaskCard, ScheduleTask } from "../../src/components/schedule/TaskCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule/day/1",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F3 — Schedule Real Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows ErrorState on /api/program failure without faking Day 1, and retries successfully", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      if (url.includes("/api/program")) {
        if (callCount === 1) {
          return Promise.reject(new Error("Network Failure"));
        }
        return Promise.resolve({
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              configured: true,
              program: {
                current_study_day: 15,
              },
            },
          }),
        } as Response);
      }
      // Schedule day fetch
      return Promise.resolve({
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            study_day: 15,
            roadmap_state: "planned",
            tasks: [],
          },
        }),
      } as Response);
    });

    render(<SchedulePage />);

    // Should display error state, not fallback to Day 1
    await waitFor(() => {
      expect(screen.getByText(/Lỗi kết nối máy chủ/i)).toBeDefined();
      expect(screen.getByRole("button", { name: "Thử lại" })).toBeDefined();
    });

    // Click Retry
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    // Upon retry, should load Day 15
    await waitFor(() => {
      expect(screen.getByText(/15/)).toBeDefined();
    });
  });

  it("renders TaskCard with backend href and progress", () => {
    const mockTask: ScheduleTask = {
      task_id: "vocab_day_15",
      task_type: "vocabulary",
      label: "Vocabulary",
      order: 2,
      required: true,
      content_state: "available",
      task_state: "in_progress",
      progress: { current: 30, total: 50 },
      href: "/learn/vocabulary/day/15/list",
    };

    render(<TaskCard task={mockTask} />);

    expect(screen.getByText("Vocabulary")).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
    expect(screen.getByText(/\/ 50/)).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/learn/vocabulary/day/15/list");
  });

  it("handles ScheduleHeader boundary buttons", () => {
    const { rerender } = render(
      <ScheduleHeader studyDay={1} totalDays={100} currentStudyDay={1} />
    );
    const prevBtn = screen.getByRole("button", { name: "Ngày trước đó" }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);

    rerender(<ScheduleHeader studyDay={100} totalDays={100} currentStudyDay={1} />);
    const nextBtn = screen.getByRole("button", { name: "Ngày tiếp theo" }) as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });
});
