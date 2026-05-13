import { showcaseFeatures } from '../../data/landing-content';

export default function ScrollShowcase() {
  return (
    <section id="showcase" className="landing-section">
      <h2 className="landing-title reveal">Was wir bauen</h2>
      <div className="feature-grid">
        {showcaseFeatures.map((f) => (
          <article className="feature-card reveal" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
