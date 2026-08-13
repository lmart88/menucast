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
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
  }
  return data?.user_id ?? null;
}

export async function POST(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    userId = await getUserFromToken(authHeader.slice(7), supabase);
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tv_id, image_url } = await req.json();

  // Verify TV belongs to user
  const { data: tv, error: tvError } = await supabase
    .from("tvs")
    .select("id, pairing_code")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (tvError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // Record the push
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .insert({ tv_id, image_url, pushed_by: userId })
    .select()
    .single();

  if (menuError) {
    return NextResponse.json({ error: menuError.message }, { status: 500 });
  }

  // Update TV's current menu
  await supabase
    .from("tvs")
    .update({ current_menu_url: image_url })
    .eq("id", tv_id);

  // 🔴 Broadcast to TV via Supabase Realtime
  await supabase.channel(`tv:${tv_id}`).send({
    type: "broadcast",
    event: "menu:push",
    payload: { image_url, menu_id: menu.id, pushed_at: menu.pushed_at },
  });

  return NextResponse.json({ success: true, menu });
}
