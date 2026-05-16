import { useEffect, useMemo, useState } from 'react';
import SkillbookCanvas from './SkillbookCanvas';
import SkillbookCardView from './SkillbookCardView';
import SkillbookDetailPanel from './SkillbookDetailPanel';
import { skillbookPerks } from '../../data/skillbookData';
import type { SkillbookPerk } from '../../types/skillbook';
import type { SketchElement } from './SkillbookCanvas';

type Ansicht = 'baum' | 'karten';

type SkillbookSpeicher = {
  perks: SkillbookPerk[];
  sketchElements: SketchElement[];
};

const SPEICHER_KEY = 'nox.skillbook.v1';

function ladeLokalenZustand(): SkillbookSpeicher {
  if (typeof window === 'undefined') return { perks: skillbookPerks, sketchElements: [] };
  try {
    const roh = window.localStorage.getItem(SPEICHER_KEY);
    if (!roh) return { perks: skillbookPerks, sketchElements: [] };
    const parsed = JSON.parse(roh) as SkillbookSpeicher;
    return {
      perks: Array.isArray(parsed.perks) && parsed.perks.length > 0 ? parsed.perks : skillbookPerks,
      sketchElements: Array.isArray(parsed.sketchElements) ? parsed.sketchElements : [],
    };
  } catch {
    return { perks: skillbookPerks, sketchElements: [] };
  }
}

function speichereLokalenZustand(payload: SkillbookSpeicher) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SPEICHER_KEY, JSON.stringify(payload));
}

function neuerPerkTemplate(position: { x: number; y: number }, voraussetzungen: string[] = []): SkillbookPerk {
  return {
    id: `perk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: 'Neuer Perk',
    kategorie: 'Systemkern',
    kapitel: 'Kapitel I',
    status: 'geplant',
    stufe: 1,
    prioritaet: 'Mittel',
    schwierigkeit: 'Mittel',
    voraussetzungen,
    kurzbeschreibung: 'Noch nicht beschrieben.',
    warumWichtig: 'Noch nicht definiert.',
    freischaltBedingungen: ['Noch offen'],
    nachFreischaltung: ['Noch offen'],
    nutzen: ['Noch offen'],
    risiken: ['Noch offen'],
    naechsteForschung: ['Ausarbeiten.'],
    quelle: 'Lokal erzeugt',
    auswirkungen: {
      geschwindigkeit: 50,
      qualitaet: 50,
      kostenersparnis: 50,
      autonomie: 50,
      sicherheit: 50,
      risiko: 50,
      wartungsaufwand: 50,
    },
    position,
  };
}

export default function SkillbookPanel() {
  const initial = useMemo(() => ladeLokalenZustand(), []);
  const [perks, setPerks] = useState<SkillbookPerk[]>(initial.perks);
  const [sketchElements, setSketchElements] = useState<SketchElement[]>(initial.sketchElements);
  const [ausgewaehlterPerkId, setAusgewaehlterPerkId] = useState(initial.perks[0]?.id ?? '');
  const [ausgewaehlteSkizzeId, setAusgewaehlteSkizzeId] = useState<string | null>(null);
  const [ansicht, setAnsicht] = useState<Ansicht>('baum');
  const [suche, setSuche] = useState('');
  const [meldung, setMeldung] = useState('');
  const [vollbild, setVollbild] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)');
    const sync = () => setAnsicht(media.matches ? 'karten' : 'baum');
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVollbild(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const gefiltertePerks = useMemo(() => {
    const term = suche.trim().toLowerCase();
    if (!term) return perks;
    return perks.filter((perk) => [perk.name, perk.kategorie, perk.kapitel, perk.kurzbeschreibung].join(' ').toLowerCase().includes(term));
  }, [suche, perks]);

  const ausgewaehlterPerk = useMemo(() => perks.find((perk) => perk.id === ausgewaehlterPerkId) ?? null, [ausgewaehlterPerkId, perks]);

  const statusAnzahl = useMemo(() => {
    const count = { integriert: 0, bereit: 0, wirdGeprueft: 0, geplant: 0, gesperrt: 0 };
    for (const perk of perks) {
      if (perk.status === 'integriert') count.integriert += 1;
      if (perk.status === 'bereit') count.bereit += 1;
      if (perk.status === 'wird-geprueft') count.wirdGeprueft += 1;
      if (perk.status === 'geplant') count.geplant += 1;
      if (perk.status === 'gesperrt') count.gesperrt += 1;
    }
    return count;
  }, [perks]);

  const lokalSpeichern = () => {
    speichereLokalenZustand({ perks, sketchElements });
    setMeldung('Lokal gespeichert.');
  };

  const lokalZuruecksetzen = () => {
    if (!window.confirm('Lokale Skillbook-Änderungen wirklich löschen?')) return;
    setPerks(skillbookPerks);
    setSketchElements([]);
    setAusgewaehlterPerkId(skillbookPerks[0]?.id ?? '');
    setAusgewaehlteSkizzeId(null);
    window.localStorage.removeItem(SPEICHER_KEY);
    setMeldung('Lokale Änderungen zurückgesetzt.');
  };

  const neuerPerk = () => {
    const last = perks[perks.length - 1];
    const position = last ? { x: last.position.x + 280, y: last.position.y } : { x: 100, y: 120 };
    const perk = neuerPerkTemplate(position);
    setPerks((current) => [...current, perk]);
    setAusgewaehlterPerkId(perk.id);
    setAusgewaehlteSkizzeId(null);
    setMeldung('Neuer Perk lokal erstellt.');
  };

  const verbundenerPerk = () => {
    if (!ausgewaehlterPerk) return;
    const perk = neuerPerkTemplate({ x: ausgewaehlterPerk.position.x + 280, y: ausgewaehlterPerk.position.y + 40 }, [ausgewaehlterPerk.id]);
    setPerks((current) => [...current, perk]);
    setAusgewaehlterPerkId(perk.id);
    setAusgewaehlteSkizzeId(null);
    setMeldung('Verbundener Perk erstellt – Voraussetzung automatisch gesetzt.');
  };

  const alsPerkUebernehmen = () => {
    if (!ausgewaehlteSkizzeId) return;
    const skizze = sketchElements.find((element) => element.id === ausgewaehlteSkizzeId);
    const x = typeof skizze?.x === 'number' ? skizze.x : 100;
    const y = typeof skizze?.y === 'number' ? skizze.y : 100;
    const perk = neuerPerkTemplate({ x, y });
    setPerks((current) => [...current, perk]);
    setAusgewaehlterPerkId(perk.id);
    setAusgewaehlteSkizzeId(null);
    setMeldung('Skizze als Perk übernommen.');
  };

  const updatePerk = (perkId: string, patch: Partial<SkillbookPerk>) => {
    setPerks((current) => current.map((perk) => (perk.id === perkId ? { ...perk, ...patch } : perk)));
    setMeldung('Lokal gespeichert');
  };

  const containerClass = vollbild
    ? 'fixed inset-0 z-[120] overflow-auto bg-[#05030a] p-4 md:p-6'
    : 'space-y-5 rounded-[1.4rem] border border-[#4a101b]/55 bg-[#080407]/90 p-5 md:p-6';

  return (
    <section className={containerClass}>
      <header className="space-y-2">
        <h2 className="text-2xl font-black text-[#fff6fc] md:text-3xl">NOX Skillbook</h2>
        <p className="text-sm text-[#ceb7d2]">Forschungsbuch für Systemfähigkeiten, Agenten und Automatisierungen</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={neuerPerk} className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100">+ Neuen Perk</button>
        <button type="button" onClick={verbundenerPerk} disabled={!ausgewaehlterPerk} className="rounded-xl border border-violet-300/40 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-100 disabled:opacity-50">+ Verbundenen Perk</button>
        <button type="button" onClick={lokalSpeichern} className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100">Lokal speichern</button>
        <button type="button" onClick={lokalZuruecksetzen} className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">Lokale Änderungen zurücksetzen</button>
        <button type="button" onClick={() => setVollbild((current) => !current)} className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">{vollbild ? 'Vollbild verlassen' : 'Vollbild'}</button>
      </div>

      {meldung ? (
        <button type="button" onClick={() => setMeldung('')} className="w-full rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-left text-sm font-semibold text-amber-50">
          {meldung}
        </button>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">Integriert: <span className="font-black">{statusAnzahl.integriert}</span></div>
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">Bereit: <span className="font-black">{statusAnzahl.bereit}</span></div>
        <div className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-sm text-violet-100">Wird geprüft: <span className="font-black">{statusAnzahl.wirdGeprueft}</span></div>
        <div className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">Geplant: <span className="font-black">{statusAnzahl.geplant}</span></div>
        <div className="rounded-xl border border-slate-400/30 bg-slate-600/10 px-3 py-2 text-sm text-slate-200">Gesperrt: <span className="font-black">{statusAnzahl.gesperrt}</span></div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="block lg:w-[360px]">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-[#bca8c3]">Perk suchen</span>
          <input value={suche} onChange={(event) => setSuche(event.target.value)} placeholder="Name, Kategorie oder Kapitel" className="w-full rounded-xl border border-[#3a2a41] bg-[#120916] px-3 py-2 text-sm text-[#f6ecf5] outline-none transition focus:border-cyan-300/60" />
        </label>

        <div className="inline-flex rounded-xl border border-[#3a2a41] bg-[#120916] p-1">
          <button type="button" onClick={() => setAnsicht('baum')} className={['rounded-lg px-3 py-2 text-sm font-bold transition', ansicht === 'baum' ? 'bg-cyan-400/20 text-cyan-100' : 'text-[#c9b4d0]'].join(' ')}>Forschungsbaum</button>
          <button type="button" onClick={() => setAnsicht('karten')} className={['rounded-lg px-3 py-2 text-sm font-bold transition', ansicht === 'karten' ? 'bg-cyan-400/20 text-cyan-100' : 'text-[#c9b4d0]'].join(' ')}>Kartenansicht</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          {ansicht === 'baum' ? (
            <SkillbookCanvas
              perks={gefiltertePerks}
              sketchElements={sketchElements}
              selectedPerkId={ausgewaehlterPerk?.id ?? ''}
              onSelectPerk={setAusgewaehlterPerkId}
              onSelectSkizze={setAusgewaehlteSkizzeId}
              onSketchElementsChange={setSketchElements}
            />
          ) : (
            <SkillbookCardView perks={gefiltertePerks} selectedPerkId={ausgewaehlterPerk?.id ?? ''} onSelectPerk={(id) => { setAusgewaehlterPerkId(id); setAusgewaehlteSkizzeId(null); }} />
          )}
        </div>

        <SkillbookDetailPanel
          perk={ausgewaehlteSkizzeId ? null : ausgewaehlterPerk}
          skizzenHinweis={Boolean(ausgewaehlteSkizzeId)}
          resolveName={(perkId) => perks.find((perk) => perk.id === perkId)?.name ?? perkId}
          onUpdatePerk={updatePerk}
          onToast={setMeldung}
          onAlsPerkUebernehmen={alsPerkUebernehmen}
        />
      </div>
    </section>
  );
}
