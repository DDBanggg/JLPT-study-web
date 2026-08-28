import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateContentRoot } from "../../scripts/content-validation/validate-content.mjs";

describe("content validation foundation", () => {
  it("runs against the rolling-content directory without crashing", async () => {
    const result = await validateContentRoot(path.resolve(process.cwd(), "content"));
    expect(result.errors).toEqual([]);
  });

  it("enforces the canonical Grammar Test grouping", async () => {
    const contentRoot = await mkdtemp(path.join(tmpdir(), "n3-grammar-test-"));

    try {
      const questions = Array.from({ length: 25 }, (_, index) => ({
        id: `q${String(index + 1).padStart(3, "0")}`,
        category: "grammar",
      }));
      const document = {
        schema_version: 1,
        id: "grammar-test-002",
        type: "grammar",
        study_day: 2,
        coverage: { from_day: 2, to_day: 2 },
        lesson_groups: Array.from({ length: 5 }, (_, index) => ({
          lesson: index + 6,
          question_ids: questions.slice(index * 5, index * 5 + 5).map(({ id }) => id),
        })),
        sections: [{ id: "grammar", max_score: 25, questions }],
      };

      await writeFile(path.join(contentRoot, "day-002.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toEqual([]);

      document.lesson_groups[0].question_ids.pop();
      await writeFile(path.join(contentRoot, "day-002.json"), JSON.stringify(document));
      expect((await validateContentRoot(contentRoot)).errors).toContain(
        "day-002.json: every grammar test lesson_group must contain 5 question_ids",
      );
    } finally {
      await rm(contentRoot, { recursive: true, force: true });
    }
  });
});
