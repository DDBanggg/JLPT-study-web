import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import SetupPage, {
  computeProjectedDay100,
  formatDateDisplay,
} from "../../src/app/setup/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SetupPage and Date Calculation", () => {
  it("computes projected Day 100 inclusively (start + 99 days)", () => {
    expect(computeProjectedDay100("2026-08-27")).toBe("2026-12-04");
    expect(computeProjectedDay100("2026-01-01")).toBe("2026-04-10");
  });

  it("handles invalid dates safely", () => {
    expect(computeProjectedDay100("")).toBe("");
    expect(computeProjectedDay100("invalid-date")).toBe("");
  });

  it("formats dates correctly for display", () => {
    expect(formatDateDisplay("2026-08-27")).toBe("27/08/2026");
    expect(formatDateDisplay("2026-12-06")).toBe("06/12/2026");
    expect(formatDateDisplay("")).toBe("—");
  });

  it("renders setup loading state initially", () => {
    const html = renderToString(<SetupPage />);
    expect(html).toContain("Đang kiểm tra chương trình học...");
  });
});
