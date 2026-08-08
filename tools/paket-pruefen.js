/* ============================================================================
 * pruefe-bundle.js — Öffnet jede HTML-Seite des Pakets im Browser und misst,
 * was man einer Datei nicht ansieht: tote Verknüpfungen, fehlende Bilder,
 * Seitenfehler, Querscrollen, abgeschnittener Text.
 *
 * Aufruf:  node pruefe-bundle.js [ordner]     (Vorgabe: /home/user/newmockup)
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const WURZEL = process.argv[2] || '/home/user/newmockup';
const BREITEN = [1440, 900, 640, 390];

function alleHtml(dir, gesammelt = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) alleHtml(p, gesammelt);
    else if (e.name.endsWith('.html')) gesammelt.push(p);
  }
  return gesammelt;
}

(async () => {
  const seiten = alleHtml(WURZEL).sort();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });

  const befunde = [];
  const melde = (datei, art, text) =>
    befunde.push({ datei: path.relative(WURZEL, datei), art, text });

  for (const datei of seiten) {
    const rel = path.relative(WURZEL, datei);
    const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const fehler = [];
    seite.on('pageerror', (e) => fehler.push('pageerror: ' + e.message));
    seite.on('console', (m) => { if (m.type() === 'error') fehler.push('console: ' + m.text()); });

    await seite.goto('file://' + datei, { waitUntil: 'load' });
    await seite.waitForTimeout(500);
    // Lazy geladene Bilder anstoßen
    await seite.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo(0, 0);
    });
    await seite.waitForTimeout(400);

    /* Verknüpfungen und Bilder einsammeln */
    const { links, bilder, schriften } = await seite.evaluate(() => ({
      links: [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.startsWith('#') && !/^(https?:|mailto:|data:|javascript:)/.test(h)),
      bilder: [...document.images].map((i) => ({
        src: i.getAttribute('src'),
        ok: i.naturalWidth > 0,
      })),
      schriften: [...new Set([...document.querySelectorAll('*')]
        .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .map((el) => getComputedStyle(el).fontSize))].sort(),
    }));

    const basis = path.dirname(datei);
    for (const h of links) {
      const ziel = path.resolve(basis, decodeURI(h.split('#')[0]));
      if (!fs.existsSync(ziel)) melde(datei, 'toter Link', `${h} → ${path.relative(WURZEL, ziel)}`);
    }
    for (const b of bilder) {
      if (!b.ok && !/^data:/.test(b.src || '')) melde(datei, 'Bild lädt nicht', b.src);
    }
    if (fehler.length) melde(datei, 'Seitenfehler', fehler.slice(0, 4).join(' | '));

    /* Querscrollen und abgeschnittener Text bei allen Breiten */
    for (const w of BREITEN) {
      await seite.setViewportSize({ width: w, height: 900 });
      await seite.waitForTimeout(260);
      const m = await seite.evaluate(() => {
        const d = document.scrollingElement;
        const quer = d.scrollWidth - d.clientWidth;
        const abgeschnitten = [...document.querySelectorAll('*')]
          .filter((el) => {
            const s = getComputedStyle(el);
            if (s.overflowX !== 'hidden' && s.overflow !== 'hidden') return false;
            if (s.display === 'none' || !el.clientWidth) return false;
            return el.scrollWidth > el.clientWidth + 1;
          })
          .slice(0, 6)
          .map((el) => (el.className || el.tagName) + ' ' + el.scrollWidth + '>' + el.clientWidth
            + ' „' + (el.textContent || '').trim().slice(0, 40) + '"');
        return { quer, abgeschnitten };
      });
      if (m.quer > 1) melde(datei, `Querscrollen @${w}px`, `${m.quer}px zu breit`);
      for (const a of m.abgeschnitten) melde(datei, `Text beschnitten @${w}px`, a);
    }

    /* Typo-Disziplin: mehr als 5 Größen im Fließtext ist ein Bruch der Regel */
    const relevant = schriften.map(parseFloat).filter((n) => n >= 10 && n <= 40);
    const einmalig = [...new Set(relevant)];
    if (einmalig.length > 5) melde(datei, 'Typo-Skala', `${einmalig.length} Größen: ${einmalig.join(', ')}`);

    await seite.close();
    process.stdout.write(`  ${rel} ✓\n`);
  }

  await browser.close();

  console.log(`\n── ${seiten.length} Seiten geprüft ──`);
  if (!befunde.length) { console.log('keine Befunde'); return; }
  const nachArt = {};
  for (const b of befunde) (nachArt[b.art] ||= []).push(b);
  for (const art of Object.keys(nachArt).sort()) {
    console.log(`\n${art} (${nachArt[art].length})`);
    for (const b of nachArt[art].slice(0, 24)) console.log(`  ${b.datei}: ${b.text}`);
    if (nachArt[art].length > 24) console.log(`  … und ${nachArt[art].length - 24} weitere`);
  }
  process.exitCode = 1;
})();
