import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generatePairingCode(): string {
  const words = ["PINE", "BARK", "LEAF", "OAK", "FERN", "MOSS", "REED", "SAGE"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// TV calls this on load to get a pairing code.
// The TV record is created upon pairing (/api/tv/pair) and reports screen dimensions (/api/tv/screen-info).
export async function POST() {
  const pairingCode = generatePairingCode();

  return NextResponse.json({
    pairing_code: pairingCode,
  });
}
