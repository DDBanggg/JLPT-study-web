import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedContext } = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));

import { GET as GET_MONTH } from "../../src/app/api/calendar/route";
import { GET as GET_DAY } from "../../src/app/api/calendar/day/[day]/route";

describe("Calendar route validation and access", () => {
  beforeEach(() => getAuthenticatedContext.mockReset());

  it("rejects an invalid month before accessing the session", async () => {
    const response = await GET_MONTH(new Request("http://localhost/api/calendar?month=2026-13"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT", field: "month" },
    });
    expect(getAuthenticatedContext).not.toHaveBeenCalled();
  });

  it("rejects an invalid Study Day before accessing the session", async () => {
    const response = await GET_DAY(new Request("http://localhost/api/calendar/day/101"), {
      params: Promise.resolve({ day: "101" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "INVALID_STUDY_DAY", field: "day" },
    });
    expect(getAuthenticatedContext).not.toHaveBeenCalled();
  });

  it("requires authentication for a valid month", async () => {
    getAuthenticatedContext.mockResolvedValue(null);
    const response = await GET_MONTH(new Request("http://localhost/api/calendar?month=2026-08"));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "AUTH_REQUIRED" },
    });
  });
});
