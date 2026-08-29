import { getAuthenticatedContext } from "@/lib/auth/session";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import {
  getTestContext,
  nextTaskAfterTest,
  scoreTest,
  submitTestResult,
  validateSubmittedAnswers,
} from "@/lib/scoring/tests";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ test_id: string }> },
) {
  const { test_id: testId } = await params;
  const body = await readJsonObject(request);
  if (!testId) return apiError("INVALID_INPUT", "Test ID không hợp lệ.", 400, "test_id");
  if (!body) return apiError("INVALID_INPUT", "Payload không hợp lệ.", 400);

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể nộp test.", 500);

    const test = await getTestContext(testId);
    if (test.state === "roadmap_pending") {
      return apiError("CONTENT_PENDING", "Roadmap chưa được chuẩn bị.", 503);
    }
    if (test.state === "not_found") return apiError("TEST_NOT_FOUND", "Không tìm thấy test.", 404);
    if (test.content.state === "pending") {
      return apiError("CONTENT_PENDING", "Nội dung test chưa được chuẩn bị.", 409);
    }

    const answers = validateSubmittedAnswers(test.content.data, body.answers);
    if (!answers) return apiError("INVALID_INPUT", "Danh sách đáp án không hợp lệ.", 400, "answers");
    const scored = scoreTest(test.content.data, answers);
    const saved = await submitTestResult(
      createSupabaseAdminClient(),
      context.user.id,
      test.location.day.day,
      test.location.task,
      scored.result,
    );
    if (saved.error) return apiError("INTERNAL_ERROR", "Không thể lưu kết quả test.", 500);

    return apiSuccess({
      result: scored.result,
      completed_at: (saved.data as { completed_at: string }).completed_at,
      review: scored.review,
      next_task: nextTaskAfterTest(test.location),
    });
  } catch (error) {
    if ((error as Error).message === "TEST_INVALID") {
      return apiError("TEST_INVALID", "Nội dung test không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể nộp test.", 500);
  }
}
