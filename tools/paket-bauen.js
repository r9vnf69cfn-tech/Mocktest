/* ============================================================================
 * paket-bauen.js — Baut den herunterladbaren Ordner "newmockup"
 *
 * Aufruf:  node tools/paket-bauen.js
 * Danach:  node tools/paket-pruefen.js /home/user/newmockup
 *
 * Alles, was im Repo verteilt liegt, kommt hier in eine Struktur, die per
 * Doppelklick über file:// funktioniert — ohne Server, ohne Netz, ohne Build.
 *
 *   newmockup/
 *     index.html            Startseite
 *     app-next/  13 Screens        best-of/   6 Screens
 *     shared/    system.css, mock.js
 *     _renders/  alle PNG
 *     canvas/    das lauffähige Whiteboard (index.html, css/, js/)
 *     docs/      die drei Dokumente als HTML
 *
 * Die einzigen Pfade, die sich zwischen Repo und Paket unterscheiden, sind
 * die auf das Canvas und auf die Dokumente. Sie werden hier umgeschrieben —
 * und jede Umschreibung wird gezählt, damit eine stillschweigend
 * fehlgeschlagene Ersetzung auffällt.
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = '/home/user/Mocktest';
const OUT = '/home/user/newmockup';

const log = [];
const warn = [];

function rm(p) { fs.rmSync(p, { recursive: true, force: true }); }
function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }

function copyFile(from, to) {
  if (!fs.existsSync(from)) { warn.push('fehlt: ' + from); return false; }
  mkdir(path.dirname(to));
  fs.copyFileSync(from, to);
  return true;
}

function copyDir(from, to, filter) {
  if (!fs.existsSync(from)) { warn.push('fehlt: ' + from); return 0; }
  mkdir(to);
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) n += copyDir(a, b, filter);
    else if (!filter || filter(e.name)) { fs.copyFileSync(a, b); n++; }
  }
  return n;
}

/* Ersetzt und zählt. Erwartet mindestens `min` Treffer, sonst Warnung. */
function ersetze(text, suchen, ersatz, min, wo) {
  const re = new RegExp(suchen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const treffer = (text.match(re) || []).length;
  if (treffer < min) warn.push(`${wo}: "${suchen}" nur ${treffer}× gefunden, erwartet ≥ ${min}`);
  log.push(`${wo}: "${suchen}" → "${ersatz}" (${treffer}×)`);
  return text.replace(re, ersatz);
}

/* ── 1. Grundgerüst ──────────────────────────────────────────────────── */
rm(OUT);
mkdir(OUT);

/* ── 2. Screens, Gestaltungssystem, Bilder ───────────────────────────── */
const nNext = copyDir(`${REPO}/mockups/app-next`, `${OUT}/app-next`);
const nBest = copyDir(`${REPO}/mockups/best-of`, `${OUT}/best-of`);
const nShared = copyDir(`${REPO}/mockups/shared`, `${OUT}/shared`);
/* Die Bilder kommen auf halbe Kantenlänge. Sie sind mit deviceScaleFactor 2
   gerendert, die Startseite zeigt sie 380 pt breit, und in voller Größe wiegt
   der Ordner 127 MB — ein Paket, das niemand herunterlädt, ist keins. Auf 1×
   sind sie auf jedem Bildschirm scharf; die vollen Fassungen liegen im Repo
   unter mockups/_renders/. Ohne Python fällt der Bau auf Kopieren zurück und
   sagt es. */
let nBilder = 0;
{
  mkdir(`${OUT}/_renders`);
  const skript = `
import sys, os
from PIL import Image
quelle, ziel = sys.argv[1], sys.argv[2]
LANG = 1600          # laengste Kante; die Kontaktboegen sind bis 5000 px breit
n = 0
for wurzel, _, dateien in os.walk(quelle):
    rel = os.path.relpath(wurzel, quelle)
    aus = ziel if rel == '.' else os.path.join(ziel, rel)
    os.makedirs(aus, exist_ok=True)
    for name in sorted(dateien):
        if not name.lower().endswith('.png'):
            continue
        bild = Image.open(os.path.join(wurzel, name))
        b, h = bild.size
        f = 0.5
        if max(b, h) * f > LANG:
            f = LANG / max(b, h)
        bild.resize((max(1, int(b * f)), max(1, int(h * f))), Image.LANCZOS).save(
            os.path.join(aus, name), optimize=True)
        n += 1
print(n)
`;
  const { spawnSync } = require('child_process');
  const r = spawnSync('python3', ['-c', skript, `${REPO}/mockups/_renders`, `${OUT}/_renders`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0 && /^\d+/.test((r.stdout || '').trim())) {
    nBilder = parseInt(r.stdout.trim(), 10);
    log.push(`_renders: ${nBilder} Bilder auf halbe Kantenlänge gebracht`);
  } else {
    warn.push('_renders: Verkleinern fehlgeschlagen, es wird kopiert — das Paket wird groß. ' +
      String(r.stderr || r.error || '').slice(0, 200));
    nBilder = copyDir(`${REPO}/mockups/_renders`, `${OUT}/_renders`);
  }
}
/* Seit dieser Runde mit im Paket: die Bewegungsseiten, die Plattformseiten,
   die Bildprobe — die Startseite verweist auf alle drei, und ohne sie stünden
   dort sechzehn tote Verweise. */
const nMotion = copyDir(`${REPO}/mockups/motion`, `${OUT}/motion`);
const nPlatform = copyDir(`${REPO}/mockups/platform`, `${OUT}/platform`);
const nAssets = copyDir(`${REPO}/mockups/assets`, `${OUT}/assets`);

/* ── 3. Canvas ───────────────────────────────────────────────────────── */
copyFile(`${REPO}/index.html`, `${OUT}/canvas/index.html`);
const nCss = copyDir(`${REPO}/css`, `${OUT}/canvas/css`);
const nJs = copyDir(`${REPO}/js`, `${OUT}/canvas/js`);

/* Der Bibliotheks-Knopf oben links sagt im Repo, die Bibliothek fehle. Im
   Paket ist sie da — es ist die Startseite. Also führt er dorthin zurück.
   Kein neues Bedienelement, kein verändertes Aussehen: nur der Knopf, der
   in GoodNotes ohnehin „zurück zur Bibliothek" bedeutet, tut das jetzt. */
{
  const p = `${OUT}/canvas/index.html`;
  let html = fs.readFileSync(p, 'utf8');
  const einschub = `
<!-- Nur im heruntergeladenen Paket: der Bibliotheks-Knopf führt zur Startseite. -->
<script>
(function () {
  var knopf = document.querySelector('[data-action="library"]');
  if (!knopf) return;
  knopf.title = 'Zurück zur Übersicht';
  knopf.setAttribute('aria-label', 'Zurück zur Übersicht');
  knopf.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    location.href = '../index.html';
  }, true);
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.gnApp && window.gnApp.toast) {
        window.gnApp.toast('Der Knopf oben links führt zurück zur Übersicht.');
      }
    }, 1400);
  });
})();
</script>
</body>`;
  if (!html.includes('</body>')) warn.push('canvas/index.html: kein </body> gefunden');
  html = html.replace('</body>', einschub);
  fs.writeFileSync(p, html);
  log.push('canvas/index.html: Bibliotheks-Knopf führt zur Startseite');
}

/* ── 3b. Der begehbare Prototyp ──────────────────────────────────────────
   Er ist seit Runde 3 das Hauptstück des Pakets: siebzehn Schirme, zwei
   Geräte, das Canvas im Rahmen. Er liegt eine Ebene tief (prototyp/) und
   findet system.css über ../shared/ — dieselbe Tiefe wie im Repo, also ist
   an den Verweisen nach shared/ nichts zu ändern. Nur der Weg zum Canvas
   geht im Repo zwei Ebenen hoch und im Paket in den Ordner canvas/. */
const nProto = copyDir(`${REPO}/mockups/prototyp`, `${OUT}/prototyp`);
for (const datei of ['index.html', 'prototyp.js']) {
  const p = `${OUT}/prototyp/${datei}`;
  if (!fs.existsSync(p)) { warn.push(`fehlt: prototyp/${datei}`); continue; }
  let html = fs.readFileSync(p, 'utf8');
  html = ersetze(html, '../../index.html', '../canvas/index.html', 1, `prototyp/${datei}`);
  fs.writeFileSync(p, html);
}

/* ── 3c. Wovon die Dokumente sprechen ────────────────────────────────────
   Die Texte verweisen auf den reservierten Platz des Zeichens und auf zwei
   Messwerkzeuge. Ohne sie im Paket zeigten sechs Verweise ins Leere — und
   gerade diese sechs sind die, bei denen jemand nachsehen will. */
const nBrand = copyDir(`${REPO}/assets/brand`, `${OUT}/assets/brand`);
const nTools = copyDir(`${REPO}/tools`, `${OUT}/tools`,
  (name) => /^(affordanz|rendern)\.js$/.test(name));

/* ── 4. Dokumente ────────────────────────────────────────────────────── */
const DOKUMENTE = ['konkurrenz-anatomie.html', 'das-ist-die-app.html', 'bewegung.html',
                   'velum-dna.html', 'hig-check.html', 'liesmich.html'];
for (const d of DOKUMENTE) {
  if (!copyFile(`${REPO}/docs/${d}`, `${OUT}/docs/${d}`)) continue;
  const p = `${OUT}/docs/${d}`;
  let html = fs.readFileSync(p, 'utf8');
  // Im Repo liegen die Mockups unter ../mockups/, im Paket eine Ebene höher:
  // aus ../mockups/index.html wird ../index.html, aus ../mockups/app-next/x.html
  // wird ../app-next/x.html. Eine Ersetzung deckt beides ab.
  html = ersetze(html, '"../mockups/', '"../', 0, `docs/${d}`);
  fs.writeFileSync(p, html);
}

/* ── 5. Startseite ───────────────────────────────────────────────────── */
{
  let html = fs.readFileSync(`${REPO}/mockups/index.html`, 'utf8');
  // Canvas: im Repo eine Ebene höher, im Paket im Unterordner canvas/. Der
  // Verweis steht mal im Markup, mal im Skript — mindestens einer muss greifen.
  const vorher = html;
  html = ersetze(html, 'href="../index.html"', 'href="canvas/index.html"', 0, 'index.html');
  html = ersetze(html, "'../index.html'", "'canvas/index.html'", 0, 'index.html');
  if (html === vorher) warn.push('index.html: kein Verweis auf das Canvas gefunden');
  // Dokumente: im Repo eine Ebene höher, im Paket direkt daneben.
  html = ersetze(html, 'href="../docs/', 'href="docs/', 1, 'index.html');
  fs.writeFileSync(`${OUT}/index.html`, html);
}

/* ── 6. Bilanz ───────────────────────────────────────────────────────── */
function zaehle(dir, endung) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += zaehle(path.join(dir, e.name), endung);
    else if (e.name.endsWith(endung)) n++;
  }
  return n;
}
const groesse = (() => {
  let b = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else b += fs.statSync(p).size;
    }
  })(OUT);
  return b;
})();

console.log(log.join('\n'));
console.log('\n── Bilanz ──');
console.log(`app-next   ${nNext} Dateien`);
console.log(`prototyp   ${nProto} Dateien`);
console.log(`motion     ${nMotion} · platform ${nPlatform} · assets ${nAssets + nBrand} · tools ${nTools}`);
console.log(`best-of    ${nBest} Dateien`);
console.log(`shared     ${nShared} Dateien`);
console.log(`_renders   ${nBilder} Dateien`);
console.log(`canvas     1 + ${nCss} CSS + ${nJs} JS`);
console.log(`docs       ${DOKUMENTE.filter((d) => fs.existsSync(`${OUT}/docs/${d}`)).length} von ${DOKUMENTE.length}`);
console.log(`HTML gesamt ${zaehle(OUT, '.html')} · PNG ${zaehle(OUT, '.png')} · ${(groesse / 1048576).toFixed(1)} MB`);
if (warn.length) { console.log('\n── WARNUNGEN ──\n' + warn.join('\n')); process.exitCode = 1; }
else console.log('\nkeine Warnungen');
