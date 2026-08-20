# MenuCast (miniKast) — Project Context & Agent Guidelines

## 1. Project Identity & Architecture
- **Repository**: `menucast` (monorepo using `pnpm` workspaces)
- **Primary Function**: Digital menu board & signage platform syncing Figma designs directly to physical TV screens / web players via Supabase Realtime in sub-second latency.
- **Monorepo Structure**:
  - `apps/web`: Next.js 15 (App Router), React 19, TailwindCSS, Auth.js / NextAuth, PWA support, Web display client (`/tv`), Pairing portal (`/pair`), and Dashboard (`/dashboard`).
  - `apps/figma-plugin`: Figma sandbox plugin (TypeScript + HTML UI) with canvas frame generator and 1-click 2x PNG export/push.
  - `apps/tv-android`: Kotlin Android TV / Fire OS kiosk wrapper application (fullscreen hardware-accelerated WebView container with 24/7 wake-lock and auto-retry watchdog).
  - `packages/supabase`: Shared TypeScript types for Supabase database schema.
  - `supabase/migrations`: SQL schema migrations with Row Level Security (RLS) policies.

---

## 2. Technology Stack & Key Libraries

| Component | Stack | Notes |
| :--- | :--- | :--- |
| **Frontend Dashboard & TV Player** | Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons | Hardware-accelerated CSS transforms for crossfades |
| **Authentication** | NextAuth.js / Auth.js (Credentials) + Supabase Auth / Bearer API Tokens | API tokens used for Figma plugin requests |
| **Database & Realtime** | Supabase (PostgreSQL 15+), Supabase Realtime (WebSockets), Supabase Storage | RLS enabled on all tables; public read for pairing handshake |
| **Figma Plugin** | Figma Plugin API (Manifest v2), TypeScript, esbuild | Inter-thread messaging between `plugin.ts` sandbox & `ui/index.html` |
| **Android / Fire TV Player** | Kotlin, Android SDK 34, AndroidX, ViewBinding | WebContentsDebugging enabled, custom remote keycode handling |

---

## 3. Critical System Workflows & Contracts

### A. Realtime Channels
- `pairing:<PAIRING_CODE>`: Broadcasts `tv:paired` payload `{ tv_id, name }` when a user claims an unauthenticated screen.
- `tv:<TV_ID>`: Broadcasts `menu:push` payload `{ image_url, menu_mode, menu_data, menu_id, pushed_at }` and `menu:clear` payload `{ tv_id }`.

### B. Display Engine Performance Constraints
- The `/tv` display client MUST run smoothly on low-power TV hardware (e.g. Fire TV Stick 4K, Chromecast with Google TV, budget smart TV browsers).
- Do not add heavy 3D libraries or unbounded DOM trees to `/tv`.
- Image swaps must preserve double-buffered image preloading (`TvImageCrossfade`) to avoid black screen flickers during live updates.
- Store paired state in `localStorage` so a power-cycled TV reboots straight into its menu without re-pairing.

### C. Figma Plugin Constraints
- Figma plugins run in a secure sandbox (`plugin.ts`) that has **no network/DOM access**.
- All network calls (fetching TV list, uploading image bytes, pushing menu) must be executed by the iframe UI thread (`src/ui/index.html`).
- Use `figma.clientStorage` to persist the user's API token and custom domain URL.

---

## 4. Development & Build Commands

### Root Monorepo
```bash
# Install dependencies
pnpm install

# Start Next.js web application (http://localhost:3000)
pnpm dev

# Build web application
pnpm build
```

### Figma Plugin (`apps/figma-plugin`)
```bash
cd apps/figma-plugin
pnpm run build     # Bundles plugin.ts and scripts/bundle-ui.js into dist/
pnpm run watch     # Watches for edits during plugin development
```

### Android TV App (`apps/tv-android`)
```bash
cd apps/tv-android
./gradlew assembleDebug      # Builds debug APK in app/build/outputs/apk/debug/
./gradlew installDebug       # Sideloads directly to connected ADB device
```

---

## 5. Coding Guidelines & Invariants

1. **Database & Migrations**:
   - Always update `packages/supabase/types.ts` when modifying SQL migrations in `supabase/migrations/`.
   - Ensure RLS policies protect user data while allowing unauthenticated TV clients to perform pairing handshake checks.
2. **API Routes**:
   - Support both Bearer API token authentication (for the Figma plugin) and Session cookie authentication (for the Web Dashboard).
3. **PWA & Offline Resilience**:
   - Maintain service worker and manifest definitions in `apps/web/public/sw.js` and `apps/web/app/manifest.ts`.
