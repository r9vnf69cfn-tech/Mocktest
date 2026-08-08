# Das ist die App

## In drei Sätzen

Eine App für Studium und Alltag, in der Handschrift, Notizen, Tagebuch, Aufgaben und Lernkarten dasselbe Datenmodell teilen. Wer einen Satz in seiner Vorlesungsnotiz markiert, macht daraus in einem Griff eine Lernkarte, eine Aufgabe oder einen Tagebucheintrag — und das erzeugte Objekt behält sichtbar, woher es stammt. Die Oberfläche selbst tritt zurück: Sie ist Papier und Grau, damit alle Farbe dem gehört, was der Nutzer hineinschreibt.

## Für wen

Für Studierende und alle, die über Monate an denselben Themen arbeiten. Nicht für den, der nur eine Einkaufsliste braucht — dafür ist sie zu viel. Sondern für den, der heute eine Vorlesung mitschreibt, daraus morgen lernt, nächste Woche ein Protokoll abgibt und am Ende des Semesters wissen will, wo das alles zusammenhing.

Die Beispielwelt aller Mockups ist deshalb konkret: Emil, Biologie im dritten Semester, Notizbuch „Zellbiologie", Abgabe bei Prof. Wendt am Freitag.

## Der eine Grund zu wechseln

**Der Weg zwischen den Werkzeugen entfällt.** Heute kostet dieselbe Arbeit fünf Apps und drei Exporte: In Bear steht die Notiz, in Anki liegen die Karten, in Things die Abgabe — und keine dieser Apps weiß von den anderen. Hier ist die Kette ein Objekt: Die Notiz weiß, dass aus ihr zwölf Karten wurden, die Karte weiß, aus welchem Absatz sie stammt, und der Tageseinstieg erzählt beides in einer Zeile.

Kein Konkurrent kann das. RemNote kommt am nächsten, bezahlt es aber mit einer Lernkurve, die Rezensenten regelmäßig als Haupthürde nennen (siehe `01_konkurrenz-anatomie.md`, Kapitel Lernkarten).

---

## Wie sie aussieht — und warum

### Das Prinzip in einem Satz

> **Die App ist Papier und Grau; die einzige Farbe, die zählt, hat der Nutzer hineingebracht — und jede Spur, die seine Arbeit zwischen den Modulen hinterlässt, bleibt sichtbar.**

Daraus folgt alles Weitere: das Farbsystem, die Zurückhaltung der Oberfläche, die Herkunfts-Chips, die Ketten-Karte.

### Farbe

Ein einziger Akzent, **Ink**: fast-schwarz (`#16181C`) im hellen, fast-weiß (`#F2F3F5`) im dunklen Modus. Er hat genau drei Aufgaben — aktiver Zustand, primäre Aktion, Auswahl. Nichts sonst ist eingefärbt.

Die fünf Modul-Farben erscheinen ausschließlich als **6-pt-Punkte** neben einem Wort und als Akzent auf Notizbuch-Covern. Sie färben nie eine Fläche, keinen Text und keinen Knopf; die Einstellungen erklären das dem Nutzer sogar wörtlich (`app-next/settings.html`). Rot bleibt dem Löschen und der Deadline vorbehalten, Grün dem Erfolg.

Warum so streng: Sechs Module mit sechs Hausfarben ergeben ein Sammelsurium, in dem der Nutzer die Farbe der App liest statt seiner eigenen Inhalte. Bear (ein Akzent) und Things (ein Akzent) sind die beiden ADA-Gewinner im Feld — Todoist mit vier Prioritätsfarben ist die App, bei der man am längsten sucht, was gemeint ist.

**Jeder Wert ist gerechnet, nicht geschätzt** (`shared/system.css`, §1): Fließtext 17,8:1 auf Papier, Sekundärtext 5,3:1, Tertiärtext 4,8:1, Text auf Akzentfläche 17,8:1. Zwei Modul-Punkte erreichen im hellen Modus nur 2,95:1 bzw. 2,83:1 — deshalb stehen Punkte **nie allein**, sondern immer neben ihrem Wort, und für den Fall, dass die Farbe doch einmal ein Icon trägt, gibt es abgedunkelte Varianten über 3:1.

### Typografie

Fünf Größen, zwei Gewichte, feste Rollen:

| Rolle | Größe | Gewicht | Wofür |
|---|---|---|---|
| Titel | 28/34 | 600 | Screen-Titel, Begrüßung |
| Sektion | 20/26 | 600 | Sektionsköpfe, Karten- und Eintragstitel |
| Text | 17/23 | 400 | Fließtext, Listenzeile — die Arbeitsgröße |
| Sekundär | 15/20 | 400 | Untertitel, Metadaten, Vorschauzeilen |
| Marke | 13/16 | 600 | Chips, Zähler, Eyebrows |

Genau **eine** begründete Ausnahme: Die Tab-Beschriftung auf dem iPhone läuft mit 11 pt (iOS-Standard). Bei 13 pt kollidieren „Bibliothek" und „Aufgaben" auf 393 pt Breite — überlappender Text wiegt schwerer als eine sechste Stufe an einer Stelle.

**Serif ist keine sechste Größe, sondern eine Regel:** Die Oberfläche spricht Sans, was der Nutzer geschrieben hat, darf Serif. Sichtbar im Notiz-Editor (`app-next/note-editor.html`), im Journal-Eintrag (`journal-entry.html`) und auf der Antwortseite der Lernkarte (`review-session.html`). Der Bruch markiert eine echte Grenze: hier Werkzeug, dort Inhalt.

### Raster und Dichte

**iPad** (1194 × 834): Sidebar 320 pt, Inhalt mit 24 pt Rand, wo sinnvoll zweispaltig — links die Arbeit, rechts der Kontext. Diese Teilung trägt `today.html`, `tasks.html`, `journal-home.html` und `flashcards-home.html`.

**iPhone** (393 × 852): 20 pt Rand, Tab-Bar statt Sidebar, dieselben Abschnitte gestapelt. Wichtigste Regel: Was man häufig tut, liegt im unteren Drittel — Schnellerfassung, primäre Knöpfe, die Bewertungsknöpfe der Lernsitzung als 2×2-Raster.

Die Dichte ist **arbeitsteilig**, nicht gleichmäßig — die Lehre aus Bear: Ruhe beim Schreiben, Dichte beim Verwalten. Der Editor trägt nur Text; die Aufgabenliste trägt Zeilen; die Bibliothek trägt Cover.

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

### Bewegung

Vier Übergänge, jeder mit einer Aufgabe:

- **Öffnen** (260 ms): Karte wächst aus ihrer Position. Das Detail einer Aufgabe klappt *in* der Liste auf, statt einen Screen zu schieben (`task-detail.html`) — von Things 3.
- **Modulwechsel** (180 ms): nur Überblendung. Ein Wechsel ist kein Ereignis.
- **Bestätigen** (120 ms): Die Checkbox zieht ihren Ring zusammen, während der Haken wächst. Auf `today.html` und `tasks.html` ist dieser Moment **eingefroren sichtbar**.
- **Übergabe** (420 ms) — die Signature: Die Auswahl faltet sich zu einer kleinen Karte, fliegt zum Ziel und landet dort als Chip. In `note-editor.html` steht sie mitten im Flug, mit Spur und dem Umriss am Ausgangsort.

---

## Wie sie sich anfühlt

**Die Übergabe.** Ein Satz in der Notiz ist markiert, darüber steht eine Leiste — dieselbe, egal ob die Auswahl Handschrift, Text oder Objekte sind. Ein Tipp auf „Lückentext-Karte", und die Karte faltet sich aus dem Satz heraus, fliegt in die rechte Spalte und der Zähler dort springt von 11 auf 12.

**Die Kette am Morgen.** Der Tageseinstieg begrüßt nicht mit einer Kachelwand, sondern erzählt: „Zellbiologie" → 12 Karten → 8 heute fällig, ca. 4 Minuten. Jede Station ist anspringbar, und am Ende steht der Knopf, der die vier Minuten sofort einlöst.

**Der Termin im Knopf.** Beim Lernen steht auf jedem der vier Bewertungsknöpfe das ausgerechnete nächste Intervall — „Gut · 5 Tage". Man bewertet nicht sein Gefühl, sondern wählt sichtbar den nächsten Termin; „Gut" bekommt mehr Fläche als die anderen drei, weil es in neun von zehn Fällen die Antwort ist.

**Der Rückweg.** Auf der Antwortseite der Karte steht in einem eingelassenen Feld, wie der Satz in der eigenen Notiz lautete. Wer stutzt, springt mit einem Tipp zurück in die Vorlesung von damals, ohne die Sitzung zu verlassen.

**Der Blick aufs Ganze.** Der Graph zeigt 27 Objekte und 41 Verbindungen, unterschieden nach Wiki-Link, Tag und Herkunft. Man sieht zum ersten Mal, dass das Laborprotokoll, die Skizze und acht Karten alle an derselben Vorlesung hängen.

---

## Was sie bewusst nicht ist

- **Kein Team-Werkzeug.** Es gibt Teilen, aber keine Kommentarfäden, keine Zuweisungen, keine Rollen. Wer zu fünft an einem Dokument arbeitet, ist hier falsch.
- **Keine zweite Notion.** Keine Datenbanken, keine Formeln, keine frei konfigurierbaren Ansichten. Die App hat eine Meinung, wie die fünf Module zusammenhängen — genau das ist ihr Wert.
- **Kein Belohnungssystem.** Es gibt eine Serie, aber keine Punkte, keine Ränge, keine Vergleiche mit anderen. Und die Serie ist abschaltbar: Eine App darf niemanden dafür bestrafen, dass er sie diese Woche nur für Aufgaben braucht — der Fehler, den Apple Journal bis heute nicht behebt.
- **Kein Theme-Baukasten.** Zwei Modi, beide fertig gestaltet. Bear hat 28 Themes; das ist Personalisierung als Ersatz für Entscheidung.
- **Kein Marktplatz.** Die Bibliothek ist der Ort für die eigenen Dokumente, nicht für Vorlagenwerbung.

---

## Award-Bilanz

Bewertung des vorliegenden Entwurfs gegen die fünf ADA-Kategorien. Skala: **1 = preiswürdig … 5 = disqualifizierend**.

| Kategorie | Note | Begründung |
|---|---|---|
| **Inklusion** | **2** | Alle Kontraste sind gerechnet und dokumentiert, jeder Zustand trägt zwei Merkmale, Dynamic Type ist in zwei Stufen durchgezeichnet, 44-pt-Ziele durchgehend. Ein eigener Schirm zeigt sechs leere Zustände, die alle den nächsten Schritt benennen statt ihn zu verstecken. Zur 1 fehlt die geprüfte VoiceOver-Reihenfolge: Ein Mockup kann Vorlesereihenfolge und Rotor-Struktur behaupten, aber nicht beweisen. |
| **Delight & Fun** | **2** | Vier Momente sind als eingefrorene Zwischenzustände wirklich sichtbar — die fliegende Karte, die Checkbox im Umlegen, die Karte im Flip, der Schalter zwischen den Positionen. Zur 1 fehlt die Bewegung selbst: In statischen Screens bleibt die Signature-Animation eine Behauptung. |
| **Interaktion** | **2** | Der nächste Schritt ist überall benannt und beziffert („Lernen · ca. 4 Minuten"), das Detail klappt in der Liste auf statt zu navigieren, dieselbe Aufgabe kostet auf dem iPhone nicht mehr Taps. Abzug für das Lineal- und Zoom-Verhalten im Canvas, das nur beschrieben, nicht durchgespielt ist. |
| **Visuals & Grafik** | **1–2** | Ein Raster, eine Typo-Skala, eine Materialsprache über 18 Screens hinweg, ein einziger Akzent, alle Werte in einer gemeinsamen Datei. Das ist die stärkste Kategorie des Entwurfs. Der halbe Punkt Abzug geht an die Notizbuch-Cover: Sie sind aus Mustern gebaut, weil kein Bildmaterial vorlag. |
| **Innovation** | **1** | Die Kette ist keine Fußnote, sondern trägt den Einstiegsscreen, den Editor, die Lernsitzung und den Graphen. Sie ist überall dieselbe Leiste, hinterlässt überall denselben Herkunfts-Chip, und keiner der 18 untersuchten Konkurrenten hat sie. |

### Die eine Sache, die noch fehlt

**Bewegung, die man sehen kann.** Alles andere ist da — aber die Jury sitzt vor einem laufenden Gerät, nicht vor einem PNG. Die Übergabe ist der Moment, an dem sich diese App von jeder anderen unterscheidet, und in einem statischen Screen bleibt sie ein Standbild mit Spur.

Was fehlt, ist ein **lauffähiger Prototyp genau dieser 420 ms**: der markierte Satz, der sich zur Karte faltet, an der Übergabe-Leiste abhebt, in die Seitenspalte fliegt und den Zähler dort umspringen lässt. Das Canvas-Mockup in diesem Repo zeigt, dass so etwas als echte Engine baubar ist. Solange dieser eine Übergang nur behauptet ist, hält die Jury nicht inne — mit ihm wird er die Stelle, die man einem Freund zeigt.

---

## Verweise

- Alle Mockups: `mockups/index.html`
- Der Entwurf: `mockups/app-next/` — dreizehn Screens, je hell/dunkel und iPad/iPhone
- Kontaktbögen: `mockups/_renders/kontaktbogen-*.png` — alle Screens auf je einem Blatt
- Vorstufe: `mockups/best-of/` — sechs Bereiche, je drei Vorbilder zusammengeführt
- Gestaltungssystem: `mockups/shared/system.css` — Tokens, Skala, Kontrastwerte
- Konkurrenz-Anatomie: `docs/01_konkurrenz-anatomie.md` — 18 Apps zerlegt
- Canvas: `index.html` im Repo-Stamm — lauffähig, mit echter Zeichen-Engine
