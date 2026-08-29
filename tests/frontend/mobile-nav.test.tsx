import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "../../src/components/layout/MobileNav";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule/day/1",
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
  }),
}));

describe("Milestone F13 — Mobile Navigation DOM Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("opens drawer when clicking hamburger button, closes on close button or Escape key", async () => {
    render(<MobileNav currentStudyDay={1} />);

    // Initially drawer dialog is not rendered
    expect(screen.queryByRole("dialog", { name: "Menu điều hướng" })).toBeNull();

    // Click Hamburger
    const hamburgerBtn = screen.getByRole("button", { name: "Mở menu điều hướng" });
    await userEvent.click(hamburgerBtn);

    // Drawer opens
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Menu điều hướng" })).toBeDefined();
      expect(screen.getByRole("link", { name: /Calendar/i })).toBeDefined();
    });

    // Press Escape to close
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu điều hướng" })).toBeNull();
    });
  });

  it("performs logout and redirects to backend-provided redirect_to", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          redirect_to: "/login",
        },
      }),
    } as Response);

    render(<MobileNav currentStudyDay={1} />);

    // Open drawer
    await userEvent.click(screen.getByRole("button", { name: "Mở menu điều hướng" }));

    // Click Logout
    const logoutBtn = screen.getByRole("button", { name: "Đăng xuất" });
    await userEvent.click(logoutBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", expect.any(Object));
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });
});
