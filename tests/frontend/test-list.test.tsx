import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  formatTestResultScore,
  TestListView,
} from "../../src/components/test/TestListView";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test/grammar",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F9 — Test List Components", () => {
  it("renders test list page skeleton initially", () => {
    const html = renderToString(
      <TestListView
        type="grammar"
        title="Grammar Test"
        description="Bài kiểm tra ngữ pháp 25 câu"
      />
    );

    expect(html).toContain("animate-pulse");
  });

  it("formats Weekly as /120 while preserving /180 for other scaled tests", () => {
    const baseResult = {
      test_id: "scaled-test",
      score: null,
      max_score: null,
      total_score: 90,
    };
    expect(formatTestResultScore({ ...baseResult, test_type: "weekly" })).toBe("90 / 120");
    expect(formatTestResultScore({ ...baseResult, test_type: "mock" })).toBe("90 / 180");
  });
});
