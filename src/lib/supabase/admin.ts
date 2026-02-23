import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for internal/admin operations.
 * Bypasses RLS. Use only in trusted server contexts (e.g. internal APIs).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for admin client");
  }
  return createClient(url, key);
}
