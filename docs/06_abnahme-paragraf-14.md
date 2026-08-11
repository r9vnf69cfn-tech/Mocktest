# Abnahme der Bedienung aus §14 — zweite Runde

Stand: 11. August. Zusammengelegt aus den Prüfberichten zur neuen Bedienung
(Aufgaben-Brett, Journal, Einstellungen, Filtern) und der Nachlese über die
Flächen, die in keinem Bericht vorkamen. Quellstand des Prototyps:
`c5dbb6c` („Die Abnahme der zweiten Runde — sechs Befunde repariert").

---

## 0 · Quellenlage, und was daran unklar ist

Angekündigt waren acht Prüfberichte. Vorgelegen haben **fünf**: vier
Prüfberichte (Aufgaben-Brett §14b/c · Journal §14d · Einstellungen §14i samt
Tafeln und Regler · Filtern §14e/j/t) und die Nachlese, die die Lücken
zwischen ihnen abgeht (Semester §14h · Lernkarten §14f · Notiz-Editor §14g ·
iPhone-Graph · Eingang · Lernsitzung · Treffprobe). Drei Berichte fehlen.
Welche Flächen sie abdecken, ist nicht rekonstruierbar. Der einzige Hinweis
auf ihren Inhalt: der bereits reparierte Befund `--rot` → `--danger` steht in
keinem der fünf vorliegenden Berichte, stammt also aus einem der drei
fehlenden. Die Abnahme ist damit **nicht vollständig**; sie deckt 18 Flächen
ab, aber nicht nachweisbar alle.

Zwei Berichte brechen mitten im Satz ab: der Filterbericht im Vorschlag zum
Graph-Tag-Befund, die Nachlese im Befund zum Notiz-Verlauf. Beide Befunde
sind unten aufgenommen, aber ihr Reparaturvorschlag ist unvollständig.

**Zwei Messstände.** Die Berichte zu Aufgaben-Brett, Journal und
Einstellungen wurden gegen die Fassung **vor** `c5dbb6c` gemessen — ihre
Zeilennummern in `prototyp.js` liegen ab Zeile 1914 um etwa 26 Zeilen unter
den heutigen. Der Filterbericht und die Nachlese wurden gegen die Fassung
**danach** gemessen; deren Zeilennummern stimmen. Sechs Befunde der ersten
drei Berichte sind inzwischen repariert (Abschnitt 2.0).

**Eigene Nachprüfung.** Ich habe die tragenden Belege gegen den Quelltext
nachgeschlagen, nicht nur übernommen. Bestätigt: `--on-ink` und `var(--c-1/2/3)`
kommen in `mockups/` null Mal vor (beide inzwischen ersetzt);
`class="deck"` und `card--deck` kommen in `mockups/prototyp/index.html` null
Mal vor, der Wähler in `deckSortieren` (prototyp.js:3826-3832) sucht also
nach etwas, das es nicht gibt; `.navitem` trägt weiterhin `height: 40px`
(system.css:450); `.pv-schalter` liegt weiterhin auf `background: var(--line)`
(prototyp.css:1120-1128); `seitenleisteBeleben` sucht weiterhin
`aside .navitem, .bl__liste .navitem` (prototyp.js:3968); `schichtFiltern`
trägt weiterhin `var an = c.classList.contains('chip--solid') || !c.classList.contains('is-off')`
(prototyp.js:4242); es gibt **keine** Regel `.pv-brett__stapel > .row.is-selected`;
`tafelZeigen` hat den Parameter `behalten` bereits (prototyp.js:3415), die
Reparatur von M16 ist also ein Argument, kein Umbau.

---

## 1 · Was geprüft ist

Achtzig Läufe insgesamt, plus 64 Treffproben und 34 Tab-Leisten-Läufe.
Spalten: Gerät × Modus × Schriftgröße. `h` = hell, `d` = dunkel,
`S` = Standard, `G` = „Aa groß".

Zeichen: **✓** geprüft, kein Befund · **Zahl/Kürzel** Befund-Nummer aus
Abschnitt 2 · **○** nicht gefahren · **–** trifft hier nicht zu ·
**(R…)** in dieser Kombination gefunden und inzwischen repariert.

| Fläche | iPad h/S | iPad h/G | iPad d/S | iPad d/G | iPh h/S | iPh h/G | iPh d/S | iPh d/G |
|---|---|---|---|---|---|---|---|---|
| Aufgaben-Brett §14c (5 Blicke) | M1 M2 M3 M5 K1 (R1) | **13** M1 M2 M3 M5 K1 (R1) | M1 M2 M3 M5 K1 (R1) | **13** M1 M2 M3 M5 K1 (R1) | M2 M3 M4 K12 (R2) | M2 M3 M4 K12 (R2) | M2 M3 M4 K12 (R2) | M2 M3 M4 K12 (R2) |
| Aufgaben-Detail §14c | K2 | K2 | K2 | K2 | K2 | K2 | K2 | K2 |
| Journal · Kalender §14d | M6 M7 K3 K5 | M6 M7 K3 K5 | M6 M7 K3 K5 (R3) | M6 M7 K3 K5 (R3) | M6 M7 K3 K5 | M6 M7 K3 K5 | M6 M7 K3 K5 (R3) | M6 M7 K3 K5 (R3) |
| Journal · Medien §14d | ✓ (R4) | ✓ (R4) | ✓ (R4) | ✓ (R4) | ✓ (R4) | ✓ (R4) | ✓ (R4) | ✓ (R4) |
| Journal · Karte §14d | **11** M8 M10 K4 | **11** M8 M10 K4 | **11** M8 M10 K4 | **11** M8 M10 K4 | **11** M8 M10 K4 | **11** M8 M9 M10 K4 | **11** M8 M10 K4 | **11** M8 M9 M10 K4 |
| Einstellungen · Tafeln §14i | **15** M11 M12 M13 M14 M15 M16 K6 | **14 15** M11 M13 M14 M15 M16 K6 | **15** M11 M12 M13 M14 M15 M16 K6 | **14 15** M11 M13 M14 M15 M16 K6 | **1** | **1** K8 | **1** | **1** K8 |
| Einstellungen · Regler | K7 (R6) | K7 (R6) | K7 (R6) | K7 (R6) | K7 (R6) | K7 (R6) | K7 (R6) | K7 (R6) |
| Notizen · Filter §14e | **9** | **9** | **9** | **9** | **4** | **4** | **4** | **4** |
| Suche · Schichten §14j | **2 3 8** | **2 3 8** | **2 3 8** | **2 3 8** | **2 3 8** | **2 3 8** | **2 3 8** | **2 3 8** |
| Graph · Filterreihen §14j | **5 6** | **5 6** | **5 6** | **5 6** | **5** | **5** | **5** | ○ |
| Graph · Knoten-Blatt (Fuß) | – | – | – | – | ✓ | **12** | ✓ | **12** |
| Semester · Ordnung §14h | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 | **10** M16 M17 K9 K10 |
| Lernkarten · Sortierung §14f | **7** | **7** | ○ | ○ | **7** (nur gezählt) | ○ | ○ | ○ |
| Notiz-Editor · Verlauf §14g | K11 | K11 | K11 | K11 | kein Umschalter | kein Umschalter | kein Umschalter | kein Umschalter |
| Eingang · Schnipsel-Stapel | M18 | M18 | ○ | ○ | ✓ | M18 | ○ | ○ |
| Lernsitzung · Blatt | ○ | ○ | ○ | ○ | M19 | M19 | ○ | ○ |
| Treffprobe (16 Schirme, elementFromPoint) | 27 geklaute Mitten | 27 geklaute Mitten | modusunabhängig | modusunabhängig | 27 geklaute Mitten | 27 geklaute Mitten | modusunabhängig | modusunabhängig |
| Tab-Leisten-Sweep (17 Schirme) | – | – | – | – | ✓ | **12** | ✓ | **12** |

**Was diese Tabelle nicht zeigt:** Prüfer 4 weist `graph iphone dunkel+groß`
selbst als nicht gefahren aus. Die Nachlese hat diese Kombination gefahren,
aber nur für den Fuß des Knoten-Blatts (Befund 12), nicht für die
Filterreihen. Für Lernkarten wurde der dunkle Modus nie angesehen, für
Eingang und Lernsitzung ebenfalls nicht. Die Treffprobe ist
modusunabhängig (Geometrie), darum stehen die dunklen Spalten dort nicht auf ○.

---

## 2 · Die Befunde

Dubletten sind zusammengelegt: wo zwei Prüfer dieselbe Ursache gefunden
haben, steht ein Befund mit beiden Belegen (M16).

### 2.0 · Bereits repariert (in `c5dbb6c`, nicht nachgemessen)

| # | Befund | Beleg | Reparatur |
|---|---|---|---|
| R1 | Der Rückweg auf „Liste" zerstörte das zweispaltige Aufgaben-Layout für immer | `display` sprang von `grid` auf `block`, die rechte Schiene von x=1191/y=408 nach x=597/y=1123 — bei einem Geräterahmen, der bei y=1043 endet; der Listenwirt wuchs von 771 auf 1327 px | `verbergen()` merkt sich den Inline-Wert in `__pvAnzeige` (prototyp.js:1930 ff.) |
| R2 | Das iPhone rollte im Brett 58 pt waagerecht | `.scroll` scrollWidth 451 gegen clientWidth 393, in allen vier Blicken und vier Kombinationen; in der Liste 393/393 | `.pv-brett__stapel > .row { transform: none !important }` (prototyp.css:991) — **Rest siehe K12** |
| R3 | Ziffer im gefüllten Kalendertag war im Dunkeln weiß auf weiß | Füllung rgb(242,243,245), Glyphe rgb(255,255,255) = **1,11:1** gegen geforderte 4,5:1 | `var(--on-ink, #fff)` → `var(--accent-on)` (prototyp.css:1029) |
| R4 | Drei tote Marken-Verweise kehrten die Rangfolge der Schrift um | `--c-1/2/3` sind Klassen, keine Custom Properties; die Deklaration fiel ungültig auf `--ink-1` zurück, die Bildunterschriften standen lauter als ihre Überschrift | `var(--ink-1/2/3)` |
| R5 | `--rot` existiert nicht | Semantikfarbe heißt `--danger` und geht im Dunkeln mit (#D02B20 → #FF6B5E) | `var(--danger)` — Herkunft: einer der drei fehlenden Berichte |
| R6 | Die Schriftgrößen-Leiter las sich klein → kleiner → Standard | an fünf Stellen angetippt, auf beiden Geräten: 0 % „Klein", 25 % „Kleiner", 50 % „Standard" | `['Sehr klein','Klein','Standard','Groß','Sehr groß']` |

### 2.1 · Schwer — Bedienung, die nichts tut

**1 · Auf dem iPhone gibt es die neue Einstellungs-Bedienung überhaupt nicht.**
Ort: `prototyp.js:3968`, Wähler `'aside .navitem, .bl__liste .navitem'`.
Beleg: in allen vier iPhone-Läufen gezählt `aside` = 0, `.navitem` = 0,
`.pv-einst` = 0, `.pv-schalter` = 0, `.pv-tafel` = 0. Von den elf
Chevron-Zeilen (Synchronisierung … Rechtliches) trägt keine `.pv-lebt`; ein
echter Mausklick lässt das DOM unverändert. Lebendig sind auf dem ganzen
Schirm 11 Elemente, davon 5 Tabs und 3 Modusknöpfe.
Zu tun: entweder einen iPhone-Zweig ergänzen, der die `.row`-Zeilen mit
`[data-ico=chevR]` auf `einstellungenTafel` legt, oder die Chevrons entfernen.
Beim ersten Weg gehört die Tafel als **eigener Schirm auf den Stapel** — im
einen Seiten-Scroll des iPhones würde `tafelZeigen` sonst alle zwölf Kinder
verbergen, darunter das rote Fehlerband „Synchronisierung fehlgeschlagen"
samt Knopf „Erneut".

**2 · Die Schichtreihe der Suche filtert für jeden Chip dasselbe.**
Ort: `prototyp.js:4242`, `var an = c.classList.contains('chip--solid') || !c.classList.contains('is-off')`.
Beleg: iPad hell/Standard, nacheinander Notizen → Canvas → Journal →
Lernkarten → Aufgaben gedrückt — jedes Mal exakt dieselben drei Karten,
jedes Mal 3 versteckt. Auf dem iPhone lässt jeder der drei Chips dieselbe
eine Karte stehen. Ursache: in der Ausschließlich-Auswahl bekommt der
gedrückte Chip `.chip--solid`, die übrigen aber kein `.is-off` — Zeile 4242
zählt sie darum alle als „an", `gewaehlt` ist immer
`[notizen, canvas, journal, lernkarten]`.
Zu tun: Auswahllogik nach Modus trennen — im Ausschließlich-Modus nur
`.chip--solid` sammeln, im Einzeln-Modus wie bisher; am saubersten übergibt
`chipreiheBeleben` den Modus an `schichtFiltern`.

**3 · Der Chip „Notizen" trifft keine einzige Notiz.**
Ort: `prototyp.js:4254`, `t.indexOf(g.replace(/n$/, ''))`.
Beleg: die Wortstamm-Bildung schneidet nur das End-n ab und macht aus
„notizen" den Stamm „notize" — die Fundstellen tragen „Notiz · Absatz 9"
und „Notiz · 30. Oktober", „notize" kommt darin nicht vor. Zum Vergleich
greifen „canvas" → „canva" und „journal" → „journal" sehr wohl. Sichtbare
Folge: unter dem Notizen-Filter steht auf dem iPhone genau eine Karte, und
die ist ein Canvas-Blatt.
Zu tun: statt des selbstgebauten Stamms ein Wörterbuch mit fünf Zeilen
(`notizen`→`notiz`, `lernkarten`→`lernkarte`, `aufgaben`→`aufgabe`,
`canvas`→`canvas`, `journal`→`journal`). Eine Regel, die bei einem von fünf
Wörtern danebengreift, ist keine.

**4 · Auf dem iPhone ist die ganze Filterreihe der Notizen tot.**
Ort: `prototyp.js:5228`, die Tag-Wache
`if (chips.filter(c => /^#/.test(textVon(c))).length > chips.length / 2) return;`.
Beleg: die Reihe hat 7 Chips, davon 4 mit Raute — 4 > 3,5, also kehrt die
Funktion um, obwohl der erste Chip „Alle" heißt und `.chip--solid` trägt.
Gemessen: kein Chip trägt `.pv-lebt`, alle `cursor: default`, kein `role`,
kein `tabindex`, `pointer-events: none` vom Elternknoten geerbt. Echter
Mausklick auf „#uni/bio": sichtbare Zeilen vorher 5, nachher 5;
`elementFromPoint` in der Chipmitte liefert `DIV.scroll`.
Zu tun: die Tag-Wache erst laufen lassen, wenn **kein** Chip auf „Alle"
lautet. Achtung: danach sind die Tag-Chips belebt, aber immer noch
wirkungslos — `notizenFilter` kennt „alle/angeheftet/mit aufgaben/mit
karten", aber keine Tags. Der Textsuch-Zweig aus `notizenSammlung` muss mit,
sonst tauscht man einen toten Knopf gegen einen lügenden.

**5 · Die Modulreihe im Graphen filtert nichts.**
Ort: `prototyp.js:4198` (Aufruf) und `4249`, `if (!stellen.length) return;`.
Beleg: in allen sechs gefahrenen Kombinationen ist die Klassenliste aller
23 (iPad) bzw. 10 (iPhone) `.gn`-Knoten vor und nach dem Klick zeichengenau
identisch. Ursache: `schichtFiltern` sucht `.scroll section.card`; der Graph
hat keine, also kehrt die Funktion sofort um. Der Chip verspricht in seinem
eigenen Wirkt-Text „schaltet ‚Notizen' zu".
Zu tun: für den Graphen einen eigenen Zweig — die Knoten tragen
`.dot--notes/.dot--cards/.dot--tasks/.dot--journal/.dot--canvas`; eine
`graphSchichtFiltern` gibt jedem Knoten `.pv-fern`, dessen Modulpunkt nicht
in der Auswahl steht.

**6 · Zwei der vier Tag-Chips im Graphen heben null Knoten hervor.**
Ort: `prototyp.js:4272`, `textVon(k).indexOf(tag.replace(/^#/,'').split('/').pop().toLowerCase())`.
Beleg: je frisch geladen gemessen — `#prüfung` 0 von 23, `#uni/mathe` 0 von
23, `#uni/bio` 2 von 23, `#labor` 3 von 23. Der ganze Graph tritt auf 28 %
zurück, und nichts bleibt vorne; der Schirm sagt dabei „die anderen Knoten
treten zurück". Ursache: gesucht wird der letzte Pfadteil des Tags im
**Titel** des Knotens, aber kein Knoten heißt „Prüfung" oder „Mathe" — der
Tag hängt an den Notizen, nicht am Knotennamen.
Zu tun: den Knoten ihre Tags ins Markup schreiben (`data-pv-tags`, aus dem
Bestand, nicht erfunden) und in `graphHervorheben` dagegen prüfen. Solange
das nicht geht, darf der Chip nicht so tun, als hätte er etwas gefunden.
*(Der Reparaturvorschlag des Prüfers bricht hier im Satz ab.)*

**7 · Die Sortierung der Lernkarten tut nichts.**
Ort: `prototyp.js:3824-3849`, Wähler auf `.deck` / `.card--deck`, Rückfall
auf `'.scroll .row'`.
Beleg: `class="deck"` und `card--deck` kommen in `index.html` **null Mal**
vor (selbst nachgezählt; die acht „deck"-Fundstellen sind „bedeckt",
„verdeckt" und zwei Zeilen-ids). Auf dem Schirm gemessen: `.deck` 0,
`.card--deck` 0, `.scroll .row` 0 — die vier Decks sind
`<section class="card">`. Beide Zweige fallen durch, die Ansage lautet
„A–Z — die Auswahl steht.", und die Reihenfolge der sieben Karten ist vor
und nach dem Klick zeichengleich, in Standard wie in groß.
Zu tun: den Wähler ans Markup binden (`.scroll section.card` mit einem
Deck-Merkmal) oder den vier Karten die Klasse `deck` geben. Zusatz: auch
wenn der Wähler träfe, wäre „Fällig zuerst" nur die Wiederherstellung der
Ausgangsreihenfolge über `__pvRang` und **nicht** nach Frist sortiert — die
Zahl vor „heute fällig" steht in jeder Karte.

### 2.2 · Schwer — Bedienung, die Falsches behauptet

**8 · Der Zählstand der Suche zählt etwas anderes, als der Schirm sagt, und kommt nie zurück.**
Ort: `prototyp.js:4258-4264`.
Beleg: iPad dunkel/groß — Chip „Alle 3", direkt darunter die Zeile „12
Fundstellen in vier Schichten", sichtbar 3 Karten mit zusammen 5
Trefferzeilen. Drei verschiedene Zahlen nebeneinander auf einem Schirm.
Nach einem Klick auf „Alle" steht dort „Alle 6", nicht 12; auf dem iPhone
„Alle 4". Gezählt werden `.scroll section.card`, gemeint sind Trefferzeilen.
Zusätzlich zählt die Reihe ZULETZT GESUCHT mit: ein Klick auf „Mitose"
macht aus „Alle 12" ein „Alle 5", während 6 Karten stehen bleiben.
Zu tun: über die Trefferzeilen zählen, den Ausgangswert beim ersten Lauf
sichern und beim Klick auf „Alle" wieder einsetzen — und `schichtFiltern`
nur für Reihen aufrufen, die Schichtreihen sind (`data-pv-filter` am
Elternknoten); die Reihe ZULETZT GESUCHT hat in `chipreiheBeleben` nichts
verloren.

**9 · Seitenleiste und Kopfreihe der Notizen behaupten gleichzeitig zwei verschiedene Dinge.**
Ort: `prototyp.js:3773` (`notizenFilter`) und `4005` (`notizenSammlung`) —
keine der beiden setzt die andere Auswahl zurück.
Beleg: iPad dunkel/groß — links „Papierkorb" aktiv, Liste leer,
Leervermerk steht, oben trotzdem „Alle" hell. Danach oben „Mit Karten":
Segment springt um, links bleibt „Papierkorb 3" aktiv, und in der Liste
steht wieder „Zellbiologie — Vorlesung 9" unter der Überschrift ANGEHEFTET.
Der Schirm sagt zugleich „Papierkorb", „Mit Karten" und zeigt eine
angeheftete Notiz. Umgekehrt genauso.
Zu tun: entweder beide Filter als zwei Bedingungen auf dieselbe Zeilenmenge
rechnen und beide Marken stehen lassen — oder, billiger und ehrlicher, jede
der beiden Funktionen setzt die andere Marke am Ende zurück.

**10 · Die Semester-Ordnung „Herkunft" ordnet nach einem Merkmal, das in den Zeilen nicht steht.**
Ort: `prototyp.js:3938-3942`, der else-Zweig in `semesterOrdnen`:
`z.querySelector('.dot--canvas') ? … : 'Direkt geschrieben'`.
Beleg: die Herkunftsmarke sitzt in der **Rinne neben** der Zeile, nicht in
ihr. iPad: die zehn Zeilen tragen in ihren Rinnen journal, tasks, canvas,
notes, notes, journal, cards, tasks, notes, hollow — „Herkunft" macht
daraus 9 × „Direkt geschrieben" und 1 × „Aus Lernkarten" (das Deck ist die
einzige Zeile mit einem `.dot` innen). iPhone: 7 Marken, Ergebnis 1 Gruppe
mit allen 7 Zeilen, Ansage wörtlich „Herkunft — 1 Gruppen, dieselben 7
Sachen." Unter der einen Überschrift DIREKT GESCHRIEBEN steht ein
Journaleintrag, der zwei Zeilen tiefer selbst „Journaleintrag · 7. Nov" sagt.
In allen acht Kombinationen gleich.
Zu tun: die Marke dort holen, wo sie steht (rückwärts durch die Geschwister
bis zur `.sem__rinne`), besser noch die Herkunft beim Bau als
`data-herkunft` an die Zeile selbst schreiben — dann geht sie beim Umhängen
nicht verloren. Bis dahin gilt: eine Ordnung, die genau eine Gruppe
erzeugt, darf sich nicht Ordnung nennen.

**11 · Die Journal-Karte erfindet in jedem Lauf zwei Orte und behauptet, sie stünden in den Einträgen.**
Ort: `prototyp.js:3732` (Rückfall `orte = ['Universität','Labor 3.14']`),
`3720` (Fußsatz), `3732` (Zeilentext).
Beleg: ausgezählt über alle Einträge — iPad 3 Einträge, iPhone 2 Einträge,
Trefferzählung für die sechs gesuchten Ortsnamen = **0 auf beiden Geräten**.
Also feuert immer der Rückfall. Der iPhone-Eintrag sagt wörtlich „Heute ·
8:05 · Labor 2" — die Karte schreibt „Labor 3.14". Der Fußsatz lautet „Orte
aus den Einträgen dieses Monats", jede Listenzeile „im Journal genannt".
Beides ist unwahr, und es widerspricht dem Kommentar derselben Sektion:
„ein Raster mit grauen Kacheln wäre eine Behauptung".
Zu tun: den Rückfall streichen. Wenn `orte` leer ist, denselben Leerzustand
setzen, den das Medien-Raster vormacht („In diesen Einträgen steht kein
Ort."), und kein Feld zeichnen. Siehe auch M10 — der Prüfer hält das ganze
Kartenfeld für verzichtbar, und die Messungen tragen das.

### 2.3 · Schwer — Darstellung, die bricht

**12 · Bei „Aa groß" legt sich der Fuß des Graph-Knotenblatts über die Tab-Leiste; ein Tipp auf „Heute" öffnet die Notiz.**
Ort: `index.html:8686` (`height:252px`, `z-index:40`) und der Knopfstreifen
`index.html:8714-8716` mit dem 44-pt-Feld aus `system.css §5.9`.
Beleg: das Blatt steht in beiden Schriftgrößen bei y 717–969, sein Inhalt
braucht bei groß 279 px (scrollHeight 279 / clientHeight 252) und tritt
unten 27 px aus. Der Knopfstreifen liegt dadurch bei y 957–991, die
Tab-Leiste beginnt bei 969 — **22 px Überlappung**; das unsichtbare
44-pt-Feld reicht bis y 996 über die Zellmitte bei y 993.
`elementFromPoint` auf die Mitten: „Heute" ← „Öffnen", „Bibliothek" ←
„Öffnen", „Lernen" ← „Nur Cluster", „Mehr" ← „Nur Cluster". Das größte
mittige Rechteck der vier Zellen fällt von 47 px auf 1 px. Echter Mausklick
auf (1163, 994): `{schirm:graph}` → `{schirm:notiz}` bei groß gegen
`{schirm:heute}` bei Standard, in hell und dunkel gleich. Im Sweep über 17
Schirme × 2 Schriftgrößen ist das der einzige Treffer.
Zu tun: `height:252px` durch `height:auto; max-height:calc(100% - 24px)`
ersetzen und dem inneren Block `overflow-y:auto` geben — dann wächst das
Blatt nach oben. Unabhängig davon der `.tabbar` eine eigene Schicht geben
(`position:relative; z-index:60`), damit die Navigation grundsätzlich
nichts über sich duldet.

**13 · Bei „Aa groß" malen die Zetteltitel im Brett über die Kartenkante bis in die Nachbarspalte.**
Ort: `prototyp.css:985`, `.pv-brett__stapel > .row .row__title { white-space: normal; }`.
Beleg: mit `Range.getClientRects` gegen die Kartenkante gemessen, iPad hell
groß, Planer — „Laborprotokoll Zellkultur schreiben" Textkante 818,9 gegen
Kartenkante 783 (**35,9 px darüber**), Spaltenkante 793 (25,9 px darüber),
Nachbarspalte MORGEN beginnt bei 807 (**11,9 px hinein**). „Karteikarten
Anatomie nacharbeiten" 1432,2 gegen 1413 = 19,2 px. „Rückmeldung an Prof.
Wendt" 5,9 px. Schon bei Standard 3,4 px. `.row__main` und `.row__title`
stehen auf `overflow:visible`, scrollWidth 171 gegen clientWidth 125.
Zu tun: `overflow-wrap: anywhere; hyphens: auto` ergänzen und
`.pv-brett__stapel > .row > .row__main { min-width:0; overflow:hidden }`
setzen. Der Zettel darf umbrechen, aber nicht auslaufen. K1 (breitere
Spalten) entschärft dasselbe nebenbei.

**14 · Bei „Aa groß" bricht die Bereichsliste der Einstellungen — also die Tür zu allen elf neuen Tafeln.**
Ort: `system.css:450`, `.navitem { height: 40px }`; Liste `.bl__liste`
unter `[data-pv-screen="einstellungen"]`, `index.html:247`.
Beleg: der Textkasten wird bei groß 56 px hoch und ragt oben und unten je
8 px heraus. „Export & Backup" 394→450 gegen „Datenschutz" 448→476: 2 px
Überlappung; dasselbe bei drei weiteren Paaren. Waagerecht:
„Synchronisierung" scrollWidth 252 gegen clientWidth 211 (41 px zu breit),
ihr rotes Warnzeichen liegt bei x 820..837, die Spalte endet bei 796 — das
Zeichen steht vollständig außerhalb. „Benachrichtigungen" 251/211. Auch bei
Standardschrift schon 218/211 bzw. 212/211, dort ist das Warnzeichen etwa
zur Hälfte abgeschnitten.
Zu tun: `height:40px` → `min-height:44px; height:auto; padding:6px 10px`
(löst zugleich Regel 8), der Liste `min-width:0`, den Beschriftungen
`overflow-wrap:anywhere`. Die 236-px-Spalte reicht bei „Aa groß" für
„Synchronisierung" plus Warnzeichen nicht — entweder auf ~280 px
verbreitern oder das Zeichen unter den Text setzen.

**15 · Im Dunkeln ist der AUS-Schalter unsichtbar: Knauf und Kartengrund sind dieselbe Farbe.**
Ort: `prototyp.css:1120-1146`, `.pv-schalter` und `.pv-schalter::after`.
Beleg: aus gerenderten Pixeln — Knauf rgb(23,25,28), Kartengrund
rgb(23,25,28) = **1,00:1**. Bahn rgb(49,51,54) = 1,39:1 gegen die Karte,
1,43:1 gegen den Knauf. Der hellste Punkt des ganzen Bedienelements hält
1,35:1; gefordert sind 3:1. Hell ist es ebenfalls unter der Schwelle (Bahn
1,24:1), dort rettet der fest verdrahtete schwarze Schlagschatten wenigstens
eine Kante (dunkelster Schattenpixel 1,53:1) — im Dunkeln geht er nicht mit.
Damit fällt auch das zweite Merkmal aus, das der CSS-Kommentar behauptet
(„Zwei Merkmale: Position UND Farbe"): die Knaufstellung ist im
AUS-Zustand nicht ablesbar.
Zu tun: den fest verdrahteten `box-shadow` durch eine Marke ersetzen und
dem Knauf einen eigenen Rand geben, der in beiden Modi 3:1 hält
(`inset 0 0 0 1px var(--ink-ui)`); die Bahn von `var(--line)` auf
`var(--fill-3)` plus denselben Rand heben, damit überhaupt erkennbar
bleibt, **dass** dort ein Bedienelement sitzt.

### 2.4 · Mittel

| # | Ort | Was falsch ist | Beleg | Zu tun |
|---|---|---|---|---|
| M1 | prototyp.css:1210 | Die Chips im Brett kürzen sich nicht, sie werden mitten im Buchstaben abgeschnitten — `text-overflow` wirkt auf einem Flex-Kasten nicht | „wenn das Deck fällig ist" scrollWidth 227 gegen clientWidth 125 (102 px weg); „1 von 2 Schritten" 169/125; „Geplant 14:00" 142/125. Im Bild steht „Geplant 14:0◖", kein Auslassungszeichen | Chip auf Blockverhalten zwingen oder das Textkind kürzen (`min-width:0` am Chip, `text-overflow` auf `:not(.ico):not(.dot)`) |
| M2 | prototyp.css:957-967 gegen system.css:547 | Die Auswahl verliert im Brett zwei ihrer drei Merkmale; übrig bleibt nur das Gewicht | Liste ausgewählt: background rgba(22,24,28,0.07), Ring inset 1,5px rgba(22,24,28,0.3), Gewicht 600. Brett ausgewählt: background rgb(255,255,255), Ring rgba(22,24,28,0.1) — **byteweise identisch mit unausgewählt**. Spezifität (0,2,1) gegen (0,2,0). Zwei Zeilen sind ausgewählt, die Auswahlleiste wird mit der Liste verborgen. Selbst nachgezählt: eine Regel `.pv-brett__stapel > .row.is-selected` existiert nicht | Auswahlzustand in §9 nachziehen (`--accent-soft` + `--accent-ring`) oder die Auswahl beim Umhängen auflösen. Stehen lassen und unsichtbar machen ist die einzige Fassung, die nicht geht |
| M3 | prototyp.js:3514-3516 | Die einzige sichtbar abgehakte Aufgabe steht im Board unter „OFFEN", während „ERLEDIGT" „nichts" meldet | „Übungsblatt 5 fertig rechnen" trägt `class="check is-checking"` mit backgroundColor rgb(22,24,28) — volle Ink-Scheibe mit Haken. In allen acht Läufen: OFFEN 5, IN ARBEIT 1, ERLEDIGT 0. In der Matrix landet sie unter „Wichtig · nicht dringend" | `.check.is-checking` und `.bw-check.is-checking` in den Wähler aufnehmen — nach der Things-Mechanik ist das bereits erledigt, nur noch nicht ausgeglitten |
| M4 | prototyp.js:3518-3522 | Auf dem iPhone sortiert derselbe Blick dieselben sechs Aufgaben anders als auf dem iPad | iPhone Planer: HEUTE = 0, „nichts"; OHNE TERMIN = 5. iPad dieselbe Ansicht: HEUTE = 2, OHNE TERMIN = 3. Zwei Ursachen: (a) im iPhone-Text fehlt zwischen „16:00" und „noch" das Leerzeichen, also greift `\b` nicht; (b) die Zeile „Laborprotokoll" trägt auf dem iPhone gar keinen Zeit-Chip | `\b` aus der Regex nehmen und den Text an Elementgrenzen mit `' '` verbinden statt `textContent`; für (b) gehört derselbe Zeit-Chip ins iPhone-Markup, sonst bleiben die Geräte auch nach dem Regex-Fix uneins |
| M5 | prototyp.js:3608-3613 (Rest-Auffang) | Die Kopfzahl stimmt nicht mit den Zetteln, sobald eine Aufgabe erledigt ist | Nach dem Setzen von `.is-done` gemessen — Kalender OHNE TAG: Kopf „2", 3 Zettel; Planer OHNE TERMIN: Kopf „2", 3 Zettel. Ohne erledigte Aufgabe stimmt alles (Planer 2+1+0+3, Matrix 1+2+1+2, Board 5+1+0, Kalender 2+1+0+3 — je 6) | Die Zahl erst **nach** dem Anhängen des Rests schreiben. Sauberer: den Auffang benennen — „Ohne Tag" ist keine Heimat für eine erledigte Aufgabe |
| M6 | prototyp.css:1033-1034 | „heute" im Kalender hängt an einem einzigen Merkmal, und das ist zu schwach | `font-weight:600` auf `.pv-kal__tag` ist folgenlos, weil die Ziffer in `.num` sitzt und `.t-label` bereits `600` schreibt — gemessene fontWeight voll/heute/leer: 600/600/600 in allen 8 Läufen. Bleibt der Ring: hell **1,12:1**, dunkel **1,09:1** gegen geforderte 3:1. In der Graustufenprobe ist der 13. vom 10. nur an einer Haarlinie zu unterscheiden | Den Fettschnitt dorthin schreiben, wo er wirkt (`.is-heute .num { font-weight:700 }`), und den Trennring nach außen legen: `0 0 0 2px var(--paper), 0 0 0 4px var(--ink-ui)` |
| M7 | prototyp.css:1025 | Der Ring der leeren Kalendertage steht auf `--line`; ein Bedienelement ohne eigene Fläche braucht `--line-tap` | Ring gegen Grund: hell **1,24:1**, dunkel **1,35:1**, gefordert 3:1. Die leeren Tage sind Knöpfe — aria-label „1. November — noch kein Eintrag", Klickmeldung „an diesem Tag steht nichts" (mit echtem Mausklick geprüft). `system.css:158-167` legt genau diesen Fall fest und nennt `--line` ausdrücklich als zu schwach | `var(--line)` → `var(--line-tap)` |
| M8 | prototyp.css:1081-1092 | Die Ortsmarken auf dem Kartenfeld sind zu flach zum Antippen | Kastenhöhe **24,0 pt** bei Standard, **28,0 pt** bei groß, in allen 8 Läufen (Breite 105–127 pt). Regel 8 verlangt 44 × 44. Die Listenzeilen darunter sind mit 54/63 pt in Ordnung | `min-height: var(--tap)` und Polster anpassen, oder ein unsichtbares Trefferfeld über `::before { inset:-10px }` |
| M9 | prototyp.css:1081-1092, Stellen-Tabelle prototyp.js:3729 | Bei „Aa groß" überlappen sich die beiden Ortsmarken auf dem iPhone | Überschneidung **12,1 × 11,9 pt** („Universität" @26/34 %, Kasten 127×28 bei x=702,3; „Labor 3.14" @58/22 %, Kasten 123,2×28 bei x=817,1). Bei Standard berühren sie sich knapp nicht. Das Feld ist auf dem iPhone nur 353 × 134,5 pt, die Prozentstellen sind fest verdrahtet | Auf schmalem Feld das Kartenfeld ganz weglassen und nur die Liste zeigen — siehe M10 |
| M10 | prototyp.css:1063-1092 | Das Kartenfeld sieht nach Fehler aus, nicht nach Absicht; der Prüfer würde es weglassen und nur die Liste behalten | Drei Messungen: (1) die Marken sitzen auf fest verdrahteten Prozentstellen ohne Bezug zu einer Geografie — zwei Orte im selben Gebäude stehen 32 % der Feldbreite auseinander; (2) das Feld ist auf dem iPad 700 × 266,7 pt und trägt zwei Marken, beide im linken oberen Drittel, rund vier Fünftel sind leeres 44-pt-Karo (Gitterkontrast **1,22:1** hell / **1,38:1** dunkel — reine Textur); (3) die Liste darunter enthält bereits die vollständige Information | Den Blick auf die Liste reduzieren und den Umschalter-Knopf „Orte" statt „Karte" nennen. Ein Kartenfeld erst wieder, wenn die Einträge echte Koordinaten oder wenigstens echte Ortsnamen tragen |
| M11 | prototyp.css:1120-1128, Aufruf prototyp.js:4146 | Die Trefferfläche ist nur der Schalter selbst, 46 × 28 px — die Zeile ist nicht antippbar | Echte Mausklicks: Schaltermitte kippt an→aus→an (aria-checked folgt). Klick 8 px darüber bei y=423 — die Zeile geht von 414 bis 475, der Schalter nur 431 bis 459 — bewirkt nichts; Klick auf den Zeilentitel bewirkt nichts. 28 pt liegen 16 pt unter der Regel | Nicht den Schalter vergrößern (46 × 28 ist die richtige Zeichnung), sondern die ganze Zeile beleben und den Klick durchreichen. Die Zeile ist mit 61/70 px hoch genug |
| M12 | index.html:247, system.css:458 | Die aktive Bereichsauswahl zeigt sich nur über ein Merkmal, und das hält 1,15:1 | Der Ink-Balken liegt bei `left:-12px` (x 573..576); gemessen stehen dort 255,255,255 hell bzw. 23,23,23 dunkel — kein Ink-Pixel. Grund: `.bl__liste` beginnt bei x=585 und trägt `overflow-y:auto`, was `overflow-x` auf auto zwingt. Zweitens meldet der aktive `.t-body` fontWeight **400** — `.navitem.is-active { font-weight:600 }` wird von der Kurzschrift `.t-body { font: 400 17px/23px }` im Kind überschrieben. Übrig bleibt die Fläche: **1,15:1** hell, **1,30:1** dunkel gegen geforderte 3:1 | Der Liste `padding-left:12px` und den `.navitem` `margin-left:-12px` geben, dann liegt der Balken im Scroll-Kasten; und `.navitem.is-active .t-body { font-weight:600 }` ergänzen |
| M13 | prototyp.js:4147-4155 | Beim Umschalten bleibt die Unterzeile stehen, sodass Schalter und Text sich widersprechen | „Analyse senden" nach dem Einschalten `is-an=true`, `aria-checked=true`, Unterzeile unverändert „Aus. Nichts verlässt das Gerät." Ebenso „Journal-Erinnerung" an / „Aus" und „Handballenerkennung" aus / „An". Beim Datenschutz ist das ein Versprechen, das nicht gilt | Den Zeilendaten ein viertes Feld mit dem Gegentext geben und im tun-Rumpf `.pv-einst__dazu` mitsetzen; wo kein Gegentext sinnvoll ist, beim Ausschalten „Aus" |
| M14 | prototyp.js:3972, Ausweichzweig 4127-4129 | „Abo" öffnet keine Tafel, sondern den Ausweichzustand; die Kopfzeile heißt „AboUni" | Gemessen: Tafelname „AboUni", Kopf „AboUni", eine Zeile „AboUni / In diesem Entwurf nicht ausgezeichnet". Ursache: `textVon(k).replace(/\s*\d+\s*$/,'')` streift nur Ziffern ab, das Abzeichen trägt aber das Wort „Uni". Ein vollständiger 'Abo'-Eintrag mit drei Zeilen (Velum Uni, Geräte, Bildungsrabatt) steht bereit und wird nie benutzt. Bei „Speicher 4,2 GB" geht es gut, weil dort Ziffern stehen | Den Namen aus dem `.t-body` des Eintrags bilden statt aus dem Gesamttext — dann fällt jedes Abzeichen weg, egal ob Zahl oder Wort |
| M15 | prototyp.js:4139-4140 | Die Zeilen ohne Schalter tragen einen Chevron, der Navigation verspricht, und tun beim Antippen nichts | Echter Mausklick auf den Chevron von „Datenschutzerklärung": `document.body.innerHTML.length` vor und nach dem Klick identisch bei 980728, Kopf unverändert. Betroffen sind **16 Zeilen** in sieben Tafeln. Der Chevron ist 15 × 15 px und liegt in keinem lebenden Vorfahren | Den Chevron nur setzen, wenn ein Weg existiert, oder die Zeile auf einen Hinweisstreifen legen. Der Prototyp erklärt in seiner eigenen Kopfzeile „was keinen Weg hat, zeigt auch keinen Klickfinger" — ein Chevron ist derselbe Versprechenstyp |
| **M16** | prototyp.js:3415 (`tafelZeigen`, Parameter `behalten` vorhanden), Aufrufe 4162 und 3917 | **Zwei Prüfer, eine Ursache:** jede geöffnete Tafel verdeckt die Geschwister ihres Wirts — auch das, was man gerade braucht | **Beleg 1 (Einstellungen):** beim Öffnen jeder Tafel bekommen alle 4 Kinder des Wirts `hidden=true`, darunter das rote Band „Letzte Synchronisierung fehlgeschlagen" samt Knopf „Erneut versuchen" — auch bei der Tafel „Synchronisierung" selbst, der einzigen Stelle, an der die Störung zu reparieren wäre. **Beleg 2 (Semester):** der Wirt trägt ein Raster 566px/244px; die rechte Spalte sagt wörtlich „In drei Notizbüchern: Zellbiologie · Laborjournal · Genetik" und wird beim Öffnen mitverborgen (hidden, Breite 0). Wer nach Notizbuch ordnet, verliert im selben Moment die einzige Stelle, die die Notizbücher nennt | Das jeweils gebrauchte Geschwister als `behalten` übergeben. Der Parameter existiert bereits (selbst nachgeschlagen), es ist ein Argument, kein Umbau |
| M17 | prototyp.js:3929-3937 | „Modul" rät das Notizbuch aus dem Zeilentext; die dritte Gruppe „Genetik" erscheint nie | Die Regel lautet `/Labor\|Praktikum\|Schutzbrille\|Protokoll/` → Laborjournal, `/Genetik\|Vererbung\|DNA/` → Genetik, sonst Zellbiologie. Gemessen: iPad 2 Gruppen (4 Laborjournal, 6 Zellbiologie), iPhone 2 Gruppen (2/5). „Genetik" trifft in acht von acht Läufen auf keine Zeile, obwohl der Kommentar die drei Namen als gegeben behandelt. „Zellkultur-Skizze (Canvas-Blatt)" landet als Restfall in Zellbiologie | Die Zugehörigkeit als `data-buch` an die Zeile schreiben statt sie aus Wörtern zu erraten — dann stimmt „Genetik", oder die Gruppe entfällt begründet |
| M18 | index.html, `.ei-schnipsel`-Stapel des Eingangs | Bei „Aa groß" wächst der Kartenstapel, die Staffelung nicht: die nächste Karte legt sich über die Handlungs-Chips der darüberliegenden | iPad Standard: Karten 397–549, 445–651, 561–751, 773–817; der Chip „Notiz" (511–537) bleibt oben, `elementFromPoint` liefert den Chip, ein echter Klick lässt den Schirm stehen. Bei groß: Karten 437–627, 485–704, 601–813, 813–857; der Chip liegt bei 589–615 und damit unter der dritten Karte (ab 601). Echter Mausklick auf die Chipmitte: `{schirm:eingang}` → `{schirm:notiz}`. Betroffen: 3 Chips auf dem iPad, 2 auf dem iPhone | Die Staffelung aus der Zeilenhöhe rechnen (`top` in em statt px). Prüfmaß: der Abstand zweier Kartenoberkanten muss größer sein als die Höhe der oberen Karte bis unter ihre Chipreihe |
| M19 | index.html, Lernsitzungs-Blatt | Dem Verweis „Zur Stelle" wird die Mitte genommen — bei „Aa groß" landet der Tipp auf dem Canvas | Kasten 44 px hoch (Standard y 576–620, groß y 656–700). `elementFromPoint` auf die Mitte: Standard → „Antwort zeigen" (dessen 44-pt-Feld über den Nachbarn reicht), groß → „Canvas · Mitrechnen". Echter Mausklick bei groß: `{schirm:lernsitzung, tiefe:1}` → `{schirm:canvas, tiefe:2}` | Die Reihenfolge im Markup umdrehen (das spätere Element gewinnt das Feld) oder beide auf 44 pt Abstand bringen. Genau dieser Fall ist in `system.css §5.9` als Kosten der Regel dokumentiert — die dortige Liste ist seit der neuen Bedienung nicht nachgerechnet |

### 2.5 · Klein

| # | Ort | Was falsch ist | Beleg |
|---|---|---|---|
| K1 | prototyp.css:923-929 | Das Board hat drei Spalten in einem Vier-Spalten-Raster; rechts bleibt ein leeres Viertel, das nach einer fehlenden Spalte aussieht | Brett 597–1423 (826 px), Spalten 597–793, 807–1003, 1017–1213; rechts bleiben **210 px** leer. `gridTemplateColumns` rechnet zu „196px 196px 196px 196px". Reparatur nebenbei: breitere Spalten entschärfen 13 und M1 |
| K2 | index.html:3393-3398 | Auf dem Aufgaben-Detail fehlt die fünfte Umschaltzelle „Kalender" | Ausgelesen: auf „aufgabe" `["Liste","Planer","Matrix","Board"]`, auf „aufgaben" fünf Zellen. §14c kennt alle fünf Namen und würde „kalender" auch dort bauen; der Knopf fehlt nur im Markup. Zwei Fassungen desselben Umschalters ohne Begründung sind eine Lernkosten-Falle |
| K3 | prototyp.js:3649 | Die Legende „gefüllt = Eintrag · Ring = heute · leer = nichts geschrieben" widerspricht der Zeichnung: jeder leere Tag **ist** ein Ring | Gezählt: 27 leere Tage (iPad) bzw. 28 (iPhone) werden als dünn umrandeter Kreis gezeichnet, genau einer ist „heute". „Ring" und „leer" bezeichnen im Bild dieselbe Form |
| K4 | prototyp.js:3727 | Der Fußsatz der Karte verspricht „ein Ring je Eintrag" — auf der Karte gibt es keinen einzigen Ring | Der Pin besteht aus `<span class="dot dot--journal">` plus Wort; im DOM findet sich unter `.pv-karte__pin` kein Element mit „ring" im Klassennamen. In den Bildern ist keine Ringform zu sehen |
| K5 | prototyp.js:3668-3672 | Der heutige Tag ist für den Bildschirmleser nicht als heute erkennbar | Der 13. trägt aria-label „13. November — Eintrag öffnen", wortgleich mit dem 10. und 12. Das Wort „heute" kommt im zugänglichen Namen nicht vor — und da das visuelle Merkmal nur 1,09–1,12:1 hält (M6), gibt es gar keinen Kanal, auf dem „heute" ankommt |
| K6 | prototyp.js:4163 | Die Ansage sagt fest „drei Einstellungen", auch wenn die Tafel eine Zeile hat | „AboUni — drei Einstellungen." bei genau einer sichtbaren Zeile |
| K7 | prototyp.js:5389-5406 | Der Regler meldet sich vor der ersten Berührung als Knopf, danach als Regler ohne Bereichsgrenzen; seine Bahn ist als Ziel 26 px hoch | Vor dem ersten Klick `role="button"`, kein `aria-valuenow`. Danach `role="slider"`, `aria-valuenow` 1..5, aber `aria-valuemin`/`aria-valuemax` bleiben in allen acht Läufen null. Bahn 208,7 × **26 px** (iPad Standard) bzw. 507,3 × 26 px (groß) gegen geforderte 44 |
| K8 | Bestand, Karte „GERÄTE UND KONTO" | Bei „Aa groß" wird „iPhone 15 · dieses Gerät" abgeschnitten und läuft in die Uhrzeit | Kante bei x=953,7, die Zeit „22:14" beginnt bei 961,7. Bei Standard passt es (963,3 gegen 971,3). Bestand, nicht neu gebaut — fällt aber in dieselbe ungeprüfte Kombination |
| K9 | prototyp.js:3977 | Die Ansage der Ordnung sagt „1 Gruppen" und zählt eine Zeile mit, die keine Sache ist | Wörtlich: „Herkunft — 1 Gruppen, dieselben 7 Sachen." Unter den 7 „Sachen" ist „Woche 1–6 · 41 Objekte" — der zusammengeklappte Wochenkopf mit eigenem Aufklapp-Weg |
| K10 | prototyp.css:1115-1121 | Die Rücknahme der Rasterplatzierung vergisst den Einzug: eine Zeile bringt ihr inline `padding-left:20px` aus der Zeitachse mit | Alle Zeilen beginnen bei x 597 (iPad) bzw. 674 (iPhone), ihre Titel bei 609/686 — außer „Nach dem Praktikum", Titel bei 617/694. In der Zeitachse bedeutet der Einzug etwas, in der Gruppierung nichts. Gleiche Ursache wie K12: inline Stile überleben das Umhängen unkontrolliert |
| K11 | prototyp.js:3866-3880 | Der Verlauf des Notiz-Editors behauptet Orte und Quellen, die der Prototyp sonst nirgends kennt; auf dem iPhone gibt es den Umschalter gar nicht | Fünf fest eingetragene Verlaufszeilen, darunter „Ort ‚Labor 3.14' ergänzt" — derselbe erfundene Ort wie in Befund 11. *Der Bericht bricht hier im Satz ab; der Umfang auf dem iPhone ist nicht ausgemessen* |
| K12 | index.html:7775 | Rest von R2: die Wisch-Vorführung ist im Brett nur halb abgeräumt — das `transform` ist neutralisiert, der Wischschatten bleibt | Die Zeile trägt weiterhin inline `box-shadow:-1px 0 0 var(--line-2), -10px 0 20px rgba(0,0,0,.18)`; `.pv-brett__stapel > .row { transform: none !important }` fasst ihn nicht an. **Aus dem Quelltext geschlossen, nicht am Bild nachgemessen** — der Zettel dürfte im Brett einen Schatten aus einer Geste tragen, die dort nicht stattfindet |

---

## 3 · Kontrast, vollständig

Alle Werte aus gerenderten Pixeln gerechnet (deviceScaleFactor 2 bzw. 3,
Alpha auf den gemessenen Untergrund), nicht aus CSS-Werten. Schwelle nach
Regel 5: 4,5:1 für Text, 3:1 für Zustands- und Bedienmarken.

| Ort | hell | dunkel | gefordert | Urteil |
|---|---|---|---|---|
| **Aufgaben-Brett** | | | | |
| Spaltenwort im Kopf | 5,26:1 | 6,84:1 | 4,5 | ✓ |
| Spaltenzahl · Spaltensatz · „nichts" | 5,05:1 | 5,43:1 | 4,5 | ✓ |
| Zetteltitel | 17,77:1 | 15,86:1 | 4,5 | ✓ |
| Chip im Zettel | 5,10:1 | 6,36:1 | 4,5 | ✓ |
| Frist-Chip (semantisches Rot) | 5,19:1 | 6,30:1 | 4,5 | ✓ |
| **Journal** | | | | |
| Ziffer im gefüllten Kalendertag | 17,77:1 | 1,11:1 | 4,5 | ✗ → **R3 repariert**, dunkel rechnerisch 17,3:1, nicht nachgemessen |
| Ziffer im leeren Kalendertag | 15,90:1 | — | 4,5 | ✓ |
| Ring „heute" auf gefülltem Tag | 1,12:1 | 1,09:1 | 3,0 | ✗ **M6** |
| Ring leerer Tag (`--line`) | 1,24:1 | 1,35:1 | 3,0 | ✗ **M7** |
| Bildunterschrift im Medien-Raster | 15,90:1 | 17,27:1 | 4,5 | ✓ |
| Kartengitter gegen Feldfläche | 1,22:1 | 1,38:1 | — | Textur ohne Aussage, siehe **M10** |
| **Einstellungen** | | | | |
| Tafelkopf und Zeilentitel | 17,77:1 | 15,86:1 | 4,5 | ✓ |
| Unterzeile der Tafelzeile | 5,14:1 | 5,57:1 | 4,5 | ✓ |
| Schalter EIN: Bahn gegen Karte | 17,77:1 | 15,86:1 | 3,0 | ✓ |
| Schalter AUS: Knauf gegen Karte | — | **1,00:1** | 3,0 | ✗ **15** |
| Schalter AUS: Bahn gegen Karte | 1,24:1 | 1,39:1 | 3,0 | ✗ **15** |
| Schalter AUS: Bahn gegen Knauf | — | 1,43:1 | 3,0 | ✗ **15** |
| Schalter AUS: dunkelster Schattenpixel | 1,53:1 | — | 3,0 | ✗ **15** |
| Schalter AUS: hellster Punkt insgesamt | — | 1,35:1 | 3,0 | ✗ **15** |
| Aktiver Listeneintrag: Fläche | 1,15:1 | 1,30:1 | 3,0 | ✗ **M12** |
| Fokusring auf dem Schalter | rgb(22,24,28), 2 px | rgb(242,243,245), 2 px | sichtbar | ✓ |
| **Referenzwerte aus system.css** | | | | |
| `--line` als Umrandung | 1,23:1 | 1,39:1 | 3,0 | reicht für Bedienelemente nicht (dokumentiert, §1.4b) |
| `--accent-on` auf `--ink` | 17,8:1 | 17,3:1 | 4,5 | ✓ — die Marke, die R3 einsetzt |

Fünf Werte fallen weiterhin durch, alle unter 3:1, alle mit einer
vorhandenen Marke lösbar (`--ink-ui`, `--line-tap`, `--accent-ring`).
Kein einziger **Text**wert liegt unter der Schwelle.

---

## 4 · Was gut ist

Das meiste, was gemessen wurde, hält. Die Prüfer haben nicht nur nach
Fehlern gesucht, sondern jede Fläche vollständig abgegangen, und das ist
das Ergebnis:

**Die Matrix trägt.** 2 × 2 mit 406 px breiten Spalten, in allen vier
iPad-Kombinationen nichts abgeschnitten, kein Titel über der Kante,
Zählung 1+2+1+2 = 6, alle vier Sätze stehen da. Auch bei dunkel und groß
sieht sie ruhig und fertig aus. Sie ist die Ansicht, an der man sieht, wie
die anderen vier gemeint sind.

**Die Wege gehen.** Ein echter Mausklick auf einen Zettel im Board führt in
beiden geprüften Kombinationen von `{aufgaben, tiefe 1}` nach
`{aufgabe, tiefe 2}` — die Zeile behält beim Umhängen ihren Weg, wie §14c es
verspricht. Im Journal klickt kein Ziel ins Leere: gefüllter Tag →
Eintrag, leerer Tag → bleibt stehen und meldet „an diesem Tag steht
nichts", Medien-Kachel → Eintrag, Karten-Pin → Eintrag. Die sechs
Aufgabenzeilen kommen in jeder der acht Kombinationen an ihre alte Stelle
im DOM zurück: gleicher Elternknoten, gleicher Index, gleiche Reihenfolge,
gleiche Klassen.

**Nichts rollt waagerecht, und nichts liegt unter der Tab-Leiste** — außer
an der einen Stelle, die Befund 12 beschreibt. Im Journal in allen 8 Läufen
und vier Blicken `scrollWidth == clientWidth` (iPhone 393/393, iPad
1194/1194, Rollbereich 874/874), auch bei „Aa groß". In den Einstellungen
Seite 1700/1700, iPhone 393/393, iPad-Wirt 638/638. Auf dem iPhone endet
die letzte Medien-Kachel bei y=757,3, die Tab-Leiste beginnt bei y=969 —
211,7 pt Luft.

**Die Regeln der DNA halten im Neuen.** Im ganzen Brett kommen genau zwei
Buntwerte vor: `#C4628E` als 6-pt-Punkt im Herkunfts-Chip und das
semantische Rot am Frist-Chip. Keine Marken-Buntfarbe, keine Modulfarbe als
Fläche oder Text. Keine achte Serif-Rolle: alle 110 Elemente des Bretts
rechnen auf SF Pro, und weder §9 der prototyp.css noch die Tafeln der
Einstellungen führen eine `serif--`-Klasse ein. Sprache durchgehend
deutsch, auch im Verborgenen — aria-Etiketten wie „Aufgabe ‚Laborprotokoll
Zellkultur schreiben' öffnet das Detail", Wochentage „Montag" bis
„Sonntag", Meldungen „Kalender — 3 Tage mit Eintrag im November". Die Suche
nach Today/Tomorrow/Done/Open findet im Brett nichts. Die Modulfarbe
`.dot--journal` erscheint ausschließlich als 6-pt-Punkt neben einem
Ortswort, nie als Fläche und nie als Text.

**Leerzustände sind formuliert, nicht leer gelassen.** Jede leere Spalte im
Brett trägt „nichts" und darunter ihren Satz („mit Frist, ohne Tag",
„heute abgehakt"). Das Medien-Raster hat „In diesen Einträgen steckt kein
Bild." Ein unbekannter Einstellungsbereich bekommt „In diesem Entwurf nicht
ausgezeichnet" statt einer leeren Karte. Das ist genau die Haltung, gegen
die die Journal-Karte (Befund 11) verstößt — die Machart steht also schon
im Haus, sie ist an einer Stelle nur nicht angewandt.

**Der Dunkelmodus zieht bei den Marken mit.** `.pv-brett__spalte` misst
dunkel rgb(29,31,35) gegen den Zettel rgb(23,25,28) und den Seitengrund
rgb(14,15,17) — drei unterscheidbare Stufen, dieselbe Staffelung wie hell
(250/255/242). In §9 steht kein fest verdrahteter Farbwert; alles läuft
über `--paper`, `--paper-2`, `--line`, `--ink`. Die einzigen Ausnahmen
waren die vier toten Marken-Verweise, und die sind repariert (R3, R4, R5).

**Der Regler arbeitet mechanisch sauber.** An 0/25/50/75/100 % stimmen
Knaufposition, Füllbreite, Wort in der Blase und `aria-valuenow` in allen
acht Kombinationen überein. Der Knauf hängt an den Enden 13 px über die
Bahn hinaus, bleibt samt 6-px-Hof aber deutlich in der Karte (23 px links,
28 px rechts). Der einzige Fehler war die Benennung — und die ist repariert.

**Der Rückweg steht.** Darstellung → Datenschutz → Darstellung stellt alle
vier Kinder des Wirts wieder her; keine Tafel bleibt hängen, auch nicht
nach einem Schirm- oder Gerätewechsel. Auf dem iPhone ist die Notizenliste
vorher und nachher identisch, alle `.scroll`-Kinder behalten ihr inline
`display:flex`.

**Trefferflächen im Brett und Kalender halten.** Kein Element im Brett unter
44 × 44; die Zettel sind 52 px und höher. Die Kalendertage messen auf dem
iPhone 45,3 × 45,3 pt (353 pt Gitterbreite minus 6 × 6 pt Rinne, geteilt
durch 7) — knapp, aber gehalten; auf dem iPad 62 × 62.

**Und zwei Details, die zeigen, dass hier jemand nachgedacht hat:** Der
Kalender wächst nicht ins Riesenhafte — `max-width: 470px` hält das
Monatsgitter auf dem iPad in Lesegröße, bei „Aa groß" gehen nur die
Ziffern von 15 auf 16 px. Und die Bildunterschrift im Medien-Raster steht
**unter** dem Foto statt darauf und ist zugleich das alt-Attribut; der
schwierige Fall „Text über Bild" tritt gar nicht erst ein, und der
Bildschirmleser hört denselben Text, den man liest.

---

## 5 · Was ich zuerst reparieren würde

Die Reihenfolge folgt nicht der Schwere allein, sondern dem Verhältnis von
Schaden zu Aufwand — und der Frage, welcher Fehler den Prototyp gegen seine
eigene Ansage stellt.

**Erstens: die drei Filterflächen (Befunde 2, 3, 4, 5, 6, 8).**
Sechs schwere Befunde in zwei Funktionen — `schichtFiltern` und
`chipreiheBeleben`/`spanChipsBeleben`. Das ist die höchste Befunddichte pro
Zeile Code im ganzen Prüfstoff, und der Schaden ist der schlimmste, den
dieser Prototyp haben kann: Der Prototyp erklärt in seiner eigenen
Kopfzeile „was keinen Weg hat, zeigt auch keinen Klickfinger" — hier zeigen
lebendige Knöpfe einen Klickfinger und tun nichts. Wer die neue Bedienung
vorführt und auf einen Chip drückt, sieht als Erstes, dass sich nichts
ändert. Die Reparaturen sind klein: eine Bedingung (4242), ein Wörterbuch
mit fünf Zeilen (4254), eine Wache mit einem Vorbehalt (5228), ein eigener
Zweig für den Graphen. Achtung bei Befund 4: die Wache zu entschärfen macht
die Tag-Chips lebendig, aber noch nicht wirksam — beides gehört in einen
Schritt, sonst tauscht man einen toten Knopf gegen einen lügenden.

**Zweitens: die vier Behauptungen ohne Deckung (Befunde 10, 11, M17, K11)
und die Zählstände (8, M5, K6, K9).**
Eine fehlende Angabe kostet den Betrachter eine Frage; eine falsche kostet
ihn das Vertrauen in alle übrigen. Die Journal-Karte sagt unter zwei
erfundenen Orten „im Journal genannt", während der Eintrag daneben „Labor
2" schreibt. Die Semester-Ordnung wirft neun Zeilen in „Direkt
geschrieben", darunter einen Journaleintrag, der sich selbst als solcher
ausweist. In drei von vier Fällen ist **Weglassen** die Reparatur und
kostet fast nichts: Rückfall streichen und den Leerzustand setzen, den das
Medien-Raster schon vormacht. Das ist auch der Grund, warum dieser Schritt
vor den Layout-Schritten kommt — er ist billig und beseitigt die
peinlichste Sorte Fehler.

**Drittens: die drei Stellen, an denen ein Tipp den falschen Schirm öffnet
(Befunde 12, M18, M19).**
Der einzige Befundtyp, bei dem der Betrachter aktiv fehlgeleitet wird: ein
Tipp mitten auf „Heute" öffnet die Notiz, ein Tipp auf „Notiz" im Eingang
öffnet eine fremde Notiz, ein Tipp auf „Zur Stelle" öffnet das Canvas. Alle
drei treten nur bei „Aa groß" auf, alle drei kommen aus derselben Quelle:
feste Pixelmaße unter einer wachsenden Schrift. Dazu gehört eine
Vorbedingung, die kein Prüfer als Befund geführt hat, aber die Nachlese zu
Recht anmahnt: **die Treffprobe aus `system.css §5.9` ist seit der neuen
Bedienung nie wieder gefahren worden.** Die dortige Liste („7 Ziele werden
KLEINER") stammt aus einer Zeit vor §14. Die Nachlese hat sie neu gefahren
und 27 geklaute Mitten gefunden, davon sechs mit echtem Mausklick belegt —
die übrigen 21 sind ungeprüft.

**Viertens: die fünf Kontrastwerte unter 3:1 (Befunde 15, M6, M7, M12).**
Der AUS-Schalter im Dunkeln mit 1,00:1 ist der härteste Einzelwert des
ganzen Prüfstoffs: Knauf und Kartengrund sind dieselbe Farbe, das
Bedienelement ist nicht nur schwer zu lesen, sondern nicht vorhanden. Alle
vier Befunde sind mit Marken lösbar, die das System bereits gerechnet hat
(`--ink-ui`, `--line-tap`, `--accent-ring`) — es ist Ersetzungsarbeit, keine
Entwurfsarbeit. Sie steht an vierter Stelle und nicht früher, weil sie den
Betrachter nicht in die Irre führt, sondern ihn bremst.

**Fünftens: die iPhone-Lücke der Einstellungen (Befund 1).**
Sachlich der größte einzelne Befund — eine ganze Fläche fehlt auf einem
Gerät —, aber auch der einzige, der echte Entwurfsarbeit verlangt: die
Tafel gehört auf dem iPhone als eigener Schirm auf den Stapel, mit
Zurück-Weg, nicht in denselben Scroll. Darum nicht früher. Solange sie
fehlt, wäre die ehrliche Zwischenlösung, die elf Chevrons auf dem iPhone zu
entfernen: kein Versprechen ist besser als ein gebrochenes.

**Sechstens: die zwei Layouts, die bei „Aa groß" brechen (Befunde 13, 14).**
Zwei feste Maße gegen eine wachsende Schrift — 125 px Zeilenbreite ohne
Umbruchmöglichkeit im Brett, `height: 40px` an der `.navitem`. Beide
Reparaturen sind einzeilig, beide lösen nebenbei etwas anderes mit: der
Umbruch im Brett entschärft M1, das `min-height:44px` an der `.navitem`
erfüllt zugleich Regel 8.

**Danach der Rest**, in dieser Reihenfolge: die Zustandsfehler, die das
Bild sich selbst widersprechen lassen (M2 Auswahl ohne Merkmale, M3
`is-checking`, M13 widersprechende Unterzeile) · die Trefferflächen (M8,
M11, K7) · M16, weil es ein Argument ist und drei Minuten kostet · dann
die Kosmetik (K1 bis K12).

**Was dabei offen bleibt.** Drei der acht Berichte fehlen; ihre Flächen
sind unbekannt, und die Abnahme kann darum nicht als vollständig gelten.
`graph iphone dunkel+groß` ist für die Filterfrage nach wie vor nicht
gefahren. Für Lernkarten wurde der dunkle Modus nie angesehen, für Eingang
und Lernsitzung ebenfalls nicht. K12 ist aus dem Quelltext geschlossen und
nicht am Bild nachgemessen. Und die sechs bereits reparierten Befunde
(R1–R6) sind repariert, aber **nicht nachgemessen** — vor allem R2 ist nur
zur Hälfte behoben (siehe K12).
