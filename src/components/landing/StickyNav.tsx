import { landingSections } from '../../data/landing-content';

export default function StickyNav() {
  return (
    <nav className="sticky-nav">
      {landingSections.map((section) => (
        <a key={section.id} href={`#${section.id}`}>{section.label}</a>
      ))}
    </nav>
  );
}
