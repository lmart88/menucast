import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ServiceWorkerRegister from "./sw-register";
import PwaInstallPrompt from "./pwa-install-prompt";

const nunito = localFont({
  src: [
    { path: "./fonts/Nunito-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Nunito-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Nunito-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Nunito-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Nunito-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Nunito-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/Nunito-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Nunito-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-nunito",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://minikast.com"
  ),
  title: "miniKast — Digital Menu Management for Restaurants",
  description:
    "Push beautiful digital menus to your restaurant TV in seconds. Design in Figma, publish instantly.",
  applicationName: "miniKast",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "miniKast",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
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
      <body className={nunito.variable}>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
