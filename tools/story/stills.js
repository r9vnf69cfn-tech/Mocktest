/* stills.js — die scharfen Standbilder für den Taktschnitt.
 *
 * Der Taktschnitt (takt.py) lebt von Punch-Ins: ein Ausschnitt der
 * Oberfläche füllt das 9:16-Bild. Aus dem Mitschnitt (2388 px breit)
 * heißt ein enger Ausschnitt 2- bis 4-faches Hochskalieren — weich,
 * also billig. Darum werden die stehenden Ausschnitte hier NEU
 * geschossen, mit deviceScaleFactor 3 (3582 × 2502): dann wird beim
 * Punch-In herunterskaliert statt hoch, und die Schrift bleibt Schrift.
 *
 * Bewegte Fenster (die Kartendrehung, der Canvas-Zoom, die
 * Ansichtswechsel) kommen weiterhin aus dem Mitschnitt — Bewegung
 * verzeiht Weichheit, Stillstand nicht.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const WURZEL = '/home/user/Mocktest';
const AUS = '/home/user/story/stills';
const B = 1194, Hh = 834;

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

/* Welche Bilder gebraucht werden. 'tun' läuft nach dem Schirmwechsel und
   stellt den Zustand her, den der Schnitt zeigen will. */
const BILDER = [
  { name: 'heute',      schirm: 'heute' },
  { name: 'notiz',      schirm: 'notiz' },
  { name: 'notiz-rand', schirm: 'notiz', tun: async (p, SCHIRM) => {
      await p.evaluate((S) => {
        const h = [...document.querySelectorAll(S)].find((e) => e.getBoundingClientRect().width > 100);
        const box = [...h.querySelectorAll('.scroll, [style*="overflow"]')]
          .find((e) => e.scrollHeight > e.clientHeight + 20);
        if (box) box.scrollTop = 300;
      }, SCHIRM);
      await warte(500);
    } },
  { name: 'lernkarten', schirm: 'lernkarten' },
  { name: 'frage',      schirm: 'lernsitzung' },
  { name: 'canvas',     schirm: 'canvas', halt: 2600 },
  { name: 'bibliothek', schirm: 'bibliothek' },
  { name: 'aufgaben',   schirm: 'aufgaben' },
  { name: 'journal',    schirm: 'journal' },
  { name: 'journal-tief', schirm: 'journal', tun: async (p, SCHIRM) => {
      await p.evaluate((S) => {
        const h = [...document.querySelectorAll(S)].find((e) => e.getBoundingClientRect().width > 100);
        const box = [...h.querySelectorAll('.scroll, [style*="overflow"]')]
          .find((e) => e.scrollHeight > e.clientHeight + 20);
        if (box) box.scrollTop = 360;
      }, SCHIRM);
      await warte(500);
    } },
];

(async () => {
  fs.mkdirSync(AUS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=3'],
  });
  const p = await browser.newPage({ viewport: { width: B, height: Hh }, deviceScaleFactor: 3 });
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));

  await p.goto('file://' + WURZEL + '/mockups/prototyp/index.html', { waitUntil: 'load' });
  await warte(1600);

  /* Dieselbe Bühne wie im Film: Werkstattseite weg, Englisch, Zeichen. */
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
    `;
    document.head.appendChild(stil);
  }, { B, Hh });
  await warte(700);

  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/englisch.js') });
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/buehne.js') });
  await p.evaluate(() => BUEHNE.anziehen());
  await warte(500);

  /* Canvas wecken und beschreiben, wie im Film. */
  await p.evaluate(() => PROTOTYP.gehen('canvas'));
  await warte(2600);
  const f = p.frames().find((x) => /index\.html/.test(x.url()) && x !== p.mainFrame());
  if (f) {
    await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/handschrift.js') });
    await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/canvas-buehne.js') });
    await f.evaluate(() => CANVASBUEHNE.anziehen());
    console.log('Canvas beschrieben');
  }
  await warte(600);

  const SCHIRM = '[data-pv-screen]:not([hidden])[data-pv-geraet="ipad"]';
  for (const b of BILDER) {
    await p.evaluate((k) => PROTOTYP.gehen(k), b.schirm);
    await warte(b.halt || 900);
    await p.evaluate(() => BUEHNE.nachziehen());
    await warte(300);
    if (b.tun) await b.tun(p, SCHIRM);
    await p.screenshot({ path: AUS + '/' + b.name + '.png' });
    console.log('  ' + b.name);
  }

  console.log('Seitenfehler: ' + (fehler.length ? fehler.slice(0, 2).join(' | ') : 'keine'));
  await browser.close();
})();
