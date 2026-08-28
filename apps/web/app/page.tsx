"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function SunIcon() {
  return <img aria-hidden="true" src="/theme-sun.svg" alt="" className="icon" />;
}

function MoonIcon() {
  return <img aria-hidden="true" src="/theme-moon.svg" alt="" className="icon" />;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
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

  return <span className="logo-svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: logoMarkup }} />;
}

function SourceIcon({ kind }: { kind: "image" | "pdf" | "video" | "figma" }) {
  const iconSources = {
    image: "/source-image.svg",
    pdf: "/source-pdf.svg",
    video: "/source-video.svg",
    figma: "/source-figma.svg",
  };

  return <span className={`source-icon source-icon-${kind}`} aria-hidden="true">
    <img src={iconSources[kind]} alt="" />
  </span>;
}

function DemoMenu() {
  return <div className="menu-art" role="img" aria-label="Example digital menu displayed on a TV">
    <div className="menu-brand"><span className="menu-mark">m</span><span>morning ritual</span></div>
    <div className="menu-heading">GOOD FOOD<br /><em>GOOD MOOD</em></div>
    <div className="menu-items"><span>AVOCADO TOAST <b>$12</b></span><span>RICOTTA PANCAKES <b>$14</b></span><span>SEASONAL BOWL <b>$16</b></span></div>
    <div className="menu-footer">BRUNCH · COFFEE · GOOD COMPANY</div>
  </div>;
}

const platforms = [
  { name: "Samsung", src: "/platform-samsung.svg", className: "platform-logo-samsung" },
  { name: "LG", src: "/platform-lg.svg", className: "platform-logo-lg" },
  { name: "Android", src: "/platform-android.svg", className: "platform-logo-android" },
  { name: "Apple", src: "/platform-apple.svg", className: "platform-logo-apple" },
  { name: "Fire TV", src: "/platform-fire-tv.svg", className: "platform-logo-fire-tv" },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      return window.localStorage.getItem("menucast-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("menucast-theme", theme);
    } catch {
      // Theme switching still works for the current session when storage is blocked.
    }
  }, [theme]);

  const nextTheme = theme === "light" ? "dark" : "light";

  return <main className="home-shell">
    <div className="home-noise" aria-hidden="true" />
    <header className="home-header">
      <Link href="/" className="wordmark" aria-label="MenuCast home"><ThemeAwareLogo theme={theme} /></Link>
      <nav className="header-actions" aria-label="Main navigation">
        <button className="theme-toggle" type="button" aria-label={`Switch to ${nextTheme} theme`} onClick={() => setTheme(nextTheme)}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
        <Link href="/login" className="sign-in">Sign in</Link>
      </nav>
    </header>

    <section className="hero-section">
      <div className="hero-copy">
        <h1>Your menu.<br /><span>Any TV. Instantly.</span></h1>
        <p className="hero-description">Upload your design. Publish to your screen. Just beautiful menus on display.</p>
      </div>

      <div className="demo-wrap">
        <div className="demo-display"><DemoMenu /></div>
        <div className="source-cues" aria-label="Supported source formats">
          {(["image", "pdf", "video", "figma"] as const).map((kind) => <span className="source-tile" key={kind} role="img" aria-label={`${kind.toUpperCase()} source format`}><SourceIcon kind={kind} /></span>)}
        </div>
        <Link href="/pair" className="pair-button">Pair Your TV <ArrowIcon /></Link>
      </div>
    </section>

    <section className="platform-section" aria-labelledby="platform-title">
      <p id="platform-title">Available on</p>
      <div className="platform-list">{platforms.map((platform) => <span key={platform.name} className={`platform-item ${platform.className}`}><img src={platform.src} alt={platform.name} /></span>)}</div>
    </section>

    <footer className="home-footer"><span>© 2026 MenuCast. All rights reserved.</span><span>Contact: <a href="mailto:hello@menucast.com">hello@menucast.com</a></span></footer>
  </main>;
}
