# Story Specification: STORY-3.4 — PWA Install App Popup & Download Modal Redesign

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-3.4`  
**Epic**: [`EPIC-3: TV Display Engine (PWA & Android TV)`](file:///Users/battosai/Dev/menucast/docs/epics.md#L61-L82)  
**Sprint**: [`Sprint 2: Public Launchpad (Landing Page & User Accounts)`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L41-L62)  
**Story Points**: `2 pts`  
**Priority**: `P1 (Commercial MVP)`  
**Assignee**: Developer Agent (`Amelia`)  
**Figma References**:
* **Install PopUp Node**: [`1470:9050`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1470-9050) ("Install PopUp")
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/spec-install-app-popup.md`](file:///Users/battosai/Dev/menucast/docs/spec-install-app-popup.md)  
**Created Date**: 2026-08-28  

---

## 1. User Story Statement

> **As a** restaurant manager or designer using miniKast on desktop, tablet, or mobile,  
> **I want to** see an elegant, branded prompt to install the miniKast app directly to my device,  
> **So that** I can launch miniKast with one click in a borderless window without URL bars.

---

## 2. Problem Statement & Context

Currently:
1. `apps/web/app/pwa-install-prompt.tsx` uses an earlier dark-mode prototype theme (`bg-neutral-900`, emerald buttons) that clashes with the fresh mint/cyan brand theme.
2. When users click "Install App" in the dashboard header, it triggers an unstyled browser `alert()` if the native prompt has not fired yet.
3. Figma node `1470:9050` specifies a clean, modern "Install PopUp":
   - Floating card (`bg-[#f7fcfc]`, `border 1px solid #b7eaed`, `rounded-2xl`).
   - Square mascot app icon (`48px` x `48px`) with the miniKast bird.
   - Text: "Install miniKast App" (Nunito Bold, 14px `#0d1f21`) and "Launch directly from your device." (Nunito Regular, 14px `#547a7c`).
   - Action Button: Teal `#008996` pill button with download icon and "Install" label.

---

## 3. Visual & Design System Specifications

### 3.1 Atmosphere & Card Layout
* **Container**:
  * Position: Fixed floating toast (`bottom-6 right-6 md:max-w-md w-full`).
  * Surface: `#f7fcfc` (`var(--colors/background, #f7fcfc)` in light mode, `#0d1f21` in dark mode).
  * Border: `1px solid #b7eaed` (`var(--colors/border, #b7eaed)`).
  * Border-radius: `16px` (`rounded-2xl`).
  * Padding: `12px` (`p-3`).
  * Depth Shadow: `0 4px 12px rgba(12, 12, 13, 0.08)`.

### 3.2 Mascot App Icon
* Container size: `48px` x `48px` with `8px` rounded corners.
* Icon: Centered `/logo-minikast.svg` bird mascot.

### 3.3 Copy & Typography
* Title: "Install miniKast App", font `Nunito Bold`, size `14px` (`leading-4`), color `#0d1f21`.
* Subtitle: "Launch directly from your device.", font `Nunito Regular`, size `14px` (`leading-4`), color `#547a7c`.

### 3.4 Action Button & Dismissal
* Primary CTA:
  * Background: `#008996` (`var(--accent)`).
  * Border-radius: `rounded-full`.
  * Height: `36px`, padding `px-4`.
  * Content: Download icon (`<Download className="size-4" />`) + "Install" label in bold white text.
* Dismiss Button:
  * Subtle `✕` icon button on top-right / edge to dismiss for 7 days.

---

## 4. Acceptance Criteria (Given / When / Then)

### AC-1: Visual Accuracy Matching Figma Node `1470:9050`
- **Given** an uninstalled visitor on a supported browser,
- **When** the install prompt is displayed,
- **Then** it renders the floating card matching Figma node `1470:9050` with `#f7fcfc` surface, `#b7eaed` border, bird icon, and `#008996` pill button.

### AC-2: Native Installation Flow
- **Given** an eligible Chromium/Android browser,
- **When** the user clicks "Install",
- **Then** `deferredPrompt.prompt()` executes and handles installation without page reload.

### AC-3: iOS Instructions Modal
- **Given** a user on iOS Safari clicking "Install",
- **When** triggered,
- **Then** the updated, branded visual instructions sheet appears ("Share" -> "Add to Home Screen" -> "Add").

### AC-4: Header Action Integration
- **Given** an authenticated user clicking "Install App" in the dashboard header,
- **When** clicked,
- **Then** the install flow is triggered seamlessly without generic browser alert dialogs.

---

## 5. Technical Implementation Details

* **File**: `apps/web/app/pwa-install-prompt.tsx`
* **Dashboard Header**: `apps/web/app/dashboard/dashboard-client.tsx`
