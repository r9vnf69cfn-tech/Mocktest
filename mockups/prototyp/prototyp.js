/* ============================================================================
 * prototyp.js — die Bedienung des begehbaren Prototyps
 *
 * Es wird nichts gespeichert und nichts gerechnet. Diese Datei tut vier Dinge:
 *
 *   sie bewegt einen von 34 Rahmen in den Vordergrund,
 *   sie merkt sich, woher man kam,
 *   sie sagt jedem Element im Rahmen, ob es führt, ob es hier wirkt,
 *     oder ob es entschärft ist,
 *   und sie lässt neue Objekte entstehen — leer, mit Schreibmarke, für die
 *     Dauer eines Besuchs (§12).
 *
 * Bis zur Runde des Erzeugen-Menüs kannte sie nur zwei Sorten: Elemente mit
 * einem Weg und Elemente ohne. Die Regel „was keinen Weg hat, zeigt auch
 * keinen Klickfinger" war richtig und hatte eine Lücke — manche Elemente
 * sind zu auffällig, um tot sein zu dürfen. Ein entschärfter „+ Neu" sieht
 * nicht nach Absicht aus, sondern nach kaputt. Seither gibt es drei Sorten
 * und eine Auflage: kein primärer CTA und kein Erzeugen-Knopf darf in der
 * dritten landen.
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
 *  12  Der Prototyp erzeugt   das Erzeugen-Menü und die sechs neuen Objekte
 *  13  Der Rest der toten Knöpfe   was an Ort und Stelle wirkt
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
 * Dazu die drei Schalter Hell · Dunkel · Automatisch in den Einstellungen,
 * die Erzeugen-Knöpfe (§12) und alles, was an Ort und Stelle wirkt (§13).
 * Sie stehen nicht in der Karte, weil sie kein Ziel haben — sie werden
 * gemessen, nicht gepflegt: PROTOTYP.erzeuger() sagt, was dabei herauskam.
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

    /* Ein offenes Erzeugen-Menü gehört zu dem Schirm, auf dem es geöffnet
       wurde. Bleibt es stehen, schwebt es über einem anderen (§12c). */
    menueSchliessen();

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

    /* Sorte 2: WIRKT AN ORT UND STELLE. Der Weg trägt eine Handlung; sie
       entscheidet selbst, ob danach noch navigiert wird. Das ist die eine
       Stelle, an der §12 und §13 in die Bedienung greifen — sie hängen keinen
       zweiten Zuhörer ans Glas, sondern benutzen diesen. */
    if (weg.tun) {
      e.preventDefault();
      weg.tun(el, e);
      return;
    }

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

  /* Leertaste und Enter auf einem belebten Element, das kein Knopf ist.
     Wer in ein Feld schreibt, ist ausgenommen — sonst verschluckte diese
     Zeile jedes Leerzeichen in der Erfassungszeile (§12e): das Feld liegt in
     einem belebten Behälter, und closest() fände ihn statt des Feldes. */
  GLAS.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]')) return;
    var el = t.closest ? t.closest('.pv-lebt') : null;
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
     Der erste Ort im Prototyp, an dem ein Bedienelement wirklich etwas tat —
     und er kostet nichts, weil die Seite hell und dunkel ohnehin kann. Seit
     §12 und §13 ist er nicht mehr der einzige; die Bauart ist dieselbe
     geblieben: der Zustand wird umgehängt, nicht neu erfunden. Was in den
     Einstellungen Daten änderte, die es hier nicht gibt, bleibt tot — außer
     „Erneut versuchen", das einen Fehler wegräumt und keine Daten anfasst.
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

  /* Ein Rahmen, von Grund auf: erst alles tot, dann einzeln beleben.
     Die beiden letzten Zeilen sind neu und stehen mit Absicht ZULETZT: was
     erzeugt und was an Ort und Stelle wirkt, überschreibt einen Weg aus der
     Karte, wenn beide auf dasselbe Element zeigen. „Eintrag beginnen" führte
     bisher in einen bestehenden Journaleintrag; jetzt legt es einen neuen an,
     und das ist die Antwort, die der Knopf verspricht. */
  function frischAufbauen(rahmen) {
    var geraet = rahmen.getAttribute('data-pv-geraet');
    totstellen(rahmen);
    grundnavigation(rahmen, geraet);
    karteAnwenden(rahmen, geraet);
    schalter(rahmen);
    erzeugenKnoepfe(rahmen, geraet);
    wirkKnoepfe(rahmen, geraet);
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
    erzeugerListe = [];        /* §12b füllt sie beim Durchgang neu */
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

  /* Was steht an diesem Element? Drei Sorten, zwei davon bekommen eine
     Beschriftung:

       1  FÜHRT                    „→ Notiz-Editor"
       2  WIRKT AN ORT UND STELLE  „wirkt hier: Raster wird Liste"
       3  ENTSCHÄRFT               gar nichts — es trägt kein .pv-lebt und
                                   kommt hier nie an.

     weg=true heißt Sorte 1, weg=false Sorte 2. Das Wort „wirkt hier" steht
     genau einmal, hier — jede Handlung in §12 und §13 gibt nur ihren
     Nachsatz an. */
  function wirkt(text) { return { text: 'wirkt hier: ' + text, weg: false }; }

  function auskunft(el) {
    var w  = el.__pvWeg;
    var bw = el.getAttribute('data-bw');
    if (w && w.wirkt) return wirkt(w.wirkt);
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
      return wirkt('schaltet ' + (ERSCHEINUNG_WORT[el.__pvSchalter] || el.__pvSchalter));
    }
    if (bw) return wirkt(BEWEGUNG_WORT[bw] || bw);
    if (el.hasAttribute('data-pv-haken')) return wirkt('Haken');
    if (w && w.ziel === 'nichts') return { text: 'dieser Schirm', weg: false };
    return wirkt('ohne Wort — das ist ein Befund, kein Zustand');
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
      /* Was gar nicht gerendert wird, zählt nicht. Seit die Bibliothek
         zwischen Regal und Liste umschaltet (§13a), steht der jeweils andere
         Bestand auf display:none im Dokument — er trüge sonst achtzehn Wege
         zur Zahl bei, die auf dem Schirm niemand sehen kann. Das ist etwas
         anderes als „aus dem Bild gerollt": eine Zeile weiter unten in der
         Liste zählt weiter mit, sie ist nur einen Wisch entfernt. */
      if (!el.getClientRects().length) return;
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
   * 12 · DER PROTOTYP ERZEUGT ETWAS
   *
   * Der erste Weg, den ein Fremder geht, ist nicht „Notiz öffnen", sondern
   * „Neu". Bis zu dieser Runde stand dieser Knopf auf zwölf Schirmen als
   * gefüllte Ink-Fläche — der lauteste Knopf des Bildschirms — und tat
   * nichts. Die Regel „was keinen Weg hat, zeigt auch keinen Klickfinger"
   * war richtig und hatte eine Lücke: MANCHE ELEMENTE SIND ZU AUFFÄLLIG, UM
   * TOT SEIN ZU DÜRFEN. Ein entschärfter CTA sieht nicht nach Absicht aus,
   * sondern nach kaputt.
   *
   * Deshalb gibt es hier ab jetzt drei Sorten und eine Auflage:
   *
   *   1  FÜHRT                    ein Weg auf einen anderen Schirm  (§5b)
   *   2  WIRKT AN ORT UND STELLE  verändert sichtbar etwas hier     (§12, §13)
   *   3  ENTSCHÄRFT               kein Klickfinger, kein Hover      (§4)
   *
   *   Kein primärer CTA und kein Erzeugen-Knopf darf in Sorte 3 landen.
   *
   * ── WIE DIE ERZEUGEN-KNÖPFE GEFUNDEN WERDEN ───────────────────────────
   * Nicht über eine Liste. Eine Liste von 34 Rahmen wäre am Tag nach dem
   * nächsten Schirm falsch, und niemand merkte es. Gemessen wird am Element
   * selbst: das Pluszeichen, der Wortlaut, die Nachbarschaft. Was dabei
   * herauskommt, steht in der Konsole (PROTOTYP.erzeuger()).
   *
   * ── WAS DANACH ENTSTEHT ───────────────────────────────────────────────
   * Ein NEUES, LEERES Objekt, und man sieht, dass es neu ist: Schreibmarke,
   * heutiges Datum, Zähler auf null, und — die ehrlichste Stelle des ganzen
   * Entwurfs — in der Marginalspalte der neuen Notiz NICHTS. Eine neue Notiz
   * hat keine Fäden. Genau daran sieht man, dass Velums Wert mit dem Bestand
   * wächst und nicht mit dem ersten Tag.
   *
   * Gespeichert wird nichts. Der Schirm wird beim Verlassen zurückgestellt
   * (§5e, MOTION.zuruecksetzen schreibt sein innerHTML zurück) — dafür ruft
   * jede Bauhandlung schmutzig(). Solange man dort steht, ist das neue Ding
   * da und sieht aus wie ein echtes.
   *
   * ── WARUM HIER NIE frischAufbauen() STEHT ─────────────────────────────
   * Die Wegekarte adressiert vieles über nth-child (wege.js: 18 Notizbücher,
   * 5 Decks, 4 Journalkarten). Ein neues Buch vorn im Regal verschöbe jeden
   * dieser Wähler um eins, und jedes Buch bekäme still das Ziel seines
   * Nachbarn. Neu gebaute Elemente werden darum EINZELN belebt; was schon
   * lebt, wird nicht angefasst. Der Rahmen wird erst wieder aufgebaut, wenn
   * er zurückgestellt ist und wieder im Original dasteht.
   * ==================================================================== */

  /* Der Prototyp spielt an einem Tag: Donnerstag, 13. November. Die
     Statusleiste jedes Schirms sagt das, die Lernkarten sagen es
     ausgeschrieben. Ein neues Objekt, das ein anderes Datum trüge, wäre der
     einzige Gegenstand im Haus, der aus der Reihe fiele. */
  var HEUTE = { lang: 'Donnerstag, 13. November', kurz: 'Heute', tag: '13. November' };

  /* Die sechs Dinge, die Velum kennt — in der Reihenfolge des Datenmodells:
     erst das Blatt Papier, dann sein Behälter, dann die drei Module, die aus
     ihm entstehen, dann die Fläche. Jede Zeile trägt ihren 6-pt-Modulpunkt
     und ihr Wort; ein Punkt steht nie allein. */
  var DINGE = [
    { id: 'notiz',     wort: 'Notiz',            punkt: 'notes',   ziel: 'notiz' },
    { id: 'notizbuch', wort: 'Notizbuch',        punkt: 'notes',   ziel: 'bibliothek' },
    { id: 'journal',   wort: 'Journaleintrag',   punkt: 'journal', ziel: 'journal-eintrag' },
    { id: 'aufgabe',   wort: 'Aufgabe',          punkt: 'tasks',   ziel: 'aufgaben' },
    { id: 'deck',      wort: 'Lernkarten-Deck',  punkt: 'cards',   ziel: 'lernkarten' },
    { id: 'blatt',     wort: 'Canvas-Blatt',     punkt: 'canvas',  ziel: 'canvas' },
  ];
  function ding(id) {
    for (var i = 0; i < DINGE.length; i++) if (DINGE[i].id === id) return DINGE[i];
    return null;
  }

  /* Welches Ding ein Schirm meint. Steht der Knopf in einem Modul, ist dessen
     Zeile vorgewählt und steht oben — im Aufgaben-Schirm ist „Aufgabe" der
     primäre Eintrag, nicht „Notiz". */
  var MODUL_VON_SCHIRM = {
    'notizen':         'notiz',
    'notiz':           'notiz',
    'bibliothek':      'notizbuch',
    'journal':         'journal',
    'journal-eintrag': 'journal',
    'aufgaben':        'aufgabe',
    'aufgabe':         'aufgabe',
    'lernkarten':      'deck',
    'lernsitzung':     'deck',
    'canvas':          'blatt',
  };

  /* ── 12a · Kleine Handgriffe ─────────────────────────────────────────── */

  function bau(html) {
    var h = DOK.createElement('div');
    h.innerHTML = html;
    var n = h.firstElementChild;
    return n;
  }
  /* Die Symbole der Schirme sind <span data-ico>; erst MOCK.hydrate legt das
     SVG hinein. Was hier gebaut wird, muss durch dieselbe Hand — sonst stünde
     an einer neuen Zeile ein leeres Kästchen, wo überall sonst ein Zeichen ist. */
  function beleben_ikonen(wurzel) {
    if (global.MOCK && global.MOCK.hydrate) global.MOCK.hydrate(wurzel);
  }
  function ikon(name, px) {
    return '<span class="ico" data-ico="' + name + '" style="width:' + px + 'px;height:' + px + 'px"></span>';
  }
  function marke() { return '<span class="pv-marke"></span>'; }
  function textVon(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* Verstecken heißt hier: WIRKLICH weg. Das Merkmal hidden allein reicht
     nicht — die Übergabe-Leiste, das Segment, der Inspektor tragen ihr
     display in einer Klasse, und eine Klasse schlägt das Merkmal. Wer das
     nicht weiß, sieht einen Knopf, der „nichts tut", obwohl er alles
     Richtige getan hat. */
  function verbergen(el, aus) {
    if (!el) return;
    if (aus === false) { el.hidden = false; el.style.display = ''; return; }
    el.hidden = true;
    el.style.display = 'none';
  }

  /* Der Rahmen rechnet in Schirmmaß (1194 pt), das Fenster in Bildpunkten.
     Dazwischen steht der Maßstab von §7. Ohne diese Umrechnung säße das
     Popover bei halbem Maßstab um die halbe Strecke daneben. */
  function inSchirmmass(rahmen) {
    var buehne = rahmen.querySelector('.screen') || rahmen;
    var r = buehne.getBoundingClientRect();
    return r.width ? buehne.offsetWidth / r.width : 1;
  }

  /* ── 12b · Die Erzeugen-Knöpfe finden ────────────────────────────────── */

  /* Was ein Erzeugen-Knopf ist, entscheidet sich an drei Merkmalen:

       das PLUSZEICHEN     in einer Leiste, in einer Karte, als Rundknopf
       der WORTLAUT        „Neu", „Neue Notiz", „Eintrag", „Eintrag beginnen",
                           „Erste Notiz", „Notizbuch anlegen"
       die NACHBARSCHAFT   ein Plus neben einem Minus ist kein Erzeugen,
                           sondern ein Zoom (graph.html)

     Und drei Ausschlüsse, die aus derselben Messung kommen: „Tag hinzufügen",
     „Verknüpfung hinzufügen" und „Schritt hinzufügen" legen keinen Gegenstand
     an, sondern eine Eigenschaft an einem, der schon da ist. Sie bekommen
     ihre eigene Wirkung (§13) und nicht das Menü der sechs Dinge — ein Menü,
     das dort „Canvas-Blatt" anböte, wäre falsch. */
  var ERZEUGEN_WORT = /^(neu|neue notiz|eintrag|eintrag beginnen|erste notiz|zweite notiz|notizbuch anlegen|aufgabe|karte hinzufügen|aufgabe hinzufügen)$/;
  var EIGENSCHAFT_WORT = /tag|verknüpfung|schritt/i;

  function istErzeugenKnopf(el) {
    if (el.closest('[data-pv-aus]')) return false;
    /* Zwei Nachbarschaften, in denen „Aufgabe" NICHT „neue Aufgabe" heißt:
       die Übergabe-Leiste („mach aus DIESER Auswahl eine Aufgabe") und die
       Chips „WOHIN DAMIT" unter einem Schnipsel im Eingang („leg DIESEN
       Schnipsel als Aufgabe ab"). Beide handeln an einem Gegenstand, der
       schon da ist; ein Menü der sechs Dinge wäre dort die falsche Frage.
       Sie bekommen ihre eigene Wirkung in §13f und §13g. */
    if (el.closest('.handoff, .ei-wohin')) return false;
    var wort = textVon(el);
    var plus = !!el.querySelector('.ico[data-ico="plus"]');
    if (EIGENSCHAFT_WORT.test(wort)) return false;
    if (plus) {
      /* Ein Plus, das ein Minus neben sich hat, zählt eine Zahl hoch. */
      var leiste = el.parentElement;
      if (leiste && leiste.querySelector('.ico[data-ico="minus"]')) return false;
      return true;
    }
    return ERZEUGEN_WORT.test(wort.toLowerCase());
  }

  /* Welches Ding der Knopf vorwählt. Das WORT schlägt den Schirm: „Notizbuch
     anlegen" in den leeren Zuständen meint ein Notizbuch, auch wenn der Schirm
     keinem Modul gehört. Nennt der Knopf nichts, gilt sein Modul; hat der
     Schirm keins (Heute, Eingang, Semester, Leere Zustände), bleibt die
     Reihenfolge des Datenmodells und „Notiz" steht vorn. */
  function vorwahlVon(el, schirm) {
    var wort = textVon(el).toLowerCase();
    if (/notizbuch/.test(wort)) return 'notizbuch';
    if (/eintrag/.test(wort))   return 'journal';
    if (/notiz/.test(wort))     return 'notiz';
    if (/aufgabe/.test(wort))   return 'aufgabe';
    if (/karte|deck/.test(wort)) return 'deck';
    return MODUL_VON_SCHIRM[schirm] || null;
  }

  /* Die Erfassungszeile ist kein Knopf, sondern das Ding selbst: ein Feld mit
     Pluszeichen, in dem die Aufgabe entsteht. Sie bekommt kein Menü — sie ist
     schon die Aufgabe. */
  function erfassungszeile(rahmen) {
    var feld = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('.field'), function (f) {
      if (!feld && f.querySelector('.ico[data-ico="plus"]')) feld = f;
    });
    return feld;
  }

  var erzeugerListe = [];

  function erzeugenKnoepfe(rahmen, geraet) {
    var schirm = rahmen.getAttribute('data-pv-screen');
    /* Ein einzelner Rahmen wird auch außer der Reihe neu aufgebaut (§5e, nach
       dem Zurückstellen). Ohne diese Zeile stünde sein Knopf danach zweimal
       in der Liste, und PROTOTYP.erzeuger() zählte falsch. */
    for (var i = erzeugerListe.length - 1; i >= 0; i--) {
      if (erzeugerListe[i].schirm === schirm && erzeugerListe[i].geraet === geraet) erzeugerListe.splice(i, 1);
    }
    Array.prototype.forEach.call(rahmen.querySelectorAll('button,[role="button"]'), function (k) {
      if (!istErzeugenKnopf(k)) return;
      var v = vorwahlVon(k, schirm);
      /* „11. Nov. nachtragen" nennt den Tag, für den der Eintrag fehlt.
         Ein Eintrag mit dem heutigen Datum wäre dort die falsche Antwort. */
      var m = /(\d{1,2})\.\s*(\w+)\.?\s*nachtragen/i.exec(textVon(k));
      var datum = m ? nachtragsDatum(m[1], m[2]) : null;
      k.__pvVorwahl = v;
      k.__pvDatum = datum;
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'öffnet das Erzeugen-Menü',
        titel: 'Neu — Notiz, Notizbuch, Journaleintrag, Aufgabe, Deck oder Canvas-Blatt',
        tun: function (el) { menueOeffnen(el, el.__pvVorwahl); },
      });
      erzeugerListe.push({ schirm: schirm, geraet: geraet, wort: textVon(k) || '(Pluszeichen)', vorwahl: v });
    });

    /* Die Erfassungszeile. Sie steht in tasks.html auf beiden Geräten und ist
       dort der eigentliche Erzeugen-Knopf des iPhones — eine schwebende
       Rundtaste gibt es auf dem Aufgaben-Schirm nicht. */
    if (schirm === 'aufgaben') {
      var feld = erfassungszeile(rahmen);
      if (feld) {
        beleben(feld, {
          ziel: 'nichts',
          wirkt: 'Erfassungszeile — hier entsteht die Aufgabe',
          titel: 'Aufgabe erfassen',
          tun: function () { erfassungOeffnen(rahmen, true); },
        });
        erzeugerListe.push({ schirm: schirm, geraet: geraet, wort: 'Erfassungszeile', vorwahl: 'aufgabe' });
      }
    }
  }

  var MONATE = { jan: 'Januar', feb: 'Februar', 'mär': 'März', apr: 'April', mai: 'Mai', jun: 'Juni',
                 jul: 'Juli', aug: 'August', sep: 'September', okt: 'Oktober', nov: 'November', dez: 'Dezember' };
  var WOCHENTAG_11_NOV = 'Dienstag';   /* der 13. ist ein Donnerstag, also ist der 11. ein Dienstag */
  function nachtragsDatum(tag, monat) {
    var m = MONATE[String(monat).slice(0, 3).toLowerCase()] || monat;
    var wt = String(tag) === '11' ? WOCHENTAG_11_NOV + ', ' : '';
    return wt + tag + '. ' + m;
  }

  /* ── 12c · Das Menü ──────────────────────────────────────────────────── */

  var offenesMenue = null;

  function menueSchliessen() {
    if (!offenesMenue) return;
    var m = offenesMenue;
    offenesMenue = null;
    if (m.knopf) m.knopf.setAttribute('aria-expanded', 'false');
    if (m.kasten && m.kasten.parentNode) m.kasten.parentNode.removeChild(m.kasten);
    if (m.vorhang && m.vorhang.parentNode) m.vorhang.parentNode.removeChild(m.vorhang);
    markenAuffrischen();
  }

  /* Ein zweiter Tap auf denselben Knopf braucht hier keine eigene Zeile: der
     Vorhang liegt über dem ganzen Gerät, also auch über dem Knopf, und ein
     Tap darauf ist ein Tap DANEBEN. Genau so verhält sich ein Popover im
     System — was offen ist, schließt sich beim nächsten Tap irgendwohin. */
  function menueOeffnen(knopf, vorwahl) {
    menueSchliessen();

    var rahmen = knopf.closest('.pv-screen');
    if (!rahmen) return;
    var geraet = rahmen.getAttribute('data-pv-geraet');
    var buehne = rahmen.querySelector('.screen') || rahmen;
    var blatt = geraet === 'iphone';

    /* Die Reihenfolge: das vorgewählte Ding zuerst, der Rest in der
       Reihenfolge des Datenmodells. */
    var reihe = DINGE.slice();
    if (vorwahl) {
      reihe.sort(function (a, b) { return (b.id === vorwahl ? 1 : 0) - (a.id === vorwahl ? 1 : 0); });
    }

    var vorhang = DOK.createElement('div');
    vorhang.className = 'pv-menue__vorhang' + (blatt ? ' pv-menue__vorhang--dunkel' : '');
    vorhang.addEventListener('click', menueSchliessen);

    var huelle = DOK.createElement('div');
    huelle.className = 'pv-menue ' + (blatt ? 'pv-menue--blatt' : 'pv-menue--popover');
    huelle.setAttribute('role', 'menu');
    huelle.setAttribute('aria-label', 'Neu erstellen');

    var kasten = DOK.createElement('div');
    kasten.className = 'pv-menue__kasten';
    huelle.appendChild(kasten);

    if (blatt) kasten.appendChild(bau('<div class="pv-menue__griff"></div>'));
    kasten.appendChild(bau('<div class="pv-menue__kopf"><span class="t-label c-3">NEU</span></div>'));

    reihe.forEach(function (d) {
      var gewaehlt = d.id === vorwahl;
      var zeile = bau(
        '<button class="pv-menue__zeile' + (gewaehlt ? ' is-wahl' : '') + '" role="menuitem">' +
        '<span class="dot dot--' + d.punkt + '"></span>' +
        '<span class="t-body pv-menue__wort">' + d.wort + '</span>' +
        (gewaehlt ? '<span class="ico pv-menue__haken" data-ico="check" style="width:17px;height:17px"></span>' : '') +
        '</button>');
      zeile.__pvDing = d.id;
      zeile.__pvDatum = knopf.__pvDatum || null;
      kasten.appendChild(zeile);
      beleben(zeile, {
        ziel: d.ziel,
        titel: d.wort + ' erstellen',
        tun: function (el) { erzeugen(el.__pvDing, el.__pvDatum); },
      });
    });

    beleben_ikonen(kasten);
    buehne.appendChild(vorhang);
    buehne.appendChild(huelle);

    if (!blatt) popoverStellen(huelle, kasten, knopf, buehne, rahmen);

    knopf.setAttribute('aria-expanded', 'true');
    offenesMenue = { knopf: knopf, kasten: huelle, vorhang: vorhang };
    /* Die Tastatur kommt mit: wer den Knopf mit Enter gedrückt hat, steht
       sonst im Nichts, während vor ihm ein Menü offen ist. */
    var erste = kasten.querySelector('.pv-menue__zeile');
    if (erste) { try { erste.focus({ preventScroll: true }); } catch (e) { erste.focus(); } }
    markenAuffrischen();
  }

  /* Das Popover hängt an seinem Knopf: bündig unter ihm, an der Kante, die
     näher am Rand liegt. Passt es nach unten nicht mehr, klappt es nach oben —
     ein Menü, das aus dem Gerät läuft, ist kein Menü. */
  function popoverStellen(huelle, kasten, knopf, buehne, rahmen) {
    var f = inSchirmmass(rahmen);
    var sr = buehne.getBoundingClientRect();
    var kr = knopf.getBoundingClientRect();
    var x = (kr.left - sr.left) * f;
    var y = (kr.top  - sr.top)  * f;
    var kb = kr.width * f, kh = kr.height * f;
    var B = buehne.offsetWidth, H = buehne.offsetHeight;
    var mb = kasten.offsetWidth, mh = kasten.offsetHeight;

    /* Rechtsbündig zum Knopf, solange das ins Gerät passt — die meisten
       Erzeugen-Knöpfe sitzen rechts in der Leiste. */
    var links = x + kb - mb;
    if (links + mb > B - 12) links = B - 12 - mb;
    if (links < 12) links = 12;

    var oben = y + kh + 8;
    var nachOben = oben + mh > H - 12;
    if (nachOben) oben = Math.max(12, y - mh - 8);

    huelle.style.left = Math.round(links) + 'px';
    huelle.style.top  = Math.round(oben) + 'px';
    /* Es wächst aus der Ecke, die am Knopf liegt. */
    var ox = Math.max(0, Math.min(mb, x + kb / 2 - links));
    kasten.style.transformOrigin = Math.round(ox) + 'px ' + (nachOben ? '100%' : '0');
  }

  /* ── 12d · Was danach entsteht ───────────────────────────────────────── */

  function erzeugen(id, datum) {
    var d = ding(id);
    if (!d) return;
    menueSchliessen();

    if (d.ziel !== jetzt.schirm) {
      /* Ein Knopf ist kein Gegenstand — er öffnet als Blatt (§5c). */
      gehen(d.ziel, 'vor', false, sichtbarerRahmen());
    }
    var rahmen = sichtbarerRahmen();
    if (!rahmen) return;
    var geraet = rahmen.getAttribute('data-pv-geraet');

    /* Ab hier ist der Rahmen verändert. §5e stellt ihn zurück, sobald man
       ihn verlässt — dafür muss er in der Liste stehen. */
    schmutzig(rahmen);

    var tun = BAU[id];
    if (tun) tun(rahmen, geraet, datum);
    sagen('Neu angelegt: ' + d.wort + ' · ' + (datum || HEUTE.lang));
    global.setTimeout(markenAuffrischen, 40);
  }

  var BAU = {};

  /* ── NOTIZ ──────────────────────────────────────────────────────────────
     Titelzeile leer mit Schreibmarke, ein leerer Absatz, das Datum von heute —
     und in der Marginalspalte NICHTS. Eine neue Notiz hat keine Backlinks,
     keine verwandten Notizen, nichts, was aus ihr entstanden wäre, und keinen
     einzigen Faden am Seitenrand. Das ist keine Auslassung, sondern die
     Aussage: Velums Wert wächst mit dem Bestand. */
  BAU.notiz = function (rahmen, geraet) {
    var titel = rahmen.querySelector('.serif--screen-title');
    if (!titel) return;
    var blatt = titel.closest('.scroll');
    if (!blatt) return;

    /* Der Deckelstreifen bleibt — er ist das Papier, nicht der Inhalt. Nur
       was von der alten Notiz erzählt („Vorlesung 6 · Prof. Wendt"), geht. */
    var streifen = blatt.firstElementChild;
    if (streifen && streifen !== titel.closest('div')) {
      Array.prototype.forEach.call(streifen.querySelectorAll('.t-label'), function (s) { s.remove(); });
    }

    /* Der Kopf: das Kästchen, in dem der Titel steht. Und der Block, der
       davon im Blatt liegt — auf dem iPad steckt der Kopf noch in einer
       700-pt-Spalte, auf dem iPhone liegt er direkt darin. */
    var kopf = titel.parentElement;
    var block = titel;
    while (block.parentElement && block.parentElement !== blatt) block = block.parentElement;

    kopf.innerHTML =
      '<div class="serif--screen-title">' + marke() + '</div>' +
      '<div style="display:flex; align-items:center; gap:6px; margin-top:8px; flex-wrap:wrap">' +
        '<button class="chip chip--ghost">' + ikon('plus', 13) + 'Tag</button>' +
        '<div style="flex:1 1 auto"></div>' +
        '<span class="t-sub c-2">Neu · ' + HEUTE.lang + '</span>' +
      '</div>';

    /* Alles, was die alte Notiz war, geht. Statt dessen EIN LEERER ABSATZ —
       mit seiner Rinne, und die Rinne ist leer. Kein aufmunternder Satz,
       keine graue Anleitung: eine leere Notiz ist leer, und genau das soll
       man sehen. Wo hier geschrieben wird, sagt die Schreibmarke im Titel. */
    while (block.nextElementSibling) block.nextElementSibling.remove();
    var rinne = geraet === 'ipad' ? 40 : 20;
    var koerper = bau(
      '<div style="' + (geraet === 'ipad'
          ? 'max-width:700px; margin:0 auto; padding:12px 10px 6px'
          : 'padding:12px 20px 0 38px') + '">' +
        '<div style="display:flex; align-items:flex-start">' +
          '<div style="width:' + rinne + 'px; flex:none"></div>' +
          '<p class="t-body" style="margin:0; flex:1 1 auto; min-height:1lh"></p>' +
        '</div>' +
      '</div>');
    block.parentNode.insertBefore(koerper, block.nextSibling);

    /* Die Übergabe-Leiste („aus Zellbiologie → Lückentext-Karte") schwebt
       auf dem iPhone außerhalb der Rollfläche. Sie gehört zu einer Auswahl
       in einem Text, den es hier nicht gibt. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.handoff'), function (h) { verbergen(h); });

    /* Die Blockleiste unten sagt „Alles gesichert · 9:39". An einer Notiz,
       die es vor zwei Sekunden noch nicht gab, ist das der einzige Satz auf
       dem Schirm, der nicht stimmt. */
    Array.prototype.forEach.call(blatt.parentElement.querySelectorAll('.t-sub'), function (s) {
      if (/gesichert/.test(textVon(s))) s.textContent = 'Neue Notiz · leer';
    });

    /* Die Marginalspalte des iPads. Sie bleibt stehen — sie gehört zum Schirm,
       nicht zur Notiz —, aber sie sagt die Wahrheit über eine Notiz, die noch
       nichts ist. */
    var panel = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('aside'), function (a) {
      if (!panel && !a.classList.contains('sidebar') && /Übersicht/.test(a.textContent)) panel = a;
    });
    if (panel) {
      var rolle = panel.querySelector('.scroll') || panel;
      rolle.innerHTML =
        '<div class="segmented" style="width:100%">' +
          '<button class="is-on" style="flex:1 1 0">Übersicht</button>' +
          '<button style="flex:1 1 0">Verlauf</button>' +
        '</div>' +
        '<div style="padding:26px 2px 0; display:flex; flex-direction:column; gap:7px">' +
          '<span class="t-label c-3">NOCH KEINE FÄDEN</span>' +
          '<p class="t-sub c-3" style="margin:0">Backlinks, verwandte Notizen und was aus dieser ' +
          'Notiz entsteht stehen hier, sobald sie geschrieben ist.</p>' +
        '</div>';
      beleben_ikonen(rolle);
    }

    beleben_ikonen(blatt);
    /* Der „+ Tag"-Knopf der neuen Notiz ist gerade erst entstanden — §13i
       hat ihn beim Aufbau des Rahmens noch nicht gesehen. Ein neu gebauter
       Knopf, der tot bleibt, wäre genau der Fehler, den diese Runde abräumt. */
    eigenschaftsKnoepfeBeleben(rahmen);
  };

  /* ── NOTIZBUCH ──────────────────────────────────────────────────────────
     Vorn im Regal, Papier gewählt, Titel leer, Rücken ohne Punkte — ein Buch
     ohne Inhalt hat keine Objekte, also auch keine Punkte auf dem Rücken.
     Es wächst an seinen Platz: Rolle BESTÄTIGEN, 180 ms, springQuick. */
  BAU.notizbuch = function (rahmen, geraet) {
    var regal = rahmen.querySelector('.shelf');
    if (!regal) return;
    var klein = regal.classList.contains('shelf--6');
    var buch = bau(
      '<article class="book' + (klein ? ' book--sm' : '') + ' pv-waechst">' +
        '<a class="book__cover paper--buetten-elfenbein">' +
          '<span class="book__spine"></span>' +
          '<span class="book__title serif--cover-title book__title--l">' + marke() + '</span>' +
        '</a>' +
        '<div class="book__cap">' +
          '<div class="book__meta t-label"><span class="dot dot--notes"></span><span>Notizen</span></div>' +
          '<div class="book__meta book__meta--split t-label"><span>0 Seiten</span><span>neu</span></div>' +
        '</div>' +
      '</article>');
    regal.insertBefore(buch, regal.firstElementChild);

    /* „ALLE NOTIZBÜCHER 18" muss mitzählen — eine Überschrift, die 18 sagt,
       während 19 dastehen, ist der Fehler, den dieser Prototyp abräumt. */
    zahlHochzaehlen(regal.previousElementSibling, 1);
    beleben_ikonen(buch);
  };

  /* Die erste Zahl in einer Kopfzeile um n erhöhen. */
  function zahlHochzaehlen(kopf, n) {
    if (!kopf) return;
    var z = kopf.querySelector('.num');
    if (!z) return;
    var alt = parseInt(textVon(z), 10);
    if (isNaN(alt)) return;
    z.textContent = String(alt + n);
  }

  /* ── JOURNALEINTRAG ─────────────────────────────────────────────────────
     Das heutige Datum in der Serif, die Impulsfrage darüber. Der Impuls ist
     derselbe wie im Journal-Start — er kommt aus dem Bestand (dem Canvas vom
     6. November) und nicht aus dem Nichts; genau daran hängt seine Kante. */
  BAU.journal = function (rahmen, geraet, datum) {
    var h1 = rahmen.querySelector('h1.serif--screen-title, .serif--screen-title');
    if (!h1) return;
    var artikel = h1.closest('article') || h1.parentElement;
    if (!artikel) return;

    artikel.innerHTML =
      '<div style="display:flex; align-items:center; gap:8px">' +
        '<span class="dot dot--journal"></span>' +
        '<span class="t-label c-3">JOURNAL</span>' +
        '<span class="t-label c-3">·</span>' +
        '<span class="t-label c-3">NEUER EINTRAG</span>' +
      '</div>' +
      '<section class="card card--flat" style="margin-top:11px; padding:11px 13px">' +
        '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">' +
          '<span class="dot dot--journal"></span>' +
          '<span class="t-label c-3">IMPULS FÜR HEUTE</span>' +
        '</div>' +
        '<p class="t-body" style="margin:0 0 8px">Über den Versuch vom ' +
          '<span class="num">6. November</span> steht noch nichts.</p>' +
        '<span class="origin"><span class="dot dot--canvas"></span>Messreihe Probe 1–5</span>' +
      '</section>' +
      '<h1 class="serif--screen-title" style="margin:15px 0 0">' + (datum || HEUTE.lang) + '</h1>' +
      '<div style="margin-top:11px">' +
        '<p class="serif--voice" style="margin:0">' + marke() + '</p>' +
      '</div>';

    /* Die Nebenspalte des Eintrags trägt sonst Fäden, Fotos, Stimmung. Ein
       Eintrag, der noch keinen Satz hat, hat davon nichts. */
    var spalte = artikel.nextElementSibling;
    if (spalte) {
      spalte.innerHTML =
        '<div style="display:flex; flex-direction:column; gap:7px; padding:2px">' +
          '<span class="t-label c-3">NOCH NICHTS VERBUNDEN</span>' +
          '<p class="t-sub c-3" style="margin:0">Fotos, Orte und die Fäden zu Notizen ' +
          'und Aufgaben hängen sich an, sobald der Eintrag steht.</p>' +
        '</div>';
    }
    beleben_ikonen(artikel);
  };

  /* ── AUFGABE ────────────────────────────────────────────────────────────
     Kein fertiges Objekt, sondern die offene Erfassungszeile mit dem Fokus.
     Das ist bei Aufgaben der ehrlichere Weg: eine Aufgabe ohne Satz ist keine.
     Was danach kommt, steht in §12e. */
  BAU.aufgabe = function (rahmen) { erfassungOeffnen(rahmen, true); };

  /* ── LERNKARTEN-DECK ────────────────────────────────────────────────────
     Ein neues Deck vorn, Titel leer, drei Zähler auf null, kein
     Herkunfts-Chip: es ist aus keiner Notiz entstanden, also gibt es nichts
     zu zeichnen. Kein Faden ohne echte Beziehung. */
  BAU.deck = function (rahmen, geraet) {
    var kopf = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('.divider'), function (d) {
      if (!kopf && /DECKS/.test(textVon(d))) kopf = d;
    });
    var spalte = null, davor = null;
    if (kopf) {
      davor = kopf;
      while (davor.parentElement && !davor.parentElement.querySelector(':scope > section.card')) davor = davor.parentElement;
      spalte = davor.parentElement;
    }
    if (!spalte) {
      var erste = rahmen.querySelector('section.card');
      if (!erste) return;
      spalte = erste.parentElement;
      davor = null;
    }

    var karte = bau(
      '<section class="card pv-waechst" style="padding:9px 14px 10px">' +
        /* Kein Modul-Punkt im Kopf: die vier gezeichneten Decks tragen dort
           auch keinen, und ein Punkt neben einem leeren Titel stünde allein. */
        '<div class="card__head" style="margin-bottom:7px; gap:10px; min-width:0">' +
          '<span class="t-section" style="white-space:nowrap">' + marke() + '</span>' +
          '<div style="flex:1 1 auto"></div>' +
          '<span class="t-label c-3">NEU · ' + HEUTE.tag + '</span>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:0">' +
          '<span class="count"><span class="count__n num">0</span><span class="count__w t-sub">Neu</span></span>' +
          '<span class="t-sub c-3" style="margin:0 8px">·</span>' +
          '<span class="count"><span class="count__n num">0</span><span class="count__w t-sub">Wiederholen</span></span>' +
          '<span class="t-sub c-3" style="margin:0 8px">·</span>' +
          '<span class="count"><span class="count__n num">0</span><span class="count__w t-sub">Gelernt</span></span>' +
          '<div style="flex:1 1 auto"></div>' +
          '<span class="t-sub c-3">Noch keine Karten</span>' +
        '</div>' +
      '</section>');

    if (davor && davor.parentElement === spalte) spalte.insertBefore(karte, davor.nextSibling);
    else spalte.insertBefore(karte, spalte.firstElementChild);

    if (kopf) zahlHochzaehlen(kopf, 1);
    beleben_ikonen(karte);
  };

  /* ── CANVAS-BLATT ───────────────────────────────────────────────────────
     Das Canvas ist ein eigenständiges Mockup im Rahmen (§11a) und bringt
     seine leere Fläche selbst mit. Hier ist nichts zu bauen — der Weg dorthin
     IST das neue Blatt. */
  BAU.blatt = function () {};

  /* ── 12e · Die Erfassungszeile ───────────────────────────────────────────
     Der einzige Ort im Prototyp, an dem wirklich getippt wird. Das Schaubild
     zeigt sie im Zustand „getippt", mit einem fertigen Satz und der Auswertung
     darunter — das ist der Beweis für natürliche Sprache und gehört ins Bild.
     Begehbar muss sie leer anfangen und den Fokus haben.

     „Sichern" trägt die Aufgabe in ihre Gruppe ein. In die GRUPPE, nicht in
     die Herkunfts-Klammer: die Klammer sagt, aus welcher Notiz die Aufgaben
     stammen, und eine gerade getippte stammt aus keiner. Ein Faden dorthin
     wäre erfunden. */

  function erfassungOeffnen(rahmen, fokus) {
    var feld = erfassungszeile(rahmen);
    if (!feld) return;
    schmutzig(rahmen);

    var eingabe = feld.querySelector('.pv-eingabe');
    if (!eingabe) {
      /* Was im Schaubild als Text dasteht, wird hier zum Feld. Alles zwischen
         dem Pluszeichen und dem Mikrofon geht — es war der getippte Satz. */
      var kinder = Array.prototype.slice.call(feld.childNodes);
      var plus = feld.querySelector('.ico[data-ico="plus"]');
      var mic  = feld.querySelector('.ico[data-ico="mic"]');
      kinder.forEach(function (n) { if (n !== plus && n !== mic) feld.removeChild(n); });
      /* Das Feld war für §4 ein Knopf (beleben() hängt einem <div> role und
         Tabstopp an). Jetzt steht ein echtes Eingabefeld darin — ein Knopf,
         in dem ein Feld liegt, ist für einen Bildschirmleser Unsinn. */
      feld.removeAttribute('role');
      feld.removeAttribute('tabindex');
      eingabe = DOK.createElement('input');
      eingabe.type = 'text';
      eingabe.className = 'pv-eingabe';
      eingabe.setAttribute('placeholder', 'Aufgabe in einem Satz erfassen');
      eingabe.setAttribute('aria-label', 'Aufgabe in einem Satz erfassen');
      if (plus) feld.insertBefore(eingabe, plus.nextSibling);
      else feld.insertBefore(eingabe, feld.firstChild);
      feld.classList.add('pv-erfassung-offen');
      feld.style.boxShadow = 'inset 0 0 0 2px var(--accent-ring)';

      /* Die Auswertung („ERKANNT · Morgen 14:00 · #labor …") gehört zu einem
         Satz, der dasteht. Bei leerer Zeile behauptete sie etwas. */
      var karte = feld.closest('section.card') || feld.parentElement;
      var erkannt = null;
      Array.prototype.forEach.call(karte.children, function (c) {
        if (!erkannt && c !== feld.parentElement && /ERKANNT/.test(textVon(c))) erkannt = c;
      });
      if (erkannt) { verbergen(erkannt); feld.__pvErkannt = erkannt; }

      eingabe.addEventListener('input', function () { erfassungPruefen(rahmen); });
      eingabe.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); aufgabeSichern(rahmen); }
        if (e.key === 'Escape') { e.preventDefault(); eingabe.blur(); }
      });
    }

    /* „Sichern" gibt es am iPad im Schaubild; das iPhone trägt die Zeile in
       der Daumenzone und bekommt den Knopf erst, wenn sie offen ist — so wie
       das System es dort tut, wenn die Tastatur kommt. */
    var sichern = erfassungKnopf(rahmen, feld);
    if (sichern) {
      beleben(sichern, {
        ziel: 'nichts',
        wirkt: 'trägt die Aufgabe in ihre Gruppe ein',
        titel: 'Aufgabe sichern',
        tun: function () { aufgabeSichern(rahmen); },
      });
    }
    erfassungPruefen(rahmen);
    if (fokus) { try { eingabe.focus({ preventScroll: true }); } catch (e) { eingabe.focus(); } }
  }

  function erfassungKnopf(rahmen, feld) {
    var karte = feld.closest('section.card') || feld.parentElement;
    var vorhanden = null;
    Array.prototype.forEach.call(karte.querySelectorAll('button'), function (b) {
      if (!vorhanden && /^Sichern$/.test(textVon(b))) vorhanden = b;
    });
    if (vorhanden) return vorhanden;
    /* Das iPhone trägt die Zeile allein in der Daumenzone. Der Knopf kommt
       NEBEN sie, nicht darunter — untereinander wären es zwei Zeilen, wo das
       System eine hat. */
    var reihe = feld.parentElement || karte;
    var neu = bau('<button class="btn btn--primary btn--sm" style="flex:none">Sichern</button>');
    reihe.style.display = 'flex';
    reihe.style.alignItems = 'center';
    reihe.style.gap = '8px';
    feld.style.flex = '1 1 auto';
    feld.style.minWidth = '0';
    reihe.appendChild(neu);
    return neu;
  }

  function erfassungPruefen(rahmen) {
    var feld = erfassungszeile(rahmen);
    if (!feld) return;
    var eingabe = feld.querySelector('.pv-eingabe');
    var karte = feld.closest('section.card') || feld.parentElement;
    var knopf = null;
    Array.prototype.forEach.call(karte.querySelectorAll('button'), function (b) {
      if (!knopf && /^Sichern$/.test(textVon(b))) knopf = b;
    });
    var etwas = !!(eingabe && eingabe.value.trim());
    /* Ein leerer Satz ist keine Aufgabe. „Sichern" ist dann nicht nur blass,
       sondern wirklich kein Ziel: kein Klickfinger, kein Tabstopp — sonst
       stünde hier wieder ein Knopf, der aussieht, als täte er etwas. */
    if (knopf) {
      knopf.classList.toggle('is-disabled', !etwas);
      knopf.setAttribute('aria-disabled', String(!etwas));
      if (etwas) {
        knopf.classList.add('pv-lebt');
        knopf.removeAttribute('tabindex');
      } else {
        knopf.classList.remove('pv-lebt');
        knopf.setAttribute('tabindex', '-1');
      }
      markenAuffrischen();
    }
    if (feld.__pvErkannt) {
      verbergen(feld.__pvErkannt, etwas ? false : true);
      if (etwas) {
        feld.__pvErkannt.innerHTML =
          '<span class="t-label c-3" style="letter-spacing:.05em">ERKANNT</span>' +
          '<span class="chip"><span class="dot" style="background:var(--ink-2)"></span>Bereich Biologie</span>' +
          '<span style="flex:1"></span>' +
          '<span class="t-label c-3" style="white-space:nowrap">Landet in der Gruppe Biologie</span>';
        beleben_ikonen(feld.__pvErkannt);
      }
    }
  }

  /* Die Gruppe, in die eine frisch getippte Aufgabe gehört: die erste
     Bereichskarte des Schirms. Gefunden über ihr Wort, nicht über ihre Stelle. */
  function gruppeBiologie(rahmen) {
    var karte = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('section.card'), function (k) {
      if (karte) return;
      var kopf = k.firstElementChild;
      if (kopf && /^Biologie/.test(textVon(kopf))) karte = k;
    });
    return karte;
  }

  function aufgabeSichern(rahmen) {
    var feld = erfassungszeile(rahmen);
    if (!feld) return;
    var eingabe = feld.querySelector('.pv-eingabe');
    var satz = eingabe ? eingabe.value.trim() : '';
    if (!satz) { if (eingabe) eingabe.focus(); return; }

    var gruppe = gruppeBiologie(rahmen);
    if (!gruppe) return;
    schmutzig(rahmen);

    var zeile = bau(
      '<div class="row" style="padding:6px 12px">' +
        '<span class="check"></span>' +
        '<div class="row__main">' +
          '<span class="t-body row__title"></span>' +
          '<span class="t-sub c-3">gerade erfasst · ' + HEUTE.kurz + '</span>' +
        '</div>' +
      '</div>');
    zeile.querySelector('.row__title').textContent = satz;

    /* Die Zeile schiebt die Lücke auf, statt plötzlich dazustehen — das
       Gegenstück zur Lücke, die sich hinter einer erledigten Aufgabe
       schließt (bewegung.css §2.4). */
    var huelle = DOK.createElement('div');
    huelle.className = 'pv-luecke-auf';
    huelle.appendChild(zeile);
    gruppe.appendChild(huelle);
    var hoehe = zeile.offsetHeight;
    global.requestAnimationFrame(function () {
      huelle.classList.add('is-offen');
      huelle.style.height = hoehe + 'px';
    });
    /* Danach die Klasse abnehmen, nicht nur die Höhe: .pv-luecke-auf trägt
       height:0 in der Regel selbst — eine geleerte Inline-Höhe fiele darauf
       zurück, und die Zeile stünde in einer Hülle von null Höhe. */
    global.setTimeout(function () {
      huelle.classList.remove('pv-luecke-auf', 'is-offen');
      huelle.style.height = '';
      huelle.style.overflow = '';
    }, tempo(260) + 60);

    zahlHochzaehlen(gruppe.firstElementChild, 1);
    /* Die Zeile ist ein echter Gegenstand: sie führt ins Aufgaben-Detail,
       wie jede andere Zeile dieser Liste auch. */
    beleben(zeile, { ziel: 'aufgabe', richtung: 'vor', titel: 'Aufgabe „' + satz + '" öffnet das Detail' });
    beleben_ikonen(zeile);

    eingabe.value = '';
    erfassungPruefen(rahmen);
    eingabe.focus();
    sagen('Aufgabe gesichert: ' + satz);
    global.setTimeout(markenAuffrischen, tempo(300));
  }

  /* Escape schließt erst das Menü, dann den Schirm. Ohne diese Zeile führte
     die Taste aus dem Schirm heraus, während ein Menü offen davorsteht. */
  DOK.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !offenesMenue) return;
    var k = offenesMenue.knopf;
    e.preventDefault();
    e.stopPropagation();
    menueSchliessen();
    if (k) { try { k.focus({ preventScroll: true }); } catch (x) { k.focus(); } }
  }, true);

  /* ══════════════════════════════════════════════════════════════════════
   * 13 · DER REST DER TOTEN KNÖPFE
   *
   * Die Frage an jedes Element lautet: WÄRE EIN FREMDER ÜBERRASCHT, DASS ES
   * NICHTS TUT? Wo die Antwort ja ist, muss es entweder führen oder an Ort
   * und Stelle wirken. Wo sie nein ist — ein Filter-Chip, ein Sortiermenü,
   * ein Zahnrad in einer Nebenspalte —, bleibt es entschärft, und das ist
   * dann Absicht und nicht Vergessen.
   *
   * „Wirkt an Ort und Stelle" heißt SICHTBAR. Ein Umschalter, der seine
   * Auswahl verschiebt, ohne dass sich der Inhalt ändert, ist dieselbe Lüge
   * wie ein toter Knopf mit Klickfinger — nur teurer, weil man ihr glaubt.
   * Deshalb baut Raster→Liste wirklich eine Liste, streicht der Papierkorb
   * wirklich durch, und der Zoom im Graphen ändert wirklich den Maßstab.
   * ==================================================================== */

  function wirkKnoepfe(rahmen, geraet) {
    var schirm = rahmen.getAttribute('data-pv-screen');

    if (schirm === 'bibliothek')    regalUmschalterBeleben(rahmen);
    if (schirm === 'aufgabe')       loeschenBeleben(rahmen);
    if (schirm === 'einstellungen') synchronisierungBeleben(rahmen);
    if (schirm === 'graph')         graphBeleben(rahmen);
    if (schirm === 'semester')      lernplanBeleben(rahmen);
    if (schirm === 'eingang')       wohinBeleben(rahmen);
    if (schirm === 'leere-zustaende') leereZustaendeBeleben(rahmen);

    uebergabeleisteBeleben(rahmen);
    eigenschaftsKnoepfeBeleben(rahmen);
  }

  /* ── 13a · Raster ↔ Liste ────────────────────────────────────────────────
     Der Umschalter im Kopf der Bibliothek. Er ist der Fall, den das
     Gestaltungssystem meint, wenn es „wirkt an Ort und Stelle" sagt: dieselben
     achtzehn Notizbücher, eine andere Ordnung im Bild.

     Die Liste wird aus den Büchern gebaut, die dastehen — Deckelpapier,
     Titel, Modul, Seitenzahl, Datum stehen alle im Regal. Und jede Zeile
     bekommt den Weg IHRES Buches: wer in der Liste auf „Laborjournal" tippt,
     landet im Journal, genau wie im Raster. Ein Umschalter, hinter dem die
     Wege verschwinden, hätte den Schirm ärmer gemacht statt reicher. */
  function regalUmschalterBeleben(rahmen) {
    var segment = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('.segmented'), function (s) {
      if (!segment && /Raster/.test(textVon(s))) segment = s;
    });
    if (!segment) return;
    var knoepfe = Array.prototype.slice.call(segment.querySelectorAll('button'));
    knoepfe.forEach(function (k) {
      var alsListe = /Liste/.test(textVon(k));
      beleben(k, {
        ziel: 'nichts',
        wirkt: alsListe ? 'zeigt die Liste' : 'zeigt das Regal',
        titel: alsListe ? 'Notizbücher als Liste' : 'Notizbücher als Raster',
        tun: function () {
          schmutzig(rahmen);
          knoepfe.forEach(function (b) { b.classList.toggle('is-on', b === k); });
          regalZeigen(rahmen, alsListe);
        },
      });
    });
  }

  function regalZeigen(rahmen, alsListe) {
    var regal = rahmen.querySelector('.shelf');
    if (!regal) return;
    var alt = rahmen.querySelector('.pv-regalliste');
    if (!alsListe) {
      if (alt) alt.remove();
      verbergen(regal, false);
      markenAuffrischen();
      return;
    }
    if (alt) return;

    var liste = DOK.createElement('div');
    liste.className = 'pv-regalliste';
    Array.prototype.forEach.call(regal.querySelectorAll('.book'), function (buch) {
      var deckel = buch.querySelector('.book__cover');
      var titel  = buch.querySelector('.book__title');
      var metas  = buch.querySelectorAll('.book__meta');
      var modul  = metas[0] ? textVon(metas[0]) : '';
      var punkt  = metas[0] && metas[0].querySelector('.dot');
      var teile  = metas[1] ? Array.prototype.map.call(metas[1].children, textVon) : [];

      var zeile = bau(
        '<div class="pv-regalzeile">' +
          '<span class="pv-regaldeckel"></span>' +
          '<span style="flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px">' +
            '<span class="t-body is-strong clamp-1 pv-regaltitel"></span>' +
            '<span class="t-label c-3" style="display:flex; align-items:center; gap:6px">' +
              (punkt ? '<span class="' + punkt.className + '"></span>' : '') +
              '<span class="pv-regalmodul"></span>' +
            '</span>' +
          '</span>' +
          '<span class="t-label c-3 num" style="flex:none">' + (teile[0] || '') + '</span>' +
          '<span class="t-label c-3 num" style="flex:none; min-width:52px; text-align:right">' + (teile[1] || '') + '</span>' +
        '</div>');
      /* Der Titel trägt weiche Trennstriche (Zell&shy;biologie); als Text
         gelesen bleiben sie unsichtbar und trennen in der Zeile nicht mehr. */
      zeile.querySelector('.pv-regaltitel').textContent = titel ? titel.textContent.replace(/­/g, '') : '';
      zeile.querySelector('.pv-regalmodul').textContent = modul;
      var d = zeile.querySelector('.pv-regaldeckel');
      if (deckel) {
        /* Dasselbe Papier wie am Deckel — die Klasse trägt --book-paper.
           Zwei Notizbücher tragen statt Papier ein Foto; ohne diese Zeile
           stünden sie als weiße Rechtecke in der Liste. */
        deckel.className.split(/\s+/).forEach(function (c) { if (/^paper--/.test(c)) d.classList.add(c); });
        var foto = deckel.querySelector('img.book__photo');
        if (foto) d.style.backgroundImage = 'url("' + foto.getAttribute('src') + '")';
      }
      if (buch.__pvWeg) beleben(zeile, buch.__pvWeg);
      liste.appendChild(zeile);
    });

    verbergen(regal);
    regal.parentNode.insertBefore(liste, regal.nextSibling);
    beleben_ikonen(liste);
    markenAuffrischen();
  }

  /* ── 13b · Der Papierkorb ────────────────────────────────────────────────
     Er streicht die Zeile durch und bietet Widerrufen an. Nicht mehr: eine
     Aufgabe, die beim Tap verschwände, nähme dem Widerruf sein Gegenüber. */
  function loeschenBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.btn--danger'), function (k) {
      if (!/Löschen/.test(textVon(k))) return;
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'streicht die Aufgabe durch · Widerrufen',
        titel: 'Aufgabe löschen',
        tun: function (el) { aufgabeLoeschen(rahmen, el); },
      });
    });
  }

  /* Welcher Titel gemeint ist: der der aufgeklappten Karte, in der der Knopf
     steht. Steht er in der Leiste am unteren Rand (iPhone), ist es der Titel
     im Feld — der einzige, der eine Schreibmarke hinter sich hat. */
  function aufgabenTitel(rahmen, knopf) {
    var box = knopf.closest('article') || rahmen;
    /* Der iPhone-Schirm trägt ZWEI aufgeklappte Karten übereinander — eine
       davon steht auf hidden, weil sie nur das Ziel einer Bewegung ist. Ohne
       die Sichtprüfung striche der Papierkorb den Titel durch, den niemand
       sieht, und der Schirm bliebe unverändert: der Knopf sähe aus, als täte
       er nichts, obwohl er alles getan hat. */
    var wege = ['.field .t-body.is-strong', '.t-body.is-strong', '.row__title'];
    for (var i = 0; i < wege.length; i++) {
      var treffer = box.querySelectorAll(wege[i]);
      for (var j = 0; j < treffer.length; j++) {
        if (treffer[j].getClientRects().length) return treffer[j];
      }
    }
    return null;
  }

  function aufgabeLoeschen(rahmen, knopf) {
    var titel = aufgabenTitel(rahmen, knopf);
    if (!titel) return;
    schmutzig(rahmen);
    var traeger = knopf.closest('article') || titel.closest('.card, .row') || titel;
    titel.classList.add('pv-gestrichen');
    traeger.classList.add('pv-verblasst');
    widerrufZeigen(rahmen, 'Aufgabe gelöscht', function () {
      titel.classList.remove('pv-gestrichen');
      traeger.classList.remove('pv-verblasst');
    });
    sagen('Gelöscht: ' + textVon(titel) + ' — Widerrufen steht bereit.');
  }

  /* Die Widerruf-Leiste. Eine je Gerät, sie ersetzt sich selbst. Sie geht,
     wenn man widerruft — und mit dem Schirm, wenn man ihn verlässt (§5e). */
  function widerrufZeigen(rahmen, satz, zurueckNehmen) {
    var buehne = rahmen.querySelector('.screen') || rahmen;
    var alt = buehne.querySelector('.pv-widerruf');
    if (alt) alt.remove();

    var leiste = bau(
      '<div class="pv-widerruf" role="status">' +
        '<span class="t-sub c-1 pv-widerruf__satz"></span>' +
        '<button class="btn btn--sm">Widerrufen</button>' +
      '</div>');
    leiste.querySelector('.pv-widerruf__satz').textContent = satz;
    /* Am unteren Rand des Geräts — auf dem iPhone über Aktionsleiste,
       Tab-Leiste und Home-Indicator, auf dem iPad, wo nichts steht. */
    leiste.style.bottom = rahmen.getAttribute('data-pv-geraet') === 'iphone' ? '134px' : '22px';
    buehne.appendChild(leiste);

    var knopf = leiste.querySelector('button');
    beleben(knopf, {
      ziel: 'nichts',
      wirkt: 'nimmt das Löschen zurück',
      titel: 'Widerrufen',
      tun: function () {
        zurueckNehmen();
        leiste.remove();
        sagen('Widerrufen.');
        markenAuffrischen();
      },
    });
    markenAuffrischen();
  }

  /* ── 13c · „Erneut versuchen" ────────────────────────────────────────────
     Der einzige Knopf im ganzen Entwurf, der einen Fehler wegräumt. Er tut es
     jetzt: der rote Kasten wird ein grauer Satz mit Häkchen, und die drei
     wartenden Änderungen sind durch. */
  function synchronisierungBeleben(rahmen) {
    var kasten = rahmen.querySelector('.notice--error');
    if (!kasten) return;
    var knopf = kasten.querySelector('button');
    if (!knopf) return;
    beleben(knopf, {
      ziel: 'nichts',
      wirkt: 'synchronisiert erneut — der Fehler geht',
      titel: 'Erneut synchronisieren',
      tun: function () {
        schmutzig(rahmen);
        kasten.classList.remove('notice--error');
        kasten.style.boxShadow = 'inset 0 0 0 1px var(--line)';
        kasten.innerHTML =
          ikon('check', 20) +
          '<div class="notice__text" style="flex:1; min-width:0">' +
            '<div class="t-sub is-strong">Synchronisiert</div>' +
            '<div class="t-sub c-2 clamp-1">3 Änderungen übertragen · gerade eben</div>' +
          '</div>';
        beleben_ikonen(kasten);
        sagen('Synchronisiert — 3 Änderungen übertragen.');
        markenAuffrischen();
      },
    });
  }

  /* ── 13d · Der Zoom im Graphen ───────────────────────────────────────────
     Ein Plus neben einem Minus und einer Prozentzahl ist kein Erzeugen-Knopf,
     sondern ein Maßstab. Er wirkt an Ort und Stelle: das Feld wächst, die
     Zahl geht mit. Fünf Stufen, wie sie jede Karte hat. */
  var ZOOMSTUFEN = [60, 80, 100, 125, 160];

  function graphBeleben(rahmen) {
    var feld = rahmen.querySelector('.gscroll');
    var minus = null, plus = null, zahl = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('.iconbtn'), function (k) {
      if (k.querySelector('.ico[data-ico="minus"]')) minus = k;
      if (k.querySelector('.ico[data-ico="plus"]'))  plus = k;
    });
    if (feld && minus && plus) {
      var leiste = plus.parentElement;
      Array.prototype.forEach.call(leiste.querySelectorAll('.num'), function (n) {
        if (!zahl && /%/.test(textVon(n))) zahl = n;
      });
      var stellen = function (richtung) {
        schmutzig(rahmen);
        var i = ZOOMSTUFEN.indexOf(rahmen.__pvZoom || 100);
        if (i < 0) i = 2;
        i = Math.max(0, Math.min(ZOOMSTUFEN.length - 1, i + richtung));
        rahmen.__pvZoom = ZOOMSTUFEN[i];
        feld.style.transformOrigin = '0 0';
        feld.style.transition = 'transform var(--bw-d-oeffnen) var(--bw-e-standard)';
        feld.style.transform = 'scale(' + (ZOOMSTUFEN[i] / 100) + ')';
        if (zahl) zahl.textContent = ZOOMSTUFEN[i] + ' %';
        minus.classList.toggle('is-off', i === 0);
        plus.classList.toggle('is-off', i === ZOOMSTUFEN.length - 1);
        markenAuffrischen();
      };
      beleben(minus, { ziel: 'nichts', wirkt: 'zoomt heraus', titel: 'Kleiner', tun: function () { stellen(-1); } });
      beleben(plus,  { ziel: 'nichts', wirkt: 'zoomt heran',  titel: 'Größer',  tun: function () { stellen(1); } });
    }

    /* Das Schließkreuz am Inspektor. Ein Kreuz, das nicht schließt, ist der
       eindeutigste Fall dieser Runde. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.iconbtn'), function (k) {
      if (!k.querySelector('.ico[data-ico="close"]')) return;
      var tafel = k.closest('aside, section, .ginspect');
      if (!tafel || tafel === rahmen) return;
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'schließt den Inspektor',
        titel: 'Inspektor schließen',
        tun: function () {
          schmutzig(rahmen);
          verbergen(tafel);
          markenAuffrischen();
        },
      });
    });
  }

  /* ── 13e · Der Lernplan ──────────────────────────────────────────────────
     Ein gefüllter Ink-Knopf im Semester-Ordner. Er ist kein örtlicher
     Schalter: der Plan, den er nennt, steht im Lernkarten-Schirm — zwölf
     Karten am Tag, drei Zähler, vier Decks. Also führt er dorthin. */
  function lernplanBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.btn--primary'), function (k) {
      if (!/Lernplan/.test(textVon(k))) return;
      if (!leitetAuf('lernkarten')) return;
      beleben(k, {
        ziel: 'lernkarten',
        richtung: 'vor',
        titel: 'Der Lernplan steht bei den Lernkarten',
      });
    });
  }

  /* ── 13f · Die Übergabe-Leiste ───────────────────────────────────────────
     Sie schwebt über der Auswahl und trägt rechts ein Kreuz. Das Kreuz lässt
     die Auswahl los — das ist die eine Handlung, die eine Auswahlleiste immer
     kann, und sie kostet keinen zweiten gezeichneten Zustand.
     „Planen" ist gefüllte Ink: der primäre CTA der Leiste, und damit einer,
     der nach der Auflage dieser Runde nicht tot sein darf. Er plant — die
     ausgewählten Zeilen bekommen ihren Termin und die Leiste geht. */
  function uebergabeleisteBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.handoff'), function (leiste) {
      Array.prototype.forEach.call(leiste.querySelectorAll('.handoff__btn'), function (k) {
        if (k.hasAttribute('data-bw')) return;              /* die Signature-Momente bleiben ihre */
        if (k.classList.contains('pv-lebt')) return;

        if (k.querySelector('.ico[data-ico="close"]')) {
          beleben(k, {
            ziel: 'nichts',
            wirkt: 'lässt die Auswahl los',
            titel: 'Auswahl aufheben',
            tun: function () { auswahlAufheben(rahmen, leiste); },
          });
          return;
        }
        if (!k.classList.contains('is-primary')) return;
        beleben(k, {
          ziel: 'nichts',
          wirkt: 'plant die gewählten Aufgaben',
          titel: 'Gewählte Aufgaben planen',
          tun: function () { auswahlPlanen(rahmen, leiste); },
        });
      });
    });
  }

  function gewaehlteZeilen(rahmen) {
    return Array.prototype.slice.call(rahmen.querySelectorAll('.row.is-selected'));
  }

  function auswahlAufheben(rahmen, leiste) {
    schmutzig(rahmen);
    gewaehlteZeilen(rahmen).forEach(function (z) { z.classList.remove('is-selected'); });
    verbergen(leiste);
    sagen('Auswahl aufgehoben.');
    markenAuffrischen();
  }

  function auswahlPlanen(rahmen, leiste) {
    schmutzig(rahmen);
    var zeilen = gewaehlteZeilen(rahmen);
    zeilen.forEach(function (z) {
      var meta = z.querySelector('.row__meta') || z;
      var chip = bau('<span class="chip pv-waechst">' + ikon('calendar', 13) + 'Geplant morgen</span>');
      meta.insertBefore(chip, meta.firstChild);
      beleben_ikonen(chip);
      z.classList.remove('is-selected');
    });
    verbergen(leiste);
    sagen(zeilen.length + (zeilen.length === 1 ? ' Aufgabe geplant' : ' Aufgaben geplant') + ' — morgen.');
    markenAuffrischen();
  }

  /* ── 13g · Wohin damit ───────────────────────────────────────────────────
     Die drei Chips unter jedem Schnipsel im Eingang. Sie legen die Beziehung
     an, die dem Schnipsel fehlt — und genau das ist im Bild zu sehen: der
     Punkt links am Schnipsel ist HOHL, solange kein Faden an ihm hängt, und
     bekommt die Farbe des Moduls, sobald einer da ist. Schnipsel 3 zeigt den
     Zustand danach; hier wird er erreichbar. Kein Faden ohne echte Beziehung —
     und dies ist eine, weil sie gerade hergestellt wurde. */
  function wohinBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.ei-wohin'), function (reihe) {
      var schnipsel = reihe.closest('.ei-schnipsel');
      var punkt = schnipsel && schnipsel.querySelector('.ei-punkt');
      var chips = Array.prototype.slice.call(reihe.querySelectorAll('.chip'));
      chips.forEach(function (chip) {
        var wort = textVon(chip);
        var eigen = chip.querySelector('.dot');
        var klasse = eigen ? (eigen.className.match(/dot--\w+/) || [''])[0] : 'dot--notes';
        beleben(chip, {
          ziel: 'nichts',
          wirkt: 'legt den Schnipsel als ' + wort + ' ab',
          titel: 'Als ' + wort + ' ablegen',
          tun: function () {
            schmutzig(rahmen);
            chips.forEach(function (c) {
              var an = c === chip;
              c.classList.toggle('chip--solid', an);
              var d = c.querySelector('.dot');
              if (d) d.style.boxShadow = an ? '0 0 0 1px rgba(255,255,255,.5)' : '';
            });
            if (punkt) {
              punkt.classList.remove('dot--hollow');
              punkt.className = punkt.className.replace(/dot--\w+/, klasse || 'dot--notes');
              if (!/dot--/.test(punkt.className)) punkt.classList.add(klasse || 'dot--notes');
              punkt.classList.add('pv-waechst');
              punkt.setAttribute('title', 'hat jetzt einen Faden');
            }
            sagen('Abgelegt als ' + wort + ' — der Punkt ist nicht mehr hohl.');
            markenAuffrischen();
          },
        });
      });
    });
  }

  /* ── 13h · Die leeren Zustände ───────────────────────────────────────────
     Der Schirm zeigt vier leere Zustände nebeneinander; seine Knöpfe sind
     die Wege heraus. „Notiz öffnen" führt in den Editor, „Morgen ansehen" auf
     Heute. Die Erzeugen-Knöpfe darauf hat §12b schon. */
  function leereZustaendeBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.btn'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var wort = textVon(k);
      if (/^Notiz öffnen$/.test(wort) && leitetAuf('notiz')) {
        beleben(k, { ziel: 'notiz', richtung: 'vor', titel: 'Notiz öffnen' });
      } else if (/^Morgen ansehen$/.test(wort) && leitetAuf('heute')) {
        beleben(k, { ziel: 'heute', richtung: 'vor', titel: 'Morgen ansehen' });
      }
    });
  }

  /* ── 13i · Eigenschaften an einem Gegenstand ─────────────────────────────
     „+ Tag", „Schritt hinzufügen", „Verknüpfung hinzufügen" legen keinen
     Gegenstand an, sondern hängen einen an einen, der schon da ist. Sie
     bekommen darum nicht das Menü der sechs Dinge (§12), sondern ihre eigene
     kleine Wirkung — sichtbar, an Ort und Stelle, im Bestand der Geschichte.

     „#osmose" ist kein erfundener Tag: die Notiz handelt auf drei Absätzen
     davon, der Graph kennt den Knoten, die Suche findet ihn. Und die Notiz
     „Osmose" gibt es — das Aufgaben-Detail schlägt sie selbst als Verweis
     vor, der noch nicht gesetzt ist. Beides ist eine echte Kante, sonst
     stünde hier nichts. */
  function eigenschaftsKnoepfeBeleben(rahmen) {
    /* .chip steht mit in der Liste: der „+ Tag"-Chip des Notiz-Editors ist im
       Bestand ein <span>, der des Journal-Eintrags ein <button>. Dasselbe Ding
       in zwei Gestalten — gesucht wird nach dem Zeichen und dem Wort, nicht
       nach dem Element. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('button,[role="button"],.chip'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (!k.querySelector('.ico[data-ico="plus"]')) return;
      var wort = textVon(k);

      if (/^Tag$/.test(wort)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'hängt den Tag #osmose an', titel: 'Tag hinzufügen',
          tun: function () {
            schmutzig(rahmen);
            var chip = bau('<span class="chip pv-waechst">' + ikon('tag', 13) + '#osmose</span>');
            k.parentNode.insertBefore(chip, k);
            beleben_ikonen(chip);
            sagen('Tag #osmose gesetzt.');
            markenAuffrischen();
          },
        });
        return;
      }

      if (/Schritt hinzufügen/.test(wort)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'legt einen leeren Schritt an', titel: 'Schritt hinzufügen',
          tun: function () {
            schmutzig(rahmen);
            var zeile = bau(
              '<div class="pv-waechst" style="display:flex; align-items:center; gap:10px; min-height:44px; padding:2px 0">' +
                '<span class="check"></span>' +
                '<span class="t-body">' + marke() + '</span>' +
              '</div>');
            k.parentNode.insertBefore(zeile, k);
            beleben_ikonen(zeile);
            sagen('Neuer Schritt — schreib ihn auf.');
            markenAuffrischen();
          },
        });
        return;
      }

      if (/Verknüpfung hinzufügen/.test(wort)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'verknüpft die Notiz „Osmose"', titel: 'Verknüpfung hinzufügen',
          tun: function () {
            schmutzig(rahmen);
            var zeile = bau(
              '<button class="row pv-waechst" style="min-height:42px; padding:4px 8px 4px 30px; width:100%">' +
                '<span class="dot dot--notes" style="margin:0 4px"></span>' +
                '<div class="row__main" style="text-align:left">' +
                  '<span class="t-sub c-1">Osmose</span>' +
                  '<span class="t-label c-3">Notiz · gerade verknüpft</span>' +
                '</div>' +
                ikon('chevR', 15) +
              '</button>');
            k.parentNode.insertBefore(zeile, k);
            beleben_ikonen(zeile);
            if (leitetAuf('notiz')) {
              beleben(zeile, { ziel: 'notiz', richtung: 'vor', titel: 'Notiz „Osmose" öffnen' });
            }
            sagen('Verknüpft mit der Notiz „Osmose".');
            markenAuffrischen();
          },
        });
      }
    });
  }

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
    /* Was §12b beim letzten Aufbau als Erzeugen-Knopf gemessen hat — die
       Liste ist gemessen, nicht gepflegt, und darum die einzige Wahrheit
       darüber, wo man in diesem Prototyp etwas anlegen kann. */
    erzeuger:  function () { return erzeugerListe.slice(); },
    erzeugen:  erzeugen,          /* PROTOTYP.erzeugen('notiz')              */
  };
})(window);
