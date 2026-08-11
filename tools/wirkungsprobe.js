/* wirkungsprobe.js — jeder oertlich wirkende Knopf wird wirklich gedrueckt,
   und danach wird gefragt: hat sich das Bild veraendert?

   Aufruf:  node tools/wirkungsprobe.js
   Ablage:  $PV_AUS/wirkung.json  (Vorgabe /tmp)

   Geprueft werden nur die Elemente, deren Weg auf 'nichts' zeigt — die also
   an Ort und Stelle wirken sollen. Die navigierenden Wege pruefen die
   Schirmwechsel selbst.

   Das Mass ist eine Signatur aus allen Kaesten und Klassennamen des
   sichtbaren Schirms plus dem Fusstext. Aendert sie sich nicht, heisst das
   STARR — und STARR ist der Befund, den diese Runde auf null bringen sollte.

   Zwei bekannte Einschraenkungen, damit sie nicht wieder untersucht werden:
     · Ein Ziel unterhalb der Falz wird als 'ausserhalb' gemeldet, nicht
       geklickt. Wer es pruefen will, muss vorher scrollIntoView rufen.
     · Ein Haken, der nur eine Klasse an einem 22-pt-Kaestchen umlegt, faellt
       durch, wenn das Kaestchen ausserhalb des Ausschnitts liegt.

   Ergebnis der Runde vom 10. August: 203 veraendert, 16 gewechselt, 15 STARR
   — und alle 15 sind „du bist schon hier" (der Seitenleisteneintrag des
   laufenden Schirms).

   ══ WAS DIESES WERKZEUG NICHT KANN ══════════════════════════════════════

   Es misst, DASS sich etwas veraendert hat. Nicht, ob sich das Richtige
   veraendert hat. Die Abnahme vom 11. August hat sechs Flaechen gefunden,
   die hier als „veraendert" durchgingen und in Wahrheit nichts taten:

     Suche, alle fuenf Filterchips   jeder liefert dieselben drei Karten
     Suche, Chip „Notizen"           der Wortstamm 'notize' trifft nichts
     Notizen iPhone, Chipreihe       kein Chip wird ueberhaupt belebt
     Graph, Modulreihe               sucht Karten, die es dort nicht gibt
     Graph, Tag-Chips                heben 0 von 23 Knoten hervor
     Lernkarten, Sortierung          die Waehler treffen 0 Elemente

   In jedem dieser Faelle wanderte die Fuellung des angetippten Chips — und
   das allein aendert die Signatur schon. Ein Filter, der seine eigene
   Auswahl umlegt und sonst nichts, sieht von hier aus aus wie einer, der
   funktioniert.

   Das Ergebnis dieses Werkzeugs ist darum eine UNTERE SCHRANKE: was hier
   STARR heisst, ist sicher tot; was hier „veraendert" heisst, ist nur
   nicht-tot. Wer wissen will, ob ein Knopf haelt, was er verspricht, muss
   das Versprechen kennen — und dazu braucht es je Bedienelement eine
   Erwartung („nach dem Tap auf ‚Notizen' stehen nur noch Notizen da"), nicht
   einen Vergleich zweier Signaturen. Bis die im Werkzeug steht, ersetzt
   diese Probe keine Abnahme. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const S = process.env.PV_AUS || '/tmp';
const SCHIRME = ['heute','bibliothek','eingang','notizen','notiz','journal','journal-eintrag',
  'aufgaben','aufgabe','lernkarten','lernsitzung','semester','graph','suche','einstellungen','leere-zustaende'];

const sig = () => {
  const h = [...document.querySelectorAll('[data-pv-screen]')].filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
  if (!h) return 'kein-schirm';
  const teile = [];
  h.querySelectorAll('*').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    teile.push(Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + ',' + Math.round(r.height) + ',' + (e.className || '').toString().slice(0, 30));
  });
  return teile.length + '|' + teile.join(';').length + '|' + (document.querySelector('.pv-fuss') || {}).textContent;
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1700, height: 1150 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/Mocktest/mockups/prototyp/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(1400);

  const bericht = [];
  for (const g of ['ipad', 'iphone']) {
    for (const s of SCHIRME) {
      await p.evaluate(x => PROTOTYP.geraet(x), g); await p.waitForTimeout(250);
      await p.evaluate(k => PROTOTYP.gehen(k), s); await p.waitForTimeout(500);
      const n = await p.evaluate(({ g }) => {
        const h = [...document.querySelectorAll('[data-pv-screen]')].filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
        const r = h.querySelector('.screen--' + g) || h;
        window.__ziele = [...r.querySelectorAll('.pv-lebt')].filter(e => {
          const w = e.__pvWeg;
          if (!w) return false;
          if (w.ziel && w.ziel !== 'nichts') return false;   /* Wege prüft klickprobe.js */
          const rc = e.getBoundingClientRect();
          return rc.width > 6 && rc.height > 6;
        });
        return window.__ziele.length;
      }, { g });

      for (let i = 0; i < n; i++) {
        const vor = await p.evaluate(sig);
        const info = await p.evaluate(i => {
          const el = window.__ziele[i];
          if (!el || !el.isConnected) return null;
          const r = el.getBoundingClientRect();
          if (r.width < 4) return null;
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label') || el.className;
          return { t: t.slice(0, 44), x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }, i);
        if (!info) continue;
        if (info.y < 0 || info.y > 1150 || info.x < 0 || info.x > 1700) {
          bericht.push({ s, g, t: info.t, ergebnis: 'ausserhalb' });
          continue;
        }
        try { await p.mouse.click(info.x, info.y); } catch (e) { bericht.push({ s, g, t: info.t, ergebnis: 'klickfehler' }); continue; }
        await p.waitForTimeout(300);
        const nach = await p.evaluate(sig);
        const wo = await p.evaluate(() => PROTOTYP.zustand().schirm);
        bericht.push({ s, g, t: info.t, ergebnis: wo !== s ? 'gewechselt:' + wo : (vor !== nach ? 'verändert' : 'STARR') });
        /* Menü schließen und den Schirm frisch aufsetzen */
        await p.keyboard.press('Escape').catch(() => {});
        await p.evaluate(x => PROTOTYP.geraet(x), g); await p.waitForTimeout(120);
        await p.evaluate(k => PROTOTYP.gehen(k), s); await p.waitForTimeout(320);
        await p.evaluate(({ g }) => {
          const h = [...document.querySelectorAll('[data-pv-screen]')].filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
          const r = h.querySelector('.screen--' + g) || h;
          window.__ziele = [...r.querySelectorAll('.pv-lebt')].filter(e => {
            const w = e.__pvWeg;
            if (!w) return false;
            if (w.ziel && w.ziel !== 'nichts') return false;
            const rc = e.getBoundingClientRect();
            return rc.width > 6 && rc.height > 6;
          });
        }, { g });
      }
    }
  }
  fs.writeFileSync(S + '/wirkung.json', JSON.stringify(bericht, null, 1));
  const z = {};
  bericht.forEach(x => { const k = x.ergebnis.split(':')[0]; z[k] = (z[k] || 0) + 1; });
  console.log('GEPRÜFT:', bericht.length, JSON.stringify(z));
  console.log('\nSTARR:');
  bericht.filter(x => x.ergebnis === 'STARR').forEach(x => console.log('  ' + (x.s + '·' + x.g).padEnd(24) + x.t));
  console.log('\nSeitenfehler:', errs.length ? errs.slice(0, 3) : 'keine');
  await b.close();
})();
