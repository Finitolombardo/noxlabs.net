import { modules } from '../../data/landing-content';
import FeatureCard from './FeatureCard';

export default function SystemModules() {
  return (
    <section id="modules" className="landing-section">
      <h2 className="landing-title reveal">Bausteine im System</h2>
      <div className="module-grid">{modules.map((m) => <FeatureCard key={m} title={m} />)}</div>
    </section>
  );
}
