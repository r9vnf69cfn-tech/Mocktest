# Stand — 10. August, Abend

Alles ist eingecheckt und gepusht. Branch `claude/goodnotes-canvas-mockup-6ujblz`,
HEAD `91a68f9`. Nichts liegt uncommitted herum, nichts wartet in einem
Kladdeordner — der Container darf weg.

---

## Wo die Sachen liegen

| Was | Wo |
|---|---|
| Der begehbare Prototyp | `mockups/prototyp/` — `index.html` ist erzeugt, Quelle sind die Schirme in `mockups/app-next/` |
| Der Prototyp als eine Datei | `node tools/einzeldatei-bauen.js` → `/home/user/velum-prototyp.html` (3,9 MB, laeuft ueber `file://`, Canvas eingebettet) |
| Live | https://claude.ai/code/artifact/07eb7e23-beaf-49eb-ba37-9975e6cb8d5b |
| Der Ordner zum Herunterladen | `node tools/paket-bauen.js` → `/home/user/newmockup/` (29 MB, gezippt 25) |
| Das Canvas | `index.html` + `js/` + `css/` im Wurzelverzeichnis |
| Die Regeln, gegen die alles gebaut ist | `docs/04_velum-dna.md` — das Leitmotiv, die drei Grundformen, die sieben Serif-Rollen, die Nachtraege N1–N12 |

## Wie man etwas aendert

```
# Schirm geaendert (mockups/app-next/*.html):
node tools/prototyp-bauen.js          # baut mockups/prototyp/index.html neu

# Bedienung geaendert (mockups/prototyp/prototyp.js):
#   nichts zu bauen — index.html laedt die Datei extern

# Danach immer:
node tools/tote-knoepfe.js            # muss 0 tote <button> melden
node tools/wirkungsprobe.js           # STARR nur bei „du bist schon hier"

# Und zum Ausliefern:
node tools/einzeldatei-bauen.js       # Artefakt
node tools/paket-bauen.js             # newmockup/
node tools/paket-pruefen.js           # 46 Seiten, kein toter Verweis
```

`tools/rendern.js` erzeugt die Bilder in `mockups/_renders/`,
`tools/md2html.js` die sechs Dokumentseiten aus den Markdown-Quellen.

Playwright liegt nicht im Repo. Die Messwerkzeuge brauchen `playwright-core`
im `NODE_PATH` und den Browser unter
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

---

## Was in der letzten Runde passiert ist

Die Messung nach der Erzeugen-Runde fand **207 echte `<button>`**, die
dastanden wie Bedienung und keine waren. Jetzt sind es **null**, und
**203 von 234** oertlich wirkenden Elementen veraendern beim Druck
nachweislich das Bild.

Die Regel dazu steht in `mockups/prototyp/prototyp.js` §14 ganz oben:

> Ein `<button>` im Prototyp hat entweder einen Weg, oder eine sichtbare
> Wirkung an Ort und Stelle, oder er ist kein `<button>`.

§14 ist nach Familien geordnet (Umschalter · Seitenleisten · Filterchips ·
Symbole · Aufgaben-Detail · Lernsitzung · Editor · Uebergabe-Chips). **§14t
ist die Nachlese** und sammelt auf, was keine Familie hat — sie meldet jeden
Fund in der Konsole. Steht dort etwas, gehoert es in eine eigene Zeile, nicht
in die Nachlese.

Die drei Befunde der Abnahme davor sind weg: „Canvas-Blatt" liefert ein
leeres Blatt (`js/app.js` kennt jetzt `?leer=1`), die ERKANNT-Zeile liest
wirklich, was getippt wird, und die Kollision auf dem Lernkarten-iPhone ist
mit den beiden Tinte-Korrekturen verschwunden.

---

## Die Abnahme der zweiten Runde (11. August)

Acht Prüfer haben die Bedienung aus §14 in Dunkel, auf dem iPhone und bei
großer Schrift nachgemessen — alles Kombinationen, die beim Bauen nie
angesehen worden waren. **111 Befunde: 15 schwer, 19 mittel, 12 klein.**
Der ganze Bericht mit allen Zahlen steht in `docs/06_abnahme-paragraf-14.md`.

### Der wichtigste Befund ist einer über meine eigene Messung

Ich habe nach der Bau-Runde gemeldet: „203 von 234 örtlichen Handlungen
verändern das Bild." Das war zu schwach gemessen. `tools/wirkungsprobe.js`
vergleicht eine Signatur aus allen Kästen und Klassennamen — und ein
Filterchip, der seine eigene Füllung wandern lässt und **sonst nichts tut**,
verändert diese Signatur. Sechs schwere Befunde sind genau das:

| Fläche | was wirklich passiert |
|---|---|
| Suche, alle fünf Chips | jeder liefert dieselben 3 Karten |
| Suche, Chip „Notizen" | `replace(/n$/,'')` macht daraus den Stamm `notize` — trifft 0 Fundstellen |
| Notizen iPhone, Chipreihe | die Rauten-Wache kehrt um, kein Chip wird belebt, 5 Zeilen bleiben 5 |
| Graph, Modulreihe | sucht `.scroll section.card`, die es im Graphen nicht gibt — 23 Knoten zeichengenau unverändert |
| Graph, Tag-Chips | heben 0 von 23 Knoten hervor und setzen den ganzen Graphen auf 28 % |
| Lernkarten, Sortierung | `.deck` und `.card--deck` kommen in index.html 0 Mal vor |

**Die Lehre:** „das Bild hat sich verändert" ist die falsche Frage. Die
richtige ist „hat sich verändert, was der Knopf verspricht" — und die kann
nur beantworten, wer je Bedienelement weiß, was es verspricht. Bis das im
Werkzeug steht, gilt das Ergebnis der Wirkungsprobe als **untere Schranke**,
nicht als Nachweis.

### Repariert und nachgemessen (Stand c5dbb6c)

| Befund | Beleg | Behoben durch |
|---|---|---|
| Rückweg auf „Liste" zerstörte das zweispaltige Aufgaben-Layout für immer | `verbergen()` schrieb `style.display=''` und löschte das inline `display:grid` | `verbergen()` merkt sich den Inline-Wert |
| iPhone rollte im Brett 58 pt waagerecht | eine Zeile trug `translateX(88px)` aus einer Wisch-Vorführung | `.pv-brett__stapel > .row { transform: none }` |
| Ziffer im gefüllten Kalendertag im Dunkeln weiß auf weiß | `--on-ink` gibt es nicht, Rückfall auf `#fff` | `var(--accent-on)` |
| drei tote Marken in prototyp.css | `--c-1/2/3` sind KLASSEN, keine Marken | `var(--ink-1/2/3)` |
| `--rot` gibt es nicht | die Semantikfarbe heißt `--danger` | `var(--danger)` |
| Leiter las sich klein → kleiner → Standard | „Kleiner" stand rechts von „Klein" | `Sehr klein · Klein · Standard · Groß · Sehr groß` |

### Die fünfzehn schweren Befunde

- 1 · Einstellungen auf dem iPhone: seitenleisteBeleben sucht 'aside .navitem' (prototyp.js:3968), auf dem iPhone gezählt aside=0, .navitem=0, .pv-einst=0, .pv-schalter=0 — die ganze neue Bedienung fehlt, und alle 11 Chevron-Zeilen sind tot.
- 2 · Suche, schichtFiltern (prototyp.js:4242): weil die nicht gewählten Chips kein .is-off bekommen, zählt die Zeile alle als 'an' — jeder der fünf Chips liefert dieselben 3 Karten, in allen 8 Läufen.
- 3 · Suche, Wortstamm (prototyp.js:4254): replace(/n$/,'') macht aus 'notizen' den Stamm 'notize', der in keiner Fundstelle vorkommt — der Chip 'Notizen' trifft 0 Notizen, während 'canvas'→'canva' und 'journal' greifen.
- 4 · Notizen iPhone, Tag-Wache (prototyp.js:5228): 4 Rauten-Chips von 7 sind mehr als 7/2, die Funktion kehrt um — kein Chip trägt .pv-lebt, pointer-events:none, echter Mausklick lässt 5 sichtbare Zeilen bei 5.
- 5 · Graph, Modulreihe (prototyp.js:4198/4249): schichtFiltern sucht .scroll section.card, der Graph hat keine — die Klassenliste aller 23 (iPad) bzw. 10 (iPhone) Knoten ist vor und nach dem Klick zeichengenau identisch.
- 6 · Graph, Tag-Chips (prototyp.js:4272): gesucht wird der Tag im Knotentitel statt an den Notizen — #prüfung hebt 0 von 23 Knoten hervor, #uni/mathe 0 von 23, während der ganze Graph auf 28 % zurücktritt.
- 7 · Lernkarten, deckSortieren (prototyp.js:3826-3834): die Wähler .deck und .card--deck kommen in index.html 0 Mal vor (selbst nachgezählt), .scroll .row trifft 0 — die Reihenfolge der 7 Karten ist vor und nach dem Klick zeichengleich.
- 8 · Suche, Zählstand (prototyp.js:4258-4264): der Chip sagt 'Alle 3', die Zeile darunter '12 Fundstellen', sichtbar sind 3 Karten mit 5 Trefferzeilen — und nach einem Klick auf 'Alle' steht dort 6 statt 12.
- 9 · Notizen, notizenFilter (3773) und notizenSammlung (4005) setzen einander nicht zurück: links 'Papierkorb 3' aktiv, oben 'Mit Karten' aktiv, und in der Liste steht eine angeheftete Notiz — drei Aussagen auf einem Schirm.
- 10 · Semester, semesterOrdnen else-Zweig (prototyp.js:3938-3942): die Herkunftsmarke sitzt in der Rinne neben der Zeile, nicht in ihr — 9 von 10 iPad-Zeilen landen unter 'Direkt geschrieben', auf dem iPhone alle 7 in einer einzigen Gruppe.
- 11 · Journal-Karte (prototyp.js:3732): die Trefferzählung für die sechs gesuchten Ortsnamen ergibt 0 auf beiden Geräten, also feuert immer der Rückfall ['Universität','Labor 3.14'] — und unter jedem erfundenen Ort steht 'im Journal genannt', während der Eintrag 'Labor 2' sagt.
- 12 · Graph-Knotenblatt bei 'Aa groß' (index.html:8686, height:252px): der Inhalt braucht 279 px und tritt 27 px aus, der Knopfstreifen überlappt die Tab-Leiste um 22 px — vier von fünf Tab-Mitten fallen von 47 px auf 1 px, ein Klick auf 'Heute' öffnet die Notiz.
- 13 · Brett bei 'Aa groß' (prototyp.css:985): 'Laborprotokoll Zellkultur schreiben' malt bis Textkante 818,9 gegen Kartenkante 783 — 35,9 px über die Karte und 11,9 px in die Nachbarspalte MORGEN hinein.
- 14 · Bereichsliste der Einstellungen bei 'Aa groß' (system.css:450, height:40px): der Textkasten wird 56 px hoch und überlappt den Nachbarn um 2 px, 'Synchronisierung' misst scrollWidth 252 gegen clientWidth 211, und ihr Warnzeichen steht bei x 820..837 außerhalb der bei 796 endenden Spalte.
- 15 · AUS-Schalter im Dunkeln (prototyp.css:1120-1146): Knauf rgb(23,25,28) auf Kartengrund rgb(23,25,28) = 1,00:1, Bahn 1,39:1, hellster Punkt des ganzen Bedienelements 1,35:1 gegen geforderte 3:1.

### Die neunzehn mittleren

- M1 · Brett-Chips kürzen nicht, sondern schneiden mitten im Buchstaben ab (prototyp.css:1210): text-overflow wirkt auf display:flex nicht, 'wenn das Deck fällig ist' scrollWidth 227 gegen clientWidth 125.
- M2 · Die Auswahl im Brett verliert zwei ihrer drei Merkmale (prototyp.css:957-967 schlägt system.css:547): Fläche und Ring sind byteweise identisch mit unausgewählt, nur Gewicht 600 bleibt — eine Regel .pv-brett__stapel > .row.is-selected existiert nicht (selbst nachgeschlagen).
- M3 · zeileErledigt (prototyp.js:3514) kennt .is-checking nicht: die einzige abgehakte Aufgabe steht im Board unter OFFEN=5, während ERLEDIGT=0 'nichts' meldet.
- M4 · zeileWann auf dem iPhone (prototyp.js:3518-3522): HEUTE=0 und OHNE TERMIN=5 gegen iPad HEUTE=2 / OHNE TERMIN=3, weil das fehlende Leerzeichen in 'Geplant 16:00noch' die Wortgrenze bricht und eine Zeile gar keinen Zeit-Chip trägt.
- M5 · Rest-Auffang ohne Nachzählung (prototyp.js:3608-3613): nach einer erledigten Aufgabe meldet der Kopf 'OHNE TAG 2' über 3 Zetteln, in Planer und Kalender gleich.
- M6 · 'heute' im Kalender hängt an einem Merkmal: der Fettschnitt ist folgenlos (gemessene fontWeight 600/600/600 für voll/heute/leer), der Ring hält 1,12:1 hell und 1,09:1 dunkel gegen geforderte 3:1.
- M7 · Leere Kalendertage tragen --line statt --line-tap (prototyp.css:1025): 1,24:1 hell und 1,35:1 dunkel, obwohl sie Knöpfe mit aria-label und Klickmeldung sind.
- M8 · Die Ortsmarken der Journal-Karte sind 24,0 pt (standard) bzw. 28,0 pt (groß) hoch statt 44, in allen 8 Läufen.
- M9 · Bei 'Aa groß' überlappen sich die beiden Karten-Pins auf dem iPhone um 12,1 x 11,9 pt, weil die Prozentstellen fest verdrahtet sind und das Feld nur 353 x 134,5 pt misst.
- M10 · Das Kartenfeld selbst trägt keine Aussage: zwei Marken im linken oberen Drittel, vier Fünftel leeres Karo mit 1,22:1 hell / 1,38:1 dunkel, und die Liste darunter enthält bereits alles — der Prüfer rät zum Weglassen.
- M11 · Nur der Schalter ist antippbar, 46 x 28 px (prototyp.css:1120): ein Klick 8 px darüber bei y=423 bewirkt nichts, obwohl die Zeile von 414 bis 475 reicht.
- M12 · Die aktive Bereichsauswahl zeigt nur noch die Fläche mit 1,15:1 hell / 1,30:1 dunkel: der Ink-Balken bei left:-12px wird vom overflow-y:auto weggeschnitten (kein Ink-Pixel bei x 573..576), und .navitem.is-active font-weight:600 wird von der .t-body-Kurzschrift auf 400 überschrieben.
- M13 · Die Unterzeile geht beim Schalten nicht mit (prototyp.js:4147-4155): 'Analyse senden' ist an, aria-checked=true, und darunter steht weiterhin 'Aus. Nichts verlässt das Gerät.'
- M14 · 'Abo' fällt in den Ausweichzweig, weil der Name aus dem Gesamttext gebildet wird und das Abzeichen 'Uni' heißt: Tafelname und Kopf lauten 'AboUni', die drei vorhandenen Abo-Zeilen werden nie benutzt.
- M15 · 16 Chevron-Zeilen in sieben Tafeln versprechen Navigation und tun nichts: document.body.innerHTML.length vor und nach dem Klick identisch bei 980728.
- M16 · [zwei Belege, eine Ursache] tafelZeigen verdeckt die Geschwister ohne behalten-Argument (prototyp.js:3415, Aufrufe 4162 und 3917): in den Einstellungen verschwindet das Sync-Fehlerband samt Knopf 'Erneut' auch bei der Tafel 'Synchronisierung' selbst, im Semester die 244-px-Schiene, die als einzige die drei Notizbücher beim Namen nennt.
- M17 · Semester 'Modul' rät das Notizbuch aus dem Zeilentext (prototyp.js:3929-3937): die Gruppe 'Genetik' trifft in acht von acht Läufen auf keine Zeile, Ergebnis sind 2 statt 3 Gruppen.
- M18 · Der Eingangs-Schnipselstapel wächst bei 'Aa groß', die Staffelung nicht: der Chip 'Notiz' liegt bei 589-615 unter der dritten Karte ab 601, ein echter Klick führt von {schirm:eingang} nach {schirm:notiz}.
- M19 · In der Lernsitzung verliert 'Zur Stelle' seine Mitte: elementFromPoint liefert bei standard 'Antwort zeigen', bei groß 'Canvas · Mitrechnen', und der echte Klick führt nach {schirm:canvas, tiefe:2}.

### Die zwölf kleinen

- K1 · Das Board hat drei Spalten in einem festgeschriebenen Vier-Spalten-Raster (prototyp.css:923-929): rechts bleiben 210 px leer, gridTemplateColumns rechnet zu '196px 196px 196px 196px'.
- K2 · Der Umschalter auf dem Aufgaben-Detail hat vier Zellen statt fünf — 'Kalender' fehlt nur im Markup, §14c würde den Blick auch dort bauen.
- K3 · Die Kalender-Legende sagt 'Ring = heute', aber 27 (iPad) bzw. 28 (iPhone) leere Tage sind ebenfalls Ringe.
- K4 · Der Fußsatz der Karte verspricht 'ein Ring je Eintrag'; im DOM trägt kein Element unter .pv-karte__pin 'ring' im Klassennamen.
- K5 · Der 13. trägt aria-label '13. November — Eintrag öffnen', wortgleich mit dem 10. und 12.: 'heute' kommt im zugänglichen Namen nicht vor.
- K6 · Die Ansage sagt fest 'drei Einstellungen', auch bei genau einer sichtbaren Zeile.
- K7 · Der Regler meldet vor der ersten Berührung role=button, danach role=slider ohne aria-valuemin/valuemax (in allen acht Läufen null), und seine Bahn ist 26 px hoch statt 44.
- K8 · Bestand: 'iPhone 15 · dieses Gerät' wird bei 'Aa groß' abgeschnitten, Kante bei x=953,7 gegen die Uhrzeit ab 961,7.
- K9 · Die Ordnungs-Ansage lautet 'Herkunft — 1 Gruppen, dieselben 7 Sachen.' und zählt den Wochenkopf 'Woche 1–6 · 41 Objekte' als Sache mit.
- K10 · Die Rücknahme der Rasterplatzierung vergisst den Einzug: 'Nach dem Praktikum' bringt inline padding-left:20px mit und steht 8 px eingerückt (Titel bei 617 statt 609).
- K11 · Der Notiz-Verlauf trägt fünf fest eingetragene Zeilen mit erfundenen Quellen, darunter 'Ort Labor 3.14 ergänzt' — derselbe Ort wie in Befund 11; auf dem iPhone gibt es den Umschalter gar nicht (Bericht bricht hier ab).
- K12 · Rest von R2: das transform ist neutralisiert, der inline Wischschatten box-shadow -10px 0 20px rgba(0,0,0,.18) an index.html:7775 bleibt im Brett stehen (aus dem Quelltext geschlossen, nicht am Bild nachgemessen).

### Was der Bericht als gut nachgewiesen hat

- Die Matrix trägt: 2x2 mit 406 px breiten Spalten, in allen vier iPad-Kombinationen nichts abgeschnitten, Zählung 1+2+1+2 = 6, alle vier Sätze stehen da.
- Die Wege gehen: echter Mausklick auf einen Zettel im Board führt von {aufgaben, tiefe 1} nach {aufgabe, tiefe 2}; im Journal klickt kein Ziel ins Leere (gefüllter Tag, leerer Tag, Medien-Kachel, Karten-Pin einzeln mit echtem Mausklick geprüft).
- Die sechs Aufgabenzeilen kommen in allen acht Kombinationen an ihre alte Stelle im DOM zurück — gleicher Elternknoten, gleicher Index, gleiche Reihenfolge, gleiche Klassen.
- Kein waagerechtes Rollen außer an der einen reparierten Stelle: Journal 393/393 und 1194/1194 in 8 Läufen und 4 Blicken, Einstellungen Seite 1700/1700 und iPad-Wirt 638/638.
- Nichts liegt unter der Tab-Leiste außer dem Graph-Fuß (Befund 12): auf dem iPhone endet die letzte Medien-Kachel bei y=757,3, die Tab-Leiste beginnt bei y=969.
- Alle Textkontraste halten: Zetteltitel 17,77:1 hell / 15,86:1 dunkel, Spaltenwort 5,26 / 6,84, Chip 5,10 / 6,36, Tafel-Unterzeile 5,14 / 5,57, Bildunterschrift 15,90 / 17,27 — kein Textwert unter 4,5:1.
- Regeln 1, 3, 4: im ganzen Brett genau zwei Buntwerte — #C4628E als 6-pt-Punkt und das semantische Rot am Frist-Chip; .dot--journal erscheint nur als 6-pt-Punkt neben einem Ortswort, nie als Fläche.
- Regel 6: keine achte Serif-Rolle, alle 110 Elemente des Bretts rechnen auf SF Pro, und weder §9 noch die Einstellungs-Tafeln führen eine serif--Klasse ein.
- Regel 7: durchgehend deutsch, auch im Verborgenen — aria-Etiketten, Wochentage 'Montag' bis 'Sonntag', Meldungen; die Suche nach Today/Tomorrow/Done/Open findet im Brett nichts.
- Leerzustände sind formuliert statt leer gelassen: jede leere Spalte trägt 'nichts' plus ihren Satz, das Medien-Raster 'In diesen Einträgen steckt kein Bild.', ein unbekannter Bereich 'In diesem Entwurf nicht ausgezeichnet'.
- Der Dunkelmodus zieht bei den Marken mit: .pv-brett__spalte rgb(29,31,35) gegen Zettel rgb(23,25,28) gegen Seitengrund rgb(14,15,17) — drei Stufen, dieselbe Staffelung wie hell (250/255/242), kein fest verdrahteter Farbwert in §9.
- Der Regler arbeitet mechanisch sauber: an 0/25/50/75/100 % stimmen Knaufposition, Füllbreite, Wort und aria-valuenow in allen acht Kombinationen überein; der Knauf bleibt mit 23 px links und 28 px rechts in der Karte.
- Der Rückweg steht: Darstellung → Datenschutz → Darstellung stellt alle vier Kinder des Wirts wieder her, auch nach Schirm- und Gerätewechsel; auf dem iPhone behalten alle .scroll-Kinder ihr inline display:flex.
- Trefferflächen im Brett und Kalender halten: kein Brett-Element unter 44x44 (Zettel 52 px und höher), Kalendertage 45,3 x 45,3 pt auf dem iPhone und 62 x 62 auf dem iPad.
- Der Kalender wächst nicht ins Riesenhafte (max-width 470 px), und die Bildunterschrift steht unter dem Foto statt darauf und ist zugleich das alt-Attribut — der Fall 'Text über Bild' tritt gar nicht ein.
- Sechs Befunde der ersten drei Berichte sind in c5dbb6c bereits repariert: verbergen()/__pvAnzeige, transform im Brett, --on-ink → --accent-on, --c-1/2/3 → --ink-1/2/3, --rot → --danger, die Schriftgrößen-Leiter.

### In welcher Reihenfolge ich reparieren würde

- 1. Die drei Filterflächen (Befunde 2, 3, 4, 5, 6, 8) — sechs schwere Befunde in zwei Funktionen, die höchste Befunddichte im ganzen Prüfstoff, und der Schaden trifft die eigene Ansage des Prototyps ('was keinen Weg hat, zeigt auch keinen Klickfinger'): hier zeigen lebendige Knöpfe einen Klickfinger und tun nichts. Die Reparaturen sind klein — eine Bedingung, ein Wörterbuch mit fünf Zeilen, eine Wache mit Vorbehalt, ein eigener Graph-Zweig. Achtung bei Befund 4: Wache und Wirkung gehören in einen Schritt, sonst tauscht man einen toten Knopf gegen einen lügenden.
- 2. Die vier Behauptungen ohne Deckung (10, 11, M17, K11) und die Zählstände (8, M5, K6, K9) — eine fehlende Angabe kostet eine Frage, eine falsche das Vertrauen in alle übrigen. In drei von vier Fällen ist Weglassen die Reparatur und kostet fast nichts: Rückfall streichen, Leerzustand setzen, wie das Medien-Raster es schon vormacht.
- 3. Die drei Stellen, an denen ein Tipp den falschen Schirm öffnet (12, M18, M19) — der einzige Befundtyp, bei dem der Betrachter aktiv fehlgeleitet wird, alle drei nur bei 'Aa groß', alle drei aus festen Pixelmaßen unter wachsender Schrift. Vorbedingung: die Treffprobe aus system.css §5.9 neu fahren; sie stammt aus der Zeit vor §14, die Nachlese fand 27 geklaute Mitten, davon nur sechs mit echtem Mausklick belegt.
- 4. Die fünf Kontrastwerte unter 3:1 (15, M6, M7, M12) — der AUS-Schalter mit 1,00:1 ist der härteste Einzelwert: das Bedienelement ist im Dunkeln nicht schwer lesbar, sondern nicht vorhanden. Alle vier sind mit bereits gerechneten Marken lösbar (--ink-ui, --line-tap, --accent-ring), also Ersetzungs- und keine Entwurfsarbeit. Nicht früher, weil sie bremsen und nicht in die Irre führen.
- 5. Die iPhone-Lücke der Einstellungen (Befund 1) — sachlich der größte Einzelbefund, eine ganze Fläche fehlt auf einem Gerät, aber der einzige, der echte Entwurfsarbeit verlangt: die Tafel gehört als eigener Schirm auf den Stapel, nicht in denselben Scroll. Zwischenlösung bis dahin: die elf Chevrons auf dem iPhone entfernen — kein Versprechen ist besser als ein gebrochenes.
- 6. Die zwei Layouts, die bei 'Aa groß' brechen (13, 14) — zwei feste Maße gegen eine wachsende Schrift (125 px Zeilenbreite ohne Umbruch, height:40px an der .navitem). Beide Reparaturen sind einzeilig und lösen je etwas mit: der Umbruch entschärft M1, min-height:44px erfüllt zugleich Regel 8.
- 7. Danach der Rest in dieser Folge: die Zustandsfehler, die das Bild sich selbst widersprechen lassen (M2, M3, M13) · die Trefferflächen (M8, M11, K7) · M16, weil es ein vorhandenes Argument ist und drei Minuten kostet · dann die Kosmetik K1 bis K12.
- Offen und nicht glattgebügelt: drei der acht Berichte fehlen, ihre Flächen sind unbekannt — die Abnahme ist nicht vollständig. graph iphone dunkel+groß ist für die Filterfrage nach wie vor nicht gefahren, Lernkarten dunkel sowie Eingang und Lernsitzung dunkel nie. K12 ist aus dem Quelltext geschlossen, nicht am Bild gemessen. Die sechs reparierten Befunde R1-R6 sind nicht nachgemessen, und R2 ist nur zur Hälfte behoben.

## Was offen ist

**1 · Die drei Marken-PNG fehlen.**
`assets/brand/velum-appicon-{light,dark,tinted}.png`. Wo das Zeichen stuende,
steht ein leerer Rahmen mit dem Dateinamen — nachgezeichnet wird nichts. Das
ist die einzige Stelle, an der der Entwurf sichtbar unfertig ist, und sie ist
es mit Absicht: das Zeichen gehoert nicht mir. Sobald die drei Dateien
daliegen, erscheinen sie ueberall gleichzeitig (`.appicon` laedt genau diese
Pfade). Bis dahin meldet `tools/paket-pruefen.js` elf Seitenfehler; alle elf
sind diese drei Dateien.

**2 · Typo-Disziplin.**
`tools/paket-pruefen.js` meldet auf fast jedem Schirm **7 Schriftgroessen**,
die DNA erlaubt fuenf. Der Befund ist alt und steht seit Runde 2. Zu klaeren
waere zuerst, ob der Pruefer Systemchrome (Statusleiste, Tab-Leiste)
mitzaehlt, das nicht zum Entwurf gehoert — erst danach lohnt das Zusammen-
legen von Groessen.

**3 · Die Ueberlappungsprobe hat 16 Treffer**, alle in Schichten
(Tab-Leiste ueber Inhalt, Vorder- und Rueckseite der Lernkarte, klebende
Fusszeilen). Ich habe sie angesehen und als Artefakte der Messung eingestuft,
weil mein Pruefer keine Stapelkontexte kennt. Wer das haerten will, prueft je
Paar mit `elementFromPoint`, wer oben liegt, und ob der Obenliegende einen
deckenden Grund hat.

**4 · Das Paket verkleinert die Bilder** auf halbe Kantenlaenge und
palettiert die flaechigen (256 Farben) — sonst waeren es 132 MB statt 29. Die
vollen Fassungen liegen unter `mockups/_renders/`. Wer sie im Paket in voller
Groesse braucht, nimmt die Verkleinerung in `tools/paket-bauen.js` §2 heraus
und muss die Datei dann anders ausliefern als per Nachricht (Grenze 30 MB).

---

## Was ich als naechstes tun wuerde

In dieser Reihenfolge, jede Stufe fuer sich abgeschlossen:

1. **Der Prototyp auf einem echten Geraet.** Alles bisher ist in Chromium
   gemessen, bei 1700 × 1150 mit Maus. Ein iPad mit Finger und Pencil wird
   Dinge zeigen, die kein Skript findet — Trefferflaechen, Scrollketten, die
   Frage, ob die Uebergabe-Leiste unter dem Daumen liegt.
2. **Die Typo-Disziplin klaeren** (Punkt 2 oben) — es ist die letzte offene
   Zusage aus dem Runde-2-Auftrag.
3. **Das Zeichen** (Punkt 1 oben), sobald es da ist.

Was ich NICHT tun wuerde: weitere Schirme bauen. Siebzehn tragen die
Geschichte; der achtzehnte macht sie nicht besser, sondern nur laenger.
