import { getAuthenticatedContext } from "@/lib/auth/session";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import { markGrammarViewed } from "@/lib/progress/learn-progress";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const studyDay = body?.study_day;
  const grammarId = body?.grammar_id;
  if (!Number.isInteger(studyDay) || (studyDay as number) < 1 || (studyDay as number) > 100) {
    return apiError("INVALID_STUDY_DAY", "Study Day phải từ 1 đến 100.", 400, "study_day");
  }
  if (!Number.isInteger(grammarId) || (grammarId as number) < 1) {
    return apiError("INVALID_INPUT", "Grammar ID không hợp lệ.", 400, "grammar_id");
  }

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể lưu tiến độ.", 500);

    const result = await markGrammarViewed(
      context.supabase,
      context.user.id,
      studyDay as number,
      grammarId as number,
    );
    if (result.state === "content_pending") {
      return apiError("CONTENT_PENDING", "Nội dung Grammar chưa được chuẩn bị.", 409);
    }
    if (result.state === "item_not_found") {
      return apiError("ITEM_NOT_FOUND", "Không tìm thấy Grammar ID.", 404, "grammar_id");
    }
    if (result.state !== "available") {
      return apiError("INTERNAL_ERROR", "Không thể lưu tiến độ Grammar.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    if ((error as Error).message === "CONTENT_INVALID") {
      return apiError("CONTENT_INVALID", "Nội dung Grammar không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể lưu tiến độ Grammar.", 500);
  }
}
