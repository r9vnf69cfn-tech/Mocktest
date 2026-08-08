/* ============================================================================
 * model.js — Datenmodell: Board, Arbeitsbereich (Tabs), Verlauf, Persistenz
 *
 * Entwurfsentscheidung: Objekte sind *unveränderlich*. Jede Änderung erzeugt
 * ein neues Objekt und eine neue Objektliste; der Verlauf ist damit eine Liste
 * flacher Array-Kopien. Das ist korrekt und billig (die Einträge teilen sich
 * dieselben Objektreferenzen) und spart Sonderfälle für partielles Radieren,
 * Mehrfachauswahl und Z-Reihenfolge.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const geo = GN.geo;

  const STORAGE_KEY = 'goodnotes-canvas-mockup/v2';
  const HISTORY_LIMIT = 200;

  /* ── Objektfabriken ──────────────────────────────────────────────────── */

  const create = {
    /** Handschrift: Stift oder Textmarker. */
    stroke(p) {
      const points = p.points || [];
      const width = p.width || 4;
      return Object.freeze({
        id: geo.uid('s'),
        kind: 'stroke',
        tool: p.tool || 'pen',          // 'pen' | 'highlighter'
        pen: p.pen || 'fountain',       // fountain | ball | brush | pencil
        color: p.color || '#000000',
        width,
        behind: !!p.behind,             // Textmarker unter der Tinte
        points,
        bbox: geo.boxFromPoints(points, width / 2 + 1),
      });
    },

    shape(p) {
      const item = {
        id: geo.uid('sh'),
        kind: 'shape',
        shape: p.shape || 'rect',       // rect|square|ellipse|circle|line|arrow|triangle|diamond|pentagon|hexagon|arc
        color: p.color || '#000000',
        width: p.width || 4,
        lineStyle: p.lineStyle || 'solid',
        fill: p.fill || null,           // Füllfarbe oder null
        fillOpacity: p.fillOpacity === undefined ? 0.25 : p.fillOpacity,
        rounded: !!p.rounded,
        from: p.from ? { ...p.from } : null,
        to: p.to ? { ...p.to } : null,
        vertices: p.vertices ? p.vertices.map((v) => ({ ...v })) : null,
        cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry, rotation: p.rotation || 0,
        // Kreisbogen
        center: p.center ? { ...p.center } : null,
        radius: p.radius,
        startAngle: p.startAngle,
        endAngle: p.endAngle,
      };
      item.bbox = shapeBox(item);
      return Object.freeze(item);
    },

    text(p) {
      const item = {
        id: geo.uid('t'),
        kind: 'text',
        x: p.x,
        y: p.y,
        w: p.w || 320,
        h: p.h || 40,
        text: p.text || '',
        color: p.color || '#000000',
        fontFamily: p.fontFamily || 'system',
        fontSize: p.fontSize || 17,
        lineSpacing: p.lineSpacing || 1.35,
        bold: !!p.bold,
        italic: !!p.italic,
        underline: !!p.underline,
        strike: !!p.strike,
        align: p.align || 'left',
        boxStyle: p.boxStyle || 'none', // none | border | filled | sticky | callout
      };
      item.bbox = textBox(item);
      return Object.freeze(item);
    },

    image(p) {
      const item = {
        id: geo.uid('img'),
        kind: 'image',
        x: p.x, y: p.y, w: p.w, h: p.h,
        src: p.src,
      };
      item.bbox = { x0: item.x, y0: item.y, x1: item.x + item.w, y1: item.y + item.h };
      return Object.freeze(item);
    },

    sticker(p) {
      const size = p.size || 64;
      const item = { id: geo.uid('st'), kind: 'sticker', x: p.x, y: p.y, size, glyph: p.glyph || '⭐️' };
      item.bbox = { x0: item.x, y0: item.y, x1: item.x + size, y1: item.y + size };
      return Object.freeze(item);
    },

    /** Klebeband: deckt Inhalte darunter ab. */
    tape(p) {
      const item = {
        id: geo.uid('tp'),
        kind: 'tape',
        from: { ...p.from },
        to: { ...p.to },
        width: p.width || 40,
        color: p.color || '#F5F0E4',
        pattern: p.pattern || 'plain',  // plain | stripes | dots | grid | torn
        opacity: p.opacity === undefined ? 1 : p.opacity,
      };
      item.bbox = tapeBox(item);
      return Object.freeze(item);
    },
  };

  /* ── Hüllquader ──────────────────────────────────────────────────────── */

  function shapeBox(item) {
    const pad = item.width / 2 + 2;
    if (item.vertices && item.vertices.length) {
      return geo.boxFromPoints(item.vertices, pad);
    }
    if (item.rx !== undefined && item.rx !== null) {
      // Hülle der gedrehten Ellipse — nicht max(rx, ry) für beide Achsen,
      // sonst ist der Quader eines flachen Ovals auf der kurzen Achse
      // um ein Vielfaches zu groß.
      const rot = item.rotation || 0;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const dx = Math.hypot(item.rx * c, item.ry * s);
      const dy = Math.hypot(item.rx * s, item.ry * c);
      return { x0: item.cx - dx - pad, y0: item.cy - dy - pad, x1: item.cx + dx + pad, y1: item.cy + dy + pad };
    }
    if (item.center && item.radius > 0) {
      // Bogen: Endpunkte plus die im Winkelbereich liegenden Achsenextrema
      const pts = arcPoints(item);
      return geo.boxFromPoints(pts, pad);
    }
    const f = item.from || { x: 0, y: 0 };
    const t = item.to || f;
    return {
      x0: Math.min(f.x, t.x) - pad,
      y0: Math.min(f.y, t.y) - pad,
      x1: Math.max(f.x, t.x) + pad,
      y1: Math.max(f.y, t.y) + pad,
    };
  }

  /** Stützpunkte entlang eines Kreisbogens (für Hülle und Treffer). */
  function arcPoints(item, steps) {
    const n = steps || 48;
    const a0 = item.startAngle || 0;
    const a1 = item.endAngle === undefined ? Math.PI : item.endAngle;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push({ x: item.center.x + Math.cos(a) * item.radius, y: item.center.y + Math.sin(a) * item.radius });
    }
    return out;
  }

  function textBox(t) {
    return { x0: t.x, y0: t.y, x1: t.x + t.w, y1: t.y + t.h };
  }

  function tapeBox(t) {
    const h = t.width / 2 + 2;
    return {
      x0: Math.min(t.from.x, t.to.x) - h,
      y0: Math.min(t.from.y, t.to.y) - h,
      x1: Math.max(t.from.x, t.to.x) + h,
      y1: Math.max(t.from.y, t.to.y) + h,
    };
  }

  /** Erzeugt eine veränderte Kopie samt neu berechneter Hülle. */
  function patch(item, changes) {
    const next = { ...item, ...changes };
    switch (next.kind) {
      case 'stroke': next.bbox = geo.boxFromPoints(next.points, next.width / 2 + 1); break;
      case 'shape': next.bbox = shapeBox(next); break;
      case 'text': next.bbox = textBox(next); break;
      case 'tape': next.bbox = tapeBox(next); break;
      case 'image': next.bbox = { x0: next.x, y0: next.y, x1: next.x + next.w, y1: next.y + next.h }; break;
      case 'sticker': next.bbox = { x0: next.x, y0: next.y, x1: next.x + next.size, y1: next.y + next.size }; break;
      default: break;
    }
    return Object.freeze(next);
  }

  /** Verschieben/Skalieren eines Objekts (Lasso-Transformation). */
  function transformItem(item, t) {
    const scale = t.sx === undefined ? 1 : (Math.abs(t.sx) + Math.abs(t.sy)) / 2;
    const P = (p) => geo.transformPoint(p, t);

    switch (item.kind) {
      case 'stroke':
        return patch(item, {
          points: item.points.map((p) => ({ ...P(p), p: p.p })),
          width: item.width * scale,
        });
      case 'shape': {
        const ch = { width: item.width * scale };
        if (item.vertices) ch.vertices = item.vertices.map(P);
        if (item.from) ch.from = P(item.from);
        if (item.to) ch.to = P(item.to);
        if (item.rx !== undefined && item.rx !== null) {
          const c = P({ x: item.cx, y: item.cy });
          ch.cx = c.x;
          ch.cy = c.y;
          ch.rx = item.rx * (t.sx === undefined ? 1 : Math.abs(t.sx));
          ch.ry = item.ry * (t.sy === undefined ? 1 : Math.abs(t.sy));
        }
        if (item.center) {
          ch.center = P(item.center);
          ch.radius = item.radius * scale;
        }
        return patch(item, ch);
      }
      case 'tape':
        return patch(item, { from: P(item.from), to: P(item.to), width: item.width * scale });
      case 'text': {
        const tl = P({ x: item.x, y: item.y });
        const sx = t.sx === undefined ? 1 : t.sx;
        const sy = t.sy === undefined ? 1 : t.sy;
        return patch(item, {
          x: tl.x, y: tl.y,
          w: item.w * sx, h: item.h * sy,
          fontSize: item.fontSize * scale,
        });
      }
      case 'image': {
        const tl = P({ x: item.x, y: item.y });
        return patch(item, {
          x: tl.x, y: tl.y,
          w: item.w * (t.sx === undefined ? 1 : t.sx),
          h: item.h * (t.sy === undefined ? 1 : t.sy),
        });
      }
      case 'sticker': {
        const tl = P({ x: item.x, y: item.y });
        return patch(item, { x: tl.x, y: tl.y, size: item.size * scale });
      }
      default:
        return item;
    }
  }

  /** Grobe Kategorie für die Lasso-Filter. */
  function categoryOf(item) {
    if (item.kind === 'stroke') return 'ink';
    if (item.kind === 'image') return 'image';
    if (item.kind === 'text') return 'text';
    if (item.kind === 'shape') return 'shape';
    return 'element';   // sticker, tape
  }

  /* ── Board ───────────────────────────────────────────────────────────── */

  class Board {
    constructor(props) {
      const p = props || {};
      this.id = p.id || geo.uid('b');
      this.title = p.title || 'Whiteboard';
      this.template = p.template || 'dots';   // blank | dots | grid | lines
      this.paper = p.paper || 'white';        // white | yellow | dark
      this.spacing = p.spacing || 26;         // Rasterabstand in Welteinheiten (≈7 mm)
      this.items = p.items || [];
      this.camera = p.camera || null;
      this.history = [{ items: this.items }];
      this.historyIndex = 0;
      this.onChange = null;
    }

    emit(reason) {
      if (this.onChange) this.onChange(reason, this);
    }

    byId(id) {
      return this.items.find((i) => i.id === id) || null;
    }

    contentBox() {
      let box = null;
      for (const it of this.items) box = geo.unionBox(box, it.bbox);
      return box;
    }

    /** Setzt die Liste OHNE Verlaufseintrag — für Live-Vorschauen in einer Geste. */
    stage(items) {
      this.items = items;
      this.emit('stage');
    }

    commit(items, label) {
      this.items = items;
      this.history.length = this.historyIndex + 1;
      this.history.push({ items, label: label || 'Änderung' });
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      this.historyIndex = this.history.length - 1;
      this.emit('commit');
    }

    add(items, label) {
      const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
      if (!list.length) return;
      this.commit(this.items.concat(list), label || 'Hinzufügen');
    }

    remove(ids, label) {
      const set = new Set(Array.isArray(ids) ? ids : [ids]);
      if (!set.size) return;
      this.commit(this.items.filter((i) => !set.has(i.id)), label || 'Löschen');
    }

    /** Ersetzt Objekte anhand einer Map id → neues Objekt | Array | null. */
    replace(map, label) {
      const next = [];
      for (const it of this.items) {
        if (Object.prototype.hasOwnProperty.call(map, it.id)) {
          const rep = map[it.id];
          if (rep === null) continue;
          if (Array.isArray(rep)) next.push(...rep);
          else next.push(rep);
        } else {
          next.push(it);
        }
      }
      this.commit(next, label || 'Ändern');
    }

    clear(label) {
      if (!this.items.length) return;
      this.commit([], label || 'Board leeren');
    }

    canUndo() { return this.historyIndex > 0; }
    canRedo() { return this.historyIndex < this.history.length - 1; }

    undo() {
      if (!this.canUndo()) return false;
      this.historyIndex--;
      this.items = this.history[this.historyIndex].items;
      this.emit('undo');
      return true;
    }

    redo() {
      if (!this.canRedo()) return false;
      this.historyIndex++;
      this.items = this.history[this.historyIndex].items;
      this.emit('redo');
      return true;
    }

    toJSON() {
      return {
        id: this.id,
        title: this.title,
        template: this.template,
        paper: this.paper,
        spacing: this.spacing,
        camera: this.camera,
        items: this.items,
      };
    }
  }

  /* ── Arbeitsbereich (alle offenen Boards = Tabs) ──────────────────────── */

  class Workspace {
    constructor() {
      this.boards = [];
      this.activeIndex = 0;
      this.listeners = new Set();
      this._saveTimer = 0;
    }

    on(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    emit(reason) {
      this.listeners.forEach((fn) => fn(reason, this.active));
      this.save();
    }

    get active() {
      return this.boards[this.activeIndex];
    }

    adopt(board) {
      board.onChange = (reason) => this.emit(reason);
      return board;
    }

    addBoard(props, atIndex) {
      const board = this.adopt(new Board(props));
      const idx = atIndex === undefined ? this.boards.length : atIndex;
      this.boards.splice(idx, 0, board);
      this.activeIndex = idx;
      this.emit('boards');
      return board;
    }

    closeBoard(index) {
      if (this.boards.length <= 1) return false;
      this.boards.splice(index, 1);
      if (this.activeIndex >= this.boards.length) this.activeIndex = this.boards.length - 1;
      else if (index < this.activeIndex) this.activeIndex--;
      this.emit('boards');
      return true;
    }

    setActive(index) {
      if (index === this.activeIndex || index < 0 || index >= this.boards.length) return;
      this.activeIndex = index;
      this.emit('boards');
    }

    toJSON() {
      return { v: 2, activeIndex: this.activeIndex, boards: this.boards.map((b) => b.toJSON()) };
    }

    save() {
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
        } catch (err) {
          /* Speicher voll oder gesperrt — das Mockup läuft trotzdem weiter. */
        }
      }, 500);
    }

    load() {
      let raw;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (err) {
        return false;
      }
      if (!raw) return false;
      try {
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.boards) || !data.boards.length) return false;
        this.boards = data.boards.map((b) =>
          this.adopt(new Board({ ...b, items: (b.items || []).map((i) => Object.freeze(i)) }))
        );
        this.activeIndex = Math.min(data.activeIndex || 0, this.boards.length - 1);
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  GN.model = { Board, Workspace, create, patch, transformItem, categoryOf, shapeBox, textBox, tapeBox, arcPoints, STORAGE_KEY };
})(window);
