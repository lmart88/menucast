import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export { type Database, type Json } from "./types";

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey);
}

export function createSupabaseAdminClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Re-export for convenience
export { createClient } from "@supabase/supabase-js";
