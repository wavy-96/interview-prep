import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let client = null;
/**
 * Returns a shared Supabase service-role client singleton.
 * Returns null if the required env vars are missing.
 */
export function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)
        return null;
    if (!client) {
        client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
    return client;
}
