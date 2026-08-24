import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/auth-helper";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { tv_id } = body || {};

  if (!tv_id || typeof tv_id !== "string") {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tvs")
    .update({ last_seen_at: now })
    .eq("id", tv_id);

  if (error) {
    // If migration hasn't been executed on remote Supabase DB yet, handle gracefully
    if (error.message?.includes("last_seen_at") || error.code === "PGRST204") {
      return NextResponse.json({ success: true, last_seen_at: now, warning: "migration_pending" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, last_seen_at: now });
}
