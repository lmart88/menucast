---
title: 'Responsive Homepage UI Redesign'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: 'f8e8f545e2f42a507c81ba699b65263bf96d2a2c'
context:
  - `{project-root}/project-context.md`
  - `{project-root}/docs/ux-designs/ux-menucast-2026-08-27/DESIGN.md`
  - `{project-root}/docs/ux-designs/ux-menucast-2026-08-27/EXPERIENCE.md`
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current homepage is a static, dark-only marketing screen with an incorrect TV-player CTA, no representative menu proof, and no responsive or theme-switching behavior.

**Approach:** Rebuild the homepage presentation around the approved Figma themes: a compact header, hero promise, representative 16:9 menu display, source-format cues, platform support, footer, and a persisted accessible sun/moon theme toggle. Keep the existing routes and authentication flow intact.

## Boundaries & Constraints

**Always:** Use the existing Next.js App Router and Tailwind v4 setup; preserve `/login` and route the primary action to `/pair`; support light and dark themes with equivalent content and contrast; use Nunito or the closest existing project font setup; keep 16px mobile, 32px tablet, and 64px desktop gutters; keep the demo at a stable 16:9 ratio; provide accessible names, focus states, and reduced-motion behavior.

**Ask First:** None.

**Never:** Add pricing, authentication, API, database, or TV-player changes; add a new UI framework; use the blank gray rectangle as the final demo; rely on emoji or unlabeled logos for meaning; introduce ambiguous “No hardware required” claims.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Visitor opens `/` | Homepage renders the selected theme, representative menu demo, Pair Your TV CTA, sign-in link, and labeled platform support | N/A |
| THEME_SWITCH | Visitor activates the header theme button | Theme changes immediately, icon and accessible label describe the next action, and preference persists after reload | Fall back to light theme if stored value is invalid |
| MOBILE_LAYOUT | Viewport is under 768px | Header may wrap, hero uses 40px display type, CTA fills available width, demo remains 16:9, and no horizontal overflow occurs | N/A |
| REDUCED_MOTION | `prefers-reduced-motion: reduce` is enabled | Decorative entrance animation is suppressed while content and focus changes remain available | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/app/page.tsx` -- homepage structure, theme state, navigation, demo content, platform labels, and footer.
- `apps/web/app/globals.css` -- theme variables, Nunito/font fallback, patterned surfaces, responsive presentation, focus states, and motion rules.
- `apps/web/app/layout.tsx` -- existing application shell and metadata; preserve its provider and registration behavior.
- `apps/web/package.json` -- available Next.js, React, and Tailwind v4 toolchain; no icon library is currently installed.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/app/page.tsx` -- replace the static homepage with a client-side responsive themed experience, representative menu display, accessible sun/moon control, `/pair` primary CTA, `/login` secondary link, and labeled platform support -- align the live page with the approved Figma frame and UX contract.
- [x] `apps/web/app/globals.css` -- define light/dark tokens, Nunito-compatible typography, dotted atmospheric surfaces, stable demo sizing, responsive breakpoints, focus visibility, and reduced-motion rules -- keep visual behavior consistent across viewport sizes.

**Acceptance Criteria:**
- Given a visitor opens `/`, when the page renders, then the headline, supporting copy, representative menu demo, Pair Your TV action, sign-in action, platform support, and footer are visible in the intended order.
- Given the visitor activates the header theme control, when the theme changes, then surfaces, text, borders, icon state, and button contrast update without layout shift and the choice survives reload.
- Given a mobile or tablet viewport, when the page is rendered, then content fits without horizontal scrolling, the demo remains 16:9, the header can wrap, and the primary CTA remains at least 44px high.
- Given a keyboard or assistive-technology user, when navigating the homepage, then the theme control and links have meaningful names, visible focus states, and no meaning depends on color or unlabeled imagery.

## Design Notes

The Figma source provides two equivalent themes rather than separate layouts. The demo should show a small, legible example menu with source cues beneath it; it is illustrative and does not need interaction or autoplay. Platform marks may be represented with text labels when exact exported assets are not committed locally, but each platform must remain understandable without its mark.

## Verification

**Commands:**
- `pnpm --filter @menucast/web lint` -- expected: no lint errors.
- `pnpm --filter @menucast/web build` -- expected: production build succeeds.

**Manual checks:**
- Inspect `/` at desktop, tablet, and mobile widths in both themes; verify no clipping, overflow, or contrast regression.
- Toggle the theme, reload, and confirm the selected theme remains active.

## Suggested Review Order

**Homepage behavior**

- Start with the client theme state and accessible SVG controls.
  [page.tsx:41](../../apps/web/app/page.tsx#L41)

- Review the hero, representative menu, source cues, and `/pair` CTA together.
  [page.tsx:61](../../apps/web/app/page.tsx#L61)

**Responsive visual system**

- Check theme tokens, atmospheric surface, typography, and shared page geometry.
  [globals.css:3](../../apps/web/app/globals.css#L3)

- Check the stable display ratio, menu artwork, controls, and platform layout.
  [globals.css:35](../../apps/web/app/globals.css#L35)

- Check mobile and tablet gutters plus reduced-motion interaction behavior.
  [globals.css:49](../../apps/web/app/globals.css#L49)