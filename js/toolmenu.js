/* ============================================================================
 * toolmenu.js — Zeile C: das schwebende Werkzeugmenü
 *
 * Baut für jedes Werkzeug die Kapsel mit seinen Kontextoptionen und stellt die
 * zugehörigen Popovers bereit. Die Kapsel lässt sich am Griff an alle vier
 * Bildschirmränder ziehen; links und rechts klappt sie auf vertikal um.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const el = GN.el;
  const iconSpan = GN.iconSpan;
  const pop = GN.popover;
  const T = GN.tools;

  class ToolMenu {
    constructor(app) {
      this.app = app;
      this.ctrl = app.ctrl;
      this.node = document.getElementById('toolMenu');
      this.body = document.getElementById('toolMenuBody');
      this.grip = document.getElementById('toolMenuGrip');
      this.dock = 'top';
      this.collapsed = false;
      this.showRuler = false;
      this.bindGrip();
      keepFocus(this.node);
    }

    /** Zweiter Tipp auf das aktive Werkzeug klappt die Kapsel ein bzw. aus. */
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      this.render();
    }

    /* ── Andocken ─────────────────────────────────────────────────────── */

    bindGrip() {
      let dragging = false;
      this.grip.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dragging = true;
        this.grip.setPointerCapture(e.pointerId);
        this.node.classList.add('is-dragging');
      });
      this.grip.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const wrap = document.getElementById('canvasWrap').getBoundingClientRect();
        const rx = (e.clientX - wrap.left) / wrap.width;
        const ry = (e.clientY - wrap.top) / wrap.height;
        // Der nächstgelegene Rand gewinnt
        const d = { left: rx, right: 1 - rx, top: ry, bottom: 1 - ry };
        const dock = Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b));
        if (dock !== this.dock) this.setDock(dock);
      });
      const end = (e) => {
        if (!dragging) return;
        dragging = false;
        this.node.classList.remove('is-dragging');
        if (this.grip.hasPointerCapture && this.grip.hasPointerCapture(e.pointerId)) {
          this.grip.releasePointerCapture(e.pointerId);
        }
      };
      this.grip.addEventListener('pointerup', end);
      this.grip.addEventListener('pointercancel', end);
    }

    setDock(dock) {
      this.dock = dock;
      this.node.dataset.dock = dock;
      this.render();
    }

    /* ── Aufbau ───────────────────────────────────────────────────────── */

    render() {
      // Das Lineal ist ein Umschalter und ändert das aktive Werkzeug nicht;
      // solange es sichtbar ist und zuletzt angetippt wurde, zeigt die Kapsel
      // seine Optionen.
      const tool = this.showRuler && this.ctrl.settings.ruler.visible ? 'ruler' : this.ctrl.active;
      const build = BUILDERS[tool];
      this.body.innerHTML = '';
      if (!build || this.collapsed) {
        this.node.hidden = true;
        return;
      }
      this.node.hidden = false;
      build.call(this, this.body);
    }

    /* ── Wiederkehrende Bausteine ─────────────────────────────────────── */

    sep() {
      return el('span', { class: 'hairline-v' });
    }

    group(children) {
      return el('div', { class: 'tm-group' }, children.filter(Boolean));
    }

    /**
     * Drei Stärke-Slots. Erneuter Tipp auf den aktiven Slot öffnet den Slider.
     * `display` bildet die Weltbreite auf den Anzeigedurchmesser ab.
     */
    thickness(set, cfg) {
      const kids = set.presets.map((w, i) => {
        const size = Math.max(4, Math.min(16, cfg.display(w)));
        const btn = el('button', {
          type: 'button',
          class: 'thick-slot' + (set.preset === i ? ' is-on' : ''),
          title: `${fmt(w)} — erneut tippen zum Anpassen`,
          style: `color:${cfg.color || 'var(--label)'}`,
          onclick: () => {
            if (set.preset === i) this.openThicknessSlider(set, i, btn, cfg);
            else {
              set.preset = i;
              this.render();
              this.app.render();
            }
          },
        }, [el('i', { style: `width:${size}px;height:${size}px` })]);
        return btn;
      });
      return this.group(kids);
    }

    openThicknessSlider(set, index, anchor, cfg) {
      pop.open({
        key: 'thickness',
        anchor,
        content: pop.menu([
          { title: cfg.title || 'Stärke' },
          {
            node: pop.slider({
              min: cfg.min, max: cfg.max, step: cfg.step || 0.1,
              value: set.presets[index],
              format: (v) => fmt(v, cfg.unit),
              onInput: (v) => {
                set.presets[index] = v;
                this.render();
                this.app.render();
              },
            }),
          },
        ]),
      });
    }

    /** Drei Farb-Slots plus „+" für den Farbwähler. */
    colors(set, cfg) {
      const kids = set.favorites.map((color, i) =>
        el('button', {
          type: 'button',
          class: 'color-slot' + (same(color, set.color) ? ' is-on' : ''),
          title: color,
          onclick: (e) => {
            if (same(color, set.color)) this.openColorPicker(set, e.currentTarget, cfg, i);
            else {
              set.color = color;
              this.afterColor(cfg);
            }
          },
        }, [el('i', { style: `background:${color}` })])
      );
      kids.push(
        el('button', {
          type: 'button',
          class: 'color-slot color-slot--add',
          title: 'Weitere Farben',
          onclick: (e) => this.openColorPicker(set, e.currentTarget, cfg, -1),
        }, [el('i')])
      );
      return this.group(kids);
    }

    openColorPicker(set, anchor, cfg, favIndex) {
      const conf = cfg || {};
      pop.open({
        key: 'color',
        anchor,
        className: 'popover--wide',
        content: pop.colorPicker({
          value: set.color,
          presets: conf.presets,
          allowOpacity: conf.allowOpacity,
          opacity: conf.opacity,
          onOpacity: conf.onOpacity,
          onChange: (c) => {
            set.color = c;
            if (favIndex >= 0) set.favorites[favIndex] = c;
            this.afterColor(conf);
          },
          onAddPreset: (c) => {
            if (!set.favorites.some((f) => same(f, c))) set.favorites = [c, set.favorites[0], set.favorites[1]];
            this.afterColor(conf);
          },
        }),
      });
    }

    afterColor(cfg) {
      this.render();
      this.app.chrome.syncTools();
      if (cfg && cfg.onChange) cfg.onChange();
      this.app.render();
    }

    chip(cfg) {
      return el('button', {
        type: 'button',
        class: 'chip',
        title: cfg.title || '',
        onclick: (e) => cfg.onClick(e.currentTarget),
      }, [
        cfg.preview ? el('span', { class: 'chip__preview', html: cfg.preview }) : null,
        cfg.icon ? iconSpan(cfg.icon, 'icon--18') : null,
        cfg.label ? el('span', { class: 'chip__label', text: cfg.label }) : null,
        cfg.chevron === false ? null : iconSpan('chevronDown', 'icon--14'),
      ].filter(Boolean));
    }

    toggle(cfg) {
      return el('button', {
        type: 'button',
        class: 'tm-toggle' + (cfg.on ? ' is-on' : ''),
        title: cfg.title || cfg.label || '',
        onclick: () => {
          cfg.onToggle();
          this.render();
          this.app.render();
        },
      }, [
        cfg.icon ? iconSpan(cfg.icon) : null,
        cfg.label ? el('span', { class: 'chip__label', text: cfg.label }) : null,
      ].filter(Boolean));
    }

    /* ── Popovers der Werkzeuge ───────────────────────────────────────── */

    openPenTypes(anchor) {
      const s = this.ctrl.settings.pen;
      pop.open({
        key: 'pentype',
        anchor,
        content: pop.menu(
          T.PEN_TYPES.map((t) => ({
            label: t.label,
            sub: t.hint,
            preview: penPreview(t.id, s.color),
            on: s.type === t.id,
            onClick: () => {
              s.type = t.id;
              this.render();
              this.app.render();
            },
          })).concat([
            '=',
            {
              switch: true,
              label: 'Druckempfindlichkeit',
              sub: 'Breite folgt Stiftdruck bzw. Tempo',
              on: s.pressure,
              onChange: (v) => { s.pressure = v; },
            },
            {
              node: pop.slider({
                label: 'Glättung',
                min: 0, max: 1, step: 0.05,
                value: s.smoothing,
                format: (v) => v.toFixed(2),
                onInput: (v) => { s.smoothing = v; },
              }),
            },
            {
              switch: true,
              label: 'Gerade Linien halten',
              sub: 'Am Ende kurz stehen bleiben begradigt den Strich',
              on: s.straight,
              onChange: (v) => { s.straight = v; },
            },
          ])
        ),
      });
    }

    openEraserOptions(anchor) {
      const s = this.ctrl.settings.eraser;
      pop.open({
        key: 'eraser',
        anchor,
        content: pop.menu([
          { title: 'Radierertyp' },
          ...T.ERASER_TYPES.map((t) => ({
            label: t.label + '-Radierer',
            sub: t.hint,
            icon: t.icon,
            on: s.type === t.id,
            onClick: () => {
              s.type = t.id;
              this.render();
            },
          })),
          '=',
          {
            node: pop.slider({
              label: 'Größe',
              min: 2, max: 64, step: 1,
              value: s.presets[s.preset],
              format: (v) => `${v} px`,
              onInput: (v) => {
                s.presets[s.preset] = v;
                this.render();
              },
            }),
          },
          '=',
          { switch: true, label: 'Nur Textmarker löschen', on: s.highlighterOnly, onChange: (v) => { s.highlighterOnly = v; this.render(); } },
          { switch: true, label: 'Bilder löschbar', on: s.eraseImages, onChange: (v) => { s.eraseImages = v; } },
        ]),
      });
    }

    openShapeOptions(anchor) {
      const s = this.ctrl.settings.shapes;
      pop.open({
        key: 'shapeopts',
        anchor,
        content: pop.menu([
          { title: 'Erkennungsmodus' },
          ...[
            ['immediate', 'Sofort', 'Form wird beim Absetzen umgewandelt'],
            ['hold', 'Nach kurzem Halten', 'Erst nach 350 ms Stillstand am Ende'],
            ['off', 'Aus', 'Zug bleibt freihändig'],
          ].map(([id, label, sub]) => ({
            label, sub,
            on: s.recognize === id,
            onClick: () => { s.recognize = id; this.render(); },
          })),
          '=',
          { title: 'Formen' },
          { switch: true, label: 'Ecken abrunden', on: s.rounded, onChange: (v) => { s.rounded = v; this.render(); this.app.render(); } },
          { switch: true, label: 'Am Raster ausrichten', sub: 'Eckpunkte auf 20 Einheiten runden', on: s.snapGrid, onChange: (v) => { s.snapGrid = v; } },
          { switch: true, label: 'Füllung', on: s.fill, onChange: (v) => { s.fill = v; this.render(); this.app.render(); } },
          {
            node: pop.slider({
              label: 'Deckkraft',
              min: 5, max: 100, step: 1,
              value: Math.round(s.fillOpacity * 100),
              format: (v) => `${v} %`,
              onInput: (v) => { s.fillOpacity = v / 100; },
            }),
          },
          '=',
          { label: 'Erkannt werden', sub: 'Linie, Pfeil, Rechteck, Quadrat, Kreis, Ellipse, Dreieck, Raute, Fünf- und Sechseck, Bogen', disabled: true },
        ]),
      });
    }

    openTapeOptions(anchor) {
      const s = this.ctrl.settings.tape;
      pop.open({
        key: 'tape',
        anchor,
        content: pop.menu([
          { title: 'Klebeband' },
          {
            node: (() => {
              const row = el('div', { class: 'pattern-row' });
              for (const p of T.TAPE_PATTERNS) {
                row.appendChild(
                  el('button', {
                    type: 'button',
                    class: 'pattern-chip' + (s.pattern === p.id ? ' is-on' : ''),
                    title: p.label,
                    style: patternPreviewStyle(p.id, s.color),
                    onclick: () => {
                      s.pattern = p.id;
                      this.render();
                      row.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.title === p.label));
                    },
                  })
                );
              }
              return row;
            })(),
          },
          {
            node: pop.slider({
              label: 'Breite', min: 8, max: 120, step: 1, value: s.width,
              format: (v) => `${v} px`,
              onInput: (v) => { s.width = v; },
            }),
          },
          {
            node: pop.slider({
              label: 'Deckkraft', min: 30, max: 100, step: 1, value: Math.round(s.opacity * 100),
              format: (v) => `${v} %`,
              onInput: (v) => { s.opacity = v / 100; },
            }),
          },
        ]),
      });
    }

    openFontMenu(anchor) {
      const s = this.ctrl.settings.text;
      const rows = [];
      let group = null;
      for (const f of T.FONT_CHOICES) {
        if (f.group !== group) {
          group = f.group;
          rows.push({ title: group });
        }
        rows.push({
          label: f.label,
          on: s.fontFamily === f.id,
          // Jede Schrift zeigt sich in sich selbst.
          node: null,
          font: GN.render.FONTS[f.id],
          onClick: () => {
            s.fontFamily = f.id;
            this.render();
            this.app.applyTextStyle();
          },
        });
      }
      const content = pop.menu(rows);
      // Beschriftungen in der jeweiligen Schrift setzen
      const labels = content.querySelectorAll('.row__label');
      const fonts = rows.filter((r) => r.font).map((r) => r.font);
      labels.forEach((n, i) => {
        if (fonts[i]) n.style.fontFamily = fonts[i];
      });
      pop.open({ key: 'font', anchor, content });
    }

    openLineSpacing(anchor) {
      const s = this.ctrl.settings.text;
      pop.open({
        key: 'linespacing',
        anchor,
        content: pop.menu(
          [{ title: 'Zeilenabstand' }].concat(
            T.LINE_SPACINGS.map((v) => ({
              label: v.toFixed(2).replace(/0$/, '').replace(/\.$/, ''),
              on: Math.abs(s.lineSpacing - v) < 0.001,
              onClick: () => {
                s.lineSpacing = v;
                this.render();
                this.app.applyTextStyle();
              },
            }))
          )
        ),
      });
    }

    openBoxStyle(anchor) {
      const s = this.ctrl.settings.text;
      pop.open({
        key: 'boxstyle',
        anchor,
        content: pop.menu(
          [{ title: 'Textfeldstil' }].concat(
            T.BOX_STYLES.map((b) => ({
              label: b.label,
              on: s.boxStyle === b.id,
              onClick: () => {
                s.boxStyle = b.id;
                this.render();
                this.app.applyTextStyle();
              },
            }))
          )
        ),
      });
    }

    openStickerPanel(anchor) {
      const s = this.ctrl.settings.elements;
      const grid = el('div', { class: 'sticker-grid' });
      for (const g of T.STICKERS) {
        grid.appendChild(
          el('button', {
            type: 'button',
            class: s.glyph === g ? 'is-on' : '',
            text: g,
            onclick: () => {
              s.glyph = g;
              this.render();
              grid.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.textContent === g));
            },
          })
        );
      }
      pop.open({
        key: 'stickers',
        anchor,
        content: el('div', {}, [
          el('div', { class: 'pop-header', text: 'Elemente' }),
          grid,
          el('div', { class: 'pop-sep' }),
          pop.slider({
            label: 'Größe', min: 24, max: 220, step: 2, value: s.size,
            format: (v) => `${v} px`,
            onInput: (v) => { s.size = v; },
          }),
        ]),
      });
    }

    openLaserTrail(anchor) {
      const s = this.ctrl.settings.laser;
      pop.open({
        key: 'lasertrail',
        anchor,
        content: pop.menu([
          { title: 'Spur' },
          { label: 'Verblassend', sub: 'Verschwindet nach 1,2 Sekunden', on: s.trail === 'fade', onClick: () => { s.trail = 'fade'; this.render(); } },
          { label: 'Bleibend', sub: 'Bleibt bis zum nächsten Antippen', on: s.trail === 'persist', onClick: () => { s.trail = 'persist'; this.render(); } },
          { label: 'Nur Punkt', sub: 'Keine Spur', on: s.trail === 'dot', onClick: () => { s.trail = 'dot'; this.render(); } },
        ]),
      });
    }
  }

  /* ── Menüaufbau je Werkzeug ──────────────────────────────────────────── */

  const BUILDERS = {
    pen(box) {
      const s = this.ctrl.settings.pen;
      const type = T.PEN_TYPES.find((t) => t.id === s.type);
      box.appendChild(this.chip({
        preview: penPreview(s.type, s.color),
        label: type.label,
        title: 'Stiftart',
        onClick: (a) => this.openPenTypes(a),
      }));
      box.appendChild(this.sep());
      box.appendChild(this.thickness(s, { display: (w) => 2 + w * 1.6, min: 0.5, max: 24, title: 'Stiftstärke', color: s.color }));
      box.appendChild(this.sep());
      box.appendChild(this.colors(s, {}));
      box.appendChild(this.sep());
      box.appendChild(this.chip({ icon: 'customize', title: 'Stifteinstellungen', onClick: (a) => this.openPenTypes(a), chevron: false }));
    },

    eraser(box) {
      const s = this.ctrl.settings.eraser;
      box.appendChild(
        pop.segmented(
          T.ERASER_TYPES.map((t) => ({ id: t.id, icon: t.icon, title: t.label + '-Radierer' })),
          s.type,
          (id) => { s.type = id; }
        )
      );
      box.appendChild(this.sep());
      box.appendChild(this.thickness(s, { display: (w) => 3 + w / 2.6, min: 2, max: 64, step: 1, unit: 'px', title: 'Radierergröße' }));
      box.appendChild(this.sep());
      box.appendChild(this.toggle({
        label: 'Nur Textmarker',
        on: s.highlighterOnly,
        onToggle: () => { s.highlighterOnly = !s.highlighterOnly; },
      }));
      box.appendChild(this.sep());
      box.appendChild(el('button', {
        type: 'button', class: 'tm-danger', text: 'Board leeren',
        onclick: () => this.app.confirmClear(),
      }));
      box.appendChild(this.chip({ icon: 'customize', title: 'Radiereroptionen', onClick: (a) => this.openEraserOptions(a), chevron: false }));
    },

    highlighter(box) {
      const s = this.ctrl.settings.highlighter;
      box.appendChild(this.thickness(s, { display: (w) => 3 + w / 2.8, min: 4, max: 60, title: 'Markerstärke', color: s.color }));
      box.appendChild(this.sep());
      box.appendChild(this.colors(s, {
        presets: pop.HIGHLIGHT_PRESETS,
      }));
      box.appendChild(this.sep());
      box.appendChild(this.toggle({
        icon: 'straightLine', label: 'Gerade', title: 'Gerade Linien',
        on: s.straight,
        onToggle: () => { s.straight = !s.straight; },
      }));
      box.appendChild(this.toggle({
        icon: 'drawBehind', label: 'Dahinter', title: 'Unter der Tinte zeichnen',
        on: s.behind,
        onToggle: () => { s.behind = !s.behind; },
      }));
    },

    tape(box) {
      const s = this.ctrl.settings.tape;
      const row = el('div', { class: 'tm-group' });
      for (const p of T.TAPE_PATTERNS) {
        row.appendChild(
          el('button', {
            type: 'button',
            class: 'pattern-chip' + (s.pattern === p.id ? ' is-on' : ''),
            title: p.label,
            style: patternPreviewStyle(p.id, s.color) + ';margin:0 2px',
            onclick: () => {
              s.pattern = p.id;
              this.render();
            },
          })
        );
      }
      box.appendChild(row);
      box.appendChild(this.sep());
      box.appendChild(this.colors(s, { presets: pop.TAPE_PRESETS }));
      box.appendChild(this.sep());
      box.appendChild(this.chip({ icon: 'customize', label: `${s.width} px`, title: 'Breite und Deckkraft', onClick: (a) => this.openTapeOptions(a) }));
    },

    shapes(box) {
      const s = this.ctrl.settings.shapes;
      box.appendChild(this.toggle({
        icon: 'filterShape', label: 'Füllung', title: 'Form füllen',
        on: s.fill,
        onToggle: () => { s.fill = !s.fill; },
      }));
      if (s.fill) {
        box.appendChild(
          el('button', {
            type: 'button', class: 'color-slot', title: 'Füllfarbe',
            onclick: (e) => {
              pop.open({
                key: 'fillcolor',
                anchor: e.currentTarget,
                className: 'popover--wide',
                content: pop.colorPicker({
                  value: s.fillColor,
                  allowOpacity: true,
                  opacity: s.fillOpacity,
                  onOpacity: (v) => { s.fillOpacity = v; this.app.render(); },
                  onChange: (c) => { s.fillColor = c; this.render(); this.app.render(); },
                }),
              });
            },
          }, [el('i', { style: `background:${s.fillColor}` })])
        );
      }
      box.appendChild(this.sep());
      box.appendChild(
        pop.segmented(
          [
            { id: 'solid', icon: 'lineSolid', title: 'Durchgezogen' },
            { id: 'dashed', icon: 'lineDashed', title: 'Gestrichelt' },
            { id: 'dotted', icon: 'lineDotted', title: 'Gepunktet' },
          ],
          s.lineStyle,
          (id) => { s.lineStyle = id; }
        )
      );
      box.appendChild(this.sep());
      box.appendChild(this.thickness(s, { display: (w) => 3 + w * 1.4, min: 0.5, max: 24, title: 'Linienstärke', color: s.color }));
      box.appendChild(this.sep());
      box.appendChild(this.colors(s, {}));
      box.appendChild(this.sep());
      box.appendChild(this.toggle({
        icon: 'cornerRound', label: 'Ecken', title: 'Ecken abrunden',
        on: s.rounded,
        onToggle: () => { s.rounded = !s.rounded; },
      }));
      box.appendChild(this.chip({ icon: 'customize', title: 'Formoptionen', onClick: (a) => this.openShapeOptions(a), chevron: false }));
    },

    lasso(box) {
      const s = this.ctrl.settings.lasso;
      box.appendChild(
        pop.segmented(
          [{ id: 'free', icon: 'lassoFree', title: 'Freihand' }, { id: 'rect', icon: 'lassoRect', title: 'Rechteck' }],
          s.type,
          (id) => { s.type = id; }
        )
      );
      box.appendChild(this.sep());
      const filters = el('div', { class: 'tm-group' });
      for (const f of T.LASSO_FILTERS) {
        filters.appendChild(this.toggle({
          icon: f.icon,
          title: f.label,
          on: s.filters[f.id],
          onToggle: () => { s.filters[f.id] = !s.filters[f.id]; },
        }));
      }
      box.appendChild(filters);
      if (this.ctrl.selection && this.ctrl.selection.ids.size) {
        box.appendChild(this.sep());
        box.appendChild(el('span', { class: 'tm-hint', text: `${this.ctrl.selection.ids.size} ausgewählt` }));
      }
    },

    text(box) {
      const s = this.ctrl.settings.text;
      const font = T.FONT_CHOICES.find((f) => f.id === s.fontFamily);
      box.appendChild(this.chip({ label: font.label, title: 'Schriftart', onClick: (a) => this.openFontMenu(a) }));
      box.appendChild(this.sep());

      const sizeField = el('input', {
        type: 'text', value: String(s.fontSize), inputmode: 'numeric',
        onkeydown: (e) => e.stopPropagation(),
        oninput: (e) => {
          const v = parseInt(e.target.value, 10);
          if (v >= 8 && v <= 144) {
            s.fontSize = v;
            this.app.applyTextStyle();
          }
        },
      });
      const bump = (dir) => {
        const step = s.fontSize < 24 ? 1 : s.fontSize < 48 ? 2 : 4;
        s.fontSize = Math.max(8, Math.min(144, s.fontSize + dir * step));
        sizeField.value = String(s.fontSize);
        this.app.applyTextStyle();
      };
      box.appendChild(el('div', { class: 'stepper' }, [
        el('button', { type: 'button', text: 'A−', title: 'Kleiner', onclick: () => bump(-1) }),
        sizeField,
        el('button', { type: 'button', text: 'A+', title: 'Größer', onclick: () => bump(1) }),
      ]));

      box.appendChild(this.sep());
      const style = el('div', { class: 'tm-group' });
      for (const [key, icon, title] of [
        ['bold', 'bold', 'Fett'], ['italic', 'italic', 'Kursiv'],
        ['underline', 'underline', 'Unterstrichen'], ['strike', 'strike', 'Durchgestrichen'],
      ]) {
        style.appendChild(this.toggle({
          icon, title,
          on: s[key],
          onToggle: () => { s[key] = !s[key]; this.app.applyTextStyle(); },
        }));
      }
      box.appendChild(style);

      box.appendChild(this.sep());
      box.appendChild(this.colors(s, { onChange: () => this.app.applyTextStyle() }));

      box.appendChild(this.sep());
      box.appendChild(
        pop.segmented(
          [
            { id: 'left', icon: 'alignLeft', title: 'Linksbündig' },
            { id: 'center', icon: 'alignCenter', title: 'Zentriert' },
            { id: 'right', icon: 'alignRight', title: 'Rechtsbündig' },
            { id: 'justify', icon: 'alignJustify', title: 'Blocksatz' },
          ],
          s.align,
          (id) => { s.align = id; this.app.applyTextStyle(); }
        )
      );

      box.appendChild(this.sep());
      box.appendChild(this.chip({
        icon: 'lineSpacing',
        label: String(s.lineSpacing).replace('.', ','),
        title: 'Zeilenabstand',
        onClick: (a) => this.openLineSpacing(a),
      }));
      box.appendChild(this.chip({
        icon: 'boxStyle',
        title: 'Textfeldstil',
        onClick: (a) => this.openBoxStyle(a),
      }));
      box.appendChild(this.toggle({
        icon: 'pin', title: 'Textwerkzeug angeheftet halten',
        on: s.pinned,
        onToggle: () => { s.pinned = !s.pinned; },
      }));
    },

    elements(box) {
      const s = this.ctrl.settings.elements;
      box.appendChild(this.chip({
        label: s.glyph,
        title: 'Element wählen',
        onClick: (a) => this.openStickerPanel(a),
      }));
      box.appendChild(this.sep());
      const quick = el('div', { class: 'tm-group' });
      for (const g of T.STICKERS.slice(0, 10)) {
        quick.appendChild(
          el('button', {
            type: 'button',
            class: 'tm-toggle' + (s.glyph === g ? ' is-on' : ''),
            style: 'font-size:18px',
            text: g,
            title: 'Element ' + g,
            onclick: () => {
              s.glyph = g;
              this.render();
            },
          })
        );
      }
      box.appendChild(quick);
      box.appendChild(this.sep());
      box.appendChild(el('span', { class: 'tm-hint', text: 'Auf die Fläche tippen zum Platzieren' }));
    },

    laser(box) {
      const s = this.ctrl.settings.laser;
      box.appendChild(this.colors(s, { presets: ['#FF3B30', '#00A99D', '#FFCC00', '#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#FFFFFF', '#000000', '#8E8E93', '#FF6BAA', '#66D9E8', '#C0EB75'] }));
      box.appendChild(this.sep());
      box.appendChild(this.chip({
        label: { fade: 'Verblassend', persist: 'Bleibend', dot: 'Nur Punkt' }[s.trail],
        title: 'Spurverhalten',
        onClick: (a) => this.openLaserTrail(a),
      }));
    },

    ruler(box) {
      const s = this.ctrl.settings.ruler;
      box.appendChild(
        pop.segmented(
          [{ id: 'straight', icon: 'rulerStraight', title: 'Lineal' }, { id: 'protractor', icon: 'rulerProtractor', title: 'Winkelmesser' }],
          s.type,
          (id) => { s.type = id; this.app.render(); }
        )
      );
      box.appendChild(this.sep());
      box.appendChild(this.chip({
        label: `${Math.round(s.angle)}°`,
        title: 'Winkel',
        onClick: (a) => {
          pop.open({
            key: 'rulerangle',
            anchor: a,
            content: pop.menu([
              { title: 'Winkel' },
              {
                node: pop.slider({
                  min: 0, max: 180, step: 1, value: s.angle,
                  format: (v) => `${v}°`,
                  onInput: (v) => { s.angle = v; this.render(); this.app.render(); },
                }),
              },
              '-',
              ...[0, 15, 30, 45, 60, 75, 90].map((deg) => ({
                label: `${deg}°`,
                on: Math.round(s.angle) === deg,
                onClick: () => { s.angle = deg; this.render(); this.app.render(); },
              })),
            ]),
          });
        },
      }));
      box.appendChild(this.toggle({
        label: 'Einrasten',
        on: s.snap,
        onToggle: () => { s.snap = !s.snap; },
      }));
      box.appendChild(this.sep());
      box.appendChild(el('button', {
        type: 'button', class: 'tm-danger', text: 'Ausblenden',
        onclick: () => this.app.toggleRuler(false),
      }));
    },
  };

  /* ── Vorschauen ──────────────────────────────────────────────────────── */

  function penPreview(type, color) {
    const c = color || '#000';
    const shapes = {
      fountain: `<path d="M1 9 C6 9 8 3 13 3 S20 8 25 5" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="1.2"/>
                 <path d="M1 9.6 C6 9.6 8 4.6 13 4.6 S20 8.8 25 5.7" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="2.6"/>`,
      ball: `<path d="M1 8 C7 8 9 4 14 4 S20 8 25 6" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="1.6"/>`,
      brush: `<path d="M1 9 C7 9 8 2.5 14 2.5 S20 9 25 6.5" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="4.2"/>`,
      pencil: `<path d="M1 8.5 C7 8.5 9 4 14 4 S20 8 25 6" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="2" opacity=".85" stroke-dasharray="0.6 1.1"/>
               <path d="M1 8.5 C7 8.5 9 4 14 4 S20 8 25 6" stroke="${c}" fill="none" stroke-linecap="round" stroke-width="1.1" opacity=".6"/>`,
    };
    return `<svg viewBox="0 0 26 12" aria-hidden="true">${shapes[type] || shapes.ball}</svg>`;
  }

  function patternPreviewStyle(pattern, color) {
    const base = `background-color:${color}`;
    switch (pattern) {
      case 'stripes':
        return `${base};background-image:repeating-linear-gradient(45deg, rgba(0,0,0,.14) 0 3px, transparent 3px 7px)`;
      case 'dots':
        return `${base};background-image:radial-gradient(circle, rgba(0,0,0,.20) 1.2px, transparent 1.4px);background-size:7px 7px`;
      case 'grid':
        return `${base};background-image:linear-gradient(rgba(0,0,0,.16) 1px, transparent 1px),linear-gradient(90deg, rgba(0,0,0,.16) 1px, transparent 1px);background-size:7px 7px`;
      case 'torn':
        return `${base};clip-path:polygon(0 0,100% 0,100% 100%,0 100%);background-image:repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, transparent 2px 5px)`;
      default:
        return base;
    }
  }

  /**
   * Verhindert, dass ein Klick auf die Kapsel den Fokus aus einem offenen
   * Textfeld zieht. Ohne das schließt sich der Texteditor, bevor die
   * Stiländerung ihn erreicht — die Textoptionen blieben wirkungslos.
   * Eingabefelder in der Kapsel selbst bleiben ausgenommen.
   */
  function keepFocus(node) {
    node.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    });
  }

  function fmt(v, unit) {
    if (unit === 'px') return `${Math.round(v)} px`;
    return `${Number(v).toFixed(1).replace('.', ',')} pt`;
  }

  const same = (a, b) => String(a).toUpperCase() === String(b).toUpperCase();

  GN.ToolMenu = ToolMenu;
  GN.penPreview = penPreview;
})(window);
