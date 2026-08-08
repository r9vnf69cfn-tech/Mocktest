/* ============================================================================
 * tools.js — Werkzeugkatalog, Einstellungen und Zeigerinteraktion
 *
 * Der Controller kümmert sich um Zeigererfassung, Navigation (Zwei-Finger-
 * Geste, Leertaste, mittlere Maustaste), Druckermittlung und die Sticky-Regel:
 * nicht klebende Werkzeuge springen nach ihrer Aktion zurück aufs Lasso.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const geo = GN.geo;
  const M = GN.model;

  /* ── Katalog (Reihenfolge = Reihenfolge in der Leiste) ───────────────── */

  const TOOLS = [
    { id: 'pen', label: 'Stift', icon: 'pen', keys: ['1', 'p'], sticky: true, tinted: true },
    { id: 'eraser', label: 'Radierer', icon: 'eraser', keys: ['2', 'e'], sticky: true },
    { id: 'highlighter', label: 'Textmarker', icon: 'highlighter', keys: ['3', 'h'], sticky: true, tinted: true },
    { id: 'tape', label: 'Klebeband', icon: 'tape', keys: ['4'], sticky: true, tinted: true },
    { id: 'shapes', label: 'Formen', icon: 'shapes', keys: ['5', 's'], sticky: false, tinted: true },
    { id: 'lasso', label: 'Lasso', icon: 'lasso', keys: ['6', 'l'], sticky: true },
    { id: 'text', label: 'Text', icon: 'text', keys: ['7', 't'], sticky: false },
    { id: 'elements', label: 'Elemente', icon: 'elements', keys: ['8'], sticky: false, tinted: true },
    { id: 'image', label: 'Bild & Kamera', icon: 'image', keys: ['9'], sticky: false },
    { id: 'ruler', label: 'Lineal', icon: 'ruler', keys: ['0'], toggle: true },
    { id: 'laser', label: 'Laserpointer', icon: 'laser', keys: ['\\'], sticky: true, tinted: true },
  ];

  const PEN_TYPES = [
    { id: 'fountain', label: 'Füller', hint: 'Druckempfindlich, schwellender Strich' },
    { id: 'ball', label: 'Kugelschreiber', hint: 'Gleichmäßige Breite' },
    { id: 'brush', label: 'Pinsel', hint: 'Starke Dynamik, spitze Enden' },
    { id: 'pencil', label: 'Bleistift', hint: 'Körnige Textur' },
  ];

  const ERASER_TYPES = [
    { id: 'precision', label: 'Präzision', icon: 'eraserPrecision', hint: 'Löscht exakt unter der Spitze' },
    { id: 'standard', label: 'Standard', icon: 'eraserStandard', hint: 'Löscht Teilstücke' },
    { id: 'stroke', label: 'Strich', icon: 'eraserStroke', hint: 'Löscht ganze Striche' },
  ];

  const TAPE_PATTERNS = [
    { id: 'plain', label: 'Einfarbig' },
    { id: 'stripes', label: 'Streifen' },
    { id: 'dots', label: 'Punkte' },
    { id: 'grid', label: 'Karo' },
    { id: 'torn', label: 'Gerissen' },
  ];

  const LASSO_FILTERS = [
    { id: 'ink', label: 'Handschrift', icon: 'filterInk' },
    { id: 'image', label: 'Bilder', icon: 'filterImage' },
    { id: 'text', label: 'Text', icon: 'filterText' },
    { id: 'shape', label: 'Formen', icon: 'filterShape' },
    { id: 'element', label: 'Elemente', icon: 'filterElement' },
  ];

  const FONT_CHOICES = [
    { id: 'system', label: 'SF Pro', group: 'Serifenlos' },
    { id: 'helvetica', label: 'Helvetica Neue', group: 'Serifenlos' },
    { id: 'avenir', label: 'Avenir Next', group: 'Serifenlos' },
    { id: 'futura', label: 'Futura', group: 'Serifenlos' },
    { id: 'rounded', label: 'SF Pro Rounded', group: 'Serifenlos' },
    { id: 'newyork', label: 'New York', group: 'Serifen' },
    { id: 'georgia', label: 'Georgia', group: 'Serifen' },
    { id: 'palatino', label: 'Palatino', group: 'Serifen' },
    { id: 'sfmono', label: 'SF Mono', group: 'Feste Breite' },
    { id: 'menlo', label: 'Menlo', group: 'Feste Breite' },
    { id: 'markerfelt', label: 'Marker Felt', group: 'Handschrift' },
    { id: 'bradley', label: 'Bradley Hand', group: 'Handschrift' },
    { id: 'noteworthy', label: 'Noteworthy', group: 'Handschrift' },
    { id: 'chalkboard', label: 'Chalkboard', group: 'Handschrift' },
  ];

  const BOX_STYLES = [
    { id: 'none', label: 'Ohne' },
    { id: 'border', label: 'Rahmen' },
    { id: 'filled', label: 'Gefüllt' },
    { id: 'sticky', label: 'Haftnotiz' },
    { id: 'callout', label: 'Sprechblase' },
  ];

  const LINE_SPACINGS = [0.9, 1.0, 1.15, 1.35, 1.6, 2.0];

  const STICKERS = [
    '⭐️', '✅', '❗️', '❤️', '🔥', '💡', '📌', '🎯', '👍', '🙌', '🚀', '🧠',
    '📎', '🔖', '⏰', '🎉', '😀', '🤔', '😴', '🥳', '☕️', '🌱', '📈', '🧩',
    '🔑', '🗓', '📝', '🏁', '⚡️', '🌈', '🍀', '🎁', '🔔', '🧭', '🛠', '🧪',
  ];

  function defaultSettings() {
    return {
      pen: {
        type: 'fountain',
        color: '#000000',
        presets: [2.4, 4.0, 6.4],
        preset: 1,
        favorites: ['#000000', '#FF3B30', '#007AFF'],
        pressure: true,
        straight: false,
        smoothing: 0.55,
      },
      eraser: {
        type: 'standard',
        presets: [6, 12, 24],
        preset: 1,
        highlighterOnly: false,
        eraseImages: false,
      },
      highlighter: {
        color: '#FFF200',
        presets: [12, 20, 32],
        preset: 1,
        favorites: ['#FFF200', '#8CE99A', '#74C0FC'],
        straight: false,
        behind: false,
      },
      tape: {
        pattern: 'plain',
        color: '#F5F0E4',
        favorites: ['#F5F0E4', '#FFD8A8', '#D0EBFF'],
        width: 40,
        opacity: 1,
      },
      shapes: {
        color: '#000000',
        favorites: ['#000000', '#FF3B30', '#007AFF'],
        presets: [2, 4, 7],
        preset: 1,
        lineStyle: 'solid',
        fill: false,
        fillColor: '#00A99D',
        fillOpacity: 0.25,
        rounded: false,
        recognize: 'immediate',   // immediate | hold | off
        snapGrid: false,
      },
      lasso: {
        type: 'free',
        filters: { ink: true, image: true, text: true, shape: true, element: true },
      },
      text: {
        fontFamily: 'system',
        fontSize: 17,
        color: '#000000',
        favorites: ['#000000', '#FF3B30', '#007AFF'],
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        align: 'left',
        lineSpacing: 1.35,
        boxStyle: 'none',
        pinned: false,
      },
      elements: { glyph: '⭐️', size: 64 },
      image: {},
      ruler: { visible: false, type: 'straight', angle: 0, snap: true, x: 0, y: 0, length: 520 },
      laser: { color: '#FF3B30', trail: 'fade', favorites: ['#FF3B30', '#00A99D', '#FFCC00'] },
    };
  }

  /* ── Controller ──────────────────────────────────────────────────────── */

  class ToolController {
    constructor(app) {
      this.app = app;
      this.renderer = app.renderer;
      this.settings = defaultSettings();
      this.active = 'pen';
      this.lastSticky = 'pen';
      this.session = null;
      this.pointers = new Map();
      this.pinch = null;
      this.spaceDown = false;
      this.selection = null;

      // Handballenerkennung: sobald ein Stift benutzt wurde, verschiebt der
      // Finger nur noch die Fläche — genau wie in GoodNotes.
      this.penSeen = false;
      this.lastPenAt = 0;
      this.eraserOverride = null;
    }

    /** Entscheidet, ob dieser Zeiger zeichnen darf oder navigiert. */
    shouldDraw(e) {
      if (e.pointerType === 'pen') {
        this.penSeen = true;
        this.lastPenAt = e.timeStamp;
        return true;
      }
      if (e.pointerType === 'mouse') return e.button === 0;
      // Touch: innerhalb des Nachlauffensters nach Stiftkontakt nicht zeichnen
      if (this.penSeen && e.timeStamp - this.lastPenAt < 700) return false;
      return !this.penSeen;
    }

    get board() {
      return this.app.board;
    }

    get s() {
      return this.settings[this.active] || {};
    }

    setTool(id, silent) {
      const def = TOOLS.find((t) => t.id === id);
      if (!def || def.toggle) return;
      if (this.active === id) return;
      this.cancel();
      if (id !== 'lasso') this.clearSelection();
      this.active = id;
      if (def.sticky) this.lastSticky = id;
      if (!silent) this.app.onToolChanged();
    }

    /** Nach der Aktion eines nicht klebenden Werkzeugs zurück aufs Lasso. */
    finishNonSticky() {
      const def = TOOLS.find((t) => t.id === this.active);
      if (def && !def.sticky && !def.toggle) {
        if (this.active === 'text' && this.settings.text.pinned) return;
        this.setTool('lasso');
      }
    }

    tintColor(toolId) {
      const set = this.settings[toolId || this.active];
      return (set && set.color) || '#000000';
    }

    clearSelection() {
      this.selection = null;
      this.renderer.selection = null;
      this.renderer.hiddenIds = null;
      this.app.updateSelectionUI();
      this.renderer.invalidate();
    }

    select(ids) {
      if (!ids || !ids.size) {
        this.clearSelection();
        return;
      }
      this.selection = { ids, box: boxOfIds(this.board, ids) };
      this.renderer.selection = { ids, box: this.selection.box };
      this.app.updateSelectionUI();
      this.renderer.invalidate();
    }

    /* ── Zeiger ───────────────────────────────────────────────────────── */

    onPointerDown(e) {
      const canvas = this.renderer.canvas;
      this.pointers.set(e.pointerId, screenPoint(e, canvas));

      if (this.pointers.size === 2) {
        this.cancel();
        const [a, b] = [...this.pointers.values()];
        this.pinch = {
          d0: geo.dist(a.sx, a.sy, b.sx, b.sy) || 1,
          c0: { x: (a.sx + b.sx) / 2, y: (a.sy + b.sy) / 2 },
          scale0: this.renderer.cam.scale,
        };
        return;
      }
      if (this.pointers.size > 2) return;
      if (e.button === 2) return;

      const navigate = this.spaceDown || e.button === 1 || this.app.mode === 'read' || !this.shouldDraw(e);
      if (navigate) {
        this.session = { type: 'pan', lastX: e.clientX, lastY: e.clientY };
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Radiererende des Stifts aufgesetzt → vorübergehend radieren
      if (e.pointerType === 'pen' && (e.buttons & 32) && this.active !== 'eraser') {
        this.eraserOverride = this.active;
        this.setTool('eraser');
      }

      canvas.setPointerCapture(e.pointerId);
      const p = this.worldPoint(e);
      const h = HANDLERS[this.active];
      if (h && h.down) h.down.call(this, p, e);
    }

    onPointerMove(e) {
      const canvas = this.renderer.canvas;
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, screenPoint(e, canvas));

      if (this.pinch && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = geo.dist(a.sx, a.sy, b.sx, b.sy) || 1;
        const c = { x: (a.sx + b.sx) / 2, y: (a.sy + b.sy) / 2 };
        this.renderer.zoomAt(this.pinch.c0.x, this.pinch.c0.y, this.pinch.scale0 * (d / this.pinch.d0));
        this.renderer.panBy(c.x - this.pinch.c0.x, c.y - this.pinch.c0.y);
        this.pinch = { d0: d, c0: c, scale0: this.renderer.cam.scale };
        this.app.onCameraChanged();
        return;
      }

      if (this.session && this.session.type === 'pan') {
        this.renderer.panBy(e.clientX - this.session.lastX, e.clientY - this.session.lastY);
        this.session.lastX = e.clientX;
        this.session.lastY = e.clientY;
        this.app.onCameraChanged();
        return;
      }

      const h = HANDLERS[this.active];
      if (!this.session) {
        if (h && h.hover) h.hover.call(this, this.worldPoint(e), e);
        return;
      }
      if (h && h.move) {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
        if (evs && evs.length) {
          for (const ev of evs) h.move.call(this, this.worldPoint(ev, e), ev);
        } else {
          h.move.call(this, this.worldPoint(e), e);
        }
      }
    }

    onPointerUp(e) {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;

      const canvas = this.renderer.canvas;
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

      if (this.session && this.session.type === 'pan') {
        this.session = null;
        this.restoreFromEraserOverride();
        return;
      }
      if (!this.session) {
        this.restoreFromEraserOverride();
        return;
      }

      const h = HANDLERS[this.active];
      if (h && h.up) h.up.call(this, this.worldPoint(e), e);
      this.session = null;
      this.restoreFromEraserOverride();
    }

    cancel() {
      this.restoreFromEraserOverride();
      if (!this.session) return;
      const h = HANDLERS[this.active];
      if (h && h.cancel) h.cancel.call(this);
      this.session = null;
      this.renderer.live = null;
      this.renderer.lasso = null;
      this.renderer.marquee = null;
      this.renderer.invalidate();
    }

    /** Schaltet nach dem Radiererende des Stifts zurück aufs vorige Werkzeug. */
    restoreFromEraserOverride() {
      if (!this.eraserOverride) return;
      const back = this.eraserOverride;
      this.eraserOverride = null;
      this.setTool(back);
    }

    /* ── Hilfen ───────────────────────────────────────────────────────── */

    worldPoint(e, ref) {
      const rect = this.renderer.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const w = this.renderer.toWorld(sx, sy);
      w.sx = sx;
      w.sy = sy;
      w.pressure = e.pressure !== undefined ? e.pressure : (ref && ref.pressure) || 0;
      w.pointerType = (ref || e).pointerType;
      return w;
    }

    /** Radiergummi-Radius in Weltkoordinaten (Größe ist in Bildschirm-px definiert). */
    eraserRadius() {
      const s = this.settings.eraser;
      return s.presets[s.preset] / this.renderer.cam.scale;
    }

    penWidth() {
      const s = this.settings.pen;
      return s.presets[s.preset];
    }
    highlighterWidth() {
      const s = this.settings.highlighter;
      return s.presets[s.preset];
    }
    shapeWidth() {
      const s = this.settings.shapes;
      return s.presets[s.preset];
    }

    /** Projiziert einen Punkt auf die Linealkante, wenn er nah genug liegt. */
    snapToRuler(p) {
      const r = this.settings.ruler;
      if (!r.visible || !r.snap || r.type !== 'straight') return p;
      const a = (r.angle * Math.PI) / 180;
      const dirx = Math.cos(a);
      const diry = Math.sin(a);
      // Obere Kante des Lineals (halbe Höhe 31 px im Bildschirmraum)
      const off = 31 / this.renderer.cam.scale;
      const ox = r.x + Math.sin(a) * off;
      const oy = r.y - Math.cos(a) * off;
      const t = (p.x - ox) * dirx + (p.y - oy) * diry;
      const projX = ox + dirx * t;
      const projY = oy + diry * t;
      const d = geo.dist(p.x, p.y, projX, projY);
      if (d > 12 / this.renderer.cam.scale) return p;
      return { ...p, x: projX, y: projY };
    }
  }

  /* ── Strichlogik (Stift, Textmarker, Formen-Rohzug) ──────────────────── */

  function beginStroke(kind, p) {
    const isHl = kind === 'highlighter';
    const isShape = kind === 'shapes';
    const set = this.settings[kind];
    const width = isHl ? this.highlighterWidth() : isShape ? this.shapeWidth() : this.penWidth();
    const smoothing = isHl ? 0.65 : isShape ? 0.4 : this.settings.pen.smoothing;
    const start = this.snapToRuler(p);
    const smoother = geo.makeSmoother(smoothing);
    const sp = smoother(start.x, start.y);
    const press = initialPressure(this, kind, p);

    this.session = {
      type: 'stroke',
      kind,
      tool: isHl ? 'highlighter' : 'pen',
      pen: isHl ? 'ball' : isShape ? 'ball' : set.type,
      color: set.color,
      width,
      behind: isHl ? set.behind : false,
      points: [{ x: sp.x, y: sp.y, p: press }],
      raw: [{ x: start.x, y: start.y, t: performance.now() }],
      smoother,
      lastPressure: press,
      lastMoveAt: performance.now(),
      straight: (isHl && set.straight) || (kind === 'pen' && set.straight),
    };
    updateLive.call(this);
  }

  function initialPressure(ctrl, kind, p) {
    if (kind === 'highlighter' || kind === 'shapes') return 1;
    const set = ctrl.settings.pen;
    if (!set.pressure) return 0.62;
    if (p.pointerType === 'pen' && p.pressure > 0) return geo.clamp(p.pressure * 1.4, 0.12, 1);
    return 0.55;
  }

  function extendStroke(p) {
    const s = this.session;
    if (!s || s.type !== 'stroke') return;

    const snapped = this.snapToRuler(p);
    const now = performance.now();
    const prev = s.raw[s.raw.length - 1];
    const dt = Math.max(now - prev.t, 1);
    const d = geo.dist(prev.x, prev.y, snapped.x, snapped.y);
    if (d < 0.35 / this.renderer.cam.scale && s.points.length > 1) return;

    let pressure;
    if (s.kind === 'highlighter' || s.kind === 'shapes') {
      pressure = 1;
    } else if (!this.settings.pen.pressure) {
      pressure = 0.62;
    } else if (p.pointerType === 'pen' && p.pressure > 0) {
      pressure = geo.clamp(p.pressure * 1.4, 0.12, 1);
    } else {
      // Maus/Finger: Breite aus Geschwindigkeit — schnell = dünn
      const speed = (d / dt) * 1000 * this.renderer.cam.scale;
      const target = geo.clamp(1 - speed / 2400, 0.22, 1);
      pressure = s.lastPressure + (target - s.lastPressure) * 0.18;
    }

    s.lastPressure = pressure;
    s.lastMoveAt = now;
    s.raw.push({ x: snapped.x, y: snapped.y, t: now });
    const sp = s.smoother(snapped.x, snapped.y);
    s.points.push({ x: sp.x, y: sp.y, p: pressure });
    updateLive.call(this);
  }

  function livePoints(s) {
    if (s.straight && s.points.length > 1) {
      return [{ ...s.points[0], p: 1 }, { ...s.points[s.points.length - 1], p: 1 }];
    }
    return s.points;
  }

  function updateLive() {
    const s = this.session;
    if (!s) return;
    this.renderer.live = M.create.stroke({
      tool: s.tool,
      pen: s.pen,
      color: s.color,
      width: s.width,
      behind: s.behind,
      points: livePoints(s),
    });
    this.renderer.requestFrame();
  }

  function finalizePoints(ctrl, s) {
    let points = livePoints(s);
    // Wird der Zeiger am Ende ruhig gehalten, begradigt GoodNotes den Strich.
    if (!s.straight && s.points.length > 3 && performance.now() - s.lastMoveAt > 650) {
      points = [{ ...s.points[0], p: 1 }, { ...s.points[s.points.length - 1], p: 1 }];
    } else if (points.length > 4) {
      const simplified = geo.simplify(points, 0.35 / ctrl.renderer.cam.scale);
      if (simplified.length >= 2) points = simplified;
    }
    if (points.length === 1) points = [points[0], { ...points[0], x: points[0].x + 0.01 }];
    return points;
  }

  /* ── Radierer ────────────────────────────────────────────────────────── */

  function eraseAt(x, y) {
    const set = this.settings.eraser;
    const radius = this.eraserRadius();
    const probe = { x0: x - radius, y0: y - radius, x1: x + radius, y1: y + radius };
    const next = [];
    let changed = false;

    for (const it of this.board.items) {
      if (!geo.boxesOverlap(it.bbox, probe)) {
        next.push(it);
        continue;
      }
      if (set.highlighterOnly && !(it.kind === 'stroke' && it.tool === 'highlighter')) {
        next.push(it);
        continue;
      }
      if (it.kind === 'image' && !set.eraseImages) {
        next.push(it);
        continue;
      }

      if (it.kind !== 'stroke') {
        if (hitsBox(it.bbox, x, y, radius)) changed = true;
        else next.push(it);
        continue;
      }

      if (!strokeHit(it, x, y, radius)) {
        next.push(it);
        continue;
      }
      if (set.type === 'stroke') {                               // ganzen Strich entfernen
        changed = true;
        continue;
      }
      const cut = set.type === 'precision' ? radius * 0.55 : radius;
      const result = splitStroke(it, x, y, cut);
      // Nur als Änderung werten, wenn wirklich etwas weggenommen wurde —
      // sonst bliebe bei jedem Vorbeistreichen ein leerer Verlaufsschritt übrig.
      if (!result.removed) {
        next.push(it);
        continue;
      }
      changed = true;
      for (const piece of result.pieces) next.push(piece);
    }

    if (changed) {
      this.board.stage(next);
      this.renderer.invalidate();
      this.session.touched = true;
    }
  }

  function hitsBox(box, x, y, r) {
    const cx = geo.clamp(x, box.x0, box.x1);
    const cy = geo.clamp(y, box.y0, box.y1);
    return geo.dist2(x, y, cx, cy) <= r * r;
  }

  function strokeHit(stroke, x, y, r) {
    const rr = (r + stroke.width / 2) ** 2;
    const pts = stroke.points;
    if (pts.length === 1) return geo.dist2(x, y, pts[0].x, pts[0].y) <= rr;
    for (let i = 0; i < pts.length - 1; i++) {
      const { d2 } = geo.pointSegmentDist2(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      if (d2 <= rr) return true;
    }
    return false;
  }

  /**
   * Zerlegt einen Strich in die Teile außerhalb des Radierkreises.
   * Vorher wird nachverdichtet, damit auch lange gerade Segmente an der
   * richtigen Stelle getrennt werden und nicht nur an ihren Stützpunkten.
   */
  function splitStroke(stroke, x, y, r) {
    const rr = (r + stroke.width / 2) ** 2;
    const points = geo.densify(stroke.points, Math.max(r / 3, 0.5));
    const runs = [];
    let run = [];
    let removed = 0;

    for (const pt of points) {
      if (geo.dist2(x, y, pt.x, pt.y) <= rr) {
        removed++;
        if (run.length > 1) runs.push(run);
        run = [];
      } else {
        run.push(pt);
      }
    }
    if (run.length > 1) runs.push(run);
    if (!removed) return { removed: 0, pieces: [stroke] };

    // Die Verdichtung war nur Mittel zum Zweck — die Teilstücke werden wieder
    // ausgedünnt, damit die Punktzahl nicht mit jedem Radierzug wächst.
    const tol = Math.min(r / 6, 0.4);
    const pieces = runs.map((pts) =>
      M.create.stroke({
        tool: stroke.tool,
        pen: stroke.pen,
        color: stroke.color,
        width: stroke.width,
        behind: stroke.behind,
        points: pts.length > 4 ? geo.simplify(pts, tol) : pts,
      })
    );
    return { removed, pieces };
  }

  /* ── Auswahl-Hilfen ──────────────────────────────────────────────────── */

  function boxOfIds(board, ids) {
    let box = null;
    for (const id of ids) {
      const it = board.byId(id);
      if (it) box = geo.unionBox(box, it.bbox);
    }
    return box;
  }

  function handleAt(ctrl, p) {
    if (!ctrl.selection || !ctrl.selection.box) return null;
    const b = ctrl.selection.box;
    const a = ctrl.renderer.toScreen(b.x0, b.y0);
    const c = ctrl.renderer.toScreen(b.x1, b.y1);
    const corners = [
      { id: 'nw', x: a.x - 6, y: a.y - 6 },
      { id: 'ne', x: c.x + 6, y: a.y - 6 },
      { id: 'sw', x: a.x - 6, y: c.y + 6 },
      { id: 'se', x: c.x + 6, y: c.y + 6 },
    ];
    for (const h of corners) if (geo.dist2(p.sx, p.sy, h.x, h.y) <= 196) return h.id;
    return null;
  }

  function selectInPolygon(ctrl, poly) {
    const filters = ctrl.settings.lasso.filters;
    const polyBox = geo.boxFromPoints(poly, 0);
    const ids = new Set();
    for (const it of ctrl.board.items) {
      if (!filters[M.categoryOf(it)]) continue;
      if (!geo.boxesOverlap(it.bbox, polyBox)) continue;
      if (it.kind === 'stroke') {
        // GoodNotes-Kriterium: Mehrheit der Punkte innerhalb (Schwelle 0.6)
        let inside = 0;
        for (const pt of it.points) if (geo.pointInPolygon(pt.x, pt.y, poly)) inside++;
        if (inside / it.points.length >= 0.6) ids.add(it.id);
      } else {
        const corners = [
          { x: it.bbox.x0, y: it.bbox.y0 },
          { x: it.bbox.x1, y: it.bbox.y0 },
          { x: it.bbox.x1, y: it.bbox.y1 },
          { x: it.bbox.x0, y: it.bbox.y1 },
        ];
        let inside = 0;
        for (const c of corners) if (geo.pointInPolygon(c.x, c.y, poly)) inside++;
        if (inside >= 3) ids.add(it.id);
      }
    }
    return ids;
  }

  const applyMap = (items, map) =>
    items.map((it) => (Object.prototype.hasOwnProperty.call(map, it.id) ? map[it.id] : it));

  const shiftBox = (b, dx, dy) => (b ? { x0: b.x0 + dx, y0: b.y0 + dy, x1: b.x1 + dx, y1: b.y1 + dy } : b);

  const scaleBox = (b, anchor, sx, sy) => ({
    x0: anchor.x + (b.x0 - anchor.x) * sx,
    y0: anchor.y + (b.y0 - anchor.y) * sy,
    x1: anchor.x + (b.x1 - anchor.x) * sx,
    y1: anchor.y + (b.y1 - anchor.y) * sy,
  });

  function topItemAt(board, x, y, kinds) {
    for (let i = board.items.length - 1; i >= 0; i--) {
      const it = board.items[i];
      if (kinds && kinds.indexOf(it.kind) === -1) continue;
      if (geo.boxContainsPoint(it.bbox, x, y)) return it;
    }
    return null;
  }

  function screenPoint(e, canvas) {
    const r = canvas.getBoundingClientRect();
    return { id: e.pointerId, sx: e.clientX - r.left, sy: e.clientY - r.top };
  }

  /* ── Handler ─────────────────────────────────────────────────────────── */

  const strokeHandler = (kind) => ({
    down(p) { beginStroke.call(this, kind, p); },
    move(p) { extendStroke.call(this, p); },
    up() {
      const s = this.session;
      this.renderer.live = null;
      if (!s || s.type !== 'stroke') return;
      const points = finalizePoints(this, s);
      this.board.add(
        M.create.stroke({ tool: s.tool, pen: s.pen, color: s.color, width: s.width, behind: s.behind, points }),
        s.tool === 'highlighter' ? 'Textmarker' : 'Strich'
      );
    },
    cancel() { this.renderer.live = null; },
  });

  const HANDLERS = {
    pen: strokeHandler('pen'),
    highlighter: strokeHandler('highlighter'),

    eraser: {
      down(p) {
        this.session = { type: 'erase', touched: false, before: this.board.items };
        this.renderer.eraserCursor = { x: p.x, y: p.y, r: this.eraserRadius() };
        eraseAt.call(this, p.x, p.y);
      },
      move(p) {
        this.renderer.eraserCursor = { x: p.x, y: p.y, r: this.eraserRadius() };
        eraseAt.call(this, p.x, p.y);
        this.renderer.requestFrame();
      },
      hover(p) {
        this.renderer.eraserCursor = { x: p.x, y: p.y, r: this.eraserRadius() };
        this.renderer.requestFrame();
      },
      up() {
        const s = this.session;
        if (s && s.touched) {
          const finalItems = this.board.items;
          this.board.items = s.before;
          this.board.commit(finalItems, 'Radieren');
        }
      },
      cancel() {
        const s = this.session;
        if (s && s.touched) {
          this.board.stage(s.before);
          this.renderer.invalidate();
        }
      },
    },

    tape: {
      down(p) {
        this.session = { type: 'tape', from: { x: p.x, y: p.y }, to: { x: p.x, y: p.y } };
      },
      move(p, e) {
        const s = this.session;
        if (!s) return;
        let to = { x: p.x, y: p.y };
        if (e.shiftKey) to = geo.snapAngle(s.from.x, s.from.y, to.x, to.y, 15);
        s.to = to;
        const set = this.settings.tape;
        this.renderer.live = M.create.tape({
          from: s.from, to: s.to, width: set.width, color: set.color, pattern: set.pattern, opacity: set.opacity,
        });
        this.renderer.requestFrame();
      },
      up() {
        const s = this.session;
        this.renderer.live = null;
        if (!s) return;
        if (geo.dist(s.from.x, s.from.y, s.to.x, s.to.y) < 6) return;
        const set = this.settings.tape;
        this.board.add(
          M.create.tape({ from: s.from, to: s.to, width: set.width, color: set.color, pattern: set.pattern, opacity: set.opacity }),
          'Klebeband'
        );
      },
      cancel() { this.renderer.live = null; },
    },

    shapes: {
      down(p) { beginStroke.call(this, 'shapes', p); },
      move(p) { extendStroke.call(this, p); },
      up(p, e) {
        const s = this.session;
        this.renderer.live = null;
        if (!s || s.type !== 'stroke') return;
        const set = this.settings.shapes;
        const raw = s.raw.map((r) => ({ x: r.x, y: r.y }));

        // Erkennungsmodus: sofort, erst nach kurzem Stillhalten, oder gar nicht
        const held = performance.now() - s.lastMoveAt > 350;
        const wants = set.recognize === 'immediate' || (set.recognize === 'hold' && held);
        const recognized = wants && GN.shapes && GN.shapes.recognize
          ? GN.shapes.recognize(raw, { snapAngles: !e || !e.altKey })
          : null;
        if (recognized && set.snapGrid) snapShapeToGrid(recognized, 20);

        if (recognized) {
          this.board.add(
            M.create.shape({
              shape: recognized.kind,
              color: set.color,
              width: set.presets[set.preset],
              lineStyle: set.lineStyle,
              fill: set.fill ? set.fillColor : null,
              fillOpacity: set.fillOpacity,
              rounded: set.rounded,
              from: recognized.from,
              to: recognized.to,
              vertices: recognized.vertices,
              cx: recognized.cx, cy: recognized.cy,
              rx: recognized.rx, ry: recognized.ry,
              rotation: recognized.rotation,
              center: recognized.center,
              radius: recognized.radius,
              startAngle: recognized.startAngle,
              endAngle: recognized.endAngle,
            }),
            'Form'
          );
        } else if (s.points.length > 2) {
          // Keine Form erkannt — der freihändige Zug bleibt erhalten
          this.board.add(
            M.create.stroke({ tool: 'pen', pen: 'ball', color: set.color, width: set.presets[set.preset], points: finalizePoints(this, s) }),
            'Freihandform'
          );
        }
        this.finishNonSticky();
      },
      cancel() { this.renderer.live = null; },
    },

    lasso: {
      down(p, e) {
        const handle = handleAt(this, p);
        if (handle) {
          this.session = {
            type: 'scale',
            handle,
            box0: { ...this.selection.box },
            items0: [...this.selection.ids].map((id) => this.board.byId(id)).filter(Boolean),
            before: this.board.items,
          };
          return;
        }
        if (this.selection && this.selection.box &&
            geo.boxContainsPoint(geo.inflateBox(this.selection.box, 8 / this.renderer.cam.scale), p.x, p.y)) {
          this.session = {
            type: 'move',
            start: p,
            items0: [...this.selection.ids].map((id) => this.board.byId(id)).filter(Boolean),
            before: this.board.items,
            moved: false,
          };
          return;
        }
        this.clearSelection();
        if (this.settings.lasso.type === 'rect') {
          this.session = { type: 'rect', from: p };
          this.renderer.marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
        } else {
          this.session = { type: 'lasso', points: [{ x: p.x, y: p.y }] };
          this.renderer.lasso = this.session.points;
        }
        void e;
      },

      move(p) {
        const s = this.session;
        if (!s) return;

        if (s.type === 'lasso') {
          const last = s.points[s.points.length - 1];
          if (geo.dist(last.x, last.y, p.x, p.y) > 2 / this.renderer.cam.scale) {
            s.points.push({ x: p.x, y: p.y });
            this.renderer.requestFrame();
          }
          return;
        }
        if (s.type === 'rect') {
          this.renderer.marquee = {
            x0: Math.min(s.from.x, p.x), y0: Math.min(s.from.y, p.y),
            x1: Math.max(s.from.x, p.x), y1: Math.max(s.from.y, p.y),
          };
          this.renderer.requestFrame();
          return;
        }
        if (s.type === 'move') {
          const dx = p.x - s.start.x;
          const dy = p.y - s.start.y;
          // Schwelle in Bildschirm-Pixeln — in Weltkoordinaten wären bei
          // 1600 % Zoom erst 8 px Mausweg als Bewegung gezählt worden.
          const moveEps = 0.5 / this.renderer.cam.scale;
          if (Math.abs(dx) > moveEps || Math.abs(dy) > moveEps) s.moved = true;
          const map = {};
          for (const it of s.items0) map[it.id] = M.transformItem(it, { dx, dy });
          this.board.stage(applyMap(s.before, map));
          this.selection.box = shiftBox(unionOf(s.items0), dx, dy);
          this.renderer.selection = { ids: this.selection.ids, box: this.selection.box };
          this.renderer.invalidate();
          this.app.updateSelectionUI();
          return;
        }
        if (s.type === 'scale') {
          const b = s.box0;
          const anchor = {
            nw: { x: b.x1, y: b.y1 }, ne: { x: b.x0, y: b.y1 },
            sw: { x: b.x1, y: b.y0 }, se: { x: b.x0, y: b.y0 },
          }[s.handle];
          const w0 = Math.max(Math.abs(b.x1 - b.x0), 1e-3);
          const h0 = Math.max(Math.abs(b.y1 - b.y0), 1e-3);
          const k = geo.clamp(Math.max(Math.abs(p.x - anchor.x) / w0, Math.abs(p.y - anchor.y) / h0), 0.05, 20);
          const map = {};
          for (const it of s.items0) map[it.id] = M.transformItem(it, { sx: k, sy: k, ox: anchor.x, oy: anchor.y });
          this.board.stage(applyMap(s.before, map));
          this.selection.box = scaleBox(b, anchor, k, k);
          this.renderer.selection = { ids: this.selection.ids, box: this.selection.box };
          this.renderer.invalidate();
          this.app.updateSelectionUI();
        }
      },

      up(p) {
        const s = this.session;
        if (!s) return;

        if (s.type === 'lasso') {
          this.renderer.lasso = null;
          if (s.points.length < 3) {
            this.renderer.invalidate();
            return;
          }
          this.select(selectInPolygon(this, s.points));
          return;
        }
        if (s.type === 'rect') {
          const m = this.renderer.marquee;
          this.renderer.marquee = null;
          if (!m || m.x1 - m.x0 < 3 || m.y1 - m.y0 < 3) {
            this.renderer.invalidate();
            return;
          }
          const poly = [
            { x: m.x0, y: m.y0 }, { x: m.x1, y: m.y0 },
            { x: m.x1, y: m.y1 }, { x: m.x0, y: m.y1 },
          ];
          this.select(selectInPolygon(this, poly));
          return;
        }
        if (s.type === 'move' || s.type === 'scale') {
          const finalItems = this.board.items;
          this.board.items = s.before;
          if (s.type === 'move' && !s.moved) {
            this.board.stage(finalItems);
            return;
          }
          this.board.commit(finalItems, s.type === 'move' ? 'Verschieben' : 'Skalieren');
          this.selection.box = boxOfIds(this.board, this.selection.ids);
          this.renderer.selection = { ids: this.selection.ids, box: this.selection.box };
          this.app.updateSelectionUI();
        }
        void p;
      },

      cancel() {
        this.renderer.lasso = null;
        this.renderer.marquee = null;
      },
    },

    text: {
      down(p) {
        // Ein Klick, während ein Feld offen ist, schließt erst dieses ab —
        // `pointerdown` kommt vor `blur`, sonst entstünde sofort ein zweites,
        // leeres Feld an der Klickstelle.
        if (this.app.editor) {
          this.app.closeTextEditor();
          return;
        }
        const hit = topItemAt(this.board, p.x, p.y, ['text']);
        if (hit) {
          this.app.editText(hit);
          return;
        }
        const s = this.settings.text;
        this.app.editText(
          M.create.text({
            x: p.x, y: p.y, w: 320,
            h: s.fontSize * s.lineSpacing + 12,
            color: s.color,
            fontFamily: s.fontFamily,
            fontSize: s.fontSize,
            lineSpacing: s.lineSpacing,
            bold: s.bold, italic: s.italic, underline: s.underline, strike: s.strike,
            align: s.align, boxStyle: s.boxStyle,
          }),
          true
        );
      },
    },

    image: {
      down(p) { this.app.requestImage(p); },
    },

    elements: {
      down(p) {
        const s = this.settings.elements;
        this.board.add(
          M.create.sticker({ x: p.x - s.size / 2, y: p.y - s.size / 2, size: s.size, glyph: s.glyph }),
          'Element'
        );
        this.finishNonSticky();
      },
    },

    laser: {
      down(p) {
        const s = this.settings.laser;
        this.session = { type: 'laser' };
        this.renderer.laserPersistent = s.trail === 'persist';
        // "Bleibend" heißt: die vorige Spur verschwindet beim nächsten Antippen.
        if (s.trail !== 'fade') this.renderer.laserTrail = [];
        this.renderer.laserTrail.push({ x: p.x, y: p.y, t: performance.now(), color: s.color, gap: true });
        this.renderer.requestFrame();
      },
      move(p) {
        const s = this.settings.laser;
        if (s.trail === 'dot') this.renderer.laserTrail = [];
        this.renderer.laserTrail.push({ x: p.x, y: p.y, t: performance.now(), color: s.color, gap: s.trail === 'dot' });
        this.renderer.requestFrame();
      },
      up() {},
    },
  };

  /** Rundet die Stützpunkte einer erkannten Form auf ein Weltraster. */
  function snapShapeToGrid(shape, step) {
    const r = (v) => Math.round(v / step) * step;
    if (shape.vertices) shape.vertices = shape.vertices.map((v) => ({ x: r(v.x), y: r(v.y) }));
    if (shape.from) shape.from = { x: r(shape.from.x), y: r(shape.from.y) };
    if (shape.to) shape.to = { x: r(shape.to.x), y: r(shape.to.y) };
    if (shape.cx !== undefined) {
      shape.cx = r(shape.cx);
      shape.cy = r(shape.cy);
      shape.rx = Math.max(r(shape.rx), step / 2);
      shape.ry = Math.max(r(shape.ry), step / 2);
    }
    if (shape.center) {
      shape.center = { x: r(shape.center.x), y: r(shape.center.y) };
      shape.radius = Math.max(r(shape.radius), step / 2);
    }
  }

  function unionOf(items) {
    let box = null;
    for (const it of items) box = geo.unionBox(box, it.bbox);
    return box;
  }

  GN.tools = {
    TOOLS, PEN_TYPES, ERASER_TYPES, TAPE_PATTERNS, LASSO_FILTERS,
    FONT_CHOICES, BOX_STYLES, LINE_SPACINGS, STICKERS,
    ToolController, defaultSettings, topItemAt, boxOfIds,
  };
})(window);
