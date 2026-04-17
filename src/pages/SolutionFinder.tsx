import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { routeIntake, type IntakePayload, type RoutingResult } from '../lib/solutionFinderRouting';

// ============================================================
// NOX Labs - Solution Finder
// Multi-Step Guided Intake (kein Chat, kein generisches Form)
// Drop-in: src/pages/SolutionFinder.tsx
// Route hinzufuegen in App.tsx: <Route path="/solution-finder" element={<SolutionFinder />} />
// ============================================================

const WEBHOOK_URL = import.meta.env.VITE_SOLUTION_FINDER_WEBHOOK ?? '';

type StepId = 'intro' | 'basics' | 'problem' | 'stack' | 'goals' | 'maturity' | 'notes' | 'success';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'basics', label: 'Grunddaten' },
  { id: 'problem', label: 'Hauptproblem' },
  { id: 'stack', label: 'Aktuelle Lage' },
  { id: 'goals', label: 'Ziel' },
  { id: 'maturity', label: 'Reifegrad' },
  { id: 'notes', label: 'Abschluss' },
];

type FormState = {
  name: string;
  email: string;
  company_name: string;
  website: string;
  industry: string;
  main_problem: '' | 'leads' | 'pitch' | 'reach' | 'multi';
  current_tools: string[];
  crm_status: string;
  outreach_status: string;
  content_status: string;
  team_size: string;
  goals: string[];
  maturity_stage: string;
  additional_notes: string;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  company_name: '',
  website: '',
  industry: '',
  main_problem: '',
  current_tools: [],
  crm_status: '',
  outreach_status: '',
  content_status: '',
  team_size: '',
  goals: [],
  maturity_stage: '',
  additional_notes: '',
};

const MAIN_PROBLEMS = [
  { id: 'leads', title: 'Ich brauche mehr qualifizierte Leads', hint: 'Pipeline, Nachfrage, Termine' },
  { id: 'pitch', title: 'Meine Ansprache / Conversion ist schwach', hint: 'Reply-Rate, Message-Market-Fit' },
  { id: 'reach', title: 'Ich will Reichweite / Content / Authority aufbauen', hint: 'YouTube, Skool, Vertrauen' },
  { id: 'multi', title: 'Ich brauche mehrere Dinge gleichzeitig', hint: 'Kombi aus Lead, Pitch und Reach' },
];

const GOAL_OPTIONS = [
  { id: 'more_meetings', label: 'Mehr Termine' },
  { id: 'reply_rate', label: 'Bessere Reply-Rate' },
  { id: 'pipeline', label: 'Strukturierte Lead-Pipeline' },
  { id: 'content_system', label: 'Content-System' },
  { id: 'authority', label: 'Autoritaet / Reichweite' },
  { id: 'multi_system', label: 'Kombination aus mehreren' },
];

const TOOL_OPTIONS = [
  'Instantly / Smartlead / Lemlist',
  'Apollo / Clay / Sales Navigator',
  'HubSpot / Pipedrive / Attio',
  'Notion / Airtable',
  'Make / n8n / Zapier',
  'OpenAI / Claude / Perplexity',
  'ElevenLabs / Heygen / Runway',
  'Keine Tools, noch manuell',
];

const MATURITY = [
  { id: 'stage_zero', title: 'Noch kein echtes System', hint: 'Alles ad hoc, manuell' },
  { id: 'basic_tools', title: 'Einfache Tools vorhanden', hint: 'Einzelne Bausteine, kein Workflow' },
  { id: 'chaotic_existing_stack', title: 'Bestehende Infrastruktur, aber chaotisch', hint: 'Viel im Einsatz, wenig kontrolliert' },
  { id: 'advanced_needs_optimization', title: 'Bereits fortgeschritten, braucht Optimierung', hint: 'System laeuft, Feintuning gesucht' },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function StepChrome({ step, total, title, subtitle, children }: {
  step: number; total: number; title: string; subtitle?: string; children: React.ReactNode;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-nox-white-muted mb-3">
          <span>Schritt {step} / {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-nox-red/40 via-nox-red to-nox-red/40"
            style={{ boxShadow: '0 0 18px rgba(239, 58, 76, 0.45)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <h2
        className="text-3xl md:text-5xl font-bold text-nox-white mb-3 text-balance"
        style={{ textShadow: '0 0 40px rgba(255, 182, 193, 0.12)' }}
      >
        {title}
      </h2>
      {subtitle && <p className="text-base md:text-lg text-nox-white-muted mb-10 max-w-2xl">{subtitle}</p>}

      <div className="space-y-6">{children}</div>
    </motion.div>
  );
}

function Field({ label, children, error, hint }: {
  label: string; children: React.ReactNode; error?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-nox-white-soft mb-2">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-nox-white-muted mt-2">{hint}</span>}
      {error && <span className="block text-xs text-red-400 mt-2">{error}</span>}
    </label>
  );
}

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-nox-white placeholder-white/30 ' +
  'focus:outline-none focus:border-nox-red/60 focus:bg-black/60 transition-all ' +
  'focus:ring-4 focus:ring-nox-red/10';

function OptionCard({ active, onClick, title, hint }: {
  active: boolean; onClick: () => void; title: string; hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left rounded-xl border p-5 transition-all
        ${active
          ? 'border-nox-red/70 bg-gradient-to-br from-nox-red/10 to-nox-red/[0.02]'
          : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-black/50'}`}
      style={active ? { boxShadow: '0 0 0 1px rgba(239,58,76,0.25), 0 0 40px -10px rgba(239,58,76,0.35)' } : undefined}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0
          ${active ? 'border-nox-red bg-nox-red/20' : 'border-white/20'}`}>
          {active && <Check className="w-3 h-3 text-nox-red" strokeWidth={3} />}
        </div>
        <div>
          <div className="font-semibold text-nox-white">{title}</div>
          {hint && <div className="text-sm text-nox-white-muted mt-1">{hint}</div>}
        </div>
      </div>
    </button>
  );
}

function ChipToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border text-sm transition-all
        ${active
          ? 'border-nox-red/60 bg-nox-red/10 text-nox-white'
          : 'border-white/10 bg-black/30 text-nox-white-muted hover:border-white/25 hover:text-nox-white'}`}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------

export default function SolutionFinder() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [routingPreview, setRoutingPreview] = useState<RoutingResult | null>(null);

  const currentStep = STEPS[stepIndex];
  const total = STEPS.length;

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const { [key as string]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const toggleMulti = useCallback((key: 'current_tools' | 'goals', value: string) => {
    setForm((f) => {
      const set = new Set(f[key]);
      if (set.has(value)) set.delete(value); else set.add(value);
      return { ...f, [key]: Array.from(set) };
    });
  }, []);

  const validateStep = (id: StepId): boolean => {
    const e: Record<string, string> = {};
    if (id === 'basics') {
      if (!form.name.trim()) e.name = 'Name fehlt';
      if (!validateEmail(form.email)) e.email = 'Gueltige E-Mail erforderlich';
      if (!form.company_name.trim()) e.company_name = 'Firmenname fehlt';
      if (!form.industry.trim()) e.industry = 'Branche fehlt';
    }
    if (id === 'problem' && !form.main_problem) e.main_problem = 'Bitte ein Hauptproblem waehlen';
    if (id === 'stack') {
      if (!form.crm_status) e.crm_status = 'Bitte auswaehlen';
      if (!form.outreach_status) e.outreach_status = 'Bitte auswaehlen';
      if (!form.content_status) e.content_status = 'Bitte auswaehlen';
      if (!form.team_size) e.team_size = 'Bitte auswaehlen';
    }
    if (id === 'goals' && form.goals.length === 0) e.goals = 'Mindestens ein Ziel waehlen';
    if (id === 'maturity' && !form.maturity_stage) e.maturity_stage = 'Bitte Reifegrad waehlen';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(currentStep.id)) return;
    if (stepIndex < total - 1) setStepIndex(stepIndex + 1);
    else submit();
  };

  const prev = () => { if (stepIndex > 0) setStepIndex(stepIndex - 1); };

  const payload: IntakePayload = useMemo(() => ({
    ...form,
    source: 'nox_solution_finder',
    submitted_at: new Date().toISOString(),
  }), [form]);

  const submit = async () => {
    setSubmitState('sending');
    const routing = routeIntake(payload);
    setRoutingPreview(routing);
    try {
      if (!WEBHOOK_URL) throw new Error('VITE_SOLUTION_FINDER_WEBHOOK nicht gesetzt');
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, routing }),
      });
      if (!res.ok) throw new Error(`Webhook ${res.status}`);
      setSubmitState('done');
    } catch (err) {
      console.error(err);
      setSubmitState('error');
    }
  };

  // ---- Success State ----
  if (submitState === 'done') {
    return (
      <div className="min-h-screen py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nox-red/10 border border-nox-red/30 mb-8"
                 style={{ boxShadow: '0 0 60px -10px rgba(239,58,76,0.5)' }}>
              <Sparkles className="w-7 h-7 text-nox-red" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-nox-white mb-4">Anfrage eingegangen.</h1>
            <p className="text-lg text-nox-white-muted mb-8">
              Wir pruefen deine Angaben und melden uns mit einem konkreten Setup-Vorschlag.
              {routingPreview?.primary_system && (
                <> Vorlaeufige Einordnung: <span className="text-nox-white">{routingPreview.primary_system_label}</span>.</>
              )}
            </p>
            <a
              href="https://cal.com/nox-labs/intro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-nox-white hover:border-nox-red/50 transition-all"
            >
              Direkt Termin buchen <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block text-xs uppercase tracking-[0.3em] text-nox-red/80 mb-4">
            NOX Labs — Solution Finder
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold text-nox-white mb-4 text-balance"
            style={{ textShadow: '0 0 50px rgba(255, 182, 193, 0.15)' }}
          >
            Finde das System, das du brauchst.
          </h1>
          <p className="text-base md:text-lg text-nox-white-muted max-w-xl mx-auto">
            Sechs Schritte. Keine Floskeln. Am Ende wissen wir, ob Leadgen, Pitch Mutation, YouTube Engine oder eine Kombination dein Setup ist.
          </p>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-nox-red/20 via-transparent to-nox-red/5 opacity-50 blur-sm pointer-events-none" />
          <div className="relative bg-gradient-to-br from-gray-900/70 to-black/80 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <div key={currentStep.id}>
                {currentStep.id === 'basics' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Wer bist du?" subtitle="Nur die Basis. Keine Fangfragen.">
                    <div className="grid md:grid-cols-2 gap-5">
                      <Field label="Name" error={errors.name}>
                        <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Vor- und Nachname" />
                      </Field>
                      <Field label="E-Mail" error={errors.email}>
                        <input type="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@firma.de" />
                      </Field>
                      <Field label="Firmenname" error={errors.company_name}>
                        <input className={inputClass} value={form.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="GmbH, UG, Solo-Brand" />
                      </Field>
                      <Field label="Website (optional)">
                        <input className={inputClass} value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
                      </Field>
                      <Field label="Branche / Business-Typ" error={errors.industry}>
                        <input className={`${inputClass} md:col-span-2`} value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="z.B. B2B Agentur, SaaS, Coaching, E-Commerce" />
                      </Field>
                    </div>
                  </StepChrome>
                )}

                {currentStep.id === 'problem' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Wo brennt es?" subtitle="Eine Auswahl. Die, die am meisten stoert.">
                    <div className="grid gap-3">
                      {MAIN_PROBLEMS.map((p) => (
                        <OptionCard key={p.id} active={form.main_problem === p.id} onClick={() => update('main_problem', p.id as FormState['main_problem'])} title={p.title} hint={p.hint} />
                      ))}
                    </div>
                    {errors.main_problem && <p className="text-xs text-red-400 mt-2">{errors.main_problem}</p>}
                  </StepChrome>
                )}

                {currentStep.id === 'stack' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Was laeuft aktuell?" subtitle="Ehrliche Antworten sparen spaeter Zeit.">
                    <Field label="Welche Tools nutzt du bereits? (mehrfach)">
                      <div className="flex flex-wrap gap-2">
                        {TOOL_OPTIONS.map((t) => (
                          <ChipToggle key={t} active={form.current_tools.includes(t)} onClick={() => toggleMulti('current_tools', t)}>{t}</ChipToggle>
                        ))}
                      </div>
                    </Field>

                    <div className="grid md:grid-cols-2 gap-5">
                      <Field label="Hast du ein CRM?" error={errors.crm_status}>
                        <select className={inputClass} value={form.crm_status} onChange={(e) => update('crm_status', e.target.value)}>
                          <option value="">Bitte waehlen</option>
                          <option value="no">Nein</option>
                          <option value="basic">Ja, aber unstrukturiert</option>
                          <option value="clean">Ja, sauber gepflegt</option>
                        </select>
                      </Field>
                      <Field label="Machst du bereits Outreach?" error={errors.outreach_status}>
                        <select className={inputClass} value={form.outreach_status} onChange={(e) => update('outreach_status', e.target.value)}>
                          <option value="">Bitte waehlen</option>
                          <option value="none">Nein</option>
                          <option value="manual">Manuell / sporadisch</option>
                          <option value="systematic">Systematisch / automatisiert</option>
                        </select>
                      </Field>
                      <Field label="Produzierst du bereits Content?" error={errors.content_status}>
                        <select className={inputClass} value={form.content_status} onChange={(e) => update('content_status', e.target.value)}>
                          <option value="">Bitte waehlen</option>
                          <option value="none">Nein</option>
                          <option value="occasional">Gelegentlich</option>
                          <option value="regular">Regelmaessig</option>
                        </select>
                      </Field>
                      <Field label="Solo oder Team?" error={errors.team_size}>
                        <select className={inputClass} value={form.team_size} onChange={(e) => update('team_size', e.target.value)}>
                          <option value="">Bitte waehlen</option>
                          <option value="solo">Solo</option>
                          <option value="2-5">2-5 Personen</option>
                          <option value="6-20">6-20 Personen</option>
                          <option value="20+">20+ Personen</option>
                        </select>
                      </Field>
                    </div>
                  </StepChrome>
                )}

                {currentStep.id === 'goals' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Was soll am Ende stehen?" subtitle="Mehrfachauswahl. Priorisierung klaeren wir im Call.">
                    <div className="flex flex-wrap gap-3">
                      {GOAL_OPTIONS.map((g) => (
                        <ChipToggle key={g.id} active={form.goals.includes(g.id)} onClick={() => toggleMulti('goals', g.id)}>{g.label}</ChipToggle>
                      ))}
                    </div>
                    {errors.goals && <p className="text-xs text-red-400 mt-2">{errors.goals}</p>}
                  </StepChrome>
                )}

                {currentStep.id === 'maturity' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Wo stehst du heute?" subtitle="Fuer die richtige Tiefe des Setups.">
                    <div className="grid gap-3">
                      {MATURITY.map((m) => (
                        <OptionCard key={m.id} active={form.maturity_stage === m.id} onClick={() => update('maturity_stage', m.id)} title={m.title} hint={m.hint} />
                      ))}
                    </div>
                    {errors.maturity_stage && <p className="text-xs text-red-400 mt-2">{errors.maturity_stage}</p>}
                  </StepChrome>
                )}

                {currentStep.id === 'notes' && (
                  <StepChrome step={stepIndex + 1} total={total} title="Noch etwas Wichtiges?" subtitle="Optional. Alles was wir vorher wissen sollten.">
                    <Field label="Kontext, Kontexterwartung, Deadline, Budgetrahmen" hint="Kein Muss. Hilft uns aber.">
                      <textarea
                        className={`${inputClass} min-h-[140px] resize-y`}
                        value={form.additional_notes}
                        onChange={(e) => update('additional_notes', e.target.value)}
                        placeholder="Kurz in eigenen Worten."
                      />
                    </Field>
                  </StepChrome>
                )}
              </div>
            </AnimatePresence>

            {/* Footer / Nav */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={prev}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 text-sm text-nox-white-muted hover:text-nox-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Zurueck
              </button>

              <button
                type="button"
                onClick={next}
                disabled={submitState === 'sending'}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-nox-red text-black font-semibold hover:bg-nox-red-hover transition-all disabled:opacity-60"
                style={{ boxShadow: '0 10px 40px -10px rgba(239, 58, 76, 0.5)' }}
              >
                {submitState === 'sending' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet</>
                ) : stepIndex === total - 1 ? (
                  <>Setup-Vorschlag anfragen <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                ) : (
                  <>Weiter <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </button>
            </div>

            {submitState === 'error' && (
              <p className="text-sm text-red-400 mt-4 text-right">
                Uebermittlung fehlgeschlagen. Bitte kurz spaeter erneut versuchen.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-nox-white-muted mt-8">
          Deine Angaben werden ausschliesslich zur Bearbeitung deiner Anfrage verwendet.
        </p>
      </div>
    </div>
  );
}
