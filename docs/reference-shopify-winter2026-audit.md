# Shopify Winter 2026 Reference Audit

> **Disclaimer**: Diese Referenz dient nur der Analyse von Layout-/Motion-Prinzipien.
> Keine Shopify-Texte, Assets, Screenshots oder Designs werden in der NOX-Landingpage ausgeliefert.

## Scope + legal boundary
Public-page analysis only. No Shopify code/assets copied into product output.

## Captured screenshots
- docs/audit-screenshots/desktop-1440-full.png
- docs/audit-screenshots/mobile-390-full.png
- Boundary captures: 12/25/40/55/70/85 for both viewports

## Observed page structure
- Long-form anchored storytelling with sticky chapter navigation.
- Repeating pattern: narrative intro -> media-heavy cards -> transition blocks -> next chapter.
- Section IDs include chapter-like anchors (`sidekick`, `agentic`, `online`, `retail`, `marketing`, `checkout`).

## Motion/system observations
- High scroll depth, frequent pinned/fixed regions, and layered visual compositions.
- Mixed media orchestration: image, video, SVG, and canvas/WebGL contexts present.
- Card reveals and staggered text blocks dominate micro-progression.
- Strong scrub-like transitions between chapter boundaries.

## Asset inventory (sample)
| URL | type | dimensions | apparent purpose | policy |
|---|---|---|---|---|
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/favicon_256.png?v=1760634627 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0921/8919/6588/files/Summer2025.svg?v=1760667315 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0702/3204/7829/files/Editions-Winter-25-compressed.svg?v=1733331674 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0842/2601/5254/files/Editions_Summer_24.svg?v=1716836623 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/preview_images/620a0d8735da4d97b040b1cd98693898.thumbnail.0000000000.jpg?v=1765339098&width=100&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/compressed-pulseDesktopPoster-desktop.webp?v=1765345989&width=100&height=52&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/apps-bg-image.png?v=1763934791&width=100&height=43&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/Rectangle_240654805.png?v=1763642972 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/default_abdd996f-1b4e-44a5-bfcc-8addca857894.png?v=1765164459&width=100&height=98&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/en_4608c98d-d4f7-4d35-8b94-e83258e20e54.png?v=1765309078&width=100&height=83&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/compressed-u2poster_12_9.webp?v=1765315033&width=100&height=83&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/default_ee658e76-0d9b-46c9-b479-5baab424fb97.png?v=1765164617&width=100&height=88&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/compressed-u8poster_12_9.webp?v=1765315279&width=100&height=77&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/en_3a493a1f-2575-43b6-9e6e-22033556b139.png?v=1765309833&width=100&height=173&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/u16poster_desktop.webp?v=1765308291&width=100&height=173&crop=center | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/emoji3.png?v=1764108967&width=80 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/emoji6.png?v=1764108966&width=80 | img | n/a | inline image | reference only, do not ship |
| https://cdn.shopify.com/s/files/1/0951/3130/4218/files/emoji2.png?v=1764108966&width=80 | img | n/a | inline image | reference only, do not ship |

## Conceptual extraction
### What to copy conceptually
- Chapter-based scroll narrative architecture.
- Pinned layered visual moments with independent depth speeds.
- Staggered reveal cadence for dense information sections.
- Sticky in-page navigation with active chapter context.

### What not to copy
- Shopify logos, wording, imagery, video, icons, and proprietary brand styling.
- Shopify source code or minified runtime behavior.
- Exact spacing/typography tokens that function as trade dress.
