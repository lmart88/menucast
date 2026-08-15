import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import ServiceWorkerRegister from "./sw-register";
import PwaInstallPrompt from "./pwa-install-prompt";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MenuCast — Digital Menu Management for Restaurants",
  description:
    "Push beautiful digital menus to your restaurant TV in seconds. Design in Figma, publish instantly.",
  applicationName: "MenuCast",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MenuCast",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
