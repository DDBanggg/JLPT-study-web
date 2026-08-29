import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedContext, getCalendarMonth, getCalendarDay } = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
  getCalendarMonth: vi.fn(),
  getCalendarDay: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));
vi.mock("@/lib/calendar/calendar", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/calendar/calendar")>();
  return { ...original, getCalendarMonth, getCalendarDay };
});

import { GET as GET_MONTH } from "../../src/app/api/calendar/route";
import { GET as GET_DAY } from "../../src/app/api/calendar/day/[day]/route";

describe("Calendar route validation and access", () => {
  beforeEach(() => {
    getAuthenticatedContext.mockReset();
    getCalendarMonth.mockReset();
    getCalendarDay.mockReset();
  });

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

  it("keeps a roadmap-pending month successful with neutral day statuses", async () => {
    getAuthenticatedContext.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    getCalendarMonth.mockResolvedValue({
      state: "available",
      data: {
        month: "2026-09",
        roadmap_state: "pending",
        days: [{
          date: "2026-09-01",
          study_day: 6,
          roadmap_state: "pending",
          status: null,
        }],
      },
    });

    const response = await GET_MONTH(new Request("http://localhost/api/calendar?month=2026-09"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        roadmap_state: "pending",
        days: [{ roadmap_state: "pending", status: null }],
      },
    });
  });

  it("returns a roadmap-pending calendar day as a successful empty day", async () => {
    getAuthenticatedContext.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    getCalendarDay.mockResolvedValue({
      state: "available",
      data: {
        date: "2026-09-15",
        study_day: 20,
        roadmap_state: "pending",
        status: null,
        title: null,
        phase: null,
        tasks: [],
        next_task: null,
      },
    });

    const response = await GET_DAY(new Request("http://localhost/api/calendar/day/20"), {
      params: Promise.resolve({ day: "20" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        roadmap_state: "pending",
        status: null,
        tasks: [],
        next_task: null,
      },
    });
  });
});
