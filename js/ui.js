/* ============================================================================
 * ui.js — Aufbau der Leisten, Optionen und Menüs
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const el = GN.el;
  const pop = GN.popover;
  const T = GN.tools;

  class UI {
    constructor(app) {
      this.app = app;
      this.ctrl = app.ctrl;
      this.doc = app.doc;
      this.toolList = document.getElementById('toolList');
      this.optionsEl = document.getElementById('toolOptions');
      this.appEl = document.getElementById('app');
      this.selbar = null;
      this.buildTools();
    }

    /* ── Werkzeugleiste ───────────────────────────────────────────────── */

    buildTools() {
      this.toolList.innerHTML = '';
      for (const tool of T.TOOLS) {
        const btn = el('button', {
          class: 'tool',
          type: 'button',
          title: `${tool.label} (${tool.key})`,
          'aria-label': tool.label,
          'aria-pressed': 'false',
          dataset: { tool: tool.id },
          onclick: (e) => {
            if (this.ctrl.active === tool.id) this.openToolSettings(tool.id, btn);
            else this.ctrl.setTool(tool.id);
          },
        }, [el('span', { class: 'icon', html: GN.icon(tool.icon) })]);
        this.toolList.appendChild(btn);
      }
      this.syncTools();
    }

    syncTools() {
      const active = this.ctrl.active;
      const tint = this.ctrl.tintColor(active);
      this.appEl.dataset.tool = active;
      this.appEl.style.setProperty('--tool-tint', tint);
      this.toolList.querySelectorAll('.tool').forEach((btn) => {
        const id = btn.dataset.tool;
        const on = id === active;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const def = T.TOOLS.find((t) => t.id === id);
        btn.style.setProperty('--tint', def && def.tinted ? this.ctrl.tintColor(id) : '');
      });
    }

    /* ── Kontextoptionen ──────────────────────────────────────────────── */

    renderOptions() {
      const box = this.optionsEl;
      box.innerHTML = '';
      const build = this.optionBuilders[this.ctrl.active];
      if (build) build.call(this, box);
      this.syncTools();
    }

    get optionBuilders() {
      return OPTIONS;
    }

    /* Bausteine ------------------------------------------------------- */

    thicknessGroup(set, opts) {
      const group = el('div', { class: 'optgroup optgroup--boxed' });
      set.presets.forEach((w, i) => {
        const size = Math.max(3, Math.min(15, opts.display ? opts.display(w) : w));
        const btn = el('button', {
          class: 'thick' + (set.preset === i ? ' is-on' : ''),
          type: 'button',
          title: `${w.toFixed(1)} pt — erneut tippen zum Anpassen`,
          onclick: () => {
            if (set.preset === i) this.openThicknessEditor(set, i, btn, opts);
            else {
              set.preset = i;
              this.renderOptions();
              this.app.render();
            }
          },
        }, [el('i', { style: `width:${size}px;height:${size}px` })]);
        group.appendChild(btn);
      });
      return group;
    }

    openThicknessEditor(set, index, anchor, opts) {
      const min = opts.min || 0.5;
      const max = opts.max || 12;
      const content = pop.menu([
        { title: 'Stärke anpassen' },
        {
          node: pop.slider({
            label: 'Breite',
            min,
            max,
            step: 0.1,
            value: set.presets[index],
            format: (v) => `${v.toFixed(1)} pt`,
            onInput: (v) => {
              set.presets[index] = v;
              this.renderOptions();
              this.app.render();
            },
          }),
        },
      ]);
      pop.open({ key: 'thickness', anchor, content });
    }

    swatchRow(set, opts) {
      const row = el('div', { class: 'swatches' });
      const conf = opts || {};
      set.favorites.forEach((color, i) => {
        const btn = el('button', {
          class: 'swatch' + (sameColor(color, set.color) ? ' is-on' : ''),
          type: 'button',
          title: color,
          style: `background:${color}`,
          onclick: () => {
            if (sameColor(color, set.color)) this.openColorPicker(set, btn, conf, i);
            else {
              set.color = color;
              this.afterColorChange(conf);
            }
          },
        });
        row.appendChild(btn);
      });
      const add = el('button', {
        class: 'swatch swatch--add',
        type: 'button',
        title: 'Weitere Farben',
        onclick: () => this.openColorPicker(set, add, conf, -1),
      }, [el('span')]);
      row.appendChild(add);
      return row;
    }

    openColorPicker(set, anchor, conf, favIndex) {
      const content = pop.colorPicker({
        title: conf.title || 'Farbe',
        value: set.color,
        palette: conf.palette,
        onChange: (c) => {
          set.color = c;
          if (favIndex >= 0) set.favorites[favIndex] = c;
          else if (set.favorites.indexOf(c) === -1) {
            set.favorites = [c].concat(set.favorites.slice(0, 3));
          }
          this.afterColorChange(conf);
        },
      });
      pop.open({ key: 'color', anchor, content, autofocus: false });
    }

    afterColorChange(conf) {
      this.renderOptions();
      this.syncTools();
      if (conf && conf.onChange) conf.onChange();
      this.app.render();
    }

    menuButton(label, onOpen, iconName) {
      const btn = el('button', {
        class: 'optbtn optbtn--menu',
        type: 'button',
        onclick: () => onOpen(btn),
      }, [
        iconName ? el('span', { class: 'icon', html: GN.icon(iconName) }) : null,
        el('span', { text: label }),
        el('span', { class: 'icon icon--xs', html: GN.icon('chevronDown') }),
      ].filter(Boolean));
      return btn;
    }

    toggleButton(cfg) {
      return el('button', {
        class: 'optbtn' + (cfg.on ? ' is-on' : ''),
        type: 'button',
        title: cfg.title || cfg.label,
        onclick: () => {
          cfg.onToggle();
          this.renderOptions();
        },
      }, [
        cfg.icon ? el('span', { class: 'icon', html: GN.icon(cfg.icon) }) : null,
        cfg.label ? el('span', { text: cfg.label }) : null,
      ].filter(Boolean));
    }

    sep() {
      return el('span', { class: 'toolbar__divider' });
    }

    /* ── Werkzeug-Einstellungen (Doppeltipp auf aktives Werkzeug) ──────── */

    openToolSettings(toolId, anchor) {
      const s = this.ctrl.settings;
      switch (toolId) {
        case 'pen':
          pop.open({
            key: 'pentype',
            anchor,
            content: pop.menu(
              T.PEN_TYPES.map((t) => ({
                label: t.label,
                sub: t.hint,
                on: s.pen.type === t.id,
                onClick: () => {
                  s.pen.type = t.id;
                  this.renderOptions();
                },
              }))
            ),
          });
          break;
        case 'highlighter':
          pop.open({
            key: 'hlopts',
            anchor,
            content: pop.menu([
              {
                label: 'Gerade Linien',
                sub: 'Striche werden begradigt',
                icon: 'straight',
                on: s.highlighter.straight,
                onClick: () => {
                  s.highlighter.straight = !s.highlighter.straight;
                  this.renderOptions();
                },
              },
            ]),
          });
          break;
        case 'eraser':
          this.openEraserMenu(anchor);
          break;
        case 'shapes':
          this.openShapeMenu(anchor);
          break;
        case 'elements':
          this.openStickerMenu(anchor);
          break;
        case 'text':
          this.openFontMenu(anchor);
          break;
        default:
          break;
      }
    }

    openEraserMenu(anchor) {
      const s = this.ctrl.settings.eraser;
      pop.open({
        key: 'eraser',
        anchor,
        content: pop.menu([
          { title: 'Radierer' },
          {
            label: 'Ganze Striche löschen',
            on: s.wholeStroke,
            onClick: () => {
              s.wholeStroke = !s.wholeStroke;
              this.renderOptions();
            },
          },
          {
            label: 'Nur Textmarker löschen',
            on: s.highlighterOnly,
            onClick: () => {
              s.highlighterOnly = !s.highlighterOnly;
              this.renderOptions();
            },
          },
          '-',
          {
            label: 'Gesamte Fläche löschen',
            icon: 'trash',
            danger: true,
            onClick: () => this.app.clearAll(),
          },
        ]),
      });
    }

    openShapeMenu(anchor) {
      const s = this.ctrl.settings.shapes;
      pop.open({
        key: 'shape',
        anchor,
        content: pop.menu(
          [{ title: 'Form' }].concat(
            T.SHAPE_KINDS.map((k) => ({
              label: k.label,
              on: s.kind === k.id,
              onClick: () => {
                s.kind = k.id;
                this.renderOptions();
              },
            }))
          )
        ),
      });
    }

    openStickerMenu(anchor) {
      const s = this.ctrl.settings.elements;
      const grid = el('div', { class: 'stickergrid' });
      for (const g of T.STICKERS) {
        grid.appendChild(
          el('button', {
            type: 'button',
            class: s.glyph === g ? 'is-on' : '',
            text: g,
            onclick: () => {
              s.glyph = g;
              this.renderOptions();
              pop.close();
            },
          })
        );
      }
      const wrap = el('div', {}, [el('div', { class: 'popover__title', text: 'Elemente' }), grid]);
      wrap.appendChild(
        pop.slider({
          label: 'Größe',
          min: 24,
          max: 200,
          step: 2,
          value: s.size,
          format: (v) => `${v} px`,
          onInput: (v) => {
            s.size = v;
          },
        })
      );
      pop.open({ key: 'sticker', anchor, content: wrap, autofocus: false });
    }

    openFontMenu(anchor) {
      const s = this.ctrl.settings.text;
      pop.open({
        key: 'font',
        anchor,
        content: pop.menu(
          [{ title: 'Schrift' }].concat(
            T.FONT_CHOICES.map((f) => ({
              label: f.label,
              on: s.fontFamily === f.id,
              onClick: () => {
                s.fontFamily = f.id;
                this.renderOptions();
                this.app.applyTextStyleToSelection();
              },
            }))
          )
        ),
      });
    }

    /* ── Auswahl-Kontextleiste ────────────────────────────────────────── */

    updateSelectionBar() {
      const overlay = document.getElementById('overlay');
      if (this.selbar) {
        this.selbar.remove();
        this.selbar = null;
      }
      const sel = this.ctrl.selection;
      if (!sel || !sel.box || !sel.ids.size) return;

      const r = this.app.renderer;
      const a = r.toScreen(sel.box.x0, sel.box.y0);
      const b = r.toScreen(sel.box.x1, sel.box.y1);

      const bar = el('div', { class: 'selbar' }, [
        el('button', { type: 'button', onclick: () => this.app.cutSelection() }, [
          el('span', { class: 'icon', html: GN.icon('cut') }), el('span', { text: 'Ausschneiden' }),
        ]),
        el('button', { type: 'button', onclick: () => this.app.copySelection() }, [
          el('span', { class: 'icon', html: GN.icon('copy') }), el('span', { text: 'Kopieren' }),
        ]),
        el('button', { type: 'button', onclick: () => this.app.duplicateSelection() }, [
          el('span', { class: 'icon', html: GN.icon('duplicate') }), el('span', { text: 'Duplizieren' }),
        ]),
        el('span', { class: 'selbar__sep' }),
        el('button', {
          type: 'button',
          onclick: (e) => this.openSelectionColor(e.currentTarget),
        }, [el('span', { class: 'icon', html: GN.icon('palette') }), el('span', { text: 'Farbe' })]),
        el('span', { class: 'selbar__sep' }),
        el('button', { type: 'button', class: 'is-danger', onclick: () => this.app.deleteSelection() }, [
          el('span', { class: 'icon', html: GN.icon('trash') }), el('span', { text: 'Löschen' }),
        ]),
      ]);

      overlay.appendChild(bar);
      const cx = (a.x + b.x) / 2;
      const top = Math.max(bar.offsetHeight + 12, a.y - 14);
      bar.style.left = Math.round(Math.max(bar.offsetWidth / 2 + 8, Math.min(cx, r.width - bar.offsetWidth / 2 - 8))) + 'px';
      bar.style.top = Math.round(top) + 'px';
      this.selbar = bar;
    }

    openSelectionColor(anchor) {
      const first = this.app.firstSelectedItem();
      pop.open({
        key: 'selcolor',
        anchor,
        autofocus: false,
        content: pop.colorPicker({
          title: 'Farbe der Auswahl',
          value: (first && first.color) || '#1C1C1E',
          onChange: (c) => this.app.recolorSelection(c),
        }),
      });
    }

    /* ── Statusanzeigen ───────────────────────────────────────────────── */

    updateUndoRedo() {
      const u = document.querySelector('[data-action="undo"]');
      const r = document.querySelector('[data-action="redo"]');
      u.disabled = !this.doc.canUndo();
      r.disabled = !this.doc.canRedo();
    }

    updateZoom() {
      document.getElementById('zoomLabel').textContent = Math.round(this.app.renderer.cam.scale * 100) + ' %';
    }

    updateCount() {
      const n = this.doc.items.length;
      document.getElementById('objectCount').textContent =
        n === 0 ? 'Unendliche Fläche' : `${n} ${n === 1 ? 'Objekt' : 'Objekte'} · Unendliche Fläche`;
    }
  }

  /* ── Optionsleisten je Werkzeug ──────────────────────────────────────── */

  const OPTIONS = {
    pen(box) {
      const s = this.ctrl.settings.pen;
      const type = T.PEN_TYPES.find((t) => t.id === s.type);
      box.appendChild(this.menuButton(type.label, (a) => this.openToolSettings('pen', a)));
      box.appendChild(this.sep());
      box.appendChild(this.thicknessGroup(s, { display: (w) => 2.5 + w * 1.6, min: 0.4, max: 12 }));
      box.appendChild(this.sep());
      box.appendChild(this.swatchRow(s, { title: 'Stiftfarbe' }));
    },

    eraser(box) {
      const s = this.ctrl.settings.eraser;
      box.appendChild(this.thicknessGroup(s, { display: (w) => 3 + w / 4, min: 4, max: 90 }));
      box.appendChild(this.sep());
      box.appendChild(
        this.toggleButton({
          label: 'Ganze Striche',
          on: s.wholeStroke,
          onToggle: () => (s.wholeStroke = !s.wholeStroke),
        })
      );
      box.appendChild(
        this.toggleButton({
          label: 'Nur Textmarker',
          on: s.highlighterOnly,
          onToggle: () => (s.highlighterOnly = !s.highlighterOnly),
        })
      );
      box.appendChild(this.sep());
      box.appendChild(
        el('button', {
          class: 'optbtn',
          type: 'button',
          onclick: () => this.app.clearAll(),
        }, [el('span', { class: 'icon', html: GN.icon('trash') }), el('span', { text: 'Fläche löschen' })])
      );
    },

    highlighter(box) {
      const s = this.ctrl.settings.highlighter;
      box.appendChild(this.thicknessGroup(s, { display: (w) => 3 + w / 2.6, min: 4, max: 60 }));
      box.appendChild(this.sep());
      box.appendChild(this.swatchRow(s, { title: 'Markerfarbe', palette: HIGHLIGHT_PALETTE }));
      box.appendChild(this.sep());
      box.appendChild(
        this.toggleButton({
          icon: 'straight',
          label: 'Gerade Linien',
          on: s.straight,
          onToggle: () => (s.straight = !s.straight),
        })
      );
    },

    shapes(box) {
      const s = this.ctrl.settings.shapes;
      const kind = T.SHAPE_KINDS.find((k) => k.id === s.kind);
      box.appendChild(this.menuButton(kind.label, (a) => this.openShapeMenu(a)));
      box.appendChild(this.sep());
      const widths = { presets: [1.2, 2.4, 4.8], preset: [1.2, 2.4, 4.8].indexOf(s.width) === -1 ? 1 : [1.2, 2.4, 4.8].indexOf(s.width) };
      const group = el('div', { class: 'optgroup optgroup--boxed' });
      [1.2, 2.4, 4.8].forEach((w) => {
        const size = 3 + w * 1.7;
        group.appendChild(
          el('button', {
            class: 'thick' + (Math.abs(s.width - w) < 0.01 ? ' is-on' : ''),
            type: 'button',
            title: `${w} pt`,
            onclick: () => {
              s.width = w;
              this.renderOptions();
            },
          }, [el('i', { style: `width:${size}px;height:${size}px` })])
        );
      });
      box.appendChild(group);
      box.appendChild(this.sep());
      box.appendChild(this.swatchRow(s, { title: 'Formfarbe' }));
      box.appendChild(this.sep());
      box.appendChild(
        this.toggleButton({
          label: 'Gefüllt',
          on: !!s.fill,
          onToggle: () => {
            s.fill = s.fill ? null : hexWithAlpha(s.color, 0.18);
          },
        })
      );
      void widths;
    },

    lasso(box) {
      const sel = this.ctrl.selection;
      if (sel && sel.ids.size) {
        box.appendChild(el('span', { class: 'opthint', text: `${sel.ids.size} ausgewählt` }));
        box.appendChild(this.sep());
        box.appendChild(
          el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.duplicateSelection() }, [
            el('span', { class: 'icon', html: GN.icon('duplicate') }), el('span', { text: 'Duplizieren' }),
          ])
        );
        box.appendChild(
          el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.deleteSelection() }, [
            el('span', { class: 'icon', html: GN.icon('trash') }), el('span', { text: 'Löschen' }),
          ])
        );
        return;
      }
      box.appendChild(el('span', { class: 'opthint', text: 'Bereich umkreisen, um Objekte auszuwählen — dann ziehen, skalieren oder umfärben.' }));
    },

    text(box) {
      const s = this.ctrl.settings.text;
      const font = T.FONT_CHOICES.find((f) => f.id === s.fontFamily);
      box.appendChild(this.menuButton(font.label, (a) => this.openFontMenu(a)));
      box.appendChild(
        this.menuButton(`${s.fontSize} pt`, (a) => {
          pop.open({
            key: 'fontsize',
            anchor: a,
            autofocus: false,
            content: pop.menu([
              { title: 'Schriftgröße' },
              {
                node: pop.slider({
                  label: 'Größe',
                  min: 10,
                  max: 96,
                  step: 1,
                  value: s.fontSize,
                  format: (v) => `${v} pt`,
                  onInput: (v) => {
                    s.fontSize = v;
                    this.renderOptions();
                    this.app.applyTextStyleToSelection();
                  },
                }),
              },
            ]),
          });
        })
      );
      box.appendChild(this.sep());
      const style = el('div', { class: 'optgroup optgroup--boxed' });
      for (const [key, icon, title] of [['bold', 'bold', 'Fett'], ['italic', 'italic', 'Kursiv'], ['underline', 'underline', 'Unterstrichen']]) {
        style.appendChild(
          el('button', {
            class: 'optbtn' + (s[key] ? ' is-on' : ''),
            type: 'button',
            title,
            onclick: () => {
              s[key] = !s[key];
              this.renderOptions();
              this.app.applyTextStyleToSelection();
            },
          }, [el('span', { class: 'icon', html: GN.icon(icon) })])
        );
      }
      box.appendChild(style);
      box.appendChild(this.sep());
      const align = el('div', { class: 'optgroup optgroup--boxed' });
      for (const [val, icon, title] of [['left', 'alignLeft', 'Linksbündig'], ['center', 'alignCenter', 'Zentriert'], ['right', 'alignRight', 'Rechtsbündig']]) {
        align.appendChild(
          el('button', {
            class: 'optbtn' + (s.align === val ? ' is-on' : ''),
            type: 'button',
            title,
            onclick: () => {
              s.align = val;
              this.renderOptions();
              this.app.applyTextStyleToSelection();
            },
          }, [el('span', { class: 'icon', html: GN.icon(icon) })])
        );
      }
      box.appendChild(align);
      box.appendChild(this.sep());
      box.appendChild(this.swatchRow(s, { title: 'Textfarbe', onChange: () => this.app.applyTextStyleToSelection() }));
    },

    image(box) {
      box.appendChild(
        el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.requestImage(null) }, [
          el('span', { class: 'icon', html: GN.icon('image') }), el('span', { text: 'Bild wählen …' }),
        ])
      );
      box.appendChild(this.sep());
      box.appendChild(el('span', { class: 'opthint', text: 'Oder Datei auf die Fläche ziehen bzw. mit ⌘V einfügen.' }));
    },

    elements(box) {
      const s = this.ctrl.settings.elements;
      box.appendChild(
        el('button', {
          class: 'optbtn',
          type: 'button',
          style: 'font-size:19px',
          title: 'Element wählen',
          onclick: (e) => this.openStickerMenu(e.currentTarget),
        }, [el('span', { text: s.glyph }), el('span', { class: 'icon icon--xs', html: GN.icon('chevronDown') })])
      );
      box.appendChild(this.sep());
      const quick = el('div', { class: 'optgroup' });
      for (const g of T.STICKERS.slice(0, 8)) {
        quick.appendChild(
          el('button', {
            class: 'optbtn' + (s.glyph === g ? ' is-on' : ''),
            type: 'button',
            style: 'font-size:17px',
            text: g,
            onclick: () => {
              s.glyph = g;
              this.renderOptions();
            },
          })
        );
      }
      box.appendChild(quick);
      box.appendChild(this.sep());
      box.appendChild(el('span', { class: 'opthint', text: 'Auf die Fläche tippen zum Platzieren.' }));
    },

    laser(box) {
      box.appendChild(el('span', { class: 'opthint', text: 'Ziehen, um zu zeigen — die Spur verblasst nach kurzer Zeit. Nichts davon wird gespeichert.' }));
    },

    zoom(box) {
      box.appendChild(
        el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.renderer.zoomBy(1 / 1.4) }, [
          el('span', { class: 'icon', html: GN.icon('minus') }),
        ])
      );
      box.appendChild(
        el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.renderer.resetZoom() }, [el('span', { text: '100 %' })])
      );
      box.appendChild(
        el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.renderer.zoomBy(1.4) }, [
          el('span', { class: 'icon', html: GN.icon('plus') }),
        ])
      );
      box.appendChild(this.sep());
      box.appendChild(
        el('button', { class: 'optbtn', type: 'button', onclick: () => this.app.renderer.fitContent() }, [
          el('span', { class: 'icon', html: GN.icon('fit') }), el('span', { text: 'Einpassen' }),
        ])
      );
      box.appendChild(this.sep());
      box.appendChild(el('span', { class: 'opthint', text: 'Rahmen aufziehen, um einen Ausschnitt zu vergrößern.' }));
    },
  };

  const HIGHLIGHT_PALETTE = [
    '#FFE94D', '#FFD426', '#FFB067', '#FF9BD2', '#FF7A7A', '#C4A6FF', '#A0B4FF', '#7BD3FF',
    '#7CF6A4', '#B8F26B', '#FFF2A8', '#D6D6DB', '#FFC9C9', '#C9F7E5', '#E4D3FF', '#FFE0B5',
  ];

  function sameColor(a, b) {
    return String(a).toUpperCase() === String(b).toUpperCase();
  }

  function hexWithAlpha(hex, alpha) {
    const h = String(hex).replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  GN.UI = UI;
  GN.uiHelpers = { hexWithAlpha, HIGHLIGHT_PALETTE };
})(window);
