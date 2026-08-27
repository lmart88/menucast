---
title: 'Replace Homepage Logo Asset'
type: 'feature'
created: '2026-08-27'
status: 'done'
route: 'one-shot'
baseline_commit: '38c5b7f4abadec5608b7320c7f94fc2b750494bb'
---

# Replace Homepage Logo Asset

## Intent

**Problem:** The homepage header used the previous MenuCast logo asset, but the requested Figma node provides the desired replacement brand mark.

**Approach:** Replace the existing committed SVG in place with the exact export from Figma node `1461:11833`, preserving the homepage markup, navigation, theme toggle, responsive layout, and accessible home link.

## Suggested Review Order

**Asset replacement**

- Verify the committed SVG source and its native dimensions.
  [menucast-logo.svg:1](../apps/web/public/menucast-logo.svg#L1)

- Verify the homepage continues using the stable public asset path.
  [page.tsx:66](../apps/web/app/page.tsx#L66)

**Responsive rendering**

- Verify proportional 90×20 sizing and narrow-screen overflow protection.
  [globals.css:42](../apps/web/app/globals.css#L42)

- Confirm the accessible home link and header interactions remain unchanged.
  [page.tsx:66](../apps/web/app/page.tsx#L66)