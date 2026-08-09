# 04 · Die Handschrift

Warum dieser Entwurf so aussieht, wie er aussieht — und woran man nachprüfen
kann, dass die Antwort nicht „weil es gefällt“ lautet.

Das Dokument setzt drei Dinge zusammen: das Leitmotiv und seine Herleitung, die
Verwandlungs-Tabelle (was von wem stammt, welches Prinzip dahintersteckt, was
Velum daraus macht) und den unbequemen Teil — die Stellen, an denen der Entwurf
noch nah an einer Vorlage steht.

Grundlage sind [`01_konkurrenz-anatomie.md`](01_konkurrenz-anatomie.md) (18
Plätze, sechs Bereiche), die Wiederlesung von neun weiteren Produkten aus
Runde 2 und der Entwurf selbst: `mockups/app-next/` (13 Schirme),
`mockups/shared/system.css` (das Gestaltungssystem),
`mockups/shared/faden-probe.html` (die Musterseite der Primitive).

---

## 0 · Das Leitmotiv

> **Jede Verbindung in Velum ist ein Faden zwischen zwei Punkten — und man kann
> ihn in beide Richtungen ablaufen.**

Ein Leitmotiv ist billig zu behaupten. Die Frage ist, ob es aus der App folgt
oder auf sie gelegt wurde. Vier Herleitungen, unabhängig voneinander.

### 0.1 Der Name

*Velum* ist lateinisch für Segel, Vorhang, Tuch — gewebter Stoff. Ein Gewebe
besteht aus Fäden. Das Motiv steht im Namen, bevor irgendjemand etwas
gezeichnet hat.

### 0.2 Das Zeichen

Das Logo ist ein Serif-V mit einem kupferfarbenen Punkt rechts unten: zwei
Striche, die sich in einem Punkt treffen. Faden und Knoten. Das Zeichen ist
bereits das Motiv im kleinsten Maßstab.

### 0.3 Der Rohstoff

Velums eigentliches Material ist Handschrift — und ein Handschrift-Strich *ist*
ein Faden: er hat einen Anfang, eine Richtung, eine wechselnde Stärke und ein
Ende. App und Motiv bestehen aus demselben Stoff. Das kann kein Konkurrent
behaupten, weil bei keinem Handschrift gleichwertiger Inhalt ist: In Notability
und Noteshelf ist sie das einzige Material, in Obsidian, Bear und Craft gar
keins. Nur bei Velum steht sie neben getipptem Text im selben Datenmodell.

### 0.4 Die vier Eigenschaften, die nur Velum hat

Alle vier sind Fäden. Das ist keine Umdeutung, sondern die Lesart, unter der
sie zusammenfallen:

| Velums Eigenschaft | Als Faden gelesen |
|---|---|
| Fünf Module, ein Datenmodell | Der Faden läuft zwischen Modulen, nicht nur innerhalb |
| Handschrift ist gleichwertiger Inhalt | Der Strich selbst ist der Faden |
| Zeit ist Inhalt (Audio synchron zur Tinte) | Der Faden hat eine Richtung: die Zeit |
| Herkunft ist sichtbar | Der Faden ist rückwärts begehbar |

Wo diese vier Eigenschaften nicht im Spiel sind, ist auch kein Faden. Das ist
der Unterschied zwischen einem Motiv und einer Verzierung.

### 0.5 Die Regel, die beides trennt

> **Ein Faden wird nur dort gezeichnet, wo im Datenmodell wirklich eine
> Beziehung besteht. Kein Faden ohne Kante.**

Daraus folgt ein Verbot, das im Alltag mehr kostet als die Regel selbst: Der
Faden darf nicht als Rahmen, Trennlinie, Unterstreichung oder Zierleiste
auftreten. Trennlinien bleiben `--line` und sind kein Faden. Wenn man nicht
sagen kann, welche zwei Objekte ein Strich verbindet, ist es keiner — und dann
darf er auch nicht so aussehen.

Die Musterseite `mockups/shared/faden-probe.html` zeigt genau diesen
Unterschied nebeneinander: zwei Listenzeilen mit einer Trennlinie dazwischen
(„Zwei Zeilen, keine Beziehung. Hier gehört kein Faden hin.“) und darunter
denselben Abstand mit einem Faden, der zwei benannte Punkte verbindet.

Die Regel kostet an drei Stellen konkret etwas, und diese drei Stellen sind der
Beleg dafür, dass sie eingehalten wird:

* **Der Stimmungsverlauf im Journal** wäre als Faden hübsch. Er verbindet aber
  keine zwei benannten Objekte, sondern vierzehn Messwerte. Er bleibt eine
  Diagrammlinie in `--line-2` und sieht sichtbar anders aus als ein Faden.
* **Ort und Wetter im Journaleintrag** sind Eigenschaften, keine Beziehungen.
  Kein Faden.
* **Der Fortschrittsbalken auf der Deck-Karte** bleibt ein Balken. Ein Balken
  ist eine Menge, kein Weg.

### 0.6 Was eine Handschrift ist — die Lehre aus Arc und Linear

Zwei Produkte außerhalb der Kategorie wurden für diese Runde gelesen, weil
beide eine sofort erkennbare Handschrift haben, ohne gegen ihre Plattform zu
arbeiten. Sie erreichen das über denselben Mechanismus:

> **Sie nehmen sich ein Mittel weg, das alle anderen benutzen, und ersetzen es
> durch eine einzige strukturelle Entscheidung, die überall gilt.**

Arc nimmt sich die waagerechte Reiterleiste weg und ersetzt sie durch „Spaces“.
Linear nimmt sich die Farbpalette weg und ersetzt sie durch einen Akzent plus
Helligkeitsstufen (belegt: fast vollständig achromatisches System, ein
Markenakzent, Wechsel von HSL auf LCH, damit dieselbe Regel in hell und dunkel
gilt).

Velums Fassung dieses Satzes: **Velum nimmt sich die Trennung der Module weg
und ersetzt sie durch den Faden.**

Dazu gehört die unangenehme Hälfte. Arc wird nicht mehr entwickelt: Der Gründer
hat am 27.05.2025 das Ende der aktiven Entwicklung angekündigt, Atlassian hat
die Firma am 21.10.2025 übernommen, seither gibt es Sicherheitskorrekturen und
keine neuen Funktionen (belegt). Eine Handschrift, die viele Gestalter als die
prägnanteste der letzten Jahre nennen — das ist eine Einschätzung, keine
Messung —, hat ihre Firma nicht getragen. Zwei Lehren daraus, beide in diesem
Entwurf eingelöst:

1. **Eine Handschrift muss billig sein.** Arcs Eigenart kostete eine eigene
   Rendering-Schicht und ein eigenes Fenstermodell. Velums Eigenart —
   New York als Systemserif, kein Web-Font, kein Ladezeitpunkt; Ink statt
   Buntfarbe; ein 1,5-pt-Strich in SVG — kostet null Byte und null
   Millisekunden. Das ist keine Sparsamkeit, das ist Haltbarkeit.
2. **Eine Handschrift muss aus dem Material folgen.** Arcs Spaces folgten aus
   einem Problem. Velums Faden folgt aus Name, Zeichen, Rohstoff und vier
   Datenmodell-Eigenschaften — vier unabhängige Herleitungen statt einer.

### 0.7 Der Anschluss an das, was schon existierte

Velums eigene Design-Spec vom März 2026 hat das Motiv dreimal angefasst, ohne
es zu benennen:

| In der März-Spec | Was es tatsächlich ist |
|---|---|
| „Wiki-Link Constellation“ | Punkte mit Verbindungen — ein Graph aus Fäden |
| „Streak: consecutive days show connected line between circles“ | ein Faden aus Punkten |
| „Cross-Module Drag Morph“ | der Weg von Modul zu Modul, also ein Faden in Bewegung |

Drei Einzelfälle in einer Spec sind ein Zufall. Runde 2 macht daraus ein
System: dieselben drei Bausteine, dieselbe Bedeutung, an elf Orten.

---

## 1 · Die drei Primitive

Das ganze Motiv besteht aus genau drei Bausteinen. Mehr gibt es nicht. Alle
drei stehen als Klassen in `system.css` §9 und sind auf
`mockups/shared/faden-probe.html` in jedem Zustand nebeneinander zu sehen.

### 1.1 Der Punkt — ein Objekt

Der 6-pt-Dot aus Runde 1 wird vom Etikett zum Grundbaustein.

| Zustand | Aussehen | Bedeutung |
|---|---|---|
| gefüllt | 6 pt, volle Modulfarbe | Objekt existiert |
| hohl | 6 pt, 1,4-pt-Ring | geplant, offen, noch nicht da |
| Ring | 6 pt Kern + Ring in Ink | aktiv, heute, ausgewählt |
| Knoten | 9 pt, Ink gefüllt, Ring in der Farbe des Untergrunds | hier treffen sich Fäden |

Der **hohle Punkt** ist die Stelle, an der eine fremde Idee am weitesten
getragen hat. Obsidians
*unlinked mentions* zeigen an, was verlinkt sein *könnte* und es noch nicht ist
— im ganzen Feld der einzige Ort, an dem eine App eine Beziehung vorschlägt,
statt nur eingetragene wiederzugeben. Das Prinzip dahinter: **ein fehlender
Faden ist auch eine Information.** Bei Obsidian betrifft das immer nur
Notiz ↔ Notiz. Bei Velum läuft der vorgeschlagene Faden über Modulgrenzen: „zu
diesem Merksatz gibt es keine Karte.“ Ein hohler Punkt am Absatzrand, ein Tap
füllt ihn.

Die Zwei-Merkmal-Regel bleibt in Kraft: **Ein Punkt steht nie allein** — immer
Punkt + Wort, Punkt + Position oder Punkt + Fläche. Der Grund ist gerechnet:
zwei der fünf Modulfarben halten im hellen Modus nur 2,95:1 (Notizen) und
2,83:1 (Journal) gegen Papier. Sie dürfen deshalb keine Aussage allein tragen.

### 1.2 Der Faden — eine Beziehung

* **Strich, nie Fläche.** SVG statt CSS-Rahmen — nur so kann er sich zeichnen
  (`stroke-dasharray`) und rückwärts wieder einlaufen.
* **Stärke sagt Nähe.** 1 pt = schwache Beziehung (gleicher Tag) · 1,5 pt =
  normale (Verweis) · 2,5 pt = starke (Herkunft: A wurde zu B).
* **Richtung ist Kausalität.** In Bewegung zeichnet er sich immer vom Ursprung
  zum Ergebnis, nie umgekehrt. Beim Zurückgehen läuft er rückwärts ein.
* **Verjüngung.** Am Ursprung trägt er seine volle Stärke, am Ergebnis 60 %
  davon: 1,0 → 0,6 · 1,5 → 0,9 · 2,5 → 1,5 pt. Damit ist die Richtung auch im
  Standbild lesbar. Gemessen wird am Ursprung, deshalb bleiben die drei
  Stärken so unterscheidbar wie vorher.
* **Form:** gerade oder eine quadratische Bézier. Keine S-Kurven, keine
  Schnörkel, keine Bögen um Ecken.
* **Farbe:** ruhend grau, Ink **nur wenn aktiv**. **Niemals bunt** —
  Modulfarben gehören dem Punkt, nicht dem Faden.

**Warum eine Verjüngung und keine Pfeilspitze.** Eine Bewerbung besteht aus
Standbildern, und das Versprechen „man kann ihn in beide Richtungen ablaufen“
setzt voraus, dass man die Ruhelage einer Richtung ansieht. Die Verjüngung
folgt dabei aus dem Rohstoff (§0.3): Ein Handschrift-Strich beginnt mit Druck
und läuft aus — sie ist das, was ein Stift ohnehin tut, kein Zeichen, das dem
Motiv aufgesetzt wird. Eine Pfeilspitze käme aus dem Flussdiagramm und machte
den Faden zum Konnektor: genau das, was die Recherche an Freeform als
„Geometrie zwischen zwei Kästen, keine Beziehung“ verworfen hat. Sie kostet
außerdem nichts — kein zusätzliches Element, kein zusätzliches Wort.

Gebaut ist sie als `clip-path` auf dem einen Strich, im Kastenmaß statt in der
viewBox, damit die ungleichmäßige Dehnung sie nicht erreicht; Farbe, runde
Kappe und die Zeichen-Animation bleiben am Strich. **Ihre Grenze steht
mitgeschrieben:** Eine Maske braucht die Senkrechte auf den Faden, und die ist
nur dort aus dem Kastenmaß zu gewinnen, wo `system.css` die Form vorgibt.
262 der 282 Fäden im Bestand verjüngen sich (93 %); die zwanzig frei
gezeichneten — Kantenbündel im Graph, von `MOCK.thread()` gespannte Fäden,
drei handgezeichnete, die Handschriftprobe — bleiben gleich stark, weil eine
Maske, die den Winkel raten müsste, den Strich schief abschnitte. Die Rechnung
und die Messung am dünnen Ende stehen in `system.css` §9.2.

**Ink am Faden heißt ausschließlich „aktiv“.** Ink hat drei Rollen — aktiver
Zustand, primäre Aktion, Auswahl —, und „liegt hinter mir“ ist keine davon.
Auf den Intervall-Leitern von `flashcards-home` und `review-session` trugen
die bereits gelaufenen Fadenstücke volles Ink; sie stehen jetzt auf `--thread`
wie jeder ruhende Faden. Was „gelaufen“ sagt, ist **der Punkt**: gefüllt für
gelaufen, Ring für jetzt fällig, hohl für geplant (§1.1). Vorher trugen Faden
und Punkt dieselbe Aussage doppelt; jetzt trägt jeder eine eigene.

### 1.3 Der Knoten — wo Fäden sich treffen

9 pt, Ink gefüllt, mit einem 2-pt-Ring in der Farbe des Untergrunds, damit er
auf einem Faden sitzen kann, ohne mit ihm zu verschmelzen. Der Knoten ist der
einzige Ort, an dem der Ink-Akzent auf etwas sitzt, das kein Bedienelement ist
— er markiert Auswahl, und Auswahl ist eine der drei erlaubten Ink-Rollen.

Auf der Musterseite steht der Fehlerfall direkt daneben: derselbe Knoten mit
Papierring auf grauem Grund, beschriftet „falsch — Papierring reißt den Faden
auf“. Ein Baustein, dessen Fehlbedienung nicht gezeigt wird, ist nicht fertig
beschrieben.

### 1.4 Wo die eigene Vorgabe korrigiert wurde

Die interne Festlegung schrieb für den ruhenden Faden `--line-2` vor und für
den Ring des hohlen Punktes `--ink-4`. Nachgerechnet halten diese beiden 1,46:1
und 1,95:1 — deutlich unter den 3:1, die dieselbe Festlegung für
Bedienoberfläche verlangt. Beide Primitive liegen deshalb jetzt auf einem
eigenen Pegel (`rgba(22,24,28,0.47)`, gerechnet 3,10:1 auf Papier, 3,03:1 auf
Grund, 3,13:1 bzw. 3,10:1 im dunklen Modus).

Das ist die Art Abweichung, die ein Gestaltungssystem haben darf: Sie ist
begründet, gerechnet und im Quelltext an der Stelle vermerkt, an der sie steht
(`system.css` §1.4b). Eine Regel, die man nicht gegen ihre eigene Vorgabe
prüft, ist eine Behauptung.

### 1.5 Die elf Orte

Verbindlich, alle Schirme:

| Ort | Was der Faden dort ist |
|---|---|
| Ketten-Karte auf Heute | Notiz → Karten → heute fällig, ein Faden mit drei Knoten |
| Herkunfts-Chip | Tap zeichnet den Faden zurück zum Ursprung |
| Graph | Kanten sind Fäden, Objekte sind Punkte |
| Journal-Zeitachse | Die Datums-Schiene ist ein senkrechter Faden, Einträge sind Knoten |
| Streak | Faden aus Punkten, gefüllte = erledigte Tage |
| Notizen-Editor | Wiki-Links hängen als kurze Fäden in der Marginalspalte |
| Lernkarten | Die Intervall-Reihe (1 d · 3 d · 8 d) als Faden mit Punkten |
| Aufgaben | Teilschritte hängen als Faden unter der Aufgabe |
| Notizbuch-Cover | Der Buchrücken ist ein Faden, das Cover-Motiv variiert ihn |
| Leere Zustände | Ein Faden, der ins Leere läuft und in einem hohlen Punkt endet |
| Übergabe | Der Faden wächst vom Ursprung zum Ziel, während die Karte wandert |

Der Stand dieser elf Orte steht in §5.8 — ungeschönt.

### 1.6 Die Endpunkt-Konvention

**Ein Fadenende sitzt auf der Punktmitte oder am Punktrand — höchstens
5,2 pt Abstand.** Alles darüber ist ein Fehler, keine Gestaltung.

Die Regel ist nicht neu, sie war nur nirgends aufgeschrieben: Drei
Prüfrunden haben gegen sie gemessen, ohne dass das Gestaltungssystem sie
führte. Sie steht deshalb jetzt als Kommentarblock in `system.css` §9.2b, dort,
wo der Faden gebaut wird — eine Regel, die man messen kann, aber nicht lesen,
ist keine. Dort steht auch, woher die 5,2 kommen: Ein Knoten misst 9 pt und hat
4,5 pt Radius; 5,2 lassen zusätzlich die halbe Fadenstärke und das
Rundungsspiel des Layouts zu.

Der Grund ist der Kern des Motivs: Ein Faden verbindet zwei Objekte. Hängt ein
Ende frei, verbindet er ein Objekt mit nichts, und dann ist er kein Faden,
sondern ein Strich — die eine Form, die §1.2 verbietet.

**Die einzige Ausnahme ist der gekappte Faden.** Er endet ohne Punkt und sagt
damit, dass die Quelle gelöscht wurde. Das ist keine Nachlässigkeit, sondern
eine Aussage: Die Kante hat es gegeben, ihr anderes Ende gibt es nicht mehr.

---

## 2 · Die Verwandlungs-Tabelle

### 2.1 Der Maßstab

Runde 1 hat gefragt: *Was übernehme ich?* Diese Tabelle fragt anders: *Welches
Prinzip steckt hinter der übernommenen Idee — und wie sieht Velums eigene
Antwort darauf aus?*

Eine Antwort in der vierten Spalte zählt nur, wenn sie

1. etwas nennt, das die Quelle **nicht** hat,
2. aus einer der vier Alleinstellungen folgt, und
3. sich als Faden zwischen zwei **benannten** Punkten zeichnen lässt.

Wo das nicht geht, steht **1 : 1** mit Begründung. Eine ehrliche
Konventionszeile ist mehr wert als eine erfundene Verwandlung — und §2.3 ist
deshalb kein Anhang, sondern Teil des Arguments.

Kennzeichnung: **✚** Verwandlung, die aus einer Alleinstellung folgt ·
**1 : 1** bleibt wie beim Vorbild · **offen** entschieden, aber im Entwurf noch
nicht gezeichnet · **Befund** die Übernahme geht zu weit, siehe §5.

Die vollständige Fassung umfasst 70 Zeilen. Hier stehen die 32, die tragen,
plus 13 Konventionszeilen in Kurzform (§2.3); die Bilanz in §2.4 rechnet über
alle 70.

### 2.2 Die Zeilen, die tragen

**Heute** (`today.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Liste nach Bereich gruppiert statt nach Uhrzeit; der Tag hat ein sichtbares Ende | Things 3 | Ein Tag ist eine endliche Menge, keine Uhr. Restlänge liest man räumlich. | **✚** Bei Things ist die Gruppe ein *Ordner*. Bei Velum ist sie ein **Knoten**: „Biologie“ ist der Punkt, an dem Notiz, Karte und Aufgabe zusammenlaufen. Die Gruppenüberschrift ist anspringbar und zeigt alle fünf Module dieses Knotens — Things' Bereich zeigt nur Aufgaben. |
| Ketten-Karte „Notiz → 12 Karten → 8 heute fällig“ | niemand; die Form stammt vom Fortschritts-Breadcrumb | Eine Kausalkette in einer Zeile erzählen statt in fünf Kacheln. | **offen ✚** Muss ein Faden mit drei Knoten sein, 2,5 pt, in beide Richtungen begehbar: Tap auf „8 Karten“ läuft rückwärts bis zum Absatz. Im Entwurf sind es drei Kästen mit Winkeln. Siehe §5.3. |
| Impuls-Karte mit konkreter Frage statt leerem Feld | Apple Journal | Das leere Blatt ist die teuerste Hürde; ein Satz ist billiger als ein Knopf. | **1 : 1** in Form und Ton. Verwandelt ist nur die Herkunft der Frage: Apple erzeugt sie aus Fotos und Orten, Velum aus dem eigenen Bestand. Kein Faden — hier wäre er Zierat. |
| Kennzahlen-Block „6 Aufgaben · 23 Karten · 12 Tage in Folge“ | Todoist-Kopfzeile, Anki-Deck-Zähler | Vor der Arbeit sagen, woraus die Arbeit besteht. | **✚** Bei Todoist und Anki sind das unabhängige Zahlen. Bei Velum sind es **Enden desselben Fadens**: Die 23 Karten *sind* die 12 Absätze von gestern. Jede Zahl führt deshalb nicht in eine Liste, sondern auf die Kette — an einer anderen Stelle betreten. |

**Bibliothek** (`library.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Cover-Raster mit Buchgefühl (Rücken, Schnittkante, Papierart) | GoodNotes 6 | Ein Dokument, das wie ein Gegenstand aussieht, wird an der Silhouette erkannt, bevor der Titel gelesen wird. | **offen ✚** Der Buchrücken ist ein Faden, das Cover-Motiv variiert ihn — damit trägt jedes Cover dieselbe Grammatik wie der Rest der App, ohne bunt zu werden. GoodNotes löst dasselbe Problem mit Fertig-Covern; das ist Auswahl, keine Gestaltung. |
| Smart-Ordner mit Regel-Untertitel und Zähler | Craft, Apple Notes | Eine Zahl macht einen Ordner einschätzbar; „Markiert 4“ ist eine Aussage, „Markiert“ ein Etikett. | **✚** Bei Craft und Apple filtert ein Smart-Ordner über *Attribute*. Velums filtert über die **Kante**: „Hat eine Aufgabe erzeugt“, „Ohne Herkunft“, „Aus dem Canvas gekommen“. Das kann keines der 21 Produkte, weil keines die Kante als Feld hat. |

**Notizen** (`notes-list.html`, `note-editor.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Verschachtelte Tags als Baum, entstanden beim Schreiben (`#uni/bio`) | Bear 2 | Organisation entsteht im Fließtext, nicht im Metadatenfeld. | **✚** Bear filtert eine Notizliste. Velums Tag ist ein **Knoten**, an dem Fäden aus fünf Modulen zusammenlaufen: `#labor` hält die Notiz, den Journaleintrag, drei Karten und eine Aufgabe. Ein Tap zeigt deshalb keine Liste, sondern die Fäden, die durch ihn laufen. Die Syntax bleibt Bears; das Ergebnis kann Bear strukturell nicht. |
| Zwei Zeilen Vorschau in der Listenzeile | Apple Notes | Zwei Zeilen Anfangstext sagen mehr als jedes Symbol. | **1 : 1** in der Form. **✚** in der Metazeile: statt des Ordnernamens stehen dort Chips für das, was aus der Notiz geworden ist („12 Karten“, „1 Aufgabe“). Apple Notes und Bear verschweigen das, weil sie es nicht wissen. |
| Blockgriff in der linken Rinne, im Ruhezustand leer | Craft | Die gesamte Manipulationsebene sieht aus wie Leerraum. | **offen ✚** Bei Craft ist die Rinne nur ein Griff. Bei Velum ist sie der **Herkunfts-Rand**: Jeder Absatz, aus dem etwas entstanden ist, trägt dort einen 1,5-pt-Fadenstumpf mit einem Punkt am Ende — gefüllt heißt „existiert“, hohl heißt „vorgeschlagen“. Beim Scrollen liest man am Rand mit, welche Absätze gearbeitet haben. |
| Backlinks als permanenter Abschnitt, nicht in einer Schublade | Craft, Obsidian | Verbindungen sind Inhalt, nicht Werkzeug. | **✚** Beide zeigen **eingehende** Links. Velum zeigt die Gegenrichtung gleichrangig: **„Daraus entstanden — 12 Karten · 1 Aufgabe“**. Das ist die eine Zeile, die weder Craft noch Obsidian schreiben können. |
| Wiki-Link `[[Osmose]]` mit sichtbaren Klammern | Obsidian, Roam, Bear | Die Verbindung wird getippt, nicht geklickt. | **1 : 1** in der Syntax. **offen ✚** in der Darstellung: kurze Fäden in der Marginalspalte, sichtbar, ohne den Satz zu unterbrechen. Im Entwurf sind es bisher nur Klammern im Text. |
| Info-Panel rechts mit Abschnitten | Bear, Obsidian | Zusatzinformation neben dem Text, nicht darüber. | **Befund**, keine Verwandlung. Siehe §5.2. |

**Journal** (`journal-home.html`, `journal-entry.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Datums-Schiene links, Marke außerhalb der Karte, durchgehende Linie dazwischen | Day One | Weil die Zahl immer auf derselben x-Achse sitzt, entsteht ein senkrechtes Lineal, das man ohne Lesen verfolgt. Dann braucht die Liste weder Trennlinien noch Rahmen. | **offen ✚** Die Schiene *ist* der Faden, die Einträge sind Knoten darauf. Die Journal-Zeitachse ist damit dieselbe Zeichnung wie der Graph, nur in einer Dimension. Wo ein Eintrag eine Herkunft in einem anderen Modul hat, verlässt ein kurzer Zweig die Schiene nach links. Day One kann keinen Zweig zeichnen, weil dort nichts außer Journal existiert. |
| Serif für den Eintragstext | Day One | Ein Journal muss sich anders anfühlen als eine Notiz-App. | **✚, nach einem Konflikt.** Bleibt — aber mit einer anderen Begründung und einer Gegenprobe: Der **Notiz-Editor bekommt Sans**. Siehe §3.3. |
| Streak als Zahl mit Rekord und einer Reihe aus Punkten | Day One, RemNote, Duolingo | Eine Serie ist eine Tatsache, kein Spiel. | **✚** Der Streak *ist* bereits ein Faden aus Punkten: gefüllt = erledigt, hohl = Lücke. Damit trägt er dieselbe Grammatik wie alles andere. Weggelassen sind Trophäen, Verlustwarnung und Jahresvideo — die haben alle drei Vorbilder. |
| Stimmungsverlauf als Linie über 14 Tage | Journey, Daylio | Der Verlauf ist aussagekräftiger als der Tageswert. | **✚ mit Einschränkung.** Eine Diagrammlinie ist **kein Faden** (§0.5). Sie bleibt sichtbar eine Diagrammlinie. Die Verwandlung gegenüber Journey liegt in der Farbe: fünf Ink-Balken mit ausgeschriebenem Wort statt bunter Emojis — lesbar in Graustufen und bei Farbfehlsichtigkeit. |

**Aufgaben** (`tasks.html`, `task-detail.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Checkbox links, Haken wächst mit Federung, ~1 s Verweildauer vor dem Ausgleiten | Things 3 | Die Pause **ist** das Undo. Es braucht kein Banner, weil die Zeile noch da ist. | **1 : 1** in der Mechanik — beste Lösung im Feld, und sie kostet nichts. **✚** in der Wirkung: In derselben Sekunde zeichnet sich am anderen Ende des Herkunfts-Fadens, in der Notiz, das letzte Stück. Keine Aufgaben-App kann das, weil keine das andere Ende hat. |
| Natürliche Sprache mit sichtbaren Chips („Morgen 14:00 · #labor“) | Todoist | Man sieht vor dem Absenden, was die App verstanden hat, und korrigiert im Satz statt im Formular. | **1 : 1** in Mechanik und Regeln. **✚** durch einen Chip-Typ, den Todoist nicht haben kann: den **Herkunfts-Chip**. Wird aus einer Markierung erfasst, steht „aus ‚Zellbiologie'“ als vierter Chip da — die Kante entsteht beim Erfassen, nicht danach. |
| Fünf Ansichten auf einem Datenbestand (Liste · Planer · Matrix · Board · Kalender) | TickTick | Ansichten sind Regelfenster auf einen Bestand, keine Module. Ziehen schreibt das Attribut um. | **✚** Velum ergänzt einen Filter, den keines der 21 Produkte hat: **Herkunft als Spalte** („aus einer Notiz“ · „aus dem Canvas“ · „ohne Herkunft“). Und Ziehen ist dort kein Attributwechsel, sondern **Fadenzeichnen oder Fadenkappen**: Wer eine Aufgabe nach „ohne Herkunft“ zieht, sieht die Verbindung rückwärts einlaufen und verschwinden. |
| Teilschritte mit Fortschrittsbalken („2 von 4“) | Todoist | Ein Schritt ist keine eigene Aufgabe mit eigener Frist — sonst verdoppelt sich die Liste. | **offen ✚** Teilschritte hängen als Faden unter der Aufgabe, Knoten = Schritte. Der Balken sagt „2 von 4“; der Faden sagt zusätzlich **welche zwei** und in welcher Reihenfolge. Im Entwurf ist es bisher ein Balken. |
| Termin und Frist sind zwei verschiedene Sachen | Todoist, Sorted | „Wann ich es tue“ und „wann es zu spät ist“ sind verschiedene Fragen; ein Feld für beides erzeugt jeden Abend ein schlechtes Gewissen. | **1 : 1** im Konzept, **✚** in der Darstellung: Todoist hat die richtige Idee in der falschen Form (beides als kleiner Text in derselben Metazeile). Velum gibt ihnen zwei Grammatiken — Termin grau links, Frist als roter Chip mit Flagge und Resttagen rechts. Zwei Merkmale, nicht nur Farbe. |

**Lernkarten** (`flashcards-home.html`, `review-session.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Intervall-Vorschau **im** Bewertungsknopf („Gut — in 5 Tagen“) | Anki | Der Knopf sagt, was aus ihm folgt. Der Planer erklärt sich, bevor man ihn bedient. | **✚** Velum macht daraus eine app-weite Regel statt eines Lernkarten-Merkmals: Jeder Knopf, der die Zukunft ändert, nennt die Änderung — „Planen · Mi“, „Ziel 90 % · 17 Karten/Tag“. Nebenregel aus RemNotes Fehler: kein Modus ändert die Terminierung und verschweigt zugleich das Intervall. |
| Vier Bewertungsstufen | Anki, RemNote (dort fünf) | Die Stufe ist eine Terminwahl, kein Gefühlsregler. | **offen.** „Gut“ bekommt mehr Fläche, weil es in den meisten Fällen richtig ist; vier gleich breite Zellen sind Ankis HTML-Tabellen-Altlast. Im Entwurf sind sie gleich breit. Siehe §5.5. |
| „So stand es in deiner Notiz“ — der Quellsatz auf der Antwortseite | niemand vollständig; Ansatz bei RemNote | Die Antwort ist glaubwürdiger, wenn sie im eigenen Wortlaut danebensteht. | **✚** Einer der sieben Serif-Orte: fremde Stimme, andere Schrift. Und der Satz ist nicht kopiert, sondern **das andere Ende des Fadens** — ändert sich die Notiz, ändert sich der Satz. Bei jedem Vorbild wäre das ein toter Textschnipsel. |
| Herkunft bleibt während des Lernens sichtbar | RemNote | Wer beim dritten „Nochmal“ merkt, dass er nachlesen muss, soll die Sitzung nicht verlassen müssen. | **✚** RemNote versteckt die Beziehung in Referenz-Syntax, und der Rückweg kostet die Sitzung. Bei Velum ist der Rückweg kein Sprung, sondern der Faden, der sich rückwärts abspult: Die Karte weicht nach links, der Quellabsatz kommt von rechts, dazwischen steht der Faden gespannt — und der Sitzungszähler bewegt sich nicht. |
| 12-Wochen-Punktraster (Aktivitätsdichte) | Anki-Heatmap, GitHub-Beitragsraster | Ein Streak sagt *ob*, eine Heatmap sagt *wie viel*. | **✚ und Befund.** Verwandelt ist die Farbe (Ink-Deckkraft statt Grün, Zahl darunter). Nicht verwandelt ist die **Bedeutung**. Siehe §5.7. |

**Graph** (`graph.html`)

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Linien haben eine Grammatik: durchgezogen = Wiki-Link, gestrichelt = Tag, punktiert = Herkunft | niemand; Obsidian kennt nur eine Linienart | Eine Kante mit Typ ist eine Aussage; eine Kante ohne Typ ist ein Bild. | **✚ Die stärkste Zeile der Tabelle.** Die dritte Linienart kann kein Konkurrent haben, weil keiner Notizen, Karten und Aufgaben in einem Datenmodell hält. Nur hier ist sichtbar, dass die 12 Karten **Kinder** der Vorlesungsnotiz sind und nicht bloß Nachbarn. Dazu die zweite Dimension: Stärke sagt Nähe. Der Graph ist damit kein Bild des Wissens, sondern ein Bild der Arbeit. |
| Filter-Chips über der Fläche (Notizen · Karten · Aufgaben · Journal · Canvas) | Obsidian-Farbgruppen | Man will Teilmengen sehen, nicht Physik einstellen. | **✚** Obsidians Farbgruppen sind frei wählbare Buntfarben je Suchabfrage — Wolken, deren Bedeutung nur der Autor kennt. Velum hat fünf Farben, die überall dasselbe Modul bedeuten, als 6-pt-Punkt neben dem Wort. Statt Obsidians Reglerwand (Center force, Repel force, Link distance …) genau fünf Chips und Zoom. |
| Kräfte-Layout, Kreisgröße = Anzahl Verbindungen | Obsidian Graph View | Man sieht, wo das eigene Wissen dicht ist und wo es dünn bleibt. | **Befund.** Siehe §5.1. |

**Einstellungen und leere Zustände**

| Idee | Quelle | Prinzip dahinter | Velums Antwort |
|---|---|---|---|
| Design-Auswahl als maßstäblicher Mini-Screen statt als Farbfläche | Things 3 | Wer „Dunkel“ wählt, soll es vorher gesehen haben. | **✚** Things zeigt drei Farbflächen mit Häkchen. Velum zeigt *diese App* in klein — mit Sidebar und zwei Karten auf dem iPad, mit Tab-Bar auf dem iPhone. Daneben steht die Folge im Klartext: „Folgt dem System — wechselt heute um 16:38 auf Dunkel.“ Bear zeigt die Reihe, verschweigt aber die Wirkung. |
| Leerer Zustand zeigt eigenes Material statt einer Aufforderung | Apple Journal | Der beste leere Zustand ist gar nicht leer — die Karte ist gleichzeitig Anzeige und Startknopf. | **1 : 1** im Prinzip, **✚** in der Quelle des Materials: Apple greift auf Fotos und Orte zu, Velum auf den eigenen Bestand über Modulgrenzen — „Drei Stellen sind in ‚Zellbiologie' schon markiert“ auf einem leeren Deck. |
| Symbol im getönten Quadrat, Titel, Satz, Knopf | iOS-Konvention (`ContentUnavailableView`) | Erwartbarkeit. | **offen.** Für leere Zustände gilt etwas anderes: ein einzelner Faden, der ins Leere läuft und in einem hohlen Punkt endet. Siehe §5.4. |

### 2.3 Was 1 : 1 bleibt — und warum

Diese Zeilen sind kein Rest. Sie sind der Beleg dafür, dass die anderen
Entscheidungen welche sind.

| Übernommen | Von wem | Warum unverändert |
|---|---|---|
| Raster/Liste-Umschalter oben rechts | GoodNotes 6, Apple Notes | Konvention seit 2010, überall gleich, und richtig. Hier etwas zu erfinden wäre Eitelkeit. |
| Sortier-Menü „Zuletzt geändert“ | GoodNotes 6, Finder | Eine Sammlung braucht genau eine sichtbare Ordnungsaussage. |
| Suchfeld in der Navigationsleiste · Wischen zum Löschen · Angeheftet oben | Apple Notes, Bear, iOS | Konventionen, die man ohne Anleitung findet. Suchposition oder Wischrichtung zu ändern erzeugt Lernkosten ohne Gegenwert. |
| Long-Press-Kontextmenü, Löschen rot und unten, Trennlinie darüber | iOS | Plattformgrammatik. Wer sie ändert, arbeitet gegen die Plattform — genau der Fehler, den Arc und Linear nicht machen. |
| Trennlinienfreie Liste, Gruppen nur über Abstand, Titel immer neutral | Things 3 | Das Grundgesetz der Liste. Nichts daran verbessern zu wollen ist die richtige Selbstbeherrschung. |
| Überfällig / Eingang als eigener Block mit einer Sammelaktion | Todoist, Things | Überfälliges gehört nicht rot zwischen die heutigen Aufgaben gemischt. |
| Detail klappt **in** der Liste auf, der Titel behält seine y-Position | Things 3 | Das Detail ist kein Ort, sondern ein Zustand der Zeile. Man verliert nie, wo man war. |
| Slash-Befehl am Cursor öffnet die Blocktypen | Craft, Notion | Die Aktion kommt zum Text, nicht der Text zum Menü. Beste Lösung im Feld. (Verwandelt ist nur ein Eintrag der Liste: „Karte aus diesem Absatz“.) |
| Editor ohne Werkzeugleiste über dem Text | Bear 2 | Bear ist der ruhigste Texteditor auf iOS. Das ist eine Leistung, keine Geschmacksfrage. |
| Eingeklappte Sidebar als senkrechte Icon-Schiene | Craft, Obsidian | Konvention aller Drei-Spalten-Apps. Erfindungen kosten hier Orientierung und liefern nichts. |
| Zweispaltige Einstellungen, iPhone-Liste mit dem Wert rechts | Apple Einstellungen | Die beste Struktur, die es für Einstellungen gibt — und der Grund, warum niemand sie neu erfinden muss. |
| Kartendrehung als Bewegung | Quizlet | Das Umdrehen ist der einzige Moment, in dem eine Lernkarte sich wie ein Gegenstand anfühlt. Ohne ihn ist die Sitzung ein Formular. |
| Foto-Streifen mit unterschiedlichen Seitenverhältnissen statt Quadratraster | Day One | Ein Quadratraster macht aus Erinnerungen einen Feed. |

### 2.4 Die Bilanz

Nachgezählt über alle 70 Zeilen der vollständigen Fassung:

| | Zeilen | |
|---|---:|---|
| nur 1 : 1 | 10 | Konvention, bleibt unverändert, mit Begründung |
| 1 : 1 in einem Punkt, ✚ in einem anderen | 19 | Form bleibt, Bedeutung wird verwandelt |
| nur ✚ | 26 | Verwandlung, die aus einer Alleinstellung folgt |
| offen / Befund | 15 | entschieden, im Entwurf noch nicht gezeichnet |

Dass 29 von 70 Zeilen ganz oder teilweise „1 : 1“ tragen, ist kein Mangel. Eine
App, die auch die Checkbox links neu erfindet, ist keine Handschrift, sondern
eine Zumutung.

---

## 3 · Die Marke

### 3.1 Die Serif: New York

`--serif: "New York", ui-serif, Charter, Georgia, "Times New Roman", serif`

Vier Gründe, in dieser Reihenfolge:

1. **Es ist Apples eigene Serif.** Auf iOS, iPadOS und macOS systemseitig da —
   keine Lizenz, kein Web-Font, kein Ladezeitpunkt. Eine App, die Apples
   Systemserif benutzt, sieht am ersten Tag nativ aus. Das ist zugleich die
   Einlösung der Arc-Lehre aus §0.6: Diese Handschrift kostet null Byte.
2. **Optisch je Größe korrigiert.** New York ist in sechs optischen Größen
   gezeichnet; dieselbe Schrift trägt eine 34-pt-Überschrift und eine
   13-pt-Datumsmarke, ohne dass eine davon falsch wirkt.
3. **Sie passt zum Zeichen.** Das Logo ist ein Serif-V. New Yorks V hat
   denselben klaren Ansatz und dieselbe ruhige Achse — die Stimme des Zeichens
   und die Stimme der App sind dieselbe.
4. **Variabel.** Ein Gewicht mehr kostet keine Datei.

### 3.2 Die sieben Orte

Serif ist **Stimme, nicht Textur**. Sie erscheint an genau sieben Orten:

| Ort | Klasse | Warum |
|---|---|---|
| Große Screen-Titel | `.serif--screen-title` | Der erste Eindruck jedes Schirms trägt die Stimme |
| Journal-Datumsmarken | `.serif--journal-date` | Das Datum ist im Journal Inhalt, nicht Metadatum |
| Zitate und der markierte Satz im Review | `.serif--quote` | Fremde Stimme, andere Schrift |
| Titel leerer Zustände | `.serif--empty-title` | Der leere Schirm ist der Ort, an dem die App spricht |
| Notizbuch-Titel auf dem Cover | `.serif--cover-title` | Ein Buch trägt seinen Titel gesetzt, nicht beschriftet |
| Die Wortmarke (Onboarding, Über) | `.serif--wordmark` | Das Zeichen selbst |
| Der Journal-Eintragstext | `.serif--voice` | Siehe §3.3 |

**Nirgends sonst.** Kein Serif in Listen, Knöpfen, Chips, Beschriftungen,
Zahlen, Werkzeugleisten.

Die Typo-Regel bleibt unangetastet: **fünf Größen, zwei Gewichte.** Die Serif
belegt dieselben Größen, sie fügt keine hinzu — `28/34 · 20/26 · 17/23 ·
15/20 · 13/16`, Gewichte 400 und 600.

### 3.3 Der siebte Ort — und warum er kein Day-One-Zitat ist

Runde 1 hat den Journal-Eintragstext von Day One in Serif übernommen und das
„zur Regel“ erklärt. Der Befund dagegen: Das blanke `.serif` trug damit an rund
45 Stellen Fließtext, und Fließtext ist Textur, nicht Stimme.

Aufgelöst ist der Konflikt nicht dadurch, dass die Liste einfach länger wurde,
sondern durch eine Definition, die nur für Velum gilt:

> **`.serif--voice` gilt für durchgehende Prosa, die der Nutzer selbst verfasst
> hat und die als Stimme gelesen wird, nicht als Arbeitsmaterial.**

Das trifft den Journal-Eintragstext — und sonst nichts.

Der Beweis, dass es eine Entscheidung ist und keine Übernahme, ist das, was
Velum dadurch **nicht** tut: **Der Notiz-Editor bekommt Sans.** Eine Notiz ist
Arbeitsmaterial — Blöcke, Verweise, Struktur, etwas, das man umbaut. Ein
Journaleintrag ist eine Stimme, die man wieder liest. Velum hält beides im
selben Datenmodell und muss sie deshalb unterscheiden können; Day One hat diese
Unterscheidung gar nicht zu treffen. Die Schrift markiert hier den Unterschied
zwischen *Material* und *Stimme* — und genau diese Unterscheidung braucht eine
App, in der Handschrift gleichwertiger Inhalt ist.

Daraus folgt eine Aufräumregel, die nachprüfbar ist: **Das blanke `.serif`
verschwindet aus den Schirmen.** Jede Stelle wechselt auf Sans oder auf eine der
sieben benannten Rollen. Die Prüfung ist eine Zeile — wer in
`mockups/app-next/*.html` noch ein `class="serif"` ohne Rolle findet, hat einen
offenen Befund.

### 3.4 Die optische Korrektur — warum sie gemessen und nicht gesetzt wird

New York und SF Pro haben verschiedene x-Höhen. 28 px Serif wirken neben 28 px
Sans kleiner. Die naheliegende Lösung — ein fester Korrekturfaktor in der
CSS-Datei — wäre falsch: Der Faktor gilt nur für das Schriftpaar, das gerade
zur Verfügung steht. `mock.js` misst deshalb beide Stapel beim Start im
Browser und schreibt das Ergebnis nach `--serif-adjust`. Fällt das Skript aus,
wird gar nicht korrigiert — nie falsch korrigiert.

Zwei Details, die dabei entschieden wurden:

* Korrigiert wird auf das **geometrische Mittel aus x-Höhen- und
  Versalhöhen-Faktor**, nicht auf die x-Höhe allein. Reine x-Höhen-Angleichung
  wurde gerendert und angesehen: Die Versalien der Serif überschießen dann
  sichtbar. Deutsch schreibt jedes Substantiv groß — eine Korrektur, die nur
  die Kleinbuchstaben trifft, ist für diese Sprache die falsche.
* `font-size-adjust` verändert die *benutzte* Schriftgröße, nicht die
  angegebene. Die Fünfer-Skala bleibt also nicht nur dem Sinn nach in Kraft,
  sondern buchstäblich: Der Titel misst weiterhin 28 px.

### 3.5 Wo Farbe lebt

Die Oberfläche ist Papier und Grau. Es gibt genau drei Orte, an denen Farbe
vorkommt, und jeder hat eine Regel:

| Ort | Regel |
|---|---|
| **Ink** (`#16181C` hell / `#F2F3F5` dunkel) | Genau drei Rollen: aktiver Zustand · primärer CTA · Auswahl. Nichts sonst. |
| **Die fünf Modulfarben** | Ausschließlich als 6-pt-Punkte und als Cover-Akzent. Nie eine Fläche, nie ein Text, nie ein Knopf — und nie allein, immer neben ihrem Wort. |
| **Amber** (`--brand-copper`, vorläufig `#B5621A`) | Nur im Zeichen. Siehe §3.7. |

Dazu zwei semantische Farben, die keine Gestaltungsentscheidung sind, sondern
eine Bedeutung: Rot `#D02B20` für Löschen und Deadline, Grün `#1D7F4E` für
Erfolg.

Die Modulfarben stehen zu vier Fünfteln wortgleich in Velums eigener
März-Spec — die Punkte tragen also schon Velums Farben.

### 3.6 Das Zeichen — und der Platz, den es nicht bekommt

**Wo das Zeichen erscheint:** Onboarding und Start · Einstellungen → Über ·
Widget-Vorschauen · Sperrbildschirm-Mitteilung · Spotlight-Treffer ·
Teilen-Blatt · Store-Kontext.

**Wo ausdrücklich nicht:** im laufenden Betrieb. Keine Navigationsleiste, kein
Tab, keine Kopfzeile, kein Wasserzeichen. Eine App, die ihr eigenes Logo
dauerhaft mitführt, misstraut ihrer Gestaltung. Die Schirme in
`mockups/app-next/` tragen deshalb keins.

**Die drei Dateien liegen nicht vor.** Nachzeichnen ist verboten — ein
selbstgezeichnetes V wäre eine Erfindung, die später gegen das echte Zeichen
ausgetauscht werden müsste, und bis dahin würde jeder Schirm eine Marke
behaupten, die es nicht gibt. Der Entwurf geht deshalb so damit um:

* `assets/brand/` enthält den reservierten Platz und eine `LIESMICH.md`, die
  Dateiname, Größe (1024 × 1024 px), Farbraum und die Regel „ohne
  Eckenrundung, iOS rundet selbst“ festhält.
* Der Baustein `.appicon` lädt genau diese Pfade per `<img>`. Fehlt die Datei,
  erscheint ein **sichtbar leerer, gestrichelter Rahmen** mit dem fehlenden
  Dateinamen daneben. Er macht sich in keiner Größe klein — er soll stören,
  solange er da ist.
* Sobald die drei PNG abgelegt werden, erscheinen sie überall gleichzeitig,
  ohne dass eine Zeile geändert wird.

Dass die Konsole dabei `ERR_FILE_NOT_FOUND` meldet, ist kein Fehler des
Entwurfs, sondern seine Buchführung.

### 3.7 Warum Amber nur im Zeichen lebt

`--brand-copper` ist **innerhalb** von `.brandmark` definiert und nirgends
sonst. Das ist keine Bitte, sondern eine Sperre: Außerhalb existiert die
Variable nicht, ein `var(--brand-copper)` fällt dort auf seinen Rückfallwert
zurück. Kein Knopf, kein Chip, keine Fläche kann sie versehentlich erben.

Der Ton trägt heute genau eine Sache — den Rahmen des reservierten Platzes.
Als Textfarbe wäre er unzulässig: gerechnet 4,44:1 auf Papier im hellen und
3,96:1 im dunklen Modus, beides unter den 4,5:1 für Text. Als Rahmen
(Bedienoberfläche, 3:1) hält er in beiden Modi. Die Wortmarke „Velum“ steht
deshalb in Ink, nicht in Kupfer.

Mit dem ersten echten PNG verschwindet der Rahmen — und mit ihm der einzige
heutige Gebrauch der Farbe. Das Kupfer lebt dann dort, wo es hingehört: im
Zeichen. Genau diese Zurückhaltung ist der Grund, warum das Zeichen auffällt,
wenn es erscheint.

---

## 4 · Der Preis der Zurückhaltung

Linears Akzent ist eine Buntfarbe. Auf einer dunklen Fläche heißt „violett“
ohne weiteres Zutun „bedienbar“. Velums Akzent ist Ink — fast-schwarz auf
hell, fast-weiß auf dunkel. Damit fällt genau dieses Signal weg: **Die App
verliert die iOS-Konvention „farbig = tappbar“.**

Das ist die Rechnung, die zur radikaleren Farbentscheidung gehört. Wer Linears
Zurückhaltung übernimmt, ohne sie zu bezahlen, hat eine hübsche und
unbedienbare App. Bezahlt wird sie mit vier Regeln:

1. **Primäre Aktion:** gefüllte Ink-Fläche, heller Text. Nie schwarzer Text
   neben schwarzem Text.
2. **Sekundäre Aktion:** Umrandung, Fläche oder Position — nie Farbe allein.
3. **Interaktiver Text:** immer ein zweites Merkmal — Chevron, Chip-Fläche,
   Unterstreichung oder Symbol.
4. **Ziele mindestens 44 pt.**

Die Prüfung ist eine Frage an einen Fremden, der den Entwurf zum ersten Mal
sieht: *Kannst du in drei Sekunden sagen, was hier anklickbar ist?* Wer sie
nicht beantwortet, hat einen Befund, keinen Spielraum.

Dieselbe Logik trägt die Zwei-Merkmal-Regel für Zustände: kein Zustand hängt an
Farbe allein, weil Farbe hier fast nichts mehr sagt. Aktiv ist getönte Fläche +
Schriftgewicht + Ink-Balken. Ausgewählt ist getönte Fläche + Ring. Deadline ist
rotes Wort + Flaggen-Symbol + Restzeit.

---

## 5 · Wo der Entwurf noch nah an einer Vorlage steht

Sieben Stellen. Alle sieben wurden an gerenderten Schirmen geprüft, nicht am
Quelltext; vier davon zusätzlich gemessen. Der Abschnitt ist unbequem, und er
soll es bleiben — ein Dokument, das nur die gelungenen Stellen aufzählt, ist
eine Broschüre.

Jeder Befund nennt drei Dinge: was gefunden wurde, was Runde 2 daran
entschieden hat, und was offen bleibt.

### 5.1 Der Graph ist Obsidians Graph View mit besseren Beschriftungen

**Befund.** Kräfte-Layout, Filter-Chips oben links, Zoom-Steuerung unten
rechts, Legende unten links, Panel zum ausgewählten Knoten oben rechts, „Nur
diesen Cluster zeigen“ (= Obsidians Local Graph). Nimmt man die drei
Linienarten heraus, bleibt Obsidian. Und die drei Linienarten sind eine
Datenaussage, kein Entwurf — sie hätten in jedem beliebigen Graph-Layout Platz.

Das eigentliche Problem trifft das Leitmotiv direkt: **In einem Kräfte-Layout
bedeutet die Position eines Knotens nichts.** Der Faden ist als Beziehung
zwischen zwei benannten Punkten definiert, deren Verlauf man ablaufen kann. Im
Entwurf verläuft er dorthin, wo die Physik ihn hingeschoben hat. Der einzige
Schirm, der das Leitmotiv im Titel trägt, ist der einzige, auf dem es nicht
gilt. Fragt ein Betrachter „warum liegt ‚Osmose' rechts von ‚Zellbiologie'?“,
lautet die ehrliche Antwort: aus keinem Grund.

Dazu ein kleinerer, aber unangenehmer Nebenbefund: Die Navigationsleiste des
Schirms trägt einen Umschalter **Kräfte · Raster**. Was „Raster“ tut, steht
nirgends und ist nirgends gezeichnet.

**Entschieden.** Der Graph wird die Referenzfläche der Primitive: Kanten sind
Fäden mit den drei Stärken, Objekte sind Punkte, der ausgewählte ist ein
Knoten. Die Linien-Grammatik bekommt damit eine zweite Dimension — nicht nur
*welche Art* Beziehung, sondern *wie nah*.

**Offen.** Die Position bedeutet weiterhin nichts. Der Weg heraus ist bekannt
und nicht gebaut: eine Zeitachse über die acht Semesterwochen, an der sich der
Graph vorwärts zeichnet — Knoten erscheinen an dem Tag, an dem sie entstanden
sind, Fäden in der Reihenfolge, in der die Arbeit passiert ist. Sobald Zeit im
Spiel ist, darf die x-Achse *Woche* bedeuten, und die Knotenposition wird von
einem Simulationsergebnis zu einer Aussage. Solange das nicht gezeichnet ist,
steht ausgerechnet dieser Schirm dem Leitmotiv im Weg — und der Umschalter
„Raster“ sollte entweder etwas tun oder verschwinden.

### 5.2 Das Info-Panel im Notiz-Editor ist Obsidians rechte Sidebar

**Befund.** Die Abschnittsfolge, aus dem gerenderten Schirm ausgelesen:

```
INHALT · BACKLINKS · DARAUS ENTSTANDEN · VERWANDTE NOTIZEN · STATISTIK
```

Daneben Obsidians Kernplugins: Outline · Backlinks · — · Unlinked mentions ·
Word count. **Vier von fünf Abschnitten sind Obsidians Plugin-Liste auf
Deutsch, in Obsidians Reihenfolge.** Nur einer ist Velums eigener, und er steht
an dritter Stelle.

Zwei Konsequenzen. Erstens die Reihenfolge: Wenn Herkunft die Alleinstellung
ist, kann „Daraus entstanden“ nicht unter dem Inhaltsverzeichnis stehen.
Zweitens die Form: Ein Stapel aus fünf beschrifteten Abschnitten ist eine
Datenbankansicht — genau die Kritik, die Runde 1 selbst an Obsidian formuliert
hat („inhaltlich stark, gestalterisch ein Datenbank-Fenster“). Der Entwurf hat
dasselbe Fenster gebaut, nur mit weniger Zeilen.

**Entschieden.** Nichts. Das Info-Panel steht nicht unter den elf Orten des
Fadens.

**Offen, und das ist eine Lücke im Leitmotiv.** Die Verwandlung wäre bekannt:
Das Panel ist kein Stapel aus Abschnitten, sondern **ein Bild** — die Notiz als
Punkt, die Backlinks als Fäden von links, das Entstandene als Fäden nach
rechts. Ein Objekt, zwei Richtungen. Das Mindeste ist die Reihenfolge.

### 5.3 Die Ketten-Karte, die Signatur der App, ist als Breadcrumb gezeichnet

**Befund.** Auf `today.html` stehen drei Kästen nebeneinander — „Notiz /
Zellbiologie“, „Wurde zu / 12 Karten“, „Heute fällig / 8 Karten“ —, rechts ein
gefüllter Knopf „Lernen“. Das ist das Fortschritts-Breadcrumb aus jedem
Kassen- und Onboarding-Ablauf im Web. Der Beleg steht in `system.css` §6 und
ist eindeutiger als das Bild:

```css
.chain__link + .chain__link { border-left: 1px solid var(--line); }
.chain__link + .chain__link::before {
  content: ""; …  transform: translateY(-50%) rotate(45deg);
  width: 9px; height: 9px; background: var(--paper);
  border-top: 1px solid var(--line); border-right: 1px solid var(--line);
}
```

Die Verbindung zwischen zwei Stationen ist eine Trennlinie plus ein um 45°
gedrehtes Quadrat — die kanonische Breadcrumb-Kerbe, gezeichnet in `--line`.
Über genau dieses Token sagt §0.5: Trennlinien sind kein Faden. Der
Signaturmoment der App verbindet seine drei Punkte also mit dem einen Mittel,
das ausdrücklich zum Nicht-Faden erklärt ist.

Ein Winkel `›` ist kein Faden: Er hat kein Ende, keine Stärke, keine Richtung
außer der Leserichtung, und man kann ihn nicht rückwärts ablaufen. Dasselbe in
kleiner Form auf `journal-entry.html`: Der Abschnitt VERBUNDEN zeigt zwei
nebeneinanderstehende Kästen, „ENTSTANDEN AUS“ und „DARAUS ENTSTANDEN“. Die
Richtung — das eine Merkmal, das Herkunft von einem gewöhnlichen Link
unterscheidet — steht ausschließlich in den Überschriften. Gezeichnet ist sie
nicht.

**Entschieden.** Die Kette wird ein echter Faden: drei Knoten auf einem Faden
der Stärke 2,5 pt, Richtung von der Notiz über die Karten zu „heute fällig“.
Die Kerbe entfällt. Es ist derselbe Baustein wie überall, keine Nachahmung
davon.

**Offen bleibt die Gegenrichtung.** Ein Faden, den man nur vorwärts liest, ist
ein halber Faden. Tap auf „8 Karten“ muss ihn rückwärts bis zum Absatz
ablaufen; das ist Bewegung und nicht mit einem eingefrorenen Schirm zu belegen.

### 5.4 Die leeren Zustände sprechen mit Apples Stimme

**Befund.** Vier der gezeigten leeren Orte („Noch kein Notizbuch“, „Noch keine
Karten“, „Für heute alles erledigt“, „Nichts im Papierkorb“) bestehen aus einem
Symbol in einem getönten, abgerundeten Quadrat, darunter Titel, Satz und Knopf.
Das ist Apples `ContentUnavailableView`, unverändert.

Der Widerspruch ist schmerzhaft, weil derselbe leere Schirm laut §3.2 einer der
Orte ist, an denen die App spricht. Der Schirm, der die Handschrift am
deutlichsten zeigen sollte, zeigt sie am wenigsten.

**Lob an derselben Stelle:** Der leere Graph auf demselben Schirm macht es
richtig — dort läuft ein Faden zu drei hohlen Punkten, und der Text erklärt,
wie das Bild von selbst entsteht.

**Entschieden.** Leere Zustände bekommen die Form, die die übrigen zehn Orte
auch haben: ein einzelner Faden, der ins Leere läuft und in einem hohlen Punkt
endet. Der Titel steht in `.serif--empty-title`. Der inhaltliche Teil bleibt
unverändert richtig und ist ausdrücklich von Apple Journal übernommen: Der
beste leere Zustand ist gar nicht leer, sondern zeigt eigenes Material.

**Offen.** Nichts — außer der Ausführung an allen zwölf Orten des Schirms.

### 5.5 Vier gleich breite Bewertungsknöpfe, gegen die eigene Analyse

**Befund.** `01_konkurrenz-anatomie.md` schreibt in der Lernkarten-Synthese:
„‚Gut' bekommt mehr Fläche, weil es in den allermeisten Fällen richtig ist; die
Tabelle mit vier gleich breiten Zellen ist Altlast, keine Entscheidung.“ In
`review-session.html` stehen vier Knöpfe nebeneinander. Nachgemessen im
gerenderten Schirm (iPad-Rahmen, 1194 pt):

```
Nochmal < 1 Min   181 px
Schwer  2 Tage    181 px
Gut     5 Tage    181 px
Leicht  12 Tage   181 px
```

Auf das Pixel gleich; unterschieden ist ausschließlich die Füllung von „Gut“.
Dieser Befund wiegt anders als die übrigen sechs, weil er nicht auf einer
fremden Vorlage beruht, sondern auf der eigenen: Der Entwurf hat seine Anweisung
nicht umgesetzt und trägt Ankis HTML-Tabelle aus 2006 weiter — inklusive der
Fläche, die ein Fehlgriff bekommt, obwohl er selten richtig ist.

**Entschieden.** „Gut“ ist der primäre CTA und bekommt entsprechend Fläche und
Ink-Füllung; die übrigen drei sind schmaler und sekundär. Das ist zugleich eine
Anwendung von §4: Der primäre Weg ist an Fläche *und* Füllung erkennbar, nicht
an einer davon.

**Offen.** Nichts, außer der Messung nach der Korrektur.

### 5.6 Serif als Textur im Journal

**Befund.** `journal-entry.html` setzt den gesamten Eintragstext in Serif; der
Kommentarblock erklärt das zur Regel und nennt Day One als Quelle. Nachgemessen
ist die Schriftfamilie des Fließtextabsatzes exakt das Serif-Token — angewandt
an einem Ort, den die Liste der Serif-Orte nicht aufzählte. Zusammen mit dem
Notiz-Editor trug das blanke `.serif` an rund 45 Stellen Fließtext.

Der Übernahmegrund aus Runde 1 („der einzige Grund, warum ein Journal sich
anders anfühlt als eine Notiz-App“) ist ein Day-One-Argument, kein
Velum-Argument. Bei Velum fühlt sich das Journal anders an, weil der Eintrag
weiß, woher er kommt — nicht, weil er Serifen hat.

**Entschieden.** Der siebte Serif-Ort `.serif--voice` mit der Begründung aus
§3.3, und als Gegenprobe: Der Notiz-Editor bekommt Sans. Die Serif steht damit
nicht mehr für „Tagebuch“, sondern für den Unterschied zwischen Material und
Stimme.

**Offen.** Die Aufräumarbeit selbst. Solange in `mockups/app-next/*.html` noch
ein blankes `class="serif"` steht, ist die Regel eine Behauptung.

### 5.7 Das 12-Wochen-Raster misst Anwesenheit, nicht Arbeit

**Befund.** `flashcards-home.html` zeigt ein Punktraster über 12 Wochen, „859
Wiederholungen · 50 aktive Tage“ darunter. Der Kommentarblock nennt GitHubs
Beitragsraster ehrlich als Formvorbild und verwirft die Farbe. Verworfen wurde
die Farbe — übernommen wurde die **Bedeutung**: Dichte = Menge der
Wiederholungen.

Das ist dieselbe Metrik, die Runde 1 an Duolingo und Todoist kritisiert
(„Fremdmotivation“, „eine Zahl, die keine Arbeit ist“). 859 Wiederholungen sind
Anwesenheit.

**Entschieden.** Nichts.

**Offen — und billiger zu beheben, als es aussieht.** Velum hätte eine Größe
zur Hand, die keines der 21 Produkte messen kann: die Tage, an denen **ein Faden
entstanden ist** — eine Karte aus einem Absatz, eine Aufgabe aus einem Satz,
ein Journaleintrag aus einer Sprachnotiz. Dieselbe Form, dieselbe Fläche, eine
andere Aussage: Das Raster würde zeigen, an welchen Tagen wirklich etwas aus
etwas geworden ist. Der Unterschied zwischen den beiden Zahlen *ist* die
Alleinstellung, und der Entwurf zeigt bisher die falsche.

### 5.8 Die Zusammenfassung in einem Satz — und der Stand

Der Entwurf hat die **Farben** seiner Vorbilder abgelegt und ihre **Formen**
behalten: die Kette ein Breadcrumb, das Info-Panel ein Plugin-Register, der
Graph ein Kräfte-Layout, der leere Zustand eine `ContentUnavailableView`, das
Raster ein Beitragsdiagramm.

Nachgezählt an den elf Orten aus §1.5, Stand nach Runde 1:

| | Orte | |
|---|---:|---|
| Der Faden trägt | 2 | Graph-Kanten · Herkunfts-Chip als Objekt (ohne Bewegung) |
| Angedeutet | 2 | Journal-Schiene als Linie · Übergabe als gestrichelte Flugspur |
| Nicht gezeichnet | 7 | Ketten-Karte · Streak · Wiki-Links · Intervall-Reihe · Teilschritte · Buchrücken · leere Zustände |

Das ist die ehrliche Ausgangslage: **Das Motiv war entschieden, nicht
ausgeführt.** Die drei Primitive stehen seit dieser Runde als Bausteine bereit
(`system.css` §9, Musterseite `shared/faden-probe.html`) — damit ist die Frage
nicht mehr, ob der Faden zeichenbar ist, sondern nur noch, ob er an allen elf
Orten gezeichnet wurde. Das ist eine Frage, die man an Bildern beantwortet,
nicht an Absichten.

---

## 6 · Die Zahlen in diesem Dokument

Wo eine Zahl steht, muss sie nachzählbar sein. Deshalb die Rechnung offen:

**21 verschiedene Produkte in 25 Betrachtungen.**

| | Rechnung |
|---|---|
| Runde 1 | **18 Plätze** in sechs Bereichen (Notizen · Journal · Aufgaben · Bibliothek · Today · Lernkarten), je drei Vorbilder |
| davon verschieden | **14 Produkte** — Craft, Apple Notes, Things 3 und Apple Journal stehen in je zwei Bereichen |
| Runde 2 | **+7 neue Produkte**: Notability · Noteshelf 3 · Obsidian · Structured · Amie · Arc · Linear |
| Summe | **21 verschiedene Produkte** (14 + 7) in **25 Betrachtungen** (18 + 7) |

TickTick und RemNote wurden in Runde 2 erneut gelesen, aber **nicht doppelt
gezählt**: Beide stehen bereits vollständig in `01_konkurrenz-anatomie.md`; der
zweite Blick fragte nur nach dem Stand August 2026 und nach dem Prinzip
dahinter.

Eine gelegentlich genannte Zahl „26 Apps“ ist angreifbar und wird hier nicht
benutzt: Sie addiert Plätze und Produkte. **Eine kleinere richtige Zahl ist in
einer Bewerbung mehr wert als eine größere angreifbare.**

### 6.1 Was die Belege wert sind

Beide Recherchen unterscheiden sauber zwischen **belegt** (im Suchtreffer
wörtlich oder sinngemäß enthalten, mit Datum) und **Modellwissen** (nicht in
diesem Lauf verifiziert). Keine Versionsnummer, kein pt-Maß und kein Farbwert
steht ohne eine dieser beiden Markierungen. In Runde 2 waren alle direkten
Herstellerseiten durch die Netzwerk-Richtlinie gesperrt; die Belege stammen
deshalb ausschließlich aus Suchmaschinen-Auszügen vom August 2026.

Ein Widerspruch bleibt ausdrücklich stehen, weil er die eigene Alleinstellung
trifft: Bei **Notability** beschreibt eine Sekundärquelle die
Audio-Synchronisierung als handschriftlich („handwritten notes animating onto
the screen exactly when you wrote them“), eine andere sagt ausdrücklich, sie
funktioniere nur mit getipptem Text. Beide sind aus 2026, ohne Gerät ist das
nicht zu entscheiden. Genau dieser Punkt ist Velums Alleinstellung „Zeit ist
Inhalt“. **Was Velum darüber behauptet, muss unabhängig davon stimmen, wie
dieser Widerspruch ausgeht** — deshalb steht in diesem Dokument nirgends „das
kann Notability nicht“, sondern nur, was Velum zusätzlich hat: Herkunftskanten
mit Zeitstempel, die Notability in keiner der beiden Lesarten führt.

---

## 7 · Was für dieses Dokument geprüft wurde

Alle Aussagen über den Entwurf stammen aus gerenderten Schirmen, nicht aus dem
Quelltext: Chromium über `file://`, Ansichtsfenster 1500 × 1200, heller Modus,
je zwei bis vier Streifen. Angesehen wurden `shared/faden-probe.html` sowie
`today.html`, `note-editor.html`, `graph.html`, `journal-entry.html`,
`review-session.html`, `flashcards-home.html`, `leere-zustaende.html`,
`library.html` und `tasks.html`.

Die Aufnahmen entstanden **zu Beginn von Runde 2**, also vor dem Umbau der
Schirme. Alles, was in §5 unter „Befund“ steht, beschreibt deshalb den Stand
nach Runde 1; was unter „Entschieden“ steht, ist die Festlegung dieser Runde.
Wer die Schirme heute öffnet und einen Befund nicht mehr findet, liest kein
falsches Dokument, sondern eine erledigte Zeile — und wer ihn noch findet, hat
den Beleg, dass die Zeile offen ist.

Im Bild bestätigt: die Breadcrumb-Kerben der Ketten-Karte (§5.3), die
Abschnittsfolge des Info-Panels (§5.2), die vier gleich breiten
Bewertungsknöpfe (§5.5), der Serif-Fließtext im Journaleintrag (§5.6), das
Punktraster mit „859 Wiederholungen · 50 aktive Tage“ (§5.7), die vier
`ContentUnavailableView`-Kacheln und der korrekt gebaute leere Graph daneben
(§5.4), die Cover ohne Rücken-Faden (§2.2, Bibliothek) sowie der unerklärte
Umschalter „Kräfte · Raster“ (§5.1).

Die Kontrastwerte sind nicht nachgemessen, sondern zitiert: Sie stehen
gerechnet in `mockups/shared/system.css` §1 und §9.0 und sind auf
`shared/faden-probe.html` §5 ausgewiesen.

---

## Verweise

* Der Entwurf: [`mockups/app-next/`](../mockups/app-next/) — 13 Schirme, je hell/dunkel und iPad/iPhone
* Die Primitive: [`mockups/shared/faden-probe.html`](../mockups/shared/faden-probe.html) — Punkt, Faden, Knoten in jedem Zustand
* Das Gestaltungssystem: [`mockups/shared/system.css`](../mockups/shared/system.css) — §9 Faden, §10 Serif, §11 Marke
* Der Platz des Zeichens: [`assets/brand/LIESMICH.md`](../assets/brand/LIESMICH.md)
* Die Anatomie: [`01_konkurrenz-anatomie.md`](01_konkurrenz-anatomie.md) — 18 Plätze zerlegt
* Der Entwurf in Worten: [`02_das-ist-die-app.md`](02_das-ist-die-app.md)
* Die Bewegung: [`03_bewegung.md`](03_bewegung.md)
