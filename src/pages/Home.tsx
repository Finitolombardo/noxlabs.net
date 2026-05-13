import Hero from '../components/landing/Hero';
import StickyNav from '../components/landing/StickyNav';
import ScrollShowcase from '../components/landing/ScrollShowcase';
import CheckoutInspired from '../components/landing/CheckoutInspired';
import LayeredVisual from '../components/landing/LayeredVisual';
import SystemModules from '../components/landing/SystemModules';
import FinalCTA from '../components/landing/FinalCTA';
import { useLandingMotion } from '../components/landing/useLandingMotion';

export default function Home() {
  useLandingMotion();

  return (
    <main className="landing-root">
      <StickyNav />
      <Hero />
      <ScrollShowcase />
      <CheckoutInspired />
      <LayeredVisual />
      <SystemModules />
      <FinalCTA />
    </main>
  );
}
