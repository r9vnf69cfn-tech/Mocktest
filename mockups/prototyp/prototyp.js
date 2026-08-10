/* ============================================================================
 * prototyp.js — die Bedienung des begehbaren Prototyps
 *
 * Ohne Funktion: es wird nichts gespeichert, nichts gerechnet, nichts
 * eingegeben. Diese Datei tut genau drei Dinge:
 *
 *   sie bewegt einen von 34 Rahmen in den Vordergrund,
 *   sie merkt sich, woher man kam,
 *   und sie sagt jedem Element im Rahmen, ob es ein Ziel ist oder keines.
 *
 * ── INHALT ────────────────────────────────────────────────────────────────
 *   1  Der Bestand            welche Schirme es gibt, wie sie heißen
 *   2  Der Weg                Geschichte, Adresse, Richtung
 *   3  Der Wechsel            die Rolle WECHSELN aus bewegung.css
 *   4  Tote und lebende Ziele die eine zentrale Stelle
 *   5  Die Grundnavigation    Seitenleiste · Tab-Bar · Zurück · Lupe
 *   5b Die Wegekarte          welcher Eintrag welches Element belebt
 *   5c Die Übergänge          ÖFFNEN als Hero · als Blatt · rückwärts
 *   5d Herkunft zeigen        der Faden, dann die Quelle
 *   5e Der Zustand der Schirme  was eine Bewegung verändert hat, kommt zurück
 *   6  Tastatur und Geste
 *   7  Der Maßstab
 *   8  Der Gerätewechsel
 *  11  Das Prüfwerkzeug       das Canvas im Rahmen · der Wege-Modus
 *   9  Start und Ankunft
 *  10  Die Wegekarte          liegt seit dieser Runde daneben: wege.js
 *
 * ── DIE WEGEKARTE ─────────────────────────────────────────────────────────
 * Alles über die Grundnavigation hinaus — Bibliothek → Notiz-Editor,
 * Aufgabe → Detail, Deck → Review, Treffer → Objekt, Herkunfts-Chip →
 * Ursprung — steht als reiner Datenblock in wege.js. Sie wird VOR dieser
 * Datei geladen und legt window.VELUM_WEGE ab; §10 hier holt sie und sagt
 * in der Konsole Bescheid, wenn sie fehlt. Ihr Aufbau, ihre Felder und ihre
 * Begründung stehen im Kopf von wege.js — sie sind dort nachzulesen, wo sie
 * gebraucht werden.
 *
 * Die Karte darf auch zur Laufzeit ersetzt werden: PROTOTYP.wege(karte).
 * Danach ist alles wieder tot, was nicht mehr in der Karte steht — sie ist
 * die einzige Quelle, nicht ein Zusatz zum Bestehenden.
 *
 * Elemente mit data-bw (die fünf Signature-Momente) sind IMMER lebendig:
 * sie führen zwar nicht auf einen anderen Schirm, aber sie tun etwas
 * Sichtbares, und damit sind sie keine toten Ziele.
 *
 * ── WAS NICHT IN DER KARTE STEHT UND TROTZDEM LEBT ────────────────────────
 * Seitenleiste, Symbolschiene, Lupe, Tab-Leiste und der Zurück-Weg (§5) —
 * sie sind in allen siebzehn Schirmen wortgleich, sie 34-mal aufzuzählen
 * hieße 34-mal dasselbe pflegen.
 * Dazu die drei Schalter Hell · Dunkel · Automatisch in den Einstellungen:
 * der einzige Ort, an dem im Prototyp ein Bedienelement wirklich etwas tut.
 * ========================================================================== */

(function (global) {
  'use strict';

  var DOK  = document;
  var GLAS = DOK.getElementById('pv-glas');
  var BUEHNE = DOK.getElementById('pv-buehne');
  var FUSS = DOK.getElementById('pv-fuss');
  if (!GLAS) return;

  /* ══════════════════════════════════════════════════════════════════════
   * 1 · DER BESTAND
   * ==================================================================== */

  var GERAETE = ['ipad', 'iphone'];

  /* Jeder Schirm einmal, in der Reihenfolge, in der er im Dokument steht —
     das ist die Reihenfolge aus tools/prototyp-bauen.js und damit dieselbe
     wie in mock.js und auf der Übersichtsseite. */
  var SCHIRME = [];
  var NACH_SCHLUESSEL = Object.create(null);

  Array.prototype.forEach.call(GLAS.querySelectorAll('.pv-screen'), function (rahmen) {
    var k = rahmen.getAttribute('data-pv-screen');
    var g = rahmen.getAttribute('data-pv-geraet');
    var s = NACH_SCHLUESSEL[k];
    if (!s) {
      s = {
        schluessel: k,
        name: rahmen.getAttribute('data-pv-name') || k,
        datei: rahmen.getAttribute('data-pv-datei') || '',
        rahmen: {},
      };
      NACH_SCHLUESSEL[k] = s;
      SCHIRME.push(s);
    }
    s.rahmen[g] = rahmen;
  });

  /* Aliasse: die Wegekarte darf einen Schirm auch beim Dateinamen nennen. */
  var ALIAS = Object.create(null);
  SCHIRME.forEach(function (s) {
    ALIAS[s.schluessel] = s.schluessel;
    if (s.datei) {
      ALIAS[s.datei] = s.schluessel;
      ALIAS[s.datei.replace(/\.html$/, '')] = s.schluessel;
    }
  });
  function loesen(name) {
    if (!name) return null;
    return ALIAS[String(name).trim().toLowerCase()] || null;
  }
  function index(schluessel) {
    for (var i = 0; i < SCHIRME.length; i++) if (SCHIRME[i].schluessel === schluessel) return i;
    return -1;
  }

  var START = SCHIRME.length ? SCHIRME[0].schluessel : null;

  /* ══════════════════════════════════════════════════════════════════════
   * 2 · DER WEG — Geschichte, Adresse, Richtung
   *
   * Die Adresse nennt den Schirm: #heute, #bibliothek, #aufgabe. Steht das
   * iPhone im Rahmen, hängt /iphone daran: #heute/iphone. Damit lässt sich
   * ein bestimmter Schirm verschicken, und die Rückwärtstaste des Browsers
   * ist derselbe Weg wie der Zurück-Knopf im Schirm.
   *
   * In der Geschichte steht zusätzlich die Tiefe. Nur daran ist zu erkennen,
   * ob ein popstate vorwärts oder rückwärts ging — und ob es überhaupt einen
   * Zurück-Weg gibt. Gibt es keinen, ist der Zurück-Knopf im Schirm tot,
   * statt so auszusehen, als führte er irgendwohin.
   * ==================================================================== */

  var jetzt = { schirm: START, geraet: 'ipad', tiefe: 0 };

  function ankerLesen(hash) {
    var roh = String(hash || '').replace(/^#/, '');
    if (!roh) return null;
    var teil = roh.split('/');
    var schirm = loesen(teil[0]);
    if (!schirm) return null;
    var geraet = teil[1] && GERAETE.indexOf(teil[1]) >= 0 ? teil[1] : 'ipad';
    return { schirm: schirm, geraet: geraet };
  }

  function ankerSchreiben(schirm, geraet) {
    return '#' + schirm + (geraet === 'iphone' ? '/iphone' : '');
  }

  function zustandSetzen(schirm, geraet, tiefe, ersetzen) {
    var st = { pv: 1, schirm: schirm, geraet: geraet, tiefe: tiefe };
    var anker = ankerSchreiben(schirm, geraet);
    try {
      if (ersetzen) history.replaceState(st, '', anker);
      else history.pushState(st, '', anker);
    } catch (e) {
      /* file:// ohne History-API — dann wenigstens die Adresse. */
      location.hash = anker;
    }
    jetzt = { schirm: schirm, geraet: geraet, tiefe: tiefe };
  }

  global.addEventListener('popstate', function (e) {
    var st = e.state;
    if (!st || !st.pv) {
      var a = ankerLesen(location.hash);
      if (!a) {
        /* Ein Anker, den es nicht gibt (#quatsch, ein alter Link). Der Schirm
           bleibt stehen — dann darf die Adresse ihn aber nicht verleugnen. */
        zustandSetzen(jetzt.schirm, jetzt.geraet, jetzt.tiefe, true);
        return;
      }
      st = { schirm: a.schirm, geraet: a.geraet, tiefe: 0 };
    }
    var rueckwaerts = st.tiefe < jetzt.tiefe;
    var altGeraet = jetzt.geraet;

    /* Kam man auf diesen Schirm über ein Hero — eine Karte, die zum Schirm
       gewachsen ist —, dann geht es denselben Weg rückwärts wieder hinaus.
       §5c. Sonst der gewöhnliche Wechsel. */
    var hero = rueckwaerts && st.tiefe === jetzt.tiefe - 1 ? stapel[jetzt.tiefe] : null;
    stapelKuerzen(st.tiefe);
    jetzt = { schirm: st.schirm, geraet: st.geraet, tiefe: st.tiefe };
    if (st.geraet !== altGeraet) geraetZeigen(st.geraet);
    if (hero && hero.schirm === st.schirm && hero.geraet === st.geraet &&
        GLAS.contains(hero.quelle) && !MOTION_REDUZIERT()) {
      heroZurueck(hero);
    } else {
      zeigen(st.schirm, st.geraet, rueckwaerts ? 'zurueck' : 'vor');
    }
    rueckwegPruefen();
  });

  /* Die Adresse von Hand geändert — in der Adresszeile, über einen Link von
     außen, über einen Lesezeichen-Sprung. pushState löst kein hashchange aus,
     hier kommt also wirklich nur an, was jemand anderes geschrieben hat. Ohne
     diesen Zuhörer stünde in der Adresse #graph und im Rahmen etwas anderes:
     eine Adresse, die lügt, ist schlimmer als gar keine. */
  global.addEventListener('hashchange', function () {
    var a = ankerLesen(location.hash);
    if (!a) return;
    if (a.schirm === jetzt.schirm && a.geraet === jetzt.geraet) return;
    if (a.geraet !== jetzt.geraet) geraetZeigen(a.geraet);
    stapelKuerzen(0);
    jetzt = { schirm: jetzt.schirm, geraet: a.geraet, tiefe: 0 };
    zustandSetzen(a.schirm, a.geraet, 0, true);
    zeigen(a.schirm, a.geraet, 'seitlich');
    rueckwegPruefen();
  });

  /* ══════════════════════════════════════════════════════════════════════
   * 3 · DER WECHSEL — Rolle WECHSELN aus bewegung.css §2.2
   *
   * 180 ms hinaus, 180 ms herein, 60 ms Überlappung, 8 pt Versatz in
   * Laufrichtung. Die Klassen stehen fertig in bewegung.css und bringen
   * ihren eigenen Reduce-Pfad mit (120 ms Kreuzblende, 0 pt Versatz) — hier
   * wird nichts nachgebaut und keine Dauer zweitgeschrieben.
   *
   * Der neue Rahmen ist SOFORT sichtbar; die Bewegung läuft über ihn hinweg.
   * Erst rechnen und dann zeigen würde die Verzögerung erzeugen, an der man
   * eine Webseite von einer App unterscheidet.
   * ==================================================================== */

  var WECHSEL_MS = 300;      /* 180 + 180 − 60 Überlappung */
  var OEFFNEN_MS = 320;      /* die Rolle ÖFFNEN, bewegung.css §2.1 */
  var laeuft = null;

  /* Was bewegung.js gerade wirklich tut — nicht, was das System meldet.
     MOTION.modus('reduce') kann es von Hand erzwingen; beides muss hier
     dasselbe Ergebnis haben, sonst liefe eine Bewegung reduziert und die
     nächste voll. */
  function MOTION_REDUZIERT() {
    return !!(global.MOTION && global.MOTION.reduziert && global.MOTION.reduziert());
  }

  function alleRahmen(fn) {
    Array.prototype.forEach.call(GLAS.querySelectorAll('.pv-screen'), fn);
  }

  function aufraeumen(rahmen) {
    rahmen.classList.remove('bw-wechseln-raus', 'bw-wechseln-rein',
                            'bw-oeffnen-blatt', 'bw-huelle-zurueck');
    rahmen.removeAttribute('data-pv-richtung');
    /* Eine zurückgetretene Hülle im Inneren — das Regal, aus dem ein Buch
       gewachsen ist. Käme man über die Seitenleiste zurück, stünde es sonst
       weiter auf 0,55, und niemand fände den Grund. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.bw-huelle-zurueck'), function (h) {
      h.classList.remove('bw-huelle-zurueck');
      h.removeAttribute('data-pv-huelle');
    });
    rahmen.style.opacity = '';
    rahmen.style.zIndex = '';
    /* Der Hero lässt eine laufende Animation mit fill:forwards zurück. Bliebe
       sie hängen, gewönne sie später gegen jede CSS-Animation dieses Rahmens
       (Web Animations schlägt CSS): der nächste Wechsel führe ohne Blende
       herein, und niemand fände den Grund. */
    if (rahmen.getAnimations) {
      rahmen.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) {} });
    }
  }

  function zeigen(schluessel, geraet, richtung) {
    var schirm = NACH_SCHLUESSEL[schluessel];
    if (!schirm) return;
    var neu = schirm.rahmen[geraet];
    if (!neu) return;

    if (laeuft) { clearTimeout(laeuft.uhr); laeuft.fertig(); }

    var alt = null;
    alleRahmen(function (r) {
      if (r !== neu && !r.hidden) alt = alt || r;
    });

    /* Der neue Rahmen steht sofort. */
    aufraeumen(neu);
    neu.hidden = false;
    canvasWecken(neu);          /* §11a — das iframe bekommt seine Quelle */

    if (!alt || richtung === 'keine') {
      alleRahmen(function (r) { if (r !== neu) { r.hidden = true; aufraeumen(r); } });
      fokusMitnehmen(neu);
      nachWechsel(schirm, geraet);
      return;
    }

    /* Die Rolle ÖFFNEN als BLATT (bewegung.css §2.1, kleine Fassung): der
       neue Schirm steigt 14 pt auf und blendet in 320 ms herein, der alte
       tritt dahinter auf 0,55 zurück. Sie gilt, wo etwas geöffnet wird, das
       keinen Ursprung auf dem Schirm hat — ein Knopf ist kein Gegenstand,
       der wachsen könnte. Wo einer da ist, läuft stattdessen der Hero (§5c). */
    var dauer = WECHSEL_MS;
    var zurueck = richtung === 'zurueck';
    if (richtung === 'oeffnen') {
      neu.style.zIndex = '3';
      alt.style.zIndex = '1';
      alt.classList.add('bw-huelle-zurueck');
      neu.classList.add('bw-oeffnen-blatt');
      dauer = OEFFNEN_MS;
    } else if (richtung !== 'seitlich') {
      if (zurueck) { alt.setAttribute('data-pv-richtung', 'zurueck'); neu.setAttribute('data-pv-richtung', 'zurueck'); }
      alt.classList.add('bw-wechseln-raus');
      neu.classList.add('bw-wechseln-rein');
    }

    var beendet = false;
    function fertig() {
      if (beendet) return;
      beendet = true;
      laeuft = null;
      aufraeumen(alt);
      aufraeumen(neu);
      alleRahmen(function (r) { if (r !== neu) r.hidden = true; });
    }
    laeuft = { fertig: fertig, uhr: setTimeout(fertig, tempo(dauer) + 60) };
    fokusMitnehmen(neu);
    nachWechsel(schirm, geraet);
  }

  /* Dauern mit dem Verlangsamer aus bewegung.js. Ohne ihn räumte die Uhr hier
     nach 300 ms auf, während die Bewegung bei Tempo 4 noch 900 ms läuft. */
  function tempo(ms) {
    return global.MOTION && global.MOTION.ms ? global.MOTION.ms(ms) : ms;
  }

  /* Wer mit der Tastatur navigiert hat, stünde nach dem Wechsel im Nichts:
     der Knopf, auf dem der Fokus lag, ist mit seinem Schirm verschwunden, und
     der Fokus fiele auf <body> zurück — die nächste Tabulatortaste finge
     wieder ganz vorn an. Deshalb übernimmt der neue Schirm den Fokus, aber
     nur, wenn er vorher überhaupt im Glas war (beim Laden der Seite nicht:
     dort gehört er dorthin, wo der Browser ihn hinstellt). */
  function fokusMitnehmen(rahmen) {
    var a = DOK.activeElement;
    if (!a || a === DOK.body || !GLAS.contains(a)) return;
    if (!rahmen.hasAttribute('tabindex')) rahmen.setAttribute('tabindex', '-1');
    try { rahmen.focus({ preventScroll: true }); } catch (e) { rahmen.focus(); }
  }

  function nachWechsel(schirm, geraet) {
    GLAS.setAttribute('data-pv-bereit', '1');
    var n = index(schirm.schluessel) + 1;
    if (FUSS) {
      FUSS.innerHTML = (geraet === 'ipad' ? 'iPad' : 'iPhone') + ' · <b>' +
        schirm.name + '</b> · Schirm ' + n + ' von ' + SCHIRME.length;
    }
    DOK.title = 'Velum — ' + schirm.name;
    rueckwegPruefen();
    /* Der Wege-Modus zählt und zeichnet für den Schirm, der jetzt steht (§11b).
       Zweimal: einmal sofort, damit die Zahl nicht hinterherhinkt, und einmal,
       wenn die Bewegung durch ist und alles an seinem Platz liegt. */
    markenAuffrischen();
    global.setTimeout(markenAuffrischen, tempo(WECHSEL_MS) + 40);

    /* Der verlassene Schirm wird wieder der, der er war (§5e) — aber erst,
       wenn er hinter dem neuen verschwunden ist. Ein Zurücksetzen im Bild
       wäre ein Sprung. */
    offeneHerkunft = null;
    global.clearTimeout(aufraeumUhr);
    aufraeumUhr = global.setTimeout(function () {
      schirmeAufraeumen(sichtbarerRahmen());
    }, tempo(WECHSEL_MS) + 120);
  }
  var aufraeumUhr = null;

  /* ── Der öffentliche Weg: hierüber navigiert alles ──────────────────────
     Erst der Zustand, dann das Bild. zeigen() meldet am Ende, wie tief man
     steht — stünde die Geschichte da noch auf dem alten Wert, wäre der
     Zurück-Knopf des neuen Schirms für einen Wimpernschlag tot. */
  function gehen(zielSchluessel, richtung, ersetzen, quelle) {
    var k = loesen(zielSchluessel);
    if (!k) return false;
    if (k === jetzt.schirm) return false;
    if (gesperrt) return false;
    var geraet = jetzt.geraet;

    /* Vorwärts über einen Gegenstand: der Gegenstand wächst zum Schirm (§5c).
       Das ist der Hero — und es ist zugleich das Aufklappen, das die DNA für
       das Aufgaben-Detail verlangt: „Das Detail ist kein Ort, sondern ein
       Zustand der Zeile." Eine Zeile, die zum Detail wächst, hat den Ort nie
       verlassen; eine Zeile, die nach links hinausschiebt, schon. */
    if (!ersetzen && (richtung || 'vor') === 'vor' && quelle && istGegenstand(quelle)) {
      if (heroVor(k, quelle)) return true;
    }

    var tiefe = ersetzen ? jetzt.tiefe : jetzt.tiefe + 1;
    if (!ersetzen) stapel[tiefe] = null;    /* kein Hero — der Rückweg ist der Wechsel */
    zustandSetzen(k, geraet, tiefe, !!ersetzen);
    /* Ein Weg vorwärts, der von keinem Gegenstand ausgeht, ÖFFNET trotzdem —
       nur eben als Blatt. „Seitlich" bleibt seitlich: zwischen zwei Einträgen
       der Seitenleiste geht man hinüber, nicht hinein. */
    var r = richtung || 'vor';
    if (r === 'vor' && quelle && !ersetzen) r = 'oeffnen';
    zeigen(k, geraet, r);
    return true;
  }

  /* Zurück gibt es IMMER. Steht etwas in der Geschichte, geht es dorthin —
     das ist derselbe Weg, den die Rückwärtstaste des Browsers nimmt. Steht
     nichts darin (man hat den Schirm über seinen Anker aufgerufen), führt er
     auf den Einstieg. So wie eine App, die aus einer Mitteilung heraus
     geöffnet wurde: der Stapel wird von unten neu aufgebaut, statt dass der
     Pfeil ins Leere zeigt. Ein Zurück-Weg, der nirgends hinführt, wäre genau
     das tote Ziel, das diese Datei sonst überall verhindert. */
  function zurueck(rueckfall) {
    if (gesperrt) return false;
    if (jetzt.tiefe > 0) { history.back(); return true; }
    var k = loesen(rueckfall) || START;
    if (jetzt.schirm === k) return false;
    return gehen(k, 'zurueck', true);
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 4 · TOTE UND LEBENDE ZIELE — die eine zentrale Stelle
   *
   * prototyp.css §4 hat den ganzen Rahmen für Zeiger und Zustände
   * abgeschaltet. Hier wird einzeln wieder eingeschaltet, und zwar NUR hier.
   * Wer einen Weg hinzufügen will, trägt ihn in die Wegekarte ein — nicht in
   * dieses Verzeichnis und schon gar nicht ins Markup der Schirme.
   *
   * Zur Maus kommt die Tastatur: ein totes Bedienelement verliert seinen
   * Tabstopp. Sonst wanderte der Fokusring über vierzig Knöpfe, von denen
   * keiner etwas tut — das ist dieselbe Lüge wie ein Klickfinger.
   * ==================================================================== */

  var FOKUSSIERBAR = 'a[href],button,input,select,textarea,summary,[tabindex]';

  /* Alles zurück auf tot. Was ein früherer Aufbau am Markup verändert hat,
     wird zuerst zurückgenommen — sonst bliebe nach einer neuen Wegekarte ein
     role="button" an einem Element stehen, das längst nichts mehr tut. */
  function totstellen(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('[data-pv-gesetzt]'), function (el) {
      (el.getAttribute('data-pv-gesetzt') || '').split(' ').forEach(function (name) {
        if (name) el.removeAttribute(name);
      });
      el.removeAttribute('data-pv-gesetzt');
    });
    Array.prototype.forEach.call(rahmen.querySelectorAll('.pv-lebt'), function (el) {
      el.classList.remove('pv-lebt');
      delete el.__pvWeg;
    });
    Array.prototype.forEach.call(rahmen.querySelectorAll(FOKUSSIERBAR), function (el) {
      el.setAttribute('tabindex', '-1');
    });
  }

  function merken(el, name, wert) {
    el.setAttribute(name, wert);
    var liste = (el.getAttribute('data-pv-gesetzt') || '').split(' ').filter(Boolean);
    if (liste.indexOf(name) < 0) liste.push(name);
    el.setAttribute('data-pv-gesetzt', liste.join(' '));
  }

  /* Ein Element bekommt einen Weg. weg = null heißt „lebendig, ohne Weg". */
  function beleben(el, weg) {
    if (!el) return;
    el.classList.add('pv-lebt');
    el.__pvWeg = weg || null;
    if (el.matches(FOKUSSIERBAR)) {
      el.removeAttribute('tabindex');
    } else {
      /* Ein <div>, auf das die Wegekarte zeigt, ist für die Tastatur und für
         Bildschirmleser bisher gar nichts. Damit der Weg für alle derselbe
         ist, bekommt es beides — und beides wird beim nächsten Aufbau wieder
         entfernt, wenn der Weg nicht mehr da ist. */
      merken(el, 'tabindex', '0');
      if (!el.hasAttribute('role')) merken(el, 'role', 'button');
    }
    if (weg && weg.titel && !el.getAttribute('aria-label')) merken(el, 'aria-label', weg.titel);
  }

  /* Ein Klick im Glas. Ein einziger Zuhörer für 26 Rahmen.
     Gesucht wird vom Ereignisziel aus nach OBEN der erste lebende Vorfahr —
     also der INNERSTE Weg. Das Erledigen-Kästchen liegt in einer Zeile, die
     ins Aufgaben-Detail führt; ohne diese Regel erledigte man die Aufgabe und
     landete gleichzeitig im Detail. */
  GLAS.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.pv-lebt') : null;
    /* Anker mit href="#" stehen im Bestand (die Buchdeckel der Bibliothek).
       Unbehandelt schrieben sie „#" in die Adresse und löschten den Anker,
       an dem der Prototyp hängt. */
    var anker = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (anker) e.preventDefault();
    if (!el) return;
    var weg = el.__pvWeg;

    /* Elemente mit eigener Bewegung. bewegung.js horcht selbst am Dokument —
       hier wird nur eines vorweggenommen: die Herkunft. Sie muss von hier aus
       laufen, weil danach der Weg zum Ursprung kommt und weil ihr Faden beim
       Verlassen des Schirms wieder eingeholt gehört (§5d). */
    if (el.hasAttribute('data-bw') && !el.hasAttribute('data-bw-aus')) {
      schmutzig(el);
      if (el.getAttribute('data-bw') === 'herkunft') {
        e.preventDefault();
        e.stopPropagation();               /* sonst liefe bewegung.js sie ein zweites Mal */
        herkunftZeigen(el, weg);
        return;
      }
      if (!weg || weg.ziel === 'nichts') return;   /* erledigen · übergeben · drehen · bewerten */
    }

    if (!weg) return;                       /* lebendig, aber ohne Weg */
    e.preventDefault();
    if (weg.ziel === 'zurueck') { zurueck(weg.rueckfall); return; }
    if (weg.ziel === 'nichts') return;
    if (weg.ziel === 'canvas' && !NACH_SCHLUESSEL['canvas']) { canvasOeffnen(); return; }
    if (weg.ziel.indexOf('extern:') === 0) { location.href = weg.ziel.slice(7); return; }
    gehen(weg.ziel, weg.richtung || 'vor', false, el);
  });

  /* Der Rückfall, falls der Canvas-Schirm einmal nicht mit im Dokument steht
     (eine ältere Fassung von tools/prototyp-bauen.js). Dann öffnet das
     Mockup in einem neuen Tab, statt dass 22 Wege ins Leere zeigen. Im
     Regelfall läuft das Canvas im Rahmen und diese Funktion wird nie
     gerufen. */
  function canvasOeffnen() {
    var url = '../../index.html';
    var w = null;
    try { w = global.open(url, '_blank'); } catch (e) { w = null; }
    if (!w) { location.href = url; return; }
    sagen('Das Canvas ist ein eigenes Mockup — es läuft jetzt in einem neuen Tab.');
  }

  /* Ein Satz in der Fußzeile, der den Schirmnamen für einen Moment ablöst.
     Der nächste Wechsel schreibt ihn ohnehin neu. */
  function sagen(text) {
    if (FUSS) FUSS.textContent = text;
  }

  /* Leertaste und Enter auf einem belebten Element, das kein Knopf ist. */
  GLAS.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest ? e.target.closest('.pv-lebt') : null;
    if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') return;
    e.preventDefault();
    el.click();
  });

  /* ══════════════════════════════════════════════════════════════════════
   * 5 · DIE GRUNDNAVIGATION
   *
   * Sie steht hier und nicht in der Wegekarte, weil sie in ALLEN 17 Schirmen
   * dieselbe ist: dieselbe Seitenleiste, dieselbe Tab-Bar, wortgleich. Sie
   * über 17 × 2 Einträge in einer Datendatei zu wiederholen hieße, 34-mal
   * dasselbe zu pflegen.
   *
   * Zugeordnet wird über das WORT, nicht über die Stelle in der Liste:
   * notes-list.html hat keinen Eintrag „Lernkarten", leere-zustaende.html
   * kein „Analysis II". Eine Zuordnung über nth-child träfe dort daneben.
   * ==================================================================== */

  /* Jedes Wort der Leiste auf den Schirm, den es meint. „Biologie" und
     „Analysis II" sind zwei Ordner desselben Bauplans und führen deshalb auf
     denselben Schirm — wie fünf Notizzeilen auf denselben Editor (§10).

     Steht ein Schirm noch nicht im Dokument, bleibt sein Eintrag hier stehen
     und wird beim Aufbau übersprungen (siehe leitetAuf): ein Ziel, das es
     nicht gibt, darf keinen Klickfinger bekommen. Seit dieser Runde gibt es
     alle zwölf: eingang.html, semester.html und suche.html liegen in
     mockups/app-next/, und damit lösen die vier Einträge ein, die bis eben
     nur angeboten waren — Eingang, Canvas, Biologie und Analysis II. */
  var SEITENLEISTE = {
    'heute':         'heute',
    'bibliothek':    'bibliothek',
    'eingang':       'eingang',
    'notizen':       'notizen',
    'journal':       'journal',
    'aufgaben':      'aufgaben',
    'lernkarten':    'lernkarten',
    'biologie':      'semester',
    'analysis ii':   'semester',
    'graph':         'graph',
    'einstellungen': 'einstellungen',
    'canvas':        'canvas',
  };

  /* Ein Ziel gilt nur, wenn der Schirm dazu wirklich im Dokument steht. */
  function leitetAuf(schluessel) {
    return schluessel && NACH_SCHLUESSEL[schluessel] ? schluessel : null;
  }

  var TABBAR = {
    'heute':      'heute',
    'bibliothek': 'bibliothek',
    'aufgaben':   'aufgaben',
    'lernen':     'lernkarten',
    'mehr':       'einstellungen',
  };

  function wortVon(knopf) {
    var t = knopf.querySelector('.t-body, .t-label');
    return (t ? t.textContent : knopf.textContent || '').trim().toLowerCase();
  }

  /* Seitlich oder vorwärts? Zwischen zwei Einstiegen der Seitenleiste geht
     man nicht „hinein", sondern hinüber — die Richtung sagt, ob der neue
     Schirm in der Liste vor oder hinter dem alten steht. */
  function seitlicheRichtung(vonSchluessel, nachSchluessel) {
    var a = index(vonSchluessel), b = index(nachSchluessel);
    return b < a ? 'zurueck' : 'vor';
  }

  function grundnavigation(rahmen, geraet) {
    var schirmSchluessel = rahmen.getAttribute('data-pv-screen');

    /* ── Seitenleiste (iPad) ── */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.sidebar .navitem'), function (knopf) {
      var ziel = leitetAuf(SEITENLEISTE[wortVon(knopf)]);
      if (!ziel) return;                    /* Schirm noch nicht gebaut: bleibt tot */
      if (ziel === schirmSchluessel) { beleben(knopf, { ziel: 'nichts' }); return; }
      beleben(knopf, { ziel: ziel, richtung: seitlicheRichtung(schirmSchluessel, ziel) });
    });

    /* ── Die Lupe ────────────────────────────────────────────────────────
       Sie steht in fast jeder Leiste — mal als Knopf, mal als Attrappe aus
       <span>, mal gar nicht. Sie meint überall dasselbe, also führt sie
       überall auf denselben Schirm. Das war der Weg, der bis zu dieser Runde
       am häufigsten ins Leere zeigte; seit suche.html da ist, löst er ein.

       ZWEI GESTALTEN, EIN ZIEL. Auf dem iPad sitzt die Lupe als .iconbtn in
       der Leiste. Auf dem iPhone tragen Bibliothek und Notizenliste KEINE
       Lupe in der Leiste — sie tragen das Suchfeld über der Liste, und darin
       steht „Suchen" bzw. „In 42 Notizen suchen". Ein Feld, das dieses Wort
       trägt und nicht führt, ist genau der Fall, den diese Runde abräumt: auf
       diesen beiden Schirmen wäre es sonst der einzige Weg zur Suche, und er
       wäre keiner. Also führt auch das Feld.

       DIE EINE AUSNAHME sind die Einstellungen: „In Einstellungen suchen"
       meint einen anderen Index als den der Inhalte — dort stünde nach dem
       Tap „12 Fundstellen zu Osmose", und das wäre gelogen. Das Feld bleibt
       dort tot und sieht auch so aus; die Lupe in derselben Leiste führt.

       Auf dem Suche-Schirm selbst führt nichts davon: das Feld ist dort die
       laufende Eingabe, nicht der Weg dorthin. Das erledigt schon die Zeile
       „suche !== schirmSchluessel". */
    var suche = leitetAuf('suche');
    if (suche && suche !== schirmSchluessel) {
      Array.prototype.forEach.call(rahmen.querySelectorAll('.ico[data-ico="search"]'), function (ico) {
        var traeger = ico.parentElement;
        if (!traeger) return;
        var imFeld = traeger.classList.contains('field');
        if (!imFeld && !traeger.classList.contains('iconbtn')) return;
        if (imFeld && schirmSchluessel === 'einstellungen') return;
        beleben(traeger, {
          ziel: suche,
          richtung: seitlicheRichtung(schirmSchluessel, suche),
          titel: 'Suchen',
        });
      });
    }

    /* ── Die Symbolschiene (Notiz-Editor, iPad) ──────────────────────────
       Elf Schirme tragen die 295-pt-Seitenleiste; der Notiz-Editor trägt
       stattdessen eine 68-pt-Schiene aus Symbolen. Sie meint dieselben Orte
       und sagt das selbst — jeder Knopf trägt sein Wort im title. Ohne sie
       führte aus dem Editor nur der Weg zurück, und das ist genau der Schirm,
       auf dem der erste Tap am häufigsten landet.
       Der Knopf „Seitenleiste einblenden" steht in keinem Verzeichnis: die
       ausgeklappte Fassung ist ein zweites Bild derselben Datei und wird nicht
       ausgezogen. Er bleibt darum tot — und sieht auch so aus. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.sidebar .iconbtn[title]'), function (knopf) {
      var ziel = leitetAuf(SEITENLEISTE[(knopf.getAttribute('title') || '').trim().toLowerCase()]);
      if (!ziel) return;
      if (ziel === schirmSchluessel) { beleben(knopf, { ziel: 'nichts' }); return; }
      beleben(knopf, {
        ziel: ziel,
        richtung: seitlicheRichtung(schirmSchluessel, ziel),
        titel: knopf.getAttribute('title'),
      });
    });

    /* ── Tab-Bar (iPhone) ── */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.tabbar .tab'), function (knopf) {
      var ziel = TABBAR[wortVon(knopf)];
      if (!ziel) return;
      if (ziel === schirmSchluessel) { beleben(knopf, { ziel: 'nichts' }); return; }
      beleben(knopf, { ziel: ziel, richtung: seitlicheRichtung(schirmSchluessel, ziel) });
    });

    /* ── Der Zurück-Weg im Kopf ──────────────────────────────────────────
       Die Regel des Bestands: der ERSTE Knopf einer .navbar mit dem Zeichen
       „chevL" oder „close" ist der Zurück-Weg. Das zweite chevL in
       journal-entry.html (voriger Eintrag) ist nicht der erste Knopf und
       bleibt deshalb tot — was es auch ist, denn es führt nirgendwohin.
       Dazu jeder Knopf, der es selbst sagt: aria-label „Zurück …". */
    var rueck = [];
    Array.prototype.forEach.call(rahmen.querySelectorAll('.navbar'), function (leiste) {
      var erster = leiste.firstElementChild;
      if (!erster || erster.tagName !== 'BUTTON') return;
      var ico = erster.querySelector('.ico[data-ico]');
      var zeichen = ico ? ico.getAttribute('data-ico') : '';
      if (zeichen === 'chevL' || zeichen === 'close') rueck.push(erster);
    });
    Array.prototype.forEach.call(rahmen.querySelectorAll('[aria-label^="Zurück"]'), function (k) {
      if (rueck.indexOf(k) < 0) rueck.push(k);
    });
    /* Der Canvas-Schirm hat keine Navigationsleiste — er hat das fremde
       Mockup. Sein Weg hinaus ist die Kapsel darauf (§11a). Sie kommt in
       dieselbe Liste wie jeder andere Zurück-Weg, damit sie dieselbe Regel
       bekommt: sie lebt, solange es etwas gibt, wohin sie führt.
       Der Rückfall ohne Vorgeschichte ist die Bibliothek — dort steht das
       Regal, in dem die Canvas-Notizbücher liegen. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('[data-pv-canvas-zurueck]'), function (k) {
      beleben(k, { ziel: 'bibliothek', art: 'zurueck', richtung: 'zurueck', titel: 'Zurück zu Velum' });
      if (rueck.indexOf(k) < 0) rueck.push(k);
    });
    rahmen.__pvRueck = rueck;

    /* ── Die fünf Signature-Momente ──────────────────────────────────────
       data-bw löst eine Bewegung aus, ohne den Schirm zu verlassen. Das ist
       kein Weg, aber es ist auch kein totes Ziel: es tut etwas Sichtbares.
       bewegung.js hört selbst auf den Klick — hier wird nur die Hand
       eingeschaltet. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('[data-bw]:not([data-bw-aus])'), function (k) {
      beleben(k, null);
    });
  }

  /* Der Zurück-Knopf lebt, solange es etwas gibt, wohin er führt — und das
     ist überall außer auf dem Einstieg selbst, den man ohne Vorgeschichte
     aufgerufen hat. Dort wäre er der Knopf, der aussieht, als täte er etwas,
     und nichts tut. */
  function rueckwegPruefen() {
    var moeglich = jetzt.tiefe > 0 || jetzt.schirm !== START;
    alleRahmen(function (rahmen) {
      var liste = rahmen.__pvRueck;
      if (!liste) return;
      liste.forEach(function (k) {
        /* Wohin der Zurück-Weg OHNE Vorgeschichte führt, sagt die Wegekarte:
           die Leiste im Notiz-Editor zeigt auf „Notizen", die der Sitzung auf
           die Lernkarten. Mit Vorgeschichte gilt die Vorgeschichte — man will
           dorthin zurück, wo man herkam, nicht dorthin, wo die Beschriftung
           hinzeigt. Wer eine Notiz aus der Bibliothek geöffnet hat, will in
           die Bibliothek zurück. */
        var alt = k.__pvWeg;
        var rueckfall = alt && alt.art === 'zurueck' && alt.ziel !== 'zurueck' ? alt.ziel : (k.__pvRueckfall || null);
        k.__pvRueckfall = rueckfall;
        if (moeglich) beleben(k, { ziel: 'zurueck', richtung: 'zurueck', rueckfall: rueckfall });
        else {
          k.classList.remove('pv-lebt');
          delete k.__pvWeg;
          if (k.matches(FOKUSSIERBAR)) k.setAttribute('tabindex', '-1');
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5b · DIE WEGEKARTE
   * ==================================================================== */

  var KARTE = null;

  function wegeAnlegen(karte) {
    KARTE = karte || null;
    aufbauen();
  }

  /* Die Kurzschreibung der Karte (§10) und die ausgeschriebene sind dasselbe.
     s/g/wo/ziel/art/t liest sich in 145 Zeilen besser; schirm/geraet/richtung/
     titel liest sich in einer fremden Datei besser. Beides wird angenommen. */
  function karteAnwenden(rahmen, geraet) {
    if (!KARTE || !KARTE.wege) return;
    var schirm = rahmen.getAttribute('data-pv-screen');
    KARTE.wege.forEach(function (eintrag) {
      if (!eintrag) return;
      var wo = eintrag.wo;
      var ziel = eintrag.ziel;
      if (!wo || !ziel) return;
      if (loesen(eintrag.s || eintrag.schirm) !== schirm) return;
      var g = eintrag.g || eintrag.geraet || 'beide';
      if (g !== 'beide' && g !== geraet) return;
      if (ziel !== 'zurueck' && ziel !== 'nichts' && ziel !== 'canvas' &&
          ziel.indexOf('extern:') !== 0) {
        var k = loesen(ziel);
        if (!k) { melden('Wegekarte: unbekanntes Ziel "' + ziel + '" (' + schirm + ' · ' + wo + ')'); return; }
        ziel = k;
      }
      var treffer;
      try { treffer = rahmen.querySelectorAll(wo); }
      catch (e) { melden('Wegekarte: "' + wo + '" ist kein gültiger Wähler (' + schirm + ')'); return; }
      if (!treffer.length) {
        melden('Wegekarte: "' + wo + '" trifft nichts in ' + schirm + ' · ' + geraet);
        return;
      }
      var art = eintrag.art || 'oeffnen';
      var richtung = eintrag.richtung || (art === 'zurueck' ? 'zurueck' : 'vor');
      Array.prototype.forEach.call(treffer, function (el) {
        beleben(el, { ziel: ziel, richtung: richtung, art: art, titel: eintrag.t || eintrag.titel });
      });
    });
  }

  /* ── Die drei Erscheinungsbild-Kacheln in den Einstellungen ───────────────
     Der einzige Ort im Prototyp, an dem ein Bedienelement wirklich etwas tut —
     und er kostet nichts, weil die Seite hell und dunkel ohnehin kann. Alles
     andere in den Einstellungen ändert Daten, die es hier nicht gibt, und
     bleibt darum tot.
     Gefunden wird über das WORT, nicht über die Stelle: die Kachel heißt auf
     dem iPad „Automatisch" und auf dem iPhone „Auto", und die Abschnitte
     stehen auf den beiden Geräten in verschiedener Reihenfolge.
     Der gewählte Zustand steht im Bestand als getönte Fläche + 2-pt-Ring +
     Häkchen + halbfette Beschriftung — vier Merkmale, keines davon Farbe
     allein. Genau die werden hier umgehängt, keine neuen erfunden. */
  var ERSCHEINUNG = { 'hell': 'light', 'dunkel': 'dark', 'automatisch': 'auto', 'auto': 'auto' };
  var ERSCHEINUNGEN = ['light', 'dark', 'auto'];
  var wahl = 'auto';          /* der Zustand, den das Schaubild zeigt */

  function schalter(rahmen) {
    if (rahmen.getAttribute('data-pv-screen') !== 'einstellungen') return;
    var gefunden = {};
    Array.prototype.forEach.call(rahmen.querySelectorAll('button'), function (k) {
      var m = ERSCHEINUNG[(k.textContent || '').trim().toLowerCase()];
      if (m && !gefunden[m]) gefunden[m] = k;
    });
    var kacheln = ERSCHEINUNGEN.map(function (m) { return gefunden[m]; });
    if (kacheln.some(function (k) { return !k; })) return;
    if (kacheln[0].parentElement !== kacheln[1].parentElement ||
        kacheln[1].parentElement !== kacheln[2].parentElement) return;

    /* Das Häkchen steht im Bestand nur an der gewählten Kachel. Damit es
       wandern kann, bekommen alle drei dieselbe Beschriftungszeile — Form
       und Maße vom Original abgeschrieben, nichts dazuerfunden. */
    var muster = null;
    kacheln.forEach(function (b) { muster = muster || b.querySelector('.ico[data-ico="check"]'); });
    if (muster) {
      // Den Stil der Musterzeile NICHT uebernehmen: die gewaehlte Kachel und die
      // nicht gewaehlten haben auf dem iPhone verschiedene Bauform, und der
      // fremde Stil nahm den beiden anderen Vorschau und Karte. Der Haken wird
      // angehaengt, die Zeile bleibt, wie ihr Schirm sie gebaut hat.
      var zeileStil = null;
      kacheln.forEach(function (b) {
        var haken = b.querySelector('.ico[data-ico="check"]');
        if (!haken) {
          var kopf = b.querySelector('.t-sub');
          if (!kopf) return;
          var zeile = kopf.parentElement;
          if (zeileStil) zeile.setAttribute('style', zeileStil);
          var luecke = DOK.createElement('div');
          luecke.style.flex = '1';
          haken = muster.cloneNode(true);
          zeile.appendChild(luecke);
          zeile.appendChild(haken);
        }
        b.__pvHaken = haken;
      });
    }

    kacheln.forEach(function (b, i) {
      b.__pvSchalter = ERSCHEINUNGEN[i];
      beleben(b, { ziel: 'nichts', titel: 'Erscheinungsbild ' + (b.textContent || '').trim() });
    });

    /* Neben der Überschrift steht die FOLGE der Wahl — „Folgt dem System —
       wechselt heute um 16:38 auf Dunkel". Das ist der Satz, der diesen Schirm
       von Bears Themenreihe unterscheidet: er verschweigt nicht, was die Wahl
       bewirkt. Wenn die Wahl sich ändert, muss er mitgehen, sonst behauptet er
       das Gegenteil dessen, was daneben angekreuzt ist. */
    var kopf = kacheln[0].parentElement.previousElementSibling;
    var folge = kopf && kopf.querySelector('.t-sub');
    if (folge) {
      if (folge.__pvOriginal == null) folge.__pvOriginal = folge.textContent;
      rahmen.__pvFolge = folge;
    }

    rahmen.__pvKacheln = kacheln;
    kachelnZeichnen(rahmen);
  }

  function kachelnZeichnen(rahmen) {
    var kacheln = rahmen.__pvKacheln;
    if (!kacheln) return;
    kacheln.forEach(function (b) {
      var an = b.__pvSchalter === wahl;
      b.style.background = an ? 'var(--accent-soft)' : '';
      b.style.boxShadow = an ? 'inset 0 0 0 2px var(--accent-ring)' : '';
      var kopf = b.querySelector('.t-sub');
      if (kopf) kopf.classList.toggle('is-strong', an);
      if (b.__pvHaken) b.__pvHaken.style.display = an ? '' : 'none';
      merken(b, 'aria-pressed', String(an));
    });
    var folge = rahmen.__pvFolge;
    if (folge) {
      folge.textContent = wahl === 'auto' ? folge.__pvOriginal
        : (wahl === 'dark' ? 'Dunkel, unabhängig vom System'
                           : 'Hell, unabhängig vom System');
    }
  }

  GLAS.addEventListener('click', function (e) {
    var k = e.target.closest ? e.target.closest('.pv-lebt') : null;
    if (!k || !k.__pvSchalter) return;
    erscheinungSetzen(k.__pvSchalter);
  });

  function erscheinungSetzen(modus) {
    wahl = modus;
    var dunkel = modus === 'dark' || (modus === 'auto' && global.matchMedia &&
                 global.matchMedia('(prefers-color-scheme: dark)').matches);
    DOK.documentElement.setAttribute('data-theme', dunkel ? 'dark' : 'light');
    bedienleisteNachziehen();
    alleRahmen(kachelnZeichnen);
  }

  /* Die Bedienleiste von mock.js sitzt außerhalb des Rahmens und zeigt
     dasselbe an — sie darf jetzt nicht das Gegenteil behaupten. Sie hört nur
     auf ihre eigenen Klicks, also wird ihr Zustand hier nachgezogen. */
  function bedienleisteNachziehen() {
    var t = DOK.documentElement.getAttribute('data-theme') || 'light';
    Array.prototype.forEach.call(DOK.querySelectorAll('.controls button[data-set="theme"]'), function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-val') === t);
    });
  }

  /* Und umgekehrt: wer oben rechts umschaltet, hat damit auch in den
     Einstellungen gewählt. Sonst stünde dort „Automatisch", während der
     Prototyp sichtbar auf Dunkel steht. */
  if (global.MutationObserver) {
    new global.MutationObserver(function () {
      var t = DOK.documentElement.getAttribute('data-theme') || 'light';
      bedienleisteNachziehen();
      if (wahl === t) return;
      if (wahl === 'auto' && global.matchMedia &&
          global.matchMedia('(prefers-color-scheme: dark)').matches === (t === 'dark')) return;
      wahl = t;
      alleRahmen(kachelnZeichnen);
    }).observe(DOK.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* Beim allerersten Aufbau wird nicht gemeldet: die seiteneigenen Skripte der
     Schirme laufen NACH dieser Datei (notes-list spannt drei Verweis-Fäden und
     legt dafür eine Zeichenfläche als erstes Kind der Rollfläche an — damit
     verschiebt sich jedes nth-child darin um eins). Der Aufbau läuft deshalb
     ein zweites Mal, sobald alles steht; erst dann ist eine Fehlmeldung eine.  */
  var stumm = true;
  var gemeldet = {};
  function melden(text) {
    if (stumm || gemeldet[text]) return;
    gemeldet[text] = 1;
    if (global.console && console.warn) console.warn('[prototyp] ' + text);
  }

  /* Ein Rahmen, von Grund auf: erst alles tot, dann einzeln beleben. */
  function frischAufbauen(rahmen) {
    var geraet = rahmen.getAttribute('data-pv-geraet');
    totstellen(rahmen);
    grundnavigation(rahmen, geraet);
    karteAnwenden(rahmen, geraet);
    schalter(rahmen);
  }

  /* Der ganze Aufbau in einem Zug — beim Start und bei jeder neuen Karte. */

  /* ── Kästchen ohne Zeile ────────────────────────────────────────────────
   *
   * Die Erledigen-Bewegung braucht eine Zeile, die sich verabschieden kann
   * (data-bw-zeile). Steht ein Kästchen in einem Kasten, der keine ist — im
   * Notiz-Editor etwa in einem MERKEN-Block —, findet closest() nichts, und
   * der Tap tut gar nichts. Ein Klickfinger, der nichts bewirkt und nichts
   * sagt, ist genau das, was dieser Prototyp nicht haben darf.
   *
   * Inhaltlich wäre die Bewegung dort ohnehin falsch: Ein Häkchen in einer
   * Notiz hakt ab, es räumt die Zeile nicht weg. Solche Kästchen werden hier
   * deshalb zum reinen Umschalter — der Haken zeichnet sich, das Verschwinden
   * entfällt.
   * ───────────────────────────────────────────────────────────────────────── */
  function kaestchenOhneZeile(wurzel) {
    wurzel.querySelectorAll('[data-bw="erledigen"]').forEach(function (knopf) {
      var wahl = knopf.getAttribute('data-bw-zeile') || '';
      var ziel = null;
      try {
        ziel = wahl.charAt(0) === '^' ? knopf.closest(wahl.slice(1)) : wurzel.querySelector(wahl);
      } catch (e) { ziel = null; }
      if (ziel) return;
      knopf.removeAttribute('data-bw');
      knopf.removeAttribute('data-bw-zeile');
      knopf.setAttribute('data-pv-haken', '');
      knopf.setAttribute('aria-pressed', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var k = e.target && e.target.closest && e.target.closest('[data-pv-haken]');
    if (!k) return;
    var an = k.getAttribute('aria-pressed') !== 'true';
    k.setAttribute('aria-pressed', String(an));
    var haken = k.querySelector('.bw-check');
    if (haken) haken.classList.toggle('is-an', an);
  });

  function aufbauen() {
    alleRahmen(frischAufbauen);
    alleRahmen(kaestchenOhneZeile);
    rueckwegPruefen();
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5c · DIE ÜBERGÄNGE — die Rolle ÖFFNEN, vorwärts und rückwärts
   *
   * 320 ms, springStandard. Ein Zwilling der angetippten Karte legt sich über
   * die Seite und wechselt in einem Zug Ort, Breite, Höhe und Eckradius bis
   * zum Rechteck des Schirms; was ringsum liegt, geht auf 0,55. Gebaut ist
   * das in bewegung.js (MOTION.oeffnen) — hier steht nur, WORAUS gewachsen
   * wird und was danach mit dem Schirm geschieht.
   *
   * Zwei Regeln:
   *
   *   Ein GEGENSTAND wächst.       Notizbuch · Zeile · Karte · Graph-Knoten ·
   *                                Kettenstation. Sie sind die „Punkte" des
   *                                Leitmotivs: Dinge, die man in die Hand
   *                                nimmt. Sie tragen den Hero.
   *   Eine AKTION öffnet ein Blatt. „Eintrag beginnen", „Lernen", ein
   *                                Herkunfts-Chip. Ein Knopf ist kein
   *                                Gegenstand; er hat keine Gestalt, die
   *                                wachsen könnte. Für ihn steht die kleine
   *                                Fassung derselben Rolle bereit
   *                                (.bw-oeffnen-blatt, §3 dieser Datei).
   *
   * Gewachsen wird aus dem DECKEL, nicht aus der ganzen Karte: bei einem
   * Notizbuch ist .book__cover der Gegenstand, die Zeile darunter (Modul,
   * Seitenzahl, Datum) ist Beschriftung und bleibt beim Regal.
   *
   * Und der Rückweg ist derselbe Weg rückwärts: der Schirm schrumpft in die
   * Karte zurück, aus der er kam, während das Regal ringsum von 0,55 auf 1
   * zurückkommt. Dieselbe Dauer, dieselbe Kurve, dieselben Rechtecke — nur
   * die Richtung ist umgedreht. Unter Reduce gibt es keinen Zwilling; dort
   * gilt der gebaute Reduce-Pfad der Rolle WECHSELN (120 ms Kreuzblende),
   * und die Richtung sagt die Navigationsleiste.
   * ==================================================================== */

  /* .ei-schnipsel ist der Schnipsel im Eingang. Er trägt keinen der Namen des
     Bestands, ist aber genau das, was diese Liste meint: ein Ding mit
     Kartenschatten, das man in die Hand nimmt. Ohne ihn öffnete der einzige
     Schnipsel mit einer echten Beziehung als Blatt — und der Faden „wird zu"
     endete an einem Schirm, der aus dem Nichts kommt statt aus ihm. */
  var OBJEKT = '.book, .row, .card, .gn, .chain__link, .ei-schnipsel';
  var stapel = [];          /* je Tiefe: woraus dieser Schirm gewachsen ist */
  var gesperrt = false;

  function istGegenstand(el) {
    return !!(el && el.matches && el.matches(OBJEKT));
  }

  /* Der Deckel ist der Gegenstand, nicht die Karte samt Beschriftung. */
  function wachstumsKern(el) {
    return el.querySelector('.book__cover') || el;
  }

  /* Was ringsum zurücktritt: die Rollfläche, in der die Karte liegt — das
     Regal, die Liste, das Raster. Findet sich keine, tritt der Schirm zurück. */
  function huelleVon(quelle, rahmen) {
    return quelle.closest('.scroll') || rahmen;
  }

  function sperren(an) {
    gesperrt = !!an;
    if (an) GLAS.setAttribute('data-pv-sperre', '1');
    else GLAS.removeAttribute('data-pv-sperre');
  }

  function stapelKuerzen(tiefe) {
    for (var i = tiefe + 1; i < stapel.length; i++) stapel[i] = null;
  }

  function sichtbarerRahmen() {
    var s = NACH_SCHLUESSEL[jetzt.schirm];
    return s ? s.rahmen[jetzt.geraet] : null;
  }

  /* Der Zwilling ist eine Kopie auf Zeit: er liegt über allem, nimmt keine
     Eingaben an und geht, wenn die Bewegung steht. Bleibt einer liegen — weil
     eine Bewegung unterbrochen wurde, weil der Browser unter Last zwischen
     zwei Bildern keines gezeichnet hat und die Animation nie anlief —, dann
     klebt eine Karte über der App, die niemand mehr wegbekommt. Kein Klick
     hilft, denn sie nimmt ja keine an. Also wird vor und nach jedem Wachsen
     gefegt: es darf immer nur den einen geben, der gerade läuft. */
  function zwillingeFegen() {
    Array.prototype.forEach.call(DOK.querySelectorAll('body > .bw-zwilling'), function (z) {
      z.remove();
    });
  }

  /* Auch unter Reduce läuft dieser Weg — MOTION.oeffnen bringt seinen eigenen
     Pfad mit: kein Zwilling, stattdessen 80 ms ein 2-pt-Ink-Ring auf der
     Ursprungskarte und danach 160 ms Kreuzblende. Die Herkunft wird also auch
     dann gesagt, nur ohne Weg. Hier wird nichts zweitgeschrieben. */
  function heroVor(k, quelle) {
    if (!global.MOTION || !global.MOTION.oeffnen) return false;
    var geraet = jetzt.geraet;
    var ziel = NACH_SCHLUESSEL[k];
    var neu = ziel && ziel.rahmen[geraet];
    var alt = sichtbarerRahmen();
    if (!neu || !alt || neu === alt) return false;

    if (laeuft) { clearTimeout(laeuft.uhr); laeuft.fertig(); }
    zwillingeFegen();
    /* Der Zwilling wächst auf das Rechteck des neuen Schirms und blendet ihn
       dabei ein. Ist das Canvas noch leer, wüchse die Karte auf eine weiße
       Fläche — also bekommt es seine Quelle, bevor die Bewegung anläuft. */
    canvasWecken(neu);
    var huelle = huelleVon(quelle, alt);
    var kern = wachstumsKern(quelle);
    var tiefe = jetzt.tiefe + 1;
    var vonSchirm = jetzt.schirm;

    sperren(true);
    neu.style.zIndex = '3';
    alt.style.zIndex = '1';

    /* Angekommen wird IN JEDEM FALL — auch wenn die Bewegung nie meldet, dass
       sie fertig ist. Das kommt vor: zeichnet der Browser unter Last zwischen
       zwei Bildern keines, bleibt eine Animation im Wartestand hängen und ihr
       Versprechen löst nie ein. Ohne die Wache stünde der Prototyp dann still,
       mit gesperrten Zielen und einem Zwilling über der Seite — und nichts
       wäre kaputt, es täte nur nichts mehr. Das ist der schlimmste Fehler,
       den es hier geben kann: einer, den man nicht sieht. */
    var angekommen = false;
    function ankommen() {
      if (angekommen) return;
      angekommen = true;
      global.clearTimeout(wache);
      try {
        huelle.classList.remove('bw-huelle-zurueck');
        stapelKuerzen(tiefe - 1);
        stapel[tiefe] = { schirm: vonSchirm, geraet: geraet, quelle: quelle, huelle: huelle };
        zustandSetzen(k, geraet, tiefe, false);
        zeigen(k, geraet, 'keine');
      } finally {
        zwillingeFegen();
        kern.style.visibility = '';
        alt.style.zIndex = '';
        neu.style.zIndex = '';
        sperren(false);
      }
    }
    var wache = global.setTimeout(ankommen, tempo(OEFFNEN_MS) + 400);
    global.MOTION.oeffnen({ von: kern, nach: neu, huelle: huelle }).then(ankommen, ankommen);
    return true;
  }

  /* Der Rückweg. Der Zwilling wird hier selbst gestellt, weil bewegung.js für
     das Öffnen nur die eine Richtung kennt — die Zahlen kommen trotzdem von
     dort (MOTION.ms, MOTION.kurven), damit es nicht zwei Wahrheiten gibt. */
  function heroZurueck(hero) {
    var alt = NACH_SCHLUESSEL[jetzt.schirm];   /* jetzt ist schon das ZIEL gesetzt */
    var neu = alt && alt.rahmen[jetzt.geraet]; /* der Schirm, auf den wir zurückgehen */
    var detail = null;
    alleRahmen(function (r) { if (r !== neu && !r.hidden) detail = detail || r; });
    if (!neu || !detail) { zeigen(jetzt.schirm, jetzt.geraet, 'zurueck'); return; }

    if (laeuft) { clearTimeout(laeuft.uhr); laeuft.fertig(); }
    sperren(true);
    aufraeumen(neu);
    /* Das Regal kommt zurück — es muss also zuerst wieder auf 0,55 stehen.
       Gesetzt wird die Klasse, SOLANGE der Rahmen noch display:none ist: dann
       gibt es keinen Übergang von 1 auf 0,55, den niemand sehen soll. */
    if (hero.huelle) hero.huelle.classList.add('bw-huelle-zurueck');
    neu.hidden = false;
    neu.style.zIndex = '1';
    detail.style.zIndex = '3';

    var kern = wachstumsKern(hero.quelle);
    var rA = detail.getBoundingClientRect();
    var rB = kern.getBoundingClientRect();
    /* Ist die Karte inzwischen aus dem Bild gerollt, gibt es nichts, wohin der
       Schirm schrumpfen könnte — dann lieber der gewöhnliche Rückwärtswechsel
       als eine Bewegung, die aus dem Rahmen läuft. */
    if (!rB.width || !rB.height ||
        rB.right < rA.left || rB.left > rA.right ||
        rB.bottom < rA.top || rB.top > rA.bottom) {
      if (hero.huelle) {
        hero.huelle.classList.remove('bw-huelle-zurueck');
        hero.huelle.removeAttribute('data-pv-huelle');
      }
      neu.style.zIndex = '';
      detail.style.zIndex = '';
      sperren(false);
      zeigen(jetzt.schirm, jetzt.geraet, 'zurueck');
      return;
    }
    var dauer = tempo(OEFFNEN_MS);
    var kurve = (global.MOTION && global.MOTION.kurven && global.MOTION.kurven.standard) ||
                'cubic-bezier(.216,.052,.330,1.110)';

    /* Jetzt steht das Regal gemessen auf 0,55. Das Merkmal trägt den Übergang
       (prototyp.css §3b) — in .bw-huelle-zurueck steht er in der Klasse selbst
       und verschwände mit ihr, das kann nur den Hinweg. */
    if (hero.huelle) {
      hero.huelle.setAttribute('data-pv-huelle', '');
      hero.huelle.classList.remove('bw-huelle-zurueck');
    }

    zwillingeFegen();
    var zwilling = kern.cloneNode(true);
    zwilling.className = (kern.className + ' bw-zwilling').replace(/\bbw-tap[^\s]*/g, '');
    zwilling.removeAttribute('id');
    zwilling.setAttribute('aria-hidden', 'true');
    zwilling.style.left = rA.left + 'px';
    zwilling.style.top = rA.top + 'px';
    zwilling.style.width = rA.width + 'px';
    zwilling.style.height = rA.height + 'px';
    DOK.body.appendChild(zwilling);
    kern.style.visibility = 'hidden';

    var lauf = zwilling.animate(
      [{ left: rA.left + 'px', top: rA.top + 'px', width: rA.width + 'px', height: rA.height + 'px',
         borderRadius: getComputedStyle(detail).borderRadius },
       { left: rB.left + 'px', top: rB.top + 'px', width: rB.width + 'px', height: rB.height + 'px',
         borderRadius: getComputedStyle(kern).borderRadius }],
      { duration: dauer, easing: kurve, fill: 'forwards' });

    /* Der Detailschirm geht unter dem Zwilling weg — spiegelbildlich zum
       Hereinblenden beim Öffnen (dort ab 55 % der Zeit, hier bis dahin). */
    detail.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: Math.round(dauer * 0.55), easing: 'linear', fill: 'forwards' });

    var vorbei = false;
    function fertig() {
      if (vorbei) return;
      vorbei = true;
      global.clearTimeout(wache);
      zwillingeFegen();
      kern.style.visibility = '';
      if (hero.huelle) hero.huelle.removeAttribute('data-pv-huelle');
      detail.style.zIndex = '';
      neu.style.zIndex = '';
      alleRahmen(function (r) { if (r !== neu) { r.hidden = true; aufraeumen(r); } });
      sperren(false);
    }
    /* Dieselbe Wache wie auf dem Hinweg (§5c oben): eine Bewegung, die nie
       meldet, dass sie fertig ist, darf den Weg zurück nicht verschlucken. */
    var wache = global.setTimeout(fertig, dauer + 400);
    lauf.finished.catch(function () {}).then(fertig);
    fokusMitnehmen(neu);
    nachWechsel(alt, jetzt.geraet);
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5d · HERKUNFT ZEIGEN — der Faden, dann die Quelle
   *
   * Tap auf den Herkunfts-Chip: erst zeichnet sich die Verbindung zum
   * Ursprung (420 ms), dann kommt, was am anderen Ende hängt.
   *
   * Zwei Fassungen, und der Unterschied steht im Markup, nicht in einer
   * Ausnahmeliste:
   *
   *   Der Chip nennt eine QUELLE auf demselben Schirm (data-bw-quelle) —
   *   dann ist die Frage dort beantwortet. Die Karte weicht, der Quellabsatz
   *   kommt herein, der Faden bleibt gespannt. Es wird nicht navigiert; der
   *   Weg weiter steht als Knopf im Quellfeld, der Rückweg heißt „Loslassen".
   *
   *   Der Chip nennt nur einen URSPRUNG (data-bw-ursprung) — dann zeigt der
   *   Faden auf ein Element dieses Schirms, und danach geht es dorthin, wo
   *   das Element hinführt. Faden zuerst, Schirm danach: die Antwort auf
   *   „woher kommt das?" ist der Weg, nicht der Sprung.
   *
   * Kein Ursprung im Bild, kein Faden: an den übrigen 15 Chips gibt es nichts
   * zu zeichnen — dort öffnet der Chip als Blatt. Kein Faden ohne echte,
   * zeichenbare Kante (DNA §2.2).
   * ==================================================================== */

  var offeneHerkunft = null;

  function herkunftZeigen(chip, weg) {
    var M = global.MOTION;
    if (!M || !M.herkunft) { if (weg && weg.ziel) gehen(weg.ziel, 'vor', false, chip); return; }
    var rahmen = chip.closest('.pv-screen');
    var hol = function (name) {
      var s = chip.getAttribute('data-bw-' + name);
      return s ? rahmen.querySelector(s) : null;
    };
    var ursprung = hol('ursprung');
    if (!ursprung) { if (weg && weg.ziel) gehen(weg.ziel, 'vor', false, chip); return; }

    herkunftEinholen();
    var kurve = chip.getAttribute('data-bw-kurve');
    offeneHerkunft = M.herkunft({
      chip: chip, ursprung: ursprung,
      karte: hol('karte'), quelle: hol('quelle'),
      box: hol('box') || rahmen,
      kurve: kurve == null ? 20 : +kurve,
    });

    /* Beantwortet der Chip die Frage an Ort und Stelle, bleibt man stehen. */
    if (chip.getAttribute('data-bw-quelle')) return;
    if (!weg || !weg.ziel || weg.ziel === 'nichts') return;

    /* Sonst: der Faden zuerst, der Schirm danach. Gegangen wird aus dem
       URSPRUNG heraus — der Faden endet dort, und dort wächst es weiter. */
    var ziel = weg.ziel;
    global.setTimeout(function () {
      if (jetzt.schirm !== rahmen.getAttribute('data-pv-screen')) return;
      gehen(ziel, 'vor', false, istGegenstand(ursprung) ? ursprung : chip);
    }, tempo(420) + 60);
  }

  function herkunftEinholen() {
    if (!offeneHerkunft) return;
    try { offeneHerkunft.zurueck(); } catch (e) { /* der Faden ist schon fort */ }
    offeneHerkunft = null;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5e · DER ZUSTAND DER SCHIRME
   *
   * „Ohne Funktion" heißt auch: keine Spuren. Eine erledigte Aufgabe fällt
   * aus der Liste, eine übergebene Auswahl zählt den Zähler hoch, eine
   * bewertete Karte ist durch. Das ist richtig — im Augenblick. Bliebe es
   * stehen, wäre der Prototyp nach zwei Minuten eine leergeräumte App, und
   * die wichtigste Bewegung der Anwendung ließe sich genau einmal je
   * Seitenaufruf vorführen.
   *
   * Deshalb merkt sich jeder Rahmen beim Start seinen Anfangszustand
   * (MOTION.merken) und stellt ihn wieder her, sobald man ihn verlässt —
   * unsichtbar, hinter dem Schirm, der gerade kommt. Wer zurückkommt, findet
   * denselben Schirm wie beim ersten Mal.
   *
   * Zurückgesetzt wird nur, was eine Bewegung wirklich angefasst hat. Der
   * Rest bleibt unberührt: das Zurückschreiben kostet einen Aufbau, und den
   * für 26 Rahmen bei jedem Wechsel zu zahlen wäre die Verzögerung, an der
   * man eine Webseite von einer App unterscheidet.
   * ==================================================================== */

  var schmutz = [];

  function schmutzig(el) {
    var rahmen = el.closest ? el.closest('.pv-screen') : null;
    if (rahmen && schmutz.indexOf(rahmen) < 0) schmutz.push(rahmen);
  }

  function schirmeAufraeumen(ausser) {
    if (!global.MOTION || !global.MOTION.zuruecksetzen) return;
    for (var i = schmutz.length - 1; i >= 0; i--) {
      var rahmen = schmutz[i];
      if (rahmen === ausser) continue;
      schmutz.splice(i, 1);
      global.MOTION.zuruecksetzen(rahmen);
      frischAufbauen(rahmen);
      /* Der Zurück-Knopf des Rahmens ist neu und weiß noch nichts von der
         Geschichte — ohne das bliebe er tot, obwohl es einen Weg gibt. */
      rueckwegPruefen();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 6 · TASTATUR UND GESTE
   * ==================================================================== */

  function blaettern(schritt) {
    if (gesperrt) return;
    var i = index(jetzt.schirm);
    if (i < 0) return;
    var j = i + schritt;
    if (j < 0 || j >= SCHIRME.length) return;
    gehen(SCHIRME[j].schluessel, schritt > 0 ? 'vor' : 'zurueck');
  }

  DOK.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
    var t = e.target;
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); blaettern(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); blaettern(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); zurueck(); }
    /* Der Wege-Modus auf eine Taste — er wird beim Prüfen zwanzigmal
       hintereinander an- und ausgeschaltet, und der Weg zum Kopf der Seite
       ist dabei der längste Teil. */
    else if (e.key === 'w' || e.key === 'W') { e.preventDefault(); wegeSchalten(!wegeAn); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { /* der Leiste überlassen */ }
  });

  /* ── Die Zurück-Geste ────────────────────────────────────────────────────
     Vom linken Rand nach rechts ziehen. Kein mitlaufender Rand: eine Geste,
     die nur zur Hälfte mitgeht, fühlt sich schlechter an als eine, die beim
     Loslassen sauber schaltet. 24 pt Randstreifen, 60 pt Weg — die Maße, die
     iOS benutzt. */
  (function () {
    var start = null;
    GLAS.addEventListener('pointerdown', function (e) {
      var r = GLAS.getBoundingClientRect();
      if (e.clientX - r.left > 24 * (r.width / GLAS.offsetWidth || 1)) { start = null; return; }
      start = { x: e.clientX, y: e.clientY };
    }, true);
    GLAS.addEventListener('pointerup', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      start = null;
      if (dx > 60 && Math.abs(dy) < 60) zurueck();
    }, true);
    GLAS.addEventListener('pointercancel', function () { start = null; }, true);
  })();

  /* ══════════════════════════════════════════════════════════════════════
   * 7 · DER MASSSTAB
   *
   * Die Bühne ist immer 1194 × 852 pt — das Maß, in das beide Geräte passen.
   * Dadurch ist der Maßstab vom Gerät unabhängig, und der Umschalter iPad ·
   * iPhone verwandelt nur das Glas, ohne die Seite springen zu lassen.
   * Die INNENMASSE bleiben unberührt: der iPad-Schirm ist und bleibt
   * 1194 × 834 pt, egal wie schmal das Fenster ist.
   * ==================================================================== */

  function massstab() {
    if (!BUEHNE) return;
    var b = BUEHNE.clientWidth;
    var h = BUEHNE.clientHeight;
    if (!b || !h) return;
    var s = Math.min(1, b / 1194, h / 852);
    BUEHNE.style.setProperty('--pv-scale', String(Math.max(0.2, s)));
    if (s >= 1) BUEHNE.setAttribute('data-pv-massstab', 'voll');
    else BUEHNE.removeAttribute('data-pv-massstab');
  }

  global.addEventListener('resize', massstab);

  /* ══════════════════════════════════════════════════════════════════════
   * 8 · DER GERÄTEWECHSEL
   *
   * „Beim Wechsel zwischen iPad und iPhone bleibt man auf demselben Schirm."
   * Der Wechsel ist keine Navigation — er legt keinen Eintrag in der
   * Geschichte an, er ersetzt den bestehenden. Sonst führte die
   * Rückwärtstaste in ein anderes Gerät statt auf den vorigen Schirm.
   * ==================================================================== */

  function geraetZeigen(geraet) {
    GLAS.setAttribute('data-pv-geraet', geraet);
    Array.prototype.forEach.call(DOK.querySelectorAll('[data-pv-geraet-wahl]'), function (k) {
      k.setAttribute('aria-checked', String(k.getAttribute('data-pv-geraet-wahl') === geraet));
    });
    markenAuffrischen();
  }

  function geraetWechseln(geraet) {
    if (GERAETE.indexOf(geraet) < 0 || geraet === jetzt.geraet) return;
    geraetZeigen(geraet);
    zustandSetzen(jetzt.schirm, geraet, jetzt.tiefe, true);
    zeigen(jetzt.schirm, geraet, 'keine');
  }

  Array.prototype.forEach.call(DOK.querySelectorAll('[data-pv-geraet-wahl]'), function (k) {
    k.addEventListener('click', function () { geraetWechseln(k.getAttribute('data-pv-geraet-wahl')); });
  });

  /* ══════════════════════════════════════════════════════════════════════
   * 11 · DAS PRÜFWERKZEUG
   *
   * Zwei Dinge, die nicht zum Entwurf gehören, sondern zu seiner Prüfung.
   * Beide sprechen die Sprache der Bedienleiste oben — Ink, Papier, Sans,
   * Kapsel —, damit man sie nie mit der App verwechselt.
   * ==================================================================== */

  /* ── 11a · Das Canvas bekommt seine Quelle ───────────────────────────────
     Der Canvas-Schirm ist ein <iframe> auf das eigenständige Mockup
     (tools/prototyp-bauen.js §1b). Seine Adresse steht in data-pv-canvas und
     wird erst eingehängt, wenn der Schirm zum ersten Mal gezeigt wird.

     Warum nicht gleich beim Laden: es sind zwei Rahmen, iPad und iPhone, und
     jeder brächte eine vollständige Zeichen-Engine mit — zwei Anwendungen,
     die niemand angesehen hat, laufen im Hintergrund und rechnen. Warum
     überhaupt vorher: weil die Karte, die zum Schirm wächst, sonst auf eine
     weiße Fläche wüchse. Also: beim ersten Zeigen, und beim Hero eine
     Bewegungslänge früher (§5c).

     Einmal geladen, bleibt es geladen. Was jemand hineingezeichnet hat, steht
     beim Zurückkommen noch da — anders als bei den dreizehn Schaubildern
     (§5e), und mit Absicht: eine Zeichnung ist Arbeit, keine Vorführung. Ein
     Neuladen würde sie wegwerfen und dabei weiß aufblitzen. */
  function canvasWecken(rahmen) {
    if (!rahmen || !rahmen.querySelectorAll) return;
    Array.prototype.forEach.call(rahmen.querySelectorAll('iframe[data-pv-canvas]'), function (f) {
      if (f.getAttribute('src')) return;
      /* Nur laden, wenn der Rahmen wirklich Maß hat. Das Canvas passt seine
         Ansicht beim Start einmal ein und misst dafür sein eigenes Fenster;
         in einem Rahmen ohne Maß käme es auf 10 % und bliebe dort. Dass er
         Maß hat, besorgt prototyp.css §6 — die Prüfung hier ist die Wache
         darüber: wer die Regel dort löscht, bekommt kein falsch eingepasstes
         Canvas, sondern gar keins, und sieht sofort, dass etwas fehlt. */
      if (!f.clientWidth || !f.clientHeight) return;
      f.setAttribute('src', f.getAttribute('data-pv-canvas'));
    });
  }

  /* ── 11b · Der Wege-Modus: was lebt, und wohin es führt ─────────────────
     Der Prototyp weiß das alles längst. Jedes lebende Element trägt .pv-lebt
     (§4) und an sich seinen Weg (el.__pvWeg). Hier wird nichts neu erfasst —
     es wird nur sichtbar gemacht.

     Der Rahmen um ein Element sagt „lebt". Die Beschriftung daneben sagt,
     WOHIN — und das ist der eigentliche Wert: „→ Notiz-Editor" ist eine
     Auskunft, ein Rahmen allein ist nur ein Befund.

     Die Zahl im Kopf steht immer, auch bei ausgeschaltetem Modus. Sie ist die
     schnellste Antwort auf die Frage, die diesen Prototyp trägt: ist dieser
     Schirm arm? */

  var SCHALTER_WEGE = DOK.getElementById('pv-wege-schalter');
  var ZAHL_WEGE     = DOK.getElementById('pv-wege-zahl');
  var SCHICHT       = null;
  var wegeAn        = false;

  var BEWEGUNG_WORT = {
    erledigen:  'Erledigen',
    bewerten:   'Bewerten',
    drehen:     'Karte drehen',
    uebergeben: 'Übergabe',
    herkunft:   'Herkunft',
    oeffnen:    'Öffnen',
    zurueck:    'Zurück',
  };
  var ERSCHEINUNG_WORT = { light: 'Hell', dark: 'Dunkel', auto: 'Automatisch' };

  function schirmName(schluessel) {
    var s = NACH_SCHLUESSEL[schluessel];
    return s ? s.name : schluessel;
  }

  /* Was steht an diesem Element? weg=true heißt: es führt auf einen anderen
     Schirm. weg=false heißt: es lebt, bleibt aber hier. */
  function auskunft(el) {
    var w  = el.__pvWeg;
    var bw = el.getAttribute('data-bw');
    if (w && w.ziel && w.ziel !== 'nichts') {
      if (w.ziel === 'zurueck') {
        return { text: '→ zurück' + (w.rueckfall ? ' · ' + schirmName(w.rueckfall) : ''), weg: true };
      }
      if (w.ziel.indexOf('extern:') === 0) return { text: '→ ' + w.ziel.slice(7), weg: true };
      /* Der Herkunfts-Chip zeichnet erst den Faden und geht dann. Das ist ein
         anderer Weg als „öffnen", und wer prüft, will das unterscheiden. */
      if (w.art === 'herkunft') return { text: 'Faden → ' + schirmName(w.ziel), weg: true };
      return { text: '→ ' + schirmName(w.ziel), weg: true };
    }
    if (el.__pvSchalter) {
      return { text: 'schaltet ' + (ERSCHEINUNG_WORT[el.__pvSchalter] || el.__pvSchalter), weg: false };
    }
    if (bw) return { text: 'Bewegung: ' + (BEWEGUNG_WORT[bw] || bw), weg: false };
    if (el.hasAttribute('data-pv-haken')) return { text: 'Bewegung: Haken', weg: false };
    if (w && w.ziel === 'nichts') return { text: 'dieser Schirm', weg: false };
    return { text: 'lebt, ohne Weg', weg: false };
  }

  function schicht() {
    if (SCHICHT || !BUEHNE) return SCHICHT;
    SCHICHT = DOK.createElement('div');
    SCHICHT.className = 'pv-wegeschicht';
    /* Für Bildschirmleser ist die Schicht stumm: sie wiederholt nur, was als
       aria-label ohnehin schon am Element steht (§4). */
    SCHICHT.setAttribute('aria-hidden', 'true');
    BUEHNE.appendChild(SCHICHT);
    return SCHICHT;
  }

  /* Was von einem Element wirklich zu sehen ist. Eine Zeile, die aus ihrer
     Rollfläche hinausgescrollt ist, wird vom overflow abgeschnitten — ihre
     Beschriftung stünde sonst über einer Zeile, die niemand sieht. Deshalb
     wird der Ausschnitt gegen das Glas UND gegen jede Rollfläche darüber
     verschnitten. Bleibt fast nichts übrig, entfällt die Beschriftung. */
  /* Die abgewandte Seite einer Lernkarte. Sie steht im Dokument, sie hat
     volle Maße, und sie lebt auch wirklich — nur sieht man sie gerade nicht,
     weil sie um 180° gedreht hinter der anderen liegt (bewegung.css §.bw-flip).
     Ohne diese Prüfung stünde ihre Beschriftung mitten auf der Vorderseite
     und zeigte auf einen Knopf, der dort nicht ist. Sie zählt trotzdem mit:
     der Weg ist da, er ist nur eine Drehung entfernt. */
  function abgewandt(el) {
    var seite = el.closest ? el.closest('.bw-flip__seite') : null;
    if (!seite) return false;
    var karte = seite.closest('.bw-flip');
    if (!karte) return false;
    var hinten = seite.classList.contains('bw-flip__seite--hinten');
    return karte.classList.contains('is-gedreht') ? !hinten : hinten;
  }

  function sichtbarerAusschnitt(el, gR) {
    if (abgewandt(el)) return null;
    var r = el.getBoundingClientRect();
    var l = Math.max(r.left, gR.left);
    var t = Math.max(r.top, gR.top);
    var re = Math.min(r.right, gR.right);
    var b = Math.min(r.bottom, gR.bottom);
    var p = el.parentElement;
    while (p && p !== GLAS) {
      if (p.classList && p.classList.contains('scroll')) {
        var pr = p.getBoundingClientRect();
        l  = Math.max(l, pr.left);
        t  = Math.max(t, pr.top);
        re = Math.min(re, pr.right);
        b  = Math.min(b, pr.bottom);
      }
      p = p.parentElement;
    }
    if (re - l < 4 || b - t < 4) return null;
    return { l: l, t: t, r: re, b: b };
  }

  /* ── 11c · Ein Durchgang ─────────────────────────────────────────────────
     Zählen tut er immer, zeichnen nur im eingeschalteten Modus. */
  function wegeZeichnen() {
    var lage = wegeAn ? schicht() : SCHICHT;
    if (lage) lage.textContent = '';
    var rahmen = sichtbarerRahmen();
    if (!rahmen) { zahlSchreiben(0, 0); return; }

    Array.prototype.forEach.call(rahmen.querySelectorAll('.pv-wege-ort'), function (el) {
      el.classList.remove('pv-wege-ort');
    });

    var gR = GLAS.getBoundingClientRect();
    var bR = BUEHNE.getBoundingClientRect();
    var wege = 0, orte = 0;
    var offen = [];

    function anmelden(el, text, weg) {
      if (!wegeAn || !lage) return;
      var s = sichtbarerAusschnitt(el, gR);
      if (!s) return;
      var marke = DOK.createElement('span');
      marke.className = 'pv-wegemarke' + (weg ? '' : ' pv-wegemarke--ort');
      marke.textContent = text;
      marke.style.left = '-9999px';
      lage.appendChild(marke);
      offen.push({ marke: marke, s: s, w: 0, h: 0, weg: weg });
    }

    Array.prototype.forEach.call(rahmen.querySelectorAll('.pv-lebt'), function (el) {
      var a = auskunft(el);
      if (a.weg) { wege++; } else { orte++; el.classList.add('pv-wege-ort'); }
      anmelden(el, a.text, a.weg);
    });

    /* Das Canvas trägt kein .pv-lebt — es ist kein Ziel der Wegekarte,
       sondern eine fremde Anwendung. Ohne diese vier Zeilen meldete sein
       Schirm „1 Weg · 0 wirken an Ort und Stelle" und sähe damit ärmer aus
       als jeder andere, während dort in Wahrheit jeder Punkt der Fläche
       etwas tut. Ein Prüfwerkzeug, das den reichsten Schirm für den ärmsten
       hält, prüft nichts. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('iframe[data-pv-canvas]'), function (f) {
      orte++;
      anmelden(f, 'die ganze Fläche zeichnet', false);
    });

    zahlSchreiben(wege, orte);
    if (!wegeAn || !lage || !offen.length) return;

    /* Erst alle messen, dann alle setzen: ein einziger Umbruch für vierzig
       Beschriftungen statt vierzig. */
    offen.forEach(function (o) { o.w = o.marke.offsetWidth; o.h = o.marke.offsetHeight; });

    /* Fünf Plätze, in dieser Reihenfolge.
       Der erste sitzt AUF der eigenen Oberkante, halb darüber, halb darauf —
       wie die Beschriftung an einem Feldrahmen. Das ist der einzige Platz,
       der eindeutig zum Element gehört: über dem Element liegt in einer Liste
       schon die nächste Zeile, und eine Beschriftung, die mitten auf der
       Nachbarzeile steht, beschriftet in den Augen des Lesers diese.
       Die weiteren fangen den Fall auf, den es hier oft gibt: ein Kästchen,
       das in einer Zeile liegt, die selbst einen Weg hat. */
    /* Wer zuerst kommt, bekommt den Platz — deshalb kommen die Wege zuerst.
       Ein Erledigen-Kästchen liegt in einer Zeile, die ins Detail führt;
       beide wollen denselben Fleck, und die Auskunft „→ Aufgaben-Detail" ist
       die, wegen der man das Werkzeug eingeschaltet hat. Die Reihenfolge
       innerhalb der beiden Gruppen bleibt die des Dokuments. */
    var belegt = [];
    offen.sort(function (a, b) { return (b.weg ? 1 : 0) - (a.weg ? 1 : 0); });
    offen.forEach(function (o) {
      var s = o.s, w = o.w, h = o.h;
      var mitte = (s.t + s.b) / 2;
      var plaetze = [
        [s.l + 6,     s.t - h / 2],      /* auf der eigenen Oberkante */
        [s.l + 6,     s.b - h / 2],      /* auf der eigenen Unterkante */
        [s.r + 4,     mitte - h / 2],    /* rechts daneben */
        [s.l - w - 4, mitte - h / 2],    /* links daneben */
        [s.l + 2,     s.t + 2],          /* zur Not hinein */
      ];
      for (var i = 0; i < plaetze.length; i++) {
        var x = plaetze[i][0], y = plaetze[i][1];
        if (x < bR.left + 2 || y < bR.top + 2 ||
            x + w > bR.right - 2 || y + h > bR.bottom - 2) continue;
        var frei = true;
        for (var j = 0; j < belegt.length; j++) {
          var k = belegt[j];
          if (x < k.x + k.w + 2 && x + w + 2 > k.x &&
              y < k.y + k.h + 2 && y + h + 2 > k.y) { frei = false; break; }
        }
        if (!frei) continue;
        belegt.push({ x: x, y: y, w: w, h: h });
        o.marke.style.left = Math.round(x - bR.left) + 'px';
        o.marke.style.top  = Math.round(y - bR.top) + 'px';
        return;
      }
      /* Kein Platz. Der Rahmen bleibt und sagt weiter „lebt"; die Auskunft
         entfällt. Zwei Beschriftungen übereinander wären zwei unlesbare. */
      o.marke.remove();
    });
  }

  function zahlSchreiben(wege, orte) {
    if (!ZAHL_WEGE) return;
    var t;
    if (!wege && !orte)  t = 'nichts lebt auf diesem Schirm';
    else if (!wege)      t = '<b>kein Weg</b> auf diesem Schirm · ' + orte + ' wirken an Ort und Stelle';
    else t = '<b>' + wege + (wege === 1 ? ' Weg' : ' Wege') + '</b> auf diesem Schirm · ' +
             orte + ' ' + (orte === 1 ? 'wirkt' : 'wirken') + ' an Ort und Stelle';
    ZAHL_WEGE.innerHTML = t;
  }

  /* Gebündelt auf das nächste Bild: Rollen, Größe ändern und Schirmwechsel
     lösen sonst drei Durchgänge im selben Augenblick aus. */
  var wegeWartet = false;
  function markenAuffrischen() {
    if (wegeWartet) return;
    wegeWartet = true;
    var tun = function () { wegeWartet = false; wegeZeichnen(); };
    if (global.requestAnimationFrame) global.requestAnimationFrame(tun);
    else global.setTimeout(tun, 16);
  }

  function wegeSchalten(an) {
    wegeAn = !!an;
    if (wegeAn) GLAS.setAttribute('data-pv-wege', '1');
    else GLAS.removeAttribute('data-pv-wege');
    if (SCHALTER_WEGE) SCHALTER_WEGE.setAttribute('aria-pressed', String(wegeAn));
    wegeZeichnen();
  }

  if (SCHALTER_WEGE) {
    SCHALTER_WEGE.addEventListener('click', function () {
      wegeSchalten(SCHALTER_WEGE.getAttribute('aria-pressed') !== 'true');
    });
  }

  global.addEventListener('resize', markenAuffrischen);
  /* Rollen im Schirm verschiebt jede Beschriftung mit. In der Erfassungsphase,
     weil Rollflächen kein Ereignis nach oben schicken. */
  GLAS.addEventListener('scroll', markenAuffrischen, true);
  /* Eine Bewegung räumt Zeilen weg und legt Karten um. Danach stimmt das Bild
     wieder, aber erst nach ihr — deshalb ein zweiter Blick, wenn sie durch ist. */
  GLAS.addEventListener('click', function () { global.setTimeout(markenAuffrischen, 420); });

  /* ══════════════════════════════════════════════════════════════════════
   * 9 · START
   * ==================================================================== */

  function start() {
    wegeAnlegen(karteHolen());
    bedienleisteNachziehen();

    var a = ankerLesen(location.hash) || { schirm: START, geraet: 'ipad' };
    geraetZeigen(a.geraet);
    zustandSetzen(a.schirm, a.geraet, 0, true);
    zeigen(a.schirm, a.geraet, 'keine');
    massstab();

    /* Die Fäden der Schirme werden erst gezeichnet, wenn ihr Rahmen eine
       Größe hat. Das besorgt der ResizeObserver in mock.js von selbst —
       hier wird nur einmal nachgestoßen, falls ein Schirm beim Start schon
       stand, bevor mock.js fertig war. Im selben Zug wird der Anfangszustand
       jedes Rahmens festgehalten (§5e); er muss NACH den seiteneigenen
       Skripten der Schirme genommen werden, sonst fehlten deren Fäden. */
    global.setTimeout(function () {
      massstab();
      stumm = false;
      aufbauen();                                /* jetzt steht auch, was die Schirme selbst bauen */
      if (global.MOTION && global.MOTION.merken) alleRahmen(global.MOTION.merken);
      ankunft();
      markenAuffrischen();
    }, 0);

    /* Das Canvas im Voraus: eine Drittelsekunde nachdem alles steht, lädt der
       Rahmen des gerade gewählten Geräts still das Mockup. Wer dann darauf
       tippt, sieht es sofort — statt einer weißen Fläche, die sich füllt.
       Das andere Gerät lädt erst, wenn man dorthin wechselt. */
    global.setTimeout(function () {
      var s = NACH_SCHLUESSEL['canvas'];
      if (s) canvasWecken(s.rahmen[jetzt.geraet]);
    }, 1200);
  }

  /* ── DIE ANKUNFT ─────────────────────────────────────────────────────────
     Beim ersten Laden erscheint die Tagesliste gestaffelt statt auf einmal —
     dieselbe Kleinbewegung, die bewegung.js für jede Liste hat (MOTION.staffeln,
     36 ms je Eintrag, nach zwölf Einträgen keine weitere Verzögerung).
     Kein Willkommen, kein Onboarding, kein Hinweiskasten: ein Satz Papier, der
     sich setzt. Unter Reduce bringt staffeln() seinen eigenen Pfad mit (120 ms
     ohne Versatz) — hier wird nichts zweitgeschrieben.
     Genau eine Liste, nicht drei: eine Seite, auf der alles nacheinander
     eintrudelt, kann man nicht überfliegen. */
  function ankunft() {
    var M = global.MOTION;
    if (!M || !M.staffeln) return;
    var rahmen = sichtbarerRahmen();
    var liste = rahmen && rahmen.querySelector('.scroll');
    if (!liste) return;
    liste.classList.add('bw-staffel');
    M.aufbereiten(rahmen);                       /* setzt --bw-i an den Kindern */
    M.staffeln(liste).then(function () {
      /* Danach wieder abnehmen: beim zweiten Besuch trägt schon der
         Schirmwechsel eine Bewegung, und zwei übereinander sind eine zu viel. */
      liste.classList.remove('bw-staffel');
    });
  }

  if (DOK.readyState === 'loading') DOK.addEventListener('DOMContentLoaded', start);
  else start();

  /* ══════════════════════════════════════════════════════════════════════
   * 10 · DIE WEGEKARTE — sie steht nicht mehr hier
   *
   * Bis zu dieser Runde lag der Datenblock an dieser Stelle: 145 Zeilen
   * mitten in zweitausend Zeilen Bedienung. Er liegt jetzt in wege.js
   * daneben und wird VOR dieser Datei geladen (tools/prototyp-bauen.js §5).
   *
   * Der Grund ist Arbeitsteilung, nicht Ordnung: die Bedienung ändert sich
   * selten, die Karte bei jedem neuen Schirm. Wer einen Weg hinzufügt, soll
   * nicht durch die Übergänge blättern; wer an den Übergängen arbeitet, soll
   * nicht aus Versehen einen Weg löschen.
   *
   * Hier steht deshalb nur noch, was zu tun ist, wenn die Karte fehlt: Der
   * Prototyp läuft weiter, aber es lebt nichts außer der Grundnavigation.
   * Das ist Absicht — ein Prototyp ohne Karte soll sichtbar leer sein und
   * nicht heimlich halb funktionieren. Die Konsole sagt, woran es liegt.
   * ==================================================================== */

  var LEERE_KARTE = { version: 0, wege: [] };

  function karteHolen() {
    var k = global.VELUM_WEGE;
    if (k && k.wege && k.wege.length) return k;
    if (global.console && console.warn) {
      console.warn('[prototyp] wege.js fehlt oder ist leer — es lebt nur die ' +
        'Grundnavigation (Seitenleiste, Lupe, Tab-Leiste, Zurück). Die Karte ' +
        'wird als <script src="wege.js"> vor prototyp.js erwartet.');
    }
    return LEERE_KARTE;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * DIE ÖFFENTLICHE HAND
   * ==================================================================== */

  global.PROTOTYP = {
    wege:      wegeAnlegen,       /* Wegekarte setzen (ersetzt die bisherige) */
    karte:     function () { return KARTE; },
    gehen:     gehen,             /* PROTOTYP.gehen('aufgabe', 'vor')         */
    zurueck:   zurueck,
    geraet:    geraetWechseln,    /* PROTOTYP.geraet('iphone')                */
    schirme:   SCHIRME,
    zustand:   function () { return { schirm: jetzt.schirm, geraet: jetzt.geraet, tiefe: jetzt.tiefe }; },
    neuAufbauen: aufbauen,
    wegeModus: wegeSchalten,      /* PROTOTYP.wegeModus(true)                */
  };
})(window);
