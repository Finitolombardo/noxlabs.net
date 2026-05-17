import { useEffect, useMemo, useState } from 'react';
import SkillbookCanvas from './SkillbookCanvas';
import SkillbookCardView from './SkillbookCardView';
import SkillbookDetailPanel from './SkillbookDetailPanel';
import { skillbookPerks } from '../../data/skillbookData';
import type { SkillbookKategorie, SkillbookPerk } from '../../types/skillbook';
import type { SketchElement } from './SkillbookCanvas';

type PanelMode = 'faehigkeiten' | 'whiteboard';

type SkillbookPanelProps = {
  mode?: PanelMode;
};

type SkillbookSpeicher = {
  perks: SkillbookPerk[];
  sketchElements: SketchElement[];
};

// localStorage key is intentionally unchanged (no migration in this
// quest). The same blob is shared between Faehigkeitskarte (perks slice)
// and Whiteboard (sketchElements slice).
const SPEICHER_KEY = 'nox.skillbook.v1';

// Filter options for the Faehigkeitskarte category strip. The Alle
// option resets the filter; every other value matches a
// SkillbookKategorie exactly. Display labels can drift from the
// internal kategorie strings (e.g. "Notion / Wissen" label vs
// "Notion & Wissen" data key) without breaking the filter.
type CategoryFilter = 'Alle' | SkillbookKategorie;
const categoryFilters: ReadonlyArray<{ key: CategoryFilter; label: string }> = [
  { key: 'Alle', label: 'Alle' },
  { key: 'Systemkern', label: 'Systemkern' },
  { key: 'Agentensteuerung', label: 'Agentensteuerung' },
  { key: 'Sicherheit', label: 'Sicherheit' },
  { key: 'Lernen & Verbesserung', label: 'Lernen & Verbesserung' },
  { key: 'Automatisierung / n8n', label: 'Automatisierung / n8n' },
  { key: 'Notion & Wissen', label: 'Notion / Wissen' },
  { key: 'Recherche & Nachrichten', label: 'Recherche / News' },
  { key: 'YouTube & Content', label: 'YouTube / Content' },
  { key: 'Leadgen & Sales', label: 'Leadgen / Sales' },
  { key: 'Trading-Forschung', label: 'Trading' },
  { key: 'UI & Produkt', label: 'UI / Produkt' },
  { key: 'Kostenoptimierung', label: 'Kostenoptimierung' },
];

type AufgabenEntwurf = {
  perkId: string;
  titel: string;
  kategorie: string;
  ziel: string;
  warum: string;
  nutzen: string[];
  risiko: string[];
  aufwand: string;
  agent: 'NOX Agent' | 'Claude' | 'Codex';
  status: 'Entwurf';
  prompt: string;
};

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
    name: 'Neue Faehigkeit',
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

function aufwandsHinweis(perk: SkillbookPerk): string {
  if (perk.schwierigkeit === 'Leicht') return 'Klein – einzelne Iteration';
  if (perk.schwierigkeit === 'Hoch') return 'Hoch – mehrere Quests, Reviews erforderlich';
  return 'Mittel – ein bis zwei Quests';
}

function vorgeschlagenerAgent(perk: SkillbookPerk): AufgabenEntwurf['agent'] {
  if (perk.kategorie === 'Systemkern' || perk.kategorie === 'Agentensteuerung') return 'NOX Agent';
  if (perk.kategorie === 'UI & Produkt' || perk.kategorie === 'YouTube & Content') return 'Claude';
  return 'Codex';
}

function buildAufgabenEntwurf(perk: SkillbookPerk): AufgabenEntwurf {
  const ziel = perk.kurzbeschreibung || 'Ziel ausarbeiten.';
  const warum = perk.warumWichtig || 'Bedeutung ausarbeiten.';
  const nutzen = perk.nutzen.length > 0 ? perk.nutzen : ['Noch offen'];
  const risiko = perk.risiken.length > 0 ? perk.risiken : ['Noch offen'];
  const aufwand = aufwandsHinweis(perk);
  const agent = vorgeschlagenerAgent(perk);

  const prompt = [
    `# Aufgabenentwurf · ${perk.name}`,
    `Kategorie: ${perk.kategorie}`,
    `Quelle: Faehigkeitskarte`,
    `Vorgeschlagener Agent: ${agent}`,
    '',
    `## Ziel`,
    ziel,
    '',
    `## Warum relevant?`,
    warum,
    '',
    `## Nutzen`,
    ...nutzen.map((entry) => `- ${entry}`),
    '',
    `## Risiken`,
    ...risiko.map((entry) => `- ${entry}`),
    '',
    `## Aufwand`,
    aufwand,
    '',
    `## Status`,
    'Entwurf – lokal vorbereitet, noch nicht gespeichert.',
  ].join('\n');

  return {
    perkId: perk.id,
    titel: perk.name,
    kategorie: perk.kategorie,
    ziel,
    warum,
    nutzen,
    risiko,
    aufwand,
    agent,
    status: 'Entwurf',
    prompt,
  };
}

export default function SkillbookPanel({ mode = 'faehigkeiten' }: SkillbookPanelProps) {
  const initial = useMemo(() => ladeLokalenZustand(), []);
  const [perks, setPerks] = useState<SkillbookPerk[]>(initial.perks);
  const [sketchElements, setSketchElements] = useState<SketchElement[]>(initial.sketchElements);
  const [ausgewaehlterPerkId, setAusgewaehlterPerkId] = useState(initial.perks[0]?.id ?? '');
  const [suche, setSuche] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<CategoryFilter>('Alle');
  const [meldung, setMeldung] = useState('');
  const [vollbild, setVollbild] = useState(false);
  const [aufgabenEntwurf, setAufgabenEntwurf] = useState<AufgabenEntwurf | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVollbild(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const gefiltertePerks = useMemo(() => {
    const term = suche.trim().toLowerCase();
    return perks.filter((perk) => {
      const matchesKategorie = kategorieFilter === 'Alle' ? true : perk.kategorie === kategorieFilter;
      if (!matchesKategorie) return false;
      if (!term) return true;
      return [perk.name, perk.kategorie, perk.kapitel, perk.kurzbeschreibung].join(' ').toLowerCase().includes(term);
    });
  }, [suche, kategorieFilter, perks]);

  const ausgewaehlterPerk = useMemo(
    () => perks.find((perk) => perk.id === ausgewaehlterPerkId) ?? null,
    [ausgewaehlterPerkId, perks],
  );

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
    const confirmText =
      mode === 'whiteboard'
        ? 'Whiteboard-Skizzen wirklich löschen?'
        : 'Lokale Änderungen an der Fähigkeitskarte wirklich löschen?';
    if (!window.confirm(confirmText)) return;
    setPerks(skillbookPerks);
    setSketchElements([]);
    setAusgewaehlterPerkId(skillbookPerks[0]?.id ?? '');
    setAufgabenEntwurf(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SPEICHER_KEY);
    }
    setMeldung('Lokale Änderungen zurückgesetzt.');
  };

  const neueKarte = () => {
    const last = perks[perks.length - 1];
    const position = last ? { x: last.position.x + 280, y: last.position.y } : { x: 100, y: 120 };
    const perk = neuerPerkTemplate(position);
    setPerks((current) => [...current, perk]);
    setAusgewaehlterPerkId(perk.id);
    setMeldung('Neue Fähigkeit lokal angelegt.');
  };

  const updatePerk = (perkId: string, patch: Partial<SkillbookPerk>) => {
    setPerks((current) => current.map((perk) => (perk.id === perkId ? { ...perk, ...patch } : perk)));
    setMeldung('Lokal gespeichert');
  };

  const aufgabenEntwurfErzeugen = () => {
    if (!ausgewaehlterPerk) return;
    const entwurf = buildAufgabenEntwurf(ausgewaehlterPerk);
    setAufgabenEntwurf(entwurf);
    setMeldung('Aufgabenentwurf lokal vorbereitet – noch nicht gespeichert.');
  };

  const promptKopieren = async () => {
    if (!aufgabenEntwurf) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(aufgabenEntwurf.prompt);
        setMeldung('Prompt in die Zwischenablage kopiert.');
        return;
      }
    } catch {
      // fall through to fallback toast
    }
    setMeldung('Zwischenablage nicht verfügbar – Prompt-Text manuell markieren.');
  };

  const containerClass = vollbild
    ? 'fixed inset-0 z-[120] overflow-auto bg-[#05030a] p-4 md:p-6'
    : 'space-y-5 rounded-[1.4rem] border border-[#4a101b]/55 bg-[#080407]/90 p-5 md:p-6';

  if (mode === 'whiteboard') {
    return (
      <section className={containerClass}>
        <header className="space-y-2">
          <h2 className="text-2xl font-black text-[#fff6fc] md:text-3xl">NOX Whiteboard</h2>
          <p className="text-sm text-[#ceb7d2]">Freies Whiteboard für Skizzen, Systemdenken und Planung.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={lokalSpeichern}
            className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100"
          >
            Lokal speichern
          </button>
          <button
            type="button"
            onClick={lokalZuruecksetzen}
            className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100"
          >
            Lokale Änderungen zurücksetzen
          </button>
          <button
            type="button"
            onClick={() => setVollbild((current) => !current)}
            className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100"
          >
            {vollbild ? 'Vollbild verlassen' : 'Vollbild'}
          </button>
        </div>

        {meldung ? (
          <button
            type="button"
            onClick={() => setMeldung('')}
            className="w-full rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-left text-sm font-semibold text-amber-50"
          >
            {meldung}
          </button>
        ) : null}

        <div className="rounded-2xl border border-[#2a1830] bg-[#0a0510]">
          <SkillbookCanvas
            perks={[]}
            sketchElements={sketchElements}
            selectedPerkId=""
            onSelectPerk={() => undefined}
            onSelectSkizze={() => undefined}
            onSketchElementsChange={setSketchElements}
          />
        </div>

        <p className="text-xs text-[#8e7895]">
          Hinweis: Das Whiteboard ist absichtlich frei. Keine Karten, keine Quest-Erzeugung, keine Detailpanel-Pflicht. Strukturierte Fähigkeiten findest du im Modul „Fähigkeitskarte".
        </p>
      </section>
    );
  }

  // mode === 'faehigkeiten'
  return (
    <section className={containerClass}>
      <header className="space-y-2">
        <h2 className="text-2xl font-black text-[#fff6fc] md:text-3xl">Fähigkeitskarte</h2>
        <p className="text-sm text-[#ceb7d2]">
          Strukturierte Übersicht über NOX-Fähigkeiten, Upgrades und prüfbare Verbesserungen.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={neueKarte}
          className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100"
        >
          + Neue Karte
        </button>
        <button
          type="button"
          onClick={lokalSpeichern}
          className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100"
        >
          Lokal speichern
        </button>
        <button
          type="button"
          onClick={lokalZuruecksetzen}
          className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100"
        >
          Lokale Änderungen zurücksetzen
        </button>
      </div>

      {meldung ? (
        <button
          type="button"
          onClick={() => setMeldung('')}
          className="w-full rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-left text-sm font-semibold text-amber-50"
        >
          {meldung}
        </button>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          Integriert: <span className="font-black">{statusAnzahl.integriert}</span>
        </div>
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          Bereit: <span className="font-black">{statusAnzahl.bereit}</span>
        </div>
        <div className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-sm text-violet-100">
          Wird geprüft: <span className="font-black">{statusAnzahl.wirdGeprueft}</span>
        </div>
        <div className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
          Geplant: <span className="font-black">{statusAnzahl.geplant}</span>
        </div>
        <div className="rounded-xl border border-slate-400/30 bg-slate-600/10 px-3 py-2 text-sm text-slate-200">
          Gesperrt: <span className="font-black">{statusAnzahl.gesperrt}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="block lg:w-[360px]">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-[#bca8c3]">Fähigkeit suchen</span>
          <input
            value={suche}
            onChange={(event) => setSuche(event.target.value)}
            placeholder="Name, Kategorie oder Kapitel"
            className="w-full rounded-xl border border-[#3a2a41] bg-[#120916] px-3 py-2 text-sm text-[#f6ecf5] outline-none transition focus:border-cyan-300/60"
          />
        </label>
        <div className="text-xs text-[#9b85a4]">
          {gefiltertePerks.length} / {perks.length} sichtbar
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryFilters.map((filter) => {
          const active = kategorieFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setKategorieFilter(filter.key)}
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                active
                  ? 'border-cyan-300/70 bg-cyan-400/15 text-cyan-100'
                  : 'border-[#3a2a41] bg-[#120916] text-[#c9b4d0] hover:border-[#6d4a7b]',
              ].join(' ')}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SkillbookCardView
          perks={gefiltertePerks}
          selectedPerkId={ausgewaehlterPerk?.id ?? ''}
          onSelectPerk={(id) => {
            setAusgewaehlterPerkId(id);
          }}
        />

        <SkillbookDetailPanel
          perk={ausgewaehlterPerk}
          skizzenHinweis={false}
          resolveName={(perkId) => perks.find((perk) => perk.id === perkId)?.name ?? perkId}
          onUpdatePerk={updatePerk}
          onToast={setMeldung}
          onAlsPerkUebernehmen={() => undefined}
          onAufgabenEntwurf={aufgabenEntwurfErzeugen}
        />
      </div>

      {aufgabenEntwurf ? (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/80">Aufgabenentwurf · lokal</div>
              <h3 className="mt-1 text-lg font-black text-[#fff5fc]">{aufgabenEntwurf.titel}</h3>
              <p className="mt-1 text-xs text-[#cbb9d1]">
                Kategorie {aufgabenEntwurf.kategorie} · Quelle Fähigkeitskarte · Status {aufgabenEntwurf.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={promptKopieren}
                className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100"
              >
                Prompt kopieren
              </button>
              <button
                type="button"
                onClick={() => setAufgabenEntwurf(null)}
                className="rounded-xl border border-[#3a2a41] bg-[#120916] px-3 py-2 text-xs font-bold text-[#c9b4d0]"
              >
                Entwurf schliessen
              </button>
            </div>
          </header>

          <dl className="mt-4 grid gap-3 text-sm text-[#ebdced] md:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Ziel</dt>
              <dd className="mt-0.5">{aufgabenEntwurf.ziel}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Warum relevant?</dt>
              <dd className="mt-0.5">{aufgabenEntwurf.warum}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Nutzen</dt>
              <dd className="mt-0.5">
                <ul className="list-disc pl-4">
                  {aufgabenEntwurf.nutzen.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Risiken</dt>
              <dd className="mt-0.5">
                <ul className="list-disc pl-4">
                  {aufgabenEntwurf.risiko.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Aufwand</dt>
              <dd className="mt-0.5">{aufgabenEntwurf.aufwand}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">Vorgeschlagener Agent</dt>
              <dd className="mt-0.5">{aufgabenEntwurf.agent}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-[#9b85a4]">
            Phase 1: nur lokaler Entwurf. Kein API-Call, kein Notion-Write, kein Quest-Start, kein Dispatcher.
          </p>
        </section>
      ) : null}
    </section>
  );
}
