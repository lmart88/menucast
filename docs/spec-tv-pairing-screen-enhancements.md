# Product Requirements Document (PRD) / Feature Spec: TV Pairing Screen Responsiveness & Clickable Pairing URL

**Document Status**: `Implemented & Verified`  
**Feature ID**: `FEAT-TV-PAIRING-ADAPTIVE`  
**Target Module**: `apps/web/app/tv/page.tsx` & `apps/web/app/globals.css`  
**Created**: 2026-09-09  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
1. **Unclickable Pairing Link**: On the TV player screen (`/tv`), the manual URL is rendered as static text inside a `<span>`. When users open the TV player on a web browser, desktop display, tablet, or preview window, they cannot click the link to directly open the pairing page, forcing error-prone manual typing or URL copy-pasting.
2. **Vertical Overflow & Unwanted Scrolling**: The TV pairing screen layout is fixed with static paddings (`p-6`), large QR dimensions (`size-[215px]`/`size-[225px]`), and static text hierarchy. On smaller display heights (e.g. 720p screens, laptop screens, vertical/portrait displays, or windowed previews), elements spill past the viewport boundaries. Because TV/signage displays must be clean, single-viewport experiences ("zero scroll"), any vertical scrolling or bottom-edge clipping creates a broken user experience.

### 1.2 Objective
- **Interactive Pairing**: Make the pairing URL immediately clickable (opening `{appUrl}/pair?code={code}` in a new tab) with accessible hover and focus rings.
- **Zero-Scroll Adaptive Layout**: Ensure the entire pairing screen—including header logo/controls, perched mascot, QR code, countdown timer, heading, instructions, pairing code pill, clickable link, and footer—adapts smoothly to 100% of the visible viewport (`100dvh`) without vertical scrolling across all standard resolutions, orientations, and aspect ratios.

---

## 2. User Personas & Use Cases

| Persona | Environment | Use Case |
|---|---|---|
| **Carlos (Restaurant Owner / GM)** | Physical TV / Android TV / Fire TV | Opens the app on a wall-mounted TV display (1080p, 720p, 4K, or 9:16 portrait kiosk). The screen fits perfectly edge-to-edge without scrollbars or clipped text. |
| **Maya (Designer) / QA Engineer** | Desktop Browser / Laptop Window | Opens `/tv` on a laptop or resized browser window to test pairing. All elements fit without scrolling, and clicking the pairing link instantly opens the pairing interface in a new browser tab. |
| **Mobile / Tablet Tester** | iPad / Android Tablet / Mobile Device | Opens `/tv` in portrait or landscape mode; the UI scales proportionally so the QR code and instructions remain visible without scrolling down. |

---

## 3. Functional Requirements (FR)

### FR-1: Clickable Pairing URL
- **FR-1.1**: The manual link displayed in the instructions column must be wrapped in an accessible anchor tag (`<a>`) targeting the full pairing URL (`${appUrl}/pair?code=${pairingCode}`).
- **FR-1.2**: Clicking the link must open the pairing page in a new browser tab (`target="_blank"` and `rel="noopener noreferrer"`).
- **FR-1.3**: Provide interactive states:
  - Default: Underlined, styled in `var(--foreground)` or `var(--accent)`.
  - Hover: Color transition to `var(--accent)` or background hover pill.
  - Focus: Distinct keyboard focus ring (`focus-visible:ring-2 focus-visible:ring-[var(--accent)]`).
- **FR-1.4**: If the pairing code is still loading or blank, the link should be temporarily disabled (`pointer-events-none opacity-60`).

### FR-2: Zero-Scroll Adaptive Viewport Layout
- **FR-2.1 Full-Viewport Containment**:
  - The outer wrapper must strictly lock to the viewport height (`h-screen h-[100dvh] max-h-screen overflow-hidden`).
  - Vertical scrolling (`overflow-y: scroll/auto`) is prevented; content must dynamically scale to fit within the viewport height.
- **FR-2.2 Fluid Scaling & Compact Spacing**:
  - Main container uses adaptive flexbox (`flex-col md:flex-row items-center justify-center`) with fluid gap (`gap-4 sm:gap-6 md:gap-8 lg:gap-10`).
  - QR Code card adjusts size based on viewport height/width:
    - Compact/mobile/small height (height < 700px): QR container scales to `~160px–180px`, QR code scales to `140px–160px`.
    - Standard desktop/1080p/4K: QR container scales to `215px–225px`, QR code scales to `190px`.
  - Typography scales adaptively using Tailwind responsive classes or `clamp()`:
    - Heading: `text-2xl sm:text-3xl md:text-4xl`.
    - Description: `text-xs sm:text-sm md:text-base`.
    - Mascot size: scales cleanly without overlapping QR details or pushing content down.
- **FR-2.3 Portrait & Vertical Screen Optimization**:
  - On portrait displays (e.g. 9:16 digital posters, 1080x1920), stack the QR card and instructions vertically with balanced spacing so that neither the header nor the footer is pushed offscreen.
- **FR-2.4 Header & Footer Proportioning**:
  - Header padding reduced on compact screens (`px-4 py-2` to `px-6 py-4`).
  - Footer compact padding (`py-2` to `py-4`) ensuring it never overflows the bottom edge.

---

## 4. Non-Functional Requirements (NFR)

| Category | Requirement |
|---|---|
| **Zero Layout Shift (CLS)** | Layout dimensions remain stable when dynamic pairing codes arrive from `/api/tv/init`. |
| **QR Code Scannability** | QR code error-correction level remains `H` (high) and maintains a minimum rendered dimension of $150 \times 150\,\text{px}$ to guarantee scannability from 6–10 feet. |
| **TV Remote & Keyboard Navigation** | All interactive elements (Theme toggle, Fullscreen, New Code, Pairing URL) support keyboard/remote D-pad focus. |
| **Performance** | Zero heavy runtime resize recalculations; purely CSS flexbox/grid and media queries. |

---

## 5. Screen Layout Blueprint

```
+-------------------------------------------------------------------------+
| [miniKast Logo]                         [Theme Toggle] [Fullscreen] [R] |  <-- Header (compact padding)
+-------------------------------------------------------------------------+
|                                                                         |
|        +---------------------+      +----------------------------+      |
|        |    [Mascot Bird]    |      | Screen Setup               |      |
|        |  +---------------+  |      | Pair this Display          |      |
|        |  |               |  |      |                            |      |
|        |  |    QR CODE    |  |      | Scan the QR code or click  |      |  <-- Main Container
|        |  | (160px-225px) |  |      | the link below to pair.    |      |      (Fits 100dvh, flex
|        |  +---------------+  |      |                            |      |       gap-4 to gap-10,
|        |  Refreshes in 09:59 |      | [ Pairing Code: WORD-1234] |      |       zero vertical scroll)
|        +---------------------+      |                            |      |
|                                     | Manual link: [CLICKABLE] ↗ |      |
|                                     +----------------------------+      |
|                                                                         |
+-------------------------------------------------------------------------+
|                   TV Mode Active • Auto-reconnecting                   |  <-- Footer (compact py-2)
+-------------------------------------------------------------------------+
```

---

## 6. Acceptance Criteria (Given / When / Then)

### Scenario 1: User clicks the manual pairing link on web/desktop
- **Given** the user is viewing the `/tv` screen on a browser or device with a pointer/keyboard,
- **When** the pairing code is loaded and the user clicks on the manual link (`{appUrl}/pair?code=...`),
- **Then** the browser opens the pairing page in a new browser tab with the `code` query parameter pre-filled.

### Scenario 2: Display loaded on short or small-height screens
- **Given** a user launches `/tv` on a small laptop screen (e.g. 1366x768 or 800x600 window) or portrait display,
- **When** the pairing screen renders,
- **Then** all UI elements (Header, QR card with mascot, countdown timer, title, instructions, code pill, link, footer) fit entirely within the viewport without displaying a vertical scrollbar.

### Scenario 3: QR Code readability remains intact
- **Given** the screen is scaled down to a smaller viewport height,
- **When** the QR card shrinks to fit,
- **Then** the QR code maintains high contrast, clear 4px border, and minimum 150px size ensuring instant scan capability on mobile phone cameras.

---

## 7. Affected Code & Technical Scope

- **`apps/web/app/tv/page.tsx`**:
  - Change manual link `<span>` into an `<a>` tag with `href={pairUrl}`, `target="_blank"`, and `rel="noopener noreferrer"`.
  - Update pairing view container styling from `min-h-screen` to `h-screen h-[100dvh] max-h-screen overflow-hidden flex flex-col justify-between`.
  - Add fluid/compact padding and sizing for `<header>`, `<main>`, `<footer`, QR card container, mascot, and typography.
