import { getAuthenticatedContext } from "@/lib/auth/session";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import { getTestList, parseTestType } from "@/lib/scoring/tests";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const type = parseTestType(new URL(request.url).searchParams.get("type"));
  if (!type) return apiError("INVALID_INPUT", "Test type không hợp lệ.", 400, "type");

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể tải danh sách test.", 500);

    const result = await getTestList(context.supabase, context.user.id, type);
    if (result.state === "database_error") {
      return apiError("INTERNAL_ERROR", "Không thể tải danh sách test.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    if ((error as Error).message === "TEST_INVALID") {
      return apiError("TEST_INVALID", "Nội dung test không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tải danh sách test.", 500);
  }
}
