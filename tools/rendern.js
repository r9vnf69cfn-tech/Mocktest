#!/usr/bin/env node
/* ============================================================================
 * rendern.js — erzeugt sämtliche Vorschaubilder in mockups/_renders/
 *
 * WOZU
 * Die Übersichtsseite (mockups/index.html) und die Galerie zeigen zu jeder
 * Seite eine Kachel. Die Kachel lädt ihr Bild aus _renders/ nach einem festen
 * Namensschema — ändert sich der Name, bricht die Kachel. Dieses Werkzeug ist
 * die einzige Stelle, an der die Namen entstehen.
 *
 * DAS NAMENSSCHEMA (nicht verhandelbar, index.html baut die Pfade daraus)
 *   app-next-<datei>-<ipad|iphone>-<hell|dunkel>.png   Element-Aufnahme
 *   best-of-<datei>-<ipad|iphone>-<hell|dunkel>.png    Element-Aufnahme
 *   motion-<datei>-<hell|dunkel>.png                   Ausschnitt 1194×834
 *   platform-<datei>-<hell|dunkel>.png                 ganze Seite
 *   shared-faden-probe-<hell|dunkel>.png               ganze Seite
 *   bilder-probe-<hell|dunkel>.png                     ganze Seite
 *   canvas-whiteboard-<ipad|iphone>-<hell|dunkel>.png  Ausschnitt
 *   kontaktbogen-<app-next|best-of|platform>-<hell|dunkel>.png
 *   uebersicht.png
 *
 * WAS DIE AUFNAHME RICHTIG MACHT
 * · deviceScaleFactor 2 — die Bilder sollen auf Retina taugen.
 * · Die Geräte-Aufnahmen sind ELEMENT-Aufnahmen von .screen, nicht von der
 *   Seite: der Erklärtext über dem Gerät gehört nicht in die Kachel.
 * · .controls (Hell/Dunkel-Leiste) und .screennav (Blättern) gehören dem
 *   Mockup, nicht dem Entwurf. Beide werden vor jeder Aufnahme abgeschaltet;
 *   sie liegen fixiert über dem Gerät und kämen sonst mit aufs Bild.
 * · Gewartet wird auf: Schriften, Bilder, gefüllte <svg class="thread">
 *   (mock.js zeichnet die Fäden erst beim Start) und das Auslaufen aller
 *   endlichen Animationen. Ein Bild mit halb gezeichnetem Faden ist wertlos.
 * · Endlos-Animationen (Wellenform, Skelett-Puls) werden auf einen festen
 *   Zeitpunkt gestellt und angehalten — nicht auf 0 zurückgespult: bei 0
 *   stünde die Wellenform auf ihrem kleinsten Ausschlag und sähe aus wie
 *   eine gestrichelte Linie. Deshalb auch screenshot({animations:'allow'}),
 *   denn Playwrights Voreinstellung 'disabled' spult genau dorthin zurück.
 * · Die zwei Bewegungsseiten werden NICHT im Ruhezustand aufgenommen,
 *   sondern mitten in der Übergabe: Karte im Flug auf dem Faden, Faden halb
 *   gezeichnet. Ein Standbild einer Bewegung muss zeigen, dass sich etwas
 *   bewegt. Angehalten wird über die Web-Animations-API, nicht über einen
 *   glücklich getroffenen Zeitpunkt.
 *
 * AUFRUF
 *   node tools/rendern.js                  alles
 *   node tools/rendern.js today graph      nur Ziele, deren Name das enthält
 *   node tools/rendern.js --nur-boegen     nur die drei Kontaktbögen
 *   node tools/rendern.js --liste          nur auflisten, nichts rendern
 *
 * playwright-core wird in dieser Reihenfolge gesucht:
 *   $VELUM_PLAYWRIGHT · node_modules neben dem Arbeitsverzeichnis · neben
 *   diesem Werkzeug. Der Browser kommt aus $VELUM_CHROME oder dem Pfad
 *   darunter. Kein npm install, keine externe URL.
 * ========================================================================= */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { createRequire } = require('module');

const REPO     = path.resolve(__dirname, '..');
const MOCKUPS  = path.join(REPO, 'mockups');
const ZIEL     = path.join(MOCKUPS, '_renders');
const CHROME   = process.env.VELUM_CHROME ||
                 '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* ── playwright-core finden ─────────────────────────────────────────────── */
function playwright() {
  const versuche = [];
  if (process.env.VELUM_PLAYWRIGHT) versuche.push(process.env.VELUM_PLAYWRIGHT);
  versuche.push(path.join(process.cwd(), 'node_modules', 'playwright-core'));
  versuche.push(path.join(__dirname, 'node_modules', 'playwright-core'));
  versuche.push(path.join(REPO, 'node_modules', 'playwright-core'));
  versuche.push('playwright-core');
  for (const v of versuche) {
    try { return createRequire(path.join(process.cwd(), '_.js'))(v); }
    catch (e) { /* nächster Versuch */ }
  }
  throw new Error(
    'playwright-core nicht gefunden. Entweder aus einem Ordner starten, der\n' +
    'node_modules/playwright-core enthält, oder VELUM_PLAYWRIGHT=<pfad> setzen.');
}

/* ══════════════════════════════════════════════════════════════════════════
 * 1. WAS GERENDERT WIRD
 * ═══════════════════════════════════════════════════════════════════════ */

/* Die deutschen Namen sind wortgleich mit den Kacheln in mockups/index.html
   und mit der Blätter-Leiste in mock.js. Stehen sie hier anders, heißt
   dieselbe Datei an drei Orten anders. */
const APP_NEXT = [
  ['today',           'Heute'],
  ['library',         'Bibliothek'],
  ['notes-list',      'Notizen-Liste'],
  ['note-editor',     'Notiz-Editor'],
  ['journal-home',    'Journal-Start'],
  ['journal-entry',   'Journal-Eintrag'],
  ['tasks',           'Aufgaben'],
  ['task-detail',     'Aufgaben-Detail'],
  ['flashcards-home', 'Lernkarten-Start'],
  ['review-session',  'Review-Session'],
  ['graph',           'Graph'],
  ['settings',        'Einstellungen'],
  ['leere-zustaende', 'Leere Zustände'],
];

const BEST_OF = [
  ['library',    'Bibliothek'],
  ['today',      'Heute'],
  ['notes',      'Notizen'],
  ['journal',    'Journal'],
  ['tasks',      'Aufgaben'],
  ['flashcards', 'Lernkarten'],
];

/* Breite = die natürliche Mindestbreite der Seite, im Browser gemessen und
   hier festgehalten, damit keine Aufnahme rechts eine leere Fläche trägt und
   keine einen Gerätrahmen abschneidet. Untergrenze 1280, sonst wird der
   Steckbrief unter dem Gerät zur Spalte. */
const PLATFORM = [
  ['widgets',         'Widgets',                      1984],
  ['live-activity',   'Live Activity · Dynamic Island', 1809],
  ['pencil',          'Apple Pencil',                 3128],
  ['sperrbildschirm', 'Sperrbildschirm-Mitteilung',   1299],
  ['spotlight',       'Spotlight',                    1280],
  ['kurzbefehle',     'Siri und Kurzbefehle',         1299],
  ['fokus',           'Fokus-Filter',                 1299],
  ['teilen',          'Teilen-Blatt',                 1280],
  ['kontextmenue',    'Kontextmenü',                  1667],
  ['handoff',         'Handoff',                      1667],
];

const PROBEN = [
  ['shared/faden-probe.html',    'shared-faden-probe', 1280],
  ['assets/bilder/probe.html',   'bilder-probe',       1280],
];

const IPAD   = { w: 1194, h: 834 };
const IPHONE = { w: 393,  h: 852 };

/* ══════════════════════════════════════════════════════════════════════════
 * 2. GEMEINSAMES
 * ═══════════════════════════════════════════════════════════════════════ */

const THEMA = { hell: 'light', dunkel: 'dark' };

/* Die Leisten des Mockups verschwinden. Sie liegen position:fixed über allem
   und lägen sonst im Ausschnitt jedes Geräts. */
const OHNE_CHROME = `
  .controls, .screennav { display: none !important; }
  body.has-screennav { padding-bottom: 0 !important; }
`;

async function oeffnen(page, datei) {
  await page.goto('file://' + datei, { waitUntil: 'load' });
  await page.addStyleTag({ content: OHNE_CHROME });
}

async function thema(page, modus) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.type = document.documentElement.dataset.type || 'standard';
  }, THEMA[modus]);
}

/* Warten, bis wirklich alles steht. Reihenfolge ist Absicht: Schriften vor
   Bildern (Textumbruch verschiebt Bilder), Bilder vor Fäden (ein Faden hängt
   an Kästen, die ein nachgeladenes Bild verschieben kann). */
async function bereit(page, notiz) {
  await page.evaluate(async () => {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    await Promise.all(Array.from(document.images).map((im) => im.complete ? null
      : new Promise((r) => {
          im.addEventListener('load', r, { once: true });
          im.addEventListener('error', r, { once: true });
          setTimeout(r, 8000);
        })));
  });

  /* mock.js füllt leere <svg class="thread"> beim Start mit viewBox und Pfad.
     Solange eines leer ist, ist der Faden nicht gezeichnet. */
  try {
    await page.waitForFunction(() => Array.from(document.querySelectorAll('svg.thread'))
      .every((el) => el.dataset.threadDone === '1' || el.firstElementChild),
      null, { timeout: 20000 });
  } catch (e) { notiz.push('Fäden nicht fertig gezeichnet (20 s)'); }

  /* Endliche Animationen auslaufen lassen — Endlose würden hier nie enden. */
  try {
    await page.waitForFunction(() => !document.getAnimations().some((a) => {
      if (a.playState !== 'running' || !a.effect) return false;
      return a.effect.getTiming().iterations !== Infinity;
    }), null, { timeout: 6000 });
  } catch (e) { notiz.push('endliche Animation lief nach 6 s noch'); }

  await page.waitForTimeout(120);
}

/* Endlos-Animationen auf einen festen Zeitpunkt stellen und anhalten.
   currentTime zählt die Verzögerung mit — die Balken der Wellenform tragen
   Verzögerungen von 0, −70, −140 ms …, stehen bei demselben currentTime also
   an verschiedenen Stellen ihrer Kurve. Genau das ergibt die Wellenform.
   Auf 0 zurückgesetzt stünden alle gleich und es wäre eine gerade Linie. */
async function einfrieren(page, bei) {
  await page.evaluate((t) => {
    document.getAnimations().forEach((a) => {
      try {
        if (a.effect && a.effect.getTiming().iterations === Infinity) a.currentTime = t;
        a.pause();
      } catch (e) {}
    });
  }, bei == null ? 300 : bei);
}

const SCHUSS = { animations: 'allow', caret: 'hide', scale: 'device' };

/* ══════════════════════════════════════════════════════════════════════════
 * 3. DIE EINZELNEN AUFNAHMEN
 * ═══════════════════════════════════════════════════════════════════════ */

/* Ein Screen: iPad und iPhone liegen auf derselben Seite, beide als
   Element-Aufnahme des Geräterahmens. */
async function screens(ctx, gruppe, datei, modus, bericht) {
  const notiz = [];
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e.message || e).slice(0, 160)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    /* Das App-Icon fehlt absichtlich; der Baustein zeigt dafür einen leeren
       Rahmen mit Pfad. Diese Meldung ist der Baustein bei der Arbeit. */
    if (/ERR_FILE_NOT_FOUND/.test(t)) return;
    fehler.push('Konsole: ' + t.slice(0, 160));
  });

  await oeffnen(page, path.join(MOCKUPS, gruppe, datei + '.html'));
  await thema(page, modus);
  await bereit(page, notiz);
  await einfrieren(page);

  for (const [art, sel, maß] of [['ipad', '.screen--ipad', IPAD], ['iphone', '.screen--iphone', IPHONE]]) {
    const el = page.locator(sel).first();
    if (await el.count() === 0) { notiz.push(`${sel} fehlt`); continue; }
    const kasten = await el.boundingBox();
    if (kasten && (Math.round(kasten.width) !== maß.w || Math.round(kasten.height) !== maß.h)) {
      notiz.push(`${art}: ${Math.round(kasten.width)}×${Math.round(kasten.height)} statt ${maß.w}×${maß.h}`);
    }
    const name = `${gruppe}-${datei}-${art}-${modus}.png`;
    await el.screenshot({ path: path.join(ZIEL, name), ...SCHUSS });
    bericht.push({ name, ...maß });
  }

  /* Gegenprobe im Bild: liegt eine der beiden Leisten über einem Gerät? */
  const stoerung = await page.evaluate(() => {
    const raus = [];
    document.querySelectorAll('.controls, .screennav').forEach((c) => {
      if (getComputedStyle(c).display !== 'none') raus.push(c.className);
    });
    return raus;
  });
  if (stoerung.length) notiz.push('Leiste sichtbar: ' + stoerung.join(', '));

  await page.close();
  return { notiz, fehler };
}

/* Eine Plattform-Ansicht: ganze Seite in der Breite, die sie wirklich
   braucht — die Geräte stehen darin in ihrer echten Punktgröße. */
async function ganzeSeite(browser, datei, name, breite, modus, bericht) {
  const notiz = [];
  const ctx = await browser.newContext({
    viewport: { width: breite, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: modus === 'dunkel' ? 'dark' : 'light',
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e.message || e).slice(0, 160)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) fehler.push('Konsole: ' + m.text().slice(0, 160));
  });

  await oeffnen(page, datei);
  await thema(page, modus);
  await bereit(page, notiz);
  await einfrieren(page);

  const maß = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  if (maß.w > breite + 1) notiz.push(`Seite ist ${maß.w} breit, aufgenommen wird ${breite} — rechts fehlt etwas`);

  const dateiname = `${name}-${modus}.png`;
  await page.screenshot({ path: path.join(ZIEL, dateiname), fullPage: true, ...SCHUSS });
  bericht.push({ name: dateiname, w: breite, h: maß.h });
  await ctx.close();
  return { notiz, fehler };
}

/* ── Die zwei Bewegungsseiten ───────────────────────────────────────────
   Ein Standbild einer Bewegung muss zeigen, dass sich etwas bewegt. Deshalb
   wird hier nicht der Ruhezustand aufgenommen, sondern ein Zwischenbild —
   und zwar an der Stelle, an der man es auch SIEHT.

   motion/index → die Rolle ÜBERGEBEN (Feld „Übergeben — Modul zu Modul").
   Nicht Moment 1, obwohl der der wichtigere ist: dort stehen Ursprung und
   Ziel 21 pt auseinander, der Faden ist 88 pt lang und die Flugkarte
   134 pt breit — sie deckt ihn vollständig zu. In der Rollen-Bühne liegen
   rund 380 pt dazwischen, dort sind Faden UND Karte zu sehen.

   motion/onboarding → Takt 5, „Der erste Faden — Notizen zu Lernkarten",
   halb gezeichnet. Die Übergabe in Takt 7 fällt aus demselben Grund aus:
   im 393 pt breiten Schirm ist der Faden 57 pt lang, die Karte deckt ihn zu.

   Angehalten wird über die Web-Animations-API im Schirm selbst, nicht durch
   Abzählen von außen — ein Aufruf über die Leitung kostet Millisekunden. */
async function bewegung(browser, welche, modus, bericht) {
  const notiz = [];
  const ctx = await browser.newContext({
    viewport: { width: IPAD.w, height: IPAD.h },
    deviceScaleFactor: 2,
    colorScheme: modus === 'dunkel' ? 'dark' : 'light',
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e.message || e).slice(0, 160)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) fehler.push('Konsole: ' + m.text().slice(0, 160));
  });

  await oeffnen(page, path.join(MOCKUPS, 'motion', welche + '.html'));
  await thema(page, modus);
  await bereit(page, notiz);

  /* MOTION.tempo(4) heißt 0,25× — der Wert ist der Faktor, mit dem jede Dauer
     multipliziert wird (bewegung.js: ms(x) = x · tempo). */
  /* Der Maßstab der Flugkarte läuft von 1 auf 0,42 und ist damit der Weg
     selbst: 0,76 heißt gut 40 % der Bahn zurückgelegt, der Faden ist dann
     zu drei Vierteln gezeichnet — der Weg liegt sichtbar vor dem, was ihn
     geht. Für den Faden-Takt zählt der Fortschritt der CSS-Animation
     thread-draw. */
  let stand;
  if (welche === 'index') {
    await page.evaluate(() => { if (window.MOTION) MOTION.tempo(4); });
    await page.locator('[data-bw="uebergeben"][data-bw-von="#r3-von"]').first().click();
    stand = await page.evaluate(async (schwelle) => {
      const maßstab = (el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.hypot(m.a, m.b);
      };
      return await new Promise((fertig) => {
        const t0 = performance.now();
        (function schritt() {
          const k = document.querySelector('.bw-flug');
          if (k && maßstab(k) <= schwelle) {
            document.getAnimations().forEach((a) => { try { a.pause(); } catch (e) {} });
            const p = document.querySelector('svg.thread-layer path');
            const cs = p ? getComputedStyle(p) : null;
            const len = cs ? parseFloat(cs.strokeDasharray) : 0;
            const off = cs ? parseFloat(cs.strokeDashoffset) : 0;
            return fertig({ ok: true, was: 'Flug', maßstab: +maßstab(k).toFixed(3),
                            fadenLaenge: len, faden: len ? +(1 - off / len).toFixed(2) : null });
          }
          if (performance.now() - t0 > 30000) return fertig({ ok: false, was: 'Flug' });
          requestAnimationFrame(schritt);
        })();
      });
    }, 0.76);
  } else {
    /* Das Onboarding läuft an seiner eigenen Uhr; sie bei 0,25× von Anfang
       an mitlaufen zu lassen hieße 112 statt 28 Sekunden. Also volle
       Geschwindigkeit bis Sekunde 8 und erst dann verlangsamen — Takt 5
       liegt bei 9,0 s. */
    await page.locator('#k-start').click();
    try {
      await page.waitForFunction(() => {
        const u = document.getElementById('uhr');
        return u && /Sekunde ([8-9]|[1-9]\d)/.test(u.textContent);
      }, null, { timeout: 40000 });
    } catch (e) { notiz.push('Onboarding-Uhr erreichte Sekunde 8 nicht'); }
    await page.evaluate(() => { if (window.MOTION) MOTION.tempo(4); });
    stand = await page.evaluate(async (ziel) => {
      return await new Promise((fertig) => {
        const t0 = performance.now();
        (function schritt() {
          const a = document.getAnimations().find((x) =>
            x.animationName === 'thread-draw' && x.playState === 'running');
          if (a) {
            const d = a.effect.getTiming().duration;
            if (d && a.currentTime / d >= ziel) {
              const anteil = +(a.currentTime / d).toFixed(2);
              document.getAnimations().forEach((x) => { try { x.pause(); } catch (e) {} });
              const p = document.querySelector('svg.thread-layer path');
              const cs = p ? getComputedStyle(p) : null;
              const len = cs ? parseFloat(cs.strokeDasharray) : 0;
              const off = cs ? parseFloat(cs.strokeDashoffset) : 0;
              return fertig({ ok: true, was: 'Faden', zeit: anteil,
                              fadenLaenge: len, faden: len ? +(1 - off / len).toFixed(2) : null });
            }
          }
          if (performance.now() - t0 > 40000) return fertig({ ok: false, was: 'Faden' });
          requestAnimationFrame(schritt);
        })();
      });
    }, 0.42);
  }

  if (!stand.ok) notiz.push(stand.was + ' nicht abgepasst — die Aufnahme zeigt keine Bewegung');
  else if (stand.faden == null || stand.faden < 0.15 || stand.faden > 0.97) {
    notiz.push('Faden steht bei ' + stand.faden + ' (Länge ' + stand.fadenLaenge + ') — nicht im Wachsen zu sehen');
  }
  await einfrieren(page);
  if (welche !== 'index') await page.evaluate(() => {
    const p = document.getElementById('k-pause'); if (p && !p.disabled) p.click();
  });

  /* Den Moment ins Bild rücken. Der Ausschnitt hat das Seitenverhältnis der
     Kachel (1194×834), es wird also nichts weggeschnitten. */
  const anker = welche === 'index' ? '#r3-buehne' : '#ob';
  await page.evaluate((sel) => {
    const e = document.querySelector(sel);
    if (!e) return;
    const r = e.getBoundingClientRect();
    const mitte = window.scrollY + r.top + r.height / 2;
    window.scrollTo(0, Math.max(0, Math.round(mitte - window.innerHeight / 2) - 40));
  }, anker);
  await page.waitForTimeout(120);

  const name = `motion-${welche}-${modus}.png`;
  await page.screenshot({ path: path.join(ZIEL, name), ...SCHUSS });
  bericht.push({ name, ...IPAD });
  await ctx.close();
  return { notiz, fehler };
}

/* ── Das lauffähige Canvas ──────────────────────────────────────────────
   Gehört nicht zu Runde 2, hängt aber als Kachel in derselben Galerie und
   bräche ohne Bild. Es hat kein .screen — der Ausschnitt IST das Gerät. */
async function canvas(browser, art, modus, bericht) {
  const notiz = [];
  const maß = art === 'ipad' ? IPAD : IPHONE;
  const ctx = await browser.newContext({
    viewport: { width: maß.w, height: maß.h },
    deviceScaleFactor: 2,
    colorScheme: modus === 'dunkel' ? 'dark' : 'light',
    reducedMotion: 'no-preference',
  });
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('gnTheme', t); } catch (e) {}
  }, THEMA[modus]);
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e.message || e).slice(0, 160)));

  await page.goto('file://' + path.join(REPO, 'index.html'), { waitUntil: 'load' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, THEMA[modus]);
  await page.waitForTimeout(400);
  /* Die Zeichen-Engine malt bei Größenänderung neu — so greift der Moduswechsel
     auch dann, wenn er nach dem Start kam. */
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(500);

  const name = `canvas-whiteboard-${art}-${modus}.png`;
  await page.screenshot({ path: path.join(ZIEL, name), ...SCHUSS });
  bericht.push({ name, ...maß });
  await ctx.close();
  return { notiz, fehler };
}

/* ══════════════════════════════════════════════════════════════════════════
 * 4. DIE KONTAKTBÖGEN
 *
 * Gebaut als HTML und mit demselben Browser aufgenommen, nicht mit Pillow:
 * so trägt der Bogen dieselben Farbtoken, dieselbe Schrift und dieselbe
 * Fünfer-Größenskala wie alles andere, und der dunkle Bogen bekommt seinen
 * Untergrund aus system.css statt aus einem hier abgeschriebenen Hexwert.
 * ═══════════════════════════════════════════════════════════════════════ */
function bogenHTML(titel, unter, spalten, zellen, modus, seitenverhaeltnis) {
  const css = 'file://' + path.join(MOCKUPS, 'shared', 'system.css');
  const zeilen = zellen.map(([bild, name]) =>
    `<figure><img src="file://${path.join(ZIEL, bild)}" alt=""><figcaption>${name}</figcaption></figure>`).join('\n');
  return `<!DOCTYPE html>
<html lang="de" data-theme="${THEMA[modus]}" data-type="standard">
<head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
<style>
  body { background: var(--ground); margin: 0; padding: 30px 30px 34px; }
  h1 { font: 600 28px/34px var(--sans); color: var(--ink-1); margin: 0 0 4px; letter-spacing: -.02em; }
  .unter { font: 400 15px/20px var(--sans); color: var(--ink-3); margin: 0 0 22px; }
  .raster { display: grid; grid-template-columns: repeat(${spalten}, 1fr); gap: 24px; }
  figure { margin: 0; }
  figure img {
    display: block; width: 100%; height: auto;
    ${seitenverhaeltnis ? 'aspect-ratio: 1194/834; object-fit: cover; object-position: top left;' : ''}
    border-radius: 10px; background: var(--paper);
    box-shadow: 0 0 0 1px var(--line), var(--sh-card);
  }
  figcaption { font: 600 15px/20px var(--sans); color: var(--ink-1); margin-top: 9px; }
</style></head>
<body>
<h1>${titel}</h1>
<p class="unter">${unter}</p>
<div class="raster">
${zeilen}
</div>
</body></html>`;
}

async function bogen(browser, kennung, titel, unter, spalten, zellen, modus, breite, bericht, verhaeltnis) {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'velum-bogen-')), 'bogen.html');
  fs.writeFileSync(tmp, bogenHTML(titel, unter, spalten, zellen, modus, verhaeltnis));
  const ctx = await browser.newContext({
    viewport: { width: breite, height: 900 }, deviceScaleFactor: 2,
    colorScheme: modus === 'dunkel' ? 'dark' : 'light',
  });
  const page = await ctx.newPage();
  const fehlend = [];
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(async () => {
    try { await document.fonts.ready; } catch (e) {}
    await Promise.all(Array.from(document.images).map((im) => im.complete ? null
      : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })));
  });
  fehlend.push(...await page.evaluate(() => Array.from(document.images)
    .filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src').split('/').pop())));
  const name = `kontaktbogen-${kennung}-${modus}.png`;
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: path.join(ZIEL, name), fullPage: true, ...SCHUSS });
  bericht.push({ name, w: breite, h });
  await ctx.close();
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  return { notiz: fehlend.length ? ['fehlende Bilder im Bogen: ' + fehlend.join(', ')] : [], fehler: [] };
}

/* ══════════════════════════════════════════════════════════════════════════
 * 5. ABLAUF
 * ═══════════════════════════════════════════════════════════════════════ */
async function main() {
  const argv = process.argv.slice(2);
  const nurBoegen = argv.includes('--nur-boegen');
  const nurListe  = argv.includes('--liste');
  const filter    = argv.filter((a) => !a.startsWith('--'));
  const passt = (s) => !filter.length || filter.some((f) => s.includes(f));

  fs.mkdirSync(ZIEL, { recursive: true });

  const { chromium } = playwright();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  const bericht = [];
  const befunde = [];
  const merken = (was, r) => {
    (r.notiz || []).forEach((n) => befunde.push(`${was}: ${n}`));
    (r.fehler || []).forEach((n) => befunde.push(`${was}: ${n}`));
  };

  if (!nurBoegen) {
    /* ── Entwurf und Vorstufe: ein Kontext je Modus, Seiten darin ─────── */
    for (const modus of ['hell', 'dunkel']) {
      const ctx = await browser.newContext({
        viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2,
        colorScheme: modus === 'dunkel' ? 'dark' : 'light',
        reducedMotion: 'no-preference',
      });
      for (const [gruppe, liste] of [['app-next', APP_NEXT], ['best-of', BEST_OF]]) {
        for (const [datei] of liste) {
          const kennung = `${gruppe}/${datei} ${modus}`;
          if (!passt(`${gruppe}-${datei}`)) continue;
          if (nurListe) { console.log('… ' + kennung); continue; }
          process.stdout.write('· ' + kennung + '\n');
          merken(kennung, await screens(ctx, gruppe, datei, modus, bericht));
        }
      }
      await ctx.close();
    }

    /* ── Bewegung ─────────────────────────────────────────────────────── */
    for (const welche of ['index', 'onboarding']) {
      if (!passt('motion-' + welche)) continue;
      for (const modus of ['hell', 'dunkel']) {
        const kennung = `motion/${welche} ${modus}`;
        if (nurListe) { console.log('… ' + kennung); continue; }
        process.stdout.write('· ' + kennung + '\n');
        merken(kennung, await bewegung(browser, welche, modus, bericht));
      }
    }

    /* ── Plattform ────────────────────────────────────────────────────── */
    for (const [datei, , breite] of PLATFORM) {
      if (!passt('platform-' + datei)) continue;
      for (const modus of ['hell', 'dunkel']) {
        const kennung = `platform/${datei} ${modus}`;
        if (nurListe) { console.log('… ' + kennung); continue; }
        process.stdout.write('· ' + kennung + '\n');
        merken(kennung, await ganzeSeite(browser,
          path.join(MOCKUPS, 'platform', datei + '.html'), 'platform-' + datei,
          Math.max(1280, breite), modus, bericht));
      }
    }

    /* ── Werkstattseiten ──────────────────────────────────────────────── */
    for (const [rel, name, breite] of PROBEN) {
      if (!passt(name)) continue;
      for (const modus of ['hell', 'dunkel']) {
        const kennung = `${rel} ${modus}`;
        if (nurListe) { console.log('… ' + kennung); continue; }
        process.stdout.write('· ' + kennung + '\n');
        merken(kennung, await ganzeSeite(browser, path.join(MOCKUPS, rel), name, breite, modus, bericht));
      }
    }

    /* ── Canvas ───────────────────────────────────────────────────────── */
    for (const art of ['ipad', 'iphone']) {
      if (!passt('canvas-whiteboard')) continue;
      for (const modus of ['hell', 'dunkel']) {
        const kennung = `canvas ${art} ${modus}`;
        if (nurListe) { console.log('… ' + kennung); continue; }
        process.stdout.write('· ' + kennung + '\n');
        merken(kennung, await canvas(browser, art, modus, bericht));
      }
    }
  }

  /* ── Die drei Kontaktbögen ──────────────────────────────────────────── */
  if (!nurListe && (passt('kontaktbogen') || nurBoegen || !filter.length)) {
    for (const modus of ['hell', 'dunkel']) {
      const wort = modus === 'hell' ? 'heller' : 'dunkler';
      merken(`kontaktbogen app-next ${modus}`, await bogen(browser, 'app-next',
        'Der Entwurf',
        `13 Screens · iPad · ${wort} Modus · alle auch als iPhone-Fassung im Ordner _renders/`,
        3, APP_NEXT.map(([f, n]) => [`app-next-${f}-ipad-${modus}.png`, n]), modus, 1002, bericht, true));

      merken(`kontaktbogen best-of ${modus}`, await bogen(browser, 'best-of',
        'Best-of — die Vorstufe',
        `6 Screens · iPad · ${wort} Modus · je drei Vorbilder zusammengeführt, unangetastet aus Runde 1`,
        3, BEST_OF.map(([f, n]) => [`best-of-${f}-ipad-${modus}.png`, n]), modus, 1002, bericht, true));

      merken(`kontaktbogen platform ${modus}`, await bogen(browser, 'platform',
        'Velum im System',
        `10 Plattform-Ansichten · ${wort} Modus · Widgets, Live Activity, Pencil, Sperrbildschirm, Spotlight, Kurzbefehle, Fokus, Teilen, Kontextmenü, Handoff`,
        2, PLATFORM.map(([f, n]) => [`platform-${f}-${modus}.png`, n]), modus, 1200, bericht, false));
    }
  }

  /* ── Die Übersichtsseite selbst, zuletzt: sie zeigt die Bilder von oben ─ */
  if (!nurListe && !nurBoegen && passt('uebersicht')) {
    const ctx = await browser.newContext({
      viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'light' });
    const page = await ctx.newPage();
    await oeffnen(page, path.join(MOCKUPS, 'index.html'));
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading]').forEach((i) => i.setAttribute('loading', 'eager'));
      try { await document.fonts.ready; } catch (e) {}
    });
    await page.waitForTimeout(2500);
    /* Nicht die Kopfzeile aufnehmen, sondern die Kacheln: das Bild soll
       zeigen, was im Ordner liegt, nicht was darüber steht. */
    await page.evaluate(() => {
      const g = document.getElementById('gridNext');
      const kopf = g && g.closest('.sec') ? g.closest('.sec') : g;
      if (kopf) window.scrollTo(0, Math.max(0, window.scrollY + kopf.getBoundingClientRect().top - 24));
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(ZIEL, 'uebersicht.png'), ...SCHUSS });
    bericht.push({ name: 'uebersicht.png', w: 1400, h: 1000 });
    await ctx.close();
  }

  await browser.close();

  /* ── Bilanz ─────────────────────────────────────────────────────────── */
  let bytes = 0;
  bericht.forEach((b) => { try { bytes += fs.statSync(path.join(ZIEL, b.name)).size; } catch (e) {} });
  console.log('\n' + bericht.length + ' Bilder · ' + (bytes / 1048576).toFixed(1) + ' MB');
  if (befunde.length) {
    console.log('\nBEFUNDE');
    befunde.forEach((b) => console.log('  ! ' + b));
  } else {
    console.log('keine Befunde beim Rendern');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
