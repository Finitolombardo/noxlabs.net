# Open-Source Motion References

Repo-first scan in this project: existing stack already uses React + Tailwind + Framer Motion. No GSAP/Lenis infra existed before this task.

| Repository | License | Useful pattern | Safe reuse decision |
|---|---|---|---|
| https://github.com/darkroomengineering/lenis | MIT | Smooth-scroll loop + manual `raf` sync with animation engines | Reuse library directly (`lenis`) |
| https://github.com/greensock/GSAP | GreenSock Standard License (not MIT) | ScrollTrigger timelines, pin/scrub architecture, `matchMedia` patterns | Use library as dependency; do not copy repo code |
| https://github.com/locomotivemtl/locomotive-scroll | MIT | Section/parallax detection patterns and mobile parallax reduction approach | Learn patterns only; no template import |
| https://github.com/14islands/r3f-scroll-rig | MIT | Layered scroll-depth orchestration design ideas for complex scenes | Learn only (not required for this 2D implementation) |

## Reuse policy
- No full template imports.
- No copy-paste from project source files.
- Only architecture patterns and public docs concepts were adapted.
- Final implementation is original NOX/AlphaMind structure and styling.
