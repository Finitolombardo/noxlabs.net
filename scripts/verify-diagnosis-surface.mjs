// Verifies the diagnosis API surface exists before a build ships. Fails the
// build if analyze/start/status or their directly required helper are missing
// or cannot be imported — so future deployments cannot silently lose the
// analyzer API again.
//
// Wired into the build command ahead of `vite build` (see package.json).

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

const REQUIRED = [
  ['/api/diagnosis/analyze.mjs', 'POST /api/diagnosis/analyze — Live-Scan Endpoint'],
  ['/api/diagnosis/start.mjs', 'POST /api/diagnosis/start — Async-Job Start'],
  ['/api/diagnosis/status.mjs', 'GET /api/diagnosis/status — Async-Job Status'],
  ['/api/_lib/orchestrator-signature.mjs', 'Signatur-Helfer für start/status'],
];

let failed = false;

for (const [rel, purpose] of REQUIRED) {
  const abs = path.join(root, rel.replace(/^\//, ''));
  if (!existsSync(abs)) {
    console.error(`✗ FEHLT: ${rel} (${purpose})`);
    failed = true;
    continue;
  }
  try {
    const mod = await import(`${pathToFileURL(abs).href}?verify=${Date.now()}`);
    if (rel.startsWith('/api/_lib/')) {
      if (typeof mod.signOrchestratorRequest !== 'function') {
        console.error(`✗ ${rel}: signOrchestratorRequest fehlt (Analyzer-Surface beschädigt)`);
        failed = true;
        continue;
      }
    } else if (typeof mod.default !== 'function') {
      console.error(`✗ ${rel}: default export ist keine Handler-Funktion (Analyzer-Surface beschädigt)`);
      failed = true;
      continue;
    }
    console.log(`✓ ${rel} — importiert, Handler ok`);
  } catch (err) {
    console.error(`✗ ${rel} — Import/Parse fehlgeschlagen: ${err && err.message ? err.message : err}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nDiagnosis-API-Surface unvollständig. Build abgebrochen.');
  process.exit(1);
}

console.log('\nDiagnosis-API-Surface vollständig. Build darf fortfahren.');
process.exit(0);
