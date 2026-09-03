import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pairing_code, tv_name } = await req.json();

  if (!pairing_code) {
    return NextResponse.json({ error: "pairing_code is required" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if TV with this code exists
  const { data: existing } = await supabase
    .from("tvs")
    .select("id, user_id, name")
    .eq("pairing_code", pairing_code)
    .single();

  const isAlreadyOwned = existing && existing.user_id === session.user.id;

  // Enforce screen pairing limit during testing
  const maxScreensEnv = process.env.MAX_PAIRED_SCREENS_PER_USER;
  const maxScreens = maxScreensEnv ? parseInt(maxScreensEnv, 10) : 1;

  if (!isAlreadyOwned && Number.isFinite(maxScreens) && maxScreens > 0) {
    const { data: userTvs, count: activeCount } = await supabase
      .from("tvs")
      .select("id, name", { count: "exact" })
      .eq("user_id", session.user.id)
      .not("paired_at", "is", null);

    if ((activeCount ?? 0) >= maxScreens) {
      const existingName = userTvs?.[0]?.name ? `"${userTvs[0].name}"` : "your existing screen";
      return NextResponse.json(
        {
          error: `Screen limit reached (maximum ${maxScreens} screen${maxScreens > 1 ? "s" : ""} allowed during testing). Please unpair or delete ${existingName} from your dashboard before pairing a new one.`,
          code: "SCREEN_LIMIT_REACHED",
          max_screens: maxScreens,
          active_count: activeCount,
        },
        { status: 403 }
      );
    }
  }

  let tv;
  const now = new Date().toISOString();

  if (existing) {
    let { data: updated, error: updateError } = await supabase
      .from("tvs")
      .update({
        user_id: session.user.id,
        paired_at: now,
        last_seen_at: now,
        name: tv_name || "My TV",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError && (updateError.message?.includes("last_seen_at") || updateError.code === "PGRST204")) {
      const res = await supabase
        .from("tvs")
        .update({
          user_id: session.user.id,
          paired_at: now,
          name: tv_name || "My TV",
        })
        .eq("id", existing.id)
        .select()
        .single();
      updated = res.data;
      updateError = res.error;
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    tv = updated;
  } else {
    let { data: created, error: createError } = await supabase
      .from("tvs")
      .insert({
        user_id: session.user.id,
        pairing_code: pairing_code,
        paired_at: now,
        last_seen_at: now,
        name: tv_name || "My TV",
      })
      .select()
      .single();

    if (createError && (createError.message?.includes("last_seen_at") || createError.code === "PGRST204")) {
      const res = await supabase
        .from("tvs")
        .insert({
          user_id: session.user.id,
          pairing_code: pairing_code,
          paired_at: now,
          name: tv_name || "My TV",
        })
        .select()
        .single();
      created = res.data;
      createError = res.error;
    }

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message || "Failed to create TV record" }, { status: 500 });
    }
    tv = created;
  }

  if (!tv) {
    return NextResponse.json({ error: "Failed to pair TV" }, { status: 500 });
  }

  // Broadcast to TV client so it transitions from pairing → paired
  await broadcastEvent(supabase, `pairing:${pairing_code}`, "tv:paired", {
    tv_id: tv.id,
    name: tv.name,
  });

  return NextResponse.json({ tv });
}
