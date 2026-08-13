/* Die Bildunterschriften des Reels. Kleiner als in der Story, weil sie
   neben dem Gerät stehen und nicht statt seiner. Wieder im Browser gesetzt,
   mit dem Stylesheet der App. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const O = '/home/user/story/quellen/';
const T = '/home/user/story/tafeln/';
fs.mkdirSync(T, { recursive: true });

const SEITE = (inhalt) => `<!doctype html><html lang="de"><head><meta charset="utf-8">
<link rel="stylesheet" href="/home/user/Mocktest/mockups/shared/system.css">
<style>
  html,body{margin:0;width:1080px;height:1920px;background:transparent}
  body{display:flex;align-items:flex-end;justify-content:center;padding-bottom:250px;box-sizing:border-box}
  .tafel{width:1080px;text-align:center;padding:0 80px;box-sizing:border-box}
  .zeile{font-family:var(--serif);font-weight:400;color:#F7F8FA;
         font-size:46px;line-height:60px;letter-spacing:-.005em;
         text-shadow:0 2px 26px rgba(0,0,0,.85),0 0 60px rgba(0,0,0,.6)}
  .klein{font-family:var(--sans);font-weight:600;color:#D89B63;font-size:23px;
         letter-spacing:.3em;text-transform:uppercase;margin-bottom:20px;
         text-shadow:0 2px 20px rgba(0,0,0,.8)}
</style></head><body><div class="tafel">${inhalt}</div></body></html>`;

const Z = [
  ['r-notiz',   'AUS EINER VORLESUNG', 'Ein Satz wird ein Stapel Karten.'],
  ['r-aufgaben','AUFGABEN',            'Fünf Blicke auf dieselben sechs Sachen.'],
  ['r-biblio',  'BIBLIOTHEK',          'Achtzehn Notizbücher, ein Regal.'],
  ['r-lernen',  'LERNEN',              'Und die Karte weiß, woher sie kommt.'],
  ['r-canvas',  'CANVAS',              'Eine Fläche, auf der du wirklich zeichnest.'],
];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [name, oben, satz] of Z) {
    const d = T + name + '.html';
    fs.writeFileSync(d, SEITE(`<div class="klein">${oben}</div><div class="zeile">${satz}</div>`));
    await p.goto('file://' + d, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(350);
    await p.screenshot({ path: O + name + '.png', omitBackground: true });
    console.log(name.padEnd(12) + satz);
  }
  await b.close();
})();
