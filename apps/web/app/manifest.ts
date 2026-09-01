import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "miniKast — Digital Menu Management",
    short_name: "miniKast",
    description: "Push beautiful digital menus to your restaurant TV in seconds.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    scope: "/",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        url: "/dashboard",
        description: "Open miniKast Dashboard",
      },
      {
        name: "TV Display Player",
        url: "/tv",
        description: "Open TV Screen Player",
      },
    ],
  };
}
