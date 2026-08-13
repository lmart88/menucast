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
    .select("id")
    .eq("pairing_code", pairing_code)
    .single();

  let tv;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("tvs")
      .update({
        user_id: session.user.id,
        paired_at: new Date().toISOString(),
        name: tv_name || "My TV",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    tv = updated;
  } else {
    const { data: created, error: createError } = await supabase
      .from("tvs")
      .insert({
        user_id: session.user.id,
        pairing_code: pairing_code,
        paired_at: new Date().toISOString(),
        name: tv_name || "My TV",
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    tv = created;
  }

  // Broadcast to TV client so it transitions from pairing → paired
  await broadcastEvent(supabase, `pairing:${pairing_code}`, "tv:paired", {
    tv_id: tv.id,
    name: tv.name,
  });

  return NextResponse.json({ tv });
}
