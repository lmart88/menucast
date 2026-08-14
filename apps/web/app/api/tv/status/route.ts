import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const tvId = searchParams.get("tv_id");

  if (!code && !tvId) {
    return NextResponse.json({ error: "code or tv_id is required" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase.from("tvs").select("id, name, pairing_code, paired_at, current_menu_url, menu_mode, menu_data");

  if (tvId) {
    query = query.eq("id", tvId);
  } else if (code) {
    query = query.eq("pairing_code", code);
  }

  const { data: tv, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tv) {
    return NextResponse.json({ paired: false, tv: null });
  }

  return NextResponse.json({
    paired: !!tv.paired_at,
    tv_id: tv.id,
    name: tv.name,
    current_menu_url: tv.current_menu_url,
    menu_mode: tv.menu_mode || "static",
    menu_data: tv.menu_data || null,
  });
}
