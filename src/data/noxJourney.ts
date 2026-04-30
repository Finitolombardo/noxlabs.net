export interface JourneyModule {
  name: string;
}

export interface JourneySection {
  id: string;
  number: string;
  label: string;
  background?: string;
  smallLabel?: string;
  headline: string[];
  copy: string;
  modules?: JourneyModule[];
  cta?: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
}

export const noxJourney: JourneySection[] = [
  {
    id: 'descend',
    number: '01',
    label: 'Descend',
    background: '/journey/01_monolith_hero.png',
    smallLabel: 'SCROLL TO ENTER',
    headline: ['DESCEND.'],
    copy: 'Powering human development and business systems from the core.',
  },
  {
    id: 'foundation',
    number: '02',
    label: 'Foundation',
    background: '/journey/02_foundation_reactor.png',
    headline: ['DEEPER SYSTEMS.', 'STRONGER FOUNDATIONS.'],
    copy: 'Beneath the surface lies the infrastructure that powers everything we build.',
  },
  {
    id: 'engine',
    number: '03',
    label: 'Engine Layer',
    background: '/journey/03_engine_layer.png',
    headline: ['BUILT TO OPERATE.', 'DESIGNED TO SCALE.'],
    copy: 'A modular system of engines working in sync to grow, convert and automate.',
    modules: [
      { name: 'Workflow Forge' },
      { name: 'Sales Intelligence' },
      { name: 'Content Engine' },
      { name: 'Automation Core' },
    ],
  },
  {
    id: 'intelligence',
    number: '04',
    label: 'Intelligence',
    background: '/journey/04_intelligence_signal.png',
    headline: ['DATA. SIGNALS.', 'REAL OUTCOMES.'],
    copy: 'Conversations, workflows and actions become measurable intelligence.',
  },
  {
    id: 'vision',
    number: '05',
    label: 'Vision',
    background: '/journey/05_nox_vision.png',
    headline: ['THE OPERATING SYSTEM', 'FOR HUMAN POTENTIAL.'],
    copy: 'A future where systems work for people, business and growth — not the other way around.',
  },
  {
    id: 'cta',
    number: '06',
    label: 'Build',
    headline: ['BUILD WHAT MATTERS.', 'WE BUILD THE SYSTEMS.'],
    copy: 'Work with NOX Labs to build operative AI engines for growth, automation and intelligence.',
    cta: {
      primary: { label: 'Gespräch buchen', href: '/contact' },
      secondary: { label: 'Systeme ansehen', href: '/systems' },
    },
  },
];
