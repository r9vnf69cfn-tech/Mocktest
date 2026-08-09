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

**Zweiter Lauf.** `system.css` und alle 13 `app-next`-Screens sind seit der
ersten Messung überarbeitet worden; die 115 Vorschaubilder und die 76 markierten
Bilder sind neu erzeugt ([`tools/rendern.js`](../tools/rendern.js),
[`tools/affordanz.js`](../tools/affordanz.js)). Jede Tabelle trägt die alten
Zahlen daneben. Wo eine Zahl schlechter geworden ist, steht die Ursache dabei —
und in einem Fall ist die schlechtere Zahl der Beleg für die größte
Verbesserung dieses Laufs (§3.1).

---

## 1 · Was geprüft wurde, und was nicht

| | |
|---|---|
| **Geprüft** | 13 Screens `app-next` + 6 Screens `best-of`, je iPad 1194×834 pt und iPhone 393×852 pt, je hell und dunkel |
| **Gefundene Bedienelemente** | **1 033** (719 in `app-next`, 314 in `best-of`) — vorher 976 |
| **Nicht geprüft** | die zehn Ansichten in `mockups/platform/` |

**Die Zahl ist gewachsen, und das ist der wichtigste Einzelbefund dieses
Laufs.** 57 Bedienelemente mehr als beim letzten Mal, 36 davon allein auf
`graph`: die 27 Knoten waren vorher `<circle>`+`<text>` und für den Test wie
für VoiceOver **nicht vorhanden** (alte §5.5). Sie sind jetzt `<button>` mit
`aria-label` — und tauchen damit zum ersten Mal in jeder Zahl dieses Dokuments
auf, samt ihrer Befunde. Wer nur die Summen vergleicht, liest eine
Verschlechterung, wo ein blinder Fleck geschlossen wurde. §3.1 rechnet das
auseinander.

Die Plattform-Ansichten zeigen **Systemoberflächen** — Widgets, Sperrbildschirm,
Spotlight, Siri, Teilen-Blatt. Deren Affordanz ist Apples, nicht Velums; ein
Tastaturfeld oder eine Mitteilung nach Velums Regeln zu prüfen hieße, die
falsche Handschrift zu bewerten. Die Entscheidung steht hier, damit sie
angreifbar ist und nicht wie ein Versehen aussieht.

### Wie ein Bedienelement gefunden wird

Drei Mengen, absichtlich getrennt gehalten:

| | Was | Anzahl (hell) | vorher |
|---|---|---|---|
| **A** | echte Bedien-Semantik: `button` · `a[href]` · `[role]` · `[tabindex]` · `input` · `summary` · `[data-bw]` | 854 | 790 |
| **B** | Bedien-**Klasse** ohne Semantik: `.row` · `.check` · `.origin` · `.iconbtn` · `.navitem` als `<div>`/`<span>` | **179** | 186 |
| **C** | Bedien-**Optik** ohne Semantik: `.chip`/`.btn` als `<span>`, aber mit eigener Fläche oder sichtbarem Rand | **123** | 122 |

A und B sind die 1 033 geprüften Bedienelemente. C wird getrennt gezählt und
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
| app-next/today | iPad | 35 | 2 | 12 | 21 | 0 | 8 | 15 | 0 | 4 | 0 | 19 |
| app-next/today | iPhone | 20 | 1 | 7 | 12 | 0 | 6 | 1 | 0 | 3 | 0 | 4 |
| app-next/library | iPad | 42 | 1 | 22 | 19 | 0 | 0 | 16 | 0 | 0 | 0 | 16 |
| app-next/library | iPhone | 18 | 1 | 9 | 8 | 0 | 1 | 2 | 0 | 1 | 0 | 3 |
| app-next/notes-list | iPad | 55 | 2 | 11 | 42 | 0 | 23 | 24 | 0 | 18 | 0 | 41 |
| app-next/notes-list | iPhone | 23 | 2 | 6 | 15 | 0 | 8 | 3 | 0 | 4 | 0 | 7 |
| app-next/note-editor | iPad | 49 | 1 | 11 | 37 | 0 | 9 | 6 | 0 | 7 | 0 | 9 |
| app-next/note-editor | iPhone | 23 | 1 | 3 | 19 | 0 | 6 | 2 | 0 | 4 | 0 | 5 |
| app-next/journal-home | iPad | 25 | 1 | 3 | 21 | **1** | 1 | 17 | 0 | 2 | 1 | 17 |
| app-next/journal-home | iPhone | 14 | 1 | 3 | 10 | 0 | 0 | 4 | 0 | 0 | 0 | 4 |
| app-next/journal-entry | iPad | 27 | 0 | 8 | 19 | 0 | 3 | 13 | 0 | 2 | 0 | 14 |
| app-next/journal-entry | iPhone | 13 | 0 | 4 | 9 | 0 | 2 | 1 | 0 | 2 | 0 | 1 |
| app-next/tasks | iPad | 41 | 3 | 7 | 31 | 0 | 9 | 25 | 0 | 8 | 0 | 28 |
| app-next/tasks | iPhone | 26 | 0 | 4 | 22 | 0 | 8 | 6 | 0 | 7 | 0 | 7 |
| app-next/task-detail | iPad | 51 | 1 | 17 | 33 | 0 | 18 | 22 | 0 | 9 | 0 | 38 |
| app-next/task-detail | iPhone | 23 | 0 | 14 | 9 | 0 | 8 | 4 | 0 | 0 | 0 | 12 |
| app-next/flashcards-home | iPad | 26 | 2 | 9 | 15 | 0 | 0 | 19 | 0 | 0 | 0 | 19 |
| app-next/flashcards-home | iPhone | 13 | 2 | 5 | 6 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| app-next/review-session | iPad | 20 | 1 | 13 | 6 | 0 | 2 | 6 | 0 | 0 | 0 | 8 |
| app-next/review-session | iPhone | 18 | 1 | 9 | 8 | 0 | 1 | 4 | 0 | 1 | 0 | 4 |
| app-next/graph | iPad | 55 | 1 | 12 | 42 | **23** | 11 | 16 | 0 | 24 | 23 | 35 |
| app-next/graph | iPhone | 28 | 1 | 8 | 19 | **10** | 8 | 2 | 0 | 11 | 10 | 16 |
| app-next/settings | iPad | 32 | 0 | 6 | 26 | 0 | 0 | 24 | 0 | 0 | 0 | 24 |
| app-next/settings | iPhone | 13 | 0 | 4 | 9 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| app-next/leere-zustaende | iPad | 20 | 2 | 6 | 12 | 0 | 2 | 17 | 0 | 2 | 0 | 17 |
| app-next/leere-zustaende | iPhone | 9 | 1 | 3 | 5 | 0 | 0 | 2 | 0 | 0 | 0 | 2 |
| best-of/library | iPad | 37 | 2 | 18 | 17 | 0 | 4 | 21 | 0 | 1 | 0 | 25 |
| best-of/library | iPhone | 21 | 0 | 3 | 18 | 0 | 2 | 8 | 0 | 2 | 0 | 10 |
| best-of/today | iPad | 28 | 1 | 11 | 16 | **2** | 5 | 10 | 0 | 2 | 2 | 15 |
| best-of/today | iPhone | 20 | 1 | 8 | 11 | **2** | 5 | 0 | 0 | 2 | 2 | 5 |
| best-of/notes | iPad | 38 | 0 | 8 | 30 | **2** | 5 | 25 | 0 | 2 | 2 | 31 |
| best-of/notes | iPhone | 9 | 0 | 1 | 8 | 0 | 1 | 3 | 0 | 0 | 0 | 4 |
| best-of/journal | iPad | 23 | 1 | 6 | 16 | 0 | 4 | 15 | 0 | 3 | 0 | 19 |
| best-of/journal | iPhone | 11 | 1 | 1 | 9 | 0 | 0 | 3 | 0 | 0 | 0 | 3 |
| best-of/tasks | iPad | 54 | 1 | 23 | 30 | **6** | 16 | 25 | 0 | 8 | 6 | 47 |
| best-of/tasks | iPhone | 25 | 1 | 12 | 12 | 0 | 6 | 9 | 0 | 0 | 0 | 15 |
| best-of/flashcards | iPad | 32 | 1 | 11 | 20 | 0 | 4 | 15 | 0 | 1 | 0 | 18 |
| best-of/flashcards | iPhone | 16 | 1 | 5 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Summe** | | **1 033** | **38** | **323** | **672** | **46** | **186** | **390** | **0** | **130** | **46** | **547** |

Dazu, nicht in den 1 033 enthalten: **179** Elemente ohne Bedien-Semantik im
Markup und **123** Elemente mit Bedien-Optik ohne Semantik.

### 3.1 · Was sich gegen den letzten Lauf verschoben hat

| | vorher | jetzt | |
|---|--:|--:|---|
| geprüft | 976 | **1 033** | +57 — 36 davon die Graph-Knoten, die es vorher im Markup nicht gab |
| primär | 38 | 38 | unverändert, R1 weiter bei 0 |
| sekundär | 289 | **323** | +34 — Flächen und Ringe, die vorher fehlten |
| tertiär | 649 | 672 | +23, trotz +57 geprüfter Elemente |
| **schwer** | 33 | **46** | **+13 — siehe unten, die Zahl täuscht** |
| mittel | 161 | **186** | +25 |
| leicht | 409 | **390** | −19 |
| R2 | 97 | 130 | +33 |
| R3 | 33 | 46 | +13 |
| R4 | 575 | **547** | −28 |
| ohne Semantik (B) | 186 | **179** | −7 |
| Fehlaffordanz (C) | 122 | 123 | +1 |

**Die 46 schweren Befunde sind nicht dieselbe Art Befund wie die 33 vorher.**
Aufgeschlüsselt:

| | vorher | jetzt |
|---|--:|--:|
| `graph` — Knoten (im letzten Lauf **nicht gezählt**, weil ohne Semantik) | — | **33** |
| `journal-home` — „11. Nov. nachtragen" (neu) | 0 | **1** |
| alle übrigen `app-next`-Befunde (`.btn--quiet`, Inhaltsverzeichnis, Herkunfts-Kette, `/bio`+`/mathe`, `task-detail`) | 13 | **0** |
| `best-of` (unangetastet, profitiert nur von `system.css`) | 20 | **12** |

**Ohne `graph` fällt `app-next` von 13 schweren Befunden auf 1.** Die 33
Graph-Knoten sind kein Rückschritt: sie sind der Preis dafür, dass Punkt 4 der
alten Aufgabenliste erledigt wurde. Vorher waren sie für VoiceOver, Tastatur
**und** diesen Test unsichtbar; jetzt sind sie erreichbar — und der Test sagt,
was das markierte Bild bestätigt: erreichbar heißt noch nicht erkennbar (§5.1).

`best-of` hat niemand angefasst; die acht weggefallenen schweren Befunde dort
gehen allein auf die eine geänderte CSS-Regel `.btn--quiet` zurück. Das ist der
sauberste Beleg dieses Laufs dafür, dass der Befund an der Klasse hing und
nicht an den Screens.

**Zwei Zahlen sind schlechter geworden und haben nichts mit `graph` zu tun:**

- **mittel 161 → 186.** Ursache ist nicht neue Nachlässigkeit, sondern die
  gestiegene Elementzahl plus die Umstufung: was vorher **schwer** war, ist
  durch einen Ring oder eine Fläche auf **mittel** gerutscht, nicht auf null.
  `.btn--quiet` trägt jetzt `--line-tap`, fällt aber weiter durch R4 (34 pt).
  Von den 186 sind **102 reine R4-Meldungen**, 84 tragen R2.
- **`notes-list` iPad 16 → 23 mittel und `task-detail` iPad 18 mittel.** Beide
  haben Bedienelemente **dazubekommen** (50 → 55 bzw. gleich viele, aber
  umgebaut). Die neuen sind nicht schlechter als die alten, es sind mehr.

### Dunkelmodus — dieselben 1 033 Elemente

| | schwer | mittel | leicht | R1 | R2 | R3 | R4 | Linie < 3:1 | Fläche grenzwertig |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| hell | 46 | 186 | 390 | 0 | 130 | 46 | 547 | 7 | 2 |
| dunkel | 46 | 200 | 390 | 0 | 144 | 51 | 547 | **46** | **46** |
| *hell, vorher* | *33* | *161* | *409* | *0* | *97* | *33* | *575* | *7* | *2* |
| *dunkel, vorher* | *33* | *177* | *408* | *0* | *113* | *38* | *575* | *46* | *47* |

**Die schweren Befunde sind in beiden Erscheinungsbildern dieselben 46** —
elementweise verglichen, nicht nur der Summe nach. Der
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

**Alle acht Werte sind unverändert** — kein Token wurde in dieser Runde
angefasst, und das ist überprüft, nicht angenommen.

`--line-tap` hält 3:1 in beiden Modi. Das ist der Kern der Sache und es ist
belegt, nicht behauptet: **jeder Ghost-Chip, der ein `<button>` ist, misst
3,20–3,34:1; jeder, der ein `<span>` ist, misst 1,46:1 (hell) bzw. 1,75–1,84:1
(dunkel).** Die Regel aus `system.css` §6 — „ein Chip, den man drücken kann,
sieht anders aus als einer, den man nur liest" — hält weiter für jeden Chip,
der selbst das Bedienelement ist.

**Sie hat jetzt eine Lücke, und sie kostet den einzigen neuen schweren Befund
in `app-next`:** wenn der Chip **im** Bedienelement sitzt statt es zu sein,
greift die Regel nicht. `journal-home` Zeile 316 ist der Fall — ein
`<button>` von 468×44 pt, darin ein `<span class="chip chip--ghost">`. Der
Knopf ist das Ziel, der Chip ist das Zeichen, und weil der Chip ein `<span>`
ist, trägt er den **Etiketten**-Ring mit 1,46:1 statt der 3,29:1, die ihm als
einzigem sichtbaren Merkmal eines Bedienelements zustünden. Die Regel muss
lauten: *ein Chip, der ein Bedienelement **anzeigt**, sieht aus wie eines* —
nicht *ein Chip, der eines **ist***. Siehe §5.2.

**Ein echter Befund steckt trotzdem in dieser Tabelle:** `--paper` gegen
`--ground` trennt jede Karte, jede Kachel, jedes Blatt. iOS trennt an derselben
Stelle mit 1,116:1 (hell, `systemGroupedBackground` gegen weiß) und **1,234:1**
(dunkel, Schwarz gegen `#1C1C1E`). Velum trifft den Hellwert auf drei
Nachkommastellen — und bleibt im Dunkeln mit 1,089:1 **darunter**. Im Dunkelmodus
stehen Velums Karten flacher auf ihrem Grund als Apples.

---

## 4 · Die Befunde nach Schwere

Nicht 622 Befunde, sondern **wenige Bausteine, die vielfach vorkommen.** So sind
sie hier gruppiert; die Einzelmeldungen stehen dahinter.

### Schwer — 46 Elemente, die im unmarkierten Bild nicht als Bedienelement lesbar sind

| # | Ursache | Anzahl | Wo | vorher |
|---|---|--:|---|--:|
| **N1** | **Graph-Knoten** — `<button class="gn">` ohne Fläche, ohne Rand, ohne Chevron; das sichtbare Zeichen ist ein 6-pt-`<circle>` im SVG, den kein Merkmalstest sieht | **33** | `graph` iPad (23), iPhone (10) | *nicht gezählt* |
| **N2** | **Chip im Knopf statt Chip als Knopf** — 468×44-pt-`<button>`, dessen einziges Zeichen ein `<span class="chip--ghost">` mit 1,46:1 ist | **1** | `journal-home` iPad | 0 |
| S3 | Datumsleiste ohne Fläche: sechs von sieben Tagen tragen nur Text | **6** | `best-of/tasks` iPad | 6 → **8 waren es, zwei sind über `--line-tap` weggefallen** |
| S5 | Terminzeilen ohne Kreis und ohne Kante | **4** | `best-of/today` iPad + iPhone | 4 |
| S7 | Gliederungszeilen in der Notizen-Seitenspalte | **2** | `best-of/notes` iPad | 2 |

**Erledigt und aus der Tabelle verschwunden:**

| # | war | Anzahl | wodurch |
|---|---|--:|---|
| S1 | `.btn--quiet` ohne jedes Merkmal | **13 → 0** | `system.css` §6 gibt der Klasse `inset 0 0 0 1px var(--line-tap)` — 3,29:1. Eine Regel, 24 Vorkommen, 13 schwere Befunde weg, davon 8 in `best-of`, das niemand angefasst hat |
| S2 | Inhaltsverzeichnis im Notiz-Editor | **4 → 0** | alle fünf Einträge tragen jetzt eine Zeilenfläche, der aktive zusätzlich Balken und Fettung |
| S4 | Herkunfts-Kette auf `journal-entry` | **2 → 0** | „ENTSTANDEN AUS" und „DARAUS WURDE" haben den Chevron, den `today` schon hatte; die Mittelstation trägt bewusst keinen — sie ist kein Ziel |
| S6 | `/bio` und `/mathe` ohne Symbol | **2 → 0** | beide tragen jetzt dasselbe Tag-Symbol wie ihre Geschwister |
| — | `best-of/journal`, `best-of/flashcards` | **4 → 0** | ausschließlich über `.btn--quiet` |

**34 der 46 stehen in `app-next`, 12 in `best-of` — und 33 der 34 sind die
Graph-Knoten.** Rechnet man `graph` heraus, hält `app-next` bei 719 geprüften
Bedienelementen **einen** schweren Befund. `best-of` hält bei 314 Elementen
zwölf, ohne dass jemand die Dateien angefasst hätte.

### Mittel — 186 Elemente (hell), zwei Ursachen

| Ursache | Anzahl | vorher |
|---|--:|--:|
| **reine R4-Meldung** — davon 66 der Erledigt-Kreis `.check` (22 pt, in `task-detail` 18 pt) und 24 Chips mit eigener Semantik (24–28 pt) | 102 | 97 |
| **R2** — weder Fläche noch Rand noch Leistenlage, aber ein Symbol oder ein Chevron trägt es: `.chain__link`, tappbare Karten, `.iconbtn` außerhalb einer Leiste, die Graph-Knoten | 84 | 64 |

Die häufigsten Bausteine im Mittelfeld: `.check` 66 · `<button>` ohne Klasse 45
· `.chip` 24 · `.navitem` 11 · `.row` 8 · `.btn` 7 · `.iconbtn` 7 ·
`.klammer__quelle` 4.

### Leicht — 390 Elemente, ausnahmslos R4 zwischen 32 und 44 pt

| Kleinste Kante | Anzahl | vorher |
|---|--:|--:|
| 40–43 pt | 234 | 216 |
| 36–39 pt | 26 | 49 |
| 32–35 pt | 130 | 144 |

**Die 547 R4-Meldungen sind zehn Bausteine** (vorher 575 aus sieben), verteilt
über alle Schweregrade:

| Baustein | Maß | Meldungen | vorher |
|---|--:|--:|--:|
| `.navitem` (Sidebar-Zeile) | 40 pt | 228 | 228 |
| `.btn` / `.btn--sm` | 34 pt | 83 | 84 |
| `.check` | 22 pt / 18 pt | 66 | 67 |
| `<button>` ohne Klasse, inline gemessen | 25–40 pt | 56 | 64 |
| `.chip` | 26–32 pt | 24 | — |
| `.iconbtn` mit Inline-Maß | 38 / 34 / 26 pt | 20 | 39 |
| `.segmented button.is-on` | 32 pt | 17 | — |
| `.handoff__btn` | 34 pt | 17 | — |
| **`.gn` (Graph-Knoten)** | 84×32 pt | **14** | *nicht gezählt* |
| `.row` in schmalen Fassungen | 32–43 pt | 14 | 25 |

`.navitem` allein stellt weiter 228 Meldungen: eine Sidebar-Zeile ist 40 pt
hoch, nicht 44. **Punkt 8 der alten Aufgabenliste ist nicht angefasst worden,
Punkt 2 ebenfalls nicht** — `.check` misst unverändert 22 pt an 66 Stellen,
obwohl `tasks.html` den 44-pt-Griff seit dem letzten Lauf vorführt. Die Zahl
ist groß und der Befund ist klein — genau deshalb steht die Verteilung hier und
nicht nur die Summe.

---

## 5 · Die fünf schlimmsten

### 1 · Die Graph-Knoten sind jetzt Bedienelemente — und immer noch nicht lesbar

Der größte Einzelposten des letzten Laufs ist zur Hälfte erledigt. `graph.html`
meldete 29 geprüfte Bedienelemente, **keines davon ein Knoten**; die Objekte
waren `<circle>` plus `<text>` ohne `role`, ohne `tabindex`. Sie sind jetzt
`<button class="gn">` mit `aria-label`. **Für VoiceOver, Full Keyboard Access
und Switch Control ist der Screen damit von leer auf vollständig gesprungen** —
das ist die wichtigste einzelne Verbesserung dieser Runde und sie steht in
keiner Summe, weil ein Test, der Affordanz misst, Erreichbarkeit nicht belohnt.

Gemessen wird jetzt, was vorher unsichtbar war, und das Ergebnis ist hart:
**33 der 46 schweren Befunde sind Graph-Knoten**, 23 auf dem iPad, 10 auf dem
iPhone. Jeder misst `flKontrast 1,00` und `randKontrast 1,00` — der Knopf ist
vollständig durchsichtig.

Der Verdacht liegt nahe, dass hier das Werkzeug irrt: das sichtbare Zeichen des
Knotens ist ein 6-pt-Modulpunkt, gezeichnet als `<circle>` **im** Knopf, und
`background-color` findet den nicht. **Das markierte Bild widerlegt den
Verdacht.** Links, ohne Markierung, lesen sich „Analysis II", „Semesterplan",
„Zellkultur-Skizze" als *Beschriftungen in einem Diagramm*. Der Modulpunkt sitzt
darüber und liest sich als **Datenpunkt**, nicht als Bedienzeichen — er sagt
„das hier ist eine Notiz", nicht „das hier kannst du drücken". Auf jedem anderen
Screen steht derselbe 6-pt-Punkt neben Text, den man **nicht** drücken kann.

Dazu ein Befund, den erst der Rahmen zeigt: **das Ziel ist die Beschriftung,
nicht der Punkt.** Die grünen Kästen liegen auf den Wörtern (84×32 pt), der
Punkt liegt außerhalb. Wer auf das zielt, was wie der Knoten aussieht, trifft
nichts.

![graph iPad](../mockups/_renders/affordanz/app-next-graph-ipad.png)

### 2 · Der Chip im Knopf — ein Befund, eine Regel, `journal-home`

Der einzige neue schwere Befund in `app-next`, und er ist klein genug, dass man
ihn ernst nehmen muss. `journal-home.html` Zeile 316:

```html
<button …>   <!-- 468 × 44 pt, ohne Klasse, ohne Fläche -->
  <span class="chip chip--ghost"><span class="ico" data-ico="plus"></span>11. Nov. nachtragen</span>
  <span …>noch kein Eintrag</span>
</button>
```

Der Knopf ist richtig gebaut: 44 pt hoch, volle Zeilenbreite, ein echtes
`<button>`. Im Bild ist er auch zu sehen — der Chip trägt einen Ring und ein
Plus-Zeichen. **Der Ring ist nur der falsche.** Weil der Chip ein `<span>` ist,
greift die Etiketten-Fassung von `.chip--ghost` mit `--line-2` bei **1,46:1**
statt `--line-tap` bei 3,29:1; und weil das Plus als Textzeichen gesetzt ist,
zählt der Symboltest es nicht.

Der zweite Teil des Befunds ist der ehrlichere: **das Ziel ist 468 pt breit, das
Zeichen 155 pt.** Zwei Drittel der Trefferfläche sehen nach nichts aus. Das ist
kein Fehler des Werkzeugs — es ist genau die Sorte Halbheit, die ein Fremder in
drei Sekunden merkt, und sie kostet `journal-home` sein **Ja** (§7).

### 3 · Die Datumsleiste in `best-of/tasks` — sechs von sieben Tagen ohne Fläche

Der größte verbliebene Posten außerhalb von `graph`, und er steht in Runde-1-
Code, den in dieser Runde niemand anfassen sollte. Sechs `<button>` — „Mo 10",
„Di 11", „Mi 12", „Fr 14" und zwei weitere — tragen nur Text; der siebte, der
heutige, trägt `--accent-soft`. **Der aktive Tag beweist, dass die anderen
tappbar sind, und ist der einzige Beweis.**

Zwei der ursprünglich acht sind ohne Zutun weggefallen, weil sie
`.btn--quiet` waren. Die übrigen sechs brauchen dieselbe Behandlung wie das
Inhaltsverzeichnis in `note-editor`, die es dort inzwischen gibt: eine
Zeilenfläche für alle, ein zweites Merkmal für den aktiven.

### 4 · Der Erledigt-Kreis: 66-mal 22 pt, und die Lösung liegt weiter daneben

Unverändert seit dem letzten Lauf, deshalb steht er wieder hier. `.check` misst
22×22 pt — **66-mal im Bestand, in acht Screens**, und es ist das Bedienelement,
mit dem in einer Aufgaben-App am häufigsten getippt wird. Alle 66 fallen durch
R4, alle 66 sind als **mittel** eingestuft.

`tasks.html` macht es an fünf Stellen richtig:

```html
<button style="width:44px; height:44px; margin:-11px" data-bw="erledigen" …>
  <span class="bw-check"></span>
</button>
```

44 pt Ziel, 22 pt Zeichen, negativer Außenabstand, damit das Layout gleich
bleibt. **Genau dieser Griff fehlt an den anderen 66 Stellen.** Es ist kein
Entwurfsproblem, es ist ein nicht zu Ende geführter Umbau — die Lösung steht
seit zwei Runden in derselben Datei.

Dasselbe gilt für `.navitem`: 40 statt 44 pt, **228 Meldungen**, eine Zeile CSS.
Zusammen sind das 294 der 547 R4-Meldungen aus zwei Zahlen.

### 5 · Der Wiki-Link trägt weiter die Etikettenlinie

`note-editor.html`, jetzt an **drei** Stellen (Zeilen 225, 644, 860 — vorher
zwei):

```html
<a href="#" style="… box-shadow: inset 0 -1.5px 0 var(--line-2)">[[Osmose]]</a>
```

Die Unterstreichung ist da, R3 ist erfüllt, der Befund ist formal nur *leicht* —
und er ist trotzdem der schärfste Einzelbefund des Dokuments geblieben, **weil
er gegen die eigene Regel verstößt.** `--line-2` hält 1,46:1; `--line-tap` ist
eigens für „umrandet ein Bedienelement ohne eigene Fläche" geschaffen und hält
3,29:1. Im Ausschnitt sieht man es sofort: die Linie unter `[[Osmose]]` ist
heller als der Text, den sie unterstreicht.

Ein Zeichen ist da; es ist nur nicht zu sehen. Punkt 5 der alten Aufgabenliste,
zwei Zeichen Arbeit, **nicht gemacht** — und in der Zwischenzeit ist eine dritte
Fundstelle dazugekommen.

---

## 6 · Was der Test nicht sieht

Vier Grenzen. Sie stehen hier, weil ein Nachweis, der seine eigenen Lücken
verschweigt, kein Nachweis ist.

1. **Er findet nur, was als Bedienelement erklärt ist.** Der größte Fall ist
   erledigt: die 27 Graph-Knoten sind seit dieser Runde `<button>` und damit
   gezählt — das allein erklärt +36 geprüfte Elemente und die gestiegene
   Schwer-Zahl (§3.1). **Was diese Zahl bewegt, sagt mehr über den Umbau des
   Markups als über die Gestaltung.** Weiter nicht gefunden: die Stimmungs-Balken
   und der Energie-Regler auf `journal-entry`, die Teilschritt-Zeilen unter einer
   Aufgabe auf `tasks`, die „verlinkt / erwähnt"-Zeilen in der Editor-Seiten-
   spalte. **Ein Element, das weder Semantik noch Bedien-Klasse trägt, taucht in
   keiner Zahl dieses Dokuments auf.**
   
   **Eine zweite Blindstelle hat dieser Lauf gefunden und sie ist nicht
   behoben:** der Test misst `background-color` und `border` des Elements
   **selbst**. Ein Zeichen, das als `<circle>` im SVG **darin** liegt (die
   Graph-Knoten) oder als `<span>` mit eigenem Ring **darin** sitzt
   (`journal-home`, §5.2), zählt nicht als Merkmal des Knopfes. Beide Fälle sind
   nachgesehen worden und beide sind **echte** Befunde geblieben (§5.1, §5.2) —
   aber das war Augenschein, nicht Messung, und beim nächsten Bauteil dieser Art
   kann es anders ausgehen. Wer die Zahl 46 benutzt, muss das mitsagen.
2. **179 + 123 = 302 Elemente tragen Bedien-Optik oder Bedien-Klasse ohne
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

| Screen | Antwort | vorher | Was fehlt |
|---|---|---|---|
| **flashcards-home** | **Ja** | Ja | Nichts. Weiter der sauberste Screen: 0 schwer, 0 mittel auf beiden Geräten. Jeder Knopf hat Fläche, Ring oder Ink. |
| **settings** | **Ja** | Ja | 0 schwer, 0 mittel. Eine Liste aus Zeilen mit Chevron und Schaltern — die Bauform trägt alles. |
| **library** | **Ja** | Ja | Ein Deckel ist ein Deckel. Neu dazu: das Kontextmenü ist gezeichnet (§8.2). |
| **leere-zustaende** | **Ja** | Ja | 0 schwer. Ein leerer Screen mit genau einem Ink-Knopf. |
| **today** | **Ja** | *Fast* | **Aufgestiegen.** Die drei Kettenglieder tragen jetzt `--fill` als eigene Fläche **und** den Chevron — vorher nur den Chevron. Der Signaturmoment findet sich zuerst statt zuletzt. |
| **notes-list** | **Ja** | *Fast* | **Aufgestiegen.** `/bio` und `/mathe` tragen dasselbe Tag-Symbol wie ihre Geschwister. |
| **journal-entry** | **Ja** | *Fast* | **Aufgestiegen.** Die „VERBUNDEN"-Kette hat Chevrons an beiden Zielgliedern; die Mittelstation hat bewusst keinen, weil sie kein Ziel ist. |
| **task-detail** | **Ja** | *Fast* | **Aufgestiegen.** „Ganzen Verlauf zeigen" ist unterstrichen. |
| **review-session** | **Ja** | *Nein* | **Zwei Stufen aufgestiegen, der größte Sprung dieser Runde.** „Zurücklegen · Aussetzen · Bearbeiten" und „Leeren" tragen den `--line-tap`-Ring. Die Karte liest sich jetzt in drei Lautstärken: „Gut" Ink-gefüllt, die drei Bewertungen mit Ring, die drei Verwaltungsknöpfe mit demselben Ring in kleiner. |
| **journal-home** | **Fast** | *Ja* | **Abgestiegen.** „11. Nov. nachtragen" ist ein 468-pt-Knopf, dessen einziges Zeichen ein 155-pt-Chip mit dem **Etiketten**-Ring (1,46:1) ist. Alles andere auf dem Screen liest sich. §5.2. |
| **note-editor** | **Fast** | *Fast* | Die Gliederung rechts ist gelöst — alle fünf Zeilen haben Fläche. Offen bleibt der Wiki-Link `[[Osmose]]`: unterstrichen, aber mit 1,46:1 heller als der Text darüber. §5.5. |
| **tasks** | **Fast** | *Fast* | Zeilen, Kreise, Klammer und Auswahl-Leiste lesen sich. Unverändert unklar: die vier erkannten Marken im Eingabefeld — sie sagen „Antippen zum Ändern" und sind `<span>` mit Etikettenoptik. 10 der 123 Fehlaffordanzen stehen auf diesem Screen. |
| **graph** | **Nein** | *Nein* | Panel, Filter und Zoom sind klar. Die 27 Knoten sind jetzt **erreichbar** (VoiceOver, Tastatur) und immer noch nicht **lesbar**: transparente Knöpfe, deren Zeichen ein 6-pt-Datenpunkt außerhalb der Trefferfläche ist. §5.1. |

**Bilanz `app-next`: 9 × Ja, 3 × Fast, 1 × Nein** — vorher 5 × Ja, 6 × Fast,
2 × Nein.

| | vorher | jetzt |
|---|--:|--:|
| **Ja** | 5 | **9** |
| **Fast** | 6 | **3** |
| **Nein** | 2 | **1** |

Fünf Screens sind aufgestiegen (`today`, `notes-list`, `journal-entry`,
`task-detail`, `review-session`), **einer ist abgestiegen** (`journal-home`),
einer steht still (`graph`).

Für `best-of` (Runde 1, unangetastet, nur von `system.css` erreicht):
`library`, `flashcards` und `journal` **Ja** — die letzten beiden aufgestiegen,
ohne dass jemand die Dateien geöffnet hat; `notes` **Fast**; `today` und `tasks`
**Nein** — bei `tasks` ist weiter die Wochenleiste betroffen, jetzt sechs von
sieben Tagen statt acht Meldungen.

### Die ehrliche Zusammenfassung

Der Entwurf **kann** Affordanz ohne Farbe, und er tut es inzwischen fast
überall. Neun der dreizehn Screens bestehen die Drei-Sekunden-Frage ohne
Einschränkung; **719 Bedienelemente in `app-next`, davon ein einziger schwerer
Befund außerhalb von `graph`.**

Der Beleg dafür, dass es an einem Baustein hing und nicht am Entwurf, steht in
`best-of`: dort hat niemand eine Datei angefasst, und trotzdem sind acht
schwere Befunde verschwunden — weil `.btn--quiet` eine Zeile CSS bekommen hat.
**Eine Klasse, 24 Vorkommen, 13 schwere Befunde weg.** Punkt 1 der alten
Aufgabenliste war richtig gestellt.

Was **nicht** behauptet wird:

- **Die Summe ist gestiegen: 33 → 46 schwer.** Sie ist gestiegen, weil 36
  Bedienelemente dazugekommen sind, die es vorher im Markup nicht gab. Wer die
  beiden Zahlen ohne §3.1 nebeneinanderstellt, liest das Gegenteil dessen, was
  passiert ist — und das ist die Schuld dieses Dokuments, nicht die des Lesers.
- **`graph` ist nicht gelöst, sondern zur Hälfte gelöst.** Erreichbarkeit ja,
  Lesbarkeit nein. 33 von 46 schweren Befunden stehen auf einem Screen.
- **Vier Punkte der alten Aufgabenliste sind unangetastet:** der 44-pt-Griff am
  Erledigt-Kreis (66 Vorkommen), `.navitem` auf 44 pt (228 Meldungen), der
  Wiki-Link auf `--line-tap` (jetzt drei Fundstellen statt zwei), und die Karte
  gegen den Grund im Dunkelmodus (weiter 1,089 gegen Apples 1,234).
- **Die 302 Elemente ohne Semantik sind nicht durchgesehen worden.** 179 tragen
  eine Bedien-Klasse ohne Semantik, 123 eine Bedien-Optik ohne Semantik. Die
  Zahl hat sich um sechs bewegt; die Entscheidung „Knopf oder Etikett" steht
  weiter aus.

### 7.1 · Die dreizehn Screens im Bild

Links unmarkiert, rechts markiert — dieselbe Aufnahme, derselbe Ausschnitt.
Rot = primär · Blau = sekundär · Grün = tertiär · Violett gestrichelt =
Bedien-Optik ohne Semantik. Halo = schwerer Befund. Der Dunkelmodus und die
sechs `best-of`-Screens stehen in der Tabelle in §10.

#### today — **Ja** *(vorher Fast)*

Die Kettenglieder tragen jetzt eigene Fläche **und** Chevron.

![today iPad](../mockups/_renders/affordanz/app-next-today-ipad.png)

![today iPhone](../mockups/_renders/affordanz/app-next-today-iphone.png)

#### library — **Ja**

Ein Deckel ist ein Deckel. 0 schwer, 0 mittel auf dem iPad (hell).

![library iPad](../mockups/_renders/affordanz/app-next-library-ipad.png)

![library iPhone](../mockups/_renders/affordanz/app-next-library-iphone.png)

#### notes-list — **Ja** *(vorher Fast)*

`/bio` und `/mathe` tragen jetzt dasselbe Tag-Symbol wie ihre Geschwister.

![notes-list iPad](../mockups/_renders/affordanz/app-next-notes-list-ipad.png)

![notes-list iPhone](../mockups/_renders/affordanz/app-next-notes-list-iphone.png)

#### note-editor — **Fast**

Die Gliederung ist gelöst — alle fünf Zeilen mit Fläche. Offen: der Wiki-Link bei 1,46:1.

![note-editor iPad](../mockups/_renders/affordanz/app-next-note-editor-ipad.png)

![note-editor iPhone](../mockups/_renders/affordanz/app-next-note-editor-iphone.png)

#### journal-home — **Fast** *(vorher Ja)*

Der 468-pt-Knopf „11. Nov. nachtragen" zeigt sein Zeichen auf 155 pt — und im Etiketten-Ring.

![journal-home iPad](../mockups/_renders/affordanz/app-next-journal-home-ipad.png)

![journal-home iPhone](../mockups/_renders/affordanz/app-next-journal-home-iphone.png)

#### journal-entry — **Ja** *(vorher Fast)*

Die „VERBUNDEN"-Kette trägt Chevrons an beiden Zielgliedern.

![journal-entry iPad](../mockups/_renders/affordanz/app-next-journal-entry-ipad.png)

![journal-entry iPhone](../mockups/_renders/affordanz/app-next-journal-entry-iphone.png)

#### tasks — **Fast**

Zeilen, Kreise, Klammer und Auswahl-Leiste lesen sich; die erkannten Marken im Eingabefeld nicht.

![tasks iPad](../mockups/_renders/affordanz/app-next-tasks-ipad.png)

![tasks iPhone](../mockups/_renders/affordanz/app-next-tasks-iphone.png)

#### task-detail — **Ja** *(vorher Fast)*

„Ganzen Verlauf zeigen" ist unterstrichen und damit als Knopf lesbar.

![task-detail iPad](../mockups/_renders/affordanz/app-next-task-detail-ipad.png)

![task-detail iPhone](../mockups/_renders/affordanz/app-next-task-detail-iphone.png)

#### flashcards-home — **Ja**

Der sauberste Screen: jeder Knopf hat Fläche, Ring oder Ink. 0 schwer, 0 mittel.

![flashcards-home iPad](../mockups/_renders/affordanz/app-next-flashcards-home-ipad.png)

![flashcards-home iPhone](../mockups/_renders/affordanz/app-next-flashcards-home-iphone.png)

#### review-session — **Ja** *(vorher Nein)*

„Zurücklegen · Aussetzen · Bearbeiten" und „Leeren" tragen den `--line-tap`-Ring. Drei Lautstärken auf einer Karte.

![review-session iPad](../mockups/_renders/affordanz/app-next-review-session-ipad.png)

![review-session iPhone](../mockups/_renders/affordanz/app-next-review-session-iphone.png)

#### graph — **Nein**

Die 27 Knoten sind jetzt Bedienelemente — jeder Rahmen im rechten Bild trägt einen Halo. Erreichbar, nicht lesbar.

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
Textelements in allen 13 Screens, iPad und iPhone — **1 958 Elemente**, vorher
1 627. Der Zuwachs ist derselbe wie in §1: die Screens tragen mehr Inhalt,
`graph` allein 33 beschriftete Knoten mehr.

| erste Familie der Kaskade | Elemente | vorher |
|---|--:|--:|
| `-apple-system` (SF Pro Text) | 1 841 | 1 545 |
| `New York` | 73 | 70 |
| `SF Mono` | 44 | 12 |

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

**Zeilenhöhen — hier gibt es Abweichungen, und sie sind mehr geworden: 121 von
1 958 (6,2 %), vorher 82 von 1 627 (5,0 %).**

| Abweichung | Anzahl | vorher | Bewertung |
|---|--:|--:|---|
| `.btn`-Varianten mit `line-height: 1` (17/17, 15/15) | 63 | 61 | **richtig.** Ein Knopf ist eine einzeilige Zeilenbox; `line-height: 1` zentriert sie. 23 pt Zeilenhöhe in einem 34-pt-Knopf wäre der Fehler. |
| `.count__n num` bei 20/24 statt 20/26 | **45** | 14 | **Befund, und er ist gewachsen.** Eine Kennzahl ist Text wie jeder andere; für 24 statt 26 gibt es keinen Grund. Die Zahl hat sich mehr als verdreifacht, während der Bestand um 20 % gewachsen ist — das Muster ist beim Bauen kopiert worden. |
| `.t-label c-3` bei 13/12 · 13/14 · 13/15 · 13/17, inline gesetzt | **10** | 6 | **Befund.** Vier verschiedene inline gesetzte Zeilenhöhen auf einer einzigen Textgröße, alle ohne Notwendigkeit. |
| `num` einzeln mit `line-height: 1` | 2 | 1 | Befund, minimal. |
| **`.serif--cover-title` bei 13/18** | **1** | — | **Neu.** Die einzige Serif-Rolle mit einer eigenen Zeilenhöhe. Eine Fundstelle, aber sie steht in der Rolle, die 22-mal vorkommt. |

**Serif — die sieben Rollen, gezählt im Bild:**

| Rolle | Vorkommen | vorher |
|---|--:|--:|
| `serif--cover-title` | 22 | 21 |
| `serif--screen-title` | 21 | 20 |
| `serif--empty-title` | 10 | 10 |
| `serif--quote` | 7 | 6 |
| `serif--voice` (Journal-Fließtext) | 6 | 6 |
| `serif--journal-date` | 5 | 5 |
| `serif--wordmark` | 2 | 2 |
| **blankes `.serif`** | **0** | **0** |

Der Nachtrag N1 der DNA ist damit nachprüfbar umgesetzt: New York steht an
genau sieben benannten Orten und nirgends sonst. 73 Elemente von 1 958 —
**3,7 %** der Textelemente tragen die Serif, vorher 4,3 %. Sie ist Stimme, nicht
Textur, und sie ist relativ leiser geworden, weil die Screens gewachsen sind.

### 8.2 Navigation

| Muster | Stand | Beleg |
|---|---|---|
| **Sidebar auf iPad** | ✅ 12 von 13 Screens | Ausnahme `review-session`: eine Lernsitzung ist ein Vollbild-Modus, iOS entfernt dort die Navigation. Richtig so, und es ist der einzige Screen mit einem `×` links oben. |
| **Tab-Bar auf iPhone** | ✅ 13 von 13 | fünf Einträge, 48 pt hoch, Beschriftung 11 pt, aktiver Zustand über Gewicht **und** Farbe |
| **Kontextmenü** | ✅ **neu** — `library.html` + `platform/kontextmenue.html` | `library.html` zeichnet es jetzt aus: „Umbenennen · Duplizieren · Verschieben · Zu Favoriten — Löschen", mit Trennlinie vor der zerstörenden Aktion und `--danger` nur dort. Der alte Befund „wer nur die Screens sieht, sieht das Muster nicht" ist erledigt. Es bleibt bei **einem** von 13 Screens. |
| **Blatt (Sheet)** | ❌ **fehlt** | `grep` findet in `app-next/` kein Blatt mit Griffleiste. Die Klasse `.sheetnote` ist der Erklärkasten unter dem Gerät, kein UI-Blatt. Ein Entwurf mit „Neu"-Knopf auf jedem Screen braucht ein Blatt, und keines ist gezeichnet. |
| **Wischgeste** | ⚠️ nur `review-session` | Dort echt: Zeiger wird erst ab 6 pt gefangen, vier Knöpfe sind der gleichwertige Weg. Auf Listenzeilen (`tasks`, `notes-list`, `journal-home`) ist keine Wischaktion gezeichnet — das klassischste iOS-Listenmuster überhaupt. |
| **Popover** | ⚠️ formfrei | Die Übergabe-Leiste `.handoff` und das Graph-Panel sind popover-artig, aber ohne Zeiger und ohne Systemform. |

**Zwei bewusste Abweichungen vom Standard — die Begründung muss dastehen:**

**Die Ketten-Karte** ist kein iOS-Muster. Sie ist ein waagerechter Faden mit drei
Stationen, an jeder anspringbar. Vorhersehbar bleibt sie, weil sie sich wie eine
Liste verhält: die Stationen stehen in Leserichtung, jede trägt Vorspann, Titel
und Metazeile in derselben Anordnung wie eine Listenzeile, und jede hat einen
Chevron nach rechts. Der Fadenverlauf sagt „von hier nach dort" und ist die
einzige Zutat, die iOS nicht kennt. **Der Test bestätigte die Form und rügte
ihre Lautstärke; die Rüge ist erledigt:** jedes Glied trägt jetzt `--fill` als
eigene Fläche und den Chevron, auf `today` wie auf `journal-entry`. Beide
Screens sind dadurch von *Fast* auf *Ja* gestiegen (§7). Die Abweichung ist
begründet **und** ausgeführt.

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
es sein muss). **Befund, nachgezählt: acht Schlagschatten stehen außerhalb der drei Token.**
`0 1px 3px rgba(22,24,28,.16)` (4×) und `0 1px 2px rgba(22,24,28,.16)` (4×) —
darunter `.segmented button.is-on` und die Kachelkante. Sie sind gegen den
letzten Lauf **auf ein einheitliches Alpha vereinheitlicht** worden (vorher drei
verschiedene Werte), stehen aber weiter inline statt in einem Token.

Nicht mitgezählt sind die 60 `inset`-Schatten: das sind Ringe und
Unterstreichungen, keine Tiefe, und sie hängen fast alle korrekt an einem Token
(`--line`, `--line-2`, `--line-tap`, `--accent-ring`, `--dot-hollow`). Zwei
Ausnahmen bleiben inline: `inset 0 0 0 1px rgba(242,243,245,.10)` (8×) und
`inset 0 0 0 1px rgba(22,24,28,.16)` (6×) — dieselbe Kante, in zwei
handgeschriebenen Fassungen für hell und dunkel, wo ein einziges Token beide
tragen würde.

iOS gibt keine Schattenwerte heraus. Erfinden ist hier unvermeidlich — die
Frage ist nur, ob es an einer Stelle geschieht oder an fünfzehn. Es geschieht an
drei Token plus zwei inline gesetzten Kanten.

### 8.4 Symbole

**Alle 55 Symbole sind gezeichnet, keines ist ein SF Symbol.** Nachgezählt in
`mock.js`: die `ICONS`-Tabelle hat unverändert 55 Einträge.

`mock.js` baut jedes aus einem 24×24-Pfad mit `stroke-width: 1.7`,
`stroke-linecap: round`, `fill: none`. **Im Bild nachgemessen** (jeder
`svg`-Strich in allen 13 Screens, beide Geräte): 1,7 pt mit runder Kappe kommt
auf **allen 13** Screens vor und ist die einzige Symbol-Strichstärke.
**Eine einzige Abweichung im Strichgewicht: `check` steht auf 2.0** — auf
`note-editor`, `tasks`, `review-session` und `settings` gemessen. Begründbar,
weil ein Haken bei 1,7 auf 22 pt zerfällt, aber es ist eine Abweichung und sie
steht nirgends erklärt.

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

| Prüfung | Anforderung | Stand | vorher |
|---|---|---|---|
| CTA-Text auf Ink | ≥ 4,5:1 | 17,77:1 hell · 17,27:1 dunkel ✅ | gleich |
| Rand eines Bedienelements (`--line-tap`) | ≥ 3:1 | 3,29:1 · 3,34:1 ✅ | gleich |
| Ghost-Chip als Knopf | ≥ 3:1 | 3,20–3,34:1 ✅ | gleich |
| **`.btn--quiet`** — neu mit Ring | ≥ 3:1 | **3,29:1 ✅ (war: kein Rand)** | ❌ |
| **Ghost-Chip *im* Knopf** (`journal-home`) | ≥ 3:1 | **1,46:1 ❌ (neu)** | — |
| Karte gegen Grund | Apple: 1,12 / 1,23 | 1,118 ✅ · **1,089 ⚠️** | gleich, nicht angefasst |
| Unterstreichung des Wiki-Links | ≥ 3:1 | **1,46:1 ❌**, jetzt an 3 statt 2 Stellen | gleich, nicht angefasst |

Der letzte Punkt ist der schärfste Einzelbefund des ganzen Dokuments geblieben,
weil er gegen die eigene Regel verstößt — und er ist in dieser Runde **nicht
angefasst** worden, während eine dritte Fundstelle dazugekommen ist.
`note-editor.html` Zeile 225, 644 und 860:

```html
<a href="#" style="… box-shadow: inset 0 -1.5px 0 var(--line-2)">[[Osmose]]</a>
```

Der Wiki-Link im Fließtext trägt eine Unterstreichung — R3 ist erfüllt. Aber sie
steht auf `--line-2` und hält damit **1,46:1**, während das System eigens
`--line-tap` mit **3,29:1** dafür geschaffen hat („umrandet ein Bedienelement
ohne eigene Fläche", `system.css` §1). Ein Zeichen ist da; es ist nur nicht zu
sehen. **Drei** Vorkommen, Wechsel des Tokens genügt.

Derselbe Fehlgriff, dasselbe Token, an einer zweiten Stelle: der Ghost-Chip in
`journal-home` (§5.2). `--line-2` ist inzwischen zweimal dort im Einsatz, wo
`--line-tap` hingehört. Es ist keine Nachlässigkeit an einer Stelle mehr,
sondern ein Muster.

---

## 9 · Was zu tun ist

Der Stand der alten Liste zuerst, damit sichtbar bleibt, was diese Runde
geleistet hat und was liegen geblieben ist.

| alt | Aufgabe | Stand |
|---|---|---|
| 1 | `.btn--quiet` bekommt ein Merkmal | ✅ **erledigt** — `inset 0 0 0 1px var(--line-tap)`, 3,29:1. 24 Vorkommen, 13 schwere Befunde weg, 8 davon in `best-of` ohne eine Zeile Screen-Arbeit |
| 2 | Erledigt-Kreis bekommt überall den 44-pt-Griff | ❌ **nicht angefasst** — weiter 66 × 22 pt |
| 3 | `.chain__link` bekommt Chevron und Fläche | ✅ **erledigt** — beide Screens, beide Geräte |
| 4 | Graph-Knoten werden Bedienelemente | 🟡 **halb** — Semantik ja, Affordanz nein (§5.1) |
| 5 | Wiki-Link wechselt auf `--line-tap` | ❌ **nicht angefasst** — und eine dritte Fundstelle dazu |
| 6 | Gliederung im Editor bekommt Flächen | ✅ **erledigt** — alle fünf Zeilen |
| 7 | Die Elemente ohne Semantik durchsehen | ❌ **nicht angefasst** — 302 statt 308 |
| 8 | `.navitem` von 40 auf 44 pt | ❌ **nicht angefasst** — weiter 228 Meldungen |
| 9 | Ein Blatt zeichnen | ❌ **nicht angefasst** — `grep` findet in `app-next/` weiter kein Blatt mit Griffleiste |
| 10 | Karte gegen Grund im Dunkelmodus anheben | ❌ **nicht angefasst** — weiter 1,089 |

**Sechs von zehn stehen noch, und vier davon sind je eine Zeile Arbeit.** Neu
sortiert nach Wirkung:

1. **Die Graph-Knoten bekommen ein Bedienzeichen.** 33 der 46 schweren Befunde,
   ein Screen. Der Punkt bleibt das Zeichen für „hier ist ein Objekt"; das
   Zeichen für „das kannst du drücken" fehlt und muss die **Beschriftung**
   tragen, weil sie das Ziel ist: eine Zeilenfläche unter dem Wort, ein Ring,
   oder die Beschriftung in eine Chip-Fläche gesetzt. Nebenher fällt R4 weg,
   wenn die Fläche auf 44 pt Höhe kommt.
2. **`--line-2` → `--line-tap` an zwei Stellen.** Der Wiki-Link (3 Vorkommen)
   und der Ghost-Chip in `journal-home` (§5.2). Zwei Tokenwechsel, ein schwerer
   Befund weg, der schärfste Kontrastbefund des Dokuments weg.
3. **Der Erledigt-Kreis bekommt den 44-pt-Griff**, den `tasks.html` seit zwei
   Runden vorführt. 66 Vorkommen, 66 mittlere Befunde.
4. **`.navitem` von 40 auf 44 pt.** Eine Zeile CSS, 228 der 547 R4-Meldungen.
   Zusammen mit Punkt 3 fallen 294 weg — mehr als die Hälfte.
5. **Die Datumsleiste in `best-of/tasks`** bekommt, was das Inhaltsverzeichnis
   in `note-editor` schon hat: eine Zeilenfläche für alle sieben Tage. 6 schwere
   Befunde.
6. **Die Terminzeilen in `best-of/today`** bekommen Kreis oder Kante. 4 schwere
   Befunde. Danach hat `best-of` nur noch die zwei Gliederungszeilen.
7. **Die 302 Elemente ohne Semantik werden durchgesehen** und in zwei Stapel
   sortiert: Knopf oder Etikett. Der zweite Stapel legt seine Chip-Fläche ab.
   Auf `tasks` allein sind es 10, und sie stehen unter der Beschriftung
   *„Antippen zum Ändern"*.
8. **Ein Blatt zeichnen.** Der „Neu"-Knopf führt auf jedem Screen ins Leere.
9. **Karte gegen Grund im Dunkelmodus** von 1,089 auf ≈ 1,23 anheben.
10. **`.count__n` auf 20/26 und die vier `.t-label`-Zeilenhöhen einsammeln.**
    56 Abweichungen, und sie sind in dieser Runde mehr geworden, nicht weniger
    (§8.1).

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
Konsole aus. Die Zahlen dieses Dokuments stammen aus einem Lauf vom **9. August 2026,
nach dem Umbau von `system.css` und allen 13 Screens**; jeder spätere Lauf
gegen dieselben Dateien liefert sie wieder. Die kursiven Vergleichswerte
stammen aus dem Lauf davor.

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
