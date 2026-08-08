/* ==========================================================================
 * bild-kontrast-messen.js — Kontrast von Text gegen echte Bildpunkte
 *
 * Warum es dieses Werkzeug gibt
 * -----------------------------
 * Ein Kontrastwert, der gegen die Kartenfarbe gerechnet ist, sagt nichts
 * über Text, der auf einem FOTO steht. Unter derselben Zeile kann ein Bild
 * an einer Stelle fast schwarz und zwei Zentimeter weiter fast weiß sein.
 * Genau dort verschwindet Schrift, und genau dort scheitern stille
 * Entwürfe an bunten Fotos.
 *
 * Wie gemessen wird
 * -----------------
 * Die Seite wird ZWEIMAL aufgenommen:
 *   1. normal — daraus kommen die Positionen der Textzeilen,
 *   2. mit `visibility:hidden` auf allen Messpunkten — daraus kommen die
 *      Bildpunkte, die ohne den Text an dieser Stelle stünden.
 * Aus (2) wird der Untergrund gelesen. Das ist genauer als jede Rechnung
 * am Modell, weil es misst, was der Bildschirm wirklich zeigt: Bild,
 * Schutzverlauf, Kartenfarbe und Deckkraft in einem.
 *
 * Zusätzlich läuft alles zweimal — mit und ohne die Schutzverläufe
 * (`body.ohne-schutz`) —, damit belegt ist, dass der Schutz nötig ist und
 * wie viel er bringt.
 *
 * Angegeben wird der UNGÜNSTIGSTE Wert (2. Perzentil der Bildpunkte), nicht
 * der Mittelwert. Ein Mittelwert verdeckt genau die hellen Stellen, an
 * denen weiße Schrift wegbricht.
 *
 * Aufruf:  node tools/bild-kontrast-messen.js
 * ========================================================================== */

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const WURZEL = path.resolve(__dirname, '..');
const SEITE = 'file://' + path.join(WURZEL, 'mockups/assets/bilder/probe.html');
const AUSGABE = path.join(WURZEL, 'mockups/assets/bilder');
const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SCHWELLE_TEXT = 4.5;

/* ── Farbrechnung (WCAG 2.1) ─────────────────────────────────────────── */

function relativeLuminanz(r, g, b) {
  const f = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function kontrast(l1, l2) {
  const hell = Math.max(l1, l2), dunkel = Math.min(l1, l2);
  return (hell + 0.05) / (dunkel + 0.05);
}

function hexZuLuminanz(hex) {
  const h = hex.replace('#', '');
  return relativeLuminanz(parseInt(h.slice(0, 2), 16),
                          parseInt(h.slice(2, 4), 16),
                          parseInt(h.slice(4, 6), 16));
}

/* ── PNG lesen (nur so viel wie nötig, ohne Fremdbibliothek) ─────────── */
/* Playwright liefert PNG. Statt einen Decoder mitzuschleppen, lassen wir
   den Browser selbst dekodieren: der Screenshot geht als data:-URL zurück
   in eine Seite und wird dort auf ein Canvas gelegt. Das ist exakt und
   kostet keine Abhängigkeit. */

async function bildpunkteLesen(seite, pngBase64, kaesten) {
  return seite.evaluate(async ({ png, kaesten }) => {
    const bild = new Image();
    bild.src = 'data:image/png;base64,' + png;
    await bild.decode();
    const c = document.createElement('canvas');
    c.width = bild.naturalWidth; c.height = bild.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bild, 0, 0);
    return kaesten.map((k) => {
      const x = Math.max(0, Math.round(k.x)), y = Math.max(0, Math.round(k.y));
      const b = Math.min(c.width - x, Math.round(k.w));
      const hh = Math.min(c.height - y, Math.round(k.h));
      if (b <= 0 || hh <= 0) return [];
      const d = ctx.getImageData(x, y, b, hh).data;
      const aus = [];
      for (let i = 0; i < d.length; i += 4) {
        if (k.ring) {
          const px = x + ((i / 4) % b), py = y + Math.floor((i / 4) / b);
          // Innenfläche des Elements auslassen …
          if (px >= k.ix && px < k.ix + k.iw && py >= k.iy && py < k.iy + k.ih) continue;
          // … und alles, was außerhalb der Bezugsfläche (des Bildes) liegt
          if (k.klipp && (px < k.klipp.x || px >= k.klipp.x + k.klipp.w ||
                          py < k.klipp.y || py >= k.klipp.y + k.klipp.h)) continue;
        }
        aus.push([d[i], d[i + 1], d[i + 2]]);
      }
      return aus;
    });
  }, { png: pngBase64, kaesten });
}

function auswerten(punkte, textLum) {
  if (!punkte.length) return null;
  const werte = punkte.map(([r, g, b]) => kontrast(textLum, relativeLuminanz(r, g, b)));
  werte.sort((a, b) => a - b);
  const perzentil = (p) => werte[Math.min(werte.length - 1,
                                          Math.floor(werte.length * p))];
  const mittel = werte.reduce((a, b) => a + b, 0) / werte.length;
  return { min: werte[0], p02: perzentil(0.02), mittel, max: werte[werte.length - 1] };
}

/* ── Ablauf ──────────────────────────────────────────────────────────── */

/* Zwei Arten von Messpunkten, und sie brauchen verschiedene Aufnahmen:
 *
 *   .mess          Text gegen das, was unter ihm liegt. Schwelle 4,5:1.
 *                  Ausgeblendet wird nur der Text — alles andere, auch die
 *                  Chipfläche, unter der er sitzt, bleibt stehen.
 *
 *   .mess-flaeche  Eine Bedienfläche gegen das BILD ringsum. Schwelle 3:1.
 *                  Ausgeblendet wird die Fläche selbst, damit das Foto
 *                  darunter sichtbar wird; gemessen wird der Ring um sie
 *                  herum. Der Ring wird auf `data-bezug` beschnitten,
 *                  sonst liest er über die Bildkante hinaus die
 *                  Seitenfarbe mit und das Ergebnis ist wertlos.
 *
 * Deshalb zwei getrennte Aufnahmen statt einer.
 */
async function messen(seite, ohneSchutz) {
  await seite.evaluate((ohne) => {
    document.body.classList.toggle('ohne-schutz', ohne);
  }, ohneSchutz);
  await seite.waitForTimeout(120);

  const punkte = await seite.evaluate(() => {
    const aus = [];
    document.querySelectorAll('.mess, .mess-flaeche').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const flaeche = el.classList.contains('mess-flaeche');
      const RING = 6;
      const eintrag = {
        name: el.dataset.mess,
        farbe: el.dataset.farbe,
        schwelle: flaeche ? 3.0 : 4.5,
        ring: flaeche,
        art: flaeche ? 'flaeche' : 'text',
        x: r.x + window.scrollX + (flaeche ? -RING : 1),
        y: r.y + window.scrollY + (flaeche ? -RING : 1),
        w: Math.max(1, r.width + (flaeche ? 2 * RING : -2)),
        h: Math.max(1, r.height + (flaeche ? 2 * RING : -2)),
        ix: r.x + window.scrollX,
        iy: r.y + window.scrollY,
        iw: r.width,
        ih: r.height,
      };
      if (flaeche) {
        const bezug = el.closest('[data-bezug]');
        if (bezug) {
          const b = bezug.getBoundingClientRect();
          // Um den Eckradius einrücken. Ohne das liest der Ring in der
          // abgerundeten Ecke an der Kachel VORBEI und misst die
          // Seitenfarbe statt des Fotos — und weil das 2. Perzentil den
          // ungünstigsten Fall nimmt, bestimmen genau diese paar
          // Eckpixel das ganze Ergebnis.
          const rad = parseFloat(getComputedStyle(bezug).borderTopLeftRadius) || 0;
          eintrag.klipp = {
            x: b.x + window.scrollX + rad, y: b.y + window.scrollY + rad,
            w: Math.max(1, b.width - 2 * rad), h: Math.max(1, b.height - 2 * rad),
          };
        }
      }
      aus.push(eintrag);
    });
    return aus;
  });

  async function aufnehmen(waehler) {
    await seite.evaluate((w) => {
      document.querySelectorAll(w).forEach((el) => {
        el.style.visibility = 'hidden';
      });
    }, waehler);
    await seite.waitForTimeout(70);
    const png = (await seite.screenshot({ fullPage: true })).toString('base64');
    await seite.evaluate((w) => {
      document.querySelectorAll(w).forEach((el) => { el.style.visibility = ''; });
    }, waehler);
    return png;
  }

  const pngText = await aufnehmen('.mess');
  const pngFlaeche = await aufnehmen('.mess-flaeche');

  const leseSeite = await seite.context().newPage();
  await leseSeite.setContent('<!doctype html><meta charset="utf-8"><body>');
  const textPunkte = punkte.map((p, i) => ({ p, i })).filter((e) => !e.p.ring);
  const flaechenPunkte = punkte.map((p, i) => ({ p, i })).filter((e) => e.p.ring);
  const werteText = await bildpunkteLesen(leseSeite, pngText,
                                          textPunkte.map((e) => e.p));
  const werteFlaeche = await bildpunkteLesen(leseSeite, pngFlaeche,
                                             flaechenPunkte.map((e) => e.p));
  await leseSeite.close();

  const roh = new Array(punkte.length);
  textPunkte.forEach((e, k) => { roh[e.i] = werteText[k]; });
  flaechenPunkte.forEach((e, k) => { roh[e.i] = werteFlaeche[k]; });

  return punkte.map((p, i) => ({
    name: p.name,
    farbe: p.farbe,
    schwelle: p.schwelle,
    art: p.art,
    ...(auswerten(roh[i], hexZuLuminanz(p.farbe)) || {}),
  }));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: BROWSER, args: ['--no-sandbox'],
  });
  const kontext = await browser.newContext({
    viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1,
  });
  const seite = await kontext.newPage();
  await seite.goto(SEITE, { waitUntil: 'networkidle' });
  await seite.waitForTimeout(400);

  const ohne = await messen(seite, true);
  const mit = await messen(seite, false);

  // Zusammenführen
  const zeilen = mit.map((m, i) => ({
    name: m.name, farbe: m.farbe,
    schwelle: m.schwelle,
    ohne: ohne[i] ? ohne[i].p02 : null,
    ohneMin: ohne[i] ? ohne[i].min : null,
    mit: m.p02, mitMin: m.min, mittel: m.mittel,
  }));

  console.log('\n=== Kontrast gegen die tatsächlichen Bildpunkte ===');
  console.log('(2. Perzentil = ungünstigste 2 % der Bildpunkte im Messfeld)\n');
  zeilen.slice().sort((a, b) => a.mit - b.mit).forEach((z) => {
    const gleich = Math.abs(z.ohne - z.mit) <= 0.05;
    console.log(
      (z.name + ' ').padEnd(52, '·') +
      ' ' + z.farbe +
      ' | ohne Verlauf ' + (gleich ? '     —' : z.ohne.toFixed(2).padStart(6)) +
      ' | wie gebaut ' + z.mit.toFixed(2).padStart(6) +
      ' | ≥ ' + z.schwelle.toFixed(1) +
      ' | ' + (z.mit >= z.schwelle ? 'hält' : 'FÄLLT DURCH'));
  });

  const durchgefallen = zeilen.filter((z) => z.mit < z.schwelle);
  console.log('\n' + zeilen.length + ' Messpunkte · ' +
              (zeilen.length - durchgefallen.length) + ' halten ihre Schwelle · ' +
              durchgefallen.length + ' darunter');

  fs.writeFileSync(path.join(AUSGABE, 'kontrast.json'),
                   JSON.stringify(zeilen, null, 2), 'utf8');

  /* Die Tabelle auf der Seite fasst zusammen. 46 Einzelzeilen liest
     niemand; entscheidend ist je Gruppe der SCHLECHTESTE Wert, denn der
     bestimmt, ob die Regel hält. Die Einzelwerte stehen vollständig in
     kontrast.json. */
  const gruppen = [
    ['Notizbuch-Titel auf dem Deckel · Serif in Ink (12 Deckel × 2 Modi)',
     (n) => n.startsWith('Notizbuch-Titel')],
    ['Datumsmarke auf dem Foto · hell', (n) => n === 'Datumsmarke auf Foto · hell'],
    ['Datumsmarke auf dem Foto · dunkel', (n) => n === 'Datumsmarke auf Foto · dunkel'],
    ['Datumsmarke auf sehr buntem Foto (Herbstlaub)',
     (n) => n.startsWith('Datumsmarke auf sehr buntem')],
    ['Datumsmarke auf fast schwarzem Foto (Gel)',
     (n) => n.startsWith('Datumsmarke auf sehr dunklem')],
    ['Kachel-Beschriftung unter dem Bild · hell',
     (n) => n.startsWith('Kachel-Beschriftung') && n.endsWith('hell')],
    ['Kachel-Beschriftung unter dem Bild · dunkel',
     (n) => n.startsWith('Kachel-Beschriftung') && n.endsWith('dunkel')],
    ['Kachel-Marke unter dem Bild · hell',
     (n) => n.startsWith('Kachel-Marke') && n.endsWith('hell')],
    ['Kachel-Marke unter dem Bild · dunkel',
     (n) => n.startsWith('Kachel-Marke') && n.endsWith('dunkel')],
  ];

  const tabelle = gruppen.map(([titel, passt]) => {
    const treffer = zeilen.filter((z) => passt(z.name));
    if (!treffer.length) return '';
    const schlecht = treffer.slice().sort((a, b) => a.mit - b.mit)[0];
    const gut = schlecht.mit >= schlecht.schwelle;
    // Wo es keinen Verlauf gibt, sind beide Werte gleich — dann steht dort
    // kein Zahlenpaar, sondern die Feststellung, dass keiner nötig war.
    const mitVerlauf = Math.abs(schlecht.ohne - schlecht.mit) > 0.05;
    const zusatz = titel.startsWith('Notizbuch')
      ? ' <span class="c-3" style="font:400 13px/16px var(--sans)">ungünstigster: '
        + schlecht.name.replace('Notizbuch-Titel ', '') + '</span>' : '';
    return '        <tr><td>' + titel + zusatz +
      '</td><td class="num">' + schlecht.farbe +
      '</td><td class="num">' + (mitVerlauf ? schlecht.ohne.toFixed(2) + ':1'
                                            : '<span class="c-3">kein Verlauf nötig</span>') +
      '</td><td class="num">' + schlecht.mit.toFixed(2) + ':1' +
      '</td><td><span class="' + (gut ? 'marke-gut">hält' : 'marke-schlecht">unter Schwelle') +
      '</span> <span class="c-3" style="font:400 13px/16px var(--sans)">≥&nbsp;' +
      String(schlecht.schwelle).replace('.', ',') + ':1</span></td></tr>';
  }).filter(Boolean).join('\n');

  const datei = path.join(AUSGABE, 'probe.html');
  let html = fs.readFileSync(datei, 'utf8');
  html = html.replace(/<tbody>[\s\S]*?<\/tbody>/,
                      '<tbody>\n' + tabelle + '\n      </tbody>');
  html = html.replace(/<th>ohne Schutz<\/th><th>mit Schutz<\/th>/,
                      '<th>ohne Verlauf</th><th>wie gebaut</th>');
  fs.writeFileSync(datei, html, 'utf8');
  console.log('Tabelle in probe.html eingesetzt.');

  await browser.close();
  process.exit(durchgefallen.length ? 1 : 0);
})();
