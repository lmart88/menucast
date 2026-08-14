import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@menucast/supabase";

async function broadcastEvent(
  supabase: ReturnType<typeof createClient<Database>>,
  channelName: string,
  event: string,
  payload: Record<string, unknown>
) {
  return new Promise<void>((resolve) => {
    const channel = supabase.channel(channelName);
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      resolve();
    }, 2000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({
            type: "broadcast",
            event,
            payload,
          })
          .then(() => {
            setTimeout(() => {
              clearTimeout(timeout);
              supabase.removeChannel(channel);
              resolve();
            }, 200);
          })
          .catch(() => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve();
          });
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tv_id, menu_data } = await req.json();

  if (!tv_id || !menu_data) {
    return NextResponse.json({ error: "tv_id and menu_data are required" }, { status: 400 });
  }

  // Verify TV belongs to user
  const { data: tv, error: tvError } = await supabase
    .from("tvs")
    .select("id, menu_mode")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (tvError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // Update TV menu_data if column exists
  const { error: updateError } = await supabase
    .from("tvs")
    .update({
      menu_data: menu_data as Json,
    })
    .eq("id", tv_id);

  if (updateError && !updateError.message?.includes("schema cache") && !updateError.message?.includes("menu_data")) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Broadcast real-time text/price update event to TV
  await broadcastEvent(supabase, `tv:${tv_id}`, "menu:data-update", {
    menu_data,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, menu_data });
}
