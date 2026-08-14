/* canvas-buehne.js — läuft IM Rahmen, nicht daneben.
 *
 * Das Canvas ist ein eigenes Dokument. Die Bühne des Prototyps reicht nicht
 * hinein: eigener Body, eigene Skripte, eigener Zustand. Also bekommt es
 * seine eigene.
 *
 * Drei Gründe, warum das kein Beiwerk ist:
 *
 *   · Das Vorführbrett heißt „Whiteboard" und erklärt sich mit dem Satz
 *     „… wie in GoodNotes." In einem Film, der GoodNotes schlagen soll,
 *     ist das der teuerste Satz im ganzen Bild.
 *   · Die Uhr im Rahmen läuft echt (19:09), die des Prototyps steht auf
 *     9:41. Zwei Uhren in einem Gerät sind der klassische Attrappen-Fehler.
 *   · Eine leere Fläche beweist nichts. Gezeichnet wird deshalb wirklich —
 *     mit GN.model.create, denselben Fabriken, die auch ein Stift benutzt.
 */
(function (global) {
  'use strict';

  /* ── 1 · Die Bedienoberfläche auf Englisch ───────────────────────────── */

  var WORT = {
    'Füller': 'Fountain',
    'Kugelschreiber': 'Ballpoint',
    'Pinsel': 'Brush',
    'Bleistift': 'Pencil',
    'Leer': 'Blank',
    'Punkte': 'Dots',
    'Raster': 'Grid',
    'Linien': 'Lines',
    'Whiteboard': 'Cell Biology — Lecture 9',
    'Neues Blatt': 'Cell Biology — Lecture 9',
  };

  var ATTR = {
    'Bibliothek': 'Library', 'Geöffnete Boards': 'Open boards', 'Tab schließen': 'Close tab',
    'Neuer Tab': 'New tab', 'Neues Board in neuem Tab': 'New board in a new tab',
    'Seitenleiste': 'Sidebar', 'Boards-Übersicht (⌘\\)': 'All boards (⌘\\)',
    'Suchen': 'Search', 'Suchen (⌘F)': 'Search (⌘F)',
    /* Der Name der Konkurrenz steht als Beschriftung im eigenen Werkzeug.
       Für den Film heißt das Werkzeug, wie es heißen müsste. */
    'Goodnotes AI': 'Velum AI',
    'Ansichtsmodus': 'View mode', 'Lesemodus (⌘⇧R)': 'Read mode (⌘⇧R)',
    'Werkzeuge': 'Tools', 'Rückgängig': 'Undo', 'Rückgängig (⌘Z)': 'Undo (⌘Z)',
    'Wiederholen': 'Redo', 'Wiederholen (⌘⇧Z)': 'Redo (⌘⇧Z)',
    'Stift': 'Pen', 'Stift (1)': 'Pen (1)', 'Radierer': 'Eraser', 'Radierer (2)': 'Eraser (2)',
    'Textmarker': 'Highlighter', 'Textmarker (3)': 'Highlighter (3)',
    'Klebeband': 'Tape', 'Klebeband (4)': 'Tape (4)',
    'Formen': 'Shapes', 'Formen (5)': 'Shapes (5)', 'Lasso': 'Lasso', 'Lasso (6)': 'Lasso (6)',
    'Text': 'Text', 'Text (7)': 'Text (7)', 'Elemente': 'Elements', 'Elemente (8)': 'Elements (8)',
    'Bild & Kamera': 'Image & camera', 'Bild & Kamera (9)': 'Image & camera (9)',
    'Lineal': 'Ruler', 'Lineal (0)': 'Ruler (0)',
    'Laserpointer': 'Laser pointer', 'Laserpointer (\\)': 'Laser pointer (\\)',
    'Zubehör': 'Accessories', 'Board hinzufügen': 'Add board',
    'Teilen und exportieren': 'Share and export', 'Weitere Optionen': 'More',
    'Boards': 'Boards', 'Seitenleiste schließen': 'Close sidebar',
    'Werkzeugoptionen': 'Tool options', 'Werkzeugmenü verschieben': 'Move the tool menu',
    'Ziehen zum Andocken': 'Drag to dock', 'Stiftart': 'Pen type',
    'Weitere Farben': 'More colours', 'Stifteinstellungen': 'Pen settings',
    'Übersichtskarte': 'Overview map',
    'Übersichtskarte — ziehen zum Verschieben, Doppelklick passt ein':
      'Overview map — drag to pan, double-click to fit',
    'Übersichtskarte ein-/ausblenden': 'Show/hide the overview map',
    'Verkleinern': 'Zoom out', 'Vergrößern': 'Zoom in', 'Zoomstufen': 'Zoom levels',
    'Board umbenennen': 'Rename board',
  };

  function sprache() {
    var lauf = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n, arbeit = [];
    while ((n = lauf.nextNode())) arbeit.push(n);
    arbeit.forEach(function (k) {
      var s = (k.textContent || '').trim();
      if (WORT[s]) k.textContent = k.textContent.replace(s, WORT[s]);
      /* pt-Angaben: im Deutschen Komma, im Englischen Punkt */
      if (/^\d+,\d+ pt$/.test(s)) k.textContent = s.replace(',', '.');
    });
    var alle = document.querySelectorAll('*');
    Array.prototype.forEach.call(alle, function (el) {
      ['aria-label', 'title', 'placeholder', 'alt'].forEach(function (a) {
        var v = el.getAttribute && el.getAttribute(a);
        if (!v) return;
        if (ATTR[v]) el.setAttribute(a, ATTR[v]);
        else if (/^\d+,\d+ pt/.test(v)) el.setAttribute(a, v.replace(',', '.').replace('erneut tippen zum Anpassen', 'tap again to adjust'));
      });
    });
    document.title = 'Velum Canvas';
  }

  /* ── 2 · Die Uhr des Rahmens ─────────────────────────────────────────── */

  function uhr() {
    Array.prototype.forEach.call(document.querySelectorAll('*'), function (el) {
      if (el.children.length) return;
      var s = (el.textContent || '').trim();
      if (/^\d{1,2}:\d{2}$/.test(s)) el.textContent = '9:41';
    });
  }

  /* ── 3 · Das Vorlesungsblatt ─────────────────────────────────────────────
   *
   * Der Inhalt ist die Zelle aus der Notiz — dieselbe Vorlesung, dieselbe
   * Woche, dieselben Begriffe. Ein Canvas, das etwas anderes zeigt als die
   * Notiz daneben, behauptet einen Zusammenhang, den der Film nicht hat.
   * ==================================================================== */

  function zeichnen() {
    var M = global.GN && global.GN.model;
    var app = global.gnApp;
    var HS = global.HANDSCHRIFT;
    if (!M || !app || !app.ws || !app.ws.active) return 'keine App';
    if (!HS) return 'keine Handschrift';
    var c = M.create;
    var brett = app.ws.active;

    brett.title = 'Cell Biology — Lecture 9';
    brett.template = 'dots';
    brett.paper = 'white';
    if (brett.items.length) brett.clear('Bühne');

    /* Feste Saat: dieselbe Hand in jeder Aufnahme. */
    var saat = 20260813;
    function z() { saat = (saat * 1103515245 + 12345) % 2147483648; return saat / 2147483648; }

    var TINTE = '#1C1C1F';
    var BLAU  = '#2D4A78';
    var ROT   = '#9A382C';
    var GELB  = '#F7E4A6';
    var GRAU  = '#6E6E76';

    var d = [];

    /* ── Der Zug: ein Streckenzug wird Tinte ─────────────────────────── */
    function strich(pkte, farbe, breite, werkzeug, hinter) {
      var p = [];
      for (var i = 0; i < pkte.length - 1; i++) {
        var a = pkte[i], b = pkte[i + 1];
        var n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
        for (var k = 0; k < n; k++) {
          var t = k / n;
          p.push({ x: a[0] + (b[0] - a[0]) * t + (z() - .5) * 1.9,
                   y: a[1] + (b[1] - a[1]) * t + (z() - .5) * 1.9,
                   p: .6 + .4 * Math.sin(Math.PI * ((i + t) / Math.max(1, pkte.length - 1))) });
        }
      }
      var e = pkte[pkte.length - 1];
      p.push({ x: e[0], y: e[1], p: .55 });
      return c.stroke({ points: p, color: farbe || TINTE, width: breite || 3,
                        tool: werkzeug || 'pen', pen: 'fountain', behind: !!hinter });
    }

    function kreis(cx, cy, r, farbe, breite, dehnung) {
      var p = [], n = 92, dy = dehnung || 1;
      for (var i = 0; i <= n; i++) {
        var a = (i / n) * Math.PI * 2 - .4;
        var rr = r * (1 + (z() - .5) * .03);
        p.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * dy, p: .75 });
      }
      return c.stroke({ points: p, color: farbe || TINTE, width: breite || 3, pen: 'fountain' });
    }

    /* ── Die Schrift: echte Züge, kein Font ──────────────────────────── */
    var schreibNr = 0;
    function schreiben(text, x, y, groesse, farbe, opt) {
      var o = opt || {};
      o.saat = 7717 + (schreibNr++) * 977;
      HS.schreiben(text, x, y, groesse, o).forEach(function (zug) {
        d.push(c.stroke({ points: zug, color: farbe || TINTE,
                          width: o.breite || Math.max(1.6, groesse * .085),
                          pen: 'fountain' }));
      });
      return HS.breite(text, groesse, o);
    }

    /* ══ Kopf ═══════════════════════════════════════════════════════ */
    var kb = schreiben('The Cell — membrane & transport', 78, 96, 44, TINTE, { breite: 3.4 });
    d.push(strich([[76, 118], [76 + kb * .45, 114], [76 + kb * .8, 118], [76 + kb, 115]], TINTE, 2.4));
    schreiben('Lecture 6 · Prof. Wendt · 13 Nov', 82, 152, 22, GRAU, { breite: 1.7 });

    /* ══ Die Zelle ══════════════════════════════════════════════════ */
    var cx = 372, cy = 470, r = 196;
    d.push(kreis(cx, cy, r, TINTE, 3.8, .9));
    d.push(kreis(cx, cy, r - 15, TINTE, 1.5, .9));
    d.push(kreis(cx - 30, cy - 40, 62, TINTE, 3.2, .95));       /* Kern */
    d.push(kreis(cx - 30, cy - 40, 18, TINTE, 2.4, 1));          /* Kernkörperchen */

    /* Mitochondrium mit Cristae */
    d.push(kreis(cx + 74, cy + 78, 52, TINTE, 3.2, .5));
    for (var m = -3; m <= 3; m++) {
      d.push(strich([[cx + 74 + m * 13, cy + 78 - 21], [cx + 74 + m * 13 + 7, cy + 78],
                     [cx + 74 + m * 13, cy + 78 + 21]], TINTE, 1.7));
    }

    /* Raues ER, gefaltet, mit Ribosomen darauf */
    for (var e = 0; e < 4; e++) {
      var y0 = cy + 46 + e * 19;
      d.push(strich([[cx - 150, y0], [cx - 112, y0 - 11], [cx - 74, y0 + 7],
                     [cx - 36, y0 - 9], [cx - 8, y0 + 3]], TINTE, 2.3));
    }
    for (var rb = 0; rb < 18; rb++) {
      d.push(kreis(cx - 148 + z() * 138, cy + 42 + z() * 66, 2.9, TINTE, 2.6, 1));
    }

    /* Golgi: drei gestapelte Bögen */
    for (var g = 0; g < 3; g++) {
      d.push(strich([[cx + 40, cy - 120 + g * 17], [cx + 82, cy - 133 + g * 17],
                     [cx + 128, cy - 116 + g * 17]], TINTE, 2.6));
    }

    /* ══ Beschriftungen ═════════════════════════════════════════════ */
    function marke(text, von, nach, rechts, groesse) {
      var g = groesse || 24;
      d.push(strich([von, nach], BLAU, 1.8));
      var b = HS.breite(text, g);
      schreiben(text, rechts ? nach[0] + 10 : nach[0] - 10 - b, nach[1] + 8, g, BLAU, { breite: 2.0 });
    }
    marke('nucleus',       [cx - 52, cy - 74],  [cx - 232, cy - 176], false);
    marke('rough ER',      [cx - 116, cy + 74], [cx - 250, cy + 160], false);
    marke('Golgi',         [cx + 118, cy - 110],[cx + 246, cy - 152], true);
    marke('mitochondrion', [cx + 106, cy + 104], [cx + 190, cy + 200], true, 22);

    /* ══ Rechte Spalte ══════════════════════════════════════════════ */
    var SX = 782;

    /* Merksatz, mit Textmarker unterlegt — der Marker liegt HINTER der
       Tinte, wie er es auf Papier auch täte. */
    d.push(c.stroke({ points: [{ x: SX - 8, y: 242, p: 1 }, { x: SX + 372, y: 241, p: 1 }],
                      color: GELB, width: 34, tool: 'highlighter', behind: true }));
    d.push(c.stroke({ points: [{ x: SX - 8, y: 288, p: 1 }, { x: SX + 286, y: 287, p: 1 }],
                      color: GELB, width: 34, tool: 'highlighter', behind: true }));
    schreiben('Osmosis: water moves toward\nthe higher concentration.', SX, 250, 27, TINTE,
              { breite: 2.3, zeilen: 1.7 });

    /* Die Rechnung aus der Übung */
    schreiben('cells / mL', SX, 372, 20, GRAU, { breite: 1.6 });
    schreiben('n = ( 312 / 4 ) × 10⁴', SX, 416, 29, TINTE, { breite: 2.5 });
    schreiben('= 1.56 × 10⁶', SX + 44, 462, 29, TINTE, { breite: 2.5 });
    d.push(strich([[SX - 4, 486], [SX + 200, 483], [SX + 292, 487]], ROT, 2.4));
    schreiben('Neubauer chamber, dilution 1:2', SX, 516, 19, ROT, { breite: 1.6 });

    /* ══ Die Karte, die aus dem Blatt entsteht ══════════════════════ */
    d.push(c.text({ x: SX - 12, y: 600, w: 404, h: 150,
      text: 'Q   What does the rough ER do?\n\nA   Folds the proteins that its own\n      ribosomes make.',
      fontFamily: 'system', fontSize: 17, color: '#F6E7B0', boxStyle: 'sticky' }));

    /* Der Pfeil von der Zelle zur Karte: der Zusammenhang, den Velum baut. */
    d.push(strich([[646, 566], [706, 606], [748, 646]], BLAU, 2.2));
    d.push(strich([[748, 646], [728, 639], [734, 655], [748, 646]], BLAU, 2.2));

    /* ══ Rand: was offen bleibt ═════════════════════════════════════ */
    schreiben('? why has the smooth ER no ribosomes', 306, 792, 21, ROT, { breite: 1.8 });
    schreiben('? ask Jana for Tuesday\u2019s counts', 306, 830, 21, ROT, { breite: 1.8 });

    brett.add(d, 'Vorlesungsblatt');
    if (app.renderer) {
      if (app.renderer.fitContent) app.renderer.fitContent(58);
      if (app.renderer.draw) app.renderer.draw();
      if (app.renderer.requestDraw) app.renderer.requestDraw();
    }
    global.CANVASBUEHNE.__dinge = d;
    return brett.items.length;
  }

  /* ── 4 · Die Vorführung: das Blatt entsteht vor der Kamera ────────────
     Die Striche sind einzelne Objekte in Schreibreihenfolge — Überschrift,
     Zelle, Beschriftungen, Merksatz, Rechnung. vorfuehren(ms) setzt sie
     nacheinander aufs Blatt, wie ein Zeitraffer über einer schreibenden
     Hand. Die Kamera steht dabei FEST auf dem fertigen Ausschnitt: erst
     alles einpassen, dann leeren, dann wachsen lassen — eine mitfahrende
     Kamera würde das Entstehen verwackeln. */
  function vorfuehren(ms) {
    var app = global.gnApp;
    if (!app || !app.ws || !app.ws.active) return 'keine App';
    if (!global.CANVASBUEHNE.__dinge) zeichnen();
    var d = global.CANVASBUEHNE.__dinge;
    var brett = app.ws.active;
    if (app.renderer && app.renderer.fitContent) {
      app.renderer.fitContent(58);
    }
    brett.stage([]);
    var schritte = Math.max(1, Math.round((ms || 3600) / 33));
    var je = d.length / schritte;
    var stand = 0, tick = 0;
    var uhrwerk = setInterval(function () {
      tick += 1;
      var bis = Math.min(d.length, Math.round(tick * je));
      if (bis > stand) {
        stand = bis;
        brett.stage(d.slice(0, bis));
      }
      if (bis >= d.length) {
        clearInterval(uhrwerk);
        brett.commit(d, 'Vorlesungsblatt');
      }
    }, 33);
    return d.length;
  }

  function anziehen() {
    var n = zeichnen();
    sprache();
    uhr();
    /* Nach dem Zeichnen zieht die App die Kopfzeile nach — dann noch einmal.
       Und die Uhr läuft weiter: zwei Uhren in einem Gerät sind der klassische
       Attrappenfehler, also wird sie festgehalten, nicht nur einmal gestellt. */
    setTimeout(function () { sprache(); uhr(); }, 300);
    if (!global.__uhrWache) global.__uhrWache = setInterval(uhr, 1000);
    return n;
  }

  global.CANVASBUEHNE = { anziehen: anziehen, sprache: sprache, uhr: uhr,
                          zeichnen: zeichnen, vorfuehren: vorfuehren };
})(window);
