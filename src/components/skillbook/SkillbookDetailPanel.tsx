import type { SkillbookPerk } from '../../types/skillbook';
import { statusLabel } from '../../data/skillbookData';

type SkillbookDetailPanelProps = {
  perk: SkillbookPerk;
  resolveName: (perkId: string) => string;
  onToast: (message: string) => void;
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

export default function SkillbookDetailPanel({ perk, resolveName, onToast }: SkillbookDetailPanelProps) {
  return (
    <aside className="max-h-[620px] overflow-y-auto rounded-3xl border border-[#35243d] bg-[#100813]/95 p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[#9f89a7]">NOX Skillbook</div>
      <h3 className="mt-1 text-xl font-black text-[#fff5fc]">{perk.name}</h3>
      <p className="mt-1 text-xs text-[#bca8c4]">{perk.kategorie} • {perk.kapitel}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">{statusLabel[perk.status]}</span>
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Stufe {perk.stufe}</span>
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Priorität: {perk.prioritaet}</span>
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Schwierigkeit: {perk.schwierigkeit}</span>
      </div>

      <section className="mt-4 space-y-3 text-sm">
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Kurzbeschreibung</h4>
          <p className="mt-1 text-[#ebdced]">{perk.kurzbeschreibung}</p>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Warum wichtig</h4>
          <p className="mt-1 text-[#ebdced]">{perk.warumWichtig}</p>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Voraussetzungen</h4>
          <ul className="mt-1 space-y-1 text-[#ebdced]">
            {perk.voraussetzungen.length === 0 ? <li>Keine Voraussetzungen</li> : perk.voraussetzungen.map((id) => <li key={id}>• {resolveName(id)}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Nutzen und Risiken</h4>
          <div className="mt-1 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold text-emerald-200">Nutzen</div>
              <ul className="mt-1 space-y-1 text-[#ebdced]">{perk.nutzen.map((entry) => <li key={entry}>• {entry}</li>)}</ul>
            </div>
            <div>
              <div className="text-xs font-bold text-rose-200">Risiken</div>
              <ul className="mt-1 space-y-1 text-[#ebdced]">{perk.risiken.map((entry) => <li key={entry}>• {entry}</li>)}</ul>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#b79bc3]">Freischaltung und nächste Forschung</h4>
          <div className="mt-1 grid gap-3 md:grid-cols-2">
            <ul className="space-y-1 text-[#ebdced]">{perk.freischaltBedingungen.map((entry) => <li key={entry}>• {entry}</li>)}</ul>
            <ul className="space-y-1 text-[#ebdced]">{perk.naechsteForschung.map((entry) => <li key={entry}>• {entry}</li>)}</ul>
          </div>
        </div>
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
        <button type="button" onClick={() => onToast('Freischaltung vorbereitet (lokale Vorschau).')} className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100">Freischaltung vorbereiten</button>
        <button type="button" onClick={() => onToast('Aufgabenvorschlag vorbereitet – spätere Notion-Anbindung geplant.')} className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">Aufgabe erzeugen</button>
        <button type="button" onClick={() => onToast('Perk als integriert markiert (lokale Vorschau).')} className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100">Als integriert markieren</button>
        <button type="button" onClick={() => onToast('Perk für spätere Prüfung vorgemerkt.')} className="rounded-xl border border-violet-300/40 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-100">Später prüfen</button>
      </div>
    </aside>
  );
}
