---
name: MenuCast Homepage
status: final
sources:
  - ../../prd.md
  - https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1459-10953
updated: 2026-08-27
---

## Foundation

Responsive web homepage for agency designers and restaurant owners. The homepage is a demonstration and onboarding surface, not a pricing surface. `DESIGN.md` owns visual identity; this document owns behavior. Desktop, tablet, and mobile share the same content hierarchy. Light and dark themes are user-switchable through the header moon/sun control.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Homepage | App open / `/` | View the Figma-to-TV demo and begin TV pairing |
| Pairing | Homepage primary CTA / `/pair` | Authenticate if needed, enter a TV pairing code, name the display |
| Sign in | Header / `/login` | Authenticate directly |

The homepage contains: header, hero promise, demo display, primary pairing action, source/platform support. Pricing is intentionally excluded.

## Voice and Tone

| Do | Don't |
|---|---|
| “See your menu live on screen.” | “Transform your business today!” |
| “Pair Your TV” | “Get started now!!!” |
| “Designed in Figma. Live on your display.” | “No hardware required” without qualification |
| “Available on web, Android TV, Fire TV, and Apple TV.” | “Available for” beside an unlabeled mixed logo row |

## Component Patterns

| Component | Behavioral rules |
|---|---|
| Theme toggle | Button with accessible name “Switch to light theme” or “Switch to dark theme”; preserves the selected theme; icon state matches the action. |
| Demo surface | Stable 16:9 aspect ratio; uses representative menu content; does not require interaction to understand the value. |
| Pair Your TV | Primary homepage action; navigates to `/pair`; unauthenticated visitors are redirected to `/login?callbackUrl=/pair` by the existing flow. |
| Sign in | Secondary header action; navigates to `/login`. |
| Platform row | Logos are supplementary; each has an accessible text label. |

## State Patterns

| State | Treatment |
|---|---|
| Default | Demo and Pair Your TV are immediately visible without requiring scroll on common desktop and tablet heights. |
| Mobile | Header may wrap; CTA becomes full-width; demo remains before the platform row; no horizontal overflow. |
| Dark theme | Dark surfaces and light text; moon/sun control exposes the next available theme. |
| Light theme | Light surfaces and dark text; same content and order as dark theme. |
| Pairing redirect | Existing authentication callback behavior is preserved; homepage does not duplicate the pairing form. |
| Reduced motion | Suppress decorative entrance motion; retain focus and state changes. |

## Interaction Primitives

- Tap/click to pair or sign in.
- Theme toggle is keyboard and screen-reader operable.
- Focus order follows header, hero copy, demo, primary action, platform support.
- No carousel, autoplay video, or hover-only explanation in the homepage demo.
- Primary action target is at least 44px high and remains reachable on mobile.

## Accessibility Floor

- WCAG 2.2 AA contrast for text, controls, and focus indicators in both themes.
- Every icon-only control has an accessible name and visible focus state.
- The demo has a concise alternative description, such as “Example digital menu displayed on a TV.”
- Text remains readable at 200% zoom and does not clip at the mobile breakpoint.
- Platform logos have text alternatives; decorative marks are hidden from assistive technology.
- No meaning is conveyed by green status color alone.

## Responsive & Platform

| Viewport | Behavior |
|---|---|
| Desktop, 1024px+ | Centered content column; header controls in one row; demo constrained to a readable width. |
| Tablet, 768–1023px | 32px gutters; hero and demo remain vertically stacked; controls retain touch-safe spacing. |
| Mobile, under 768px | 16px gutters; wrapped header; 40px display type; full-width CTA; 16:9 demo fits container width; platform row wraps or becomes a labeled list. |

## Key Flows

### Flow 1 — Carlos pairs a restaurant display

1. Carlos opens the homepage after launching the TV player.
2. He reads the headline and sees a representative menu on the demo display.
3. He taps **Pair Your TV**.
4. The existing `/pair` flow sends him to sign-in when necessary and preserves `/pair` as the callback destination.
5. He enters the TV code and display name.
6. **Climax:** the display is paired and he returns to the dashboard, ready to publish a menu.

### Flow 2 — Maya evaluates the Figma workflow

1. Maya opens the homepage on a tablet between client meetings.
2. She sees the demo and recognizes the Figma/source-format cues.
3. She switches between light and dark theme to match her working environment.
4. She taps **Pair Your TV** to test the real onboarding path.
5. **Climax:** the pairing flow begins without a dead-end preview or an unexplained `/tv` route.
