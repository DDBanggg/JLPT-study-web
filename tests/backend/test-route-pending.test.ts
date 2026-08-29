import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAuthenticatedContext,
  hasConfiguredProgram,
  getLatestTestResult,
  getTestContext,
} = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
  hasConfiguredProgram: vi.fn(),
  getLatestTestResult: vi.fn(),
  getTestContext: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));
vi.mock("@/lib/progress/program-access", () => ({ hasConfiguredProgram }));
vi.mock("@/lib/scoring/tests", () => ({
  getLatestTestResult,
  getTestContext,
  sanitizeTestContent: vi.fn(),
  taskTypeToTestType: vi.fn(),
}));

import { GET } from "../../src/app/api/tests/[test_id]/route";

describe("Test route pending and malformed content", () => {
  beforeEach(() => {
    getAuthenticatedContext.mockReset();
    hasConfiguredProgram.mockReset();
    getLatestTestResult.mockReset();
    getTestContext.mockReset();
    getAuthenticatedContext.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    hasConfiguredProgram.mockResolvedValue("configured");
  });

  it("returns roadmap pending as a successful pending test", async () => {
    getTestContext.mockResolvedValue({ state: "roadmap_pending" });

    const response = await GET(new Request("http://localhost/api/tests/daily-020"), {
      params: Promise.resolve({ test_id: "daily-020" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        roadmap_state: "pending",
        content_state: "pending",
        test_id: "daily-020",
        content: null,
      },
    });
    expect(getLatestTestResult).not.toHaveBeenCalled();
  });

  it("keeps malformed test content as an error", async () => {
    getTestContext.mockRejectedValue(new Error("TEST_INVALID"));

    const response = await GET(new Request("http://localhost/api/tests/broken"), {
      params: Promise.resolve({ test_id: "broken" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "TEST_INVALID" },
    });
  });
});
