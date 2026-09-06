import test from 'node:test';
import assert from 'node:assert/strict';
import { findPhones, runAnalysis } from '../api/diagnosis/analyze.mjs';

const dnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];
const htmlResponse = (html, status = 200) => new Response(html, {
  status,
  headers: { 'content-type': 'text/html; charset=utf-8' },
});

function mockSite(routes) {
  return async (url) => {
    const u = new URL(url);
    const html = routes[u.pathname];
    if (html === undefined) return htmlResponse('not found', 404);
    return htmlResponse(html, 200);
  };
}

test('detects German local phone formats and rejects dates', () => {
  assert.equal(findPhones('', '0731 40310290').length > 0, true);
  assert.equal(findPhones('', '0731 88 03 54-00').length > 0, true);
  assert.equal(findPhones('', '+49 (731) 940 20 110').length > 0, true);
  assert.equal(findPhones('', 'Stand: 07.09.2026').length, 0);
});

test('multi-page crawl finds phone on contact subpage', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Physio Vital Ulm</title></head><body><h1>Physio</h1><a href="/kontakt">Kontakt</a></body></html>',
    '/kontakt': '<html><body><h1>Kontakt</h1><p>0731 940 20 110</p><p>info@example.de</p></body></html>',
  });  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Physiotherapie', goal: 'mehr Termine', fetchImpl, dnsLookup,
  });
  assert.equal(result.analysisType, 'live_website_scan');
  assert.equal(result.engineVersion, '3.2.0');
  assert.equal(result.signals.phone_present, true);
  assert.equal(result.signals.contact_page_present, true);
  assert.equal(result.findings.some((f) => f.severity === 'kritisch' && /Kontakt/i.test(f.title)), false);
});

test('KFZ Terminplaner is recognized and suppresses generic form advice', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Reifen Werkstatt Ulm</title></head><body><h1>Werkstatt</h1><p>0731 1234567</p><a href="/reifen/service/termine/">Online Terminplaner</a></body></html>',
    '/reifen/service/termine/': '<html><body><h1>Online Terminplaner</h1><a href="https://frontend.1-wtp-online.de/kalender">Termin wählen</a></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'KFZ-Werkstatt', goal: 'mehr Termine', fetchImpl, dnsLookup,
  });
  assert.equal(result.signals.booking_present, true);
  assert.equal(result.findings.some((f) => /Kein Online-Buchungs|Kein Termin/i.test(f.title)), false);
  assert.equal(result.recommendations.some((r) => /Kontaktformular/i.test(r.title)), false);
});

test('consumer revenue goal does not create Social/LinkedIn penalty', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Café Ulm Reservierung</title><meta name="description" content="Cafe"><meta property="og:title" content="Cafe"><link rel="canonical" href="https://example.de/"></head><body><h1>Café</h1><a href="tel:0731123456">Anrufen</a><p>Reservieren Sie telefonisch</p></body></html>',
  });  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Café / Gastronomie', goal: 'mehr Reservierungen', fetchImpl, dnsLookup,
  });
  assert.equal(result.industryProfile.key, 'restaurant');
  assert.equal(result.findings.some((f) => /Social|LinkedIn/i.test(f.title)), false);
  assert.equal(result.recommendations.some((r) => /Social|LinkedIn/i.test(r.title)), false);
});

test('fallback stays honest when homepage cannot be fetched', async () => {
  const fetchImpl = async () => htmlResponse('forbidden', 403);
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Restaurant', goal: 'mehr Bestellungen', fetchImpl, dnsLookup,
  });
  assert.equal(result.analysisType, 'fallback_estimate');
  assert.equal(result.engineVersion, '3.2.0');
  assert.equal(result.httpStatus, 403);
  assert.equal('findings' in result, false);
});
test('specific booking goal suppresses unrelated restaurant order advice', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Café</title></head><body><h1>Café</h1><a href="tel:0731123456">Anrufen</a><p>Reservierung telefonisch</p></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Café / Gastronomie', goal: 'mehr Reservierungen', fetchImpl, dnsLookup,
  });
  assert.equal(result.recommendations.some((r) => /Bestell/i.test(r.title)), false);
  assert.equal(result.findings.some((f) => /Bestell/i.test(f.title)), false);
});

test('lead goal with contact form suppresses unrelated booking advice', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Catering</title></head><body><h1>Catering</h1><a href="/kontakt">Kontakt</a></body></html>',
    '/kontakt': '<html><body><h1>Anfrage</h1><form><input name="email"></form></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Gastronomie / Catering', goal: 'mehr Catering-Anfragen', fetchImpl, dnsLookup,
  });
  assert.equal(result.recommendations.some((r) => /Buchung|Termin/i.test(r.title)), false);
  assert.equal(result.findings.some((f) => /Buchung|Termin/i.test(f.title)), false);
});

test('phone plus email is not misreported as phone-only contact', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Eventhalle</title></head><body><h1>Eventhalle</h1><a href="tel:073140310290">Anrufen</a><a href="mailto:info@example.de">E-Mail</a></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Event / Location', goal: 'mehr Anfragen', fetchImpl, dnsLookup,
  });
  assert.equal(result.findings.some((f) => /nur telefonisch/i.test(f.title)), false);
});

test('existing JSON-LD is never contradicted by a missing-JSON-LD finding', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Local Business</title><script type="application/ld+json">{"@type":"LocalBusiness"}</script></head><body><h1>Firma</h1><a href="https://instagram.com/example">Instagram</a><a href="tel:0731123456">Telefon</a></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Lokale Dienstleistung', goal: 'mehr Anfragen', fetchImpl, dnsLookup,
  });
  assert.equal(result.signals.jsonld_present, true);
  assert.equal(result.findings.some((f) => /kein JSON-LD|Keine strukturierten Daten/i.test(`${f.title} ${f.text}`)), false);
});

test('visit goal suppresses booking and order defaults for a cafe', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Café</title></head><body><h1>Café</h1><a href="tel:0731123456">Telefon</a></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Café / Gastronomie', goal: 'mehr Besuche', fetchImpl, dnsLookup,
  });
  assert.equal(result.goalProfile.key, 'visit');
  assert.equal(result.findings.some((f) => /Buchung|Termin|Bestell/i.test(f.title)), false);
});

test('lead goal with working form does not penalize a missing phone', async () => {
  const fetchImpl = mockSite({
    '/': '<html lang="de"><head><title>Catering</title></head><body><h1>Catering</h1><form><input name="email"></form></body></html>',
  });
  const result = await runAnalysis({
    url: 'https://example.de/', industry: 'Gastronomie / Catering', goal: 'mehr Catering-Anfragen', fetchImpl, dnsLookup,
  });
  assert.equal(result.findings.some((f) => /Telefonnummer/i.test(f.title)), false);
});
