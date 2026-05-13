import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function useLandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduceMotion) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    const reveals = gsap.utils.toArray<HTMLElement>('.reveal');
    reveals.forEach((el, i) => {
      gsap.fromTo(el, { y: 28, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        delay: i * 0.03,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    if (!isMobile) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '[data-pinned]',
          start: 'top top',
          end: '+=1600',
          scrub: true,
          pin: true,
        },
      })
        .to('.layer-back', { yPercent: -12, scale: 1.05 }, 0)
        .to('.layer-mid', { yPercent: -24, rotation: -4 }, 0)
        .to('.layer-front', { yPercent: -38, rotation: 5, scale: 0.94 }, 0);

      gsap.fromTo('.checkout-card', { y: 60, opacity: 0.2 }, {
        y: 0,
        opacity: 1,
        stagger: 0.18,
        scrollTrigger: { trigger: '.checkout-stack', start: 'top 70%', end: 'bottom 40%', scrub: 1 },
      });
    }

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, []);
}
