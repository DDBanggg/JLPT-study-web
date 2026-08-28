import { NextResponse } from "next/server";

import type { ApiSuccess } from "@/types";

type HealthData = { status: "ok" };

export function GET() {
  return NextResponse.json<ApiSuccess<HealthData>>({
    ok: true,
    data: { status: "ok" },
  });
}
