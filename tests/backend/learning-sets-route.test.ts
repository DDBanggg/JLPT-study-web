import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAuthenticatedContext,
  hasConfiguredProgram,
  createSupabaseAdminClient,
  ensureLearningSet,
  markKnownAndReplace,
} = vi.hoisted(() => ({
  getAuthenticatedContext: vi.fn(),
  hasConfiguredProgram: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  ensureLearningSet: vi.fn(),
  markKnownAndReplace: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedContext }));
vi.mock("@/lib/progress/program-access", () => ({ hasConfiguredProgram }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));
vi.mock("@/lib/learning-sets/learning-sets", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/learning-sets/learning-sets")>();
  return { ...original, ensureLearningSet, markKnownAndReplace };
});

import { POST as ensurePost } from "../../src/app/api/learning-sets/ensure/route";
import { POST as markPost } from "../../src/app/api/known-items/mark/route";

describe("Kanji learning-set API responses", () => {
  beforeEach(() => {
    getAuthenticatedContext.mockReset();
    hasConfiguredProgram.mockReset();
    createSupabaseAdminClient.mockReset();
    ensureLearningSet.mockReset();
    markKnownAndReplace.mockReset();

    getAuthenticatedContext.mockResolvedValue({ user: { id: "user-1" }, supabase: {} });
    hasConfiguredProgram.mockResolvedValue("configured");
    createSupabaseAdminClient.mockReturnValue({});
  });

  it("returns the derived Kanji ensure shape without quota fields", async () => {
    ensureLearningSet.mockResolvedValue({
      state: "available",
      data: {
        study_day: 2,
        item_type: "kanji",
        learning_set_ids: [1, 2, 3],
        active_count: 3,
        source_count: 3,
      },
    });

    const response = await ensurePost(new Request("http://localhost/api/learning-sets/ensure", {
      method: "POST",
      body: JSON.stringify({ study_day: 2, item_type: "kanji" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        study_day: 2,
        item_type: "kanji",
        learning_set_ids: [1, 2, 3],
        active_count: 3,
        source_count: 3,
      },
    });
    expect(body.data).not.toHaveProperty("target");
    expect(body.data).not.toHaveProperty("pool_exhausted");
  });

  it("returns a minimal Kanji Known response without replacement fields", async () => {
    markKnownAndReplace.mockResolvedValue({
      state: "available",
      data: { marked_known: 2 },
    });

    const response = await markPost(new Request("http://localhost/api/known-items/mark", {
      method: "POST",
      body: JSON.stringify({ study_day: 2, item_type: "kanji", item_id: 2 }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, data: { marked_known: 2 } });
    expect(body.data).not.toHaveProperty("replacement_item_id");
    expect(body.data).not.toHaveProperty("target");
    expect(body.data).not.toHaveProperty("pool_exhausted");
  });
});
