# Story Specification: STORY-1.3 — TV Display Pairing Screen UI Redesign

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-1.3`  
**Epic**: [`EPIC-1: Screen Pairing & Telemetry`](file:///Users/battosai/Dev/menucast/docs/epics.md#L29-L46)  
**Sprint**: [`Sprint 2: Public Launchpad (Landing Page & User Accounts)`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L41-L61)  
**Story Points**: `3 pts`  
**Priority**: `P1 (Commercial MVP)`  
**Assignee**: Developer Agent (`Amelia`)  
**Figma References**:
* **Pair TV Screen Node**: [`1459:10382`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1459-10382) ("Pair TV")
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/spec-tv-pairing-ui-redesign.md`](file:///Users/battosai/Dev/menucast/docs/spec-tv-pairing-ui-redesign.md)  
**Created Date**: 2026-08-28  

---

## 1. User Story Statement

> **As a** restaurant owner, barista, or display installer setting up a physical TV screen,  
> **I want to** see an inviting, beautifully branded pairing screen matching the miniKast design system,  
> **So that** I can effortlessly scan the QR code with my phone or read the clear pairing code to link the TV to my account in seconds.

---

## 2. Problem Statement & Context

Currently:
1. The `/tv` pairing state displays a dark prototype layout with individual box-style characters, heavy black borders, and dark glows.
2. The miniKast design system has unified around a light mint/cyan radial glow (`#f7fcfc` to `#b7eaed`) with subtle dot pattern, clean `#008996` brand accents, and the miniKast bird mascot.
3. Figma node `1459:10382` specifies an updated layout:
   - Centered card layout on the light mint radial backdrop.
   - Left: QR code container (`border-4 border-[#008996]`, `rounded-[20px]`) with the miniKast bird logo playfully tilted at `33.52deg` on the top-left corner, and a countdown timer ("Refreshes in MM:SS") below.
   - Right: "Screen Setup" label, "Pair this Display" heading, instructions, and a clean horizontal pairing code pill card (`border 1px solid #b7eaed`, `rounded-2xl`) with "Pairing Code" label on the left and bold code on the right in `#008996`.

---

## 3. Visual & Design System Specifications

### 3.1 Atmosphere & Backdrop
* **Background**: Radial cyan glow (`#f7fcfc` to `#b7eaed`) with atmospheric subtle dot grid pattern (`home-shell` / `home-noise`).
* **Centered Container**: Flex layout centering the content vertically and horizontally, responsive across landscape and portrait orientations.

### 3.2 QR Code Component (Left Column)
* **Card**: Background `#ffffff`, border `4px solid #008996`, border-radius `20px` (`rounded-[20px]`), padding `12px` to `16px`.
* **QR Code**: High error correction (`level="H"`), size `180px` to `240px`, pointing to `{appUrl}/pair?code={pairingCode}`.
* **Perched Mascot**: miniKast bird logo (`/logo-minikast.svg`) positioned at top-left corner:
  * Offset: `top: -47px, left: -14px` (or relative `-mt-6 -ml-3`).
  * Rotation: `33.52deg` (`rotate-[33.5deg]`).
  * Size: `width: 50px, height: 38px`.
* **Countdown Timer**: Centered text below QR card: "Refreshes in MM:SS", font family `Nunito`, color `#547a7c`, font size `16px`.

### 3.3 Text & Pairing Code Card (Right Column)
* **Category Label**: "Screen Setup", font `Nunito Bold`, size `16px`, color `#547a7c`.
* **Heading**: "Pair this Display", font `Nunito Bold`, size `32px` (`leading-10`), color `#0d1f21`.
* **Description**: "Scan the QR code with your phone or visit the link below to link this display to your miniKast account.", font `Nunito Regular`, size `16px`, color `#547a7c`, max width `300px` to `360px`.
* **Pairing Code Pill**:
  * Container: Background `#ffffff`, border `1px solid #b7eaed`, border-radius `16px` (`rounded-2xl`), padding `16px` horizontal, `8px` vertical.
  * Left: "Pairing Code", font `Nunito Regular`, size `16px`, color `#547a7c`.
  * Right: `{pairingCode}` (formatted as `"WORD -1234"`), font `Nunito Bold`, size `20px`, color `#008996`.
* **Manual Link (Fallback)**:
  * Discreet subtitle or accessible fallback displaying `{appUrl}/pair?code={pairingCode}`.

---

## 4. Acceptance Criteria (Given / When / Then)

### AC-1: Visual Fidelity Matching Figma Node `1459:10382`
- **Given** an unconfigured TV or visitor opening `/tv`,
- **When** the pairing screen renders,
- **Then** it renders with the light mint radial background, QR code with `4px solid #008996` border and tilted perched bird mascot, and pairing code pill card matching Figma node `1459:10382`.

### AC-2: Perched Bird Mascot Alignment
- **Given** the QR code card on `/tv`,
- **When** rendered,
- **Then** the miniKast bird mascot is positioned at the top-left edge with a `~33.5deg` rotation angle.

### AC-3: Dynamic Countdown & Code Refresh
- **Given** the pairing code countdown timer,
- **When** the timer elapses to 00:00,
- **Then** the display automatically triggers `initTv(true)` to generate a new pairing code and refreshes the QR code seamlessly.

### AC-4: Successful Pairing Handshake
- **Given** the pairing screen waiting for user connection,
- **When** a user scans the QR code and submits the pairing request from their dashboard or phone,
- **Then** the TV client receives the `tv:paired` Supabase Realtime broadcast and transitions into the paired / displaying state.

---

## 5. Technical Implementation Details

* **File to Modify**: `apps/web/app/tv/page.tsx`
* **Assets Used**: `/logo-minikast.svg`, `QRCodeSVG`
* **Dependencies**: Supabase Realtime client, React state hooks.
