/* tote-knoepfe.js — was sieht bedienbar aus und ist es nicht?

   Aufruf:  node tools/tote-knoepfe.js
   Ablage:  $PV_AUS/tote-knoepfe.json  (Vorgabe /tmp)

   Gemessen wird am GEBAUTEN Prototyp (mockups/prototyp/index.html), nicht an
   der Einzeldatei — dort laufen dieselben Skripte, aber ein Fehler waere
   schwerer zuzuordnen.

   Lebendig heisst hier: das Element oder ein Vorfahr traegt .pv-lebt, oder es
   traegt data-bw (ein Signature-Moment), oder data-pv-haken. Der Mauszeiger
   taugt NICHT als Mass — system.css setzt button { cursor: pointer }, und das
   vererbt sich: eine Messung ueber cursor meldete 4271 von 4605 Elementen als
   bedienbar. Wer hier etwas aendert, misst ueber die Klassen oder ueber
   document.elementFromPoint, nie ueber den Zeiger.

   Ergebnis der Runde vom 10. August: 0 tote <button>. Steigt die Zahl wieder,
   fehlt in prototyp.js §14 eine Familie. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const D = 'file:///home/user/Mocktest/mockups/prototyp/index.html';

const SCHIRME = ['heute','bibliothek','eingang','notizen','notiz','journal','journal-eintrag',
  'aufgaben','aufgabe','lernkarten','lernsitzung','semester','graph','suche','einstellungen',
  'leere-zustaende'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1700, height: 1150 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(D, { waitUntil: 'load' }); await p.waitForTimeout(1500);

  const alles = [];
  for (const geraet of ['ipad','iphone']) {
    await p.evaluate(g => PROTOTYP.geraet(g), geraet);
    await p.waitForTimeout(400);
    for (const s of SCHIRME) {
      await p.evaluate(k => PROTOTYP.gehen(k), s);
      await p.waitForTimeout(500);
      const fund = await p.evaluate(({ s, geraet }) => {
        const huelle = [...document.querySelectorAll('[data-pv-screen]')]
          .filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
        if (!huelle) return [];
        const rahmen = huelle.querySelector('.screen--' + geraet) || huelle;
        if (!rahmen || rahmen.getBoundingClientRect().width < 100) return [];
        const KANDIDAT = 'button, [role="button"], a[href], .chip, .row, .navitem, .segmented > *, .handoff__btn, .iconbtn, .btn, .card--flat, .book, input, .toggle, .switch, .t-label';
        const raus = [];
        const gesehen = new Set();
        rahmen.querySelectorAll(KANDIDAT).forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) return;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return;
          /* nur das äußerste Kandidatenelement je Stelle */
          if (el.parentElement && el.parentElement.closest(KANDIDAT)) return;
          const lebt = !!el.closest('.pv-lebt');
          const bw = !!el.closest('[data-bw]:not([data-bw-aus])');
          const nativ = el.matches('input, textarea, select') || el.isContentEditable;
          if (lebt || bw || nativ) return;
          /* trifft die Mitte wirklich dieses Element? */
          const mx = Math.round(r.left + r.width / 2), my = Math.round(r.top + r.height / 2);
          const oben = document.elementFromPoint(mx, my);
          const getroffen = oben && (el.contains(oben) || oben === el);
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
            || el.getAttribute('aria-label') || el.className;
          /* Bauform grob */
          const bg = cs.backgroundColor;
          const ink = /rgba?\(\s*(2[0-9]|3[0-9]|4[0-9]|5[0-9]),\s*(4[0-9]|5[0-9]|6[0-9]|7[0-9]),/.test(bg);
          const pfad = (function (n) {
            const teile = [];
            while (n && n !== rahmen && teile.length < 4) {
              let t = n.tagName.toLowerCase();
              if (n.id) { teile.unshift('#' + n.id); break; }
              if (n.className && typeof n.className === 'string') t += '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.');
              teile.unshift(t); n = n.parentElement;
            }
            return teile.join(' › ');
          })(el);
          const k = s + '|' + geraet + '|' + pfad + '|' + txt;
          if (gesehen.has(k)) return; gesehen.add(k);
          raus.push({ s, geraet, txt, pfad, w: Math.round(r.width), h: Math.round(r.height), getroffen, ink, tag: el.tagName.toLowerCase() });
        });
        return raus;
      }, { s, geraet });
      alles.push(...fund);
    }
  }
  fs.writeFileSync((process.env.PV_AUS || '/tmp') + '/tote-knoepfe.json', JSON.stringify(alles, null, 1));
  const proSchirm = {};
  alles.forEach(a => { const k = a.s + ' · ' + a.geraet; proSchirm[k] = (proSchirm[k] || 0) + 1; });
  console.log('TOT GESAMT:', alles.length, '| Seitenfehler:', errs.length ? errs.slice(0,3) : 'keine');
  Object.entries(proSchirm).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(3) + '  ' + k));
  await b.close();
})();
