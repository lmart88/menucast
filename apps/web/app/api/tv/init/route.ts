import { NextResponse } from "next/server";

function generatePairingCode(): string {
  const words = ["PINE", "BARK", "LEAF", "OAK", "FERN", "MOSS", "REED", "SAGE"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// TV calls this on load to get a pairing code.
// We DON'T insert into DB here — the record is created when paired (/api/tv/pair).
// The TV subscribes to Supabase Realtime on `pairing:{code}` to detect pairing.
export async function POST() {
  const pairingCode = generatePairingCode();

  return NextResponse.json({
    pairing_code: pairingCode,
    // tv_id is assigned after pairing — TV gets it via Realtime broadcast
  });
}
