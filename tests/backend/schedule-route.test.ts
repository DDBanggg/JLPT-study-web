import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedContext, getScheduleDay } = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
  getScheduleDay: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));
vi.mock("@/lib/schedule/schedule", () => ({ getScheduleDay }));

import { GET } from "../../src/app/api/schedule/day/[day]/route";

describe("Schedule route access and input validation", () => {
  beforeEach(() => {
    getAuthenticatedContext.mockReset();
    getScheduleDay.mockReset();
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

  it("returns roadmap pending as a successful empty schedule", async () => {
    getAuthenticatedContext.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    getScheduleDay.mockResolvedValue({
      state: "available",
      data: {
        program_id: "jlpt_n3_100_days_v1",
        study_day: 20,
        total_days: 100,
        planned_date: "2026-09-15",
        roadmap_state: "pending",
        phase: null,
        title: null,
        tasks: [],
        next_task: null,
      },
    });

    const response = await GET(new Request("http://localhost/api/schedule/day/20"), {
      params: Promise.resolve({ day: "20" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: expect.objectContaining({
        roadmap_state: "pending",
        tasks: [],
        next_task: null,
      }),
    });
  });
});
