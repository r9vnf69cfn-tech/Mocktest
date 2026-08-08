/* ============================================================================
 * popovers.js — Popover-Chassis und iOS-artige Bausteine
 *
 * Es ist immer nur ein Popover offen (Ausnahme: angeheftete Panels). Es wird
 * am auslösenden Element ausgerichtet, klemmt am Viewport und schließt bei
 * Klick außerhalb, Escape oder erneutem Klick auf denselben Auslöser.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});

  /* ── Kleiner DOM-Baukasten ───────────────────────────────────────────── */

  const el = (tag, props, children) => {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    (children || []).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  const iconSpan = (name, cls) => el('span', { class: 'icon ' + (cls || ''), html: GN.icon(name) });

  /* ── Popover-Verwaltung ──────────────────────────────────────────────── */

  const layer = () => document.getElementById('popoverLayer');
  let current = null;

  function close() {
    if (!current) return;
    const { node, anchor, onClose } = current;
    current = null;
    node.remove();
    const host = layer();
    if (!host.children.length) host.hidden = true;
    if (anchor) anchor.classList.remove('is-on');
    if (onClose) onClose();
  }

  const isOpen = (key) => !!current && current.key === key;

  function open(opts) {
    const wasOpen = isOpen(opts.key);
    close();
    if (wasOpen) return null;

    const host = layer();
    host.hidden = false;

    const node = el('div', { class: 'popover glass-popover' + (opts.className ? ' ' + opts.className : ''), role: 'dialog' });
    // Klicks im Popover sollen den Fokus eines offenen Textfelds nicht stehlen
    // (sonst schließt sich der Texteditor, bevor die Änderung ihn erreicht).
    node.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'CANVAS')) return;
      e.preventDefault();
    });
    node.appendChild(opts.content);
    host.appendChild(node);
    position(node, opts.anchor, opts.placement);
    if (opts.anchor && opts.markAnchor !== false) opts.anchor.classList.add('is-on');

    current = { key: opts.key, node, anchor: opts.anchor, onClose: opts.onClose };

    if (opts.autofocus) {
      const f = node.querySelector('input, button, [tabindex]');
      if (f) setTimeout(() => f.focus({ preventScroll: true }), 0);
    }
    return node;
  }

  function position(node, anchor, placement) {
    const margin = 16;
    const rect = anchor
      ? anchor.getBoundingClientRect()
      : { left: innerWidth / 2, right: innerWidth / 2, top: 80, bottom: 80, width: 0, height: 0 };

    const w = node.offsetWidth;
    const h = node.offsetHeight;

    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(margin, Math.min(left, innerWidth - w - margin));

    let top = rect.bottom + 8;
    if (placement === 'above' || top + h > innerHeight - margin) {
      const above = rect.top - h - 8;
      top = above >= margin ? above : Math.max(margin, innerHeight - h - margin);
    }

    node.style.left = Math.round(left) + 'px';
    node.style.top = Math.round(top) + 'px';
    const originX = Math.round(Math.min(Math.max(rect.left + rect.width / 2 - left, 14), w - 14));
    node.style.transformOrigin = `${originX}px ${top > rect.top ? '0' : '100%'}`;
  }

  document.addEventListener('pointerdown', (e) => {
    if (!current) return;
    if (current.node.contains(e.target)) return;
    if (current.anchor && current.anchor.contains(e.target)) return;
    close();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      e.stopPropagation();
      close();
    }
  });

  global.addEventListener('resize', close);

  /* ── Zeilen und Menüs ────────────────────────────────────────────────── */

  /** Menüzeile: { label, sub, value, icon, preview, on, danger, hint, disabled, onClick, keepOpen } */
  function row(cfg) {
    const btn = el('button', {
      type: 'button',
      class: 'row' + (cfg.on ? ' is-on' : '') + (cfg.danger ? ' row--danger' : '') + (cfg.disabled ? ' row--disabled' : ''),
      onclick: (e) => {
        if (cfg.onClick) cfg.onClick(e);
        if (!cfg.keepOpen) close();
      },
    });
    if (cfg.preview) btn.appendChild(el('span', { class: 'row__preview', html: cfg.preview }));
    else if (cfg.icon) btn.appendChild(iconSpan(cfg.icon));

    const stack = el('span', { class: 'row__stack' }, [el('span', { class: 'row__label', text: cfg.label })]);
    if (cfg.sub) stack.appendChild(el('span', { class: 'row__sub', text: cfg.sub }));
    btn.appendChild(stack);

    if (cfg.value) btn.appendChild(el('span', { class: 'row__value', text: cfg.value }));
    if (cfg.hint) btn.appendChild(el('span', { class: 'row__value', text: cfg.hint }));
    if (cfg.on) btn.appendChild(iconSpan('check', 'row__check'));
    if (cfg.chevron) btn.appendChild(iconSpan('chevronRight', 'icon--14'));
    return btn;
  }

  /** Zeile mit iOS-Schalter rechts. */
  function switchRow(cfg) {
    const knob = el('span', { class: 'switch' + (cfg.on ? ' is-on' : '') });
    const btn = el('button', {
      type: 'button',
      class: 'row' + (cfg.disabled ? ' row--disabled' : ''),
      onclick: () => {
        const next = !knob.classList.contains('is-on');
        knob.classList.toggle('is-on', next);
        cfg.onChange(next);
      },
    }, [
      cfg.icon ? iconSpan(cfg.icon) : null,
      el('span', { class: 'row__stack' }, [
        el('span', { class: 'row__label', text: cfg.label }),
        cfg.sub ? el('span', { class: 'row__sub', text: cfg.sub }) : null,
      ].filter(Boolean)),
      knob,
    ].filter(Boolean));
    return btn;
  }

  function menu(items) {
    const wrap = el('div');
    for (const it of items) {
      if (it === '-') wrap.appendChild(el('div', { class: 'pop-sep' }));
      else if (it === '=') wrap.appendChild(el('div', { class: 'pop-block' }));
      else if (!it) continue;
      else if (it.title) wrap.appendChild(el('div', { class: 'pop-header', text: it.title }));
      else if (it.node) wrap.appendChild(it.node);
      else if (it.switch) wrap.appendChild(switchRow(it));
      else wrap.appendChild(row(it));
    }
    return wrap;
  }

  /** Segmented-Control: options = [{id, label?, icon?, title?}] */
  function segmented(options, value, onChange) {
    const wrap = el('div', { class: 'segmented' });
    for (const opt of options) {
      const b = el('button', {
        type: 'button',
        title: opt.title || opt.label || '',
        class: opt.id === value ? 'is-on' : '',
        dataset: { seg: opt.id },
        onclick: () => {
          wrap.querySelectorAll('button').forEach((x) => x.classList.toggle('is-on', x.dataset.seg === opt.id));
          onChange(opt.id);
        },
      }, [opt.icon ? iconSpan(opt.icon) : null, opt.label ? el('span', { text: opt.label }) : null].filter(Boolean));
      wrap.appendChild(b);
    }
    return wrap;
  }

  function slider(cfg) {
    const out = el('output', { text: cfg.format ? cfg.format(cfg.value) : String(cfg.value) });
    const input = el('input', {
      type: 'range',
      min: cfg.min, max: cfg.max, step: cfg.step || 1, value: cfg.value,
      oninput: (e) => {
        const v = parseFloat(e.target.value);
        out.textContent = cfg.format ? cfg.format(v) : String(v);
        cfg.onInput(v);
      },
    });
    return el('div', { class: 'slider-row' }, [cfg.label ? el('label', { text: cfg.label }) : null, input, out].filter(Boolean));
  }

  /* ── Farbwähler ──────────────────────────────────────────────────────── */

  const PEN_PRESETS = [
    '#000000', '#3A3A3C', '#8E8E93', '#C7C7CC', '#FFFFFF',
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00A99D',
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E',
  ];

  const HIGHLIGHT_PRESETS = [
    '#FFF200', '#FFD43B', '#FFA94D', '#FF8787', '#FF6BAA',
    '#E599F7', '#B197FC', '#91A7FF', '#74C0FC', '#66D9E8',
    '#63E6BE', '#8CE99A', '#C0EB75', '#CED4DA', '#868E96',
  ];

  const TAPE_PRESETS = [
    '#F5F0E4', '#FFD8A8', '#D0EBFF', '#FFC9C9', '#D3F9D8',
    '#E5DBFF', '#FFF3BF', '#C5F6FA', '#FFDEEB', '#DEE2E6',
    '#E9D8C3', '#B2F2BB', '#A5D8FF', '#EEBEFA', '#CED4DA',
  ];

  /**
   * @param {object} cfg { title, value, presets, allowOpacity, opacity,
   *                       onChange(hex), onOpacity(v), onAddPreset(hex) }
   */
  function colorPicker(cfg) {
    const presets = (cfg.presets || PEN_PRESETS).slice();
    const wrap = el('div');
    let tab = 'presets';

    const body = el('div');

    const head = el('div', { class: 'cp__head' }, [
      el('div', { class: 'cp__tabs' }, [
        segmented(
          [{ id: 'presets', label: 'Voreinstellungen' }, { id: 'custom', label: 'Eigene' }],
          tab,
          (id) => {
            tab = id;
            renderBody();
          }
        ),
      ]),
    ]);
    wrap.appendChild(head);
    wrap.appendChild(body);

    function renderBody() {
      body.innerHTML = '';
      body.appendChild(tab === 'presets' ? presetGrid() : customPane());
      if (cfg.allowOpacity) {
        body.appendChild(el('div', { class: 'pop-sep' }));
        body.appendChild(
          slider({
            label: 'Deckkraft',
            min: 5, max: 100, step: 1,
            value: Math.round((cfg.opacity === undefined ? 1 : cfg.opacity) * 100),
            format: (v) => `${v} %`,
            onInput: (v) => cfg.onOpacity && cfg.onOpacity(v / 100),
          })
        );
      }
    }

    function presetGrid() {
      const grid = el('div', { class: 'cp__grid' });
      for (const c of presets) {
        grid.appendChild(
          el('button', {
            type: 'button',
            title: c,
            dataset: { color: c },
            class: same(c, cfg.value) ? 'is-on' : '',
            style: `background:${c}`,
            onclick: () => {
              cfg.value = c;
              grid.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', same(b.dataset.color, c)));
              cfg.onChange(c);
            },
          })
        );
      }
      grid.appendChild(
        el('button', {
          type: 'button',
          class: 'cp__add',
          title: 'Eigene Farbe',
          onclick: () => {
            tab = 'custom';
            renderBody();
          },
        }, [iconSpan('plus', 'icon--14')])
      );
      return grid;
    }

    function customPane() {
      const pane = el('div', { class: 'cp__custom' });
      const wheel = el('canvas', { class: 'cp__wheel', width: 400, height: 400 });
      const light = el('canvas', { class: 'cp__lightness', width: 440, height: 24 });
      const wheelMark = el('span', { class: 'cp__marker' });
      const lightMark = el('span', { class: 'cp__marker cp__marker--light' });

      let hsl = rgbToHsl(GN.render.parseHex(cfg.value) || { r: 0, g: 0, b: 0 });

      const hex = el('input', { class: 'cp__hex', type: 'text', maxlength: '7', spellcheck: 'false', value: String(cfg.value).toUpperCase() });
      const rgbInputs = ['r', 'g', 'b'].map(() => el('input', { class: 'cp__rgb', type: 'text', maxlength: '3', spellcheck: 'false' }));
      const addBtn = el('button', { class: 'cp__addbtn', type: 'button', text: 'Zu Voreinstellungen hinzufügen' });

      drawWheel(wheel);

      function syncFields(color, skip) {
        const c = GN.render.parseHex(color);
        if (skip !== 'hex') hex.value = color.toUpperCase();
        if (skip !== 'rgb' && c) {
          rgbInputs[0].value = c.r;
          rgbInputs[1].value = c.g;
          rgbInputs[2].value = c.b;
        }
        drawLightness(light, hsl.h, hsl.s);
        placeMarkers(color);
        addBtn.disabled = presets.some((p) => same(p, color));
      }

      /** Setzt Rad- und Reglermarker auf die aktuelle Farbe. */
      function placeMarkers(color) {
        const a = (hsl.h * Math.PI) / 180;
        const r = Math.min(hsl.s, 1) * 100;                       // Radius in CSS-px (Rad = 200px)
        wheelMark.style.left = 100 + Math.cos(a) * r + 'px';
        wheelMark.style.top = 100 + Math.sin(a) * r + 'px';
        wheelMark.style.background = color;
        lightMark.style.left = Math.min(Math.max(hsl.l, 0), 1) * 220 + 'px';
        lightMark.style.background = color;
      }

      function apply(color, skip) {
        cfg.value = color;
        syncFields(color, skip);
        cfg.onChange(color);
      }

      const pickFromWheel = (e) => {
        const r = wheel.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * 2 - 1;
        const y = (e.clientY - r.top) / r.height * 2 - 1;
        const dist = Math.min(Math.hypot(x, y), 1);
        hsl.h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        hsl.s = dist;
        apply(hslToHex(hsl));
      };
      wheel.addEventListener('pointerdown', (e) => {
        wheel.setPointerCapture(e.pointerId);
        pickFromWheel(e);
      });
      wheel.addEventListener('pointermove', (e) => {
        if (e.buttons) pickFromWheel(e);
      });

      const pickLightness = (e) => {
        const r = light.getBoundingClientRect();
        hsl.l = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        apply(hslToHex(hsl));
      };
      light.addEventListener('pointerdown', (e) => {
        light.setPointerCapture(e.pointerId);
        pickLightness(e);
      });
      light.addEventListener('pointermove', (e) => {
        if (e.buttons) pickLightness(e);
      });

      hex.addEventListener('input', () => {
        const v = hex.value.trim();
        const ok = /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(v);
        hex.classList.toggle('is-invalid', !ok && v.length > 0);
        if (!ok) return;
        const full = normalizeHex(v);
        hsl = rgbToHsl(GN.render.parseHex(full));
        apply(full, 'hex');
      });
      hex.addEventListener('keydown', (e) => e.stopPropagation());

      rgbInputs.forEach((input, i) => {
        input.addEventListener('keydown', (e) => e.stopPropagation());
        input.addEventListener('input', () => {
          const vals = rgbInputs.map((x) => Math.max(0, Math.min(255, parseInt(x.value, 10) || 0)));
          const color = '#' + vals.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
          hsl = rgbToHsl({ r: vals[0], g: vals[1], b: vals[2] });
          apply(color, 'rgb');
        });
      });

      addBtn.addEventListener('click', () => {
        if (presets.some((p) => same(p, cfg.value))) return;
        presets.unshift(cfg.value);
        if (presets.length > 30) presets.pop();
        if (cfg.onAddPreset) cfg.onAddPreset(cfg.value);
        tab = 'presets';
        renderBody();
      });

      pane.appendChild(el('div', { class: 'cp__wheelwrap' }, [wheel, wheelMark]));
      pane.appendChild(el('div', { class: 'cp__lightwrap' }, [light, lightMark]));
      pane.appendChild(
        el('div', { class: 'cp__fields' }, [
          el('div', { class: 'cp__field' }, [el('span', { text: 'HEX' }), hex]),
          el('div', { class: 'cp__field' }, [el('span', { text: 'R' }), rgbInputs[0]]),
          el('div', { class: 'cp__field' }, [el('span', { text: 'G' }), rgbInputs[1]]),
          el('div', { class: 'cp__field' }, [el('span', { text: 'B' }), rgbInputs[2]]),
        ])
      );
      pane.appendChild(addBtn);
      syncFields(cfg.value);
      return pane;
    }

    renderBody();
    return wrap;
  }

  /* Farbrad und Helligkeitsverlauf zeichnen */

  function drawWheel(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const r = size / 2;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - r) / r;
        const dy = (y - r) / r;
        const dist = Math.hypot(dx, dy);
        const i = (y * size + x) * 4;
        if (dist > 1) {
          img.data[i + 3] = 0;
          continue;
        }
        const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const rgb = hslToRgb({ h, s: dist, l: 0.5 });
        img.data[i] = rgb.r;
        img.data[i + 1] = rgb.g;
        img.data[i + 2] = rgb.b;
        img.data[i + 3] = dist > 0.985 ? Math.round((1 - dist) / 0.015 * 255) : 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawLightness(canvas, h, s) {
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let i = 0; i <= 10; i++) {
      const l = i / 10;
      const rgb = hslToRgb({ h, s, l });
      grad.addColorStop(l, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* Farbraum-Umrechnung */

  function rgbToHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return { h, s, l };
  }

  function hslToRgb(hsl) {
    const { h, s, l } = hsl;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = l - c / 2;
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  function hslToHex(hsl) {
    const c = hslToRgb(hsl);
    return '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function normalizeHex(v) {
    let h = v.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return '#' + h.toUpperCase();
  }

  const same = (a, b) => String(a).toUpperCase() === String(b).toUpperCase();

  GN.popover = {
    open, close, isOpen, position,
    menu, row, switchRow, segmented, slider, colorPicker,
    PEN_PRESETS, HIGHLIGHT_PRESETS, TAPE_PRESETS,
  };
  GN.el = el;
  GN.iconSpan = iconSpan;
})(window);
