import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import LoginPage from "../../src/app/login/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("LoginPage Component", () => {
  it("renders login form with Login ID and password fields", () => {
    const html = renderToString(<LoginPage />);
    expect(html).toContain("JLPT N3 Study");
    expect(html).toContain("Login ID");
    expect(html).toContain("Mật khẩu");
    expect(html).toContain("Đăng nhập");
    expect(html).toContain('name="loginId"');
    expect(html).toContain('name="password"');
  });

  it("does not contain signup, email, or social login elements", () => {
    const html = renderToString(<LoginPage />);
    expect(html).not.toContain("Đăng ký");
    expect(html).not.toContain("Sign up");
    expect(html).not.toContain("Google");
    expect(html).not.toContain("Facebook");
    expect(html).not.toContain("Quên mật khẩu");
    expect(html).not.toContain('type="email"');
  });
});
