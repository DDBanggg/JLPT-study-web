import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
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

describe("Milestone F3 — Schedule Components", () => {
  describe("ScheduleHeader", () => {
    it("disables Previous Day button on Day 1", () => {
      const html = renderToString(
        <ScheduleHeader studyDay={1} totalDays={100} currentStudyDay={1} />
      );
      expect(html).toContain("Ngày");
      expect(html).toContain("1");
      expect(html).toContain("100");
      expect(html).toContain("disabled");
      expect(html).toContain('aria-label="Ngày trước đó"');
    });

    it("enables Previous Day on Day 2+ and links to previous day", () => {
      const html = renderToString(
        <ScheduleHeader studyDay={15} totalDays={100} currentStudyDay={15} />
      );
      expect(html).toContain('href="/schedule/day/14"');
      expect(html).toContain('href="/schedule/day/16"');
      expect(html).toContain("Hôm nay");
    });

    it("disables Next Day button on Day 100", () => {
      const html = renderToString(
        <ScheduleHeader studyDay={100} totalDays={100} currentStudyDay={15} />
      );
      expect(html).toContain('aria-label="Ngày tiếp theo"');
      expect(html).toContain("disabled");
    });
  });

  describe("TaskCard", () => {
    it("renders task details, progress, and links via backend task.href", () => {
      const mockTask: ScheduleTask = {
        task_id: "grammar_day_15",
        task_type: "grammar",
        label: "Grammar",
        order: 1,
        required: true,
        content_state: "available",
        task_state: "in_progress",
        progress: { current: 8, total: 12 },
        href: "/learn/grammar/day/15",
      };

      const html = renderToString(<TaskCard task={mockTask} />);
      expect(html).toContain("Grammar");
      expect(html).toContain("8");
      expect(html).toContain("12");
      expect(html).toContain("Đang học");
      expect(html).toContain('href="/learn/grammar/day/15"');
    });

    it("renders Finished state while keeping card clickable/reopenable", () => {
      const mockTask: ScheduleTask = {
        task_id: "vocab_day_15",
        task_type: "vocabulary",
        label: "Vocabulary",
        order: 2,
        required: true,
        content_state: "available",
        task_state: "finished",
        progress: { current: 50, total: 50 },
        href: "/learn/vocabulary/day/15/list",
      };

      const html = renderToString(<TaskCard task={mockTask} />);
      expect(html).toContain("Hoàn thành");
      expect(html).toContain('href="/learn/vocabulary/day/15/list"');
    });

    it("renders Content Pending badge when content_state is pending", () => {
      const mockTask: ScheduleTask = {
        task_id: "reading_day_99",
        task_type: "reading",
        label: "Reading",
        order: 4,
        required: true,
        content_state: "pending",
        task_state: "pending",
        progress: null,
        href: "/learn/reading/day/99",
      };

      const html = renderToString(<TaskCard task={mockTask} />);
      expect(html).toContain("Chưa có nội dung");
    });
  });
});
