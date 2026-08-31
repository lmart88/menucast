---
title: 'Dashboard UI Redesign (Displays & Screen Management)'
type: 'feature'
created: '2026-08-28'
status: 'approved'
figma_node: '1468:7181'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1468-7181'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current `/dashboard` page relies on an earlier prototype layout with dark styling, complex multi-mode tabs, and ad-hoc visual components that do not match the fresh miniKast brand identity (light cyan/mint radial backdrop, cohesive typography, clean rounded screen cards, and vibrant orange CTAs).

**Approach:** Redesign and align the `/dashboard` experience with the approved Figma design (`node-id=1468:7181`). The new layout introduces:
1. **Brand Header**: miniKast logo/wordmark, primary "Install App" action, secondary navigation links ("Account", "Sign Out"), vertical divider, and accessible dark/light theme switch.
2. **Atmospheric Backdrop**: Light mint/cyan radial gradient with subtle dot-pattern grid (`#f7fcfc` to `#b7eaed`).
3. **Displays Section**: Prominent "Displays" title with brand orange "Pair New Screen" CTA (`#f27200` / `#ff8000`).
4. **Refined Screen Cards**:
   - Clean floating white cards (`#FFFFFF`, `1px solid #b7eaed`, `8px` border radius, soft drop shadow `0 1px 4px rgba(12,12,13,0.05)`).
   - Top preview area: Aspect-ratio-preserving preview slot (`16:9` / `9:16`). If no menu is pushed, displays "Awaiting menu" centered in `#547a7c`. When a menu exists, displays the live thumbnail.
   - Status badge: Pill badge in top-left with status dot and human-readable time elapsed (e.g. "13 days ago", "Just now", "Online").
   - Bottom metadata & actions: Screen title (bold Nunito), trash/delete icon button (`delete-02`), and screen specs row (resolution `1920x1080`, aspect ratio `16:9`, orientation `Portrait` / `Landscape`).
5. **Screen Detail / Management Modal & Staged Publishing**:
   - Aspect-ratio-preserving preview of active TV menu.
   - Screen name editor with inline save.
   - Drag & drop or click-to-select image upload area.
   - **Staged Preview**: Uploading a new image uploads to storage and displays a draft preview without pushing live to the TV.
   - **"Publish" Action (`#f27200` / `#ff8000`)**: Explicitly pushes the staged design to the physical TV screen in real-time via `POST /api/menu/push`.
6. **Brand Footer**: Left copyright ("© 2026 miniKast. All rights reserved.") and right support contact ("Contact: hello@miniKast.com").

## Boundaries & Constraints

**Always:**
- Use Next.js App Router (`apps/web/app/dashboard/page.tsx`, `apps/web/app/dashboard/dashboard-client.tsx`) with React 19, Tailwind CSS, and Lucide icons.
- Preserve all existing Supabase Realtime synchronization, screen presence tracking, TV pairing, and deletion capabilities.
- Maintain light/dark theme support with CSS variables while defaulting to the brand light/mint radial aesthetic.
- Ensure responsive behavior on mobile, tablet, and desktop viewports:
  - Mobile: Header wraps or compacts cleanly, grid adapts to 1 column.
  - Tablet: 2-column grid.
  - Desktop: Multi-column grid with consistent gutters.

**Never:**
- Remove existing backend integration endpoints (`/api/tv/list`, `/api/tv/delete`, `/api/token`, etc.).
- Introduce unapproved third-party UI component libraries.
- Push images live to the TV immediately upon file selection before the user clicks "Publish".

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **DASHBOARD_WITH_SCREENS** | User has 1+ paired displays | Renders grid of ScreenCards with live thumbnails (or "Awaiting menu" placeholder), status badge, screen title, specs, and delete button | Gracefully falls back if screen info is missing |
| **DASHBOARD_EMPTY_STATE** | User has 0 paired displays | Clean empty state with illustration / message and "Pair New Screen" CTA directing to `/pair` | N/A |
| **PAIR_NEW_SCREEN_CLICK** | User clicks "Pair New Screen" CTA | Opens pairing modal / workflow or navigates to `/pair` | N/A |
| **IMAGE_UPLOAD_STAGED** | User selects/drops image in Screen Modal | Uploads file to Supabase Storage and renders staged draft preview with "Ready to publish" badge; physical TV remains unchanged | Shows error toast on upload failure |
| **PUBLISH_BUTTON_CLICKED** | User clicks "Publish" button in modal footer | Calls `POST /api/menu/push`, updates `current_menu_url` in database, broadcasts to TV in real-time, and closes/confirms modal | Shows error message if broadcast fails |
| **DELETE_SCREEN_CONFIRM** | User clicks trash icon on ScreenCard | Prompts confirmation modal / dialog; on confirm calls `DELETE /api/tv/delete` and optimistically removes card | Inline error toast if deletion fails |
| **THEME_TOGGLE** | User clicks sun/moon icon in header | Toggles between light and dark theme seamlessly | Persists choice to `localStorage` / theme provider |
| **SIGN_OUT** | User clicks "Sign Out" | Dispatches NextAuth `signOut()` and redirects to `/login` | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/app/dashboard/page.tsx` — Server component verifying session and fetching initial screens data.
- `apps/web/app/dashboard/dashboard-client.tsx` — Client component rendering the redesigned Dashboard UI, header, displays grid, cards, and footer.
- `apps/web/app/globals.css` — Global styling tokens, radial background classes, and design system variables.

## Acceptance Criteria

1. **Visual Fidelity**: Dashboard matches Figma node `1468:7181` across mobile, tablet, and desktop viewports.
2. **Screen Cards**: Renders paired screens with correct preview thumbnail / placeholder, status pill, specs, and delete trigger.
3. **Staged Upload & Publish**: Uploading an image stages it in preview; only clicking the **"Publish"** CTA updates the TV display and database.
4. **Action Triggers**: "Pair New Screen", "Install App", "Account", and "Sign Out" buttons work as intended.
5. **Deletion Flow**: Deleting a screen updates state seamlessly and notifies Supabase.
6. **Presence & Realtime**: Display online/offline badges and menu thumbnails update in real-time.
