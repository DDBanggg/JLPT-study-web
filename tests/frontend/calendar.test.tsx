import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { CalendarView } from "../../src/components/calendar/CalendarView";
import { CalendarDayModal } from "../../src/components/calendar/CalendarDayModal";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/calendar",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F11 — Calendar Components", () => {
  describe("CalendarView", () => {
    it("renders calendar controls, legend, and initial skeleton", () => {
      const html = renderToString(<CalendarView />);
      expect(html).toContain("Lịch học tập (Calendar)");
      expect(html).toContain("Hôm nay");
      expect(html).toContain("Hoàn thành (Green)");
      expect(html).toContain("Hoàn thành muộn (Yellow)");
      expect(html).toContain("Chưa hoàn thành (Red)");
      expect(html).toContain("Chưa đến hạn / Pending");
    });
  });

  describe("CalendarDayModal", () => {
    it("renders modal dialog for selected study day with Schedule link", () => {
      const html = renderToString(
        <CalendarDayModal studyDay={1} onClose={() => {}} />
      );

      expect(html).toContain("Ngày");
      expect(html).toContain("1");
      expect(html).toContain("Đóng");
      expect(html).toContain("Mở ngày học (Schedule)");
      expect(html).toContain('href="/schedule/day/1"');
    });

    it("returns null when studyDay is null", () => {
      const html = renderToString(
        <CalendarDayModal studyDay={null} onClose={() => {}} />
      );
      expect(html).toBe("");
    });
  });
});
