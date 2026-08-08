/* ============================================================================
 * renderer.js — Kamera und Canvas-Rendering
 *
 * Koordinaten:  screen = welt * kamera.scale + kamera.offset
 *
 * Ebenen pro Frame:
 *   1. Papier + Muster (Bildschirmraum, am Weltraster ausgerichtet)
 *   2. Statischer Cache — alle festgeschriebenen Objekte in einem Offscreen-
 *      Canvas. Wird nur bei Dokument- oder Kameraänderung neu gezeichnet;
 *      während eines Strichs wird er nur geblittet.
 *   3. Live-Ebene — laufender Strich, Formvorschau
 *   4. Overlay — Lasso, Auswahlrahmen, Radierer-Ring, Laser, Lineal
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const geo = GN.geo;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 16;
  const ZOOM_STOPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 4, 8, 16];

  /* Schriftenliste wie in GoodNotes. Jeder Eintrag nennt zuerst die Apple-
   * Schrift und danach Alternativen, damit die Auswahl auch außerhalb von
   * macOS/iOS unterscheidbar bleibt. */
  const FONTS = {
    system: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif',
    newyork: '"New York", ui-serif, Charter, Georgia, serif',
    sfmono: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
    helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    georgia: 'Georgia, "Times New Roman", serif',
    palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    avenir: '"Avenir Next", Avenir, Montserrat, "Segoe UI", sans-serif',
    futura: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif',
    menlo: 'Menlo, "DejaVu Sans Mono", monospace',
    markerfelt: '"Marker Felt", "Comic Sans MS", "Segoe Print", cursive',
    bradley: '"Bradley Hand", "Segoe Script", "Comic Sans MS", cursive',
    noteworthy: 'Noteworthy, "Segoe Print", "Comic Sans MS", cursive',
    chalkboard: '"Chalkboard SE", Chalkboard, "Comic Sans MS", cursive',
    rounded: '"SF Pro Rounded", ui-rounded, "Avenir Next Rounded", Nunito, system-ui, sans-serif',
  };

  const PAPER = {
    white: { bg: '#FFFFFF', rule: '#C9C9CE', grid: '#DCDCE0', dot: '#C6C6CB' },
    yellow: { bg: '#FCF6DC', rule: '#C8BFA0', grid: '#D6CDAE', dot: '#BCB499' },
    dark: { bg: '#1F1F21', rule: '#3A3A3C', grid: '#333336', dot: '#3C3C40' },
  };

  /* ══ Dunkles Blatt ══════════════════════════════════════════════════════
   *
   * Der Dunkelmodus verdunkelt auch die Seite, nicht nur die Leisten — sonst
   * ist die Zeichenfläche die einzige grelle Fläche im dunklen Fenster.
   *
   * Betroffen ist ausschließlich WEISSES Papier: Weiß ist der Standard, keine
   * Entscheidung. Creme und Dunkel hat jemand im Menü bewusst gewählt; diese
   * Wahl gehört dem Board und bleibt in beiden Designs unangetastet.
   *
   * Auf einem dunklen Blatt wird zu dunkle Tinte hell DARGESTELLT. Das ist
   * reine Anzeige — item.color bleibt, wie es gespeichert ist; beim
   * Zurückschalten auf Hell steht wieder schwarze Tinte da.
   *
   * SCHWELLE — Kontrast der Tinte gegen das dunkle Blatt #1F1F21 (relative
   * Luminanz nach WCAG 2.x: L = 0,01381). Unter 3:1 wird umgekehrt, ab 3:1
   * bleibt die Farbe. 3:1 ist die WCAG-Grenze für grafische Objekte (1.4.11);
   * ein Strich ist genau das. Nachgerechnet:
   *
   *   #000000 schwarz        1,28:1  →  umgekehrt #FFFFFF  16,45:1
   *   #3A3A3C grau           1,45:1  →  umgekehrt #C3C3C5   9,35:1
   *   #00204A dunkelblau     1,02:1  →  umgekehrt #B5D5FF  10,91:1
   *   #5A0E0A dunkelrot      1,18:1  →  umgekehrt #F5A9A5   8,70:1
   *   #007AFF blau           4,10:1  →  bleibt
   *   #FF3B30 rot            4,64:1  →  bleibt
   *   #D02B20 Semantik-Rot   3,17:1  →  bleibt
   *   #1D7F4E Semantik-Grün  3,29:1  →  bleibt
   *   #FFF200 Textmarker    14,07:1  →  bleibt
   *   #FFD43B Zettel gelb   11,54:1  →  bleibt
   *   #8CE99A Zettel grün   11,16:1  →  bleibt
   *
   * Umgekehrt wird die Helligkeit an der Mitte gespiegelt (HSL: l → 1−l),
   * Farbton und Sättigung bleiben. Danach notfalls weiter aufhellen, bis
   * 4,5:1 steht — Handschrift wird gelesen, nicht nur gesehen.
   *
   * RASTER auf #1F1F21: Linien #3A3A3C 1,45:1 · Karo #333336 1,31:1 ·
   * Punkte #3C3C40 1,50:1. Bewusst schwach: das Raster ist Hilfslinie, kein
   * Inhalt. Auf weißem Papier liegt es mit 1,65 / 1,37 / 1,70:1 in derselben
   * Größenordnung, das dunkle Blatt ist also nicht flauer als das helle.
   * ═════════════════════════════════════════════════════════════════════ */

  const INK_FLIP_BELOW = 3;   // darunter ist die Tinte auf dem dunklen Blatt unlesbar
  const INK_TARGET = 4.5;     // so weit wird sie mindestens aufgehellt

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.board = null;
      this.cam = { x: 0, y: 0, scale: 1 };
      this.dpr = Math.min(global.devicePixelRatio || 1, 2.5);
      this.width = 0;
      this.height = 0;

      this.staticCanvas = document.createElement('canvas');
      this.staticCtx = this.staticCanvas.getContext('2d');
      this.staticDirty = true;

      this.live = null;
      this.lasso = null;
      this.marquee = null;
      this.selection = null;
      this.hiddenIds = null;
      this.eraserCursor = null;
      this.laserTrail = [];
      this.laserPersistent = false;
      this.ruler = null;

      this.images = new Map();
      this._needsFrame = false;
    }

    setBoard(board) {
      this.board = board;
      this.invalidate();
    }

    /* ── Größe ─────────────────────────────────────────────────────────── */

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = Math.max(1, Math.round(rect.width));
      this.height = Math.max(1, Math.round(rect.height));
      this.dpr = Math.min(global.devicePixelRatio || 1, 2.5);
      for (const c of [this.canvas, this.staticCanvas]) {
        c.width = Math.round(this.width * this.dpr);
        c.height = Math.round(this.height * this.dpr);
      }
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.invalidate();
    }

    /* ── Kamera ────────────────────────────────────────────────────────── */

    toWorld(sx, sy) {
      return { x: (sx - this.cam.x) / this.cam.scale, y: (sy - this.cam.y) / this.cam.scale };
    }
    toScreen(wx, wy) {
      return { x: wx * this.cam.scale + this.cam.x, y: wy * this.cam.scale + this.cam.y };
    }

    zoomAt(sx, sy, nextScale) {
      const s = geo.clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const w = this.toWorld(sx, sy);
      this.cam.scale = s;
      this.cam.x = sx - w.x * s;
      this.cam.y = sy - w.y * s;
      this.invalidate();
    }

    zoomBy(factor, sx, sy) {
      this.zoomAt(sx === undefined ? this.width / 2 : sx, sy === undefined ? this.height / 2 : sy, this.cam.scale * factor);
    }

    /** Nächste Stufe aus der Zoom-Reihe (Richtung +1 / −1). */
    zoomStep(dir) {
      const cur = this.cam.scale;
      let target;
      if (dir > 0) target = ZOOM_STOPS.find((s) => s > cur * 1.02);
      else target = [...ZOOM_STOPS].reverse().find((s) => s < cur * 0.98);
      this.zoomAt(this.width / 2, this.height / 2, target || (dir > 0 ? MAX_SCALE : MIN_SCALE));
    }

    panBy(dx, dy) {
      this.cam.x += dx;
      this.cam.y += dy;
      this.invalidate();
    }

    resetZoom() {
      this.zoomAt(this.width / 2, this.height / 2, 1);
    }

    fitContent(padding) {
      const box = this.board && this.board.contentBox();
      if (!geo.boxValid(box)) {
        this.cam = { x: this.width / 2, y: this.height / 2, scale: 1 };
        this.invalidate();
        return;
      }
      // Ein fester Rand quetscht schmale Geräte zusammen: 150 px Rand auf einem
      // 393 px breiten iPhone lassen 93 px für den Inhalt übrig — das Ergebnis
      // waren 21 % Zoom. Der Rand darf deshalb höchstens ein Achtel der kürzeren
      // Bildschirmkante beanspruchen.
      const wish = padding === undefined ? 80 : padding;
      const pad = Math.min(wish, Math.min(this.width, this.height) / 8);
      const bw = Math.max(box.x1 - box.x0, 1);
      const bh = Math.max(box.y1 - box.y0, 1);
      const scale = geo.clamp(Math.min((this.width - pad * 2) / bw, (this.height - pad * 2) / bh), MIN_SCALE, 3);
      this.cam.scale = scale;
      this.cam.x = this.width / 2 - ((box.x0 + box.x1) / 2) * scale;
      this.cam.y = this.height / 2 - ((box.y0 + box.y1) / 2) * scale;
      this.invalidate();
    }

    viewBox() {
      const a = this.toWorld(0, 0);
      const b = this.toWorld(this.width, this.height);
      return { x0: a.x - 8, y0: a.y - 8, x1: b.x + 8, y1: b.y + 8 };
    }

    /* ── Frames ────────────────────────────────────────────────────────── */

    invalidate() {
      this.staticDirty = true;
      this.requestFrame();
    }

    requestFrame() {
      if (this._needsFrame) return;
      this._needsFrame = true;
      requestAnimationFrame(() => {
        this._needsFrame = false;
        this.draw();
      });
    }

    draw() {
      if (!this.board) return;
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.width, this.height);

      this.drawPaper(ctx);

      if (this.staticDirty) this.renderStatic();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.staticCanvas, 0, 0);
      ctx.restore();

      if (this.live) {
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.save();
        ctx.translate(this.cam.x, this.cam.y);
        ctx.scale(this.cam.scale, this.cam.scale);
        this.drawItem(ctx, this.live);
        ctx.restore();
      }

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.drawOverlay(ctx);
    }

    renderStatic() {
      const ctx = this.staticCtx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.save();
      ctx.translate(this.cam.x, this.cam.y);
      ctx.scale(this.cam.scale, this.cam.scale);

      const view = this.viewBox();
      const items = this.board.items;
      const hidden = this.hiddenIds;

      // Durchgang 1: Textmarker mit "dahinter zeichnen"
      for (const it of items) {
        if (!(it.kind === 'stroke' && it.tool === 'highlighter' && it.behind)) continue;
        if (hidden && hidden.has(it.id)) continue;
        if (!geo.boxesOverlap(it.bbox, view)) continue;
        this.drawItem(ctx, it);
      }
      // Durchgang 2: alles Übrige in Z-Reihenfolge
      for (const it of items) {
        if (it.kind === 'stroke' && it.tool === 'highlighter' && it.behind) continue;
        if (hidden && hidden.has(it.id)) continue;
        if (!geo.boxesOverlap(it.bbox, view)) continue;
        this.drawItem(ctx, it);
      }

      ctx.restore();
      this.staticDirty = false;
    }

    /* ── Papier ────────────────────────────────────────────────────────── */

    /** Papiersorte, wie sie gerade dargestellt wird — siehe Block „Dunkles
     *  Blatt". Ändert board.paper nicht. */
    paperKey() {
      const key = PAPER[this.board.paper] ? this.board.paper : 'white';
      return key === 'white' && isDarkTheme() ? 'dark' : key;
    }

    /** Ist das Blatt gerade dunkel? Egal ob durch das Design oder durch die
     *  Wahl „Dunkel" im Papiermenü — schwarze Tinte ist in beiden Fällen
     *  gleich unlesbar. */
    sheetIsDark() {
      return this.paperKey() === 'dark';
    }

    /** Tinte für die Anzeige. Auf hellem Blatt unverändert. */
    ink(color) {
      return this.sheetIsDark() ? displayInk(color) : color;
    }

    drawPaper(ctx) {
      const paper = PAPER[this.paperKey()];
      ctx.fillStyle = paper.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      const tpl = this.board.template;
      if (tpl === 'blank') return;

      const s = this.cam.scale;
      let step = (this.board.spacing || 26) * s;
      while (step < 14) step *= 2;
      while (step > 92) step /= 2;

      const ox = ((this.cam.x % step) + step) % step;
      const oy = ((this.cam.y % step) + step) % step;

      ctx.save();
      if (tpl === 'dots') {
        const r = geo.clamp(step / 26, 0.7, 1.9);
        ctx.fillStyle = paper.dot;
        for (let y = oy; y < this.height + step; y += step) {
          for (let x = ox; x < this.width + step; x += step) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (tpl === 'grid') {
        ctx.strokeStyle = paper.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = ox; x < this.width + step; x += step) {
          ctx.moveTo(Math.round(x) + 0.5, 0);
          ctx.lineTo(Math.round(x) + 0.5, this.height);
        }
        for (let y = oy; y < this.height + step; y += step) {
          ctx.moveTo(0, Math.round(y) + 0.5);
          ctx.lineTo(this.width, Math.round(y) + 0.5);
        }
        ctx.stroke();
      } else if (tpl === 'lines') {
        const ls = step * 1.25;
        const loy = ((this.cam.y % ls) + ls) % ls;
        ctx.strokeStyle = paper.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = loy; y < this.height + ls; y += ls) {
          ctx.moveTo(0, Math.round(y) + 0.5);
          ctx.lineTo(this.width, Math.round(y) + 0.5);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ── Objekte ───────────────────────────────────────────────────────── */

    drawItem(ctx, item) {
      switch (item.kind) {
        case 'stroke': this.drawStroke(ctx, item); break;
        case 'shape': this.drawShape(ctx, item); break;
        case 'tape': this.drawTape(ctx, item); break;
        case 'text': this.drawText(ctx, item); break;
        case 'image': this.drawImage(ctx, item); break;
        case 'sticker': this.drawSticker(ctx, item); break;
        default: break;
      }
    }

    drawStroke(ctx, s) {
      const pts = s.points;
      if (!pts.length) return;
      ctx.save();

      if (s.tool === 'highlighter') {
        // Ein einziger Pfad, einmal komponiert — Selbstüberschneidungen
        // dunkeln dadurch nicht nach.
        //
        // Der Marker bleibt farbig, auch auf dunklem Blatt: gelb ist gelb.
        // Nur die Rechenart dreht sich um. Auf hellem Papier nimmt der Marker
        // Licht weg (multiply), auf dunklem gibt er welches dazu (screen) —
        // sonst würde er die hell dargestellte Handschrift unter sich
        // abdunkeln statt sie zu markieren.
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = this.sheetIsDark() ? 'screen' : 'multiply';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        strokePath(ctx, pts);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Stift: die Farbe ist Tinte und folgt der Anzeige-Umkehrung.
      const color = this.ink(s.color);

      if (s.pen === 'ball') {
        ctx.strokeStyle = color;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        strokePath(ctx, pts);
        ctx.stroke();
        ctx.restore();
        return;
      }

      const taper = s.pen === 'brush' ? 0.85 : s.pen === 'pencil' ? 0.4 : 0.62;
      ctx.fillStyle = color;
      if (s.pen === 'pencil') ctx.globalAlpha = 0.86;
      fillVariableStroke(ctx, pts, s.width, taper);
      if (s.pen === 'pencil') drawPencilGrain(ctx, pts, s.width);
      ctx.restore();
    }

    drawShape(ctx, sh) {
      ctx.save();
      // Form: gezogene Linie wie Tinte, die Füllung ist ein Ton derselben
      // Farbe und wird mitgeführt, damit beide zusammen bleiben.
      ctx.strokeStyle = this.ink(sh.color);
      ctx.lineWidth = sh.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      applyLineStyle(ctx, sh);

      ctx.beginPath();
      if (sh.vertices && sh.vertices.length) {
        polygonPath(ctx, sh.vertices, sh.rounded ? cornerRadiusFor(sh.vertices) : 0);
      } else if (sh.rx !== undefined && sh.rx !== null) {
        ctx.ellipse(sh.cx, sh.cy, Math.max(sh.rx, 0.5), Math.max(sh.ry, 0.5), sh.rotation || 0, 0, Math.PI * 2);
      } else if (sh.center && sh.radius > 0) {
        // Die Erkennung liefert auch rückwärts laufende Bögen.
        ctx.arc(sh.center.x, sh.center.y, sh.radius, sh.startAngle, sh.endAngle, sh.endAngle < sh.startAngle);
      } else if (sh.shape === 'arrow') {
        const { from, to } = sh;
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        const head = Math.max(sh.width * 3.4, 11);
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - head * Math.cos(ang - 0.42), to.y - head * Math.sin(ang - 0.42));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - head * Math.cos(ang + 0.42), to.y - head * Math.sin(ang + 0.42));
      } else if (sh.from && sh.to) {
        ctx.moveTo(sh.from.x, sh.from.y);
        ctx.lineTo(sh.to.x, sh.to.y);
      }

      const closed = !!(sh.vertices || (sh.rx !== undefined && sh.rx !== null));
      if (sh.fill && closed) {
        ctx.save();
        ctx.globalAlpha = sh.fillOpacity;
        ctx.fillStyle = this.ink(sh.fill);
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
      ctx.restore();
    }

    /* Klebeband ist keine Tinte, sondern ein Stück Material, das auf dem
     * Blatt liegt. Ein Streifen Washi-Tape wird im Dunkeln nicht dunkler —
     * seine Farbe bleibt darum in beiden Designs unverändert. */
    drawTape(ctx, t) {
      const ang = Math.atan2(t.to.y - t.from.y, t.to.x - t.from.x);
      const len = geo.dist(t.from.x, t.from.y, t.to.x, t.to.y);
      const h = t.width;
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.translate(t.from.x, t.from.y);
      ctx.rotate(ang);

      ctx.beginPath();
      if (t.pattern === 'torn') tornRectPath(ctx, 0, -h / 2, len, h);
      else ctx.rect(0, -h / 2, len, h);
      ctx.fillStyle = t.color;
      ctx.fill();

      ctx.save();
      ctx.clip();
      ctx.globalAlpha = t.opacity * 0.5;
      ctx.strokeStyle = shade(t.color, -0.18);
      if (t.pattern === 'stripes') {
        ctx.lineWidth = Math.max(h / 9, 1.5);
        ctx.beginPath();
        for (let x = -h; x < len + h; x += h / 2.4) {
          ctx.moveTo(x, -h / 2);
          ctx.lineTo(x + h, h / 2);
        }
        ctx.stroke();
      } else if (t.pattern === 'grid') {
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < len; x += h / 3) {
          ctx.moveTo(x, -h / 2);
          ctx.lineTo(x, h / 2);
        }
        for (let y = -h / 2; y <= h / 2; y += h / 3) {
          ctx.moveTo(0, y);
          ctx.lineTo(len, y);
        }
        ctx.stroke();
      } else if (t.pattern === 'dots') {
        ctx.fillStyle = shade(t.color, -0.2);
        const step = h / 3.2;
        for (let x = step / 2; x < len; x += step) {
          for (let y = -h / 2 + step / 2; y < h / 2; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, Math.max(h / 26, 0.8), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // Leichter Glanz oben und Schatten unten — lässt das Band aufliegen
      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.30)');
      grad.addColorStop(0.45, 'rgba(255,255,255,0.04)');
      grad.addColorStop(1, 'rgba(0,0,0,0.07)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    drawText(ctx, t) {
      ctx.save();
      ctx.textBaseline = 'top';
      ctx.font = fontString(t);
      const lineHeight = t.fontSize * t.lineSpacing;
      const pad = 6;
      const lines = wrapText(ctx, t.text, t.w - pad * 2);
      const boxH = Math.max(t.h, lines.length * lineHeight + pad * 2);

      // Ein Haftnotizzettel ist Papier, keine Tinte: seine Farbe ist die
      // Fläche, auf der die Schrift liegt. Ein gelber Zettel bleibt gelb, und
      // die Schrift darauf richtet sich weiter nach dem Zettel. Bei „filled"
      // und „border" ist t.color dagegen die Schriftfarbe und der Kasten nur
      // ein Ton davon — beide werden zusammen umgekehrt.
      const sticky = t.boxStyle === 'sticky' || t.boxStyle === 'callout';
      const paint = sticky ? t.color : this.ink(t.color);

      // Boxstil
      if (t.boxStyle && t.boxStyle !== 'none') {
        ctx.save();
        ctx.beginPath();
        if (t.boxStyle === 'callout') calloutPath(ctx, t.x, t.y, t.w, boxH, 10);
        else roundRectPath(ctx, t.x, t.y, t.w, boxH, t.boxStyle === 'sticky' ? 2 : 8);
        if (t.boxStyle === 'border') {
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = paint;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (t.boxStyle === 'filled') {
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = paint;
          ctx.fill();
        } else {
          // sticky / callout: volle Farbe mit weichem Schatten
          ctx.shadowColor = 'rgba(0,0,0,0.14)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = paint;
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.fillStyle = sticky ? readableInk(t.color) : paint;

      let y = t.y + pad;
      for (const line of lines) {
        const wdt = ctx.measureText(line).width;
        let x = t.x + pad;
        if (t.align === 'center') x = t.x + t.w / 2 - wdt / 2;
        else if (t.align === 'right') x = t.x + t.w - pad - wdt;
        ctx.fillText(line, x, y);
        const rule = Math.max(1, t.fontSize / 16);
        if (t.underline) ctx.fillRect(x, y + t.fontSize * 1.06, wdt, rule);
        if (t.strike) ctx.fillRect(x, y + t.fontSize * 0.62, wdt, rule);
        y += lineHeight;
      }
      ctx.restore();
    }

    drawImage(ctx, im) {
      const img = this.getImage(im.src);
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, im.x, im.y, im.w, im.h);
      } else {
        ctx.save();
        ctx.fillStyle = 'rgba(120,120,128,0.16)';
        ctx.beginPath();
        roundRectPath(ctx, im.x, im.y, im.w, im.h, 8);
        ctx.fill();
        ctx.restore();
      }
    }

    /* Sticker und Bilder bringen ihre eigenen Farben mit — ein Emoji oder ein
     * Foto ist keine Tinte und wird nicht umgefärbt. */
    drawSticker(ctx, st) {
      ctx.save();
      ctx.font = `${st.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(st.glyph, st.x, st.y);
      ctx.restore();
    }

    getImage(src) {
      let img = this.images.get(src);
      if (!img) {
        img = new Image();
        img.onload = () => this.invalidate();
        img.src = src;
        this.images.set(src, img);
      }
      return img;
    }

    /* ── Overlay ───────────────────────────────────────────────────────── */

    drawOverlay(ctx) {
      const accent = cssVar('--accent', '#00A99D');
      const s = this.cam.scale;

      if (this.lasso && this.lasso.length > 1) {
        ctx.save();
        ctx.beginPath();
        const p0 = this.toScreen(this.lasso[0].x, this.lasso[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < this.lasso.length; i++) {
          const p = this.toScreen(this.lasso[i].x, this.lasso[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = withAlpha(accent, 0.08);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -(performance.now() / 60) % 9;
        ctx.stroke();
        ctx.restore();
        this.requestFrame();
      }

      if (this.marquee) {
        const a = this.toScreen(this.marquee.x0, this.marquee.y0);
        const b = this.toScreen(this.marquee.x1, this.marquee.y1);
        ctx.save();
        ctx.fillStyle = withAlpha(accent, 0.08);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        ctx.restore();
      }

      if (this.selection && geo.boxValid(this.selection.box)) {
        const b = this.selection.box;
        const a = this.toScreen(b.x0, b.y0);
        const c = this.toScreen(b.x1, b.y1);
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(a.x - 6, a.y - 6, c.x - a.x + 12, c.y - a.y + 12);
        ctx.setLineDash([]);
        ctx.fillStyle = '#FFFFFF';
        for (const [hx, hy] of [
          [a.x - 6, a.y - 6], [c.x + 6, a.y - 6], [a.x - 6, c.y + 6], [c.x + 6, c.y + 6],
        ]) {
          ctx.beginPath();
          ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      if (this.eraserCursor) {
        const p = this.toScreen(this.eraserCursor.x, this.eraserCursor.y);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.eraserCursor.r * s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,120,128,0.10)';
        ctx.fill();
        ctx.strokeStyle = cssVar('--label-2', 'rgba(60,60,67,0.6)');
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.restore();
      }

      if (this.ruler && this.ruler.visible) this.drawRuler(ctx);

      if (this.laserTrail.length) this.drawLaser(ctx);
    }

    drawLaser(ctx) {
      const now = performance.now();
      const life = 1200;
      if (!this.laserPersistent) this.laserTrail = this.laserTrail.filter((p) => now - p.t < life);
      if (!this.laserTrail.length) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < this.laserTrail.length; i++) {
        const p0 = this.laserTrail[i - 1];
        const p1 = this.laserTrail[i];
        if (p1.gap) continue;
        const age = this.laserPersistent ? 0 : (now - p1.t) / life;
        const a = this.toScreen(p0.x, p0.y);
        const b = this.toScreen(p1.x, p1.y);
        ctx.globalAlpha = Math.max(0, 1 - age);
        ctx.strokeStyle = p1.color || '#FF3B30';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const last = this.laserTrail[this.laserTrail.length - 1];
      if (this.laserPersistent || now - last.t < 240) {
        const head = this.toScreen(last.x, last.y);
        ctx.globalAlpha = 1;
        ctx.shadowColor = last.color || '#FF3B30';
        ctx.shadowBlur = 16;
        ctx.fillStyle = last.color || '#FF3B30';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (!this.laserPersistent) this.requestFrame();
    }

    drawRuler(ctx) {
      const r = this.ruler;
      const c = this.toScreen(r.x, r.y);
      const len = r.length;
      const h = 62;
      // Kante und Skala des Lineals liegen auf dem Blatt und müssen sich vom
      // Blatt abheben — auf dem dunklen also hell.
      const dark = this.sheetIsDark();
      const edge = dark ? 'rgba(235,235,245,0.50)' : 'rgba(60,60,67,0.45)';
      const tick = dark ? 'rgba(235,235,245,0.55)' : 'rgba(60,60,67,0.5)';
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((r.angle * Math.PI) / 180);

      if (r.type === 'protractor') {
        ctx.beginPath();
        ctx.arc(0, 0, len / 2, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(160,175,190,0.20)';
        ctx.fill();
        ctx.strokeStyle = tick;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.strokeStyle = edge;
        for (let deg = 0; deg <= 180; deg += 5) {
          const a = Math.PI + (deg * Math.PI) / 180;
          const inner = (len / 2) * (deg % 15 === 0 ? 0.86 : 0.93);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
          ctx.lineTo(Math.cos(a) * (len / 2), Math.sin(a) * (len / 2));
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        roundRectPath(ctx, -len / 2, -h / 2, len, h, 5);
        ctx.fillStyle = 'rgba(160,175,190,0.22)';
        ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.strokeStyle = tick;
        ctx.lineWidth = 1;
        for (let x = -len / 2 + 10; x < len / 2; x += 10) {
          const major = Math.round((x + len / 2 - 10) / 10) % 5 === 0;
          ctx.beginPath();
          ctx.moveTo(x, -h / 2);
          ctx.lineTo(x, -h / 2 + (major ? 14 : 8));
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ── Minimap ───────────────────────────────────────────────────────── */

    renderMinimap(canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(global.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 176;
      const h = canvas.clientHeight || 120;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const view = this.viewBox();
      let box = this.board.contentBox();
      box = box ? geo.unionBox(box, view) : view;

      const pad = 8;
      const bw = Math.max(box.x1 - box.x0, 1);
      const bh = Math.max(box.y1 - box.y0, 1);
      const k = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
      const ox = pad + (w - pad * 2 - bw * k) / 2 - box.x0 * k;
      const oy = pad + (h - pad * 2 - bh * k) / 2 - box.y0 * k;
      const M = (x, y) => ({ x: x * k + ox, y: y * k + oy });

      ctx.fillStyle = cssVar('--label-3', 'rgba(60,60,67,.3)');
      for (const it of this.board.items) {
        const a = M(it.bbox.x0, it.bbox.y0);
        const b = M(it.bbox.x1, it.bbox.y1);
        ctx.fillRect(a.x, a.y, Math.max(b.x - a.x, 1), Math.max(b.y - a.y, 1));
      }

      const accent = cssVar('--accent', '#00A99D');
      const va = M(view.x0, view.y0);
      const vb = M(view.x1, view.y1);
      ctx.fillStyle = withAlpha(accent, 0.1);
      ctx.fillRect(va.x, va.y, vb.x - va.x, vb.y - va.y);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(va.x, va.y, vb.x - va.x, vb.y - va.y);

      return { k, ox, oy };
    }

    /* ── Export ────────────────────────────────────────────────────────── */

    exportPNG(scale) {
      const box = this.board.contentBox();
      const pad = 48;
      const s = scale || 2;
      let x0 = -400, y0 = -300, w = 1600, h = 1200;
      if (geo.boxValid(box)) {
        x0 = box.x0 - pad;
        y0 = box.y0 - pad;
        w = box.x1 - box.x0 + pad * 2;
        h = box.y1 - box.y0 + pad * 2;
      }
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(w * s));
      out.height = Math.max(1, Math.round(h * s));
      const ctx = out.getContext('2d');
      // Dieselbe Regel wie auf dem Bildschirm — sonst weicht das PNG ab.
      ctx.fillStyle = PAPER[this.paperKey()].bg;
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
      for (const it of this.board.items) {
        if (it.kind === 'stroke' && it.tool === 'highlighter' && it.behind) this.drawItem(ctx, it);
      }
      for (const it of this.board.items) {
        if (it.kind === 'stroke' && it.tool === 'highlighter' && it.behind) continue;
        this.drawItem(ctx, it);
      }
      return out.toDataURL('image/png');
    }
  }

  /* ── Pfad- und Zeichenhilfen ─────────────────────────────────────────── */

  function strokePath(ctx, pts) {
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[0].x + 0.01, pts[0].y);
      return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }

  /** Strich mit variabler Breite als gefüllte Kontur. */
  function fillVariableStroke(ctx, pts, baseWidth, taper) {
    if (pts.length === 1) {
      const r = (baseWidth * widthFactor(pts[0].p, taper)) / 2;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, Math.max(r, 0.35), 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const left = [];
    const right = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[i - 1] || pts[i];
      const next = pts[i + 1] || pts[i];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const half = (baseWidth * widthFactor(pts[i].p, taper)) / 2;
      left.push({ x: pts[i].x - ty * half, y: pts[i].y + tx * half });
      right.push({ x: pts[i].x + ty * half, y: pts[i].y - tx * half });
    }

    ctx.beginPath();
    smoothSide(ctx, left, true);
    smoothSide(ctx, right.slice().reverse(), false);
    ctx.closePath();
    ctx.fill();

    for (const [pt, idx] of [[pts[0], 0], [pts[pts.length - 1], pts.length - 1]]) {
      const r = (baseWidth * widthFactor(pts[idx].p, taper)) / 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(r, 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function smoothSide(ctx, side, moveFirst) {
    if (!side.length) return;
    if (moveFirst) ctx.moveTo(side[0].x, side[0].y);
    else ctx.lineTo(side[0].x, side[0].y);
    for (let i = 1; i < side.length - 1; i++) {
      const mx = (side[i].x + side[i + 1].x) / 2;
      const my = (side[i].y + side[i + 1].y) / 2;
      ctx.quadraticCurveTo(side[i].x, side[i].y, mx, my);
    }
    ctx.lineTo(side[side.length - 1].x, side[side.length - 1].y);
  }

  function widthFactor(p, taper) {
    const v = p === undefined ? 0.5 : geo.clamp(p, 0, 1);
    return (1 - taper) + v * taper;
  }

  /** Bleistift: deterministisches Korn entlang des Strichs. */
  function drawPencilGrain(ctx, pts, width) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < pts.length; i += 1) {
      const p = pts[i];
      const n = Math.max(1, Math.round(width / 2));
      for (let k = 0; k < n; k++) {
        const seed = hash2(p.x * 7.13 + k, p.y * 3.71 + i);
        const a = seed * Math.PI * 2;
        const r = ((seed * 97) % 1) * width * 0.5;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, width * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function hash2(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function applyLineStyle(ctx, sh) {
    if (sh.lineStyle === 'dashed') ctx.setLineDash([sh.width * 2.6, sh.width * 1.9]);
    else if (sh.lineStyle === 'dotted') {
      ctx.setLineDash([0.01, sh.width * 2.1]);
      ctx.lineCap = 'round';
    } else ctx.setLineDash([]);
  }

  function polygonPath(ctx, verts, radius) {
    const n = verts.length;
    if (n < 2) return;
    if (!radius) {
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(verts[i].x, verts[i].y);
      ctx.closePath();
      return;
    }
    for (let i = 0; i < n; i++) {
      const prev = verts[(i - 1 + n) % n];
      const cur = verts[i];
      const next = verts[(i + 1) % n];
      const a = trim(cur, prev, radius);
      const b = trim(cur, next, radius);
      if (i === 0) ctx.moveTo(a.x, a.y);
      else ctx.lineTo(a.x, a.y);
      ctx.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
    }
    ctx.closePath();
  }

  function trim(from, toward, r) {
    const dx = toward.x - from.x;
    const dy = toward.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(r, len / 2) / len;
    return { x: from.x + dx * k, y: from.y + dy * k };
  }

  function cornerRadiusFor(verts) {
    let min = Infinity;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      min = Math.min(min, geo.dist(a.x, a.y, b.x, b.y));
    }
    return Math.min(6, min / 4);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
  }

  function calloutPath(ctx, x, y, w, h, r) {
    const tail = Math.min(18, w / 4);
    roundRectPath(ctx, x, y, w, h, r);
    ctx.moveTo(x + tail, y + h);
    ctx.lineTo(x + tail * 0.4, y + h + tail * 0.8);
    ctx.lineTo(x + tail * 1.9, y + h);
    ctx.closePath();
  }

  /** Klebeband mit gerissenen Kanten links und rechts. */
  function tornRectPath(ctx, x, y, w, h) {
    const teeth = Math.max(3, Math.round(h / 7));
    ctx.moveTo(x, y);
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth;
      ctx.lineTo(x + (i % 2 ? 3.5 : 0), y + t * h);
    }
    ctx.lineTo(x + w, y + h);
    for (let i = teeth; i >= 0; i--) {
      const t = i / teeth;
      ctx.lineTo(x + w - (i % 2 ? 3.5 : 0), y + t * h);
    }
    ctx.closePath();
  }

  function fontString(t) {
    const fam = FONTS[t.fontFamily] || FONTS.system;
    return `${t.italic ? 'italic ' : ''}${t.bold ? '650' : '400'} ${t.fontSize}px ${fam}`;
  }

  function wrapText(ctx, text, maxWidth) {
    const out = [];
    for (const paragraph of String(text).split('\n')) {
      if (!paragraph) {
        out.push('');
        continue;
      }
      const words = paragraph.split(/(\s+)/);
      let line = '';
      for (const word of words) {
        const test = line + word;
        if (ctx.measureText(test).width > maxWidth && line.trim()) {
          out.push(line.replace(/\s+$/, ''));
          line = word.replace(/^\s+/, '');
        } else {
          line = test;
        }
      }
      out.push(line);
    }
    return out;
  }

  /* Farb-Hilfen */

  function parseHex(hex) {
    let h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  function withAlpha(color, a) {
    const c = parseHex(color);
    if (!c) return color;
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  function shade(color, amount) {
    const c = parseHex(color);
    if (!c) return color;
    const f = (v) => Math.round(geo.clamp(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount, 0, 255));
    return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
  }

  /** Schwarz oder Weiß — je nachdem, was auf der Fläche besser lesbar ist. */
  function readableInk(bg) {
    const c = parseHex(bg);
    if (!c) return '#000000';
    const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    return lum > 0.6 ? '#1C1C1E' : '#FFFFFF';
  }

  /* ── Tinte auf dunklem Blatt ─────────────────────────────────────────── */

  /** Relative Luminanz nach WCAG 2.x. */
  function relLuminance(c) {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function contrastRatio(a, b) {
    const l1 = relLuminance(a);
    const l2 = relLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function rgbToHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (mx + mn) / 2;
    return { h, s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  }

  const inkCache = new Map();

  /** Anzeigefarbe einer Tinte auf dem dunklen Blatt. Zu dunkle Farben werden
   *  an der Helligkeitsmitte gespiegelt, alles Farbige bleibt, wie es ist.
   *  Der Vorrat ist klein und die Rechnung nie nötig, solange nichts Neues
   *  auftaucht — daher der Cache. Schwelle und Zahlen: Block „Dunkles Blatt". */
  function displayInk(color) {
    if (typeof color !== 'string') return color;
    const cached = inkCache.get(color);
    if (cached !== undefined) return cached;

    let out = color;
    const c = parseHex(color);
    const bg = parseHex(PAPER.dark.bg);
    if (c && contrastRatio(c, bg) < INK_FLIP_BELOW) {
      const hsl = rgbToHsl(c);
      let l = 1 - hsl.l;
      let rgb = hslToRgb(hsl.h, hsl.s, l);
      while (l < 1 && contrastRatio(rgb, bg) < INK_TARGET) {
        l = Math.min(1, l + 0.02);
        rgb = hslToRgb(hsl.h, hsl.s, l);
      }
      out = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }
    inkCache.set(color, out);
    return out;
  }

  /* Das Design steht im Wurzelelement; ohne Stempel gilt das System des
   * Betrachters. Gepuffert, weil pro Objekt und Bild abgefragt — applyTheme
   * räumt den Puffer über clearVarCache() mit ab. */
  let darkTheme = null;
  function isDarkTheme() {
    if (darkTheme === null) {
      const stamped = document.documentElement.getAttribute('data-theme');
      darkTheme = stamped === 'dark'
        || (stamped !== 'light' && !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches));
    }
    return darkTheme;
  }

  let varCache = {};
  function cssVar(name, fallback) {
    if (varCache[name] === undefined) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      varCache[name] = v || fallback;
    }
    return varCache[name];
  }
  function clearVarCache() {
    varCache = {};
    darkTheme = null;
  }

  GN.Renderer = Renderer;
  GN.render = {
    FONTS, PAPER, ZOOM_STOPS, MIN_SCALE, MAX_SCALE,
    fontString, wrapText, roundRectPath, withAlpha, shade, readableInk, parseHex, clearVarCache,
    displayInk, relLuminance, contrastRatio,
  };
})(window);
