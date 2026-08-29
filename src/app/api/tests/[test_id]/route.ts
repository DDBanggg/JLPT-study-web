import { getAuthenticatedContext } from "@/lib/auth/session";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import {
  getLatestTestResult,
  getTestContext,
  sanitizeTestContent,
  taskTypeToTestType,
} from "@/lib/scoring/tests";
import { getTaskHref } from "@/lib/roadmap/program-roadmap";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ test_id: string }> },
) {
  const { test_id: testId } = await params;
  if (!testId) return apiError("INVALID_INPUT", "Test ID không hợp lệ.", 400, "test_id");

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể tải test.", 500);

    const test = await getTestContext(testId);
    if (test.state === "roadmap_pending") {
      return apiSuccess({
        roadmap_state: "pending",
        content_state: "pending",
        test_id: testId,
        test_type: null,
        study_day: null,
        latest_result: null,
        href: null,
        content: null,
      });
    }
    if (test.state === "not_found") return apiError("TEST_NOT_FOUND", "Không tìm thấy test.", 404);

    const latest = await getLatestTestResult(context.supabase, context.user.id, testId);
    if (latest.error) return apiError("INTERNAL_ERROR", "Không thể tải kết quả test.", 500);
    const base = {
      content_state: test.content.state,
      test_id: testId,
      test_type: test.content.state === "available"
        ? test.content.data.type
        : taskTypeToTestType(test.location.task.type),
      study_day: test.location.day.day,
      latest_result: latest.data ?? null,
      href: getTaskHref(test.location.task, test.location.day.day),
    };
    return apiSuccess({
      ...base,
      content: test.content.state === "available" ? sanitizeTestContent(test.content.data) : null,
    });
  } catch (error) {
    if ((error as Error).message === "TEST_INVALID") {
      return apiError("TEST_INVALID", "Nội dung test không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tải test.", 500);
  }
}
