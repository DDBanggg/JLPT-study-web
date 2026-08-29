import { describe, expect, it } from "vitest";

import { loadLearnContent, parseLearnType } from "../../src/lib/learn/content";
import { parseLearnTaskType } from "../../src/lib/progress/learn-progress";

describe("Learn content and progress inputs", () => {
  it("loads published content and returns pending for rolling content", async () => {
    const grammar = await loadLearnContent("grammar", 2);
    expect(grammar.state).toBe("available");
    if (grammar.state === "available") {
      expect(grammar.data.id).toBe("grammar-day-002");
      expect(grammar.data.items).toHaveLength(33);
    }
    await expect(loadLearnContent("grammar", 3)).resolves.toEqual({ state: "pending" });
  });

  it("accepts only frozen Learn and completion task types", () => {
    expect(parseLearnType("vocabulary")).toBe("vocabulary");
    expect(parseLearnType("daily_test")).toBeNull();
    expect(parseLearnTaskType("listening")).toBe("listening");
    expect(parseLearnTaskType("grammar_test")).toBeNull();
  });
});
