import { getAuthenticatedContext } from "@/lib/auth/session";
import { getLearnDay } from "@/lib/learn/learn-state";
import { parseLearnType } from "@/lib/learn/content";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import { parseStudyDay } from "@/lib/roadmap/program-roadmap";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; day: string }> },
) {
  const values = await params;
  const type = parseLearnType(values.type);
  if (!type) return apiError("INVALID_INPUT", "Loại nội dung học không hợp lệ.", 400, "type");
  const studyDay = parseStudyDay(values.day);
  if (studyDay === null) {
    return apiError("INVALID_STUDY_DAY", "Study Day phải từ 1 đến 100.", 400, "day");
  }

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể tải nội dung học.", 500);

    const result = await getLearnDay(context.supabase, context.user.id, type, studyDay);
    if (result.state === "database_error") {
      return apiError("INTERNAL_ERROR", "Không thể tải trạng thái học.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    if ((error as Error).message === "CONTENT_INVALID") {
      return apiError("CONTENT_INVALID", "Nội dung học không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tải nội dung học.", 500);
  }
}
