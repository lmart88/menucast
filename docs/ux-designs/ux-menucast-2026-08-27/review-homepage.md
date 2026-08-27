# Homepage Design Review

## Findings

### High: Primary CTA routes to the wrong surface
The current homepage implementation sends “Pair Your TV” to `/tv`, which is the display client, while the existing pairing flow is `/pair`. This breaks the stated homepage job and can strand visitors on a TV-player surface. Update the design and implementation contract to `/pair`.

### High: Demo proof is missing
The Figma design shows a gray rectangle rather than a representative menu/display state. Since viewing the demo is the primary homepage goal, the first visual proof point should show what a live menu looks like. Keep it illustrative and stable rather than pretending it is an interactive TV preview.

### High: Responsive behavior is unspecified
The source frame only documents desktop variants. Mobile and tablet need explicit gutters, type scaling, CTA stacking, stable 16:9 demo sizing, and platform-row wrapping/list behavior.

### Medium: Theme parity is incomplete in implementation
The Figma source includes light/dark variants and a moon control, but the current homepage implementation is dark-only and has no theme switch. Both variants need equivalent content, contrast, focus states, and icon labels.

### Medium: Platform language is ambiguous
The logo row mixes TV brands, operating systems, and devices. Replace “Available for” with precise platform-family language and provide text labels so logos are not the only information.

### Medium: Copy claim needs qualification
“No hardware required” can conflict with the physical-TV pairing flow. Use language that describes the affordable-device model without implying that a display requires no device at all.

## Lens Summary

- UX rubric: hierarchy and surface purpose are clear after CTA and demo corrections; pricing is out of scope.
- Accessibility: add names to moon/sun and platform controls, verify AA contrast in both themes, preserve focus order and touch targets.
- Responsive: add mobile/tablet frames and test at narrow widths and 200% zoom.
- Conversion/onboarding: keep one dominant CTA and preserve the existing auth callback into `/pair`.
- Copy: make the demo promise concrete and remove ambiguous “no hardware” phrasing.

## Open Items

- Final representative menu artwork and platform logo source assets remain implementation inputs.
- Exact theme persistence mechanism is an implementation detail; the design requires persisted user choice where the app supports it.
