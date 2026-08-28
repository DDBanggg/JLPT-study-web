import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError("INTERNAL_ERROR", "Không thể đăng xuất.", 500);
    }

    return apiSuccess({ redirect_to: "/login" });
  } catch {
    return apiError("INTERNAL_ERROR", "Dịch vụ đăng nhập chưa sẵn sàng.", 500);
  }
}
