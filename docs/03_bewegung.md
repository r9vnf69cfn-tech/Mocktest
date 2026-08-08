# 03 · Bewegung

Vier Rollen, fünf Momente, ein Reduce-Motion-Pfad je Bewegung.
Gebaut in `mockups/shared/bewegung.css` und `mockups/shared/bewegung.js`.
Laufend zu sehen in `mockups/motion/index.html` (Musterseite) und
`mockups/motion/onboarding.html` (die ersten 30 Sekunden).

---

## 0 · Der Grundsatz

**Bewegung nur, wo sie etwas erklärt: Herkunft, Fortschritt, Zustandswechsel.**
Alles andere steht still. §7 zählt auf, was deshalb *nicht* bewegt wird, und
warum — das ist der Teil dieses Dokuments, an dem sich der Rest messen lassen
muss.

Zwei Regeln aus Velums eigener März-Spec §9 bleiben in Kraft und werden hier
nur präzisiert:

* Feder für alles Körperliche (Ort, Größe, Drehung), `easeInOut` nur für
  Deckkraft und Farbe.
* Nie `linear`. Die einzige Ausnahme ist technisch, nicht gestalterisch: der
  Flug auf dem Faden (§4.1) ist eine Punktfolge, in die die Kurve bereits
  eingerechnet wurde; die Animation selbst läuft dann gleichförmig durch die
  Punkte. Die Kurve steckt in den Punkten, nicht in der Zeit.

---

## 1 · Die Übersetzung: Feder → cubic-bezier

Velums März-Spec §9 beschreibt Bewegung in SwiftUI-Federn. Ein Mockup läuft im
Browser und kennt keine Federn. Die Übersetzung ist gerechnet, nicht geschätzt.

### 1.1 Wie gerechnet wurde

Die Sprungantwort einer Feder `.spring(response:, dampingFraction:)` mit
Anfangsgeschwindigkeit 0:

```
ω   = 2π / response
ζ   = dampingFraction
ω_d = ω · √(1 − ζ²)

x(t) = 1 − e^(−ζωt) · ( cos(ω_d t) + ζ/√(1−ζ²) · sin(ω_d t) )
```

**Zeitfenster.** Eine Feder wird mathematisch nie fertig. Das Fenster endet bei
**2 % Restweg**: `T = −ln(0,02) / (ζω)`, danach auf 20 ms gerundet.
Was danach von der Feder übrig wäre, fällt weg — die Bézier landet exakt auf 1.
Bei der längsten Strecke im System (Übergabe, ~420 pt) sind das 8 pt, die in
den letzten 40 ms statt in weiteren 170 ms zurückgelegt werden. Genau diese
Straffung unterscheidet eine Bedienoberfläche von einer Physiksimulation.

**Anpassung.** Vier freie Parameter (`x1, y1, x2, y2`), Nelder-Mead mit acht
Startpunkten, 120 Stützstellen, Zielgröße das quadratische Mittel der
Abweichung. `y1` und `y2` dürfen über 1 hinaus — nur so lässt sich ein
Überschwingen abbilden. `x1` und `x2` bleiben in [0, 1], wie CSS es verlangt.

### 1.2 Die Tabelle

| Feder | response / damping | Einschwingzeit → Fenster | cubic-bezier | Fehler (RMS) | Überschwingen Feder → Bézier |
|---|---|---|---|---|---|
| `springQuick`    | 0,25 / 0,85 | 183,1 ms → **180 ms** | `cubic-bezier(.239,.071,.325,.913)`   | 0,36 % | 0,63 % → 0 % |
| `springStandard` | 0,40 / 0,80 | 311,3 ms → **320 ms** | `cubic-bezier(.216,.052,.330,1.110)`  | 0,33 % | 1,52 % → 0,80 % |
| `springBouncy`   | 0,50 / 0,65 | 478,9 ms → **480 ms** | `cubic-bezier(.280,.224,.224,1.370)`  | 0,76 % | 6,81 % → 7,30 % |
| `springGentle`   | 0,60 / 0,90 | 415,1 ms → **420 ms** | `cubic-bezier(.271,.115,.268,.755)`   | 0,92 % | 0,15 % → 0 % |
| `quick` (easeInOut 150 ms)    | — | **150 ms** | `cubic-bezier(.42,0,.58,1)` | 0 % | 1 : 1 übernommen |
| `standard` (easeInOut 300 ms) | — | **300 ms** | `cubic-bezier(.42,0,.58,1)` | 0 % | 1 : 1 übernommen |

Fehler ohne den Endpunkt gerechnet (bis x = 0,95), also reiner Formfehler:
0,76 % · 0,70 % · 1,45 % · 2,30 %.

Zwei Zahlen fallen dabei mit Werten zusammen, die schon in `system.css` stehen —
das ist kein Zufall, sondern die Bestätigung, dass die Fundament-Runde richtig
geschätzt hat: `springQuick` = 180 ms = `--t-fast`, `springGentle` = 420 ms =
`--t-hand`.

### 1.3 Wo die Übersetzung nicht aufgeht

**(a) Das Unterschwingen nach dem Überschwingen.**
`springBouncy` (ζ = 0,65) schwingt um 6,81 % über und danach um 0,46 % unter.
Eine `cubic-bezier` kann das Überschwingen (7,30 %), nicht aber die zweite,
gegenläufige Auslenkung — sie kehrt einsinnig zurück.
*Was stattdessen geschieht:* nichts. Zwei verkettete Animationen könnten das
Unterschwingen nachbauen; sie werden bewusst nicht verkettet. Es fiele in
dieselben 60 ms, in denen bei der Übergabe der Zähler hochzählt, und zwei
Bewegungen an derselben Stelle heben sich gegenseitig auf. 0,46 % von 420 pt
sind 1,9 pt — der Preis ist kleiner als der Schaden.

**(b) Die Geschwindigkeit beim Loslassen.**
Eine Feder nimmt die Wurfgeschwindigkeit auf. Eine `cubic-bezier` hat eine
feste Anfangssteigung (`3·y1/x1` je Zeiteinheit) und kann das grundsätzlich
nicht.
*Was stattdessen geschieht:* Die Geschwindigkeit wandert in die **Dauer**.
Beim Wischen einer Lernkarte misst `bewegung.js` die Zeigergeschwindigkeit der
letzten Bewegung in pt/ms und rechnet

```
Dauer = 480 ms − min(1; v / 1,2 pt·ms⁻¹) · 220 ms      →  260 … 480 ms
```

Dieselbe Kurve, andere Länge. Das ist keine Feder — aber der Unterschied
zwischen einem Wurf und einem Legen bleibt spürbar, und das war der Zweck.

---

## 2 · Die vier Rollen

| Rolle | Dauer | Kurve | Zweck |
|---|---|---|---|
| **Öffnen** | 320 ms | `springStandard` | Dokument, Detail |
| **Wechseln** | 180 ms hinaus / 180 ms herein, 60 ms Überlappung (300 ms) | `springQuick` | Modul, Ansicht |
| **Übergeben** | 780 ms in drei Sätzen | `springBouncy` (Flug) + `--t-hand` (Faden) | Modul zu Modul — Velums Signatur |
| **Bestätigen** | 180 ms + 1000 ms Verweildauer + 240 ms + 260 ms | `springQuick` | erledigt, gespeichert, bewertet |

### 2.1 Öffnen · 320 ms · `cubic-bezier(.216,.052,.330,1.110)`

Die Frage, die diese Bewegung beantwortet: **Woher kommt das hier?**

Was sich bewegt:

| Eigenschaft | von | nach |
|---|---|---|
| Ort (links / oben) | Rechteck der Ursprungskarte | Rechteck des Ziels |
| Breite / Höhe | Kartenmaß | Zielmaß |
| Eckradius | 14 pt | 0 pt (bzw. der Radius des Ziels) |
| Deckkraft der Umgebung | 1 | 0,55 (160 ms, `easeInOut`) |
| Inhalt des Ziels | Deckkraft 0 → 1, ab 55 % der Zeit, 160 ms | |

**Breite und Höhe, nicht `scale`.** Ein skaliertes Rechteck zieht seinen
Eckradius und sein Coverbild mit; eine Bibliothekskarte von 132 × 168 pt, die
auf 640 × 700 pt skaliert, hat am Ende einen Radius von 48 pt und ein
gestauchtes Papier. Die Eigenschaften einzeln zu animieren kostet
Kompositionsleistung und ist hier die richtige Wahl, weil das Bild sonst lügt.

### 2.2 Wechseln · 180 ms · `cubic-bezier(.239,.071,.325,.913)`

Die Frage: **Bin ich vor oder zurück gegangen?**

Was sich bewegt: Deckkraft 1 → 0 und 0 → 1, dazu ein Versatz von **8 pt** in
Laufrichtung (`--bw-richtung: 1 | -1`). Die eintretende Ansicht startet 120 ms
nach dem Beginn der austretenden — 60 ms Überlappung, damit nie ein leerer
Rahmen zu sehen ist.

Kein Maßstab, kein Schatten, keine Blende. Eine Ansicht ist kein Gegenstand,
der auffliegt.

### 2.3 Übergeben · 780 ms · Velums Signatur

Drei Sätze. Die Zeiten sind absolut ab dem Tap.

| ab | bis | Satz | Kurve | Was sich bewegt |
|---|---|---|---|---|
| 0 | 180 | Verdichten | `springQuick` | Breite/Höhe der Auswahl → Kartenmaß (176 × 96 pt); Eckradius 8 → 11 pt; der Absatz geht auf Deckkraft 0,32 |
| 120 | 600 | Flug | `springBouncy` | Ort **auf dem Fadenpfad**; Maßstab 1 → 0,42 (mit 7,3 % Überschwingen); Drehung −4° → 0° |
| 120 | 540 | Faden | `--t-hand` 420 ms, `--ease-spring` | Weglänge 0 → voll (`stroke-dashoffset`), Richtung Ursprung → Ziel |
| 600 | 780 | Ankunft | `springQuick` | Zähler +1 (alte Ziffer −100 %, neue von +100 %); Zielpunkt hohl → Ink-Ring; Zielkachel auf `--accent-soft`; Flugkarte Deckkraft → 0 in 140 ms; Absatz zurück auf 1 |

Zwei Entscheidungen darin sind nicht selbstverständlich:

**Die Karte fliegt auf dem Faden, nicht daneben.** Die Bahn wird nicht
erfunden. `bewegung.js` liest sie Punkt für Punkt aus dem SVG-Pfad, den
`MOCK.thread()` gespannt hat (`path.getPointAtLength()`). Der Faden ist damit
nicht die Illustration der Bewegung, sondern ihre Fahrbahn — und beide können
gar nicht auseinanderlaufen. Nur die letzten 28 % zieht die Bahn quadratisch
gewichtet zur Mitte der Zielkachel: der Faden endet dort, wo ein Faden enden
muss, am Rand des Objekts; die Karte legt sich hinein.

**Der Faden ist 60 ms vor der Karte am Ziel** (540 gegen 600 ms). Erst liegt
der Weg, dann kommt, was ihn geht. Umgekehrt sähe der Faden aus wie eine Spur
— also wie Dekoration hinter einem fliegenden Objekt, statt wie die Beziehung,
die durch die Übergabe entsteht.

Der Absatz kehrt am Ende auf volle Zeichnung zurück. Er hat etwas abgegeben,
er ist nicht selbst fort; bliebe er blass, hieße das „nicht mehr hier", und
das wäre falsch.

### 2.4 Bestätigen · 180 ms + 1000 ms + 240 ms + 260 ms

| ab | bis | Was |
|---|---|---|
| 0 | 180 | Haken: `stroke-dashoffset` 15 → 0, Kreisfüllung `scale` 0,72 → 1, Ring 1,5 → 0 pt. Der Haken startet 60 ms nach der Füllung. |
| 0 | 180 | Gleichzeitig am anderen Ende des Herkunftsfadens: die Notiz, aus der die Aufgabe stammt, wird aktiv. |
| 180 | 1180 | **Verweildauer.** Nichts bewegt sich. |
| 1180 | 1420 | Zeile: Deckkraft 1 → 0, 16 pt nach rechts |
| 1420 | 1680 | Lücke: Höhe, Innenabstand und Außenabstand auf 0 |

Die 1000 ms Verweildauer sind der Grund, warum Velum kein
„Rückgängig"-Banner braucht: **die Pause ist das Rückgängig.** Die Zeile steht
noch da, man kann sie zurücknehmen. Ein Banner wäre eine zweite Erfindung für
dasselbe Problem.

Die gleichzeitige Wirkung in der Notiz ist die Stelle, an der Velums
Datenmodell sichtbar wird: keine reine Aufgaben-App kann sie zeigen, weil
keine das andere Ende des Fadens hat.

---

## 3 · Die fünf Momente — und wie man sie auslöst

Alle fünf laufen in `mockups/motion/index.html`. Runde 3 braucht **keine Zeile
JavaScript**, um sie in die Schirme zu holen — nur Attribute. Ein einziger
Zuhörer am Dokument fängt jeden Klick auf `[data-bw]` ab.

Zielangaben sind gewöhnliche CSS-Selektoren; beginnt einer mit `^`, wird er als
`closest()` vom Knopf aus gelesen (`data-bw-zeile="^.row"`).

### 3.1 Übergabe — Auswahl wird Lernkarte

```html
<button data-bw="uebergeben"
        data-bw-von="#absatz-7"          <!-- Pflicht: der Ursprung -->
        data-bw-nach="#kachel-karten"    <!-- Pflicht: das Ziel     -->
        data-bw-zaehler="#karten-zahl"   <!-- .bw-zaehler, zählt +1  -->
        data-bw-punkt="#karten-punkt"    <!-- .dot, bekommt den Ring -->
        data-bw-box="#buehne"            <!-- Bezugsrahmen, sonst automatisch -->
        data-bw-kurve="34">              <!-- Auslenkung des Fadens in pt -->
  In Lernkarten
</button>
```

```js
MOTION.uebergeben({ von, nach, zaehler, punkt, box, kurve, text, breite, hoehe })
  // → Promise, löst nach 780 ms auf; liefert { faden }
```

### 3.2 Erledigen

```html
<button data-bw="erledigen"
        data-bw-zeile="^.row"        <!-- Pflicht -->
        data-bw-kreis=".bw-check"    <!-- sonst der erste .bw-check in der Zeile -->
        data-bw-echo="#absatz-3">    <!-- das andere Ende des Herkunftsfadens -->
```

```js
MOTION.erledigen({ zeile, kreis, echo, faden })   // faden = Rückgabe von MOTION.faden()
  // → Promise, löst nach 1680 ms auf
```

Der Kreis braucht die Klasse `.bw-check`; `bewegung.js` füllt ihn beim Start
mit dem SVG. `.check` aus `system.css` bleibt unangetastet — er ist aus zwei
Rändern gebaut und kann alles außer sich zeichnen.

### 3.3 Karte bewerten

```html
<button data-bw="drehen"  data-bw-karte="#karte">Umdrehen</button>

<button data-bw="bewerten" data-bw-karte="#karte"
        data-bw-note="gut"                    <!-- nochmal | schwer | gut | leicht -->
        data-bw-intervalle="#intervallreihe"  <!-- .threadrow mit .dot und .thread -->
        data-bw-zaehler="#sitzungszahl"
        data-bw-naechste="#karte-naechste">Gut</button>
```

```js
MOTION.drehen({ karte })
MOTION.bewerten({ karte, note, intervalle, zaehler, naechste, dauer })
MOTION.wischen({ karte, intervalle, zaehler, naechste })  // hängt Zeiger-Ereignisse ein
MOTION.intervallVorschau(reihe, index)                    // setzt Ring und aktive Stücke
```

Die Karte braucht `.bw-flip` (Perspektive 1200 px) mit `.bw-flip__innen` und
zwei `.bw-flip__seite`; zum Wischen zusätzlich `.bw-wisch`.
Die vier Noten verschieben den Index der Intervall-Reihe:
`nochmal` → 0 · `schwer` → ±0 · `gut` → +1 · `leicht` → +2.

### 3.4 Dokument öffnen

```html
<button data-bw="oeffnen"
        data-bw-von="#buch-zellbiologie"  <!-- die Bibliothekskarte -->
        data-bw-nach="#editor"            <!-- das Ziel, mit hidden -->
        data-bw-huelle="#regal">          <!-- tritt auf 0,55 zurück -->
```

```js
MOTION.oeffnen({ von, nach, huelle })     // → Promise, 320 ms
```

Das Ziel wird kurz sichtbar, aber `visibility: hidden` gemessen, damit sein
Rechteck feststeht, bevor der Zwilling losläuft.

### 3.5 Herkunft zeigen

```html
<button data-bw="herkunft"
        data-bw-ursprung="#notiz-anker"   <!-- Pflicht -->
        data-bw-karte="#karte"            <!-- weicht nach links -->
        data-bw-quelle="#quellpanel"      <!-- kommt von rechts -->
        data-bw-box="#buehne" data-bw-kurve="26"
        aria-expanded="false">
  <span class="origin">aus „Zellbiologie · Vorlesung 7"</span>
</button>

<button data-bw="zurueck">Loslassen</button>
```

```js
const weg = MOTION.herkunft({ chip, ursprung, karte, quelle, box, kurve });
weg.zurueck();     // Quelle hinaus, dann drawBack(), dann destroy()
```

Ablauf: Faden zeichnen (420 ms) → 160 ms halten → Karte −38 % / Quelle herein
(320 ms). Während dieser 320 ms wird der Faden **Bild für Bild nachgerechnet**
(`MOTION.nachfuehren`), weil der Chip auf der Karte sitzt, die gerade weicht —
`MOCK.thread` hört sonst nur auf Anfang und Ende einer Bewegung.
Der Sitzungszähler bewegt sich nicht. Das ist der ganze Unterschied zu
RemNotes „im Dokument zeigen", das die Sitzung verlässt.

Gezeichnet wird mit `MOCK.thread(...).draw()` aus der Fundament-Runde. Es gibt
keinen zweiten Faden.

> **Begründete Abweichung von `dna-kern.md` §2.2.** Dort steht: „In Bewegung
> zeichnet sich der Faden immer vom Ursprung zum Ergebnis, nie umgekehrt."
> Hier läuft der Stift vom **Chip zum Ursprung**, also gegen die Kausalität.
> Der Grund steht im selben Absatz der DNA: „Beim Zurückgehen läuft er
> rückwärts wieder ein." Dies *ist* der Rückweg. Die Bewegung geht vom Finger
> aus; ein Faden, der irgendwo am Bildrand losliefe, wäre keine Antwort auf
> einen Tap. Die Kante im Datenmodell bleibt unverändert Ursprung → Ergebnis,
> nur der Stift läuft sie rückwärts ab — und beim Loslassen zieht er sich zum
> Chip zurück, dorthin, wo der Finger war.

---

## 4 · Die Kleinbewegungen

| Bewegung | Werte | Warum genau so |
|---|---|---|
| **Zeigen** | 180 ms, nur Fläche (`--fill`) | Kein Anheben, kein Vergrößern von Listenzeilen: auf zwanzig Zeilen wäre das ein wanderndes Beben |
| **Zeigen (Karte)** | 180 ms, `scale(1.012)` + `--sh-float` | Eine Karte ist ein Gegenstand und steht einzeln |
| **Drücken** | 120 ms, `scale(.98)` | Die einzige Stelle, an der etwas schrumpft — und der Finger ist der Grund |
| **Laden** | Skelett in der Form des Kommenden, Deckkraft 0,55 ↔ 1 in 1200 ms | Ein Spinner sagt „warte", ein Skelett sagt „so viel wird es". **Kein wandernder Glanz**: der behauptet einen Fortschritt, den niemand kennt |
| **Staffeln** | 36 ms Schritt, höchstens 12 Einträge, je 220 ms, 6 pt nach oben | Bei zwanzig Zeilen wäre die letzte eine halbe Sekunde zu spät, und eine Liste, die tröpfelt, kann man nicht überfliegen |
| **Streak** | Scheibe `scale` 0 → 1 in 300 ms, `springBouncy`; das Fadenstück vom Vortag wird gleichzeitig aktiv | Der Punkt allein wäre eine Zahl; der Faden macht daraus eine Folge |
| **Wellenform** | 26 Balken, `scaleY` 0,35 ↔ 1 in 900 ms, je Balken 70 ms versetzt | Die einzige Dauerbewegung im System. Sie sagt „das Mikrofon hört gerade", und das muss ununterbrochen wahr bleiben |
| **Zähler** | alte Ziffer −100 %, neue von +100 %, 180 ms | Rollt **nur**, wo eine Handlung ihn geändert hat |

---

## 5 · Reduce Motion — ein Pfad je Bewegung

Nicht „wird berücksichtigt", sondern gebaut. Auf beiden Musterseiten
umschaltbar, und die Seite zeigt **beides**: was das Betriebssystem meldet und
was gerade tatsächlich gilt.

### 5.1 Wie der Zustand entsteht

Zwei Quellen, eine Auflösung:

```
data-motion="system"  →  folgt (prefers-reduced-motion: reduce)
data-motion="full"    →  erzwingt volle Bewegung
data-motion="reduce"  →  erzwingt reduzierte Bewegung
```

`bewegung.js` schreibt das Ergebnis als `data-bw-reduce="0|1"` an das
`<html>`; jede Regel in `bewegung.css` hängt daran, und die WAAPI-Bewegungen
fragen `MOTION.reduziert()` ab. Ein Wechsel der Systemvorliebe zur Laufzeit
wird über `matchMedia().addEventListener('change')` mitgenommen.

**Ein Sonderfall, der genannt sein will.** `system.css` §8 setzt unter der
Systemvorliebe `* { animation-duration: 1ms !important }`. Als Grundsicherung
richtig — es überschreibt aber auch die hier gebauten Reduce-Pfade, und aus
einer gestalteten Kreuzblende von 120 ms würde ein Schnitt von 1 ms.
`bewegung.css` §6 stellt die Dauer für die eigenen Bausteine wieder her
(`[class*="bw-"], [data-bw]`, höhere Spezifität als `*`, später geladen).
Daraus folgt die Hausregel dieser Datei: **jede animierende Klasse setzt
`--bw-dur` und benutzt es.** Wer das vergisst, landet bei 1 ms.

### 5.2 Die Tabelle

| Bewegung | Voll | Reduce |
|---|---|---|
| **Öffnen** | Ort, Größe, Radius, 320 ms | 160 ms Kreuzblende. Vorher 80 ms ein 2-pt-Ink-Ring auf der Ursprungskarte — die Herkunft wird **gesagt**, nicht gelaufen |
| **Wechseln** | 8 pt Versatz, 60 ms Überlappung | 120 ms reine Kreuzblende, 0 pt Versatz, keine Überlappung. Die Richtung sagt die Navigationsleiste, die sie ohnehin immer gesagt hat |
| **Übergeben** | 780 ms, Flug auf dem Faden | **360 ms.** Der Faden erscheint auf voller Länge (Deckkraft, 120 ms), 120 ms später zählt das Ziel hoch und bekommt seinen Ring. Die Reihenfolge Ursprung → Ziel bleibt erhalten, nur der Weg fällt weg |
| **Bestätigen** | Haken zeichnet sich, 180 ms | Der Haken ist da statt gezeichnet (120 ms Deckkraft). **Die 1000 ms Verweildauer bleiben unverändert** — sie sind Bedienlogik, nicht Bewegung; ohne sie verlöre man das Rückgängig |
| **Lücke schließen** | Höhe/Abstände, 260 ms | Ohne Weg: die Zeile wird entfernt, die Liste steht neu |
| **Karte drehen** | `rotateY` 180°, Perspektive | Keine Drehung. Die Rückseite blendet an derselben Stelle über die Vorderseite (160 ms) — dass es dieselbe Karte ist, sagt der Ort, denn sie bewegt sich nicht |
| **Karte wischen** | 1 : 1 am Finger | **Gar nicht.** Die Zeiger-Ereignisse werden nicht eingehängt; bewertet wird über die vier Knöpfe, die ohnehin da sind |
| **Nächste Karte** | 10 pt von unten, `scale` 0,97 → 1 | 160 ms Kreuzblende |
| **Herkunft zeigen** | Faden zeichnet sich, Karte weicht, Quelle kommt herein | Nichts weicht, nichts kommt herein. Der Faden erscheint auf voller Länge (120 ms), die Quelle blendet an ihrem Platz auf (160 ms), die Karte wird nur ruhiger (0,5). Dieselbe Beziehung, ohne Weg |
| **Zeigen / Drücken** | Fläche + `scale(.98)` | Fläche und Schatten bleiben — sie sagen „hier bin ich" ohne Weg. Der Maßstab entfällt vollständig |
| **Skelett** | Deckkraft 0,55 ↔ 1, 1200 ms | Kein Puls. Steht still bei 0,72; daneben steht das Wort „Wird geladen" |
| **Staffeln** | 36 ms Schritt, 6 pt Weg | Alle gemeinsam, 120 ms, 0 pt. Gestaffeltes Erscheinen ist gerade die Bewegung, die bei vestibulärer Empfindlichkeit am unangenehmsten ist: viele kleine Wege gleichzeitig im Blickfeld |
| **Streak** | Scheibe wächst, `springBouncy` | Die Scheibe ist da (120 ms Deckkraft) |
| **Wellenform** | 26 Balken schwingen | Die Balken stehen auf ihrem Grundprofil still. Dass aufgenommen wird, sagt die laufende Zeit daneben (00:07, 00:08 …) — eine Ziffer, die sich ändert, ist keine Bewegung im Blickfeld, aber derselbe Beweis |
| **Zähler** | Ziffern rollen | Kreuzblende an derselben Stelle, 120 ms |
| **Onboarding** | elf Takte, 28 s | **Dieselben elf Takte, dieselben 28 s.** Nur die Mittel wechseln. Reduce Motion nimmt Wege weg, keine Zeit |

---

## 6 · Der Verlangsamer

`--bw-tempo` (1 oder 4) multipliziert jede Dauer in `bewegung.css`. Damit die
Sätze einer Bewegung nicht auseinanderfallen, laufen **alle** Wartezeiten im
JavaScript durch `MOTION.ms(x)`, das denselben Faktor anwendet — und der Faden
bekommt beim Anlegen `--t-hand` in derselben Rechnung gesetzt, weil
`system.css` §9 seine Zeichendauer aus dieser Variable nimmt.

Der Verlangsamer ist ein Prüfwerkzeug, kein Bedienelement: Bei 0,25× muss eine
Bewegung immer noch verständlich sein. Fällt sie da auseinander, ist sie falsch
gebaut, nicht zu schnell.

---

## 7 · Was absichtlich nicht bewegt wird

* **Der heutige Tag pulsiert nicht.** Velums März-Spec §8 sieht für den
  Kalenderpunkt „scale 1.0 → 1.05, 2 s, `.easeInOut`, repeat" vor. Eine
  Dauerbewegung, die keinen Zustandswechsel meldet, ist Zierrat — sie zieht in
  jeder Sekunde Aufmerksamkeit ab, in der man liest. Dass heute heute ist, sagt
  der Ink-Ring (`.dot--ring`), ohne sich zu rühren. **Das ist die eine Vorgabe
  aus Velums eigener Spec, die diese Runde ablehnt.**
* **Die Liste weicht beim Öffnen nicht zurück.** Sie tritt nur in der Deckkraft
  zurück. Der Weg der Karte erklärt die Herkunft schon; ein zweiter
  gleichzeitiger Weg würde mit dem ersten um dieselbe Aufmerksamkeit ringen.
* **Der Tab-Wechsel bewegt den Inhalt nicht** — nur die Kreuzblende aus der
  Rolle „Wechseln". Tabs sind Orte, keine Wege; wer zwischen zwei Orten hin und
  her schaltet, will nicht jedes Mal reisen.
* **Kennzahlen zählen beim Laden nicht hoch.** „6 Aufgaben · 23 Karten · 12 Tage
  in Folge" stehen sofort da. Der Zähler rollt nur, wo eine Handlung ihn
  geändert hat — sonst behauptet die Bewegung eine Ursache, die es nicht gab.
* **Trennlinien und Ränder animieren nie.** Sie sind keine Fäden, und was kein
  Faden ist, wächst auch nicht. Ein Rahmen, der sich einzeichnet, sähe aus wie
  eine Beziehung und wäre keine.
* **Die Fortschrittsanzeige des Onboardings ist ein Balken, kein Faden.**
  Zwischen „Sekunde 4" und „Sekunde 9" besteht keine Beziehung im Datenmodell.
  Ein Faden wäre dort eine Zierlinie — und die sind verboten.
* **Kein Weichzeichner als Übergang, keine Parallaxe.** Beide bewegen etwas,
  das gar nicht gemeint ist.

---

## 8 · Die ersten 30 Sekunden

`mockups/motion/onboarding.html` — elf Takte in 28 Sekunden, mit Start, Pause
und Zurück auf Anfang.

| ab | Takt | Bewegung |
|---|---|---|
| 0,0 s | Das Zeichen erscheint | Öffnen, 320 ms |
| 1,8 s | Die Wortmarke setzt sich daneben | Öffnen, 320 ms |
| 4,2 s | Fünf Module, ein Bestand | Wechseln, 180 ms |
| 6,2 s | Die fünf Punkte erscheinen | Staffelung 36 ms |
| 9,0 s | Der erste Faden — Notizen zu Lernkarten | `--t-hand` 420 ms |
| 12,6 s | Die Vorlesungsnotiz | Wechseln, 180 ms |
| 14,4 s | Die Übergabe — aus dem Satz wird eine Karte | Übergeben, 780 ms |
| 17,4 s | Der Rückweg — die Karte weiß, woher sie kommt | Faden, 420 ms |
| 21,2 s | Der erste Schirm: Heute | Wechseln, 180 ms |
| 22,6 s | Die vier Zeilen erscheinen gestaffelt | Staffelung 36 ms |
| 25,6 s | Loslegen | Öffnen, 320 ms |

**Kein Takt trägt eine Bewegung, die es nur hier gibt.** Takt 7 ist die Rolle
Übergeben, Takt 8 der Moment Herkunft zeigen, Takt 10 die gestaffelte Liste.
Wer den Ablauf gesehen hat, kennt die App — und wer die App bedient, erkennt
den Ablauf wieder.

Der Ablauf beginnt mit dem **echten App-Icon**. Die drei PNG unter
`assets/brand/` liegen nicht vor, deshalb zeigt der Baustein einen sichtbar
leeren Rahmen mit dem Dateinamen. Das ist richtig so und wird nicht repariert;
nachgezeichnet wird nichts. Sobald die Dateien da sind, erscheint das Zeichen
hier, ohne dass eine Zeile geändert wird.

Der Ablauf läuft über **eine Uhr, nicht über einen Stapel Timeouts** — nur so
lässt er sich anhalten, ohne dass ein Takt hinterherläuft. Pause hält zwischen
den Takten an; eine gerade laufende Bewegung läuft zu Ende, die längste dauert
780 ms.

---

## 9 · Was geprüft wurde

Beide Seiten in Chromium, 1440 pt und 390 pt, hell und dunkel, mit und ohne
Reduce Motion (System und erzwungen), bei 1× und 0,25×. Von jeder Bewegung
mindestens drei Zeitpunkte aufgenommen und angesehen.

Dabei korrigiert:

1. **Die erledigte Zeile ließ ein 52-pt-Loch stehen.** `system.css` gibt `.row`
   eine `min-height: 52px`; eine Höhe von 0 kommt dagegen nicht an.
   `.bw-luecke` setzt jetzt `min-height: 0`.
2. **Die Flugkarte landete auf dem Zähler.** Der Fadenpfad endet am Rand der
   Zielkachel; die Karte deckte in ihren letzten 60 ms genau die Zahl ab, die
   danach hochzählen sollte. Die letzten 28 % der Bahn ziehen jetzt quadratisch
   gewichtet zur Mitte der Kachel.
3. **Der Absatz blieb blass.** Nach der Übergabe stand die Auswahl dauerhaft
   auf Deckkraft 0,32 — was „nicht mehr hier" hieß statt „hat etwas abgegeben".
   Er kehrt jetzt in Satz 3 auf 1 zurück.
4. **Die stehende Wellenform sah aus wie eine gestrichelte Linie.** Der
   Ruhezustand lag bei `scaleY(.35)`, dem kleinsten Ausschlag — und genau
   diesen Zustand zeigt Reduce Motion dauerhaft. Ruhe ist jetzt das
   Grundprofil.
5. **Die austretende Lernkarte überquerte die Intervall-Reihe**, also gerade
   das, was man ansehen soll. Die Deckkraft fällt jetzt in 55 % der Dauer.
6. **Eine versteckte Karte stand sichtbar da.** `[hidden]` verliert gegen ein
   `display: flex` am Element; beide Musterseiten setzen es jetzt mit
   `!important`.
7. **Das Onboarding schob die Seite auf 390 pt waagerecht** (425 statt 390),
   weil der Schirm 393 pt breit ist. Der Halter darf jetzt schmaler werden als
   sein Inhalt.
8. **Pause sah aus wie aus und war es nicht.** Die Knöpfe des Ablaufs setzen
   jetzt `disabled`, nicht nur eine Klasse.
9. **Die wischbare Karte verschluckte jeden Tap auf ihren eigenen
   Herkunfts-Chip.** `setPointerCapture` beim Aufsetzen leitet auch das
   `click`-Ereignis auf die Karte um. Der Zeiger wird jetzt erst ab 6 pt Weg
   gefangen, und ein Aufsetzen auf einem Bedienelement startet gar kein Ziehen.
10. **Nach dem Wischen sprang die Intervall-Vorschau ein Feld zu weit** (auf
    21 d statt 8 d): die Vorschau hatte den Index schon verschoben, die
    Bewertung verschob ein zweites Mal. `bewerten()` nimmt jetzt eine `basis`
    entgegen.
11. **Beim Ziehen markierte die Karte ihren eigenen Text.** `.bw-wisch` hat
    jetzt `user-select: none` — eine Karte, die man wischt, ist ein
    Gegenstand, kein Absatz.
12. **Der Ink-Ring des Reduce-Pfads von „Öffnen" war unsichtbar.** Er lag als
    `box-shadow` auf der Ursprungskarte, und die Notizbuchkarte setzt ihren
    eigenen Schatten in einer später geladenen Regel. Der Ring liegt jetzt als
    Pseudoelement über der Karte — das kann niemand versehentlich
    überschreiben, weil es ein anderer Gegenstand ist.

Nicht korrigiert, weil richtig: das App-Icon lädt nicht und die Konsole meldet
`ERR_FILE_NOT_FOUND`. Genau das soll sie, solange die drei PNG fehlen.
