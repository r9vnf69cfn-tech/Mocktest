#!/usr/bin/env node
/* ============================================================================
 * affordanz.js — der Affordanz-Test
 *
 * WOZU
 * iOS sagt „farbig = tappbar". Velums Ink-Akzent nimmt genau dieses Signal
 * weg. Dieses Werkzeug prueft, ob der Entwurf den Preis dafuer bezahlt hat:
 * es oeffnet jeden Screen, findet PROGRAMMATISCH jedes Bedienelement, misst
 * dessen sichtbare Merkmale und zeichnet dessen Rahmen ueber den Screenshot.
 * Das markierte Bild neben dem unmarkierten ist der ganze Test — was nur im
 * markierten Bild einen Rahmen hat, hat keine Affordanz.
 *
 * DIE VIER REGELN (dna-kern.md §6)
 *   R1 Primaere Aktion   gefuellte Ink-Flaeche + heller Text
 *   R2 Sekundaere Aktion Umrandung, Flaeche oder Position — nie nur Farbe
 *   R3 Interaktiver Text zweites Merkmal (Chevron, Chip-Flaeche,
 *                        Unterstreichung, Symbol)
 *   R4 Ziel >= 44 pt
 *
 * WAS „GEMESSEN" HEISST — keine Klassennamen glauben, Werte lesen
 * · Flaeche = eigene background-color, alpha-kompositiert gegen den
 *             tatsaechlichen Untergrund (Vorfahren hoch bis deckend), davon
 *             das Kontrastverhaeltnis. >= 1.10:1 zaehlt als sichtbare Flaeche.
 *             Ein Schlagschatten (nicht-inset box-shadow) zaehlt ebenso —
 *             er traegt dieselbe Auskunft „das hier ist eine Flaeche".
 * · Rand    = border-width > 0 ODER inset box-shadow; Kontrast des Randes
 *             gegen den Untergrund, Schwelle 1.6:1 sichtbar / 3:1 stark.
 * · Ink     = eigene Flaeche liegt nah an --accent UND die Textfarbe nah an
 *             --accent-on. Beides im RGB-Abstand gemessen, nicht geraten.
 * · Ziel    = die getroffene Flaeche in CSS-px (= pt bei scale 1).
 *
 * DREI MENGEN, die auseinandergehalten werden
 *   A  Bedien-Semantik   button · a[href] · [role] · [tabindex] · input …
 *   B  Bedien-Klasse ohne Semantik — .row/.check/.origin/.iconbtn/.navitem
 *      als <div>/<span>. Im Bild ein Bedienelement, im Markup keines. Zaehlt
 *      als geprueftes Bedienelement UND als Semantik-Befund.
 *   C  Fehlaffordanz — .chip/.btn ohne jede Bedien-Semantik: sieht aus wie
 *      ein Bedienelement, ist keines. Der umgekehrte Befund, und er zaehlt.
 *
 * AUFRUF
 *   node tools/affordanz.js                 alle Screens, hell
 *   node tools/affordanz.js today graph     nur passende
 *   node tools/affordanz.js --dunkel        im Dunkelmodus
 *   node tools/affordanz.js --json <pfad>   Rohbefunde zusaetzlich als JSON
 *
 * AUSGABE
 *   mockups/_renders/affordanz/<gruppe>-<datei>-<geraet>[-dunkel].png
 *   Konsole: Tabelle je Screen + Summe
 * ========================================================================= */
'use strict';

const path = require('path');
const fs   = require('fs');
const { createRequire } = require('module');

const REPO    = path.resolve(__dirname, '..');
const MOCKUPS = path.join(REPO, 'mockups');
const ZIEL    = path.join(MOCKUPS, '_renders', 'affordanz');
const CHROME  = process.env.VELUM_CHROME ||
                '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function playwright() {
  const versuche = [];
  if (process.env.VELUM_PLAYWRIGHT) versuche.push(process.env.VELUM_PLAYWRIGHT);
  versuche.push(path.join(process.cwd(), 'node_modules', 'playwright-core'));
  versuche.push(path.join(__dirname, 'node_modules', 'playwright-core'));
  versuche.push(path.join(REPO, 'node_modules', 'playwright-core'));
  versuche.push('playwright-core');
  for (const v of versuche) {
    try { return createRequire(path.join(process.cwd(), '_.js'))(v); } catch (e) {}
  }
  throw new Error('playwright-core nicht gefunden.');
}

const APP_NEXT = ['today','library','notes-list','note-editor','journal-home',
  'journal-entry','tasks','task-detail','flashcards-home','review-session',
  'graph','settings','leere-zustaende'];
const BEST_OF = ['library','today','notes','journal','tasks','flashcards'];

/* ══════════════════════════════════════════════════════════════════════════
 * DER MESSKOPF — laeuft im Schirm
 * ═══════════════════════════════════════════════════════════════════════ */
const MESSEN = function (selektor) {
  const screen = document.querySelector(selektor);
  if (!screen) return null;
  const sbox = screen.getBoundingClientRect();

  /* ── Farbrechnung ───────────────────────────────────────────────────── */
  const parse = (s) => {
    if (!s) return null;
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\/\s]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const ueber = (v, h) => ({ r: v.r * v.a + h.r * (1 - v.a),
                             g: v.g * v.a + h.g * (1 - v.a),
                             b: v.b * v.a + h.b * (1 - v.a), a: 1 });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const kontrast = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const abstand = (a, b) => Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2);

  const untergrund = (el) => {
    const stapel = []; let p = el.parentElement;
    while (p) {
      const bg = parse(getComputedStyle(p).backgroundColor);
      if (bg && bg.a > 0) { stapel.push(bg); if (bg.a >= 0.999) break; }
      p = p.parentElement;
    }
    let grund = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stapel.length - 1; i >= 0; i--) grund = ueber(stapel[i], grund);
    return grund;
  };
  const token = (name) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;width:0;height:0';
    d.style.color = `var(${name})`;
    screen.appendChild(d);
    const c = parse(getComputedStyle(d).color); d.remove(); return c;
  };
  const AKZENT    = token('--accent');
  const AKZENT_ON = token('--accent-on');

  /* ── Kandidaten ─────────────────────────────────────────────────────── */
  const SEMANTIK = 'button, a[href], summary, input, select, textarea, ' +
    'label[for], [role], [tabindex], [onclick], [data-bw], [contenteditable]';

  /* Klassen, die in diesem Entwurf IMMER ein Bedienelement bezeichnen,
     auch wo das Mockup sie als <div>/<span> setzt. Der Test fragt nach dem
     Bild, nicht nach der HTML-Semantik. */
  const IMMER = ['.row', '.navitem', '.tab', '.iconbtn', '.check', '.switch',
    '.origin', '.rate__btn', '.chain__link:not(.chain__link--end)', '.book',
    '.fab', '.toolbtn', '.segmented > *'];
  /* Diese sind IMMER ein eigenes Ziel, auch wenn sie in einem anderen
     Bedienelement liegen: die Kreisfläche erledigt die Aufgabe, die Zeile
     öffnet sie — zwei Aktionen, zwei Ziele. */
  const EIGENZIEL = ['.check', '.iconbtn', '.switch', '.toolbtn', '.fab'];
  /* Klassen, die BEIDES sein koennen — Bedienelement oder Etikett. Ohne
     Semantik gelten sie als Fehlaffordanz-Kandidat, nicht als Bedienelement. */
  const VIELLEICHT = ['.chip', '.btn'];

  const SEL = [SEMANTIK, ...IMMER, ...VIELLEICHT].join(',');
  const alle = Array.from(screen.querySelectorAll(SEL));

  const treffer = [];
  const gesehen = new Set();
  for (const el of alle) {
    if (gesehen.has(el)) continue; gesehen.add(el);
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue;
    if (r.right <= sbox.left || r.left >= sbox.right ||
        r.bottom <= sbox.top || r.top >= sbox.bottom) continue;
    /* Die Statusleiste ist Kulisse, kein Bedienelement des Entwurfs. */
    if (el.closest('.statusbar')) continue;
    treffer.push({ el, r, cs });
  }

  const liste = treffer.map(({ el, r, cs }, i) => {
    const hatSemantik = el.matches(SEMANTIK);
    const immerBedien = IMMER.some((s) => { try { return el.matches(s); } catch (e) { return false; } });
    const art = hatSemantik ? 'A' : (immerBedien ? 'B' : 'C');

    const eigenBg = parse(cs.backgroundColor) || { r: 0, g: 0, b: 0, a: 0 };
    const grund   = untergrund(el);
    const flaeche = eigenBg.a > 0 ? ueber(eigenBg, grund) : grund;
    const flKontrast = eigenBg.a > 0 ? kontrast(flaeche, grund) : 1;

    const schatten = (cs.boxShadow && cs.boxShadow !== 'none') ? cs.boxShadow : '';
    const hatSchlagschatten = !!schatten && !/inset/.test(schatten);

    const bw = ['borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth']
      .map((k) => parseFloat(cs[k]) || 0);
    let randFarbe = null, randStaerke = 0;
    if (bw.some((w) => w > 0)) {
      randFarbe = parse(cs.borderTopColor) || parse(cs.borderLeftColor);
      randStaerke = Math.max(...bw);
    } else if (/inset/.test(schatten)) {
      const m = schatten.match(/rgba?\([^)]+\)/);
      randFarbe = m ? parse(m[0]) : null;
      const px = (schatten.match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
      randStaerke = px.length >= 4 ? Math.abs(px[3]) : (px.length ? Math.abs(px[px.length-1]) : 1);
    }
    const randKontrast = randFarbe && randFarbe.a > 0
      ? kontrast(ueber(randFarbe, grund), grund) : 1;

    const textFarbe = ueber(parse(cs.color) || { r:0,g:0,b:0,a:1 }, flaeche);
    const istInk = eigenBg.a > 0.5 && AKZENT && AKZENT_ON &&
                   abstand(flaeche, AKZENT) < 34 && abstand(textFarbe, AKZENT_ON) < 60;

    /* Ein Symbol zaehlt nur, wenn es DIESEM Element gehoert. Das Fahnen-
       Symbol in einem Deadline-Chip sagt nichts ueber die Zeile, in der der
       Chip sitzt — sonst haengt das Ergebnis am Zufall, welche Zeile einen
       Chip traegt. */
    const gehoert = (s) => {
      let p = s.parentElement;
      while (p && p !== el) {
        if (p.matches(SEL)) return false;   /* ein naeheres Bedienelement */
        p = p.parentElement;
      }
      return p === el;
    };
    const icoEls = Array.from(el.querySelectorAll('.ico')).filter((s) => {
      const b = s.getBoundingClientRect();
      return b.width > 5 && b.height > 5 && gehoert(s); });
    const svgEls = Array.from(el.querySelectorAll('svg:not(.thread)')).filter((s) => {
      const b = s.getBoundingClientRect();
      return b.width > 6 && b.height > 6 && gehoert(s); });
    const icoNamen = icoEls.map((s) => s.dataset.ico || '?');
    const hatSymbol  = icoEls.length > 0 || svgEls.length > 0;
    const hatChevron = icoNamen.some((n) => /chev|arrow|disclos|more|caret|plus|ellips/i.test(n));
    const unter      = /underline/.test(cs.textDecorationLine || '');

    /* Die Flaeche kann von einem Kind kommen: <button> transparent, darin
       ein <span class="origin"> mit Fuellung, der den Knopf ausfuellt.
       Gemessen wird jedes Kind, das >= 55 % der Knopfflaeche deckt. */
    let flVonKind = 0, kindFlaeche = null;
    const flaechenGrund = eigenBg.a > 0 ? flaeche : grund;
    for (const k of el.querySelectorAll('*')) {
      const kb = k.getBoundingClientRect();
      if (!kb.width || !kb.height) continue;
      const deckung = (kb.width * kb.height) / (r.width * r.height);
      const breit = kb.width / r.width >= 0.8 && kb.height / r.height >= 0.45;
      if (deckung < 0.55 && !breit) continue;
      const kbg = parse(getComputedStyle(k).backgroundColor);
      if (!kbg || kbg.a <= 0) continue;
      const kf = ueber(kbg, flaechenGrund);
      const kk = kontrast(kf, flaechenGrund);
      if (kk > flVonKind) { flVonKind = kk; kindFlaeche = kf; }
    }
    flVonKind = Math.round(flVonKind * 100) / 100;

    const lage = (() => {
      const n = ['.navbar','.tabbar','.toolbar','.sidebar','.sheet__head',
        '.segmented','.keyboard','.rate','.editor__tools','.tools','.searchbar',
        '.dock','.menu','.popover','.kbd','.tooldock','.inspector__head']
        .find((s) => { try { return el.closest(s); } catch (e) { return false; } });
      if (n) return n.slice(1);
      /* Listenlage: eine Zeile unter Geschwisterzeilen mit Haarlinie ist die
         iOS-Liste. Sie sagt „tappbar" durch Bauform, nicht durch Farbe —
         genau das, was R2 unter „Position" meint. Gilt erst ab drei Zeilen,
         damit zwei zufaellig gleiche Kaesten keine Liste ergeben. */
      if (el.matches('.row') && el.parentElement &&
          el.parentElement.querySelectorAll(':scope > .row').length >= 3) return 'liste';
      return null;
    })();

    /* Geschachtelt heisst: liegt in einem ANDEREN Bedienelement (A oder B).
       Eine Fehlaffordanz (C) ist kein Ziel und darf nichts abschirmen. */
    let eltern = el.parentElement, drin = false;
    while (eltern && eltern !== screen) {
      const t = treffer.find((x) => x.el === eltern);
      if (t && (t.el.matches(SEMANTIK) ||
                IMMER.some((s) => { try { return t.el.matches(s); } catch (x) { return false; } }))) {
        drin = true; break;
      }
      eltern = eltern.parentElement;
    }

    return {
      i, art, tag: el.tagName.toLowerCase(),
      eigenziel: EIGENZIEL.some((s) => { try { return el.matches(s); } catch (x) { return false; } }),
      klasse: (typeof el.className === 'string' ? el.className : '').trim(),
      text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 52),
      x: Math.round((r.left - sbox.left) * 10) / 10,
      y: Math.round((r.top - sbox.top) * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      istInk,
      flKontrast:   Math.round(flKontrast * 100) / 100,
      randKontrast: Math.round(randKontrast * 100) / 100,
      randStaerke:  Math.round(randStaerke * 10) / 10,
      hatSchlagschatten, hatSymbol, hatChevron, unter, lage, drin, icoNamen,
      flVonKind,
      grundHex:   '#' + [grund.r, grund.g, grund.b].map((v) => Math.round(v).toString(16).padStart(2,'0')).join(''),
      flaecheHex: '#' + [flaeche.r, flaeche.g, flaeche.b].map((v) => Math.round(v).toString(16).padStart(2,'0')).join(''),
    };
  });

  return { liste, sbox: { w: sbox.width, h: sbox.height } };
};

/* ══════════════════════════════════════════════════════════════════════════
 * BEWERTUNG — in Node, damit die Regeln an genau einer Stelle nachlesbar sind
 * ═══════════════════════════════════════════════════════════════════════ */

const istPrimaerGemeint = (e) =>
  /(^|\s)(btn--primary|chip--solid|rate__btn--primary|fab|handoff__btn)(\s|$)/.test(e.klasse) ||
  /is-primary/.test(e.klasse);

/* Die sichtbaren Merkmale, aus denen R2 und R3 rechnen. Einmal definiert,
   damit nicht zwei Regeln dieselbe Frage verschieden beantworten.
   F Flaeche · R Rand · S Symbol · U Unterstreichung · L Lage in einer Leiste */
const F = (e) => e.flKontrast >= 1.10 || e.hatSchlagschatten || e.flVonKind >= 1.10;
const R = (e) => e.randStaerke > 0 && e.randKontrast >= 1.6;
const S = (e) => e.hatSymbol;
const U = (e) => e.unter;
const L = (e) => !!e.lage;

function bewerten(e) {
  const v = [];
  if (e.art === 'C') return v;   /* Fehlaffordanz wird eigens gezaehlt */

  /* R1 — die primaere Aktion muss eine gefuellte Ink-Flaeche mit hellem
     Text sein, nicht schwarzer Text neben schwarzem Text. */
  if (istPrimaerGemeint(e) && !e.istInk)
    v.push({ regel: 'R1', was: 'als primär gedacht, aber keine gefüllte Ink-Fläche mit hellem Text' });

  /* R2 — sekundaere Aktion: Umrandung, Flaeche ODER Lage. Ein Symbol ist
     hier ausdruecklich KEIN Ersatz — die Frage lautet, ob das Element als
     Bedienflaeche lesbar ist, nicht ob irgendwo ein Zeichen sitzt. */
  if (!e.istInk && !F(e) && !R(e) && !L(e))
    v.push({ regel: 'R2', was: 'weder Fläche noch Rand noch Lage in einer Leiste' });

  /* R3 — interaktiver Text braucht ein zweites Merkmal. Faellt R3, ist das
     Element im unmarkierten Bild ueberhaupt nicht als Bedienelement lesbar. */
  if (e.text && !e.istInk && !F(e) && !R(e) && !S(e) && !U(e) && !L(e))
    v.push({ regel: 'R3', was: 'interaktiver Text ohne zweites Merkmal — kein Chevron, keine Chip-Fläche, keine Unterstreichung, kein Symbol' });

  /* R4 — Ziel >= 44 pt. Geschachtelte nur, wenn sie ein eigenes Ziel sind. */
  if (!e.drin || e.art === 'A' || e.eigenziel) {
    const klein = Math.min(e.w, e.h);
    if (klein < 44) v.push({ regel: 'R4', wert: klein,
      was: `Ziel ${e.w}×${e.h} pt — kleinste Kante ${klein} < 44` });
  }
  return v;
}

/* Schwere: was ein Fremder NICHT sieht, wiegt am schwersten. */
function schwere(e, v) {
  const r = v.map((x) => x.regel);
  const k = (v.find((x) => x.regel === 'R4') || {}).wert;
  if (r.includes('R3') || r.includes('R1')) return 'schwer';
  if (r.includes('R2')) return 'mittel';
  if (r.includes('R4')) return k < 30 ? 'mittel' : 'leicht';
  return 'leicht';
}

const FARBE = { primaer: '#D0104C', sekundaer: '#0A5BD3', tertiaer: '#0B7A33', fehl: '#6D28A8' };

function stufe(e) {
  if (e.art === 'C') return 'fehl';
  if (e.istInk || istPrimaerGemeint(e)) return 'primaer';
  if (F(e) || R(e)) return 'sekundaer';
  return 'tertiaer';
}

/* ══════════════════════════════════════════════════════════════════════════
 * LAUF
 * ═══════════════════════════════════════════════════════════════════════ */
(async () => {
  const argv = process.argv.slice(2);
  const dunkel = argv.includes('--dunkel');
  const jsonIdx = argv.indexOf('--json');
  const jsonZiel = jsonIdx >= 0 ? argv[jsonIdx + 1] : null;
  const filter = argv.filter((a) => !a.startsWith('--') && a !== jsonZiel);

  fs.mkdirSync(ZIEL, { recursive: true });
  const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'aff-'));
  const { chromium } = playwright();
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  const ziele = [];
  for (const d of APP_NEXT) ziele.push(['app-next', d]);
  for (const d of BEST_OF)  ziele.push(['best-of', d]);
  const gewaehlt = filter.length
    ? ziele.filter(([g, d]) => filter.some((f) => (g + '-' + d).includes(f) || d === f))
    : ziele;

  const alles = [];

  for (const [gruppe, datei] of gewaehlt) {
    const ctx = await b.newContext({
      viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 2,
      colorScheme: dunkel ? 'dark' : 'light', reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', (e) => fehler.push(String(e.message || e).slice(0, 140)));
    await page.goto('file://' + path.join(MOCKUPS, gruppe, datei + '.html'), { waitUntil: 'load' });
    await page.addStyleTag({ content: '.controls,.screennav{display:none!important}body.has-screennav{padding-bottom:0!important}' });
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      document.documentElement.dataset.type = document.documentElement.dataset.type || 'standard';
    }, dunkel ? 'dark' : 'light');
    await page.evaluate(async () => {
      try { if (document.fonts) await document.fonts.ready; } catch (e) {}
      await Promise.all(Array.from(document.images).map((im) => im.complete ? null
        : new Promise((r) => { im.addEventListener('load', r, { once: true });
                               im.addEventListener('error', r, { once: true }); setTimeout(r, 6000); })));
    });
    try {
      await page.waitForFunction(() => Array.from(document.querySelectorAll('svg.thread'))
        .every((el) => el.dataset.threadDone === '1' || el.firstElementChild), null, { timeout: 15000 });
    } catch (e) {}
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getAnimations().forEach((a) => {
      try { if (a.effect && a.effect.getTiming().iterations === Infinity) a.currentTime = 300; a.pause(); } catch (e) {} }));

    for (const [geraet, sel] of [['ipad', '.screen--ipad'], ['iphone', '.screen--iphone']]) {
      if (!(await page.locator(sel).count())) continue;
      const roh = await page.evaluate(MESSEN, sel);
      if (!roh) continue;

      /* ── Huelle und Kern verschmelzen ─────────────────────────────────
         `<button><span class="origin">…</span></button>`: der Knopf traegt
         die Semantik und das 44-pt-Ziel, der Chip traegt Flaeche und Symbol.
         Getrennt gemessen faellt der Knopf durch R2/R3 und der Chip durch
         R4 — beides falsch, es ist EIN Bedienelement. Verschmolzen wird nur,
         wenn der Kern die Huelle zu >= 45 % deckt und die Huelle sonst kein
         weiteres Bedienelement enthaelt. */
      const roheListe = roh.liste;
      const verschluckt = new Set();
      for (const h of roheListe) {
        if (h.art !== 'A') continue;
        const kerne = roheListe.filter((k) => k !== h && !verschluckt.has(k.i) &&
          k.x >= h.x - 1 && k.y >= h.y - 1 &&
          k.x + k.w <= h.x + h.w + 1 && k.y + k.h <= h.y + h.h + 1);
        if (kerne.length !== 1) continue;
        const k = kerne[0];
        if (k.art === 'A') continue;                     /* eigener Knopf */
        if ((k.w * k.h) / (h.w * h.h) < 0.45) continue;
        h.flKontrast   = Math.max(h.flKontrast, k.flKontrast);
        h.flVonKind    = Math.max(h.flVonKind, k.flVonKind, k.flKontrast);
        h.randKontrast = Math.max(h.randKontrast, k.randKontrast);
        h.randStaerke  = Math.max(h.randStaerke, k.randStaerke);
        h.hatSymbol    = h.hatSymbol || k.hatSymbol;
        h.hatChevron   = h.hatChevron || k.hatChevron;
        h.verschmolzen = k.klasse || k.tag;
        verschluckt.add(k.i);
      }

      const eintraege = roheListe.filter((e) => !verschluckt.has(e.i)).map((e) => {
        const v = bewerten(e);
        return { ...e, verstoesse: v, schwere: v.length ? schwere(e, v) : null, stufe: stufe(e) };
      });

      /* ── unmarkiert und markiert, exakt derselbe Ausschnitt ───────────── */
      const el = page.locator(sel).first();
      const rohOhne = path.join(TMP, `ohne-${gruppe}-${datei}-${geraet}.png`);
      await el.screenshot({ path: rohOhne, animations: 'allow', caret: 'hide', scale: 'device' });

      await page.evaluate(({ sel, eintraege, FARBE }) => {
        const screen = document.querySelector(sel);
        document.querySelectorAll('.aff-layer').forEach((n) => n.remove());
        const lay = document.createElement('div');
        lay.className = 'aff-layer';
        lay.style.cssText = 'position:absolute;inset:0;z-index:99999;pointer-events:none;' +
          'font:700 9px/1 ui-sans-serif,system-ui,sans-serif';
        eintraege.forEach((e) => {
          const c = FARBE[e.stufe];
          const d = document.createElement('div');
          const strich = (e.art === 'A') ? 'solid' : 'dashed';
          d.style.cssText =
            `position:absolute;left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;` +
            `border:${e.schwere === 'schwer' ? 2.5 : 1.5}px ${strich} ${c};` +
            `border-radius:3px;box-sizing:border-box;`;
          if (e.schwere === 'schwer') d.style.boxShadow = `0 0 0 3px ${c}40`;
          lay.appendChild(d);
          if (e.w > 20 && e.h > 13) {
            const n = document.createElement('span');
            n.textContent = e.i;
            n.style.cssText = `position:absolute;left:${e.x + 1.5}px;top:${e.y + 1.5}px;` +
              `background:${c};color:#fff;padding:1px 3px;border-radius:2px`;
            lay.appendChild(n);
          }
        });
        screen.appendChild(lay);
      }, { sel, eintraege, FARBE });

      const rohMit = path.join(TMP, `mit-${gruppe}-${datei}-${geraet}.png`);
      await el.screenshot({ path: rohMit, animations: 'allow', caret: 'hide', scale: 'device' });
      await page.evaluate(() => document.querySelectorAll('.aff-layer').forEach((n) => n.remove()));

      alles.push({ gruppe, datei, geraet, dunkel, rohOhne, rohMit,
                   groesse: roh.sbox, eintraege, fehler: fehler.slice() });
    }
    await ctx.close();
  }

  /* ── Doppelbild + Legende. Das Blatt liegt als Datei neben den PNG, damit
   *    file:// aus file:// laden darf (aus about:blank darf es nicht). ──── */
  const ctx2 = await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
  const p2 = await ctx2.newPage();

  for (const s of alles) {
    const z = s.eintraege;
    const nStufe = (k) => z.filter((e) => e.stufe === k).length;
    const nBef   = (k) => z.filter((e) => e.schwere === k).length;
    const nRegel = (k) => z.filter((e) => e.verstoesse.some((v) => v.regel === k)).length;
    const geprueft = z.filter((e) => e.art !== 'C').length;
    const ohneSemantik = z.filter((e) => e.art === 'B').length;
    const suffix = s.dunkel ? '-dunkel' : '';
    const name   = `${s.gruppe}-${s.datei}-${s.geraet}${suffix}`;
    const G = s.groesse;
    const breite = G.w * 2 + 16 + 32;

    const blatt = path.join(TMP, name + '.html');
    fs.writeFileSync(blatt, `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#fff;color:#111;width:${breite}px;
     font:400 13px/17px ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.kopf{padding:14px 16px 4px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.kopf b{font:600 17px/22px inherit}
.kopf span{color:#5a5a5a}
.paar{padding:8px 16px 0;display:flex;gap:16px}
figure{width:${G.w}px}
figcaption{font:600 12px/16px inherit;color:#5a5a5a;padding:0 0 6px}
img{display:block;width:${G.w}px;height:${G.h}px;box-shadow:0 0 0 1px #dcdcdc}
.leg{padding:14px 16px 6px;display:flex;gap:18px;flex-wrap:wrap;align-items:center}
.l{display:flex;align-items:center;gap:7px}
.sw{width:26px;height:15px;border-radius:3px;box-sizing:border-box;flex:none}
.n{font-weight:600;color:#111;font-variant-numeric:tabular-nums}
.zahl{padding:0 16px 16px;color:#5a5a5a;font-variant-numeric:tabular-nums;
      display:flex;gap:18px;flex-wrap:wrap}
</style>
<div class="kopf"><b>${s.gruppe}/${s.datei}.html — ${s.geraet === 'ipad' ? 'iPad 1194×834 pt' : 'iPhone 393×852 pt'}</b>
  <span>${s.dunkel ? 'Dunkelmodus' : 'Hellmodus'} · ${geprueft} Bedienelemente geprüft</span></div>
<div class="paar">
  <figure><figcaption>ohne Markierung — was ein Fremder sieht</figcaption><img src="file://${s.rohOhne}"></figure>
  <figure><figcaption>mit Markierung — was tappbar ist</figcaption><img src="file://${s.rohMit}"></figure>
</div>
<div class="leg">
  <div class="l"><span class="sw" style="border:2.5px solid ${FARBE.primaer}"></span>primär · gefüllte Ink-Fläche <span class="n">${nStufe('primaer')}</span></div>
  <div class="l"><span class="sw" style="border:2px solid ${FARBE.sekundaer}"></span>sekundär · eigene Fläche oder Rand <span class="n">${nStufe('sekundaer')}</span></div>
  <div class="l"><span class="sw" style="border:2px solid ${FARBE.tertiaer}"></span>tertiär · weder Fläche noch Rand <span class="n">${nStufe('tertiaer')}</span></div>
  <div class="l"><span class="sw" style="border:2px dashed ${FARBE.fehl}"></span>Fehlaffordanz · sieht tappbar aus, ist es nicht <span class="n">${nStufe('fehl')}</span></div>
</div>
<div class="leg">
  <div class="l"><span class="sw" style="border:2px dashed #7a7a7a"></span>gestrichelt = keine Bedien-Semantik im Markup <span class="n">${ohneSemantik}</span></div>
  <div class="l"><span class="sw" style="border:2.5px solid ${FARBE.tertiaer};box-shadow:0 0 0 3px ${FARBE.tertiaer}40"></span>Halo = schwerer Befund</div>
</div>
<div class="zahl">
  <span>Befunde: <span class="n">${nBef('schwer')}</span> schwer · <span class="n">${nBef('mittel')}</span> mittel · <span class="n">${nBef('leicht')}</span> leicht</span>
  <span>R1 primär <span class="n">${nRegel('R1')}</span></span>
  <span>R2 nur Farbe/Text <span class="n">${nRegel('R2')}</span></span>
  <span>R3 Text ohne zweites Merkmal <span class="n">${nRegel('R3')}</span></span>
  <span>R4 Ziel &lt; 44 pt <span class="n">${nRegel('R4')}</span></span>
</div>`);

    await p2.setViewportSize({ width: breite, height: 600 });
    await p2.goto('file://' + blatt, { waitUntil: 'load' });
    await p2.evaluate(() => Promise.all(Array.from(document.images).map((im) => im.complete
      ? null : new Promise((r) => { im.onload = r; im.onerror = r; }))));
    const ziel = path.join(ZIEL, name + '.png');
    await p2.screenshot({ path: ziel, fullPage: true, scale: 'css' });
    s.ausgabe = ziel;
  }
  await ctx2.close();
  await b.close();

  /* ── Bericht ─────────────────────────────────────────────────────────── */
  const kopf = ['screen','gerät','geprüft','prim','sek','ter','fehl','ohneSem',
                'schwer','mittel','leicht','R1','R2','R3','R4'];
  const zeilen = alles.map((s) => {
    const z = s.eintraege;
    const nS = (k) => z.filter((e) => e.stufe === k).length;
    const nB = (k) => z.filter((e) => e.schwere === k).length;
    const nR = (k) => z.filter((e) => e.verstoesse.some((v) => v.regel === k)).length;
    return [`${s.gruppe}/${s.datei}`, s.geraet, z.filter((e) => e.art !== 'C').length,
      nS('primaer'), nS('sekundaer'), nS('tertiaer'), nS('fehl'),
      z.filter((e) => e.art === 'B').length,
      nB('schwer'), nB('mittel'), nB('leicht'), nR('R1'), nR('R2'), nR('R3'), nR('R4')];
  });
  console.log(kopf.join('\t'));
  zeilen.forEach((r) => console.log(r.join('\t')));
  const summe = kopf.map((_, i) => i < 2 ? '' : zeilen.reduce((a, r) => a + r[i], 0));
  summe[0] = 'SUMME';
  console.log(summe.join('\t'));

  if (jsonZiel) fs.writeFileSync(jsonZiel, JSON.stringify(alles, null, 1));
  console.log('\nBilder: ' + ZIEL);
})().catch((e) => { console.error(e); process.exit(1); });
