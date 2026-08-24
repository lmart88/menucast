import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getAuthenticatedUser } from "@/lib/auth-helper";
import type { Database } from "@menucast/supabase";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { tv_id, name } = body || {};

  if (!tv_id || typeof tv_id !== "string") {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  // Verify ownership
  const { data: existingTv, error: findError } = await supabase
    .from("tvs")
    .select("id")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (findError || !existingTv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  type TvUpdate = Database["public"]["Tables"]["tvs"]["Update"];
  const updates: TvUpdate = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "TV name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  const { data: updatedTv, error: updateError } = await supabase
    .from("tvs")
    .update(updates)
    .eq("id", tv_id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updatedTv) {
    return NextResponse.json({ error: updateError?.message || "Failed to update TV" }, { status: 500 });
  }

  return NextResponse.json({ success: true, tv: updatedTv });
}
