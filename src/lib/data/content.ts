import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ContentState } from "@/types";

export type ContentLoadResult<T> =
  | { state: Extract<ContentState, "available">; data: T }
  | { state: Extract<ContentState, "pending"> };

export async function loadJsonContent<T>(relativePath: string): Promise<ContentLoadResult<T>> {
  const contentRoot = path.resolve(process.cwd(), "content");
  const filePath = path.resolve(contentRoot, relativePath);
  const relativeToRoot = path.relative(contentRoot, filePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("INVALID_CONTENT_PATH");
  }

  try {
    const source = await readFile(filePath, "utf8");
    return { state: "available", data: JSON.parse(source) as T };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { state: "pending" };
    }

    throw error;
  }
}
