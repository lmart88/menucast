"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";

type TvState = "loading" | "pairing" | "paired" | "displaying";

export default function TvPage() {
  const [state, setState] = useState<TvState>("loading");
  const [pairingCode, setPairingCode] = useState("");
  const [tvId, setTvId] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [prevMenuUrl, setPrevMenuUrl] = useState("");
  const [isFading, setIsFading] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pairUrl = `${appUrl}/pair?code=${pairingCode}`;

  useEffect(() => {
    async function initTv() {
      const res = await fetch("/api/tv/init", { method: "POST" });
      const data = await res.json();
      setPairingCode(data.pairing_code);
      setTvId(data.tv_id);
      setState("pairing");
    }
    initTv();
  }, []);

  useEffect(() => {
    if (!tvId || !pairingCode) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Listen for pairing confirmation
    const pairingChannel = supabase
      .channel(`pairing:${pairingCode}`)
      .on("broadcast", { event: "tv:paired" }, () => {
        setState("paired");
        setTimeout(() => setState("displaying"), 2000);
      })
      .subscribe();

    // Listen for menu pushes
    const tvChannel = supabase
      .channel(`tv:${tvId}`)
      .on("broadcast", { event: "menu:push" }, (payload) => {
        const { image_url } = payload.payload as { image_url: string };
        setPrevMenuUrl((prev) => prev || image_url);
        setIsFading(true);
        setTimeout(() => {
          setMenuUrl(image_url);
          setPrevMenuUrl("");
          setIsFading(false);
          setState("displaying");
        }, 600);
      })
      .subscribe();

    channelRef.current = tvChannel;

    return () => {
      supabase.removeChannel(pairingChannel);
      supabase.removeChannel(tvChannel);
    };
  }, [tvId, pairingCode]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "pairing") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-12">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-500 uppercase tracking-widest font-medium">MenuCast</p>
          <h1 className="text-2xl font-semibold">Pair this TV to your account</h1>
          <p className="text-neutral-400">Scan the QR code or visit the URL below</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-2xl">
          <QRCodeSVG value={pairUrl} size={200} />
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-neutral-500">Or enter this code at menucast.app/pair</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4">
            <span className="text-4xl font-bold tracking-[0.15em] font-mono">{pairingCode}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 absolute bottom-8">
          menucast.app/tv · {tvId}
        </p>
      </div>
    );
  }

  if (state === "paired") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold">TV Paired!</h1>
        <p className="text-neutral-400">Waiting for your first menu push from Figma…</p>
      </div>
    );
  }

  // Displaying menu
  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {menuUrl && (
        <img
          src={menuUrl}
          alt="Restaurant menu"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-600 ${isFading ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {!menuUrl && (
        <div className="flex items-center justify-center h-full text-neutral-600 text-lg">
          Waiting for menu push…
        </div>
      )}
    </div>
  );
}
