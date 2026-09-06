// POST /api/diagnosis/analyze — V3: serverseitige Analyse einer ÖFFENTLICHEN
// Website mit Multi-Page-Evidenz.
//
// V3 Änderungen gegenüber V1/V2:
// - Multi-Page-Scan: Startseite + bis zu 4 gleichoriginige High-Value-Seiten
//   (Kontakt, Termin/Buchung, Shop/Bestellung, Leistungen, Catering/Event).
//   Absenz auf der Startseite ist KEINE Absenz für die ganze Website mehr —
//   Fähigkeiten werden über alle geprüften Seiten aggregiert (Cross-Reference-Fix).
// - Robuste DE/EU-Telefonerkennung (tel:-Links + sichtbare Formate wie
//   "0731 40310290", "0731 88 03 54-00", "+49 …", "(0731) …"), Datums-/Preis-
//   Muster und Fax-Nummern werden gefiltert.
// - Neue Signale: booking_present, online_order_present, whatsapp_present,
//   chat_present, contact_page_present, service_page_present.
// - Branchen- UND Zielprofile steuern Scoring & Priorisierung; für Consumer-
//   Branchen wird LinkedIn NICHT als Priorität empfohlen; wenn ein starker
//   Aufgabenerfüllungs-Pfad existiert (Buchung/Order/Telefon/Formular), wird
//   kein generisches Kontaktformular empfohlen.
// - Evidence-bound Findings: evidenceStatus (OBSERVED/INFERRED), confidence
//   (HIGH/MEDIUM/LOW), evidencePages und kurze Evidence-Strings.
// - Rechtstexte verweisen auf §5 DDG (statt veraltetem §5 TMG), ohne über die
//   beobachtete An-/Abwesenheit hinauszugehen.
//
// Sicherheit (SSRF) — unverändert streng:
// - nur http/https, keine localhost/privaten/reservierten IPs (auch via DNS)
// - Redirects manuell und pro Hop neu validiert (max 3)
// - Timeout + Byte-Limit + sauberer User-Agent
// - Jede Unterseiten-URL wird NEU mit denselben Public-Host-Regeln validiert;
//   es wird nie eine externe Domain gecrawlt.

import dns from 'node:dns/promises';
import net from 'node:net';

export const UA = 'NOXLabsDiagnose/3.0 (+https://noxlabs.net)';
export const MAX_BYTES = 600 * 1024;
export const FETCH_TIMEOUT_MS = 10000;
export const MAX_REDIRECTS = 3;
export const MAX_HIGH_VALUE_PAGES = 4;
export const MAX_TOTAL_PAGES = MAX_HIGH_VALUE_PAGES + 1;

const realDnsLookup = (host, opts) => dns.lookup(host, opts);

// ── SSRF-Schutz ─────────────────────────────────────────────────────────────
export function ipIsPrivate(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true;
    if (p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::1' || low === '::') return true;
    if (low.startsWith('fc') || low.startsWith('fd')) return true;
    if (low.startsWith('fe80')) return true;
    if (low.startsWith('::ffff:')) return ipIsPrivate(low.replace('::ffff:', ''));
    return false;
  }
  return true;
}

export async function assertPublicUrl(rawUrl, { dnsLookup = realDnsLookup } = {}) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    throw { code: 'INVALID_URL' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw { code: 'BAD_PROTOCOL' };
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw { code: 'PRIVATE_HOST' };
  }
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) throw { code: 'PRIVATE_HOST' };
    return u;
  }
  let addrs;
  try {
    addrs = await dnsLookup(host, { all: true });
  } catch {
    throw { code: 'DNS_FAILED' };
  }
  if (!addrs || !addrs.length) throw { code: 'DNS_FAILED' };
  for (const a of addrs) {
    if (ipIsPrivate(a.address)) throw { code: 'PRIVATE_HOST' };
  }
  return u;
}

// ── Fetch (injizierbar für deterministische Tests) ─────────────────────────
async function fetchOnce(url, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return res;
}

async function safeFetchHtml(startUrl, { fetchImpl = fetch, dnsLookup = realDnsLookup } = {}) {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = await assertPublicUrl(current, { dnsLookup });
    const res = await fetchOnce(u.toString(), { fetchImpl });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers && typeof res.headers.get === 'function' ? res.headers.get('location') : null;
      if (!loc) return { status: res.status, finalUrl: u.toString(), html: '' };
      current = new URL(loc, u).toString();
      continue;
    }
    const headersObj = res.headers || {};
    const ct = String(typeof headersObj.get === 'function' ? headersObj.get('content-type') : (headersObj['content-type'] || '')).toLowerCase();
    const cl = Number(typeof headersObj.get === 'function' ? headersObj.get('content-length') : (headersObj['content-length'] || 0));
    if (cl && cl > MAX_BYTES * 4) {
      return { status: res.status, finalUrl: u.toString(), html: '', tooLarge: true, contentType: ct };
    }
    const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
    let received = 0;
    const chunks = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        chunks.push(value);
        if (received >= MAX_BYTES) {
          try { await reader.cancel(); } catch { /* ignore */ }
          break;
        }
      }
    }
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
    return { status: res.status, finalUrl: u.toString(), html, contentType: ct };
  }
  throw { code: 'TOO_MANY_REDIRECTS' };
}

// ── Text-Helfer ─────────────────────────────────────────────────────────────
function stripToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const countMatches = (h, re) => {
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  const m = h.match(r);
  return m ? m.length : 0;
};

function allMatches(text, pattern) {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ text: m[0], index: m.index });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

// ── Telefonerkennung (DE/EU) ───────────────────────────────────────────────
// Bewusst konservativ: keine Datums-/Preis-/Fax-Muster, keine inneren Teile
// beliebiger Zahlenkolonnen ohne Vorwahl-Kontext.
const PHONE_TEXT_PATTERNS = [
  // Deutsche internationale Schreibweise mit Ortsvorwahl in Klammern: +49 (731) 940 20 110
  /(?<![\d:])(?:\+49|0049)[\s./-]*(?:\(\s*0?\d{2,5}\s*\)|0?\d{2,5})(?:[\s./-]*\d{2,8}){1,5}(?=[\s),.;:!?]|$)/g,
  // +49 / +43 / +41 / 0049 … mit optionalem "(0)" nach der Landesvorwahl
  /(?<![\d:])(?:\+[1-9][0-9]{1,2}|00[1-9][0-9]{1,2})(?:[\s./-]*\(?\s?0?\s?\)?[\s./-]?\d{2,4}(?:[\s./-]\d{2,4}){2,4})/g,
  // (0731) 40310290 / (0731) 88 03 54-00 / (0 731) 40 31 02-90
  /(?<!\d)\(0\s?\d{2,4}\)[\s./-]*\d{3,12}(?=[\s),.;:!?]|$)/g,
  // 0731 40310290 / 0731 88 03 54-00 / 0731/88 03 54-00 / 030 120 456 78
  /(?<!\d)0\d{2,5}(?:[\s./-]\d{2,8}){1,5}(?=[\s),.;:!?]|$)/g,
];

function normalizePhone(raw) {
  let d = String(raw).replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('0049')) d = '+49' + d.slice(4);
  else if (d.startsWith('00')) d = '+' + d.slice(2);
  if (d.startsWith('+49')) d = '+49' + d.slice(3).replace(/^0/, '');
  else if (d.startsWith('+')) { /* sonstige EU-Länder: unverändert */ }
  else d = '+49' + d.replace(/^0/, '');
  const digits = d.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return null;
  return d;
}

function isUsablePhoneCandidate(raw, start, text) {
  const compact = String(raw).trim();
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(compact)) return null;
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/.test(compact)) return null;
  const pre = text.slice(Math.max(0, start - 12), start);
  if (/(telefax|fax)\s*[.:]?\s*$/i.test(pre)) return null;
  const post = text.slice(start + raw.length, start + raw.length + 6);
  if (/[€]|EUR|EURO/i.test(post)) return null;
  return normalizePhone(raw);
}

function formatPhoneDisplay(normalized) {
  if (normalized && normalized.startsWith('+49')) return '0' + normalized.slice(3);
  return normalized;
}

export function findPhones(html, text) {
  const found = [];
  const seen = new Set();
  const push = (display, normalized, type) => {
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    found.push({ display, normalized, type });
  };

  // tel:-Links
  const telRe = /<a\b[^>]*href\s*=\s*["']\s*tel:([^"'<>]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = telRe.exec(html)) !== null) {
    let raw = String(m[1]).split(';')[0].trim();
    const norm = normalizePhone(raw);
    if (!norm) continue;
    const label = stripToText(m[2] || '').slice(0, 60).trim();
    const display = /\d/.test(label) ? label : formatPhoneDisplay(norm);
    push(display, norm, 'tel-link');
  }

  // sichtbare Nummern im Text
  for (const pattern of PHONE_TEXT_PATTERNS) {
    for (const cand of allMatches(text, pattern)) {
      const raw = cand.text.trim();
      const norm = isUsablePhoneCandidate(raw, cand.index, text);
      if (!norm) continue;
      push(raw, norm, 'text');
    }
  }

  return found;
}

// ── Seiten-Links & Klassifikation ───────────────────────────────────────────
const BUCKET_RULES = {
  contact: /(\b(kontakt|contact|anfrage|kontaktformular|schreib|schreiben|hilfe|nachricht)\b|^\/?(kontakt|contact)(?:\/|-|$))/i,
  booking: /(\b(termin|termine|reservier|buchung|buchbar|buchen|appointment|booking|anmeldung|buchungs)\b|^\/?(termin|termine|buchung|booking|reservier|appointment|anmeldung)(?:\/|-|$))/i,
  order: /(\b(shop|bestell|warenkorb|checkout|kasse|order|einkaufen|kaufen|kauf|produkte|onlineshop|sortiment)\b|^\/?(shop|bestell|order|produkte|warenkorb|checkout)(?:\/|-|$))/i,
  service: /(\b(leistung|leistungen|service|services|angebot|dienstleistung|preisliste|preise)\b|^\/?(leistung|service|services|angebot)(?:\/|-|$))/i,
  catering: /(\b(catering|event|veranstaltung|feier|location|party|mieten)\b|^\/?(catering|event|veranstaltung|feier|location)(?:\/|-|$))/i,
};

export function classifyLink(label, path) {
  const t = `${label || ''} ${path || ''}`.toLowerCase();
  const buckets = [];
  for (const [key, re] of Object.entries(BUCKET_RULES)) {
    if (re.test(t)) buckets.push(key);
  }
  return buckets;
}

export function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const re = /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = String(m[1] || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('sms:') ||
        href.startsWith('javascript:') || href.startsWith('data:') || href.startsWith('whatsapp:')) continue;
    let url;
    try {
      url = new URL(href, baseUrl);
    } catch { continue; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    if (url.origin !== new URL(baseUrl).origin) continue;
    if (/\.(png|jpe?g|gif|svg|webp|ico|pdf|zip|css|js|xml|mp4|webm|mp3|wav|woff2?|ttf|json)$/i.test(url.pathname)) continue;
    url.hash = '';
    const hrefStr = url.toString().replace(/\/$/, '');
    if (seen.has(hrefStr)) continue;
    seen.add(hrefStr);
    links.push({
      href: hrefStr,
      label: stripToText(m[2] || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      buckets: classifyLink(stripToText(m[2] || ''), url.pathname),
    });
  }
  return links;
}

export function selectHighValuePages(links, limit = MAX_HIGH_VALUE_PAGES) {
  const order = ['contact', 'booking', 'order', 'service', 'catering'];
  const chosen = [];
  const seen = new Set();
  for (const bucket of order) {
    if (chosen.length >= limit) break;
    const cand = links.find((l) => l.buckets.includes(bucket) && !seen.has(l.href));
    if (!cand) continue;
    seen.add(cand.href);
    chosen.push({ url: cand.href, label: cand.label, bucket });
  }
  return chosen;
}

// ── Signale & Text-Marker ───────────────────────────────────────────────────
const CTA_TERMS = ['kontakt', 'anfrage', 'termin', 'buchen', 'angebot', 'beratung', 'kostenlos', 'anrufen', 'nachricht', 'schreiben', 'jetzt ', 'call', 'get started', 'starten', 'reservier'];
const BOOKING_MARKERS = /\b(termin|termine|terminvereinbarung|terminplaner|terminbuchung|reservier|buchung|buchbar|buchen|anmeldung|booking|appointment|reservation|kalender|calendly|doctolib|treatwell|opentable)\b/i;
const ORDER_MARKERS = /\b(warenkorb|checkout|kasse|einkaufen|onlineshop|shop\b|bestell(?:ung|en)?|kauf(?:en|e)?|order\b|jetzt bestellen|online bestellen)\b/i;
const WHATSAPP_MARKERS = /\bwhatsapp\b|wa\.me|api\.whatsapp\.com/i;
const CHAT_MARKERS = /\b(live[- ]?chat|chatbot|chat bot|crisp|tawk\.to|intercom|userlike|tidio|zendesk|messenger|chat\s+(?:mit|box|öffnen|oeffnen|jetzt|starten|support))\b/i;
const CONTACT_FORM_WORDS = /\b(kontaktformular|anfrageformular|anfrage schicken|unverbindlich|absenden|senden|schick(?:en|e) uns|schreib uns|write us|contact us|ihre nachricht|deine nachricht|nachricht an uns)\b/i;
const SOCIAL_PATTERNS = [
  ['instagram', /instagram\.com|\binstagram\b/i],
  ['facebook', /facebook\.com|fb\.com|\bfacebook\b/i],
  ['linkedin', /linkedin\.com|\blinkedin\b/i],
  ['xing', /xing\.com|\bxing\b/i],
  ['youtube', /youtube\.com|\byoutube\b/i],
  ['tiktok', /tiktok\.com|\btiktok\b/i],
];

function contextOf(text, index, span = 34) {
  if (index < 0) return '';
  return text.slice(Math.max(0, index - span), index + span).trim().replace(/\s+/g, ' ');
}

export function extractPageSignals(html, pageUrl, kind = 'home', opts = {}) {
  const h = String(html || '');
  const lower = h.toLowerCase();
  const head = lower.slice(0, 8000);
  const text = stripToText(h);
  const discoverLinks = opts.discoverLinks === true;

  const titleMatch = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const imgTags = h.match(/<img\b[^>]*>/gi) || [];
  const imgWithoutAlt = imgTags.filter((t) => !/\balt\s*=/i.test(t)).length;
  const scriptCount = countMatches(h, /<script\b/gi);
  const isSpaShell =
    text.length < 500 && scriptCount >= 1 &&
    /(id=["'](root|app|__next|__nuxt)["']|data-reactroot|ng-version|<div id=["']app)/i.test(h);

  const cta_present = CTA_TERMS.some((t) => lower.includes(t));
  const form_present = /<form\b/i.test(h);
  const contactFormPresent = form_present && (kind === 'contact' || /(^|\/|-)kontakt/i.test(pageUrl) || CONTACT_FORM_WORDS.test(text));

  const phones = findPhones(h, text);
  const emails = (h.match(/<a\b[^>]*href\s*=\s*["']mailto:([^"'?]+)/gi) || [])
    .map((m) => m.replace(/^.*mailto:/i, '').replace(/["']$/, '').trim())
    .filter(Boolean);

  const booking_matches = [];
  for (const cand of allMatches(text, BOOKING_MARKERS_SAFE)) booking_matches.push(cand);
  const bookingHrefPresent = /href\s*=\s*["'][^"']*(?:termin|booking|buchung|reserv|appointment|kalender|1-wtp-online|doctolib|treatwell|calendly)[^"']*["']/i.test(h);
  const order_matches = [];
  for (const cand of allMatches(text, ORDER_MARKERS_SAFE)) order_matches.push(cand);
  const whatsapp_matches = [];
  for (const cand of allMatches(text, WHATSAPP_MARKERS_SAFE)) whatsapp_matches.push(cand);
  const chat_matches = [];
  for (const cand of allMatches(text, CHAT_MARKERS_SAFE)) chat_matches.push(cand);

  const socials = [];
  for (const [platform, re] of SOCIAL_PATTERNS) {
    if (re.test(h)) socials.push(platform);
  }

  const jsonLdTypes = [];
  const jsonLdBlocks = h.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    const typeMatches = block.match(/"(?:@type|type)"\s*:\s*"([^"]+)"/gi) || [];
    for (const tm of typeMatches) {
      const t = tm.replace(/^.*:"\s*/, '').replace(/"\s*$/, '').trim();
      if (t && jsonLdTypes.length < 12 && !jsonLdTypes.includes(t)) jsonLdTypes.push(t);
    }
  }

  const hrefImpressum = /href\s*=\s*["'][^"']*\/impressum["']/i.test(h);
  const hrefDatenschutz = /href\s*=\s*["'][^"']*\/(?:datenschutz|datenschutzerklaerung|privacy)["']/i.test(h);

  const signals = {
    url: pageUrl,
    kind,
    title_present: title.length > 0,
    title_length: title.length,
    title_text: title.slice(0, 120),
    meta_description_present: /<meta[^>]+name=["']description["'][^>]*>/i.test(head),
    h1_count: countMatches(h, /<h1[\s>]/gi),
    h2_count: countMatches(h, /<h2[\s>]/gi),
    h3_count: countMatches(h, /<h3[\s>]/gi),
    text_length: text.length,
    cta_present,
    form_present,
    contact_form_present: contactFormPresent,
    impressum_present: lower.includes('impressum') || hrefImpressum,
    datenschutz_present: lower.includes('datenschutz') || lower.includes('privacy') || hrefDatenschutz,
    jsonld_present: jsonLdBlocks.length > 0,
    jsonld_types: jsonLdTypes,
    opengraph_present: /<meta[^>]+property=["']og:/i.test(head),
    og_title_present: /<meta[^>]+property=["']og:title["']/i.test(head),
    og_desc_present: /<meta[^>]+property=["']og:description["']/i.test(head),
    og_image_present: /<meta[^>]+property=["']og:image["']/i.test(head),
    viewport_present: /<meta[^>]+name=["']viewport["']/i.test(head),
    canonical_present: /<link[^>]+rel=["']canonical["']/i.test(head),
    lang_present: /<html[^>]+lang=/i.test(head),
    noindex: /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(head),
    img_without_alt: imgWithoutAlt,
    img_total: imgTags.length,
    script_count: scriptCount,
    is_spa_shell: isSpaShell,
    phones,
    emails,
    booking_present: booking_matches.length > 0 || bookingHrefPresent || /(^|\/|-)(termin|termine|terminplaner|terminbuchung|buchung|booking|reservier|appointment|kalender)/i.test(pageUrl),
    order_present: order_matches.length > 0 || /(^|\/|-)(shop|bestell|order|warenkorb|checkout)/i.test(pageUrl),
    whatsapp_present: whatsapp_matches.length > 0,
    chat_present: chat_matches.length > 0,
    booking_matches: booking_matches.slice(0, 3).map((b) => contextOf(text, b.index)),
    order_matches: order_matches.slice(0, 3).map((b) => contextOf(text, b.index)),
    whatsapp_matches: whatsapp_matches.slice(0, 2).map((b) => contextOf(text, b.index)),
    chat_matches: chat_matches.slice(0, 2).map((b) => contextOf(text, b.index)),
    socials,
    high_value_links: discoverLinks ? extractLinks(h, pageUrl) : null,
  };
  return signals;
}

// Von extractPageSignals verwendete "Sicherheitskopien" der Markers-Regexen,
// damit allMatches() nicht an Modul-Regexen mit veränderter lastIndex klebt.
const BOOKING_MARKERS_SAFE = BOOKING_MARKERS;
const ORDER_MARKERS_SAFE = ORDER_MARKERS;
const WHATSAPP_MARKERS_SAFE = WHATSAPP_MARKERS;
const CHAT_MARKERS_SAFE = CHAT_MARKERS;

// ── Aggregation & Evidence ──────────────────────────────────────────────────
function collectEvidence(evMap, key, page) {
  return (evMap[key] = evMap[key] || []);
}

export function aggregatePages(home, pages) {
  const successful = [home, ...pages.filter((p) => p.signals)];
  const evMap = {};
  const aggregate = {
    checked_pages_count: successful.length,
    is_spa_shell: home.signals.is_spa_shell,
    // Head-/SEO-Signale kommen aus der Startseite (Index-Quelle)
    title_present: home.signals.title_present,
    title_length: home.signals.title_length,
    title_text: home.signals.title_text,
    meta_description_present: home.signals.meta_description_present,
    canonical_present: home.signals.canonical_present,
    opengraph_present: home.signals.opengraph_present,
    og_title_present: home.signals.og_title_present,
    og_desc_present: home.signals.og_desc_present,
    og_image_present: home.signals.og_image_present,
    viewport_present: home.signals.viewport_present,
    lang_present: home.signals.lang_present,
    noindex: home.signals.noindex,
    h1_count: home.signals.h1_count,
    text_length: home.signals.text_length,
    cta_present: home.signals.cta_present,
    script_count: home.signals.script_count,
    img_total: home.signals.img_total,
    img_without_alt: home.signals.img_without_alt,
    // Fähigkeiten werden ÜBER ALLE geprüften Seiten aggregiert
    phone_present: false,
    form_present: false,
    contact_form_present: false,
    email_present: false,
    booking_present: false,
    online_order_present: false,
    whatsapp_present: false,
    chat_present: false,
    contact_page_present: false,
    service_page_present: false,
    impression_present: false,
    datenschutz_present: false,
    social_present: false,
    socials: [],
    phone_displays: [],
    phone_count: 0,
    jsonld_present: false,
    booking_evidence: [],
    order_evidence: [],
    whatsapp_evidence: [],
    chat_evidence: [],
    contact_evidence: [],
    service_evidence: [],
  };

  for (const p of successful) {
    const s = p.signals;
    const pageRef = { url: s.url, kind: s.kind };
    if (s.phones && s.phones.length) {
      aggregate.phone_present = true;
      for (const ph of s.phones) {
        collectEvidence(evMap, 'phone_present', { ...pageRef, evidence: ph.display.length <= 40 ? ph.display : ph.display.slice(0, 40), normalized: ph.normalized });
        if (!aggregate.phone_displays.includes(ph.display) && aggregate.phone_displays.length < 5) aggregate.phone_displays.push(ph.display);
      }
      aggregate.phone_count += s.phones.length;
    }
    if (s.emails && s.emails.length) {
      aggregate.email_present = true;
      collectEvidence(evMap, 'email_present', { ...pageRef, evidence: s.emails[0].slice(0, 60) });
    }
    if (s.form_present) {
      aggregate.form_present = true;
      collectEvidence(evMap, 'form_present', { ...pageRef, evidence: 'Formular-Element gefunden' });
    }
    if (s.contact_form_present) {
      aggregate.contact_form_present = true;
      collectEvidence(evMap, 'contact_form_present', { ...pageRef, evidence: 'Kontakt-/Anfrageformular gefunden' });
    }
    if (s.booking_present) {
      aggregate.booking_present = true;
      if (s.booking_matches && s.booking_matches.length) {
        for (const b of s.booking_matches) collectEvidence(evMap, 'booking_present', { ...pageRef, evidence: b.slice(0, 70) });
      } else {
        collectEvidence(evMap, 'booking_present', { ...pageRef, evidence: 'Buchungs-/Terminpfad auf der Seite' });
      }
    }
    if (s.order_present) {
      aggregate.online_order_present = true;
      if (s.order_matches && s.order_matches.length) {
        for (const b of s.order_matches) collectEvidence(evMap, 'online_order_present', { ...pageRef, evidence: b.slice(0, 70) });
      } else {
        collectEvidence(evMap, 'online_order_present', { ...pageRef, evidence: 'Bestell-/Shop-Pfad auf der Seite' });
      }
    }
    if (s.whatsapp_present) {
      aggregate.whatsapp_present = true;
      for (const b of s.whatsapp_matches || []) collectEvidence(evMap, 'whatsapp_present', { ...pageRef, evidence: b.slice(0, 70) });
    }
    if (s.chat_present) {
      aggregate.chat_present = true;
      for (const b of s.chat_matches || []) collectEvidence(evMap, 'chat_present', { ...pageRef, evidence: b.slice(0, 70) });
    }
    if (s.kind === 'contact' || (s.url && /(^|\/|-)kontakt|(^|\/|-)contact/i.test(s.url)) || (s.high_value_links && s.high_value_links.some((l) => l.buckets.includes('contact')))) {
      aggregate.contact_page_present = true;
      collectEvidence(evMap, 'contact_page_present', { ...pageRef, evidence: 'Kontaktseite/-ziel vorhanden' });
    }
    if (s.kind === 'service' || (s.url && /(^|\/|-)(leistung|service|angebot)/i.test(s.url)) || (s.high_value_links && s.high_value_links.some((l) => l.buckets.includes('service')))) {
      aggregate.service_page_present = true;
      collectEvidence(evMap, 'service_page_present', { ...pageRef, evidence: 'Leistungs-/Serviceseite vorhanden' });
    }
    if (s.impressum_present) {
      aggregate.impressum_present = true;
      collectEvidence(evMap, 'impressum_present', { ...pageRef, evidence: 'Impressum-Hinweis gefunden' });
    }
    if (s.datenschutz_present) {
      aggregate.datenschutz_present = true;
      collectEvidence(evMap, 'datenschutz_present', { ...pageRef, evidence: 'Datenschutz-Hinweis gefunden' });
    }
    if (s.jsonld_present) aggregate.jsonld_present = true;
    if (s.socials && s.socials.length) {
      aggregate.social_present = true;
      for (const soc of s.socials) {
        if (!aggregate.socials.includes(soc)) aggregate.socials.push(soc);
        collectEvidence(evMap, 'social_present', { ...pageRef, evidence: soc });
      }
    }
  }

  // Kontakt-/Service-Seiten können ohne dedizierte Seite auch via Link verlinkt sein
  if (!aggregate.contact_page_present && home.signals.high_value_links) {
    for (const l of home.signals.high_value_links) {
      if (l.buckets.includes('contact')) {
        aggregate.contact_page_present = true;
        collectEvidence(evMap, 'contact_page_present', { url: l.href, kind: 'home', evidence: `Link "${l.label || l.href}"` });
      }
    }
  }
  if (!aggregate.service_page_present && home.signals.high_value_links) {
    for (const l of home.signals.high_value_links) {
      if (l.buckets.includes('service')) {
        aggregate.service_page_present = true;
        collectEvidence(evMap, 'service_page_present', { url: l.href, kind: 'home', evidence: `Link "${l.label || l.href}"` });
      }
    }
  }

  aggregate.has_task_path = Boolean(
    aggregate.booking_present || aggregate.online_order_present || aggregate.phone_present || aggregate.contact_form_present || aggregate.email_present || aggregate.whatsapp_present || aggregate.chat_present,
  );

  const evidence = {};
  for (const [key, entries] of Object.entries(evMap)) {
    evidence[key] = {
      status: 'OBSERVED',
      confidence: entries.length ? 'HIGH' : 'MEDIUM',
      pages: entries.slice(0, 12),
    };
  }

  return { aggregate, evidence };
}

// ── Branchen- & Ziel-Profile ────────────────────────────────────────────────
const INDUSTRY_PROFILES = {
  restaurant: {
    key: 'restaurant', label: 'Gastronomie, Café & Food',
    consumer: true, tasks: ['booking', 'order'], phoneAsTask: true,
    socialPrimary: ['instagram', 'facebook', 'whatsapp'], linkedin: false, whatsapp: true, formPreference: 'low',
  },
  hotel: {
    key: 'hotel', label: 'Hotel & Gastgewerbe',
    consumer: true, tasks: ['booking'], phoneAsTask: true,
    socialPrimary: ['instagram', 'facebook'], linkedin: false, whatsapp: false, formPreference: 'low',
  },
  medical: {
    key: 'medical', label: 'Praxis, Physio & Gesundheit',
    consumer: true, tasks: ['booking'], phoneAsTask: true,
    socialPrimary: [], linkedin: false, whatsapp: false, formPreference: 'medium',
  },
  automotive: {
    key: 'automotive', label: 'Kfz, Werkstatt & Autohaus',
    consumer: true, tasks: ['booking'], phoneAsTask: true,
    socialPrimary: ['instagram', 'facebook'], linkedin: false, whatsapp: true, formPreference: 'medium',
  },
  local: {
    key: 'local', label: 'Lokale Dienstleistung & Handwerk',
    consumer: true, tasks: ['leads'], phoneAsTask: true,
    socialPrimary: ['instagram', 'facebook', 'whatsapp'], linkedin: false, whatsapp: true, formPreference: 'high',
  },
  retail: {
    key: 'retail', label: 'Handel & E-Commerce',
    consumer: true, tasks: ['order', 'leads'], phoneAsTask: false,
    socialPrimary: ['instagram', 'facebook'], linkedin: false, whatsapp: true, formPreference: 'medium',
  },
  b2b: {
    key: 'b2b', label: 'B2B, Agentur & Beratung',
    consumer: false, tasks: ['leads'], phoneAsTask: true,
    socialPrimary: ['linkedin'], linkedin: true, whatsapp: false, formPreference: 'high',
  },
};

const INDUSTRY_MATCHERS = [
  [/gastronom|restaurant|cafe|café|imbiss|bäcker|baecker|metzger|konditor|food|essen|pizzeria|lieferdienst|catering|frühstück|fruehstueck|bar\b/, 'restaurant'],
  [/hotel|gastgewerbe|pension|ferienwohnung|bed\s*&\s*breakfast|tourismus|hotellerie|jugendherberge/, 'hotel'],
  [/physio|lüge?|krankengymnastik|therapie|praxis|arzt|ärzte|zahnarzt|medizin|klinik|gesundheit|ergotherapie|logopädie|heilpraktiker/, 'medical'],
  [/kfz|autohaus|werkstatt|autoreparatur|reifen|fahrzeug|automobil|autoteile|car\b/, 'automotive'],
  [/handwerk|handwerker|installateur|heizung|sanitär|schreinerei|tischler|fliesen|maler|dachdeck|elektro|elektriker|reinigung|entrümpel|umzug|gärtner|gaertner|land?schaft|schlüsseldienst|werbeagentur|reparatur|service\b|event|veranstaltung|location/, 'local'],
  [/shop|einzelhandel|mode|kleidung|möbel|moebel|warenhaus|e-?commerce|b2c|handel|markt\b/, 'retail'],
  [/b2b|agentur|beratung|consulting|it\b|software|saas|coaching|marketing|websites?|entwicklung|finanzen|versicherung|recht\b|kanzlei/, 'b2b'],
];

const GOAL_PROFILES = {
  booking: { key: 'booking', tasks: ['booking'], label: 'Termine & Buchungen' },
  order: { key: 'order', tasks: ['order'], label: 'Online-Bestellungen' },
  leads: { key: 'leads', tasks: ['leads'], label: 'Kundenanfragen & Leads' },
  brand: { key: 'brand', tasks: [], label: 'Marke & Bekanntheit' },
  visit: { key: 'visit', tasks: [], label: 'Besuche & Vor-Ort-Frequenz' },
  generic: { key: 'generic', tasks: [], label: 'Allgemein' },
};

const GOAL_MATCHERS = [
  [/termin|buch|reservier|appointment|booking/i, 'booking'],
  [/bestell|order|shop|kauf|verkauf|e-?commerce|warenkorb/i, 'order'],
  [/anfrag|lead|akquis|kontakt|formular|kunden/i, 'leads'],
  [/besuch|besuche|gäste|gaeste|laufkund|frequenz|footfall|vor\s*ort/i, 'visit'],
  [/marke|brand|bekanntheit|vertrauen|präsenz|praesenz|gekauft|bekannt/i, 'brand'],
];

function normalizeIndustryKey(industryRaw) {
  const t = String(industryRaw || '').toLocaleLowerCase('de-DE');
  for (const [re, key] of INDUSTRY_MATCHERS) {
    if (re.test(t)) return key;
  }
  return 'b2b';
}

function normalizeGoalKey(goalRaw) {
  const t = String(goalRaw || '');
  for (const [re, key] of GOAL_MATCHERS) {
    if (re.test(t)) return key;
  }
  return 'generic';
}

// ── Evidence-gebundene Findings & Scoring ───────────────────────────────────
function evaluate({ home, pages, aggregate, evidence, profile, goalProfile, desiredTasks }) {
  const deltas = { clarity: 0, conversion: 0, customer_journey: 0, visibility: 0, automation: 0, sales: 0 };
  const findings = [];
  let seq = 0;
  const mk = (fields) => {
    seq += 1;
    findings.push({
      id: `F${String(seq).padStart(2, '0')}`,
      area: fields.area,
      severity: fields.severity || 'hinweis',
      origin: fields.origin || 'core',
      title: fields.title,
      text: fields.text,
      evidence: fields.evidence || '',
      evidenceStatus: fields.evidenceStatus || 'INFERRED',
      confidence: fields.confidence || 'MEDIUM',
      evidencePages: fields.evidencePages || [],
    });
    if (fields.delta && deltas[fields.area] !== undefined) deltas[fields.area] += fields.delta;
  };
  const pageUrls = (list) => list.slice(0, 5);

  const homeIndexable = !home.signals.is_spa_shell;
  const homeUrl = home.signals.url;
  const sepHome = [homeUrl];
  const allChecked = (home.signals ? [home] : []).concat(pages.filter((p) => p.signals));

  // ── visibility ──
  if (aggregate.noindex) {
    mk({
      area: 'visibility', severity: 'kritisch', delta: -35,
      title: 'Startseite ist auf "noindex" gesetzt',
      text: 'Die Startseite trägt ein "noindex" für Suchmaschinen — sie kann über Google nicht gefunden werden. Mögliche Folge: keine organische Besucherzufuhr über die Startseite. Aktion: "noindex" entfernen, SEO-Freigabe prüfen.',
      evidence: 'noindex-Meta auf der Startseite gefunden',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }
  if (!aggregate.meta_description_present) {
    mk({
      area: 'visibility', severity: 'hoch', delta: -10,
      title: 'Keine Meta-Description auf der Startseite',
      text: 'Die Startseite hat keine Meta-Description. Dadurch kontrolliert die Website nicht, welchen Snippet-Text Google anzeigt — das kann die Klickrate in den Suchergebnissen senken. Aktion: prägnante Meta-Description (150–160 Zeichen) ergänzen.',
      evidence: 'Kein meta[name=description] im HTML-Head',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }
  if (!aggregate.canonical_present) {
    mk({
      area: 'visibility', severity: 'hinweis', delta: -5,
      title: 'Kein Canonical-Tag auf der Startseite',
      text: 'Ohne Canonical muss Google raten, welche URL-Version die maßgebliche ist. Potenzielle Folge: zersplitterte SEO-Signale. Aktion: Eindeutigen Canonical-Link setzen.',
      evidence: 'Kein link[rel=canonical] im HTML-Head',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }
  if (!aggregate.opengraph_present) {
    mk({
      area: 'visibility', severity: 'hinweis', delta: -8,
      title: 'Keine OpenGraph-Tags',
      text: 'Beim Teilen der URL (WhatsApp, Instagram, Facebook) erscheint ohne OpenGraph nur der nackte Link. Das kann geteilte Inhalte unauffälliger wirken lassen. Aktion: OpenGraph-Titel/-Bild/-Beschreibung ergänzen.',
      evidence: 'Kein meta[property=og:*] im HTML-Head',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  } else {
    if (!aggregate.og_title_present) {
      mk({ area: 'visibility', delta: -3, title: 'OpenGraph-Titel (og:title) fehlt', text: 'Der OpenGraph-Block ist unvollständig — geteilte Links können ohne aussagekräftigen Titel erscheinen. Aktion: og:title ergänzen.', evidence: 'og:title nicht gefunden', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
    }
    if (!aggregate.og_image_present) {
      mk({ area: 'visibility', delta: -3, title: 'OpenGraph-Bild (og:image) fehlt', text: 'Ohne og:image erscheinen geteilte Links ohne Vorschaubild. Aktion: og:image ergänzen.', evidence: 'og:image nicht gefunden', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
    }
  }
  if (!aggregate.lang_present) {
    mk({ area: 'visibility', delta: -2, title: 'Sprachattribut (lang) fehlt', text: 'Das lang-Attribut im HTML-Tag fehlt. Es ist wichtig für Barrierefreiheit und kann Suchmaschinen beim Einordnen der Sprache helfen. Aktion: lang="de" setzen.', evidence: 'Kein lang-Attribut auf <html>', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  }

  // ── clarity ──
  if (!aggregate.title_present) {
    mk({ area: 'clarity', severity: 'hoch', delta: -12, title: 'Kein Seitentitel (<title>)', text: 'Die Startseite hat keinen <title>. Der Titel ist das erste, was Besucher im Tab und in Google sehen. Aktion: aussagekräftigen Title setzen.', evidence: 'Kein <title> gefunden', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  } else if (aggregate.title_length < 15) {
    mk({ area: 'clarity', delta: -6, title: 'Seitentitel sehr kurz', text: `Der Seitentitel ist mit ${aggregate.title_length} Zeichen sehr kurz und sagt Google/Besuchern zu wenig über das Angebot. Aktion: Titel auf 30–60 Zeichen ausbauen.`, evidence: `title=${aggregate.title_text}`, evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  } else if (aggregate.title_length > 70) {
    mk({ area: 'clarity', delta: -3, title: 'Seitentitel wird abgeschnitten', text: `Der Titel hat ${aggregate.title_length} Zeichen und wird in Suchergebnissen gekürzt. Aktion: wichtige Keywords in die ersten ~50 Zeichen.`, evidence: `title=${aggregate.title_text}`, evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  }

  if (homeIndexable) {
    if (aggregate.h1_count === 0) {
      mk({
        area: 'clarity', severity: 'hoch', delta: -18,
        title: 'Keine H1-Hauptüberschrift auf der Startseite',
        text: 'Ohne H1 ist das Angebot auf den ersten Blick schwerer erfassbar. Mögliche Folge: höhere Absprungrate. Aktion: aussagekräftige H1 mit Nutzenversprechen einfügen.',
        evidence: 'h1_count=0 auf der Startseite',
        evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
      });
    } else if (aggregate.text_length < 600) {
      mk({
        area: 'clarity', delta: -8,
        title: 'Sehr wenig sichtbarer Text auf der Startseite',
        text: `Die Startseite enthält nur ${aggregate.text_length} Zeichen sichtbaren Text. Besucher können Angebot und Nutzen dadurch schlechter bewerten. Aktion: Angebot & nächste Schritte in 2–3 Absätzen erklären.`,
        evidence: `text_length=${aggregate.text_length}`,
        evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
      });
    }
  } else {
    mk({
      area: 'clarity', origin: 'cross', severity: 'hinweis',
      title: 'Startseite rendert per JavaScript',
      text: 'Die Startseite rendert Inhalte per JS (SPA-Shell). Head-Signale wurden geprüft; Text, CTAs und Kontaktwege konnten im Roh-HTML nicht vollständig verifiziert werden.',
      evidence: 'SPA-Shell erkannt (wenig Text + App-Root)',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }

  // ── conversion / sales: Kontakt- & Aufgabenerfüllung ──
  const hasPhone = aggregate.phone_present;
  const hasForm = aggregate.contact_form_present;
  const hasEmail = aggregate.email_present;
  const hasWrittenContact = hasForm || hasEmail || aggregate.whatsapp_present || aggregate.chat_present;
  const hasAnyContact = hasPhone || hasForm || hasEmail || aggregate.booking_present || aggregate.online_order_present;

  if (!hasAnyContact) {
    mk({
      area: 'conversion', severity: 'kritisch', delta: -20,
      title: 'Kein sichtbarer Kontakt- oder Aktionsweg gefunden',
      text: `Auf keiner der geprüften Seiten wurde ein Kontaktweg (Telefon, E-Mail, Formular) oder Buchungs-/Bestellpfad im Roh-HTML gefunden. Mögliche Folge: interessierte Besucher können nicht weiterkommen. Aktion: Telefonnummer und/oder Kontaktformular prominent platzieren.`,
      evidence: 'kein Telefon, keine E-Mail, kein Formular, kein Booking/Order auf geprüften Seiten',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM',
      evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
    mk({
      area: 'sales', severity: 'kritisch', delta: -15,
      title: 'Akquise ohne Auffangnetz',
      text: 'Da weder Telefon, E-Mail, Formular noch Buchungs-/Bestellweg sichtbar sind, gibt es potenziell keine Möglichkeit, Interesse in eine Anfrage zu verwandeln. Aktion: mindestens einen direkten Kontaktweg anbieten.',
      evidence: 'kein Kontaktweg auf geprüften Seiten',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM',
      evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  } else if (hasPhone && !hasWrittenContact) {
    if (profile.formPreference !== 'low') {
      mk({
        area: 'conversion', severity: 'hinweis', delta: -6,
        title: 'Kontakt nur telefonisch',
        text: 'Es wurde eine Telefonnummer gefunden, aber kein Kontakt-/Anfrageformular. Manche Interessenten bevorzugen schriftliche Anfragen. Aktion: kurzes Formular ergänzen, sofern es zur Branche passt.',
        evidence: 'Telefon gefunden, kein Formular',
        evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls((evidence.phone_present?.pages || []).map((p) => p.url)),
      });
    }
  } else if (!hasPhone && hasForm && profile.phoneAsTask && (goalProfile.key === 'generic' || goalProfile.key === 'booking')) {
    mk({
      area: 'conversion', severity: 'hinweis', delta: -4,
      title: 'Keine Telefonnummer gefunden',
      text: `In ${profile.label} ist das Telefon oft der schnellste Kontakt-/Terminweg. Mögliche Folge: weniger kurze Anfragen. Aktion: Nummer oben rechts platzieren.`,
      evidence: 'keine Telefonnummer im Roh-HTML der geprüften Seiten',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }

  // Aufgabe: Termin/Buchung
  if (desiredTasks.includes('booking') && !aggregate.booking_present) {
    const goalDriven = goalProfile.key === 'booking';
    if (aggregate.phone_present) {
      mk({
        area: 'conversion', severity: goalDriven ? 'hoch' : 'hinweis', delta: goalDriven ? -8 : -4,
        title: 'Kein Online-Buchungs-/Terminpfad',
        text: `Es gibt keinen eigenen Online-Termin-/Buchungspfad; Termine sind aktuell nur telefonisch möglich. Das kann zu Mehraufwand führen, schränkt aber nicht völlig ab. Aktion: Termin-/Buchungsseite mit Button direkt anbieten.`,
        evidence: 'booking_present=false, Telefon vorhanden',
        evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
      });
    } else {
      mk({
        area: 'conversion', severity: 'hoch', delta: -10,
        title: 'Kein Termin-/Buchungspfad auffindbar',
        text: `Für ${profile.label} ist eine Termin-/Buchungsmöglichkeit typischerweise der wichtigste Weg — auf den geprüften Seiten wurde weder ein Buchungspfad noch ein Formular oder eine Telefonnummer gefunden. Aktuell ist unklar, wie Besucher einen Termin erhalten. Aktion: Terminbuchung oder zumindest Telefonnummer prominent anbieten (oder den eingebauten Buchungsdienst sichtbar verlinken).`,
        evidence: 'booking_present=false, kein Kontaktweg',
        evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
      });
    }
  }

  // Aufgabe: Online-Bestellung
  if (desiredTasks.includes('order') && !aggregate.online_order_present) {
    const goalDriven = goalProfile.key === 'order';
    if (aggregate.phone_present) {
      mk({
        area: 'conversion', severity: goalDriven ? 'hoch' : 'hinweis', delta: goalDriven ? -8 : -4,
        title: 'Kein Online-Bestellweg',
        text: 'Es gibt keinen erkennbaren Online-Bestell-/Shop-Pfad (Bestellung aktuell nur telefonisch möglich). Mögliche Folge: Bestellungen außerhalb der Öffnungszeiten bleiben liegen. Aktion: Bestellweg online anbieten.',
        evidence: 'online_order_present=false, Telefon vorhanden',
        evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
      });
    } else {
      mk({
        area: 'conversion', severity: 'hoch', delta: -10,
        title: 'Kein Bestell-/Shop-Pfad auffindbar',
        text: `Für ${profile.label} ist ein Bestellweg zentral — auf den geprüften Seiten wurde weder ein Shop/Bestellpfad noch ein Kontaktweg gefunden. Mögliche Folge: verpasste Bestellungen. Aktion: Bestellmöglichkeit sichtbar anbieten.`,
        evidence: 'online_order_present=false, kein Kontaktweg',
        evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
      });
    }
  }

  if (homeIndexable && !aggregate.cta_present) {
    mk({
      area: 'conversion', severity: 'hoch', delta: -18,
      title: 'Keine klare Handlungsaufforderung (CTA) auf der Startseite',
      text: 'Auf der Startseite sind keine klaren CTA-Begriffe ("Kontakt", "Termin", "Angebot" …) im Roh-HTML erkennbar. Mögliche Folge: Besucher wissen nicht, was als Nächstes zu tun ist. Aktion: mindestens einen CTA-Button oberhalb der Falzlinie.',
      evidence: 'cta_present=false auf der Startseite',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: sepHome,
    });
  }

  // ── customer_journey ──
  if (!aggregate.has_task_path) {
    mk({
      area: 'customer_journey', severity: 'hinweis', delta: -8,
      title: 'Keine strukturierte Anfrage-/Aktions-Strecke',
      text: 'Es wurde keine strukturierte Möglichkeit gefunden, Kontakt aufzunehmen oder eine Aktion (Buchung/Bestellung) anzustoßen. Formulare senken die Kontakthürde. Aktion: Kontaktformular oder Buchungs-/Bestellpfad einbauen.',
      evidence: 'has_task_path=false',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }

  if (!aggregate.social_present && (!profile.consumer || goalProfile.key === 'brand')) {
    const isConsumer = profile.consumer;
    const socialHint = isConsumer
      ? `Social-Profile (z. B. ${profile.socialPrimary.filter((s) => s !== 'whatsapp').slice(0, 2).join('/') || 'Instagram/Facebook'}) fehlen auf den geprüften Seiten.`
      : 'Social-Profile (z. B. LinkedIn) fehlen auf den geprüften Seiten.';
    mk({
      area: 'customer_journey', delta: -5,
      title: 'Keine Social-Profile verlinkt',
      text: `${socialHint} Viele Besucher prüfen soziale Profile vor der Kontaktaufnahme; deren Fehlen kann Vertrauen kosten. Aktion: passende Profile im Footer verlinken.`,
      evidence: 'social_present=false',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  } else if (profile.linkedin && !aggregate.socials.includes('linkedin')) {
    mk({
      area: 'customer_journey', delta: -4,
      title: 'LinkedIn-Profil fehlt',
      text: `Für ${profile.label} ist LinkedIn ein wichtiges B2B-Vertrauenssignal — das Profil ist auf den geprüften Seiten nicht verlinkt. Aktion: LinkedIn-Profil im Footer verlinken.`,
      evidence: 'socials=' + aggregate.socials.join(',') + ' (kein linkedin)',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }

  // ── automation ──
  if (!aggregate.jsonld_present) {
    mk({
      area: 'automation', delta: -6,
      title: 'Keine strukturierten Daten (JSON-LD)',
      text: 'Ohne JSON-LD können Rich-Results in Google (LocalBusiness, Sterne, FAQ) nicht genutzt werden — die Suchergebnisse können dadurch flacher wirken als bei Mitbewerbern mit Rich-Results. Aktion: LocalBusiness-/FAQ-Schema einbauen.',
      evidence: 'jsonld_present=false',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }
  if (aggregate.img_total > 0 && (aggregate.img_without_alt / aggregate.img_total) > 0.5) {
    mk({
      area: 'automation', delta: -4,
      title: 'Viele Bilder ohne Alt-Text',
      text: `${aggregate.img_without_alt} von ${aggregate.img_total} Bildern haben keinen Alt-Text. Alt-Texte sind wichtig für Barrierefreiheit und SEO. Aktion: Alt-Texte bei allen nutzenstiftenden Bildern ergänzen.`,
      evidence: `alt=missing ${aggregate.img_without_alt}/${aggregate.img_total}`,
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }

  // ── sales: Rechtliches (nur An-/Abwesenheit auf geprüften Seiten) ──
  if (!aggregate.impressum_present) {
    mk({
      area: 'sales', severity: 'hoch', delta: -10,
      title: 'Kein Impressum-Hinweis gefunden',
      text: 'Für geschäftsmäßige Websites ist in Deutschland ein Impressum vorgeschrieben (§5 DDG). Auf den geprüften Seiten wurde kein Impressum-Hinweis gefunden; das kann das Vertrauen senken. Aktion: Impressum-Seite anlegen und im Footer verlinken. (Keine Rechtsauskunft.)',
      evidence: 'impressum_present=false auf geprüften Seiten',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }
  if (!aggregate.datenschutz_present) {
    mk({
      area: 'sales', severity: 'hoch', delta: -8,
      title: 'Kein Datenschutz-Hinweis gefunden',
      text: 'Auf den geprüften Seiten wurde kein Datenschutz-Hinweis gefunden. Eine Datenschutzerklärung ist in Deutschland üblich und Pflichtbestandteil vieler Websites (DSGVO). Mögliche Folge: Vertrauensverlust. Aktion: DSGVO-konforme Datenschutzerklärung verlinken.',
      evidence: 'datenschutz_present=false auf geprüften Seiten',
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }

  // ── Cross-Reference: SEO-Basissignale ──
  const seoMissing = [!aggregate.meta_description_present, !aggregate.opengraph_present, !aggregate.canonical_present];
  const missingCount = seoMissing.filter(Boolean).length;
  if (missingCount >= 2) {
    mk({
      area: 'visibility', origin: 'cross', severity: 'hoch', delta: missingCount === 3 ? -8 : -5,
      title: 'Mehrere SEO-Basissignale fehlen gleichzeitig',
      text: `${missingCount} von 3 SEO-Basissignalen (Meta-Description, OpenGraph, Canonical) fehlen auf der Startseite. Gemeinsam deutet das auf eine ungepflegte digitale Präsenz hin — potenziell deutlich weniger Sichtbarkeit. Aktion: Signale vollständig ergänzen.`,
      evidence: `missing ${missingCount}/3 (meta-Description, OpenGraph, Canonical)`,
      evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome,
    });
  }

  if (homeIndexable && aggregate.cta_present && !hasAnyContact) {
    mk({
      area: 'conversion', origin: 'cross', severity: 'hoch', delta: -5,
      title: 'CTA vorhanden, aber kein nächster Schritt',
      text: 'Die Startseite erzeugt Interesse (CTA erkennbar), aber auf den geprüften Seiten ist kein direkter Kontaktweg sichtbar. Mögliche Folge: Conversion-Kette bricht beim nächsten Schritt ab. Aktion: Kontaktweg direkt am CTA.',
      evidence: 'cta_present=true, kein Kontaktweg',
      evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: sepHome,
    });
  }

  // ── Quick Wins & Priorisierte Empfehlungen ──
  const recommendations = [];
  const rec = (r) => recommendations.push({
    ...r,
    evidenceStatus: r.evidenceStatus || 'INFERRED',
    confidence: r.confidence || 'MEDIUM',
    evidencePages: r.evidencePages || [],
  });

  if (aggregate.noindex) {
    rec({ priority: 'kritisch', effort: 'niedrig', title: 'noindex entfernen', action: '"noindex" aus dem Meta-Robots-Tag der Startseite entfernen und Indexierung prüfen.', reason: 'Ohne Indexierung ist organisches Wachstum potenziell blockiert.', evidence: 'noindex-Meta gefunden', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  }
  if (desiredTasks.includes('booking') && !aggregate.booking_present) {
    rec({
      priority: goalProfile.key === 'booking' ? 'kritisch' : 'hoch', effort: 'mittel',
      title: 'Online-Termin-/Buchungsweg anbieten',
      action: 'Buchungssystem verlinken oder eine Termin/Buchungsseite mit sichtbarem Button anlegen.',
      reason: `Für ${profile.label} ist ein Termin-/Buchungsweg typischerweise der kürzeste Weg zur Umsetzung.`,
      evidence: 'booking_present=false', evidenceStatus: 'INFERRED', confidence: 'MEDIUM',
      evidencePages: pageUrls(allChecked.map((p) => p.signals.url)),
    });
  }
  if (desiredTasks.includes('order') && !aggregate.online_order_present) {
    rec({ priority: goalProfile.key === 'order' ? 'kritisch' : 'hoch', effort: 'mittel', title: 'Online-Bestellweg sichtbar machen', action: 'Shop/Bestellseite verlinken oder Bestellformular anbieten.', reason: `Für ${profile.label} senkt ein Bestellweg die Hürde zur Bestellung deutlich.`, evidence: 'online_order_present=false', evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  }
  if (!hasAnyContact) {
    rec({ priority: 'hoch', effort: 'niedrig', title: 'Telefonnummer und Kontaktweg platzieren', action: 'Telefonnummer oben rechts und/oder Kontaktformular auf jeder relevanten Seite.', reason: 'Ohne sichtbaren Kontaktweg können Interessenten nicht weiterkommen.', evidence: 'kein Kontaktweg gefunden', evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  }
  if (!hasForm && !aggregate.has_task_path && profile.formPreference !== 'low') {
    rec({ priority: 'mittel', effort: 'niedrig', title: 'Kontaktformular ergänzen', action: 'Kurzes Formular (3–4 Felder) auf der Kontaktseite.', reason: 'Formulare senken die Kontakthürde für schriftliche Anfragen.', evidence: 'contact_form_present=false, kein Task-Pfad', evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  }
  if (profile.linkedin && !aggregate.socials.includes('linkedin')) {
    rec({ priority: 'mittel', effort: 'niedrig', title: 'LinkedIn-Profil verlinken', action: 'LinkedIn-Profil im Footer verlinken.', reason: `Für ${profile.label} ist LinkedIn ein wichtiges B2B-Vertrauenssignal.`, evidence: 'kein linkedin verlinkt', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  } else if (!aggregate.social_present && profile.consumer && goalProfile.key === 'brand') {
    const platforms = profile.socialPrimary.filter((s) => s !== 'whatsapp').slice(0, 2);
    if (platforms.length) {
      rec({ priority: 'mittel', effort: 'niedrig', title: 'Relevante Social-Profile verlinken', action: `${platforms.join('/')}-Profil(e) im Footer verlinken.`, reason: `${profile.label} lebt stark von visueller Präsenz und Empfehlungen.`, evidence: 'social_present=false', evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
    }
  }
  if (profile.whatsapp && !aggregate.whatsapp_present && !aggregate.contact_form_present) {
    rec({ priority: 'niedrig', effort: 'niedrig', title: 'WhatsApp-Kanal anbieten', action: 'WhatsApp-Kontaktlink auf der Kontakt-/Bestellseite einfügen.', reason: `Für ${profile.label} ist WhatsApp ein niedrigschwelliger Kontaktweg.`, evidence: 'whatsapp_present=false', evidenceStatus: 'INFERRED', confidence: 'MEDIUM', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  }
  if (!aggregate.meta_description_present) {
    rec({ priority: 'hoch', effort: 'niedrig', title: 'Meta-Description ergänzen', action: 'Prägnante Meta-Description (150–160 Zeichen) für die Startseite.', reason: 'Kontrolliert das Google-Snippet und kann die Klickrate erhöhen.', evidence: 'meta_description fehlt', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  }
  if (!aggregate.jsonld_present) {
    rec({ priority: 'mittel', effort: 'mittel', title: 'Strukturierte Daten (JSON-LD) einbauen', action: 'LocalBusiness-/FAQ-Schema im Header einfügen.', reason: 'Ermöglicht Rich-Results in Google.', evidence: 'jsonld_present=false', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: pageUrls(allChecked.map((p) => p.signals.url)) });
  }
  if (!aggregate.lang_present) {
    rec({ priority: 'niedrig', effort: 'niedrig', title: 'Sprachattribut setzen', action: 'lang="de" im HTML-Tag ergänzen.', reason: 'Wichtig für Barrierefreiheit und Sprachsignal.', evidence: 'lang fehlt', evidenceStatus: 'OBSERVED', confidence: 'HIGH', evidencePages: sepHome });
  }
  staticPrioritySort(recommendations);

  const quickWins = recommendations
    .filter((r) => r.effort === 'niedrig')
    .slice(0, 5)
    .map((r) => r.title);

  // ── Score-Erklärungen ──
  const scoreExplanations = buildScoreExplanations(deltas, findings, quickWins);

  // ── Gaps / Limitations ──
  const gaps = [];
  for (const p of pages) {
    if (!p.ok) {
      gaps.push(`"${p.url}" konnte nicht geprüft werden (${p.skipped || p.error || 'unbekannter Fehler'}).`);
    } else if (p.signals && p.signals.is_spa_shell) {
      gaps.push(`"${p.url}" rendert per JavaScript — Inhalte (Texte, CTAs, Kontaktwege) konnten dort nicht vollständig verifiziert werden.`);
    }
  }
  if (!hasPhone) {
    gaps.push('Auf keiner geprüften Seite wurde eine Telefonnummer im Roh-HTML gefunden. Per JavaScript nachgeladene Nummern sind nicht ausgeschlossen.');
  }
  if (home.signals.is_spa_shell) {
    gaps.push('Die Startseite liefert kaum statisches HTML (SPA-Shell) — die Analyse stützt sich auf Head-/Meta-Signale und unterseitenbasierte Fähigkeiten.');
  }

  return {
    deltas, findings, routes: recommendations, quickWins, scoreExplanations, gaps,
  };
}

function staticPrioritySort(items) {
  const order = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
  items.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
}

function buildScoreExplanations(deltas, findings, quickWins) {
  const dimMeta = {
    clarity: { label: 'Angebotsklarheit' },
    conversion: { label: 'Conversion' },
    customer_journey: { label: 'Kundenreise' },
    visibility: { label: 'Sichtbarkeit' },
    automation: { label: 'Automatisierung' },
    sales: { label: 'Vertrieb' },
  };
  const result = [];
  for (const [dim, delta] of Object.entries(deltas)) {
    if (delta === 0) continue;
    const meta = dimMeta[dim] || { label: dim };
    const dimFindings = findings.filter((f) => f.area === dim);
    const causes = [...new Set(dimFindings.slice(0, 3).map((f) => f.title))];
    const relatedWin = quickWins.find((w) => causes.some((c) => w && c.split(' ')[0] && w.toLowerCase().includes(c.split(' ')[0].toLowerCase()))) || null;
    const severity = delta <= -20 ? 'kritisch' : delta <= -10 ? 'hoch' : 'hinweis';
    const causeStr = causes.length > 2 ? `${causes.slice(0, 2).join(', ')} und ${causes.length - 2} weitere` : causes.join(' und ');
    result.push({
      dimension: dim,
      dimensionLabel: meta.label,
      deltaImpact: Math.round(delta),
      severity,
      explanation: delta < 0
        ? `${meta.label} wurde um ${Math.abs(Math.round(delta))} ${Math.abs(delta) === 1 ? 'Punkt' : 'Punkte'} gedrückt, weil ${causeStr}.`
        : `${meta.label} profitiert um +${Math.round(delta)} Punkte durch gute Signale.`,
      causes,
      quickWin: relatedWin || null,
    });
  }
  return result.sort((a, b) => a.deltaImpact - b.deltaImpact);
}

// ── Haupt-Pipeline ──────────────────────────────────────────────────────────
export async function runAnalysis({ url, industry, goal, fetchImpl = fetch, dnsLookup = realDnsLookup, now = Date.now }) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const clock = typeof now === 'function' ? now : () => now;
  const started = clock();

  const homeProfile = normalizeIndustryKey(industry);
  const industryProfile = INDUSTRY_PROFILES[homeProfile];
  const goalKey = normalizeGoalKey(goal);
  const goalProfile = GOAL_PROFILES[goalKey];
  const desiredTasks = goalProfile.key === 'generic' ? [...industryProfile.tasks] : [...goalProfile.tasks];

  // Startseite
  const homeFetched = await safeFetchHtml(normalized, { fetchImpl, dnsLookup });
  const homeFetchMs = clock() - started;
  if (!homeFetched.html || homeFetched.status >= 400) {
    return {
      ok: true,
      analysisType: 'fallback_estimate',
      engineVersion: '3.2.0',
      reason: homeFetched.tooLarge ? 'response_too_large' : 'website_fetch_failed',
      websiteUrl: normalized,
      httpStatus: homeFetched.status || 0,
      industry, goal,
      gaps: [
        homeFetched.tooLarge
          ? 'Die Startseite ist zu groß für eine vollständige Analyse.'
          : `Die Startseite konnte nicht geladen werden (HTTP ${homeFetched.status || 0}).`,
      ],
    };
  }

  const homeUrl = homeFetched.finalUrl;
  const home = {
    url: homeUrl,
    role: 'home',
    kind: 'home',
    httpStatus: homeFetched.status,
    fetchMs: homeFetchMs,
    signals: extractPageSignals(homeFetched.html, homeUrl, 'home', { discoverLinks: true }),
  };

  // Hochwertige Unterseiten entdecken (nur gleichoriginig, max 4)
  const candidateLinks = home.signals.high_value_links || [];
  const selected = selectHighValuePages(candidateLinks, MAX_HIGH_VALUE_PAGES).filter((c) => c.url !== homeUrl);

  const subStart = clock();
  const subResults = await Promise.allSettled(selected.map(async (cand) => {
    const t0 = clock();
    try {
      const fetched = await safeFetchHtml(cand.url, { fetchImpl, dnsLookup });
      const ms = clock() - t0;
      if (!fetched.html || fetched.status >= 400) {
        return {
          url: cand.url, label: cand.label, bucket: cand.bucket, role: 'highvalue', kind: cand.bucket,
          ok: false, httpStatus: fetched.status, fetchMs: ms,
          skipped: fetched.tooLarge ? 'response_too_large' : `http_${fetched.status || 'error'}`,
        };
      }
      return {
        url: fetched.finalUrl, label: cand.label, bucket: cand.bucket, role: 'highvalue', kind: cand.bucket,
        ok: true, httpStatus: fetched.status, fetchMs: ms,
        signals: extractPageSignals(fetched.html, fetched.finalUrl, cand.bucket),
      };
    } catch (err) {
      return {
        url: cand.url, label: cand.label, bucket: cand.bucket, role: 'highvalue', kind: cand.bucket,
        ok: false, httpStatus: 0, fetchMs: clock() - t0, error: (err && err.code) || 'FETCH_ERROR',
      };
    }
  }));
  const pages = subResults.map((r, i) => (r.status === 'fulfilled' ? r.value : {
    url: selected[i] ? selected[i].url : '', role: 'highvalue', ok: false, httpStatus: 0, fetchMs: 0,
    skipped: 'internal_error',
  })).filter(Boolean);

  const totalMs = clock() - started;

  const { aggregate, evidence } = aggregatePages(home, pages);

  const evaluation = evaluate({
    home, pages, aggregate, evidence,
    profile: industryProfile, goalProfile, desiredTasks,
  });

  const crossFindings = evaluation.findings.filter((f) => f.origin === 'cross');
  const orderedFindings = [...evaluation.findings].sort((a, b) => sevRank(a) - sevRank(b));

  const checkedPages = [home, ...pages].map((p) => p.skipped || p.error || !p.signals
    ? {
        url: p.url, kind: p.kind, role: p.role, ok: false,
        httpStatus: p.httpStatus || 0, fetchMs: p.fetchMs || 0,
        skipped: p.skipped || null, error: p.error || null,
      }
    : {
        url: p.url, kind: p.kind, role: p.role, ok: true,
        httpStatus: p.httpStatus, fetchMs: p.fetchMs,
        signals: {
          title_present: p.signals.title_present,
          title_length: p.signals.title_length,
          meta_description_present: p.signals.meta_description_present,
          h1_count: p.signals.h1_count,
          text_length: p.signals.text_length,
          cta_present: p.signals.cta_present,
          form_present: p.signals.form_present,
          contact_form_present: p.signals.contact_form_present,
          booking_present: p.signals.booking_present,
          order_present: p.signals.order_present,
          whatsapp_present: p.signals.whatsapp_present,
          chat_present: p.signals.chat_present,
          phone_displays: (p.signals.phones || []).map((ph) => ph.display).slice(0, 3),
          email_displays: (p.signals.emails || []).slice(0, 2),
          socials: p.signals.socials || [],
          is_spa_shell: p.signals.is_spa_shell,
          noindex: p.signals.noindex,
        },
      });

  const allFindings = orderedFindings;
  for (const dim of Object.keys(evaluation.deltas)) {
    if (evaluation.deltas[dim] < -45) evaluation.deltas[dim] = -45;
    evaluation.deltas[dim] = Math.round(evaluation.deltas[dim]);
  }

  return {
    ok: true,
    analysisType: 'live_website_scan',
    engineVersion: '3.2.0',
    websiteUrl: normalized,
    finalUrl: homeUrl,
    httpStatus: home.httpStatus,
    fetchMs: totalMs,
    industry, goal,
    industryProfile: { key: industryProfile.key, label: industryProfile.label },
    goalProfile: { key: goalProfile.key, label: goalProfile.label },
    checkedPages,
    signals: aggregate,
    evidence,
    scoreDeltas: evaluation.deltas,
    findings: allFindings,
    crossFindings,
    recommendations: evaluation.routes,
    quickWins: evaluation.quickWins,
    scoreExplanations: evaluation.scoreExplanations,
    gaps: evaluation.gaps,
    summary: {
      checked: true,
      page_count: checkedPages.length,
      checked_page_count: checkedPages.filter((p) => p.ok).length,
      finding_count: allFindings.length,
      critical: allFindings.filter((f) => f.severity === 'kritisch').map((f) => f.title),
      gap_count: evaluation.gaps.length,
    },
  };
}

function sevRank(f) {
  return { kritisch: 0, hoch: 1, hinweis: 2 }[f.severity] ?? 2;
}

function clampStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'METHOD_NOT_ALLOWED' });
    return;
  }
  const body = req.body || {};
  const websiteUrl = clampStr(body.websiteUrl || body.website_url || body.url, 300);
  const industry = clampStr(body.industry, 120);
  const goal = clampStr(body.goal, 120);

  if (!websiteUrl) {
    res.status(400).json({ ok: false, reason: 'MISSING_URL' });
    return;
  }

  try {
    const result = await runAnalysis({ url: websiteUrl, industry, goal });
    res.status(200).json(result);
  } catch (err) {
    const code = err && err.code ? err.code : 'FETCH_ERROR';
    if (code === 'PRIVATE_HOST' || code === 'BAD_PROTOCOL' || code === 'INVALID_URL') {
      res.status(400).json({ ok: false, reason: code });
      return;
    }
    res.status(200).json({
      ok: true,
      analysisType: 'fallback_estimate',
      engineVersion: '3.2.0',
      reason: code === 'DNS_FAILED' ? 'dns_failed' : 'website_fetch_failed',
      websiteUrl: /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`,
      httpStatus: 0,
      industry, goal,
      gaps: [code === 'DNS_FAILED' ? 'DNS-Auflösung fehlgeschlagen.' : 'Die Website konnte nicht abgerufen werden.'],
    });
  }
}
