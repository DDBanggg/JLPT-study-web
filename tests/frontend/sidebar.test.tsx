import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Sidebar } from "../../src/components/layout/Sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
}));

describe("Sidebar Component", () => {
  it("renders main navigation items when expanded", () => {
    const html = renderToString(<Sidebar currentStudyDay={5} isCollapsed={false} />);
    
    // Core links
    expect(html).toContain("Schedule");
    expect(html).toContain("Calendar");
    expect(html).toContain('href="/schedule"');
    expect(html).toContain('href="/calendar"');

    // Groups
    expect(html).toContain("Learn");
    expect(html).toContain("Test");

    // Learn children
    expect(html).toContain("Grammar");
    expect(html).toContain("Vocabulary");
    expect(html).toContain("Kanji");
    expect(html).toContain("Reading");
    expect(html).toContain("Listening");
    expect(html).toContain('href="/learn/grammar/day/5"');
    expect(html).toContain('href="/learn/vocabulary/day/5/list"');

    // Test children
    expect(html).toContain("Grammar Test");
    expect(html).toContain("Daily Test");
    expect(html).toContain("Weekly Test");
    expect(html).toContain("Monthly Test");
    expect(html).toContain("End Test");
    expect(html).toContain("Test / Mock");
    expect(html).toContain('href="/test/grammar"');
    expect(html).toContain('href="/test/daily"');
  });

  it("renders compact mode with correct width class when collapsed", () => {
    const html = renderToString(<Sidebar currentStudyDay={1} isCollapsed={true} />);
    
    // Should have collapsed width class
    expect(html).toContain("w-[72px]");
    // Expanded brand label should not appear in collapsed mode
    expect(html).not.toContain("JLPT N3 Study");
    // Expand button label for accessibility
    expect(html).toContain("Mở rộng thanh điều hướng");
  });
});
