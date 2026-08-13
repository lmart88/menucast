"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { Database } from "@menucast/supabase";

type TV = Database["public"]["Tables"]["tvs"]["Row"] & {
  menus: Database["public"]["Tables"]["menus"]["Row"][];
};

interface Props {
  initialTvs: TV[];
  hasToken: boolean;
  userName: string;
}

export default function DashboardClient({ initialTvs, hasToken, userName }: Props) {
  const [tvs] = useState<TV[]>(initialTvs);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateToken() {
    setTokenLoading(true);
    const res = await fetch("/api/token", { method: "POST" });
    const data = await res.json();
    setToken(data.token);
    setTokenLoading(false);
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-base font-semibold tracking-tight">MenuCast</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-neutral-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your TVs</h1>
          <Link
            href="/tv"
            target="_blank"
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            + Pair New TV
          </Link>
        </div>

        {/* TV list */}
        {tvs.length === 0 ? (
          <div className="border border-white/10 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">📺</span>
            <h2 className="text-lg font-medium">No TVs paired yet</h2>
            <p className="text-sm text-neutral-500 max-w-xs">
              Open MenuCast on your restaurant TV and scan the QR code to pair it.
            </p>
            <Link
              href="/tv"
              target="_blank"
              className="mt-2 bg-white text-neutral-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Open TV pairing page →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tvs.map((tv) => {
              const lastMenu = tv.menus?.[0];
              return (
                <div
                  key={tv.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-neutral-900 flex items-center justify-center overflow-hidden">
                    {lastMenu?.image_url ? (
                      <img
                        src={lastMenu.image_url}
                        alt="Menu"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-neutral-600 text-sm">No menu pushed yet</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-1">
                    <h3 className="font-medium">{tv.name}</h3>
                    <p className="text-xs text-neutral-500">
                      {lastMenu
                        ? `Last updated ${new Date(lastMenu.pushed_at).toLocaleDateString()}`
                        : "Paired · Awaiting first push"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Figma Plugin Token */}
        <div className="border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Figma Plugin Access</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Generate an API token to use in the MenuCast Figma plugin.
            </p>
          </div>

          {token ? (
            <div className="space-y-3">
              <div className="bg-neutral-900 rounded-lg px-4 py-3 flex items-center justify-between gap-4 font-mono text-sm break-all">
                <span className="text-emerald-400">{token}</span>
                <button
                  onClick={copyToken}
                  className="shrink-0 text-xs text-neutral-400 hover:text-white border border-white/10 px-3 py-1 rounded-md transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-amber-500/80">⚠ Save this token now — it won&apos;t be shown again.</p>
            </div>
          ) : (
            <button
              onClick={generateToken}
              disabled={tokenLoading}
              className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {tokenLoading ? "Generating…" : hasToken ? "Regenerate token" : "Generate token"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
