/* ============================================================================
 * chrome.js — Alles rund um den Canvas: Tab-Leiste, Werkzeugleiste,
 * Auswahl-Kontextleiste, Seitenleiste, Minimap und Zoomanzeige.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const el = GN.el;
  const iconSpan = GN.iconSpan;
  const pop = GN.popover;
  const T = GN.tools;

  /* Reihenfolge, in der Werkzeuge bei Platzmangel ins Zubehör-Menü wandern. */
  const OVERFLOW_ORDER = ['laser', 'ruler', 'image', 'elements', 'text', 'tape', 'shapes', 'highlighter', 'eraser'];

  class Chrome {
    constructor(app) {
      this.app = app;
      this.ctrl = app.ctrl;
      this.appEl = document.getElementById('app');
      this.toolList = document.getElementById('toolList');
      this.tabStrip = document.getElementById('tabStrip');
      this.selbar = null;
      this.buildTools();
      this.bindMinimap();
    }

    /* ── Werkzeugleiste ───────────────────────────────────────────────── */

    buildTools() {
      this.toolList.innerHTML = '';
      for (const tool of T.TOOLS) {
        const btn = el('button', {
          type: 'button',
          class: 'iconbtn',
          title: `${tool.label} (${tool.keys ? tool.keys[0] : ''})`,
          'aria-label': tool.label,
          'aria-pressed': 'false',
          dataset: { tool: tool.id },
          onclick: () => this.onToolClick(tool),
        }, [iconSpan(tool.icon)]);
        this.toolList.appendChild(btn);
      }
      this.syncTools();
    }

    onToolClick(tool) {
      if (tool.toggle) {
        this.app.toggleRuler();
        return;
      }
      if (this.ctrl.active === tool.id && !this.app.toolMenu.showRuler) {
        this.app.toolMenu.toggleCollapsed();
        return;
      }
      this.app.toolMenu.showRuler = false;
      this.app.toolMenu.collapsed = false;
      this.ctrl.setTool(tool.id);
      this.app.toolMenu.render();
    }

    syncTools() {
      const active = this.ctrl.active;
      this.appEl.dataset.tool = active;
      this.toolList.querySelectorAll('.iconbtn').forEach((btn) => {
        const id = btn.dataset.tool;
        const def = T.TOOLS.find((t) => t.id === id);
        const on = def.toggle ? this.ctrl.settings.ruler.visible : id === active;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.style.setProperty('--tint', def.tinted ? this.ctrl.tintColor(id) : '');
      });
      this.layoutTools();
    }

    /**
     * Reicht der Platz in der Leistenmitte nicht, wandern Werkzeuge von rechts
     * nach links ins Zubehör-Menü. Rückgängig/Wiederholen, Stift und Lasso
     * bleiben immer stehen, das aktive Werkzeug ebenfalls.
     */
    layoutTools() {
      const mid = document.getElementById('toolbar');
      const buttons = [...this.toolList.querySelectorAll('.iconbtn')];
      buttons.forEach((b) => { b.hidden = false; });
      this.hiddenTools = [];

      for (const id of OVERFLOW_ORDER) {
        if (mid.scrollWidth <= mid.clientWidth + 1) break;
        if (id === this.ctrl.active) continue;
        const btn = this.toolList.querySelector(`[data-tool="${id}"]`);
        if (!btn) continue;
        btn.hidden = true;
        this.hiddenTools.push(id);
      }
    }

    updateHistoryButtons() {
      const board = this.app.board;
      document.querySelector('[data-action="undo"]').disabled = !board.canUndo();
      document.querySelector('[data-action="redo"]').disabled = !board.canRedo();
    }

    /* ── Tab-Leiste ───────────────────────────────────────────────────── */

    renderTabs() {
      const ws = this.app.ws;
      this.tabStrip.innerHTML = '';
      ws.boards.forEach((board, i) => {
        const tab = el('button', {
          type: 'button',
          role: 'tab',
          class: 'tab' + (i === ws.activeIndex ? ' is-active' : ''),
          'aria-selected': i === ws.activeIndex ? 'true' : 'false',
          title: board.title,
          onclick: () => {
            if (i === ws.activeIndex) this.openRename(tab, board);
            else this.app.setActiveBoard(i);
          },
        }, [
          el('span', { class: 'tab__icon', html: GN.icon('boardTab') }),
          el('span', { class: 'tab__title', text: board.title }),
        ]);

        const close = el('span', {
          class: 'tab__close',
          role: 'button',
          title: 'Tab schließen',
          onclick: (e) => {
            e.stopPropagation();
            this.app.closeBoard(i);
          },
        }, [iconSpan('close')]);
        tab.appendChild(close);
        this.tabStrip.appendChild(tab);
      });
      this.tabStrip.classList.toggle('is-short', this.tabStrip.scrollWidth <= this.tabStrip.clientWidth + 2);
      document.getElementById('sidebarTitle').textContent = this.app.board.title;
    }

    openRename(anchor, board) {
      const input = el('input', {
        class: 'field',
        type: 'text',
        value: board.title,
        onkeydown: (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            commit();
            pop.close();
          }
        },
      });
      const commit = () => {
        board.title = input.value.trim() || 'Ohne Titel';
        this.renderTabs();
        this.app.ws.emit('rename');
      };
      pop.open({
        key: 'rename',
        anchor,
        autofocus: true,
        onClose: commit,
        content: el('div', {}, [
          el('div', { class: 'pop-header', text: 'Board umbenennen' }),
          el('div', { style: 'padding:2px 6px 8px' }, [input]),
        ]),
      });
    }

    /* ── Seitenleiste ─────────────────────────────────────────────────── */

    /* Die Vorschau rastert das ganze Board — deshalb entprellt und nur,
     * solange die Seitenleiste überhaupt sichtbar ist. */
    renderSidebar() {
      const sb = document.getElementById('sidebar');
      if (sb.hidden) return;
      clearTimeout(this._sidebarTimer);
      this._sidebarTimer = setTimeout(() => {
        const body = document.getElementById('sidebarBody');
        body.innerHTML = '';
        this.app.ws.boards.forEach((board, i) => {
          const card = el('button', {
            type: 'button',
            class: 'board-card' + (i === this.app.ws.activeIndex ? ' is-on' : ''),
            onclick: () => this.app.setActiveBoard(i),
          }, [el('i'), el('span', { text: board.title })]);
          body.appendChild(card);

          // Vorschau nur für das aktive Board — die anderen Boards liegen
          // nicht im Renderer und blieben sonst ohnehin leer.
          if (i === this.app.ws.activeIndex) {
            try {
              card.querySelector('i').appendChild(el('img', { src: this.app.renderer.exportPNG(0.3), alt: '' }));
            } catch (err) {
              /* Vorschau ist optional */
            }
          }
        });
      }, 450);
    }

    /* ── Auswahl-Kontextleiste ────────────────────────────────────────── */

    updateSelectionBar() {
      const overlay = document.getElementById('overlay');
      if (this.selbar) {
        this.selbar.remove();
        this.selbar = null;
      }
      const sel = this.ctrl.selection;
      if (!sel || !sel.box || !sel.ids.size || this.app.mode === 'read') return;

      const r = this.app.renderer;
      const a = r.toScreen(sel.box.x0, sel.box.y0);
      const b = r.toScreen(sel.box.x1, sel.box.y1);

      const bar = el('div', { class: 'selbar glass-capsule' }, [
        btn('cut', 'Ausschneiden', () => this.app.cutSelection()),
        btn('copy', 'Kopieren', () => this.app.copySelection()),
        btn('duplicate', 'Duplizieren', () => this.app.duplicateSelection()),
        el('span', { class: 'hairline-v' }),
        btn('palette', 'Farbe', (e) => this.openSelectionColor(e.currentTarget)),
        btn('customize', 'Anordnen', (e) => this.openArrangeMenu(e.currentTarget)),
        el('span', { class: 'hairline-v' }),
        btn('trash', 'Löschen', () => this.app.deleteSelection(), true),
      ]);
      overlay.appendChild(bar);

      const cx = (a.x + b.x) / 2;
      const top = Math.max(bar.offsetHeight + 12, a.y - 14);
      bar.style.left = Math.round(Math.max(bar.offsetWidth / 2 + 8, Math.min(cx, r.width - bar.offsetWidth / 2 - 8))) + 'px';
      bar.style.top = Math.round(top) + 'px';
      this.selbar = bar;

      function btn(icon, label, onClick, danger) {
        return el('button', {
          type: 'button',
          class: danger ? 'is-danger' : '',
          onclick: onClick,
        }, [iconSpan(icon), el('span', { text: label })]);
      }
    }

    openSelectionColor(anchor) {
      const first = this.app.selectedItems().find((i) => i.color);
      pop.open({
        key: 'selcolor',
        anchor,
        className: 'popover--wide',
        content: pop.colorPicker({
          value: (first && first.color) || '#000000',
          onChange: (c) => this.app.recolorSelection(c),
        }),
      });
    }

    openArrangeMenu(anchor) {
      pop.open({
        key: 'arrange',
        anchor,
        content: pop.menu([
          { title: 'Anordnen' },
          { label: 'Ganz nach vorn', icon: 'chevronUp', onClick: () => this.app.arrangeSelection('front') },
          { label: 'Ganz nach hinten', icon: 'chevronDown', onClick: () => this.app.arrangeSelection('back') },
        ]),
      });
    }

    /* ── Minimap ──────────────────────────────────────────────────────── */

    bindMinimap() {
      const map = document.getElementById('minimap');
      const canvas = document.getElementById('minimapCanvas');
      let dragging = false;

      const panTo = (e) => {
        const rect = canvas.getBoundingClientRect();
        const info = this._minimapInfo;
        if (!info) return;
        const wx = (e.clientX - rect.left - info.ox) / info.k;
        const wy = (e.clientY - rect.top - info.oy) / info.k;
        const r = this.app.renderer;
        r.cam.x = r.width / 2 - wx * r.cam.scale;
        r.cam.y = r.height / 2 - wy * r.cam.scale;
        r.invalidate();
        this.app.onCameraChanged();
      };

      map.addEventListener('pointerdown', (e) => {
        dragging = true;
        map.setPointerCapture(e.pointerId);
        panTo(e);
      });
      map.addEventListener('pointermove', (e) => {
        if (dragging) panTo(e);
      });
      map.addEventListener('pointerup', () => { dragging = false; });
      map.addEventListener('dblclick', () => {
        this.app.renderer.fitContent();
        this.app.onCameraChanged();
      });
    }

    renderMinimap() {
      const map = document.getElementById('minimap');
      if (map.hidden) return;
      clearTimeout(this._mapTimer);
      this._mapTimer = setTimeout(() => {
        const canvas = document.getElementById('minimapCanvas');
        this._minimapInfo = this.app.renderer.renderMinimap(canvas);
        map.classList.toggle('is-empty', this.app.board.items.length === 0);
      }, 140);
    }

    updateZoom() {
      document.getElementById('zoomLabel').textContent = Math.round(this.app.renderer.cam.scale * 100) + ' %';
    }
  }

  GN.Chrome = Chrome;
})(window);
