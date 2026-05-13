export default function Hero() {
  return (
    <section id="hero" className="hero landing-section">
      <div className="hero-noise" />
      <p className="eyebrow reveal">NOX Labs · Systeme statt Templates</p>
      <h1 className="hero-title reveal">
        Systeme, die Kunden bringen —<br />nicht nur gut aussehen.
      </h1>
      <p className="hero-copy reveal">
        NOX Labs baut Webseiten, Lead-Systeme und Automationen, die aus
        Aufmerksamkeit echte Anfragen machen. Strukturiert, messbar, produktionsreif.
      </p>
      <div className="reveal" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <a href="/contact" className="hero-cta">Projekt besprechen</a>
        <a href="#showcase" className="hero-cta">Systeme ansehen</a>
      </div>
      <div className="scroll-cue">Scroll</div>
    </section>
  );
}
