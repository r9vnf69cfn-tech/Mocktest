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
 *  10  DIE WEGEKARTE          die Daten — 142 Wege
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
  var laeuft = null;

  function alleRahmen(fn) {
    Array.prototype.forEach.call(GLAS.querySelectorAll('.pv-screen'), fn);
  }

  function aufraeumen(rahmen) {
    rahmen.classList.remove('bw-wechseln-raus', 'bw-wechseln-rein');
    rahmen.removeAttribute('data-pv-richtung');
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

    var zurueck = richtung === 'zurueck';
    if (richtung !== 'seitlich') {
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
    laeuft = { fertig: fertig, uhr: setTimeout(fertig, WECHSEL_MS + 60) };
    fokusMitnehmen(neu);
    nachWechsel(schirm, geraet);
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
  }

  /* ── Der öffentliche Weg: hierüber navigiert alles ──────────────────────
     Erst der Zustand, dann das Bild. zeigen() meldet am Ende, wie tief man
     steht — stünde die Geschichte da noch auf dem alten Wert, wäre der
     Zurück-Knopf des neuen Schirms für einen Wimpernschlag tot. */
  function gehen(zielSchluessel, richtung, ersetzen) {
    var k = loesen(zielSchluessel);
    if (!k) return false;
    if (k === jetzt.schirm) return false;
    var geraet = jetzt.geraet;
    var tiefe = ersetzen ? jetzt.tiefe : jetzt.tiefe + 1;
    zustandSetzen(k, geraet, tiefe, !!ersetzen);
    zeigen(k, geraet, richtung || 'vor');
    return true;
  }

  /* Zurück gibt es IMMER. Steht etwas in der Geschichte, geht es dorthin —
     das ist derselbe Weg, den die Rückwärtstaste des Browsers nimmt. Steht
     nichts darin (man hat den Schirm über seinen Anker aufgerufen), führt er
     auf den Einstieg. So wie eine App, die aus einer Mitteilung heraus
     geöffnet wurde: der Stapel wird von unten neu aufgebaut, statt dass der
     Pfeil ins Leere zeigt. Ein Zurück-Weg, der nirgends hinführt, wäre genau
     das tote Ziel, das diese Datei sonst überall verhindert. */
  function zurueck() {
    if (jetzt.tiefe > 0) { history.back(); return true; }
    if (jetzt.schirm === START) return false;
    return gehen(START, 'zurueck', true);
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

  /* Ein Klick im Glas. Ein einziger Zuhörer für 26 Rahmen. */
  GLAS.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.pv-lebt') : null;
    /* Anker mit href="#" stehen im Bestand (die Buchdeckel der Bibliothek).
       Unbehandelt schrieben sie „#" in die Adresse und löschten den Anker,
       an dem der Prototyp hängt. */
    var anker = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (anker) e.preventDefault();
    if (!el) return;
    var weg = el.__pvWeg;
    if (!weg) return;                       /* lebendig, aber ohne Weg (data-bw) */
    e.preventDefault();
    if (weg.ziel === 'zurueck') { zurueck(); return; }
    if (weg.ziel === 'nichts') return;
    if (weg.ziel.indexOf('extern:') === 0) { location.href = weg.ziel.slice(7); return; }
    gehen(weg.ziel, weg.richtung || 'vor');
  });

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
    'canvas':        'extern:../../index.html',
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
        richtung: ziel.indexOf('extern:') === 0 ? 'vor' : seitlicheRichtung(schirmSchluessel, ziel),
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
        if (moeglich) beleben(k, { ziel: 'zurueck', richtung: 'zurueck' });
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

  function karteAnwenden(rahmen, geraet) {
    if (!KARTE || !KARTE.wege) return;
    var schirm = rahmen.getAttribute('data-pv-screen');
    KARTE.wege.forEach(function (eintrag) {
      if (!eintrag || !eintrag.wo || !eintrag.ziel) return;
      if (loesen(eintrag.schirm) !== schirm) return;
      var g = eintrag.geraet || 'beide';
      if (g !== 'beide' && g !== geraet) return;
      var ziel = eintrag.ziel;
      if (ziel !== 'zurueck' && ziel !== 'nichts' && ziel.indexOf('extern:') !== 0) {
        var k = loesen(ziel);
        if (!k) { melden('Wegekarte: unbekanntes Ziel "' + ziel + '" (' + schirm + ' · ' + eintrag.wo + ')'); return; }
        ziel = k;
      }
      var treffer = rahmen.querySelectorAll(eintrag.wo);
      if (!treffer.length) {
        melden('Wegekarte: "' + eintrag.wo + '" trifft nichts in ' + schirm + ' · ' + geraet);
        return;
      }
      Array.prototype.forEach.call(treffer, function (el) {
        beleben(el, { ziel: ziel, richtung: eintrag.richtung || 'vor', titel: eintrag.titel });
      });
    });
  }

  var gemeldet = {};
  function melden(text) {
    if (gemeldet[text]) return;
    gemeldet[text] = 1;
    if (global.console && console.warn) console.warn('[prototyp] ' + text);
  }

  /* Der ganze Aufbau in einem Zug — beim Start und bei jeder neuen Karte. */
  function aufbauen() {
    alleRahmen(function (rahmen) {
      var geraet = rahmen.getAttribute('data-pv-geraet');
      totstellen(rahmen);
      grundnavigation(rahmen, geraet);
      karteAnwenden(rahmen, geraet);
    });
    rueckwegPruefen();
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 6 · TASTATUR UND GESTE
   * ==================================================================== */

  function blaettern(schritt) {
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
    wegeAnlegen(global.VELUM_WEGE || null);
    if (!global.VELUM_WEGE) {
      melden('Keine Wegekarte geladen (mockups/prototyp/wege.js). Es tragen nur ' +
             'Seitenleiste, Tab-Bar, Zurück-Weg und die data-bw-Momente. ' +
             'Aufbau der Karte: siehe Kopf dieser Datei.');
    }

    var a = ankerLesen(location.hash) || { schirm: START, geraet: 'ipad' };
    geraetZeigen(a.geraet);
    zustandSetzen(a.schirm, a.geraet, 0, true);
    zeigen(a.schirm, a.geraet, 'keine');
    massstab();

    /* Die Fäden der Schirme werden erst gezeichnet, wenn ihr Rahmen eine
       Größe hat. Das besorgt der ResizeObserver in mock.js von selbst —
       hier wird nur einmal nachgestoßen, falls ein Schirm beim Start schon
       stand, bevor mock.js fertig war. */
    global.setTimeout(massstab, 0);
  }

  if (DOK.readyState === 'loading') DOK.addEventListener('DOMContentLoaded', start);
  else start();

  /* ══════════════════════════════════════════════════════════════════════
   * DIE ÖFFENTLICHE HAND
   * ==================================================================== */

  global.PROTOTYP = {
    wege:      wegeAnlegen,       /* Wegekarte setzen (ersetzt die bisherige) */
    gehen:     gehen,             /* PROTOTYP.gehen('aufgabe', 'vor')         */
    zurueck:   zurueck,
    geraet:    geraetWechseln,    /* PROTOTYP.geraet('iphone')                */
    schirme:   SCHIRME,
    zustand:   function () { return { schirm: jetzt.schirm, geraet: jetzt.geraet, tiefe: jetzt.tiefe }; },
    neuAufbauen: aufbauen,
  };
})(window);
