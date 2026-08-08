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

  function boot() {
    hydrate(document);
    controls();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.MOCK = { hydrate, ICONS };
})(window);
