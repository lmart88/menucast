"use client";

import { useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "menucast_install_prompt_dismissed";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed recently
    try {
      const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_COOLDOWN_MS) {
        return;
      }
    } catch {
      // ignore
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      // Small delay before showing banner for smooth entry
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Also listen if app is installed while open
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom Banner */}
      <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* App Icon */}
            <div className="size-11 rounded-xl bg-neutral-950 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-1">
              <img src="/icons/icon-192.png" alt="MenuCast" className="w-full h-full object-contain rounded-lg" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">Install MenuCast App</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  Fast Access
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-snug">
                Install on your TV or device for a borderless full-screen experience.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              title="Dismiss"
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* iOS "Add to Home Screen" Visual Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-3xl max-w-sm w-full p-6 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-neutral-950 border border-emerald-500/30 flex items-center justify-center overflow-hidden p-1.5">
                  <img src="/icons/icon-192.png" alt="MenuCast" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Install MenuCast</h3>
                  <p className="text-xs text-neutral-400">iOS Safari Instructions</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="size-7 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-bold shrink-0 text-emerald-400">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white">Share</strong> button{" "}
                  <span className="inline-block px-1.5 py-0.5 bg-neutral-800 rounded border border-white/10">
                    ⎋
                  </span>{" "}
                  at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="size-7 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-bold shrink-0 text-emerald-400">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>{" "}
                  <span className="inline-block px-1.5 py-0.5 bg-neutral-800 rounded border border-white/10">
                    ➕
                  </span>.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="size-7 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-bold shrink-0 text-emerald-400">
                  3
                </span>
                <p>
                  Tap <strong className="text-white">"Add"</strong> in the top right corner.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="w-full bg-white text-neutral-950 font-bold py-2.5 rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
