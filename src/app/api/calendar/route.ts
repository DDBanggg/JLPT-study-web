import { getAuthenticatedContext } from "@/lib/auth/session";
import { getCalendarMonth, parseCalendarMonth } from "@/lib/calendar/calendar";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const month = parseCalendarMonth(new URL(request.url).searchParams.get("month"));
  if (!month) return apiError("INVALID_INPUT", "Tháng phải có định dạng YYYY-MM.", 400, "month");

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const result = await getCalendarMonth(context.supabase, context.user.id, month);
    if (result.state === "program_not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (result.state === "roadmap_pending") {
      return apiError("CONTENT_PENDING", "Roadmap chưa được chuẩn bị.", 503);
    }
    if (result.state === "database_error") {
      return apiError("INTERNAL_ERROR", "Không thể tải Calendar.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("INVALID")) {
      return apiError("CONTENT_INVALID", "Dữ liệu Calendar không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể tải Calendar.", 500);
  }
}
