import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pairing_code, tv_name } = await req.json();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find the unpaired TV
  const { data: tv, error: findError } = await supabase
    .from("tvs")
    .select("*")
    .eq("pairing_code", pairing_code)
    .is("paired_at", null)
    .single();

  if (findError || !tv) {
    return NextResponse.json({ error: "Invalid or already used pairing code" }, { status: 404 });
  }

  // Claim the TV
  const { data: paired, error: pairError } = await supabase
    .from("tvs")
    .update({
      user_id: session.user.id,
      paired_at: new Date().toISOString(),
      name: tv_name || "My TV",
    })
    .eq("id", tv.id)
    .select()
    .single();

  if (pairError) {
    return NextResponse.json({ error: pairError.message }, { status: 500 });
  }

  // Broadcast to TV client so it knows it's been paired
  await supabase.channel(`pairing:${pairing_code}`).send({
    type: "broadcast",
    event: "tv:paired",
    payload: { tv_id: tv.id },
  });

  return NextResponse.json({ tv: paired });
}
