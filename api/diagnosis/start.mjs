// POST /api/diagnosis/start — kicks off an async analysis job and returns
// immediately with a job_id. The heavy multi-minute pipeline runs server-side,
// so the browser never waits on a single long function.
//
// The request goes through the NOX_WEB_ANFRAGE_ZENTRALE workflow in n8n, which
// is the orchestrator for everything the website sends inward. n8n forwards the
// intake to the analysis bridge and hands the bridge's own answer back; it
// keeps no job state of its own, so run_id, analysis_key and the run lifecycle
// still have exactly one owner. Routing it this way is what makes a real
// diagnosis visible as an execution.
//
// If the orchestrator is not configured, the call falls back to the bridge
// directly — the path this used to take. A missing environment variable should
// cost visibility, not the feature.
//
// Server-side only. The orchestrator call is signed rather than bearing the
// secret itself, because n8n persists request headers into execution data.

import { signOrchestratorRequest } from '../_lib/orchestrator-signature.mjs';

const ORCHESTRATOR_URL = process.env.NOX_ORCHESTRATOR_URL || 'https://n8n.getvoidra.com/webhook/nox/web-anfrage';
const ORCHESTRATOR_SECRET = process.env.NOX_DIAG_SECRET;
const BRIDGE_URL = process.env.NOX_PDF_BRIDGE_URL || 'https://api.noxlabs.net/nox-pdf-bridge';
const BRIDGE_KEY = process.env.NOX_BRIDGE_KEY;

function readCookie(req, name) {
  const header = String(req.headers?.cookie || '');
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  return pair.slice(name.length + 1);
}

function readDiagnosisIntake(req) {
  const raw = readCookie(req, 'nox_diag_intake');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || ''));
}

function cleanText(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  if (!ORCHESTRATOR_SECRET && !BRIDGE_KEY) {
    res.status(500).json({ ok: false, error: 'ANALYSIS_UNAVAILABLE' });
    return;
  }

  const body = req.body || {};
  const intake = readDiagnosisIntake(req);
  const url = cleanText(body.url, 2048);
  if (!url) {
    res.status(400).json({ ok: false, error: 'MISSING_URL' });
    return;
  }
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    res.status(400).json({ ok: false, error: 'INVALID_URL' });
    return;
  }

  // Public browser input must never grant operator privileges. A future
  // operator path must be authenticated server-side (e.g. signed internal
  // request/session) and must not trust a query parameter or client cookie.
  const operatorMode = false;
  const email = cleanText(intake.email, 254).toLowerCase();
  if (!validEmail(email)) {
    res.status(400).json({ ok: false, error: 'MISSING_OR_INVALID_EMAIL' });
    return;
  }

  const marketingConsent = intake.marketing_consent === true;
  const consentAt = marketingConsent ? cleanText(intake.marketing_consent_at, 64) : null;
  const consentVersion = marketingConsent ? cleanText(intake.marketing_consent_version, 100) : null;
  const contactPurpose = cleanText(intake.analysis_contact_purpose || 'requested_website_analysis', 100);

  // The client-side handoff cookie exists only long enough to bridge the form
  // submission into this same-origin serverless route. Do not retain PII in a
  // browser cookie after the intake was accepted/rejected here.
  res.setHeader('Set-Cookie', 'nox_diag_intake=; Max-Age=0; Path=/; SameSite=Lax; Secure');

  const viaOrchestrator = !!ORCHESTRATOR_SECRET;
  const target = viaOrchestrator ? ORCHESTRATOR_URL : `${BRIDGE_URL}/api/analysis/start-job`;
  const headers = viaOrchestrator
    ? { 'content-type': 'application/json', ...signOrchestratorRequest('diagnosis_intake', ORCHESTRATOR_SECRET) }
    : { 'content-type': 'application/json', 'x-nox-bridge-key': BRIDGE_KEY };

  const common = {
    email,
    operator_mode: operatorMode,
    marketing_consent: marketingConsent,
    marketing_consent_at: consentAt,
    marketing_consent_version: consentVersion,
    analysis_contact_purpose: contactPurpose,
  };

  const payload = viaOrchestrator
    ? {
        action: 'diagnosis_intake',
        website_url: url,
        industry: body.industry,
        goal: body.goal,
        ...common,
      }
    : {
        url,
        industry: body.industry,
        goal: body.goal,
        ...common,
      };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await upstream.json().catch(() => ({}));

    // The intake limit is a real answer, not a failure to pass on as a generic
    // one: the caller should be told to come back rather than to try again now.
    if (upstream.status === 429 || data?.error === 'TOO_MANY_ACTIVE_RUNS' || data?.error === 'DOMAIN_RUN_LIMIT') {
      res.status(429).json({
        ok: false,
        error: data?.error || 'RATE_LIMITED',
        message: data?.message || 'Es laufen derzeit zu viele Analysen. Bitte in einigen Minuten erneut versuchen.',
      });
      return;
    }
    if (!data?.job_id) {
      res.status(502).json({ ok: false, error: data?.error_code || data?.error || 'ANALYSIS_FAILED' });
      return;
    }
    res.status(202).json({ ok: true, job_id: data.job_id, status: data.status || 'queued' });
  } catch (e) {
    res.status(e?.name === 'AbortError' ? 504 : 502).json({ ok: false, error: 'ANALYSIS_FAILED' });
  }
}