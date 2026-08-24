import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getUserFromToken(
  token: string,
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data } = await supabase
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .single();

  if (data?.user_id) {
    // Update last_used_at timestamp asynchronously
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
    return data.user_id;
  }

  return null;
}

/**
 * Authenticates request using either:
 * 1. Bearer API Token (Authorization: Bearer <TOKEN>)
 * 2. NextAuth Session Cookie
 */
export async function getAuthenticatedUser(
  req: NextRequest,
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const userId = await getUserFromToken(token, supabase);
      if (userId) return userId;
    }
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
