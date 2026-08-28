# Story Specification: STORY-5.3 — Dashboard Displays & Screen Management UI Redesign

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-5.3`  
**Epic**: [`EPIC-5: Self-Serve User Accounts & Auth`](file:///Users/battosai/Dev/menucast/docs/epics.md#L89-L106)  
**Sprint**: [`Sprint 2: Public Launchpad (Landing Page & User Accounts)`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L41-L60)  
**Story Points**: `5 pts`  
**Priority**: `P1 (MVP Core)`  
**Assignee**: Developer Agent (`Amelia`)  
**Figma References**:
* **Dashboard Screen Node**: [`1468:7181`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1468-7181) ("MacBook Air - 21")
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/spec-dashboard-ui-redesign.md`](file:///Users/battosai/Dev/menucast/docs/spec-dashboard-ui-redesign.md)  
**Created Date**: 2026-08-28  

---

## 1. User Story Statement

> **As a** restaurant owner, general manager, or brand designer,  
> **I want to** manage my connected TV screens in a clean, aesthetic dashboard that matches the miniKast brand design,  
> **So that** I can easily inspect screen presence, monitor live menu previews, pair new screens, and manage my displays.

---

## 2. Problem Statement & Context

Currently:
1. The `/dashboard` layout uses an earlier dark-mode prototype with complex tab structures and inconsistent styling that does not match the approved brand identity (light mint radial background, `#b7eaed` borders, vibrant orange buttons).
2. Screen cards need to be visually consistent with Figma node `1468:7181`: clean preview slots showing live menu thumbnails or "Awaiting menu", top-left status pill badges ("13 days ago" / "Online"), screen titles with trash delete icon, and hardware specifications (`1920x1080 16:9 Portrait/Landscape`).
3. The dashboard header and footer need to be aligned with the standardized brand layout.

---

## 3. Visual & Design System Specifications

### 3.1 Atmosphere & Container
* **Backdrop**: Mint/cyan gradient surface (`#f7fcfc` background with radial cyan glow `#b7eaed` and subtle dot grid pattern).
* **Brand Header**:
  * Left: `miniKast` logo and wordmark.
  * Right: "Install App" button, "Account" link, "Sign Out" link, vertical divider line, and theme toggle (dark/light mode).
* **Displays Section Header**:
  * Left: Bold "Displays" heading (`text-2xl font-bold text-[#0d1f21]`).
  * Right: Primary brand orange CTA "Pair New Screen" (`#f27200` / `#ff8000`).
* **Screen Cards**:
  * Background: `#ffffff`
  * Border: `1px solid #b7eaed`
  * Border Radius: `8px` (`rounded-lg`)
  * Drop Shadow: `0 1px 4px rgba(12, 12, 13, 0.05)`
  * Card Top (Preview Slot):
    * Dimensions: `16:9` / `9:16` aspect ratio box.
    * Empty state: Centered text "Awaiting menu" in `#547a7c`.
    * Menu pushed: Full preview image thumbnail.
    * Status Badge: Top-left pill badge (`bg-white/90 border border-[#b7eaed] text-xs`) with status dot (green when online) and elapsed time / status text.
  * Card Bottom (Metadata & Controls):
    * Top row: Screen title (bold `Nunito`) and delete / trash icon button (`delete-02`).
    * Details row: Screen resolution (`1920x1080`), aspect ratio (`16:9`), and orientation (`Portrait` / `Landscape`) in `#547a7c`.
* **Brand Footer**:
  * Left: "© 2026 miniKast. All rights reserved." in `#547a7c`.
  * Right: "Contact: hello@miniKast.com" with `#008996` link.

---

## 4. Acceptance Criteria (Given / When / Then)

### AC-1: Dashboard Page Layout & Header
- **Given** an authenticated user navigating to `/dashboard`,
- **When** the page renders,
- **Then** it renders the miniKast brand header, light mint radial atmosphere, Displays section, screen card grid, and brand footer matching Figma node `1468:7181`.

### AC-2: Display Screen Cards & Previews
- **Given** a user with paired screens,
- **When** viewing the displays grid,
- **Then** each screen card shows:
  - Preview thumbnail if `current_menu_url` is present, or "Awaiting menu" placeholder.
  - Status pill badge with green dot and formatted last seen time (e.g. "13 days ago", "Just now", "Online").
  - Screen title and delete button.
  - Hardware specs formatted as `[Width]x[Height] [Aspect Ratio] [Orientation]`.

### AC-3: Empty State & Pairing Flow
- **Given** a user with no paired screens,
- **When** visiting `/dashboard`,
- **Then** an inviting empty state is displayed with a primary "Pair New Screen" button directing to `/pair`.

### AC-4: Screen Deletion Flow
- **Given** a user clicking the trash icon on a screen card,
- **When** confirming the deletion,
- **Then** `DELETE /api/tv/delete` executes, the card is removed optimistically, and Supabase database is updated.

### AC-5: Theme & Actions
- **Given** clicking the theme toggle in the header,
- **When** triggered,
- **Then** the page toggles between light and dark modes.
- **Given** clicking "Sign Out",
- **When** triggered,
- **Then** the user session is cleared and redirected to `/login`.

---

## 5. Technical Implementation Details

* **Components**:
  * Server Component: `apps/web/app/dashboard/page.tsx`
  * Client Component: `apps/web/app/dashboard/dashboard-client.tsx`
* **Realtime**: Supabase channel subscriptions for live TV presence and push updates.
* **Icons**: `Lucide` icons (`Trash2`, `Moon`, `Sun`, `Download`, `Tv`, `Plus`).
