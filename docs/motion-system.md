# Motion System

## Libraries
- `gsap` + `ScrollTrigger` for section timelines, reveal stagger, pinned layered sequence.
- `lenis` for smooth scrolling with manual RAF integration.

## Timeline architecture
- Global reveal pattern: `.reveal` elements animate on entering viewport (`top 85%`).
- Checkout stack: cards scrub into place with opacity and y transforms.
- Pinned sequence: `#layers` section pins and scrubs three depth layers at different rates.

## Reduced-motion + mobile strategy
- If `prefers-reduced-motion: reduce`, motion setup exits early.
- Mobile (`max-width: 768px`) skips heavy pin/scrub stack animations.
- CSS media rule disables transitions/animations for reduced-motion users.

## Performance strategy
- Animate transform/opacity only.
- Avoid width/height/top/left animation in scroll timelines.
- Keep layer visuals CSS/SVG placeholders instead of heavy video.

## Asset swap guide
- Place replaceable visuals under:
  - `public/assets/nox/`
  - `public/assets/nox/layers/`
  - `public/assets/nox/mockups/`
- Content model lives in `src/data/landing-content.ts`.
- Components are modular in `src/components/landing/*` for isolated replacement.

## Tuning
- Reveal cadence: adjust `delay: i * 0.03` and `duration: 0.75` in `useLandingMotion`.
- Pin length: adjust `end: '+=1600'` for shorter/longer layered narrative.
- Lenis feel: tune `lerp` in constructor.

## Known limitations
- No video/canvas hero media to keep legal and performance constraints simple.
- Active-section highlight in sticky nav is not yet implemented.
