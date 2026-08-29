import type { SupabaseClient } from "@supabase/supabase-js";

import { PROGRAM_ID } from "./program-constants";

export async function hasConfiguredProgram(
  supabase: SupabaseClient,
  userId: string,
): Promise<"configured" | "not_configured" | "error"> {
  const { data, error } = await supabase
    .from("user_programs")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", PROGRAM_ID)
    .maybeSingle();

  if (error) return "error";
  return data ? "configured" : "not_configured";
}
