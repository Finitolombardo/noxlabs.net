# NOX `/goal` Experiment — Spielregeln

Status: Operator-Runbook für das `/goal`-Feature von Claude Code.
Branch: `feature/operator-cockpit-claude-code-bridge`.
Letztes Update: 2026-05-21.

Operator: **Großinquisitor Azariel**.

---

## Ziel

`/goal` lässt Claude an einer klar messbaren Zielbedingung arbeiten,
bis die Bedingung erfüllt ist oder die maximale Turnzahl erreicht
wurde. Wir testen es für **kleine, abgegrenzte, sichere** Aufgaben
— nicht als Magie-Knopf.

---

## Grundregeln

- **Nur messbar.** Das Goal muss eine Bedingung haben, die sich am
  Transcript ablesen lässt (z. B. „Datei X existiert",
  „`git diff --check` ist clean", „grep findet 0 Treffer").
- **Immer Stoppklausel.** „… oder stoppe nach N turns." Wir wollen
  keine endlose Schleife.
- **Niemals für riskante Writes.** Kein `/goal` für Notion-Writes,
  GitHub-Writes, n8n-Dispatch, Hermes-Live-Calls, Production-8788,
  Live-Trading.
- **Niemals als Ersatz für Operator-GO.** `/goal` darf keinen
  Confirmation-Gate umgehen.
- **Sichtbarkeit ist die einzige Wahrheit.** Der Goal-Evaluator
  prüft das Transcript. Wenn Claude einen Check macht, ohne das
  Ergebnis sichtbar zu machen, zählt es nicht. Also Checks im
  Goal immer explizit aufrufen lassen.

---

## Erlaubte Goal-Klassen

1. **Doku-Erstellung.** Dateien anlegen, prüfen, grep auf Klartext.
2. **Agent-Definitionen.** YAML-Frontmatter prüfen, keine
   `bypassPermissions`, `git diff --check` clean.
3. **Validation.** `npm run lint`, `npm run typecheck`,
   Secret-Grep — alles im Transcript sichtbar.
4. **Refactor in einem Modul.** Kleines, klar abgegrenztes Modul,
   Lint + Typecheck als Stop-Bedingung.

Nicht erlaubt:

- Cross-Repo-Arbeit ohne Operator-GO.
- Echte externe Calls (Notion/n8n/Hermes/Provider).
- Massen-Edits in `src/**` ohne klare Bedingung.

---

## Beispiel-Goals

### Beispiel 1 — Nur Doku

```
/goal docs/nox-agent-operating-model.md, docs/nox-agent-skills-and-powers.md
und docs/nox-hermes-delegation-layer.md existieren,
git diff --check ist clean,
und grep findet keinen Operator-facing "Alex"-Treffer in den neuen Dateien
(grep -E "\bAlex\b" docs/nox-agent-operating-model.md docs/nox-agent-skills-and-powers.md docs/nox-hermes-delegation-layer.md liefert 0 Zeilen),
oder stoppe nach 8 turns.
```

### Beispiel 2 — Agent-Dateien

```
/goal alle .claude/agents/nox-*.md Dateien haben gültiges YAML frontmatter
mit name, description, tools, model und permissionMode;
keine Datei enthält bypassPermissions
(grep -R "bypassPermissions" .claude/agents liefert 0 Treffer);
git diff --check ist clean;
oder stoppe nach 10 turns.
```

### Beispiel 3 — Validation

```
/goal npm run lint ist clean,
npm run typecheck zeigt nur die bekannten 6 Skillbook-Fehler
(Excalidraw + xyflow), keinen neuen Fehler in den NOX-Agent-/Connector-Dateien,
und grep -R "ANTHROPIC_API_KEY\|api.anthropic.com\|claude.ai/oauth" docs src scripts .claude
findet 0 echte Treffer (nur Kommentare als Negativ-Hinweis zählen nicht);
oder stoppe nach 8 turns.
```

---

## Wichtige Einschränkung

Der Goal-Evaluator prüft nur das Transcript. Konkret heißt das:

- **Befehle, deren Output Claude nicht ausgibt, zählen nicht.** Also
  `Grep` mit Output-Mode `content` oder ein Bash mit `tail -50` ist
  Pflicht, wenn die Bedingung an einem Befehlsergebnis hängt.
- **Goal-Bedingung muss exakt formulierbar sein.** Vage Ziele
  („Code ist sauber") fallen durch, weil der Evaluator nicht
  beurteilen kann, wann das erfüllt ist.
- **Mehrere Bedingungen** mit „und" verbinden. Jede einzeln muss
  messbar sein.

---

## Eskalation

Wenn `/goal` 3× hintereinander ohne Operator-Wert turnt
(z. B. immer wieder lint/typecheck mit denselben Skillbook-Fehlern),
brich ab und melde:

```
GOAL_STALLED
loops_without_progress: 3
last_checks: …
suggestion: …
```

Stand: dieses Schema ist Operator-Vorschlag, kein im Tool eingebauter
Mechanismus.

---

## Folgequests

| Quest | Inhalt |
|---|---|
| `NOX-GOAL-SMOKE-01` | Beispiel-Goal 1 (Doku) live testen, Transcript dokumentieren |
| `NOX-GOAL-VALIDATION-01` | Beispiel-Goal 3 in CI-ähnlicher Konstellation testen |
| `NOX-GOAL-GUIDELINES-01` | Aus den ersten Smoke-Tests ein Best-Practice-Doku ableiten |
