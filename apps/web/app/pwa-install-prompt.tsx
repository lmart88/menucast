"use client";

import { useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "menucast_install_prompt_dismissed";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
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
        // Still listen for native event even if banner is suppressed
      } else {
        // Will show banner when prompt is ready
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
      try {
        const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) >= DISMISS_COOLDOWN_MS) {
          const timer = setTimeout(() => setShowBanner(true), 2500);
          return () => clearTimeout(timer);
        }
      } catch {
        // ignore
      }
      return;
    }

    // 4. Capture native beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      try {
        const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) >= DISMISS_COOLDOWN_MS) {
          setTimeout(() => setShowBanner(true), 1500);
        }
      } catch {
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Also listen if app is installed while open
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setShowInstructionsModal(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Global trigger event listener (e.g. clicked "Install App" button in Dashboard header)
  useEffect(() => {
    const handleTriggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }: any) => {
          if (outcome === "accepted") {
            setShowBanner(false);
            setDeferredPrompt(null);
          }
        });
      } else {
        setShowInstructionsModal(true);
      }
    };

    window.addEventListener("minikast:trigger-install", handleTriggerInstall);
    return () => {
      window.removeEventListener("minikast:trigger-install", handleTriggerInstall);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
      return;
    }

    setShowInstructionsModal(true);
  }

  function handleDismiss() {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Floating Bottom Install PopUp (Figma node 1470:9050) */}
      {!isInstalled && showBanner && (
        <aside
          aria-label="Install miniKast App"
          className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-[410px] z-50 animate-in fade-in slide-in-from-bottom-6 duration-300"
        >
          <div className="bg-[#f7fcfc] dark:bg-[#0D1F21] border border-[#b7eaed] dark:border-[#173e40] rounded-[16px] p-3 shadow-lg flex items-center justify-between gap-3 text-[#0d1f21] dark:text-[#f4f8f7] transition-colors">
            {/* Mascot App Icon */}
            <div className="size-12 rounded-[8px] bg-white dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] flex items-center justify-center shrink-0 p-1.5 shadow-2xs overflow-hidden">
              <img
                src="/logo-minikast.svg"
                alt="miniKast mascot"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="font-bold text-[14px] leading-tight text-[#0d1f21] dark:text-[#f4f8f7] truncate">
                Install miniKast App
              </h4>
              <p className="font-normal text-[14px] leading-tight text-[#547a7c] dark:text-[#a3b7b5] truncate mt-1">
                Launch directly from your device.
              </p>
            </div>

            {/* Action Pill Button & Dismiss */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-[#008996] hover:bg-[#007783] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Install</span>
              </button>

              <button
                onClick={handleDismiss}
                title="Dismiss"
                aria-label="Dismiss installation prompt"
                className="text-[#547a7c] hover:text-[#0d1f21] dark:hover:text-white p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Branded Installation Guide Modal (iOS Safari & Manual Platforms) */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1F21] border border-[#b7eaed] dark:border-[#173e40] rounded-[24px] max-w-sm w-full p-6 text-[#0d1f21] dark:text-[#f4f8f7] space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-[12px] bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] flex items-center justify-center overflow-hidden p-1.5">
                  <img src="/logo-minikast.svg" alt="miniKast" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0d1f21] dark:text-white">Install miniKast App</h3>
                  <p className="text-xs text-[#547a7c] dark:text-[#a3b7b5]">Launch directly from your device</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-[#547a7c] hover:text-[#0d1f21] dark:hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 text-xs text-[#547a7c] dark:text-[#a3b7b5]">
                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-[#0d1f21] dark:text-white">Share</strong> button{" "}
                    <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-black rounded border border-[#b7eaed] dark:border-[#173e40] font-mono">
                      ⎋
                    </span>{" "}
                    in Safari’s toolbar.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong className="text-[#0d1f21] dark:text-white">"Add to Home Screen"</strong>{" "}
                    <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-black rounded border border-[#b7eaed] dark:border-[#173e40]">
                      ➕
                    </span>.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <p>
                    Tap <strong className="text-[#0d1f21] dark:text-white">"Add"</strong> in the top right corner.
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop / Browser Instructions */
              <div className="space-y-3 text-xs text-[#547a7c] dark:text-[#a3b7b5]">
                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <p>
                    Click the <strong className="text-[#0d1f21] dark:text-white">Install</strong> icon in your browser address bar (top-right).
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <p>
                    Or open the browser menu (<strong className="text-[#0d1f21] dark:text-white">⋮</strong>) and select <strong className="text-[#0d1f21] dark:text-white">"Install miniKast"</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#f7fcfc] dark:bg-[#12282a] border border-[#b7eaed] dark:border-[#173e40] rounded-xl p-3">
                  <span className="size-6 rounded-lg bg-[#008996] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <p>
                    miniKast will launch in its own fast, borderless window!
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowInstructionsModal(false);
                handleDismiss();
              }}
              className="w-full bg-[#008996] hover:bg-[#007783] text-white font-bold py-2.5 rounded-full text-xs transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
