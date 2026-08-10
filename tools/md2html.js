#!/usr/bin/env node
/* md2html.js — Markdown -> eigenstaendige HTML-Dokumentseite.
   Keine npm-Pakete. Deckt genau das ab, was in den drei Quellen vorkommt.  */

const fs = require('fs');
const path = require('path');

const REPO = '/home/user/Mocktest';

/* ───────────────────────── 0. Werkzeug ───────────────────────── */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

function slug(s) {
  let t = String(s).normalize('NFC');
  t = t.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
       .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
       .replace(/ß/g, 'ss');
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return t || 'abschnitt';
}

function stripInline(s) {
  return String(s)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

function safeHref(h) {
  const s = String(h).trim();
  if (/^(https?:|mailto:|#|\.|\/|[A-Za-z0-9_-]+[./])/.test(s)) return s;
  return '#';
}

/* ─────────────────── 1. Inline: code, Link, fett, kursiv ─────────────────── */

// Sucht das schliessende Zeichen und ueberspringt dabei Code-Spans.
function scanForDelim(src, from, delim) {
  let i = from;
  while (i < src.length) {
    if (src[i] === '`') {
      let n = 0; while (src[i + n] === '`') n++;
      const end = src.indexOf('`'.repeat(n), i + n);
      if (end > -1) { i = end + n; continue; }
    }
    if (src.startsWith(delim, i)) {
      if (delim === '*') {
        if (src[i + 1] === '*') { i += 2; continue; }   // gehoert zu **
        if (src[i - 1] === ' ') { i++; continue; }      // Leerzeichen davor -> kein Schluss
      }
      return i;
    }
    i++;
  }
  return -1;
}

function inline(src) {
  let out = '', i = 0;
  const s = String(src);
  while (i < s.length) {
    const c = s[i];

    if (c === '`') {
      let n = 0; while (s[i + n] === '`') n++;
      const end = s.indexOf('`'.repeat(n), i + n);
      if (end > -1) {
        let code = s.slice(i + n, end);
        if (code.length > 1 && code[0] === ' ' && code[code.length - 1] === ' ') code = code.slice(1, -1);
        out += '<code>' + esc(code) + '</code>';
        i = end + n; continue;
      }
    }

    if (c === '[') {
      const m = /^\[((?:[^\[\]]|\[[^\]]*\])*)\]\(([^()\s]*)(?:\s+"([^"]*)")?\)/.exec(s.slice(i));
      if (m) {
        /* Ein Verweis auf eine Markdown-Quelle zeigt in der HTML-Fassung auf
           die HTML-Fassung. Die Quellen heißen 0N_name.md, die Seiten
           name.html — die Ziffer fällt weg. Ohne diese Zeile stünden in den
           Dokumenten Verweise, die im Browser ins Leere gehen. */
        const href = safeHref(m[2]).replace(/^(\d\d_)?([a-z0-9-]+)\.md$/i,
          function (ganz, ziffer, name) { return name + '.html'; });
        const ext = /^https?:/.test(href);
        out += '<a href="' + escAttr(href) + '"'
             + (ext ? ' rel="noreferrer"' : '')
             + (m[3] ? ' title="' + escAttr(m[3]) + '"' : '')
             + '>' + inline(m[1]) + '</a>';
        i += m[0].length; continue;
      }
    }

    if (c === '*' && s[i + 1] === '*') {
      const end = scanForDelim(s, i + 2, '**');
      if (end > -1 && end > i + 2) {
        out += '<strong>' + inline(s.slice(i + 2, end)) + '</strong>';
        i = end + 2; continue;
      }
    }

    if (c === '*' && s[i + 1] && s[i + 1] !== ' ' && s[i + 1] !== '*') {
      const end = scanForDelim(s, i + 1, '*');
      if (end > -1 && end > i + 1) {
        out += '<em>' + inline(s.slice(i + 1, end)) + '</em>';
        i = end + 1; continue;
      }
    }

    out += esc(c); i++;
  }
  return out;
}

/* ───────────────────────── 2. Block-Parser ───────────────────────── */

const RE_UL   = /^(\s*)([-*·•])\s+(.*)$/;
const RE_OL   = /^(\s*)(\d+)[.)]\s+(.*)$/;
const RE_H    = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_HR   = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const RE_TR   = /^\s*\|/;
const RE_TSEP = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/;
const RE_FENCE= /^\s*(```+|~~~+)\s*([A-Za-z0-9_+-]*)\s*$/;
const RE_BQ   = /^\s*>\s?(.*)$/;

function isBlockStart(l) {
  return !l.trim() || RE_H.test(l) || RE_HR.test(l) || RE_TR.test(l)
      || RE_FENCE.test(l) || RE_BQ.test(l) || RE_UL.test(l) || RE_OL.test(l);
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = []; let cur = '';
  for (let k = 0; k < s.length; k++) {
    if (s[k] === '\\' && s[k + 1] === '|') { cur += '|'; k++; continue; }
    if (s[k] === '`') {
      let n = 0; while (s[k + n] === '`') n++;
      const end = s.indexOf('`'.repeat(n), k + n);
      if (end > -1) { cur += s.slice(k, end + n); k = end + n - 1; continue; }
    }
    if (s[k] === '|') { cells.push(cur); cur = ''; continue; }
    cur += s[k];
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseBlocks(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Codeblock
    let m = RE_FENCE.exec(line);
    if (m) {
      const mark = m[1][0].repeat(3);
      const lang = m[2] || '';
      const buf = []; i++;
      while (i < lines.length && !new RegExp('^\\s*' + mark).test(lines[i])) { buf.push(lines[i]); i++; }
      if (i < lines.length) i++;
      out.push({ t: 'code', lang, text: buf.join('\n') });
      continue;
    }

    // Ueberschrift
    m = RE_H.exec(line);
    if (m) { out.push({ t: 'h', level: m[1].length, text: m[2].trim() }); i++; continue; }

    // Tabelle (Kopfzeile + | --- | Trennzeile)
    if (RE_TR.test(line) && i + 1 < lines.length && RE_TSEP.test(lines[i + 1]) && /\|/.test(lines[i + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) => {
        const l = c.startsWith(':'), r = c.endsWith(':');
        return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
      });
      i += 2;
      const rows = [];
      while (i < lines.length && RE_TR.test(lines[i]) && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      out.push({ t: 'table', head, align, rows });
      continue;
    }

    // Trennlinie
    if (RE_HR.test(line)) { out.push({ t: 'hr' }); i++; continue; }

    // Zitat
    if (RE_BQ.test(line)) {
      const buf = [];
      while (i < lines.length && (RE_BQ.test(lines[i]) || (lines[i].trim() && !isBlockStart(lines[i])))) {
        const q = RE_BQ.exec(lines[i]);
        buf.push(q ? q[1] : lines[i].trim());
        i++;
      }
      out.push({ t: 'quote', blocks: parseBlocks(buf.join('\n')) });
      continue;
    }

    // Liste
    if (RE_UL.test(line) || RE_OL.test(line)) {
      const ordered = RE_OL.test(line);
      const items = [];
      let start = ordered ? parseInt(RE_OL.exec(line)[2], 10) : 1;
      while (i < lines.length) {
        const mu = RE_UL.exec(lines[i]), mo = RE_OL.exec(lines[i]);
        if (!mu && !mo) break;
        if (!!mo !== ordered) break;
        items.push((mo ? mo[3] : mu[3]).trim());
        i++;
        // weiche Fortsetzungszeilen
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
          items[items.length - 1] += ' ' + lines[i].trim(); i++;
        }
        // Leerzeile: Liste geht weiter?
        if (i < lines.length && !lines[i].trim()) {
          let j = i; while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && (ordered ? RE_OL.test(lines[j]) : RE_UL.test(lines[j]))
              && !(ordered ? RE_UL.test(lines[j]) : RE_OL.test(lines[j]))) { i = j; continue; }
          break;
        }
      }
      out.push({ t: 'list', ordered, start, items });
      continue;
    }

    // Absatz
    const buf = [line]; i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) { buf.push(lines[i].trim()); i++; }
    out.push({ t: 'p', text: buf.join(' ').replace(/\s+/g, ' ').trim() });
  }
  return out;
}

/* ───────────────────────── 3. Render ───────────────────────── */

const CHAIN = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">'
  + '<path d="M6.6 9.4a2.4 2.4 0 0 0 3.4 0l2.3-2.3a2.4 2.4 0 0 0-3.4-3.4l-1 1" '
  + 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
  + '<path d="M9.4 6.6a2.4 2.4 0 0 0-3.4 0L3.7 8.9a2.4 2.4 0 0 0 3.4 3.4l1-1" '
  + 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

function render(blocks, ctx) {
  const html = [];
  const toc = [];
  const used = new Set();
  let lastH2 = null;

  const mkId = (text, level) => {
    const base = slug(stripInline(text));
    let id = base;
    if (used.has(id) && level >= 3 && lastH2) id = lastH2.id + '-' + base;
    let n = 2;
    while (used.has(id)) { id = base + '-' + n; n++; }
    used.add(id);
    return id;
  };

  for (let k = 0; k < blocks.length; k++) {
    const b = blocks[k];

    if (b.t === 'h') {
      if (b.level === 1) { ctx.h1 = ctx.h1 || stripInline(b.text); continue; }
      const lvl = Math.min(b.level, 6);
      const id = mkId(b.text, lvl);
      const entry = { id, level: lvl, text: stripInline(b.text), kids: [] };
      if (lvl === 2) { toc.push(entry); lastH2 = entry; }
      else if (lvl === 3 && lastH2) lastH2.kids.push(entry);
      else if (lvl === 3) { toc.push(entry); lastH2 = entry; }
      html.push('<h' + lvl + ' id="' + escAttr(id) + '">'
        + '<span class="h-t">' + inline(b.text) + '</span>'
        + '<a class="anchor" href="#' + escAttr(id) + '" aria-label="Verknuepfung zu diesem Abschnitt">' + CHAIN + '</a>'
        + '</h' + lvl + '>');
      continue;
    }

    if (b.t === 'hr') {
      // Vor einer H2 entfaellt die Trennlinie: die H2 bringt ihre eigene
      // Abschnittslinie ueber die volle Blattbreite mit, zwei Linien
      // uebereinander waeren dieselbe Aussage zweimal. Vor jeder anderen
      // Ueberschrift — im Kapitel Lernkarten viermal vor einer H3 —
      // bleibt sie stehen, sonst stiessen die App-Blocks ohne Zaesur
      // aneinander. Gezaehlt wird beides in der Bilanz.
      const next = blocks[k + 1];
      if (next && next.t === 'h' && next.level <= 2) { ctx.hrDropped++; continue; }
      html.push('<hr>');
      continue;
    }

    if (b.t === 'p') {
      const lead = (ctx.leadPending && !ctx.leadDone);
      if (lead) { ctx.leadDone = true; html.push('<p class="lead">' + inline(b.text) + '</p>'); }
      else html.push('<p>' + inline(b.text) + '</p>');
      continue;
    }

    if (b.t === 'list') {
      const tag = b.ordered ? 'ol' : 'ul';
      const st = (b.ordered && b.start !== 1) ? ' start="' + b.start + '"' : '';
      html.push('<' + tag + st + '>' + b.items.map((x) => '<li>' + inline(x) + '</li>').join('') + '</' + tag + '>');
      continue;
    }

    if (b.t === 'quote') {
      const inner = render(b.blocks, { ...ctx, quiet: true });
      html.push('<blockquote>' + inner.html + '</blockquote>');
      continue;
    }

    if (b.t === 'code') {
      html.push('<pre><code>' + esc(b.text) + '</code></pre>');
      continue;
    }

    if (b.t === 'table') {
      ctx.tables++;
      const cols = b.head.length;
      // Der Spaltenname steckt in einem eigenen Element: nur so kann er
      // beim Scrollen nach rechts am Rand stehen bleiben, solange von
      // seiner Spalte noch etwas zu sehen ist (siehe .th-t im CSS).
      const th = b.head.map((c, n) => '<th' + (b.align[n] ? ' class="ta-' + b.align[n] + '"' : '') + ' scope="col"><span class="th-t">' + inline(c) + '</span></th>').join('');
      const body = b.rows.map((r) => {
        const cells = [];
        for (let n = 0; n < cols; n++) {
          const c = r[n] === undefined ? '' : r[n];
          cells.push('<td' + (b.align[n] ? ' class="ta-' + b.align[n] + '"' : '') + '>' + inline(c) + '</td>');
        }
        return '<tr>' + cells.join('') + '</tr>';
      }).join('');
      // Mindestbreite nach Spaltenzahl: lieber seitlich scrollen als
      // Prosa in 15-Zeichen-Spalten pressen.
      const minW = Math.min(cols * 164, 1120);
      html.push('<div class="tablewrap">'
        + '<div class="tableframe">'
        + '<div class="tablebox" tabindex="0" role="region" aria-label="Tabelle, seitlich scrollbar">'
        + '<table style="min-width:' + minW + 'px"><thead><tr>' + th + '</tr></thead><tbody>'
        + body + '</tbody></table></div></div>'
        + '<p class="tablehint" aria-hidden="true">Seitlich scrollbar</p>'
        + '</div>');
      continue;
    }
  }

  return { html: html.join('\n'), toc };
}

/* ───────────────────────── 4. Kontrast ───────────────────────── */

function hex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function over(fg, alpha, bg) { return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha)); }
function lum(rgb) {
  const f = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
function ratio(a, b) { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
const r2 = (x) => (Math.floor(x * 100) / 100).toFixed(2).replace('.', ',');

const T = {
  light: { ground: hex('#F2F2F4'), paper: hex('#FFFFFF'), paper2: hex('#FAFAFB'),
           ink: hex('#16181C'), a2: 0.64, a3: 0.62, fill: 0.05, accent: hex('#16181C'), accentOn: hex('#FFFFFF') },
  dark:  { ground: hex('#0E0F11'), paper: hex('#17191C'), paper2: hex('#1D1F23'),
           ink: hex('#F2F3F5'), a2: 0.64, a3: 0.52, fill: 0.07, accent: hex('#F2F3F5'), accentOn: hex('#0E0F11') }
};

function contrastReport() {
  const rows = [];
  for (const mode of ['light', 'dark']) {
    const t = T[mode];
    const zebra = over(t.ink, t.fill, t.paper);          // --fill ueber Papier
    const chip  = over(t.ink, t.fill, t.ground);         // --fill ueber Grund
    rows.push([mode, 'Fliesstext  ink-1 auf --paper', ratio(t.ink, t.paper)]);
    rows.push([mode, 'Tabellenzelle ink-1 auf --paper', ratio(t.ink, t.paper)]);
    rows.push([mode, 'Tabellenzelle ink-1 auf Zebra (--fill)', ratio(t.ink, zebra)]);
    rows.push([mode, 'Tabellenkopf ink-1 auf --paper-2', ratio(t.ink, t.paper2)]);
    rows.push([mode, 'Code ink-1 auf --fill', ratio(t.ink, zebra)]);
    rows.push([mode, 'Sekundaertext ink-2 auf --paper', ratio(over(t.ink, t.a2, t.paper), t.paper)]);
    rows.push([mode, 'Inhaltsverzeichnis ink-2 auf --ground', ratio(over(t.ink, t.a2, t.ground), t.ground)]);
    rows.push([mode, 'Tertiaertext ink-3 auf --ground', ratio(over(t.ink, t.a3, t.ground), t.ground)]);
    rows.push([mode, 'Tertiaertext ink-3 auf --paper', ratio(over(t.ink, t.a3, t.paper), t.paper)]);
    rows.push([mode, 'Aktiver Schalter accent-on auf --accent', ratio(t.accentOn, t.accent)]);
    rows.push([mode, 'Schalter ink-2 auf --fill ueber --ground', ratio(over(t.ink, t.a2, chip), chip)]);
    // Die Unterstreichung ist das zweite Merkmal eines Verweises (die
    // Farbe ist dieselbe wie die des Fliesstextes) und damit eine
    // Bedienflaeche: >= 3:1. Der haeufigste Fall ist ein Pfad im
    // Code-Feld, also ink-3 auf --fill ueber Papier.
    rows.push([mode, 'Verweisstrich ink-3 auf --paper', ratio(over(t.ink, t.a3, t.paper), t.paper)]);
    rows.push([mode, 'Verweisstrich ink-3 auf Code-Feld', ratio(over(t.ink, t.a3, zebra), zebra)]);
  }
  return rows;
}

function contrastComment() {
  const rows = contrastReport();
  const w = Math.max(...rows.map((r) => r[1].length));
  const line = (r) => '     ' + r[1].padEnd(w + 2, ' ') + r2(r[2]) + ':1' + (r[2] >= 4.5 ? '' : (r[2] >= 3 ? '   (nur grosse Schrift/UI, >= 3:1)' : '   ZU WENIG'));
  const L = rows.filter((r) => r[0] === 'light').map(line).join('\n');
  const D = rows.filter((r) => r[0] === 'dark').map(line).join('\n');
  return [
    '<!--',
    '  Eigenstaendige Dokumentseite. Kein externes CSS, kein externes JS,',
    '  keine Web-Fonts, keine Netzwerkanfrage — laeuft ueber file://.',
    '',
    '  Erzeugt aus Markdown von scratchpad/md2html.js. Aenderungen gehoeren',
    '  in die Markdown-Quelle, nicht in diese Datei.',
    '',
    '  KONTRAST — gerechnet nach WCAG 2.1 (relative Luminanz, sRGB),',
    '  Alpha-Farben vorher auf ihren Untergrund gerechnet.',
    '',
    '  Hell:',
    L,
    '',
    '  Dunkel:',
    D,
    '',
    '  Fliesstext und Tabellenzellen liegen in beiden Modi weit ueber 4,5:1.',
    '  Die schwaechsten Werte sind Sekundaer- und Tertiaertext; auch die',
    '  halten 4,5:1 und tragen nie allein eine Aussage (Zwei-Merkmal-Regel).',
    '-->'
  ].join('\n');
}

/* ───────────────────────── 5. CSS ───────────────────────── */

const CSS = `
/* ── Tokens. Jede Farbe ist auf blankem :root definiert; die beiden
      dunklen Bloecke schreiben nur um. ───────────────────────────── */
:root{
  color-scheme: light;
  --ground:#F2F2F4;
  --paper:#FFFFFF;
  --paper-2:#FAFAFB;
  --ink-1:#16181C;
  --ink-2:rgba(22,24,28,.64);
  --ink-3:rgba(22,24,28,.62);
  --ink-4:rgba(22,24,28,.30);
  --line:rgba(22,24,28,.10);
  --line-2:rgba(22,24,28,.18);
  --fill:rgba(22,24,28,.05);
  --fill-2:rgba(22,24,28,.09);
  --accent:#16181C;
  --accent-on:#FFFFFF;
  --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,"Segoe UI",Roboto,sans-serif;
  --mono:"SF Mono",ui-monospace,Menlo,Consolas,"DejaVu Sans Mono",monospace;
  /* Nachgemessen, nicht geschaetzt: 52ch ergibt Zeilen von hoechstens
     ~69 Zeichen. Die Einheit ch skaliert mit der Systemschrift, die
     Zeichenzahl bleibt damit auch bei anderer Schrift stabil. */
  --measure:52ch;
  /* Blattbreite. Sie haengt an der Lesebreite: Blatt = Satzspiegel +
     44 px Blattrand links/rechts + 24 px Seitenrand links/rechts +
     82 px Zugabe, die Tabellen und Code nutzen. Sonst stuende zwischen
     dem Zeilenende und der Blattkante leeres Papier.
     Kommt das Verzeichnis dazu, waechst das Blatt um genau dessen
     Spalte (--toc + --gap = 288 px) — die Textspalte bleibt dabei auf
     den Pixel gleich breit (gemessen: 732 px mit und ohne Verzeichnis).
     Vorher sprang sie an der Grenze von 732 auf 704 px zurueck. */
  --toc:240px;
  --gap:48px;
  --sheet:calc(var(--measure) + 218px);
  --bar:56px;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    color-scheme: dark;
    --ground:#0E0F11;
    --paper:#17191C;
    --paper-2:#1D1F23;
    --ink-1:#F2F3F5;
    --ink-2:rgba(242,243,245,.64);
    --ink-3:rgba(242,243,245,.52);
    --ink-4:rgba(242,243,245,.30);
    --line:rgba(242,243,245,.12);
    --line-2:rgba(242,243,245,.20);
    --fill:rgba(242,243,245,.07);
    --fill-2:rgba(242,243,245,.12);
    --accent:#F2F3F5;
    --accent-on:#0E0F11;
  }
}
:root[data-theme="dark"]{
  color-scheme: dark;
  --ground:#0E0F11;
  --paper:#17191C;
  --paper-2:#1D1F23;
  --ink-1:#F2F3F5;
  --ink-2:rgba(242,243,245,.64);
  --ink-3:rgba(242,243,245,.52);
  --ink-4:rgba(242,243,245,.30);
  --line:rgba(242,243,245,.12);
  --line-2:rgba(242,243,245,.20);
  --fill:rgba(242,243,245,.07);
  --fill-2:rgba(242,243,245,.12);
  --accent:#F2F3F5;
  --accent-on:#0E0F11;
}

*,*::before,*::after{ box-sizing:border-box; }
html{ -webkit-text-size-adjust:100%; }
body{
  margin:0;
  background:var(--ground);
  color:var(--ink-1);
  /* Dieselbe Skala, die das Dokument selbst abdruckt: 28/34 · 20/26 ·
     17/23 · 15/20 · 13/16, zwei Gewichte. Auch die Zeilenhoehen. */
  font:400 17px/23px var(--sans);
  font-synthesis-weight:none;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
/* Kein scroll-behavior:smooth: das 01-Dokument ist ueber 80 000 px hoch,
   ein Sprung ans Ende wuerde sekundenlang durch leere Flaechen animieren. */
::selection{ background:var(--fill-2); }
/* Ein Verweis darf sich nicht allein durch die Farbe zeigen — er hat
   ja dieselbe. Also traegt er die Unterstreichung, und die muss man
   sehen: --line-2 (.18) ergab auf Papier 1,5:1, eine Haarlinie, die
   neben einem bloss genannten Pfad nicht auffiel. --ink-3 misst
   4,76:1 hell und 4,56:1 dunkel. */
a{ color:var(--ink-1); text-underline-offset:3px; text-decoration-color:var(--ink-3); }
a:hover{ text-decoration-color:currentColor; }
/* Steht der Verweistext in einem Code-Feld — bei Pfaden die Regel —,
   deckt dessen Flaeche die Unterstreichung des <a> zu: das Feld ist
   22 px hoch, die Zeile des <a> nur 20. Dann unterstreicht das Feld
   selbst; sonst waere ein anklickbarer Pfad von einem nur genannten
   nicht zu unterscheiden. */
a code{ text-decoration:underline; text-decoration-color:var(--ink-3); text-underline-offset:2px; }
a:hover code{ text-decoration-color:currentColor; }
:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; border-radius:4px; }

/* ── Kopfleiste: Zurueck + Umschalter ───────────────────────────── */
.topbar{
  position:sticky; top:0; z-index:40;
  display:flex; align-items:center; justify-content:space-between; gap:16px;
  height:var(--bar);
  padding:0 24px;
  background:var(--ground);
  border-bottom:1px solid var(--line);
}
.back{
  display:inline-flex; align-items:center; gap:8px;
  font-size:15px; line-height:20px; color:var(--ink-2); text-decoration:none;
  padding:6px 10px; margin-left:-10px; border-radius:8px;
}
.back:hover{ color:var(--ink-1); background:var(--fill); }
.back svg{ flex:none; }
.themes{ display:flex; gap:2px; padding:2px; background:var(--fill); border-radius:999px; }
.themes button{
  appearance:none; border:0; cursor:pointer;
  font:600 13px/16px var(--sans);
  color:var(--ink-2); background:transparent;
  padding:7px 14px; border-radius:999px;
}
.themes button:hover{ color:var(--ink-1); }
.themes button.is-on{ background:var(--accent); color:var(--accent-on); }

/* ── Titelblock ─────────────────────────────────────────────────── */
.masthead{ max-width:var(--sheet); margin:0 auto; padding:56px 24px 32px; }
.eyebrow{
  margin:0 0 12px; font:600 13px/16px var(--sans);
  letter-spacing:.06em; text-transform:uppercase; color:var(--ink-3);
}
.masthead h1{ margin:0; font:600 28px/34px var(--sans); letter-spacing:-.015em; max-width:22ch; }
.masthead .sub{ margin:12px 0 0; font:400 17px/23px var(--sans); color:var(--ink-2); max-width:var(--measure); }

/* ── Seitenraster ───────────────────────────────────────────────── */
.page{ max-width:var(--sheet); margin:0 auto; padding:0 24px 120px; }
/* Die Grenze ist das Blatt selbst: 1068 px = Blatt ohne Verzeichnis
   (780) + Verzeichnisspalte (240) + Rinne (48). Sobald das Fenster das
   breitere Blatt traegt, erscheint das Verzeichnis — kein Streifen
   dazwischen, in dem das Fenster schon breit genug waere und trotzdem
   nichts passiert. Frueher lag die Grenze bei 1100 px, das Blatt aber
   bei 1040 px: die 60 px dazwischen blieben ungenutzt. */
@media (min-width:1068px){
  :root{ --sheet:calc(var(--measure) + 218px + var(--toc) + var(--gap)); }
  .page{ display:grid; grid-template-columns:var(--toc) minmax(0,1fr); gap:var(--gap); align-items:start; }
}

/* ── Inhaltsverzeichnis, breit ──────────────────────────────────── */
.toc{ display:none; }
@media (min-width:1068px){
  .toc{
    display:block; position:sticky; top:calc(var(--bar) + 24px);
    max-height:calc(100vh - var(--bar) - 48px); overflow-y:auto;
    padding-bottom:24px;
  }
}
.toc-title{ margin:0 0 12px; font:600 13px/16px var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--ink-3); }
.toc ol,.toc ul{ list-style:none; margin:0; padding:0; }
.toc-l2,.toc-l3{
  display:block; text-decoration:none;
  border-left:2px solid transparent;
  color:var(--ink-2);
}
.toc-l2{ font:400 15px/20px var(--sans); padding:7px 10px 7px 12px; }
.toc-l3{ font:400 13px/16px var(--sans); padding:5px 10px 5px 24px; color:var(--ink-3); }
.toc-l2:hover,.toc-l3:hover{ color:var(--ink-1); background:var(--fill); }
.toc-sub{ display:none; margin-bottom:4px; }
.toc-group.is-open > .toc-sub{ display:block; }
.toc-group.is-open > .toc-l2{ color:var(--ink-1); }
.toc a.is-current{ color:var(--ink-1); font-weight:600; border-left-color:var(--accent); background:var(--fill); }

/* ── Inhaltsverzeichnis, schmal ─────────────────────────────────── */
.toc-narrow{
  margin:0 0 32px; background:var(--paper); border:1px solid var(--line); border-radius:14px;
}
@media (min-width:1068px){ .toc-narrow{ display:none; } }
.toc-narrow > summary{
  cursor:pointer; list-style:none;
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:16px 20px; font:600 15px/20px var(--sans); color:var(--ink-1);
  border-radius:14px;
}
.toc-narrow > summary::-webkit-details-marker{ display:none; }
.toc-narrow > summary .chev{ transition:transform .18s ease; color:var(--ink-3); flex:none; }
.toc-narrow[open] > summary .chev{ transform:rotate(180deg); }
.toc-narrow[open] > summary{ border-bottom:1px solid var(--line); border-radius:14px 14px 0 0; }
.toc-narrow ol,.toc-narrow ul{ list-style:none; margin:0; padding:0; }
.toc-narrow .toc-body{ padding:8px 12px 14px; max-height:min(60vh,520px); overflow-y:auto; }
.toc-narrow .toc-sub{ display:block; }
.toc-narrow .toc-l2{ font:600 15px/20px var(--sans); color:var(--ink-1); padding:8px 10px; }
.toc-narrow .toc-l3{ padding:6px 10px 6px 24px; }

/* ── Dokumentflaeche ────────────────────────────────────────────── */
.doc{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:18px;
  padding:8px 44px 48px;
  min-width:0;
  overflow-wrap:break-word;
}
@media (max-width:640px){ .doc{ padding:4px 20px 36px; border-radius:14px; } }
/* Fliesstext bleibt auf Lesebreite; Tabellen, Code und die
   Abschnittslinie der H2 duerfen die volle Blattbreite nutzen.
   Die Trennlinie vor einer H3 bleibt bewusst auf Satzbreite: kuerzere
   Linie + kleinere Ueberschrift = zwei Merkmale, an denen man den
   kleineren Einschnitt vom groesseren unterscheidet. */
.doc > *{ max-width:var(--measure); }
.doc > .tablewrap,.doc > pre,.doc > h2{ max-width:none; }
.doc > h2 .h-t{ display:inline-block; max-width:var(--measure); }

.doc p{ margin:0 0 20px; }
.doc .lead{ font:400 20px/26px var(--sans); color:var(--ink-1); margin:32px 0 28px; }
.doc{ counter-reset:sec; }
.doc h2{
  counter-increment:sec; counter-reset:sub;
  margin:60px 0 20px; padding-top:28px;
  border-top:1px solid var(--line);
  font:600 20px/26px var(--sans); letter-spacing:-.01em;
}
.doc h3{
  counter-increment:sub;
  margin:44px 0 14px;
  font:600 17px/23px var(--sans);
}
/* Abschnittsnummer als eigene Zeile: gibt Ueberschriften eine zweite,
   von der Schriftgroesse unabhaengige Kennzeichnung — sonst waere eine
   H3 von einem fett angefuehrten Absatz kaum zu unterscheiden. */
.doc h2::before,.doc h3::before{
  display:block; margin-bottom:9px;
  font:400 13px/16px var(--mono); letter-spacing:.08em; color:var(--ink-3);
}
.doc h2::before{ content:counter(sec,decimal-leading-zero); }
.doc h3::before{ content:counter(sec,decimal-leading-zero) "." counter(sub); }
.doc h4{ margin:32px 0 12px; font:600 15px/20px var(--sans); color:var(--ink-2); }
.doc h2:first-child,.doc h3:first-child{ margin-top:32px; }
/* Die Linie der H2 trennt zwei Abschnitte voneinander. Steht die erste
   H2 am Blattanfang — auf das-ist-die-app.html steht kein Vorspann
   davor —, trennte sie den Blattrand von der Ueberschrift: ein Strich
   ueber nichts. Am Blattanfang faellt sie deshalb weg; die Nummer ueber
   der Ueberschrift kennzeichnet den Abschnitt dort allein. */
.doc > h2:first-child{ border-top:0; padding-top:0; }
.doc h2,.doc h3,.doc h4{ scroll-margin-top:calc(var(--bar) + 20px); }

.anchor{
  display:inline-flex; align-items:center; justify-content:center;
  width:24px; height:24px; margin-left:6px; vertical-align:-5px;
  color:var(--ink-3); opacity:0; text-decoration:none; border-radius:6px;
  transition:opacity .12s ease;
}
h2:hover .anchor,h3:hover .anchor,h4:hover .anchor,.anchor:focus-visible{ opacity:1; }
.anchor:hover{ color:var(--ink-1); background:var(--fill); }
/* Ohne Zeigegeraet gibt es kein :hover. Dort stuende sonst ein
   unsichtbares, 24 px grosses Ziel neben jeder Ueberschrift, das beim
   Antippen der Ueberschrift zuschnappt. Also sichtbar zeigen. */
@media (hover:none){
  .anchor{ opacity:1; }
  .anchor:hover{ color:var(--ink-3); background:none; }
}

.doc ul,.doc ol{ margin:0 0 20px; padding-left:24px; }
.doc li{ margin:0 0 10px; padding-left:4px; }
.doc li::marker{ color:var(--ink-3); }
.doc ol{ counter-reset:none; }
.doc strong{ font-weight:600; }
.doc em{ font-style:italic; }

.doc hr{
  border:0; height:1px; background:var(--line);
  margin:44px 0;
}
.doc hr + h3{ margin-top:0; padding-top:0; }

/* Der Balken ist Auszeichnung, kein Zustand: er darf den Ink-Akzent
   nicht tragen, der aktivem Zustand, primaerer Aktion und Auswahl
   vorbehalten ist. Der Kasten wird ohnehin durch Flaeche und Radius
   erkannt — der Balken ist das dritte, schwaechste Merkmal. */
blockquote{
  margin:28px 0; padding:20px 24px;
  background:var(--fill); border-left:2px solid var(--ink-4);
  border-radius:0 12px 12px 0;
}
blockquote > *:last-child{ margin-bottom:0; }
blockquote p{ margin:0 0 14px; }

code{
  font:400 15px/20px var(--mono);
  background:var(--fill); color:var(--ink-1);
  padding:2px 5px; border-radius:5px;
  overflow-wrap:anywhere;
}
pre{
  margin:24px 0; padding:20px 22px;
  background:var(--paper-2); border:1px solid var(--line); border-radius:12px;
  overflow-x:auto;
}
pre code{ background:none; padding:0; font-size:13px; line-height:16px; white-space:pre; }
h2 code,h3 code,th code{ font-size:.9em; }

/* ── Tabellen ───────────────────────────────────────────────────── */
/* Eigene Scrollbox: die Seite selbst scrollt nie seitwaerts.
   Passt eine Tabelle in der Breite, hebt das Skript die Box mit
   .is-frei auf — dann klebt die Kopfzeile am Fensterrand statt in einem
   Kasten, der gar nicht senkrecht scrollt. Muss die Tabelle seitwaerts
   scrollen, hat das Vorrang. Abgeschnitten wird nie. */
.tablewrap{ margin:24px 0 28px; }
.tableframe{ position:relative; }
/* Der Verlauf am rechten Rand plus die Zeile darunter sagen, dass rechts
   noch etwas steht — der Rollbalken allein ist auf macOS unsichtbar.
   Beides verschwindet, sobald man am Ende angekommen ist. */
.tableframe::after{
  content:""; position:absolute; top:1px; right:1px; bottom:1px; width:44px;
  border-radius:0 11px 11px 0; pointer-events:none;
  background:linear-gradient(to left,var(--paper) 30%,rgba(127,127,127,0));
  opacity:0; transition:opacity .15s ease;
}
.tablewrap.is-mehr .tableframe::after{ opacity:1; }
.tablehint{
  display:none;
  margin:8px 0 0; text-align:right;
  font:400 13px/16px var(--sans); color:var(--ink-3);
}
.tablewrap.is-mehr .tablehint{ display:block; }
.tablehint::after{ content:" →"; }
.tablebox{
  max-width:100%;
  overflow-x:auto;
  border:1px solid var(--line); border-radius:12px;
  background:var(--paper);
  -webkit-overflow-scrolling:touch;
  /* Der Balken bleibt sichtbar: er ist der einzige Hinweis darauf, dass
     rechts noch eine Spalte steht. */
  scrollbar-width:thin; scrollbar-color:var(--line-2) transparent;
}
.tablebox::-webkit-scrollbar{ height:11px; }
.tablebox::-webkit-scrollbar-track{ background:transparent; }
.tablebox::-webkit-scrollbar-thumb{
  background:var(--line-2); border-radius:999px;
  border:3px solid transparent; background-clip:padding-box;
}
/* Tabellen duerfen breiter sein als der Fliesstext und greifen dafuer
   in den Blattrand. */
@media (min-width:1068px){
  .doc > .tablewrap{ margin-left:-28px; margin-right:-28px; width:calc(100% + 56px); }
}
.tablebox table{
  border-collapse:collapse;
  width:100%;
  font-variant-numeric:tabular-nums;
}
.tablebox th,.tablebox td{
  text-align:left; vertical-align:top;
  padding:12px 16px;
  font-size:15px; line-height:20px;
  border-bottom:1px solid var(--line);
}
.tablebox.is-frei{ overflow:visible; }
.tablebox.is-frei th{ top:var(--bar); }
.tablebox.is-frei thead th:first-child{ border-top-left-radius:11px; }
.tablebox.is-frei thead th:last-child{ border-top-right-radius:11px; }
.tablebox.is-frei tbody tr:last-child td:first-child{ border-bottom-left-radius:11px; }
.tablebox.is-frei tbody tr:last-child td:last-child{ border-bottom-right-radius:11px; }
/* top:0 solange die Box selbst der Scrollbereich ist — sonst schoebe
   ein Versatz die Kopfzeile ins Leere. Erst wenn die Box aufgehoben ist
   (.is-frei), ist das Fenster der Bezug und die Kopfzeile parkt unter
   der Kopfleiste. */
.tablebox th{
  position:sticky; top:0; z-index:1;
  font-weight:600; color:var(--ink-1);
  background:var(--paper-2);
  border-bottom:1px solid var(--line-2);
  white-space:nowrap;
}
.tablebox tbody tr:nth-child(even) td{ background:var(--fill); }
.tablebox tbody tr:last-child td{ border-bottom:0; }
.tablebox td{ color:var(--ink-1); }
.ta-right{ text-align:right; }
.ta-center{ text-align:center; }

/* Muss die Tabelle seitwaerts scrollen, bleiben die vordersten Spalten
   stehen — sonst sieht man beim Scrollen nach rechts die Optionen, aber
   nicht mehr das Werkzeug, zu dem sie gehoeren. Wie viele Spalten das
   sind, entscheidet das Skript: nur so viele, wie zusammen unter 45 %
   der sichtbaren Breite bleiben, hoechstens zwei. Die Flaeche muss
   decken, sonst schiebt sich Text darunter durch. */
.tablebox td.kleb,.tablebox th.kleb{
  position:sticky; z-index:1;
  background-color:var(--paper);
}
.tablebox tbody tr:nth-child(even) td.kleb{
  background-color:var(--paper);
  background-image:linear-gradient(var(--fill),var(--fill));
}
.tablebox th.kleb{ top:0; z-index:2; background-color:var(--paper-2); }
/* Die Kante zeigt sich erst, wenn wirklich etwas dahinter liegt. */
.tablewrap.is-ab .tablebox .kleb-letzte{ box-shadow:1px 0 0 var(--line-2); }

/* Spaltennamen sind kurz, ihre Zellen sind so breit wie der laengste
   Inhalt darunter. Beim Scrollen nach rechts verschwand der Name daher
   als Erstes unter den festgehaltenen Spalten, waehrend vom Inhalt noch
   ein Rest herausragte — ein Wortfetzen ohne Ueberschrift. Der Name
   klebt jetzt am rechten Rand des festgehaltenen Blocks (--klebw, vom
   Skript gesetzt) und wandert nur so weit mit, wie seine Zelle reicht.
   Ist die Spalte ganz durchgelaufen, geht der Name mit ihr. */
.tablebox th > .th-t{
  display:inline-block; max-width:100%;
  position:sticky; left:var(--klebw,0px);
}
/* Die festgehaltenen Spalten stehen ohnehin still. */
.tablebox th.kleb > .th-t{ position:static; }

/* ── Fuss ───────────────────────────────────────────────────────── */
/* Am Ende eines langen Dokuments ist die Kopfleiste zehntausende Pixel
   entfernt. Der Fuss verspricht deshalb nicht den Weg zurueck, er ist
   er: dieselbe Adresse wie oben links, als eigene Verknuepfung. */
.colophon{
  max-width:var(--sheet); margin:0 auto; padding:0 24px 64px;
  font:400 13px/16px var(--sans); color:var(--ink-3);
}
.colophon a{ color:var(--ink-1); }
@media (min-width:1068px){ .colophon{ padding-left:calc(var(--toc) + var(--gap) + 24px); } }

/* ── Druck ──────────────────────────────────────────────────────── */
@media print{
  :root{
    --ground:#FFFFFF; --paper:#FFFFFF; --paper-2:#FFFFFF;
    --ink-1:#000000; --ink-2:#333333; --ink-3:#444444;
    --line:#BBBBBB; --line-2:#888888; --fill:#F2F2F2; --accent:#000000;
  }
  body{ background:#FFFFFF; color:#000000; font-size:11pt; line-height:15pt; }
  .topbar,.toc,.toc-narrow,.themes,.back,.anchor{ display:none !important; }
  .masthead{ padding:0 0 18pt; }
  .page{ display:block; max-width:none; padding:0; }
  .doc{ border:0; border-radius:0; padding:0; background:#FFFFFF; }
  /* Die Lesebreite gilt auch auf Papier; Tabellen, Code und die
     Abschnittslinien nutzen wie am Bildschirm die volle Satzbreite. */
  /* Dieselbe Skala, in Punkt statt Pixel — sonst waeren Titel und
     Vorspann auf Papier doppelt so gross wie der Fliesstext. */
  .masthead h1{ font:600 20pt/24pt var(--sans); }
  .masthead .sub{ font-size:10pt; line-height:14pt; }
  .eyebrow{ font-size:8pt; line-height:11pt; }
  .doc .lead{ font:400 13pt/17pt var(--sans); margin:14pt 0 12pt; }
  .doc h2{ font:600 14pt/18pt var(--sans); }
  .doc h3{ font:600 12pt/16pt var(--sans); margin-top:18pt; }
  .doc h2::before,.doc h3::before{ font-size:8.5pt; line-height:11pt; margin-bottom:4pt; }
  .tablebox th,.tablebox td{ font-size:9.5pt; line-height:13pt; padding:6pt 8pt; }
  code{ font-size:9.5pt; }
  pre code{ font-size:8.5pt; line-height:12pt; }
  blockquote{ padding:8pt 12pt; margin:12pt 0; }
  .doc p,.doc ul,.doc ol{ margin-bottom:10pt; }
  .doc h2{ break-after:avoid; page-break-after:avoid; margin-top:24pt; }
  .doc h3,.doc h4{ break-after:avoid; page-break-after:avoid; }
  .tablewrap{ margin-left:0 !important; margin-right:0 !important; width:auto !important; }
  .tableframe::after,.tablehint{ display:none !important; }
  .tablebox{ overflow:visible; max-height:none; break-inside:avoid; page-break-inside:avoid; border:1px solid #BBBBBB; }
  .tablebox table{ min-width:0 !important; }
  .tablebox th{ position:static; background:#F2F2F2; }
  /* Auf Papier scrollt nichts, also klebt auch nichts. */
  .tablebox td.kleb,.tablebox th.kleb{ position:static; box-shadow:none; background:none; }
  .tablebox th.kleb{ background:#F2F2F2; }
  .tablebox th > .th-t{ position:static; }
  tr,thead,blockquote,pre,li{ break-inside:avoid; page-break-inside:avoid; }
  a{ color:#000000; text-decoration:none; }
  .colophon{ padding:0; }
}
`;

/* ───────────────────────── 6. JS der Seite ───────────────────────── */

const JS = `
(function(){
  var root = document.documentElement;

  /* Hell/Dunkel — setzt data-theme auf <html>. Ohne Auswahl gilt das
     System (dritter Zustand). */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var bar = document.querySelector('.themes');
  function paint(){
    var t = root.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light');
    var bs = bar.querySelectorAll('button');
    for (var i=0;i<bs.length;i++){
      var on = bs[i].getAttribute('data-val') === t;
      bs[i].classList.toggle('is-on', on);
      bs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  bar.addEventListener('click', function(e){
    var b = e.target.closest('button');
    if (!b) return;
    root.setAttribute('data-theme', b.getAttribute('data-val'));
    try { localStorage.setItem('docs-theme', b.getAttribute('data-val')); } catch(err){}
    paint();
  });
  try {
    var saved = localStorage.getItem('docs-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch(err){}
  if (mq && mq.addEventListener) mq.addEventListener('change', paint);
  paint();

  /* Inhaltsverzeichnis: sichtbarer Abschnitt wird hervorgehoben. */
  var heads = [].slice.call(document.querySelectorAll('.doc h2[id], .doc h3[id]'));
  var links = [].slice.call(document.querySelectorAll('[data-t]'));
  if (!heads.length || !links.length) return;

  var current = '';
  function setActive(id){
    if (id === current) return;
    current = id;
    var groups = [].slice.call(document.querySelectorAll('.toc-group'));
    for (var g=0; g<groups.length; g++) groups[g].classList.remove('is-open');
    for (var i=0;i<links.length;i++){
      var on = links[i].getAttribute('data-t') === id;
      links[i].classList.toggle('is-current', on);
      if (on){
        var grp = links[i].closest('.toc-group');
        if (grp) grp.classList.add('is-open');
        var box = links[i].closest('.toc');
        if (box && box.scrollHeight > box.clientHeight){
          var lt = links[i].offsetTop, lb = lt + links[i].offsetHeight;
          if (lt < box.scrollTop + 8) box.scrollTop = lt - 8;
          else if (lb > box.scrollTop + box.clientHeight - 8) box.scrollTop = lb - box.clientHeight + 8;
        }
      }
    }
    var wrap = links.filter(function(l){ return l.getAttribute('data-t') === id; })[0];
    if (wrap){
      var p = wrap.closest('.toc-group');
      if (p) p.classList.add('is-open');
    }
  }

  var LINE = 140;
  function update(){
    var pick = null;
    for (var i=0;i<heads.length;i++){
      if (heads[i].getBoundingClientRect().top <= LINE) pick = heads[i]; else break;
    }
    if (!pick){
      pick = heads[0];
      if (window.scrollY <= 4) { setActive(heads[0].id); return; }
    }
    /* am Dokumentende: letzte Ueberschrift gewinnt */
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) pick = heads[heads.length-1];
    setActive(pick.id);
  }

  var ticking = false;
  function schedule(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; update(); });
  }

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(schedule, { rootMargin: '-' + LINE + 'px 0px -55% 0px', threshold: [0, 1] });
    for (var i=0;i<heads.length;i++) io.observe(heads[i]);
  }
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule);
  update();

  /* Tabellen: passt eine in der Breite, wird die Scrollbox aufgehoben.
     Dann klebt ihre Kopfzeile beim Weiterscrollen am oberen Fensterrand.
     Muss sie seitwaerts scrollen, bleibt sie eine Box. */
  var boxes = [].slice.call(document.querySelectorAll('.tablebox'));

  /* Vordere Spalten festhalten, solange seitwaerts gescrollt wird.
     Gemessen wird vor dem Kleben — sticky aendert die Breiten nicht.
     Die 45-%-Grenze gilt ab der ERSTEN Spalte. Frueher war sie an
     i > 0 gebunden; dadurch stand die erste Spalte immer fest, auch
     wenn sie allein 79 % der sichtbaren Breite frass und zum Lesen
     nur ein Streifen uebrig blieb. Passt die erste Spalte nicht in
     die Grenze, klebt gar nichts — dann ist Scrollen ohne Anker
     immer noch besser als eine Tabelle, die man nicht lesen kann. */
  function klebSpalten(b, mehr){
    var t = b.querySelector('table');
    if (!t || !t.tHead) return;
    var zeilen = [].slice.call(t.rows);
    for (var r = 0; r < zeilen.length; r++){
      var z = zeilen[r].cells;
      for (var c = 0; c < z.length; c++){
        z[c].classList.remove('kleb','kleb-letzte');
        z[c].style.left = '';
      }
    }
    b.style.setProperty('--klebw','0px');
    if (!mehr) return;
    var kopf = t.tHead.rows[0].cells;
    var grenze = b.clientWidth * 0.45, summe = 0, links = [], n = 0;
    for (var i = 0; i < kopf.length - 1 && i < 2; i++){
      var w = kopf[i].getBoundingClientRect().width;
      if (summe + w > grenze) break;
      links.push(summe); summe += w; n = i + 1;
    }
    /* Bliebe nur eine schmale Zaehlspalte stehen, sagt sie nichts —
       dann lieber gar nichts festhalten und die Breite dem Inhalt
       geben. Genau das passiert auf dem Telefon. */
    if (n === 1 && summe < 64) n = 0;
    /* Breite des festgehaltenen Blocks: daran haengen die Namen der
       Spalten, die gerade darunter durchlaufen (siehe --klebw im CSS). */
    b.style.setProperty('--klebw', (n ? summe : 0) + 'px');
    for (var r2 = 0; r2 < zeilen.length; r2++){
      var z2 = zeilen[r2].cells;
      for (var c2 = 0; c2 < n && c2 < z2.length; c2++){
        z2[c2].classList.add('kleb');
        if (c2 === n - 1) z2[c2].classList.add('kleb-letzte');
        z2[c2].style.left = links[c2] + 'px';
      }
    }
  }

  function markBox(b, voll){
    var wrap = b.closest('.tablewrap');
    var mehr = b.scrollWidth > b.clientWidth + 2;
    if (voll){
      b.classList.toggle('is-frei', !mehr);
      /* Rolle, Tabstopp und Ansage gelten nur, solange wirklich etwas zu
         scrollen ist. Sonst schickte die Tabelle Tastatur und Vorlese-
         software durch einen leeren Halt und kuendigte einen Weg an, den
         es nicht gibt. */
      if (mehr){
        b.setAttribute('role','region');
        b.setAttribute('tabindex','0');
        b.setAttribute('aria-label','Tabelle, seitlich scrollbar');
      } else {
        b.removeAttribute('role');
        b.removeAttribute('tabindex');
        b.removeAttribute('aria-label');
      }
      klebSpalten(b, mehr);
    }
    wrap.classList.toggle('is-mehr', mehr && b.scrollLeft + b.clientWidth < b.scrollWidth - 2);
    wrap.classList.toggle('is-ab', mehr && b.scrollLeft > 2);
  }
  function fitTables(){ for (var i=0;i<boxes.length;i++) markBox(boxes[i], true); }
  if (boxes.length){
    for (var bi=0; bi<boxes.length; bi++){
      (function(b){
        b.addEventListener('scroll', function(){ markBox(b, false); }, { passive:true });
      })(boxes[bi]);
    }
    fitTables();
    var rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(fitTables, 150); });
  }

  /* Auf schmalen Fenstern schliesst ein Klick das Verzeichnis wieder. */
  var det = document.querySelector('.toc-narrow');
  if (det) det.addEventListener('click', function(e){
    if (e.target.closest('a')) det.removeAttribute('open');
  });
})();
`;

/* ───────────────────────── 7. Seite bauen ───────────────────────── */

function tocMarkup(toc, narrow) {
  const cls = narrow ? '' : '';
  const li = toc.map((h) => {
    const kids = h.kids.length
      ? '<ul class="toc-sub">' + h.kids.map((k) =>
          '<li><a class="toc-l3" data-t="' + escAttr(k.id) + '" href="#' + escAttr(k.id) + '">' + esc(k.text) + '</a></li>'
        ).join('') + '</ul>'
      : '';
    return '<li class="toc-group">'
      + '<a class="toc-l2" data-t="' + escAttr(h.id) + '" href="#' + escAttr(h.id) + '">' + esc(h.text) + '</a>'
      + kids + '</li>';
  }).join('');
  return '<ol' + cls + '>' + li + '</ol>';
}

/* Ziel des Zurueck-Wegs, an einer Stelle: Kopfleiste und Fuss. */
const UEBERSICHT = '../mockups/index.html';

const ARROW = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M9.5 3.5 5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV  = '<svg class="chev" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function build(doc) {
  const md = fs.readFileSync(path.join(REPO, doc.src), 'utf8');
  const ctx = { h1: null, tables: 0, hrDropped: 0, leadPending: true, leadDone: false };
  const blocks = parseBlocks(md);
  const { html, toc } = render(blocks, ctx);
  const title = ctx.h1 || doc.title;

  const page = [
    '<!doctype html>',
    contrastComment(),
    '<html lang="de">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    '<title>' + esc(title) + ' — Dokumentation</title>',
    '<style>' + CSS + '</style>',
    '</head>',
    '<body>',
    '<div class="topbar">',
    // Die Uebersicht ist mockups/index.html. ../index.html im Repo-Stamm
    // ist das Canvas-Whiteboard — dorthin zeigt hier nichts.
    '  <a class="back" href="' + UEBERSICHT + '">' + ARROW + 'Übersicht</a>',
    '  <div class="themes" role="group" aria-label="Erscheinungsbild">',
    '    <button type="button" data-val="light">Hell</button>',
    '    <button type="button" data-val="dark">Dunkel</button>',
    '  </div>',
    '</div>',
    '<header class="masthead">',
    '  <p class="eyebrow">' + esc(doc.eyebrow) + '</p>',
    '  <h1>' + esc(title) + '</h1>',
    '  <p class="sub">' + esc(doc.sub) + '</p>',
    '</header>',
    '<div class="page">',
    '  <nav class="toc" aria-label="Inhalt">',
    '    <p class="toc-title">Inhalt</p>',
    '    ' + tocMarkup(toc, false),
    '  </nav>',
    '  <main class="doc-wrap">',
    '    <details class="toc-narrow">',
    '      <summary>Inhalt' + CHEV + '</summary>',
    '      <div class="toc-body">' + tocMarkup(toc, true) + '</div>',
    '    </details>',
    '    <article class="doc">',
    html,
    '    </article>',
    '  </main>',
    '</div>',
    '<p class="colophon">Aus ' + esc(path.basename(doc.src)) + ' erzeugt. '
      + '<a href="' + UEBERSICHT + '">Zurück zur Übersicht</a></p>',
    '<script>' + JS + '</script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');

  const outPath = path.join(REPO, doc.out);
  fs.writeFileSync(outPath, page, 'utf8');
  return { doc, ctx, toc, blocks, md, page, outPath };
}

/* ───────────────────────── 8. Pruefung ───────────────────────── */

function plainFromMd(md) {
  // Markdown-Marker entfernen, damit man Quelltext und gerenderten Text
  // vergleichen kann.
  let t = md.replace(/\r\n?/g, '\n');
  t = t.split('\n').filter((l) => !RE_HR.test(l) && !RE_TSEP.test(l.trim()) || !/^[\s|:-]*$/.test(l.trim()) === false ? true : true).join('\n');
  return t;
}

function checkSource(name, md) {
  const problems = [];
  const lines = md.split('\n');
  let inFence = false;
  let auf = 0, zu = 0;
  lines.forEach((l, n) => {
    if (RE_FENCE.test(l)) { inFence = !inFence; return; }
    if (inFence) return;
    // Anfuehrungszeichen: deutsch, paarig. Ein gerades " ausserhalb von
    // Code-Spans ist entweder ein Zollzeichen (Ziffer davor) oder ein
    // vergessenes Paar.
    const ohneCode = l.replace(/`[^`]*`/g, '');
    auf += (ohneCode.match(/„/g) || []).length;
    zu  += (ohneCode.match(/“/g) || []).length;
    const gerade = [...ohneCode.matchAll(/"/g)].filter((m) => !/\d/.test(ohneCode[m.index - 1] || ''));
    if (gerade.length) problems.push(name + ':' + (n + 1) + ' gerades Anfuehrungszeichen: ' + l.slice(0, 70));
    // Verweise auf die drei Markdown-Quellen: im ausgelieferten Ordner
    // liegen nur die HTML-Seiten, die .md-Datei waere ein toter Weg.
    if (/(01_konkurrenz-anatomie|02_das-ist-die-app|README)\.md/.test(l)) {
      problems.push(name + ':' + (n + 1) + ' Verweis auf eine .md-Quelle: ' + l.slice(0, 70));
    }
    // ungerade Anzahl Sterne ausserhalb von Code-Spans
    const noCode = l.replace(/`[^`]*`/g, '');
    const stars = (noCode.match(/\*/g) || []).length;
    if (stars % 2 !== 0) problems.push(name + ':' + (n + 1) + ' ungerade Sterne: ' + l.slice(0, 70));
    const ticks = (l.match(/`/g) || []).length;
    if (ticks % 2 !== 0) problems.push(name + ':' + (n + 1) + ' ungerade Backticks: ' + l.slice(0, 70));
  });
  if (auf !== zu) problems.push(name + ' Anfuehrungszeichen unpaarig: „ ' + auf + ' vs “ ' + zu);
  return problems;
}

function main() {
  const docs = [
    {
      src: 'docs/01_konkurrenz-anatomie.md',
      out: 'docs/konkurrenz-anatomie.html',
      title: 'Konkurrenz-Anatomie',
      eyebrow: 'Recherche',
      // Die Unterzeile sagt, was der Lead nicht sagt. Vorher begann sie
      // mit denselben 82 Zeichen wie der Lead-Absatz darunter, und beide
      // standen gleichzeitig im ersten Bildschirm.
      sub: 'Die Grundlage des Entwurfs: Querlese, Einzelanalysen, Quellenlage — und wie belastbar jede Angabe ist.'
    },
    {
      src: 'docs/02_das-ist-die-app.md',
      out: 'docs/das-ist-die-app.html',
      title: 'Das ist die App',
      eyebrow: 'Entwurf',
      sub: 'Was die App ist, wie sie aussieht und warum sie gerade so aussieht — von der Farbregel bis zur Selbstkritik.'
    },
    {
      src: 'docs/03_bewegung.md',
      out: 'docs/bewegung.html',
      title: 'Bewegung',
      eyebrow: 'Entwurf',
      sub: 'Die fünf Momente, in denen sich Velum bewegt — als Federn gerechnet, als Kurven gebaut, in Millisekunden nachgemessen.'
    },
    {
      src: 'docs/04_velum-dna.md',
      out: 'docs/velum-dna.html',
      title: 'Velum-DNA',
      eyebrow: 'Entwurf',
      sub: 'Das Leitmotiv, seine drei Grundformen und die sieben Serif-Rollen — die Regeln, gegen die jeder Schirm gebaut ist.'
    },
    {
      src: 'docs/05_hig-check.md',
      out: 'docs/hig-check.html',
      title: 'HIG-Prüfung',
      eyebrow: 'Abnahme',
      sub: 'Jeder Schirm gegen die Human Interface Guidelines gehalten: Trefferflächen, Kontraste, Dynamic Type, Bewegung.'
    },
    {
      src: 'README.md',
      out: 'docs/liesmich.html',
      title: 'GoodNotes Canvas Mockup',
      eyebrow: 'Liesmich',
      sub: 'Der Nachbau der GoodNotes-Whiteboard-Oberfläche: Aufbau, die elf Werkzeuge, die Zeichen-Engine und was bewusst anders ist.'
    }
  ];

  const report = [];
  let bad = 0;

  for (const d of docs) {
    const src = fs.readFileSync(path.join(REPO, d.src), 'utf8');
    const srcProblems = checkSource(d.src, src);

    const r = build(d);
    const { ctx, toc, page } = r;

    // Quellzaehlung
    const sl = src.split('\n');
    const cnt = {
      h1: sl.filter((l) => /^# /.test(l)).length,
      h2: sl.filter((l) => /^## /.test(l)).length,
      h3: sl.filter((l) => /^### /.test(l)).length,
      tsep: sl.filter((l) => RE_TR.test(l) && RE_TSEP.test(l)).length,
      hr: sl.filter((l) => RE_HR.test(l)).length,
      quote: sl.filter((l) => /^>/.test(l)).length,
      fence: sl.filter((l) => RE_FENCE.test(l)).length / 2
    };
    const out = {
      h2: (page.match(/<h2 id=/g) || []).length,
      h3: (page.match(/<h3 id=/g) || []).length,
      tables: (page.match(/<table[ >]/g) || []).length,
      hr: (page.match(/<hr>/g) || []).length,
      bq: (page.match(/<blockquote>/g) || []).length,
      pre: (page.match(/<pre>/g) || []).length,
      tocL2: (page.match(/class="toc-l2"/g) || []).length / 2,
      tocL3: (page.match(/class="toc-l3"/g) || []).length / 2
    };

    const errs = [...srcProblems];
    if (cnt.h2 !== out.h2) errs.push('H2 ' + cnt.h2 + ' != ' + out.h2);
    if (cnt.h3 !== out.h3) errs.push('H3 ' + cnt.h3 + ' != ' + out.h3);
    if (cnt.tsep !== out.tables) errs.push('Tabellen ' + cnt.tsep + ' != ' + out.tables);
    if (cnt.hr !== out.hr + ctx.hrDropped) errs.push('HR ' + cnt.hr + ' != ' + out.hr + '+' + ctx.hrDropped);
    if (cnt.fence !== out.pre) errs.push('Codebloecke ' + cnt.fence + ' != ' + out.pre);
    if (out.tocL2 !== out.h2) errs.push('IV-Ebene-2 ' + out.tocL2 + ' != ' + out.h2);
    if (out.tocL3 !== out.h3) errs.push('IV-Ebene-3 ' + out.tocL3 + ' != ' + out.h3);

    // Anker: jeder data-t verweist auf eine existierende id
    // Der Zurueck-Weg zeigt auf die Uebersicht, nicht auf das Canvas —
    // oben in der Leiste und unten im Fuss, zweimal dieselbe Adresse.
    // Genau zwei feste Stellen: der Knopf oben links und der Fuss. Im
    // Fliesstext duerfen weitere Verweise auf ../mockups/ stehen — die
    // werden hier nicht mitgezaehlt, sondern einzeln geprueft.
    const kopfZurueck = (page.match(/<a class="back" href="\.\.\/mockups\/index\.html"/g) || []).length;
    const fussZurueck = (page.match(/<a href="\.\.\/mockups\/index\.html">Zurück zur Übersicht<\/a>/g) || []).length;
    if (kopfZurueck !== 1) errs.push('Zurueck-Verweis Kopf ' + kopfZurueck + ' != 1');
    if (fussZurueck !== 1) errs.push('Zurueck-Verweis Fuss ' + fussZurueck + ' != 1');

    // Verweise im Fliesstext: auf ein anderes Dokument nur der Dateiname
    // (docs/ liegt im Repo neben mockups/, im Paket neben app-next/ —
    // innerhalb von docs/ stimmt der Weg in beiden Faellen). Auf Screens
    // ausschliesslich ueber ../mockups/, weil nur diese Form vom
    // Buendelskript umgeschrieben wird. Alles andere ist ein Fehler.
    const hrefs = [...page.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1])
      .filter((h) => h[0] !== '#' && !/^https?:/.test(h));
    const dokNamen = docs.map((x) => path.basename(x.out));
    hrefs.forEach((h) => {
      if (/^\.\.\/(mockups|tools|assets)\//.test(h)) return;
      if (dokNamen.includes(h)) return;
      errs.push('Verweis weder Dokumentname noch ../mockups|tools|assets/: ' + h);
    });
    // Jedes Ziel muss es geben — im Repo nachgesehen, nicht geglaubt.
    hrefs.forEach((h) => {
      const ziel = h.startsWith('../') ? path.join(REPO, h.slice(3)) : path.join(REPO, 'docs', h);
      if (!fs.existsSync(ziel)) errs.push('Verweisziel fehlt: ' + h);
    });

    const ids = new Set((page.match(/<h[234] id="([^"]+)"/g) || []).map((s) => /id="([^"]+)"/.exec(s)[1]));
    const targets = [...new Set((page.match(/data-t="([^"]+)"/g) || []).map((s) => /data-t="([^"]+)"/.exec(s)[1]))];
    targets.forEach((t) => { if (!ids.has(t)) errs.push('Anker ohne Ziel: ' + t); });

    if (errs.length) bad++;
    report.push({ file: d.out, bytes: Buffer.byteLength(page), cnt, out, hrDropped: ctx.hrDropped, errs });
  }

  console.log(JSON.stringify(report, null, 2));
  console.log('\nKontrast:');
  contrastReport().forEach((r) => console.log('  ' + r[0].padEnd(6) + r[1].padEnd(44) + r2(r[2]) + ':1'));
  process.exit(bad ? 1 : 0);
}

if (require.main === module) main();
module.exports = { parseBlocks, inline, slug, esc };
