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

  const { tv_id } = await req.json();

  if (!tv_id) {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  // Verify TV ownership
  const { data: tv, error: findError } = await supabase
    .from("tvs")
    .select("id, current_menu_url")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (findError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // Optional: delete image from storage
  if (tv.current_menu_url) {
    const storagePath = extractStoragePath(tv.current_menu_url);
    if (storagePath) {
      try {
        await supabase.storage.from("menus").remove([storagePath]);
      } catch (err) {
        console.error("Failed to delete storage file:", err);
      }
    }
  }

  // Update TV row in DB
  const { error: updateError } = await supabase
    .from("tvs")
    .update({
      current_menu_url: null,
      menu_mode: "static",
      menu_data: null,
    })
    .eq("id", tv_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Broadcast clear events to TV
  await broadcastEvent(supabase, `tv:${tv_id}`, "menu:clear", { tv_id });
  await broadcastEvent(supabase, `tv:${tv_id}`, "menu:push", {
    image_url: "",
    menu_mode: "static",
    menu_data: null,
    pushed_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
