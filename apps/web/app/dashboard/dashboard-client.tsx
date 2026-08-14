"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { Database } from "@menucast/supabase";

type TV = Database["public"]["Tables"]["tvs"]["Row"] & {
  menus: Database["public"]["Tables"]["menus"]["Row"][];
};

interface HybridElement {
  id: string;
  name: string;
  text: string;
  isPrice?: boolean;
  fontSize?: number;
  color?: string;
}

interface ResponsiveField {
  label: string;
  value: string;
  isPrice?: boolean;
}

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

  // Live Editor State
  const [editingTv, setEditingTv] = useState<TV | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [savingTv, setSavingTv] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        if (editingTv?.id === tvId) setEditingTv(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete TV: ${err.error || "Unknown error"}`);
      }
    } catch {
      alert("Error deleting TV. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function openEditor(tv: TV) {
    setEditingTv(tv);
    setSaveSuccess(false);
    // Clone menu data
    setEditingData(tv.menu_data ? JSON.parse(JSON.stringify(tv.menu_data)) : null);
  }

  function handleHybridTextChange(id: string, newText: string) {
    if (!editingData?.elements) return;
    const updatedElements = editingData.elements.map((el: HybridElement) =>
      el.id === id ? { ...el, text: newText } : el
    );
    setEditingData({ ...editingData, elements: updatedElements });
  }

  function handleResponsiveFieldChange(fieldId: string, newValue: string) {
    if (!editingData?.fields) return;
    setEditingData({
      ...editingData,
      fields: {
        ...editingData.fields,
        [fieldId]: {
          ...editingData.fields[fieldId],
          value: newValue,
        },
      },
    });
  }

  async function saveAndPushLive() {
    if (!editingTv || !editingData) return;
    setSavingTv(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/menu/update-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tv_id: editingTv.id,
          menu_data: editingData,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update menu data");
      }

      // Update local TV state
      setTvs((prev) =>
        prev.map((t) => (t.id === editingTv.id ? { ...t, menu_data: editingData } : t))
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingTv(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-base font-semibold tracking-tight">
          MenuCast
        </Link>
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

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your Displays</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage connected TV screens, display modes, and live editable menus
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tvs.map((tv) => {
              const lastMenu = tv.menus?.[0];
              const isDeleting = deletingId === tv.id;
              const isConfirming = confirmDeleteId === tv.id;
              const mode = tv.menu_mode || lastMenu?.menu_mode || "static";
              const menuDataObj = tv.menu_data as any;
              const hasEditableData =
                (mode === "hybrid" && Array.isArray(menuDataObj?.elements) && menuDataObj.elements.length > 0) ||
                (mode === "responsive" && Boolean(menuDataObj?.fields));

              return (
                <div
                  key={tv.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail & Mode Badge */}
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

                    {/* Mode Tag Top Left */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-sm ${
                          mode === "hybrid"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : mode === "responsive"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-neutral-800/80 text-neutral-300 border-neutral-700"
                        }`}
                      >
                        {mode === "hybrid"
                          ? "🔤 Hybrid Overlay"
                          : mode === "responsive"
                          ? "📐 Responsive HTML"
                          : "🖼️ Static Image"}
                      </span>
                    </div>

                    {/* Code Tag Top Right */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-black/70 backdrop-blur-md text-[11px] px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                        {tv.pairing_code}
                      </span>
                    </div>
                  </div>

                  {/* Info & Actions */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-sm text-white">{tv.name}</h3>
                        <p className="text-xs text-neutral-500">
                          {tv.screen_width && tv.screen_height
                            ? `${tv.screen_width}×${tv.screen_height} (${tv.aspect_ratio || "16:9"})`
                            : "Standard 16:9"}
                        </p>
                      </div>

                      {/* Delete Action */}
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

                    {/* Mode-Specific Actions */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      {hasEditableData ? (
                        <button
                          onClick={() => openEditor(tv)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          ✏️ Edit Live Text & Prices
                        </button>
                      ) : (
                        <div className="text-[11px] text-neutral-500 italic py-1">
                          {mode === "static"
                            ? "Push in Hybrid or Responsive mode from Figma to edit text/prices here."
                            : "Waiting for menu push with text fields..."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Figma Plugin Token Card */}
        <div className="border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Figma Plugin Access</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Connect your Figma plugin to push Static images, Hybrid overlays, or Responsive HTML directly to your screens.
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
              className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {tokenLoading ? "Generating…" : hasToken ? "Regenerate Token" : "Generate API Token"}
            </button>
          )}
        </div>
      </div>

      {/* Live Text & Price Editor Modal / Drawer */}
      {editingTv && editingData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>✏️ Edit Live Menu & Prices</span>
                  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {editingTv.name}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Changes sync live to your TV screen immediately upon saving.
                </p>
              </div>
              <button
                onClick={() => setEditingTv(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Field Inputs */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Hybrid Mode Fields */}
              {editingTv.menu_mode === "hybrid" && editingData.elements && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                    Extracted Text & Price Elements ({editingData.elements.length})
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {editingData.elements.map((el: HybridElement) => (
                      <div
                        key={el.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-300 truncate max-w-xs">
                            {el.name}
                          </span>
                          {el.isPrice ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                              PRICE
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500">TEXT</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={el.text}
                          onChange={(e) => handleHybridTextChange(el.id, e.target.value)}
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-medium focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsive Mode Fields */}
              {editingTv.menu_mode === "responsive" && editingData.fields && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                    Template Variables & Content ({Object.keys(editingData.fields).length})
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(editingData.fields).map(([fieldId, f]: [string, any]) => (
                      <div
                        key={fieldId}
                        className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-300">{f.label}</span>
                          {f.isPrice && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                              PRICE
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={f.value}
                          onChange={(e) => handleResponsiveFieldChange(fieldId, e.target.value)}
                          className="w-full bg-neutral-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-medium focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-neutral-950 flex items-center justify-between">
              {saveSuccess ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  ✓ Pushed live to TV screen!
                </span>
              ) : (
                <span className="text-xs text-neutral-500">
                  Clicking publish broadcasts changes over Realtime.
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingTv(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={saveAndPushLive}
                  disabled={savingTv}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2 rounded-xl text-xs tracking-wide transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {savingTv ? "Publishing…" : "🚀 Publish Live to TV"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
