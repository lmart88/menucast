"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

type TV = Database["public"]["Tables"]["tvs"]["Row"] & {
  menus: Database["public"]["Tables"]["menus"]["Row"][];
};

function isScreenOnline(lastSeenAt?: string | null, pairedAt?: string | null, nowTime = Date.now()): boolean {
  if (lastSeenAt) {
    const lastSeen = new Date(lastSeenAt).getTime();
    if (!isNaN(lastSeen) && nowTime - lastSeen < 60000) {
      return true;
    }
  }
  // Freshly paired screen within last 60 seconds is immediately online
  if (pairedAt) {
    const paired = new Date(pairedAt).getTime();
    if (!isNaN(paired) && nowTime - paired < 60000) {
      return true;
    }
  }
  return false;
}

function formatLastSeen(lastSeenAt?: string | null, pairedAt?: string | null, nowTime = Date.now()): string {
  const timestamp = lastSeenAt || pairedAt;
  if (!timestamp) return "Never connected";
  const lastSeen = new Date(timestamp).getTime();
  if (isNaN(lastSeen)) return "Unknown";
  const diffSec = Math.floor((nowTime - lastSeen) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1 min ago";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

interface HybridElement {
  id: string;
  name: string;
  text: string;
  isPrice?: boolean;
  fontSize?: number;
  color?: string;
}

interface Props {
  initialTvs: TV[];
  hasToken: boolean;
  userName: string;
}

export default function DashboardClient({ initialTvs, hasToken, userName }: Props) {
  const [tvs, setTvs] = useState<TV[]>(initialTvs);
  const [nowTime, setNowTime] = useState(Date.now());
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Periodic timer to keep presence status and elapsed timestamps accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Poll / refresh TV presence periodically
  const fetchTvs = useCallback(async () => {
    try {
      const res = await fetch(`/api/tv/list?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tvs)) {
          setTvs(data.tvs);
        }
      }
    } catch {
      // Background poll failure handled silently
    }
  }, []);

  useEffect(() => {
    fetchTvs();
    const pollInterval = setInterval(fetchTvs, 8000);
    return () => clearInterval(pollInterval);
  }, [fetchTvs]);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  // Screen Detail & Image Management Modal
  const [activeScreen, setActiveScreen] = useState<TV | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isClearingImage, setIsClearingImage] = useState(false);
  const [confirmClearImage, setConfirmClearImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Hidden file input refs
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadTvId, setTargetUploadTvId] = useState<string | null>(null);

  // Live Editor State (for hybrid text editing if applicable)
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
        if (activeScreen?.id === tvId) setActiveScreen(null);
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

  // Upload and push new image to TV
  async function handleImageUpload(tvId: string, file: File) {
    if (!file || !tvId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    setIsUploading(true);
    setUploadProgressText("Requesting upload URL…");
    setUploadSuccess(false);

    try {
      // 1. Get signed upload URL
      const uploadRes = await fetch("/api/menu/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tv_id: tvId,
          file_name: file.name,
          content_type: file.type || "image/png",
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || `Upload authorization failed (HTTP ${uploadRes.status})`);
      }

      const { upload_url, public_url } = await uploadRes.json();

      // 2. Upload file to Supabase storage
      setUploadProgressText("Uploading image file…");
      const fileBytes = await file.arrayBuffer();
      const storagePutRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/png" },
        body: fileBytes,
      });

      if (!storagePutRes.ok) {
        throw new Error(`Storage upload failed (HTTP ${storagePutRes.status})`);
      }

      // 3. Push new menu to TV
      setUploadProgressText("Broadcasting to TV screen…");
      const pushRes = await fetch("/api/menu/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tv_id: tvId,
          image_url: public_url,
          menu_mode: "static",
          menu_data: null,
        }),
      });

      if (!pushRes.ok) {
        const err = await pushRes.json().catch(() => ({}));
        throw new Error(err.error || `Push broadcast failed (HTTP ${pushRes.status})`);
      }

      // Update local state
      setTvs((prev) =>
        prev.map((t) =>
          t.id === tvId
            ? { ...t, current_menu_url: public_url, menu_mode: "static", menu_data: null }
            : t
        )
      );

      if (activeScreen?.id === tvId) {
        setActiveScreen((prev) =>
          prev
            ? { ...prev, current_menu_url: public_url, menu_mode: "static", menu_data: null }
            : null
        );
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
      if (cardFileInputRef.current) cardFileInputRef.current.value = "";
      setTargetUploadTvId(null);
    }
  }

  // Delete / Clear active image from screen
  async function handleClearImage(tvId: string) {
    if (!tvId) return;

    setIsClearingImage(true);
    try {
      const res = await fetch("/api/menu/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tv_id: tvId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to clear screen image (HTTP ${res.status})`);
      }

      // Update local state
      setTvs((prev) =>
        prev.map((t) =>
          t.id === tvId
            ? { ...t, current_menu_url: null, menu_mode: "static", menu_data: null }
            : t
        )
      );

      if (activeScreen?.id === tvId) {
        setActiveScreen((prev) =>
          prev
            ? { ...prev, current_menu_url: null, menu_mode: "static", menu_data: null }
            : null
        );
      }

      setConfirmClearImage(false);
    } catch (err: any) {
      console.error("Clear image error:", err);
      alert(`Error clearing image: ${err.message}`);
    } finally {
      setIsClearingImage(false);
    }
  }

  function openScreenDetails(tv: TV) {
    setActiveScreen(tv);
    setConfirmClearImage(false);
    setUploadSuccess(false);
  }

  function openEditor(tv: TV) {
    setEditingTv(tv);
    setSaveSuccess(false);
    setEditingData(tv.menu_data ? JSON.parse(JSON.stringify(tv.menu_data)) : null);
  }

  function handleHybridTextChange(id: string, newText: string) {
    if (!editingData?.elements) return;
    const updatedElements = editingData.elements.map((el: HybridElement) =>
      el.id === id ? { ...el, text: newText } : el
    );
    setEditingData({ ...editingData, elements: updatedElements });
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

  const currentModalTv = activeScreen ? (tvs.find((t) => t.id === activeScreen.id) || activeScreen) : null;
  const isModalTvOnline = currentModalTv ? isScreenOnline(currentModalTv.last_seen_at, currentModalTv.paired_at, nowTime) : false;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hidden Card File Input */}
      <input
        ref={cardFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && targetUploadTvId) {
            handleImageUpload(targetUploadTvId, file);
          }
        }}
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-base font-semibold tracking-tight flex items-center gap-2">
          <span className="text-xl">📺</span>
          <span>miniKast</span>
        </Link>
        <div className="flex items-center gap-3">
          {installPrompt && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install App</span>
            </button>
          )}
          <span className="text-sm text-neutral-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer"
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
              Manage connected TV screens, upload new menu images, or clear active displays.
            </p>
          </div>
          <Link
            href="/tv"
            target="_blank"
            className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
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
              Open miniKast on your restaurant TV and scan the QR code to pair it.
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
              const hasActiveImage = Boolean(tv.current_menu_url || lastMenu?.image_url);
              const currentImgUrl = tv.current_menu_url || lastMenu?.image_url || "";
              const menuDataObj = tv.menu_data as any;
              const hasEditableData =
                mode === "hybrid" && Array.isArray(menuDataObj?.elements) && menuDataObj.elements.length > 0;
              const isOnline = isScreenOnline(tv.last_seen_at, tv.paired_at, nowTime);

              return (
                <div
                  key={tv.id}
                  className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail & Click to Open Screen */}
                  <div
                    onClick={() => openScreenDetails(tv)}
                    className="aspect-video bg-neutral-900 flex items-center justify-center overflow-hidden relative cursor-pointer group-hover:opacity-95 transition-opacity"
                  >
                    {hasActiveImage ? (
                      <img
                        src={currentImgUrl}
                        alt={tv.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-3xl block mb-1">🖼️</span>
                        <span className="text-neutral-500 text-xs font-medium">No menu image loaded</span>
                        <span className="block text-[11px] text-emerald-400 mt-1 font-semibold">
                          Click to upload image &rarr;
                        </span>
                      </div>
                    )}

                    {/* Code Tag Top Right */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="bg-black/75 backdrop-blur-md text-[11px] px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                        {tv.pairing_code}
                      </span>
                    </div>

                    {/* Overlay hover prompt */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-neutral-900/90 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md shadow-lg">
                        Manage Screen &bull; Upload / Delete Image
                      </span>
                    </div>
                  </div>

                  {/* Info & Actions */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-white truncate">
                            {tv.name}
                          </h3>
                          {isOnline ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              title={`Online (Heartbeat ${formatLastSeen(tv.last_seen_at, tv.paired_at, nowTime)})`}
                            >
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700"
                              title={`Offline (${formatLastSeen(tv.last_seen_at, tv.paired_at, nowTime)})`}
                            >
                              <span className="size-1.5 rounded-full bg-neutral-500" />
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {tv.screen_width && tv.screen_height
                              ? `${tv.screen_width}×${tv.screen_height} (${tv.aspect_ratio || "16:9"})`
                              : "Standard 16:9 Display"}
                          </span>
                          <span className="text-neutral-600">&bull;</span>
                          <span className={isOnline ? "text-emerald-400/80 font-medium" : "text-neutral-500"}>
                            {formatLastSeen(tv.last_seen_at, tv.paired_at, nowTime)}
                          </span>
                        </p>
                      </div>

                      {/* Unpair / Delete TV */}
                      <div className="shrink-0">
                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => deleteTv(tv.id)}
                              disabled={isDeleting}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isDeleting ? "Deleting…" : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                              className="text-neutral-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(tv.id)}
                            className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Unpair & Delete Screen"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <button
                        onClick={() => openScreenDetails(tv)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                      >
                        <span>⚙️ Manage Screen</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetUploadTvId(tv.id);
                          cardFileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <span>📤 Upload Image</span>
                      </button>

                      {hasEditableData && (
                        <button
                          onClick={() => openEditor(tv)}
                          className="bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                          title="Edit live text overlays"
                        >
                          ✏️
                        </button>
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
              You can push designs directly from Figma using the miniKast Plugin or upload images directly above.
            </p>
          </div>

          {token ? (
            <div className="space-y-3">
              <div className="bg-neutral-900 rounded-lg px-4 py-3 flex items-center justify-between gap-4 font-mono text-sm break-all">
                <span className="text-emerald-400">{token}</span>
                <button
                  onClick={copyToken}
                  className="shrink-0 text-xs text-neutral-400 hover:text-white border border-white/10 px-3 py-1 rounded-md transition-colors cursor-pointer"
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

      {/* Screen Management Modal (Upload New Image & Delete Active Image) */}
      {currentModalTv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📺 Screen: {currentModalTv.name}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {currentModalTv.pairing_code}
                    </span>
                  </h3>
                  {isModalTvOnline ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                      <span className="size-1.5 rounded-full bg-neutral-500" />
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>
                    Resolution: {currentModalTv.screen_width && currentModalTv.screen_height ? `${currentModalTv.screen_width}×${currentModalTv.screen_height} (${currentModalTv.aspect_ratio || "16:9"})` : "1920×1080 (16:9)"}
                  </span>
                  <span className="text-neutral-600">&bull;</span>
                  <span className={isModalTvOnline ? "text-emerald-400/80 font-medium" : "text-neutral-400"}>
                    Heartbeat: {formatLastSeen(currentModalTv.last_seen_at, currentModalTv.paired_at, nowTime)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveScreen(null);
                  setConfirmClearImage(false);
                }}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Current Active Image Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
                    Currently Displaying
                  </span>
                  {currentModalTv.current_menu_url && (
                    <a
                      href={currentModalTv.current_menu_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Open Full Size &rarr;
                    </a>
                  )}
                </div>

                <div className="aspect-video bg-neutral-950 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {currentModalTv.current_menu_url ? (
                    <img
                      src={currentModalTv.current_menu_url}
                      alt="Active Menu"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-1">
                      <span className="text-3xl block">🖼️</span>
                      <p className="text-sm font-medium text-neutral-400">No Image Active on Screen</p>
                      <p className="text-xs text-neutral-600">The TV display is currently on standby awaiting a menu.</p>
                    </div>
                  )}
                </div>

                {/* Delete / Clear Active Image Button */}
                {currentModalTv.current_menu_url && (
                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Remove the current menu image from this screen without unpairing the TV.
                    </p>
                    {confirmClearImage ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleClearImage(currentModalTv.id)}
                          disabled={isClearingImage}
                          className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-red-500/20"
                        >
                          {isClearingImage ? "Clearing…" : "Confirm Delete Image"}
                        </button>
                        <button
                          onClick={() => setConfirmClearImage(false)}
                          disabled={isClearingImage}
                          className="text-neutral-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearImage(true)}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete / Clear Image</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upload New Image Section */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-sm font-semibold text-white">Upload New Menu Image</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select or drop an image file (PNG, JPG, WebP) to push immediately to this TV screen.
                  </p>
                </div>

                {/* Drag and drop upload zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleImageUpload(currentModalTv.id, file);
                    }
                  }}
                  onClick={() => modalFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    dragOver
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
                  }`}
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && activeScreen) {
                        handleImageUpload(activeScreen.id, file);
                      }
                    }}
                  />

                  <div className="size-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {isUploading ? uploadProgressText : "Click to browse or drag & drop image here"}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Supports PNG, JPG, JPEG, and WebP (up to 20MB)
                    </p>
                  </div>

                  {isUploading && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mt-2">
                      <div className="size-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                      <span>{uploadProgressText}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="text-xs font-semibold text-emerald-400 mt-2">
                      ✓ Uploaded and pushed successfully to TV screen!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-neutral-950 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Pushed images appear immediately on the paired TV screen.
              </span>
              <button
                onClick={() => {
                  setActiveScreen(null);
                  setConfirmClearImage(false);
                }}
                className="bg-white text-neutral-950 font-semibold px-5 py-2 rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Text & Price Editor Modal (Legacy/Hybrid) */}
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
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Field Inputs */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {editingData.elements && (
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
