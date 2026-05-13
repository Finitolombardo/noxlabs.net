import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const url = 'https://www.shopify.com/editions/winter2026#checkout';
const outDir = path.resolve('docs/audit-screenshots');
await fs.mkdir(outDir, { recursive: true });
async function shot(page, file) { await page.screenshot({ path: path.join(outDir, file), timeout: 120000, animations: 'disabled' }); }
async function auditViewport(name, viewport) {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2500);
  await shot(page, `${name}-full.png`);
  const metrics = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('section, [id], main > div')].map((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { tag: el.tagName.toLowerCase(), id: el.id || null, className: (el.className || '').toString().slice(0, 160), top: Math.round(r.top + window.scrollY), height: Math.round(r.height), position: s.position }; }).filter((s) => s.height > 120).slice(0, 120);
    const assets = []; const pushAsset = (url, type, purpose) => { if (!url || url.startsWith('data:')) return; assets.push({ url, type, purpose }); };
    document.querySelectorAll('img').forEach((img) => pushAsset(img.currentSrc || img.src, 'img', 'inline image'));
    document.querySelectorAll('video source, video').forEach((v) => pushAsset(v.currentSrc || v.src, 'video', 'video media'));
    document.querySelectorAll('*').forEach((el) => { const bg = getComputedStyle(el).backgroundImage; if (bg && bg.includes('url(')) { [...bg.matchAll(/url\(["']?(.*?)["']?\)/g)].forEach((m) => pushAsset(m[1], 'css-bg', 'background image')); } });
    const uniqueAssets = Array.from(new Map(assets.map((a) => [a.url, a])).values()).slice(0, 200);
    const navLinks = [...document.querySelectorAll('a[href^="#"], a[href*="#"]')].map((a) => ({ text: (a.textContent || '').trim().slice(0, 80), href: a.getAttribute('href') })).filter((a) => a.text || a.href).slice(0, 80);
    const hasCanvas = !!document.querySelector('canvas');
    const hasWebgl = [...document.querySelectorAll('canvas')].some((c) => { try { return !!(c.getContext('webgl') || c.getContext('webgl2')); } catch { return false; } });
    const motionHints = { gsap: !!window.gsap, stickyCount: [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).position === 'sticky').length, fixedCount: [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).position === 'fixed').length };
    return { title: document.title, sections, uniqueAssets, navLinks, hasCanvas, hasWebgl, motionHints, docHeight: document.documentElement.scrollHeight };
  });
  const sectionShots = [];
  for (const ratio of [0.12, 0.25, 0.4, 0.55, 0.7, 0.85]) { const y = Math.floor(metrics.docHeight * ratio); await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(600); const shotName = `${name}-boundary-${Math.round(ratio*100)}.png`; await shot(page, shotName); sectionShots.push(shotName); }
  await browser.close(); return { viewport, ...metrics, sectionShots };
}
const desktop = await auditViewport('desktop-1440', { width: 1440, height: 1200 });
const mobile = await auditViewport('mobile-390', { width: 390, height: 844 });
await fs.writeFile(path.resolve('docs/shopify-winter2026-audit-raw.json'), JSON.stringify({ url, desktop, mobile }, null, 2));
console.log('Audit complete');
