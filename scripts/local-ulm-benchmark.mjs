import handler from '../api/diagnosis/analyze.mjs';

const cases = [
  ['Die Halle', 'https://www.diehalle-ulm.de/', 'Event / Location', 'mehr Anfragen'],
  ['Elektro Maier', 'https://www.elektro-maier-ulm.de/', 'Elektriker / Handwerk', 'mehr Anfragen'],
  ['Physio Vital', 'https://www.physiovital-ulm.de/', 'Physiotherapie', 'mehr Termine'],
  ['Reifen Müller', 'https://ulm-donautal.reifen-mueller.com/startseite/', 'KFZ-Werkstatt', 'mehr Termine'],
  ['Stadtgeflüster', 'https://stadtgefluester-ulm.de/', 'Café / Gastronomie', 'mehr Reservierungen'],
  ['madò Focaccia', 'https://madofocacciaclub.com/', 'Gastronomie / Catering', 'mehr Catering-Anfragen'],
  ['Brera Ulm', 'https://brera.de/serviced-apartments-ulm/', 'Hotel / Hospitality', 'mehr Direktbuchungen'],
  ['Henriettas', 'https://henriettas.de/henriettas-coffee-ulm-hirschstrasse/', 'Café / Gastronomie', 'mehr Besuche'],
  ['Hotel Adler', 'https://hotel-adler-ulm.de/', 'Hotel / Hospitality', 'mehr Direktbuchungen'],
  ['Laufsport Ulm', 'https://www.laufsport-ulm.de/', 'Local Service / Sport', 'mehr Anfragen'],
];

async function run([name, websiteUrl, industry, goal]) {
  let payload;
  const req = { method: 'POST', body: { websiteUrl, industry, goal } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { payload = data; return data; } };
  await handler(req, res);
  return { name, status: res.statusCode, data: payload };
}
const results = await Promise.all(cases.map(run));
for (const { name, status, data } of results) {
  const s = data?.signals || {};
  const contactCritical = (data?.findings || []).some((f) => f.severity === 'kritisch' && /Kontakt|kontakt/i.test(f.text));
  const genericForm = (data?.quickWins || []).some((w) => /Formular/i.test(w));
  const socialPenalty = (data?.findings || []).some((f) => /Social|LinkedIn/i.test(f.text));
  console.log(JSON.stringify({
    name, status, type: data?.analysisType, engine: data?.engineVersion,
    pages: data?.checkedPages?.length || 0, findings: data?.findings?.length || 0,
    phone: s.phone_present, form: s.form_present, booking: s.booking_present,
    order: s.online_order_present, whatsapp: s.whatsapp_present,
    contactCritical, genericForm, socialPenalty,
    deltas: data?.scoreDeltas || null, reason: data?.reason || null,
  }));
}