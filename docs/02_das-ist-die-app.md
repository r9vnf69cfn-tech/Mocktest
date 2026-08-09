# Das ist die App

## In drei Sätzen

Eine App für Studium und Alltag, in der Handschrift, Notizen, Tagebuch, Aufgaben und Lernkarten dasselbe Datenmodell teilen. Wer einen Satz in seiner Vorlesungsnotiz markiert, macht daraus in einem Griff eine Lernkarte, eine Aufgabe oder einen Tagebucheintrag — und das erzeugte Objekt behält sichtbar, woher es stammt. Die Oberfläche selbst tritt zurück: Sie ist Papier und Grau, damit alle Farbe dem gehört, was der Nutzer hineinschreibt.

## Für wen

Für Studierende und alle, die über Monate an denselben Themen arbeiten. Nicht für den, der nur eine Einkaufsliste braucht — dafür ist sie zu viel. Sondern für den, der heute eine Vorlesung mitschreibt, daraus morgen lernt, nächste Woche ein Protokoll abgibt und am Ende des Semesters wissen will, wo das alles zusammenhing.

Die Beispielwelt aller Mockups ist deshalb konkret: Emil, Biologie im dritten Semester, Notizbuch „Zellbiologie“, Abgabe bei Prof. Wendt am Freitag.

## Der eine Grund zu wechseln

**Der Weg zwischen den Werkzeugen entfällt.** Heute kostet dieselbe Arbeit fünf Apps und drei Exporte: In Bear steht die Notiz, in Anki liegen die Karten, in Things die Abgabe — und keine dieser Apps weiß von den anderen. Hier ist die Kette ein Objekt: Die Notiz weiß, dass aus ihr zwölf Karten wurden, die Karte weiß, aus welchem Absatz sie stammt, und der Tageseinstieg erzählt beides in einer Zeile.

Kein Konkurrent kann das. RemNote kommt am nächsten, bezahlt es aber mit einer Lernkurve, die Rezensenten regelmäßig als Haupthürde nennen (siehe [`konkurrenz-anatomie.html`](konkurrenz-anatomie.html), Kapitel Lernkarten).

---

## Das Leitmotiv: der Faden

> **Jede Verbindung ist ein Faden zwischen zwei Punkten — und man kann ihn in beide Richtungen ablaufen.**

Drei Bausteine, mehr gibt es nicht: der **Punkt** ist ein Objekt, der **Faden** eine Beziehung, der **Knoten** die Stelle, an der Fäden sich treffen. Ein Faden ist immer ein Strich, nie eine Fläche; seine Stärke sagt, wie nah die Beziehung ist (1 pt Tag · 1,5 pt Verweis · 2,5 pt Herkunft), und in Bewegung zeichnet er sich vom Ursprung zum Ergebnis.

**Auch im Stillstand hat er eine Richtung.** Er verjüngt sich vom Ursprung zum Ergebnis auf 60 % seiner Stärke — 1,0 → 0,6 · 1,5 → 0,9 · 2,5 → 1,5 pt. Keine Pfeilspitze: die käme aus dem Flussdiagramm und machte den Faden zu einem Konnektor zwischen zwei Kästen. Die Verjüngung dagegen ist das, was ein Stift ohnehin tut — ein Strich beginnt mit Druck und läuft aus. Das Motiv borgt sich sein Richtungszeichen also nicht, es hat es schon.

Dazu die eine Regel, die das Motiv von Dekoration trennt:

> **Kein Faden ohne echte Beziehung im Datenmodell.** Wenn sich nicht sagen lässt, welche zwei Objekte ein Strich verbindet, darf dort keiner sein.

**Was das für die App bedeutet — sechs Wirkungen:**

1. **Die Kette am Morgen ist gezeichnet, nicht behauptet.** „Zellbiologie“ → 12 Karten → 8 heute fällig sind drei Knoten auf einem Herkunftsfaden, nicht drei Kästen mit Winkelzeichen dazwischen.
2. **Der Rückweg wird sichtbar.** Ein Faden hat zwei Enden. Der Herkunfts-Chip auf einer Lernkarte zeichnet ihn beim Antippen zurück bis in den Absatz, aus dem die Karte kam.
3. **Wo nichts verbunden ist, steht auch nichts.** Im Zwölf-Wochen-Raster, in den Prognose-Balken, im Fortschrittsbalken liegt kein Faden — dort ist nur Nachbarschaft, Skala oder Summe. Das kostet: mit Strichen hätten diese Stellen „reicher“ ausgesehen. Ein Motiv, das nichts kostet, ist Zierrat.
4. **Trennlinien bleiben Trennlinien.** Der Faden tritt nie als Rahmen, Unterstreichung oder Zierleiste auf. Er ist an seiner Aufgabe erkennbar, nicht an seinem Aussehen.
5. **Kein Ende hängt frei.** Ein Fadenende sitzt auf der Punktmitte oder am Punktrand, höchstens 5,2 pt daneben. Hängt eines frei, verbindet der Faden ein Objekt mit nichts — dann ist er keiner. Die einzige Ausnahme ist der gekappte Faden: Er endet ohne Punkt und sagt damit, dass die Quelle gelöscht wurde.
6. **Ink am Faden heißt „aktiv“ und sonst nichts.** Der Akzent hat drei Rollen — aktiver Zustand, primäre Aktion, Auswahl. „Liegt hinter mir“ ist keine davon; das sagt der Punkt (gefüllt = gelaufen, Ring = jetzt fällig, hohl = geplant). So trägt der Faden eine Information und der Punkt eine andere, statt beide dieselbe.

Warum ausgerechnet dieses Motiv — der Name (*velum*, gewebter Stoff), das Zeichen (zwei Striche, die sich in einem Punkt treffen), der Rohstoff (ein Handschrift-Strich *ist* ein Faden) — steht in [`04_velum-dna.md`](04_velum-dna.md). Hier steht nur die Wirkung. Alle drei Bausteine in jedem Zustand: [`mockups/shared/faden-probe.html`](../mockups/shared/faden-probe.html).

---

## Die Marke

Velum hat drei Markenmittel und benutzt sonst keines.

**Die Serif: New York.** Apples eigene Systemserif — keine Lizenz, keine Webfont-Datei, kein Ladezeitpunkt, und je optischer Größe eigens gezeichnet. Sie passt zum Zeichen, das selbst ein Serif-V ist. Sie ist **keine sechste Größe**, sondern eine Rolle: Sie belegt dieselben fünf Größen wie die Sans. Und sie erscheint an genau sieben Orten, nirgends sonst:

| Ort | Klasse | Warum |
|---|---|---|
| Große Screen-Titel | `.serif--screen-title` | Der erste Eindruck jedes Screens trägt die Stimme |
| Journal-Datumsmarken | `.serif--journal-date` | Das Datum ist im Journal Inhalt, nicht Metadatum |
| Zitate und der markierte Satz im Review | `.serif--quote` | Fremde Stimme, andere Schrift |
| Titel leerer Zustände | `.serif--empty-title` | Der leere Screen ist der Ort, an dem die App spricht |
| Notizbuch-Titel auf dem Cover | `.serif--cover-title` | Ein Buch trägt seinen Titel gesetzt, nicht beschriftet |
| Die Wortmarke | `.serif--wordmark` | Das Zeichen selbst |
| Der Journal-Eintragstext | `.serif--voice` | Durchgehende Prosa, die als Stimme gelesen wird |

Der siebte Ort ist der interessante, und seine Gegenprobe steht im Nachbarmodul: **Der Notiz-Editor bekommt Sans.** Eine Notiz ist Arbeitsmaterial — Blöcke, Verweise, Struktur, etwas, das man umbaut. Ein Journaleintrag ist eine Stimme, die man wieder liest. Velum hält beides im selben Datenmodell und muss sie deshalb unterscheiden können; Day One hat diese Unterscheidung gar nicht zu treffen. Die Schrift markiert hier den Unterschied zwischen *Material* und *Stimme*. Ein blankes `class="serif"` ohne Rolle kommt in den Screens nicht mehr vor — eine Schriftklasse ohne Aufgabe wäre genau die Textur, die die Regel verbietet.

**Das Punkt-System.** Derselbe 6-pt-Punkt, der die Modulfarbe trägt, ist der Grundbaustein des Leitmotivs: gefüllt = das Objekt existiert, hohl mit 1,4-pt-Ring = geplant oder noch offen, mit 2-pt-Ink-Ring = aktiv oder heute, und als 9-pt-Knoten = hier treffen sich Fäden. Er steht nie allein: immer Punkt plus Wort, Punkt plus Position oder Punkt plus Fläche.

**Das Zeichen.** Ein Serif-V mit einem kupferfarbenen Punkt rechts unten. Es erscheint beim Start und im Onboarding, unter Einstellungen → Über, in den Widget-Vorschauen, in der Sperrbildschirm-Mitteilung, im Spotlight-Treffer, im Teilen-Blatt und im Store-Kontext — **nicht im laufenden Betrieb.** Keine Navigationsleiste, kein Tab, kein Seitenkopf: Eine App, die ihr eigenes Logo dauernd mitführt, misstraut ihrer Gestaltung. Kupfer lebt ausschließlich innerhalb der Markensperre; kein Knopf, kein Chip, keine Fläche, kein Zustand trägt ihn. Als Textfarbe wäre er ohnehin unzulässig (4,44:1 auf hellem, 3,96:1 auf dunklem Papier).

**Offen und sichtbar offen:** Die drei App-Icon-Dateien unter `assets/brand/` **liegen nicht vor**. Nachgezeichnet wird nichts, auch nicht angedeutet. Überall, wo das Zeichen stünde, zeigt der Baustein einen leeren Rahmen mit dem fehlenden Dateinamen — im Onboarding also im ersten Takt. Sobald die drei PNG abgelegt werden, erscheinen sie überall gleichzeitig, ohne dass eine Zeile geändert wird ([`assets/brand/LIESMICH.md`](../assets/brand/LIESMICH.md)).

---

## Wie sie aussieht — und warum

### Das Prinzip in einem Satz

> **Die App ist Papier und Grau; die einzige Farbe, die zählt, hat der Nutzer hineingebracht — und jede Spur, die seine Arbeit zwischen den Modulen hinterlässt, bleibt sichtbar.**

Daraus folgt alles Weitere: das Farbsystem, die Zurückhaltung der Oberfläche, die Herkunfts-Chips, die Ketten-Karte. Der Faden ist die Form, die diese Spur annimmt.

### Farbe

Ein einziger Akzent, **Ink**: fast-schwarz (`#16181C`) im hellen, fast-weiß (`#F2F3F5`) im dunklen Modus. Er hat genau drei Aufgaben — aktiver Zustand, primäre Aktion, Auswahl. Nichts sonst ist eingefärbt.

Die fünf Modul-Farben erscheinen ausschließlich als **6-pt-Punkte** neben einem Wort und als Akzent auf Notizbuch-Covern. Sie färben nie eine Fläche, keinen Text und keinen Knopf; die Einstellungen erklären das dem Nutzer sogar wörtlich ([`app-next/settings.html`](../mockups/app-next/settings.html)). Rot bleibt dem Löschen und der Deadline vorbehalten, Grün dem Erfolg. Der Faden trägt nie eine Modulfarbe: Farbe gehört dem Punkt, nicht der Beziehung.

Warum so streng: Sechs Module mit sechs Hausfarben ergeben ein Sammelsurium, in dem der Nutzer die Farbe der App liest statt seiner eigenen Inhalte. Bear (ein Akzent) und Things (ein Akzent) sind die beiden ADA-Gewinner im Feld — Todoist mit vier Prioritätsfarben ist die App, bei der man am längsten sucht, was gemeint ist.

**Jeder Wert ist gerechnet, nicht geschätzt** (`shared/system.css`, §1): Fließtext 17,8:1 auf Papier, Sekundärtext 5,3:1, Tertiärtext 4,8:1, Text auf Akzentfläche 17,8:1. Zwei Modul-Punkte erreichen im hellen Modus nur 2,95:1 bzw. 2,83:1 — deshalb stehen Punkte **nie allein**, sondern immer neben ihrem Wort. Der Faden liegt bei 3,10:1 (hell) und 3,13:1 (dunkel); die naheliegende Trennlinienfarbe hätte 1,46:1 gehalten und war damit als Bedienoberfläche unzulässig — eine Vorgabe, die im Bauen korrigiert werden musste.

### Typografie

Fünf Größen, zwei Gewichte, feste Rollen:

| Rolle | Größe | Gewicht | Wofür |
|---|---|---|---|
| Titel | 28/34 | 600 | Screen-Titel, Begrüßung |
| Sektion | 20/26 | 600 | Sektionsköpfe, Karten- und Eintragstitel |
| Text | 17/23 | 400 | Fließtext, Listenzeile — die Arbeitsgröße |
| Sekundär | 15/20 | 400 | Untertitel, Metadaten, Vorschauzeilen |
| Marke | 13/16 | 600 | Chips, Zähler, Eyebrows |

Genau **eine** begründete Ausnahme innerhalb der App: Die Tab-Beschriftung auf dem iPhone läuft mit 11 pt (iOS-Standard). Bei 13 pt kollidieren „Bibliothek“ und „Aufgaben“ auf 393 pt Breite — überlappender Text wiegt schwerer als eine sechste Stufe an einer Stelle. In den Plattform-Ansichten kommen drei weitere Größen vor (Sperrbildschirm-Uhr, Symbolbeschriftung, Tastenbeschriftung); sie gehören iOS und nicht Velum, und sie in die Fünferskala zu zwingen hieße, das System falsch zu zeichnen.

Die Serif fügt keine Größe hinzu. Wo sie steht und warum, steht oben unter [Die Marke](#die-marke).

### Raster und Dichte

**iPad** (1194 × 834): Sidebar 320 pt, Inhalt mit 24 pt Rand, wo sinnvoll zweispaltig — links die Arbeit, rechts der Kontext. Diese Teilung trägt [`today.html`](../mockups/app-next/today.html), [`tasks.html`](../mockups/app-next/tasks.html), [`journal-home.html`](../mockups/app-next/journal-home.html) und [`flashcards-home.html`](../mockups/app-next/flashcards-home.html).

**iPhone** (393 × 852): 20 pt Rand, Tab-Bar statt Sidebar, dieselben Abschnitte gestapelt. Wichtigste Regel: Was man häufig tut, liegt im unteren Drittel — Schnellerfassung, primäre Knöpfe, die Bewertungsknöpfe der Lernsitzung.

Die Dichte ist **arbeitsteilig**, nicht gleichmäßig — die Lehre aus Bear: Ruhe beim Schreiben, Dichte beim Verwalten. Der Editor trägt nur Text; die Aufgabenliste trägt Zeilen; die Bibliothek trägt Cover.

Die Notizbuch-Cover sind der Ort, an dem vier Merkmale zusammen arbeiten: Papier (zwölf Sorten aus echten Bildpunkten), der Buchrücken als senkrechter Herkunftsfaden, die Punkte auf dem Rücken (jede Stelle, an der etwas aus dem Buch entstanden ist — Modulfarbe des Ziels, Höhe = Stelle im Buch, hohl = noch offen) und der Titelsatz, der den Satzspiegel füllt. Der Rücken ist damit die einzige Stelle im Regal, an der Velums Alleinstellung schon vor dem Öffnen sichtbar ist. Papier allein trennt achtzehn Bücher nicht — erst alle vier Merkmale zusammen tun es.

### Zustände ohne Farbe

Jeder Zustand hat zwei Merkmale, keiner hängt an Farbe allein:

| Zustand | Merkmale |
|---|---|
| aktiv | getönte Fläche + Schriftgewicht + Ink-Balken links |
| ausgewählt | getönte Fläche + 1,5-pt-Ring |
| deaktiviert | Deckkraft 38 % + fehlende Fläche |
| Deadline | rotes Wort + Flaggen-Symbol + Restzeit |
| Fehler | Randlinie + Symbol + Klartext, was zu tun ist |
| Laden | Skelettfläche an der Stelle des Inhalts, nie ein Spinner ohne Kontext |

Weil der einzige Akzent fast-schwarz ist, nimmt er iOS das Signal „farbig = tappbar“. Der Preis dafür wird ausdrücklich bezahlt: Primäre Aktionen sind gefüllte Ink-Flächen mit hellem Text, sekundäre tragen Umrandung, Fläche oder Position, interaktiver Text trägt immer ein zweites Merkmal — Chevron, Chip-Fläche, Unterstreichung oder Symbol. Ziele sind mindestens 44 pt.

---

## Bewegung

Der Grundsatz: **Bewegung nur, wo sie etwas erklärt — Herkunft, Fortschritt, Zustandswechsel.** Alles andere steht still. Das ist keine Sparsamkeitsgeste: Der heutige Kalenderpunkt bekommt bewusst *keinen* Puls, obwohl Velums eigene ältere Spezifikation einen vorsah. Eine Dauerbewegung, die keinen Zustandswechsel meldet, zieht in jeder Sekunde Aufmerksamkeit ab, in der man liest.

**Vier Rollen** — jede mit einer Dauer, einer Kurve und einer Aufgabe. Die Kurven sind aus den Federparametern *gerechnet*, nicht geschätzt: Sprungantwort ausgewertet, Fenster bei 2 % Restweg, Bézier angepasst; RMS-Fehler 0,33–0,92 % des Weges.

| Rolle | Dauer | Aufgabe | Frage, die sie beantwortet |
|---|---|---|---|
| **Öffnen** | 320 ms | Dokument, Detail | Woher kommt das hier? |
| **Wechseln** | 180 ms hinaus / 180 ms herein, 60 ms Überlappung | Modul, Ansicht | Ein Wechsel ist kein Ereignis |
| **Übergeben** | 780 ms in drei Sätzen | Modul zu Modul — Velums Signatur | Was ist daraus geworden? |
| **Bestätigen** | 180 + 1000 + 240 + 260 ms | erledigt, gespeichert, bewertet | Ist es angekommen? |

Die 1000 ms in der vierten Zeile sind keine Animation, sondern Bedienlogik: Sie sind das Zeitfenster zum Rückgängigmachen. Deshalb bleiben sie auch bei reduzierter Bewegung stehen, während alles andere daran gekürzt wird.

**Fünf Momente, die wirklich laufen** — nicht als Standbild mit Spur, sondern im Browser abspielbar:

1. **Übergabe** — der markierte Satz verdichtet sich zur Karte, fliegt **auf dem Faden** zum Ziel und lässt den Zähler dort umspringen. Die Bahn wird nicht erfunden: Sie wird Punkt für Punkt vom gezeichneten Faden gelesen. Und der Faden ist 60 ms vor der Karte am Ziel — erst liegt der Weg, dann kommt, was ihn geht; umgekehrt sähe er aus wie eine Spur.
2. **Erledigen** — der Haken zeichnet sich, die Zeile wartet eine Sekunde und schließt dann die Lücke.
3. **Karte bewerten** — Umdrehen und Bewerten, mit der Intervall-Reihe als Faden.
4. **Dokument öffnen** — die Karte wächst aus ihrer Position, statt einen Screen zu schieben.
5. **Herkunft zeigen** — der Tap auf den Herkunfts-Chip zeichnet den Faden zurück zum Ursprung; beim Loslassen läuft er wieder ein.

Alle fünf liegen in [`mockups/motion/index.html`](../mockups/motion/index.html) mit Steckbrief, Verlangsamer und Reduce-Motion-Schalter. Sie sind zusätzlich in den Entwurf selbst eingebaut: In sieben der dreizehn Screens hängen sie an `data-bw`-Attributen — die Übergabe im Notiz-Editor und in der Notizen-Liste, das Erledigen in den Aufgaben, Umdrehen und Bewerten in der Lernsitzung, der Herkunftsfaden auf Heute, im Aufgaben-Detail und im Lernkarten-Start.

**Reduce Motion ist kein Ausschalter, sondern ein zweiter gebauter Pfad je Bewegung.** Die Übergabe läuft dann in 360 ms: Der Faden erscheint auf voller Länge, 120 ms später zählt das Ziel hoch — die Reihenfolge Ursprung → Ziel bleibt erhalten, nur der Weg fällt weg. Gewischt wird gar nicht mehr; die Zeiger-Ereignisse werden nicht eingehängt, die Knöpfe reichen.

**Die ersten 30 Sekunden** stehen als eigener Ablauf: [`mockups/motion/onboarding.html`](../mockups/motion/onboarding.html), elf Takte in 28 Sekunden, mit Start, Pause und Zurück auf Anfang. Kein Takt trägt eine Bewegung, die es nur dort gibt — wer den Ablauf gesehen hat, kennt die App, und wer die App bedient, erkennt den Ablauf wieder. Der erste Takt zeigt das App-Icon, und weil die Dateien fehlen, zeigt er den leeren Rahmen.

Vollständig, mit Rechnung, Tabellen und der Liste dessen, was **nicht** bewegt wird: [`03_bewegung.md`](03_bewegung.md).

---

## Auf der Plattform

Zehn Berührungspunkte zwischen der App und iOS, jeder als eigene Ansicht gebaut: [`mockups/platform/`](../mockups/platform/).

| | Ansicht | Was sie zeigt |
|---:|---|---|
| 1 | Widgets | Klein, mittel, groß im echten Raster eines 393 × 852-pt-iPhones, dazu die drei Sperrbildschirm-Zubehörformen |
| 2 | Live Activity und Dynamic Island | Ruhe, kompakt, minimal, erweitert — plus die Sperrbildschirm-Fassung |
| 3 | Apple Pencil | Schweben über dem Herkunfts-Rand, Squeeze-Palette, Scribble im Moment davor |
| 4 | Sperrbildschirm-Mitteilung | Stapel, aufgezogen, lange Fassung — die Mitteilung nennt den Weg, nicht nur eine Zahl |
| 5 | Spotlight | Systemsuche mit Velum-Treffern, daneben Velums eigenes Feld, das Wege statt Treffer zurückgibt |
| 6 | Siri und Kurzbefehle | Fünf Aktionen, eine geöffnet, die Siri-Antwort über dem laufenden Schirm |
| 7 | Fokus-Filter | Der Filter im System und derselbe Schirm ohne und im Fokus „Studium“ |
| 8 | Teilen-Blatt | Aus Velum hinaus und nach Velum hinein |
| 9 | Kontextmenü | Menü unter der Vorschau auf dem iPhone, neben der Vorschau auf dem iPad |
| 10 | Handoff | iPhone → iPad, mit dem einzigen Faden, der einen Geräterahmen verlässt |

Zwei Regeln gelten in diesem Ordner. Erstens: **Die Rahmen, Radien, Materialien und Größen gehören iOS, der Inhalt gehört Velum.** Wo eine Systemgröße nicht zu belegen war, steht sie mit ihrer Herleitung im Steckbrief — als *erinnert*, *hergeleitet* oder *geschätzt*, nie als Behauptung. Zweitens: **kein Faden ohne echte Beziehung.** Auf sieben der zehn Seiten steht einer; auf dreien steht bewusst keiner an Stellen, an denen man ihn erwarten würde — etwa beim Hinausteilen, weil die Notiz dabei das Datenmodell verlässt und nichts anknüpft.

Die Kontrastwerte auf den Systemtapeten sind **gemessen**, nicht behauptet: Uhr 7,1–7,2:1, Datum 8,0:1, Symbolbeschriftung 5,6:1, Statusleiste 6,8:1, Dock 9,3:1. Die erste Fassung hatte hier eine falsche Selbstauskunft — nachgemessen lag die Uhr bei 2,8:1 —, und die Steckbriefe nennen jetzt die gemessenen Zahlen samt der Einschränkung, dass Velum die Tapete gar nicht liefert.

---

## Wie sie sich anfühlt

**Die Übergabe.** Ein Satz in der Notiz ist markiert, darüber steht eine Leiste — dieselbe, egal ob die Auswahl Handschrift, Text oder Objekte sind. Ein Tipp auf „Lückentext-Karte“, und die Karte faltet sich aus dem Satz heraus, fliegt auf dem Faden in die rechte Spalte und der Zähler dort springt um. Das ist im Notiz-Editor nicht beschrieben, sondern auslösbar.

**Die Kette am Morgen.** Der Tageseinstieg begrüßt nicht mit einer Kachelwand, sondern erzählt: „Zellbiologie“ → 12 Karten → 8 heute fällig, ca. 4 Minuten. Drei Knoten auf einem Herkunftsfaden; jede Station ist anspringbar, und am Ende steht der Knopf, der die vier Minuten sofort einlöst.

**Der Termin im Knopf.** Beim Lernen steht auf jedem der vier Bewertungsknöpfe das ausgerechnete nächste Intervall — „Gut · in 21 Tagen“. Man bewertet nicht sein Gefühl, sondern wählt sichtbar den nächsten Termin. „Gut“ ist der primäre Weg und trägt das auch: mehr Fläche, gefüllte Ink-Fläche, größeres Wort. Auf dem iPhone nimmt es die erste Zeile allein, die drei anderen teilen sich die zweite — vier nebeneinander wären dort je 84 pt breit, und ein Knopf, der sein Intervall verschweigt, wäre RemNotes Fehler.

**Der Rückweg.** Auf der Antwortseite der Karte steht in einem eingelassenen Feld, wie der Satz in der eigenen Notiz lautete. Wer stutzt, tippt den Herkunfts-Chip an — der Faden zeichnet sich zurück bis zum Ursprung, die Quelle blendet auf, und beim Loslassen zieht er sich wieder zum Chip zusammen. Die Lernsitzung wird dafür nicht verlassen.

**Der Blick aufs Ganze.** Der Graph zeigt 27 Objekte und 32 Verbindungen, unterschieden nach Tag (1 pt, gestrichelt), Verweis (1,5 pt) und Herkunft (2,5 pt). Sein Vorgabezustand heißt **Herkunft**, nicht Kräfte: Die Position eines Punktes sagt, wo er herkommt, statt zu zeigen, wohin eine Simulation ihn geschoben hat. Man sieht zum ersten Mal, dass das Laborprotokoll, die Skizze und acht Karten alle an derselben Vorlesung hängen.

---

## Was sie bewusst nicht ist

- **Kein Team-Werkzeug.** Es gibt Teilen, aber keine Kommentarfäden, keine Zuweisungen, keine Rollen. Wer zu fünft an einem Dokument arbeitet, ist hier falsch.
- **Keine zweite Notion.** Keine Datenbanken, keine Formeln, keine frei konfigurierbaren Ansichten. Die App hat eine Meinung, wie die fünf Module zusammenhängen — genau das ist ihr Wert.
- **Kein Belohnungssystem.** Es gibt eine Serie, aber keine Punkte, keine Ränge, keine Vergleiche mit anderen. Und die Serie ist abschaltbar: Eine App darf niemanden dafür bestrafen, dass er sie diese Woche nur für Aufgaben braucht — der Fehler, den Apple Journal bis heute nicht behebt.
- **Kein Theme-Baukasten.** Zwei Modi, beide fertig gestaltet. Bear hat 28 Themes; das ist Personalisierung als Ersatz für Entscheidung.
- **Kein Marktplatz.** Die Bibliothek ist der Ort für die eigenen Dokumente, nicht für Vorlagenwerbung.

---

## Award-Bilanz

Bewertung des vorliegenden Entwurfs gegen die fünf ADA-Kategorien. Skala: **1 = preiswürdig … 5 = disqualifizierend**. Die Spalte „R1“ nennt die Note der ersten Runde, damit sichtbar bleibt, was sich bewegt hat und was nicht.

| Kategorie | R1 | jetzt | Begründung |
|---|:--:|:--:|---|
| **Inklusion** | 2 | **2** | Alle Kontraste sind gerechnet und dokumentiert, jeder Zustand trägt zwei Merkmale, Dynamic Type ist in zwei Stufen durchgezeichnet, 44-pt-Ziele durchgehend. Neu: Reduce Motion ist kein Ausschalter, sondern ein je Bewegung gebauter zweiter Pfad; die Kontraste der Plattform-Tapeten sind gemessen statt behauptet; die Fadenfarbe wurde von 1,46:1 auf 3,10:1 korrigiert. Die Note bleibt trotzdem stehen, weil das Fehlende unverändert fehlt: die geprüfte VoiceOver-Reihenfolge. Ein Mockup kann Vorlesereihenfolge und Rotor-Struktur behaupten, nicht beweisen. |
| **Delight & Fun** | 2 | **1–2** | Die Bewegung ist der Punkt, an dem Runde 2 am meisten dazugelegt hat: vier Rollen, fünf abspielbare Momente, elf Onboarding-Takte, in sieben der dreizehn Screens wirklich verdrahtet. Der halbe Punkt Abzug ist ehrlich: Das läuft in einem Browser, nicht auf einem Gerät. Die Kurven sind aus Federn gerechnet — was eine echte Feder unter dem Finger tut, ist damit angenähert, nicht ersetzt. |
| **Interaktion** | 2 | **1–2** | Der nächste Schritt ist überall benannt und beziffert, das Detail klappt in der Liste auf statt zu navigieren, dieselbe Aufgabe kostet auf dem iPhone nicht mehr Taps. Neu sind die zehn Plattform-Berührungspunkte: Die App ist ansprechbar, ohne geöffnet zu werden. Abzug weiterhin für das Lineal- und Zoom-Verhalten im Canvas, das beschrieben, aber nicht durchgespielt ist. |
| **Visuals & Grafik** | 1–2 | **1–2** | Ein Raster, eine Typo-Skala, eine Materialsprache über dreizehn Screens des Entwurfs, sechs der Vorstufe, zehn Plattform-Ansichten und zwei Bewegungsseiten hinweg, ein einziger Akzent, alle Werte in einer gemeinsamen Datei. Der Abzug aus Runde 1 ist eingelöst: Die Notizbuch-Cover sind nicht mehr aus Mustern gebaut, sondern aus zwölf Papieren mit gemessenem Kontrast, und der Buchrücken trägt als Faden echte Daten. Der halbe Punkt wandert an eine andere Stelle: **Das Zeichen selbst fehlt.** Die Handschrift steht an jedem Ort außer am ersten. |
| **Innovation** | 1 | **1** | Die Kette ist keine Fußnote, sondern trägt den Einstiegsscreen, den Editor, die Lernsitzung, den Graphen und die Notizbuch-Rücken. Seit Runde 2 ist sie zusätzlich ein System aus drei Bausteinen mit einer Regel, die etwas kostet. Und das Zwölf-Wochen-Raster zählt nicht mehr Anwesenheit, sondern wie viel vom Material eines Tages heute sitzt — eine Größe, die keines der 21 untersuchten Produkte rechnen kann. |

### Was Runde 2 dazugelegt hat

Runde 1 endete mit einem Satz: *„Was fehlt, ist ein lauffähiger Prototyp genau dieser Übergabe.“* Der ist gebaut — und mit ihm vier weitere Momente, ein Reduce-Motion-Pfad je Bewegung und ein Onboarding, das dieselben Bewegungen benutzt, die die App auch sonst benutzt. Dazu kamen die Handschrift als benanntes System (Leitmotiv, sieben Serif-Rollen, Punkt-System), zehn Plattform-Ansichten, ein Cover-System aus vier Merkmalen und erzeugte Bilder, weil freie Bildquellen aus diesem Container nicht erreichbar sind.

### Der unbequeme Absatz — und wo er heute steht

[`04_velum-dna.md`](04_velum-dna.md) §5 nennt sieben Stellen, an denen der Entwurf noch nah an einer Vorlage stand, und fasst sie in einem Satz zusammen:

> **Der Entwurf hat die Farben seiner Vorbilder abgelegt und ihre Formen behalten:** die Kette ein Breadcrumb, das Info-Panel ein Plugin-Register, der Graph ein Kräfte-Layout, der leere Zustand eine `ContentUnavailableView`, das Raster ein Beitragsdiagramm.

Der Satz war richtig, und er ist nicht ganz eingelöst. Sechs der sieben Befunde sind seither erledigt — einer ist es nicht, und ausgerechnet der trifft das Leitmotiv:

| Befund aus §5 | Stand |
|---|---|
| 5.1 Graph = Obsidians Graph View, Position bedeutet nichts | **behoben.** Vorgabezustand „Herkunft“, die Position sagt etwas; der unerklärte Umschalter „Raster“ ist weg |
| 5.2 Info-Panel = Obsidians Plugin-Liste auf Deutsch | **offen.** Die Abschnittsfolge steht unverändert: INHALT · BACKLINKS · DARAUS ENTSTANDEN · VERWANDTE NOTIZEN · STATISTIK. Wenn Herkunft die Alleinstellung ist, kann „Daraus entstanden“ nicht an dritter Stelle unter dem Inhaltsverzeichnis stehen. Die bekannte Verwandlung — das Panel als *ein Bild*, die Notiz als Punkt, Backlinks als Fäden von links, Entstandenes als Fäden nach rechts — ist nicht gebaut. Das ist eine Lücke im Leitmotiv, keine Geschmacksfrage |
| 5.3 Ketten-Karte als Breadcrumb gezeichnet | **behoben.** Drei Knoten auf einem 2,5-pt-Faden, die 45°-Kerbe ist ersatzlos weg |
| 5.4 Leere Zustände sprechen mit Apples Stimme | **behoben.** Faden ins Leere mit hohlem Punkt am Ende, Titel in `.serif--empty-title` |
| 5.5 Vier gleich breite Bewertungsknöpfe | **behoben.** „Gut“ hat Fläche *und* Füllung, gemessen 146/146/259/146 px statt 4 × 181 |
| 5.6 Serif als Textur im Journal | **behoben.** Siebte Rolle `.serif--voice`, blankes `class="serif"` kommt in den Screens nicht mehr vor |
| 5.7 Zwölf-Wochen-Raster misst Anwesenheit | **behoben.** Es zählt jetzt, wie viel vom Material eines Tages sitzt |

### Was weiterhin fehlt

1. **Die drei App-Icon-Dateien.** Sie liegen nicht vor, und sie werden nicht nachgezeichnet. Überall, wo das Zeichen stünde, ist ein leerer Rahmen mit Pfadangabe. Das ist die richtige Antwort auf eine fehlende Datei, aber es bleibt eine fehlende Datei — und sie fehlt an der ersten Stelle, die ein Betrachter sieht.
2. **Das Info-Panel im Notiz-Editor** (§5.2 oben). Der einzige der sieben Befunde, an dem nichts entschieden wurde.
3. **Die geprüfte VoiceOver-Reihenfolge.** Ein Mockup kann sie nicht belegen; dafür braucht es ein Gerät.
4. **Lineal und Zoom im Canvas** sind beschrieben, nicht durchgespielt.
5. **Es ist ein Browser-Entwurf, keine App.** Die Bewegung läuft wirklich, aber sie läuft in Chromium. Kein SwiftUI, keine echte Synchronisierung, keine Prüfung auf einem Gerät.
6. **Die Systemmaße der Plattform-Ansichten sind nicht am Hersteller nachgeprüft** — die Herstellerseiten waren aus diesem Container nicht erreichbar. Jede Größe ist deshalb als erinnert, hergeleitet oder geschätzt ausgewiesen; unmarkiert steht keine.

---

## Die Zahlen in diesem Dokument

| Zahl | Rechnung |
|---|---|
| **21 verschiedene Produkte in 25 Betrachtungen** | Runde 1: 18 Plätze in sechs Bereichen, davon **14 verschiedene Produkte** (Craft, Apple Notes, Things 3 und Apple Journal stehen in je zwei Bereichen). Runde 2: **+7** — Notability, Noteshelf, Obsidian, Structured, Amie, Arc, Linear. TickTick und RemNote wurden erneut gelesen, aber nicht doppelt gezählt |
| **13 Screens im Entwurf** | `mockups/app-next/`, je iPad und iPhone auf einer Seite |
| **6 Screens der Vorstufe** | `mockups/best-of/`, unverändert aus Runde 1 |
| **10 Plattform-Ansichten** | `mockups/platform/`, dazu eine Übersichtsseite |
| **7 Serif-Rollen** | die sechs aus der DNA plus `.serif--voice` |
| **5 Momente, 4 Rollen** | `mockups/motion/index.html` |

Eine gelegentlich genannte Zahl „26 Apps“ wird hier nicht benutzt: Sie addiert Plätze und Produkte. Eine kleinere richtige Zahl ist in einer Bewerbung mehr wert als eine größere angreifbare.

---

## Verweise

- Alle Mockups: [`mockups/index.html`](../mockups/index.html)
- Der Entwurf: [`mockups/app-next/`](../mockups/app-next/) — dreizehn Screens, je hell/dunkel und iPad/iPhone
- Die Bewegung, laufend: [`mockups/motion/index.html`](../mockups/motion/index.html) · das Onboarding: [`mockups/motion/onboarding.html`](../mockups/motion/onboarding.html)
- Die Plattform: [`mockups/platform/`](../mockups/platform/) — zehn Berührungspunkte
- Die drei Primitive: [`mockups/shared/faden-probe.html`](../mockups/shared/faden-probe.html)
- Vorstufe: [`mockups/best-of/`](../mockups/best-of/) — sechs Bereiche, je drei Vorbilder zusammengeführt
- Gestaltungssystem: [`mockups/shared/system.css`](../mockups/shared/system.css) — Tokens, Skala, Kontrastwerte, Faden, Serif, Notizbuch
- Bewegungssystem: [`mockups/shared/bewegung.css`](../mockups/shared/bewegung.css) und [`bewegung.js`](../mockups/shared/bewegung.js)
- Die Handschrift, begründet: [`04_velum-dna.md`](04_velum-dna.md)
- Die Bewegung, dokumentiert: [`03_bewegung.md`](03_bewegung.md)
- Konkurrenz-Anatomie: [`docs/konkurrenz-anatomie.html`](konkurrenz-anatomie.html) — 18 Plätze, 14 verschiedene Produkte
- Der Platz des Zeichens: [`assets/brand/LIESMICH.md`](../assets/brand/LIESMICH.md)
- Canvas: `index.html` im Repo-Stamm — lauffähig, mit echter Zeichen-Engine
