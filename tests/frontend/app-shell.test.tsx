import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AppShell } from "../../src/components/layout/AppShell";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
}));

describe("AppShell Component", () => {
  it("renders sidebar, top header, and main children", () => {
    const html = renderToString(
      <AppShell currentStudyDay={3}>
        <div data-testid="test-content">Dashboard Content</div>
      </AppShell>
    );

    // Sidebar
    expect(html).toContain("data-testid=\"desktop-sidebar\"");
    // Header
    expect(html).toContain("data-testid=\"top-progress-header\"");
    expect(html).toContain("Tiến độ học tập");
    // Main content
    expect(html).toContain("Dashboard Content");
  });
});
