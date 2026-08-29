import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TestEngine } from "../../src/components/test/TestEngine";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test/grammar/sample-test",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F10 — Test Engine Components", () => {
  it("renders test engine skeleton on initial load", () => {
    const html = renderToString(<TestEngine testId="sample-test" />);
    expect(html).toContain("animate-pulse");
  });
});
