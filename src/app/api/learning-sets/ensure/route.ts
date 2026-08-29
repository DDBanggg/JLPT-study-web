import { getAuthenticatedContext } from "@/lib/auth/session";
import { ensureLearningSet, parseLearningSetType } from "@/lib/learning-sets/learning-sets";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const studyDay = body?.study_day;
  const type = parseLearningSetType(body?.item_type);
  if (!Number.isInteger(studyDay) || (studyDay as number) < 1 || (studyDay as number) > 100) {
    return apiError("INVALID_STUDY_DAY", "Study Day phải từ 1 đến 100.", 400, "study_day");
  }
  if (!type) return apiError("INVALID_INPUT", "Item type không hợp lệ.", 400, "item_type");

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể tạo learning set.", 500);

    const result = await ensureLearningSet(context.supabase, context.user.id, studyDay as number, type);
    if (result.state === "content_pending") {
      return apiError("CONTENT_PENDING", "Nội dung chưa được chuẩn bị.", 409);
    }
    if (result.state === "learning_set_invalid") {
      return apiError("LEARNING_SET_INVALID", "Learning set không hợp lệ.", 409);
    }
    if (result.state !== "available") {
      return apiError("INTERNAL_ERROR", "Không thể tạo learning set.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    if ((error as Error).message === "CONTENT_INVALID") {
      return apiError("CONTENT_INVALID", "Nội dung learning set không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tạo learning set.", 500);
  }
}
