export default function LayeredVisual() {
  return (
    <section id="layers" className="landing-section pinned" data-pinned>
      <h2 className="landing-title reveal">Architektur in Schichten</h2>
      <p className="reveal" style={{ color: 'var(--landing-muted)', maxWidth: '48ch', marginBottom: '1.5rem' }}>
        Jede Schicht hat eine Aufgabe — Daten, Logik, Freigabe. Klare Trennung,
        kein Kabel-Salat.
      </p>
      <div className="layer-wrap">
        <div className="layer layer-back" />
        <div className="layer layer-mid" />
        <div className="layer layer-front" />
      </div>
    </section>
  );
}
