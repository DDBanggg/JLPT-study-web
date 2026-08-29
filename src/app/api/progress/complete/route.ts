import { getAuthenticatedContext } from "@/lib/auth/session";
import { completeLearnTask, parseLearnTaskType } from "@/lib/progress/learn-progress";
import { hasConfiguredProgram } from "@/lib/progress/program-access";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const studyDay = body?.study_day;
  const taskType = parseLearnTaskType(body?.task_type);
  const taskId = body?.task_id;
  if (!Number.isInteger(studyDay) || (studyDay as number) < 1 || (studyDay as number) > 100) {
    return apiError("INVALID_STUDY_DAY", "Study Day phải từ 1 đến 100.", 400, "study_day");
  }
  if (!taskType) return apiError("INVALID_INPUT", "Task type không hợp lệ.", 400, "task_type");
  if (typeof taskId !== "string" || taskId.length < 1) {
    return apiError("INVALID_INPUT", "Task ID không hợp lệ.", 400, "task_id");
  }

  try {
    const context = await getAuthenticatedContext();
    if (!context) return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
    const program = await hasConfiguredProgram(context.supabase, context.user.id);
    if (program === "not_configured") {
      return apiError("PROGRAM_NOT_CONFIGURED", "Bạn chưa thiết lập chương trình học.", 409);
    }
    if (program === "error") return apiError("INTERNAL_ERROR", "Không thể lưu hoàn thành.", 500);

    const result = await completeLearnTask(
      context.supabase,
      context.user.id,
      studyDay as number,
      taskType,
      taskId,
    );
    if (result.state === "content_pending") {
      return apiError("CONTENT_PENDING", "Nội dung task chưa được chuẩn bị.", 409);
    }
    if (result.state === "item_not_found") {
      return apiError("ITEM_NOT_FOUND", "Không tìm thấy item cần hoàn thành.", 404, "task_id");
    }
    if (result.state === "task_not_found") {
      return apiError("TASK_NOT_FOUND", "Task không thuộc roadmap ngày này.", 404, "task_id");
    }
    if (result.state !== "available") {
      return apiError("INTERNAL_ERROR", "Không thể lưu hoàn thành.", 500);
    }
    return apiSuccess(result.data);
  } catch (error) {
    if ((error as Error).message === "CONTENT_INVALID") {
      return apiError("CONTENT_INVALID", "Nội dung task không hợp lệ.", 500);
    }
    return apiError("INTERNAL_ERROR", "Không thể lưu hoàn thành.", 500);
  }
}
