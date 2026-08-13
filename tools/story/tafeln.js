/* Die Schrifttafeln werden im Browser gesetzt, mit derselben Schrift, in der
   auch die App-Screens gerendert sind (Charter — dritter Eintrag in --serif
   und die erste Schrift dieser Kette, die auf diesem Rechner liegt). Nicht
   in ein Bildwerkzeug getippt, nicht von einem Modell erzeugt.
   Die Seiten werden als echte Dateien geschrieben und geöffnet: über
   setContent() blockiert Chromium jede file://-Unterressource, dann fehlen
   Stylesheet UND Wortmarke, ohne dass es auffällt. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const O = '/home/user/story/quellen/';
const T = '/home/user/story/tafeln/';
fs.mkdirSync(T, { recursive: true });

const SEITE = (inhalt) => `<!doctype html><html lang="de"><head><meta charset="utf-8">
<link rel="stylesheet" href="/home/user/Mocktest/mockups/shared/system.css">
<style>
  html,body{margin:0;width:1080px;height:1920px;background:transparent}
  body{display:flex;align-items:center;justify-content:center}
  .tafel{width:1080px;text-align:center;padding:0 96px;box-sizing:border-box}
  .zeile{font-family:var(--serif);font-weight:400;color:#F2F3F5;
         font-size:60px;line-height:78px;letter-spacing:-.01em;
         text-shadow:0 2px 34px rgba(0,0,0,.6)}
  .stempel{font-family:var(--sans);font-weight:600;color:#F2F3F5;
           font-size:38px;letter-spacing:.36em;text-transform:uppercase;
           text-shadow:0 2px 34px rgba(0,0,0,.6);white-space:nowrap}
  .strich{display:inline-block;width:58px;height:2px;background:#D89B63;
          vertical-align:middle;margin:0 30px}
  .marke{width:720px;display:block;margin:0 auto}
  .klein{font-family:var(--sans);font-weight:600;color:#D89B63;
         font-size:25px;letter-spacing:.3em;text-transform:uppercase;margin-top:40px}
</style></head><body><div class="tafel">${inhalt}</div></body></html>`;

const M = '/home/user/Mocktest/assets/brand/logo/wordmark-onDark-transparent.png';
const TAFELN = [
  ['t-faden',       `<div class="zeile">Jede Karte weiß,<br>aus welchem Satz sie kommt.</div>`],
  ['t-faden-en',    `<div class="zeile">Every card remembers<br>the sentence it came from.</div>`],
  ['t-winter',      `<div class="stempel"><span class="strich"></span>This winter<span class="strich"></span></div>`],
  ['t-marke',       `<img class="marke" src="${M}"><div class="klein">This winter</div>`],
  ['t-marke-nackt', `<img class="marke" src="${M}">`],
];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const [name, inhalt] of TAFELN) {
    const datei = T + name + '.html';
    fs.writeFileSync(datei, SEITE(inhalt));
    await p.goto('file://' + datei, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    const pruef = await p.evaluate(() => {
      const e = document.querySelector('.zeile, .stempel, .marke');
      const r = e.getBoundingClientRect();
      const bild = document.querySelector('.marke');
      return { kasten: Math.round(r.width) + '×' + Math.round(r.height),
               schrift: e.tagName === 'IMG' ? '(Bild)' : getComputedStyle(e).fontFamily,
               marke: bild ? (bild.naturalWidth > 0 ? 'geladen' : 'FEHLT') : '—',
               css: !!getComputedStyle(document.body).getPropertyValue('--serif').trim() };
    });
    await p.screenshot({ path: O + name + '.png', omitBackground: true });
    console.log(name.padEnd(15) + pruef.kasten.padEnd(11) + 'Marke ' + pruef.marke.padEnd(9) +
                'system.css ' + (pruef.css ? 'ja' : 'NEIN') + '  ' + String(pruef.schrift).slice(0, 40));
  }
  await b.close();
})();
