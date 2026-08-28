import { toInternalAuthEmail } from "@/lib/auth/login-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, readJsonObject } from "@/lib/utils/api-response";

const INVALID_CREDENTIALS_MESSAGE = "Login ID hoặc mật khẩu không đúng.";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const loginId = body?.login_id;
  const password = body?.password;

  if (typeof loginId !== "string" || typeof password !== "string" || password.length === 0) {
    return apiError("INVALID_INPUT", "Login ID và mật khẩu là bắt buộc.", 400);
  }

  const domain = process.env.AUTH_LOGIN_DOMAIN;
  if (!domain) {
    return apiError("INTERNAL_ERROR", "Cấu hình đăng nhập chưa sẵn sàng.", 500);
  }

  let email: string;
  try {
    email = toInternalAuthEmail(loginId, domain);
  } catch {
    // Invalid IDs deliberately use the same response as a failed password.
    return apiError("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE, 401);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return apiError("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE, 401);
    }

    const { data: program, error: programError } = await supabase
      .from("user_programs")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (programError) {
      await supabase.auth.signOut();
      return apiError("INTERNAL_ERROR", "Không thể kiểm tra chương trình học.", 500);
    }

    const needsSetup = program === null;
    return apiSuccess({
      needs_setup: needsSetup,
      redirect_to: needsSetup ? "/setup" : "/schedule",
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Dịch vụ đăng nhập chưa sẵn sàng.", 500);
  }
}
