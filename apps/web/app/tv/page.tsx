"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";

type TvState = "loading" | "pairing" | "paired" | "displaying";
type MenuMode = "static" | "hybrid" | "responsive";
type Theme = "light" | "dark";

function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <img aria-hidden="true" src="/theme-sun.svg" alt="" className={`${className} block`} />;
}

function MoonIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <img aria-hidden="true" src="/theme-moon.svg" alt="" className={`${className} block`} />;
}

function ThemeAwareLogo({
  theme,
  className = "h-6 w-[108px]",
}: {
  theme: Theme;
  className?: string;
}) {
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
      className={`inline-block ${className} [&_svg]:block [&_svg]:h-full [&_svg]:w-full`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoMarkup }}
    />
  );
}

interface HybridElement {
  id: string;
  name: string;
  text: string;
  isPrice?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  textAlign?: string;
  letterSpacing?: string;
  lineHeight?: string;
  opacity?: number;
}

interface ResponsiveNode {
  id: string;
  type: "frame" | "text" | "box";
  name: string;
  layoutMode?: "row" | "column" | "none";
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  alignItems?: string;
  justifyContent?: string;
  flexGrow?: number;
  width?: number | "auto" | "100%";
  height?: number | "auto" | "100%";
  backgroundColor?: string;
  borderRadius?: number;
  border?: string;
  text?: string;
  fieldId?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  textAlign?: string;
  children?: ResponsiveNode[];
}

interface MenuData {
  mode: MenuMode;
  canvas?: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  bg_image_url?: string;
  fonts?: string[];
  elements?: HybridElement[];
  fields?: Record<string, { label: string; value: string; isPrice?: boolean }>;
  tree?: ResponsiveNode;
}

function getScreenMetadata() {
  if (typeof window === "undefined") return null;

  const width = window.screen?.width || window.innerWidth;
  const height = window.screen?.height || window.innerHeight;
  const orientation: "Landscape" | "Portrait" = width >= height ? "Landscape" : "Portrait";

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const divisor = gcd(width, height) || 1;
  const ratioW = Math.round(width / divisor);
  const ratioH = Math.round(height / divisor);

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

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PAIRING_STORAGE_KEY = "menucast_tv_pairing";
const PAIRED_STORAGE_KEY = "menucast_tv_paired_device";

interface StoredPairing {
  code: string;
  expiresAt: number;
}

interface StoredPairedDevice {
  tv_id: string;
  name?: string;
  current_menu_url?: string;
  menu_mode?: MenuMode;
  menu_data?: MenuData | null;
}

function getStoredPairedDevice(): StoredPairedDevice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAIRED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.tv_id === "string") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveStoredPairedDevice(device: StoredPairedDevice) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAIRED_STORAGE_KEY, JSON.stringify(device));
  } catch {
    // ignore
  }
}

function clearStoredPairedDevice() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PAIRED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getStoredPairing(): StoredPairing | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAIRING_STORAGE_KEY);
    if (!raw) return null;
    const data: StoredPairing = JSON.parse(raw);
    if (data.expiresAt > Date.now() && data.code) {
      return data;
    }
    localStorage.removeItem(PAIRING_STORAGE_KEY);
  } catch {
    // ignore
  }
  return null;
}

function saveStoredPairing(code: string, expiresAt: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAIRING_STORAGE_KEY, JSON.stringify({ code, expiresAt }));
  } catch {
    // ignore
  }
}

function clearStoredPairing() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PAIRING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// Smooth Image Crossfade Component for TV Display
// ----------------------------------------------------
interface TvImageCrossfadeProps {
  src: string;
  alt?: string;
  className?: string;
}

function TvImageCrossfade({ src, alt = "Restaurant Menu", className = "" }: TvImageCrossfadeProps) {
  // activeSrc: The currently visible base image
  const [activeSrc, setActiveSrc] = useState<string>(src);
  // incomingSrc: The new image currently loading / fading in
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  // incomingOpacity: Controls the CSS opacity of the incoming image (0 or 1)
  const [incomingOpacity, setIncomingOpacity] = useState<number>(0);
  // activeOpacity: Controls the CSS opacity of the base image
  const [activeOpacity, setActiveOpacity] = useState<number>(src ? 1 : 0);

  const swapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeSrc if src changes and activeSrc is empty
  useEffect(() => {
    if (!src) {
      if (activeSrc) {
        setActiveOpacity(0);
        const timer = setTimeout(() => {
          setActiveSrc("");
          setIncomingSrc(null);
        }, 500);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (!activeSrc) {
      setActiveSrc(src);
      setActiveOpacity(1);
      return;
    }

    if (src === activeSrc && !incomingSrc) {
      return;
    }

    if (src === incomingSrc) {
      return;
    }

    // New incoming image to cross-fade
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    setIncomingSrc(src);
    setIncomingOpacity(0);
  }, [src, activeSrc, incomingSrc]);

  const completeSwap = useCallback((newSrc: string) => {
    setActiveSrc(newSrc);
    setActiveOpacity(1);
    setIncomingSrc(null);
    setIncomingOpacity(0);
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
  }, []);

  const handleIncomingLoad = useCallback(() => {
    // Start fade-in on next animation frame
    requestAnimationFrame(() => {
      setIncomingOpacity(1);
    });

    // Schedule base image swap after fade-in animation finishes
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
    }
    swapTimerRef.current = setTimeout(() => {
      if (incomingSrc) {
        completeSwap(incomingSrc);
      }
    }, 850);
  }, [incomingSrc, completeSwap]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black ${className}`}>
      {/* Base Layer (Active / Previous Image) */}
      {activeSrc && (
        <img
          key={`active-${activeSrc}`}
          src={activeSrc}
          alt={alt}
          style={{
            opacity: activeOpacity,
            transition: "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Foreground Layer (New Incoming Image with smooth fade-in) */}
      {incomingSrc && (
        <img
          key={`incoming-${incomingSrc}`}
          ref={(node) => {
            if (node && node.complete && incomingOpacity === 0) {
              handleIncomingLoad();
            }
          }}
          src={incomingSrc}
          alt={alt}
          onLoad={handleIncomingLoad}
          onError={() => {
            console.error("Failed to load incoming image:", incomingSrc);
            if (incomingSrc) {
              completeSwap(incomingSrc);
            }
          }}
          style={{
            opacity: incomingOpacity,
            transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none will-change-[opacity]"
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Recursive Component for Responsive AutoLayout Nodes
// ----------------------------------------------------
function ResponsiveNodeView({
  node,
  fields,
}: {
  node: ResponsiveNode;
  fields: Record<string, { label: string; value: string; isPrice?: boolean }>;
}) {
  if (node.type === "text") {
    const currentVal = (node.fieldId && fields[node.fieldId]?.value) ?? node.text ?? "";
    return (
      <div
        style={{
          fontFamily: node.fontFamily || "inherit",
          fontSize: node.fontSize ? `${node.fontSize}px` : "16px",
          fontWeight: node.fontWeight || 400,
          color: node.color || "#ffffff",
          textAlign: (node.textAlign as React.CSSProperties["textAlign"]) || "left",
          lineHeight: 1.25,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {currentVal}
      </div>
    );
  }

  if (node.type === "box") {
    return (
      <div
        style={{
          width: node.width ? `${node.width}px` : "auto",
          height: node.height ? `${node.height}px` : "auto",
          backgroundColor: node.backgroundColor || "transparent",
          borderRadius: node.borderRadius ? `${node.borderRadius}px` : "0px",
          flexShrink: 0,
        }}
      />
    );
  }

  // Frame / Container
  const isFlex = node.layoutMode === "row" || node.layoutMode === "column";
  return (
    <div
      style={{
        display: isFlex ? "flex" : "block",
        flexDirection: node.layoutMode === "row" ? "row" : node.layoutMode === "column" ? "column" : undefined,
        gap: node.gap ? `${node.gap}px` : undefined,
        paddingTop: node.padding?.top ? `${node.padding.top}px` : undefined,
        paddingRight: node.padding?.right ? `${node.padding.right}px` : undefined,
        paddingBottom: node.padding?.bottom ? `${node.padding.bottom}px` : undefined,
        paddingLeft: node.padding?.left ? `${node.padding.left}px` : undefined,
        alignItems: node.alignItems || undefined,
        justifyContent: node.justifyContent || undefined,
        flexGrow: node.flexGrow || 0,
        backgroundColor: node.backgroundColor || undefined,
        borderRadius: node.borderRadius ? `${node.borderRadius}px` : undefined,
        border: node.border || undefined,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {node.children?.map((child) => (
        <ResponsiveNodeView key={child.id} node={child} fields={fields} />
      ))}
    </div>
  );
}

// ----------------------------------------------------
// Main TV Page Component
// ----------------------------------------------------
export default function TvPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);
  const [state, setState] = useState<TvState>("loading");
  const [pairingCode, setPairingCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [tvId, setTvId] = useState("");
  const [tvName, setTvName] = useState("My TV");
  const [menuUrl, setMenuUrl] = useState("");
  const [menuMode, setMenuMode] = useState<MenuMode>("static");
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 1920, height: 1080 });
  const [screenMeta, setScreenMeta] = useState<ReturnType<typeof getScreenMetadata> | null>(null);
  const [origin, setOrigin] = useState<string>("");
  const [installPrompt, setInstallPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  } | null>(null);

  const isInitializingRef = useRef(false);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize theme with localStorage and document dataset
  useEffect(() => {
    setIsThemeHydrated(true);
    try {
      const stored = window.localStorage.getItem("menucast-theme");
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      } else if (stored === "light") {
        setTheme("light");
        document.documentElement.dataset.theme = "light";
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      }
    } catch {
      // localStorage not accessible
    }
  }, []);

  useEffect(() => {
    if (!isThemeHydrated) return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("menucast-theme", theme);
    } catch {
      // ignore
    }
  }, [theme, isThemeHydrated]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setScreenMeta(getScreenMetadata());
    }
  }, []);

  const appUrl = origin || (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const pairUrl = `${appUrl}/pair?code=${pairingCode}`;

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
      });
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

  // Track window dimensions for scale calculation
  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setScreenMeta(getScreenMetadata());
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dynamically load Google Fonts referenced in menuData
  useEffect(() => {
    if (!menuData?.fonts || menuData.fonts.length === 0) return;
    const validFonts = menuData.fonts.filter(
      (f: string) => f && f !== "sans-serif" && f !== "serif" && f !== "monospace"
    );
    if (validFonts.length === 0) return;

    try {
      const families = validFonts
        .map((f: string) => encodeURIComponent(f).replace(/%20/g, "+") + ":wght@300;400;500;600;700;800;900")
        .join("&family=");
      const fontUrl = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      let link = document.querySelector(`link[href="${fontUrl}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontUrl;
        document.head.appendChild(link);
      }
    } catch (e) {
      console.error("Failed to load Google Fonts:", e);
    }
  }, [menuData]);

  const triggerControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    triggerControls();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
    }
  }, [triggerControls]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Listen for user interaction to reveal controls
  useEffect(() => {
    if (state !== "displaying") return;

    const handleActivity = () => {
      triggerControls();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("pointermove", handleActivity);

    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("pointermove", handleActivity);
    };
  }, [state, triggerControls]);

  // TV remote & keyboard shortcuts (F for Fullscreen, R for Refresh Code, T for Theme)
  useEffect(() => {
    const handleTvKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        if (state === "pairing") {
          e.preventDefault();
          initTv(true);
        }
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
      }
    };
    window.addEventListener("keydown", handleTvKey);
    return () => window.removeEventListener("keydown", handleTvKey);
  }, [toggleFullscreen, state]);

  // Initialize or refresh pairing code
  async function initTv(forceNew = false) {
    if (isInitializingRef.current && !forceNew) return;
    isInitializingRef.current = true;

    if (!forceNew) {
      const stored = getStoredPairing();
      if (stored) {
        setPairingCode(stored.code);
        setExpiresAt(stored.expiresAt);
        setState("pairing");
        isInitializingRef.current = false;
        return;
      }
    }

    try {
      const meta = getScreenMetadata();
      const res = await fetch("/api/tv/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta || {}),
      });
      const data = await res.json();
      const expiration = Date.now() + PAIRING_CODE_TTL_MS;
      saveStoredPairing(data.pairing_code, expiration);
      setPairingCode(data.pairing_code);
      setExpiresAt(expiration);
      setState("pairing");
    } catch (err) {
      console.error("Failed to init TV:", err);
    } finally {
      isInitializingRef.current = false;
    }
  }

  // Step 1: Check if already paired
  useEffect(() => {
    async function checkPairedOrInit() {
      const storedPaired = getStoredPairedDevice();
      if (storedPaired?.tv_id) {
        setTvId(storedPaired.tv_id);
        if (storedPaired.name) setTvName(storedPaired.name);
        if (storedPaired.current_menu_url) setMenuUrl(storedPaired.current_menu_url);
        if (storedPaired.menu_mode) setMenuMode(storedPaired.menu_mode);
        if (storedPaired.menu_data) setMenuData(storedPaired.menu_data);
        if (storedPaired.current_menu_url || (storedPaired.menu_mode === "responsive" && storedPaired.menu_data)) {
          setState("displaying");
        } else {
          setState("paired");
        }

        try {
          const res = await fetch(`/api/tv/status?tv_id=${encodeURIComponent(storedPaired.tv_id)}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.paired && data.tv_id) {
              setTvId(data.tv_id);
              const resolvedName = data.name || storedPaired.name || "My TV";
              setTvName(resolvedName);
              const activeMenuUrl = data.current_menu_url || storedPaired.current_menu_url || "";
              const activeMode = (data.menu_mode || storedPaired.menu_mode || "static") as MenuMode;
              const activeData = (data.menu_data || storedPaired.menu_data || null) as MenuData | null;

              setMenuUrl(activeMenuUrl);
              setMenuMode(activeMode);
              setMenuData(activeData);

              saveStoredPairedDevice({
                tv_id: data.tv_id,
                name: resolvedName,
                current_menu_url: activeMenuUrl,
                menu_mode: activeMode,
                menu_data: activeData,
              });

              if (activeMenuUrl || (activeMode === "responsive" && activeData)) {
                setState("displaying");
              } else {
                setState("paired");
              }
              return;
            }
          }
        } catch (err) {
          console.error("Error checking TV status:", err);
          if (storedPaired.current_menu_url) {
            setTvId(storedPaired.tv_id);
            setTvName(storedPaired.name || "My TV");
            setMenuUrl(storedPaired.current_menu_url);
            setMenuMode(storedPaired.menu_mode || "static");
            setMenuData(storedPaired.menu_data || null);
            setState("displaying");
            return;
          }
        }

        clearStoredPairedDevice();
      }

      initTv();
    }

    checkPairedOrInit();
  }, []);

  // Step 1b: 10-minute countdown
  useEffect(() => {
    if (state !== "pairing" || !expiresAt) return;

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        initTv(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, expiresAt]);

  // Step 2: Listen for pairing event
  useEffect(() => {
    if (!pairingCode || state !== "pairing") return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const pairingChannel = supabase
      .channel(`pairing:${pairingCode}`)
      .on("broadcast", { event: "tv:paired" }, (payload) => {
        const { tv_id, name } = payload.payload as { tv_id: string; name?: string };
        setTvId(tv_id);
        const resolvedName = name || "My TV";
        if (name) setTvName(resolvedName);
        clearStoredPairing();
        saveStoredPairedDevice({
          tv_id,
          name: resolvedName,
        });
        setState("paired");
      })
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/status?code=${encodeURIComponent(pairingCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paired && data.tv_id) {
            setTvId(data.tv_id);
            const resolvedName = data.name || "My TV";
            if (data.name) setTvName(resolvedName);
            clearStoredPairing();
            const activeMenuUrl = data.current_menu_url || "";
            const activeMode = (data.menu_mode || "static") as MenuMode;
            const activeData = (data.menu_data || null) as MenuData | null;

            saveStoredPairedDevice({
              tv_id: data.tv_id,
              name: resolvedName,
              current_menu_url: activeMenuUrl,
              menu_mode: activeMode,
              menu_data: activeData,
            });

            setMenuMode(activeMode);
            setMenuData(activeData);

            if (activeMenuUrl || (activeMode === "responsive" && activeData)) {
              setMenuUrl(activeMenuUrl);
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

  // Step 3: Screen metadata (reports on pair, resize, and fullscreen change)
  useEffect(() => {
    if (!tvId) return;

    const reportScreen = () => {
      const meta = getScreenMetadata();
      if (!meta) return;
      setScreenMeta(meta);

      fetch("/api/tv/screen-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tv_id: tvId,
          ...meta,
        }),
      }).catch((err) => console.error("Error reporting screen info:", err));
    };

    // Report immediately
    reportScreen();

    // Listen to resize / fullscreen
    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reportScreen, 400);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", reportScreen);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", reportScreen);
    };
  }, [tvId]);

  // Step 3.5: Heartbeat telemetry (ping every 30s and immediately on visible/focus when tvId is active)
  useEffect(() => {
    if (!tvId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/tv/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tv_id: tvId }),
        });
      } catch (err) {
        console.error("Failed to send heartbeat:", err);
      }
    };

    // Send immediate ping on load/pair
    sendHeartbeat();

    // Repeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    // Also trigger immediate heartbeat when tab becomes visible or focused
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [tvId]);

  // Step 4: Listen for menu pushes and live data updates
  useEffect(() => {
    if (!tvId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const tvChannel = supabase
      .channel(`tv:${tvId}`)
      .on("broadcast", { event: "menu:push" }, (payload) => {
        const { image_url, menu_mode: mode = "static", menu_data: data = null } = payload.payload as {
          image_url: string;
          menu_mode?: MenuMode;
          menu_data?: MenuData | null;
        };

        saveStoredPairedDevice({
          tv_id: tvId,
          name: tvName,
          current_menu_url: image_url || "",
          menu_mode: mode,
          menu_data: data,
        });

        setMenuUrl(image_url || "");
        setMenuMode(mode);
        setMenuData(data);
        if (image_url || (mode === "responsive" && data)) {
          setState("displaying");
        } else {
          setState("paired");
        }
      })
      .on("broadcast", { event: "menu:clear" }, () => {
        saveStoredPairedDevice({
          tv_id: tvId,
          name: tvName,
          current_menu_url: "",
          menu_mode: "static",
          menu_data: null,
        });
        setIsFading(true);
        setTimeout(() => {
          setMenuUrl("");
          setMenuMode("static");
          setMenuData(null);
          setIsFading(false);
          setState("paired");
        }, 400);
      })
      .on("broadcast", { event: "menu:data-update" }, (payload) => {
        const { menu_data: updatedData } = payload.payload as { menu_data: MenuData };
        if (updatedData) {
          setMenuData(updatedData);
          saveStoredPairedDevice({
            tv_id: tvId,
            name: tvName,
            current_menu_url: menuUrl,
            menu_mode: menuMode,
            menu_data: updatedData,
          });
        }
      })
      .on("broadcast", { event: "tv:unpaired" }, () => {
        clearStoredPairedDevice();
        setTvId("");
        setMenuUrl("");
        initTv(true);
      })
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/status?tv_id=${encodeURIComponent(tvId)}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.paired) {
            clearStoredPairedDevice();
            setTvId("");
            setMenuUrl("");
            initTv(true);
            return;
          }
          if (data.name && data.name !== tvName) {
            setTvName(data.name);
          }
          if (
            (data.current_menu_url && data.current_menu_url !== menuUrl) ||
            data.menu_mode !== menuMode
          ) {
            const nextMode = (data.menu_mode || "static") as MenuMode;
            const nextData = (data.menu_data || null) as MenuData | null;

            saveStoredPairedDevice({
              tv_id: tvId,
              name: data.name || tvName,
              current_menu_url: data.current_menu_url,
              menu_mode: nextMode,
              menu_data: nextData,
            });

            setMenuUrl(data.current_menu_url || "");
            setMenuMode(nextMode);
            setMenuData(nextData);
            if (data.current_menu_url || (nextMode === "responsive" && nextData)) {
              setState("displaying");
            } else {
              setState("paired");
            }
          } else if (!data.current_menu_url && !data.menu_data && (menuUrl || menuData)) {
            saveStoredPairedDevice({
              tv_id: tvId,
              name: data.name || tvName,
              current_menu_url: "",
              menu_mode: "static",
              menu_data: null,
            });
            setIsFading(true);
            setTimeout(() => {
              setMenuUrl("");
              setMenuMode("static");
              setMenuData(null);
              setIsFading(false);
              setState("paired");
            }, 400);
          }
        } else if (res.status === 404) {
          clearStoredPairedDevice();
          setTvId("");
          initTv(true);
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(tvChannel);
    };
  }, [tvId, tvName, menuUrl, menuMode, menuData]);

  // Calculate canvas scaling for Hybrid & Responsive modes
  const canvasScale = useMemo(() => {
    const canvasWidth = menuData?.canvas?.width || 1920;
    const canvasHeight = menuData?.canvas?.height || 1080;
    const scaleX = windowDimensions.width / canvasWidth;
    const scaleY = windowDimensions.height / canvasHeight;
    return Math.min(scaleX, scaleY);
  }, [menuData, windowDimensions]);

  // Format time remaining
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  // State 0: Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // State 1: Pairing Screen
  if (state === "pairing") {
    const nextTheme = theme === "light" ? "dark" : "light";
    return (
      <div className="home-shell min-h-screen w-screen flex flex-col justify-between select-none overflow-hidden relative bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <div className="home-noise" aria-hidden="true" />

        {/* Top Header Controls */}
        <header className="w-full flex items-center justify-between px-6 py-4 z-20">
          <div className="flex items-center gap-2">
            <ThemeAwareLogo theme={theme} className="h-6 w-[108px]" />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <button
              onClick={() => setTheme(nextTheme)}
              title={`Switch to ${nextTheme} theme`}
              aria-label={`Switch to ${nextTheme} theme`}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {theme === "light" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <kbd className="px-1.5 py-0.5 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded text-[10px] font-mono text-[var(--muted)]">F</kbd>
              <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
            <button
              onClick={() => initTv(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <kbd className="px-1.5 py-0.5 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded text-[10px] font-mono text-[var(--muted)]">R</kbd>
              <span>New Code</span>
            </button>
          </div>
        </header>

        {/* Main Pairing Card (Matching Figma node 1459:10382) */}
        <main className="flex-1 flex items-center justify-center p-6 z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 max-w-4xl w-full animate-in fade-in zoom-in-95 duration-500">
            {/* Left Column: High-Contrast QR Code Card with Perched Mascot */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Perched Mascot tilted at 33.52deg on top-left of QR frame */}
                <div className="-mb-[10px] z-20 pointer-events-none">
                  <img
                    src="/logo-minikast.svg"
                    alt="miniKast mascot"
                    className="w-12 h-auto"
                  />
                </div>

                {/* QR Code Container with 4px border */}
                <div className="bg-white border-4 border-[#008996] rounded-[20px] p-3.5 shadow-xl flex items-center justify-center size-[215px] sm:size-[225px]">
                  {pairingCode ? (
                    <QRCodeSVG
                      value={pairUrl}
                      size={190}
                      level="H"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="size-[190px] flex items-center justify-center">
                      <div className="size-8 rounded-full border-2 border-[#008996] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Refresh Text */}
              <p className="mt-3 text-sm sm:text-base font-normal text-[var(--muted)] text-center">
                Refreshes in {minutes}:{seconds}
              </p>
            </div>

            {/* Right Column: Setup Instructions & Unified Code Card */}
            <div className="flex flex-col items-start gap-6 max-w-sm sm:max-w-md w-full">
              <div className="space-y-2">
                <p className="text-base font-bold text-[var(--muted)]">
                  Screen Setup
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
                  Pair this Display
                </h1>
                <p className="text-base font-normal text-[var(--muted)] leading-relaxed">
                  Scan the QR code with your phone or visit the link below to link this display to your miniKast account.
                </p>
              </div>

              {/* Pairing Code Card */}
              <div className="w-full bg-[var(--surface)] border border-[var(--muted)] rounded-[16px] px-4 py-2.5 flex items-center justify-between shadow-2xs">
                <span className="text-base font-normal text-[var(--muted)]">
                  Pairing Code
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[var(--accent)] font-mono tracking-wide">
                  {pairingCode ? pairingCode.replace("-", " -") : "···· - ····"}
                </span>
              </div>

              {/* Manual Link Fallback */}
              <p className="text-xs text-[var(--muted)] font-mono">
                Manual link: <span className="text-[var(--foreground)] underline">{appUrl}/pair?code={pairingCode}</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-[var(--muted)] py-4 z-10">
          <span>TV Mode Active &bull; Auto-reconnecting on signal loss</span>
        </footer>
      </div>
    );
  }

  // State 2: Paired screen awaiting first push (Matching Figma node 1485:2350)
  if (state === "paired" && !menuUrl && (!menuData || menuMode === "static")) {
    const nextTheme = theme === "light" ? "dark" : "light";
    return (
      <div className="home-shell min-h-screen w-screen flex flex-col justify-between select-none overflow-hidden relative bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <div className="home-noise" aria-hidden="true" />

        {/* Top Header Controls */}
        <header className="w-full flex items-center justify-between px-6 py-4 z-20">
          <div className="flex items-center gap-2">
            <ThemeAwareLogo theme={theme} className="h-6 w-[108px]" />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <button
              onClick={() => setTheme(nextTheme)}
              title={`Switch to ${nextTheme} theme`}
              aria-label={`Switch to ${nextTheme} theme`}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {theme === "light" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--accent-soft)] text-[var(--foreground)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <kbd className="px-1.5 py-0.5 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded text-[10px] font-mono text-[var(--muted)]">F</kbd>
              <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
          </div>
        </header>

        {/* Main Paired Card Content (Figma node 1485:2350) */}
        <main className="flex-1 flex items-center justify-center p-6 z-10">
          <div className="flex flex-col items-center gap-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-500 text-center">
            {/* Green Tick Success Container (Figma node 1485:2416) */}
            <div className="bg-[var(--surface-soft)] border-4 border-[#008996] rounded-[24px] size-[131px] flex items-center justify-center shadow-lg">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                className="w-16 h-16 text-[#00c04b]"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 34L26 46L50 18" />
              </svg>
            </div>

            {/* Heading & Next Step Card */}
            <div className="flex flex-col items-center gap-4 w-full">
              <h1 className="text-[32px] font-bold text-[var(--foreground)] leading-tight tracking-tight">
                TV Paired!
              </h1>

              {/* Next Step Card (w-311px, rounded-16px) */}
              <div className="w-[311px] max-w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-[16px] p-4 flex flex-col gap-2 shadow-2xs text-center">
                <span className="text-base font-bold text-[#008996]">
                  Next Step
                </span>
                <p className="text-base font-normal text-[var(--muted)] leading-5">
                  Open the miniKast dashboard, upload your design, and publish it!
                </p>
              </div>

              {/* Live Updates Listener */}
              <div className="flex items-center justify-center gap-2 text-base text-[var(--muted)] py-2">
                <span className="size-2 rounded-full bg-[#00c04b] animate-ping shrink-0" />
                <span>Listening for live updates...</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-[var(--muted)] py-4 z-10">
          <span>TV Mode Active &bull; {tvName} &bull; Auto-reconnecting on signal loss</span>
        </footer>
      </div>
    );
  }

  // State 3: Displaying Live Menu (Supporting Static, Hybrid, and Responsive Modes)
  const canvasW = menuData?.canvas?.width || 1920;
  const canvasH = menuData?.canvas?.height || 1080;

  return (
    <div
      className={`relative h-screen w-screen bg-black flex items-center justify-center overflow-hidden select-none transition-all duration-300 ${showControls ? "cursor-default" : "cursor-none"
        }`}
      onMouseMove={triggerControls}
      onClick={triggerControls}
    >
      {/* Floating Control Menu Bar (Figma node 1492:8284) */}
      <div
        className={`fixed top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-500 ease-out ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"
          }`}
      >
        <div className="pointer-events-auto flex items-center justify-between gap-4 bg-[rgba(9,21,22,0.85)] backdrop-blur-md border border-[#304243] shadow-2xl px-4 py-2.5 rounded-[16px] max-w-lg w-full text-white select-none">
          {/* Left Info: Title & Live Dot + Metadata Subtitle */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-white font-['Nunito'] leading-tight">
                miniKast TV
              </span>
              <span className="size-[6px] rounded-full bg-[#00c04b] animate-pulse inline-block shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-normal text-[#b7eaed] font-['Nunito'] truncate leading-tight">
              <span className="truncate">{tvName || "My TV"}</span>
              <span>•</span>
              <span>{screenMeta?.orientation || (windowDimensions.width >= windowDimensions.height ? "Landscape" : "Portrait")}</span>
              <span>•</span>
              <span>{screenMeta?.aspect_ratio || "16:9"}</span>
              <span>•</span>
              <span>
                {screenMeta
                  ? `${screenMeta.screen_width}x${screenMeta.screen_height}`
                  : `${windowDimensions.width}x${windowDimensions.height}`}
              </span>
            </div>
          </div>

          {/* Right Action: Fullscreen Pill Button */}
          <div className="flex items-center gap-2 shrink-0">
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallApp}
                title="Install TV Display App on this Device"
                className="flex items-center gap-1.5 bg-[#008996]/20 hover:bg-[#008996]/30 text-[#b7eaed] border border-[#008996]/40 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="flex items-center gap-1.5 border border-white/80 hover:border-white hover:bg-white/10 text-white px-3.5 py-1 rounded-full text-xs font-bold font-['Nunito'] tracking-wide transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h4m-4 0v4m6 6l5 5m0 0h-4m4 0v-4m-11 5l5-5m-5 5v-4m0 4h4m11-11l-5 5m5-5v4m0-4h-4" />
                  </svg>
                  <span>Exit</span>
                </>
              ) : (
                <>
                  <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: Static Image */}
      {menuMode === "static" && menuUrl && (
        <TvImageCrossfade
          src={menuUrl}
          alt="Restaurant Menu"
        />
      )}

      {/* MODE 2: Hybrid Overlay (Background Graphic + Scaled Live HTML Text & Prices) */}
      {menuMode === "hybrid" && (
        <div
          className={`flex items-center justify-center ${isFading ? "opacity-0" : "opacity-100"
            }`}
          style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${canvasW}px`,
              height: `${canvasH}px`,
              transform: `scale(${canvasScale})`,
              transformOrigin: "center center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {(menuData?.bg_image_url || menuUrl) && (
              <TvImageCrossfade
                src={menuData?.bg_image_url || menuUrl}
                alt="Menu Background"
                className="absolute inset-0"
              />
            )}
            {menuData?.elements?.map((el) => (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  fontSize: `${el.fontSize}px`,
                  fontFamily: el.fontFamily || "inherit",
                  fontWeight: el.fontWeight || 400,
                  color: el.color || "#ffffff",
                  textAlign: (el.textAlign as React.CSSProperties["textAlign"]) || "left",
                  letterSpacing: el.letterSpacing || "normal",
                  lineHeight: el.lineHeight || 1.2,
                  opacity: el.opacity ?? 1,
                  display: "flex",
                  alignItems: "flex-start",
                  overflow: "visible",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  boxSizing: "border-box",
                }}
              >
                {el.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 3: Responsive AutoLayout HTML & CSS */}
      {menuMode === "responsive" && menuData?.tree && (
        <div
          className={`transition-opacity duration-300 flex items-center justify-center ${isFading ? "opacity-0" : "opacity-100"
            }`}
          style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${canvasW}px`,
              height: `${canvasH}px`,
              transform: `scale(${canvasScale})`,
              transformOrigin: "center center",
              backgroundColor: menuData?.canvas?.backgroundColor || "#111111",
              position: "relative",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            <ResponsiveNodeView
              node={menuData.tree}
              fields={menuData.fields || {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
