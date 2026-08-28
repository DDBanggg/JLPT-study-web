import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateContentRoot } from "../../scripts/content-validation/validate-content.mjs";

describe("content validation foundation", () => {
  it("runs against the rolling-content directory without crashing", async () => {
    const result = await validateContentRoot(path.resolve(process.cwd(), "content"));
    expect(result.errors).toEqual([]);
  });
});
