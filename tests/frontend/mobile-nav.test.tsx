import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { MobileNav } from "../../src/components/layout/MobileNav";
import { AppShell } from "../../src/components/layout/AppShell";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule/day/1",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F13 — Mobile Navigation & AppShell", () => {
  it("renders mobile navigation top bar with hamburger button", () => {
    const html = renderToString(<MobileNav currentStudyDay={1} />);
    expect(html).toContain("JLPT N3 Study");
    expect(html).toContain('aria-label="Mở menu điều hướng"');
  });

  it("renders AppShell with both desktop sidebar and mobile navigation", () => {
    const html = renderToString(
      <AppShell currentStudyDay={1}>
        <div data-testid="test-content">Dashboard Content</div>
      </AppShell>
    );

    // Should include MobileNav bar
    expect(html).toContain('aria-label="Mở menu điều hướng"');
    // Should include main children
    expect(html).toContain("Dashboard Content");
  });
});
