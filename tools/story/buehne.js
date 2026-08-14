/* buehne.js — der Prototyp, hergerichtet für die Kamera.
 *
 * Vier Dinge trennen einen Mitschnitt von einem Film:
 *
 *   1 · Sprache      · das Wörterbuch aus englisch.js legt sich über alles.
 *   2 · Absender     · in der Seitenleiste steht nicht der Name eines Nutzers,
 *                      sondern das Zeichen. Ein Werbefilm zeigt die Marke,
 *                      nicht Emil.
 *   3 · Canvas       · eine leere Fläche beweist nichts, das Vorführbrett
 *                      erklärt sich mit „… wie in GoodNotes". Gezeichnet wird
 *                      darum wirklich — in canvas-buehne.js, denn der Rahmen
 *                      ist ein eigenes Dokument.
 *   4 · Politur      · alles, was im Standbild wie ein Fehler aussähe: ein
 *                      Ladebalken bei 62 %, ein „wird geladen", eine
 *                      Sprachnotiz, die gerade überträgt. Im Betrieb sind das
 *                      ehrliche Zustände. In einem 10-Sekunden-Schnitt sind es
 *                      Bugs, die keiner erklärt bekommt.
 *
 * Nichts davon wird in den Entwurf geschrieben. Die Bühne lebt nur für die
 * Dauer der Aufnahme im Speicher des Browsers.
 */
(function (global) {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════
   * 1 · DER ABSENDER
   *
   * Der Kopf der Seitenleiste trägt „Emil" in .t-section. An seine Stelle
   * kommt die Wortmarke — dieselbe Datei, die überall im Paket liegt, in
   * der Variante für den jeweiligen Hintergrund. Die Marke wird NICHT
   * nachgebaut; sie wird geladen.
   * ==================================================================== */

  /* Beschnitten, nicht umgezeichnet: der gelieferte Bogen hat 46 % leeren
     Rand. Ungeschnitten stünde die Wortmarke bei 13 px Kastenhöhe mit
     4,5 px Versalhöhe im Bild — unlesbar, und genau das, was billig aussieht. */
  var MARKE = '../../assets/brand/logo/wordmark-ink-beschnitten.png';
  var ZEICHEN = '../../assets/brand/velum-appicon-light.png';

  function absender(wurzel) {
    var koepfe = wurzel.querySelectorAll('.sidebar__head');
    Array.prototype.forEach.call(koepfe, function (kopf) {
      var name = kopf.querySelector('.t-section');
      if (!name) return;
      var box = document.createElement('span');
      box.className = 'pv-absender';
      box.setAttribute('aria-label', 'Velum');

      var v = document.createElement('img');
      v.src = ZEICHEN;
      v.alt = '';
      v.className = 'pv-absender__zeichen';

      var wort = document.createElement('img');
      wort.src = MARKE;
      wort.alt = 'Velum';
      wort.className = 'pv-absender__wort';

      box.appendChild(v);
      box.appendChild(wort);
      name.replaceWith(box);
    });
  }

  var STIL = [
    '.pv-absender{display:inline-flex;align-items:center;gap:9px;height:26px}',
    '.pv-absender__zeichen{width:24px;height:24px;border-radius:5.5px;display:block;',
    '  box-shadow:0 1px 2px rgba(0,0,0,.18),inset 0 0 0 .5px rgba(0,0,0,.12)}',
    /* 14 px Versalhöhe · dieselbe optische Größe, die „Emil" in .t-section hatte */
    '.pv-absender__wort{height:14px;width:auto;display:block;opacity:.94}',
    ':root[data-theme="dark"] .pv-absender__wort{filter:invert(1) brightness(1.7)}',
    /* Politur: nichts blinkt, nichts lädt, nichts wackelt im Bild. */
    '.pv-still *,.pv-still *::before,.pv-still *::after{animation-play-state:running}',
  ].join('\n');

  /* ══════════════════════════════════════════════════════════════════════
   * 2 · DIE POLITUR
   *
   * Jede Regel hier beantwortet die Frage: sähe das im Standbild wie ein
   * Fehler aus? Wenn ja, wird der Zustand auf seinen fertigen Endpunkt
   * gestellt — nicht versteckt. Ein weggenommener Ladebalken hinterlässt ein
   * Loch; ein fertiger Ladebalken hinterlässt eine geladene Zeile.
   * ==================================================================== */

  function politur(wurzel) {
    var getan = [];

    /* a · Alle Zwischenzustände auf ihren Endpunkt. Ein Ladebalken bei 62 %,
           eine Sprachnotiz, die überträgt, ein Schritt, der gerade sichert:
           im Betrieb ehrlich, im Zehn-Sekunden-Schnitt eingefroren.

           Gesucht wird über BLATTknoten, nicht über Klassen — die Kachel im
           Bibliotheksraster heißt nirgends .card, und ein Klassenname, der
           heute stimmt, stimmt nach dem nächsten Umbau nicht mehr. */
    var ENDE = {
      'wird geladen': '31 Seiten',
      'Sprachnotiz wird übertragen': 'Sprachnotiz · abgetippt',
      'Nachtrag · nimmt auf ·': 'Nachtrag ·',
      'Schritt wird gesichert': 'Schritt gesichert',
    };
    Array.prototype.forEach.call(wurzel.querySelectorAll('*'), function (el) {
      if (el.children.length) return;
      var s = (el.textContent || '').trim();
      var treffer = Object.prototype.hasOwnProperty.call(ENDE, s) ? ENDE[s]
                  : (/^\d+ % · aus iCloud$/.test(s) ? 'gestern' : null);
      if (treffer === null) return;
      el.textContent = treffer;
      getan.push(s);

      /* Der Balken, der zu diesem Zustand gehört, geht mit ihm — aber nur er.
         Der Lesefortschritt auf der Heute-Karte ist kein Ladezustand und
         bleibt stehen; darum wird nur im eigenen Kasten gesucht. */
      var kasten = el.closest('li, article, a, .tile, .card') || el.parentElement;
      if (!kasten) return;
      Array.prototype.forEach.call(
        kasten.querySelectorAll('[class*="progress"],[class*="lade"],[class*="fortschritt"]'),
        function (b) { b.style.visibility = 'hidden'; });
    });

    /* c · Alles, was blinkt oder pulst, steht still. Im 30-Bilder-Schnitt
           erzeugt ein Pulsieren Flimmern, kein Leben. */
    var still = document.createElement('style');
    still.textContent =
      '.pv-screen [class*="puls"],.pv-screen [class*="blink"],.pv-screen [class*="skeleton"],' +
      '.pv-screen [class*="shimmer"]{animation:none!important}' +
      '.pv-screen .rec,.pv-screen [class*="aufnahme-punkt"]{animation:none!important;opacity:1!important}';
    document.head.appendChild(still);

    /* d · Der Faden zum abgetrennten Element (§14) darf nicht ins Leere
           laufen, wenn der Schirm gewechselt wird. */
    Array.prototype.forEach.call(document.querySelectorAll('.pv-faden, .pv-fadenaus'), function (f) {
      f.remove(); getan.push('faden');
    });

    return getan;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 3 · DAS CANVAS-FENSTER
   *
   * Der Rahmen zeigt das Vorführbrett „Whiteboard", das sich selbst mit dem
   * Satz „… wie in GoodNotes" erklärt. Für den Film wird stattdessen ein
   * leeres Blatt geladen (?leer=1) — canvas-buehne.js zeichnet darauf.
   * ==================================================================== */

  /* ══════════════════════════════════════════════════════════════════════
   * 3a · DER STEMPEL
   *
   * §14c sortiert Aufgaben nach dem, was in ihnen steht: „Geplant morgen",
   * „Fr, 15. Nov", „!!!". Der Prototyp macht das inzwischen einmal beim
   * Beleben und merkt es sich an der Zeile — aber ein Schirm, der erst nach
   * dem Übersetzen zum ersten Mal aufgebaut wird, liest dann Englisch und
   * findet nichts. Also stempelt die Bühne zuerst, in der Sprache, in der
   * der Entwurf geschrieben ist.
   * ==================================================================== */

  function stempeln() {
    var n = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.row'), function (z) {
      if (z.__pvWann) return;
      var t = (z.textContent || '').replace(/\s+/g, ' ').trim();
      z.__pvWann = /heute|\b\d{1,2}:\d{2}\b/.test(t) ? 'heute'
                 : /morgen/.test(t) ? 'morgen'
                 : /woche|Fr,|Mo,|Di,|Mi,|Do,/.test(t) ? 'woche'
                 : 'ohne';
      z.__pvDringend = /!!!|!!|dringend|noch 0 Tage|fällig/i.test(t);
      z.__pvSchritte = /\d von \d|Schritt/.test(t);
      n++;
    });
    return n;
  }

  function canvasLeeren() {
    var n = 0;
    /* „Zurück zu Velum" ist die Rückfahrkarte des PROTOTYPS, nicht der App.
       Im Film wäre sie ein Knopf, den es im Produkt nicht gibt. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-pv-canvas-zurueck]'),
      function (b) { b.style.display = 'none'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pv-canvas]'), function (f) {
      var q = f.getAttribute('data-pv-canvas');
      if (q.indexOf('leer=1') < 0) f.setAttribute('data-pv-canvas', q + '?leer=1');
      if (f.src && f.src.indexOf('leer=1') < 0) f.src = f.src.split('?')[0] + '?leer=1';
      n++;
    });
    return n;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 4 · DER AUFTRITT
   * ==================================================================== */

  function anziehen() {
    var s = document.createElement('style');
    s.textContent = STIL;
    document.head.appendChild(s);

    var bericht = { sprache: null, politur: null, absender: 0 };
    var koerper = document.body;

    bericht.gestempelt = stempeln();
    canvasLeeren();
    absender(koerper);
    bericht.absender = document.querySelectorAll('.pv-absender').length;
    bericht.politur = politur(koerper);
    bericht.sprache = global.ENGLISCH ? global.ENGLISCH.umstellen(koerper) : null;
    beobachten();
    document.title = 'Velum';
    return bericht;
  }

  /* Nach jeder Bedienung: der Prototyp baut Zeilen und Tafeln zur Laufzeit
     nach — die müssen dieselbe Sprache sprechen wie der Rest. */
  /* Der Wächter: was der Prototyp zur LAUFZEIT baut (die ERKANNT-Chips
     beim Tippen, frische Aufgabenzeilen), wird im selben Moment übersetzt.
     nachziehen() nach jedem Griff reichte für Standbilder — beim Tippen
     entsteht mit jedem Zeichen ein neuer Chip, und ein deutscher Chip für
     drei Bilder wäre im Film ein Flackern. Endlosschleifen drohen nicht:
     der ersetzte Text steht englisch da, das zweite Nachschlagen findet
     nichts mehr. */
  function beobachten() {
    if (global.__pvWachter || !global.ENGLISCH) return;
    var W = global.ENGLISCH.woerter;
    var leaf = function (kn) {
      if (kn.nodeType === 3) {
        var s = global.ENGLISCH.normal(kn.textContent);
        if (Object.prototype.hasOwnProperty.call(W, s) && kn.textContent !== W[s]) {
          kn.textContent = W[s];
        }
      } else if (kn.nodeType === 1) {
        global.ENGLISCH.umstellen(kn);
      }
    };
    global.__pvWachter = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') leaf(m.target);
        if (m.addedNodes) Array.prototype.forEach.call(m.addedNodes, leaf);
      });
    });
    global.__pvWachter.observe(document.body,
      { subtree: true, childList: true, characterData: true });
  }

  function nachziehen() {
    stempeln();
    var b = global.ENGLISCH ? global.ENGLISCH.umstellen(document.body) : null;
    if (!document.querySelector('.pv-absender')) absender(document.body);
    return b;
  }

  global.BUEHNE = {
    anziehen: anziehen,
    nachziehen: nachziehen,
    politur: politur,
    canvasLeeren: canvasLeeren,
    stempeln: stempeln,
    beobachten: beobachten,
  };
})(window);
