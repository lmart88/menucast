import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

function generatePairingCode(): string {
  const words = ["PINE", "BARK", "LEAF", "OAK", "FERN", "MOSS", "REED", "SAGE"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

export async function POST() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Generate a unique pairing code (retry on collision)
  let pairingCode = "";
  let attempts = 0;
  while (attempts < 5) {
    pairingCode = generatePairingCode();
    const { data } = await supabase
      .from("tvs")
      .select("id")
      .eq("pairing_code", pairingCode)
      .single();
    if (!data) break; // code is unique
    attempts++;
  }

  // Create an unpaired TV record
  const { data: tv, error } = await supabase
    .from("tvs")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000", // placeholder until paired
      pairing_code: pairingCode,
      name: "New TV",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tv_id: tv.id, pairing_code: tv.pairing_code });
}
