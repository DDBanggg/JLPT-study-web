import { getAuthenticatedContext } from "@/lib/auth/session";
import { parseIsoDate, projectedDay100Date } from "@/lib/progress/program-dates";
import {
  deriveProgramData,
  getCompletedStudyDayCount,
  PROGRAM_ID,
} from "@/lib/progress/program";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";

type ProgramRow = {
  program_id: string;
  progress_start_date: string;
  exam_date: string;
};

export async function GET() {
  let context;
  try {
    context = await getAuthenticatedContext();
  } catch {
    return apiError("INTERNAL_ERROR", "Dịch vụ chương trình chưa sẵn sàng.", 500);
  }
  if (!context) {
    return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
  }

  const { data, error } = await context.supabase
    .from("user_programs")
    .select("program_id,progress_start_date,exam_date")
    .eq("user_id", context.user.id)
    .eq("program_id", PROGRAM_ID)
    .maybeSingle();

  if (error) {
    return apiError("INTERNAL_ERROR", "Không thể tải chương trình học.", 500);
  }

  if (!data) {
    return apiSuccess({ configured: false, program: null });
  }

  const completed = await getCompletedStudyDayCount(context.supabase, context.user.id);
  if (completed.state === "pending") {
    return apiSuccess({
      configured: true,
      roadmap_state: "pending",
      program: deriveProgramData(data as ProgramRow, 0),
    });
  }
  if (completed.state === "error") {
    return apiError("INTERNAL_ERROR", "Không thể tính tiến độ chương trình.", 500);
  }

  return apiSuccess({
    configured: true,
    program: deriveProgramData(data as ProgramRow, completed.count),
  });
}

export async function POST(request: Request) {
  let context;
  try {
    context = await getAuthenticatedContext();
  } catch {
    return apiError("INTERNAL_ERROR", "Dịch vụ chương trình chưa sẵn sàng.", 500);
  }
  if (!context) {
    return apiError("AUTH_REQUIRED", "Bạn cần đăng nhập.", 401);
  }

  const body = await readJsonObject(request);
  const progressStartDate = body?.progress_start_date;
  const examDate = body?.exam_date;

  if (typeof progressStartDate !== "string" || !parseIsoDate(progressStartDate)) {
    return apiError("INVALID_INPUT", "Ngày bắt đầu không hợp lệ.", 400, "progress_start_date");
  }
  if (typeof examDate !== "string" || !parseIsoDate(examDate)) {
    return apiError("INVALID_INPUT", "Ngày thi không hợp lệ.", 400, "exam_date");
  }
  if (examDate < progressStartDate) {
    return apiError("INVALID_INPUT", "Ngày thi phải từ ngày bắt đầu trở đi.", 400, "exam_date");
  }

  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("user_programs")
    .select("id")
    .eq("user_id", context.user.id)
    .eq("program_id", PROGRAM_ID)
    .maybeSingle();

  if (existingError) {
    return apiError("INTERNAL_ERROR", "Không thể kiểm tra chương trình học.", 500);
  }
  if (existing) {
    return apiError("PROGRAM_ALREADY_CONFIGURED", "Chương trình học đã được thiết lập.", 409);
  }

  const row: ProgramRow = {
    program_id: PROGRAM_ID,
    progress_start_date: progressStartDate,
    exam_date: examDate,
  };
  const { error: insertError } = await admin.from("user_programs").insert({
    user_id: context.user.id,
    ...row,
  });

  if (insertError?.code === "23505") {
    return apiError("PROGRAM_ALREADY_CONFIGURED", "Chương trình học đã được thiết lập.", 409);
  }
  if (insertError) {
    return apiError("INTERNAL_ERROR", "Không thể lưu chương trình học.", 500);
  }

  const warningCode = projectedDay100Date(progressStartDate) > examDate
    ? "DAY_100_AFTER_EXAM"
    : null;

  return apiSuccess({
    configured: true,
    program: deriveProgramData(row, 0),
    warning_code: warningCode,
  });
}
