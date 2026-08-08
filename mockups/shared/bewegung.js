/* ============================================================================
 * bewegung.js — die Auslöser des Bewegungssystems
 *
 * Gehört zu bewegung.css. Liegt NEBEN mock.js und rührt es nicht an; benutzt
 * aber, was dort schon steht: MOCK.thread() zeichnet jeden Faden, MOCK.hydrate()
 * setzt die Symbole. Es wird kein zweiter Faden gebaut.
 *
 *   <script src="../shared/mock.js"></script>
 *   <script src="../shared/bewegung.js"></script>
 *
 * ── WIE MAN ES VON AUSSEN AUSLÖST ──────────────────────────────────────────
 * Zwei gleichwertige Wege. Die 13 Schirme brauchen nur den ersten.
 *
 * 1) Über Attribute — kein JavaScript im Schirm:
 *
 *    <button data-bw="uebergeben"
 *            data-bw-von="#absatz-7" data-bw-nach="#kachel-karten"
 *            data-bw-zaehler="#karten-zahl" data-bw-punkt="#karten-punkt">
 *      In Lernkarten
 *    </button>
 *
 *    data-bw = uebergeben | erledigen | drehen | bewerten | oeffnen | herkunft
 *              | zurueck   (macht den zuletzt gezeigten Herkunftsweg rückgängig)
 *
 *    Alle Zielangaben sind gewöhnliche CSS-Selektoren. Beginnt einer mit „^",
 *    wird er als closest() vom Knopf aus gelesen: data-bw-zeile="^.row".
 *
 * 2) Über die Funktionen — wenn ein Schirm etwas dazwischen tun muss:
 *
 *    MOTION.uebergeben({ von, nach, zaehler, punkt, box, kurve })   → Promise
 *    MOTION.erledigen ({ zeile, kreis, echo, faden })               → Promise
 *    MOTION.drehen    ({ karte })                                   → Promise
 *    MOTION.bewerten  ({ karte, note, intervalle, zaehler, naechste }) → Promise
 *    MOTION.oeffnen   ({ von, nach, huelle })                       → Promise
 *    MOTION.herkunft  ({ chip, ursprung, karte, quelle, box })      → { zurueck() }
 *
 * Jede gibt ein Promise zurück, das auflöst, wenn die Bewegung steht — und
 * jede hat einen eigenen Reduce-Pfad, nicht bloß eine kürzere Dauer.
 *
 * ── ZUSTAND ────────────────────────────────────────────────────────────────
 *    MOTION.modus('system' | 'full' | 'reduce')   erzwingen oder dem System folgen
 *    MOTION.reduziert()                           was gerade wirklich gilt
 *    MOTION.systemSagt()                          was das Betriebssystem meldet
 *    MOTION.tempo(1 | 4)                          Verlangsamer, 4 = 0,25×
 *    MOTION.ms(320)                               Dauer mit Tempo, für Wartezeiten
 *    MOTION.horchen(fn)                           bei jeder Änderung gerufen
 * ========================================================================== */

(function (global) {
  'use strict';

  var HTML = document.documentElement;
  var MQ = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;

  /* ══════════════════════════════════════════════════════════════════════
   * 1 · DIE VIER ROLLEN — die Zahlen, gegen die alles gebaut ist
   *
   * Die Kurven sind aus Velums vier Federn (März-Spec §9) gerechnet, nicht
   * geraten: Sprungantwort ausgewertet, Zeitfenster bei 2 % Restweg beendet,
   * cubic-bezier mit vier freien Parametern angepasst. Fehler im
   * quadratischen Mittel 0,33 – 0,92 % des Weges. Herleitung und Tabelle:
   * docs/03_bewegung.md.
   * ==================================================================== */

  var E = {
    quick:    'cubic-bezier(.239,.071,.325,.913)',   /* springQuick    .25/.85 */
    standard: 'cubic-bezier(.216,.052,.330,1.110)',  /* springStandard .40/.80 */
    bouncy:   'cubic-bezier(.280,.224,.224,1.370)',  /* springBouncy   .50/.65 */
    gentle:   'cubic-bezier(.271,.115,.268,.755)',   /* springGentle   .60/.90 */
    io:       'cubic-bezier(.42,0,.58,1)',           /* easeInOut, 1:1 aus der Spec */
  };

  var ROLLEN = {
    oeffnen: {
      name: 'Öffnen', zweck: 'Dokument, Detail',
      ms: 320, kurve: E.standard, feder: 'springStandard · response 0,40 · damping 0,80',
      bewegt: 'Ort und Größe der Karte (Breite/Höhe, nicht Maßstab) · Eckradius 14 → 0 pt · Umgebung 1 → 0,55',
      reduce: '160 ms Kreuzblende. Kein Weg, keine Größenänderung. Vorher 80 ms ein 2-pt-Ink-Ring auf der Ursprungskarte — die Herkunft wird gesagt, nicht gelaufen.',
    },
    wechseln: {
      name: 'Wechseln', zweck: 'Modul, Ansicht',
      ms: 180, kurve: E.quick, feder: 'springQuick · response 0,25 · damping 0,85',
      bewegt: 'Deckkraft 1 → 0 / 0 → 1 · Versatz 8 pt in Laufrichtung · 60 ms Überlappung (300 ms gesamt)',
      reduce: '120 ms Kreuzblende, 0 pt Versatz, keine Überlappung. Die Richtung sagt die Navigationsleiste.',
    },
    uebergeben: {
      name: 'Übergeben', zweck: 'Modul zu Modul — Velums Signatur',
      ms: 780, kurve: E.bouncy, feder: 'springBouncy · response 0,50 · damping 0,65 (Flug); Faden --t-hand 420 ms',
      bewegt: 'Satz 1 Verdichten 0–180 ms · Satz 2 Flug 120–600 ms auf dem Faden, Maßstab 1 → 0,42 · Faden 120–540 ms Weglänge 0 → voll · Satz 3 Ankunft 600–780 ms, Zähler +1',
      reduce: '360 ms. Kein Flug, keine Bahn. Der Faden erscheint auf voller Länge (120 ms), 120 ms später zählt das Ziel hoch. Die Reihenfolge Ursprung → Ziel bleibt.',
    },
    bestaetigen: {
      name: 'Bestätigen', zweck: 'erledigt, gespeichert, bewertet',
      ms: 180, kurve: E.quick, feder: 'springQuick · response 0,25 · damping 0,85',
      bewegt: 'Weglänge des Hakens 15 → 0 · Kreisfüllung 0,72 → 1 · Ring 1,5 → 0 pt · dann 1000 ms Verweildauer · 240 ms Abgang · 260 ms Lücke',
      reduce: 'Der Haken ist da statt gezeichnet (120 ms). Die 1000 ms Verweildauer bleiben — sie sind das Rückgängig, nicht Bewegung. Die Lücke schließt ohne Weg.',
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
   * 2 · ZUSTAND: Reduce Motion und Verlangsamer
   *
   * Zwei Quellen, eine Auflösung. „system" folgt der Systemvorliebe, „full"
   * und „reduce" erzwingen. Das Ergebnis steht als data-bw-reduce="0|1" am
   * <html> — bewegung.css hängt genau daran, und WAAPI-Bewegungen fragen es
   * über reduziert() ab.
   * ==================================================================== */

  var modus = HTML.getAttribute('data-motion') || 'system';
  var tempoWert = 1;
  var horcher = [];

  function systemSagt() { return !!(MQ && MQ.matches); }

  function reduziert() {
    if (modus === 'reduce') return true;
    if (modus === 'full') return false;
    return systemSagt();
  }

  function anwenden() {
    HTML.setAttribute('data-motion', modus);
    HTML.setAttribute('data-bw-reduce', reduziert() ? '1' : '0');
    HTML.style.setProperty('--bw-tempo', String(tempoWert));
    for (var i = 0; i < horcher.length; i++) {
      try { horcher[i](zustand()); } catch (e) { /* ein tauber Horcher hält nichts auf */ }
    }
  }

  function zustand() {
    return { modus: modus, reduziert: reduziert(), systemSagt: systemSagt(), tempo: tempoWert };
  }

  function setModus(m) {
    if (m !== 'system' && m !== 'full' && m !== 'reduce') return zustand();
    modus = m; anwenden(); return zustand();
  }

  function setTempo(t) {
    tempoWert = (+t > 0 ? +t : 1);
    anwenden(); return zustand();
  }

  /* Alle Wartezeiten im JS laufen durch ms() — sonst liefe der Verlangsamer
     nur in CSS und die Sätze einer Bewegung fielen auseinander. */
  function ms(x) { return Math.round(x * tempoWert); }

  if (MQ) {
    var mqAendert = function () { anwenden(); };
    if (MQ.addEventListener) MQ.addEventListener('change', mqAendert);
    else if (MQ.addListener) MQ.addListener(mqAendert);
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 3 · WERKZEUG
   * ==================================================================== */

  function qs(x, bezug) {
    if (!x) return null;
    if (typeof x !== 'string') return x;
    if (x.charAt(0) === '^' && bezug) return bezug.closest(x.slice(1));
    return document.querySelector(x);
  }

  function warten(dauer) {
    return new Promise(function (fertig) { setTimeout(fertig, dauer); });
  }

  function rahmen() {
    return new Promise(function (fertig) {
      requestAnimationFrame(function () { requestAnimationFrame(fertig); });
    });
  }

  /* Nächster gemeinsamer Vorfahr — dieselbe Regel wie in MOCK.thread(), damit
     Faden und Flugkarte im selben Bezugsrahmen liegen. */
  function gemeinsam(a, b) {
    var p = a.parentElement;
    while (p && !p.contains(b)) p = p.parentElement;
    return p || document.body;
  }

  function bezugsrahmen(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    return el;
  }

  /* cubic-bezier als Funktion y(x). Wird gebraucht, wo eine Bewegung aus
     Stützpunkten besteht (der Flug auf dem Faden): dort wird die Kurve in die
     Punkte gerechnet und die Animation selbst läuft gleichförmig. Das ist
     kein Verstoß gegen „nie linear" — die Kurve steckt in den Punkten. */
  function bezier(x1, y1, x2, y2) {
    function cx(t, a, b) { return 3 * Math.pow(1 - t, 2) * t * a + 3 * (1 - t) * t * t * b + t * t * t; }
    return function (x) {
      var t = x;
      for (var i = 0; i < 24; i++) {
        var f = cx(t, x1, x2) - x;
        var d = 3 * Math.pow(1 - t, 2) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
        if (Math.abs(d) < 1e-9) break;
        t = Math.min(1, Math.max(0, t - f / d));
        if (Math.abs(f) < 1e-10) break;
      }
      return cx(t, y1, y2);
    };
  }
  var BOUNCY = bezier(0.280, 0.224, 0.224, 1.370);

  /* Fäden, die diese Datei angelegt hat. Nur damit ein Zurücksetzen sie
     wieder abräumen kann — MOCK.thread hängt Beobachter ein. */
  var faeden = [];
  function fadenMerken(api, wurzel) { if (api) faeden.push({ api: api, wurzel: wurzel }); return api; }
  function faedenLoeschen(root) {
    for (var i = faeden.length - 1; i >= 0; i--) {
      if (!root || root.contains(faeden[i].wurzel) || root === faeden[i].wurzel) {
        try { faeden[i].api.destroy(); } catch (e) { /* schon weg */ }
        faeden.splice(i, 1);
      }
    }
  }

  /* Einen Faden spannen — immer über MOCK.thread, nie selbst gezeichnet.
     Der Verlangsamer greift über --t-hand am Faden-Knoten; system.css §9
     benutzt genau diese Variable für thread-draw und thread-undraw. */
  function faden(von, nach, o) {
    if (!global.MOCK || !global.MOCK.thread) return null;
    var api = global.MOCK.thread(von, nach, o);
    if (!api) return null;
    api.node.style.setProperty('--t-hand', ms(420) + 'ms');
    fadenMerken(api, o && o.box ? o.box : gemeinsam(von, nach));
    return api;
  }

  /* Faden nachführen, solange etwas an seinen Enden unterwegs ist.
     MOCK.thread hört auf Größen-, Klassen- und transitionend-Ereignisse — das
     trifft den Anfang und das Ende einer Bewegung, aber nicht die Mitte. Wo
     ein Faden während eines Weges gespannt bleiben MUSS (Herkunft zeigen:
     die Karte weicht, der Chip an ihr auch), wird er Bild für Bild
     nachgerechnet. Nur für die Dauer der Bewegung, danach hört es auf. */
  function nachfuehren(api, dauer) {
    if (!api) return;
    var bis = performance.now() + dauer;
    (function schritt() {
      api.update();
      if (performance.now() < bis) requestAnimationFrame(schritt);
    })();
  }

  /* Faden sichtbar machen — gezeichnet oder, unter Reduce, eingeblendet.
     Beide Wege enden im selben Bild; nur der eine hat eine Richtung. */
  function fadenZeigen(api, rueckwaerts) {
    if (!api) return Promise.resolve();
    if (reduziert()) {
      api.node.classList.remove('bw-faden-blende');
      void api.node.getBoundingClientRect();
      api.node.classList.add('bw-faden-blende');
      return warten(ms(120));
    }
    if (rueckwaerts) api.drawBack(); else api.draw();
    return warten(ms(420));
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 4 · KLEINBEWEGUNGEN
   * ==================================================================== */

  /* Der Haken, der sich zeichnen kann. system.css hat einen Haken aus zwei
     Rändern (.check) — der kann alles außer sich zeichnen. Deshalb hier ein
     eigener aus SVG, sonst Zeichen für Zeichen derselbe. */
  var CHECK_SVG =
    '<svg viewBox="0 0 22 22" aria-hidden="true" focusable="false">' +
    '<circle class="bw-check__scheibe" cx="11" cy="11" r="11"/>' +
    '<path class="bw-check__haken" d="M6 11.3 9.5 14.8 16.2 7.6"/></svg>';

  function aufbereiten(root) {
    root = root || document;

    root.querySelectorAll('.bw-check').forEach(function (el) {
      if (!el.firstElementChild) el.innerHTML = CHECK_SVG;
    });

    /* Staffelung: der Index steht als Variable am Kind, damit die Verzögerung
       in CSS bleibt. Über zwölf Einträge hinaus keine weitere — eine Liste,
       die tröpfelt, kann man nicht überfliegen. */
    root.querySelectorAll('.bw-staffel').forEach(function (liste) {
      var k = liste.children;
      for (var i = 0; i < k.length; i++) k[i].style.setProperty('--bw-i', String(Math.min(i, 12)));
    });

    /* Wellenform: Grundprofil fest verdrahtet, damit dasselbe Bild bei jedem
       Aufruf entsteht (sonst wäre kein Screenshot vergleichbar). */
    root.querySelectorAll('.bw-welle').forEach(function (w) {
      if (w.children.length) return;
      var n = +(w.getAttribute('data-balken') || 26);
      var teile = '';
      for (var i = 0; i < n; i++) {
        var a = 0.28 + 0.62 * Math.abs(Math.sin(i * 1.7) * 0.7 + Math.sin(i * 0.53) * 0.3);
        teile += '<span class="bw-welle__balken" style="--bw-a:' + a.toFixed(3) +
                 ';--bw-i:' + i + '"></span>';
      }
      w.innerHTML = teile;
    });

    /* Zähler: der Wert bekommt eine eigene Hülle, sonst kann die alte Ziffer
       nicht hinausrollen, während die neue hereinkommt. */
    root.querySelectorAll('.bw-zaehler').forEach(function (z) {
      if (z.querySelector('.bw-zaehler__wert')) return;
      var w = document.createElement('span');
      w.className = 'bw-zaehler__wert';
      w.textContent = z.textContent.trim();
      z.textContent = '';
      z.appendChild(w);
    });
  }

  /* Zähler +1 (oder auf einen genannten Wert). Rollt nur, WEIL sich etwas
     geändert hat — nie beim Laden. */
  function zaehler(el, neu) {
    el = qs(el);
    if (!el) return Promise.resolve();
    var wert = el.querySelector('.bw-zaehler__wert');
    if (!wert) { aufbereiten(el.parentElement || document); wert = el.querySelector('.bw-zaehler__wert'); }
    if (!wert) return Promise.resolve();
    if (neu == null) neu = (parseInt(wert.textContent, 10) || 0) + 1;

    var alt = wert.cloneNode(true);
    alt.classList.add('bw-zaehler__wert--alt');
    el.appendChild(alt);
    wert.textContent = String(neu);
    wert.classList.remove('bw-zaehler__wert--neu');
    void wert.getBoundingClientRect();
    wert.classList.add('bw-zaehler__wert--neu');

    var d = reduziert() ? ms(120) : ms(180);
    return warten(d).then(function () {
      alt.remove();
      wert.classList.remove('bw-zaehler__wert--neu');
    });
  }

  /* Liste gestaffelt erscheinen lassen (oder wiederholen) */
  function staffeln(el) {
    el = qs(el);
    if (!el) return Promise.resolve();
    el.classList.remove('bw-staffel');
    void el.getBoundingClientRect();
    aufbereiten(el);
    el.classList.add('bw-staffel');
    var n = Math.min(el.children.length, 13);
    return warten(reduziert() ? ms(120) : ms(220 + n * 36));
  }

  /* Laden: Skelett statt Spinner.
       <div data-bw-laden>
         <div class="bw-laden__skelett">…</div>
         <div class="bw-laden__inhalt">…</div>
       </div> */
  function laden(el, an) {
    el = qs(el);
    if (!el) return Promise.resolve();
    el.classList.toggle('is-laden', an !== false);
    if (an === false) {
      var inhalt = el.querySelector('.bw-laden__inhalt');
      if (inhalt) return staffeln(inhalt);
    }
    return Promise.resolve();
  }

  /* Streak: ein Tag wird voll. Das Fadenstück davor wird gleichzeitig aktiv —
     der Punkt allein wäre eine Zahl, der Faden macht daraus eine Folge. */
  function streak(el, index) {
    el = qs(el);
    if (!el) return Promise.resolve();
    var tage = el.querySelectorAll('.bw-streak__tag');
    var tag = tage[index == null ? tage.length - 1 : index];
    if (!tag) return Promise.resolve();
    if (!tag.querySelector('.bw-streak__scheibe')) {
      var s = document.createElement('span');
      s.className = 'bw-streak__scheibe';
      tag.appendChild(s);
    }
    var vor = tag.previousElementSibling;
    if (vor && vor.classList.contains('thread')) vor.classList.add('is-active');
    tag.classList.remove('is-voll');
    void tag.getBoundingClientRect();
    tag.classList.add('is-voll');
    return warten(reduziert() ? ms(120) : ms(300));
  }

  /* Wellenform an/aus. Läuft die Aufnahme, zählt daneben die Zeit — unter
     Reduce ist die Ziffer der einzige Beweis, dass etwas passiert, und sie
     genügt. */
  var wellenUhr = null;
  function welle(el, an, uhrEl) {
    el = qs(el); uhrEl = qs(uhrEl);
    if (!el) return;
    aufbereiten(el.parentElement || document);
    el.classList.toggle('is-an', an !== false);
    if (wellenUhr) { clearInterval(wellenUhr); wellenUhr = null; }
    if (an !== false && uhrEl) {
      var s = 0;
      uhrEl.textContent = '00:00';
      wellenUhr = setInterval(function () {
        s++;
        uhrEl.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
      }, 1000);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5 · MOMENT 1 — DIE ÜBERGABE
   *
   * Der wichtigste Moment der App. Drei Sätze, 780 ms:
   *
   *   0 – 180 ms   Die Auswahl verdichtet sich zur Karte. Der Absatz behält
   *                seine Höhe und verliert Zeichnung; die Karte nimmt an
   *                seiner Stelle Kartenmaß an.
   * 120 – 600 ms   Die Karte fliegt — und zwar AUF DEM FADEN: die Bahn wird
   *                nicht erfunden, sondern Punkt für Punkt aus dem Pfad
   *                gelesen, den MOCK.thread gespannt hat
   *                (path.getPointAtLength). Deshalb kann sie gar nicht neben
   *                dem Faden herlaufen.
   * 120 – 540 ms   Der Faden zeichnet sich vom Ursprung zum Ziel (--t-hand,
   *                420 ms). Er ist 60 ms vor der Karte da: erst liegt der Weg,
   *                dann kommt, was ihn geht.
   * 600 – 780 ms   Ankunft. Der Zähler zählt hoch, der Zielpunkt bekommt
   *                seinen Ink-Ring, die Zielkachel bleibt aktiv.
   *
   * Reduce (360 ms): kein Flug, keine Bahn, keine Verdichtung als Bewegung.
   * Der Faden erscheint auf voller Länge, 120 ms später zählt das Ziel hoch.
   * Die Aussage „von hier nach dort" bleibt, der Weg fällt weg.
   * ==================================================================== */

  function uebergeben(o) {
    o = o || {};
    var von = qs(o.von), nach = qs(o.nach);
    if (!von || !nach) return Promise.resolve(null);

    var box = bezugsrahmen(qs(o.box) || gemeinsam(von, nach));
    var zaehlerEl = qs(o.zaehler);
    var punkt = qs(o.punkt);
    var kurve = (o.kurve == null ? 26 : +o.kurve);

    var f = faden(von, nach, { strength: 'origin', curve: kurve, box: box, active: true });

    /* ── Reduce-Pfad ─────────────────────────────────────────────────── */
    if (reduziert()) {
      von.classList.add('bw-verdichtet');
      return fadenZeigen(f)
        .then(function () { return warten(ms(120)); })
        .then(function () {
          nach.classList.add('bw-ziel-aktiv');
          if (punkt) { punkt.classList.remove('dot--hollow'); punkt.classList.add('dot--ring'); }
          von.classList.remove('bw-verdichtet');
          return zaehler(zaehlerEl, o.wert);
        })
        .then(function () { return { faden: f }; });
    }

    /* ── Satz 1: verdichten ──────────────────────────────────────────── */
    var rB = box.getBoundingClientRect();
    var rV = von.getBoundingClientRect();

    var karte = document.createElement('div');
    karte.className = 'bw-flug';
    karte.setAttribute('aria-hidden', 'true');
    var breit = +(o.breite || 176), hoch = +(o.hoehe || 96);
    karte.style.setProperty('--bw-flug-w', breit + 'px');
    karte.style.setProperty('--bw-flug-h', hoch + 'px');
    karte.style.left = (rV.left - rB.left) + 'px';
    karte.style.top = (rV.top - rB.top) + 'px';
    karte.innerHTML =
      '<span class="bw-flug__kopf"><span class="dot dot--cards"></span>' +
      '<span class="t-label">Lernkarte</span></span>' +
      '<span class="bw-flug__text"></span>';
    karte.querySelector('.bw-flug__text').textContent =
      (o.text || von.textContent || '').trim().slice(0, 120);
    box.appendChild(karte);

    var verdichten = karte.animate(
      [{ width: rV.width + 'px', height: rV.height + 'px', borderRadius: '8px' },
       { width: breit + 'px', height: hoch + 'px', borderRadius: '11px' }],
      { duration: ms(180), easing: E.quick, fill: 'both' });

    von.classList.add('bw-verdichtet');

    /* ── Satz 2: Flug auf dem Faden + Faden zeichnen ─────────────────── */
    return warten(ms(120)).then(function () {
      if (f) f.draw();

      var pfad = f && f.path;
      var lange = 0;
      try { lange = pfad ? pfad.getTotalLength() : 0; } catch (e) { lange = 0; }

      var x0 = rV.left - rB.left, y0 = rV.top - rB.top;
      var rN = nach.getBoundingClientRect();
      var zielX = rN.left + rN.width / 2 - rB.left;
      var zielY = rN.top + rN.height / 2 - rB.top;
      var s1 = 0.42;

      var N = 40, bilder = [];
      for (var i = 0; i <= N; i++) {
        var u = i / N;
        var e = BOUNCY(u);                       /* die Kurve steckt in den Punkten */
        var eLage = Math.min(1, Math.max(0, e)); /* Ort läuft nicht über das Ziel hinaus */
        var px, py;
        if (lange > 1) {
          var p = pfad.getPointAtLength(eLage * lange);
          px = p.x; py = p.y;
        } else {
          px = x0 + rV.width / 2 + (zielX - x0 - rV.width / 2) * eLage;
          py = y0 + rV.height / 2 + (zielY - y0 - rV.height / 2) * eLage;
        }
        /* Die letzten 28 % zieht die Bahn vom Fadenende zur Mitte der
           Zielkachel. Der Faden endet dort, wo ein Faden enden muss — am Rand
           des Objekts —, die Karte aber legt sich hinein und nicht davor.
           Quadratisch gewichtet, damit der Übergang keinen Knick hat. */
        var w = Math.max(0, (eLage - 0.72) / 0.28); w = w * w;
        px = px * (1 - w) + zielX * w;
        py = py * (1 - w) + zielY * w;
        var s = 1 + (s1 - 1) * e;                /* der Maßstab DARF überschwingen */
        var dreh = -4 + 4 * eLage;
        bilder.push({
          transform: 'translate(' + (px - x0 - breit * s / 2) + 'px,' +
                     (py - y0 - hoch * s / 2) + 'px) scale(' + s + ') rotate(' + dreh + 'deg)',
          offset: u,
        });
      }
      var flug = karte.animate(bilder, { duration: ms(480), easing: 'linear', fill: 'forwards' });
      return Promise.all([flug.finished.catch(function () {}), verdichten.finished.catch(function () {})]);
    })
    /* ── Satz 3: Ankunft ────────────────────────────────────────────── */
    .then(function () {
      nach.classList.add('bw-ziel-aktiv');
      if (punkt) { punkt.classList.remove('dot--hollow'); punkt.classList.add('dot--ring'); }
      karte.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: ms(140), easing: E.io, fill: 'forwards' });
      /* Der Absatz kommt zurück auf volle Zeichnung. Er hat etwas abgegeben,
         er ist nicht selbst weg — bliebe er blass, hieße das „nicht mehr hier",
         und das wäre falsch. */
      von.classList.remove('bw-verdichtet');
      var z = zaehler(zaehlerEl, o.wert);
      return warten(ms(180)).then(function () { karte.remove(); return z; });
    })
    .then(function () { return { faden: f }; });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 6 · MOMENT 2 — ERLEDIGEN
   *
   *     0 – 180 ms   Der Kreis wird ein Haken, der sich einzeichnet
   *                  (stroke-dashoffset 15 → 0). Gleichzeitig, am anderen
   *                  Ende des Herkunftsfadens, wird die Notiz aktiv: erledigt
   *                  ist auch dort sichtbar, wo die Aufgabe herkam. Das kann
   *                  keine reine Aufgaben-App, weil keine das andere Ende hat.
   *   180 – 1180 ms  Verweildauer. Die Zeile bleibt stehen. Die Pause IST das
   *                  Rückgängig — deshalb braucht es kein Banner.
   *  1180 – 1420 ms  Die Zeile verabschiedet sich (Deckkraft, 16 pt nach rechts).
   *  1420 – 1680 ms  Die Nachbarn schließen die Lücke (Höhe, Innenabstand).
   *
   * Reduce: Haken ohne Zeichnen (120 ms Deckkraft), Verweildauer unverändert
   * 1000 ms, Zeile blendet aus (120 ms), Lücke schließt ohne Weg.
   * ==================================================================== */

  function erledigen(o) {
    o = o || {};
    var zeile = qs(o.zeile);
    if (!zeile) return Promise.resolve(null);
    var kreis = qs(o.kreis) || zeile.querySelector('.bw-check');
    var echo = qs(o.echo);
    var f = o.faden || null;

    if (kreis) { aufbereiten(kreis.parentElement || document); kreis.classList.add('is-an'); }
    if (echo) {
      echo.classList.add('bw-ziel-aktiv');
      var echoCheck = echo.querySelector('.bw-check');
      if (echoCheck) { aufbereiten(echo); echoCheck.classList.add('is-an'); }
    }
    if (f && f.active) f.active(true);

    var halten = ms(1000);
    return warten(ms(reduziert() ? 120 : 180) + halten)
      .then(function () {
        zeile.classList.add('bw-zeile-geht');
        return warten(ms(reduziert() ? 120 : 240));
      })
      .then(function () {
        /* Höhe festschreiben, sonst hat der Übergang keinen Anfangswert. */
        var h = zeile.getBoundingClientRect().height;
        zeile.classList.add('bw-luecke');
        zeile.style.height = h + 'px';
        void zeile.getBoundingClientRect();
        zeile.classList.add('is-zu');
        return warten(reduziert() ? 0 : ms(260));
      })
      .then(function () {
        zeile.setAttribute('data-bw-erledigt', '1');
        if (f && f.active) f.active(false);
        return { zeile: zeile };
      });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 7 · MOMENT 3 — KARTE BEWERTEN
   *
   * Drehen: 320 ms, springStandard. Die Kurve schwingt um 0,8 % über — die
   * Karte dreht 181,4° und kommt zurück. Genau das macht sie zum Gegenstand.
   * Perspektive 1200 px sitzt am Behälter, nicht an der Karte.
   *
   * Wischen: Solange der Finger liegt, folgt die Karte ohne Übergangszeit
   * (1:1) und dreht sich um bis zu 8°. Die Intervall-Vorschau aktualisiert
   * sich dabei laufend — man sieht vor dem Loslassen, worauf man bewertet.
   * Beim Loslassen kann eine cubic-bezier die Wurfgeschwindigkeit nicht
   * aufnehmen (feste Anfangssteigung). Deshalb wird die DAUER aus ihr
   * gerechnet: 260 ms bei > 1,2 pt/ms, 480 ms bei ruhigem Loslassen.
   *
   * Reduce: keine Drehung (Kreuzblende an derselben Stelle, 160 ms), kein
   * Wischen — die Zeiger-Ereignisse werden gar nicht erst eingehängt,
   * bewertet wird über die vier Knöpfe, die ohnehin da sind.
   * ==================================================================== */

  function drehen(o) {
    o = o || {};
    var karte = qs(o.karte);
    if (!karte) return Promise.resolve(null);
    var auf = o.zustand == null ? !karte.classList.contains('is-gedreht') : !!o.zustand;
    karte.classList.toggle('is-gedreht', auf);
    return warten(reduziert() ? ms(160) : ms(320)).then(function () { return { gedreht: auf }; });
  }

  /* Die Intervall-Reihe ist ein Faden mit Punkten (DNA §3). Der Punkt, auf
     den die Bewertung führen würde, bekommt den Ink-Ring; die Stücke bis
     dorthin werden aktiv. Zustand, keine Zierde. */
  var NOTEN = { nochmal: -99, schwer: 0, gut: 1, leicht: 2 };

  function intervallVorschau(reiheEl, index) {
    var reihe = qs(reiheEl);
    if (!reihe) return -1;
    var punkte = reihe.querySelectorAll('.dot');
    var stuecke = reihe.querySelectorAll('.thread');
    var i = Math.min(Math.max(index, 0), punkte.length - 1);
    punkte.forEach(function (p, k) {
      p.classList.toggle('dot--ring', k === i);
      p.classList.toggle('dot--hollow', k > i);
    });
    stuecke.forEach(function (s, k) { s.classList.toggle('is-active', k < i); });
    reihe.setAttribute('data-bw-index', String(i));
    return i;
  }

  /* basis: der Index VOR der Vorschau. Beim Wischen hat die Vorschau den
     Index schon verschoben — ohne basis würde die Bewertung ein zweites Mal
     verschieben und die Karte landete ein Intervall zu weit. */
  function notenIndex(reiheEl, note, basis) {
    var reihe = qs(reiheEl);
    var jetzt = (basis != null) ? basis
      : (reihe ? (parseInt(reihe.getAttribute('data-bw-index'), 10) || 0) : 0);
    var d = NOTEN[note];
    if (d === -99) return 0;
    return jetzt + (d || 0);
  }

  function bewerten(o) {
    o = o || {};
    var karte = qs(o.karte);
    var note = o.note || 'gut';
    var reihe = qs(o.intervalle);
    var dauer = o.dauer ? ms(o.dauer) : ms(reduziert() ? 160 : 320);
    if (!karte) return Promise.resolve(null);

    var richtung = (note === 'nochmal') ? -1 : 1;

    if (reduziert()) {
      karte.style.transition = 'opacity ' + ms(160) + 'ms ' + E.io;
      karte.style.opacity = '0';
    } else {
      karte.classList.remove('is-gefasst');
      karte.classList.add('is-los');
      karte.style.setProperty('--bw-dur', dauer + 'ms');
      karte.style.transform = 'translateX(' + (richtung * 460) + 'px) rotate(' + (richtung * 9) + 'deg)';
      karte.style.opacity = '0';
    }

    if (reihe) intervallVorschau(reihe, notenIndex(reihe, note, o.basis));

    return warten(dauer).then(function () {
      if (o.zaehler) zaehler(o.zaehler, o.wert);
      var naechste = qs(o.naechste);
      if (naechste) {
        naechste.hidden = false;
        naechste.classList.remove('bw-karte-nach');
        void naechste.getBoundingClientRect();
        naechste.classList.add('bw-karte-nach');
      }
      return warten(reduziert() ? ms(160) : ms(320));
    }).then(function () { return { note: note }; });
  }

  /* Wischen einhängen. Nur wenn nicht reduziert — und die Knöpfe können
     immer alles, was das Wischen kann. */
  function wischen(o) {
    o = o || {};
    var karte = qs(o.karte);
    if (!karte || reduziert()) return function () {};
    var reihe = qs(o.intervalle);
    var start = 0, t0 = 0, letzterX = 0, letzterT = 0, aktiv = false, gefasst = false;
    var grundIndex = reihe ? (parseInt(reihe.getAttribute('data-bw-index'), 10) || 0) : 0;

    /* Ein Zeiger, der auf einem Bedienelement der Karte aufsetzt, gehört
       diesem Element — nicht dem Wischen. Ohne diese Sperre verschluckt die
       Karte jeden Tap auf ihren eigenen Herkunfts-Chip. */
    function aufBedienelement(e) {
      return !!(e.target && e.target.closest &&
                e.target.closest('button, a, [data-bw], input, textarea, select'));
    }
    function runter(e) {
      if (e.button != null && e.button !== 0) return;
      if (aufBedienelement(e)) return;
      aktiv = true; gefasst = false; start = e.clientX; t0 = performance.now();
      letzterX = e.clientX; letzterT = t0;
      grundIndex = reihe ? (parseInt(reihe.getAttribute('data-bw-index'), 10) || 0) : 0;
      karte.classList.remove('is-los');
    }
    function bewegen(e) {
      if (!aktiv) return;
      var dx = e.clientX - start;
      /* Erst ab 6 pt wird aus dem Aufsetzen ein Ziehen. Vorher bleibt der
         Zeiger frei, damit ein Tap ein Tap bleibt (der Klick würde sonst auf
         dem Element landen, das den Zeiger gefangen hat). */
      if (!gefasst) {
        if (Math.abs(dx) < 6) return;
        gefasst = true;
        karte.classList.add('is-gefasst');
        if (karte.setPointerCapture && e.pointerId != null) karte.setPointerCapture(e.pointerId);
      }
      letzterX = e.clientX; letzterT = performance.now();
      karte.style.transform = 'translateX(' + dx + 'px) rotate(' + Math.max(-8, Math.min(8, dx / 18)) + 'deg)';
      if (reihe) {
        var vor = dx > 60 ? 'gut' : dx < -60 ? 'nochmal' : null;
        intervallVorschau(reihe, vor ? (vor === 'gut' ? grundIndex + 1 : 0) : grundIndex);
      }
      if (o.beiZug) o.beiZug(dx);
    }
    function los(e) {
      if (!aktiv) return;
      aktiv = false;
      if (!gefasst) { karte.classList.remove('is-gefasst'); return; }
      gefasst = false;
      var dx = e.clientX - start;
      var dt = Math.max(1, performance.now() - letzterT + 8);
      var v = Math.abs(e.clientX - letzterX) / dt;             /* pt je ms */
      karte.classList.remove('is-gefasst'); karte.classList.add('is-los');
      if (Math.abs(dx) > 72) {
        /* Die Feder nähme die Wurfgeschwindigkeit auf, die Bézier kann das
           nicht. Also wandert sie in die Dauer: 260 ms bei schnellem
           Schnippen, 480 ms bei ruhigem Loslassen. */
        var dauer = Math.round(480 - Math.min(1, v / 1.2) * 220);
        bewerten({ karte: karte, note: dx > 0 ? 'gut' : 'nochmal', intervalle: reihe,
                   dauer: dauer, basis: grundIndex, zaehler: o.zaehler, naechste: o.naechste });
      } else {
        karte.style.setProperty('--bw-dur', ms(180) + 'ms');
        karte.style.transform = '';
        if (reihe) intervallVorschau(reihe, grundIndex);
      }
    }
    karte.addEventListener('pointerdown', runter);
    karte.addEventListener('pointermove', bewegen);
    karte.addEventListener('pointerup', los);
    karte.addEventListener('pointercancel', los);
    return function () {
      karte.removeEventListener('pointerdown', runter);
      karte.removeEventListener('pointermove', bewegen);
      karte.removeEventListener('pointerup', los);
      karte.removeEventListener('pointercancel', los);
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 8 · MOMENT 4 — DOKUMENT ÖFFNEN (Hero)
   *
   * 320 ms, springStandard. Ein Zwilling der Bibliothekskarte legt sich über
   * die Seite und wechselt in einem Zug Ort, Breite, Höhe und Eckradius bis
   * zum Rechteck des Editors. Breite/Höhe statt Maßstab: sonst staucht das
   * Coverbild und der Radius wächst mit.
   * Der Editor blendet ab 55 % der Zeit auf (160 ms), die Bibliothek dahinter
   * geht auf 0,55 — nur Deckkraft, kein Zurückweichen. Zwei gleichzeitige
   * Wege würden um dieselbe Aufmerksamkeit ringen.
   *
   * Reduce: kein Zwilling. Die Ursprungskarte bekommt 80 ms lang einen 2-pt-
   * Ink-Ring — damit steht fest, woher das Dokument kommt —, dann blendet der
   * Editor in 160 ms auf.
   * ==================================================================== */

  function oeffnen(o) {
    o = o || {};
    var von = qs(o.von), nach = qs(o.nach);
    if (!von || !nach) return Promise.resolve(null);
    var huelle = qs(o.huelle);

    if (huelle) huelle.classList.add('bw-huelle-zurueck');

    if (reduziert()) {
      von.classList.add('bw-ursprung-markiert');
      return warten(ms(80)).then(function () {
        nach.hidden = false;
        nach.classList.remove('bw-oeffnen-blatt');
        void nach.getBoundingClientRect();
        nach.classList.add('bw-oeffnen-blatt');
        return warten(ms(160));
      }).then(function () {
        von.classList.remove('bw-ursprung-markiert');
        return { hero: false };
      });
    }

    /* Ziel messen, ohne es zu zeigen: sichtbar machen, aber unsichtbar
       gestellt — dann steht das Rechteck, bevor der Zwilling losläuft. */
    var rA = von.getBoundingClientRect();
    nach.hidden = false;
    nach.style.visibility = 'hidden';
    nach.style.opacity = '0';
    var rB = nach.getBoundingClientRect();

    var zwilling = von.cloneNode(true);
    zwilling.className = (von.className + ' bw-zwilling').replace(/\bbw-tap[^\s]*/g, '');
    zwilling.removeAttribute('id');
    zwilling.setAttribute('aria-hidden', 'true');
    zwilling.style.left = rA.left + 'px';
    zwilling.style.top = rA.top + 'px';
    zwilling.style.width = rA.width + 'px';
    zwilling.style.height = rA.height + 'px';
    document.body.appendChild(zwilling);
    von.style.visibility = 'hidden';

    var rad = getComputedStyle(nach).borderRadius || '0px';
    var lauf = zwilling.animate(
      [{ left: rA.left + 'px', top: rA.top + 'px', width: rA.width + 'px', height: rA.height + 'px',
         borderRadius: getComputedStyle(von).borderRadius },
       { left: rB.left + 'px', top: rB.top + 'px', width: rB.width + 'px', height: rB.height + 'px',
         borderRadius: rad }],
      { duration: ms(320), easing: E.standard, fill: 'forwards' });

    setTimeout(function () {
      nach.style.visibility = '';
      nach.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: ms(160), easing: E.io, fill: 'forwards' });
      nach.style.opacity = '';
    }, ms(176));

    return lauf.finished.catch(function () {}).then(function () {
      zwilling.remove();
      von.style.visibility = '';
      return { hero: true };
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 9 · MOMENT 5 — HERKUNFT ZEIGEN
   *
   * Tap auf den Herkunfts-Chip. Erst zeichnet sich die Verbindung zum
   * Ursprung (420 ms, --t-hand), dann — 160 ms später — weicht die Karte
   * nach links und der Quellabsatz kommt von rechts herein. Der Faden bleibt
   * dabei gespannt: MOCK.thread führt ihn selbst nach (transitionend).
   * Der Sitzungszähler bewegt sich nicht. Man behält die Hand am Faden,
   * statt die Sitzung zu verlassen.
   *
   * BEGRÜNDETE ABWEICHUNG von DNA §2.2 („zeichnet sich immer vom Ursprung
   * zum Ergebnis, nie umgekehrt"): Hier läuft der Stift vom Chip zum
   * Ursprung, also gegen die Kausalität. Der Grund steht im selben Absatz
   * der DNA — „beim Zurückgehen läuft er rückwärts wieder ein". Dies IST der
   * Rückweg: die Bewegung geht vom Finger aus, und ein Faden, der irgendwo
   * am Bildrand losliefe, wäre nicht die Antwort auf einen Tap. Die Kante im
   * Datenmodell bleibt unverändert Ursprung → Ergebnis; nur der Stift läuft
   * sie rückwärts ab. Beim Loslassen (zurueck()) zieht er sich zum Chip
   * zurück, also dorthin, wo der Finger war.
   *
   * Reduce: nichts weicht, nichts kommt herein. Der Faden erscheint auf
   * voller Länge (120 ms), die Quelle blendet an ihrem Platz auf (160 ms),
   * die Karte wird nur ruhiger. Dieselbe Beziehung, ohne Weg.
   * ==================================================================== */

  var letzterHerkunftsweg = null;

  function herkunft(o) {
    o = o || {};
    var chip = qs(o.chip), ursprung = qs(o.ursprung);
    if (!chip || !ursprung) return null;
    var karte = qs(o.karte), quelle = qs(o.quelle);
    var box = bezugsrahmen(qs(o.box) || gemeinsam(chip, ursprung));

    if (letzterHerkunftsweg) { letzterHerkunftsweg.zurueck(); letzterHerkunftsweg = null; }

    chip.setAttribute('aria-expanded', 'true');
    var f = faden(chip, ursprung, { strength: 'origin', curve: (o.kurve == null ? 20 : +o.kurve),
                                    box: box, active: true });

    var lauf = fadenZeigen(f)
      .then(function () { return warten(ms(reduziert() ? 0 : 160)); })
      .then(function () {
        if (karte) karte.classList.add('is-weg');
        if (quelle) quelle.classList.add('is-da');
        /* Der Chip sitzt AUF der Karte, die gerade weicht — ohne Nachführen
           risse der Faden für 320 ms von seinem eigenen Anfang ab. */
        nachfuehren(f, ms(reduziert() ? 160 : 320) + 60);
        return warten(reduziert() ? ms(160) : ms(320));
      })
      .then(function () { if (f) f.update(); });

    var weg = {
      faden: f,
      fertig: lauf,
      zurueck: function () {
        if (quelle) quelle.classList.remove('is-da');
        if (karte) karte.classList.remove('is-weg');
        chip.setAttribute('aria-expanded', 'false');
        nachfuehren(f, ms(reduziert() ? 160 : 320) + 60);
        return warten(reduziert() ? ms(160) : ms(320)).then(function () {
          if (!f) return;
          if (reduziert()) { f.node.classList.remove('bw-faden-blende'); f.destroy(); return; }
          f.drawBack();
          return warten(ms(420)).then(function () { f.destroy(); });
        }).then(function () {
          for (var i = faeden.length - 1; i >= 0; i--) if (faeden[i].api === f) faeden.splice(i, 1);
          if (letzterHerkunftsweg === weg) letzterHerkunftsweg = null;
        });
      },
    };
    letzterHerkunftsweg = weg;
    return weg;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 10 · BÜHNE ZURÜCKSETZEN
   * Für Musterseiten und für Schirme, die einen Moment mehrmals zeigen.
   * Merkt sich den Anfangszustand eines Behälters und stellt ihn wieder her —
   * samt Symbolen, Fäden und den Vorbereitungen aus aufbereiten().
   * ==================================================================== */

  var schnappschuss = new WeakMap();

  function merken(el) {
    el = qs(el);
    if (!el) return;
    schnappschuss.set(el, el.innerHTML);
  }

  function zuruecksetzen(el) {
    el = qs(el);
    if (!el) return;
    faedenLoeschen(el);
    var h = schnappschuss.get(el);
    if (h == null) return;
    /* Fäden, die MOCK.thread in die Bühne gezeichnet hat, liegen als
       <svg class="thread-layer"> im Behälter und verschwinden mit dem
       Zurückschreiben von selbst. */
    el.innerHTML = h;
    if (global.MOCK) { global.MOCK.hydrate(el); global.MOCK.threads(el); }
    aufbereiten(el);
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 11 · DIE ATTRIBUT-SCHNITTSTELLE
   * Ein einziger Zuhörer am Dokument. Die 13 Schirme brauchen deshalb
   * keine Zeile JavaScript, nur Attribute.
   * ==================================================================== */

  function lese(el, name) { return el.getAttribute('data-bw-' + name); }

  function ausAttributen(knopf) {
    var art = knopf.getAttribute('data-bw');
    var z = function (n) { var v = lese(knopf, n); return v ? qs(v, knopf) : null; };

    if (art === 'uebergeben') {
      return uebergeben({
        von: z('von'), nach: z('nach'), zaehler: z('zaehler'), punkt: z('punkt'),
        box: z('box'), kurve: lese(knopf, 'kurve'), text: lese(knopf, 'text'),
      });
    }
    if (art === 'erledigen') {
      return erledigen({ zeile: z('zeile'), kreis: z('kreis'), echo: z('echo') });
    }
    if (art === 'drehen') {
      return drehen({ karte: z('karte') });
    }
    if (art === 'bewerten') {
      return bewerten({
        karte: z('karte'), note: lese(knopf, 'note'), intervalle: z('intervalle'),
        zaehler: z('zaehler'), naechste: z('naechste'),
      });
    }
    if (art === 'oeffnen') {
      return oeffnen({ von: z('von'), nach: z('nach'), huelle: z('huelle') });
    }
    if (art === 'herkunft') {
      return herkunft({
        chip: knopf, ursprung: z('ursprung'), karte: z('karte'),
        quelle: z('quelle'), box: z('box'), kurve: lese(knopf, 'kurve'),
      });
    }
    if (art === 'zurueck') {
      if (letzterHerkunftsweg) return letzterHerkunftsweg.zurueck();
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var knopf = e.target.closest && e.target.closest('[data-bw]');
    if (!knopf) return;
    if (knopf.hasAttribute('data-bw-aus')) return;
    e.preventDefault();
    ausAttributen(knopf);
  });

  /* ══════════════════════════════════════════════════════════════════════
   * 12 · START
   * ==================================================================== */

  function start() {
    anwenden();
    aufbereiten(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  global.MOTION = {
    /* Zustand */
    modus: setModus, tempo: setTempo, ms: ms,
    reduziert: reduziert, systemSagt: systemSagt, zustand: zustand,
    horchen: function (fn) { horcher.push(fn); try { fn(zustand()); } catch (e) {} },
    /* Werte */
    rollen: ROLLEN, kurven: E,
    /* Die fünf Momente */
    uebergeben: uebergeben, erledigen: erledigen, drehen: drehen, bewerten: bewerten,
    oeffnen: oeffnen, herkunft: herkunft, wischen: wischen,
    /* Kleinbewegungen */
    zaehler: zaehler, staffeln: staffeln, laden: laden, streak: streak, welle: welle,
    intervallVorschau: intervallVorschau,
    /* Hilfen */
    aufbereiten: aufbereiten, merken: merken, zuruecksetzen: zuruecksetzen,
    faden: faden, fadenZeigen: fadenZeigen, nachfuehren: nachfuehren,
    warten: warten, rahmen: rahmen,
  };
})(window);
