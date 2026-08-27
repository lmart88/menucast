---
name: MenuCast Homepage
status: final
sources:
  - ../../prd.md
  - https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1459-10953
updated: 2026-08-27
colors:
  surface-base: '#0A0A0A'
  surface-base-light: '#FFFFFF'
  surface-raised: '#171717'
  surface-raised-light: '#F5F5F5'
  ink-primary: '#FFFFFF'
  ink-primary-light: '#171717'
  ink-secondary: '#A3A3A3'
  ink-secondary-light: '#666666'
  accent: '#34D399'
  border-subtle: '#262626'
  border-subtle-light: '#E5E5E5'
typography:
  display:
    fontFamily: 'Nunito'
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.05'
  body:
    fontFamily: 'Nunito'
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Nunito'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  unit: 8px
  gutter-mobile: 16px
  gutter-tablet: 32px
  gutter-desktop: 64px
components:
  primary-cta:
    background: '{colors.ink-primary}'
    foreground: '{colors.ink-primary-light}'
    radius: '{rounded.lg}'
  demo-surface:
    background: '{colors.surface-raised}'
    radius: '{rounded.md}'

---

## Brand & Style

MenuCast is a practical, design-forward bridge between a Figma workflow and a live TV. The homepage should feel direct and capable: the visitor sees the output, understands the handoff, and can pair a screen without decoding a marketing funnel. Existing neutral dark/light themes and Nunito remain the visual identity.

## Colors

Dark and light surfaces are equivalent theme choices, not separate products. The green accent signals live or connected status only. Primary actions remain high-contrast neutral controls. Avoid introducing pricing colors, decorative gradients, or unsupported brand hues.

## Typography

Nunito is retained from the Figma source. The display role carries the product promise; body copy stays readable and compact. On mobile, the display role scales to 40px with the same line-height and no clipped text.

## Layout & Spacing

Desktop uses a centered content column with a full-width hero demo below the headline. Tablet uses 32px gutters and keeps the demo prominent. Mobile uses 16px gutters, stacks navigation controls, uses full-width actions, and places the demo before supporting detail. No pricing section is included.

## Elevation & Depth

Use tonal contrast and a subtle border to frame the demo. Shadows are optional and restrained; the display preview must read as the product, not as a floating decoration.

## Shapes

Use 4px for the display frame, 8px for controls, and 12px for the primary CTA. Avoid pill-shaped containers except for a small live-status indicator when it is meaningful.

## Components

- **Header:** wordmark left; theme toggle and Sign in right on desktop/tablet; compact stacked or wrapped arrangement on mobile. Theme control has a visible accessible name and switches moon/sun state.
- **Hero:** headline, concise supporting copy, primary Pair Your TV action, and a meaningful menu demo. The demo is the first visual proof point.
- **Demo surface:** a stable 16:9 display frame showing an example menu state, with small source-format cues beneath it. It is illustrative, not an interactive TV preview.
- **Platform row:** label platform families precisely; logos use accessible names and never carry the sole meaning.
- **Primary CTA:** high-contrast, full-width on mobile, routes to `/pair`.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Show the menu/display result as the homepage proof | Use a blank gray rectangle as the only demo |
| Keep Pair Your TV as the single dominant action | Send the primary CTA to `/tv` |
| Preserve light/dark parity across breakpoints | Make mobile a dark-only fallback |
| Use explicit labels for theme and platform controls | Rely on logos or icons without accessible names |
| Keep pricing out of this homepage scope | Reintroduce hidden or unfinished pricing content |
