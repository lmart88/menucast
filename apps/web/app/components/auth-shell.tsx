"use client";

import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark";

export function SunIcon() {
  return <img aria-hidden="true" src="/theme-sun.svg" alt="" className="w-6 h-6 block" />;
}

export function MoonIcon() {
  return <img aria-hidden="true" src="/theme-moon.svg" alt="" className="w-6 h-6 block" />;
}

export function ThemeAwareLogo({ theme }: { theme: Theme }) {
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

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = window.localStorage.getItem("menucast-theme");
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      }
    } catch {
      // localStorage not available
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

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <main className="home-shell min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-[var(--background)] transition-colors duration-300">
      <div className="home-noise" aria-hidden="true" />
      
      {/* Header */}
      <header className="w-full max-w-[806px] min-h-[72px] mx-auto px-4 sm:px-8 md:px-16 flex items-center justify-between z-10 transition-colors duration-300">
        <Link href="/" className="w-[139px] h-11 flex items-center" aria-label="MenuCast home">
          <ThemeAwareLogo theme={theme} />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-5" aria-label="Auth actions">
          <button
            className="w-10 h-10 p-2 text-[var(--foreground)] bg-transparent rounded-lg hover:bg-[var(--surface-soft)] transition-colors flex items-center justify-center cursor-pointer"
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </nav>
      </header>

      {/* Main Content / Auth Card */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        {children}
      </section>

      {/* Footer */}
      <div className="w-full bg-[var(--button-text)] border-t border-[var(--line)] z-10 transition-colors duration-300">
        <footer className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--muted)]">
          <span>© {new Date().getFullYear()} miniKast. All rights reserved.</span>
          <Link href="/" className="text-[var(--foreground)] font-bold hover:underline">
            Back to Home
          </Link>
        </footer>
      </div>
    </main>
  );
}
