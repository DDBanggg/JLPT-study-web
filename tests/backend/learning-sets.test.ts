import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadLearnContent } = vi.hoisted(() => ({ loadLearnContent: vi.fn() }));

vi.mock("@/lib/learn/content", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/learn/content")>();
  return { ...original, loadLearnContent };
});

import {
  deriveKanjiActiveSet,
  ensureLearningSet,
  markKnownAndReplace,
  selectReplacement,
} from "../../src/lib/learning-sets/learning-sets";

type Item = { id: number };

type FakeState = {
  knownItems: { vocabulary: number[]; kanji: number[] };
  learningSets: { vocabulary?: number[]; kanji?: number[] };
  upserts: unknown[];
  inserts: unknown[];
  rpcCalls: { name: string; args: Record<string, unknown> }[];
  learningSetReads: number;
};

function content(type: "vocabulary" | "kanji", ids: number[]) {
  return {
    schema_version: 1,
    id: `${type}-day-002`,
    study_day: 2,
    ...(type === "vocabulary" ? { target: 50, pool_size: ids.length } : {}),
    items: ids.map((id) => ({ id })) as Item[],
  };
}

function createFakeSupabase(state: FakeState): SupabaseClient {
  function from(table: string) {
    const filters: Record<string, unknown> = {};
    const response = () => {
      if (table === "known_items") {
        const type = filters.item_type as "vocabulary" | "kanji";
        return { data: state.knownItems[type].map((item_id) => ({ item_id })), error: null };
      }
      if (table === "learning_sets") {
        state.learningSetReads += 1;
        const type = filters.item_type as "vocabulary" | "kanji";
        const itemIds = state.learningSets[type];
        return { data: itemIds ? { item_ids: itemIds } : null, error: null };
      }
      if (table === "task_progress") return { data: null, error: null };
      return { data: null, error: null };
    };
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters[key] = value;
        return query;
      },
      maybeSingle: async () => response(),
      single: async () => response(),
      upsert: async (row: { item_type: "vocabulary" | "kanji"; item_ids: number[] }) => {
        state.upserts.push(row);
        state.learningSets[row.item_type] = row.item_ids;
        return { error: null };
      },
      insert: async (row: { item_type: "vocabulary" | "kanji"; item_id: number }) => {
        state.inserts.push(row);
        state.knownItems[row.item_type].push(row.item_id);
        return { error: null };
      },
      then: <TResult1 = { data: unknown; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) => Promise.resolve(response()).then(onfulfilled, onrejected),
    };
    return query;
  }

  return {
    from: vi.fn(from),
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      const active = state.learningSets.vocabulary ?? [];
      const replacement = args.p_replacement_item_id as number | null;
      const updated = active.filter((id) => id !== args.p_item_id);
      if (replacement !== null) updated.push(replacement);
      state.learningSets.vocabulary = updated;
      return { data: updated, error: null };
    }),
  } as unknown as SupabaseClient;
}

function newState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    knownItems: { vocabulary: [], kanji: [] },
    learningSets: {},
    upserts: [],
    inserts: [],
    rpcCalls: [],
    learningSetReads: 0,
    ...overrides,
  };
}

describe("Vocabulary learning sets", () => {
  beforeEach(() => loadLearnContent.mockReset());

  it("initializes the first 50 eligible Vocabulary items in source order", async () => {
    const sourceIds = Array.from({ length: 60 }, (_, index) => index + 1);
    loadLearnContent.mockResolvedValue({ state: "available", data: content("vocabulary", sourceIds) });

    const result = await ensureLearningSet(createFakeSupabase(newState()), "user-1", 2, "vocabulary");

    expect(result).toMatchObject({
      state: "available",
      data: {
        learning_set_ids: sourceIds.slice(0, 50),
        active_count: 50,
        target: 50,
        pool_exhausted: false,
      },
    });
  });

  it("preserves pool priority for a same-day Vocabulary replacement", () => {
    expect(selectReplacement([1, 2, 3, 4, 5], [1, 2, 3], [4], 2)).toBe(5);
  });

  it("reports pool exhaustion when fewer than 50 Vocabulary items are eligible", async () => {
    const sourceIds = Array.from({ length: 20 }, (_, index) => index + 1);
    loadLearnContent.mockResolvedValue({ state: "available", data: content("vocabulary", sourceIds) });
    const result = await ensureLearningSet(createFakeSupabase(newState()), "user-1", 2, "vocabulary");

    expect(result).toEqual({
      state: "available",
      data: {
        study_day: 2,
        item_type: "vocabulary",
        learning_set_ids: sourceIds,
        active_count: 20,
        target: 50,
        pool_exhausted: true,
      },
    });
  });

  it("marks Known through the replacement RPC and preserves an active set of 50", async () => {
    const sourceIds = Array.from({ length: 51 }, (_, index) => index + 1);
    const state = newState({ learningSets: { vocabulary: sourceIds.slice(0, 50) } });
    loadLearnContent.mockResolvedValue({ state: "available", data: content("vocabulary", sourceIds) });

    const result = await markKnownAndReplace(createFakeSupabase(state), "user-1", 2, "vocabulary", 1);

    expect(result).toEqual({
      state: "available",
      data: {
        marked_known: 1,
        replacement_item_id: 51,
        learning_set_ids: [...sourceIds.slice(1, 50), 51],
        active_count: 50,
        target: 50,
        pool_exhausted: false,
      },
    });
    expect(state.rpcCalls).toHaveLength(1);
  });
});

describe("Kanji derived active sets", () => {
  beforeEach(() => loadLearnContent.mockReset());

  it.each([
    [33, [], 33],
    [27, [], 27],
    [33, [2, 10, 32], 30],
  ])("derives %i-source Kanji sets without a quota", (sourceCount, knownIds, expectedCount) => {
    const sourceIds = Array.from({ length: sourceCount }, (_, index) => index + 1);
    expect(deriveKanjiActiveSet(sourceIds, knownIds)).toHaveLength(expectedCount);
  });

  it("ignores a stale 30-item Kanji learning_set and does not read or write it", async () => {
    const sourceIds = Array.from({ length: 33 }, (_, index) => index + 1);
    const state = newState({ learningSets: { kanji: sourceIds.slice(0, 30) } });
    loadLearnContent.mockResolvedValue({ state: "available", data: content("kanji", sourceIds) });

    const result = await ensureLearningSet(createFakeSupabase(state), "user-1", 2, "kanji");

    expect(result).toEqual({
      state: "available",
      data: {
        study_day: 2,
        item_type: "kanji",
        learning_set_ids: sourceIds,
        active_count: 33,
        source_count: 33,
      },
    });
    expect(state.learningSetReads).toBe(0);
    expect(state.upserts).toEqual([]);
    expect("target" in (result as { data: object }).data).toBe(false);
    expect("pool_exhausted" in (result as { data: object }).data).toBe(false);
  });

  it("persists Kanji Known without an RPC or learning_set update", async () => {
    const sourceIds = Array.from({ length: 33 }, (_, index) => index + 1);
    const state = newState({ learningSets: { kanji: sourceIds.slice(0, 30) } });
    loadLearnContent.mockResolvedValue({ state: "available", data: content("kanji", sourceIds) });
    const client = createFakeSupabase(state);

    const marked = await markKnownAndReplace(client, "user-1", 2, "kanji", 1);
    const reread = await ensureLearningSet(client, "user-1", 2, "kanji");

    expect(marked).toEqual({ state: "available", data: { marked_known: 1 } });
    expect(state.inserts).toHaveLength(1);
    expect(state.rpcCalls).toEqual([]);
    expect(state.upserts).toEqual([]);
    expect(state.learningSetReads).toBe(0);
    expect(reread).toMatchObject({
      state: "available",
      data: { active_count: 32, source_count: 33 },
    });
    if (reread.state === "available") {
      expect(reread.data.learning_set_ids).not.toContain(1);
    }
  });

  it("returns item_already_known without requiring a Kanji learning_set", async () => {
    loadLearnContent.mockResolvedValue({ state: "available", data: content("kanji", [1, 2, 3]) });
    const result = await markKnownAndReplace(
      createFakeSupabase(newState({ knownItems: { vocabulary: [], kanji: [2] } })),
      "user-1",
      2,
      "kanji",
      2,
    );

    expect(result).toEqual({ state: "item_already_known" });
  });
});
