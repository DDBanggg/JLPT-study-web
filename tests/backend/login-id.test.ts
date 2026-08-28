import { describe, expect, it } from "vitest";

import {
  isValidLoginId,
  normalizeLoginId,
  toInternalAuthEmail,
} from "../../src/lib/auth/login-id";

describe("Login ID convention", () => {
  it("normalizes a valid Login ID into the internal identity", () => {
    expect(normalizeLoginId("  Bang_01 ")).toBe("bang_01");
    expect(toInternalAuthEmail("Bang_01", "n3study.local")).toBe("bang_01@n3study.local");
  });

  it("rejects values outside the canonical pattern", () => {
    expect(isValidLoginId("ba")).toBe(false);
    expect(() => toInternalAuthEmail("bang@", "n3study.local")).toThrow("INVALID_LOGIN_ID");
  });
});
