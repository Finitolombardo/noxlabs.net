import type { SkillbookPerk } from '../../types/skillbook';
import { statusLabel } from '../../data/skillbookData';

type SkillbookDetailPanelProps = {
  perk: SkillbookPerk | null;
  skizzenHinweis: boolean;
  resolveName: (perkId: string) => string;
  onUpdatePerk: (perkId: string, patch: Partial<SkillbookPerk>) => void;
  onToast: (message: string) => void;
  onAlsPerkUebernehmen: () => void;
  // Optional: triggers the lokal-only Aufgabenentwurf flow in the parent
  // panel. When undefined, the draft button is hidden (e.g. in legacy
  // contexts that have not been migrated to the Faehigkeitskarte view).
  onAufgabenEntwurf?: () => void;
};

function Wirkung({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const visual = invert ? 100 - value : value;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[#cdbad2]">{label}</span>
        <span className="font-bold text-[#f7edf5]">{invert ? `${100 - value}%` : `${value}%`}</span>
      </div>
      <div className="h-2 rounded-full bg-[#261a2c]">
        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${Math.max(8, visual)}%` }} />
      </div>
    </div>
  );
}

function Zeilenliste({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <textarea
      value={value.join('\n')}
      onChange={(event) => onChange(event.target.value.split('\n').map((entry) => entry.trim()).filter(Boolean))}
      className="min-h-[80px] w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-3 py-2 text-sm text-[#f7edf5]"
    />
  );
}

export default function SkillbookDetailPanel({ perk, skizzenHinweis, resolveName, onUpdatePerk, onToast, onAlsPerkUebernehmen, onAufgabenEntwurf }: SkillbookDetailPanelProps) {
  if (!perk) {
    return (
      <aside className="max-h-[620px] overflow-y-auto rounded-3xl border border-[#35243d] bg-[#100813]/95 p-5">
        <h3 className="text-lg font-black text-[#fff5fc]">Detailpanel</h3>
        {skizzenHinweis ? (
          <div className="mt-3 space-y-3 text-sm text-[#e6d9eb]">
            <p>Dieses Element ist noch nicht mit einer Karte verbunden.</p>
            <button type="button" onClick={onAlsPerkUebernehmen} className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100">
              Als Karte übernehmen
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#e6d9eb]">Wähle eine Karte oder erstelle eine neue Karte.</p>
        )}
      </aside>
    );
  }

  return (
    <aside className="max-h-[620px] overflow-y-auto rounded-3xl border border-[#35243d] bg-[#100813]/95 p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[#9f89a7]">Fähigkeitskarte – Karten-Details</div>
      <input
        value={perk.name}
        onChange={(event) => onUpdatePerk(perk.id, { name: event.target.value })}
        className="mt-1 w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-3 py-2 text-xl font-black text-[#fff5fc]"
      />

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="text-xs text-[#cab7d1]">Kategorie
          <input value={perk.kategorie} onChange={(event) => onUpdatePerk(perk.id, { kategorie: event.target.value as SkillbookPerk['kategorie'] })} className="mt-1 w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-2 py-1.5 text-sm text-[#f7edf5]" />
        </label>
        <label className="text-xs text-[#cab7d1]">Kapitel
          <input value={perk.kapitel} onChange={(event) => onUpdatePerk(perk.id, { kapitel: event.target.value })} className="mt-1 w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-2 py-1.5 text-sm text-[#f7edf5]" />
        </label>
        <label className="text-xs text-[#cab7d1]">Status
          <select value={perk.status} onChange={(event) => onUpdatePerk(perk.id, { status: event.target.value as SkillbookPerk['status'] })} className="mt-1 w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-2 py-1.5 text-sm text-[#f7edf5]"><option value="integriert">Integriert</option><option value="bereit">Bereit</option><option value="wird-geprueft">Wird geprüft</option><option value="geplant">Geplant</option><option value="gesperrt">Gesperrt</option></select>
        </label>
        <label className="text-xs text-[#cab7d1]">Stufe
          <input type="number" min={1} value={perk.stufe} onChange={(event) => onUpdatePerk(perk.id, { stufe: Number(event.target.value) || 1 })} className="mt-1 w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-2 py-1.5 text-sm text-[#f7edf5]" />
        </label>
      </div>

      <section className="mt-4 space-y-3 text-sm">
        <label className="block text-xs text-[#cab7d1]">Kurzbeschreibung
          <textarea value={perk.kurzbeschreibung} onChange={(event) => onUpdatePerk(perk.id, { kurzbeschreibung: event.target.value })} className="mt-1 min-h-[70px] w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-3 py-2 text-sm text-[#f7edf5]" />
        </label>
        <label className="block text-xs text-[#cab7d1]">Warum wichtig
          <textarea value={perk.warumWichtig} onChange={(event) => onUpdatePerk(perk.id, { warumWichtig: event.target.value })} className="mt-1 min-h-[70px] w-full rounded-xl border border-[#3d2b42]/80 bg-[#140a18] px-3 py-2 text-sm text-[#f7edf5]" />
        </label>

        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Verbindungen</h4>
          <ul className="mt-1 space-y-1 text-[#ebdced]">{perk.voraussetzungen.length === 0 ? <li>Keine Verbindungen</li> : perk.voraussetzungen.map((id) => <li key={id}>• {resolveName(id)}</li>)}</ul>
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Nutzen</div>
          <Zeilenliste value={perk.nutzen} onChange={(next) => onUpdatePerk(perk.id, { nutzen: next })} />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Risiken</div>
          <Zeilenliste value={perk.risiken} onChange={(next) => onUpdatePerk(perk.id, { risiken: next })} />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Nächster Schritt</div>
          <Zeilenliste value={perk.naechsteForschung} onChange={(next) => onUpdatePerk(perk.id, { naechsteForschung: next })} />
        </div>

        {(perk.questId || perk.questTitle || perk.questGroupId || perk.questStatus || perk.source || perk.nextStep) ? (
          <section className="mt-5 space-y-2 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-3">
            <h4 className="text-xs font-black uppercase tracking-[0.14em] text-amber-200/80">Quest-Verknüpfung</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm text-[#f0e1d9] sm:grid-cols-2">
              {perk.questTitle || perk.questId ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-[#caa590]">Verknüpfte Quest</dt>
                  <dd className="mt-0.5 font-semibold">{perk.questTitle ?? perk.questId}</dd>
                </div>
              ) : null}
              {perk.questGroupId ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-[#caa590]">Quest-Reihe</dt>
                  <dd className="mt-0.5 font-semibold">{perk.questGroupId}</dd>
                </div>
              ) : null}
              {perk.questStatus ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-[#caa590]">Status</dt>
                  <dd className="mt-0.5 font-semibold">{perk.questStatus}</dd>
                </div>
              ) : null}
              {perk.source ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-[#caa590]">Quelle</dt>
                  <dd className="mt-0.5 font-semibold">{perk.source}</dd>
                </div>
              ) : null}
              {perk.nextStep ? (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-[#caa590]">Nächster Schritt</dt>
                  <dd className="mt-0.5 font-semibold">{perk.nextStep}</dd>
                </div>
              ) : null}
            </dl>
            <button
              type="button"
              disabled
              title="Phase 2 – Quest-Routing wird separat implementiert."
              className="mt-2 inline-flex cursor-not-allowed items-center rounded-xl border border-amber-300/30 bg-amber-300/5 px-3 py-1.5 text-xs font-bold text-amber-200/60"
            >
              Quest öffnen – Phase 2
            </button>
          </section>
        ) : null}
      </section>

      <section className="mt-5 space-y-2">
        <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Auswirkungen</h4>
        <Wirkung label="Mehr Geschwindigkeit" value={perk.auswirkungen.geschwindigkeit} />
        <Wirkung label="Bessere Qualität" value={perk.auswirkungen.qualitaet} />
        <Wirkung label="Weniger Kosten" value={perk.auswirkungen.kostenersparnis} />
        <Wirkung label="Mehr Autonomie" value={perk.auswirkungen.autonomie} />
        <Wirkung label="Mehr Sicherheit" value={perk.auswirkungen.sicherheit} />
        <Wirkung label="Weniger Risiko" value={perk.auswirkungen.risiko} invert />
        <Wirkung label="Weniger Wartungsaufwand" value={perk.auswirkungen.wartungsaufwand} invert />
      </section>

      <div className="sticky bottom-0 mt-5 grid grid-cols-2 gap-2 border-t border-[#32243a] bg-[#100813]/95 pt-4">
        <button type="button" onClick={() => onToast('Lokal gespeichert')} className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100">{statusLabel[perk.status]}</button>
        <button
          type="button"
          onClick={() =>
            onAufgabenEntwurf
              ? onAufgabenEntwurf()
              : onToast('Aufgabenentwurf lokal vorbereitet – noch nicht gespeichert.')
          }
          className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100"
        >
          Aufgabenentwurf erzeugen
        </button>
      </div>
    </aside>
  );
}
