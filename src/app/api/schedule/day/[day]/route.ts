import { getAuthenticatedContext } from "@/lib/auth/session";
import { RoadmapInvalidError, parseStudyDay } from "@/lib/roadmap/program-roadmap";
import { getScheduleDay } from "@/lib/schedule/schedule";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { day: rawDay } = await params;
  const studyDay = parseStudyDay(rawDay);
  if (studyDay === null) {
    return apiError("INVALID_STUDY_DAY", "Study Day phải từ 1 đến 100.", 400, "day");
  }

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);

    const result = await getScheduleDay(context.supabase, context.user.id, studyDay);
    if (result.state === "program_not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (result.state === "roadmap_pending") {
      return apiError("CONTENT_PENDING", "Roadmap chương trình chưa được chuẩn bị.", 503);
    }
    if (result.state === "database_error") {
      return apiError("INTERNAL_ERROR", "Không thể tải lịch học.", 500);
    }

    return apiSuccess(result.data);
  } catch (error) {
    if (error instanceof RoadmapInvalidError || (error as Error).message === "CONTENT_INVALID") {
      return apiError("CONTENT_INVALID", "Nội dung lịch học không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tải lịch học.", 500);
  }
}
