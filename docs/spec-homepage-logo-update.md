---
title: 'Homepage Header Logo Update'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: '724385434ffce9a3aef55525f24d016d0405d009'
context:
  - `{project-root}/project-context.md`
  - `{project-root}/docs/ux-designs/ux-menucast-2026-08-27/DESIGN.md`
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage header currently approximates the MenuCast brand with hand-built text and a CSS lettermark, which does not match the approved Figma header logo.

**Approach:** Replace the handmade wordmark with the exact SVG logo asset from Figma node `1459:10960`, preserving the existing home link, theme toggle, sign-in link, header spacing, and responsive behavior.

## Boundaries & Constraints

**Always:** Use the supplied Figma SVG as the logo source; preserve the logo's designed aspect ratio and fixed 94.327×20px visual box; provide meaningful alternative text through the home link; keep the logo visible in both themes and at mobile widths; preserve the existing sun/moon control and `/login` navigation.

**Ask First:** None.

**Never:** Redraw or approximate the logo with text, CSS shapes, emoji, or a new inline SVG; change homepage copy, layout sections, theme behavior, routes, authentication, or backend code; alter the Figma asset's proportions or apply filters that change its appearance.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Homepage loads in either theme | Exact Figma logo renders in the header with the correct visual proportions and an accessible home link | N/A |
| MOBILE_HEADER | Viewport is under 768px | Logo remains fully visible without clipping or horizontal overflow while theme and sign-in controls remain reachable | N/A |
| ASSET_FAILURE | Logo asset cannot be loaded | Link retains its accessible name and layout reserves the designed logo dimensions | Browser image fallback behavior |

</frozen-after-approval>

## Code Map

- `apps/web/app/page.tsx` -- homepage header markup and current handmade wordmark.
- `apps/web/app/globals.css` -- wordmark sizing and responsive header styles.
- `apps/web/public/` -- committed static asset location for the exact Figma SVG.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/public/menucast-logo.svg` -- add the exact SVG bytes from the supplied Figma asset URL -- make the source stable for committed production code.
- [x] `apps/web/app/page.tsx` -- replace the CSS/text wordmark with the SVG asset and preserve the accessible home link and header controls -- match the Figma header logo geometry.
- [x] `apps/web/app/globals.css` -- size the logo at its designed aspect ratio and keep it responsive without clipping -- preserve desktop and mobile header behavior.

**Acceptance Criteria:**
- Given the homepage header renders, when the logo loads, then it uses the supplied Figma SVG rather than a hand-built text or CSS approximation.
- Given a visitor uses keyboard navigation or assistive technology, when they encounter the logo, then the home link has the accessible name `MenuCast home` and the logo itself is decorative.
- Given either theme or a mobile/tablet viewport, when the header renders, then the logo remains visible with preserved proportions, no horizontal overflow occurs, and theme/sign-in controls remain functional.

## Design Notes

The Figma node specifies a 94.327×20px logo type box and a 24px moon control with 16px spacing between header actions. The SVG must be rendered as a single image asset so the brand geometry and color treatment come from the approved source. The existing header wrapper already provides the responsive container and should remain the layout boundary.

## Verification

**Commands:**
- `pnpm --filter @menucast/web build` -- expected: production build succeeds.
- `pnpm --filter @menucast/web lint` -- expected: no new diagnostics in the homepage files.

**Manual checks:**
- Inspect `/` in light and dark themes at desktop, tablet, and mobile widths; verify the supplied logo is visible, proportionate, and not clipped.
- Cmd+click the logo and confirm it still routes to `/`.

## Suggested Review Order

**Logo integration**

- Start with the header image source and preserved home-link accessibility.
  [page.tsx:66](../../apps/web/app/page.tsx#L66)

- Check the exact logo box and dark-theme visibility treatment.
  [globals.css:42](../../apps/web/app/globals.css#L42)

**Responsive header**

- Verify desktop geometry, mobile spacing, and narrow-screen control access.
  [globals.css:82](../../apps/web/app/globals.css#L82)

- Confirm the committed asset is the only production logo source.
  [menucast-logo.svg:1](../../apps/web/public/menucast-logo.svg#L1)