"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

import type { Database } from "@menucast/supabase";

export type Theme = "light" | "dark";

function SunIcon() {
  return <img aria-hidden="true" src="/theme-sun.svg" alt="" className="w-5 h-5 block" />;
}

function MoonIcon() {
  return <img aria-hidden="true" src="/theme-moon.svg" alt="" className="w-5 h-5 block" />;
}

function ThemeAwareLogo({ theme }: { theme: Theme }) {
  const [logoSource, setLogoSource] = useState("");

  useEffect(() => {
    fetch("/menucast-logo.svg")
      .then((response) => response.text())
      .then(setLogoSource)
      .catch(() => setLogoSource(""));
  }, []);

  const unionFill = theme === "dark" ? "#fff" : "#0d1f21";
  const logoMarkup = logoSource.replace(/(<path id="Union"[^>]*fill=")[^"]+/, `$1${unionFill}`);

  return (
    <span
      className="block w-[95px] max-w-full h-5 [&_svg]:block [&_svg]:w-[95px] [&_svg]:max-w-full [&_svg]:h-5"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoMarkup }}
    />
  );
}

type TV = Database["public"]["Tables"]["tvs"]["Row"] & {
  menus?: Database["public"]["Tables"]["menus"]["Row"][];
};

function isScreenOnline(lastSeenAt?: string | null, pairedAt?: string | null, nowTime = Date.now()): boolean {
  if (lastSeenAt) {
    const lastSeen = new Date(lastSeenAt).getTime();
    if (!isNaN(lastSeen) && nowTime - lastSeen < 60000) {
      return true;
    }
  }
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
  const days = Math.floor(diffSec / 86400);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function getScreenSpecs(tv?: TV | null) {
  if (!tv) {
    return {
      resolution: "1920x1080",
      ratio: "16:9",
      orientation: "Landscape",
    };
  }
  const width = tv.screen_width || 1920;
  const height = tv.screen_height || 1080;
  const ratio = tv.aspect_ratio || (width >= height ? "16:9" : "9:16");
  const orientation = tv.orientation || (width >= height ? "Landscape" : "Portrait");
  return {
    resolution: `${width}x${height}`,
    ratio,
    orientation,
  };
}

interface Props {
  initialTvs: TV[];
  hasToken: boolean;
  userName: string;
}

export default function DashboardClient({ initialTvs, hasToken, userName }: Props) {
  const [tvs, setTvs] = useState<TV[]>(initialTvs);
  const [nowTime, setNowTime] = useState(Date.now());
  const [theme, setTheme] = useState<Theme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  // Auth / Account & Token Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile & Account Management State
  const [currentDisplayName, setCurrentDisplayName] = useState(userName || "");
  const [profileNameInput, setProfileNameInput] = useState(userName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete Account Confirmation State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Screen Detail & Upload Modal
  const [activeScreen, setActiveScreen] = useState<TV | null>(null);
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [isClearingImage, setIsClearingImage] = useState(false);
  const [confirmClearImage, setConfirmClearImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadTvId, setTargetUploadTvId] = useState<string | null>(null);

  // Theme synchronization
  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = window.localStorage.getItem("menucast-theme");
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      }
    } catch {
      // localStorage not accessible
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("menucast-theme", theme);
    } catch {
      // Ignore
    }
  }, [theme, isHydrated]);

  // Periodic heartbeat timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Poll TV presence
  const fetchTvs = useCallback(async () => {
    try {
      const res = await fetch(`/api/tv/list?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tvs)) {
          setTvs(data.tvs);
        }
      }
    } catch {
      // Silently fail on poll error
    }
  }, []);

  useEffect(() => {
    fetchTvs();
    const pollInterval = setInterval(fetchTvs, 8000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchTvs();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [fetchTvs]);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstallApp() {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }
    // Dispatch global custom event for PwaInstallPrompt component to display branded instructions modal
    window.dispatchEvent(new CustomEvent("minikast:trigger-install"));
  }

  async function generateToken() {
    setTokenLoading(true);
    try {
      const res = await fetch("/api/token", { method: "POST" });
      const data = await res.json();
      setToken(data.token);
    } catch {
      alert("Failed to generate token");
    } finally {
      setTokenLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveProfileName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);

    if (!profileNameInput.trim()) {
      setNameError("Display name cannot be empty.");
      return;
    }

    setIsSavingName(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileNameInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameSuccess(true);
        setCurrentDisplayName(data.user?.name || profileNameInput.trim());
        setTimeout(() => setNameSuccess(false), 3500);
      } else {
        setNameError(data.error || "Failed to update display name.");
      }
    } catch {
      setNameError("Network error while updating display name.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccess(false), 3500);
      } else {
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network error while updating password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput !== "DELETE") {
      setDeleteAccountError("Please type DELETE to confirm.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError("");
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await res.json();
      if (res.ok) {
        // Sign out and redirect to home page with deleted query param
        await signOut({ callbackUrl: "/login?deleted=true" });
      } else {
        setDeleteAccountError(data.error || "Failed to delete account.");
        setIsDeletingAccount(false);
      }
    } catch {
      setDeleteAccountError("Network error while deleting account.");
      setIsDeletingAccount(false);
    }
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
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete screen: ${err.error || "Unknown error"}`);
      }
    } catch {
      alert("Error deleting screen. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImageUpload(tvId: string, file: File) {
    if (!file || !tvId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    setIsUploading(true);
    setUploadProgressText("Requesting upload URL…");
    setUploadSuccess(false);
    setPublishError("");

    try {
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

      setUploadProgressText("Uploading image to storage…");
      const fileBytes = await file.arrayBuffer();
      const storagePutRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/png" },
        body: fileBytes,
      });

      if (!storagePutRes.ok) {
        throw new Error(`Storage upload failed (HTTP ${storagePutRes.status})`);
      }

      // Stage the image in local state for review instead of pushing immediately
      setStagedImageUrl(public_url);
      setUploadSuccess(true);
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

  async function handlePublish(tvId: string) {
    if (!tvId) return;
    setPublishError("");

    // If there is a staged image, publish it to the TV
    if (stagedImageUrl) {
      setIsPublishing(true);
      try {
        const pushRes = await fetch("/api/menu/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tv_id: tvId,
            image_url: stagedImageUrl,
            menu_mode: "static",
            menu_data: null,
          }),
        });

        if (!pushRes.ok) {
          const err = await pushRes.json().catch(() => ({}));
          throw new Error(err.error || `Push broadcast failed (HTTP ${pushRes.status})`);
        }

        const newUrl = stagedImageUrl;
        setTvs((prev) =>
          prev.map((t) =>
            t.id === tvId
              ? { ...t, current_menu_url: newUrl, menu_mode: "static", menu_data: null }
              : t
          )
        );

        if (activeScreen?.id === tvId) {
          setActiveScreen((prev) =>
            prev
              ? { ...prev, current_menu_url: newUrl, menu_mode: "static", menu_data: null }
              : null
          );
        }

        setStagedImageUrl(null);
        setPublishSuccess(true);
        setTimeout(() => {
          setPublishSuccess(false);
          setActiveScreen(null);
          setConfirmClearImage(false);
        }, 800);
      } catch (err: any) {
        console.error("Publish error:", err);
        setPublishError(err.message || "Failed to publish menu to TV.");
      } finally {
        setIsPublishing(false);
      }
    } else {
      // No new staged image, close modal
      setActiveScreen(null);
      setConfirmClearImage(false);
    }
  }

  function handleDiscardStaged() {
    setStagedImageUrl(null);
    setUploadSuccess(false);
    setPublishError("");
  }

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

  const nextTheme = theme === "light" ? "dark" : "light";
  const currentModalTv = activeScreen ? tvs.find((t) => t.id === activeScreen.id) || activeScreen : null;
  const isModalTvOnline = currentModalTv
    ? isScreenOnline(currentModalTv.last_seen_at, currentModalTv.paired_at, nowTime)
    : false;

  return (
    <main className="home-shell min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <div className="home-noise" aria-hidden="true" />

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

      {/* Header */}
      <header className="w-full bg-[var(--surface)] border-b border-[var(--accent-soft)] transition-colors duration-300 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          {/* Logo Left */}
          <Link href="/" className="flex items-center gap-2" aria-label="miniKast home">
            <ThemeAwareLogo theme={theme} />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Install App Button */}
            <button
              onClick={handleInstallApp}
              type="button"
              className="flex items-center gap-1.5 border border-[var(--accent-soft)] rounded-full px-3 sm:px-3.5 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
            >
              <svg className="size-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install App</span>
            </button>

            {/* Links */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-normal">
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-[var(--line)]" aria-hidden="true" />

            {/* Theme Toggle */}
            <button
              className="p-1.5 text-[var(--foreground)] bg-transparent rounded-lg hover:bg-[var(--surface-soft)] transition-colors flex items-center justify-center cursor-pointer"
              type="button"
              aria-label={`Switch to ${nextTheme} theme`}
              onClick={() => setTheme(nextTheme)}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 z-10 space-y-6">
        {/* Page Title Row */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Displays
          </h1>

          <Link
            href="/pair"
            className="bg-[#f27200] hover:bg-[#ff8000] text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all hover:scale-[1.02] active:scale-[0.99] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Pair New Screen</span>
          </Link>
        </div>

        {/* Displays Grid / List */}
        {tvs.length === 0 ? (
          <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-10 sm:p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-xs transition-colors duration-300">
            <div className="size-16 rounded-full bg-[var(--surface-soft)] border border-[var(--accent-soft)] flex items-center justify-center text-2xl text-[var(--accent)]">
              📺
            </div>
            <div className="space-y-1 max-w-md">
              <h2 className="text-lg font-bold text-[var(--foreground)]">No screens paired yet</h2>
              <p className="text-sm text-[var(--muted)]">
                Launch the miniKast player on your TV display or browser to generate a pairing code.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/pair"
                className="bg-[#f27200] hover:bg-[#ff8000] text-white px-5 py-2 rounded-full text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Pair Screen Code
              </Link>
              <Link
                href="/tv"
                target="_blank"
                className="border border-[var(--accent-soft)] text-[var(--foreground)] hover:bg-[var(--surface-soft)] px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
              >
                Launch TV Player ↗
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tvs.map((tv) => {
              const lastMenu = tv.menus?.[0];
              const isDeleting = deletingId === tv.id;
              const isConfirming = confirmDeleteId === tv.id;
              const hasActiveImage = Boolean(tv.current_menu_url || lastMenu?.image_url);
              const currentImgUrl = tv.current_menu_url || lastMenu?.image_url || "";
              const isOnline = isScreenOnline(tv.last_seen_at, tv.paired_at, nowTime);
              const specs = getScreenSpecs(tv);

              return (
                <div
                  key={tv.id}
                  className="bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(12,12,13,0.05)] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Top: Image Preview Area */}
                  <div
                    onClick={() => {
                      setActiveScreen(tv);
                      setStagedImageUrl(null);
                      setConfirmClearImage(false);
                      setUploadSuccess(false);
                      setPublishSuccess(false);
                      setPublishError("");
                    }}
                    className="relative w-full h-[182px] bg-[#f7fcfc] dark:bg-[#081517] border-b border-[var(--accent-soft)] flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {hasActiveImage ? (
                      <img
                        src={currentImgUrl}
                        alt={tv.name}
                        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                      />
                    ) : (
                      <p className="text-sm font-normal text-[#547a7c] dark:text-[#a3b7b5]">
                        Awaiting menu
                      </p>
                    )}

                    {/* Status Pill Badge (Top Left) */}
                    <div className="absolute top-2 left-2 bg-[var(--surface)]/95 backdrop-blur-xs border border-[var(--accent-soft)] rounded-full px-2 py-0.5 flex items-center gap-1.5 shadow-xs z-10">
                      <div
                        className={`size-1.5 rounded-full ${isOnline ? "bg-[#10b981] animate-pulse" : "bg-[#547a7c]"
                          }`}
                      />
                      <span className="text-[11px] font-normal text-[#304243] dark:text-[#a3b7b5] whitespace-nowrap">
                        {formatLastSeen(tv.last_seen_at, tv.paired_at, nowTime)}
                      </span>
                    </div>

                    {/* Pairing Code Badge (Top Right) */}
                    <div className="absolute top-2 right-2 bg-[var(--surface)]/95 backdrop-blur-xs border border-[var(--accent-soft)] rounded-full px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--foreground)] shadow-xs z-10">
                      {tv.pairing_code}
                    </div>

                    {/* Hover Prompt Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-[var(--surface)] text-[var(--foreground)] border border-[var(--accent-soft)] px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        Manage Display
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Info & Controls */}
                  <div className="p-4 flex flex-col gap-3 bg-[var(--surface)]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-[#0d1f21] dark:text-[#f4f8f7] truncate">
                          {tv.name}
                        </h3>
                        <p className="text-xs text-[#547a7c] dark:text-[#a3b7b5] flex items-center gap-2 font-normal mt-0.5">
                          <span>{specs.resolution}</span>
                          <span>{specs.ratio}</span>
                          <span>{specs.orientation}</span>
                        </p>
                      </div>

                      {/* Delete Icon Button (delete-02) */}
                      <div className="shrink-0">
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTv(tv.id);
                              }}
                              disabled={isDeleting}
                              className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isDeleting ? "…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] px-1.5 py-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(tv.id);
                            }}
                            className="text-[#547a7c] hover:text-red-500 p-1.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Unpair & Delete Screen"
                            aria-label="Delete screen"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    {/* <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen(tv);
                          setConfirmClearImage(false);
                          setUploadSuccess(false);
                        }}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[var(--accent-soft)] hover:bg-[var(--surface-soft)] text-[var(--foreground)] transition-colors cursor-pointer text-center"
                      >
                        Manage
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetUploadTvId(tv.id);
                          cardFileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] hover:brightness-105 text-white transition-colors cursor-pointer text-center disabled:opacity-50"
                      >
                        Upload Menu
                      </button>
                    </div> */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Account Settings Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl transition-colors duration-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Account & Profile Settings</h2>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--surface-soft)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Profile Info & Display Name */}
              <div className="space-y-3">
                <span className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">Profile Information</span>
                <p className="text-xs text-[var(--muted)]">
                  Signed in as: <strong className="text-[var(--foreground)]">{userName || "User"}</strong>
                </p>

                {nameSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Display name updated successfully.
                  </div>
                )}
                {nameError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-500 font-medium">
                    {nameError}
                  </div>
                )}

                <form onSubmit={handleSaveProfileName} className="flex gap-2">
                  <input
                    type="text"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    placeholder="Display Name"
                    className="flex-1 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={isSavingName || profileNameInput === currentDisplayName}
                    className="bg-[var(--accent)] hover:brightness-105 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isSavingName ? "Saving…" : "Save Name"}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                <span className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">Change Password</span>
                <p className="text-xs text-[var(--muted)]">
                  Update your dashboard password (min. 8 characters).
                </p>

                {passwordSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Password updated successfully.
                  </div>
                )}
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-500 font-medium">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 8 chars)"
                    className="w-full bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="flex-1 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !newPassword || !confirmNewPassword}
                      className="bg-[var(--accent)] hover:brightness-105 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isUpdatingPassword ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Figma Plugin API Token */}
              <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                <span className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">Figma Plugin API Token</span>
                <p className="text-xs text-[var(--muted)]">
                  Use this token in the miniKast Figma plugin to connect your account and push designs directly.
                </p>

                {token ? (
                  <div className="space-y-2">
                    <div className="bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg p-3 flex items-center justify-between gap-2 font-mono text-xs break-all">
                      <span className="text-[var(--foreground)] font-bold">{token}</span>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="shrink-0 text-xs bg-[var(--accent)] text-white px-2.5 py-1 rounded hover:brightness-105 transition-colors cursor-pointer"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ⚠ Copy this token now — it will not be shown again.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={generateToken}
                    disabled={tokenLoading}
                    className="w-full bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {tokenLoading ? "Generating…" : hasToken ? "Regenerate Figma Token" : "Generate Figma Token"}
                  </button>
                )}
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="pt-4 border-t border-[var(--line)]">
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-xs uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">Danger Zone</span>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Permanently Delete Account</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Permanently remove your profile, all connected TV displays, uploaded menu images, and API tokens. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmInput("");
                      setDeleteAccountError("");
                      setShowDeleteAccountModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="bg-[#f27200] hover:bg-[#ff8000] text-white px-5 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 transition-colors duration-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center font-bold text-xl shrink-0">
                ⚠
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Delete Account Permanently?</h2>
                <p className="text-xs text-[var(--muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[var(--muted)] bg-[var(--surface-soft)] p-3.5 rounded-xl border border-[var(--line)]">
              <p>
                Deleting your account will immediately:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]">
                <li>Unpair and remove all connected TV displays</li>
                <li>Purge all uploaded menu assets and push history</li>
                <li>Revoke all Figma integration API tokens</li>
                <li>Destroy your authentication session</li>
              </ul>
            </div>

            {deleteAccountError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-500 font-medium">
                {deleteAccountError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="delete-confirm-input" className="block text-xs font-medium text-[var(--foreground)]">
                Type <strong className="text-red-600 dark:text-red-400">DELETE</strong> to confirm:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => {
                  setDeleteConfirmInput(e.target.value);
                  setDeleteAccountError("");
                }}
                placeholder="DELETE"
                className="w-full bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmInput("");
                  setDeleteAccountError("");
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmInput !== "DELETE" || isDeletingAccount}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingAccount ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Management Modal */}
      {currentModalTv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="overflow-clip bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl transition-colors duration-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <span>{currentModalTv.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--foreground)] border border-[var(--accent-soft)]">
                      {currentModalTv.pairing_code}
                    </span>
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isModalTvOnline
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                      }`}
                  >
                    <span className={`size-1.5 rounded-full ${isModalTvOnline ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                    {isModalTvOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1.5 flex-wrap font-normal">
                  <span>{getScreenSpecs(currentModalTv).resolution}</span>
                  <span>&bull;</span>
                  <span>{getScreenSpecs(currentModalTv).ratio}</span>
                  <span>&bull;</span>
                  <span>{getScreenSpecs(currentModalTv).orientation}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveScreen(null);
                  setConfirmClearImage(false);
                }}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded-lg hover:bg-[var(--surface-soft)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Current Active or Staged Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-semibold tracking-wider text-[var(--muted)]">
                      {stagedImageUrl ? "New Staged Menu Preview" : "Currently Displaying"}
                    </span>
                    {stagedImageUrl && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f27200] text-white shadow-2xs">
                        Draft (Unpublished)
                      </span>
                    )}
                  </div>
                  {stagedImageUrl ? (
                    <button
                      type="button"
                      onClick={handleDiscardStaged}
                      className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                    >
                      Discard Draft ✕
                    </button>
                  ) : currentModalTv.current_menu_url ? (
                    <a
                      href={currentModalTv.current_menu_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline font-semibold"
                    >
                      Open Full Size ↗
                    </a>
                  ) : null}
                </div>

                <div className="aspect-video bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-xl overflow-hidden flex items-center justify-center relative">
                  {stagedImageUrl ? (
                    <>
                      <img
                        src={stagedImageUrl}
                        alt="Staged Menu Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium py-1 px-2.5 rounded-lg text-center">
                        Preview only — Click &quot;Publish&quot; below to update the TV screen.
                      </div>
                    </>
                  ) : currentModalTv.current_menu_url ? (
                    <img
                      src={currentModalTv.current_menu_url}
                      alt="Active Menu"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-1">
                      <p className="text-sm font-semibold text-[var(--muted)]">No Menu Loaded</p>
                      <p className="text-xs text-[var(--muted)]">Display is currently on standby.</p>
                    </div>
                  )}
                </div>

                {/* Clear Image Option (Only shown when not previewing a staged draft and active menu exists) */}
                {!stagedImageUrl && currentModalTv.current_menu_url && (
                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-xs text-[var(--muted)]">
                      Clear active menu graphic from screen
                    </p>
                    {confirmClearImage ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClearImage(currentModalTv.id)}
                          disabled={isClearingImage}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isClearingImage ? "Clearing…" : "Confirm Clear"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearImage(false)}
                          className="text-[var(--muted)] text-xs hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearImage(true)}
                        className="text-xs text-red-500 hover:underline cursor-pointer font-medium"
                      >
                        Clear Menu
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Upload New Menu</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Drag & drop or select an image file to stage before publishing to this display.
                  </p>
                </div>

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
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${dragOver
                    ? "border-[var(--accent)] bg-[var(--surface-soft)]"
                    : "border-[var(--accent-soft)] bg-[var(--surface-soft)] hover:border-[var(--accent)]"
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

                  <svg className="size-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>

                  <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isUploading ? uploadProgressText : "Click to select or drag image here"}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">PNG, JPG, WebP (up to 20MB)</p>

                  {uploadSuccess && stagedImageUrl && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      ✓ Image uploaded and staged! Click &quot;Publish&quot; below to update the TV screen.
                    </div>
                  )}

                  {publishError && (
                    <div className="text-xs font-semibold text-red-500 mt-1">
                      {publishError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
              <div>
                {stagedImageUrl ? (
                  <span className="text-xs text-[#f27200] font-semibold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#f27200] animate-pulse" />
                    New menu staged & ready to publish
                  </span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">Active menu is currently live on TV.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen(null);
                    setStagedImageUrl(null);
                    setConfirmClearImage(false);
                    setPublishError("");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPublishing || isUploading}
                  onClick={() => handlePublish(currentModalTv.id)}
                  className="bg-[#f27200] hover:bg-[#ff8000] text-white font-bold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  {isPublishing && (
                    <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isPublishing ? "Publishing…" : publishSuccess ? "✓ Published!" : "Publish"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[var(--surface)] border-t border-[var(--line)] z-10 transition-colors duration-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#547a7c] dark:text-[#a3b7b5]">
          <span>© {new Date().getFullYear()} miniKast. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <span>Contact:</span>
            <a href="mailto:hello@miniKast.com" className="text-[#008996] dark:text-[#57d6d3] hover:underline font-semibold">
              hello@miniKast.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
