import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  const { tv_id, screen_width, screen_height, aspect_ratio, orientation } = await req.json();

  if (!tv_id) {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date().toISOString();
  let { data, error } = await supabase
    .from("tvs")
    .update({
      screen_width: Number(screen_width) || null,
      screen_height: Number(screen_height) || null,
      aspect_ratio: aspect_ratio || null,
      orientation: orientation || null,
      last_seen_at: now,
    })
    .eq("id", tv_id)
    .select()
    .single();

  if (error && (error.message?.includes("last_seen_at") || error.code === "PGRST204")) {
    const res = await supabase
      .from("tvs")
      .update({
        screen_width: Number(screen_width) || null,
        screen_height: Number(screen_height) || null,
        aspect_ratio: aspect_ratio || null,
        orientation: orientation || null,
      })
      .eq("id", tv_id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, tv: data });
}
