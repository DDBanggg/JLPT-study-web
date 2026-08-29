import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TestListView } from "../../src/components/test/TestListView";

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
});
