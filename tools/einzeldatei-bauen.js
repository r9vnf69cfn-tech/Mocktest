/* einzeldatei-bauen.js — der Prototyp als EINE Datei.

   Aufruf:  node tools/einzeldatei-bauen.js  [zieldatei]
   Vorgabe: /home/user/velum-prototyp.html

   Alles wird eingebettet: CSS, JS, Bilder als data:-URI, die Hintergrund-
   bilder aus dem CSS und das ganze Canvas als data:text/html;base64 im
   iframe. Ergebnis laeuft ueber file:// und ohne Netz — und genau diese
   Datei geht als Artefakt hinaus.

   Achtung beim Aendern: ein </script> in einer Zeichenkette beendet das
   umgebende <script>. Es muss als <\/script> geschrieben werden, sonst ist
   in der Einzeldatei das gesamte JavaScript tot (bewegung.js enthaelt zwei).
*/
const AUS = process.argv[2] || '/home/user/velum-prototyp.html';
/* Baut aus dem Prototyp eine einzige, in sich geschlossene Datei —
   alles eingebettet, damit man sie ohne Ordner öffnen kann. */
const fs = require('fs');
const path = require('path');
const P = '/home/user/Mocktest/mockups/prototyp';
const S = '/home/user/Mocktest/mockups';

let cssBilder = 0, cssBytes = 0;
let html = fs.readFileSync(P + '/index.html', 'utf8');
const lies = (p) => fs.readFileSync(path.resolve(P, p), 'utf8');

// 1 · Stylesheets einsetzen
html = html.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g, (m, p) => {
  try {
    // url(...) im CSS ist relativ zur CSS-Datei, nicht zur Seite. Beim
    // Einbetten geht dieser Bezug verloren — die zwoelf Deckelpapiere
    // waeren weiss. Also auch sie als Daten-URI einsetzen.
    let css = lies(p);
    const basis = path.dirname(path.resolve(P, p));
    css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (mm, q, u) => {
      if (/^(data:|https?:)/.test(u)) return mm;
      const abs = path.resolve(basis, u);
      if (!fs.existsSync(abs)) { console.log('CSS-Bild fehlt:', u); return mm; }
      const b = fs.readFileSync(abs);
      cssBilder++; cssBytes += b.length;
      const typ = abs.endsWith('.png') ? 'png' : 'jpeg';
      return 'url("data:image/' + typ + ';base64,' + b.toString('base64') + '")';
    });
    return '<style>\n/* ' + p + ' */\n' + css + '\n</style>';
  }
  catch (e) { console.log('CSS fehlt:', p); return m; }
});

// 2 · Skripte einsetzen
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, p) => {
  try {
    // Ein </script> im Quelltext beendet das Skript-Element sofort — auch
    // mitten in einer Zeichenkette. bewegung.js enthaelt zwei davon.
    const js = lies(p).replace(/<\/script>/g, '<\\/script>');
    return '<script>\n/* ' + p + ' */\n' + js + '\n</script>';
  }
  catch (e) { console.log('JS fehlt:', p); return m; }
});

// 3 · Bilder als Daten-URI
let bilder = 0, bytes = 0;
html = html.replace(/src="(\.\.\/assets\/bilder\/[^"]+)"/g, (m, p) => {
  const abs = path.resolve(P, p);
  if (!fs.existsSync(abs)) { console.log('Bild fehlt:', p); return m; }
  const b = fs.readFileSync(abs);
  bilder++; bytes += b.length;
  return 'src="data:image/jpeg;base64,' + b.toString('base64') + '"';
});

// 4 · Der Verweis aufs Canvas führt aus dem Paket heraus — im Einzeldokument
//     gibt es ihn nicht. Ehrlich beschriften statt tot verlinken.
html = html.replace(/href="\.\.\/\.\.\/index\.html"/g, 'href="#" data-kein-weg="canvas" title="Das Canvas ist ein eigenes Mockup und in dieser Einzeldatei nicht enthalten"');

fs.writeFileSync(AUS, html);
console.log(`CSS-Bilder eingebettet: ${cssBilder} (${(cssBytes/1048576).toFixed(1)} MB)`);
console.log(`Bilder eingebettet: ${bilder} (${(bytes/1048576).toFixed(1)} MB)`);
console.log('Datei:', (Buffer.byteLength(html)/1048576).toFixed(1), 'MB');
console.log('Restliche externe Verweise:', (html.match(/(href|src)="(?!#|data:)[^"]*"/g) || []).slice(0,5));

/* ── Das Canvas als eigenständiges Dokument in den Rahmen ─────────────────
 * Der Prototyp lädt das Canvas per iframe aus ../../index.html. In der
 * Einzeldatei gibt es diesen Pfad nicht. Also wird das Canvas selbst zu einer
 * in sich geschlossenen Seite gemacht und als data:-URL eingesetzt — dann
 * bleibt es das echte, lauffähige Canvas und nicht ein Bild davon.
 * ───────────────────────────────────────────────────────────────────────── */
{
  const W = '/home/user/Mocktest';
  let c = fs.readFileSync(W + '/index.html', 'utf8');
  const holen = (rel) => fs.readFileSync(path.resolve(W, rel), 'utf8');
  c = c.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g,
    (m, u) => { try { return '<style>' + holen(u) + '</style>'; } catch (e) { return m; } });
  c = c.replace(/<script src="([^"]+)"><\/script>/g,
    (m, u) => { try { return '<script>' + holen(u).replace(/<\/script>/g, '<\\/script>') + '</script>'; }
                catch (e) { return m; } });
  const uri = 'data:text/html;charset=utf-8;base64,' + Buffer.from(c, 'utf8').toString('base64');
  const vorher = (html.match(/data-pv-canvas="[^"]*"/g) || []).length;
  html = html.replace(/data-pv-canvas="[^"]*"/g, 'data-pv-canvas="' + uri + '"');
  fs.writeFileSync(AUS, html);
  console.log(`Canvas eingebettet: ${vorher} Rahmen, ${(uri.length/1048576).toFixed(1)} MB je Rahmen`);
  console.log('Datei gesamt:', (Buffer.byteLength(html)/1048576).toFixed(1), 'MB');
}
