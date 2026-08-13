/* story-ipad.js — eine Sitzung am iPad, wirklich bedient und aufgezeichnet.
 *
 * Das ist der Unterschied zu allem, was ein Modell erzeugen könnte: hier
 * wird nichts nachgestellt. Ein Zeiger fährt über den echten Prototyp,
 * drückt echte Knöpfe, und was dabei passiert — die Übergänge, das Aufgehen
 * der Notiz, das Umschalten der Ansicht — ist die Bedienung selbst, in
 * Echtzeit aufgenommen.
 *
 * Aufgezeichnet wird mit Playwrights recordVideo: das läuft in Echtzeit mit
 * und nimmt jede CSS-Bewegung so mit, wie sie im Browser abläuft. Ein
 * Einzelbild-Verfahren (screenshot in einer Schleife) hätte die Bewegungen
 * zerhackt, weil zwischen zwei Aufnahmen ungleich viel Zeit vergeht.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const AUS = '/home/user/story/aufnahme';
const B = 1194, Hh = 834;              /* iPad-Schirmmaß des Prototyps */

const warte = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(AUS, { recursive: true });
  for (const f of fs.readdirSync(AUS)) fs.rmSync(AUS + '/' + f, { recursive: true, force: true });

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
  });
  const ctx = await browser.newContext({
    viewport: { width: B, height: Hh },
    deviceScaleFactor: 2,
    recordVideo: { dir: AUS, size: { width: B, height: Hh } },
  });
  const T0 = Date.now();
  const marken = [];
  const marke = (name) => { marken.push({ name, s: +((Date.now() - T0) / 1000).toFixed(2) }); };
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message));

  await p.goto('file:///home/user/Mocktest/mockups/prototyp/index.html', { waitUntil: 'load' });
  await warte(1600);

  /* Die Seite drumherum tritt ab: der Prototyp liegt in einer Werkstattseite
     mit Kopf, Umschaltern und Erklärtext. Für die Aufnahme soll nur das
     Gerät im Bild sein, formatfüllend und ohne Maßstab. */
  await p.evaluate(({ B, Hh }) => {
    PROTOTYP.geraet('ipad');
    /* .pv-glas liegt in div.pv-skala, nicht im Body. Eine Regel
       „body > *:not(.pv-glas){display:none}" versteckt darum den TRÄGER mit —
       im ersten Versuch war die Aufnahme deshalb schwarz. Also wird der Pfad
       von der Glasscheibe bis zum Body abgelaufen und auf jeder Stufe nur
       das Geschwister weggenommen, das nicht auf dem Pfad liegt. */
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
    `;
    document.head.appendChild(stil);
  }, { B, Hh });
  await warte(900);

  /* Ein sichtbarer Zeiger. Ohne ihn sieht die Aufnahme aus, als bediene sich
     die App von selbst — und das ist genau der Eindruck, den ein Mitschnitt
     einer Bedienung nicht machen darf. */
  await p.evaluate(() => {
    const z = document.createElement('div');
    z.id = 'pv-zeiger';
    z.style.cssText = `position:fixed;left:0;top:0;width:34px;height:34px;border-radius:50%;
      background:rgba(255,255,255,.20);box-shadow:0 0 0 1.5px rgba(255,255,255,.55),0 2px 10px rgba(0,0,0,.5);
      pointer-events:none;z-index:99999;transform:translate(-50%,-50%) scale(1);
      transition:transform .18s cubic-bezier(.2,.7,.3,1);opacity:0`;
    document.body.appendChild(z);
    window.__zeiger = (x, y, druck) => {
      z.style.opacity = '1';
      z.style.left = x + 'px'; z.style.top = y + 'px';
      z.style.transform = 'translate(-50%,-50%) scale(' + (druck ? .62 : 1) + ')';
    };
    window.__zeigerWeg = () => { z.style.opacity = '0'; };
  });

  /* Fahren, dann drücken — mit einer Kurve, nicht in einem Sprung. */
  async function tippen(waehler, wortlaut, halt = 1100) {
    const ziel = await p.evaluate(({ waehler, wortlaut }) => {
      const h = [...document.querySelectorAll('[data-pv-screen]')]
        .filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
      if (!h) return null;
      let el = null;
      const kandidaten = [...h.querySelectorAll(waehler)];
      el = wortlaut
        ? kandidaten.find(e => (e.textContent || '').replace(/\s+/g, ' ').trim().includes(wortlaut))
        : kandidaten[0];
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
               t: (el.textContent || '').trim().slice(0, 34) };
    }, { waehler, wortlaut });
    if (!ziel) { console.log('  ✗ nicht gefunden: ' + waehler + (wortlaut ? ' « ' + wortlaut : '')); return false; }

    await p.evaluate(({ x, y }) => window.__zeiger(x, y, false), ziel);
    await p.mouse.move(ziel.x, ziel.y, { steps: 22 });
    await warte(320);
    await p.evaluate(({ x, y }) => window.__zeiger(x, y, true), ziel);
    await warte(130);
    await p.mouse.click(ziel.x, ziel.y);
    await p.evaluate(({ x, y }) => window.__zeiger(x, y, false), ziel);
    console.log('  ✓ ' + (wortlaut || waehler) + '  → ' + ziel.t);
    await warte(halt);
    return true;
  }

  async function hin(schirm, halt = 900) {
    await p.evaluate(k => PROTOTYP.gehen(k), schirm);
    await warte(halt);
  }

  console.log('── Die Sitzung ──');
  await warte(1800);
  marke('heute');
  await warte(1500);

  await tippen('#t-karten, .kette__glied, .row', 'Zellbiologie', 2400);   /* die Notiz geht auf */
  marke('notiz');
  await warte(1400);

  await hin('aufgaben', 1500); marke('aufgaben');
  await tippen('.segmented button', 'Planer', 1900);
  await tippen('.segmented button', 'Board', 2000);

  await hin('bibliothek', 1400); marke('bibliothek');
  await tippen('.segmented button', 'Liste', 2000);

  await hin('lernsitzung', 1500); marke('lernen');
  await tippen('.btn--primary, .btn', 'Antwort zeigen', 2600);

  await hin('graph', 1600); marke('graph');
  await tippen('.gn, .gnode', null, 1900);

  await hin('canvas', 3400); marke('canvas');
  await warte(1600);
  await p.evaluate(() => window.__zeigerWeg());
  await warte(700);
  marke('ende');

  console.log('Seitenfehler:', fehler.length ? fehler.slice(0, 2) : 'keine');
  fs.writeFileSync('/home/user/story/marken.json', JSON.stringify(marken, null, 1));
  console.log('Marken:', marken.map(m => m.name + ' ' + m.s + 's').join(' · '));
  await ctx.close();
  await browser.close();

  const datei = fs.readdirSync(AUS).find(f => f.endsWith('.webm'));
  console.log('Aufnahme:', datei, (fs.statSync(AUS + '/' + datei).size / 1048576).toFixed(1), 'MB');
})();
