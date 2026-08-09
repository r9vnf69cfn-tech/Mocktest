#!/usr/bin/env node
/* ============================================================================
 * prototyp-bauen.js — der Auszug
 *
 * Zieht aus jedem der 13 Schirme in mockups/app-next/ den iPad- und den
 * iPhone-Rahmen und schreibt beide in EINE Seite: mockups/prototyp/index.html.
 *
 *   node tools/prototyp-bauen.js
 *
 * Es braucht nichts als node. Kein npm, kein Build, kein Netz.
 * Zweimal laufen ergibt Byte für Byte dieselbe Datei — es steht kein Datum,
 * keine Zufallszahl und keine Laufzeit darin.
 *
 * ── WAS MITKOMMT ───────────────────────────────────────────────────────────
 *   · <div class="screen screen--ipad">   … </div>   (der erste je Datei)
 *   · <div class="screen screen--iphone"> … </div>   (der erste je Datei)
 *   · die seiteneigenen <style>-Blöcke aus dem <head>  — MIT NAMENSRAUM
 *   · seiteneigene <script>-Blöcke ohne src aus dem <body> (nur notes-list)
 *
 * ── WAS NICHT MITKOMMT ─────────────────────────────────────────────────────
 *   · .mocktitle (die Bühnen-Beschriftung)
 *   · .device__label (iPad · 11″ quer …)
 *   · .sheetnote (der Steckbrief)
 *   · der Kommentarblock im Kopf der Datei
 *
 * ── DIE GRÖSSTE FALLE: DIE SEITENEIGENEN <style>-BLÖCKE ────────────────────
 * tasks.html und task-detail.html definieren BEIDE eine Klasse .klammer —
 * und zwar verschieden:
 *
 *     tasks.html         .klammer { grid-template-columns: 20px minmax(0,1fr) }
 *     task-detail.html   .klammer { grid-template-columns: 24px minmax(0,1fr) }
 *
 * In einem gemeinsamen Dokument gewinnt der zuletzt geschriebene Block, und
 * einer der beiden Schirme hat dann eine 4 pt falsche Rinne — das sieht man
 * erst im Bild und sucht es tagelang. Deshalb bekommt JEDER Schirm seinen
 * eigenen Namensraum: vor jeden Selektor seines Blocks wird
 * [data-pv-screen="<schlüssel>"] gesetzt.
 *
 *     .klammer                     →  [data-pv-screen="aufgaben"] .klammer
 *     :root[data-type="gross"] .jz →  :root[data-type="gross"]
 *                                     [data-pv-screen="journal"] .jz
 *     :root { --gs: 1 }            →  :root [data-pv-screen="graph"] { --gs: 1 }
 *
 * Ein führendes :root bleibt vorn stehen (sonst stünde die Schriftstufe im
 * Schirm statt am Dokument); alles andere wird Nachfahre des Schirms. Weil
 * der Namensraum die Spezifität um (0,1,0) hebt, gewinnen die Schirm-Regeln
 * weiterhin gegen system.css — genau wie vorher, als sie danach standen.
 *
 * Der Bericht am Ende nennt jede gefundene Kollision beim Namen. Sie ist
 * damit entschärft, aber sie bleibt sichtbar.
 *
 * ── DIE AUSBESSERUNGEN (§3b) ───────────────────────────────────────────────
 * Ein Schaubild und ein begehbarer Schirm sind nicht dasselbe. Vier Stellen
 * sind im Schaubild richtig und im Prototyp falsch — ein offenes Kontextmenü,
 * eine Karte, die auf der Antwort liegt, ein Häkchen, das sich nicht zeichnen
 * kann. Sie werden an der KOPIE ausgebessert, nie an der Quelle: die dreizehn
 * Schaubilder bleiben Byte für Byte, wie sie sind.
 *
 * Jede Ausbesserung nennt ihre erwartete Trefferzahl. Trifft sie daneben,
 * bricht der Lauf ab. Eine Ausbesserung, die stillschweigend nichts tut, ist
 * schlimmer als keine: man sieht am Ergebnis nicht, dass sie gefehlt hat.
 * ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const WURZEL   = path.resolve(__dirname, '..');
const QUELLE   = path.join(WURZEL, 'mockups', 'app-next');
const ZIEL_DIR = path.join(WURZEL, 'mockups', 'prototyp');
const ZIEL     = path.join(ZIEL_DIR, 'index.html');

/* ══════════════════════════════════════════════════════════════════════════
 * 1 · DIE 13 SCHIRME
 *
 * Reihenfolge und deutsche Namen wortgleich mit mock.js (SCREENS['app-next'])
 * und der Übersicht mockups/index.html — damit derselbe Schirm überall gleich
 * heißt. Der Schlüssel ist zugleich der Anker in der Adresse (#heute) und der
 * Wert von data-pv-screen. Die Wegekarte spricht die Schirme über diesen
 * Schlüssel an; prototyp.js nimmt zusätzlich den Dateinamen als Alias an.
 * ════════════════════════════════════════════════════════════════════════ */

const SCHIRME = [
  { datei: 'today.html',           schluessel: 'heute',            name: 'Heute' },
  { datei: 'library.html',         schluessel: 'bibliothek',       name: 'Bibliothek' },
  { datei: 'notes-list.html',      schluessel: 'notizen',          name: 'Notizen-Liste' },
  { datei: 'note-editor.html',     schluessel: 'notiz',            name: 'Notiz-Editor' },
  { datei: 'journal-home.html',    schluessel: 'journal',          name: 'Journal-Start' },
  { datei: 'journal-entry.html',   schluessel: 'journal-eintrag',  name: 'Journal-Eintrag' },
  { datei: 'tasks.html',           schluessel: 'aufgaben',         name: 'Aufgaben' },
  { datei: 'task-detail.html',     schluessel: 'aufgabe',          name: 'Aufgaben-Detail' },
  { datei: 'flashcards-home.html', schluessel: 'lernkarten',       name: 'Lernkarten-Start' },
  { datei: 'review-session.html',  schluessel: 'lernsitzung',      name: 'Review-Session' },
  { datei: 'graph.html',           schluessel: 'graph',            name: 'Graph' },
  { datei: 'settings.html',        schluessel: 'einstellungen',    name: 'Einstellungen' },
  { datei: 'leere-zustaende.html', schluessel: 'leere-zustaende',  name: 'Leere Zustände' },
];

/* ══════════════════════════════════════════════════════════════════════════
 * 2 · HTML AUSSCHNEIDEN — ein Tag-Leser, kein regulärer Ausdruck
 *
 * Die Schirme enthalten Kommentare mit spitzen Klammern, Attributwerte mit
 * „>" und verschachtelte <div> in vier Ebenen. Ein regulärer Ausdruck fände
 * hier das falsche Ende und schriebe stillschweigend halbe Rahmen. Deshalb
 * ein kleiner Leser, der Tags wirklich liest: Anführungszeichen, Kommentare
 * und die Rohtext-Elemente <script>/<style> sind ihm bekannt.
 * ════════════════════════════════════════════════════════════════════════ */

const LEER_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/* Liest ab pos (dort steht „<") das ganze Tag und meldet, was es war. */
function tagLesen(s, pos) {
  if (s.startsWith('<!--', pos)) {
    const e = s.indexOf('-->', pos + 4);
    return { art: 'kommentar', ende: e < 0 ? s.length : e + 3 };
  }
  if (s[pos + 1] === '!' || s[pos + 1] === '?') {
    const e = s.indexOf('>', pos);
    return { art: 'sonst', ende: e < 0 ? s.length : e + 1 };
  }
  const schluss = s[pos + 1] === '/';
  let i = pos + (schluss ? 2 : 1);
  const n0 = i;
  while (i < s.length && /[A-Za-z0-9:-]/.test(s[i])) i++;
  const name = s.slice(n0, i).toLowerCase();
  if (!name) { return { art: 'text', ende: pos + 1 }; }
  /* Attribute überlesen — Anführungszeichen achten. */
  let q = null;
  while (i < s.length) {
    const c = s[i];
    if (q) { if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'") { q = c; i++; continue; }
    if (c === '>') { i++; break; }
    i++;
  }
  const selbst = s[i - 2] === '/';
  return { art: schluss ? 'zu' : 'auf', name, selbst, ende: i };
}

/* Schneidet das Element aus, das bei „start" (dort steht „<div") beginnt.
   Gibt {html, ende} zurück oder wirft, wenn das Ende fehlt. */
function elementSchneiden(s, start, wo) {
  const auf = tagLesen(s, start);
  if (auf.art !== 'auf') throw new Error(wo + ': bei Position ' + start + ' steht kein öffnendes Tag.');
  const wurzel = auf.name;
  if (auf.selbst || LEER_TAGS.has(wurzel)) return { html: s.slice(start, auf.ende), ende: auf.ende };

  let tiefe = 1;
  let i = auf.ende;
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    if (lt < 0) break;
    const t = tagLesen(s, lt);
    if (t.art === 'auf') {
      if (t.name === 'script' || t.name === 'style' || t.name === 'textarea') {
        /* Rohtext: bis zum passenden Schluss-Tag springen, ohne hineinzusehen. */
        const zu = s.toLowerCase().indexOf('</' + t.name, t.ende);
        i = zu < 0 ? s.length : zu;
        continue;
      }
      if (t.name === wurzel && !t.selbst && !LEER_TAGS.has(t.name)) tiefe++;
      i = t.ende;
      continue;
    }
    if (t.art === 'zu' && t.name === wurzel) {
      tiefe--;
      if (tiefe === 0) return { html: s.slice(start, t.ende), ende: t.ende };
      i = t.ende;
      continue;
    }
    i = t.ende > lt ? t.ende : lt + 1;
  }
  throw new Error(wo + ': das schließende </' + wurzel + '> fehlt (Auszug ab Position ' + start + ').');
}

/* Findet alle Vorkommen von <div class="… screen … screen--<art> …"> */
function rahmenFinden(s, art) {
  const treffer = [];
  const re = /<div\b[^>]*\bclass="([^"]*)"/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const klassen = m[1].split(/\s+/);
    if (klassen.includes('screen') && klassen.includes('screen--' + art)) treffer.push(m.index);
  }
  return treffer;
}

/* ══════════════════════════════════════════════════════════════════════════
 * 3b · DIE AUSBESSERUNGEN AN DER KOPIE
 *
 * Reihenfolge zählt: die Häkchen-Ausbesserung von „heute" setzt voraus, dass
 * das Echo davor noch nicht gesetzt wurde (sie schreibt die Attribute vor die
 * bestehenden). Deshalb steht das Echo hinter ihr und sucht nach data-bw.
 * ════════════════════════════════════════════════════════════════════════ */

/* Ein Erledigen-Kästchen, das sich zeichnen kann.
 *
 * system.css baut .check aus zwei Rändern — der kann alles außer sich selbst
 * zeichnen. bewegung.css hat dafür .bw-check aus SVG, Zeichen für Zeichen
 * dasselbe Bild. Ohne den Tausch erschiene der Haken schlagartig, und die
 * Bestätigen-Bewegung fiele aus, ohne dass etwas bricht — der schlimmste Fall.
 *
 * NICHT angefasst wird .check.is-done: eine erledigte Aufgabe ist erledigt,
 * sie noch einmal zu erledigen wäre ein Weg, den es nicht gibt. Sie bleibt,
 * wie sie aussieht, und bleibt tot. */
const RE_KASTEN =
  /<button ([^>]*aria-label="[^"]*erledigen")><span class="check(?: is-checking)?"><\/span><\/button>/g;

const AUSBESSERUNGEN = [
  {
    schirm: 'bibliothek', geraete: { ipad: 1 },
    name: 'Das offene Kontextmenü schließen',
    warum: 'Im Schaubild ist das Menü der Gegenstand. Im begehbaren Schirm steht ' +
           'es ohne Anlass offen, verdeckt zwei Notizbücher und sieht aus, als hinge der Prototyp.',
    tun: (h) => h.replace(/<div style="([^"]*z-index:70[^"]*)"/g,
                          '<div data-pv-aus="kontextmenue" style="$1"'),
    zaehlen: (h) => (h.match(/data-pv-aus="kontextmenue"/g) || []).length,
  },
  {
    schirm: 'lernsitzung', geraete: { ipad: 1, iphone: 1 },
    name: 'Die Lernkarte auf die Frage drehen',
    warum: 'Im Schaubild liegt sie auf der Antwort (is-gedreht) — wer die Sitzung ' +
           'betritt, sähe die Lösung vor der Frage, und der einzige Weg vorwärts hieße „Frage".',
    tun: (h) => h.replace(/(<div class="bw-flip bw-wisch) is-gedreht(")/g, '$1$2'),
    zaehlen: (h, vorher) => (vorher.match(/bw-flip bw-wisch is-gedreht/g) || []).length -
                            (h.match(/bw-flip bw-wisch is-gedreht/g) || []).length,
  },
  {
    schirm: 'heute', geraete: { ipad: 5, iphone: 3 },
    name: 'Die Erledigen-Bewegung an die Kästchen hängen',
    warum: 'tasks.html hat sie, today nicht — dabei ist „Heute" der Einstieg und ' +
           'das erste Kästchen, das jemand antippt.',
    tun: (h) => h.replace(RE_KASTEN,
      '<button data-bw="erledigen" data-bw-zeile="^.row" $1><span class="bw-check"></span></button>'),
    zaehlen: (h) => (h.match(/data-bw="erledigen"/g) || []).length,
  },
  {
    schirm: 'heute', geraete: { ipad: 1, iphone: 1 },
    name: 'Das Echo der Laborprotokoll-Zeile auf ihren Ursprung',
    warum: 'Die Aufgabe stammt aus der Notiz Zellbiologie, und die steht auf demselben ' +
           'Schirm als Station 1 der Kette. Wird sie erledigt, leuchtet ihr Ursprung mit — ' +
           'der Faden ist die Aussage, nicht die Zeile.',
    tun: (h, art) => h.replace(
      /(data-bw="erledigen" data-bw-zeile="\^\.row" )([^>]*aria-label="Laborprotokoll[^"]*erledigen")/g,
      '$1data-bw-echo="' + (art === 'ipad' ? '#t-notiz' : '#p-notiz') + '" $2'),
    zaehlen: (h) => (h.match(/data-bw-echo="#[tp]-notiz"/g) || []).length,
  },
  {
    schirm: 'notiz', geraete: { ipad: 1, iphone: 1 },
    name: 'Die Erledigen-Bewegung an die offenen Kästchen im Editor',
    warum: 'Im Notiz-Editor stehen zwei Aufgaben mitten im Text. Eine ist erledigt und ' +
           'bleibt es; die andere muss sich erledigen lassen, sonst ist sie ein Knopf ohne Wirkung.',
    tun: (h) => h.replace(RE_KASTEN,
      '<button data-bw="erledigen" data-bw-zeile="^.row" $1><span class="bw-check"></span></button>'),
    zaehlen: (h) => (h.match(/data-bw="erledigen"/g) || []).length,
  },
];

/* ══════════════════════════════════════════════════════════════════════════
 * 3 · CSS EINGRENZEN — der Namensraum je Schirm
 * ════════════════════════════════════════════════════════════════════════ */

function ohneKommentare(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/* Kommas auf oberster Ebene — Klammern und Anführungszeichen zählen nicht. */
function selektorenTeilen(prelude) {
  const teile = [];
  let tiefe = 0, q = null, letzt = 0;
  for (let i = 0; i < prelude.length; i++) {
    const c = prelude[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '(' || c === '[') tiefe++;
    else if (c === ')' || c === ']') tiefe--;
    else if (c === ',' && tiefe === 0) { teile.push(prelude.slice(letzt, i)); letzt = i + 1; }
  }
  teile.push(prelude.slice(letzt));
  return teile.map((t) => t.trim()).filter(Boolean);
}

/* Länge des Kompaktselektors, der bei 0 beginnt (":root[data-type='gross']"). */
function kompaktLaenge(sel, ab) {
  let i = ab;
  while (i < sel.length) {
    const c = sel[i];
    if (c === '[') { const e = sel.indexOf(']', i); if (e < 0) return i; i = e + 1; continue; }
    if (c === '.' || c === '#' || c === ':') {
      i++;
      if (sel[i] === ':') i++;
      while (i < sel.length && /[\w-]/.test(sel[i])) i++;
      if (sel[i] === '(') {
        let d = 1; i++;
        while (i < sel.length && d > 0) { if (sel[i] === '(') d++; else if (sel[i] === ')') d--; i++; }
      }
      continue;
    }
    return i;
  }
  return i;
}

function selektorEingrenzen(sel, raum) {
  sel = sel.trim();
  if (!sel) return sel;
  /* Ein führendes :root gehört ans Dokument, nicht in den Schirm — sonst
     träfe die Regel für „Aa groß" nie, weil data-type am <html> steht. */
  if (/^:root\b/.test(sel)) {
    const n = kompaktLaenge(sel, ':root'.length);
    const kopf = sel.slice(0, n);
    const rest = sel.slice(n).trim();
    return rest ? kopf + ' ' + raum + ' ' + rest : kopf + ' ' + raum;
  }
  return raum + ' ' + sel;
}

function bloeckeEingrenzen(css, raum) {
  let aus = '';
  let i = 0;
  while (i < css.length) {
    const auf = css.indexOf('{', i);
    if (auf < 0) { aus += css.slice(i); break; }
    const prelude = css.slice(i, auf).trim();
    let d = 1, j = auf + 1;
    while (j < css.length && d > 0) {
      if (css[j] === '{') d++;
      else if (css[j] === '}') d--;
      j++;
    }
    const rumpf = css.slice(auf + 1, j - 1);
    if (prelude.startsWith('@')) {
      if (/^@(media|supports|layer|container|scope)\b/i.test(prelude)) {
        aus += prelude + ' {\n' + bloeckeEingrenzen(rumpf, raum) + '}\n';
      } else {
        /* @keyframes, @font-face, @property: unverändert. Namensgleiche
           Keyframes in zwei Schirmen wären eine echte Kollision — der
           Bericht meldet sie, eingrenzen lässt sie sich nicht. */
        aus += prelude + ' {' + rumpf + '}\n';
      }
    } else {
      aus += selektorenTeilen(prelude).map((s) => selektorEingrenzen(s, raum)).join(',\n') +
             ' {' + rumpf + '}\n';
    }
    i = j;
  }
  return aus;
}

/* Für den Bericht: welche Selektoren (unbearbeitet) trägt ein Block? */
function selektorenSammeln(css) {
  const raus = [];
  let i = 0;
  while (i < css.length) {
    const auf = css.indexOf('{', i);
    if (auf < 0) break;
    const prelude = css.slice(i, auf).trim();
    let d = 1, j = auf + 1;
    while (j < css.length && d > 0) {
      if (css[j] === '{') d++;
      else if (css[j] === '}') d--;
      j++;
    }
    if (!prelude.startsWith('@')) raus.push(...selektorenTeilen(prelude));
    else if (/^@(media|supports|layer|container|scope)\b/i.test(prelude)) {
      raus.push(...selektorenSammeln(css.slice(auf + 1, j - 1)));
    } else {
      raus.push(prelude.split(/\s+/).slice(0, 2).join(' '));
    }
    i = j;
  }
  return raus;
}

/* ══════════════════════════════════════════════════════════════════════════
 * 4 · DER LAUF
 * ════════════════════════════════════════════════════════════════════════ */

const bericht = { fehler: [], warnung: [], hinweis: [] };
const teile   = [];   /* je Schirm: {schluessel, name, ipad, iphone, css, js} */
const kuren   = [];   /* Zeilen für den Bericht: welche Ausbesserung wo griff */
const selVonSchirm = new Map();

for (const schirm of SCHIRME) {
  const pfad = path.join(QUELLE, schirm.datei);
  if (!fs.existsSync(pfad)) {
    bericht.fehler.push(schirm.datei + ': Datei fehlt.');
    continue;
  }
  const src = fs.readFileSync(pfad, 'utf8');
  const kopfEnde = src.indexOf('<body');
  const kopf = kopfEnde < 0 ? '' : src.slice(0, kopfEnde);
  const rumpf = kopfEnde < 0 ? src : src.slice(kopfEnde);

  /* ── die beiden Rahmen ── */
  const eintrag = { schluessel: schirm.schluessel, name: schirm.name, datei: schirm.datei };
  let ok = true;
  for (const art of ['ipad', 'iphone']) {
    const stellen = rahmenFinden(src, art);
    if (stellen.length === 0) {
      bericht.fehler.push(schirm.datei + ': kein .screen--' + art + ' gefunden.');
      ok = false;
      continue;
    }
    if (stellen.length > 1) {
      bericht.warnung.push(schirm.datei + ': ' + stellen.length + ' × .screen--' + art +
        ' — genommen wird der erste, die übrigen ' + (stellen.length - 1) +
        ' bleiben im Schaubild (dort sind es Varianten, kein eigener Schirm).');
    }
    try {
      const stueck = elementSchneiden(src, stellen[0], schirm.datei);
      eintrag[art] = stueck.html;
    } catch (e) {
      bericht.fehler.push(e.message);
      ok = false;
    }
  }
  if (!ok) continue;

  /* Gegenprobe: die Zahl der öffnenden und schließenden <div> muss stimmen.
     Ein halber Rahmen risse die ganze Seite auf, und man sähe es erst spät. */
  for (const art of ['ipad', 'iphone']) {
    const h = eintrag[art].replace(/<!--[\s\S]*?-->/g, '');
    const a = (h.match(/<div\b/g) || []).length;
    const z = (h.match(/<\/div>/g) || []).length;
    if (a !== z) {
      bericht.fehler.push(schirm.datei + ' (' + art + '): ' + a + ' × <div> gegen ' + z +
        ' × </div> — der Auszug ist nicht geschlossen.');
    }
  }

  /* ── die Ausbesserungen an der Kopie (§3b) ── */
  for (const kur of AUSBESSERUNGEN) {
    if (kur.schirm !== schirm.schluessel) continue;
    for (const art of ['ipad', 'iphone']) {
      const soll = kur.geraete[art];
      if (soll == null) continue;
      const vorher = eintrag[art];
      const nachher = kur.tun(vorher, art);
      const ist = kur.zaehlen(nachher, vorher);
      if (ist !== soll) {
        bericht.fehler.push(schirm.datei + ' (' + art + '): Ausbesserung „' + kur.name +
          '" trifft ' + ist + '× statt ' + soll + '×. Die Quelle hat sich geändert — ' +
          'die Ausbesserung in tools/prototyp-bauen.js §3b muss nachgezogen werden.');
      } else {
        kuren.push('  ' + schirm.schluessel.padEnd(12) + art.padEnd(7) + ist + '×  ' + kur.name);
      }
      eintrag[art] = nachher;
    }
  }

  /* ── die seiteneigenen <style>-Blöcke aus dem <head> ── */
  const raum = '[data-pv-screen="' + schirm.schluessel + '"]';
  const bloecke = [...kopf.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  if (bloecke.length) {
    const roh = ohneKommentare(bloecke.join('\n'));
    selVonSchirm.set(schirm.schluessel, new Set(selektorenSammeln(roh)));
    eintrag.css = bloeckeEingrenzen(roh, raum).trim();
  } else {
    eintrag.css = '';
  }

  /* ── seiteneigenes <script> ohne src aus dem <body> ── */
  const skripte = [...rumpf.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  eintrag.js = skripte.join('\n').trim();
  if (eintrag.js) {
    bericht.hinweis.push(schirm.datei + ': seiteneigenes <script> übernommen (' +
      eintrag.js.split('\n').length + ' Zeilen) — es spannt Fäden mit MOCK.thread().');
  }

  teile.push(eintrag);
}

/* ── Kollisionen melden ── */
const kollisionen = new Map();
for (const [a, mengeA] of selVonSchirm) {
  for (const [b, mengeB] of selVonSchirm) {
    if (a >= b) continue;
    for (const sel of mengeA) if (mengeB.has(sel)) {
      if (!kollisionen.has(sel)) kollisionen.set(sel, new Set());
      kollisionen.get(sel).add(a);
      kollisionen.get(sel).add(b);
    }
  }
}

if (bericht.fehler.length) {
  console.error('\nprototyp-bauen: ABBRUCH — die Rahmen stehen nicht in der erwarteten Form.\n');
  bericht.fehler.forEach((z) => console.error('  FEHLER  ' + z));
  console.error('');
  process.exit(1);
}

/* ══════════════════════════════════════════════════════════════════════════
 * 5 · DIE SEITE SCHREIBEN
 *
 * Die Hülle steht hier, weil index.html vollständig erzeugt wird und nie von
 * Hand angefasst werden soll. Gestalt (prototyp.css) und Bedienung
 * (prototyp.js) liegen daneben und werden von Hand gepflegt.
 * ════════════════════════════════════════════════════════════════════════ */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function rahmenBlock(eintrag, art) {
  return [
    '  <div class="pv-screen" data-pv-screen="' + eintrag.schluessel + '"' +
      ' data-pv-geraet="' + art + '"' +
      ' data-pv-datei="' + esc(eintrag.datei) + '"' +
      ' data-pv-name="' + esc(eintrag.name) + '" hidden>',
    eintrag[art].split('\n').map((z) => '  ' + z).join('\n'),
    '  </div>',
  ].join('\n');
}

const cssTeile = teile.filter((t) => t.css).map((t) =>
  '/* ── ' + t.datei + ' · Namensraum [data-pv-screen="' + t.schluessel + '"] ── */\n' + t.css);

const jsTeile = teile.filter((t) => t.js).map((t) =>
  '/* ── seiteneigenes Skript aus ' + t.datei + ' ── */\n(function(){\n' + t.js + '\n})();');

const umschalter = [
  '<div class="pv-geraetwahl" role="radiogroup" aria-label="Gerät">',
  '  <button type="button" class="pv-geraetwahl__knopf" role="radio" data-pv-geraet-wahl="ipad" aria-checked="true">iPad</button>',
  '  <button type="button" class="pv-geraetwahl__knopf" role="radio" data-pv-geraet-wahl="iphone" aria-checked="false">iPhone</button>',
  '</div>',
].join('\n');

const seite = `<!DOCTYPE html>
<html lang="de" data-theme="light" data-type="standard">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Velum — Prototyp</title>
<link rel="stylesheet" href="../shared/system.css">
<link rel="stylesheet" href="../shared/bewegung.css">
<link rel="stylesheet" href="prototyp.css">
<style>
/* ══════════════════════════════════════════════════════════════════════════
 * SEITENEIGENES CSS DER 13 SCHIRME — erzeugt von tools/prototyp-bauen.js
 *
 * Nicht von Hand ändern. Jeder Block steht wortgleich in seiner Quelldatei
 * unter mockups/app-next/; hier ist ihm nur der Namensraum seines Schirms
 * vorangestellt, damit zwei Schirme dieselbe lokale Klasse verschieden
 * definieren dürfen (.klammer in tasks.html gegen task-detail.html).
 * ════════════════════════════════════════════════════════════════════════ */
${cssTeile.join('\n\n')}
</style>
</head>
<body class="pv">

<!-- ============================================================================
DER BEGEHBARE PROTOTYP

Erzeugt von tools/prototyp-bauen.js aus den 13 Schaubildern in
mockups/app-next/. Nicht von Hand ändern — der nächste Lauf überschreibt alles.

Die Schaubilder bleiben, wie sie sind: dort stehen iPad und iPhone
nebeneinander auf einer Bühne, darunter der Steckbrief. Diese Seite ist die
zweite Lesart derselben Schirme — ein Gerät, in dem man sich bewegt.

Ohne Funktion: nichts wird gespeichert, nichts eingegeben, nichts gerechnet.
Was keinen Weg hat, hat auch keinen Klickfinger (siehe prototyp.js §4).
============================================================================= -->

<header class="pv-kopf">
  <div class="pv-kopf__zeile">
    <h1 class="pv-kopf__titel">Velum</h1>
    ${umschalter.split('\n').join('\n    ')}
  </div>
  <p class="pv-kopf__hinweis" id="pv-hinweis">
    Begehbarer Entwurf, ohne Funktion. Notizbücher, Zeilen, Karten und Chips führen
    wirklich — was keinen Weg hat, zeigt auch keinen Klickfinger.
    <kbd>←</kbd> <kbd>→</kbd> blättern durch alle 13 Schirme, <kbd>esc</kbd> geht zurück.
    <a href="../../index.html">Das Canvas ist ein eigenes Mockup</a> und öffnet in einem neuen Tab.
  </p>
</header>

<main class="pv-buehne" id="pv-buehne">
  <div class="pv-skala" id="pv-skala">
    <div class="pv-glas" id="pv-glas" data-pv-geraet="ipad">
${teile.map((t) => rahmenBlock(t, 'ipad')).join('\n')}
${teile.map((t) => rahmenBlock(t, 'iphone')).join('\n')}
    </div>
  </div>
</main>

<p class="pv-fuss" role="status" aria-live="polite" id="pv-fuss"></p>

<script src="../shared/mock.js"></script>
<script src="../shared/bewegung.js"></script>
<!-- Die Wegekarte — welches Element wohin führt — steht als Datenblock in
     prototyp.js §10. Wer sie von außen ersetzen will, legt vor dieser Zeile
     ein eigenes <script> mit window.VELUM_WEGE ab; prototyp.js nimmt es dann
     statt der eingebauten Karte. -->
<script src="prototyp.js"></script>
<script>
/* ══════════════════════════════════════════════════════════════════════════
 * SEITENEIGENE SKRIPTE DER SCHIRME — erzeugt von tools/prototyp-bauen.js
 * Wortgleich aus der Quelldatei übernommen, je in eine eigene Funktion
 * gelegt, damit zwei Schirme sich keine Namen teilen.
 * ════════════════════════════════════════════════════════════════════════ */
${jsTeile.join('\n\n')}
</script>
</body>
</html>
`;

fs.mkdirSync(ZIEL_DIR, { recursive: true });
fs.writeFileSync(ZIEL, seite, 'utf8');

/* ══════════════════════════════════════════════════════════════════════════
 * 6 · DER BERICHT
 * ════════════════════════════════════════════════════════════════════════ */

const kb = (n) => (n / 1024).toFixed(0) + ' kB';
console.log('');
console.log('prototyp-bauen  ·  ' + teile.length + ' Schirme  ·  ' + (teile.length * 2) + ' Rahmen');
console.log('  geschrieben:  ' + path.relative(WURZEL, ZIEL) + '  (' + kb(Buffer.byteLength(seite)) + ')');
console.log('');

if (kollisionen.size) {
  console.log('  KOLLISIONEN im seiteneigenen CSS (durch Namensraum entschärft):');
  [...kollisionen.keys()].sort().forEach((sel) => {
    console.log('    ' + sel.padEnd(28) + ' ' + [...kollisionen.get(sel)].sort().join(' · '));
  });
  console.log('');
} else {
  console.log('  Keine Kollision im seiteneigenen CSS gefunden.');
  console.log('');
}

if (kuren.length) {
  console.log('  AUSBESSERUNGEN an der Kopie (§3b) — die Schaubilder bleiben unberührt:');
  kuren.forEach((z) => console.log(z));
  console.log('');
}

bericht.warnung.forEach((z) => console.log('  WARNUNG  ' + z));
bericht.hinweis.forEach((z) => console.log('  HINWEIS  ' + z));
if (bericht.warnung.length || bericht.hinweis.length) console.log('');

const ohneCss = teile.filter((t) => !t.css).length;
console.log('  ' + (teile.length - ohneCss) + ' von ' + teile.length +
  ' Schirmen bringen eigenes CSS mit; ' + ohneCss + ' kommen mit system.css aus.');
console.log('');
