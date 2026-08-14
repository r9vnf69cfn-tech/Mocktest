/* choreo.js — die Choreografie. Jede Szene einzeln inszeniert und einzeln
 * aufgezeichnet.
 *
 * Die Lehre aus drei Fassungen: ein Rundgang ist kein Film. Der GoodNotes-
 * Maßstab heißt: in JEDEM Schnitt passiert etwas — es wird getippt, gehakt,
 * gezeichnet, umgeschaltet. Also wird nicht mehr EIN Durchlauf gefilmt und
 * hinterher zerschnitten, sondern jede Einstellung wird als eigene kleine
 * Aufführung gedreht: eigener Kontext, eigene Aufnahme, eigene Datei.
 * Damit ist auch das Timing-Problem weg — jede Datei beginnt bei null,
 * der Schnitt greift bildgenau.
 *
 * Die Aufführungen:
 *   kette    · Heute → Tap auf die Kette, die Notiz öffnet sich
 *   rand     · der Notizrand fährt ins Bild
 *   tippen   · die Erfassungszeile wird LIVE getippt — die Chips springen
 *              mit jedem Zeichen (erkennen() versteht jetzt auch Englisch,
 *              der Wächter übersetzt die Chips im Entstehen)
 *   haken    · eine Aufgabe wird abgehakt, der Haken animiert wirklich
 *   planer   · Liste → Planer
 *   brett    · Planer → Board
 *   liste    · Bibliothek: Raster → Liste
 *   flip     · Lernsitzung: die Karte dreht sich
 *   malen    · das Canvas ZEICHNET SICH SELBST (vorfuehren: die 450 Striche
 *              des Vorlesungsblatts entstehen im Zeitraffer), dann Zoom
 *   tagebuch · das Journal fährt durch die Woche
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const WURZEL = '/home/user/Mocktest';
const AUS = '/home/user/story/choreo';
const B = 1194, Hh = 834;
const SKALA = 2;

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

const SCHIRM = '[data-pv-screen]:not([hidden])[data-pv-geraet="ipad"]';

async function buehne(p) {
  await p.evaluate(({ B, Hh }) => {
    PROTOTYP.geraet('ipad');
    const glas = document.querySelector('.pv-glas');
    for (let n = glas; n && n !== document.body; n = n.parentElement) {
      for (const g of Array.from(n.parentElement.children)) {
        if (g !== n) g.style.display = 'none';
      }
      n.style.cssText += ';margin:0!important;padding:0!important;transform:none!important;' +
                         'position:static!important;width:auto!important;max-width:none!important';
    }
    const stil = document.createElement('style');
    stil.textContent = `
      html,body{margin:0!important;padding:0!important;background:#000!important;overflow:hidden!important}
      .pv-kopf,.pv-fuss,.controls,.pv-hinweisleiste,.pv-wege-leiste,header,nav{display:none!important}
      .pv-glas{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;
               transform:none!important;width:${B}px!important;height:${Hh}px!important;
               display:block!important;background:#000!important;cursor:none!important}
      .pv-screen:not([hidden]){position:absolute!important;inset:0!important;margin:0!important;transform:none!important}
      .pv-screen .screen--ipad{width:${B}px!important;height:${Hh}px!important;
               margin:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
      .pv-screen .screen--iphone{display:none!important}
      *{cursor:none!important}
      ::-webkit-scrollbar{width:0!important;height:0!important}
      /* Der Balken der Texteinfügemarke soll im Film pulsieren — Tippen
         ohne sichtbare Marke sieht aus wie Geistertext. */
      .pv-eingabe{caret-color:#1C1C1F}
    `;
    document.head.appendChild(stil);
  }, { B, Hh });
  await warte(500);
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/englisch.js') });
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/buehne.js') });
  await p.evaluate(() => BUEHNE.anziehen());
  await warte(400);
}

async function canvasVorbereiten(p) {
  await p.evaluate(() => PROTOTYP.gehen('canvas'));
  await warte(2400);
  const f = p.frames().find((x) => /index\.html/.test(x.url()) && x !== p.mainFrame());
  if (f) {
    await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/handschrift.js') });
    await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/canvas-buehne.js') });
    await f.evaluate(() => CANVASBUEHNE.anziehen());
  }
  await warte(500);
  return f;
}

async function tippenAuf(p, waehler, wortlaut, halt = 900) {
  const ziel = await p.evaluate(({ waehler, wortlaut, SCHIRM }) => {
    const h = [...document.querySelectorAll(SCHIRM)]
      .filter((e) => e.getBoundingClientRect().width > 100)[0];
    if (!h) return null;
    const kandidaten = [...h.querySelectorAll(waehler)];
    const el = wortlaut
      ? kandidaten.find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().includes(wortlaut))
      : kandidaten[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const q = el.getBoundingClientRect();
    return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2) };
  }, { waehler, wortlaut, SCHIRM });
  if (!ziel) { console.log('   ✗ nicht gefunden: ' + waehler + ' « ' + (wortlaut || '')); return false; }
  await p.mouse.click(ziel.x, ziel.y);
  await warte(halt);
  return true;
}

/* Jede Szene: [Name, Vorlauf-Schirm, Aufführung]. Die Aufführung bekommt die
   Seite und darf alles. Aufgezeichnet wird vom Kontextstart an — der Schnitt
   nimmt sich hinterher das Fenster, das er braucht. */
const SZENEN = [
  ['kette', 'heute', async (p) => {
    await warte(1100);
    await tippenAuf(p, '.chain__link', '14 paragraphs', 2400);
  }],

  ['rand', 'notiz', async (p) => {
    await warte(700);
    await p.evaluate((S) => new Promise((fertig) => {
      const h = [...document.querySelectorAll(S)].find((e) => e.getBoundingClientRect().width > 100);
      const box = [...h.querySelectorAll('.scroll, [style*="overflow"]')]
        .find((e) => e.scrollHeight > e.clientHeight + 20);
      if (!box) return fertig();
      const von = box.scrollTop, t0 = performance.now(), ms = 1100, px = 340;
      (function lauf(t) {
        const a = Math.min(1, (t - t0) / ms);
        const e = a < .5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
        box.scrollTop = von + px * e;
        if (a < 1) requestAnimationFrame(lauf); else fertig();
      })(performance.now());
    }), SCHIRM);
    await warte(900);
  }],

  ['tippen', 'aufgaben', async (p) => {
    await warte(500);
    /* Die Zeile öffnen: der Klick auf das Feld macht aus dem Schaubild ein
       echtes, leeres, fokussiertes Eingabefeld (§12e). */
    await tippenAuf(p, '.row, div', 'Lab report', 700);
    await p.keyboard.type('Lab report tomorrow 2pm #lab !!!', { delay: 58 });
    await warte(1300);
  }],

  ['haken', 'aufgaben', async (p) => {
    await warte(700);
    const ziel = await p.evaluate((S) => {
      const h = [...document.querySelectorAll(S)].find((e) => e.getBoundingClientRect().width > 100);
      const zeile = [...h.querySelectorAll('.row')]
        .find((z) => /Hand in statistics/.test(z.textContent || ''));
      if (!zeile) return null;
      const k = zeile.querySelector('.check, .bw-check, button');
      if (!k) return null;
      k.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = k.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, SCHIRM);
    if (ziel) { await p.mouse.click(ziel.x, ziel.y); }
    await warte(1600);
  }],

  ['planer', 'aufgaben', async (p) => {
    await warte(600);
    await tippenAuf(p, '.segmented button', 'Planner', 1500);
  }],

  ['brett', 'aufgaben', async (p) => {
    await warte(400);
    await tippenAuf(p, '.segmented button', 'Planner', 700);
    await tippenAuf(p, '.segmented button', 'Board', 1500);
  }],

  ['liste', 'bibliothek', async (p) => {
    await warte(700);
    await tippenAuf(p, '.segmented button', 'List', 1500);
  }],

  ['flip', 'lernsitzung', async (p) => {
    await warte(800);
    await tippenAuf(p, '.btn--primary, .btn', 'Show answer', 2000);
  }],

  ['malen', 'canvas', async (p, rahmen) => {
    if (rahmen) {
      await rahmen.evaluate(() => CANVASBUEHNE.vorfuehren(3600));
      await warte(4400);
      /* und heran an die Handschrift — die Fahrt gehört zur Aufführung */
      await p.mouse.move(660, 430);
      for (let i = 0; i < 20; i++) { await p.mouse.wheel(0, -24); await warte(30); }
      await warte(900);
    }
  }],

  ['tagebuch', 'journal', async (p) => {
    await warte(700);
    await p.evaluate((S) => new Promise((fertig) => {
      const h = [...document.querySelectorAll(S)].find((e) => e.getBoundingClientRect().width > 100);
      const box = [...h.querySelectorAll('.scroll, [style*="overflow"]')]
        .find((e) => e.scrollHeight > e.clientHeight + 20);
      if (!box) return fertig();
      const von = box.scrollTop, t0 = performance.now(), ms = 1400, px = 430;
      (function lauf(t) {
        const a = Math.min(1, (t - t0) / ms);
        const e = a < .5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
        box.scrollTop = von + px * e;
        if (a < 1) requestAnimationFrame(lauf); else fertig();
      })(performance.now());
    }), SCHIRM);
    await warte(800);
  }],
];

(async () => {
  fs.mkdirSync(AUS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=' + SKALA],
  });

  for (const [name, schirm, spiel] of SZENEN) {
    const ordner = AUS + '/' + name;
    fs.mkdirSync(ordner, { recursive: true });
    for (const f of fs.readdirSync(ordner)) fs.rmSync(ordner + '/' + f, { force: true });

    const ctx = await browser.newContext({
      viewport: { width: B, height: Hh },
      deviceScaleFactor: SKALA,
      recordVideo: { dir: ordner, size: { width: B * SKALA, height: Hh * SKALA } },
    });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', (e) => fehler.push(e.message));

    await p.goto('file://' + WURZEL + '/mockups/prototyp/index.html', { waitUntil: 'load' });
    await warte(1200);
    await buehne(p);

    let rahmen = null;
    if (name === 'malen') rahmen = await canvasVorbereiten(p);

    if (schirm !== 'canvas' || name !== 'malen') {
      await p.evaluate((k) => PROTOTYP.gehen(k), schirm);
      await warte(700);
      await p.evaluate(() => BUEHNE.nachziehen());
      await warte(300);
    }

    await spiel(p, rahmen);

    await ctx.close();
    const datei = fs.readdirSync(ordner).find((f) => f.endsWith('.webm'));
    console.log('  %s  %s  %s MB  %s', name.padEnd(9), schirm.padEnd(12),
      (fs.statSync(ordner + '/' + datei).size / 1048576).toFixed(1),
      fehler.length ? '✗ ' + fehler[0] : '✓');
  }

  await browser.close();
})();
