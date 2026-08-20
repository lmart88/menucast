# Epics & User Stories Breakdown — MenuCast (miniKast)

**Document Status**: `Approved / Ready for Sprint Execution`  
**Version**: `1.0.0`  
**Author**: BMad Product Management (`John`) & Lead Developer (`Amelia`)  
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md)  
**Last Updated**: 2026-08-20  

---

## 📋 Backlog Overview

| Epic ID | Epic Name | Priority | Status | Stories Count |
| :--- | :--- | :--- | :--- | :--- |
| **EPIC-1** | Screen Pairing & Fleet Management | P0 (Core) | In Progress / POC | 4 Stories |
| **EPIC-2** | Figma Plugin Workstation & 1-Click Push | P0 (Core) | In Progress / POC | 4 Stories |
| **EPIC-3** | TV Display Player & Kiosk Hardening | P0 (Core) | In Progress / POC | 4 Stories |
| **EPIC-4** | Menu Scheduling, Dayparting & Playlists | P1 (V1.0) | Planned | 4 Stories |
| **EPIC-5** | Hybrid & Live Price Overlay Engine | P1 (V1.0) | Planned | 3 Stories |

---

## 🎯 EPIC-1: Screen Pairing & Fleet Management

### STORY-1.1: Dynamic Screen Pairing Handshake & Hardware Telemetry
**Story Statement**:  
*As a restaurant owner setting up a new TV display,*  
*I want the screen to show a human-readable pairing code and QR code that I can claim from my phone or dashboard,*  
*So that I can connect the display to my account in under 30 seconds without typing passwords on a TV remote.*

**Acceptance Criteria**:
- [ ] **Given** an unconfigured TV opening `/tv`, **When** the page loads, **Then** it generates an 8-character pairing code (`WORD-1234`), renders a QR code pointing to `/pair?code=<CODE>`, and subscribes to Supabase Realtime channel `pairing:<CODE>`.
- [ ] **Given** an authenticated user submitting the code at `/pair` or `/dashboard`, **When** `POST /api/tv/pair` executes, **Then** the TV record is created/updated in Postgres, and a `tv:paired` broadcast event is fired over `pairing:<CODE>`.
- [ ] **Given** the TV client receives `tv:paired`, **When** processing the event, **Then** it saves `{ tv_id, name }` in `localStorage`, switches to `displaying`/`paired` state, and posts its physical resolution, aspect ratio, and orientation to `POST /api/tv/screen-info`.

**Technical Implementation**:
- Files: `apps/web/app/tv/page.tsx`, `apps/web/app/api/tv/init/route.ts`, `apps/web/app/api/tv/pair/route.ts`, `apps/web/app/api/tv/screen-info/route.ts`.
- DB Tables: `tvs`.

---

### STORY-1.2: Multi-Screen Grouping & Tagging
**Story Statement**:  
*As a multi-screen restaurant operator,*  
*I want to organize my screens into logical groups (e.g. "Main Menu Boards", "Bar TVs", "Drive-Thru"),*  
*So that I can broadcast menu updates to multiple displays at once.*

**Acceptance Criteria**:
- [ ] **Given** an authenticated user in the dashboard, **When** creating a screen group, **Then** it persists to `screen_groups` with a name and optional description.
- [ ] **Given** an existing screen group, **When** the user assigns or removes TVs, **Then** rows are added/deleted in `tv_group_memberships`.
- [ ] **Given** an API request to `GET /api/tv/groups`, **When** called with user auth, **Then** it returns all groups along with their assigned TV members and current status.

**Technical Implementation**:
- Files: `supabase/migrations/004_screen_groups.sql`, `packages/supabase/types.ts`, `apps/web/app/api/tv/groups/route.ts`.
- DB Tables: `screen_groups`, `tv_group_memberships`.

---

### STORY-1.3: Fleet Management Dashboard UI & Heartbeat Indicators
**Story Statement**:  
*As a store manager,*  
*I want a centralized dashboard showing all my screens, their live status, active menu previews, and aspect ratios,*  
*So that I know at a glance what is currently displaying on my dining room screens.*

**Acceptance Criteria**:
- [ ] **Given** the dashboard at `/dashboard`, **When** loaded, **Then** it displays a grid of all user TVs with name, aspect ratio badge (16:9 / 9:16), resolution, orientation, and thumbnail of the active menu.
- [ ] **Given** a TV reporting telemetry periodically, **When** the last heartbeat is within 60 seconds, **Then** an "Online" status green badge is shown; otherwise, an "Offline" gray/red badge is displayed.
- [ ] **Given** the user wants to rename a TV, **When** editing inline, **Then** `POST /api/tv/update` saves the change immediately.

**Technical Implementation**:
- Files: `apps/web/app/dashboard/dashboard-client.tsx`, `apps/web/app/dashboard/page.tsx`, `apps/web/app/api/tv/status/route.ts`.

---

### STORY-1.4: Remote Screen Actions (Reload, Clear, Unpair)
**Story Statement**:  
*As an administrator,*  
*I want to remotely clear or reload a physical TV from the web dashboard,*  
*So that I can reset the display without climbing up to physically unplug the TV.*

**Acceptance Criteria**:
- [ ] **Given** an active screen in the dashboard, **When** clicking "Clear Screen", **Then** `POST /api/menu/clear` sets `current_menu_url = NULL` and broadcasts `menu:clear` over `tv:<TV_ID>`, transitioning the TV to the default standby screen.
- [ ] **Given** an active screen in the dashboard, **When** clicking "Delete / Unpair TV", **Then** `POST /api/tv/delete` removes the TV record from PostgreSQL and removes it from the user's dashboard.

**Technical Implementation**:
- Files: `apps/web/app/api/menu/clear/route.ts`, `apps/web/app/api/tv/delete/route.ts`, `apps/web/app/tv/page.tsx`.

---

## 🎨 EPIC-2: Figma Plugin Workstation & 1-Click Push

### STORY-2.1: Target Display Inspector & Screen Selector
**Story Statement**:  
*As a designer in Figma,*  
*I want to see all available TV screens and screen groups linked to my account inside the plugin,*  
*So that I can choose exactly where my design will be deployed.*

**Acceptance Criteria**:
- [ ] **Given** the plugin UI open and authenticated with an API Token, **When** loaded, **Then** it queries `GET /api/tv/list` and populates the screen selection dropdown with TV names and aspect ratios.
- [ ] **Given** a selected TV in the dropdown, **When** selected, **Then** a specs card displays its exact resolution (e.g. `1920 × 1080`), aspect ratio (`16:9`), and orientation (`Landscape`).
- [ ] **Given** the user switches target TVs, **When** the target changes, **Then** the UI updates the "Create Frame" button label to match the selected TV's dimensions.

**Technical Implementation**:
- Files: `apps/figma-plugin/src/ui/index.html`, `apps/figma-plugin/src/plugin.ts`.

---

### STORY-2.2: 1-Click Canvas Frame Generator Matching Screen Specs
**Story Statement**:  
*As a designer,*  
*I want a 1-click button in the plugin to insert a canvas frame matching the TV's exact resolution and aspect ratio,*  
*So that I don't have to manually calculate dimensions or make aspect-ratio mistakes.*

**Acceptance Criteria**:
- [ ] **Given** a selected TV with resolution `W × H`, **When** clicking "Create Frame on Canvas", **Then** the plugin sandbox creates a frame on the active page with width `W`, height `H`, dark background fill (`#141414`), and names it `"<TV Name> Menu (W×H)"`.
- [ ] **Given** the new frame is created, **When** added to the canvas, **Then** it is positioned in the viewport center, selected, and zoomed into view automatically.

**Technical Implementation**:
- Files: `apps/figma-plugin/src/plugin.ts`, `apps/figma-plugin/src/ui/index.html`.

---

### STORY-2.3: Presigned S3/Supabase Direct Binary Upload Pipeline
**Story Statement**:  
*As a designer pushing a high-resolution 2x menu graphic,*  
*I want the plugin to upload the image directly to Supabase Storage via a presigned URL,*  
*So that uploads are fast, reliable, and bypass serverless payload limits.*

**Acceptance Criteria**:
- [ ] **Given** a frame export initiated in the plugin, **When** the sandbox exports 2x PNG bytes, **Then** the UI thread calls `POST /api/menu/upload` with Bearer auth to receive `{ upload_url, public_url }`.
- [ ] **Given** the presigned `upload_url`, **When** the UI thread executes a direct HTTP `PUT` with binary bytes, **Then** the image is saved to Supabase Storage `menus` bucket with `200 OK`.

**Technical Implementation**:
- Files: `apps/figma-plugin/src/ui/index.html`, `apps/web/app/api/menu/upload/route.ts`.

---

### STORY-2.4: Sub-Second 1-Click Push & Broadcast Feedback
**Story Statement**:  
*As a designer clicking "Push to TV",*  
*I want instantaneous visual confirmation in the plugin UI as soon as the broadcast is dispatched,*  
*So that I have confidence my updates are live on the display.*

**Acceptance Criteria**:
- [ ] **Given** a completed binary upload, **When** the plugin calls `POST /api/menu/push`, **Then** the server records the push in `menus`, updates `tvs.current_menu_url`, and broadcasts `menu:push` over `tv:<TV_ID>`.
- [ ] **Given** the broadcast is sent, **When** the response returns `< 1.5s`, **Then** the plugin UI displays a success banner: `"✓ Pushed successfully to TV!"` and re-enables action buttons.

**Technical Implementation**:
- Files: `apps/figma-plugin/src/ui/index.html`, `apps/web/app/api/menu/push/route.ts`.

---

## 📺 EPIC-3: TV Display Player & Kiosk Hardening

### STORY-3.1: Hardware-Accelerated Zero-Flicker Opacity Crossfade
**Story Statement**:  
*As a restaurant customer looking at the menu board,*  
*I want menu updates to transition smoothly without black flashes, tearing, or blank screens,*  
*So that the restaurant displays look polished and professional.*

**Acceptance Criteria**:
- [ ] **Given** a TV currently displaying Menu A, **When** a `menu:push` event delivers Menu B, **Then** Menu B is preloaded in an off-screen/invisible `<img>` node.
- [ ] **Given** Menu B finishes loading in memory, **When** rendering begins, **Then** an 800ms cubic-bezier opacity crossfade (`opacity: 0 -> 1`) transitions Menu B over Menu A.
- [ ] **Given** the crossfade animation completes, **When** Menu B is fully opaque, **Then** Menu A is swapped out, ensuring zero frame tearing or black flickers.

**Technical Implementation**:
- Files: `apps/web/app/tv/page.tsx` (`TvImageCrossfade` component).

---

### STORY-3.2: Local Device State Persistence & Power-Cycle Recovery
**Story Statement**:  
*As a restaurant manager,*  
*I want my TVs to automatically resume showing the active menu after a power outage or morning power-on,*  
*So that employees never have to re-pair or configure the screens every day.*

**Acceptance Criteria**:
- [ ] **Given** a TV that was successfully paired, **When** the device reboots or refreshes, **Then** it reads stored `{ tv_id, current_menu_url }` from `localStorage` and launches straight into displaying the menu.
- [ ] **Given** an offline boot, **When** network is unavailable, **Then** the cached menu image is rendered immediately while the network watchdog attempts to reconnect in the background.

**Technical Implementation**:
- Files: `apps/web/app/tv/page.tsx`.

---

### STORY-3.3: Service Worker & CacheStorage Offline Playback Resilience
**Story Statement**:  
*As a restaurant owner with spotty Wi-Fi,*  
*I want my digital signage to keep running even when the restaurant internet drops,*  
*So that customers can always read the menu.*

**Acceptance Criteria**:
- [ ] **Given** the `/tv` web application, **When** loaded in a browser/PWA, **Then** `sw.js` caches the HTML, JS, CSS, and loaded menu images in `CacheStorage`.
- [ ] **Given** a complete loss of internet connectivity, **When** the page reloads, **Then** the Service Worker serves all player assets and the active menu graphic from cache.

**Technical Implementation**:
- Files: `apps/web/public/sw.js`, `apps/web/app/manifest.ts`, `apps/web/app/sw-register.tsx`.

---

### STORY-3.4: Native Kotlin Android TV / Fire TV Kiosk Container
**Story Statement**:  
*As a digital signage installer using an Amazon Fire TV Stick,*  
*I want a dedicated Android app that launches on boot, keeps the TV on 24/7, and auto-recovers from errors,*  
*So that the TV operates as a dedicated kiosk display without ambient screensavers.*

**Acceptance Criteria**:
- [ ] **Given** a Fire TV / Android TV device booting up, **When** `ACTION_BOOT_COMPLETED` is received, **Then** `BootReceiver` starts `MainActivity` automatically.
- [ ] **Given** `MainActivity` running, **When** active, **Then** `FLAG_KEEP_SCREEN_ON` prevents system sleep, screen dims, or ambient Fire TV wallpapers.
- [ ] **Given** network loss, **When** connection fails, **Then** an auto-reconnect watchdog polls every 5 seconds and resumes playback as soon as internet is restored.
- [ ] **Given** a user pressing the remote `MENU` button, **When** clicked, **Then** a dialog allows changing the server URL; pressing `PLAY/PAUSE` or `R` reloads the player immediately.

**Technical Implementation**:
- Files: `apps/tv-android/app/src/main/java/app/minikast/tv/MainActivity.kt`, `apps/tv-android/app/src/main/java/app/minikast/tv/BootReceiver.kt`.

---

## ⏰ EPIC-4: Menu Scheduling, Dayparting & Playlists

### STORY-4.1: Playlist & Schedule Schema & Backend APIs
**Story Statement**:  
*As an operations manager,*  
*I want to create scheduled playlists with specific start/end times (e.g. Breakfast, Lunch, Dinner, Happy Hour),*  
*So that the displays change automatically throughout the business day.*

**Acceptance Criteria**:
- [ ] **Given** tables `playlists` and `playlist_items`, **When** an authorized user creates a schedule, **Then** the schedule record stores `{ group_id, name, start_time, end_time, days_of_week }`.
- [ ] **Given** multiple slides in a playlist, **When** adding items, **Then** each item has `{ image_url, duration_seconds, sort_order }`.
- [ ] **Given** `POST /api/playlist/save`, **When** called with playlist data, **Then** it validates time windows and persists to Postgres with RLS enforcement.

**Technical Implementation**:
- Files: `supabase/migrations/005_playlists.sql`, `apps/web/app/api/playlist/route.ts`, `packages/supabase/types.ts`.

---

### STORY-4.2: Automated Dayparting & Timed Carousel Rotation Engine
**Story Statement**:  
*As a restaurant cashier,*  
*I want the menu board to automatically switch from Breakfast to Lunch at 11:00 AM without touching the TV,*  
*So that customers are never shown breakfast prices during lunchtime.*

**Acceptance Criteria**:
- [ ] **Given** an active schedule assigned to a TV, **When** local TV clock reaches the scheduled start time, **Then** the display engine crossfades to the scheduled menu.
- [ ] **Given** a multi-slide playlist (e.g. 3 promo slides), **When** active, **Then** the TV automatically cycles through the slides according to each slide's configured `duration_seconds` using smooth crossfades.

**Technical Implementation**:
- Files: `apps/web/app/tv/page.tsx`.

---

## ⚡ EPIC-5: Hybrid & Live Text/Price Overlay Engine

### STORY-5.1: Figma Layer Tagging & Metadata Export
**Story Statement**:  
*As a menu designer,*  
*I want to tag text layers in Figma with `#price` or `#live`,*  
*So that the plugin extracts them as dynamic data fields while exporting the artwork beneath as a clean background.*

**Acceptance Criteria**:
- [ ] **Given** a Figma frame containing text layers named `Item1_Price #price` or `Special_Title #live`, **When** exported in "Hybrid Mode", **Then** the plugin outputs `{ bg_image_url, elements: [{ id, text, x, y, fontSize, fontFamily, color }] }`.
- [ ] **Given** the extracted elements, **When** pushed via `POST /api/menu/push`, **Then** `menu_mode = 'hybrid'` and `menu_data` contains the element position and style dictionary.

**Technical Implementation**:
- Files: `apps/figma-plugin/src/plugin.ts`, `apps/figma-plugin/src/ui/index.html`.

---

### STORY-5.2: Dashboard Live Quick Price & "Sold Out" Modifier
**Story Statement**:  
*As a store manager,*  
*I want to open my dashboard on my phone, tap a menu item's price, and change it in 5 seconds,*  
*So that pricing is updated in real-time without bothering the designer.*

**Acceptance Criteria**:
- [ ] **Given** a TV with an active hybrid menu, **When** the user opens the Quick Editor in `/dashboard`, **Then** a list of all editable text/price fields is displayed with current values.
- [ ] **Given** an edited price value, **When** the user clicks "Save & Update", **Then** `POST /api/menu/update-data` updates Postgres and broadcasts the updated field value over `tv:<TV_ID>`.
- [ ] **Given** the TV receiving the data update, **When** processed, **Then** the dynamic text overlay updates instantaneously without reloading the background image.

**Technical Implementation**:
- Files: `apps/web/app/dashboard/dashboard-client.tsx`, `apps/web/app/api/menu/update-data/route.ts`, `apps/web/app/tv/page.tsx`.
