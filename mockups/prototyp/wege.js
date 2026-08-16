/* ============================================================================
 * wege.js — DIE WEGEKARTE
 *
 * Welches Element in welchem Schirm wohin führt. Reine Daten, keine Logik:
 * prototyp.js liest diese Datei beim Start (§9) und belebt genau das, was
 * hier steht — alles andere bleibt tot (prototyp.css §4).
 *
 * Sie liegt seit dieser Runde in einer eigenen Datei. Der Grund ist nicht
 * Ordnung, sondern Arbeitsteilung: die Bedienung ändert sich selten, die
 * Karte bei jedem neuen Schirm. Wer einen Weg hinzufügt, soll nicht in
 * zweitausend Zeilen Bewegungslogik blättern müssen, und wer die Bewegung
 * ändert, soll nicht aus Versehen einen Weg löschen.
 *
 * Die Datei wird VOR prototyp.js geladen (tools/prototyp-bauen.js §5) und
 * legt window.VELUM_WEGE ab. Fehlt sie, sagt prototyp.js das in der Konsole
 * und lässt alles außer der Grundnavigation tot — ein Prototyp ohne Karte
 * soll leer aussehen, nicht heimlich halb funktionieren.
 *
 * ── EIN EINTRAG ───────────────────────────────────────────────────────────
 *
 *     { s:'bibliothek', g:'ipad', wo:'article.book.is-selected',
 *       ziel:'notiz', art:'oeffnen', t:'Notizbuch Zellbiologie öffnen' }
 *
 *   s      Schlüssel des Schirms, in dem das Element steht: heute ·
 *          bibliothek · eingang · canvas · notizen · notiz · journal ·
 *          journal-eintrag · aufgaben · aufgabe · lernkarten · lernsitzung ·
 *          semester · graph · suche · einstellungen · leere-zustaende.
 *          Der Dateiname (note-editor.html, note-editor) wird ebenfalls
 *          angenommen.
 *   g      'ipad' | 'iphone' | 'beide'   (Vorgabe: 'beide')
 *   wo     CSS-Wähler, gesucht wird NUR innerhalb dieses Rahmens. Jeder
 *          Treffer wird ein Ziel; keiner ist kein Fehler, wird aber beim
 *          Start in der Konsole gemeldet — ein Weg ins Leere ist schlimmer
 *          als keiner.
 *   ziel   Schlüssel eines Schirms · 'zurueck' · 'nichts' · 'extern:…'
 *   art    'oeffnen' (Vorgabe) · 'herkunft' · 'zurueck'
 *   t      Klartext für aria-label und Fußzeile
 *
 * Jede Zeile ist im Browser geprüft: der Wähler trifft in seinem Rahmen
 * genau ein Element, und die Mitte dieses Elements wird auch wirklich von
 * ihm gefangen (document.elementFromPoint).
 *
 * ── WAS HIER NICHT STEHT UND TROTZDEM LEBT ────────────────────────────────
 * Die Grundnavigation — Seitenleiste, Symbolschiene, Lupe, Tab-Leiste und
 * der Zurück-Weg — steht in prototyp.js §5. Sie ist in allen siebzehn
 * Schirmen wortgleich; sie hier 34-mal aufzuzählen hieße, 34-mal dasselbe zu
 * pflegen. Dazu die drei Erscheinungsbild-Kacheln der Einstellungen und die
 * Elemente mit data-bw (die fünf Signature-Momente): sie führen nirgendwohin,
 * tun aber etwas Sichtbares und sind darum keine toten Ziele.
 *
 * ── WARUM FÜNF NOTIZZEILEN IN DIESELBE NOTIZ FÜHREN ───────────────────────
 * Velum hat je Modul genau einen gezeichneten Detailschirm. Ein Regal, in
 * dem nur ein einziges Buch aufgeht, fühlt sich kaputt an; ein Regal, in dem
 * jedes Buch aufgeht, fühlt sich wie eine App an. Der Übergang ist sichtbar
 * und trägt — in den ersten dreißig Sekunden fragt niemand, ob im Editor
 * „Genetik II" statt „Zellbiologie" steht. Ein Tap dagegen, der auf
 * demselben Schirm mit demselben Inhalt landet, fiele sofort auf: solche
 * Wege stehen nicht in dieser Karte.
 *
 * ── WAS BEWUSST NICHT DRINSTEHT ───────────────────────────────────────────
 * Die 34 Rahmen tragen zusammen 778 Bedienelemente; 433 davon leben, 345
 * führen nirgendwohin — örtliche Schalter ohne zweiten gezeichneten Zustand,
 * Filter, Werkzeuge ohne Werkzeugwirkung, alles, was Daten änderte. Sie
 * brauchen keine Liste: der Prototyp ist grundsätzlich tot, lebendig wird
 * nur, was hier steht. Damit ist die Regel „was nicht führt, fühlt sich
 * nicht führend an" nicht gepflegt, sondern gebaut.
 *
 * Drei Beispiele aus dieser Runde, damit die Regel greifbar bleibt: die
 * Chips „Notiz · Aufgabe · Notizbuch" an den beiden fadenlosen Schnipseln im
 * Eingang (sie legten eine Beziehung erst an), „16:42 abspielen" am
 * gesprochenen Treffer (eine Aufnahme ist keine Beziehung) und die Zeile
 * „Vorlesung 7 — Membranpotenzial" im Semester (geplant, noch nicht
 * geschrieben — hohler Punkt, kein Faden, im Markup kein Knopf).
 *
 * Die vier Chips mit [data-bw="herkunft"] tragen ihre Bewegung schon im
 * Markup. Bei ihnen kommt erst der Faden und dann der Weg (prototyp.js §5d) —
 * beim Lernkarten-Chip bleibt es beim Faden, weil dort die Quelle an Ort und
 * Stelle aufgeht und der Weg weiter als Knopf darin steht.
 * ========================================================================== */

window.VELUM_WEGE = { version: 3, wege: [

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

  /* ── Eingang ── 5
     Der Eingang hat drei Schnipsel und genau EINEN Faden. Nur der Schnipsel,
     an dem gerade eine Beziehung entsteht, führt irgendwohin — und er führt
     dorthin, wohin er wird. Die beiden anderen liegen ohne Kante da; das ist
     die Aussage des Schirms, und ein Weg an ihnen wäre ein erfundener Faden.
     Ihre Chips „Notiz · Aufgabe · Notizbuch" legten eine Beziehung erst an;
     im Prototyp entsteht nichts, also bleiben sie tot und sehen auch so aus. */
  { s:'eingang', g:'ipad',   wo:'#ei-s3',     ziel:'notiz', t:'Der Schnipsel „Der Konzentrationsgradient …" wird zur Notiz Zellbiologie — der Faden führt dorthin' },
  { s:'eingang', g:'ipad',   wo:'#ei-ziel',   ziel:'notiz', t:'Das Ziel des Fadens „Zellbiologie · Notiz · wird Absatz 15" öffnet den Notiz-Editor' },
  { s:'eingang', g:'iphone', wo:'#ei-s3-p',   ziel:'notiz', t:'Der Schnipsel „Der Konzentrationsgradient …" wird zur Notiz Zellbiologie — der Faden führt dorthin' },
  { s:'eingang', g:'iphone', wo:'#ei-ziel-p', ziel:'notiz', t:'Das Ziel des Fadens „Zellbiologie · wird Absatz 15" öffnet den Notiz-Editor' },
  /* Ohne Vorgeschichte führt der Pfeil dorthin, wo seine Beschriftung hinzeigt:
     der Eingang liegt auf dem iPhone unter „Mehr". Mit Vorgeschichte gilt die
     Vorgeschichte (prototyp.js §5, rueckwegPruefen). */
  { s:'eingang', g:'iphone', wo:'[aria-label="Zurück zu Mehr"]', ziel:'einstellungen', art:'zurueck', t:'Der Zurück-Pfeil führt zurück nach „Mehr"' },

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

  /* ── Canvas ── 1
     Der eine Ausgang des Canvas — Nachtrag zur Biopsie (Befund B5: das
     Canvas war der einzige Schirm ohne ausgehenden Weg). Die Ursache war
     strukturell, kein Versäumnis der Karte: das Blatt ist ein iframe, und
     Wähler greifen nicht in fremde Dokumente. Der Daraus-Chip liegt deshalb
     auf dem Rahmen (prototyp-bauen.js, canvasSchirm) und trägt die
     Rückrichtung der Kante, die die App längst schreibt: Handschrift wurde
     Karte. Die App baut dazu M8; hier zieht die Vorlage nach. */
  { s:'canvas', wo:'[data-pv-canvas-daraus]', ziel:'lernkarten', t:'Daraus entstanden: 3 Karten im Deck „Zellbiologie" — öffnet die Lernkarten' },

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
  /* ── Semester-Ordner ── 15
     Der Ordner ist eine Liste aus fünf Modulen, nach Zeit geordnet. Jede
     Zeile ist ein Objekt und führt zu ihm — genau das macht die Spur zu einer
     Ansicht auf dieselben Daten und nicht zu einer sechsten Liste.
     Zwei Zeilen führen bewusst nicht: „Vorlesung 7 — Membranpotenzial" ist
     geplant und noch nicht geschrieben (hohler Punkt, kein Faden, im Markup
     kein Knopf), und „Woche 1–6 · 41 Objekte" auf dem iPhone klappt auf —
     ein zweiter Zustand, den dieser Schirm nicht zeichnet. */
  { s:'semester', g:'ipad', wo:'#se-w5-journal',  ziel:'journal-eintrag', t:'Journaleintrag „Erste Woche im Labor" (24. Okt) öffnet den Journal-Eintrag' },
  { s:'semester', g:'ipad', wo:'#se-w5-aufgabe',  ziel:'aufgabe',         t:'Aufgabe „Schutzbrille und Kittel besorgen" öffnet das Aufgaben-Detail' },
  { s:'semester', g:'ipad', wo:'#se-w6-canvas',   ziel:'canvas',          t:'Canvas-Blatt „Zellkultur-Skizze" (28. Okt) öffnet das Canvas' },
  { s:'semester', g:'ipad', wo:'#se-w6-notiz',    ziel:'notiz',           t:'Notiz „Vorlesung 3 — Diffusion" öffnet den Notiz-Editor' },
  { s:'semester', g:'ipad', wo:'#se-w7-quelle',   ziel:'notiz',           t:'Die Quelle der langen Klammer, Notiz „Zellbiologie — Vorlesung 6. November", öffnet den Notiz-Editor' },
  { s:'semester', g:'ipad', wo:'#se-w7-journal',  ziel:'journal-eintrag', t:'Journaleintrag „Nach dem Praktikum" (7. Nov) öffnet den Journal-Eintrag' },
  { s:'semester', g:'ipad', wo:'#se-w8-deck',     ziel:'lernkarten',      t:'Deck „Zellbiologie" · 12 Karten öffnet die Lernkarten-Übersicht' },
  { s:'semester', g:'ipad', wo:'#se-w8-aufgabe',  ziel:'aufgabe',         t:'Aufgabe „Laborprotokoll Zellkultur schreiben" öffnet das Aufgaben-Detail' },
  { s:'semester', g:'ipad', wo:'#se-w8-osmose',   ziel:'notiz',           t:'Notiz „Osmose" (aus dem Wiki-Link) öffnet den Notiz-Editor' },
  { s:'semester', g:'iphone', wo:'#se-w7-quelle-p',  ziel:'notiz',           t:'Notiz „Zellbiologie" · daraus 14 Objekte öffnet den Notiz-Editor' },
  { s:'semester', g:'iphone', wo:'#se-w7-journal-p', ziel:'journal-eintrag', t:'Journaleintrag „Nach dem Praktikum" öffnet den Journal-Eintrag' },
  { s:'semester', g:'iphone', wo:'#se-w8-deck-p',    ziel:'lernkarten',      t:'Deck „Zellbiologie" · 12 Karten öffnet die Lernkarten-Übersicht' },
  { s:'semester', g:'iphone', wo:'#se-w8-aufgabe-p', ziel:'aufgabe',         t:'Aufgabe „Laborprotokoll schreiben" öffnet das Aufgaben-Detail' },
  { s:'semester', g:'iphone', wo:'#se-w8-osmose-p',  ziel:'notiz',           t:'Notiz „Osmose" öffnet den Notiz-Editor' },
  { s:'semester', g:'iphone', wo:'[aria-label="Zurück zur Bibliothek"]', ziel:'bibliothek', art:'zurueck', t:'Der Zurück-Pfeil führt in die Bibliothek' },

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

  /* ── Suche ── 17
     Zwei Richtungen, wie das Leitmotiv es verlangt.
     HINAUS: jeder Treffer führt zu seinem Objekt — die Fundstelle im Strich
     zur Notiz, die im Bild aufs Canvas-Blatt, die in der Aufnahme zur Notiz,
     die im Journaltext zum Eintrag.
     ZURÜCK: wo eine Klammer steht, ist ihr Kopf der Ursprung der Zeilen
     darunter. Er trägt deshalb art:'herkunft' — dieselbe Lesart wie der
     Klammer-Kopf auf tasks.html —, und der Wege-Modus schreibt „Faden → …"
     statt „→ …": man läuft den Faden ab, man springt nicht.
     Kein Weg hat „16:42 abspielen": eine Aufnahme abzuspielen ist keine
     Beziehung, und der Prototyp spielt nichts ab. */
  { s:'suche', g:'ipad', wo:'#su-tinte',        ziel:'notiz',       art:'herkunft', t:'Fundstelle in der Tinte: „Zellbiologie · Absatz 9" ist der Ursprung der Klammer und führt in die Notiz' },
  { s:'suche', g:'ipad', wo:'#su-tinte-karte',  ziel:'lernsitzung', t:'Daraus entstanden: Lernkarte „Was beschreibt Osmose?" öffnet die Lernsitzung' },
  { s:'suche', g:'ipad', wo:'#su-tinte-notiz',  ziel:'notiz',       t:'Daraus entstanden: Notiz „Osmose" öffnet den Notiz-Editor' },
  { s:'suche', g:'ipad', wo:'#su-bild',         ziel:'canvas',      art:'herkunft', t:'Fundstelle im Bild: die Beschriftung „Osmose" ist der Ursprung der Klammer und führt auf das Canvas-Blatt' },
  { s:'suche', g:'ipad', wo:'#su-bild-aufgabe', ziel:'aufgabe',     t:'Daraus entstanden: Aufgabe „Osmose-Versuch wiederholen" öffnet das Aufgaben-Detail' },
  { s:'suche', g:'ipad', wo:'.card:has(#su-play) > .row',      ziel:'notiz',           t:'Fundstelle in der Aufnahme „Vorlesung 6. Nov" öffnet die Notiz, in der sie liegt' },
  { s:'suche', g:'ipad', wo:'.card:has(.dot--journal) > .row', ziel:'journal-eintrag', t:'Fundstelle im Journaleintrag „Nach dem Praktikum" öffnet den Eintrag' },
  { s:'suche', g:'ipad', wo:'section.card:nth-child(6) > div.row', ziel:'notiz',       t:'Fundstelle in der Notiz „Vorlesung 3 — Diffusion" öffnet den Notiz-Editor' },
  { s:'suche', g:'ipad', wo:'#su-abbrechen',    ziel:'zurueck',     art:'zurueck',  t:'„Abbrechen" verlässt die Suche und führt dorthin zurück, wo sie geöffnet wurde' },
  { s:'suche', g:'iphone', wo:'#su-tinte-p',        ziel:'notiz',       art:'herkunft', t:'Fundstelle in der Tinte: „Zellbiologie · Absatz 9" ist der Ursprung der Klammer und führt in die Notiz' },
  { s:'suche', g:'iphone', wo:'#su-tinte-karte-p',  ziel:'lernsitzung', t:'Daraus entstanden: Lernkarte „Was beschreibt Osmose?" öffnet die Lernsitzung' },
  { s:'suche', g:'iphone', wo:'#su-tinte-notiz-p',  ziel:'notiz',       t:'Daraus entstanden: Notiz „Osmose" öffnet den Notiz-Editor' },
  { s:'suche', g:'iphone', wo:'#su-bild-p',         ziel:'canvas',      art:'herkunft', t:'Fundstelle im Bild: die Beschriftung „Osmose" ist der Ursprung der Klammer und führt auf das Canvas-Blatt' },
  { s:'suche', g:'iphone', wo:'#su-bild-aufgabe-p', ziel:'aufgabe',     t:'Daraus entstanden: Aufgabe „Osmose-Versuch wiederholen" öffnet das Aufgaben-Detail' },
  { s:'suche', g:'iphone', wo:'.card:has(#su-play-p) > .row',    ziel:'notiz',           t:'Fundstelle in der Aufnahme „Vorlesung 6. Nov" öffnet die Notiz, in der sie liegt' },
  { s:'suche', g:'iphone', wo:'.card:has(.dot--journal) > .row', ziel:'journal-eintrag', t:'Fundstelle im Journaleintrag „Nach dem Praktikum" öffnet den Eintrag' },
  { s:'suche', g:'iphone', wo:'#su-abbrechen-p',    ziel:'zurueck',     art:'zurueck',  t:'„Abbrechen" verlässt die Suche und führt dorthin zurück, wo sie geöffnet wurde' },

] };
