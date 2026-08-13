import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tv_id } = await req.json();

  if (!tv_id) {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify ownership
  const { data: tv, error: findError } = await supabase
    .from("tvs")
    .select("id, pairing_code")
    .eq("id", tv_id)
    .eq("user_id", session.user.id)
    .single();

  if (findError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // Delete TV (menus cascade automatically)
  const { error: deleteError } = await supabase
    .from("tvs")
    .delete()
    .eq("id", tv_id)
    .eq("user_id", session.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted_id: tv_id });
}
