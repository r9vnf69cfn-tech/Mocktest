/* ============================================================================
 * prototyp.js — die Bedienung des begehbaren Prototyps
 *
 * Ohne Funktion: es wird nichts gespeichert, nichts gerechnet, nichts
 * eingegeben. Diese Datei tut genau drei Dinge:
 *
 *   sie bewegt einen von 26 Rahmen in den Vordergrund,
 *   sie merkt sich, woher man kam,
 *   und sie sagt jedem Element im Rahmen, ob es ein Ziel ist oder keines.
 *
 * ── INHALT ────────────────────────────────────────────────────────────────
 *   1  Der Bestand            welche Schirme es gibt, wie sie heißen
 *   2  Der Weg                Geschichte, Adresse, Richtung
 *   3  Der Wechsel            die Rolle WECHSELN aus bewegung.css
 *   4  Tote und lebende Ziele die eine zentrale Stelle
 *   5  Die Grundnavigation    Seitenleiste · Tab-Bar · Zurück
 *   5b Die Wegekarte          welcher Eintrag welches Element belebt
 *   5c Die Übergänge          ÖFFNEN als Hero · als Blatt · rückwärts
 *   5d Herkunft zeigen        der Faden, dann die Quelle
 *   5e Der Zustand der Schirme  was eine Bewegung verändert hat, kommt zurück
 *   6  Tastatur und Geste
 *   7  Der Maßstab
 *   8  Der Gerätewechsel
 *   9  Start und Ankunft
 *  10  DIE WEGEKARTE          die Daten — 145 Wege, 172 Ziele
 *
 * ── DIE WEGEKARTE ─────────────────────────────────────────────────────────
 * Alles über die Grundnavigation hinaus — Bibliothek → Notiz-Editor,
 * Aufgabe → Detail, Deck → Review, Herkunfts-Chip → Ursprung — steht als
 * reiner Datenblock in §10 dieser Datei. Ein Eintrag:
 *
 *     { s:'bibliothek', g:'ipad', wo:'article.book.is-selected',
 *       ziel:'notiz', art:'oeffnen', t:'Notizbuch Zellbiologie öffnen' }
 *
 *   s      Schlüssel des Schirms, in dem das Element steht: heute ·
 *          bibliothek · notizen · notiz · journal · journal-eintrag ·
 *          aufgaben · aufgabe · lernkarten · lernsitzung · graph ·
 *          einstellungen · leere-zustaende. Der Dateiname (note-editor.html,
 *          note-editor) wird ebenfalls angenommen.
 *   g      'ipad' | 'iphone' | 'beide'   (Vorgabe: 'beide')
 *   wo     CSS-Selektor, gesucht wird NUR innerhalb dieses Rahmens. Jeder
 *          Treffer wird ein Ziel; keiner ist kein Fehler, wird aber beim
 *          Start in der Konsole gemeldet — ein Weg ins Leere ist schlimmer
 *          als keiner.
 *   ziel   Schlüssel eines Schirms · 'canvas' (das eigene Canvas-Mockup im
 *          Wurzelordner, öffnet in einem neuen Tab) · 'zurueck' · 'nichts'
 *   art    'oeffnen' (Vorgabe) · 'herkunft' · 'zurueck'
 *   t      Klartext für aria-label und Fußzeile
 *
 * Die Karte darf von außen ersetzt werden — window.VELUM_WEGE vor dieser
 * Datei setzen oder zur Laufzeit PROTOTYP.wege(karte) rufen. Danach ist
 * alles wieder tot, was nicht mehr in der Karte steht: die Karte ist die
 * einzige Quelle, nicht ein Zusatz zum Bestehenden.
 *
 * Elemente mit data-bw (die fünf Signature-Momente) sind IMMER lebendig:
 * sie führen zwar nicht auf einen anderen Schirm, aber sie tun etwas
 * Sichtbares, und damit sind sie keine toten Ziele.
 *
 * ── WAS NICHT IN DER KARTE STEHT UND TROTZDEM LEBT ────────────────────────
 * Seitenleiste, Tab-Leiste und der Zurück-Weg (§5) — sie sind in allen 13
 * Schirmen wortgleich, sie 26-mal aufzuzählen hieße 26-mal dasselbe pflegen.
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
    if (weg.ziel === 'canvas') { canvasOeffnen(); return; }
    if (weg.ziel.indexOf('extern:') === 0) { location.href = weg.ziel.slice(7); return; }
    gehen(weg.ziel, weg.richtung || 'vor', false, el);
  });

  /* Das Canvas ist ein eigenes, lauffähiges Mockup im Wurzelordner — kein
     Schirm dieses Prototyps. Es öffnet in einem neuen Tab, damit der Weg
     hierher nicht verloren geht: wer aus der Bibliothek ein Canvas-Notizbuch
     antippt, will das Canvas sehen und danach weitersuchen. Ein Sprung, der
     den Prototyp unter einem wegzieht, wäre der teuerste Klick der Seite. */
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
   * Sie steht hier und nicht in der Wegekarte, weil sie in ALLEN 13 Schirmen
   * dieselbe ist: dieselbe Seitenleiste, dieselbe Tab-Bar, wortgleich. Sie
   * über 13 × 2 Einträge in einer Datendatei zu wiederholen hieße, 26-mal
   * dasselbe zu pflegen.
   *
   * Zugeordnet wird über das WORT, nicht über die Stelle in der Liste:
   * notes-list.html hat keinen Eintrag „Lernkarten", leere-zustaende.html
   * kein „Analysis II". Eine Zuordnung über nth-child träfe dort daneben.
   * ==================================================================== */

  var SEITENLEISTE = {
    'heute':         'heute',
    'bibliothek':    'bibliothek',
    'notizen':       'notizen',
    'journal':       'journal',
    'aufgaben':      'aufgaben',
    'lernkarten':    'lernkarten',
    'graph':         'graph',
    'einstellungen': 'einstellungen',
    'canvas':        'canvas',
  };

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
      var ziel = SEITENLEISTE[wortVon(knopf)];
      if (!ziel) return;                                   /* Eingang, Biologie, Analysis II: kein Schirm */
      if (ziel === schirmSchluessel) { beleben(knopf, { ziel: 'nichts' }); return; }
      beleben(knopf, {
        ziel: ziel,
        richtung: ziel === 'canvas' ? 'vor' : seitlicheRichtung(schirmSchluessel, ziel),
      });
    });

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
      var ziel = SEITENLEISTE[(knopf.getAttribute('title') || '').trim().toLowerCase()];
      if (!ziel) return;
      if (ziel === schirmSchluessel) { beleben(knopf, { ziel: 'nichts' }); return; }
      beleben(knopf, {
        ziel: ziel,
        richtung: ziel === 'canvas' ? 'vor' : seitlicheRichtung(schirmSchluessel, ziel),
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
      var zeileStil = muster.parentElement.getAttribute('style') || '';
      kacheln.forEach(function (b) {
        var haken = b.querySelector('.ico[data-ico="check"]');
        if (!haken) {
          var kopf = b.querySelector('.t-sub');
          if (!kopf) return;
          var zeile = kopf.parentElement;
          zeile.setAttribute('style', zeileStil);
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
  function aufbauen() {
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

  var OBJEKT = '.book, .row, .card, .gn, .chain__link';
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
   * 9 · START
   * ==================================================================== */

  function start() {
    wegeAnlegen(global.VELUM_WEGE || WEGEKARTE);
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
    }, 0);
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
   * 10 · DIE WEGEKARTE
   *
   * Welches Element in welchem Schirm wohin führt. Reine Daten — jede Zeile
   * ist im Browser geprüft: der Wähler trifft in seiner Schirmwurzel genau
   * ein Element, und die Mitte dieses Elements wird auch wirklich von ihm
   * gefangen (document.elementFromPoint). Ein Weg, der ins Leere führte, wäre
   * schlimmer als keiner.
   *
   * Felder: siehe Kopf dieser Datei.
   *
   * ── WARUM FÜNF NOTIZZEILEN IN DIESELBE NOTIZ FÜHREN ──────────────────────
   * Velum hat je Modul genau einen gezeichneten Detailschirm. Ein Regal, in
   * dem nur ein einziges Buch aufgeht, fühlt sich kaputt an; ein Regal, in dem
   * jedes Buch aufgeht, fühlt sich wie eine App an. Der Übergang ist sichtbar
   * und trägt — in den ersten dreißig Sekunden fragt niemand, ob im Editor
   * „Genetik II" statt „Zellbiologie" steht. Ein Tap dagegen, der auf
   * demselben Schirm mit demselben Inhalt landet, fiele sofort auf: solche
   * Wege stehen nicht in dieser Karte.
   *
   * ── WAS BEWUSST NICHT DRINSTEHT ──────────────────────────────────────────
   * 244 Bedienelemente führen nirgendwohin — örtliche Schalter ohne zweiten
   * gezeichneten Zustand, Werkzeuge ohne Werkzeugwirkung, alles, was Daten
   * änderte. Sie brauchen keine Liste: der Prototyp ist grundsätzlich tot
   * (prototyp.css §4), lebendig wird nur, was hier steht. Damit ist die Regel
   * „was nicht führt, fühlt sich nicht führend an" nicht gepflegt, sondern
   * gebaut.
   *
   * Die vier Chips mit [data-bw="herkunft"] tragen ihre Bewegung schon im
   * Markup. Bei ihnen kommt erst der Faden und dann der Weg (§5d) — beim
   * Lernkarten-Chip bleibt es beim Faden, weil dort die Quelle an Ort und
   * Stelle aufgeht und der Weg weiter als Knopf darin steht.
   * ==================================================================== */

  var WEGEKARTE = { version: 2, wege: [
    /* ── Heute ── 17 */
    { s:'heute', wo:'div.row:nth-child(1)', ziel:'aufgabe', t:'Aufgabe „Statistik-Blatt 4 abgeben" öffnet das Aufgaben-Detail' },
    { s:'heute', wo:'div.row:nth-child(2)', ziel:'aufgabe', t:'Aufgabe „Laborprotokoll Zellkultur schreiben" öffnet das Aufgaben-Detail' },
    { s:'heute', wo:'div.row:nth-child(3)', ziel:'aufgabe', t:'Aufgabe „Rückmeldung an Prof. Wendt" öffnet das Aufgaben-Detail' },
    { s:'heute', wo:'[data-bw="herkunft"]', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Zellbiologie" zeichnet den Faden und geht zur Notiz' },
    { s:'heute', wo:'section.card > .btn--sm', ziel:'journal-eintrag', t:'„Eintrag beginnen" führt in den Journal-Eintrag' },
    { s:'heute', g:'ipad', wo:'#t-notiz', ziel:'notiz', t:'Kette Station 1 „Notiz · Zellbiologie" öffnet den Notiz-Editor' },
    { s:'heute', g:'ipad', wo:'#t-karten', ziel:'lernkarten', t:'Kette Station 2 „Wurde zu 12 Karten" öffnet die Lernkarten-Übersicht' },
    { s:'heute', g:'ipad', wo:'#t-faellig', ziel:'lernsitzung', t:'Kette Station 3 „Heute fällig · 8 Karten" öffnet die Lernsitzung' },
    { s:'heute', g:'ipad', wo:'.chain__link--end .btn--primary', ziel:'lernsitzung', t:'„Lernen" am Ende der Kette startet die Sitzung' },
    { s:'heute', g:'ipad', wo:'button.card:nth-child(2)', ziel:'journal-eintrag', t:'Weitermachen-Karte „Entwurf ohne Titel" öffnet den Journal-Eintrag' },
    { s:'heute', g:'ipad', wo:'button.card:nth-child(1)', ziel:'canvas', t:'Weitermachen-Karte „Analysis II — Übungsblatt 5" öffnet das Canvas-Mockup' },
    { s:'heute', g:'ipad', wo:'div.row:nth-child(4)', ziel:'aufgabe', t:'Aufgabe „Bücher in der Bibliothek verlängern" öffnet das Aufgaben-Detail' },
    { s:'heute', g:'ipad', wo:'div.row:nth-child(5)', ziel:'aufgabe', t:'Aufgabe „Karteikarten Anatomie nacharbeiten" öffnet das Aufgaben-Detail' },
    { s:'heute', g:'iphone', wo:'#p-notiz', ziel:'notiz', t:'Kette Station 1 „Zellbiologie · 14 Absätze" öffnet den Notiz-Editor' },
    { s:'heute', g:'iphone', wo:'button:has(> .dot--node)', ziel:'lernkarten', t:'Kette Station 2 „wurde zu 12 Karten" öffnet die Lernkarten-Übersicht' },
    { s:'heute', g:'iphone', wo:'.btn--primary.btn--sm', ziel:'lernsitzung', t:'„Lernen" an Station 3 startet die Sitzung' },
    { s:'heute', g:'iphone', wo:'button.card--flat', ziel:'canvas', t:'Weitermachen-Karte Canvas öffnet das Canvas-Mockup' },

    /* ── Bibliothek ── 22 */
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm.is-selected.is-lifted', ziel:'notiz', t:'Notizbuch „Zellbiologie" (Notizen) öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(2)', ziel:'journal', t:'Notizbuch „Laborjournal" (Journal) öffnet das Journal' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(3)', ziel:'notiz', t:'Notizbuch „Genetik II" (Notizen) öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(4)', ziel:'notiz', t:'Notizbuch „Wendt · Vorlesung" (Notizen) öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(5)', ziel:'journal', t:'Notizbuch „Praktikum Zellkultur" (Journal) öffnet das Journal' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(6)', ziel:'aufgaben', t:'Notizbuch „Semesterplanung" (Aufgaben) öffnet die Aufgaben' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(7)', ziel:'lernkarten', t:'Notizbuch „Prüfungsfragen" (Lernkarten) öffnet die Lernkarten' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(8)', ziel:'canvas', t:'Notizbuch „Statistik" (Canvas) öffnet das Canvas-Mockup' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(9)', ziel:'notiz', t:'Notizbuch „Zitate" (Notizen) öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(10)', ziel:'journal', t:'Notizbuch „Exkursion Harz" (Journal) öffnet das Journal' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(11)', ziel:'canvas', t:'Notizbuch „Messreihen" (Canvas) öffnet das Canvas-Mockup' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(13)', ziel:'canvas', t:'Notizbuch „Diagramme" (Canvas) öffnet das Canvas-Mockup' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(14)', ziel:'canvas', t:'Notizbuch „Analysis II" (Canvas) öffnet das Canvas-Mockup' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(15)', ziel:'notiz', t:'Notizbuch „Lesenotizen Soziologie" (Notizen) öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(16)', ziel:'aufgaben', t:'Notizbuch „Fragen an Wendt" (Aufgaben) öffnet die Aufgaben' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(17)', ziel:'journal', t:'Notizbuch „Protokolle" (Journal) öffnet das Journal' },
    { s:'bibliothek', g:'ipad', wo:'article.book.book--sm:nth-child(18)', ziel:'canvas', t:'Notizbuch „Skizzen Mikroskop" (Canvas) öffnet das Canvas-Mockup' },
    { s:'bibliothek', g:'ipad', wo:'button.card.card--flat:nth-child(4)', ziel:'graph', t:'Smart-Ordner „Prüfung Februar · aus dem Graphen" öffnet den Graphen (dort steht derselbe Blick mit denselben 14)' },
    { s:'bibliothek', g:'iphone', wo:'article.book.is-selected', ziel:'notiz', t:'Notizbuch „Zellbiologie" öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'iphone', wo:'article.book:nth-child(2)', ziel:'journal', t:'Notizbuch „Laborjournal" öffnet das Journal' },
    { s:'bibliothek', g:'iphone', wo:'article.book:nth-child(3)', ziel:'notiz', t:'Notizbuch „Genetik II" öffnet den Notiz-Editor' },
    { s:'bibliothek', g:'iphone', wo:'article.book:nth-child(4)', ziel:'notiz', t:'Notizbuch „Wendt · Vorlesung" öffnet den Notiz-Editor' },

    /* ── Notizen-Liste ── 10 */
    { s:'notizen', wo:'div.row:nth-child(10)', ziel:'notiz', t:'Notizzeile „Lesenotizen Soziologie" öffnet den Editor' },
    { s:'notizen', g:'ipad', wo:'#nl-zell', ziel:'notiz', t:'Notizzeile „Zellbiologie — Vorlesung 9" öffnet den Editor' },
    { s:'notizen', g:'ipad', wo:'#nl-sem', ziel:'notiz', t:'Notizzeile „Semesterplanung Wintersemester" öffnet den Editor' },
    { s:'notizen', g:'ipad', wo:'#nl-osmose', ziel:'notiz', t:'Notizzeile „Osmose und Zellmembran" öffnet den Editor' },
    { s:'notizen', g:'ipad', wo:'#nl-labor', ziel:'notiz', t:'Notizzeile „Laborjournal — Zellkultur, Tag 3" öffnet den Editor' },
    { s:'notizen', g:'ipad', wo:'div.row:nth-child(9)', ziel:'notiz', t:'Notizzeile „Analysis II — Grenzwertsätze" öffnet den Editor' },
    { s:'notizen', g:'iphone', wo:'#p-zell', ziel:'notiz', t:'Notizzeile „Zellbiologie — Vorlesung 9" öffnet den Editor' },
    { s:'notizen', g:'iphone', wo:'#p-osmose', ziel:'notiz', t:'Notizzeile „Osmose und Zellmembran" öffnet den Editor' },
    { s:'notizen', g:'iphone', wo:'#p-labor', ziel:'notiz', t:'Notizzeile „Laborjournal — Zellkultur, Tag 3" öffnet den Editor' },
    { s:'notizen', g:'iphone', wo:'div.row:nth-child(11)', ziel:'notiz', t:'Notizzeile „Lesenotizen Soziologie" öffnet den Editor' },

    /* ── Notiz-Editor ── 8 */
    { s:'notiz', wo:'[aria-label="Zurück zur Notizenliste"]', ziel:'notizen', art:'zurueck', t:'„Notizen" in der Navigationsleiste führt zurück in die Notizenliste' },
    { s:'notiz', wo:'div.navbar:nth-child(1) > button.iconbtn:nth-child(1)', ziel:'notizen', art:'zurueck', t:'Zurück-Pfeil führt in die Notizenliste' },
    { s:'notiz', g:'ipad', wo:'#ipad-target', ziel:'lernkarten', t:'„12 Karten" unter DARAUS ENTSTANDEN öffnet die Lernkarten' },
    { s:'notiz', g:'ipad', wo:'#ipad-target + div', ziel:'aufgabe', t:'„1 Aufgabe · Laborprotokoll Zellkultur" unter DARAUS ENTSTANDEN öffnet das Aufgaben-Detail' },
    { s:'notiz', g:'ipad', wo:'section:nth-child(3) > div:nth-child(2) > button:nth-child(1)', ziel:'journal-eintrag', t:'Backlink „Laborjournal · 12. Nov" öffnet den Journal-Eintrag' },
    { s:'notiz', g:'ipad', wo:'section:nth-child(3) > div:nth-child(2) > button:nth-child(3)', ziel:'journal-eintrag', t:'Backlink „Erster Tag im Labor" öffnet den Journal-Eintrag' },
    { s:'notiz', g:'iphone', wo:'#iphone-target', ziel:'lernkarten', t:'Chip „12 Karten" öffnet die Lernkarten' },
    { s:'notiz', g:'iphone', wo:'#iphone-target + .chip', ziel:'aufgabe', t:'Chip „1 Aufgabe" öffnet das Aufgaben-Detail' },

    /* ── Journal-Start ── 10 */
    { s:'journal', wo:'div:nth-child(1) > article.card:nth-child(2)', ziel:'journal-eintrag', t:'Eintrag „Vor dem Praktikum" öffnet den Journal-Eintrag' },
    { s:'journal', wo:'div:nth-child(2) > article.card:nth-child(2)', ziel:'journal-eintrag', t:'Eintrag „Ohne Titel · Entwurf" öffnet den Journal-Eintrag' },
    { s:'journal', g:'ipad', wo:'div:nth-child(4) > article.card:nth-child(2)', ziel:'journal-eintrag', t:'Eintrag „Zellkultur angesetzt" öffnet den Journal-Eintrag' },
    { s:'journal', g:'ipad', wo:'article.card button', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Laborjournal" führt zur Quellnotiz' },
    { s:'journal', g:'ipad', wo:'button.row:nth-child(5)', ziel:'aufgabe', t:'DARAUS ENTSTANDEN „Laborprotokoll · Aufgabe" öffnet das Aufgaben-Detail' },
    { s:'journal', g:'ipad', wo:'button.row:nth-child(6)', ziel:'notiz', t:'DARAUS ENTSTANDEN „Passage 3 · Notiz" öffnet den Notiz-Editor' },
    { s:'journal', g:'ipad', wo:'button.row:nth-child(7)', ziel:'lernkarten', t:'DARAUS ENTSTANDEN „2 Karten · Deck Zellbiologie" öffnet die Lernkarten' },
    { s:'journal', g:'ipad', wo:'.card > .btn--sm', ziel:'journal-eintrag', t:'„Eintrag beginnen" führt in den Journal-Eintrag' },
    { s:'journal', g:'iphone', wo:'button.card--flat', ziel:'journal-eintrag', t:'„Impuls für heute" führt in den Journal-Eintrag' },
    { s:'journal', g:'iphone', wo:'button.iconbtn:nth-child(1)', ziel:'heute', art:'zurueck', t:'Der Zurück-Pfeil führt aus dem Journal heraus' },

    /* ── Journal-Eintrag ── 5 */
    { s:'journal-eintrag', wo:'button.iconbtn:nth-child(1)', ziel:'journal', art:'zurueck', t:'Der Zurück-Pfeil führt in die Journal-Zeitleiste' },
    { s:'journal-eintrag', g:'ipad', wo:'button.chain__link.chain__link--tap:nth-child(1)', ziel:'notiz', art:'herkunft', t:'Kette „ENTSTANDEN AUS · Zellbiologie · Notiz" öffnet die Quellnotiz' },
    { s:'journal-eintrag', g:'ipad', wo:'button.chain__link.chain__link--tap:nth-child(3)', ziel:'aufgabe', t:'Kette „DARAUS WURDE · Laborprotokoll · Aufgabe" öffnet das Aufgaben-Detail' },
    { s:'journal-eintrag', g:'iphone', wo:'button.jek__stat:nth-child(2)', ziel:'notiz', art:'herkunft', t:'„ENTSTANDEN AUS · Zellbiologie" öffnet die Quellnotiz' },
    { s:'journal-eintrag', g:'iphone', wo:'button.jek__stat:nth-child(6)', ziel:'aufgabe', t:'„DARAUS WURDE · Laborprotokoll" öffnet das Aufgaben-Detail' },

    /* ── Aufgaben ── 14 */
    { s:'aufgaben', wo:'.row:has([aria-label="Karteikarten erledigen"])', ziel:'aufgabe', t:'Aufgabe „Karteikarten Anatomie nacharbeiten" öffnet das Detail' },
    { s:'aufgaben', wo:'.row:has([aria-label="Statistik-Blatt erledigen"])', ziel:'aufgabe', t:'Aufgabe „Statistik-Blatt 4 abgeben" öffnet das Detail' },
    { s:'aufgaben', wo:'.row:has([aria-label="Rückmeldung erledigen"])', ziel:'aufgabe', t:'Aufgabe „Rückmeldung an Prof. Wendt" öffnet das Detail' },
    { s:'aufgaben', wo:'.row:has([aria-label="Bücher verlängern erledigen"])', ziel:'aufgabe', t:'Aufgabe „Bücher in der Bibliothek verlängern" öffnet das Detail' },
    { s:'aufgaben', g:'ipad', wo:'#a-labor', ziel:'aufgabe', t:'Aufgabe „Laborprotokoll Zellkultur schreiben" öffnet das Detail' },
    { s:'aufgaben', g:'ipad', wo:'#h-labor', ziel:'notiz', art:'herkunft', t:'Klammer-Kopf „Zellbiologie · Notiz" führt zur Quellnotiz' },
    { s:'aufgaben', g:'ipad', wo:'section.card:nth-child(2) > div.klammer:nth-child(2) > button.klammer__quelle:nth-child(2)', ziel:'canvas', art:'herkunft', t:'Klammer-Kopf „Übungen 12. Nov. · Canvas" führt zum Canvas-Mockup' },
    { s:'aufgaben', g:'ipad', wo:'section.card:nth-child(2) > div.klammer:nth-child(2) > div.row:nth-child(4)', ziel:'aufgabe', t:'Aufgabe „Übungsblatt 5 fertig rechnen“ öffnet das Detail' },
    { s:'aufgaben', g:'ipad', wo:'section.card:nth-child(3) > div:nth-child(2) > button:nth-child(2)', ziel:'notiz', art:'herkunft', t:'„Woher heute kommt: Zellbiologie" führt zur Quellnotiz' },
    { s:'aufgaben', g:'ipad', wo:'section.card:nth-child(3) > div:nth-child(2) > button:nth-child(4)', ziel:'canvas', art:'herkunft', t:'„Woher heute kommt: Übungen 12. Nov." führt zum Canvas-Mockup' },
    { s:'aufgaben', g:'iphone', wo:'.row:has([aria-label="Laborprotokoll erledigen"])', ziel:'aufgabe', t:'Aufgabe „Laborprotokoll Zellkultur schreiben" öffnet das Detail' },
    { s:'aufgaben', g:'iphone', wo:'#h-labor-p', ziel:'notiz', art:'herkunft', t:'Klammer-Kopf „Zellbiologie · Notiz" führt zur Quellnotiz' },
    { s:'aufgaben', g:'iphone', wo:'section.card:nth-child(3) > div.klammer:nth-child(2) > button.klammer__quelle:nth-child(2)', ziel:'canvas', art:'herkunft', t:'Klammer-Kopf „Übungen 12. Nov. · Canvas" führt zum Canvas-Mockup' },
    { s:'aufgaben', g:'iphone', wo:'section.card:nth-child(3) > div.klammer:nth-child(2) > div.row:nth-child(4)', ziel:'aufgabe', t:'Aufgabe „Übungsblatt 5 fertig rechnen“ öffnet das Detail' },

    /* ── Aufgaben-Detail ── 7 */
    { s:'aufgabe', g:'ipad', wo:'button.iconbtn.is-active:nth-child(4)', ziel:'aufgaben', art:'zurueck', t:'Der Aufklapp-Pfeil klappt die Aufgabe zu — zurück in die Aufgabenliste' },
    { s:'aufgabe', g:'ipad', wo:'#quelle-notiz', ziel:'notiz', t:'VERKNÜPFT „Zellbiologie · Notiz · Quelle" öffnet die Notiz' },
    { s:'aufgabe', g:'ipad', wo:'button.row:nth-child(6)', ziel:'lernkarten', t:'VERKNÜPFT „Zellbiologie · Deck · 8 fällig" öffnet die Lernkarten' },
    { s:'aufgabe', g:'ipad', wo:'button.row:nth-child(7)', ziel:'canvas', t:'VERKNÜPFT „Messreihe Probe 1–5 · Canvas" öffnet das Canvas-Mockup' },
    { s:'aufgabe', g:'ipad', wo:'[data-bw="herkunft"]', ziel:'notiz', art:'herkunft', t:'„aus Zellbiologie → diese Aufgabe · Zur Stelle" zeichnet den Faden und geht zur Notiz' },
    { s:'aufgabe', g:'iphone', wo:'article:nth-child(4) > div:nth-child(1) > button.iconbtn.is-active:nth-child(3)', ziel:'aufgaben', art:'zurueck', t:'Der Aufklapp-Pfeil klappt die Aufgabe zu — zurück in die Aufgabenliste' },
    { s:'aufgabe', g:'iphone', wo:'article > button', ziel:'notiz', art:'herkunft', t:'„aus Zellbiologie → diese Aufgabe" führt zur Quellnotiz' },

    /* ── Lernkarten-Start ── 18 */
    { s:'lernkarten', g:'ipad', wo:'button.btn.btn--primary.btn--sm:nth-child(5)', ziel:'lernsitzung', t:'„Alle lernen · 23" startet die Sitzung' },
    { s:'lernkarten', g:'ipad', wo:'.card:has([data-bw="herkunft"]) .btn--primary', ziel:'lernsitzung', t:'„Lernen" am Deck Zellbiologie startet die Sitzung' },
    { s:'lernkarten', g:'ipad', wo:'button.btn.btn--primary.btn--sm:nth-child(8)', ziel:'lernsitzung', t:'„Lernen" am Deck Anatomie Grundlagen startet die Sitzung' },
    { s:'lernkarten', g:'ipad', wo:'section.card:nth-child(3) > div:nth-child(2) > button.btn.btn--sm:nth-child(7)', ziel:'lernsitzung', t:'„Lernen“ am Deck Statistik-Formeln startet die Sitzung' },
    /* Kein Ziel: dieser Chip lässt die Quelle an Ort und Stelle aufgehen —
       der Weg weiter steht als Knopf darin, der Rückweg heißt „Loslassen". */
    { s:'lernkarten', g:'ipad', wo:'[data-bw="herkunft"]', ziel:'nichts', art:'herkunft', t:'Herkunfts-Chip „aus Zellbiologie" zeichnet den Faden zur Quellnotiz' },
    { s:'lernkarten', g:'ipad', wo:'#fc-quelle .btn:nth-child(1)', ziel:'notiz', t:'„Notiz öffnen" in der aufgedeckten Quelle öffnet den Notiz-Editor' },
    { s:'lernkarten', g:'ipad', wo:'button.btn.btn--sm:nth-child(2)', ziel:'notiz', t:'„Notiz öffnen" am leeren Deck Lesenotizen öffnet den Notiz-Editor' },
    { s:'lernkarten', g:'ipad', wo:'section.card:nth-child(3) > div.card__head:nth-child(1) > button.origin:nth-child(3)', ziel:'notizen', art:'herkunft', t:'Herkunfts-Chip „aus 3 Notizen“ am Deck Anatomie führt in die Notizenliste' },
    { s:'lernkarten', g:'ipad', wo:'section.card:nth-child(4) > div.card__head:nth-child(1) > button.origin:nth-child(3)', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Formelsammlung“ führt zur Quellnotiz' },
    { s:'lernkarten', g:'ipad', wo:'section.card:nth-child(5) > div.card__head:nth-child(1) > button.origin:nth-child(3)', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Weber“ führt zur Quellnotiz' },
    { s:'lernkarten', g:'iphone', wo:'.card .btn--primary.btn--sm', ziel:'lernsitzung', t:'„Lernen" am Deck Zellbiologie startet die Sitzung' },
    { s:'lernkarten', g:'iphone', wo:'button.btn.btn--primary:nth-child(2)', ziel:'lernsitzung', t:'„Alle lernen · 23" startet die Sitzung' },
    { s:'lernkarten', g:'iphone', wo:'section.card:nth-child(1) > button.origin:nth-child(2)', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Zellbiologie" führt zur Quellnotiz' },
    { s:'lernkarten', g:'iphone', wo:'section.card:nth-child(2) > button.origin:nth-child(2)', ziel:'notizen', art:'herkunft', t:'Herkunfts-Chip „aus 3 Notizen“ führt in die Notizenliste' },
    { s:'lernkarten', g:'iphone', wo:'section.card:nth-child(3) > button.origin:nth-child(2)', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Formelsammlung“ führt zur Quellnotiz' },
    { s:'lernkarten', g:'iphone', wo:'section.card:nth-child(4) > button.origin:nth-child(2)', ziel:'notiz', art:'herkunft', t:'Herkunfts-Chip „aus Weber“ führt zur Quellnotiz' },
    { s:'lernkarten', g:'iphone', wo:'button.btn.btn--primary.btn--sm', ziel:'lernsitzung', t:'„Lernen“ am Deck Anatomie Grundlagen startet die Sitzung' },
    { s:'lernkarten', g:'iphone', wo:'section.card:nth-child(2) > div:nth-child(1) > button.btn.btn--sm:nth-child(2)', ziel:'lernsitzung', t:'„Lernen“ am Deck Statistik-Formeln startet die Sitzung' },

    /* ── Review-Session ── 4 */
    { s:'lernsitzung', wo:'button.iconbtn:nth-child(1)', ziel:'lernkarten', art:'zurueck', t:'Das Kreuz beendet die Sitzung und führt zurück zur Lernkarten-Übersicht' },
    { s:'lernsitzung', wo:'.bw-flip__seite--vorn [aria-label^="Zur Stelle"]', ziel:'notiz', art:'herkunft', t:'„aus Zellbiologie" auf der Frageseite führt zur Stelle in der Notiz' },
    { s:'lernsitzung', wo:'.bw-flip__seite--hinten [aria-label^="Zur Stelle"]', ziel:'notiz', art:'herkunft', t:'„Zur Stelle in der Notiz" auf der Antwortseite führt zur Notiz' },
    { s:'lernsitzung', g:'iphone', wo:'.scroll > button', ziel:'canvas', t:'„Canvas · Mitrechnen" öffnet das Canvas-Mockup' },

    /* ── Graph ── 30 */
    { s:'graph', wo:'.gn[aria-label^="Zellbiologie,"]', ziel:'notiz', t:'Knoten „Zellbiologie" öffnet die Notiz' },
    { s:'graph', wo:'.gn[aria-label^="Laborjournal,"]', ziel:'notiz', t:'Knoten „Laborjournal" öffnet die Notiz' },
    { s:'graph', wo:'.gn[aria-label^="Laborprotokoll,"]', ziel:'aufgabe', t:'Knoten „Laborprotokoll" öffnet das Aufgaben-Detail' },
    { s:'graph', wo:'.gn[aria-label^="Stapel Zellbiologie,"]', ziel:'lernkarten', t:'Knoten „Stapel Zellbiologie" öffnet die Lernkarten' },
    { s:'graph', wo:'.gn[aria-label^="Zellkultur-Skizze,"]', ziel:'canvas', t:'Knoten „Zellkultur-Skizze" öffnet das Canvas-Mockup' },
    { s:'graph', wo:'.gn[aria-label^="Osmose,"]', ziel:'lernsitzung', t:'Knoten „Osmose" (Lernkarte) öffnet die Lernsitzung' },
    { s:'graph', wo:'.gn[aria-label^="Anatomie Grundlagen,"]', ziel:'lernkarten', t:'Knoten „Anatomie Grundlagen“ (Deck) öffnet die Lernkarten' },
    { s:'graph', wo:'.gn[aria-label^="Mitochondrium,"]', ziel:'lernsitzung', t:'Knoten „Mitochondrium“ (Lernkarte) öffnet die Lernsitzung' },
    { s:'graph', wo:'.gn[aria-label^="Zellmembran,"]', ziel:'lernsitzung', t:'Knoten „Zellmembran“ (Lernkarte) öffnet die Lernsitzung' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Entwurf ohne Titel,"]', ziel:'journal-eintrag', t:'Knoten „Entwurf ohne Titel" öffnet den Journal-Eintrag' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Erster Tag im Labor,"]', ziel:'journal-eintrag', t:'Knoten „Erster Tag im Labor" öffnet den Journal-Eintrag' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Übungsblatt 5,"]', ziel:'canvas', t:'Knoten „Übungsblatt 5" öffnet das Canvas-Mockup' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Statistik-Blatt 4,"]', ziel:'aufgabe', t:'Knoten „Statistik-Blatt 4" öffnet das Aufgaben-Detail' },
    { s:'graph', g:'ipad', wo:'.ginspect .btn--primary', ziel:'notiz', t:'„Öffnen" im Inspektor öffnet das gewählte Objekt' },
    { s:'graph', g:'ipad', wo:'button.row.girow:nth-child(6)', ziel:'lernkarten', t:'„12 erzeugte Karten" öffnet die Lernkarten' },
    { s:'graph', g:'ipad', wo:'button.row.girow:nth-child(7)', ziel:'aufgabe', t:'„1 Aufgabe" öffnet das Aufgaben-Detail' },
    { s:'graph', g:'ipad', wo:'button.row.girow:nth-child(5)', ziel:'notizen', t:'„3 Rückverweise" öffnet die Notizenliste' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Analysis II,"]', ziel:'notiz', t:'Knoten „Analysis II“ (Notiz) öffnet den Notiz-Editor' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Semesterplan,"]', ziel:'notiz', t:'Knoten „Semesterplan“ (Notiz) öffnet den Notiz-Editor' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Lesenotizen Soziologie,"]', ziel:'notiz', t:'Knoten „Lesenotizen Soziologie“ (Notiz) öffnet den Notiz-Editor' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Vorlesung Genetik,"]', ziel:'notiz', t:'Knoten „Vorlesung Genetik“ (Notiz) öffnet den Notiz-Editor' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Skizze Mitose,"]', ziel:'canvas', t:'Knoten „Skizze Mitose“ (Canvas) öffnet das Canvas-Mockup' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Bücher verlängern,"]', ziel:'aufgabe', t:'Knoten „Bücher verlängern“ (Aufgabe) öffnet das Aufgaben-Detail' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Rückmeldung Wendt,"]', ziel:'aufgabe', t:'Knoten „Rückmeldung Wendt“ (Aufgabe) öffnet das Aufgaben-Detail' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Statistik-Formeln,"]', ziel:'lernkarten', t:'Knoten „Statistik-Formeln“ (Deck) öffnet die Lernkarten' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Golgi-Apparat,"]', ziel:'lernsitzung', t:'Knoten „Golgi-Apparat“ (Lernkarte) öffnet die Lernsitzung' },
    { s:'graph', g:'ipad', wo:'.gn[aria-label^="Grenzwertsätze,"]', ziel:'lernsitzung', t:'Knoten „Grenzwertsätze“ (Lernkarte) öffnet die Lernsitzung' },
    { s:'graph', g:'iphone', wo:'section .btn--primary', ziel:'notiz', t:'„Öffnen" im Blatt öffnet das gewählte Objekt' },
    { s:'graph', g:'iphone', wo:'button.row.girow:nth-child(5)', ziel:'lernkarten', t:'„12 Karten aus Absatz 3" öffnet die Lernkarten' },
    { s:'graph', g:'iphone', wo:'button.row.girow:nth-child(4)', ziel:'notizen', t:'„3 Rückverweise" öffnet die Notizenliste' },
  ] };

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
  };
})(window);
