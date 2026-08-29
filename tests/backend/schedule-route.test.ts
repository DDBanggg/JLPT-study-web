import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedContext } = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));

import { GET } from "../../src/app/api/schedule/day/[day]/route";

describe("Schedule route access and input validation", () => {
  beforeEach(() => {
    getAuthenticatedContext.mockReset();
  });

  it("rejects an invalid Study Day before accessing the session", async () => {
    const response = await GET(new Request("http://localhost/api/schedule/day/0"), {
      params: Promise.resolve({ day: "0" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "INVALID_STUDY_DAY", field: "day" },
    });
    expect(getAuthenticatedContext).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    getAuthenticatedContext.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/schedule/day/2"), {
      params: Promise.resolve({ day: "2" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "AUTH_REQUIRED" },
    });
  });
});
