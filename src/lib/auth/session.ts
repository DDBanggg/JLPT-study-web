import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
};

export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}
