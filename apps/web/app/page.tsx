"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function SunIcon() {
  return <img aria-hidden="true" src="/theme-sun.svg" alt="" className="w-6 h-6 block" />;
}

function MoonIcon() {
  return <img aria-hidden="true" src="/theme-moon.svg" alt="" className="w-6 h-6 block" />;
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
      className="block w-[90px] max-w-full h-5 [&_svg]:block [&_svg]:w-[90px] [&_svg]:max-w-full [&_svg]:h-5"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoMarkup }}
    />
  );
}

function SourceIcon({ kind }: { kind: "image" | "pdf" | "video" | "figma" }) {
  const iconSources = {
    image: "/source-image.svg",
    pdf: "/source-pdf.svg",
    video: "/source-video.svg",
    figma: "/source-figma.svg",
  };

  return (
    <span className="grid place-items-center" aria-hidden="true">
      <img
        src={iconSources[kind]}
        alt=""
        className="w-8 h-8 block invert-on-dark dark:brightness-0 dark:invert transition-[filter] duration-300"
      />
    </span>
  );
}

function DemoMenu() {
  return (
    <div className="w-full h-full">
      <div
        className="h-full flex flex-col justify-between p-4 sm:p-6 md:p-7 overflow-hidden text-[#f8f4e8] bg-[#172b29] rounded-[2px] relative"
        role="img"
        aria-label="Example digital menu displayed on a TV"
      >
        <div
          className="absolute w-[45%] aspect-square -right-[7%] -bottom-[35%] rounded-full bg-[#d77c59] opacity-90 pointer-events-none"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm tracking-[0.12em] uppercase font-bold">
          <span className="w-6 h-6 grid place-items-center text-white bg-[var(--accent)] font-serif italic font-bold rounded">
            m
          </span>
          <span>morning ritual</span>
        </div>
        <div className="text-xl sm:text-3xl md:text-4xl leading-[0.85] tracking-tight font-black">
          GOOD FOOD
          <br />
          <span className="text-[#f3c76b]">GOOD MOOD</span>
        </div>
        <div className="grid gap-1 max-w-[75%] text-[8px] sm:text-[10px] md:text-xs tracking-wider">
          <span className="flex justify-between gap-2 border-b border-[#58706a] pb-0.5">
            <span>AVOCADO TOAST</span>
            <b className="text-[#f3c76b]">$12</b>
          </span>
          <span className="flex justify-between gap-2 border-b border-[#58706a] pb-0.5">
            <span>RICOTTA PANCAKES</span>
            <b className="text-[#f3c76b]">$14</b>
          </span>
          <span className="flex justify-between gap-2 border-b border-[#58706a] pb-0.5">
            <span>SEASONAL BOWL</span>
            <b className="text-[#f3c76b]">$16</b>
          </span>
        </div>
        <div className="relative z-10 text-[#a7c9bd] text-[8px] sm:text-[9px] tracking-[0.16em]">
          BRUNCH · COFFEE · GOOD COMPANY
        </div>
      </div>
    </div>
  );
}

const platforms = [
  { name: "Samsung", src: "/platform-samsung.svg", className: "w-[90px] dark:brightness-0 dark:invert" },
  { name: "LG", src: "/platform-lg.svg", className: "w-[67px]" },
  { name: "Android", src: "/platform-android.svg", className: "w-[50px]" },
  { name: "Apple", src: "/platform-apple.svg", className: "w-[51px] dark:brightness-0 dark:invert" },
  { name: "Fire TV", src: "/platform-fire-tv.svg", className: "w-[66px]" },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize theme after hydration to avoid mismatch
  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = window.localStorage.getItem("menucast-theme");
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      }
    } catch {
      // localStorage not available, keep default "light"
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("menucast-theme", theme);
    } catch {
      // Theme switching still works for current session
    }
  }, [theme, isHydrated]);

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <main className="home-shell min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-[var(--background)] transition-colors duration-300">
      <div className="home-noise" aria-hidden="true" />

      {/* Header */}
      <header className="w-full max-w-[806px] min-h-[72px] mx-auto px-4 sm:px-8 md:px-16 flex items-center justify-between z-10 transition-colors duration-300">
        <Link href="/" className="w-[139px] h-11 flex items-center" aria-label="MenuCast home">
          <ThemeAwareLogo theme={theme} />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-5" aria-label="Main navigation">
          <button
            className="w-10 h-10 p-2 text-[var(--foreground)] bg-transparent rounded-lg hover:bg-[var(--surface-soft)] transition-colors flex items-center justify-center cursor-pointer"
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <Link
            href="/login"
            className="min-h-8 px-4.5 inline-flex items-center justify-center text-sm font-medium rounded-full bg-[var(--button)] text-[var(--button-text)] hover:-translate-y-0.5 hover:opacity-90 transition-all shadow-sm"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center px-4 sm:px-8 md:px-16 py-11 text-center relative z-10">
        <div className="max-w-[560px] mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-[56px] leading-[1.05] font-medium tracking-tight text-[var(--foreground)]">
            Your menu.
            <br />
            <span className="text-[var(--accent)]">Any TV. Instantly.</span>
          </h1>
          <p className="mt-4 max-w-[500px] text-base sm:text-lg text-[var(--muted)] leading-relaxed mx-auto">
            Upload your design. Publish to your screen. Just beautiful menus on display.
          </p>
        </div>

        {/* Interactive Demo Showcase */}
        <div className="mt-9 flex flex-col items-center gap-4 w-full max-w-[376px] mx-auto">
          <img
            className="mb-[-30px] self-start relative z-10 w-16 h-16"
            src="/logo-minikast.svg"
            alt="miniKast logo"
          />
          <div className="w-full aspect-video p-1 bg-[var(--accent)] rounded-md shadow-2xl transition-all duration-300">
            <DemoMenu />
          </div>

          {/* Supported Format Badges */}
          <div className="flex gap-2 justify-center" aria-label="Supported source formats">
            {(["image", "pdf", "video", "figma"] as const).map((kind) => (
              <span
                key={kind}
                className="w-12 h-12 grid place-items-center bg-[var(--background)] border border-[var(--line)] rounded-lg shadow-sm text-[var(--muted)] transition-all hover:scale-105"
                role="img"
                aria-label={`${kind.toUpperCase()} source format`}
              >
                <SourceIcon kind={kind} />
              </span>
            ))}
          </div>

          {/* Primary CTA */}
          <Link
            href="/pair"
            className="w-full sm:w-auto min-h-12 px-6 inline-flex items-center justify-center gap-3 bg-[var(--button)] text-[var(--button-text)] rounded-full text-base font-semibold hover:-translate-y-0.5 hover:opacity-90 transition-all shadow-md mt-1 cursor-pointer"
          >
            Pair Your TV <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* Supported Platform Devices */}
      <section
        className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 py-6 pb-8 flex flex-col items-center text-[var(--muted)] z-10"
        aria-labelledby="platform-title"
      >
        <p id="platform-title" className="mb-3.5 text-sm font-bold tracking-wide">
          Available on
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-4.5 gap-y-2">
          {platforms.map((platform) => (
            <span
              key={platform.name}
              className="h-12 inline-flex items-center justify-center px-2"
            >
              <img
                src={platform.src}
                alt={platform.name}
                className={`max-h-12 max-w-full block ${platform.className}`}
              />
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="w-full bg-[var(--button-text)] border-t border-[var(--line)] z-10 transition-colors duration-300">
        <footer className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--muted)]">
          <span>© 2026 MenuCast. All rights reserved.</span>
          <span>
            Contact:{" "}
            <a
              href="mailto:hello@menucast.com"
              className="text-[var(--foreground)] font-bold hover:underline"
            >
              hello@menucast.com
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}
