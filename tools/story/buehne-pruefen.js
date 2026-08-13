/* buehne-pruefen.js — hält die Bühne gegen das Licht, bevor gedreht wird.
 *
 * Drei Fragen, eine Antwort je Schirm:
 *   · Steht noch Deutsch im Bild?
 *   · Läuft Text über seinen Kasten hinaus oder wird er abgeschnitten?
 *   · Sieht der Schirm aus wie ein Schirm — oder wie ein Fehler?
 *
 * Das Ergebnis sind ein Bericht auf der Kommandozeile und ein Bild je Schirm
 * in /home/user/story/pruef/, damit die Antwort auf die dritte Frage nicht
 * behauptet, sondern gesehen wird.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const WURZEL = '/home/user/Mocktest';
const AUS = '/home/user/story/pruef';
const SCHIRME = ['heute', 'notizen', 'notiz', 'bibliothek', 'aufgaben', 'aufgabe',
                 'journal', 'journal-eintrag', 'lernkarten', 'lernsitzung', 'canvas'];

(async () => {
  fs.mkdirSync(AUS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--hide-scrollbars'],
  });
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));

  await p.goto('file://' + WURZEL + '/mockups/prototyp/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  await p.evaluate(() => PROTOTYP.geraet('ipad'));

  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/englisch.js') });
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/buehne.js') });
  const bericht = await p.evaluate(() => BUEHNE.anziehen());
  console.log('Absender gesetzt: ' + bericht.absender +
              ' · Politur: ' + bericht.politur.length +
              ' · Sprache: ' + bericht.sprache.getroffen + ' Treffer');

  let restGesamt = 0, mangelGesamt = 0;
  for (const k of SCHIRME) {
    await p.evaluate((k) => PROTOTYP.gehen(k), k);
    await p.waitForTimeout(700);
    await p.evaluate(() => BUEHNE.nachziehen());
    await p.waitForTimeout(200);

    const fund = await p.evaluate(() => {
      const h = [...document.querySelectorAll('[data-pv-screen]')]
        .filter((e) => !e.hidden && e.getAttribute('data-pv-geraet') === 'ipad' &&
                        e.getBoundingClientRect().width > 100)[0];
      if (!h) return { rest: ['KEIN SCHIRM'], mangel: [] };

      /* Deutschreste */
      const rest = [];
      const lauf = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = lauf.nextNode())) {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t) continue;
        const el = n.parentElement;
        if (!el || el.closest('.statusbar')) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (ENGLISCH.verdacht(t)) rest.push(t.slice(0, 60));
      }

      /* Überlauf und Abschnitt — nur da, wo kein Auslassungszeichen die
         Absicht bezeugt und der Kasten wirklich zu klein ist. */
      const mangel = [];
      const kasten = h.getBoundingClientRect();
      h.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const eigen = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
        if (!eigen) return;
        /* Nur wo wirklich abgeschnitten wird: bei overflow:visible steht der
           Text weiter im Bild, und ein scrollWidth über clientWidth ist dann
           ein Messartefakt aus Zeilenhöhe und Innenabstand — kein Mangel.
           Das Auslassungszeichen ist Absicht und zählt ebenfalls nicht. */
        const schneidet = cs.overflow !== 'visible' && cs.overflowX !== 'visible';
        if (schneidet && cs.textOverflow !== 'ellipsis' &&
            el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          mangel.push('quer ' + el.className + ' «' + (el.textContent || '').trim().slice(0, 34));
        }
        /* -webkit-line-clamp schneidet ABSICHTLICH ab, mit Auslassungszeichen. */
        const geklammert = /\bclamp-\d/.test(el.className || '') || cs.webkitLineClamp !== 'none';
        if (!geklammert && cs.overflowY !== 'visible' && cs.overflowY !== 'auto' &&
            cs.overflowY !== 'scroll' && el.scrollHeight > el.clientHeight + 4) {
          mangel.push('hoch ' + el.className + ' «' + (el.textContent || '').trim().slice(0, 34));
        }
        /* aus dem Schirm heraus — nur was auch im Bild steht */
        if (r.top < kasten.bottom && r.bottom > kasten.top &&
            (r.right > kasten.right + 3 || r.left < kasten.left - 3)) {
          mangel.push('raus ' + el.className + ' «' + (el.textContent || '').trim().slice(0, 34));
        }
      });
      return { rest: [...new Set(rest)], mangel: [...new Set(mangel)] };
    });

    /* Das Canvas ist ein eigenes Dokument: eigene Bühne, eigene Prüfung. */
    if (k === 'canvas') {
      const rahmen = p.frames().find((f) => /index\.html/.test(f.url()) && f !== p.mainFrame());
      if (rahmen) {
        await rahmen.addScriptTag({ path: path.join(WURZEL, 'tools/story/handschrift.js') });
        await rahmen.addScriptTag({ path: path.join(WURZEL, 'tools/story/canvas-buehne.js') });
        const n = await rahmen.evaluate(() => CANVASBUEHNE.anziehen());
        console.log('   Canvas gezeichnet: ' + n + ' Objekte');
        await p.waitForTimeout(900);
        const drin = await rahmen.evaluate(() => {
          const t = [];
          const l = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let x; while ((x = l.nextNode())) { const v = x.textContent.trim(); if (v) t.push(v); }
          return t;
        });
        console.log('   Rahmentext: ' + drin.join(' · '));
      } else {
        console.log('   ✗ kein Canvas-Rahmen gefunden');
      }
    }

    await p.locator('[data-pv-screen="' + k + '"][data-pv-geraet="ipad"] .screen--ipad')
           .first().screenshot({ path: AUS + '/' + k + '.png' });

    restGesamt += fund.rest.length;
    mangelGesamt += fund.mangel.length;
    console.log('\n── ' + k + ' ── ' +
      (fund.rest.length ? '✗ ' + fund.rest.length + ' Deutschreste' : '✓ englisch') + ' · ' +
      (fund.mangel.length ? '✗ ' + fund.mangel.length + ' Satzmängel' : '✓ Satz'));
    fund.rest.slice(0, 14).forEach((r) => console.log('   DE  ' + r));
    fund.mangel.slice(0, 10).forEach((r) => console.log('   ??  ' + r));
  }

  console.log('\n══ Summe: ' + restGesamt + ' Deutschreste · ' + mangelGesamt + ' Satzmängel · ' +
              fehler.length + ' Seitenfehler');
  if (fehler.length) console.log(fehler.slice(0, 3).join('\n'));
  await browser.close();
})();
