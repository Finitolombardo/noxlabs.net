import { useEffect, useMemo, useState } from 'react';
import SkillbookCanvas from './SkillbookCanvas';
import SkillbookCardView from './SkillbookCardView';
import SkillbookDetailPanel from './SkillbookDetailPanel';
import { skillbookPerks } from '../../data/skillbookData';

type Ansicht = 'baum' | 'karten';

export default function SkillbookPanel() {
  const [ausgewaehlterPerkId, setAusgewaehlterPerkId] = useState(skillbookPerks[0]?.id ?? '');
  const [ansicht, setAnsicht] = useState<Ansicht>('baum');
  const [suche, setSuche] = useState('');
  const [meldung, setMeldung] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)');
    const sync = () => setAnsicht(media.matches ? 'karten' : 'baum');
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const gefiltertePerks = useMemo(() => {
    const term = suche.trim().toLowerCase();
    if (!term) return skillbookPerks;
    return skillbookPerks.filter((perk) => [perk.name, perk.kategorie, perk.kapitel, perk.kurzbeschreibung].join(' ').toLowerCase().includes(term));
  }, [suche]);

  const ausgewaehlterPerk = useMemo(
    () => skillbookPerks.find((perk) => perk.id === ausgewaehlterPerkId) ?? skillbookPerks[0],
    [ausgewaehlterPerkId],
  );

  const statusAnzahl = useMemo(() => {
    const count = { integriert: 0, bereit: 0, wirdGeprueft: 0, geplant: 0, gesperrt: 0 };
    for (const perk of skillbookPerks) {
      if (perk.status === 'integriert') count.integriert += 1;
      if (perk.status === 'bereit') count.bereit += 1;
      if (perk.status === 'wird-geprueft') count.wirdGeprueft += 1;
      if (perk.status === 'geplant') count.geplant += 1;
      if (perk.status === 'gesperrt') count.gesperrt += 1;
    }
    return count;
  }, []);

  return (
    <section className="space-y-5 rounded-[1.4rem] border border-[#4a101b]/55 bg-[#080407]/90 p-5 md:p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-black text-[#fff6fc] md:text-3xl">NOX Skillbook</h2>
        <p className="text-sm text-[#ceb7d2]">Forschungsbuch für Systemfähigkeiten, Agenten und Automatisierungen</p>
      </header>

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {ansicht === 'baum' ? (
            <SkillbookCanvas perks={gefiltertePerks} selectedPerkId={ausgewaehlterPerk?.id ?? ''} onSelectPerk={setAusgewaehlterPerkId} />
          ) : (
            <SkillbookCardView perks={gefiltertePerks} selectedPerkId={ausgewaehlterPerk?.id ?? ''} onSelectPerk={setAusgewaehlterPerkId} />
          )}
        </div>

        {ausgewaehlterPerk ? (
          <SkillbookDetailPanel
            perk={ausgewaehlterPerk}
            resolveName={(perkId) => skillbookPerks.find((perk) => perk.id === perkId)?.name ?? perkId}
            onToast={setMeldung}
          />
        ) : null}
      </div>
    </section>
  );
}

