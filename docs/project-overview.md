# MenuCast (miniKast) — Project Overview

## 1. Executive Summary

**MenuCast** (also referred to as **miniKast**) is a real-time digital signage and menu board management platform designed for restaurants, cafes, bars, and retail spaces. It enables designers and business owners to design digital menu boards directly in **Figma** and instantly push them live to physical screens (TVs, displays, Fire TV sticks, and web screens) in sub-second time.

---

## 2. Core Value Proposition

- **Design Where You're Fast**: No complex proprietary signage editors. Design directly in Figma using standard typography, components, and design systems.
- **1-Click Screen Matching**: Figma plugin reads physical screen dimensions and aspect ratios (e.g. 1920×1080 16:9, portrait 9:16) and creates perfectly sized artboards with one click.
- **Sub-Second Live Push**: Exported assets are pushed instantly to live displays via Supabase Realtime WebSocket broadcasts.
- **Hardware Agnostic**: Displays can run on native Android TV / Fire TV sticks, dedicated digital signage boxes, tablets, or any standard web browser / PWA.
- **Zero-Flicker Crossfading**: Displays transition between menu updates seamlessly with hardware-accelerated GPU opacity crossfades.

---

## 3. System Architecture & Components

The codebase is organized as a `pnpm` monorepo with 4 core packages:

```
menucast/
├── apps/
│   ├── web/           # Next.js 15 App Router web dashboard, auth, PWA & /tv player
│   ├── figma-plugin/  # Figma Desktop/Web plugin for screen sync & 1-click push
│   └── tv-android/    # Kotlin Android TV / Fire OS kiosk app (WebView container)
├── packages/
│   └── supabase/      # Shared TypeScript types and Supabase client definitions
└── supabase/
    └── migrations/    # Database schema migrations & RLS policies
```

### Component Roles:
1. **Figma Plugin (`apps/figma-plugin`)**:
   - Authenticates with user's MenuCast account using API tokens.
   - Fetches active TV screens with hardware resolution & orientation.
   - Generates matching Figma frames on canvas.
   - Exports frames as 2x PNG assets and triggers live screen update.

2. **Web Dashboard & TV Web Engine (`apps/web`)**:
   - **Dashboard (`/dashboard`)**: TV screen management, token generation, direct image uploads, pairing management.
   - **Pairing Portal (`/pair`)**: User web interface to enter 8-character pairing codes from new screens.
   - **Web TV Player (`/tv`)**: Standalone, full-screen, hardware-accelerated display client with pairing code generation, Supabase Realtime subscriptions, and smooth image crossfade.
   - **Backend API Routes (`/api/*`)**: RESTful endpoints for TV pairing, status checks, signed storage uploads, token validation, and Realtime event broadcasting.

3. **Android TV & Fire TV Player (`apps/tv-android`)**:
   - Native Kotlin application tailored for Android TV and Amazon Fire TV sticks.
   - Boots automatically on power-up (`RECEIVE_BOOT_COMPLETED`).
   - Keeps screen awake 24/7 (`FLAG_KEEP_SCREEN_ON`).
   - Hosts the `/tv` web player inside a hardware-accelerated, cache-enabled WebView with network auto-reconnect watchdog.
   - Provides TV remote shortcuts (`MENU` for configuration, `PLAY/PAUSE` or `R` to reload).

4. **Database & Realtime Infrastructure (`supabase/`)**:
   - PostgreSQL database with tables: `tvs`, `menus`, `api_tokens`.
   - Row-Level Security (RLS) policies for user data isolation.
   - Supabase Realtime channels (`pairing:{code}` and `tv:{tv_id}`) for instant push notifications.
   - Supabase Storage (`menus` bucket) for CDN delivery of menu graphics.

---

## 4. Current POC Status & Capabilities

| Capability | Status | Notes |
| :--- | :--- | :--- |
| **User Authentication** | ✅ Implemented | NextAuth / Credentials & Supabase integration |
| **TV Pairing Flow** | ✅ Implemented | QR code / 8-character pairing code with Realtime pairing event |
| **Figma Plugin Auth & Listing** | ✅ Implemented | Persistent API token storage, dynamic TV list fetching |
| **Figma Auto-Frame Creation** | ✅ Implemented | Creates frames matching screen width/height on active page |
| **Static 1-Click Push** | ✅ Implemented | Exports 2x PNG $\rightarrow$ Supabase Storage $\rightarrow$ Realtime push |
| **Smooth TV Crossfade** | ✅ Implemented | Double-buffered DOM image crossfade on `/tv` |
| **Android TV Kiosk App** | ✅ Implemented | Boot on startup, watchdog, remote control handlers |
| **Hybrid / Responsive Data Mode**| ⚠️ In Progress | Schema columns `menu_mode` and `menu_data` added; basic renderers exist |
| **Multi-Screen Scheduling / Playlists**| ⏳ Planned | Queuing multiple schedules/times of day |
