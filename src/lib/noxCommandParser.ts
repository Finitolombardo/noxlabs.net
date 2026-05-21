// Operator Cockpit — Lokaler NOX Command Layer (MVP).
//
// Diese Datei ist BEWUSST kein LLM-Wrapper. Sie enthält reine
// JavaScript-Regeln, die Operator-Eingaben aus dem Project-Chat-Panel
// in bekannte Intents übersetzen. Wenn später ein echtes Modell
// dahinter kommt, ersetzt der LLM-Aufruf das hier definierte Mapping
// — die Konsumenten im Cockpit kennen nur den `NoxCommandResult` und
// können unverändert weiterlaufen.
//
// Hard-Constraints:
//   - Pure Funktion. Kein fetch, kein env, kein Date.now() in
//     bedingten Pfaden, kein Random.
//   - Keine Anthropic-API. Kein Hermes. Kein Worker.
//   - Keine Notion-Mutation. Der Parser TRIGGERT keinen Write — er
//     gibt nur Intents zurück, die das Cockpit dann optional + nach
//     Confirmation an bestehende Handler weiterreicht.
//   - Keine Secrets. Die Eingabe wird nicht außerhalb des Cockpits
//     persistiert.

export type NoxCommandIntent =
  | 'draft_quests'
  | 'reduce_to_one'
  | 'tech_check'
  | 'open_technical_details'
  | 'request_commit'
  | 'confirm_commit'
  | 'summarize_project'
  | 'detect_blockers'
  | 'prepare_claude_prompt'
  | 'set_project_goal'
  | 'cancel'
  | 'help'
  | 'unknown';

/**
 * Die UI-seitige Confirmation-Phrase. Muss vom Operator EXAKT so
 * eingegeben werden, bevor ein Commit aus dem Chat heraus gestartet
 * werden darf. Dient als zusätzliche Sperre OBEN auf die bestehenden
 * Server-Gates (Write-Flag, Schema-Recheck, Digest, Duplicate-Risk,
 * Idempotenz, Shared-Token-Opt-In). Der Server-Gate bleibt
 * maßgeblich.
 */
export const NOX_CHAT_COMMIT_CONFIRM_PHRASE_RE =
  /^\s*ja[,!.]?\s+(\d+)\s+quest(?:s|en)?\s+erzeugen\s*\.?\s*$/i;

/**
 * Stable rendering hint für die Tool-Card im Chat. Maps grob auf die
 * Buttons, die bereits im Project Auto Planner existieren.
 */
export type NoxToolAction =
  | 'plan_regenerate'
  | 'plan_reduce_to_one'
  | 'plan_open_technical_details'
  | 'plan_tech_check'
  | 'plan_check_and_commit'
  | 'plan_set_goal'
  | 'plan_cancel'
  | 'noop';

export interface NoxToolCardButton {
  label: string;
  action: NoxToolAction;
  /** Optional inline-value (z. B. ein Projektziel zum Übernehmen). */
  payload?: string;
  /** Disabled-Hint für die UI, wenn der Button nicht ausführbar ist. */
  disabledReason?: string;
}

export interface NoxToolCard {
  /** Knappe Headline der Karte. */
  title: string;
  /** 1-2 Sätze, was die Karte vorschlägt. */
  body: string;
  /** Buttons, die das Cockpit zu bestehenden Handlern verdrahten kann. */
  buttons: NoxToolCardButton[];
}

export interface NoxCommandContext {
  projectId: string;
  projectName?: string;
  projectGoal: string;
  planStepsCount: number;
  /** Letzter Validate-Digest, falls vorhanden. */
  lastValidatedDigest?: string | null;
  /** Letzter Commit-Code (z. B. 'committed', 'duplicate_risk', undefined). */
  lastCommitCode?: string | null;
  /** Wartet der Chat bereits auf eine Confirmation? */
  awaitingCommitConfirmation: boolean;
}

export interface NoxCommandResult {
  intent: NoxCommandIntent;
  /** 0..1, simple rule-based score (Anteil der Tokens, die getroffen haben). */
  confidence: number;
  /** Was würde NOX als Antwort sagen (Klartext). */
  proposedAction: string;
  /** Muss der User explizit bestätigen, bevor Cockpit etwas tut? */
  requiresConfirmation: boolean;
  /** Optionale Aktion-Karte (Tool-Vorschlag). */
  toolDraft?: NoxToolCard;
  /**
   * Optional: extrahierter freier Wert (z. B. das neue Projektziel
   * aus "setze ziel: …"). Nur gesetzt, wenn der Parser eine sinnvolle
   * Extraktion machen konnte.
   */
  extractedPayload?: string;
}

// ---------------------------------------------------------------------
// Pattern-Library. Bewusst klein gehalten; jede neue Regel sollte
// einen klaren Operator-Use-Case lösen.
// ---------------------------------------------------------------------

interface IntentPattern {
  intent: NoxCommandIntent;
  /** Tokens, die im Input vorkommen müssen. */
  must: RegExp[];
  /** Tokens, deren Auftauchen Score reduziert. */
  blockedBy?: RegExp[];
}

const PATTERNS: IntentPattern[] = [
  // Confirmation phrase — höchste Priorität, sonst greift request_commit.
  {
    intent: 'confirm_commit',
    must: [NOX_CHAT_COMMIT_CONFIRM_PHRASE_RE],
  },
  // Plan reduzieren auf 1 — Smoke-Test-Hilfe.
  {
    intent: 'reduce_to_one',
    must: [/\b(reduzier|reduzieren|auf 1|nur ein(?:e|en)?|smoke|nur eine quest)\b/i],
  },
  // Quest erzeugen / generieren — lokaler Planner, kein Commit.
  {
    intent: 'draft_quests',
    must: [
      /\b(quest|quests|aufgab|aufgaben|tasks?|next steps?|n(?:ä|ae)chste schritte|schritte machen|schritte entwerfen|reihe|drafte?n?|plan(?:en)?|generier(?:e|en))\b/i,
    ],
    blockedBy: [/notion|anlegen|committen|schreiben|festschreiben|push/i],
  },
  // Technische Details Modal öffnen.
  {
    intent: 'open_technical_details',
    must: [/\b(technisch|technische details|preview daten|digest pr(?:ü|ue)fen|api preview)\b/i],
  },
  // Tech-Check inline (Prüfen ohne Modal).
  {
    intent: 'tech_check',
    must: [/\b(pr(?:ü|ue)fen|tech.?check|check|nur pr(?:ü|ue)fen|nur testen)\b/i],
    blockedBy: [/erzeugen|notion|commit|festschreiben/i],
  },
  // Commit anfragen (NICHT direkt ausführen).
  {
    intent: 'request_commit',
    must: [
      /\b(in notion|notion|anlegen|festschreiben|committen|commit|schreib(?:en)?|erstell(?:en|e)|leg das in notion|push|jetzt erzeugen)\b/i,
    ],
    blockedBy: [NOX_CHAT_COMMIT_CONFIRM_PHRASE_RE],
  },
  // Projektziel setzen — "Setze Ziel: …" / "Projektziel: …".
  {
    intent: 'set_project_goal',
    must: [/^\s*(?:setze\s+ziel|projektziel|ziel|neues ziel)\s*[:-]\s*\S/i],
  },
  // Zusammenfassung / Status.
  {
    intent: 'summarize_project',
    must: [/\b(zusammenfass|status|wo stehen wir|kurzer (ü|u)berblick|kurz zusammen)\b/i],
  },
  // Blocker.
  {
    intent: 'detect_blockers',
    must: [/\b(blocker|h(?:ä|ae)ngt|stuck|festgefahren|geht nicht|was fehlt)\b/i],
  },
  // Claude-Code-Prompt vorbereiten.
  {
    intent: 'prepare_claude_prompt',
    must: [/\b(claude(?:.?code)?|prompt|copy paste|copy.?paste|prompt vorbereiten)\b/i],
  },
  // Abbrechen.
  {
    intent: 'cancel',
    must: [/^\s*(abbrechen|cancel|stop|stopp|warte|nicht jetzt|doch nicht)\s*\.?\s*$/i],
  },
  // Hilfe / Befehlsliste.
  {
    intent: 'help',
    must: [/^\s*(?:hilfe|help|was kannst du|befehle|commands?)\s*\??\s*$/i],
  },
];

function matchesIntent(input: string, p: IntentPattern): boolean {
  if (p.blockedBy && p.blockedBy.some((r) => r.test(input))) return false;
  return p.must.every((r) => r.test(input));
}

// ---------------------------------------------------------------------
// Tool-Card-Bauer. Bewusst getrennt vom Pattern-Matching, damit der
// Cockpit-Caller die Karte zum Rendern bekommt OHNE doppelte Regeln.
// ---------------------------------------------------------------------

function buildDraftQuestsCard(ctx: NoxCommandContext): NoxToolCard {
  return {
    title: 'Quest-Reihe entwerfen?',
    body:
      ctx.projectGoal.trim().length > 0
        ? `Ich würde den Project Planner auf Basis deines Projektziels für „${ctx.projectName ?? ctx.projectId}" auslösen. Der Plan ist lokal — bevor Notion etwas sieht, läuft Tech-Check + dein „JA"-Confirm.`
        : `Setze zuerst ein Projektziel (z. B. „Setze Ziel: …"). Ich würde dann den Project Planner für „${ctx.projectName ?? ctx.projectId}" auslösen.`,
    buttons: [
      {
        label: 'Quest-Reihe entwerfen',
        action: 'plan_regenerate',
        ...(ctx.projectGoal.trim().length === 0
          ? { disabledReason: 'Projektziel fehlt.' }
          : {}),
      },
      { label: 'Auf 1 Quest reduzieren', action: 'plan_reduce_to_one' },
      { label: 'Nur prüfen', action: 'plan_tech_check' },
      { label: 'Prüfen & erzeugen', action: 'plan_check_and_commit' },
    ],
  };
}

function buildReduceCard(): NoxToolCard {
  return {
    title: 'Plan auf 1 Quest reduzieren?',
    body:
      'Reduziert den lokalen Quest-Reihen-Entwurf auf den ersten Schritt — nützlich für einen kontrollierten Smoke-Test. Keine Notion-Aktion.',
    buttons: [
      { label: 'Auf 1 Quest reduzieren', action: 'plan_reduce_to_one' },
      { label: 'Doch nicht', action: 'plan_cancel' },
    ],
  };
}

function buildTechCheckCard(): NoxToolCard {
  return {
    title: 'Tech-Check ausführen?',
    body:
      'Führt Preview + Validate ohne Modal aus. Status erscheint im Planner-Banner. Kein Notion-Write.',
    buttons: [
      { label: 'Nur prüfen', action: 'plan_tech_check' },
      { label: 'Technische Details', action: 'plan_open_technical_details' },
    ],
  };
}

function buildTechDetailsCard(): NoxToolCard {
  return {
    title: 'Technische Details öffnen?',
    body:
      'Öffnet das Diagnose-Modal mit Preview-Mutationen, Schema-Checks, missing/unsafe-Listen. Reiner Lesepfad.',
    buttons: [
      { label: 'Technische Details', action: 'plan_open_technical_details' },
      { label: 'Doch nicht', action: 'plan_cancel' },
    ],
  };
}

function buildCommitRequestCard(ctx: NoxCommandContext): NoxToolCard {
  const n = Math.max(0, ctx.planStepsCount);
  const digestStr = ctx.lastValidatedDigest ? ` · Digest ${ctx.lastValidatedDigest}` : '';
  return {
    title: `Notion-Write anfragen (${n} Quest${n === 1 ? '' : 's'})`,
    body:
      n === 0
        ? 'Aktuell sind keine lokalen Plan-Schritte da. Erst „Quest-Reihe entwerfen", dann erneut anfragen.'
        : `Ich kann das in Notion anlegen — aber NICHT ohne explizite Bestätigung. Bestätige hier mit:\n\nJA, ${n} QUEST${n === 1 ? '' : 'S'} ERZEUGEN${digestStr}`,
    buttons: [
      {
        label: 'Prüfen & erzeugen (UI-Button)',
        action: 'plan_check_and_commit',
        ...(n === 0 ? { disabledReason: 'Keine Plan-Schritte.' } : {}),
      },
      { label: 'Doch nicht', action: 'plan_cancel' },
    ],
  };
}

function buildSetGoalCard(extractedGoal: string): NoxToolCard {
  return {
    title: 'Projektziel übernehmen?',
    body: `Neues Projektziel:\n\n„${extractedGoal}"\n\nÜbernehmen?`,
    buttons: [
      { label: 'Projektziel setzen', action: 'plan_set_goal', payload: extractedGoal },
      { label: 'Doch nicht', action: 'plan_cancel' },
    ],
  };
}

function buildHelpCard(): NoxToolCard {
  return {
    title: 'Was du mir sagen kannst',
    body: [
      '· „mach mir die nächsten quests"',
      '· „auf 1 reduzieren"',
      '· „nur prüfen" / „tech check"',
      '· „leg das in notion an" → fragt nach Confirm',
      '· „JA, 1 QUEST ERZEUGEN" (oder „JA, 7 QUESTS ERZEUGEN") → bestätigt',
      '· „technische details"',
      '· „zusammenfassen" / „status"',
      '· „blocker"',
      '· „claude prompt"',
      '· „setze ziel: …"',
      '· „abbrechen"',
    ].join('\n'),
    buttons: [],
  };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Parse a free-text operator command into a known NOX intent.
 * Pure, deterministic, no I/O.
 */
export function parseNoxCommand(rawInput: string, ctx: NoxCommandContext): NoxCommandResult {
  const input = rawInput.trim();
  if (input.length === 0) {
    return {
      intent: 'unknown',
      confidence: 0,
      proposedAction: 'Leere Eingabe — schreib z. B. „Hilfe" für eine Befehlsliste.',
      requiresConfirmation: false,
    };
  }

  // Confirmation phrase has the highest priority — it never collides with
  // other intents because the regex anchors on JA, <n> QUEST(S) ERZEUGEN.
  const confirmMatch = input.match(NOX_CHAT_COMMIT_CONFIRM_PHRASE_RE);
  if (confirmMatch) {
    const requestedCount = Number.parseInt(confirmMatch[1] ?? '0', 10);
    const localCount = Math.max(0, ctx.planStepsCount);
    const safe = Number.isFinite(requestedCount) && requestedCount === localCount;
    return {
      intent: 'confirm_commit',
      confidence: 1,
      proposedAction: safe
        ? `Bestätigt für ${requestedCount} Quest${requestedCount === 1 ? '' : 's'}. Cockpit löst jetzt den bestehenden Server-Gate-Pfad aus.`
        : `Confirm-Zahl (${requestedCount}) passt nicht zur lokalen Plan-Länge (${localCount}). Bitte erneut tippen.`,
      requiresConfirmation: false,
      extractedPayload: String(requestedCount),
    };
  }

  // Walk the pattern table in declared order so the most specific
  // intents win.
  for (const p of PATTERNS) {
    if (p.intent === 'confirm_commit') continue; // already handled above
    if (!matchesIntent(input, p)) continue;
    return finalise(p.intent, input, ctx);
  }

  return {
    intent: 'unknown',
    confidence: 0,
    proposedAction:
      'Habe den Befehl noch nicht erkannt. Tippe „Hilfe" für eine Liste der Operator-Befehle.',
    requiresConfirmation: false,
  };
}

function finalise(
  intent: NoxCommandIntent,
  input: string,
  ctx: NoxCommandContext,
): NoxCommandResult {
  switch (intent) {
    case 'draft_quests':
      return {
        intent,
        confidence: 0.9,
        proposedAction:
          'Ich kann den Project Planner anstoßen — das ist eine LOKALE Quest-Reihe, kein Notion-Write.',
        requiresConfirmation: false,
        toolDraft: buildDraftQuestsCard(ctx),
      };
    case 'reduce_to_one':
      return {
        intent,
        confidence: 0.95,
        proposedAction:
          'Reduziere lokal auf den ersten Plan-Schritt. Keine Notion-Aktion.',
        requiresConfirmation: false,
        toolDraft: buildReduceCard(),
      };
    case 'tech_check':
      return {
        intent,
        confidence: 0.9,
        proposedAction:
          'Tech-Check ohne Modal — Preview + Validate. Banner im Planner zeigt das Ergebnis.',
        requiresConfirmation: false,
        toolDraft: buildTechCheckCard(),
      };
    case 'open_technical_details':
      return {
        intent,
        confidence: 0.9,
        proposedAction:
          'Öffnet das Diagnose-Modal. Reiner Lesepfad.',
        requiresConfirmation: false,
        toolDraft: buildTechDetailsCard(),
      };
    case 'request_commit':
      return {
        intent,
        confidence: 0.85,
        proposedAction:
          ctx.planStepsCount === 0
            ? 'Es gibt noch keine lokalen Plan-Schritte. Erst Quest-Reihe entwerfen.'
            : `Ich brauche deine explizite Bestätigung. Tippe genau: JA, ${ctx.planStepsCount} QUEST${ctx.planStepsCount === 1 ? '' : 'S'} ERZEUGEN`,
        requiresConfirmation: ctx.planStepsCount > 0,
        toolDraft: buildCommitRequestCard(ctx),
      };
    case 'set_project_goal': {
      const goal = extractGoalAfterColon(input);
      return {
        intent,
        confidence: goal ? 0.8 : 0.4,
        proposedAction: goal
          ? `Ich kann das Projektziel auf „${goal}" setzen.`
          : 'Konnte kein Ziel hinter dem Doppelpunkt finden. Beispiel: „Setze Ziel: Mein neues Projektziel"',
        requiresConfirmation: false,
        ...(goal ? { toolDraft: buildSetGoalCard(goal), extractedPayload: goal } : {}),
      };
    }
    case 'summarize_project': {
      const lines = [
        `Projekt: ${ctx.projectName ?? ctx.projectId} (${ctx.projectId})`,
        ctx.projectGoal.trim().length > 0
          ? `Projektziel: „${ctx.projectGoal.trim()}"`
          : 'Projektziel: (noch nicht gesetzt)',
        `Lokale Quest-Reihen-Schritte: ${ctx.planStepsCount}`,
        ctx.lastValidatedDigest
          ? `Letzter Validate-Digest: ${ctx.lastValidatedDigest}`
          : 'Letzter Validate-Digest: (noch nicht geprüft)',
        ctx.lastCommitCode
          ? `Letzter Commit-Status: ${ctx.lastCommitCode}`
          : 'Letzter Commit-Status: (noch nicht ausgeführt)',
      ];
      return {
        intent,
        confidence: 1,
        proposedAction: lines.join('\n'),
        requiresConfirmation: false,
      };
    }
    case 'detect_blockers':
      return {
        intent,
        confidence: 0.7,
        proposedAction:
          ctx.planStepsCount === 0
            ? 'Größter Blocker: noch kein lokaler Plan. Setz ein Projektziel und entwirf die Quest-Reihe.'
            : ctx.lastValidatedDigest
              ? 'Plan ist geprüft. Wenn etwas hängt, ist es entweder Schema-Drift in Notion oder ein Operator-Approval-Gate.'
              : 'Plan ist lokal, aber noch nicht geprüft. „Nur prüfen" zeigt fehlende Properties / Type-Mismatches.',
        requiresConfirmation: false,
      };
    case 'prepare_claude_prompt':
      return {
        intent,
        confidence: 0.6,
        proposedAction:
          'Claude-Code-Prompt-Generator ist noch nicht in diesem MVP. Für jetzt: kopiere Projektziel + Quest-Reihe per Hand in deinen Claude-Code-Tab.',
        requiresConfirmation: false,
      };
    case 'cancel':
      return {
        intent,
        confidence: 1,
        proposedAction: ctx.awaitingCommitConfirmation
          ? 'Confirmation verworfen. Kein Commit, kein Notion-Write.'
          : 'OK — nichts geändert.',
        requiresConfirmation: false,
      };
    case 'help':
      return {
        intent,
        confidence: 1,
        proposedAction:
          'Hier ist, was ich aktuell verstehe (alles lokal, kein Notion-Write ohne Confirm):',
        requiresConfirmation: false,
        toolDraft: buildHelpCard(),
      };
    default:
      return {
        intent: 'unknown',
        confidence: 0,
        proposedAction: 'Befehl nicht erkannt.',
        requiresConfirmation: false,
      };
  }
}

function extractGoalAfterColon(input: string): string {
  const m = input.match(/[:-]\s*(.+)$/);
  if (!m || typeof m[1] !== 'string') return '';
  return m[1].trim();
}
