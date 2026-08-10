/* ============================================================================
 * app.js — Zusammenbau: Ereignisse, Menüs, Texteingabe, Import/Export
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const el = GN.el;
  const pop = GN.popover;
  const geo = GN.geo;
  const M = GN.model;

  class App {
    constructor() {
      this.appEl = document.getElementById('app');
      this.canvas = document.getElementById('canvas');
      this.overlay = document.getElementById('overlay');
      this.mode = 'edit';
      this.clipboard = null;
      this.editor = null;

      /* ?leer=1 heißt: ein neu angelegtes Blatt. Dann wird der gespeicherte
         Stand nicht geladen — sonst läge auf dem „neuen" Blatt, was beim
         letzten Besuch daraufstand, und das wäre dasselbe Missverständnis
         wie der Beispielinhalt, nur schwerer zu erkennen. */
      this.leeresBlatt = /(^|[?&])leer=1(&|$)/.test(location.search) || /(^|#)leer$/.test(location.hash);
      this.ws = new M.Workspace();
      const restored = this.leeresBlatt ? false : this.ws.load();
      if (!restored) this.ws.addBoard({ title: this.leeresBlatt ? 'Neues Blatt' : 'Whiteboard' });

      this.renderer = new GN.Renderer(this.canvas);
      this.renderer.setBoard(this.board);
      this.ctrl = new GN.tools.ToolController(this);
      this.chrome = new GN.Chrome(this);
      this.toolMenu = new GN.ToolMenu(this);

      GN.hydrateIcons(document);
      // Gespeicherte Wahl zuerst, sonst das System. Beides ohne zu speichern:
      // gespeichert wird nur, was jemand im Menü selbst umlegt — sonst brennt
      // sich der Systemzustand des ersten Besuchs als feste Wahl ein.
      this.applyTheme(readStored('gn-theme') || preferredTheme(), false);
      this.watchSystemTheme();
      this.startClock();

      this.ws.on((reason) => this.onDocChanged(reason));
      this.bind();

      this.renderer.resize();
      if (this.board.camera) Object.assign(this.renderer.cam, this.board.camera);
      else {
        this.renderer.cam.x = this.renderer.width / 2;
        this.renderer.cam.y = this.renderer.height / 2;
      }

      /* Ein NEUES Blatt ist leer. Der Prototyp ruft das Canvas mit ?leer=1,
         wenn im „Neu"-Menü „Canvas-Blatt" gewählt wurde — wer ein Blatt
         anlegt und fremde Haftzettel vorfindet, hat kein Blatt angelegt.
         Ohne den Parameter bleibt alles, wie es war: das Canvas als eigene
         Seite zeigt weiter seinen Beispielinhalt. */
      const leer = this.leeresBlatt;
      if (!restored && !leer) this.seedDemo();
      else this.renderer.invalidate();
      if (leer) this.toast('Neues Canvas-Blatt — leer, wie du es angelegt hast.');

      this.centerRuler();
      this.toolMenu.render();
      this.chrome.renderTabs();
      this.onDocChanged();
      this.chrome.updateZoom();
    }

    get board() {
      return this.ws.active;
    }

    /* ── Ereignisse ───────────────────────────────────────────────────── */

    bind() {
      const c = this.canvas;

      c.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button === 2) return;
        e.preventDefault();
        pop.close();
        this.appEl.classList.toggle('is-panning', this.ctrl.spaceDown || e.button === 1 || this.mode === 'read');
        this.ctrl.onPointerDown(e);
      });
      c.addEventListener('pointermove', (e) => this.ctrl.onPointerMove(e));
      c.addEventListener('pointerup', (e) => {
        this.appEl.classList.remove('is-panning');
        this.ctrl.onPointerUp(e);
      });
      c.addEventListener('pointercancel', (e) => {
        this.appEl.classList.remove('is-panning');
        this.ctrl.cancel();
        this.ctrl.onPointerUp(e);
      });
      c.addEventListener('pointerleave', () => {
        if (this.ctrl.active === 'eraser' && !this.ctrl.session) {
          this.renderer.eraserCursor = null;
          this.renderer.requestFrame();
        }
      });
      c.addEventListener('contextmenu', (e) => e.preventDefault());
      c.addEventListener('dblclick', (e) => {
        const p = this.ctrl.worldPoint(e);
        const hit = GN.tools.topItemAt(this.board, p.x, p.y, ['text']);
        if (hit) {
          this.ctrl.setTool('text');
          this.editText(hit);
        }
      });

      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = c.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        if (e.ctrlKey || e.metaKey) {
          this.renderer.zoomAt(sx, sy, this.renderer.cam.scale * Math.exp(-e.deltaY * 0.01));
        } else if (e.shiftKey) {
          this.renderer.panBy(-(e.deltaY + e.deltaX), 0);
        } else {
          this.renderer.panBy(-e.deltaX, -e.deltaY);
        }
        this.onCameraChanged();
      }, { passive: false });

      global.addEventListener('resize', () => {
        this.renderer.resize();
        this.chrome.layoutTools();
        this.chrome.updateSelectionBar();
        this.chrome.renderMinimap();
        this.positionEditor();
      });

      document.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', (e) => this.onAction(btn.dataset.action, btn, e));
      });

      document.addEventListener('keydown', (e) => this.onKeyDown(e));
      document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') this.releaseSpace();
      });
      // Ein Fensterwechsel schluckt das keyup — ohne das hier bliebe die
      // Leertaste gedrückt und Zeichnen wäre danach blockiert.
      global.addEventListener('blur', () => this.releaseSpace());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.releaseSpace();
      });

      global.addEventListener('dragover', (e) => e.preventDefault());
      global.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const rect = this.canvas.getBoundingClientRect();
          this.placeImageFile(file, this.renderer.toWorld(e.clientX - rect.left, e.clientY - rect.top));
        }
      });

      global.addEventListener('paste', (e) => {
        if (this.editor) return;
        const items = e.clipboardData && e.clipboardData.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                e.preventDefault();
                this.placeImageFile(file, this.viewCenter());
                return;
              }
            }
          }
        }
        if (this.clipboard && this.clipboard.length) {
          e.preventDefault();
          this.pasteClipboard();
          return;
        }
        const text = e.clipboardData && e.clipboardData.getData('text/plain');
        if (text) {
          e.preventDefault();
          this.placeText(text, this.viewCenter());
        }
      });
    }

    releaseSpace() {
      this.ctrl.spaceDown = false;
      this.appEl.classList.remove('is-panning');
    }

    onAction(action, btn) {
      switch (action) {
        case 'undo': this.board.undo(); this.ctrl.clearSelection(); break;
        case 'redo': this.board.redo(); this.ctrl.clearSelection(); break;
        case 'zoomIn': this.renderer.zoomStep(1); this.onCameraChanged(); break;
        case 'zoomOut': this.renderer.zoomStep(-1); this.onCameraChanged(); break;
        case 'zoomMenu': this.openZoomMenu(btn); break;
        case 'mode': this.setMode(this.mode === 'edit' ? 'read' : 'edit'); break;
        case 'sidebar': this.toggleSidebar(); break;
        case 'search': this.openSearch(btn); break;
        case 'ai': this.openAI(btn); break;
        case 'accessories': this.openAccessories(btn); break;
        case 'more': this.openMoreMenu(btn); break;
        case 'share': this.openShareMenu(btn); break;
        case 'addBoard': this.openAddBoardMenu(btn); break;
        case 'newTab': this.addBoard(); break;
        case 'library': this.toast('Die Bibliothek ist in diesem Mockup nicht enthalten.'); break;
        case 'minimap': this.toggleMinimap(); break;
        default: break;
      }
    }

    onKeyDown(e) {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Escape aus einem Popover-Feld heraus soll auch das Popover schließen.
        if (e.key === 'Escape') {
          target.blur();
          pop.close();
        }
        return;
      }
      const meta = e.metaKey || e.ctrlKey;

      if (e.code === 'Space' && !meta) {
        this.ctrl.spaceDown = true;
        this.appEl.classList.add('is-panning');
        e.preventDefault();
        return;
      }

      if (meta) {
        const k = e.key.toLowerCase();
        if (k === 'z') {
          e.preventDefault();
          if (e.shiftKey) this.board.redo();
          else this.board.undo();
          this.ctrl.clearSelection();
        } else if (k === 'y') {
          e.preventDefault();
          this.board.redo();
          this.ctrl.clearSelection();
        } else if (k === 'a') {
          e.preventDefault();
          this.selectAll();
        } else if (k === 'c' && this.ctrl.selection) {
          e.preventDefault();
          this.copySelection();
        } else if (k === 'x' && this.ctrl.selection) {
          e.preventDefault();
          this.cutSelection();
        } else if (k === 'd') {
          e.preventDefault();
          this.duplicateSelection();
        } else if (k === 'e') {
          e.preventDefault();
          this.exportPNG();
        } else if (k === 'f') {
          e.preventDefault();
          this.openSearch(document.querySelector('[data-action="search"]'));
        } else if (k === '\\') {
          e.preventDefault();
          this.toggleSidebar();
        } else if (k === 'r' && e.shiftKey) {
          e.preventDefault();
          this.setMode(this.mode === 'edit' ? 'read' : 'edit');
        } else if (k === '0') {
          e.preventDefault();
          this.renderer.resetZoom();
          this.onCameraChanged();
        } else if (k === '=' || k === '+') {
          e.preventDefault();
          this.renderer.zoomStep(1);
          this.onCameraChanged();
        } else if (k === '-') {
          e.preventDefault();
          this.renderer.zoomStep(-1);
          this.onCameraChanged();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (this.editor) this.closeTextEditor(true);
        else if (this.ctrl.selection) this.ctrl.clearSelection();
        else this.ctrl.setTool(this.ctrl.lastSticky);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (this.ctrl.selection) {
          e.preventDefault();
          this.deleteSelection();
        }
        return;
      }

      if (e.key === 'f') {
        this.renderer.fitContent();
        this.onCameraChanged();
        return;
      }

      const key = e.key.toLowerCase();
      const tool = GN.tools.TOOLS.find((t) => t.keys && t.keys.indexOf(key) !== -1);
      if (tool) {
        if (tool.toggle) this.toggleRuler();
        else this.ctrl.setTool(tool.id);
      }
    }

    /* ── Reaktionen ───────────────────────────────────────────────────── */

    /**
     * `reason` hält die teuren Aktualisierungen aus der Zeichengeste heraus:
     * während des Radierens oder Verschiebens feuert nur `stage`, und dann
     * genügt ein Neuzeichnen der Fläche.
     */
    onDocChanged(reason) {
      this.renderer.setBoard(this.board);
      if (reason === 'stage') return;

      this.chrome.updateHistoryButtons();
      this.chrome.updateSelectionBar();
      this.chrome.renderMinimap();
      this.chrome.renderSidebar();
      if (reason === 'boards' || reason === 'rename' || reason === undefined) this.chrome.renderTabs();
    }

    onCameraChanged() {
      this.chrome.updateZoom();
      this.chrome.updateSelectionBar();
      this.chrome.renderMinimap();
      this.positionEditor();
      this.board.camera = { ...this.renderer.cam };
      this.ws.save();   // sonst überlebt der Bildausschnitt kein Neuladen
    }

    onToolChanged() {
      this.toolMenu.render();
      this.chrome.syncTools();
      this.chrome.updateSelectionBar();
      if (this.ctrl.active !== 'eraser') {
        this.renderer.eraserCursor = null;
        this.renderer.requestFrame();
      }
      this.closeTextEditor();
      // Bild & Kamera und Elemente öffnen ihr Panel direkt beim Aktivieren.
      if (this.ctrl.active === 'image') setTimeout(() => this.requestImage(null), 30);
      if (this.ctrl.active === 'elements') {
        setTimeout(() => {
          const anchor = document.querySelector('[data-tool="elements"]');
          if (anchor && !pop.isOpen('stickers')) this.toolMenu.openStickerPanel(anchor);
        }, 30);
      }
    }

    updateSelectionUI() {
      this.chrome.updateSelectionBar();
      if (this.ctrl.active === 'lasso') this.toolMenu.render();
    }

    render() {
      this.renderer.invalidate();
      this.chrome.syncTools();
    }

    setMode(mode) {
      this.mode = mode;
      this.appEl.dataset.mode = mode;
      const btn = document.querySelector('[data-action="mode"]');
      btn.querySelector('.icon').innerHTML = GN.icon(mode === 'edit' ? 'viewEdit' : 'viewRead');
      btn.title = mode === 'edit' ? 'Lesemodus (⌘⇧R)' : 'Bearbeiten (⌘⇧R)';
      if (mode === 'read') {
        this.ctrl.clearSelection();
        this.closeTextEditor();
      }
      this.toast(mode === 'read' ? 'Lesemodus — Ziehen verschiebt die Fläche' : 'Bearbeitungsmodus');
    }

    /* ── Boards ───────────────────────────────────────────────────────── */

    addBoard(opts) {
      const copy = opts && opts.copy;
      const source = this.board;
      const n = this.ws.boards.length + 1;
      source.camera = { ...this.renderer.cam };
      this.ws.addBoard({
        title: copy ? `${source.title} Kopie` : `Board ${n}`,
        template: source.template,
        paper: source.paper,
        spacing: source.spacing,
        margin: source.margin,
        items: copy ? source.items.slice() : [],
      }, this.ws.activeIndex + 1);
      this.renderer.setBoard(this.board);
      if (copy) this.renderer.cam = { ...source.camera };
      else this.renderer.cam = { x: this.renderer.width / 2, y: this.renderer.height / 2, scale: 1 };
      this.ctrl.clearSelection();
      this.onCameraChanged();
      this.toast(copy ? 'Board dupliziert' : 'Neues Board angelegt');
    }

    openAddBoardMenu(anchor) {
      pop.open({
        key: 'addboard',
        anchor,
        content: pop.menu([
          { title: 'Board hinzufügen' },
          { label: 'Leeres Board', sub: 'Übernimmt Muster und Papierfarbe', icon: 'plus', onClick: () => this.addBoard() },
          { label: 'Board duplizieren', sub: 'Mit allen Objekten des aktuellen Boards', icon: 'duplicate', onClick: () => this.addBoard({ copy: true }) },
          '-',
          { label: 'Muster wählen …', icon: 'template', chevron: true, onClick: () => defer(() => this.openTemplateMenu(anchor)) },
        ]),
      });
    }

    setActiveBoard(index) {
      this.board.camera = { ...this.renderer.cam };
      this.renderer.laserTrail = [];
      this.ws.setActive(index);
      this.renderer.setBoard(this.board);
      if (this.board.camera) Object.assign(this.renderer.cam, this.board.camera);
      else this.renderer.cam = { x: this.renderer.width / 2, y: this.renderer.height / 2, scale: 1 };
      this.ctrl.clearSelection();
      this.closeTextEditor();
      this.centerRuler();
      this.onCameraChanged();
    }

    closeBoard(index) {
      if (this.ws.boards.length === 1) {
        this.toast('Das letzte Board lässt sich nicht schließen.');
        return;
      }
      this.ws.closeBoard(index);
      this.renderer.setBoard(this.board);
      // Das nachrückende Board bringt seine eigene Kamera mit.
      if (this.board.camera) Object.assign(this.renderer.cam, this.board.camera);
      else this.renderer.cam = { x: this.renderer.width / 2, y: this.renderer.height / 2, scale: 1 };
      this.ctrl.clearSelection();
      this.closeTextEditor();
      this.centerRuler();
      this.onCameraChanged();
    }

    /* ── Auswahl ──────────────────────────────────────────────────────── */

    selectedItems() {
      if (!this.ctrl.selection) return [];
      return [...this.ctrl.selection.ids].map((id) => this.board.byId(id)).filter(Boolean);
    }

    selectAll() {
      if (!this.board.items.length) return;
      this.ctrl.setTool('lasso');
      this.ctrl.select(new Set(this.board.items.map((i) => i.id)));
    }

    deleteSelection() {
      const items = this.selectedItems();
      if (!items.length) return;
      this.board.remove(items.map((i) => i.id), 'Auswahl löschen');
      this.ctrl.clearSelection();
    }

    copySelection() {
      const items = this.selectedItems();
      if (!items.length) return;
      this.clipboard = items.map((i) => JSON.parse(JSON.stringify(i)));
      this.toast(`${items.length} ${items.length === 1 ? 'Objekt' : 'Objekte'} kopiert`);
    }

    cutSelection() {
      this.copySelection();
      this.deleteSelection();
    }

    pasteClipboard() {
      if (!this.clipboard || !this.clipboard.length) return;
      const d = 24 / this.renderer.cam.scale;
      const copies = this.clipboard.map((raw) => cloneShifted(raw, d, d));
      this.board.add(copies, 'Einfügen');
      this.ctrl.setTool('lasso');
      this.ctrl.select(new Set(copies.map((c) => c.id)));
    }

    duplicateSelection() {
      const items = this.selectedItems();
      if (!items.length) return;
      const d = 24 / this.renderer.cam.scale;
      const copies = items.map((it) => cloneShifted(it, d, d));
      this.board.add(copies, 'Duplizieren');
      this.ctrl.select(new Set(copies.map((c) => c.id)));
    }

    recolorSelection(color) {
      const items = this.selectedItems();
      const map = {};
      for (const it of items) {
        if (it.kind === 'sticker' || it.kind === 'image') continue;
        map[it.id] = M.patch(it, { color });
      }
      if (!Object.keys(map).length) return;
      this.board.replace(map, 'Farbe ändern');
    }

    arrangeSelection(where) {
      const ids = new Set(this.selectedItems().map((i) => i.id));
      if (!ids.size) return;
      const picked = this.board.items.filter((i) => ids.has(i.id));
      const rest = this.board.items.filter((i) => !ids.has(i.id));
      this.board.commit(where === 'front' ? rest.concat(picked) : picked.concat(rest), 'Anordnen');
    }

    applyTextStyle() {
      const s = this.ctrl.settings.text;
      const items = this.selectedItems().filter((i) => i.kind === 'text');
      if (this.editor) {
        this.editor.item = M.patch(this.editor.item, styleOf(s));
        this.positionEditor();
      }
      if (!items.length) {
        this.renderer.invalidate();
        return;
      }
      const map = {};
      for (const it of items) map[it.id] = M.patch(it, styleOf(s));
      this.board.replace(map, 'Textstil');
    }

    /* ── Lineal ───────────────────────────────────────────────────────── */

    centerRuler() {
      const s = this.ctrl.settings.ruler;
      const c = this.viewCenter();
      s.x = c.x;
      s.y = c.y;
      this.renderer.ruler = s;
    }

    toggleRuler(force) {
      const s = this.ctrl.settings.ruler;
      s.visible = force === undefined ? !s.visible : force;
      if (s.visible) this.centerRuler();
      this.renderer.ruler = s;
      this.toolMenu.showRuler = s.visible;
      this.toolMenu.collapsed = false;
      this.chrome.syncTools();
      this.toolMenu.render();
      this.renderer.requestFrame();
      if (s.visible) this.toast('Lineal eingeblendet — Striche rasten an der Kante ein');
    }

    /* ── Texteingabe ──────────────────────────────────────────────────── */

    editText(item, isNew) {
      this.closeTextEditor();
      const s = this.ctrl.settings.text;
      if (!isNew) {
        Object.assign(s, styleOf(item));
        this.toolMenu.render();
      }

      const ta = document.createElement('textarea');
      ta.className = 'textedit';
      ta.value = item.text || '';
      ta.spellcheck = false;
      this.overlay.appendChild(ta);

      this.editor = { item, isNew: !!isNew, node: ta };
      this.renderer.hiddenIds = new Set([item.id]);
      this.renderer.invalidate();
      this.positionEditor();

      ta.addEventListener('input', () => this.autoGrowEditor());
      ta.addEventListener('blur', () => this.closeTextEditor());
      ta.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeTextEditor(true);
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.closeTextEditor();
        }
      });
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, 0);
    }

    positionEditor() {
      if (!this.editor) return;
      const { item, node } = this.editor;
      const r = this.renderer;
      const p = r.toScreen(item.x, item.y);
      const k = r.cam.scale;
      node.style.left = p.x + 'px';
      node.style.top = p.y + 'px';
      node.style.width = item.w * k + 'px';
      node.style.font = GN.render.fontString({ ...item, fontSize: item.fontSize * k });
      node.style.lineHeight = item.fontSize * k * item.lineSpacing + 'px';
      // Dieselbe Anzeige-Umkehrung wie im Canvas: was gleich gezeichnet wird,
      // muss beim Tippen schon so aussehen.
      node.style.color = item.boxStyle === 'sticky' || item.boxStyle === 'callout'
        ? GN.render.readableInk(item.color)
        : r.ink(item.color);
      node.style.textAlign = item.align === 'justify' ? 'justify' : item.align;
      node.style.padding = 6 * k + 'px';
      node.style.textDecoration = [item.underline && 'underline', item.strike && 'line-through'].filter(Boolean).join(' ') || 'none';
      this.autoGrowEditor();
    }

    autoGrowEditor() {
      if (!this.editor) return;
      const node = this.editor.node;
      node.style.height = 'auto';
      node.style.height = node.scrollHeight + 'px';
    }

    closeTextEditor(discard) {
      if (!this.editor) return;
      const { item, isNew, node } = this.editor;
      const value = node.value;
      this.editor = null;
      node.remove();
      this.renderer.hiddenIds = null;

      if (!discard) {
        const next = M.patch(item, { text: value, h: this.measureTextHeight(item, value) });
        if (isNew) {
          if (value.trim()) {
            this.board.add(next, 'Text');
            this.ctrl.finishNonSticky();
          }
        } else if (value !== item.text) {
          if (value.trim()) this.board.replace({ [item.id]: next }, 'Text ändern');
          else this.board.remove(item.id, 'Text löschen');
        }
      }
      this.renderer.invalidate();
    }

    measureTextHeight(item, text) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.font = GN.render.fontString(item);
      const lines = GN.render.wrapText(ctx, text === undefined ? item.text : text, item.w - 12);
      ctx.restore();
      return Math.max(1, lines.length) * item.fontSize * item.lineSpacing + 12;
    }

    placeText(text, world) {
      const s = this.ctrl.settings.text;
      const item = M.create.text({ x: world.x - 180, y: world.y - 20, w: 360, text, ...styleOf(s) });
      this.board.add(M.patch(item, { h: this.measureTextHeight(item) }), 'Text einfügen');
    }

    /* ── Bilder ───────────────────────────────────────────────────────── */

    requestImage(world) {
      const target = world || this.viewCenter();
      pop.open({
        key: 'imagemenu',
        anchor: document.querySelector('[data-tool="image"]'),
        content: pop.menu([
          { title: 'Bild einfügen' },
          { label: 'Foto auswählen …', icon: 'photo', onClick: () => this.pickImageFile(target) },
          { label: 'Datei importieren …', icon: 'file', onClick: () => this.pickImageFile(target) },
          { label: 'Kamera aufnehmen …', icon: 'camera', disabled: true, sub: 'In diesem Mockup nicht verfügbar' },
          { label: 'Dokument scannen …', icon: 'scan', disabled: true, sub: 'In diesem Mockup nicht verfügbar' },
        ]),
      });
    }

    pickImageFile(world) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (file) this.placeImageFile(file, world || this.viewCenter());
      });
      input.click();
    }

    placeImageFile(file, world) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxW = (this.renderer.width * 0.4) / this.renderer.cam.scale;
          const ratio = img.naturalHeight / img.naturalWidth || 1;
          const w = Math.min(img.naturalWidth, maxW);
          const h = w * ratio;
          const item = M.create.image({ x: world.x - w / 2, y: world.y - h / 2, w, h, src: reader.result });
          this.board.add(item, 'Bild');
          this.ctrl.setTool('lasso');
          this.ctrl.select(new Set([item.id]));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    viewCenter() {
      return this.renderer.toWorld(this.renderer.width / 2, this.renderer.height / 2);
    }

    /* ── Menüs ────────────────────────────────────────────────────────── */

    openMoreMenu(anchor) {
      const dark = document.documentElement.dataset.theme === 'dark';
      pop.open({
        key: 'more',
        anchor,
        content: pop.menu([
          { label: 'Muster …', icon: 'template', chevron: true, onClick: () => defer(() => this.openTemplateMenu(anchor)) },
          { label: 'Papierfarbe …', icon: 'palette', chevron: true, onClick: () => defer(() => this.openPaperMenu(anchor)) },
          '=',
          { label: 'Alles auswählen', hint: '⌘A', icon: 'lasso', onClick: () => this.selectAll() },
          { label: 'Alles einpassen', hint: 'F', icon: 'fit', onClick: () => { this.renderer.fitContent(); this.onCameraChanged(); } },
          { label: 'Zoom auf 100 %', hint: '⌘0', icon: 'minimap', onClick: () => { this.renderer.resetZoom(); this.onCameraChanged(); } },
          '=',
          { switch: true, label: 'Dunkles Design', icon: 'moon', on: dark, onChange: (v) => this.applyTheme(v ? 'dark' : 'light') },
          { label: 'Tastenkürzel …', icon: 'info', chevron: true, onClick: () => defer(() => this.openShortcuts(anchor)) },
          '=',
          { label: 'Beispielinhalt einfügen', icon: 'star', onClick: () => this.seedDemo(true) },
          { label: 'Board leeren', icon: 'trash', danger: true, onClick: () => this.confirmClear() },
        ]),
      });
    }

    openTemplateMenu(anchor) {
      const grid = el('div', { class: 'tpl-grid' });
      for (const [id, label] of [['blank', 'Leer'], ['dots', 'Punkte'], ['grid', 'Karo'], ['lines', 'Linien']]) {
        grid.appendChild(
          el('button', {
            type: 'button',
            class: 'tpl-card' + (this.board.template === id ? ' is-on' : ''),
            onclick: () => {
              this.board.template = id;
              this.ws.emit('template');
              this.renderer.invalidate();
              pop.close();
            },
          }, [el('i', { dataset: { tpl: id } }), el('span', { text: label })])
        );
      }
      pop.open({
        key: 'template',
        anchor,
        content: el('div', {}, [el('div', { class: 'pop-header', text: 'Muster' }), grid]),
      });
    }

    openPaperMenu(anchor) {
      const grid = el('div', { class: 'tpl-grid paper-grid' });
      for (const [id, label] of [['white', 'Weiß'], ['yellow', 'Creme'], ['dark', 'Dunkel']]) {
        grid.appendChild(
          el('button', {
            type: 'button',
            class: 'tpl-card paper-card' + (this.board.paper === id ? ' is-on' : ''),
            onclick: () => {
              this.board.paper = id;
              this.ws.emit('paper');
              this.renderer.invalidate();
              // Mit dem Blatt wechselt auch, wie Tinte dargestellt wird — die
              // Farbfelder im Werkzeugmenü zeigen es mit.
              this.toolMenu.render();
              pop.close();
            },
          }, [el('i', { dataset: { paper: id } }), el('span', { text: label })])
        );
      }
      pop.open({
        key: 'paper',
        anchor,
        content: el('div', {}, [el('div', { class: 'pop-header', text: 'Papierfarbe' }), grid]),
      });
    }

    openShareMenu(anchor) {
      pop.open({
        key: 'share',
        anchor,
        content: pop.menu([
          { title: 'Teilen und exportieren' },
          { label: 'Als PNG exportieren', hint: '⌘E', icon: 'download', onClick: () => this.exportPNG() },
          { label: 'Als Datei sichern (JSON)', icon: 'file', onClick: () => this.exportJSON() },
          '-',
          { label: 'Bild in die Zwischenablage', icon: 'copy', onClick: () => this.copyPNG() },
        ]),
      });
    }

    openAccessories(anchor) {
      const stowed = (this.chrome.hiddenTools || [])
        .map((id) => GN.tools.TOOLS.find((t) => t.id === id))
        .filter(Boolean);

      pop.open({
        key: 'accessories',
        anchor,
        content: pop.menu([
          stowed.length ? { title: 'Schnellzugriff' } : null,
          ...stowed.map((t) => ({
            label: t.label,
            icon: t.icon,
            on: t.toggle ? this.ctrl.settings.ruler.visible : this.ctrl.active === t.id,
            onClick: () => {
              if (t.toggle) this.toggleRuler();
              else this.ctrl.setTool(t.id);
            },
          })),
          stowed.length ? '=' : null,
          { title: 'Zubehör' },
          // Steht das Lineal schon im Schnellzugriff, nicht doppelt zeigen.
          stowed.some((t) => t.id === 'ruler') ? null : {
            label: 'Lineal',
            sub: 'Einblenden und Striche einrasten lassen',
            icon: 'ruler',
            on: this.ctrl.settings.ruler.visible,
            onClick: () => this.toggleRuler(),
          },
          { label: 'Audioaufnahme', icon: 'mic', disabled: true, sub: 'In diesem Mockup nicht verfügbar' },
          { label: 'Kommentar hinzufügen', icon: 'comment', disabled: true, sub: 'In diesem Mockup nicht verfügbar' },
          '-',
          { label: 'Werkzeugleiste anpassen …', icon: 'customize', disabled: true },
        ]),
      });
    }

    openZoomMenu(anchor) {
      pop.open({
        key: 'zoom',
        anchor,
        placement: 'above',
        content: pop.menu(
          [{ title: 'Zoom' }].concat(
            GN.render.ZOOM_STOPS.map((z) => ({
              label: `${Math.round(z * 100)} %`,
              on: Math.abs(this.renderer.cam.scale - z) < 0.005,
              onClick: () => {
                this.renderer.zoomAt(this.renderer.width / 2, this.renderer.height / 2, z);
                this.onCameraChanged();
              },
            })).concat([
              '-',
              { label: 'Alles einpassen', hint: 'F', onClick: () => { this.renderer.fitContent(); this.onCameraChanged(); } },
            ])
          )
        ),
      });
    }

    openSearch(anchor) {
      if (!anchor) return;
      const results = el('div', { style: 'padding:4px 10px 8px;font-size:13px;color:var(--label-3)', text: 'Tippen, um Textfelder zu durchsuchen.' });
      const input = el('input', {
        class: 'field',
        type: 'text',
        placeholder: 'Im Board suchen',
        onkeydown: (e) => e.stopPropagation(),
        oninput: (e) => {
          const q = e.target.value.trim().toLowerCase();
          results.innerHTML = '';
          if (!q) {
            results.textContent = 'Tippen, um Textfelder zu durchsuchen.';
            return;
          }
          const hits = this.board.items.filter((i) => i.kind === 'text' && i.text.toLowerCase().includes(q));
          if (!hits.length) {
            results.textContent = 'Keine Treffer.';
            return;
          }
          for (const hit of hits.slice(0, 8)) {
            results.appendChild(
              pop.row({
                label: hit.text.slice(0, 40) + (hit.text.length > 40 ? '…' : ''),
                icon: 'filterText',
                onClick: () => {
                  const cx = (hit.bbox.x0 + hit.bbox.x1) / 2;
                  const cy = (hit.bbox.y0 + hit.bbox.y1) / 2;
                  const r = this.renderer;
                  r.cam.x = r.width / 2 - cx * r.cam.scale;
                  r.cam.y = r.height / 2 - cy * r.cam.scale;
                  r.invalidate();
                  this.onCameraChanged();
                },
              })
            );
          }
        },
      });
      pop.open({
        key: 'search',
        anchor,
        autofocus: true,
        content: el('div', { style: 'min-width:260px' }, [el('div', { style: 'padding:4px 6px 6px' }, [input]), results]),
      });
    }

    openAI(anchor) {
      pop.open({
        key: 'ai',
        anchor,
        content: pop.menu([
          { title: 'Goodnotes AI' },
          { label: 'Handschrift aufräumen', sub: 'Begradigt und glättet Striche', icon: 'aiSparkle', disabled: true },
          { label: 'In Text umwandeln', sub: 'Handschrifterkennung', icon: 'filterText', disabled: true },
          { label: 'Zusammenfassen', icon: 'comment', disabled: true },
          '-',
          { label: 'Diese Funktionen sind im Mockup nur angedeutet.', disabled: true },
        ]),
      });
    }

    openShortcuts(anchor) {
      const rows = [
        ['1 – 0, \\', 'Werkzeug wählen'],
        ['⌘Z / ⇧⌘Z', 'Rückgängig / Wiederholen'],
        ['Leertaste + Ziehen', 'Fläche verschieben'],
        ['⌘ + Scrollen', 'Zoomen'],
        ['F', 'Alles einpassen'],
        ['⌘0 / ⌘+ / ⌘−', 'Zoom 100 % / rein / raus'],
        ['⌘A', 'Alles auswählen'],
        ['⌘C / ⌘X / ⌘V', 'Kopieren / Ausschneiden / Einfügen'],
        ['⌘D', 'Duplizieren'],
        ['⌫', 'Auswahl löschen'],
        ['⌘F', 'Suchen'],
        ['⌘\\', 'Seitenleiste'],
        ['⇧⌘R', 'Lese-/Bearbeitungsmodus'],
        ['⌘E', 'Als PNG exportieren'],
        ['Umschalt beim Ziehen', 'Winkel rasten'],
        ['Am Strichende kurz halten', 'Strich begradigen'],
      ];
      const list = el('div', { style: 'padding:2px 6px 8px;display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px' });
      for (const [k, v] of rows) {
        list.appendChild(el('kbd', { text: k, style: 'font-family:var(--font);font-weight:600;white-space:nowrap' }));
        list.appendChild(el('span', { text: v, style: 'color:var(--label-2)' }));
      }
      pop.open({
        key: 'shortcuts',
        anchor,
        content: el('div', { style: 'min-width:320px' }, [el('div', { class: 'pop-header', text: 'Tastenkürzel' }), list]),
      });
    }

    confirmClear() {
      if (!this.board.items.length) {
        this.toast('Das Board ist bereits leer.');
        return;
      }
      pop.open({
        key: 'confirmclear',
        anchor: document.querySelector('[data-action="more"]'),
        content: pop.menu([
          { title: 'Board leeren' },
          { label: `${this.board.items.length} Objekte werden entfernt.`, disabled: true },
          '-',
          {
            label: 'Jetzt leeren',
            icon: 'trash',
            danger: true,
            onClick: () => {
              this.board.clear('Board geleert');
              this.ctrl.clearSelection();
              this.toast('Board geleert — ⌘Z macht es rückgängig');
            },
          },
        ]),
      });
    }

    /* ── Seitenleiste, Minimap ────────────────────────────────────────── */

    toggleSidebar() {
      const sb = document.getElementById('sidebar');
      sb.hidden = !sb.hidden;
      document.querySelector('[data-action="sidebar"]').setAttribute('aria-pressed', sb.hidden ? 'false' : 'true');
      setTimeout(() => {
        this.renderer.resize();
        this.chrome.renderSidebar();
        this.chrome.renderMinimap();
      }, 20);
    }

    toggleMinimap() {
      const map = document.getElementById('minimap');
      const btn = document.querySelector('[data-action="minimap"]');
      map.hidden = !map.hidden;
      btn.classList.toggle('is-on', !map.hidden);
      this.chrome.renderMinimap();
    }

    /* ── Export ───────────────────────────────────────────────────────── */

    exportPNG() {
      downloadURL(this.renderer.exportPNG(2), `${slug(this.board.title)}.png`);
      this.toast('PNG exportiert');
    }

    exportJSON() {
      const blob = new Blob([JSON.stringify(this.board.toJSON(), null, 2)], { type: 'application/json' });
      downloadURL(URL.createObjectURL(blob), `${slug(this.board.title)}.json`);
      this.toast('JSON gesichert');
    }

    async copyPNG() {
      try {
        const blob = await (await fetch(this.renderer.exportPNG(2))).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.toast('Bild in der Zwischenablage');
      } catch (err) {
        this.toast('Zwischenablage nicht verfügbar — PNG wird geladen');
        this.exportPNG();
      }
    }

    /* ── Design & Hinweise ────────────────────────────────────────────── */

    /**
     * Setzt das Design. `persist` unterscheidet die eigene Wahl von der
     * bloßen Übernahme des Systems: nur eine eigene Wahl wird gespeichert und
     * schlägt danach das System — in beide Richtungen.
     */
    applyTheme(theme, persist = true) {
      document.documentElement.dataset.theme = theme;
      GN.render.clearVarCache();
      this.renderer.invalidate();
      this.chrome.renderMinimap();
      this.toolMenu.render();
      if (!persist) return;
      try {
        localStorage.setItem('gn-theme', theme);
      } catch (err) { /* egal */ }
    }

    /** Ohne eigene Wahl folgt die App dem System auch später noch. */
    watchSystemTheme() {
      const mq = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)');
      if (!mq || !mq.addEventListener) return;
      mq.addEventListener('change', (e) => {
        if (readStored('gn-theme')) return;
        this.applyTheme(e.matches ? 'dark' : 'light', false);
      });
    }

    startClock() {
      const node = document.getElementById('statusTime');
      const tick = () => {
        const d = new Date();
        node.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      tick();
      setInterval(tick, 20000);
    }

    toast(message) {
      const node = document.getElementById('toast');
      node.textContent = message;
      node.hidden = false;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { node.hidden = true; }, 2400);
    }

    /* ── Beispielinhalt ───────────────────────────────────────────────── */

    measured(props) {
      const item = M.create.text(props);
      return M.patch(item, { h: this.measureTextHeight(item) });
    }

    seedDemo(append) {
      const c = this.viewCenter();
      const ox = c.x - 340;
      const oy = c.y - 220;
      const items = [];

      const title = this.measured({
        x: ox, y: oy, w: 430, text: 'Whiteboard', color: '#000000', fontSize: 40, bold: true,
      });
      items.push(
        M.create.stroke({
          tool: 'highlighter', pen: 'ball', color: '#FFF200', width: 26,
          points: sample(24, (t) => ({ x: ox + 4 + t * 236, y: oy + title.h - 22 + Math.sin(t * 2.4) * 2.5, p: 1 })),
        })
      );
      items.push(title);
      items.push(
        this.measured({
          x: ox, y: oy + title.h + 4, w: 410, fontSize: 16, color: '#3A3A3C',
          text: 'Unendliche Fläche. Stift, Textmarker, Klebeband, Formerkennung, Lasso, Text und Elemente — wie in GoodNotes.',
        })
      );

      // Haftnotizen als Textfelder mit Boxstil
      items.push(this.measured({
        x: ox + 470, y: oy + 4, w: 168, text: 'Ideen\nsammeln',
        color: '#FFD43B', fontSize: 21, bold: true, boxStyle: 'sticky', align: 'center',
      }));
      items.push(this.measured({
        x: ox + 470, y: oy + 140, w: 168, text: 'Struktur\nbauen',
        color: '#8CE99A', fontSize: 21, bold: true, boxStyle: 'sticky', align: 'center',
      }));

      // Handgezeichneter Kreis mit Beschriftung
      items.push(
        M.create.stroke({
          tool: 'pen', pen: 'fountain', color: '#007AFF', width: 4,
          points: sample(46, (t) => ({
            x: ox + 180 + Math.cos(t * Math.PI * 2 - 1.4) * 98,
            y: oy + 268 + Math.sin(t * Math.PI * 2 - 1.4) * 62,
            p: 0.35 + Math.sin(t * Math.PI) * 0.6,
          })),
        })
      );
      items.push(this.measured({
        x: ox + 108, y: oy + 250, w: 150, text: 'Skizze', color: '#007AFF', fontSize: 24, bold: true, align: 'center',
      }));

      // Pfeil (erkannte Form) und Klebeband
      items.push(M.create.shape({
        shape: 'arrow', color: '#FF3B30', width: 4,
        from: { x: ox + 296, y: oy + 262 }, to: { x: ox + 448, y: oy + 132 },
      }));
      items.push(M.create.tape({
        from: { x: ox + 8, y: oy + 372 }, to: { x: ox + 214, y: oy + 366 },
        width: 36, color: '#FFD8A8', pattern: 'stripes', opacity: 1,
      }));
      items.push(M.create.sticker({ x: ox + 660, y: oy + 74, size: 46, glyph: '💡' }));

      // Handschriftzug
      items.push(
        M.create.stroke({
          tool: 'pen', pen: 'fountain', color: '#000000', width: 3.4,
          points: sample(64, (t) => ({
            x: ox + 250 + t * 300,
            y: oy + 372 + Math.sin(t * 13) * 12 + Math.sin(t * 3) * 8,
            p: 0.3 + (Math.sin(t * 9) * 0.5 + 0.5) * 0.7,
          })),
        })
      );

      if (append) this.board.add(items, 'Beispielinhalt');
      else this.board.commit(items, 'Beispielinhalt');
      this.renderer.fitContent(150);
      this.onCameraChanged();
    }
  }

  /* ── Helfer ──────────────────────────────────────────────────────────── */

  function styleOf(s) {
    return {
      color: s.color,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      lineSpacing: s.lineSpacing,
      bold: s.bold,
      italic: s.italic,
      underline: s.underline,
      strike: s.strike,
      align: s.align,
      boxStyle: s.boxStyle,
    };
  }

  function sample(n, fn) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(fn(i / (n - 1)));
    return out;
  }

  function cloneShifted(raw, dx, dy) {
    const copy = JSON.parse(JSON.stringify(raw));
    copy.id = geo.uid(copy.kind.slice(0, 2));
    return M.transformItem(Object.freeze(copy), { dx, dy });
  }

  function downloadURL(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'whiteboard';
  }

  /** Das Design des Systems. Der Stempel am Wurzelelement wird bewusst NICHT
   *  gelesen: er stammt aus dem Kopf von index.html und trägt genau das, was in
   *  readStored('gn-theme') steht — ihn hier noch einmal zu befragen, hieße das
   *  System nie zu fragen. */
  function preferredTheme() {
    return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function readStored(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  const defer = (fn) => setTimeout(fn, 10);

  function boot() {
    global.gnApp = new App();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
