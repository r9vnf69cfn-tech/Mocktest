/* reel-tafeln.js — die Schrift des Reels.
 *
 * Gesetzt wird im Browser, mit dem Stylesheet der App: dieselbe Serif, in
 * der auch die Schirme gesetzt sind. Nicht in ein Bildwerkzeug getippt und
 * nicht von einem Modell erzeugt — sonst hätte der Film zwei Schriften, und
 * die zweite verrät die erste.
 *
 * Der Bau folgt einer Regel: ERST BEHAUPTEN, DANN BEWEISEN. Die Zeile steht
 * nie über dem Schirm, den sie meint, sondern vor ihm. Wer eine Behauptung
 * über ein Bild legt, macht beide unleserlich; wer sie davorstellt, gibt dem
 * Bild eine Aufgabe. Im Reel heißt das: eine Zeile hält 1,2 Sekunden allein,
 * dann kommt der Schirm und macht sie wahr.
 *
 * Zwei Formate:
 *   · gross  — steht allein im Bild, große Serifenzeile
 *   · rand   — steht unter dem Gerät, kleiner, mit Auge oben drüber
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const O = '/home/user/story/quellen/';
const T = '/home/user/story/tafeln/';
const MARKE = '/home/user/Mocktest/assets/brand/logo/wordmark-onDark-transparent.png';
fs.mkdirSync(T, { recursive: true });
fs.mkdirSync(O, { recursive: true });

const SEITE = (inhalt, unten) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="/home/user/Mocktest/mockups/shared/system.css">
<style>
  html,body{margin:0;width:1080px;height:1920px;background:transparent}
  body{display:flex;justify-content:center;box-sizing:border-box;
       align-items:${unten ? 'flex-end' : 'center'};
       padding-bottom:${unten ? '336px' : '0'}}
  .tafel{width:1080px;text-align:center;padding:0 90px;box-sizing:border-box}

  /* Die große Zeile: sie steht allein, also darf sie groß sein. */
  .gross{font-family:var(--serif);font-weight:400;color:#F4F5F7;
         font-size:76px;line-height:92px;letter-spacing:-.018em;
         text-shadow:0 2px 40px rgba(0,0,0,.55)}
  .gross em{font-style:italic}

  /* Die Randzeile: sie steht unter einem Gerät und darf ihm nicht die
     Aufmerksamkeit nehmen. Kleiner, aber nicht zaghaft. */
  .rand{font-family:var(--serif);font-weight:400;color:#F7F8FA;
        font-size:52px;line-height:66px;letter-spacing:-.012em;
        text-shadow:0 2px 30px rgba(0,0,0,.9),0 0 70px rgba(0,0,0,.55)}
  .auge{font-family:var(--sans);font-weight:600;color:#D89B63;font-size:22px;
        letter-spacing:.34em;text-transform:uppercase;margin-bottom:22px;
        text-shadow:0 2px 24px rgba(0,0,0,.85)}

  .marke{width:700px;display:block;margin:0 auto}
  .unterschrift{font-family:var(--sans);font-weight:600;color:#D89B63;
                font-size:23px;letter-spacing:.32em;text-transform:uppercase;
                margin-top:46px}
  .module{font-family:var(--sans);font-weight:500;color:#9AA0AC;font-size:26px;
          letter-spacing:.14em;margin-top:26px}
  .strich{display:inline-block;width:52px;height:2px;background:#D89B63;
          vertical-align:middle;margin:0 26px}
</style></head><body><div class="tafel">${inhalt}</div></body></html>`;

const gross = (s) => [SEITE(`<div class="gross">${s}</div>`, false), false];
const rand = (auge, s) => [SEITE(`<div class="auge">${auge}</div><div class="rand">${s}</div>`, true), true];

/* Die Zeilen. Jede benennt, was der nächste Schirm zeigt — keine Zeile
   verspricht etwas, das die Aufnahme nicht einlöst. */
const TAFELN = [
  /* Auftakt und Schluss */
  ['v-auftakt', gross('One place for<br>everything you learn.')],
  ['v-marke', [SEITE(
    `<img class="marke" src="${MARKE}">` +
    `<div class="module">Canvas · Notes · Journal · Tasks · Flashcards</div>` +
    `<div class="unterschrift"><span class="strich"></span>This winter<span class="strich"></span></div>`,
    false), false]],
  ['v-marke-nackt', [SEITE(`<img class="marke" src="${MARKE}">`, false), false]],

  /* Die Zeilen am Rand, je eine je Schirm */
  ['v-heute',   rand('Today', 'Six tasks, twenty-three cards,<br>one unfinished draft.')],
  ['v-notiz',   rand('Notes', 'Write it once. The margin<br>keeps track of the rest.')],
  ['v-karten',  rand('Flashcards', 'Every card remembers the<br>sentence it came from.')],
  ['v-lernen',  rand('Review', 'And it shows you the sentence<br>before it shows the answer.')],
  ['v-canvas',  rand('Canvas', 'An endless sheet — pen, marker,<br>tape, shapes, text.')],
  ['v-biblio',  rand('Library', 'Eighteen notebooks.<br>One shelf, two ways to read it.')],
  ['v-aufgaben',rand('Tasks', 'Five views of the same six things.')],
  ['v-journal', rand('Journal', 'And at the end of the day,<br>why any of it mattered.')],

  /* Eine große Zeile in der Mitte des Films, als Atempause */
  ['v-mitte', gross('It all connects.<br><em>That is the whole idea.</em>')],
];

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--allow-file-access-from-files'],
  });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const [name, [html]] of TAFELN) {
    const datei = T + name + '.html';
    fs.writeFileSync(datei, html);
    await p.goto('file://' + datei, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(380);
    await p.screenshot({ path: O + name + '.png', omitBackground: true });
    console.log('  ' + name);
  }
  await b.close();
  console.log(TAFELN.length + ' Tafeln in ' + O);
})();
