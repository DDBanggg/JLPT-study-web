import { describe, expect, it } from "vitest";

import {
  selectInitialLearningSet,
  selectReplacement,
} from "../../src/lib/learning-sets/learning-sets";

describe("Vocabulary and Kanji frozen-set selection", () => {
  it("removes Known IDs and preserves pool priority for the initial set", () => {
    expect(selectInitialLearningSet([1, 2, 3, 4, 5], [2, 4], 3)).toEqual([1, 3, 5]);
  });

  it("selects the first eligible reserve without borrowing or reshuffling", () => {
    expect(selectReplacement([1, 2, 3, 4, 5], [1, 2, 3], [4], 2)).toBe(5);
  });

  it("returns null when the same-day reserve pool is exhausted", () => {
    expect(selectReplacement([1, 2, 3], [1, 2], [3], 2)).toBeNull();
  });
});
