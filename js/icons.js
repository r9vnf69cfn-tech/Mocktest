/* ============================================================================
 * icons.js — SVG-Icon-Registry
 *
 * Alle Glyphen liegen auf einem 24×24-Raster, nutzen `currentColor` und werden
 * über `data-icon` bzw. `GN.icon(name)` eingesetzt. Werkzeuge, die eine Farbe
 * führen (Stift, Textmarker, Klebeband, Formen, Elemente, Laser), besitzen
 * einen Teil mit der Klasse `tint`: dieser übernimmt die aktive Werkzeugfarbe
 * aus der CSS-Variablen `--tint` — genau wie in GoodNotes.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});

  /* Konturstärken: Werkzeug-Glyphen tragen etwas mehr Gewicht als die
   * Navigation, damit die Werkzeugleiste optisch führt. */
  const SW_TOOL = 1.75;
  const SW_NAV = 1.7;

  /** Grundgerüst. Die Kontur wird am Wurzelelement gesetzt und vererbt. */
  const svg = (body, sw) =>
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" ' +
    'stroke="currentColor" stroke-width="' + sw + '" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
    'xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';

  const nav = (body) => svg(body, SW_NAV);
  const tool = (body) => svg(body, SW_TOOL);

  /* Attribut-Kürzel. Flächen müssen die geerbte Kontur ausdrücklich abschalten. */
  const F = 'fill="currentColor" stroke="none"';                            // massive Fläche
  const TF = 'class="tint" fill="var(--tint,currentColor)" stroke="none"';  // Fläche in Werkzeugfarbe
  const TS = 'class="tint" stroke="var(--tint,currentColor)"';              // Kontur in Werkzeugfarbe
  const DASH = 'stroke-dasharray="2.6 2.4"';

  /** Vierzackiger Funke: konkave Flanken über eine Bézier-Taille bei ~0.47 r. */
  const sparkle = (cx, cy, r) => {
    const k = +(r * 0.17).toFixed(2);
    const n = (v) => +v.toFixed(2);
    return (
      'M' + n(cx) + ' ' + n(cy - r) +
      'Q' + n(cx + k) + ' ' + n(cy - k) + ' ' + n(cx + r) + ' ' + n(cy) +
      'Q' + n(cx + k) + ' ' + n(cy + k) + ' ' + n(cx) + ' ' + n(cy + r) +
      'Q' + n(cx - k) + ' ' + n(cy + k) + ' ' + n(cx - r) + ' ' + n(cy) +
      'Q' + n(cx - k) + ' ' + n(cy - k) + ' ' + n(cx) + ' ' + n(cy - r) + 'Z'
    );
  };

  /** Handschrift-Welle über drei Bögen, Amplitude ≈ 2 px. */
  const wave = (y) =>
    'M4.3 ' + y + 'c1.5-2.8 3.1-2.8 4.6 0s3.1 2.8 4.6 0 3.1-2.8 4.6 0';

  /* Mehrfach genutzte Körper: bewusst geteilt, damit Foto-Motive in Werkzeug,
   * Menü und Filter identisch aussehen. */
  const PHOTO =
    '<rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.6"/>' +
    '<circle cx="7.9" cy="9.2" r="1.8" ' + F + '/>' +
    '<path d="M3.9 17.6 8.1 13.4a1.6 1.6 0 0 1 2.3 0l3.1 3.1 1.7-1.7a1.6 1.6 0 0 1 2.3 0l2.4 2.4"/>';

  /* Papierbogen (Hochformat) für die Raster-Auswahl. */
  const SHEET = '<rect x="4.4" y="3.2" width="15.2" height="17.6" rx="2.4"/>';
  /* Farbfeld (Querformat) für die Papierfarben — bewusst anders als SHEET,
   * damit Raster- und Farbgruppe im Menü nicht verwechselt werden. */
  const SWATCH = 'x="3.6" y="5.2" width="16.8" height="13.6" rx="3"';

  /* Klebebandstreifen mit gezackten Enden (Geometrie einmal, Fläche + Kontur). */
  const TAPE_D =
    'M5.7 8.9 4.4 10.45 5.7 12 4.4 13.55 5.7 15.1H18.3l1.3-1.55L18.3 12l1.3-1.55L18.3 8.9Z';

  const icons = {
    /* ══ Navigation / Chrome ═════════════════════════════════════════════ */

    // Bibliothek: vorderste Karte plus drei zurückweichende Kanten.
    library: nav(
      '<rect x="4" y="11.4" width="16" height="9.1" rx="2.1"/>' +
      '<path d="M6.1 8.9h11.8M7.4 6.4h9.2M8.7 4h6.6"/>'
    ),

    sidebar: nav(
      '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/>' +
      '<path d="M9.4 4.5v15"/>'
    ),

    search: nav(
      '<circle cx="10.7" cy="10.7" r="6.3"/>' +
      '<path d="m15.3 15.3 4.5 4.5"/>'
    ),

    // KI-Funke: ein großer Funke, zwei kleine rechts.
    aiSparkle: nav(
      '<path d="' + sparkle(10, 12.4, 7) + '" ' + F + '/>' +
      '<path d="' + sparkle(18, 6.6, 3) + '" ' + F + '/>' +
      '<path d="' + sparkle(18.4, 16.4, 2.2) + '" ' + F + '/>'
    ),

    // Bearbeiten-Modus: Stift mit Schreibspur.
    viewEdit: nav(
      '<path d="M7.7 14.8 9.2 11.3 15.5 5a1.46 1.46 0 0 1 2.1 2.1L11.2 13.3Z"/>' +
      '<path d="M9.2 11.3 11.2 13.3"/>' +
      '<path d="M4 19.6c1.9-2.4 3.8-2.4 5.7 0s3.8 2.4 5.7 0"/>'
    ),

    // Lese-Modus: durchgestrichener Stift.
    viewRead: nav(
      '<path d="M6.2 17.8 8 13.7 15.5 6.2a1.63 1.63 0 0 1 2.3 2.3L10.3 16Z"/>' +
      '<path d="M8 13.7 10.3 16"/>' +
      '<path d="m5.6 5.6 12.8 12.8"/>'
    ),

    plus: nav('<path d="M12 4.6v14.8M4.6 12h14.8"/>'),
    minus: nav('<path d="M4.6 12h14.8"/>'),
    close: nav('<path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8"/>'),
    check: nav('<path d="m4.8 12.6 5 5 9.4-10.8"/>'),

    chevronDown: nav('<path d="m6.2 9.4 5.8 5.8 5.8-5.8"/>'),
    chevronUp: nav('<path d="m6.2 14.6 5.8-5.8 5.8 5.8"/>'),
    chevronLeft: nav('<path d="m14.6 6.2-5.8 5.8 5.8 5.8"/>'),
    chevronRight: nav('<path d="m9.4 6.2 5.8 5.8-5.8 5.8"/>'),

    undo: nav(
      '<path d="M4.4 9.6h9.2a5 5 0 0 1 0 10H9"/>' +
      '<path d="M8.8 5.2 4.4 9.6l4.4 4.4"/>'
    ),
    redo: nav(
      '<path d="M19.6 9.6h-9.2a5 5 0 0 0 0 10H15"/>' +
      '<path d="m15.2 5.2 4.4 4.4-4.4 4.4"/>'
    ),

    share: nav(
      '<path d="M12 4v11.4"/>' +
      '<path d="m8.4 7.6 3.6-3.6 3.6 3.6"/>' +
      '<path d="M7.6 10.2H6.2a2 2 0 0 0-2 2v6.4a2 2 0 0 0 2 2h11.6a2 2 0 0 0 2-2v-6.4a2 2 0 0 0-2-2h-1.4"/>'
    ),

    more: nav(
      '<circle cx="5.6" cy="12" r="1.7" ' + F + '/>' +
      '<circle cx="12" cy="12" r="1.7" ' + F + '/>' +
      '<circle cx="18.4" cy="12" r="1.7" ' + F + '/>'
    ),

    // Zubehör: drei Punkte über einem Chevron.
    accessories: nav(
      '<circle cx="6.4" cy="8.6" r="1.6" ' + F + '/>' +
      '<circle cx="12" cy="8.6" r="1.6" ' + F + '/>' +
      '<circle cx="17.6" cy="8.6" r="1.6" ' + F + '/>' +
      '<path d="m7.4 14.4 4.6 4.6 4.6-4.6"/>'
    ),

    minimap: nav(
      '<rect x="3" y="5" width="18" height="14" rx="2.2"/>' +
      '<rect x="7.2" y="8.6" width="9.6" height="6.8" rx="1.4" stroke-width="1.4"/>'
    ),

    // Whiteboard-Reiter: Fläche mit Stiftspur.
    boardTab: nav(
      '<rect x="3" y="4.6" width="18" height="14.8" rx="2.4"/>' +
      '<path d="M6.6 14.8c1.8-5.2 4.2-5.4 5.6-2 1 2.4 2.8 2.6 5.2-2.2"/>'
    ),

    fit: nav(
      '<path d="M9.2 3.6H5.4a1.8 1.8 0 0 0-1.8 1.8v3.8M14.8 3.6h3.8a1.8 1.8 0 0 1 1.8 1.8v3.8' +
      'M20.4 14.8v3.8a1.8 1.8 0 0 1-1.8 1.8h-3.8M3.6 14.8v3.8a1.8 1.8 0 0 0 1.8 1.8h3.8"/>'
    ),

    download: nav(
      '<path d="M12 3.6v11"/>' +
      '<path d="m7.8 10.4 4.2 4.2 4.2-4.2"/>' +
      '<path d="M4.2 16.2v2.4a1.8 1.8 0 0 0 1.8 1.8h12a1.8 1.8 0 0 0 1.8-1.8v-2.4"/>'
    ),

    trash: nav(
      '<path d="M4.4 7.2h15.2M9.4 7.2V5.5a1.5 1.5 0 0 1 1.5-1.5h2.2a1.5 1.5 0 0 1 1.5 1.5v1.7"/>' +
      '<path d="m6.5 7.2.9 11.5A1.6 1.6 0 0 0 9 20.2h6a1.6 1.6 0 0 0 1.6-1.5l.9-11.5"/>' +
      '<path d="M10.3 10.6v6M13.7 10.6v6" stroke-width="1.5"/>'
    ),

    copy: nav(
      '<rect x="8.4" y="8.4" width="11.8" height="11.8" rx="2.4"/>' +
      '<path d="M15.6 5.6a2.2 2.2 0 0 0-2.2-2.2H6a2.2 2.2 0 0 0-2.2 2.2v7.4A2.2 2.2 0 0 0 6 15.2"/>'
    ),

    cut: nav(
      '<circle cx="6.4" cy="17.8" r="2.8"/>' +
      '<circle cx="17.6" cy="17.8" r="2.8"/>' +
      '<path d="M8.6 16 18.4 3.4M15.4 16 5.6 3.4"/>'
    ),

    // Duplizieren: vorderes Blatt mit Plus, hinteres angedeutet.
    duplicate: nav(
      '<rect x="8.2" y="8.2" width="12" height="12" rx="2.4"/>' +
      '<path d="M14.2 11.4v5.6M11.4 14.2h5.6" stroke-width="1.5"/>' +
      '<path d="M15.8 5.4a2 2 0 0 0-2-2H5.8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>'
    ),

    palette: nav(
      '<path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.3 0 1.9-.85 1.9-1.8 0-.5-.25-.9-.55-1.25-.3-.35-.55-.7-.55-1.2 0-.95.75-1.7 1.7-1.7h1.6a4.5 4.5 0 0 0 4.5-4.5c0-3.75-3.85-6.75-8.6-6.75Z"/>' +
      '<circle cx="7.5" cy="12.1" r="1.2" ' + F + '/>' +
      '<circle cx="9.6" cy="7.9" r="1.2" ' + F + '/>' +
      '<circle cx="14.4" cy="7.4" r="1.2" ' + F + '/>' +
      '<circle cx="17.7" cy="10.6" r="1.2" ' + F + '/>'
    ),

    moon: nav('<path d="M20.2 14.4A8.6 8.6 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z"/>'),

    sun: nav(
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 3.4v2.2M12 18.4v2.2M3.4 12h2.2M18.4 12h2.2' +
      'M5.92 5.92 7.47 7.47M16.53 16.53l1.55 1.55M5.92 18.08l1.55-1.55M16.53 7.47l1.55-1.55" stroke-width="1.55"/>'
    ),

    info: nav(
      '<circle cx="12" cy="12" r="8.8"/>' +
      '<path d="M12 11.2v5.4"/>' +
      '<circle cx="12" cy="7.9" r="1.15" ' + F + '/>'
    ),

    lock: nav(
      '<rect x="4.6" y="10.2" width="14.8" height="10.4" rx="2.6"/>' +
      '<path d="M7.9 10.2V7.8a4.1 4.1 0 0 1 8.2 0v2.4"/>'
    ),

    // Vorlage: Blatt mit Kopfzeile und zwei Spalten.
    template: nav(
      '<rect x="4" y="3.4" width="16" height="17.2" rx="2.4"/>' +
      '<path d="M4 8.6h16M12 8.6v12" stroke-width="1.4"/>'
    ),

    /* ══ Werkzeuge (Reihenfolge der Leiste) ══════════════════════════════ */

    // Füllfederhalter, um -45° geneigt; die Feder trägt die aktive Farbe.
    pen: tool(
      '<g transform="rotate(-45 12 12)">' +
      '<path d="M9.5 5.75a2.5 2.5 0 0 1 5 0v5.6h-5Z" ' + F + '/>' +
      '<rect x="8.85" y="11.35" width="6.3" height="1.8" rx="0.8" ' + F + '/>' +
      '<path d="M9.2 13.15h5.6l-1.5 5.05-1.3 2.55-1.3-2.55-1.5-5.05Z" ' + TF + '/>' +
      '<path d="M12 15.6v3.6" stroke-width="1.1"/>' +
      '</g>'
    ),

    // Radierer: geneigter Quader mit massivem Unterteil über einer Fläche.
    eraser: tool(
      '<g transform="rotate(-25 12 11.5)">' +
      '<rect x="5.6" y="7.4" width="12.8" height="8.2" rx="2.1"/>' +
      '<path d="M5.6 11.9h12.8v1.6a2.1 2.1 0 0 1-2.1 2.1H7.7a2.1 2.1 0 0 1-2.1-2.1Z" ' + F + '/>' +
      '</g>' +
      '<path d="M4.4 20.2h15.2"/>'
    ),

    // Textmarker mit Keilspitze; Spitze und Strich in der aktiven Farbe.
    highlighter: tool(
      '<g transform="rotate(-38 12 10.35)">' +
      '<rect x="8.4" y="3" width="7.2" height="7.8" rx="1.8" ' + F + '/>' +
      '<rect x="7.7" y="10.8" width="8.6" height="2" rx="0.85" ' + F + '/>' +
      '<path d="M8.2 12.8h7.6l-.9 3.3-5.8 1.6Z" ' + TF + '/>' +
      '</g>' +
      '<path d="M4.2 20.4h9" ' + TS + ' stroke-width="2.8"/>'
    ),

    // Klebeband: diagonaler Streifen mit gezackten Enden.
    tape: tool(
      '<g transform="rotate(-30 12 12)">' +
      '<path d="' + TAPE_D + '" ' + TF + '/>' +
      '<path d="' + TAPE_D + '"/>' +
      '</g>'
    ),

    // Formen: Kreis über Quadrat, Kreis in der aktiven Farbe.
    shapes: tool(
      '<rect x="3.4" y="8.4" width="12.2" height="12.2" rx="2.4"/>' +
      '<circle cx="15.8" cy="8.2" r="4.8" ' + TS + '/>'
    ),

    // Lasso: gestrichelte Schlaufe mit Zipfel und Knoten.
    lasso: tool(
      '<ellipse cx="12" cy="9.6" rx="8" ry="5.4" ' + DASH + '/>' +
      '<path d="M6.6 13.9c-.5 2.4-.1 4.3 1.6 5.3" ' + DASH + '/>' +
      '<circle cx="9.4" cy="20.2" r="1.7"/>'
    ),

    // Text: großes T mit Serifenbalken.
    text: tool(
      '<path d="M5 6.6V5h14v1.6"/>' +
      '<path d="M12 5v14.2"/>' +
      '<path d="M8.8 19.2h6.4"/>'
    ),

    // Elemente: Stern in der aktiven Farbe plus zwei kleine Funken.
    elements: tool(
      '<path d="M9.8 5 11.68 9.81 16.84 10.11 12.84 13.39 14.15 18.39 9.8 15.6 5.45 18.39 6.76 13.39 2.76 10.11 7.92 9.81Z" ' + TF + '/>' +
      '<path d="' + sparkle(19, 6.8, 2.5) + '" ' + F + '/>' +
      '<path d="' + sparkle(18.6, 17, 2) + '" ' + F + '/>'
    ),

    image: tool(PHOTO),

    // Lineal: diagonal, mit abwechselnd langen und kurzen Maßstrichen.
    ruler: tool(
      '<g transform="rotate(-30 12 12)">' +
      '<rect x="3.8" y="9.4" width="16.4" height="5.2" rx="1.4"/>' +
      '<path d="M7 9.4v2.5M10.8 9.4v1.5M14.6 9.4v2.5M18.4 9.4v1.5" stroke-width="1.5"/>' +
      '</g>'
    ),

    // Laserpointer: leuchtender Punkt mit zwei abstrahlenden Bögen.
    laser: tool(
      '<circle cx="12" cy="12" r="3.4" ' + TF + '/>' +
      '<path d="M18.9 6.2a9 9 0 0 1 0 11.6"/>' +
      '<path d="M5.1 6.2a9 9 0 0 0 0 11.6"/>'
    ),

    /* ══ Werkzeugoptionen ════════════════════════════════════════════════ */

    // Radierer-Größen: spitz, normal, ganzer Strich.
    eraserPrecision: tool(
      '<g transform="rotate(-22 12 11.6)">' +
      '<path d="M12 5.6l3.3 8.8a1.8 1.8 0 0 1-1.7 2.4h-3.2a1.8 1.8 0 0 1-1.7-2.4Z"/>' +
      '</g>' +
      '<path d="M5.4 20.2h13.2"/>'
    ),
    eraserStandard: tool(
      '<g transform="rotate(-22 12 11.6)">' +
      '<rect x="6" y="7.2" width="12" height="8.8" rx="2.1"/>' +
      '<path d="M6 11.8h12v2a2.1 2.1 0 0 1-2.1 2.2H8.1A2.1 2.1 0 0 1 6 13.8Z" ' + F + '/>' +
      '</g>' +
      '<path d="M5.4 20.2h13.2"/>'
    ),
    eraserStroke: tool(
      '<path d="' + wave(13.4) + '"/>' +
      '<path d="m17.6 6.4-11.2 11.2"/>'
    ),

    straightLine: tool(
      '<path d="m6.6 17.4 10.8-10.8"/>' +
      '<circle cx="6.6" cy="17.4" r="1.7" ' + F + '/>' +
      '<circle cx="17.4" cy="6.6" r="1.7" ' + F + '/>'
    ),

    // Dahinter zeichnen: hinteres Rechteck massiv hervorgehoben.
    drawBehind: tool(
      '<rect x="3.6" y="3.6" width="11.4" height="11.4" rx="2.2" ' + F + '/>' +
      '<rect x="9" y="9" width="11.4" height="11.4" rx="2.2"/>'
    ),

    lassoFree: tool(
      '<path d="M12.2 4.2c4.6-.2 8 2.4 7.8 6.4-.2 4.8-3.6 9-8.4 9-4.4 0-7.8-3.4-7.6-8 .2-4.2 3-7.2 8.2-7.4Z" ' + DASH + '/>'
    ),
    lassoRect: tool('<rect x="3.9" y="4.9" width="16.2" height="14.2" rx="1.6" ' + DASH + '/>'),

    // Auswahlfilter
    filterInk: tool('<path d="' + wave(12) + '"/>'),
    filterImage: tool(PHOTO),
    filterText: tool('<path d="m5.4 19.2 6.6-14.4 6.6 14.4"/><path d="M8.1 14.4h7.8"/>'),
    filterShape: tool(
      '<circle cx="16.2" cy="7.8" r="4.2"/>' +
      '<path d="M8 11.4 13.6 20.6H2.4Z"/>'
    ),
    filterElement: tool('<path d="' + sparkle(12, 12, 8.6) + '" ' + F + '/>'),

    // Schriftschnitt — das B trägt bewusst mehr Gewicht, sonst liest es sich nicht „fett“.
    bold: tool('<path d="M8.4 4.9h4.4a3.5 3.5 0 0 1 0 7H8.4Z" stroke-width="2.1"/><path d="M8.4 11.9h5.2a3.6 3.6 0 0 1 0 7.2H8.4Z" stroke-width="2.1"/>'),
    italic: tool('<path d="M10.4 5.2h5.8M7.8 18.8h5.8M14.4 5.2l-2.8 13.6"/>'),
    underline: tool('<path d="M7.2 4.6v6.6a4.8 4.8 0 0 0 9.6 0V4.6"/><path d="M6.2 19.6h11.6"/>'),
    strike: tool(
      '<path d="M15.9 7.6a4 4 0 0 0-3.9-2.9c-2.3 0-4 1.3-4 3.2 0 3.9 8 2 8 6.1 0 2-1.8 3.4-4.1 3.4a4.1 4.1 0 0 1-4-2.9"/>' +
      '<path d="M4.4 11.1h15.2"/>'
    ),

    alignLeft: tool('<path d="M4.2 5.4h15.6M4.2 9.8h10.6M4.2 14.2h15.6M4.2 18.6h10.6"/>'),
    alignCenter: tool('<path d="M4.2 5.4h15.6M6.7 9.8h10.6M4.2 14.2h15.6M6.7 18.6h10.6"/>'),
    alignRight: tool('<path d="M4.2 5.4h15.6M9.2 9.8h10.6M4.2 14.2h15.6M9.2 18.6h10.6"/>'),
    alignJustify: tool('<path d="M4.2 5.4h15.6M4.2 9.8h15.6M4.2 14.2h15.6M4.2 18.6h15.6"/>'),

    // Zeilenabstand: Doppelpfeil neben Textzeilen.
    lineSpacing: tool(
      '<path d="M6.4 4.8v14.4"/>' +
      '<path d="m3.8 7.4 2.6-2.6 2.6 2.6M3.8 16.6l2.6 2.6 2.6-2.6"/>' +
      '<path d="M12.4 6.4h7.8M12.4 12h7.8M12.4 17.6h7.8" stroke-width="1.6"/>'
    ),

    boxStyle: tool(
      '<rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.6"/>' +
      '<path d="M9.2 15.8 12 8.6l2.8 7.2M10.2 13.9h3.6" stroke-width="1.5"/>'
    ),

    // Reißzwecke
    pin: tool(
      '<path d="M9 3.6h6l-.7 5.2 3 2.6v1.4H6.7v-1.4l3-2.6Z"/>' +
      '<path d="M12 12.8v7.4"/>'
    ),

    // Linienstile — kräftiger gesetzt, damit der Stil selbst erkennbar bleibt.
    lineSolid: tool('<path d="M3.8 12h16.4" stroke-width="2.2"/>'),
    lineDashed: tool('<path d="M3.8 12h16.4" stroke-width="2.2" stroke-dasharray="4.2 3.2"/>'),
    lineDotted: tool('<path d="M3.8 12h16.4" stroke-width="2.2" stroke-dasharray="0.1 3.7"/>'),

    rulerStraight: tool(
      '<rect x="2.8" y="8.4" width="18.4" height="7.2" rx="1.8"/>' +
      '<path d="M7.4 8.4v2.6M12 8.4v3.6M16.6 8.4v2.6" stroke-width="1.5"/>'
    ),
    rulerProtractor: tool(
      '<path d="M3.4 17.4a8.6 8.6 0 0 1 17.2 0Z"/>' +
      '<path d="M12 8.8v2.4M5.92 11.32l1.7 1.7M18.08 11.32l-1.7 1.7" stroke-width="1.5"/>'
    ),
    cornerRound: tool('<path d="M4.8 4.6v9.2a5.4 5.4 0 0 0 5.4 5.4h9.2"/>'),

    /* ══ Menüs / Sonstiges ═══════════════════════════════════════════════ */

    photo: nav(PHOTO),
    camera: nav(
      '<rect x="2.6" y="7.4" width="18.8" height="12.2" rx="2.6"/>' +
      '<path d="m8.2 7.4 1.3-2.1a1.5 1.5 0 0 1 1.3-.7h2.4a1.5 1.5 0 0 1 1.3.7l1.3 2.1"/>' +
      '<circle cx="12" cy="13.6" r="3.6"/>'
    ),
    scan: nav(
      '<path d="M3.4 8.4V5.8a2 2 0 0 1 2-2H8M16 3.8h2.6a2 2 0 0 1 2 2v2.6' +
      'M20.6 15.6v2.6a2 2 0 0 1-2 2H16M8 20.2H5.4a2 2 0 0 1-2-2v-2.6"/>' +
      '<path d="M8.2 10.4h7.6M8.2 13.6h5.4" stroke-width="1.5"/>'
    ),
    file: nav(
      '<path d="M7 3.2h5.9l5.7 5.7V19a1.9 1.9 0 0 1-1.9 1.9H7A1.9 1.9 0 0 1 5.1 19V5.1A1.9 1.9 0 0 1 7 3.2Z"/>' +
      '<path d="M12.9 3.2v5.7h5.7"/>'
    ),
    mic: nav(
      '<rect x="9" y="2.8" width="6" height="11.2" rx="3"/>' +
      '<path d="M5.6 11.6v1.2a6.4 6.4 0 0 0 12.8 0v-1.2"/>' +
      '<path d="M12 19.2v2M8.8 21.2h6.4"/>'
    ),
    comment: nav(
      '<path d="M18 3.4a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2h-6.3l-4.3 3.7v-3.7H6a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2Z"/>'
    ),
    // Anpassen: drei Schieberegler mit Lücken um die Griffe.
    customize: nav(
      '<path d="M3.6 7h3.7M11.9 7h8.5M3.6 12h9.1M17.3 12h3.1M3.6 17h5.3M13.5 17h6.9"/>' +
      '<circle cx="9.6" cy="7" r="1.85" stroke-width="1.5"/>' +
      '<circle cx="15" cy="12" r="1.85" stroke-width="1.5"/>' +
      '<circle cx="11.2" cy="17" r="1.85" stroke-width="1.5"/>'
    ),
    star: nav(
      '<path d="M12 3.4 14.29 9.24 20.56 9.62 15.71 13.61 17.29 19.68 12 16.3 6.71 19.68 8.29 13.61 3.44 9.62 9.71 9.24Z" ' + F + '/>'
    ),

    // Papierraster
    grid: nav(SHEET + '<path d="M9.5 3.2v17.6M14.5 3.2v17.6M4.4 9.1h15.2M4.4 14.9h15.2" stroke-width="1.3"/>'),
    dots: nav(
      SHEET +
      '<circle cx="8.2" cy="8" r="1" ' + F + '/><circle cx="12" cy="8" r="1" ' + F + '/><circle cx="15.8" cy="8" r="1" ' + F + '/>' +
      '<circle cx="8.2" cy="12" r="1" ' + F + '/><circle cx="12" cy="12" r="1" ' + F + '/><circle cx="15.8" cy="12" r="1" ' + F + '/>' +
      '<circle cx="8.2" cy="16" r="1" ' + F + '/><circle cx="12" cy="16" r="1" ' + F + '/><circle cx="15.8" cy="16" r="1" ' + F + '/>'
    ),
    lines: nav(SHEET + '<path d="M7.6 8.4h8.8M7.6 12h8.8M7.6 15.6h8.8" stroke-width="1.5"/>'),
    blank: nav(SHEET),

    // Papierfarben: gleiches Feld, Helligkeit über die Füllung gestaffelt.
    paperWhite: nav('<rect ' + SWATCH + '/>'),
    paperCream: nav('<rect ' + SWATCH + ' fill="currentColor" fill-opacity=".28"/>'),
    paperDark: nav('<rect ' + SWATCH + ' fill="currentColor"/>'),
  };

  /* Alt-Namen aus früheren Fassungen — verweisen bewusst auf dieselben Glyphen,
   * damit bestehende Aufrufer nicht brechen. */
  icons.thumbnails = icons.library;
  icons.editMode = icons.viewEdit;
  icons.readMode = icons.viewRead;
  icons.straight = icons.straightLine;
  icons.strokeDelete = icons.trash;

  /* Zwei Werkzeuge außerhalb der Spezifikationsliste, die die Leiste weiterhin
   * anfordert. */
  icons.zoom = tool(
    '<circle cx="10.9" cy="10.9" r="6.3"/>' +
    '<path d="m15.5 15.5 4.3 4.3"/>' +
    '<path d="M10.9 8.2v5.4M8.2 10.9h5.4" stroke-width="1.5"/>'
  );
  icons.hand = tool(
    '<path d="M8.4 11.2V5.9a1.65 1.65 0 1 1 3.3 0v4.6M11.7 10.5V4.7a1.65 1.65 0 1 1 3.3 0v5.8' +
    'M15 10.9V6.8a1.65 1.65 0 1 1 3.3 0v7.8c0 3.4-2.4 5.8-5.8 5.8h-1.1c-2 0-3.3-.8-4.3-2.4l-2.6-4.3' +
    'a1.6 1.6 0 0 1 2.5-2l1.4 1.6"/>'
  );

  GN.icons = icons;

  /** Ersetzt alle `[data-icon]`-Platzhalter in `root` durch das SVG (idempotent). */
  GN.hydrateIcons = function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      if (el.dataset.iconRendered === name) return;
      const markup = icons[name];
      if (!markup) return;
      el.innerHTML = markup;
      el.dataset.iconRendered = name;
    });
  };

  /** Rohes SVG-Markup für dynamisch gebaute Knoten. */
  GN.icon = (name) => icons[name] || '';
})(window);
