// GET /api/diagnosis/status?job_id=... — polls the async analysis job. Returns
// running/stage while in progress, the full canonical payload + pdf_url when
// completed, or a controlled failure code (TLS_FAILED, DNS_FAILED,
// INSUFFICIENT_EVIDENCE, WEBSITE_ACCESS_BLOCKED, …). No re-analysis is ever
// triggered.
//
// Routed through the NOX_WEB_ANFRAGE_ZENTRALE workflow in n8n for the same
// reason as the start call: the orchestrator forwards the poll and passes the
// bridge's own envelope back, so a real diagnosis leaves a readable execution.
// n8n stores nothing — the bridge remains the single source of run state.
//
// Falls back to calling the bridge directly when the orchestrator secret is not
// configured, so a missing environment variable costs visibility, not the site.
//
// Server-side only. The orchestrator call is signed rather than bearing the
// secret itself, because n8n persists request headers into execution data.


import { signOrchestratorRequest } from '../_lib/orchestrator-signature.mjs';

const ORCHESTRATOR_URL = process.env.NOX_ORCHESTRATOR_URL || 'https://n8n.getvoidra.com/webhook/nox/web-anfrage';
const ORCHESTRATOR_SECRET = process.env.NOX_DIAG_SECRET;
const BRIDGE_URL = process.env.NOX_PDF_BRIDGE_URL || 'https://api.noxlabs.net/nox-pdf-bridge';
const BRIDGE_KEY = process.env.NOX_BRIDGE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  if (!ORCHESTRATOR_SECRET && !BRIDGE_KEY) {
    res.status(500).json({ ok: false, error: 'ANALYSIS_UNAVAILABLE' });
    return;
  }

  const jobId = String(req.query?.job_id || '');
  if (!/^[a-f0-9]{16,64}$/.test(jobId)) {
    res.status(400).json({ ok: false, error: 'INVALID_JOB_ID' });
    return;
  }

  const viaOrchestrator = !!ORCHESTRATOR_SECRET;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const upstream = viaOrchestrator
      ? await fetch(ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...signOrchestratorRequest('diagnosis_status', ORCHESTRATOR_SECRET) },
        body: JSON.stringify({ action: 'diagnosis_status', run_id: jobId }),
        signal: controller.signal,
      })
      : await fetch(`${BRIDGE_URL}/api/analysis/job?job_id=${encodeURIComponent(jobId)}`, {
        headers: { 'x-nox-bridge-key': BRIDGE_KEY },
        signal: controller.signal,
      });
    clearTimeout(timeoutId);

    const data = await upstream.json().catch(() => ({}));

    if (upstream.status === 404 || data?.error === 'JOB_NOT_FOUND') {
      res.status(404).json({ ok: false, status: 'failed', error: 'JOB_NOT_FOUND', message: 'Analyse-Job nicht gefunden.' });
      return;
    }
    // Pass the bridge's own status envelope through — it is already shaped for
    // the client (running/stage, completed+canonical, failed+code), and the
    // orchestrator forwards it unchanged. One rewrite: the bridge reports
    // pdf_url as its own path (/api/analysis/<m>/<slug>/pdf), which does not
    // exist on this origin. Rewrite it to the same-origin proxy so the browser
    // never talks to the bridge and the download works.
    if (data && (data.status === 'completed' || data.status === 'running' || data.status === 'queued' || data.status === 'failed')) {
      if (data.status === 'completed' && typeof data.pdf_url === 'string') {
        const m = data.pdf_url.match(/^\/api\/analysis\/(dach|usa)\/([^/]+)\/pdf$/);
        if (m) data.pdf_url = `/api/diagnosis/pdf-proxy?market=${encodeURIComponent(m[1])}&slug=${encodeURIComponent(m[2])}`;
      }
      res.status(200).json(data);
      return;
    }
    res.status(502).json({ ok: false, status: 'failed', error: 'ANALYSIS_FAILED', message: 'Statusabfrage fehlgeschlagen.' });
  } catch (e) {
    res.status(e?.name === 'AbortError' ? 504 : 502).json({ ok: false, status: 'failed', error: 'ANALYSIS_FAILED' });
  }
}