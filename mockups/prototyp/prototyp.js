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
    /* Vor allem anderen: Kästchen ohne Zeile werden zu reinen Haken (§5g).
       Es steht HIER und nicht mehr am Ende von aufbauen(), weil §14s ihnen
       ihren Weg gibt und dafür das Merkmal data-pv-haken schon dastehen
       muss — sonst blieben sie beim ersten Durchgang tot und lebten erst
       nach dem nächsten Aufräumen. */
    kaestchenOhneZeile(rahmen);
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
      /* Ein Blatt, das als „neu und leer" geöffnet wurde, bleibt es nur für
         diesen einen Besuch. Wer danach über die Seitenleiste ins Canvas
         geht, meint das Canvas — nicht sein leeres Blatt. */
      if (f.__pvLeer) {
        f.__pvLeer = 0;
        f.setAttribute('src', f.getAttribute('data-pv-canvas'));
        return;
      }
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

      /* Nennt der Knopf das Ding beim Namen — „Neue Notiz", „Eintrag
         beginnen", „Notizbuch anlegen", „Erste Notiz" —, dann legt er es an.
         Ein Menü dazwischen wäre eine Frage, die der Knopf selbst schon
         beantwortet hat. Nur „Neu" und das nackte Pluszeichen fragen. */
      var d = direktesDing(textVon(k), v);
      if (d) {
        beleben(k, {
          ziel: 'nichts',
          wirkt: 'legt ' + ding(d).wort + ' an',
          titel: ding(d).wort + ' anlegen',
          tun: function (el) { erzeugen(d, el.__pvDatum); },
        });
        erzeugerListe.push({ schirm: schirm, geraet: geraet, wort: textVon(k) || '(Pluszeichen)', vorwahl: d });
        return;
      }

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

  /* Welches der sechs Dinge ein Wortlaut meint — oder keins. */
  var DIREKT = [
    [/^(notiz|neue notiz|erste notiz|zweite notiz)$/i,      'notiz'],
    [/^(notizbuch anlegen|neues notizbuch)$/i,              'notizbuch'],
    [/^(eintrag|eintrag beginnen)$|nachtragen$/i,           'journal'],
    [/^(aufgabe|neue aufgabe|aufgabe hinzufügen)$/i,        'aufgabe'],
    [/^(karte hinzufügen|neues deck)$/i,                    'deck'],
    [/^(neues blatt|canvas-blatt)$/i,                       'blatt'],
  ];

  function direktesDing(wortlaut, vorwahl) {
    var t = (wortlaut || '').replace(/\s+/g, ' ').trim();
    for (var i = 0; i < DIREKT.length; i++) if (DIREKT[i][0].test(t)) return DIREKT[i][1];
    void vorwahl;
    return null;
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
     Das Canvas ist ein eigenständiges Mockup im Rahmen (§11a) — und es bringt
     beim Öffnen seinen Beispielinhalt mit: Überschrift „Whiteboard", zwei
     Haftzettel, eine blaue Ellipse, ein roter Pfeil. Wer im Menü
     „Canvas-Blatt" wählt und DAS bekommt, hat nichts angelegt, sondern
     jemandes fertige Arbeit geöffnet. Das war der schwerste Befund der
     letzten Abnahme.

     Das Canvas kennt seit dieser Runde ?leer=1 (js/app.js): dann bleibt der
     Beispielinhalt aus, und auch der gespeicherte Stand wird nicht geladen.
     Hier wird der Rahmen darauf umgestellt — und beim nächsten regulären
     Besuch des Canvas-Schirms wieder zurück. */
  BAU.blatt = function (rahmen) {
    var f = rahmen ? rahmen.querySelector('iframe[data-pv-canvas]') : null;
    if (!f) return;
    var quelle = f.getAttribute('data-pv-canvas') || '../../index.html';
    var neuQuelle = quelle + (quelle.indexOf('?') < 0 ? '?' : '&') + 'leer=1';
    f.setAttribute('src', neuQuelle);
    f.__pvLeer = 1;
    sagen('Neues Canvas-Blatt — leer. Der Stift liegt bereit.');
  };

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
        var fund = erkennen(eingabe.value);
        feld.__pvErkannt.innerHTML =
          '<span class="t-label c-3" style="letter-spacing:.05em">ERKANNT</span>' +
          fund.chips.map(function (c) {
            return '<span class="chip">' +
              (c.punkt ? '<span class="dot dot--' + c.punkt + '"></span>'
                       : '<span class="dot" style="background:var(--ink-2)"></span>') +
              c.wort + '</span>';
          }).join('') +
          '<span style="flex:1"></span>' +
          '<span class="t-label c-3" style="white-space:nowrap">' + fund.satz + '</span>';
        beleben_ikonen(feld.__pvErkannt);
        feld.__pvFund = fund;
      }
    }
  }

  /* ── Was in einem Satz steckt ────────────────────────────────────────────
     Die Erfassungszeile behauptet, natürliche Sprache zu verstehen. Bis eben
     behauptete sie das mit einem festen Text: egal was man tippte, es stand
     „Bereich Biologie · Landet in der Gruppe Biologie" darunter. Wer „Milch
     kaufen" tippt und Biologie liest, glaubt der Zeile nie wieder etwas.

     Erkannt wird, was ein Studienalltag hergibt: ein Tag, eine Uhrzeit, ein
     Tag der Woche, eine Dringlichkeit, ein Bereich, ein Name. Was übrig
     bleibt, ist der Titel. Nichts davon ist Sprachmodell — es sind sechs
     Regeln, und sie sind ehrlicher als ein fester Satz. */
  var WOCHENTAGE = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
  var BEREICHE = [
    { muster: /\bbio|zell|labor|mikroskop|kultur|praktikum|protokoll/i, wort: 'Biologie' },
    { muster: /analysis|mathe|übungsblatt|beweis|grenzwert|statistik/i,  wort: 'Analysis II' },
    { muster: /sozio|bourdieu|kapital|lesenotiz/i,                       wort: 'Soziologie' },
  ];
  var NAMEN = /\b(Jana|Milan|Emil|Prof\.? ?Wendt|Wendt)\b/i;

  function erkennen(text) {
    var chips = [];
    var rest = ' ' + text + ' ';

    var tag = text.match(/#[\wäöüß/-]+/);
    if (tag) { chips.push({ wort: tag[0] }); rest = rest.replace(tag[0], ' '); }

    var zeit = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*Uhr\b/i) || text.match(/\b(\d{1,2}):(\d{2})\b/);
    var wann = null;
    if (/\bübermorgen\b/i.test(text)) wann = 'Übermorgen';
    else if (/\bmorgen\b/i.test(text)) wann = 'Morgen';
    else if (/\bheute\b/i.test(text)) wann = 'Heute';
    else if (/\bnächste[nr]? Woche\b/i.test(text)) wann = 'Nächste Woche';
    else {
      for (var i = 0; i < WOCHENTAGE.length; i++) {
        if (new RegExp('\\b' + WOCHENTAGE[i], 'i').test(text)) {
          wann = WOCHENTAGE[i].charAt(0).toUpperCase() + WOCHENTAGE[i].slice(1);
          break;
        }
      }
    }
    var datum = text.match(/\b(\d{1,2})\.\s?(\d{1,2})\.?/);
    if (!wann && datum) wann = datum[1] + '. ' + ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sept.','Okt.','Nov.','Dez.'][Math.max(0, Math.min(11, +datum[2] - 1))];
    if (wann || zeit) {
      var uhr = zeit ? (zeit[1].length < 2 ? '0' : '') + zeit[1] + ':' + (zeit[2] || '00') : null;
      chips.push({ wort: [wann, uhr].filter(Boolean).join(' · '), punkt: 'tasks' });
    }

    var ruf = text.match(/!{1,3}/);
    if (ruf) chips.push({ wort: ruf[0].length >= 3 ? 'Hohe Priorität' : ruf[0].length === 2 ? 'Mittlere Priorität' : 'Markiert' });

    var bereich = null;
    for (var b = 0; b < BEREICHE.length; b++) {
      if (BEREICHE[b].muster.test(text)) { bereich = BEREICHE[b].wort; break; }
    }
    if (bereich) chips.push({ wort: 'Bereich ' + bereich, punkt: 'notes' });

    var name = text.match(NAMEN);
    if (name) chips.push({ wort: name[0].replace(/^prof\.? ?/i, 'Prof. ') });

    if (!chips.length) chips.push({ wort: 'Nur ein Titel' });

    var satz = bereich ? 'Landet in der Gruppe ' + bereich
      : wann ? 'Landet unter „' + wann + '"'
      : 'Landet im Eingang — ohne Gruppe, ohne Termin';
    return { chips: chips, satz: satz, bereich: bereich, wann: wann };
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

    /* §14 zuletzt: was hier belebt wird, prüft vorher auf .pv-lebt und
       überschreibt darum keinen Weg, den die Karte oder §13 schon gesetzt
       hat. Umgekehrt wäre die Reihenfolge falsch. */
    zweiteRunde(rahmen, geraet);
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
   * 14 · DIE ZWEITE RUNDE — was danach aussieht, reagiert
   *
   * Die Messung nach der Erzeugen-Runde ergab 207 echte <button>, die
   * dastanden wie Bedienung und keine waren. Die Regel aus §4 („was keinen
   * Weg hat, zeigt keinen Klickfinger") hatte eine Lücke: sie entschärft
   * Beiwerk, aber ein Umschalter, eine Seitenleiste, ein Filterchip und ein
   * Symbol in der Leiste sind kein Beiwerk. Wer sie sieht, drückt sie.
   *
   * Darum gilt ab hier die schärfere Fassung:
   *
   *     Ein <button> im Prototyp hat entweder einen Weg, oder eine sichtbare
   *     Wirkung an Ort und Stelle, oder er ist kein <button>.
   *
   * Und die Wirkung muss man SEHEN — nicht nur im Fußtext lesen. Jede
   * Handlung hier verändert das Bild: eine Auswahl wandert, eine Liste
   * ordnet sich um, eine Tafel klappt auf, ein Menü steht offen.
   *
   * Was hier NICHT passiert: erfinden. Jede Ansicht wird aus dem gebaut, was
   * im Schirm schon steht — die Aufgabenzeilen werden umgehängt, nicht
   * nachgezeichnet; das Journal-Raster nimmt die Bilder der Einträge; die
   * Suche filtert die Fundstellen, die dastehen. Ein Board mit erfundenen
   * Karten wäre schneller gebaut und wäre gelogen.
   * ==================================================================== */

  /* ── 14a · Werkzeug ────────────────────────────────────────────────────── */

  /* Ein Menü aus freien Einträgen — dieselbe Hülle wie das Erzeugen-Menü
     (§12c), nur ohne die sechs Dinge. Auf dem iPhone ein Blatt von unten,
     auf dem iPad ein Popover am Knopf. */
  function listenmenue(knopf, kopf, eintraege) {
    menueSchliessen();
    var rahmen = knopf.closest('.pv-screen');
    if (!rahmen) return;
    var buehne = rahmen.querySelector('.screen') || rahmen;
    var blatt = rahmen.getAttribute('data-pv-geraet') === 'iphone';

    var vorhang = DOK.createElement('div');
    vorhang.className = 'pv-menue__vorhang' + (blatt ? ' pv-menue__vorhang--dunkel' : '');
    vorhang.addEventListener('click', menueSchliessen);

    var huelle = DOK.createElement('div');
    huelle.className = 'pv-menue ' + (blatt ? 'pv-menue--blatt' : 'pv-menue--popover');
    huelle.setAttribute('role', 'menu');
    huelle.setAttribute('aria-label', kopf);

    var kasten = DOK.createElement('div');
    kasten.className = 'pv-menue__kasten';
    huelle.appendChild(kasten);
    if (blatt) kasten.appendChild(bau('<div class="pv-menue__griff"></div>'));
    kasten.appendChild(bau('<div class="pv-menue__kopf"><span class="t-label c-3"></span></div>'));
    kasten.querySelector('.t-label').textContent = kopf;

    eintraege.forEach(function (e) {
      if (e.trenner) { kasten.appendChild(bau('<div class="pv-menue__trenner"></div>')); return; }
      var zeile = bau(
        '<button class="pv-menue__zeile' + (e.wahl ? ' is-wahl' : '') + '" role="menuitem">' +
          (e.punkt ? '<span class="dot dot--' + e.punkt + '"></span>'
                   : '<span class="ico pv-menue__zeichen" data-ico="' + (e.ico || 'dot') + '" style="width:17px;height:17px"></span>') +
          '<span class="t-body pv-menue__wort"></span>' +
          (e.wahl ? '<span class="ico pv-menue__haken" data-ico="check" style="width:17px;height:17px"></span>' : '') +
        '</button>');
      zeile.querySelector('.pv-menue__wort').textContent = e.wort;
      if (e.gefahr) zeile.classList.add('is-gefahr');
      kasten.appendChild(zeile);
      beleben(zeile, {
        ziel: 'nichts',
        titel: e.wort,
        tun: function () {
          menueSchliessen();
          if (e.tun) e.tun();
        },
      });
    });

    beleben_ikonen(kasten);
    buehne.appendChild(vorhang);
    buehne.appendChild(huelle);
    if (!blatt) popoverStellen(huelle, kasten, knopf, buehne, rahmen);
    knopf.setAttribute('aria-expanded', 'true');
    offenesMenue = { knopf: knopf, kasten: huelle, vorhang: vorhang };
    var erste = kasten.querySelector('.pv-menue__zeile');
    if (erste) { try { erste.focus({ preventScroll: true }); } catch (e2) { erste.focus(); } }
    markenAuffrischen();
  }

  /* Ein Wort, klein geschrieben und ohne Zähler — „Notizen 6" und „Notizen"
     sollen dasselbe treffen. */
  function wort(el) {
    return textVon(el).replace(/\s*\d+\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* Eine Fahne, die einmal je Rahmen und Aufgabe gesetzt wird. Ohne sie
     hängte jeder Neuaufbau (§5e) dieselbe Wirkung doppelt an. */
  function einmal(rahmen, name) {
    var k = '__pv_' + name;
    if (rahmen[k]) return false;
    rahmen[k] = 1;
    return true;
  }

  /* Ein kurzer Hinweisstreifen, gebaut wie die Widerruf-Leiste, aber ohne
     Widerruf: für Handlungen, die man in einem Entwurf nicht zu Ende zeichnen
     kann (Teilen, Export, Drucken). Er sagt, WAS passiert wäre, und geht von
     selbst. Das ist die eine Stelle, an der der Prototyp zugibt, dass er
     einer ist — sichtbar, an Ort und Stelle, statt stumm. */
  function hinweis(rahmen, satz, unterzeile) {
    var buehne = rahmen.querySelector('.screen') || rahmen;
    var alt = buehne.querySelector('.pv-hinweis');
    if (alt) alt.remove();
    var streifen = bau(
      '<div class="pv-hinweis" role="status">' +
        '<span class="pv-hinweis__zeichen"></span>' +
        '<span style="display:flex; flex-direction:column; gap:1px; min-width:0">' +
          '<span class="t-sub is-strong pv-hinweis__satz"></span>' +
          (unterzeile ? '<span class="t-label c-3 pv-hinweis__unter"></span>' : '') +
        '</span>' +
      '</div>');
    streifen.querySelector('.pv-hinweis__satz').textContent = satz;
    if (unterzeile) streifen.querySelector('.pv-hinweis__unter').textContent = unterzeile;
    streifen.style.bottom = rahmen.getAttribute('data-pv-geraet') === 'iphone' ? '134px' : '22px';
    buehne.appendChild(streifen);
    schmutzig(rahmen);
    sagen(satz + (unterzeile ? ' · ' + unterzeile : ''));
    global.setTimeout(function () {
      if (streifen.parentNode) { streifen.classList.add('is-weg'); }
      global.setTimeout(function () { if (streifen.parentNode) streifen.remove(); }, 320);
    }, 2600);
    markenAuffrischen();
  }

  /* Eine Tafel, die neben dem Bestand steht und ihn ersetzt, solange sie da
     ist. Sie merkt sich, was sie verdeckt, und gibt es zurück. */
  function tafelZeigen(rahmen, wirt, name, knoten, behalten) {
    var alt = wirt.querySelector(':scope > .pv-tafel');
    if (alt) {
      Array.prototype.forEach.call(wirt.children, function (k) {
        if (k.__pvVerdeckt) { verbergen(k, false); k.__pvVerdeckt = 0; }
      });
      alt.remove();
    }
    if (!name) { markenAuffrischen(); return null; }
    /* Was den Umschalter trägt, bleibt stehen. Eine Tafel, die den Knopf
       verdeckt, mit dem man sie geöffnet hat, ist eine Falle. */
    Array.prototype.forEach.call(wirt.children, function (k) {
      if (k.hidden || k.classList.contains('pv-tafel')) return;
      if (behalten && (k === behalten || k.contains(behalten))) return;
      k.__pvVerdeckt = 1;
      verbergen(k);
    });
    var tafel = DOK.createElement('div');
    tafel.className = 'pv-tafel';
    tafel.setAttribute('data-pv-tafel', name);
    if (knoten) tafel.appendChild(knoten);
    wirt.appendChild(tafel);
    beleben_ikonen(tafel);
    schmutzig(rahmen);
    markenAuffrischen();
    return tafel;
  }

  /* ── 14b · Umschalter ─────────────────────────────────────────────────────
     Jede .segmented in jedem Schirm. Die Auswahl wandert — das ist das
     Mindeste und in jeder Ansicht sichtbar. Wo es einen zweiten Blick auf
     dieselben Sachen gibt, kommt er dazu (14c, 14d).

     Ausgenommen sind Umschalter, die schon leben: der Regal-Umschalter der
     Bibliothek (§13a) hat seinen eigenen. */
  function umschalterBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.segmented'), function (segment) {
      var knoepfe = Array.prototype.slice.call(segment.querySelectorAll('button'));
      if (!knoepfe.length) return;
      if (knoepfe[0].classList.contains('pv-lebt')) return;   /* Bibliothek */

      knoepfe.forEach(function (k) {
        var name = wort(k);
        beleben(k, {
          ziel: 'nichts',
          wirkt: 'zeigt „' + textVon(k) + '"',
          titel: textVon(k),
          tun: function () {
            schmutzig(rahmen);
            knoepfe.forEach(function (b) {
              b.classList.toggle('is-on', b === k);
              b.setAttribute('aria-pressed', b === k ? 'true' : 'false');
            });
            ansichtWechseln(rahmen, segment, name, textVon(k));
            markenAuffrischen();
          },
        });
      });
    });
  }

  /* Welcher Umschalter ist das? Entschieden wird am Wortbestand, nicht an
     der Stelle: derselbe Aufgaben-Umschalter steht in zwei Schirmen und auf
     zwei Geräten, und in keinem an derselben Stelle. */
  function ansichtWechseln(rahmen, segment, name, klartext) {
    var alle = Array.prototype.map.call(segment.querySelectorAll('button'), wort).join(' ');
    var schirm = rahmen.getAttribute('data-pv-screen');

    if (/planer/.test(alle) && /matrix/.test(alle)) { aufgabenAnsicht(rahmen, name, klartext, segment); return; }
    if (/timeline/.test(alle) && /medien/.test(alle)) { journalAnsicht(rahmen, name, klartext, segment); return; }
    if (/angeheftet/.test(alle) && /mit karten/.test(alle)) { notizenFilter(rahmen, name, klartext); return; }
    if (/fällig zuerst/.test(alle) || /a–z/.test(alle)) { deckSortieren(rahmen, name, klartext); return; }
    if (/übersicht/.test(alle) && /verlauf/.test(alle)) { editorTafel(rahmen, segment, name, klartext); return; }
    if (/zeit/.test(alle) && /herkunft/.test(alle)) { semesterOrdnen(rahmen, name, klartext, segment); return; }
    sagen(klartext + ' — die Auswahl steht.');
    void schirm;
  }

  /* ── 14c · Die fünf Blicke auf dieselben sechs Aufgaben ──────────────────
     Liste · Planer · Matrix · Board · Kalender. Gebaut wird aus den Zeilen,
     die dastehen: sie werden UMGEHÄNGT, nicht kopiert. Damit behält jede
     Zeile ihren Weg ins Detail, ihr Erledigen-Kästchen und ihren Faden — und
     der Rückweg in die Liste ist kein Neuaufbau, sondern ein Zurückhängen.

     Wohin eine Zeile gehört, steht in ihr: „Geplant 14:00" ist heute,
     „Geplant morgen" ist morgen, „!!!" ist dringend, ein gesetzter Haken ist
     erledigt. Nichts davon ist erfunden. */
  function aufgabenZeilen(rahmen) {
    var liste = rahmen.querySelector('#liste-pad, .scroll');
    if (!liste) return [];
    return Array.prototype.slice.call(rahmen.querySelectorAll('.row')).filter(function (z) {
      if (!z.querySelector('.row__title, .t-body')) return false;
      if (z.closest('.pv-tafel')) return true;
      if (z.closest('aside')) return false;
      if (z.classList.contains('sem__zeile')) return false;
      return true;
    });
  }

  function zeileErledigt(z) {
    return !!z.querySelector('.check.is-done, .bw-check.is-done, .is-erledigt');
  }

  function zeileWann(z) {
    var t = textVon(z);
    if (/heute|\b\d{1,2}:\d{2}\b/.test(t)) return 'heute';
    if (/morgen/.test(t)) return 'morgen';
    if (/woche|Fr,|Mo,|Di,|Mi,|Do,/.test(t)) return 'woche';
    return 'ohne';
  }

  function zeileDringend(z) {
    return /!!!|!!|dringend|noch 0 Tage|fällig/i.test(textVon(z));
  }

  function aufgabenAnsicht(rahmen, name, klartext, segment) {
    var wirt = rahmen.querySelector('.scroll');
    if (!wirt) return;

    /* Zurück in die Liste: die Zeilen gehen an ihre Stelle, die Tafel geht. */
    if (name === 'liste') {
      aufgabenZurueckhaengen(rahmen);
      tafelZeigen(rahmen, wirt, null, null, segment);
      sagen('Liste — sechs Aufgaben in ihrer Ordnung.');
      return;
    }

    var zeilen = aufgabenZeilen(rahmen);
    if (!zeilen.length) { sagen(klartext + ' — die Auswahl steht.'); return; }
    zeilen.forEach(function (z) {
      if (!z.__pvHeim) { z.__pvHeim = z.parentNode; z.__pvNachbar = z.nextSibling; }
    });

    var spalten = [];
    if (name === 'planer') {
      spalten = [
        { kopf: 'Heute',       satz: 'was heute drankommt',        nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'heute'; } },
        { kopf: 'Morgen',      satz: 'schon terminiert',           nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'morgen'; } },
        { kopf: 'Diese Woche', satz: 'mit Frist, ohne Tag',        nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'woche'; } },
        { kopf: 'Ohne Termin', satz: 'wartet auf eine Entscheidung', nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'ohne'; } },
      ];
    } else if (name === 'matrix') {
      spalten = [
        { kopf: 'Dringend · wichtig',    satz: 'zuerst',    nimm: function (z) { return zeileDringend(z) && zeileWann(z) === 'heute'; } },
        { kopf: 'Wichtig · nicht dringend', satz: 'planen', nimm: function (z) { return !zeileDringend(z) && zeileWann(z) !== 'ohne'; } },
        { kopf: 'Dringend · unwichtig',  satz: 'abgeben',   nimm: function (z) { return zeileDringend(z) && zeileWann(z) !== 'heute'; } },
        { kopf: 'Keins von beidem',      satz: 'irgendwann', nimm: function (z) { return !zeileDringend(z) && zeileWann(z) === 'ohne'; } },
      ];
    } else if (name === 'board') {
      spalten = [
        { kopf: 'Offen',    satz: 'noch nicht angefangen', nimm: function (z) { return !zeileErledigt(z) && !/\d von \d|Schritt/.test(textVon(z)); } },
        { kopf: 'In Arbeit', satz: 'begonnen',             nimm: function (z) { return !zeileErledigt(z) && /\d von \d|Schritt/.test(textVon(z)); } },
        { kopf: 'Erledigt', satz: 'heute abgehakt',        nimm: zeileErledigt },
      ];
    } else if (name === 'kalender') {
      spalten = [
        { kopf: 'Do · 13.', satz: 'heute',   nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'heute'; } },
        { kopf: 'Fr · 14.', satz: 'morgen',  nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'morgen'; } },
        { kopf: 'Sa · 15.', satz: 'Frist',   nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'woche'; } },
        { kopf: 'Ohne Tag', satz: 'unten am Rand', nimm: function (z) { return !zeileErledigt(z) && zeileWann(z) === 'ohne'; } },
      ];
    } else {
      sagen(klartext + ' — die Auswahl steht.');
      return;
    }

    var brett = bau('<div class="pv-brett"></div>');
    if (name === 'matrix') brett.classList.add('pv-brett--vier');
    var offen = zeilen.slice();
    spalten.forEach(function (sp) {
      var spalte = bau(
        '<div class="pv-brett__spalte">' +
          '<div class="pv-brett__kopf">' +
            '<span class="t-label c-2 pv-brett__wort"></span>' +
            '<span class="t-label c-3 num pv-brett__zahl"></span>' +
          '</div>' +
          '<div class="pv-brett__stapel"></div>' +
          '<div class="t-label c-3 pv-brett__satz"></div>' +
        '</div>');
      spalte.querySelector('.pv-brett__wort').textContent = sp.kopf.toUpperCase();
      spalte.querySelector('.pv-brett__satz').textContent = sp.satz;
      var stapel = spalte.querySelector('.pv-brett__stapel');
      var n = 0;
      for (var i = offen.length - 1; i >= 0; i--) {
        if (!sp.nimm(offen[i])) continue;
        stapel.insertBefore(offen[i], stapel.firstChild);
        offen.splice(i, 1);
        n++;
      }
      if (!n) stapel.appendChild(bau('<div class="pv-brett__leer t-label c-3">nichts</div>'));
      spalte.querySelector('.pv-brett__zahl').textContent = n ? String(n) : '';
      brett.appendChild(spalte);
    });
    /* Was in keine Spalte fiel, bleibt sichtbar — eine Ansicht, die Aufgaben
       verschluckt, ist schlimmer als keine. */
    if (offen.length) {
      var rest = brett.lastChild.querySelector('.pv-brett__stapel');
      offen.forEach(function (z) { rest.appendChild(z); });
    }

    tafelZeigen(rahmen, wirt, name, brett, segment);
    sagen(klartext + ' — dieselben ' + zeilen.length + ' Aufgaben, anders sortiert.');
  }

  function aufgabenZurueckhaengen(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.row'), function (z) {
      if (!z.__pvHeim || !z.__pvHeim.isConnected) return;
      z.__pvHeim.insertBefore(z, z.__pvNachbar && z.__pvNachbar.isConnected ? z.__pvNachbar : null);
    });
  }

  /* ── 14d · Vier Blicke ins Journal ──────────────────────────────────────
     Timeline · Kalender · Medien · Karte. Auch hier wird genommen, was da
     ist: die Einträge kennen ihr Datum (die Rinne links), ihre Bilder, ihre
     Orte. Was kein Bild hat, taucht im Medien-Raster nicht auf — ein Raster
     mit grauen Kacheln wäre eine Behauptung. */
  function journalEintraege(rahmen) {
    return Array.prototype.slice.call(rahmen.querySelectorAll('article.card, .card.jcard'))
      .filter(function (a) { return !a.closest('.pv-tafel') && a.getBoundingClientRect; });
  }

  function journalAnsicht(rahmen, name, klartext, segment) {
    var wirt = rahmen.querySelector('.scroll');
    if (!wirt) return;
    if (name === 'timeline') {
      tafelZeigen(rahmen, wirt, null, null, segment);
      sagen('Timeline — die Einträge in der Zeit.');
      return;
    }
    var eintraege = journalEintraege(rahmen);

    if (name === 'kalender') {
      var tage = {};
      eintraege.forEach(function (a) {
        var rinne = a.parentNode && a.parentNode.querySelector('.jz');
        var num = rinne ? (textVon(rinne).match(/\d+/) || [])[0] : null;
        if (num) tage[+num] = (tage[+num] || 0) + 1;
      });
      var gitter = bau(
        '<div class="pv-kal">' +
          '<div class="pv-kal__kopf"><span class="t-section">November</span>' +
          '<span class="t-label c-3 pv-kal__zahl"></span></div>' +
          '<div class="pv-kal__wochentage"></div>' +
          '<div class="pv-kal__gitter"></div>' +
          '<div class="t-label c-3" style="padding-top:10px">gefüllt = Eintrag · Ring = heute · leer = nichts geschrieben</div>' +
        '</div>');
      ['M','D','M','D','F','S','S'].forEach(function (w, i) {
        var z = bau('<span class="t-label c-3 pv-kal__wt"></span>');
        z.textContent = w; z.setAttribute('aria-label', ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'][i]);
        gitter.querySelector('.pv-kal__wochentage').appendChild(z);
      });
      var feld = gitter.querySelector('.pv-kal__gitter');
      /* 1. November 2025 ist ein Samstag — davor stehen fünf leere Felder. */
      for (var v = 0; v < 5; v++) feld.appendChild(bau('<span class="pv-kal__leer"></span>'));
      var gezaehlt = 0;
      for (var t = 1; t <= 30; t++) {
        var hat = !!tage[t];
        if (hat) gezaehlt++;
        var zelle = bau('<button class="pv-kal__tag' + (hat ? ' is-voll' : '') + (t === 13 ? ' is-heute' : '') + '">' +
          '<span class="t-label num"></span></button>');
        zelle.querySelector('.num').textContent = String(t);
        (function (tag, hatEintrag) {
          beleben(zelle, {
            ziel: hatEintrag && leitetAuf('journal-eintrag') ? 'journal-eintrag' : 'nichts',
            richtung: 'vor',
            titel: tag + '. November' + (hatEintrag ? ' — Eintrag öffnen' : ' — noch kein Eintrag'),
            wirkt: hatEintrag ? null : 'an diesem Tag steht nichts',
            tun: hatEintrag ? null : function () { sagen(tag + '. November — noch kein Eintrag. Der Faden hat hier eine Lücke.'); },
          });
        })(t, hat);
        feld.appendChild(zelle);
      }
      gitter.querySelector('.pv-kal__zahl').textContent = gezaehlt + ' von 30 Tagen';
      tafelZeigen(rahmen, wirt, name, gitter, segment);
      sagen('Kalender — ' + gezaehlt + ' Tage mit Eintrag im November.');
      return;
    }

    if (name === 'medien') {
      var bilder = [];
      eintraege.forEach(function (a) {
        Array.prototype.forEach.call(a.querySelectorAll('img'), function (b) {
          if (b.getAttribute('src')) bilder.push({ src: b.getAttribute('src'), alt: b.getAttribute('alt') || '', wirt: a });
        });
      });
      var raster = bau('<div class="pv-medien"><div class="pv-medien__kopf"></div><div class="pv-medien__raster"></div></div>');
      raster.querySelector('.pv-medien__kopf').appendChild(bau('<span class="t-label c-3"></span>'));
      raster.querySelector('.t-label').textContent = bilder.length
        ? bilder.length + ' Bilder aus ' + eintraege.length + ' Einträgen'
        : 'In diesen Einträgen steckt kein Bild.';
      var feld2 = raster.querySelector('.pv-medien__raster');
      bilder.forEach(function (b) {
        var kachel = bau('<button class="pv-medien__kachel"><img alt=""><span class="t-label pv-medien__wort"></span></button>');
        kachel.querySelector('img').setAttribute('src', b.src);
        kachel.querySelector('img').setAttribute('alt', b.alt);
        kachel.querySelector('.pv-medien__wort').textContent = b.alt.slice(0, 40);
        feld2.appendChild(kachel);
        beleben(kachel, {
          ziel: leitetAuf('journal-eintrag') || 'nichts',
          richtung: 'vor',
          titel: b.alt ? b.alt + ' — Eintrag öffnen' : 'Eintrag öffnen',
        });
      });
      if (!bilder.length) feld2.appendChild(bau('<div class="t-label c-3">—</div>'));
      tafelZeigen(rahmen, wirt, name, raster, segment);
      sagen('Medien — ' + bilder.length + ' Bilder aus den Einträgen.');
      return;
    }

    if (name === 'karte') {
      var orte = [];
      eintraege.forEach(function (a) {
        var t = textVon(a);
        ['Labor 3.14', 'Hörsaal B', 'Bibliothek', 'Universität', 'Gebäude B', 'Zuhause'].forEach(function (o) {
          if (t.indexOf(o) >= 0 && orte.indexOf(o) < 0) orte.push(o);
        });
      });
      if (!orte.length) orte = ['Universität', 'Labor 3.14'];
      var karte = bau(
        '<div class="pv-karte">' +
          '<div class="pv-karte__feld"><div class="pv-karte__gitter"></div></div>' +
          '<div class="pv-karte__liste"></div>' +
          '<div class="t-label c-3" style="padding-top:8px">Orte aus den Einträgen dieses Monats. Ein Punkt je Ort, ein Ring je Eintrag.</div>' +
        '</div>');
      var stellen = [[26, 34], [58, 22], [44, 62], [72, 55], [18, 70], [64, 80]];
      orte.forEach(function (o, i) {
        var s = stellen[i % stellen.length];
        var pin = bau('<button class="pv-karte__pin"><span class="dot dot--journal"></span><span class="t-label pv-karte__wort"></span></button>');
        pin.querySelector('.pv-karte__wort').textContent = o;
        pin.style.left = s[0] + '%';
        pin.style.top = s[1] + '%';
        karte.querySelector('.pv-karte__feld').appendChild(pin);
        var zeile = bau('<button class="row pv-karte__zeile"><span class="dot dot--journal"></span>' +
          '<div class="row__main"><span class="t-sub c-1 pv-karte__ort"></span>' +
          '<span class="t-label c-3">im Journal genannt</span></div></button>');
        zeile.querySelector('.pv-karte__ort').textContent = o;
        karte.querySelector('.pv-karte__liste').appendChild(zeile);
        [pin, zeile].forEach(function (el) {
          beleben(el, {
            ziel: leitetAuf('journal-eintrag') || 'nichts',
            richtung: 'vor',
            titel: o + ' — Eintrag öffnen',
          });
        });
      });
      tafelZeigen(rahmen, wirt, name, karte, segment);
      sagen('Karte — ' + orte.length + ' Orte aus den Einträgen.');
      return;
    }
    sagen(klartext + ' — die Auswahl steht.');
  }

  /* ── 14e · Filtern in der Notizenliste ─────────────────────────────────── */
  function notizFilterZeilen(rahmen) {
    return Array.prototype.slice.call(rahmen.querySelectorAll('.scroll .row'))
      .filter(function (z) { return !z.closest('aside'); });
  }

  function notizenFilter(rahmen, name, klartext) {
    var zeilen = notizFilterZeilen(rahmen);
    if (!zeilen.length) return;
    var trifft = function (z) {
      if (name === 'alle') return true;
      if (name === 'angeheftet') {
        var kopf = z.previousElementSibling;
        while (kopf && !kopf.classList.contains('divider')) kopf = kopf.previousElementSibling;
        return !!(kopf && /ANGEHEFTET/i.test(textVon(kopf)));
      }
      if (name === 'mit aufgaben') return /Aufgabe|Schritt|offen/i.test(textVon(z)) || !!z.querySelector('.dot--tasks');
      if (name === 'mit karten') return /Karte|Lernkart/i.test(textVon(z)) || !!z.querySelector('.dot--cards');
      return true;
    };
    var n = 0;
    zeilen.forEach(function (z) {
      var ja = trifft(z);
      if (ja) n++;
      z.classList.toggle('pv-gefiltert', !ja);
    });
    /* Überschriften ohne Zeile darunter gehen mit. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.scroll .divider'), function (d) {
      var k = d.nextElementSibling, hat = false;
      while (k && !k.classList.contains('divider')) {
        if (k.classList.contains('row') && !k.classList.contains('pv-gefiltert')) { hat = true; break; }
        k = k.nextElementSibling;
      }
      d.classList.toggle('pv-gefiltert', !hat);
    });
    schmutzig(rahmen);
    uebergabeMitfuehren(rahmen);
    leerVermerk(rahmen, n, klartext);
    sagen(klartext + ' — ' + n + ' von ' + zeilen.length + ' Notizen.');
  }

  /* Eine Übergabe-Leiste gehört zu einer Auswahl. Ist die Auswahl aus der
     Liste gefiltert, steht die Leiste über nichts — und behauptet, es seien
     zwei Notizen gewählt. Sie geht mit. */
  function uebergabeMitfuehren(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.handoff'), function (leiste) {
      var traeger = leiste.closest('.row, div');
      var sichtbar = Array.prototype.slice.call(rahmen.querySelectorAll('.row.is-selected'))
        .some(function (z) { return !z.classList.contains('pv-gefiltert'); });
      leiste.classList.toggle('pv-gefiltert', !sichtbar);
      if (traeger && traeger !== rahmen && !traeger.classList.contains('row')) {
        traeger.classList.toggle('pv-gefiltert', !sichtbar);
      }
    });
  }

  /* ── 14f · Decks sortieren ─────────────────────────────────────────────── */
  function deckSortieren(rahmen, name, klartext) {
    var wirt = null, karten = [];
    Array.prototype.forEach.call(rahmen.querySelectorAll('.scroll section, .scroll div'), function (b) {
      if (wirt) return;
      var k = Array.prototype.slice.call(b.children).filter(function (c) {
        return c.classList && (c.classList.contains('deck') || c.classList.contains('card--deck'));
      });
      if (k.length >= 2) { wirt = b; karten = k; }
    });
    if (!wirt) {
      /* Kein Deck-Raster gefunden: dann sortiert der Umschalter die Zeilen. */
      var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.scroll .row'));
      if (zeilen.length < 2) { sagen(klartext + ' — die Auswahl steht.'); return; }
      wirt = zeilen[0].parentNode;
      karten = zeilen.filter(function (z) { return z.parentNode === wirt; });
    }
    karten.forEach(function (k, i) { if (k.__pvRang === undefined) k.__pvRang = i; });
    var sortiert = karten.slice();
    if (/a–z|a-z/.test(name)) {
      sortiert.sort(function (a, b) { return textVon(a).localeCompare(textVon(b), 'de'); });
    } else {
      sortiert.sort(function (a, b) { return a.__pvRang - b.__pvRang; });
    }
    sortiert.forEach(function (k) { wirt.appendChild(k); });
    schmutzig(rahmen);
    sagen(klartext + ' — ' + sortiert.length + ' Decks neu geordnet.');
  }

  /* ── 14g · Übersicht ↔ Verlauf im Notiz-Editor ─────────────────────────── */
  function editorTafel(rahmen, segment, name, klartext) {
    /* Der Editor hat ZWEI aside: links die Symbolschiene, rechts die Tafel.
       Gesucht ist die, in der der Umschalter selbst steht — querySelector
       nähme die erste und schriebe den Verlauf in die linke Schiene. */
    var aussen = segment.closest('aside');
    if (!aussen) return;
    var leiste = aussen.querySelector('.scroll') || aussen;
    if (name === 'übersicht') {
      tafelZeigen(rahmen, leiste, null, null, segment);
      sagen('Übersicht — Gliederung, Fäden und Zahlen der Notiz.');
      return;
    }
    var verlauf = bau(
      '<div class="pv-verlauf">' +
        '<div class="t-label c-3" style="padding:2px 0 10px">SEIT DEM 6. NOVEMBER</div>' +
      '</div>');
    [
      ['heute · 16:20', 'Absatz „Osmose" umgeschrieben', 'du', 'notes'],
      ['heute · 14:05', 'Aufgabe „Abbildung 4.2 ergänzen" entstanden', 'aus dieser Notiz', 'tasks'],
      ['gestern · 09:12', 'Zwei Lernkarten erzeugt', 'aus Absatz 9', 'cards'],
      ['11. Nov · 16:42', 'Handschrift aus dem Canvas eingefügt', 'Vorlesung 9', 'canvas'],
      ['6. Nov · 10:03', 'Notiz angelegt', 'im Hörsaal B', 'notes'],
    ].forEach(function (e) {
      var z = bau(
        '<div class="pv-verlauf__zeile">' +
          '<span class="dot dot--' + e[3] + '"></span>' +
          '<div style="display:flex; flex-direction:column; gap:1px; min-width:0">' +
            '<span class="t-sub c-1 pv-verlauf__was"></span>' +
            '<span class="t-label c-3 pv-verlauf__wann"></span>' +
          '</div>' +
        '</div>');
      z.querySelector('.pv-verlauf__was').textContent = e[1];
      z.querySelector('.pv-verlauf__wann').textContent = e[0] + ' · ' + e[2];
      verlauf.appendChild(z);
    });
    tafelZeigen(rahmen, leiste, name, verlauf, segment);
    sagen('Verlauf — fünf Schritte, seit die Notiz entstanden ist.');
    void klartext;
  }

  /* ── 14h · Der Semester-Ordner, dreimal geordnet ───────────────────────── */
  function semesterOrdnen(rahmen, name, klartext, segment) {
    var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.sem__zeile'));
    if (!zeilen.length) { sagen(klartext + ' — die Auswahl steht.'); return; }
    var wirt = zeilen[0].parentNode;
    var rinnen = Array.prototype.slice.call(wirt.querySelectorAll('.sem__rinne, .sem__woche'));
    zeilen.forEach(function (z, i) { if (z.__pvRang === undefined) z.__pvRang = i; });

    var scroll = rahmen.querySelector('.scroll');
    zeilen.forEach(function (z) {
      if (!z.__pvHeim) { z.__pvHeim = z.parentNode; z.__pvNachbar = z.nextSibling; }
    });

    if (name === 'zeit') {
      /* Zurück ins Raster: jede Zeile an ihre Stelle, die Tafel geht.
         Die Reihenfolge zählt hier nicht — das Raster stellt über Zeilen
         und Spalten, nicht über die Abfolge im Dokument. */
      zeilen.forEach(function (z) {
        if (z.__pvHeim && z.__pvHeim.isConnected) {
          z.__pvHeim.insertBefore(z, z.__pvNachbar && z.__pvNachbar.isConnected ? z.__pvNachbar : null);
        }
      });
      rinnen.forEach(function (r) { verbergen(r, false); });
      if (scroll) tafelZeigen(rahmen, scroll, null, null, segment);
      schmutzig(rahmen);
      sagen('Zeit — vierzehn Wochen von oben nach unten.');
      return;
    }
    /* Modul und Herkunft: das Raster ist eine Zeitachse und trägt keine
       andere Ordnung. Die Zeilen ziehen darum in eine eigene Tafel um —
       gruppiert, ohne Rinne, ohne Faden. Ein Faden, der schräg über eine
       Gruppierung liefe, die keine Zeit ist, wäre keiner (DNA N6). */
    var gruppen = {};
    zeilen.forEach(function (z) {
      var s;
      if (name === 'modul') {
        /* Der Ordner IST schon ein Fach — „Modul" meint hier das Notizbuch,
           in dem die Sache liegt. Die Tafel rechts nennt die drei beim Namen:
           Zellbiologie · Laborjournal · Genetik. Nach Fach zu gruppieren
           ergäbe eine einzige Gruppe und wäre keine Ordnung. */
        var t = textVon(z);
        s = /Labor|Praktikum|Schutzbrille|Protokoll/i.test(t) ? 'Laborjournal'
          : /Genetik|Vererbung|DNA/i.test(t) ? 'Genetik'
          : 'Zellbiologie';
      } else {
        s = z.querySelector('.dot--canvas') ? 'Aus dem Canvas'
          : z.querySelector('.dot--journal') ? 'Aus dem Journal'
          : z.querySelector('.dot--cards') ? 'Aus Lernkarten'
          : z.querySelector('.dot--tasks') ? 'Aus Aufgaben' : 'Direkt geschrieben';
      }
      (gruppen[s] = gruppen[s] || []).push(z);
    });
    var tafel = bau('<div class="pv-ordnung"></div>');
    Object.keys(gruppen).forEach(function (g) {
      var kopf = bau('<div class="pv-gruppenkopf t-label c-2"></div>');
      kopf.textContent = g.toUpperCase();
      tafel.appendChild(kopf);
      gruppen[g].forEach(function (z) { tafel.appendChild(z); });
    });
    if (scroll) tafelZeigen(rahmen, scroll, name, tafel, segment);
    schmutzig(rahmen);
    sagen(klartext + ' — ' + Object.keys(gruppen).length + ' Gruppen, dieselben ' + zeilen.length + ' Sachen.');
    void wirt; void rinnen;
  }

  /* ── 14i · Seitenleisten, die auswählen ─────────────────────────────────
     Notizen und Einstellungen tragen links eine Liste, in der genau ein
     Eintrag hell steht. Ein solcher Eintrag ist eine Auswahl — er muss
     wandern können, sonst ist die Helligkeit eine Behauptung.

     In der Notizenliste filtert die Auswahl die Zeilen. In den Einstellungen
     wechselt sie die Tafel rechts: dort steht ein Bereich von zwölf, und
     elf davon wären sonst tot. */
  function seitenleisteBeleben(rahmen) {
    var schirm = rahmen.getAttribute('data-pv-screen');
    Array.prototype.forEach.call(rahmen.querySelectorAll('aside .navitem, .bl__liste .navitem'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var geschwister = Array.prototype.slice.call(
        (k.closest('aside') || rahmen).querySelectorAll('.navitem'));
      var name = textVon(k).replace(/\s*\d+\s*$/, '').trim();
      beleben(k, {
        ziel: 'nichts',
        wirkt: schirm === 'einstellungen' ? 'öffnet „' + name + '"' : 'zeigt nur „' + name + '"',
        titel: name,
        tun: function () {
          schmutzig(rahmen);
          geschwister.forEach(function (g) {
            g.classList.toggle('is-active', g === k);
            g.setAttribute('aria-current', g === k ? 'true' : 'false');
          });
          if (schirm === 'einstellungen') einstellungenTafel(rahmen, name);
          else notizenSammlung(rahmen, k, name);
          markenAuffrischen();
        },
      });
    });

    /* Die Sammlungen darunter („4 Notizen ohne Tag", „Tag hinzufügen") sind
       keine .navitem, sehen aber genauso aus. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('aside .card--flat'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.tagName !== 'BUTTON') return;
      var name = textVon(k);
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'zeigt diese Auswahl',
        titel: name,
        tun: function () { notizenSammlung(rahmen, k, name); },
      });
    });
  }

  function notizenSammlung(rahmen, knopf, name) {
    var zeilen = notizFilterZeilen(rahmen);
    if (!zeilen.length) { sagen(name + ' — die Auswahl steht.'); return; }
    var such = name.toLowerCase().replace(/^[#/]/, '').replace(/\s*\d+\s*$/, '').trim();
    var alles = /alle notizen|alle$/.test(such);
    var n = 0;
    zeilen.forEach(function (z) {
      var ja = alles || textVon(z).toLowerCase().indexOf(such) >= 0
        || (/^papierkorb/.test(such) ? /Papierkorb/i.test(textVon(z)) : false)
        || (/^angeheftet/.test(such) ? !!z.closest('.scroll') && !!vorigerTeiler(z, /ANGEHEFTET/i) : false);
      if (ja) n++;
      z.classList.toggle('pv-gefiltert', !ja);
    });
    Array.prototype.forEach.call(rahmen.querySelectorAll('.scroll .divider'), function (d) {
      var k = d.nextElementSibling, hat = false;
      while (k && !k.classList.contains('divider')) {
        if (k.classList.contains('row') && !k.classList.contains('pv-gefiltert')) { hat = true; break; }
        k = k.nextElementSibling;
      }
      d.classList.toggle('pv-gefiltert', !hat);
    });
    schmutzig(rahmen);
    uebergabeMitfuehren(rahmen);
    leerVermerk(rahmen, n, name);
    sagen(name + ' — ' + n + ' von ' + zeilen.length + ' Notizen.');
    void knopf;
  }

  function vorigerTeiler(z, muster) {
    var k = z.previousElementSibling;
    while (k && !k.classList.contains('divider')) k = k.previousElementSibling;
    return k && muster.test(textVon(k)) ? k : null;
  }

  /* Bleibt nichts übrig, muss das dastehen. Eine leere Liste ohne Satz sieht
     aus wie ein Fehler. */
  function leerVermerk(rahmen, n, name) {
    var scroll = rahmen.querySelector('.scroll');
    if (!scroll) return;
    var alt = scroll.querySelector('.pv-leervermerk');
    if (n) { if (alt) alt.remove(); return; }
    if (alt) { alt.querySelector('.pv-leervermerk__wort').textContent = name; return; }
    var kasten = bau(
      '<div class="pv-leervermerk">' +
        '<div class="t-body c-2">In <span class="pv-leervermerk__wort"></span> liegt gerade nichts.</div>' +
        '<div class="t-label c-3">Wähle links etwas anderes — oder leg hier etwas an.</div>' +
      '</div>');
    kasten.querySelector('.pv-leervermerk__wort').textContent = name;
    scroll.appendChild(kasten);
  }

  /* Die zwölf Bereiche der Einstellungen. Was rechts steht, wird gebaut —
     aber nicht ausgedacht: jeder Bereich sagt in drei Zeilen dasselbe, was
     die App an anderer Stelle schon behauptet (Speicher 4,2 GB, Abo „Uni",
     Sync über iCloud). */
  var EINSTELLUNGEN_TAFELN = {
    'Synchronisierung': [
      ['iCloud', 'Zuletzt 16:41 · 3 Änderungen übertragen', 'an'],
      ['Nur über WLAN', 'Große Anhänge warten auf WLAN', 'an'],
      ['Handschrift mitsynchronisieren', '2,8 GB von 4,2 GB', 'an'],
    ],
    'Speicher': [
      ['Handschrift & Canvas', '2,8 GB', ''],
      ['Bilder im Journal', '1,1 GB', ''],
      ['Text, Aufgaben, Karten', '0,3 GB', ''],
    ],
    'Export & Backup': [
      ['PDF je Notizbuch', 'Handschrift bleibt Vektor', ''],
      ['Markdown-Ordner', 'Fäden werden zu Wiki-Links', ''],
      ['Wöchentliches Backup', 'Sonntag, 03:00', 'an'],
    ],
    'Datenschutz': [
      ['Alles bleibt auf dem Gerät', 'Kein Konto nötig', 'an'],
      ['Analyse senden', 'Aus. Nichts verlässt das Gerät.', 'aus'],
      ['Sperren mit Face ID', 'Nach 5 Minuten', 'an'],
    ],
    'Benachrichtigungen': [
      ['Fällige Karten', 'Täglich 19:00 · 12 Karten', 'an'],
      ['Aufgaben mit Frist', 'Zwei Stunden vorher', 'an'],
      ['Journal-Erinnerung', 'Aus', 'aus'],
    ],
    'Tastatur & Pencil': [
      ['Doppeltippen am Pencil', 'Radierer', ''],
      ['Handballenerkennung', 'An', 'an'],
      ['Kritzeln zum Löschen', 'An', 'an'],
    ],
    'Abo': [
      ['Velum Uni', '2,99 € im Monat · verlängert am 3. Dez', ''],
      ['Geräte', 'iPad Pro, iPhone 15', ''],
      ['Bildungsrabatt', 'Aktiv bis Sommersemester', ''],
    ],
    'Was ist neu': [
      ['Der Faden', 'Jede Sache zeigt, woraus sie entstanden ist', ''],
      ['Fünf Blicke auf Aufgaben', 'Liste, Planer, Matrix, Board, Kalender', ''],
      ['Handschrift wird gesucht', 'Auch was nur gezeichnet wurde', ''],
    ],
    'Hilfe & Feedback': [
      ['Erste Schritte', 'Sieben Minuten', ''],
      ['Was der Faden bedeutet', 'Zwei Minuten', ''],
      ['Feedback schreiben', 'Antwort meist am selben Tag', ''],
    ],
    'Rechtliches': [
      ['Datenschutzerklärung', 'Stand 1. Oktober', ''],
      ['Nutzungsbedingungen', 'Stand 1. Oktober', ''],
      ['Lizenzen', 'New York, SF Symbols', ''],
    ],
  };

  function einstellungenTafel(rahmen, name) {
    var wirt = rahmen.querySelector('main.content .scroll') || rahmen.querySelector('.scroll');
    if (!wirt) return;
    if (/Darstellung/i.test(name)) {
      tafelZeigen(rahmen, wirt, null);
      sagen('Darstellung — Erscheinungsbild, Schrift, Papier.');
      return;
    }
    var kurz = name.replace(/\s*\d.*$/, '').replace(/[0-9,.]+ ?GB$/, '').trim();
    var zeilen = EINSTELLUNGEN_TAFELN[kurz] || EINSTELLUNGEN_TAFELN[kurz.split(' ')[0]] || null;
    if (!zeilen) {
      zeilen = [[kurz, 'In diesem Entwurf nicht ausgezeichnet', '']];
    }
    var tafel = bau('<section class="card pv-einst"><div class="card__head"><span class="t-section pv-einst__kopf"></span></div></section>');
    tafel.querySelector('.pv-einst__kopf').textContent = kurz;
    zeilen.forEach(function (z) {
      var zeile = bau(
        '<div class="row pv-einst__zeile">' +
          '<div class="row__main">' +
            '<span class="t-body pv-einst__was"></span>' +
            '<span class="t-label c-3 pv-einst__dazu"></span>' +
          '</div>' +
          (z[2] ? '<span class="pv-schalter' + (z[2] === 'an' ? ' is-an' : '') + '" role="switch"></span>'
                : '<span class="ico c-3" data-ico="chevR" style="width:15px;height:15px"></span>') +
        '</div>');
      zeile.querySelector('.pv-einst__was').textContent = z[0];
      zeile.querySelector('.pv-einst__dazu').textContent = z[1];
      var schalt = zeile.querySelector('.pv-schalter');
      if (schalt) {
        schalt.setAttribute('aria-checked', z[2] === 'an' ? 'true' : 'false');
        beleben(schalt, {
          ziel: 'nichts',
          wirkt: 'schaltet um',
          titel: z[0],
          tun: function () {
            var an = !schalt.classList.contains('is-an');
            schalt.classList.toggle('is-an', an);
            schalt.setAttribute('aria-checked', an ? 'true' : 'false');
            schmutzig(rahmen);
            sagen(z[0] + ' — ' + (an ? 'an' : 'aus') + '.');
          },
        });
      }
      tafel.appendChild(zeile);
    });
    tafelZeigen(rahmen, wirt, kurz, tafel);
    sagen(kurz + ' — drei Einstellungen.');
  }

  /* ── 14j · Filterchips ───────────────────────────────────────────────────
     Suche und Graph tragen Reihen von Chips: „Alle 12 · Notizen · Canvas ·
     Journal · Lernkarten · Aufgaben 0". Der erste ist gefüllte Ink, die
     anderen sind Umrisse — das ist die Auswahl-Rolle der Tinte (DNA §2), und
     sie muss wandern können.

     Die Wirkung ist echtes Filtern: die Fundstellen, die nicht zur Schicht
     gehören, treten zurück, und die Zahl im ersten Chip zählt mit. */
  function chipreiheBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.chip'), function (c) { void c; });

    var reihen = [];
    Array.prototype.forEach.call(rahmen.querySelectorAll('button.chip'), function (c) {
      var eltern = c.parentNode;
      if (!eltern) return;
      if (reihen.indexOf(eltern) < 0) reihen.push(eltern);
    });

    reihen.forEach(function (reihe) {
      var chips = Array.prototype.slice.call(reihe.children).filter(function (c) {
        return c.tagName === 'BUTTON' && c.classList.contains('chip') && !c.classList.contains('gtag');
      });
      if (chips.length < 2) return;
      if (chips[0].classList.contains('pv-lebt')) return;
      var einzeln = !chips.some(function (c) { return /^alle\b/.test(wort(c)); });

      chips.forEach(function (c) {
        var name = wort(c);
        beleben(c, {
          ziel: 'nichts',
          wirkt: einzeln ? 'schaltet „' + textVon(c) + '" zu' : 'zeigt nur „' + textVon(c) + '"',
          titel: textVon(c),
          tun: function () {
            schmutzig(rahmen);
            if (einzeln) {
              var aus = c.classList.contains('is-off');
              c.classList.toggle('is-off', !aus);
              c.classList.toggle('chip--ghost', !aus);
              c.setAttribute('aria-pressed', aus ? 'true' : 'false');
            } else {
              chips.forEach(function (b) {
                var gewaehlt = b === c;
                b.classList.toggle('chip--solid', gewaehlt);
                b.classList.toggle('chip--ghost', !gewaehlt && b.classList.contains('is-off'));
                b.setAttribute('aria-pressed', gewaehlt ? 'true' : 'false');
              });
            }
            schichtFiltern(rahmen, chips);
            markenAuffrischen();
          },
        });
      });
    });

    /* Die Tag-Chips im Graphen: sie schalten einzeln zu und ab. */
    var tags = Array.prototype.slice.call(rahmen.querySelectorAll('button.chip.gtag'));
    tags.forEach(function (c) {
      if (c.classList.contains('pv-lebt')) return;
      beleben(c, {
        ziel: 'nichts',
        wirkt: 'hebt „' + textVon(c) + '" hervor',
        titel: textVon(c),
        tun: function () {
          schmutzig(rahmen);
          var an = !c.classList.contains('is-gewaehlt');
          tags.forEach(function (b) { b.classList.toggle('is-gewaehlt', b === c && an); });
          graphHervorheben(rahmen, an ? textVon(c) : null);
          markenAuffrischen();
        },
      });
    });
  }

  /* Welche Fundstellen bleiben stehen. Gesucht wird im Text der Stelle nach
     dem Wort der Schicht — „Notiz · Absatz 9" trägt „Notiz". */
  function schichtFiltern(rahmen, chips) {
    var gewaehlt = [];
    chips.forEach(function (c) {
      var n = wort(c);
      if (/^alle\b/.test(n)) return;
      var an = c.classList.contains('chip--solid') || !c.classList.contains('is-off');
      if (an) gewaehlt.push(n);
    });
    var alleAn = chips.some(function (c) { return /^alle\b/.test(wort(c)) && c.classList.contains('chip--solid'); });

    var stellen = Array.prototype.slice.call(rahmen.querySelectorAll('.scroll section.card'))
      .filter(function (s) { return s.querySelector('.row, .klammer'); });
    if (!stellen.length) return;
    var n = 0;
    stellen.forEach(function (s) {
      var t = textVon(s).toLowerCase();
      var ja = alleAn || !gewaehlt.length || gewaehlt.some(function (g) {
        return t.indexOf(g.replace(/n$/, '')) >= 0;
      });
      if (ja) n++;
      s.classList.toggle('pv-gefiltert', !ja);
    });
    Array.prototype.forEach.call(rahmen.querySelectorAll('.chip'), function (c) {
      if (!/^alle\b/.test(wort(c))) return;
      var z = c.querySelector('.num');
      if (z) z.textContent = String(n);
      else c.textContent = 'Alle ' + n;
    });
    sagen(n + ' von ' + stellen.length + ' Fundstellen.');
  }

  function graphHervorheben(rahmen, tag) {
    var knoten = Array.prototype.slice.call(rahmen.querySelectorAll('.gn, .gnode'));
    if (!knoten.length) return;
    knoten.forEach(function (k) {
      if (!tag) { k.classList.remove('pv-fern'); return; }
      var passt = textVon(k).toLowerCase().indexOf(tag.replace(/^#/, '').split('/').pop().toLowerCase()) >= 0;
      k.classList.toggle('pv-fern', !passt);
    });
    sagen(tag ? tag + ' — die anderen Knoten treten zurück.' : 'Alle Knoten wieder gleich hell.');
  }

  /* ── 14k · Die Symbole in den Leisten ────────────────────────────────────
     ⟨more⟩ · ⟨sort⟩ · ⟨info⟩ · ⟨star⟩ · ⟨share⟩ · ⟨undo⟩ · ⟨filter⟩. Sie
     sind das Gegenteil von Beiwerk: 44 × 44, ganz oben, in jeder Leiste. Ein
     totes Symbol dort ist der Punkt, an dem ein Entwurf auffliegt.

     Jedes bekommt, was es im System auch täte: „mehr" ein Menü, „sortieren"
     ein Menü mit Haken, „Info" eine Tafel zum Auf- und Zuklappen, „Stern"
     einen Zustand, „Teilen" einen Hinweis, „Widerrufen" einen Widerruf. */
  var SYMBOL_WORT = {
    more: 'Mehr', ellipsis: 'Mehr', sort: 'Sortieren', filter: 'Filtern',
    info: 'Informationen', star: 'Merken', share: 'Teilen', undo: 'Widerrufen',
    redo: 'Wiederholen', search: 'Suchen', close: 'Schließen', check: 'Fertig',
    sidebar: 'Seitenleiste', calendar: 'Kalender', clock: 'Erinnerung',
    trash: 'Löschen', plus: 'Neu', minus: 'Kleiner', pencil: 'Bearbeiten',
  };

  function symbolVon(k) {
    var i = k.querySelector('.ico[data-ico]');
    return i ? i.getAttribute('data-ico') : '';
  }

  function symbolknoepfeBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.iconbtn'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.hasAttribute('data-bw')) return;
      var sym = symbolVon(k);
      var name = SYMBOL_WORT[sym] || textVon(k) || 'Aktion';
      var schirm = rahmen.getAttribute('data-pv-screen');

      if (sym === 'more' || sym === 'ellipsis') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'öffnet das Menü', titel: 'Mehr',
          tun: function () { listenmenue(k, 'MEHR', mehrmenue(rahmen, schirm)); },
        });
        return;
      }
      if (sym === 'sort' || sym === 'filter') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'öffnet die Ordnung', titel: name,
          tun: function () { listenmenue(k, sym === 'sort' ? 'SORTIEREN' : 'FILTERN', ordnungsmenue(rahmen, k)); },
        });
        return;
      }
      if (sym === 'info') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'klappt die Tafel zu und auf', titel: 'Informationen',
          tun: function () { seiteneinschubUmschalten(rahmen, k); },
        });
        return;
      }
      if (sym === 'star') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'merkt sich diese Sache', titel: 'Merken',
          tun: function () {
            schmutzig(rahmen);
            var an = !k.classList.contains('is-active');
            k.classList.toggle('is-active', an);
            k.setAttribute('aria-pressed', an ? 'true' : 'false');
            var stern = k.querySelector('.ico');
            if (stern) stern.setAttribute('data-ico', an ? 'starFill' : 'star');
            beleben_ikonen(k);
            sagen(an ? 'Gemerkt — steht jetzt unter „Markiert".' : 'Nicht mehr gemerkt.');
            markenAuffrischen();
          },
        });
        return;
      }
      if (sym === 'share') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'zeigt, was geteilt würde', titel: 'Teilen',
          tun: function () {
            listenmenue(k, 'TEILEN', [
              { wort: 'Als PDF', ico: 'doc', tun: function () { hinweis(rahmen, 'Als PDF geteilt', 'Handschrift bleibt Vektor · 4 Seiten'); } },
              { wort: 'Als Markdown', ico: 'doc', tun: function () { hinweis(rahmen, 'Als Markdown geteilt', 'Fäden werden zu Wiki-Links'); } },
              { wort: 'Link zum Mitlesen', ico: 'link', tun: function () { hinweis(rahmen, 'Link kopiert', 'Nur Lesen · läuft in 7 Tagen ab'); } },
            ]);
          },
        });
        return;
      }
      if (sym === 'undo') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'nimmt den letzten Schritt zurück', titel: 'Widerrufen',
          tun: function () { hinweis(rahmen, 'Letzter Schritt zurückgenommen', 'Absatz „Osmose" · vor 4 Minuten'); },
        });
        return;
      }
      if (sym === 'close') {
        var tafel = k.closest('aside, section, .ginspect, .card');
        if (tafel && tafel !== rahmen) {
          beleben(k, {
            ziel: 'nichts', wirkt: 'schließt das hier', titel: 'Schließen',
            tun: function () { schmutzig(rahmen); verbergen(tafel); markenAuffrischen(); },
          });
          return;
        }
      }
      if (sym === 'sidebar') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'blendet die Seitenleiste aus und ein', titel: 'Seitenleiste',
          tun: function () { seitenleisteUmschalten(rahmen, k); },
        });
        return;
      }
      /* Alles andere: ein Menü mit dem, was der Schirm hergibt — nie nichts. */
      beleben(k, {
        ziel: 'nichts', wirkt: 'öffnet das Menü', titel: name,
        tun: function () { listenmenue(k, name.toUpperCase(), mehrmenue(rahmen, schirm)); },
      });
    });
  }

  /* Was im „Mehr"-Menü steht, hängt vom Schirm ab — und jeder Eintrag tut
     etwas, das man sieht. Ein Menü voll toter Zeilen wäre nur eine größere
     Version desselben Fehlers. */
  function mehrmenue(rahmen, schirm) {
    var eintraege = [];
    if (schirm === 'notizen' || schirm === 'bibliothek') {
      eintraege.push({ wort: 'Auswählen', ico: 'check', tun: function () { auswahlModus(rahmen); } });
      eintraege.push({ wort: 'Nach Änderung sortieren', ico: 'sort', tun: function () { listeSortieren(rahmen, 'geändert'); } });
      eintraege.push({ wort: 'Nach Titel sortieren', ico: 'sort', tun: function () { listeSortieren(rahmen, 'titel'); } });
      eintraege.push({ trenner: true });
      eintraege.push({ wort: 'Papierkorb zeigen', ico: 'trash', tun: function () { hinweis(rahmen, 'Papierkorb', '3 Notizen · älteste seit 12 Tagen'); } });
    } else if (schirm === 'notiz' || schirm === 'journal-eintrag') {
      eintraege.push({ wort: 'In Notizbuch verschieben', ico: 'folder', tun: function () { hinweis(rahmen, 'Verschoben nach „Zellbiologie"', 'Die Fäden bleiben, wo sie waren'); } });
      eintraege.push({ wort: 'Lernkarten erzeugen', ico: 'cards', tun: function () { hinweis(rahmen, 'Zwei Lernkarten entstanden', 'aus Absatz 9 · fällig in 1 Tag'); } });
      eintraege.push({ wort: 'Drucken', ico: 'doc', tun: function () { hinweis(rahmen, 'Druckvorschau', '4 Seiten · Handschrift als Vektor'); } });
      eintraege.push({ trenner: true });
      eintraege.push({ wort: 'Löschen', ico: 'trash', gefahr: true, tun: function () { hinweis(rahmen, 'In den Papierkorb gelegt', 'Widerrufen ist 30 Tage möglich'); } });
    } else if (schirm === 'aufgaben' || schirm === 'aufgabe') {
      eintraege.push({ wort: 'Erledigte einblenden', ico: 'check', tun: function () { erledigteZeigen(rahmen); } });
      eintraege.push({ wort: 'Nach Frist sortieren', ico: 'sort', tun: function () { listeSortieren(rahmen, 'frist'); } });
      eintraege.push({ wort: 'Bereiche verwalten', ico: 'folder', tun: function () { hinweis(rahmen, 'Vier Bereiche', 'Biologie · Analysis II · Soziologie · Privat'); } });
    } else if (schirm === 'lernkarten' || schirm === 'lernsitzung') {
      eintraege.push({ wort: 'Deck bearbeiten', ico: 'pencil', tun: function () { hinweis(rahmen, 'Deck „Zellbiologie"', '84 Karten · 12 fällig'); } });
      eintraege.push({ wort: 'Lernplan ändern', ico: 'clock', tun: function () { hinweis(rahmen, 'Lernplan', '12 Karten am Tag · 19:00'); } });
      eintraege.push({ wort: 'Karten zurücksetzen', ico: 'undo', gefahr: true, tun: function () { hinweis(rahmen, 'Fortschritt zurückgesetzt', '84 Karten stehen wieder auf Anfang'); } });
    } else {
      eintraege.push({ wort: 'Ansicht anpassen', ico: 'sidebar', tun: function () { hinweis(rahmen, 'Ansicht angepasst', 'Dichte: mittel'); } });
      eintraege.push({ wort: 'Diesen Schirm teilen', ico: 'share', tun: function () { hinweis(rahmen, 'Link kopiert', 'Nur Lesen · läuft in 7 Tagen ab'); } });
    }
    return eintraege;
  }

  function ordnungsmenue(rahmen, knopf) {
    var art = knopf.__pvOrdnung || 'geändert';
    var machen = function (n) {
      return { wort: n.wort, ico: 'sort', wahl: art === n.id, tun: function () { knopf.__pvOrdnung = n.id; listeSortieren(rahmen, n.id); } };
    };
    return [
      machen({ id: 'geändert', wort: 'Zuletzt geändert' }),
      machen({ id: 'titel', wort: 'Titel A–Z' }),
      machen({ id: 'erstellt', wort: 'Zuletzt erstellt' }),
      machen({ id: 'faden', wort: 'Nach Fäden' }),
    ];
  }

  /* Sortieren heißt hier: die Zeilen, die dastehen, wechseln die Reihenfolge.
     Zwei Ordnungen sind echt (Titel, Bestand), zwei sind eine Umkehr —
     mehr gibt der Bestand nicht her, und mehr braucht es nicht: sichtbar
     anders ist die Anforderung, nicht vollständig simuliert. */
  function listeSortieren(rahmen, art) {
    var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.scroll .row'))
      .filter(function (z) { return !z.closest('aside') && !z.classList.contains('sem__zeile'); });
    if (zeilen.length < 2) {
      var buecher = Array.prototype.slice.call(rahmen.querySelectorAll('.shelf .book'));
      if (buecher.length < 2) { hinweis(rahmen, 'Sortiert nach ' + art, 'Diese Ansicht hat nur eine Zeile'); return; }
      zeilen = buecher;
    }
    var wirt = zeilen[0].parentNode;
    zeilen = zeilen.filter(function (z) { return z.parentNode === wirt; });
    zeilen.forEach(function (z, i) { if (z.__pvRang === undefined) z.__pvRang = i; });
    var sortiert = zeilen.slice();
    if (art === 'titel') sortiert.sort(function (a, b) { return titelVon(a).localeCompare(titelVon(b), 'de'); });
    else if (art === 'erstellt') sortiert.sort(function (a, b) { return b.__pvRang - a.__pvRang; });
    else if (art === 'frist') sortiert.sort(function (a, b) { return (zeileDringend(b) ? 1 : 0) - (zeileDringend(a) ? 1 : 0); });
    else if (art === 'faden') sortiert.sort(function (a, b) { return fadenZahl(b) - fadenZahl(a); });
    else sortiert.sort(function (a, b) { return a.__pvRang - b.__pvRang; });
    sortiert.forEach(function (z) { wirt.appendChild(z); });
    schmutzig(rahmen);
    sagen('Sortiert nach ' + art + ' — ' + sortiert.length + ' Zeilen.');
    markenAuffrischen();
  }

  function titelVon(z) {
    var t = z.querySelector('.row__title, .book__title, .t-body');
    return t ? textVon(t) : textVon(z);
  }

  function fadenZahl(z) {
    return z.querySelectorAll('.dot--node, .thread, .klammer__zug').length;
  }

  function erledigteZeigen(rahmen) {
    var an = !rahmen.__pvErledigte;
    rahmen.__pvErledigte = an;
    var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.row')).filter(zeileErledigt);
    if (!zeilen.length) {
      var kasten = rahmen.querySelector('.card--flat');
      if (kasten && /erledigt/i.test(textVon(kasten))) {
        kasten.classList.toggle('is-open', an);
        hinweis(rahmen, an ? 'Erledigte eingeblendet' : 'Erledigte ausgeblendet', '2 heute abgehakt');
        return;
      }
    }
    zeilen.forEach(function (z) { z.classList.toggle('pv-gefiltert', !an); });
    schmutzig(rahmen);
    hinweis(rahmen, an ? 'Erledigte eingeblendet' : 'Erledigte ausgeblendet', zeilen.length + ' Aufgaben');
  }

  /* „Auswählen" — der Modus, den jede Liste im System hat. Er setzt Kreise
     vor die Zeilen und die Übergabeleiste an den unteren Rand, die es hier
     schon gibt. */
  function auswahlModus(rahmen) {
    var an = !rahmen.__pvAuswahl;
    rahmen.__pvAuswahl = an;
    var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.scroll .row'))
      .filter(function (z) { return !z.closest('aside'); });
    zeilen.forEach(function (z) { z.classList.toggle('pv-waehlbar', an); });
    schmutzig(rahmen);
    hinweis(rahmen, an ? 'Auswahl an' : 'Auswahl aus', an ? 'Tippe Zeilen an — unten steht, was du damit tun kannst' : null);
  }

  /* Info-Taste: die Tafel rechts geht zu und wieder auf. Auf dem iPhone gibt
     es keine Tafel — dort wird sie als Blatt gezeigt. */
  function seiteneinschubUmschalten(rahmen, knopf) {
    schmutzig(rahmen);
    var tafel = rahmen.querySelector('.body > aside:last-child, .inspector, .ginspect, main + aside');
    if (tafel && tafel !== rahmen.querySelector('aside.sidebar')) {
      var zu = !tafel.hidden;
      verbergen(tafel, !zu ? false : true);
      knopf.classList.toggle('is-active', !zu);
      knopf.setAttribute('aria-expanded', !zu ? 'true' : 'false');
      sagen(zu ? 'Tafel zu — mehr Platz für den Text.' : 'Tafel auf — Fäden, Zahlen, Herkunft.');
      markenAuffrischen();
      return;
    }
    listenmenue(knopf, 'DIESE NOTIZ', [
      { wort: '1 240 Wörter · 6 Absätze', ico: 'doc' },
      { wort: '4 Fäden — 2 hinein, 2 hinaus', ico: 'link' },
      { wort: 'Angelegt 6. Nov, 10:03', ico: 'clock' },
      { wort: 'Zuletzt geändert heute, 16:20', ico: 'clock' },
    ]);
  }

  function seitenleisteUmschalten(rahmen, knopf) {
    var leiste = rahmen.querySelector('aside.sidebar');
    if (!leiste) return;
    schmutzig(rahmen);
    var zu = !leiste.hidden && leiste.style.display !== 'none';
    verbergen(leiste, zu ? true : false);
    knopf.setAttribute('aria-expanded', zu ? 'false' : 'true');
    sagen(zu ? 'Seitenleiste eingeklappt.' : 'Seitenleiste ausgeklappt.');
    markenAuffrischen();
  }

  /* ── 14l · Zeilen, die eine Auswahl sind ─────────────────────────────────
     „Diese Woche 7", „Markiert mit Stern 4", „Notizen 14", „Tinte 3" — eine
     Zeile mit einer Zahl rechts ist im System immer eine Auswahl. Sie führt
     dorthin, wo diese Sachen liegen; gibt es den Schirm, wird navigiert, und
     wenn nicht, wird an Ort und Stelle gefiltert. */
  var SAMMLUNG_ZIEL = {
    'notizen': 'notizen', 'notiz': 'notizen', 'alle notizen': 'notizen',
    'canvas-blätter': 'canvas', 'canvas': 'canvas',
    'journaleinträge': 'journal', 'journal': 'journal',
    'aufgaben': 'aufgaben', 'lernkarten': 'lernkarten', 'karten': 'lernkarten',
  };

  function sammlungszeilenBeleben(rahmen) {
    var kandidaten = Array.prototype.slice.call(
      rahmen.querySelectorAll('button.row, button.card--flat, .scroll button.navitem'));
    kandidaten.forEach(function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.closest('aside')) return;
      var name = textVon(k).replace(/\s*\d+\s*$/, '').trim();
      var ziel = leitetAuf(SAMMLUNG_ZIEL[name.toLowerCase()]);
      if (ziel) {
        beleben(k, { ziel: ziel, richtung: 'vor', titel: name + ' öffnen' });
        return;
      }
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'zeigt „' + name + '"',
        titel: name,
        tun: function () {
          schmutzig(rahmen);
          var geschwister = Array.prototype.slice.call(k.parentNode.children).filter(function (g) {
            return g.tagName === 'BUTTON';
          });
          geschwister.forEach(function (g) {
            g.classList.toggle('is-selected', g === k);
            g.setAttribute('aria-pressed', g === k ? 'true' : 'false');
          });
          hinweis(rahmen, name, 'Diese Auswahl steht jetzt oben in der Liste.');
        },
      });
    });
  }

  /* ── 14m · Das Aufgaben-Detail ───────────────────────────────────────────
     „Geplant Heute", „Frist Fr, 15. Nov", „Bereich Biologie", „Wiederholung
     Keine", „Ort Labor 3.14" — fünf Eigenschaftszeilen, die alle dasselbe
     Versprechen geben: tipp mich an, ich ändere mich. Jede bekommt ein Menü
     mit echten Werten; die gewählte Zeile schreibt den Wert hin.

     Dazu „Verschieben", „Duplizieren", „Teilen" und „Ganzen Verlauf zeigen". */
  var EIGENSCHAFT_WERTE = {
    'geplant':      ['Heute', 'Morgen', 'Diese Woche', 'Ohne Termin'],
    'frist':        ['Fr, 15. Nov', 'Mo, 18. Nov', 'Ende des Monats', 'Keine Frist'],
    'bereich':      ['Biologie', 'Analysis II', 'Soziologie', 'Privat'],
    'wiederholung': ['Keine', 'Täglich', 'Wöchentlich', 'Jeden Werktag'],
    'ort':          ['Labor 3.14', 'Hörsaal B', 'Bibliothek', 'Zuhause'],
    'priorität':    ['Keine', 'Mittel', 'Hoch', 'Sehr hoch'],
  };

  function aufgabenDetailBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('article button, .card button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.classList.contains('iconbtn') || k.classList.contains('btn')) return;
      var t = textVon(k);
      var schluessel = null;
      Object.keys(EIGENSCHAFT_WERTE).forEach(function (s) {
        if (!schluessel && new RegExp('^' + s, 'i').test(t)) schluessel = s;
      });
      if (!schluessel) return;
      var werte = EIGENSCHAFT_WERTE[schluessel];
      var wertfeld = k.lastElementChild && k.lastElementChild !== k.firstElementChild
        ? k.lastElementChild : null;
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'ändert „' + schluessel + '"',
        titel: t,
        tun: function () {
          var jetztWert = wertfeld ? textVon(wertfeld) : '';
          listenmenue(k, schluessel.toUpperCase(), werte.map(function (w) {
            return {
              wort: w, ico: 'check', wahl: w === jetztWert,
              tun: function () {
                schmutzig(rahmen);
                if (wertfeld) wertfeld.textContent = w;
                k.classList.toggle('is-off', /^kein/i.test(w));
                sagen(schluessel.charAt(0).toUpperCase() + schluessel.slice(1) + ': ' + w + '.');
                markenAuffrischen();
              },
            };
          }));
        },
      });
    });

    Array.prototype.forEach.call(rahmen.querySelectorAll('.btn'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k);
      if (/^Verschieben$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'verschiebt in einen anderen Bereich', titel: 'Verschieben',
          tun: function () {
            listenmenue(k, 'VERSCHIEBEN NACH', EIGENSCHAFT_WERTE['bereich'].map(function (b) {
              return { wort: b, ico: 'folder', tun: function () { hinweis(rahmen, 'Verschoben nach „' + b + '"', 'Die Fäden bleiben, wo sie waren'); } };
            }));
          },
        });
      } else if (/^Duplizieren$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'legt eine Kopie an', titel: 'Duplizieren',
          tun: function () { aufgabeDuplizieren(rahmen); },
        });
      } else if (/^Teilen$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'zeigt, was geteilt würde', titel: 'Teilen',
          tun: function () {
            listenmenue(k, 'TEILEN', [
              { wort: 'Als Text kopieren', ico: 'doc', tun: function () { hinweis(rahmen, 'Kopiert', 'Titel, Frist und zwei Schritte'); } },
              { wort: 'An Jana schicken', ico: 'share', tun: function () { hinweis(rahmen, 'An Jana geschickt', 'Sie sieht die Aufgabe, nicht die Notiz dahinter'); } },
              { wort: 'In den Kalender', ico: 'calendar', tun: function () { hinweis(rahmen, 'Im Kalender eingetragen', 'Freitag, 15. Nov · 14:00'); } },
            ]);
          },
        });
      } else if (/Ganzen Verlauf/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'klappt den ganzen Verlauf auf', titel: 'Ganzen Verlauf zeigen',
          tun: function () { verlaufAufklappen(rahmen, k); },
        });
      } else if (/^Jetzt sortieren$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'sortiert die Liste nach Frist', titel: 'Jetzt sortieren',
          tun: function () { listeSortieren(rahmen, 'frist'); },
        });
      } else if (/^Bereich$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'wählt den Bereich', titel: 'Bereich',
          tun: function () {
            listenmenue(k, 'BEREICH', ['Alle Bereiche'].concat(EIGENSCHAFT_WERTE['bereich']).map(function (b) {
              return { wort: b, ico: 'folder', tun: function () { bereichFiltern(rahmen, b); } };
            }));
          },
        });
      }
    });
  }

  function bereichFiltern(rahmen, bereich) {
    var zeilen = Array.prototype.slice.call(rahmen.querySelectorAll('.scroll .row'))
      .filter(function (z) { return !z.closest('aside'); });
    var alles = /^alle/i.test(bereich);
    var n = 0;
    zeilen.forEach(function (z) {
      var ja = alles || textVon(z).toLowerCase().indexOf(bereich.toLowerCase().split(' ')[0]) >= 0
        || !!z.closest('[data-pv-bereich="' + bereich + '"]');
      if (ja) n++;
      z.classList.toggle('pv-gefiltert', !ja);
    });
    schmutzig(rahmen);
    hinweis(rahmen, bereich, n + ' von ' + zeilen.length + ' Aufgaben');
  }

  function aufgabeDuplizieren(rahmen) {
    var zeile = rahmen.querySelector('.row.is-selected') || rahmen.querySelector('.scroll .row');
    if (!zeile) { hinweis(rahmen, 'Dupliziert', 'Die Kopie steht darunter'); return; }
    var kopie = zeile.cloneNode(true);
    kopie.removeAttribute('id');
    kopie.classList.remove('is-selected', 'pv-lebt', 'pv-wege-ort');
    kopie.classList.add('pv-waechst');
    Array.prototype.forEach.call(kopie.querySelectorAll('.pv-lebt'), function (e) { e.classList.remove('pv-lebt', 'pv-wege-ort'); });
    var titel = kopie.querySelector('.row__title, .t-body');
    if (titel) titel.textContent = textVon(titel) + ' (Kopie)';
    zeile.parentNode.insertBefore(kopie, zeile.nextSibling);
    beleben_ikonen(kopie);
    schmutzig(rahmen);
    frischAufbauen(rahmen);
    sagen('Dupliziert — die Kopie steht direkt darunter.');
    markenAuffrischen();
  }

  function verlaufAufklappen(rahmen, knopf) {
    if (knopf.__pvOffen) { hinweis(rahmen, 'Der ganze Verlauf steht schon da', null); return; }
    knopf.__pvOffen = 1;
    var kasten = knopf.closest('section, .card') || knopf.parentNode;
    var mehr = bau('<div class="pv-verlauf pv-waechst"></div>');
    [
      ['13. Nov · 16:42', 'Aus der Notiz „Zellbiologie" entstanden', 'notes'],
      ['13. Nov · 16:44', 'Frist auf Freitag gesetzt', 'tasks'],
      ['14. Nov · 09:10', 'Erster Schritt abgehakt', 'tasks'],
      ['14. Nov · 11:02', 'Ort „Labor 3.14" ergänzt', 'tasks'],
    ].forEach(function (e) {
      var z = bau('<div class="pv-verlauf__zeile"><span class="dot dot--' + e[2] + '"></span>' +
        '<div style="display:flex; flex-direction:column; gap:1px; min-width:0">' +
        '<span class="t-sub c-1 pv-verlauf__was"></span>' +
        '<span class="t-label c-3 pv-verlauf__wann"></span></div></div>');
      z.querySelector('.pv-verlauf__was').textContent = e[1];
      z.querySelector('.pv-verlauf__wann').textContent = e[0];
      mehr.appendChild(z);
    });
    kasten.insertBefore(mehr, knopf);
    knopf.textContent = 'Verlauf einklappen';
    beleben(knopf, {
      ziel: 'nichts', wirkt: 'klappt den Verlauf ein', titel: 'Verlauf einklappen',
      tun: function () {
        mehr.remove();
        knopf.textContent = 'Ganzen Verlauf zeigen';
        knopf.__pvOffen = 0;
        frischAufbauen(rahmen);
        sagen('Verlauf eingeklappt.');
      },
    });
    schmutzig(rahmen);
    sagen('Vier weitere Schritte — von der Notiz bis zum Ort.');
    markenAuffrischen();
  }

  /* ── 14n · Die Lernsitzung ───────────────────────────────────────────────
     „Bis morgen zurücklegen", „Aussetzen", „Bearbeiten", „Leeren",
     „Zurücknehmen" und der Herkunftsknopf auf der Kartenrückseite. Die
     Sitzung ist der Ort des einen Moments, den diese App hat (DNA §1) — dass
     dort fünf Knöpfe tot sind, war der teuerste Einzelbefund der Messung. */
  function lernsitzungBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.btn'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k);

      if (/zurücklegen/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'legt die Karte auf morgen', titel: 'Bis morgen zurücklegen',
          tun: function () { kartenZahlAendern(rahmen, -1, 'Zurückgelegt', 'Diese Karte kommt morgen wieder.'); },
        });
      } else if (/^Aussetzen$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'setzt die Karte aus', titel: 'Aussetzen',
          tun: function () { kartenZahlAendern(rahmen, -1, 'Ausgesetzt', 'Die Karte kommt erst wieder, wenn du sie holst.'); },
        });
      } else if (/^Bearbeiten$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'öffnet die Karte zum Ändern', titel: 'Bearbeiten',
          tun: function () { karteBearbeiten(rahmen); },
        });
      } else if (/^Leeren$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'leert die Ablage', titel: 'Leeren',
          tun: function () {
            var kasten = k.closest('section, .card');
            var zeilen = kasten ? Array.prototype.slice.call(kasten.querySelectorAll('.row, .chip')) : [];
            zeilen.forEach(function (z) { z.classList.add('pv-gefiltert'); });
            schmutzig(rahmen);
            widerrufZeigen(rahmen, 'Ablage geleert', function () {
              zeilen.forEach(function (z) { z.classList.remove('pv-gefiltert'); });
            });
            sagen('Ablage geleert — Widerrufen steht bereit.');
          },
        });
      } else if (/^Zurücknehmen$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'nimmt die letzte Bewertung zurück', titel: 'Zurücknehmen',
          tun: function () { kartenZahlAendern(rahmen, 1, 'Bewertung zurückgenommen', 'Die Karte steht wieder im Stapel.'); },
        });
      }
    });

    /* Der Knopf auf der Kartenrückseite: „aus ‚Zellbiologie', 16:42". Das ist
       der Faden dieser Karte zu ihrem Ursprung — der eine Weg, der in dieser
       App wirklich zählt. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.bw-flip__seite--hinten button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (!leitetAuf('notiz')) return;
      beleben(k, {
        ziel: 'notiz', richtung: 'vor',
        titel: 'Die Stelle öffnen, an der diese Karte entstanden ist',
      });
    });
  }

  function kartenZahlAendern(rahmen, delta, satz, dazu) {
    schmutzig(rahmen);
    var geaendert = false;
    Array.prototype.forEach.call(rahmen.querySelectorAll('.num'), function (n) {
      if (geaendert) return;
      var t = textVon(n);
      var m = t.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (m) {
        n.textContent = Math.max(0, +m[1] + delta) + ' / ' + m[2];
        geaendert = true;
      }
    });
    hinweis(rahmen, satz, dazu);
  }

  function karteBearbeiten(rahmen) {
    var seite = rahmen.querySelector('.bw-flip__seite--hinten .t-body, .bw-flip__seite--vorn .t-body')
      || rahmen.querySelector('.card .t-body');
    if (!seite) { hinweis(rahmen, 'Karte bearbeiten', 'Vorder- und Rückseite ändern'); return; }
    schmutzig(rahmen);
    seite.setAttribute('contenteditable', 'true');
    seite.classList.add('pv-schreibt');
    try { seite.focus(); } catch (e) { /* egal */ }
    hinweis(rahmen, 'Karte offen zum Ändern', 'Die Schreibmarke steht in der Antwort.');
  }

  /* ── 14o · Der Notiz-Editor ──────────────────────────────────────────────
     Gliederung (sechs Zeilen rechts), Format (H1, Liste, Code), Ein- und
     Ausklappen der Abschnitte. Die Gliederung führt an ihre Stelle im Text —
     das ist der einzige Weg im Editor, der WIRKLICH etwas findet, weil die
     Überschriften im Text stehen. */
  function editorBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('aside button, .pv-tafel button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k);
      if (!/^#{1,3}\s|^Semesterplanung/.test(t)) return;
      var ziel = t.replace(/^#+\s*/, '').trim();
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'springt zu „' + ziel + '"',
        titel: ziel + ' im Text',
        tun: function () {
          schmutzig(rahmen);
          Array.prototype.forEach.call(rahmen.querySelectorAll('aside button'), function (b) {
            b.classList.toggle('is-active', b === k);
          });
          var treffer = null;
          Array.prototype.forEach.call(rahmen.querySelectorAll('main .t-body, main h1, main h2, main h3, main .serif--voice'), function (e) {
            if (!treffer && textVon(e).indexOf(ziel) === 0) treffer = e;
          });
          if (treffer) {
            var scroll = treffer.closest('.scroll');
            if (scroll) scroll.scrollTop = treffer.offsetTop - 40;
            treffer.classList.add('pv-gefunden');
            global.setTimeout(function () { treffer.classList.remove('pv-gefunden'); }, 1400);
            sagen('„' + ziel + '" — die Stelle steht oben.');
          } else {
            sagen('„' + ziel + '" — im Text markiert.');
          }
          markenAuffrischen();
        },
      });
    });

    /* Ein- und Ausklappen der Abschnitte im Text. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k) + ' ' + (k.getAttribute('aria-label') || '');
      if (!/Abschnitt (ein|auf)klappen/i.test(t)) return;
      beleben(k, {
        ziel: 'nichts', wirkt: 'klappt den Abschnitt zu und auf', titel: 'Abschnitt ein- und ausklappen',
        tun: function () {
          schmutzig(rahmen);
          var kasten = k.closest('section, .card, div');
          var zu = kasten ? !kasten.classList.contains('is-zu') : false;
          if (kasten) kasten.classList.toggle('is-zu', zu);
          k.setAttribute('aria-expanded', zu ? 'false' : 'true');
          var pfeil = k.querySelector('.ico');
          if (pfeil) { pfeil.setAttribute('data-ico', zu ? 'chevR' : 'chevD'); beleben_ikonen(k); }
          sagen(zu ? 'Abschnitt eingeklappt.' : 'Abschnitt aufgeklappt.');
          markenAuffrischen();
        },
      });
    });

    /* Die Formatleiste: H1, Liste, Code. Sie schaltet den Zustand um — mehr
       kann eine Leiste ohne Auswahl im Text auch im System nicht. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('.iconbtn, button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k);
      if (!/^(H1|H2|H3|B|I|<\/>)$/.test(t)) return;
      beleben(k, {
        ziel: 'nichts', wirkt: 'schaltet das Format um', titel: t,
        tun: function () {
          schmutzig(rahmen);
          var an = !k.classList.contains('is-active');
          k.classList.toggle('is-active', an);
          k.setAttribute('aria-pressed', an ? 'true' : 'false');
          sagen(t + (an ? ' an' : ' aus') + ' — gilt für den Absatz, in dem die Marke steht.');
          markenAuffrischen();
        },
      });
    });
  }

  /* ── 14p · Übergabe-Chips ────────────────────────────────────────────────
     „Aufgabe", „Journal", „Notiz", „Bereich", „Frage/Antwort" in einer
     .handoff-Leiste sind die Übergabe: aus dieser Sache wird jene. §13f
     belebt bisher nur den primären und das Kreuz — die anderen bleiben
     stehen wie Angebote, die niemand annimmt. */
  var UEBERGABE_ZIEL = {
    'aufgabe': 'aufgaben', 'aufgaben': 'aufgaben',
    'notiz': 'notiz', 'notizen': 'notiz',
    'journal': 'journal-eintrag', 'journaleintrag': 'journal-eintrag',
    'karte': 'lernkarten', 'karten': 'lernkarten', 'lernkarten': 'lernkarten',
    'frage/antwort': 'lernkarten', 'canvas': 'canvas',
  };

  function uebergabeChipsBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.handoff__btn'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.hasAttribute('data-bw')) return;
      var name = wort(k);
      if (!name) {
        /* Der schmale Knopf ohne Wort ist das „mehr" der Leiste. */
        beleben(k, {
          ziel: 'nichts', wirkt: 'zeigt die übrigen Übergaben', titel: 'Weitere Übergaben',
          tun: function () {
            listenmenue(k, 'ÜBERGEBEN AN', ['Notiz', 'Aufgabe', 'Journal', 'Lernkarten', 'Canvas'].map(function (w) {
              var z = leitetAuf(UEBERGABE_ZIEL[w.toLowerCase()]);
              return { wort: w, punkt: punktVon(w), tun: function () {
                if (z) gehen(z, 'vor', false, k);
                else hinweis(rahmen, 'Übergeben an ' + w, 'Der Faden zeigt von hier dorthin.');
              } };
            }));
          },
        });
        return;
      }
      var ziel = leitetAuf(UEBERGABE_ZIEL[name]);
      beleben(k, {
        ziel: ziel || 'nichts',
        richtung: 'vor',
        wirkt: ziel ? null : 'übergibt an „' + textVon(k) + '"',
        titel: 'Übergeben an ' + textVon(k),
        tun: ziel ? null : function () {
          hinweis(rahmen, 'Übergeben an ' + textVon(k), 'Der Faden zeigt von hier dorthin.');
        },
      });
    });
  }

  function punktVon(w) {
    var m = { 'notiz': 'notes', 'aufgabe': 'tasks', 'journal': 'journal', 'lernkarten': 'cards', 'canvas': 'canvas' };
    return m[w.toLowerCase()] || 'notes';
  }

  /* ── 14q · Der Rest, einzeln ─────────────────────────────────────────────
     Knöpfe, die keiner Familie angehören. Jeder steht hier mit seinem Wort,
     weil jeder etwas anderes verspricht. */
  function einzelneBeleben(rahmen) {
    var schirm = rahmen.getAttribute('data-pv-screen');

    Array.prototype.forEach.call(rahmen.querySelectorAll('button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.hasAttribute('data-bw')) return;
      var t = textVon(k);

      /* Das Kreuz im Suchfeld. */
      if (/Eingabe löschen/i.test(t + (k.getAttribute('aria-label') || ''))
          || (symbolVon(k) === 'close' && k.closest('.field'))) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'löscht die Eingabe', titel: 'Eingabe löschen',
          tun: function () {
            schmutzig(rahmen);
            var feld = k.closest('.field');
            if (feld) {
              var text = feld.querySelector('input, .t-body, .t-sub');
              if (text) {
                if (text.tagName === 'INPUT') text.value = '';
                else text.textContent = '';
              }
            }
            sucheLeeren(rahmen);
            sagen('Eingabe gelöscht — die Suche wartet auf ein neues Wort.');
            markenAuffrischen();
          },
        });
        return;
      }

      if (/^Sichern$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'sichert die erfasste Aufgabe', titel: 'Sichern',
          tun: function () { aufgabeSichern(rahmen); },
        });
        return;
      }

      if (/^Lernen$/i.test(t) && leitetAuf('lernsitzung')) {
        beleben(k, { ziel: 'lernsitzung', richtung: 'vor', titel: 'Lernen — die fällige Karte kommt' });
        return;
      }

      if (/^Bearbeiten$/i.test(t) && schirm === 'journal-eintrag') {
        beleben(k, {
          ziel: 'nichts', wirkt: 'öffnet den Eintrag zum Schreiben', titel: 'Bearbeiten',
          tun: function () {
            schmutzig(rahmen);
            var text = rahmen.querySelector('.serif--voice, main .t-body');
            if (text) {
              text.setAttribute('contenteditable', 'true');
              text.classList.add('pv-schreibt');
              try { text.focus(); } catch (e) { /* egal */ }
            }
            k.textContent = 'Fertig';
            sagen('Der Eintrag ist offen — die Schreibmarke steht im Text.');
            markenAuffrischen();
          },
        });
        return;
      }

      if (/^Ältere Einträge/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'holt die Einträge aus dem Oktober', titel: 'Ältere Einträge',
          tun: function () { aeltereHolen(rahmen, k); },
        });
        return;
      }

      if (/nacharbeiten/i.test(t)) {
        beleben(k, {
          ziel: leitetAuf('lernkarten') || 'nichts', richtung: 'vor',
          titel: 'Woche 6 nacharbeiten',
          wirkt: leitetAuf('lernkarten') ? null : 'plant die Woche nach',
          tun: leitetAuf('lernkarten') ? null : function () {
            hinweis(rahmen, 'Woche 6 nachgearbeitet', '14 Sachen · verteilt auf vier Tage');
          },
        });
        return;
      }

      if (/^Nur (diesen )?Cluster/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'zeigt nur diesen Cluster', titel: 'Nur diesen Cluster',
          tun: function () { clusterZeigen(rahmen, k); },
        });
        return;
      }

      if (/^Foto$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'legt ein Foto in den Eingang', titel: 'Foto aufnehmen',
          tun: function () { hinweis(rahmen, 'Foto liegt im Eingang', 'Der Text darauf ist schon durchsuchbar'); },
        });
        return;
      }

      if (/^(Zuletzt geändert|Geändert|Verweise)$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'ändert die Ordnung', titel: t,
          tun: function () { listenmenue(k, 'SORTIEREN', ordnungsmenue(rahmen, k)); },
        });
        return;
      }

      /* Karten im leeren Zustand: „Zellbiologie, Hörsaal B — heute 10:15". */
      if (k.classList.contains('card--flat') && /Kalender|Fotos|Eintrag|Notiz/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'nimmt den Vorschlag an', titel: t.slice(0, 60),
          tun: function () { vorschlagAnnehmen(rahmen, k); },
        });
        return;
      }
    });

    /* Die Zeile „Heute erledigt 2" klappt die erledigten Aufgaben auf. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('button.card--flat'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (!/erledigt/i.test(textVon(k))) return;
      beleben(k, {
        ziel: 'nichts', wirkt: 'klappt die erledigten Aufgaben auf', titel: 'Heute erledigt',
        tun: function () { erledigteZeigen(rahmen); },
      });
    });
  }

  function sucheLeeren(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.scroll section.card'), function (s) {
      s.classList.add('pv-gefiltert');
    });
    var scroll = rahmen.querySelector('.scroll');
    if (!scroll) return;
    if (scroll.querySelector('.pv-leervermerk')) return;
    var kasten = bau(
      '<div class="pv-leervermerk">' +
        '<div class="t-body c-2">Vier Schichten warten: Text, Handschrift, Bild, Gesprochenes.</div>' +
        '<div class="t-label c-3">Schreib ein Wort — gesucht wird auch, was du nur gezeichnet hast.</div>' +
      '</div>');
    scroll.appendChild(kasten);
  }

  function aeltereHolen(rahmen, knopf) {
    if (knopf.__pvGeholt) { sagen('Der Oktober steht schon da.'); return; }
    knopf.__pvGeholt = 1;
    var wirt = knopf.parentNode;
    [
      ['31', 'Okt.', 'Letzter Labortag vor der Pause', 'Die Kultur läuft weiter, Jana schaut nach ihr.'],
      ['24', 'Okt.', 'Nach der Übung bei Prof. Wendt', 'Der Beweis zum Satz von Bolzano ist jetzt klar.'],
      ['17', 'Okt.', 'Erste Woche im Labor', 'Alles riecht nach Ethanol. Die Pipette sitzt schon besser.'],
    ].forEach(function (e) {
      var block = bau(
        '<div class="pv-waechst" style="display:flex; gap:14px; padding:10px 0">' +
          '<div class="jz jz--pad" style="flex:none">' +
            '<span class="serif--journal-date num pv-alt__tag"></span>' +
            '<span class="t-label c-3 pv-alt__monat"></span>' +
          '</div>' +
          '<article class="card" style="flex:1 1 auto; min-width:0">' +
            '<div class="t-sub is-strong pv-alt__kopf"></div>' +
            '<p class="serif--voice pv-alt__text"></p>' +
          '</article>' +
        '</div>');
      block.querySelector('.pv-alt__tag').textContent = e[0];
      block.querySelector('.pv-alt__monat').textContent = e[1];
      block.querySelector('.pv-alt__kopf').textContent = e[2];
      block.querySelector('.pv-alt__text').textContent = e[3];
      wirt.insertBefore(block, knopf);
      if (leitetAuf('journal-eintrag')) {
        beleben(block.querySelector('article'), { ziel: 'journal-eintrag', richtung: 'vor', titel: e[2] });
      }
    });
    knopf.textContent = 'Das war der Oktober';
    knopf.classList.add('is-off');
    schmutzig(rahmen);
    sagen('Drei Einträge aus dem Oktober — der Faden reicht weiter zurück.');
    markenAuffrischen();
  }

  function clusterZeigen(rahmen, knopf) {
    var an = !knopf.__pvNur;
    knopf.__pvNur = an;
    var knoten = Array.prototype.slice.call(rahmen.querySelectorAll('.gn, .gnode'));
    knoten.forEach(function (k, i) {
      k.classList.toggle('pv-fern', an && i % 3 !== 0);
    });
    knopf.textContent = an ? 'Wieder alle zeigen' : 'Nur diesen Cluster';
    schmutzig(rahmen);
    sagen(an ? 'Nur dieser Cluster — die anderen Knoten treten zurück.' : 'Wieder alle Knoten.');
    markenAuffrischen();
  }

  function vorschlagAnnehmen(rahmen, karte) {
    schmutzig(rahmen);
    karte.classList.add('pv-verblasst');
    var was = /Foto/i.test(textVon(karte)) ? 'Journaleintrag' : 'Notiz';
    widerrufZeigen(rahmen, was + ' angelegt', function () {
      karte.classList.remove('pv-verblasst');
    });
    sagen(was + ' aus dem Vorschlag angelegt — Widerrufen steht bereit.');
  }

  /* ── 14s · Der Rest des Restes ───────────────────────────────────────────
     Sieben Fälle, die keiner Familie folgen und einzeln nachgemessen wurden. */

  /* Die Merken-Kästchen im Notiz-Editor. §5g macht aus ihnen reine Haken —
     aber ohne .pv-lebt kommt kein Klick durch (prototyp.css §4, Regel 2:
     nichts in einer Rollfläche ist ein Ziel). Sie haken jetzt wirklich ab. */
  function hakenBeleben(rahmen) {
    /* Dazu die Kästchen, die schon einen Haken tragen. Sie hatten nie eine
       Erledigen-Bewegung — die hängt nur an den offenen —, und blieben
       darum als einzige Kästchen der App unantastbar. Ein Haken, den man
       nicht zurücknehmen kann, ist keiner. */
    Array.prototype.forEach.call(rahmen.querySelectorAll('button'), function (k) {
      if (k.hasAttribute('data-pv-haken') || k.hasAttribute('data-bw')) return;
      if (k.children.length !== 1) return;
      var kind = k.firstElementChild;
      if (!kind || !kind.classList || !kind.classList.contains('check')) return;
      k.setAttribute('data-pv-haken', '');
      k.setAttribute('aria-pressed', kind.classList.contains('is-done') ? 'true' : 'false');
    });

    Array.prototype.forEach.call(rahmen.querySelectorAll('[data-pv-haken]'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'hakt ab',
        titel: 'Abhaken',
        tun: function () {
          schmutzig(rahmen);
          var an = k.getAttribute('aria-pressed') !== 'true';
          k.setAttribute('aria-pressed', String(an));
          var haken = k.querySelector('.bw-check');
          if (haken) haken.classList.toggle('is-an', an);
          var kasten = k.querySelector('.check');
          if (kasten) kasten.classList.toggle('is-done', an);
          sagen(an ? 'Abgehakt — der Punkt bleibt in der Notiz stehen.' : 'Haken zurückgenommen.');
          markenAuffrischen();
        },
      });
    });
  }

  /* Chipreihen aus <span> — auf dem iPhone sind die Filter der Notizenliste
     keine Knöpfe. Gleiches Aussehen, gleiche Erwartung, also gleiche Wirkung. */
  function spanChipsBeleben(rahmen) {
    var reihen = [];
    Array.prototype.forEach.call(rahmen.querySelectorAll('span.chip'), function (c) {
      if (c.parentNode && reihen.indexOf(c.parentNode) < 0) reihen.push(c.parentNode);
    });
    reihen.forEach(function (reihe) {
      var chips = Array.prototype.slice.call(reihe.children).filter(function (c) {
        return c.tagName === 'SPAN' && c.classList.contains('chip');
      });
      if (chips.length < 3) return;                       /* zwei Chips sind Beiwerk */
      if (!chips.some(function (c) { return c.classList.contains('chip--solid'); })) return;
      if (chips[0].classList.contains('pv-lebt')) return;
      /* Eine Reihe aus Tags („#uni/bio · #labor") ist kein Filter, sondern
         eine Angabe. Erkannt am Rautezeichen. */
      if (chips.filter(function (c) { return /^#/.test(textVon(c)); }).length > chips.length / 2) return;

      chips.forEach(function (c) {
        var name = wort(c);
        beleben(c, {
          ziel: 'nichts',
          wirkt: 'zeigt nur „' + textVon(c) + '"',
          titel: textVon(c),
          tun: function () {
            schmutzig(rahmen);
            chips.forEach(function (b) { b.classList.toggle('chip--solid', b === c); });
            notizenFilter(rahmen, name, textVon(c));
            markenAuffrischen();
          },
        });
      });
    });
  }

  /* „Fäden" in der Leiste des Semester-Ordners: ein Umschalter für das
     Fadenbild. Er ist gefüllte Tinte — also ein Zustand, der an und aus
     gehen können muss. */
  function fadenschalterBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('button.chip'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      var t = textVon(k);

      if (/^Fäden$/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'blendet die Fäden aus und ein', titel: 'Fäden zeigen',
          tun: function () {
            schmutzig(rahmen);
            var an = !k.classList.contains('is-aus');
            k.classList.toggle('is-aus', an);
            k.classList.toggle('chip--solid', !an);
            k.classList.toggle('chip--ghost', an);
            k.setAttribute('aria-pressed', an ? 'false' : 'true');
            Array.prototype.forEach.call(rahmen.querySelectorAll('.thread, .thread-layer, .klammer__zug, .dot--node'), function (f) {
              f.classList.toggle('pv-fadenaus', an);
            });
            sagen(an ? 'Fäden aus — nur die Sachen, ohne ihre Herkunft.' : 'Fäden an — jede Sache zeigt, woraus sie entstand.');
            markenAuffrischen();
          },
        });
        return;
      }

      /* „Blick: Prüfung Februar 14" — ein gespeicherter Blick auf den
         Graphen. Er wechselt zu einem anderen. */
      if (/^Blick:/i.test(t)) {
        beleben(k, {
          ziel: 'nichts', wirkt: 'wechselt den Blick', titel: t,
          tun: function () {
            listenmenue(k, 'GESPEICHERTE BLICKE', [
              { wort: 'Prüfung Februar · 14', ico: 'star', wahl: /Februar/.test(textVon(k)), tun: function () { blickSetzen(rahmen, k, 'Prüfung Februar', 14); } },
              { wort: 'Laborjournal · 23', ico: 'star', wahl: /Labor/.test(textVon(k)), tun: function () { blickSetzen(rahmen, k, 'Laborjournal', 23); } },
              { wort: 'Alles aus diesem Semester · 61', ico: 'star', wahl: /Semester/.test(textVon(k)), tun: function () { blickSetzen(rahmen, k, 'Dieses Semester', 61); } },
            ]);
          },
        });
      }
    });
  }

  function blickSetzen(rahmen, chip, name, zahl) {
    schmutzig(rahmen);
    var z = chip.querySelector('.num');
    chip.childNodes[0].nodeValue = 'Blick: ' + name;
    if (z) z.textContent = String(zahl);
    var knoten = Array.prototype.slice.call(rahmen.querySelectorAll('.gn, .gnode'));
    knoten.forEach(function (k, i) { k.classList.toggle('pv-fern', i % 4 === 3 && zahl < 30); });
    sagen('Blick „' + name + '" — ' + zahl + ' Knoten.');
    markenAuffrischen();
  }

  /* Die Knoten im Graphen. Auf dem iPad leben sie über die Wegekarte; auf
     dem iPhone steht einer, der dort keinen Eintrag hat. Ein Knoten, der
     nicht aufgeht, nimmt dem Graphen seinen Sinn. */
  function graphKnotenBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.gn, .gnode'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.tagName !== 'BUTTON' && !k.matches('[role="button"]')) return;
      var t = textVon(k);
      var ziel = k.querySelector('.dot--cards') ? 'lernkarten'
        : k.querySelector('.dot--journal') ? 'journal-eintrag'
        : k.querySelector('.dot--tasks') ? 'aufgabe'
        : k.querySelector('.dot--canvas') ? 'canvas'
        : /semester|plan/i.test(t) ? 'semester' : 'notiz';
      beleben(k, {
        ziel: leitetAuf(ziel) || leitetAuf('notiz') || 'nichts',
        richtung: 'vor',
        titel: t + ' öffnen',
      });
    });
  }

  /* Die Werkzeugchips der Mitrechenfläche in der Lernsitzung: Stift ·
     Radierer · Lineal. Gefüllte Tinte heißt „aktiv" — also muss die
     Füllung wandern können. */
  function werkzeugChipsBeleben(rahmen) {
    var reihen = [];
    Array.prototype.forEach.call(rahmen.querySelectorAll('.chip'), function (c) {
      if (!/^(Stift|Radierer|Lineal|Text|Auswahl)$/i.test(textVon(c))) return;
      if (c.parentNode && reihen.indexOf(c.parentNode) < 0) reihen.push(c.parentNode);
    });
    reihen.forEach(function (reihe) {
      var chips = Array.prototype.slice.call(reihe.children).filter(function (c) {
        return c.classList && c.classList.contains('chip');
      });
      chips.forEach(function (c) {
        if (c.classList.contains('pv-lebt')) return;
        beleben(c, {
          ziel: 'nichts', wirkt: 'wählt „' + textVon(c) + '"', titel: textVon(c),
          tun: function () {
            schmutzig(rahmen);
            chips.forEach(function (b) {
              b.classList.toggle('chip--solid', b === c);
              b.setAttribute('aria-pressed', b === c ? 'true' : 'false');
            });
            sagen(textVon(c) + ' — das Werkzeug für die Mitrechenfläche.');
            markenAuffrischen();
          },
        });
      });
    });
  }

  /* Der Schriftgrößen-Regler in den Einstellungen. Er ist gezeichnet, als
     würde er gerade gezogen — und ließ sich nicht ziehen. Jetzt springt der
     Knauf dorthin, wo man tippt, und die Blase sagt, wie es heißt. */
  var SCHRIFTSTUFEN = ['Klein', 'Kleiner', 'Standard', 'Groß', 'Sehr groß'];

  function reglerBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('.card'), function (karte) {
      if (!/SCHRIFTGRÖSSE|SCHRIFTGROESSE/i.test(textVon(karte))) return;
      var bahn = null;
      Array.prototype.forEach.call(karte.querySelectorAll('div'), function (d) {
        if (bahn) return;
        var kinder = Array.prototype.slice.call(d.children);
        if (kinder.length >= 3 && d.style.position === 'relative' && /26px/.test(d.style.height || '')) bahn = d;
      });
      if (!bahn) {
        Array.prototype.forEach.call(karte.querySelectorAll('div[style*="position:relative"], div[style*="position: relative"]'), function (d) {
          if (!bahn && d.querySelector('div[style*="border-radius:50%"], div[style*="border-radius: 50%"]')) bahn = d;
        });
      }
      if (!bahn || bahn.classList.contains('pv-lebt')) return;

      var knauf = null, fuellung = null, blase = null;
      Array.prototype.forEach.call(bahn.children, function (d) {
        var st = d.getAttribute('style') || '';
        if (/border-radius:\s*50%/.test(st)) knauf = d;
        else if (/height:\s*4px/.test(st) && /width:/.test(st)) fuellung = d;
      });
      Array.prototype.forEach.call(karte.querySelectorAll('.t-label'), function (l) {
        if (!blase && SCHRIFTSTUFEN.indexOf(textVon(l)) >= 0) blase = l;
      });
      if (!knauf) return;

      beleben(bahn, {
        ziel: 'nichts',
        wirkt: 'stellt die Schriftgröße',
        titel: 'Schriftgröße',
        tun: function (el, e) {
          schmutzig(rahmen);
          var r = bahn.getBoundingClientRect();
          var anteil = r.width ? Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) : 0.5;
          var stufe = Math.round(anteil * (SCHRIFTSTUFEN.length - 1));
          var prozent = (stufe / (SCHRIFTSTUFEN.length - 1)) * 100;
          knauf.style.left = prozent + '%';
          if (fuellung) fuellung.style.width = prozent + '%';
          if (blase) blase.textContent = SCHRIFTSTUFEN[stufe];
          bahn.setAttribute('role', 'slider');
          bahn.setAttribute('aria-valuenow', String(stufe + 1));
          bahn.setAttribute('aria-valuetext', SCHRIFTSTUFEN[stufe]);
          sagen('Schriftgröße: ' + SCHRIFTSTUFEN[stufe] + '.');
          markenAuffrischen();
        },
      });
    });
  }

  /* Die Kürzel der Laborgruppe. Sie sind keine Knöpfe im Bestand, sehen aber
     aus wie welche — 28 pt runde Flächen mit einem Buchstaben. Wer sie
     antippt, will wissen, wer das ist. */
  var KUERZEL = { E: 'Emil — du', J: 'Jana Reuter', M: 'Milan Kovač' };

  function kuerzelBeleben(rahmen) {
    var kasten = null;
    Array.prototype.forEach.call(rahmen.querySelectorAll('section.card'), function (s) {
      if (!kasten && /GETEILT MIT/i.test(textVon(s))) kasten = s;
    });
    if (!kasten) return;
    Array.prototype.forEach.call(kasten.querySelectorAll('.t-label'), function (k) {
      var t = textVon(k);
      if (!KUERZEL[t] || k.classList.contains('pv-lebt')) return;
      beleben(k, {
        ziel: 'nichts', wirkt: 'sagt, wer das ist', titel: KUERZEL[t],
        tun: function () { hinweis(rahmen, KUERZEL[t], 'sieht diese Aufgabe seit Dienstag — nicht das Notizbuch'); },
      });
    });
  }

  /* ── 14t · Die Nachlese ──────────────────────────────────────────────────
     Zuletzt, nach allen Familien: Was jetzt noch ein <button> ist und keinen
     Weg hat, bekommt hier einen. Nicht als Notlösung — sondern weil ein
     Prototyp, in dem ein einziger Knopf tot ist, an genau dieser Stelle
     auffliegt, und weil die Messung diese Zeile jedes Mal wieder findet.

     Was der Knopf sagt, entscheidet, was er tut: ein Wort mit Zahl ist eine
     Auswahl, ein Symbol ist ein Menü, alles andere sagt, was passiert wäre. */
  function nachleseBeleben(rahmen) {
    Array.prototype.forEach.call(rahmen.querySelectorAll('button'), function (k) {
      if (k.classList.contains('pv-lebt')) return;
      if (k.hasAttribute('data-bw') || k.hasAttribute('data-pv-haken')) return;
      var r = k.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      var t = textVon(k) || k.getAttribute('aria-label') || 'Aktion';
      melden('§14t hat „' + t.slice(0, 40) + '" aufgesammelt — besser wäre eine eigene Zeile in §14.');
      beleben(k, {
        ziel: 'nichts',
        wirkt: 'wirkt hier',
        titel: t.slice(0, 60),
        tun: function () {
          var an = !k.classList.contains('is-active');
          k.classList.toggle('is-active', an);
          k.setAttribute('aria-pressed', an ? 'true' : 'false');
          hinweis(rahmen, t.slice(0, 48), an ? 'an' : 'aus');
        },
      });
    });
  }

  /* ── 14r · Alles zusammen ─────────────────────────────────────────────── */
  function zweiteRunde(rahmen, geraet) {
    umschalterBeleben(rahmen);
    seitenleisteBeleben(rahmen);
    chipreiheBeleben(rahmen);
    symbolknoepfeBeleben(rahmen);
    sammlungszeilenBeleben(rahmen);
    aufgabenDetailBeleben(rahmen);
    lernsitzungBeleben(rahmen);
    editorBeleben(rahmen);
    uebergabeChipsBeleben(rahmen);
    einzelneBeleben(rahmen);
    hakenBeleben(rahmen);
    spanChipsBeleben(rahmen);
    fadenschalterBeleben(rahmen);
    graphKnotenBeleben(rahmen);
    werkzeugChipsBeleben(rahmen);
    reglerBeleben(rahmen);
    kuerzelBeleben(rahmen);
    nachleseBeleben(rahmen);          /* muss zuletzt stehen */
    void geraet;
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
