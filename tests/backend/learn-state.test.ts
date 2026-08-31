import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadLearnContent } = vi.hoisted(() => ({ loadLearnContent: vi.fn() }));

vi.mock("@/lib/learn/content", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/learn/content")>();
  return { ...original, loadLearnContent };
});

import { getLearnDay } from "../../src/lib/learn/learn-state";

type State = {
  knownItems: { vocabulary: number[]; kanji: number[] };
  learningSets: { vocabulary?: number[]; kanji?: number[] };
  tablesRead: string[];
};

function learnContent(type: "vocabulary" | "kanji", ids: number[]) {
  return {
    schema_version: 1,
    id: `${type}-day-002`,
    study_day: 2,
    items: ids.map((id) => ({ id })),
  };
}

function createFakeSupabase(state: State): SupabaseClient {
  function from(table: string) {
    state.tablesRead.push(table);
    const filters: Record<string, unknown> = {};
    const response = () => {
      if (table === "known_items") {
        const type = filters.item_type as "vocabulary" | "kanji";
        return { data: state.knownItems[type].map((item_id) => ({ item_id })), error: null };
      }
      if (table === "learning_sets") {
        const type = filters.item_type as "vocabulary" | "kanji";
        const itemIds = state.learningSets[type];
        return { data: itemIds ? { item_ids: itemIds } : null, error: null };
      }
      return { data: null, error: null };
    };
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters[key] = value;
        return query;
      },
      maybeSingle: async () => response(),
      then: <TResult1 = { data: unknown; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) => Promise.resolve(response()).then(onfulfilled, onrejected),
    };
    return query;
  }

  return { from: vi.fn(from) } as unknown as SupabaseClient;
}

describe("Learn-state Vocabulary/Kanji separation", () => {
  beforeEach(() => loadLearnContent.mockReset());

  it("derives Kanji user_state from source minus Known and ignores a stale learning_set", async () => {
    const sourceIds = Array.from({ length: 33 }, (_, index) => index + 1);
    const state: State = {
      knownItems: { vocabulary: [], kanji: [2, 10, 32] },
      learningSets: { kanji: sourceIds.slice(0, 30) },
      tablesRead: [],
    };
    loadLearnContent.mockResolvedValue({ state: "available", data: learnContent("kanji", sourceIds) });

    const result = await getLearnDay(createFakeSupabase(state), "user-1", "kanji", 2);

    expect(result).toMatchObject({
      state: "available",
      data: {
        user_state: {
          known_ids_in_pool: [2, 10, 32],
          completed: false,
        },
      },
    });
    if (result.state === "available") {
      const userState = result.data.user_state as { learning_set_ids: number[] };
      expect(userState).toMatchObject({
        learning_set_ids: expect.arrayContaining([1, 33]),
      });
      expect(userState.learning_set_ids).toHaveLength(30);
    }
    expect(state.tablesRead).not.toContain("learning_sets");
  });

  it("continues using the persisted Vocabulary learning_set", async () => {
    const state: State = {
      knownItems: { vocabulary: [3], kanji: [] },
      learningSets: { vocabulary: [1, 2] },
      tablesRead: [],
    };
    loadLearnContent.mockResolvedValue({
      state: "available",
      data: learnContent("vocabulary", [1, 2, 3, 4]),
    });

    const result = await getLearnDay(createFakeSupabase(state), "user-1", "vocabulary", 2);

    expect(result).toMatchObject({
      state: "available",
      data: {
        user_state: {
          learning_set_ids: [1, 2],
          known_ids_in_pool: [3],
          completed: false,
        },
      },
    });
    expect(state.tablesRead).toContain("learning_sets");
  });
});
