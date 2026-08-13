"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";

type TvState = "loading" | "pairing" | "paired" | "displaying";

function getScreenMetadata() {
  if (typeof window === "undefined") return null;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.round((window.screen?.width || window.innerWidth) * (dpr > 1 ? dpr : 1));
  const height = Math.round((window.screen?.height || window.innerHeight) * (dpr > 1 ? dpr : 1));
  const orientation = width >= height ? "Landscape" : "Portrait";

  // Greatest common divisor
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const divisor = gcd(width, height);
  const ratioW = Math.round(width / divisor);
  const ratioH = Math.round(height / divisor);

  // Common standard ratios for clean display
  const dec = width / height;
  let standardRatio = `${ratioW}:${ratioH}`;
  if (Math.abs(dec - 16 / 9) < 0.05) standardRatio = "16:9";
  else if (Math.abs(dec - 9 / 16) < 0.05) standardRatio = "9:16";
  else if (Math.abs(dec - 4 / 3) < 0.05) standardRatio = "4:3";
  else if (Math.abs(dec - 3 / 4) < 0.05) standardRatio = "3:4";
  else if (Math.abs(dec - 16 / 10) < 0.05) standardRatio = "16:10";
  else if (Math.abs(dec - 21 / 9) < 0.05) standardRatio = "21:9";

  return {
    screen_width: width,
    screen_height: height,
    aspect_ratio: standardRatio,
    orientation,
  };
}

export default function TvPage() {
  const [state, setState] = useState<TvState>("loading");
  const [pairingCode, setPairingCode] = useState("");
  const [tvId, setTvId] = useState("");
  const [tvName, setTvName] = useState("My TV");
  const [menuUrl, setMenuUrl] = useState("");
  const [isFading, setIsFading] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pairUrl = `${appUrl}/pair?code=${pairingCode}`;

  // Step 1: Initialize pairing code
  useEffect(() => {
    async function initTv() {
      try {
        const res = await fetch("/api/tv/init", { method: "POST" });
        const data = await res.json();
        setPairingCode(data.pairing_code);
        setState("pairing");
      } catch (err) {
        console.error("Failed to init TV:", err);
      }
    }
    initTv();
  }, []);

  // Step 2: Listen for pairing event (Realtime + fallback polling)
  useEffect(() => {
    if (!pairingCode || state !== "pairing") return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Supabase Realtime broadcast listener
    const pairingChannel = supabase
      .channel(`pairing:${pairingCode}`)
      .on("broadcast", { event: "tv:paired" }, (payload) => {
        const { tv_id, name } = payload.payload as { tv_id: string; name?: string };
        setTvId(tv_id);
        if (name) setTvName(name);
        setState("paired");
      })
      .subscribe();

    // 2. Fallback polling every 2s
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/status?code=${encodeURIComponent(pairingCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paired && data.tv_id) {
            setTvId(data.tv_id);
            if (data.name) setTvName(data.name);
            if (data.current_menu_url) {
              setMenuUrl(data.current_menu_url);
              setState("displaying");
            } else {
              setState("paired");
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(pairingChannel);
    };
  }, [pairingCode, state]);

  // Step 3: When tvId is known, report screen metadata (resolution, aspect ratio, orientation)
  useEffect(() => {
    if (!tvId) return;

    const meta = getScreenMetadata();
    if (!meta) return;

    fetch("/api/tv/screen-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tv_id: tvId,
        ...meta,
      }),
    }).catch((err) => console.error("Error reporting screen info:", err));
  }, [tvId]);

  // Step 4: Listen for menu pushes once paired (Realtime + fallback polling)
  useEffect(() => {
    if (!tvId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Supabase Realtime broadcast listener for menu:push
    const tvChannel = supabase
      .channel(`tv:${tvId}`)
      .on("broadcast", { event: "menu:push" }, (payload) => {
        const { image_url } = payload.payload as { image_url: string };
        if (image_url) {
          setIsFading(true);
          setTimeout(() => {
            setMenuUrl(image_url);
            setIsFading(false);
            setState("displaying");
          }, 300);
        }
      })
      .subscribe();

    // 2. Fallback polling for menu updates every 3s
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/status?tv_id=${encodeURIComponent(tvId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.current_menu_url && data.current_menu_url !== menuUrl) {
            setIsFading(true);
            setTimeout(() => {
              setMenuUrl(data.current_menu_url);
              setIsFading(false);
              setState("displaying");
            }, 300);
          }
        }
      } catch (err) {
        console.error("Menu poll error:", err);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(tvChannel);
    };
  }, [tvId, menuUrl]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="size-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // State 1: Pairing screen with QR code
  if (state === "pairing") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 select-none">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs uppercase tracking-widest text-neutral-300 font-semibold mb-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            MenuCast TV Display
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pair this TV to your account</h1>
          <p className="text-neutral-400 text-base">Scan the QR code with your phone camera to connect</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-2xl transition-transform hover:scale-105 duration-300">
          <QRCodeSVG value={pairUrl} size={220} level="M" />
        </div>

        <div className="text-center space-y-3 mt-8">
          <p className="text-sm text-neutral-500">Or visit <span className="text-neutral-300 font-mono">{appUrl}/pair</span> and enter:</p>
          <div className="bg-white/5 border border-white/15 rounded-2xl px-8 py-3 inline-block">
            <span className="text-3xl md:text-4xl font-black tracking-[0.2em] font-mono text-emerald-400">{pairingCode}</span>
          </div>
        </div>
      </div>
    );
  }

  // State 2: TV Paired confirmation screen (awaiting first push from Figma)
  if (state === "paired" && !menuUrl) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 select-none">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="size-20 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg className="size-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">TV Paired!</h1>
            <p className="text-lg text-emerald-400 font-medium">{tvName}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Next Step</p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Open the <strong>MenuCast Figma Plugin</strong>, select your menu design frame, and click <span className="text-white font-semibold">"Push Current Frame to TV"</span>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            Listening for live updates from Figma…
          </div>
        </div>
      </div>
    );
  }

  // State 3: Displaying live menu image
  return (
    <div className="min-h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      {menuUrl && (
        <img
          key={menuUrl}
          src={menuUrl}
          alt="Restaurant Menu"
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
    </div>
  );
}
