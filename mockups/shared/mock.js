/* ============================================================================
 * mock.js — Icons und Bedienung der Mockup-Seiten
 *
 * Die Bedienleiste oben rechts gehört NICHT zum Entwurf. Sie schaltet nur
 * zwischen hell/dunkel und den beiden Dynamic-Type-Stufen um, damit man beide
 * Fassungen im selben Dokument prüfen kann.
 * ========================================================================== */
(function (global) {
  'use strict';

  const s = (body, opts) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(opts && opts.w) || 1.7}"` +
    ` stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  const ICONS = {
    /* Module */
    today:    s('<path d="M12 3.6v2M12 18.4v2M3.6 12h2M18.4 12h2M6.1 6.1l1.4 1.4M16.5 16.5l1.4 1.4M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4"/><circle cx="12" cy="12" r="4.1"/>'),
    library:  s('<rect x="3.4" y="4.2" width="6" height="15.6" rx="1.6"/><rect x="11" y="4.2" width="4.4" height="15.6" rx="1.4"/><path d="m17.2 5.6 3 15.1"/>'),
    notes:    s('<rect x="4.2" y="3.2" width="15.6" height="17.6" rx="2.6"/><path d="M8 8.4h8M8 12h8M8 15.6h5"/>'),
    journal:  s('<path d="M5 4.6A1.6 1.6 0 0 1 6.6 3h11.8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.6A1.6 1.6 0 0 1 5 19.4Z"/><path d="M5 17.4h13.4M9 3v18"/>'),
    tasks:    s('<circle cx="7" cy="7" r="2.6"/><circle cx="7" cy="17" r="2.6"/><path d="M12.4 7h7.2M12.4 17h7.2"/>'),
    cards:    s('<rect x="3.2" y="6.6" width="13.4" height="11.8" rx="2.2"/><path d="M7.4 5.2h9a2.2 2.2 0 0 1 2.2 2.2v9"/><path d="M6.8 12h6"/>'),
    graph:    s('<circle cx="6" cy="17.5" r="2.5"/><circle cx="17.6" cy="16" r="2.2"/><circle cx="12" cy="6.4" r="2.8"/><path d="m7.6 15.4 3-6.4M13.9 8.5l2.8 5.5M8.4 17.9l6.8-1.3"/>'),
    canvas:   s('<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.6"/><path d="M6.8 15c1.8-5.2 4.2-5.4 5.6-2 1 2.4 2.8 2.6 5.2-2.2"/>'),
    settings: s('<circle cx="12" cy="12" r="3.1"/><path d="M19.2 14.4a1.5 1.5 0 0 0 .3 1.65l.06.06a1.8 1.8 0 1 1-2.55 2.55l-.06-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V20a1.8 1.8 0 0 1-3.6 0v-.1a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06A1.8 1.8 0 1 1 4.5 16.4l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H3.3a1.8 1.8 0 0 1 0-3.6h.1a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65L4.4 7.5A1.8 1.8 0 1 1 6.96 4.95l.06.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V3.8a1.8 1.8 0 0 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06A1.8 1.8 0 1 1 18.4 7.46l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.19a1.8 1.8 0 0 1 0 3.6h-.1a1.5 1.5 0 0 0-1.37.9Z"/>'),

    /* Aktionen */
    plus:     s('<path d="M12 4.8v14.4M4.8 12h14.4"/>'),
    minus:    s('<path d="M4.8 12h14.4"/>'),
    search:   s('<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.4 15.4 4.2 4.2"/>'),
    close:    s('<path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6"/>'),
    check:    s('<path d="m5 12.6 5 5 9-10.6"/>', { w: 2 }),
    more:     s('<circle cx="5.6" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.4" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
    chevR:    s('<path d="m9.6 6 5.8 6-5.8 6"/>'),
    chevD:    s('<path d="m6 9.6 6 5.8 6-5.8"/>'),
    chevL:    s('<path d="m14.4 6-5.8 6 5.8 6"/>'),
    filter:   s('<path d="M4.4 6.4h15.2M7.4 12h9.2M10.2 17.6h3.6"/>'),
    sort:     s('<path d="M7 4.6v14.8M7 19.4 3.8 16M17 19.4V4.6M17 4.6 20.2 8"/>'),
    star:     s('<path d="m12 3.8 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8Z"/>'),
    pin:      s('<path d="M9 3.6h6l-.8 5.6 3 3.2H6.8l3-3.2Z"/><path d="M12 12.4V20.4"/>'),
    tag:      s('<path d="M11.4 3.6H19a1.4 1.4 0 0 1 1.4 1.4v7.6a2 2 0 0 1-.6 1.4l-6.4 6.4a1.4 1.4 0 0 1-2 0l-7-7a1.4 1.4 0 0 1 0-2l6.6-6.6a2 2 0 0 1 1.4-.6Z"/><circle cx="16" cy="8" r="1.4"/>'),
    link:     s('<path d="M9.6 14.4a4 4 0 0 0 5.7 0l3.1-3.1a4 4 0 0 0-5.7-5.7l-1.7 1.7"/><path d="M14.4 9.6a4 4 0 0 0-5.7 0l-3.1 3.1a4 4 0 0 0 5.7 5.7l1.7-1.7"/>'),
    clock:    s('<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3 1.8"/>'),
    calendar: s('<rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4"/><path d="M3.6 9.6h16.8M8.2 3.4v3.2M15.8 3.4v3.2"/>'),
    flag:     s('<path d="M5.6 20.4V4.2M5.6 4.6h11.6l-2 3.5 2 3.5H5.6"/>'),
    photo:    s('<rect x="3.4" y="5" width="17.2" height="14" rx="2.6"/><circle cx="8.4" cy="9.6" r="1.7"/><path d="m4 17.4 4.2-4.2a1.6 1.6 0 0 1 2.3 0l3.1 3.1 1.8-1.8a1.6 1.6 0 0 1 2.3 0l2.3 2.3"/>'),
    mic:      s('<rect x="9.2" y="3" width="5.6" height="10.6" rx="2.8"/><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6v3.4"/>'),
    map:      s('<path d="M3.6 6.4 9 4.4v13.2l-5.4 2Z"/><path d="M9 4.4l6 2v13.2l-6-2M15 6.4l5.4-2v13.2l-5.4 2"/>'),
    location: s('<path d="M12 21c4-4.6 6-7.9 6-10.4a6 6 0 1 0-12 0C6 13.1 8 16.4 12 21Z"/><circle cx="12" cy="10.4" r="2.2"/>'),
    flame:    s('<path d="M12 3.4c2.6 3.4 5.6 5.1 5.6 9.1A5.6 5.6 0 0 1 6.4 12.5c0-1.6.7-2.9 1.7-4 .3 1.2 1 1.9 1.8 2.1-.3-3 .9-5.4 2.1-7.2Z"/>'),
    undo:     s('<path d="M4.4 9.6h9.4a5.2 5.2 0 0 1 0 10.4H9"/><path d="m8.8 5.2-4.4 4.4 4.4 4.4"/>'),
    share:    s('<path d="M12 3.8v11.4M8.4 7.4 12 3.8l3.6 3.6"/><path d="M7.4 10.4H6a2 2 0 0 0-2 2v6.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.2a2 2 0 0 0-2-2h-1.4"/>'),
    trash:    s('<path d="M4.4 7.2h15.2M9.4 7.2V5.6A1.6 1.6 0 0 1 11 4h2a1.6 1.6 0 0 1 1.6 1.6v1.6"/><path d="m6.6 7.2.9 11.6A1.6 1.6 0 0 0 9.1 20.3h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-11.6"/>'),
    folder:   s('<path d="M3.6 7.4a2 2 0 0 1 2-2h3.2l2.2 2.4h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2Z"/>'),
    doc:      s('<path d="M6.4 3.4h7l4.2 4.2v13a1.6 1.6 0 0 1-1.6 1.6H6.4a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6Z"/><path d="M13.4 3.4v4.2h4.2"/>'),
    grid:     s('<rect x="3.6" y="3.6" width="7" height="7" rx="1.8"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.8"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.8"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.8"/>'),
    list:     s('<path d="M4.4 6.6h15.2M4.4 12h15.2M4.4 17.4h15.2"/>'),
    play:     s('<path d="M8.4 5.6 18 12l-9.6 6.4Z"/>'),
    edit:     s('<path d="M7.6 15.2 9 11.6l7.2-7.2a1.7 1.7 0 0 1 2.4 2.4l-7.2 7.2Z"/><path d="M4.4 20.4h15.2"/>'),
    alert:    s('<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/>'),
    info:     s('<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.4"/><circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none"/>'),
    sun:      s('<circle cx="12" cy="12" r="4"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>'),
    moon:     s('<path d="M20.2 14.4A8.6 8.6 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z"/>'),
    inbox:    s('<path d="M3.6 13.4h4l1.4 2.6h6l1.4-2.6h4"/><path d="M5.4 5.4h13.2l1.8 8v4.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2V13.4Z"/>'),
    moon2:    s('<path d="M20.2 14.4A8.6 8.6 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z"/>'),
    box:      s('<path d="M3.6 8.4 12 4.2l8.4 4.2-8.4 4.2Z"/><path d="M3.6 8.4v7.2L12 19.8l8.4-4.2V8.4M12 12.6v7.2"/>'),
    lock:     s('<rect x="4.8" y="10.2" width="14.4" height="10" rx="2.4"/><path d="M8.2 10.2V7.8a3.8 3.8 0 0 1 7.6 0v2.4"/>'),
    cloud:    s('<path d="M7 18.4a4 4 0 0 1-.5-8 5.6 5.6 0 0 1 10.8 1.3A3.4 3.4 0 0 1 17 18.4Z"/>'),
    heart:    s('<path d="M12 20.2 4.9 13.3a4.4 4.4 0 0 1 6.2-6.2l.9.9.9-.9a4.4 4.4 0 0 1 6.2 6.2Z"/>'),
    bolt:     s('<path d="M13.4 3.4 5.6 13.4h5.4l-.8 7.2 8-10h-5.4Z"/>'),
    quote:    s('<path d="M9.4 6.4C6.8 7.6 5.4 9.8 5.4 13v4.6h5.4V12H8.2c0-1.7.4-2.8 1.2-3.4Zm9 0c-2.6 1.2-4 3.4-4 6.6v4.6h5.4V12h-2.6c0-1.7.4-2.8 1.2-3.4Z"/>'),
    layers:   s('<path d="M12 3.8 3.6 8 12 12.2 20.4 8Z"/><path d="m3.6 12.4 8.4 4.2 8.4-4.2M3.6 16.6 12 20.8l8.4-4.2"/>'),
    hand:     s('<path d="M8.4 11.2V5.9a1.65 1.65 0 1 1 3.3 0v4.6M11.7 10.5V4.7a1.65 1.65 0 1 1 3.3 0v5.8M15 10.9V6.8a1.65 1.65 0 1 1 3.3 0v7.8c0 3.4-2.4 5.8-5.8 5.8h-1.1c-2 0-3.3-.8-4.3-2.4l-2.6-4.3a1.6 1.6 0 0 1 2.5-2l1.4 1.6"/>'),
  };

  function hydrate(root) {
    (root || document).querySelectorAll('[data-ico]').forEach((el) => {
      const n = el.getAttribute('data-ico');
      if (ICONS[n] && el.dataset.done !== n) {
        el.innerHTML = ICONS[n];
        el.dataset.done = n;
      }
    });
  }

  function controls() {
    if (document.querySelector('.controls')) return;
    const bar = document.createElement('div');
    bar.className = 'controls';
    bar.innerHTML =
      '<button data-set="theme" data-val="light">Hell</button>' +
      '<button data-set="theme" data-val="dark">Dunkel</button>' +
      '<button data-set="type" data-val="standard">Aa</button>' +
      '<button data-set="type" data-val="gross">Aa groß</button>';
    document.body.appendChild(bar);

    const apply = () => {
      const t = document.documentElement.dataset.theme || 'light';
      const y = document.documentElement.dataset.type || 'standard';
      bar.querySelectorAll('button').forEach((b) => {
        const on = (b.dataset.set === 'theme' && b.dataset.val === t) || (b.dataset.set === 'type' && b.dataset.val === y);
        b.classList.toggle('is-on', on);
      });
    };
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      document.documentElement.dataset[b.dataset.set] = b.dataset.val;
      apply();
    });
    if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = 'light';
    if (!document.documentElement.dataset.type) document.documentElement.dataset.type = 'standard';
    apply();
  }

  /* ══════════════════════════════════════════════════════════════════════
   * Screen-Navigation — gehört wie die Bedienleiste NICHT zum Entwurf.
   *
   * Jeder der 19 Entwurfs-Schirme ist ohne sie eine Sackgasse: In einem
   * heruntergeladenen Ordner, den man per Doppelklick öffnet, gibt es oft
   * keinen Zurück-Weg. Die Leiste sitzt unten mittig und schwebt über dem
   * Gerätrahmen — die Bedienleiste sitzt oben rechts, sie stören sich nicht.
   * ==================================================================== */

  /* Reihenfolge und deutsche Anzeigenamen. Feste Ordnung, kein Sortieren. */
  const SCREENS = {
    'app-next': [
      ['today.html',           'Heute'],
      ['library.html',         'Bibliothek'],
      ['notes-list.html',      'Notizen-Liste'],
      ['note-editor.html',     'Notiz-Editor'],
      ['journal-home.html',    'Journal'],
      ['journal-entry.html',   'Journal-Eintrag'],
      ['tasks.html',           'Aufgaben'],
      ['task-detail.html',     'Aufgaben-Detail'],
      ['flashcards-home.html', 'Lernkarten'],
      ['review-session.html',  'Review-Session'],
      ['graph.html',           'Graph'],
      ['settings.html',        'Einstellungen'],
      ['leere-zustaende.html', 'Leere Zustände'],
    ],
    'best-of': [
      ['library.html',    'Bibliothek'],
      ['today.html',      'Heute'],
      ['notes.html',      'Notizen'],
      ['journal.html',    'Journal'],
      ['tasks.html',      'Aufgaben'],
      ['flashcards.html', 'Lernkarten'],
    ],
  };

  const OVERVIEW = '../index.html';

  /* Wo stehen wir? Aus dem Pfad Ordner und Dateiname ziehen. Ist einer von
     beiden nicht in der Liste (z. B. auf der Übersichtsseite), entsteht
     nichts — die Funktion gibt null zurück. */
  function locate() {
    let path;
    try { path = decodeURIComponent(location.pathname); } catch (e) { path = location.pathname; }
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const file = parts[parts.length - 1].toLowerCase();
    const folder = parts[parts.length - 2].toLowerCase();
    const list = SCREENS[folder];
    if (!list) return null;
    const index = list.findIndex((entry) => entry[0] === file);
    if (index < 0) return null;
    return { list, index };
  }

  const NAV_CSS = `
/* Eigene Tokens, damit die Leiste auch ohne system.css trägt.
   Drei Theme-Zustände: blankes :root, Systemvorliebe, ausdrückliche Wahl.
   Auch Tinte, Akzent und Füllung stehen hier — und werden NICHT aus
   system.css geliehen. Denn system.css schaltet allein über
   [data-theme="dark"] und kennt keine Systemvorliebe: liehe sich die
   Leiste --ink-1, bliebe die Schrift im mittleren der drei Zustände
   dunkel, während dieser Block den Pillengrund dunkel färbt — schwarz
   auf schwarz. Die Werte sind dieselben wie in system.css, im gesetzten
   Zustand ändert sich also nichts. */
/* --nav-off ist die einzige Sonderfarbe: der deaktivierte Zustand.
   Gerechnet gegen den gemessenen Leistengrund (hell rgb(249,249,250),
   dunkel rgb(23,25,28)) — 4,89:1 hell, 5,42:1 dunkel, beide über den
   geforderten 4,5:1. Deutlich schwächer bleibt er trotzdem: die aktiven
   Ziele stehen bei 16,8:1 hell und 15,8:1 dunkel. Er hängt nie an der
   Farbe allein: deaktiviert ist zusätzlich Gewicht 400 statt 600 und
   ohne Hover-Fläche — und unter 640px, wo der Name entfällt und nur das
   Winkelzeichen bliebe, wird er gar nicht erst gezeigt. */
:root {
  --nav-bg:     rgba(249,249,250,0.95);
  --nav-edge:   rgba(22,24,28,0.10);
  --nav-rule:   rgba(22,24,28,0.14);
  --nav-ink:    #16181C;
  --nav-ink-2:  rgba(22,24,28,0.64);
  --nav-fill:   rgba(22,24,28,0.05);
  --nav-on:     #FFFFFF;
  --nav-off:    rgba(22,24,28,0.62);
  --nav-shadow: 0 2px 6px rgba(22,24,28,.08), 0 14px 36px rgba(22,24,28,.14);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --nav-bg:     rgba(24,26,29,0.94);
    --nav-edge:   rgba(242,243,245,0.14);
    --nav-rule:   rgba(242,243,245,0.16);
    --nav-ink:    #F2F3F5;
    --nav-ink-2:  rgba(242,243,245,0.64);
    --nav-fill:   rgba(242,243,245,0.07);
    --nav-on:     #0E0F11;
    --nav-off:    rgba(242,243,245,0.54);
    --nav-shadow: 0 2px 8px rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.6);
  }
}
:root[data-theme="dark"] {
  --nav-bg:     rgba(24,26,29,0.94);
  --nav-edge:   rgba(242,243,245,0.14);
  --nav-rule:   rgba(242,243,245,0.16);
  --nav-ink:    #F2F3F5;
  --nav-ink-2:  rgba(242,243,245,0.64);
  --nav-fill:   rgba(242,243,245,0.07);
  --nav-on:     #0E0F11;
  --nav-off:    rgba(242,243,245,0.54);
  --nav-shadow: 0 2px 8px rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.6);
}

/* Platz am Fuß, damit die Leiste nie das letzte Stück Seite verdeckt. */
body.has-screennav { padding-bottom: 104px; }

/* left und right spannen das Band auf, margin-inline:auto zentriert darin.
   Wichtig: NICHT left:50% + translateX(-50%). Für ein fixiertes Element
   ohne right ist die Breite, gegen die geschrumpft wird, nur die halbe
   Fensterbreite — dann läuft der letzte Pfeil unten aus der Pille heraus
   und oben kürzt der Nachbarname, obwohl das Fenster halb leer ist.
   width:max-content nimmt die natürliche Breite, max-width deckelt sie. */
.screennav {
  position: fixed; z-index: 240;
  left: 12px; right: 12px; bottom: 20px;
  margin-inline: auto;
  width: max-content; max-width: calc(100% - 24px);
  display: flex; align-items: center; gap: 2px;
  padding: 5px;
  border-radius: 999px;
  background: var(--nav-bg);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: var(--nav-shadow), inset 0 0 0 1px var(--nav-edge);
  font-family: var(--sans, -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif);
}

.screennav a,
.screennav .screennav__step {
  display: inline-flex; align-items: center; gap: 7px;
  min-height: 44px; padding: 0 14px;
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap; min-width: 0;
  font-family: inherit; font-weight: 600; font-size: 15px; line-height: 20px;
  letter-spacing: -.006em;
  color: var(--nav-ink);
}

/* Einziger primärer CTA der Leiste — deshalb der Ink-Akzent.
   Schrumpft nie: sonst liefe die Beschriftung aus ihrer eigenen Fläche. */
.screennav__home {
  flex: 0 0 auto;
  background: var(--nav-ink);
  color: var(--nav-on) !important;
}
.screennav__home:hover { opacity: .88; }

.screennav__rule {
  flex: 0 0 auto; width: 1px; height: 24px; margin: 0 5px;
  background: var(--nav-rule);
}

/* Aktiv: Text in voller Ink-Stärke, Fläche auf Hover.
   Deaktiviert: neben der schwächeren Farbe drei weitere Merkmale —
   Gewicht 400 statt 600, keine Hover-Fläche, kein Fokusziel. Die Farbe
   trägt den Zustand also nie allein. */
.screennav__step:hover { background: var(--nav-fill); }
.screennav__step.is-off {
  color: var(--nav-off);
  font-weight: 400;
  pointer-events: none;
  background: none;
}

/* Nur der Nachbarname darf schrumpfen — er kürzt dann mit Auslassung.
   Pfeil, Position und Übersicht bleiben immer vollständig. Weil die
   Leiste ihre natürliche Breite nimmt, greift das Kürzen erst, wenn das
   Fenster wirklich zu schmal ist, nicht schon bei halb leerem Schirm. */
.screennav .screennav__step { flex: 0 1 auto; }
.screennav__arrow { flex: 0 0 auto; font-size: 15px; line-height: 20px; }
.screennav__name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

.screennav__pos {
  flex: 0 0 auto; padding: 0 10px;
  font-family: inherit; font-weight: 400; font-size: 13px; line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--nav-ink-2);
}

/* Der Ring sitzt durch den Versatz außerhalb der Fläche, also auch beim
   Übersicht-Knopf auf dem Pillengrund und nicht auf seiner eigenen
   Ink-Fläche. Eine Sonderregel für ihn braucht es deshalb nicht. */
.screennav a:focus-visible {
  outline: 2px solid var(--nav-ink);
  outline-offset: 2px;
}

/* Schmale Fenster: die Nachbarnamen dürfen weichen, Pfeile und Position
   bleiben. Die Leiste selbst wird nie breiter als das Fenster.
   Weil ohne Namen vom deaktivierten Schritt nur das Winkelzeichen übrig
   bliebe — und Gewicht an einem Winkelzeichen nichts trägt —, stünde er
   dort allein durch die Farbe gegen den aktiven. Deshalb entfällt er hier
   ganz: das zweite Merkmal ist dann die Fläche, nämlich keine.
   Der Pfeil trägt hier allein, also 17/23 statt 15/20 — beide Paare
   stehen so in der Skala. */
@media (max-width: 639px) {
  .screennav { bottom: 12px; gap: 0; }
  .screennav__name { display: none; }
  .screennav .screennav__step.is-off { display: none; }
  .screennav__arrow { font-size: 17px; line-height: 23px; }
  .screennav a, .screennav .screennav__step { padding: 0 12px; }
  .screennav__pos { padding: 0 6px; }
}

@media print {
  .screennav, .controls { display: none !important; }
  body.has-screennav { padding-bottom: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .screennav a { transition: none; }
}
`;

  function step(dir, list, index) {
    const target = list[index + dir];
    const name = target ? target[1] : (dir < 0 ? 'Anfang' : 'Ende');
    const arrow = dir < 0 ? '‹' : '›';
    const label = dir < 0 ? 'Vorherige Ansicht' : 'Nächste Ansicht';
    const inner = dir < 0
      ? `<span class="screennav__arrow" aria-hidden="true">${arrow}</span><span class="screennav__name">${name}</span>`
      : `<span class="screennav__name">${name}</span><span class="screennav__arrow" aria-hidden="true">${arrow}</span>`;
    if (!target) {
      return `<span class="screennav__step is-off" aria-disabled="true" title="${label}: nicht vorhanden">${inner}</span>`;
    }
    return `<a class="screennav__step" href="${target[0]}" rel="${dir < 0 ? 'prev' : 'next'}"` +
           ` title="${label}: ${name}" aria-label="${label}: ${name}">${inner}</a>`;
  }

  function screennav() {
    if (document.querySelector('.screennav')) return;
    const here = locate();
    if (!here) return;
    const { list, index } = here;

    if (!document.getElementById('screennav-style')) {
      const style = document.createElement('style');
      style.id = 'screennav-style';
      style.textContent = NAV_CSS;
      document.head.appendChild(style);
    }

    const nav = document.createElement('nav');
    nav.className = 'screennav';
    nav.setAttribute('aria-label', 'Entwurfs-Ansichten');
    nav.innerHTML =
      `<a class="screennav__home" href="${OVERVIEW}" title="Zur Übersicht (Taste U)">Übersicht</a>` +
      '<span class="screennav__rule" aria-hidden="true"></span>' +
      step(-1, list, index) +
      `<span class="screennav__pos">${index + 1} von ${list.length}</span>` +
      step(1, list, index);
    document.body.appendChild(nav);
    document.body.classList.add('has-screennav');

    /* Tastatur — nur, solange nichts den Fokus hält. Der Fokus muss auf dem
       Dokument selbst liegen; sitzt er auf irgendetwas Bedienbarem (Feld,
       Knopf, Link, contenteditable), gehören die Tasten diesem Element und
       nicht der Leiste. Escape ist bewusst NICHT belegt: das ist die Taste
       zum Schließen, nicht zum Verlassen — sonst verließe sie später eine
       Seite, auf der ein Overlay zugehen sollte. */
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const el = document.activeElement;
      if (el && el !== document.body && el !== document.documentElement) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
      let href = null;
      if (e.key === 'ArrowLeft')  href = list[index - 1] ? list[index - 1][0] : null;
      else if (e.key === 'ArrowRight') href = list[index + 1] ? list[index + 1][0] : null;
      else if (e.key === 'u' || e.key === 'U') href = OVERVIEW;
      if (!href) return;
      e.preventDefault();
      location.href = href;
    });
  }

  function boot() {
    hydrate(document);
    controls();
    screennav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.MOCK = { hydrate, ICONS };
})(window);
