/* ipad-sitzung.js — eine Arbeitssitzung am iPad, wirklich bedient und
 * in Echtzeit aufgezeichnet.
 *
 * Was hier passiert, ist der Unterschied zwischen einem Werbefilm und einer
 * Behauptung: nichts wird nachgestellt. Ein Skript drückt echte Knöpfe im
 * echten Prototyp, und was dabei zu sehen ist — das Aufgehen der Notiz, das
 * Umschalten der Ansicht, das Umdrehen der Lernkarte — ist die Bedienung
 * selbst. Playwrights recordVideo läuft nebenher mit und nimmt jede
 * CSS-Bewegung so mit, wie der Browser sie rechnet.
 *
 * Zwei Entscheidungen, die den Ton machen:
 *
 * KEIN ZEIGER. Die erste Fassung hatte einen weißen Kreis, der zum Knopf fuhr
 * und beim Druck kleiner wurde. Das ist die Bildsprache eines
 * Bildschirm-Mitschnitts, nicht die eines Produktfilms — und es sah billig
 * aus. Stattdessen sorgt der Ablauf dafür, dass immer Bewegung im Bild ist:
 * vor jedem Griff wird gescrollt, geschnitten wird auf den Zustandswechsel.
 *
 * ENGLISCH UND HERGERICHTET. Vor dem ersten Bild legen sich englisch.js und
 * buehne.js über den Prototyp — Sprache, Zeichen statt Name, keine halb
 * geladenen Zustände. Im Canvas-Rahmen tun handschrift.js und
 * canvas-buehne.js dasselbe und zeichnen das Vorlesungsblatt.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const WURZEL = '/home/user/Mocktest';
const AUS = '/home/user/story/aufnahme';
const B = 1194, Hh = 834;                /* iPad-Schirmmaß des Prototyps */
const SKALA = 2;                         /* aufgezeichnet wird in Gerätepunkten */

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(AUS, { recursive: true });
  for (const f of fs.readdirSync(AUS)) fs.rmSync(AUS + '/' + f, { recursive: true, force: true });

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=' + SKALA],
  });
  const ctx = await browser.newContext({
    viewport: { width: B, height: Hh },
    deviceScaleFactor: SKALA,
    recordVideo: { dir: AUS, size: { width: B * SKALA, height: Hh * SKALA } },
  });

  const T0 = Date.now();
  const marken = [];
  const marke = (name) => {
    marken.push({ name, s: +((Date.now() - T0) / 1000).toFixed(2) });
    console.log('   · ' + name + '  ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
  };

  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));

  await p.goto('file://' + WURZEL + '/mockups/prototyp/index.html', { waitUntil: 'load' });
  await warte(1500);

  /* ── Die Werkstattseite tritt ab ────────────────────────────────────────
     Der Prototyp liegt in einer Seite mit Kopf, Umschaltern und Erklärtext.
     Für die Aufnahme soll nur das Gerät im Bild sein, formatfüllend.

     .pv-glas liegt in div.pv-skala, nicht im Body — eine Regel
     „body > *:not(.pv-glas){display:none}" versteckte darum den TRÄGER mit,
     und die erste Aufnahme war schwarz. Also wird der Pfad von der
     Glasscheibe bis zum Body abgelaufen und auf jeder Stufe nur das
     Geschwister weggenommen, das nicht auf dem Pfad liegt. */
  await p.evaluate(({ B, Hh }) => {
    PROTOTYP.geraet('ipad');
    const glas = document.querySelector('.pv-glas');
    for (let n = glas; n && n !== document.body; n = n.parentElement) {
      for (const g of Array.from(n.parentElement.children)) {
        if (g !== n) g.style.display = 'none';
      }
      n.style.cssText += ';margin:0!important;padding:0!important;transform:none!important;' +
                         'position:static!important;width:auto!important;max-width:none!important';
    }
    const stil = document.createElement('style');
    stil.textContent = `
      html,body{margin:0!important;padding:0!important;background:#000!important;overflow:hidden!important}
      .pv-kopf,.pv-fuss,.controls,.pv-hinweisleiste,.pv-wege-leiste,header,nav{display:none!important}
      .pv-glas{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;
               transform:none!important;width:${B}px!important;height:${Hh}px!important;
               display:block!important;background:#000!important;cursor:none!important}
      .pv-screen:not([hidden]){position:absolute!important;inset:0!important;margin:0!important;transform:none!important}
      .pv-screen .screen--ipad{width:${B}px!important;height:${Hh}px!important;
               margin:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
      .pv-screen .screen--iphone{display:none!important}
      *{cursor:none!important}
      /* Kein Ruckeln beim Scrollen: die Leisten gehören nicht ins Bild. */
      ::-webkit-scrollbar{width:0!important;height:0!important}
    `;
    document.head.appendChild(stil);
  }, { B, Hh });
  await warte(700);

  /* ── Die Bühne ─────────────────────────────────────────────────────── */
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/englisch.js') });
  await p.addScriptTag({ path: path.join(WURZEL, 'tools/story/buehne.js') });
  const bericht = await p.evaluate(() => BUEHNE.anziehen());
  console.log('Bühne: ' + bericht.sprache.getroffen + ' Wörter · ' +
              bericht.absender + '× Zeichen · ' + bericht.politur.length + ' Zustände');
  await warte(600);

  /* ── Das Canvas vorbereiten, bevor die Kamera etwas davon sieht ───────
     canvasWecken() in prototyp.js hängt den Rahmen erst ein, wenn sein
     Schirm wirklich Maß hat — vorher ist er 0 × 0. Also wird der Schirm
     einmal kurz gezeigt, das Blatt geschrieben, und dann zurück auf Heute.
     Einmal geladen bleibt es geladen; beim späteren Besuch steht das Blatt
     schon da, statt zwei Sekunden lang leer und auf Deutsch aufzublitzen. */
  await p.evaluate(() => PROTOTYP.gehen('canvas'));
  await warte(2600);
  {
    const f = p.frames().find((x) => /index\.html/.test(x.url()) && x !== p.mainFrame());
    if (f) {
      await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/handschrift.js') });
      await f.addScriptTag({ path: path.join(WURZEL, 'tools/story/canvas-buehne.js') });
      const n = await f.evaluate(() => CANVASBUEHNE.anziehen());
      console.log('Canvas: ' + n + ' Objekte gezeichnet');
    } else {
      console.log('✗ kein Canvas-Rahmen — das Blatt bliebe leer');
    }
  }
  await warte(900);
  await p.evaluate(() => PROTOTYP.gehen('heute'));
  await warte(1200);
  await p.evaluate(() => BUEHNE.nachziehen());
  await warte(800);

  /* ── Handgriffe ────────────────────────────────────────────────────── */

  /* Der sichtbare Schirm — nicht der erste im Dokument, sondern der, der im
     Bild steht. Der Unterschied hat in der ersten Fassung 743 von 761
     Knöpfen unsichtbar gemacht. */
  const SCHIRM = '[data-pv-screen]:not([hidden])[data-pv-geraet="ipad"]';

  async function tippen(waehler, wortlaut, halt = 1000) {
    const ziel = await p.evaluate(({ waehler, wortlaut, SCHIRM }) => {
      const h = [...document.querySelectorAll(SCHIRM)]
        .filter((e) => e.getBoundingClientRect().width > 100)[0];
      if (!h) return null;
      const kandidaten = [...h.querySelectorAll(waehler)];
      const el = wortlaut
        ? kandidaten.find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().includes(wortlaut))
        : kandidaten[0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const q = el.getBoundingClientRect();
      return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2),
               t: (el.textContent || '').trim().slice(0, 30) };
    }, { waehler, wortlaut, SCHIRM });
    if (!ziel) { console.log('   ✗ nicht gefunden: ' + waehler + (wortlaut ? ' « ' + wortlaut : '')); return false; }
    await p.mouse.click(ziel.x, ziel.y);
    /* Die Umschalter bauen ihre Tafeln erst beim Druck — Spaltenköpfe,
       Sätze, leere Fächer. Die entstehen auf Deutsch und müssen sofort
       nachgezogen werden, sonst steht mitten im Film „IN ARBEIT". */
    await warte(260);
    await p.evaluate(() => BUEHNE.nachziehen());
    console.log('   ✓ ' + (wortlaut || waehler) + '  → ' + ziel.t);
    await warte(Math.max(0, halt - 260));
    return true;
  }

  async function hin(schirm, halt = 900) {
    await p.evaluate((k) => PROTOTYP.gehen(k), schirm);
    await warte(320);
    await p.evaluate(() => BUEHNE.nachziehen());
    await warte(halt);
  }

  /* Weiches Scrollen von Hand: requestAnimationFrame statt scroll-behavior,
     weil der Browser bei „smooth" die Dauer selbst wählt und die Aufnahme
     dann mal 400 und mal 900 ms lang fährt. */
  async function scrollen(px, ms = 1400, waehler) {
    await p.evaluate(({ px, ms, waehler, SCHIRM }) => new Promise((fertig) => {
      const h = [...document.querySelectorAll(SCHIRM)]
        .filter((e) => e.getBoundingClientRect().width > 100)[0];
      if (!h) return fertig();
      const kandidaten = waehler ? [...h.querySelectorAll(waehler)]
                                 : [...h.querySelectorAll('.scroll, .body > *, [style*="overflow"]')];
      const box = kandidaten.find((e) => e.scrollHeight > e.clientHeight + 20);
      if (!box) return fertig();
      const von = box.scrollTop, t0 = performance.now();
      (function lauf(t) {
        const a = Math.min(1, (t - t0) / ms);
        /* weich rein, weich raus — eine Hand beschleunigt nicht sprunghaft */
        const e = a < .5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
        box.scrollTop = von + px * e;
        if (a < 1) requestAnimationFrame(lauf); else fertig();
      })(performance.now());
    }), { px, ms, waehler, SCHIRM });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * DIE SITZUNG
   *
   * Der Bogen ist der eines Vormittags: erst der Überblick, dann die
   * Vorlesung von gestern, was daraus wurde, das eigene Blatt, das Archiv,
   * der Plan, der Rückblick. Jeder Schirm ist voll, weil er im Betrieb voll
   * wäre — und keiner zeigt einen Zustand, den niemand erklärt bekommt.
   * ==================================================================== */

  console.log('── Die Sitzung ──');
  await warte(1400);

  /* 1 · HEUTE — der Überblick, mit dem der Tag anfängt */
  marke('heute');
  await warte(1600);
  await scrollen(300, 1500);
  await warte(1100);
  await scrollen(-300, 1200);
  await warte(700);

  /* Die Kette: Notiz → Karten → heute fällig. Ein Griff, drei Module. */
  await tippen('.chain__link', '14 paragraphs', 2600);
  marke('notiz');
  await warte(1600);

  /* 2 · NOTIZ — der Rand, und was aus den Absätzen geworden ist */
  await scrollen(280, 1600);
  await warte(1500);
  marke('notiz-rand');
  await scrollen(-280, 1300);
  await warte(700);

  /* 3 · LERNKARTEN — die Decks, und was heute fällig ist */
  await hin('lernkarten', 1700);
  marke('lernkarten');
  await warte(1700);

  /* 4 · LERNSITZUNG — die Karte dreht sich um */
  await hin('lernsitzung', 1600);
  marke('lernen');
  await warte(1400);
  await tippen('.btn--primary, .btn', 'Show answer', 2800);
  marke('antwort');
  await warte(900);

  /* 5 · CANVAS — das eigene Blatt, mit der Hand geschrieben.
        Es steht schon da: geweckt und beschrieben wurde vor dem ersten Bild. */
  await hin('canvas', 1900);
  marke('canvas');
  await warte(2400);
  /* Eine langsame Fahrt heran — der Beweis, dass das eine Fläche ist und
     kein Bild. Gezoomt wird über das Rad, wie es eine Hand auch täte. */
  await p.mouse.move(660, 430);
  for (let i = 0; i < 24; i++) { await p.mouse.wheel(0, -22); await warte(28); }
  await warte(1900);
  for (let i = 0; i < 24; i++) { await p.mouse.wheel(0, 22); await warte(28); }
  await warte(1200);
  marke('canvas-ende');

  /* 6 · BIBLIOTHEK — das Archiv, Raster wird Liste */
  await hin('bibliothek', 1700);
  marke('bibliothek');
  await warte(1300);
  await tippen('.segmented button', 'List', 2400);
  marke('bibliothek-liste');
  await warte(800);

  /* 7 · AUFGABEN — dieselben Sachen, drei Blickwinkel */
  await hin('aufgaben', 1600);
  marke('aufgaben');
  await warte(1400);
  await tippen('.segmented button', 'Planner', 2200);
  marke('planer');
  await tippen('.segmented button', 'Board', 2400);
  marke('brett');
  await warte(700);

  /* 8 · JOURNAL — der Rückblick, mit dem der Tag aufhört */
  await hin('journal', 1700);
  marke('journal');
  await warte(1600);
  await scrollen(320, 1600);
  await warte(1400);

  /* 9 · HEUTE — zurück zum Anfang, damit der Film sich schließt */
  await hin('heute', 1500);
  marke('schluss');
  await warte(1800);

  console.log('Seitenfehler: ' + (fehler.length ? fehler.slice(0, 3).join(' | ') : 'keine'));
  fs.writeFileSync('/home/user/story/marken.json', JSON.stringify(marken, null, 1));
  await ctx.close();
  await browser.close();

  const datei = fs.readdirSync(AUS).find((f) => f.endsWith('.webm'));
  console.log('Aufnahme: ' + datei + '  ' +
              (fs.statSync(AUS + '/' + datei).size / 1048576).toFixed(1) + ' MB  ' +
              'Länge ≈ ' + marken[marken.length - 1].s + ' s');
})();
