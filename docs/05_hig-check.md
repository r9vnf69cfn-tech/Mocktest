# 05 · Der Affordanz-Test und der Systemtreue-Nachweis

Velums Akzent ist Ink — fast schwarz im Hellmodus, fast weiß im Dunkelmodus.
Damit nimmt der Entwurf iOS sein stärkstes Signal weg: **farbig heißt tappbar.**
Genau daran kann er scheitern, und niemand merkt es, solange man nur behauptet,
es sei gelöst.

Dieses Dokument behauptet nichts. Es misst.

Jeder Screen wurde im Browser geöffnet, jedes Bedienelement programmatisch
gefunden, seine sichtbaren Merkmale in Zahlen gefasst und sein Rahmen über den
Screenshot gezeichnet. Neben jedem markierten Bild steht dasselbe Bild
unmarkiert. **Was nur im markierten Bild einen Rahmen hat, hat keine Affordanz.**

Werkzeug: [`tools/affordanz.js`](../tools/affordanz.js) · Bilder:
[`mockups/_renders/affordanz/`](../mockups/_renders/affordanz/) — 76 Stück,
19 Screens × 2 Geräte × 2 Erscheinungsbilder.

---

## 1 · Was geprüft wurde, und was nicht

| | |
|---|---|
| **Geprüft** | 13 Screens `app-next` + 6 Screens `best-of`, je iPad 1194×834 pt und iPhone 393×852 pt, je hell und dunkel |
| **Gefundene Bedienelemente** | **976** (662 in `app-next`, 314 in `best-of`) |
| **Nicht geprüft** | die zehn Ansichten in `mockups/platform/` |

Die Plattform-Ansichten zeigen **Systemoberflächen** — Widgets, Sperrbildschirm,
Spotlight, Siri, Teilen-Blatt. Deren Affordanz ist Apples, nicht Velums; ein
Tastaturfeld oder eine Mitteilung nach Velums Regeln zu prüfen hieße, die
falsche Handschrift zu bewerten. Die Entscheidung steht hier, damit sie
angreifbar ist und nicht wie ein Versehen aussieht.

### Wie ein Bedienelement gefunden wird

Drei Mengen, absichtlich getrennt gehalten:

| | Was | Anzahl (hell) |
|---|---|---|
| **A** | echte Bedien-Semantik: `button` · `a[href]` · `[role]` · `[tabindex]` · `input` · `summary` · `[data-bw]` | 790 |
| **B** | Bedien-**Klasse** ohne Semantik: `.row` · `.check` · `.origin` · `.iconbtn` · `.navitem` als `<div>`/`<span>` | **186** |
| **C** | Bedien-**Optik** ohne Semantik: `.chip`/`.btn` als `<span>`, aber mit eigener Fläche oder sichtbarem Rand | **122** |

A und B sind die 976 geprüften Bedienelemente. C wird getrennt gezählt und
getrennt gezeichnet, weil dort zwei verschiedene Befunde möglich sind: entweder
fehlt die Semantik, oder die Optik ist zu viel. Welcher von beiden zutrifft,
kann kein Skript entscheiden — siehe §6.

### Was „gemessen" heißt

Keine Klassennamen glauben, berechnete Werte lesen:

- **Fläche** — eigene `background-color`, alpha-kompositiert gegen den
  tatsächlichen Untergrund (Vorfahren hoch bis deckend), davon das
  Kontrastverhältnis. **≥ 1,10:1** zählt. Ein Schlagschatten zählt ebenso, und
  ein Hintergrundbild zählt ebenso — die Notizbuch-Deckel tragen ihr Papier als
  Bild, ihre `background-color` misst 1,09:1 und sagt damit das Gegenteil
  dessen, was im Bild steht. Wer nur Farben misst, übersieht Fotos.
- **Rand** — `border-width > 0` oder `inset box-shadow`, Schwelle **1,6:1**.
  Dabei wird unterschieden: `inset 0 0 0 1,5px` ist ein Ring rundum,
  `inset 0 −1,5px 0` ist eine **Unterstreichung**. Im Quelltext sehen beide
  gleich aus, im Bild sind es zwei verschiedene Dinge. Nur der Ring beantwortet
  R2, nur die Unterstreichung R3.
- **Ink** — Fläche nahe `--accent` **und** Textfarbe nahe `--accent-on`, beides
  im RGB-Abstand.
- **Ziel** — die getroffene Fläche in CSS-px (= pt bei Maßstab 1).
- **Treffprobe** — an fünf Punkten im Element fragt `elementFromPoint`, was dort
  oben liegt. Was man nicht treffen kann, ist kein Ziel: die Rückseite einer
  gedrehten Lernkarte steht im Layout, aber nicht im Bild. Von 1 154 Kandidaten
  fielen so **22** heraus, die sonst als „unsichtbare Bedienelemente" gemeldet
  worden wären.

---

## 2 · Die vier Regeln, in Rechenform

Aus `dna-kern.md` §6. Rechts steht, wie die Regel maschinell entschieden wird —
und wo ich urteilen musste statt zu messen.

| | Regel | Fällt durch, wenn |
|---|---|---|
| **R1** | Primäre Aktion: gefüllte Ink-Fläche, heller Text | ein als primär gekennzeichnetes Element (`.btn--primary`, `.chip--solid`, `.rate__btn--primary`, `.fab`) **nicht** Ink-gefüllt misst |
| **R2** | Sekundäre Aktion: Umrandung, Fläche oder Position — nie nur Farbe | weder Fläche noch Rand noch **Lage** in einer Leiste. Ein Symbol zählt hier ausdrücklich **nicht** — gefragt ist, ob das Element als Bedienfläche lesbar ist |
| **R3** | Interaktiver Text braucht ein zweites Merkmal | weder Fläche noch Rand noch Symbol noch Unterstreichung noch Lage. Fällt R3, ist das Element im unmarkierten Bild **überhaupt nicht** als Bedienelement zu erkennen |
| **R4** | Ziel ≥ 44 pt | die kleinere Kante < 44 pt |

**„Lage" ist der Punkt, an dem ich geurteilt habe.** Sie gilt in drei Fällen:

1. in einer benannten Leiste — `.navbar`, `.tabbar`, `.sidebar`, `.toolbar`,
   `.segmented`, `.rate`, `.handoff`;
2. **Listenlage**: eine `.row`, die eine Geschwisterzeile hat **oder** einen
   Erledigt-Kreis trägt;
3. **Leistenlage ohne Klassennamen**: ≥ 3 gleichartige Geschwister in einem
   Behälter, der selbst eine eigene Fläche oder eine Trennkante hat — so ist die
   Blockleiste des Editors gebaut, inline gesetzt, ohne Klasse.

Ohne Fall 2 fällt jede Aufgabenzeile durch — und mit ihr Reminders und Things,
die es genauso machen. Der Preis dieser Milde: **eine einzelne Zeile ohne Kreis
in einem Behälter ohne Kante bleibt ein Befund.** Genau so sind die vier Zeilen
auf `best-of/today` durchgefallen (§4).

Zwei Nebenbefunde laufen mit, ohne zu den vier Regeln zu zählen:
**Linie unter 3:1** (ein Element, dessen einziges Merkmal ein Strich ist, muss
diesen Strich auf 3:1 halten) und **Fläche grenzwertig** (1,04–1,10:1 — eine
Fläche ist da, sie liegt nur unter meiner Schwelle; der Unterschied zwischen
1,09 und 1,12 ist keiner, den ein Auge sieht, und darf keine Schwere umschlagen
lassen).

---

## 3 · Das Ergebnis in Zahlen

### Hellmodus

| Screen | Gerät | geprüft | primär | sekundär | tertiär | schwer | mittel | leicht | R1 | R2 | R3 | R4 |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| app-next/today | iPad | 31 | 2 | 10 | 19 | 0 | 6 | 15 | 0 | 2 | 0 | 19 |
| app-next/today | iPhone | 17 | 1 | 5 | 11 | 0 | 5 | 1 | 0 | 2 | 0 | 4 |
| app-next/library | iPad | 42 | 1 | 22 | 19 | 0 | 0 | 21 | 0 | 0 | 0 | 21 |
| app-next/library | iPhone | 18 | 1 | 9 | 8 | 0 | 1 | 2 | 0 | 1 | 0 | 3 |
| app-next/notes-list | iPad | 50 | 2 | 12 | 36 | **2** | 16 | 24 | 0 | 12 | 2 | 42 |
| app-next/notes-list | iPhone | 19 | 2 | 6 | 11 | 0 | 4 | 3 | 0 | 0 | 0 | 7 |
| app-next/note-editor | iPad | 47 | 1 | 7 | 39 | **4** | 9 | 16 | 0 | 9 | 4 | 29 |
| app-next/note-editor | iPhone | 21 | 1 | 3 | 17 | 0 | 5 | 8 | 0 | 2 | 0 | 13 |
| app-next/journal-home | iPad | 22 | 1 | 4 | 17 | 0 | 2 | 18 | 0 | 1 | 0 | 20 |
| app-next/journal-home | iPhone | 13 | 1 | 2 | 10 | 0 | 0 | 5 | 0 | 0 | 0 | 5 |
| app-next/journal-entry | iPad | 27 | 0 | 8 | 19 | **2** | 1 | 13 | 0 | 2 | 2 | 14 |
| app-next/journal-entry | iPhone | 12 | 0 | 5 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| app-next/tasks | iPad | 47 | 3 | 10 | 34 | 0 | 7 | 30 | 0 | 5 | 0 | 32 |
| app-next/tasks | iPhone | 25 | 0 | 5 | 20 | 0 | 6 | 4 | 0 | 5 | 0 | 5 |
| app-next/task-detail | iPad | 51 | 1 | 14 | 36 | **1** | 18 | 22 | 0 | 8 | 1 | 40 |
| app-next/task-detail | iPhone | 23 | 0 | 11 | 12 | 0 | 8 | 4 | 0 | 0 | 0 | 12 |
| app-next/flashcards-home | iPad | 26 | 2 | 9 | 15 | 0 | 0 | 19 | 0 | 0 | 0 | 19 |
| app-next/flashcards-home | iPhone | 13 | 2 | 5 | 6 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| app-next/review-session | iPad | 19 | 1 | 6 | 12 | **1** | 7 | 0 | 0 | 6 | 1 | 7 |
| app-next/review-session | iPhone | 17 | 1 | 4 | 12 | **3** | 2 | 0 | 0 | 5 | 3 | 3 |
| app-next/graph | iPad | 29 | 1 | 8 | 20 | 0 | 8 | 19 | 0 | 3 | 0 | 27 |
| app-next/graph | iPhone | 18 | 1 | 5 | 12 | 0 | 7 | 5 | 0 | 3 | 0 | 12 |
| app-next/settings | iPad | 32 | 0 | 6 | 26 | 0 | 0 | 24 | 0 | 0 | 0 | 24 |
| app-next/settings | iPhone | 13 | 0 | 4 | 9 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| app-next/leere-zustaende | iPad | 20 | 2 | 6 | 12 | 0 | 2 | 17 | 0 | 2 | 0 | 17 |
| app-next/leere-zustaende | iPhone | 10 | 1 | 4 | 5 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| best-of/library | iPad | 37 | 2 | 18 | 17 | 0 | 4 | 21 | 0 | 1 | 0 | 25 |
| best-of/library | iPhone | 21 | 0 | 3 | 18 | 0 | 2 | 8 | 0 | 2 | 0 | 10 |
| best-of/today | iPad | 28 | 1 | 10 | 17 | **3** | 5 | 9 | 0 | 3 | 3 | 15 |
| best-of/today | iPhone | 20 | 1 | 8 | 11 | **2** | 5 | 0 | 0 | 2 | 2 | 5 |
| best-of/notes | iPad | 38 | 0 | 8 | 30 | **2** | 5 | 25 | 0 | 2 | 2 | 31 |
| best-of/notes | iPhone | 9 | 0 | 1 | 8 | 0 | 1 | 3 | 0 | 0 | 0 | 4 |
| best-of/journal | iPad | 23 | 1 | 5 | 17 | **1** | 3 | 15 | 0 | 4 | 1 | 19 |
| best-of/journal | iPhone | 11 | 1 | 1 | 9 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| best-of/tasks | iPad | 54 | 1 | 21 | 32 | **8** | 15 | 24 | 0 | 10 | 8 | 47 |
| best-of/tasks | iPhone | 25 | 1 | 11 | 13 | **1** | 6 | 8 | 0 | 1 | 1 | 15 |
| best-of/flashcards | iPad | 32 | 1 | 8 | 23 | **3** | 1 | 15 | 0 | 4 | 3 | 18 |
| best-of/flashcards | iPhone | 16 | 1 | 5 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Summe** | | **976** | **38** | **289** | **649** | **33** | **161** | **409** | **0** | **97** | **33** | **575** |

Dazu, nicht in den 976 enthalten: **186** Elemente ohne Bedien-Semantik im
Markup und **122** Elemente mit Bedien-Optik ohne Semantik.

### Dunkelmodus — dieselben 976 Elemente

| | schwer | mittel | leicht | R1 | R2 | R3 | R4 | Linie < 3:1 | Fläche grenzwertig |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| hell | 33 | 161 | 409 | 0 | 97 | 33 | 575 | 7 | 2 |
| dunkel | 33 | 177 | 408 | 0 | 113 | 38 | 575 | **46** | **47** |

**Die schweren Befunde sind in beiden Erscheinungsbildern dieselben 33.** Der
Unterschied liegt in der Mitte, und er hat genau eine Ursache: im Dunkelmodus
liegen die leisen Linien und die leisen Flächen näher an der Schwelle. Gemessen:

| Token | hell auf `--paper` | dunkel auf `--paper` |
|---|--:|--:|
| `--line` (Trennlinie) | 1,23:1 | 1,39:1 |
| `--line-2` (leiser Rand) | 1,46:1 | 1,82:1 |
| `--line-tap` (Rand eines Bedienelements) | **3,29:1** | **3,34:1** |
| `--fill` (Chip-Fläche) | 1,11:1 | 1,20:1 |
| `--accent-soft` (Auswahl-Fläche) | 1,15:1 | 1,31:1 |
| `--accent-ring` | 1,95:1 | 3,13:1 |
| `--paper` gegen `--ground` (jede Karte) | **1,118:1** | **1,089:1** |
| `--accent-on` auf `--accent` (CTA-Text) | 17,77:1 | 17,27:1 |

`--line-tap` hält 3:1 in beiden Modi. Das ist der Kern der Sache und es ist
belegt, nicht behauptet: **jeder Ghost-Chip, der ein `<button>` ist, misst
3,20–3,34:1; jeder, der ein `<span>` ist, misst 1,46:1 (hell) bzw. 1,75–1,84:1
(dunkel).** Die Regel aus `system.css` §6 — „ein Chip, den man drücken kann,
sieht anders aus als einer, den man nur liest" — ist im Bild nachweisbar
eingehalten: sechs interaktive Ghost-Chips, in beiden Modi gemessen, zwölf
Messungen, alle ≥ 3,20:1; kein einziger Etiketten-Ghost-Chip darüber.

**Ein echter Befund steckt trotzdem in dieser Tabelle:** `--paper` gegen
`--ground` trennt jede Karte, jede Kachel, jedes Blatt. iOS trennt an derselben
Stelle mit 1,116:1 (hell, `systemGroupedBackground` gegen weiß) und **1,234:1**
(dunkel, Schwarz gegen `#1C1C1E`). Velum trifft den Hellwert auf drei
Nachkommastellen — und bleibt im Dunkeln mit 1,089:1 **darunter**. Im Dunkelmodus
stehen Velums Karten flacher auf ihrem Grund als Apples.

---

## 4 · Die Befunde nach Schwere

Nicht 603 Befunde, sondern **wenige Bausteine, die vielfach vorkommen.** So sind
sie hier gruppiert; die Einzelmeldungen stehen dahinter.

### Schwer — 33 Elemente, die im unmarkierten Bild nicht als Bedienelement lesbar sind

| # | Ursache | Anzahl | Wo |
|---|---|--:|---|
| S1 | **`.btn--quiet`** — `background:none; color:var(--ink-2)`: dunkler Text neben dunklem Text | **13** | `review-session` (4), `task-detail` (1), `best-of/today` (1), `best-of/journal` (1), `best-of/tasks` (3), `best-of/flashcards` (3) |
| S2 | Inhaltsverzeichnis im Notiz-Editor: 4 von 5 Einträgen reiner Text, 25–27 pt hoch | **4** | `note-editor` iPad |
| S3 | Datumsleiste ohne Fläche: sechs von sieben Tagen tragen nur Text | **6** | `best-of/tasks` iPad |
| S4 | Herkunfts-Kette auf `journal-entry`: zwei von drei Gliedern ohne Chevron | **2** | `journal-entry` iPad |
| S5 | Terminzeilen ohne Kreis und ohne Kante | **4** | `best-of/today` iPad + iPhone |
| S6 | Verschachtelte Tag-Einträge ohne Symbol, während alle Geschwister eines tragen | **2** | `notes-list` iPad (`/bio`, `/mathe`) |
| S7 | Gliederungszeilen in der Notizen-Seitenspalte | **2** | `best-of/notes` iPad |

**13 der 33 stehen in `app-next`, 20 in `best-of`.** Das ist der einzige Satz
dieses Dokuments, der wie Eigenlob klingt, und er ist der einzige, der es sein
darf: die Screens aus Runde 1 tragen bei halber Elementzahl anderthalbmal so
viele schwere Befunde. Der Unterschied ist der `.btn--quiet`-Bestand und die
Kette.

### Mittel — 161 Elemente (hell), zwei Ursachen

| Ursache | Anzahl |
|---|--:|
| **R4 mit kleinster Kante unter 30 pt** — davon 67 der Erledigt-Kreis `.check` (22 pt, in `task-detail` 18 pt) und 18 Chips mit eigener Semantik (24–28 pt) | 97 |
| **R2** — weder Fläche noch Rand noch Leistenlage, aber ein Symbol oder ein Chevron trägt es: `.chain__link`, tappbare Karten, `.iconbtn` außerhalb einer Leiste | 64 |

### Leicht — 409 Elemente, ausnahmslos R4 zwischen 32 und 44 pt

| Kleinste Kante | Anzahl |
|---|--:|
| 40–43 pt | 216 |
| 36–39 pt | 49 |
| 32–35 pt | 144 |

**Die 575 R4-Meldungen sind sieben Bausteine**, verteilt über alle Schweregrade:

| Baustein | Maß | Meldungen |
|---|--:|--:|
| `.navitem` (Sidebar-Zeile) | 40 pt | 228 |
| `.btn--sm` | 34 pt | 84 |
| `.check` | 22 pt / 18 pt | 67 |
| `<button>` ohne Klasse, inline gemessen | 25–40 pt | 64 |
| `.iconbtn` mit Inline-Maß | 38 pt / 34 pt / 26 pt | 39 |
| `.row` in schmalen Fassungen | 32–43 pt | 25 |
| `.segmented button` · `.chip` | 32 pt / 26 pt | 36 |

`.navitem` allein stellt 228 Meldungen: eine Sidebar-Zeile ist 40 pt hoch, nicht
44. Die Zahl ist groß und der Befund ist klein — genau deshalb steht die
Verteilung hier und nicht nur die Summe.

---

## 5 · Die fünf schlimmsten

### 1 · `.btn--quiet` — eine Klasse, 13 schwere Befunde

`system.css` §6:

```css
.btn--quiet { background: none; color: var(--ink-2); }
```

Keine Fläche, kein Rand, kein Symbol. Was bleibt, ist ein Wort in `--ink-2`
neben Wörtern in `--ink-1` — **Farbe als einziges Merkmal, also genau das, was
R2 verbietet.** Die Klasse steht 25-mal im Bestand; **alle 25** tragen einen
Befund, 13 davon einen schweren.

Der klarste Fall ist `review-session.html` iPhone, Elemente #9/#10/#11:
„Zurücklegen · Aussetzen · Bearbeiten", drei Wörter nebeneinander, 34 pt hoch,
in einem Behälter ohne Fläche und ohne Kante. Im unmarkierten Bild ist das eine
Bildunterschrift.

Zwei Zeilen darüber steht, dass es anders geht: „Gut" ist Ink-gefüllt und nimmt
die ganze Breite, „Nochmal · Schwer · Leicht" tragen `--line-tap` bei 3,20:1.
Dieselbe Karte, dieselbe Runde, drei Zeilen Abstand.

![review-session iPhone](../mockups/_renders/affordanz/app-next-review-session-iphone.png)

### 2 · Das Inhaltsverzeichnis im Notiz-Editor

`note-editor.html` iPad, #44/#46/#47/#48 — „Aufbau der Zelle", „Osmose",
„Organellen im Überblick", „Fragen an Prof. Wendt". Je 247×27 pt, `<button>` mit
Inline-Stil, ohne Klasse, ohne Fläche, ohne Rand, ohne Chevron. Der aktive
Eintrag „Membran und Transport" hat `--accent-soft` und einen 2,5-pt-Balken —
**er beweist, dass die vier anderen tappbar sind, und ist der einzige Beweis.**

### 3 · Die Herkunfts-Kette auf `journal-entry`

`journal-entry.html` iPad, #23 „ENTSTANDEN AUS · Zellbiologie · Notiz · 12. Nov"
und #26 „DARAUS WURDE · Laborprotokoll · Aufgabe · offen", je 169×115 pt.
Dieselbe `.chain__link`-Klasse trägt auf `today.html` einen 14-pt-Chevron und
fällt dort nur durch R2; hier fehlt er, und damit fällt sie durch R3.

**Ein Bauteil, zwei Screens, zwei verschiedene Affordanz-Fassungen.** Das trifft
die Alleinstellung: Herkunft ist das, was kein Konkurrent hat, und auf dem
Screen, der sie am ausführlichsten zeigt, sieht sie am wenigsten nach
Bedienelement aus.

![journal-entry iPad](../mockups/_renders/affordanz/app-next-journal-entry-ipad.png)

### 4 · Der Erledigt-Kreis existiert zweimal, in zwei Größen

`.check` misst 22×22 pt — 67-mal im Bestand, in acht Screens. Es ist das
Bedienelement, mit dem in einer Aufgaben-App am häufigsten getippt wird.

`tasks.html` macht es an fünf Stellen richtig:

```html
<button style="width:44px; height:44px; margin:-11px" data-bw="erledigen" …>
  <span class="bw-check"></span>
</button>
```

44 pt Ziel, 22 pt Zeichen, negativer Außenabstand, damit das Layout gleich
bleibt. **Genau dieser Griff fehlt an den anderen 67 Stellen.** Es ist kein
Entwurfsproblem, es ist ein nicht zu Ende geführter Umbau — die Lösung steht
schon in derselben Datei.

### 5 · Die 27 Knoten des Graphen sind keine Bedienelemente

`graph.html` meldet 29 geprüfte Bedienelemente. **Keines davon ist ein Knoten.**
Die Objekte sind `<circle>` plus `<text>` in einem SVG, ohne `button`, ohne
`role`, ohne `tabindex`. Der Test findet sie deshalb nicht — und VoiceOver und
die Tastatur finden sie genauso wenig.

Der Screen zeigt sein Panel „AUSGEWÄHLTER KNOTEN" mit einem ausgewählten Knoten;
die Auswahl muss also irgendwo herkommen. Sie kommt aus einem Bedienelement, das
im Markup nicht existiert.

![graph iPad](../mockups/_renders/affordanz/app-next-graph-ipad.png)

---

## 6 · Was der Test nicht sieht

Vier Grenzen. Sie stehen hier, weil ein Nachweis, der seine eigenen Lücken
verschweigt, kein Nachweis ist.

1. **Er findet nur, was als Bedienelement erklärt ist.** Die Graph-Knoten (§5.5)
   sind der größte Fall. Weitere im Bild gefundene: die Stimmungs-Balken und der
   Energie-Regler auf `journal-entry`, die Teilschritt-Zeilen unter einer Aufgabe
   auf `tasks`, die „verlinkt / erwähnt"-Zeilen in der Editor-Seitenspalte.
   **Ein Element, das weder Semantik noch Bedien-Klasse trägt, taucht in keiner
   Zahl dieses Dokuments auf.**
2. **186 + 122 = 308 Elemente tragen Bedien-Optik oder Bedien-Klasse ohne
   Bedien-Semantik.** Für den Affordanz-Test sind sie mitgezählt, weil er nach
   dem Bild fragt. Für VoiceOver, Full Keyboard Access und Switch Control sind
   sie nicht vorhanden. Welche davon Bedienelemente werden sollen und welche
   Etiketten bleiben, ist eine Entscheidung, kein Messwert. Beispiele aus einer
   einzigen Zeile auf `tasks.html`: die erkannten Marken „Morgen 14:00", „#labor",
   „Hohe Priorität", „Bereich Biologie" stehen unter der Beschriftung
   *„Antippen zum Ändern"* — sie **sollen** tappbar sein und sind `<span>`.
   Dagegen ist „4 Blöcke ausgeblendet" im Editor ein Etikett und trägt trotzdem
   eine Chip-Fläche von 1,11:1.
3. **Er misst den Ruhezustand.** `:hover`, `:active`, `:focus-visible` und die
   Bewegung aus `bewegung.css` sind nicht geprüft. Auf iOS gibt es kein Hover;
   die Affordanz muss ohnehin vorher da sein — deshalb ist diese Grenze
   verschmerzbar, aber sie ist eine.
4. **„Lage" ist ein Urteil** (§2). Ohne sie fielen 31 weitere Zeilen durch, mit
   ihr fallen 4 durch. Beide Zahlen stehen in diesem Dokument.

Und eine Grenze, die ich beim Rechnen selbst gefunden habe: die erste Fassung
des Werkzeugs meldete 16 Notizbuch-Deckel als „ohne Fläche", weil ihr Papier ein
Bild ist und ihre `background-color` 1,09:1 misst. Sie meldete außerdem 40
Bedienelemente, die es nicht gibt — die Rückseiten gedrehter Karten. Beides ist
behoben (Bild zählt als Fläche, Treffprobe per `elementFromPoint`); beides steht
hier, weil eine Messung, deren Fehler man nicht kennt, keine Messung ist.

---

## 7 · Die Drei-Sekunden-Frage, je Screen

> **Kann ein Fremder ohne Vorwissen in drei Sekunden sagen, was anklickbar ist?**

Beantwortet, indem ich das unmarkierte Bild angesehen und danach das markierte
danebengelegt habe. **Ja** heißt: alles Gerahmte war vorher erkennbar. **Fast**
heißt: bis auf benannte Stellen. **Nein** heißt: eine Aktion, die der Screen
braucht, war nicht zu finden.

| Screen | Antwort | Was fehlt |
|---|---|---|
| **flashcards-home** | **Ja** | Nichts. Der sauberste Screen des Entwurfs: jeder Knopf hat Fläche, Ring oder Ink. Alle 19 Befunde sind R4 zwischen 32 und 43 pt. |
| **settings** | **Ja** | 0 schwer, 0 mittel. Eine Liste aus Zeilen mit Chevron und Schaltern — die Bauform trägt alles. |
| **library** | **Ja** | Ein Deckel ist ein Deckel. Der Papierdruck macht die Kachel; der Rücken mit seinen Punkten macht sie unterscheidbar. |
| **journal-home** | **Ja** | 0 schwer. Einträge sind Zeilen in Listen, der Impuls-Knopf ist Ink. |
| **today** | **Fast** | Die drei Glieder der Ketten-Karte tragen nur einen 14-pt-Chevron als Auskunft. Man **findet** sie, aber man findet sie zuletzt — und es ist der Signaturmoment. |
| **tasks** | **Fast** | Zeilen, Kreise, Chips und die Auswahl-Leiste lesen sich. Unklar bleiben die vier erkannten Marken im Eingabefeld: sie sagen „Antippen zum Ändern" und sehen aus wie Etiketten. |
| **notes-list** | **Fast** | Die Liste liest sich sofort. `/bio` und `/mathe` sind die einzigen zwei Navigationszeilen des Screens ohne Symbol — man übersieht sie, weil alle anderen eines haben. |
| **task-detail** | **Fast** | Die aufgeklappte Karte ist dicht und trotzdem lesbar. „Ganzen Verlauf zeigen" am Fuß der Aktivitätsspalte liest sich als letzte Textzeile, nicht als Knopf. |
| **journal-entry** | **Fast** | Alles obere trägt Flächen. Die „VERBUNDEN"-Kette unten ist zu zwei Dritteln reiner Text — und sie ist der Grund, warum es den Screen gibt. |
| **note-editor** | **Fast** | Der Text, die Übergabe-Leiste und die Blockleiste sind klar. Die Gliederung rechts ist es nicht: vier Zeilen ohne jedes Merkmal, eine mit Fläche. |
| **review-session** | **Nein** | „Zurücklegen · Aussetzen · Bearbeiten" auf dem iPhone und „Leeren" auf dem iPad sind unsichtbar. Der Rest des Screens ist vorbildlich — das macht es schlimmer, nicht besser: der Blick lernt am „Gut"-Knopf, was hier ein Knopf ist, und findet drei Zeilen tiefer nichts, was danach aussieht. |
| **graph** | **Nein** | Panel, Filter und Zoom sind klar. Die 27 Knoten — die eigentliche Bedienfläche — sind es nicht: sie sind im Markup keine Bedienelemente und im Bild nur Kreise mit Beschriftung. |
| **leere-zustaende** | **Ja** | 0 schwer. Ein leerer Screen mit genau einem Ink-Knopf ist die einfachste Affordanz-Aufgabe, die es gibt, und sie ist gelöst. |

**Bilanz `app-next`: 5 × Ja, 6 × Fast, 2 × Nein.**

Für `best-of` (Runde 1, unangetastet): `library` **Ja**; `flashcards`,
`journal`, `notes` **Fast**; `today` und `tasks` **Nein** — bei `tasks` ist die
ganze Wochenleiste betroffen, sechs von sieben Tagen tragen nur Text.

### Die ehrliche Zusammenfassung

Der Entwurf **kann** Affordanz ohne Farbe. `flashcards-home`, `settings`,
`library`, `journal-home` und `leere-zustaende` beweisen es: **209
Bedienelemente, kein einziger schwerer Befund**, fünf mittlere. Die Mittel dafür
sind da und sind gerechnet —
`--line-tap` auf 3,3:1, die Ink-Füllung auf 17,8:1, die Chip-Fläche, die
Listenform.

Er tut es nur nicht überall. **33 von 976 Bedienelementen — 3,4 % — sind im
Bild nicht als solche zu erkennen**, und sie verteilen sich nicht zufällig: 13
davon sind eine einzige CSS-Klasse, die keine Affordanz hat und trotzdem 25-mal
benutzt wird. Das ist kein Gestaltungsproblem. Das ist ein Baustein, der fehlt.

Was ich **nicht** behaupte: dass 3,4 % wenig sind. Zwei der 13 Screens
scheitern an der Frage, und einer davon ist die Lernsitzung — der Screen, den
ein Nutzer öfter sieht als jeden anderen.

### 7.1 · Die dreizehn Screens im Bild

Links unmarkiert, rechts markiert — dieselbe Aufnahme, derselbe Ausschnitt.
Rot = primär · Blau = sekundär · Grün = tertiär · Violett gestrichelt =
Bedien-Optik ohne Semantik. Halo = schwerer Befund. Der Dunkelmodus und die
sechs `best-of`-Screens stehen in der Tabelle in §10.

#### today — **Fast**

Die Kette trägt nur einen 14-pt-Chevron. Alles andere liest sich.

![today iPad](../mockups/_renders/affordanz/app-next-today-ipad.png)

![today iPhone](../mockups/_renders/affordanz/app-next-today-iphone.png)

#### library — **Ja**

Ein Deckel ist ein Deckel. 0 schwer, 0 mittel auf dem iPad.

![library iPad](../mockups/_renders/affordanz/app-next-library-ipad.png)

![library iPhone](../mockups/_renders/affordanz/app-next-library-iphone.png)

#### notes-list — **Fast**

`/bio` und `/mathe` sind die einzigen Navigationszeilen ohne Symbol.

![notes-list iPad](../mockups/_renders/affordanz/app-next-notes-list-ipad.png)

![notes-list iPhone](../mockups/_renders/affordanz/app-next-notes-list-iphone.png)

#### note-editor — **Fast**

Die Gliederung rechts: vier Zeilen ohne jedes Merkmal, eine mit Fläche.

![note-editor iPad](../mockups/_renders/affordanz/app-next-note-editor-ipad.png)

![note-editor iPhone](../mockups/_renders/affordanz/app-next-note-editor-iphone.png)

#### journal-home — **Ja**

0 schwer. Zeilen in Listen, Impuls-Knopf in Ink.

![journal-home iPad](../mockups/_renders/affordanz/app-next-journal-home-ipad.png)

![journal-home iPhone](../mockups/_renders/affordanz/app-next-journal-home-iphone.png)

#### journal-entry — **Fast**

Die „VERBUNDEN"-Kette unten ist zu zwei Dritteln reiner Text.

![journal-entry iPad](../mockups/_renders/affordanz/app-next-journal-entry-ipad.png)

![journal-entry iPhone](../mockups/_renders/affordanz/app-next-journal-entry-iphone.png)

#### tasks — **Fast**

Zeilen, Kreise und Auswahl-Leiste lesen sich; die erkannten Marken im Eingabefeld nicht.

![tasks iPad](../mockups/_renders/affordanz/app-next-tasks-ipad.png)

![tasks iPhone](../mockups/_renders/affordanz/app-next-tasks-iphone.png)

#### task-detail — **Fast**

„Ganzen Verlauf zeigen" liest sich als letzte Textzeile der Aktivitätsspalte.

![task-detail iPad](../mockups/_renders/affordanz/app-next-task-detail-ipad.png)

![task-detail iPhone](../mockups/_renders/affordanz/app-next-task-detail-iphone.png)

#### flashcards-home — **Ja**

Der sauberste Screen: jeder Knopf hat Fläche, Ring oder Ink.

![flashcards-home iPad](../mockups/_renders/affordanz/app-next-flashcards-home-ipad.png)

![flashcards-home iPhone](../mockups/_renders/affordanz/app-next-flashcards-home-iphone.png)

#### review-session — **Nein**

„Zurücklegen · Aussetzen · Bearbeiten" (iPhone) und „Leeren" (iPad) sind unsichtbar.

![review-session iPad](../mockups/_renders/affordanz/app-next-review-session-ipad.png)

![review-session iPhone](../mockups/_renders/affordanz/app-next-review-session-iphone.png)

#### graph — **Nein**

Die 27 Knoten sind im Markup keine Bedienelemente — kein Rahmen im rechten Bild sitzt auf einem.

![graph iPad](../mockups/_renders/affordanz/app-next-graph-ipad.png)

![graph iPhone](../mockups/_renders/affordanz/app-next-graph-iphone.png)

#### settings — **Ja**

0 schwer, 0 mittel. Zeilen mit Chevron und Schaltern, die Bauform trägt alles.

![settings iPad](../mockups/_renders/affordanz/app-next-settings-ipad.png)

![settings iPhone](../mockups/_renders/affordanz/app-next-settings-iphone.png)

#### leere-zustaende — **Ja**

0 schwer. Ein leerer Screen mit genau einem Ink-Knopf.

![leere-zustaende iPad](../mockups/_renders/affordanz/app-next-leere-zustaende-ipad.png)

![leere-zustaende iPhone](../mockups/_renders/affordanz/app-next-leere-zustaende-iphone.png)

---

## 8 · Systemtreue

Nachgewiesen, nicht abgehakt. Wo etwas nicht stimmt, steht es hier.

### 8.1 Schriften — belegt

Gemessen wurde nicht der Quelltext, sondern die **gerenderte** Schrift jedes
Textelements in allen 13 Screens, iPad und iPhone (1 627 Elemente):

| erste Familie der Kaskade | Elemente |
|---|--:|
| `-apple-system` (SF Pro Text) | 1 545 |
| `New York` | 70 |
| `SF Mono` | 12 |

**Eine dritte Familie kommt nicht vor.** `grep` über `mockups/` und `docs/*.html`
findet **null** `@font-face`, null `.woff`/`.otf`/`.ttf`, null `@import`, null
`fonts.googleapis`. Keine gekaufte, keine geladene, keine exotische Schrift —
drei Systemschriften, alle auf jedem iPhone und iPad vorhanden.

**Größen — die Fünferskala hält ausnahmslos:**

```
28 · 20 · 17 · 15 · 13          und 11 in der Tab-Bar-Beschriftung
```

Keine weitere Größe im ganzen Bestand. Die 11 pt sind die in `system.css` §4
dokumentierte Ausnahme; sie gehören iOS und nicht Velum.

**Zeilenhöhen — hier gibt es Abweichungen, 82 von 1 627 (5,0 %):**

| Abweichung | Anzahl | Bewertung |
|---|--:|---|
| `.btn`-Varianten mit `line-height: 1` (17/17, 15/15) | 61 | **richtig.** Ein Knopf ist eine einzeilige Zeilenbox; `line-height: 1` zentriert sie. 23 pt Zeilenhöhe in einem 34-pt-Knopf wäre der Fehler. |
| `.count__n` bei 20/24 statt 20/26 | 14 | **Befund.** Eine Kennzahl ist Text wie jeder andere; für 24 statt 26 gibt es keinen Grund. |
| `.t-label` bei 13/14 und 13/12, inline gesetzt | 6 | **Befund.** Zwei inline gesetzte Zeilenhöhen an drei Stellen, ohne Notwendigkeit. |
| `num` einzeln | 1 | Befund, minimal. |

**Serif — die sieben Rollen, gezählt im Bild:**

| Rolle | Vorkommen |
|---|--:|
| `serif--screen-title` | 20 |
| `serif--cover-title` | 21 |
| `serif--empty-title` | 10 |
| `serif--voice` (Journal-Fließtext) | 6 |
| `serif--quote` | 6 |
| `serif--journal-date` | 5 |
| `serif--wordmark` | 2 |
| **blankes `.serif`** | **0** |

Der Nachtrag N1 der DNA ist damit nachprüfbar umgesetzt: New York steht an
genau sieben benannten Orten und nirgends sonst. 70 Elemente von 1 627 —
4,3 % der Textelemente tragen die Serif. Sie ist Stimme, nicht Textur.

### 8.2 Navigation

| Muster | Stand | Beleg |
|---|---|---|
| **Sidebar auf iPad** | ✅ 12 von 13 Screens | Ausnahme `review-session`: eine Lernsitzung ist ein Vollbild-Modus, iOS entfernt dort die Navigation. Richtig so, und es ist der einzige Screen mit einem `×` links oben. |
| **Tab-Bar auf iPhone** | ✅ 13 von 13 | fünf Einträge, 48 pt hoch, Beschriftung 11 pt, aktiver Zustand über Gewicht **und** Farbe |
| **Kontextmenü** | ⚠️ nur in `platform/kontextmenue.html` | In den 13 App-Screens ist kein Kontextmenü gezeichnet; `library.html` erwähnt es im Kommentar. Wer nur die Screens sieht, sieht das Muster nicht. |
| **Blatt (Sheet)** | ❌ **fehlt** | `grep` findet in `app-next/` kein Blatt mit Griffleiste. Die Klasse `.sheetnote` ist der Erklärkasten unter dem Gerät, kein UI-Blatt. Ein Entwurf mit „Neu"-Knopf auf jedem Screen braucht ein Blatt, und keines ist gezeichnet. |
| **Wischgeste** | ⚠️ nur `review-session` | Dort echt: Zeiger wird erst ab 6 pt gefangen, vier Knöpfe sind der gleichwertige Weg. Auf Listenzeilen (`tasks`, `notes-list`, `journal-home`) ist keine Wischaktion gezeichnet — das klassischste iOS-Listenmuster überhaupt. |
| **Popover** | ⚠️ formfrei | Die Übergabe-Leiste `.handoff` und das Graph-Panel sind popover-artig, aber ohne Zeiger und ohne Systemform. |

**Zwei bewusste Abweichungen vom Standard — die Begründung muss dastehen:**

**Die Ketten-Karte** ist kein iOS-Muster. Sie ist ein waagerechter Faden mit drei
Knoten, an jeder Station anspringbar. Vorhersehbar bleibt sie, weil sie sich wie
eine Liste verhält: die Stationen stehen in Leserichtung, jede trägt Vorspann,
Titel und Metazeile in derselben Anordnung wie eine Listenzeile, und jede hat
einen Chevron nach rechts. Der Fadenverlauf sagt „von hier nach dort" und ist die
einzige Zutat, die iOS nicht kennt. **Der Test bestätigt die Form und rügt ihre
Lautstärke:** auf `today.html` fällt sie durch R2 (kein Rand, keine Fläche, keine
Leistenlage), auf `journal-entry.html` zusätzlich durch R3 (dort fehlt auch der
Chevron). Die Abweichung ist begründet, die Ausführung ist es noch nicht.

**Die Übergabe-Leiste** ersetzt das System-Menü über einer Textauswahl. Sie ist
vorhersehbar, weil sie an derselben Stelle erscheint wie das Systemmenü, dieselbe
Form hat (schwebendes Blatt mit Schlagschatten über der Auswahl) und links das
sagt, was das Systemmenü nie sagt: woher die Auswahl kommt. Gemessen: die
primäre Aktion „Lückentext-Karte" ist Ink-gefüllt bei 17,8:1, die beiden
sekundären tragen Text plus Modulpunkt und werden von der Leiste getragen — das
ist iOS' eigene Grammatik für ein Menü, und der Test lässt sie deshalb über R2
„Lage" passieren. **Das ist die weichste Stelle des Nachweises:** wer die Lage
nicht gelten lässt, hat hier zwei weitere Befunde.

### 8.3 Materialien und Tiefe

**Materialien: Systemform, geschätzte Zahlen.**
`backdrop-filter: blur(24px) saturate(180%)` auf `--chrome`
(`rgba(246,246,247,0.86)` hell / `rgba(23,25,28,0.84)` dunkel) — das ist die
übliche Web-Entsprechung von `UIBlurEffect .regular`. Die Werte 24 px und 180 %
sind **gewählt, nicht aus dem System gelesen**; iOS gibt sie nicht heraus. Vier
Leisten benutzen dieselben Werte, eine (`.handoff`) 28 px. Die Form stimmt, die
Zahl ist eine Schätzung, und sie steht hier als solche.

**Tiefe: drei Token, sauber, aber selbst erfunden.**

```css
--sh-card:  0 1px 2px rgba(22,24,28,.05), 0 6px 18px rgba(22,24,28,.06);
--sh-float: 0 2px 6px rgba(22,24,28,.08), 0 14px 36px rgba(22,24,28,.14);
--sh-cover: 0 1px 2px rgba(22,24,28,.08), 0 10px 24px rgba(22,24,28,.13);
```

Je ein Kontakt- und ein Streuschatten, im Dunkelmodus eigene Werte (stärker, wie
es sein muss). **Befund: vier Schatten stehen außerhalb der Token** —
`.segmented button.is-on` (`0 1px 3px rgba(0,0,0,.12)`), die Kachelkante in
§4 (`0 0 0 .5px rgba(0,0,0,.18)`), der weiche Hof des laufenden Hakens und der
weiße Ring auf dem Punkt des primären Übergabe-Knopfes. Die letzten beiden sind
Zustandsringe und keine Tiefe; die ersten beiden gehören in Token.

iOS gibt keine Schattenwerte heraus. Erfinden ist hier unvermeidlich — die
Frage ist nur, ob es an einer Stelle geschieht oder an fünfzehn. Es geschieht an
drei plus zwei.

### 8.4 Symbole

**Alle 55 Symbole sind gezeichnet, keines ist ein SF Symbol.**

`mock.js` baut jedes aus einem 24×24-Pfad mit `stroke-width: 1.7`,
`stroke-linecap: round`, `fill: none`. **Eine einzige Abweichung im
Strichgewicht: `check` steht auf 2.0** — begründbar, weil ein Haken bei 1,7 auf
22 pt zerfällt, aber es ist eine Abweichung und sie steht nirgends erklärt.

Der Grund für die eigenen Zeichnungen ist keine Gestaltungsentscheidung: SF
Symbols sind lizenzrechtlich an Apple-Plattformen gebunden und dürfen in einem
HTML-Entwurf nicht ausgeliefert werden. Ehrlich ist deshalb der Satz: **dies ist
ein Platzhaltersatz in einheitlichem Strichgewicht, kein eigenes Symbolsystem.**
Der Großteil der 55 hat eine direkte SF-Symbols-Entsprechung
(`magnifyingglass`, `chevron.right`, `star`, `paperplane`, `trash`, `flag`,
`clock`, `calendar`, `mic`, `photo`, `bolt`, `link`, `tag`, `folder` …). Die
Modulzeichen (Canvas, Journal, Lernkarten, Graph) sind Velums eigene und müssen
es sein — kein Systemsymbol bedeutet „Notizbuch mit Herkunft".

Was **fehlt**: eine Zuordnungstabelle „Velum-Name → SF-Symbol-Name", damit beim
Bau nicht neu geraten wird. Das ist eine Zeile Arbeit je Symbol und sie ist
nicht gemacht.

### 8.5 Kontrast — gerechnet

Alle Werte in §3. Zusammengefasst:

| Prüfung | Anforderung | Stand |
|---|---|---|
| CTA-Text auf Ink | ≥ 4,5:1 | 17,77:1 hell · 17,27:1 dunkel ✅ |
| Rand eines Bedienelements (`--line-tap`) | ≥ 3:1 | 3,29:1 · 3,34:1 ✅ |
| Ghost-Chip als Knopf, 30 Fälle | ≥ 3:1 | 3,20–3,34:1 ✅ |
| Karte gegen Grund | Apple: 1,12 / 1,23 | 1,118 ✅ · **1,089 ⚠️** |
| Unterstreichung des Wiki-Links | ≥ 3:1 | **1,46:1 ❌** |

Der letzte Punkt ist der schärfste Einzelbefund des ganzen Dokuments, weil er
gegen die eigene Regel verstößt. `note-editor.html` Zeile 225:

```html
<a href="#" style="… box-shadow: inset 0 -1.5px 0 var(--line-2)">[[Osmose]]</a>
```

Der Wiki-Link im Fließtext trägt eine Unterstreichung — R3 ist erfüllt. Aber sie
steht auf `--line-2` und hält damit **1,46:1**, während das System eigens
`--line-tap` mit **3,29:1** dafür geschaffen hat („umrandet ein Bedienelement
ohne eigene Fläche", `system.css` §1). Ein Zeichen ist da; es ist nur nicht zu
sehen. Zwei Vorkommen (iPad und iPhone), Wechsel des Tokens genügt.

---

## 9 · Was zu tun ist

Nach Wirkung sortiert. Die ersten zwei schließen 13 der 33 schweren Befunde.

1. **`.btn--quiet` bekommt ein Merkmal** — `--line-tap`-Ring bei 3,3:1 oder
   `--fill`-Fläche. 25 Vorkommen, eine CSS-Regel, 13 schwere Befunde weg.
2. **Der Erledigt-Kreis bekommt überall den 44-pt-Griff**, den `tasks.html`
   bereits hat. 67 Vorkommen, ein Muster, das schon existiert.
3. **`.chain__link` bekommt auf `journal-entry` denselben Chevron wie auf
   `today`** — und beide eine Fläche oder einen Rand, damit das Signaturbauteil
   nicht das leiseste bleibt.
4. **Die Graph-Knoten werden Bedienelemente** — `role="button"`, `tabindex`,
   `aria-label`. Ohne das ist der Screen für VoiceOver leer.
5. **Der Wiki-Link wechselt auf `--line-tap`.** Zwei Zeilen.
6. **Die Gliederung im Editor bekommt Chevrons oder Zeilenflächen.**
7. **Die 308 Elemente ohne Semantik werden durchgesehen** und in zwei Stapel
   sortiert: Knopf oder Etikett. Der zweite Stapel legt seine Chip-Fläche ab.
8. **`.navitem` von 40 auf 44 pt**, `.btn--sm` von 34 auf 44 oder mit
   ausgewiesener Trefferfläche. Danach fallen 312 der 575 R4-Meldungen weg.
9. **Ein Blatt zeichnen.** Der „Neu"-Knopf führt auf jedem Screen ins Leere.
10. **Karte gegen Grund im Dunkelmodus** von 1,089 auf ≈ 1,23 anheben, damit
    Velums Tiefe im Dunkeln nicht flacher ist als die des Systems.

---

## 10 · Reproduzieren

```bash
node tools/affordanz.js                    # alle Screens, hell
node tools/affordanz.js --dunkel           # dieselben, dunkel
node tools/affordanz.js review-session     # ein Screen
node tools/affordanz.js --json befunde.json
```

Das Werkzeug braucht `playwright-core` und einen Chromium-Pfad
(`VELUM_PLAYWRIGHT`, `VELUM_CHROME`), kein npm install, keine externe URL. Es
schreibt nach `mockups/_renders/affordanz/` und gibt die Tabelle aus §3 auf der
Konsole aus. Die Zahlen dieses Dokuments stammen aus einem Lauf vom 9. August
2026; jeder spätere Lauf gegen dieselben Dateien liefert sie wieder.

### Alle 76 Bilder

`<gruppe>-<datei>-<gerät>[-dunkel].png` in
[`mockups/_renders/affordanz/`](../mockups/_renders/affordanz/) — je Bild links
unmarkiert, rechts markiert, darunter Legende und Zählung.

| | iPad | iPhone |
|---|---|---|
| today | [hell](../mockups/_renders/affordanz/app-next-today-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-today-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-today-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-today-iphone-dunkel.png) |
| library | [hell](../mockups/_renders/affordanz/app-next-library-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-library-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-library-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-library-iphone-dunkel.png) |
| notes-list | [hell](../mockups/_renders/affordanz/app-next-notes-list-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-notes-list-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-notes-list-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-notes-list-iphone-dunkel.png) |
| note-editor | [hell](../mockups/_renders/affordanz/app-next-note-editor-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-note-editor-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-note-editor-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-note-editor-iphone-dunkel.png) |
| journal-home | [hell](../mockups/_renders/affordanz/app-next-journal-home-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-journal-home-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-journal-home-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-journal-home-iphone-dunkel.png) |
| journal-entry | [hell](../mockups/_renders/affordanz/app-next-journal-entry-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-journal-entry-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-journal-entry-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-journal-entry-iphone-dunkel.png) |
| tasks | [hell](../mockups/_renders/affordanz/app-next-tasks-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-tasks-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-tasks-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-tasks-iphone-dunkel.png) |
| task-detail | [hell](../mockups/_renders/affordanz/app-next-task-detail-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-task-detail-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-task-detail-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-task-detail-iphone-dunkel.png) |
| flashcards-home | [hell](../mockups/_renders/affordanz/app-next-flashcards-home-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-flashcards-home-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-flashcards-home-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-flashcards-home-iphone-dunkel.png) |
| review-session | [hell](../mockups/_renders/affordanz/app-next-review-session-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-review-session-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-review-session-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-review-session-iphone-dunkel.png) |
| graph | [hell](../mockups/_renders/affordanz/app-next-graph-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-graph-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-graph-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-graph-iphone-dunkel.png) |
| settings | [hell](../mockups/_renders/affordanz/app-next-settings-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-settings-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-settings-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-settings-iphone-dunkel.png) |
| leere-zustaende | [hell](../mockups/_renders/affordanz/app-next-leere-zustaende-ipad.png) · [dunkel](../mockups/_renders/affordanz/app-next-leere-zustaende-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/app-next-leere-zustaende-iphone.png) · [dunkel](../mockups/_renders/affordanz/app-next-leere-zustaende-iphone-dunkel.png) |
| best-of/library | [hell](../mockups/_renders/affordanz/best-of-library-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-library-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-library-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-library-iphone-dunkel.png) |
| best-of/today | [hell](../mockups/_renders/affordanz/best-of-today-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-today-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-today-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-today-iphone-dunkel.png) |
| best-of/notes | [hell](../mockups/_renders/affordanz/best-of-notes-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-notes-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-notes-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-notes-iphone-dunkel.png) |
| best-of/journal | [hell](../mockups/_renders/affordanz/best-of-journal-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-journal-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-journal-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-journal-iphone-dunkel.png) |
| best-of/tasks | [hell](../mockups/_renders/affordanz/best-of-tasks-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-tasks-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-tasks-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-tasks-iphone-dunkel.png) |
| best-of/flashcards | [hell](../mockups/_renders/affordanz/best-of-flashcards-ipad.png) · [dunkel](../mockups/_renders/affordanz/best-of-flashcards-ipad-dunkel.png) | [hell](../mockups/_renders/affordanz/best-of-flashcards-iphone.png) · [dunkel](../mockups/_renders/affordanz/best-of-flashcards-iphone-dunkel.png) |
