// Operator Cockpit — Permanent NOX Project Chat Panel (MVP).
//
// Lokaler Command-Layer für den NOX/Andromeda-Hauptagenten. Bewusst
// OHNE LLM, OHNE Anthropic-API, OHNE Hermes, OHNE n8n, OHNE Worker.
// Der Operator chattet — die Eingaben gehen durch den lokalen
// `parseNoxCommand`-Parser und werden im Panel zu Tool-Vorschlags-
// karten gerendert, die bestehende Project-Auto-Planner-Handler
// auslösen. Jeder Notion-Write läuft weiter durch den geprüften
// Server-Pfad (`/plan/commit`) mit allen Gates.
//
// Strict invariants:
//   - Kein fetch außer durch die Cockpit-Handler, die das Panel als
//     Props bekommt.
//   - Keine Persistenz außer ggf. später vom Caller über
//     `localStorage` (in dieser MVP-Phase NICHT aktiv).
//   - Keine Secrets, keine Token-Eingabe, kein API-Key-Feld.
//   - Confirmation-Phrase wird im Chat-State gehalten; der
//     bestehende Server-Gate bleibt maßgeblich.
//   - Header trägt ein ehrliches Label, damit der Operator nie denkt,
//     hier laufe ein Live-Modell.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  parseNoxCommand,
  type NoxCommandContext,
  type NoxCommandResult,
  type NoxToolAction,
  type NoxToolCard,
} from '../../lib/noxCommandParser';

export interface NoxChatMessage {
  id: string;
  role: 'user' | 'nox' | 'system';
  text: string;
  /** Optional rendered tool card (only on `role === 'nox'`). */
  toolCard?: NoxToolCard;
  /** Server-stamped at the moment the message was added. */
  timestamp: string;
}

export interface NoxProjectChatPanelProps {
  projectId: string;
  projectName?: string;
  projectGoal: string;
  planStepsCount: number;
  lastValidatedDigest?: string | null;
  lastCommitCode?: string | null;
  techCheckStatus:
    | 'idle'
    | 'running'
    | 'ready'
    | 'not-ready'
    | 'auth-blocked'
    | 'error';
  commitStatus:
    | 'idle'
    | 'running'
    | 'committed'
    | 'writes_locked'
    | 'duplicate'
    | 'auth-blocked'
    | 'error';
  /** Callbacks — alle existieren bereits im Cockpit. */
  onPlanRegenerate: () => void;
  onPlanReduceToOne: () => void;
  onPlanTechCheck: () => void;
  onPlanOpenTechnicalDetails: () => void;
  onPlanCheckAndCommit: () => void;
  onPlanSetGoal: (next: string) => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(): string {
  // Lokale Message-Id; nur für react-key-Stabilität, nicht persistiert.
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function statusTone(
  status: NoxProjectChatPanelProps['techCheckStatus'] | NoxProjectChatPanelProps['commitStatus'],
): string {
  switch (status) {
    case 'ready':
    case 'committed':
      return 'text-emerald-300 border-emerald-300/40 bg-emerald-300/10';
    case 'running':
      return 'text-amber-200 border-amber-300/40 bg-amber-300/10';
    case 'not-ready':
    case 'duplicate':
    case 'writes_locked':
      return 'text-amber-200 border-amber-300/40 bg-amber-300/10';
    case 'auth-blocked':
    case 'error':
      return 'text-red-200 border-red-500/40 bg-red-500/10';
    case 'idle':
    default:
      return 'text-[#9f8d95] border-[#4a101b]/50 bg-[#120609]/60';
  }
}

function statusLabel(
  kind: 'tech' | 'commit',
  status: NoxProjectChatPanelProps['techCheckStatus'] | NoxProjectChatPanelProps['commitStatus'],
): string {
  if (kind === 'tech') {
    switch (status) {
      case 'idle':
        return 'Prüfung: idle';
      case 'running':
        return 'Prüfung: läuft';
      case 'ready':
        return 'Prüfung: bereit';
      case 'not-ready':
        return 'Prüfung: nicht bereit';
      case 'auth-blocked':
        return 'Prüfung: auth-blocked';
      case 'error':
        return 'Prüfung: Fehler';
    }
  } else {
    switch (status) {
      case 'idle':
        return 'Write: idle';
      case 'running':
        return 'Write: läuft';
      case 'committed':
        return 'Write: committed';
      case 'writes_locked':
        return 'Write: locked';
      case 'duplicate':
        return 'Write: duplicate-risk';
      case 'auth-blocked':
        return 'Write: auth-blocked';
      case 'error':
        return 'Write: Fehler';
    }
  }
  return 'unbekannt';
}

export function NoxProjectChatPanel(props: NoxProjectChatPanelProps): JSX.Element {
  const [messages, setMessages] = useState<NoxChatMessage[]>(() => [
    {
      id: nextId(),
      role: 'nox',
      text:
        'Hi. Ich bin der lokale NOX-Command-Layer. Kein API-Call, keine Magie. Sag mir was — z. B. „Hilfe", „mach mir die nächsten quests" oder „status".',
      timestamp: nowIso(),
    },
  ]);
  const [input, setInput] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ctx: NoxCommandContext = useMemo(
    () => ({
      projectId: props.projectId,
      projectName: props.projectName,
      projectGoal: props.projectGoal,
      planStepsCount: props.planStepsCount,
      lastValidatedDigest: props.lastValidatedDigest ?? null,
      lastCommitCode: props.lastCommitCode ?? null,
      awaitingCommitConfirmation: awaitingConfirmation,
    }),
    [
      props.projectId,
      props.projectName,
      props.projectGoal,
      props.planStepsCount,
      props.lastValidatedDigest,
      props.lastCommitCode,
      awaitingConfirmation,
    ],
  );

  useEffect(() => {
    // Sticky scroll-to-bottom on new messages. Cheap; only the chat
    // container reflows.
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function pushMessage(msg: Omit<NoxChatMessage, 'id' | 'timestamp'>): void {
    setMessages((curr) => [
      ...curr,
      { ...msg, id: nextId(), timestamp: nowIso() },
    ]);
  }

  function pushSystem(text: string): void {
    pushMessage({ role: 'system', text });
  }

  function handleToolButton(button: { action: NoxToolAction; payload?: string; disabledReason?: string; label: string }): void {
    if (button.disabledReason) {
      pushSystem(`Aktion „${button.label}" gerade nicht möglich: ${button.disabledReason}`);
      return;
    }
    switch (button.action) {
      case 'plan_regenerate':
        props.onPlanRegenerate();
        pushSystem('Project Planner ausgelöst. Lokaler Entwurf, kein Notion-Write.');
        break;
      case 'plan_reduce_to_one':
        props.onPlanReduceToOne();
        pushSystem('Plan auf 1 Schritt reduziert. Lokal, keine Notion-Aktion.');
        break;
      case 'plan_tech_check':
        props.onPlanTechCheck();
        pushSystem('Tech-Check gestartet (Preview + Validate). Status erscheint im Planner-Banner.');
        break;
      case 'plan_open_technical_details':
        props.onPlanOpenTechnicalDetails();
        pushSystem('Technische Details werden geöffnet.');
        break;
      case 'plan_check_and_commit':
        props.onPlanCheckAndCommit();
        pushSystem('„Prüfen & erzeugen" ausgelöst — der bestehende Server-Gate-Pfad mit Schema-Recheck, Digest und Duplicate-Risk läuft jetzt.');
        setAwaitingConfirmation(false);
        break;
      case 'plan_set_goal':
        if (button.payload) {
          props.onPlanSetGoal(button.payload);
          pushSystem(`Projektziel gesetzt: „${button.payload}".`);
        }
        break;
      case 'plan_cancel':
        setAwaitingConfirmation(false);
        pushSystem('OK — verworfen.');
        break;
      case 'noop':
      default:
        break;
    }
  }

  function handleSend(): void {
    const text = input.trim();
    if (text.length === 0) return;
    pushMessage({ role: 'user', text });
    setInput('');

    const result: NoxCommandResult = parseNoxCommand(text, ctx);

    // Confirmation gate — we only fire the commit handler if the parser
    // returned `confirm_commit` AND the chat was actually awaiting a
    // confirmation AND the count matched.
    if (result.intent === 'confirm_commit') {
      const requestedCount = Number.parseInt(result.extractedPayload ?? '0', 10);
      if (!awaitingConfirmation) {
        pushMessage({
          role: 'nox',
          text:
            'Aktuell wartet keine Notion-Anlage auf Confirmation. Schreib zuerst „leg das in notion an" oder klick „Prüfen & erzeugen".',
        });
        return;
      }
      if (!Number.isFinite(requestedCount) || requestedCount !== props.planStepsCount) {
        pushMessage({
          role: 'nox',
          text: `Confirm-Zahl passt nicht (du: ${requestedCount} · lokaler Plan: ${props.planStepsCount}). Bitte exakt: JA, ${props.planStepsCount} QUEST${props.planStepsCount === 1 ? '' : 'S'} ERZEUGEN`,
        });
        return;
      }
      pushMessage({
        role: 'nox',
        text: result.proposedAction,
      });
      props.onPlanCheckAndCommit();
      setAwaitingConfirmation(false);
      return;
    }

    if (result.intent === 'cancel') {
      setAwaitingConfirmation(false);
    }

    if (result.intent === 'request_commit' && result.requiresConfirmation) {
      setAwaitingConfirmation(true);
    }

    pushMessage({
      role: 'nox',
      text: result.proposedAction,
      ...(result.toolDraft ? { toolCard: result.toolDraft } : {}),
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const techChipTone = statusTone(props.techCheckStatus);
  const commitChipTone = statusTone(props.commitStatus);

  return (
    <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#1a0a0d] to-[#0c0506] p-4 md:p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#4a101b]/40 pb-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-amber-200/90">NOX Project Chat</span>
            <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100">
              MVP · lokaler Command-Layer
            </span>
          </div>
          <h3 className="mt-1 truncate text-lg font-black leading-tight text-amber-50">
            {props.projectName ?? props.projectId}{' '}
            <span className="text-[#9f8d95] font-bold text-sm">({props.projectId})</span>
          </h3>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[#9f8d95]">
            Lokaler Command Layer · kein API-Call · Writes nur nach Bestätigung
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
            'text-amber-100 border-amber-300/40 bg-amber-300/8'
          }`}>
            {props.planStepsCount} Plan-Schritt{props.planStepsCount === 1 ? '' : 'e'}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${techChipTone}`}>
            {statusLabel('tech', props.techCheckStatus)}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${commitChipTone}`}>
            {statusLabel('commit', props.commitStatus)}
          </span>
          {props.lastValidatedDigest ? (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/8 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-100" title="Letzter Validate-Digest">
              ⓘ {props.lastValidatedDigest}
            </span>
          ) : null}
        </div>
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollRef}
        className="mt-3 max-h-[420px] min-h-[260px] overflow-y-auto rounded-xl border border-[#4a101b]/40 bg-black/30 p-3"
      >
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm font-semibold leading-5 text-amber-50">
                    {msg.text}
                  </div>
                </div>
              ) : msg.role === 'system' ? (
                <div className="flex justify-center">
                  <div className="rounded-full border border-[#4a101b]/60 bg-[#120609]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f8d95]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-2">
                    <div className="rounded-2xl rounded-bl-sm border border-[#4a101b]/60 bg-[#120609]/80 px-3 py-2 text-sm font-semibold leading-5 text-[#eadbe2] whitespace-pre-line">
                      {msg.text}
                    </div>
                    {msg.toolCard ? (
                      <ToolCardView card={msg.toolCard} onButton={handleToolButton} />
                    ) : null}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Input */}
      <div className="mt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Schreib NOX etwas… (Enter = senden · Shift+Enter = neue Zeile)"
          className="w-full resize-none rounded-xl border border-amber-300/25 bg-[#120609]/80 px-3 py-2 text-sm font-semibold leading-5 text-amber-50 outline-none transition placeholder:text-[#9f8588] focus:border-amber-300/70"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#9f8d95]">
          <span>
            {awaitingConfirmation
              ? `Warte auf Confirmation: „JA, ${props.planStepsCount} QUEST${props.planStepsCount === 1 ? '' : 'S'} ERZEUGEN"`
              : 'Befehl frei wählbar · „Hilfe" für Liste'}
          </span>
          <button
            type="button"
            onClick={handleSend}
            disabled={input.trim().length === 0}
            className="rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Senden ↵
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolCardView({
  card,
  onButton,
}: {
  card: NoxToolCard;
  onButton: (b: { action: NoxToolAction; payload?: string; disabledReason?: string; label: string }) => void;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-300/8 p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">
        Tool-Vorschlag
      </div>
      <div className="mt-1 text-sm font-black text-amber-50">{card.title}</div>
      <div className="mt-1 whitespace-pre-line text-[12px] font-semibold leading-5 text-[#eadbe2]">
        {card.body}
      </div>
      {card.buttons.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.buttons.map((b) => (
            <button
              key={`${b.action}:${b.label}`}
              type="button"
              onClick={() => onButton(b)}
              disabled={Boolean(b.disabledReason)}
              title={b.disabledReason ?? undefined}
              className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default NoxProjectChatPanel;
