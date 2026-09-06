const [baseArg, ...urls] = process.argv.slice(2);
if (!baseArg || urls.length === 0) {
  console.error('Usage: node scripts/analyzer-live-smoke.mjs <base-url> <website> [website...]');
  process.exit(2);
}

const base = baseArg.replace(/\/$/, '');
for (const websiteUrl of urls) {
  try {
    const response = await fetch(`${base}/api/diagnosis/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ websiteUrl, industry: 'operator-smoke', goal: 'quality-check' }),
    });
    const data = await response.json().catch(() => ({}));
    console.log(JSON.stringify({
      websiteUrl,
      status: response.status,
      analysisType: data.analysisType || null,
      engineVersion: data.engineVersion || null,
      checkedPages: data.checkedPages?.length ?? 0,
      findings: data.findings?.length ?? 0,
      reason: data.reason || null,
    }));
  } catch (error) {
    console.log(JSON.stringify({ websiteUrl, error: error?.message || String(error) }));
  }
}