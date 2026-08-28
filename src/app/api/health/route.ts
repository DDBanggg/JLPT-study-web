import { apiSuccess } from "@/lib/utils/api-response";

type HealthData = { status: "ok" };

export function GET() {
  return apiSuccess<HealthData>({ status: "ok" });
}
