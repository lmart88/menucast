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
        channel.send({
          type: "broadcast",
          event,
          payload,
        }).then(() => {
          setTimeout(() => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve();
          }, 200);
        }).catch(() => {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve();
        });
      }
    });
  });
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const publicMarker = "/storage/v1/object/public/menus/";
    const publicIdx = url.indexOf(publicMarker);
    if (publicIdx !== -1) {
      return decodeURIComponent(url.substring(publicIdx + publicMarker.length));
    }
    const signMarker = "/storage/v1/object/sign/menus/";
    const signIdx = url.indexOf(signMarker);
    if (signIdx !== -1) {
      const rawPath = url.substring(signIdx + signMarker.length).split("?")[0];
      return decodeURIComponent(rawPath);
    }
    const match = url.match(/\/menus\/(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].split("?")[0]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
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

  const { tv_id, image_url, menu_mode = "static", menu_data = null } = await req.json();

  if (!tv_id || !image_url) {
    return NextResponse.json({ error: "tv_id and image_url are required" }, { status: 400 });
  }

  // Verify TV belongs to user and get previous menu URL for storage pruning
  const { data: tv, error: tvError } = await supabase
    .from("tvs")
    .select("id, pairing_code, current_menu_url")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (tvError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // Record the push
  let menu: any = null;
  const { data: menuInsert, error: menuError } = await supabase
    .from("menus")
    .insert({
      tv_id,
      image_url,
      menu_mode,
      menu_data,
      pushed_by: userId,
    })
    .select()
    .single();

  if (menuError) {
    if (menuError.message?.includes("schema cache") || menuError.message?.includes("menu_data") || menuError.message?.includes("menu_mode")) {
      // Fallback insert if columns not yet added to menus table
      const fallback = await supabase
        .from("menus")
        .insert({ tv_id, image_url, pushed_by: userId })
        .select()
        .single();
      menu = fallback.data;
    } else {
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }
  } else {
    menu = menuInsert;
  }

  // Update TV's current menu (with fallback if columns not yet in tvs table)
  const { error: tvUpdateError } = await supabase
    .from("tvs")
    .update({
      current_menu_url: image_url,
      menu_mode,
      menu_data,
    })
    .eq("id", tv_id);

  if (tvUpdateError && (tvUpdateError.message?.includes("schema cache") || tvUpdateError.message?.includes("menu_data"))) {
    await supabase
      .from("tvs")
      .update({ current_menu_url: image_url })
      .eq("id", tv_id);
  }

  // 🔴 Broadcast to TV via Supabase Realtime channel
  await broadcastEvent(supabase, `tv:${tv_id}`, "menu:push", {
    image_url,
    menu_mode,
    menu_data,
    menu_id: menu?.id,
    pushed_at: menu?.pushed_at || new Date().toISOString(),
  });

  // Storage optimization: Clean up replaced previous menu image from storage bucket
  if (tv.current_menu_url && tv.current_menu_url !== image_url) {
    const oldPath = extractStoragePath(tv.current_menu_url);
    if (oldPath) {
      supabase.storage
        .from("menus")
        .remove([oldPath])
        .catch((err) => console.warn("Failed to prune replaced menu image from storage:", err));
    }
  }

  return NextResponse.json({ success: true, menu });
}
