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
  const [tvs, setTvs] = useState<TV[]>(initialTvs);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  async function deleteTv(tvId: string) {
    setDeletingId(tvId);
    try {
      const res = await fetch("/api/tv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tv_id: tvId }),
      });

      if (res.ok) {
        setTvs((prev) => prev.filter((tv) => tv.id !== tvId));
        setConfirmDeleteId(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete TV: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("Error deleting TV. Please try again.");
    } finally {
      setDeletingId(null);
    }
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
          <div>
            <h1 className="text-2xl font-semibold">Your TVs</h1>
            <p className="text-sm text-neutral-400 mt-1">Manage connected screens and push menus</p>
          </div>
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
              const isDeleting = deletingId === tv.id;
              const isConfirming = confirmDeleteId === tv.id;

              return (
                <div
                  key={tv.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-neutral-900 flex items-center justify-center overflow-hidden relative">
                    {tv.current_menu_url || lastMenu?.image_url ? (
                      <img
                        src={tv.current_menu_url || lastMenu?.image_url || ""}
                        alt="Menu"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-2xl block mb-1">🖼️</span>
                        <span className="text-neutral-500 text-xs">No menu pushed yet</span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <span className="bg-black/60 backdrop-blur-md text-[11px] px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/20 font-mono">
                        {tv.pairing_code}
                      </span>
                    </div>
                  </div>

                  {/* Info & Actions */}
                  <div className="p-4 flex items-center justify-between border-t border-white/5">
                    <div className="space-y-0.5">
                      <h3 className="font-medium text-sm text-white">{tv.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {tv.current_menu_url || lastMenu
                          ? `Live Menu Active`
                          : "Paired · Awaiting push"}
                      </p>
                    </div>

                    {/* Delete Action with Confirmation */}
                    <div>
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => deleteTv(tv.id)}
                            disabled={isDeleting}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                            className="text-neutral-400 hover:text-white px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(tv.id)}
                          className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete TV"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
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
