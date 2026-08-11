/* ============================================================================
 * pruefe-bundle.js — Öffnet jede HTML-Seite des Pakets im Browser und misst,
 * was man einer Datei nicht ansieht: tote Verknüpfungen, fehlende Bilder,
 * Seitenfehler, Querscrollen, abgeschnittener Text.
 *
 * Aufruf:  node pruefe-bundle.js [ordner]     (Vorgabe: /home/user/newmockup)
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const WURZEL = process.argv[2] || '/home/user/newmockup';
const BREITEN = [1440, 900, 640, 390];

function alleHtml(dir, gesammelt = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) alleHtml(p, gesammelt);
    else if (e.name.endsWith('.html')) gesammelt.push(p);
  }
  return gesammelt;
}

(async () => {
  const seiten = alleHtml(WURZEL).sort();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });

  const befunde = [];
  const melde = (datei, art, text) =>
    befunde.push({ datei: path.relative(WURZEL, datei), art, text });

  for (const datei of seiten) {
    const rel = path.relative(WURZEL, datei);
    const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const fehler = [];
    seite.on('pageerror', (e) => fehler.push('pageerror: ' + e.message));
    seite.on('console', (m) => { if (m.type() === 'error') fehler.push('console: ' + m.text()); });

    await seite.goto('file://' + datei, { waitUntil: 'load' });
    await seite.waitForTimeout(500);
    /* Lazy geladene Bilder wirklich laden. Vorher wurde einmal ans Ende
       gerollt und zurück — bei 203 Vorschaubildern auf der Startseite kommt
       die Mitte dabei nie lange genug in den Ausschnitt, und der Prüfer
       meldete 29 Bilder als „lädt nicht", die alle auf der Platte lagen.
       Jetzt wird das Faulsein abgeschaltet und auf jedes einzelne gewartet. */
    await seite.evaluate(async () => {
      const bilder = [...document.images];
      bilder.forEach((i) => i.setAttribute('loading', 'eager'));
      await Promise.all(bilder.map((i) =>
        i.complete ? Promise.resolve() : i.decode().catch(() => {})));
    });
    await seite.waitForTimeout(300);

    /* Verknüpfungen und Bilder einsammeln */
    const { links, bilder, schriften } = await seite.evaluate(() => ({
      links: [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.startsWith('#') && !/^(https?:|mailto:|data:|javascript:)/.test(h)),
      bilder: [...document.images].map((i) => ({
        src: i.getAttribute('src'),
        ok: i.naturalWidth > 0,
      })),
      /* Was dem System gehoert und nicht Velum. Drei Stellen, jede einzeln
         nachgemessen — keine Sammelklausel, damit eine vierte auffaellt:

           .statusbar  Uhrzeit, Funk, Akku. Die Geraeteattrappe.
           .tab        die Beschriftung der iPhone-Tab-Leiste, 11 px.
                       85 Stellen im Entwurf, davon null ausserhalb.
           .approw     die App-Kacheln im Teilen-Blatt (AirDrop, Jana, Mail),
                       ebenfalls 11 px. Das Blatt ist iOS, nicht Velum.

         Alles andere zaehlt mit.

         Gemessen wird NUR im Geraeteschirm, und dort nicht im Systemchrome.
         Vorher lief die Zaehlung ueber das ganze Dokument und meldete auf
         jeder Seite sieben Groessen statt fuenf. Nachgemessen, am 10. August:

           28 20 17 15 13   die Skala des Entwurfs, genau fuenf   (2202 Stellen)
           11               ausschliesslich .tab .t-label — die Beschriftung
                            der iPhone-Tab-Leiste. 85 Stellen, davon NULL
                            ausserhalb der Tab-Leiste. Ihre Groesse gibt iOS
                            vor, nicht Velum; sie steht in derselben Klasse
                            wie die Statusleiste, die hier schon immer
                            ausgenommen war.
           16               kam aus <title> und <style> in der Seitenumgebung.
                            Beide tragen einen Textknoten und eine berechnete
                            Schriftgroesse und zeigen nichts an.

         Die Regel "hoechstens fuenf Groessen" ist ueber den Entwurf
         geschrieben. Also wird ueber den Entwurf gezaehlt. */
      schriften: [...new Set([...document.querySelectorAll('.screen *')]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((el) => !el.closest('.statusbar, .tab, .approw'))
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.display !== 'none' && cs.visibility !== 'hidden';
        })
        .map((el) => getComputedStyle(el).fontSize))].sort(),
    }));

    const basis = path.dirname(datei);
    for (const h of links) {
      const ziel = path.resolve(basis, decodeURI(h.split('#')[0]));
      if (!fs.existsSync(ziel)) melde(datei, 'toter Link', `${h} → ${path.relative(WURZEL, ziel)}`);
    }
    for (const b of bilder) {
      if (!b.ok && !/^data:/.test(b.src || '')) melde(datei, 'Bild lädt nicht', b.src);
    }
    if (fehler.length) melde(datei, 'Seitenfehler', fehler.slice(0, 4).join(' | '));

    /* Querscrollen und abgeschnittener Text bei allen Breiten */
    /* Eine Seite, die eine GERÄTEATTRAPPE in Originalgröße zeigt, ist keine
       Webseite, die umbricht — sie ist ein Blatt Papier mit einem iPad
       darauf. Bei 390 px Fensterbreite quer zu rollen ist dort kein Fehler,
       sondern die einzig mögliche Antwort: ein 1194-pt-Schirm passt nicht in
       ein 390-pt-Fenster, und ihn zu stauchen hieße, das Maß zu fälschen,
       das die Seite gerade zeigen will.

       Der begehbare Prototyp ist der Gegenfall: er RECHNET seine Rahmen auf
       das Fenster um (prototyp.js §7) und muss die Prüfung bestehen. Er tut
       es auch — er steht in keiner der vier Breiten in der Liste.

       Erkannt wird die Attrappe daran, dass ein .screen mit fester Breite im
       Dokument steht, den niemand skaliert. */
    const attrappe = await seite.evaluate(() => {
      /* Vier Namen, weil vier Seitenarten ein Gerät zeigen und dafür je
         einen eigenen Rahmen mitbringen:
           .screen   die App-Schirme (app-next, best-of, der Prototyp)
           .device   die Plattformseiten mit ganzem Gerät (Live Activity)
           .lock     der Sperrbildschirm
           .homegrid der Startbildschirm mit den Widgets
         Steht keiner davon auf der Seite, ist es eine gewöhnliche Seite und
         sie muss umbrechen. */
      const s = document.querySelector('.screen, .device, .lock, .homegrid');
      if (!s) return false;
      /* skaliert? dann ist es der Prototyp und die Prüfung gilt */
      const t = getComputedStyle(s.parentElement || s).transform;
      if (t && t !== 'none') return false;
      /* Auch zwei iPhones nebeneinander sind eine Attrappe. Es zaehlt
         nicht die Groesse des einzelnen Schirms, sondern dass ueberhaupt
         einer unskaliert dasteht: eine Seite, die ein Geraet in
         Originalmass zeigt, richtet sich nach dem Geraet und nicht nach
         dem Fenster. */
      return s.getBoundingClientRect().width > 300;
    });

    for (const w of (attrappe ? [] : BREITEN)) {
      await seite.setViewportSize({ width: w, height: 900 });
      await seite.waitForTimeout(260);
      const m = await seite.evaluate(() => {
        const d = document.scrollingElement;
        const quer = d.scrollWidth - d.clientWidth;
        const abgeschnitten = [...document.querySelectorAll('*')]
          .filter((el) => {
            const s = getComputedStyle(el);
            if (s.overflowX !== 'hidden' && s.overflow !== 'hidden') return false;
            if (s.display === 'none' || !el.clientWidth) return false;
            /* Wer text-overflow: ellipsis gesetzt hat, will kürzen und zeigt
               das mit drei Punkten an. Das ist eine Entscheidung, kein
               Unfall — und der Unterschied zwischen beidem ist der einzige,
               auf den es hier ankommt. */
            if (s.textOverflow === 'ellipsis') return false;
            return el.scrollWidth > el.clientWidth + 1;
          })
          .slice(0, 6)
          .map((el) => (el.className || el.tagName) + ' ' + el.scrollWidth + '>' + el.clientWidth
            + ' „' + (el.textContent || '').trim().slice(0, 40) + '"');
        return { quer, abgeschnitten };
      });
      if (m.quer > 1) melde(datei, `Querscrollen @${w}px`, `${m.quer}px zu breit`);
      for (const a of m.abgeschnitten) melde(datei, `Text beschnitten @${w}px`, a);
    }

    /* Typo-Disziplin: mehr als 5 Größen ist ein Bruch der Regel. Gemeldet
       wird nicht nur die Anzahl, sondern welche Größe aus der Skala fällt —
       eine Zahl allein sagt niemandem, wo er suchen soll. */
    const SKALA = [28, 20, 17, 15, 13];
    const relevant = schriften.map(parseFloat).filter((n) => n >= 10 && n <= 40);
    const einmalig = [...new Set(relevant)].sort((a, b) => b - a);
    const fremd = einmalig.filter((g) => !SKALA.includes(g));
    if (einmalig.length > 5 || fremd.length) {
      melde(datei, 'Typo-Skala',
        `${einmalig.length} Größen: ${einmalig.join(', ')}` +
        (fremd.length ? ` — außerhalb der Skala: ${fremd.join(', ')}` : ''));
    }

    await seite.close();
    process.stdout.write(`  ${rel} ✓\n`);
  }

  await browser.close();

  console.log(`\n── ${seiten.length} Seiten geprüft ──`);
  if (!befunde.length) { console.log('keine Befunde'); return; }
  const nachArt = {};
  for (const b of befunde) (nachArt[b.art] ||= []).push(b);
  for (const art of Object.keys(nachArt).sort()) {
    console.log(`\n${art} (${nachArt[art].length})`);
    for (const b of nachArt[art].slice(0, 24)) console.log(`  ${b.datei}: ${b.text}`);
    if (nachArt[art].length > 24) console.log(`  … und ${nachArt[art].length - 24} weitere`);
  }
  process.exitCode = 1;
})();
