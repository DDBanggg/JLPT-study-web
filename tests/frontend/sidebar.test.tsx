import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Sidebar } from "../../src/components/layout/Sidebar";

let mockPathname = "/schedule";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Sidebar Component", () => {
  it("renders main navigation items with Learn/Test groups closed by default on /schedule", () => {
    mockPathname = "/schedule";
    const html = renderToString(<Sidebar currentStudyDay={5} isCollapsed={false} />);
    
    // Core links
    expect(html).toContain("Schedule");
    expect(html).toContain("Calendar");
    expect(html).toContain('href="/schedule"');
    expect(html).toContain('href="/calendar"');

    // Group headers
    expect(html).toContain("Learn");
    expect(html).toContain("Test");

    // Children should NOT be rendered when closed by default
    expect(html).not.toContain('href="/learn/grammar/day/5"');
    expect(html).not.toContain('href="/learn/vocabulary/day/5/list"');
    expect(html).not.toContain('href="/test/grammar"');
    expect(html).not.toContain('href="/test/daily"');

    // Logout button
    expect(html).toContain("Đăng xuất");
    expect(html).toContain('data-testid="sidebar-logout-button"');
  });

  it("renders the collapse control in the expanded header and keeps footer for logout", () => {
    mockPathname = "/schedule";
    render(<Sidebar currentStudyDay={5} isCollapsed={false} />);

    const header = screen.getByTestId("sidebar-header");
    const footer = screen.getByTestId("sidebar-footer");
    expect(within(header).getByText("JLPT N3 Study")).toBeDefined();
    expect(within(header).getByRole("button", { name: "Thu gọn thanh điều hướng" })).toBeDefined();
    expect(within(header).getByRole("button", { name: "Thu gọn thanh điều hướng" }).getAttribute("title")).toBe(
      "Thu gọn thanh điều hướng",
    );
    expect(within(footer).getByRole("button", { name: "Đăng xuất" })).toBeDefined();
    expect(within(footer).queryByTestId("sidebar-collapse-toggle")).toBeNull();
  });

  it("auto-expands Learn group when pathname is in /learn/**", () => {
    mockPathname = "/learn/grammar/day/5";
    const html = renderToString(<Sidebar currentStudyDay={5} isCollapsed={false} />);
    
    // Learn children MUST appear
    expect(html).toContain("Grammar");
    expect(html).toContain("Vocabulary");
    expect(html).toContain("Kanji");
    expect(html).toContain("Reading");
    expect(html).toContain("Listening");
    expect(html).toContain('href="/learn/grammar/day/5"');
    expect(html).toContain('href="/learn/vocabulary/day/5/list"');

    // Test children should remain closed
    expect(html).not.toContain('href="/test/grammar"');
  });

  it("auto-expands Test group when pathname is in /test/**", () => {
    mockPathname = "/test/daily";
    const html = renderToString(<Sidebar currentStudyDay={5} isCollapsed={false} />);
    
    // Test children MUST appear
    expect(html).toContain("Grammar Test");
    expect(html).toContain("Daily Test");
    expect(html).toContain("Weekly Test");
    expect(html).toContain("Monthly Test");
    expect(html).toContain("End Test");
    expect(html).toContain("Test / Mock");
    expect(html).toContain('href="/test/grammar"');
    expect(html).toContain('href="/test/daily"');

    // Learn children should remain closed
    expect(html).not.toContain('href="/learn/grammar/day/5"');
  });

  it("renders compact mode with correct width class when collapsed", () => {
    mockPathname = "/schedule";
    const html = renderToString(<Sidebar currentStudyDay={1} isCollapsed={true} />);
    
    expect(html).toContain("w-[72px]");
    expect(html).not.toContain("JLPT N3 Study");
    expect(html).toContain("Mở rộng thanh điều hướng");
    expect(html).toContain('data-testid="sidebar-logout-button"');
  });

  it("renders the expand control in the collapsed header and no collapse action in footer", () => {
    mockPathname = "/schedule";
    render(<Sidebar currentStudyDay={1} isCollapsed />);

    const sidebar = screen.getByTestId("desktop-sidebar");
    const header = screen.getByTestId("sidebar-header");
    const footer = screen.getByTestId("sidebar-footer");
    expect(sidebar.className).toContain("w-[72px]");
    expect(within(header).getByText("N3")).toBeDefined();
    expect(within(header).getByRole("button", { name: "Mở rộng thanh điều hướng" }).getAttribute("title")).toBe(
      "Mở rộng thanh điều hướng",
    );
    expect(within(footer).getByRole("button", { name: "Đăng xuất" })).toBeDefined();
    expect(within(footer).queryByTestId("sidebar-collapse-toggle")).toBeNull();
    expect(screen.queryByText("JLPT N3 Study")).toBeNull();
  });
});
