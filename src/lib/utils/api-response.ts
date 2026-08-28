import { NextResponse } from "next/server";

import type { ApiError, ApiErrorCode, ApiSuccess } from "@/types";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  field: string | null = null,
) {
  return NextResponse.json<ApiError>(
    { ok: false, error: { code, message, field } },
    { status },
  );
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
