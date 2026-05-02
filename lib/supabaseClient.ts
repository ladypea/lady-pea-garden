import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function getSupabaseClient() {
  return createClientComponentClient();
}
