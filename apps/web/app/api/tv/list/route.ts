import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

async function getUserFromToken(token: string, supabase: ReturnType<typeof createClient<Database>>) {
  const { data } = await supabase
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .single();

  if (data) {
    // Update last_used_at
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
  }

  return data?.user_id ?? null;
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Support both session auth (dashboard) and API token auth (Figma plugin)
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    userId = await getUserFromToken(token, supabase);
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tvs, error } = await supabase
    .from("tvs")
    .select("*, menus(*)")
    .eq("user_id", userId)
    .not("paired_at", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ tvs });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
