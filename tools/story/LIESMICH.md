# Die zwei Filme

Zwei Fassungen, zwei Aufgaben: die **Story** zeigt das Produkt, das
**Reel** benutzt es.

---

# Das Reel — 38 s · englisch

Eine Arbeitssitzung am iPad, mit allem, was die App kann: Today · Notes ·
Flashcards · Review · Canvas · Library · Tasks · Journal.

```
node tools/story/buehne-pruefen.js   # PRÜFT die Bühne, bevor gedreht wird
node tools/story/ipad-sitzung.js     # der Prototyp wird BEDIENT und aufgezeichnet
python3 tools/story/marken.py        # wo im Mitschnitt welcher Schirm steht
node tools/story/reel-tafeln.js      # die Bildunterschriften
python3 tools/story/reel.py          # → /home/user/story/velum-reel.mp4
```

Alle Node-Skripte brauchen `playwright-core` im `NODE_PATH`; die
Python-Skripte holen ffmpeg aus `imageio-ffmpeg`
(`pip install imageio-ffmpeg`; ffprobe ist darin **nicht** enthalten).

## Die Bühne — vier Dateien, die den Prototyp filmreif machen

Der Entwurf ist auf Deutsch gedacht: die Belegbindung, die Abnahmeberichte,
jeder Schirmname hängt daran. Ein Film für Instagram hängt daran nicht.
Darum wird der Entwurf **nicht umgeschrieben**, sondern für die Dauer der
Aufnahme eine Schicht darübergelegt. Sie lebt nur im Speicher des Browsers.

| Datei | Aufgabe |
|---|---|
| `englisch.js` | Wörterbuch, **Textknoten für Textknoten**. Wortweises Ersetzen erzeugt Sätze, die kein Mensch geschrieben hat („Die Woche was voll") — genau das, was ausgeschlossen war. Erkennt außerdem Reste: `ENGLISCH.verdacht()`. |
| `buehne.js` | Absender (Zeichen statt „Emil"), Politur (kein Ladebalken bei 62 %, keine Sprachnotiz, die überträgt), Stempel (§14c-Einsortierung, bevor übersetzt wird), Canvas auf `?leer=1`. |
| `handschrift.js` | Eine Schrift aus **Strichen**, nicht aus Buchstaben. |
| `canvas-buehne.js` | Läuft IM Rahmen: englische Werkzeugnamen, feste Uhr, und das Vorlesungsblatt. |

### Warum eine eigene Handschrift

Der Renderer bildet `markerfelt` auf `"Marker Felt", "Comic Sans MS",
"Segoe Print", cursive` ab. Auf dem Rechner, der den Film rechnet, ist keine
davon installiert — `cursive` landet bei DejaVu Serif. Auf dem
Vorlesungsblatt stand dann eine **Times**. Eine Zeitung setzt man in Times,
eine Vorlesungsmitschrift nicht; und ein Film über eine App, deren ganzer
Sinn die Handschrift ist, darf an genau dieser Stelle nicht schummeln.

Also wird wirklich geschrieben: jeder Buchstabe ist ein Zug oder zwei, und
die Züge gehen als `stroke`-Objekte ins Board — dieselbe Sorte Objekt, die
ein Stift erzeugt. Zoom, Radierer, Lasso und der Dunkelmodus greifen darauf,
weil es nichts anderes ist als Tinte. 446 Objekte je Blatt.

### Was die Bühne am Prototyp gefunden hat

Die Sprachschicht hat drei echte Fehler ans Licht gebracht, die im Deutschen
nie auffielen. Alle drei sind **im Entwurf** behoben, nicht in der Schicht:

1. **Die Umschalter erkannten sich an ihrer Beschriftung.**
   `ansichtWechseln()` prüfte den Wortbestand der Knöpfe (`/planer/` und
   `/matrix/`). Jede Umbenennung legte §14c bis §14o still: die Auswahl
   wanderte weiter, die Ansicht wechselte nicht mehr. Jetzt wird die Art
   **einmal beim Beleben** bestimmt und am Element festgemacht.
2. **Eine abgehakte Aufgabe stand im Board unter „Offen"**, während
   „Erledigt" daneben „nichts" meldete. `zeileErledigt()` kannte
   `.check.is-done`, aber nicht `.check.is-checking` — und der Entwurf
   zeichnet beide als gefüllten Haken.
3. **Der Planer schloss Erledigtes aus allen vier Spalten aus**, worauf der
   Rest-Eimer der letzten Spalte es auffing: eine für morgen geplante,
   abgehakte Aufgabe stand unter „Ohne Termin" — mit sichtbarem Termin.

Dazu zwei Satzfehler: `.pv-brett` hatte immer vier Spuren (das Board hat
drei, ein Viertel des Schirms blieb leer) und die Marken in den
Brettzetteln wurden an der Kartenkante hart abgeschnitten.

### Die Prüfung

`buehne-pruefen.js` läuft über elf Schirme und beantwortet drei Fragen:
steht noch Deutsch im Bild, wird Text abgeschnitten, sieht der Schirm aus
wie ein Schirm. Stand: **0 Deutschreste, 0 Satzmängel, 0 Seitenfehler**;
je Schirm ein Bild in `/home/user/story/pruef/`.

Der Prüfer meldet Abschnitt nur, wo wirklich abgeschnitten wird
(`overflow != visible`) und ignoriert `-webkit-line-clamp` — Kürzung mit
Auslassungszeichen ist Absicht, kein Mangel.

## Warum das kein Bildschirmvideo ist

`ipad-sitzung.js` drückt echte Knöpfe im echten Prototyp. Aufgezeichnet wird
mit Playwrights `recordVideo`, also in Echtzeit — jede CSS-Bewegung läuft so
ab, wie der Browser sie rechnet. Ein Einzelbild-Verfahren hätte die
Übergänge zerhackt.

**Kein Zeiger.** Die erste Fassung hatte einen weißen Kreis, der zum Knopf
fuhr und beim Druck kleiner wurde — die Bildsprache eines Mitschnitts, nicht
die eines Produktfilms. Stattdessen sorgt der Ablauf dafür, dass immer
Bewegung im Bild ist: vor jedem Griff wird gescrollt, geschnitten wird auf
den Zustandswechsel.

**Das Canvas wird vor dem ersten Bild geweckt.** `canvasWecken()` hängt den
Rahmen erst ein, wenn sein Schirm Maß hat. Ohne Vorlauf blitzte zwei
Sekunden lang ein leeres, deutsches „Neues Blatt" auf.

## Warum `marken.py` und nicht die Zeitmarken der Aufnahme

`ipad-sitzung.js` schreibt Zeitmarken mit `Date.now()` mit, die Aufnahme
läuft aber mit variabler Bildrate. Beim Umrechnen auf 30 Bilder je Sekunde
dehnt und staucht ffmpeg ungleichmäßig — zwischen Wanduhr und Videozeit
lagen im Versuch mal 0,2 und mal 1,5 Sekunden. Ein Schnitt, der sich darauf
verlässt, sitzt zufällig.

`marken.py` glaubt nicht, sondern sieht: jedes Bild wird mit den geprüften
Schirmbildern verglichen und dem ähnlichsten zugeordnet. Heraus kommt eine
Liste zusammenhängender Läufe — Schirm, Anfang, Ende, und darin das
ruhigste Fenster.

## Der Schnitt

| s | Bild | Zeile |
|---|---|---|
| 0,0–2,6 | Dunkler Raum, Wortmarke | One place for everything you learn. |
| 2,6–6,4 | **Today** — Überblick, Scrollen | TODAY · Six tasks, twenty-three cards, one unfinished draft. |
| 6,4–10,6 | **Notes** — Editor, Rand, Backlinks | NOTES · Write it once. The margin keeps track of the rest. |
| 10,6–13,0 | **Flashcards** — vier Decks | FLASHCARDS · Every card remembers the sentence it came from. |
| 13,0–16,8 | **Review** — Frage, dann Antwort | REVIEW · And it shows you the sentence before it shows the answer. |
| 16,8–18,4 | Atempause | It all connects. *That is the whole idea.* |
| 18,4–23,2 | **Canvas** — das Blatt, herangefahren | CANVAS · An endless sheet — pen, marker, tape, shapes, text. |
| 23,2–27,0 | **Library** — Raster wird Liste | LIBRARY · Eighteen notebooks. One shelf, two ways to read it. |
| 27,0–31,6 | **Tasks** — Liste, Planer, Board | TASKS · Five views of the same six things. |
| 31,6–35,2 | **Journal** — Zeitleiste | JOURNAL · And at the end of the day, why any of it mattered. |
| 35,2–38,4 | Wortmarke, Module, THIS WINTER | — |

Fünf Handgriffe trennen den teuren Film vom billigen; sie stehen im Kopf von
`reel.py`: **ein Raum** (Licht mit Richtung statt Farbfläche), **eine
Kamera** (1,000 → 1,035 über jede Einstellung, mit Drift), **ein Schnitt**
(hart auf den Zustandswechsel, Hintergrund läuft durch), **erst behaupten**
(Zeile unter dem Gerät, auf einem Schleier, eine Viertelsekunde nach dem
Schnitt), **eine Farbe** (eine Korrektur und ein Korn über alles).

Dazu der Rhythmus: `nah` in `EINSTELLUNGEN` wechselt die Einstellungsgröße.
Eine Reihe gleich großer Gerätebilder ermüdet nach dem dritten.

## Zwei Stolpersteine, die dokumentiert bleiben sollen

**Die Seite drumherum.** `.pv-glas` liegt in `div.pv-skala`, nicht im Body.
Eine Regel `body > *:not(.pv-glas){display:none}` versteckt darum den Träger
mit — die erste Aufnahme war komplett schwarz. Jetzt wird der Pfad von der
Glasscheibe bis zum Body abgelaufen und auf jeder Stufe nur das Geschwister
weggenommen, das nicht auf dem Pfad liegt.

**Die Tafeln.** `schnitt.vorbereiten()` lädt nur `t-*` (Story) und `r-*`
(altes Reel). Die Tafeln dieses Films heißen `v-*` und fielen beim ersten
Bauen still durch — der Film lief mit, nur ohne ein einziges Wort darin.
`reel.py` lädt seine Schrift jetzt selbst und zählt sie laut.

**Die Zeile am Bildrand.** `S.tafel(..., unten=True)` verschiebt mit
`ImageChops.offset`, und offset **umläuft** den Rand: die Zeile stand nicht
unter dem Gerät, sondern oben im Bild, wo sie wieder herauskam. Die Tafeln
dieses Films sind schon an ihrer Stelle gesetzt; `reel.zeile()` legt nur
noch den Schleier darunter.

---

# Die Story — 15 s

15 s · 1080 × 1920 · 30 fps · ohne Ton.

```
node tools/story/screens.js     # echte Schirme aus dem Prototyp, 3×
node tools/story/tafeln.js      # Schrifttafeln, im Browser gesetzt
python3 tools/story/schnitt.py de     # → /home/user/story/velum-story.mp4
python3 tools/story/schnitt.py en     # → …-en.mp4
```

## Die Machart, und warum sie so ist

Der Auftrag war „nicht KI-mäßig, sondern real". Es gibt genau drei Stellen,
an denen erzeugtes Video auffliegt: **Schrift, Bedienoberflächen und Hände.**
Also kommt keine davon aus einem Modell.

| | woher |
|---|---|
| die App-Schirme | Bildpunkte aus dem laufenden Prototyp, 3× gerendert |
| die Schrift | im Browser gesetzt, mit `mockups/shared/system.css` |
| die Handschrift | Striche, gerechnet aus `handschrift.js` |
| die Wortmarke | die gelieferte Datei aus `assets/brand/logo/` |
| die Bewegung | Bild für Bild gerechnet — Fahrten, Blenden, Korn |
| die Atmosphäre | Bokeh und Licht, gerechnet; oder Runway, siehe unten |

## Die sechs Einstellungen

| s | Bild | Warum |
|---|---|---|
| 0,0–2,5 | Schnee. Ein Kupferpunkt, ein Faden wächst nach unten. | Das Leitmotiv, bevor irgendetwas erklärt wird. |
| 2,5–4,5 | „Jede Karte weiß, aus welchem Satz sie kommt." | Die Behauptung — allein, lesbar, ohne Gerät. |
| 4,5–7,5 | Das Telefon kommt herauf, Heute-Schirm, Schnee davor. | Der Beweis. |
| 7,5–10,5 | Langsam auf die Kette: Zellbiologie → 12 Karten → 8 fällig. | Die App in einer Karte. |
| 10,5–12,5 | Die Lernkarte mit „aus ‚Zellbiologie'". | Der Moment, um den alles gebaut ist. |
| 12,5–15,0 | Papier, Licht, Wortmarke, THIS WINTER. | Zeichen und Zeitpunkt. |

---

# Runway

**Vorhanden und benutzt** (vom Auftraggeber hochgeladen): Schnee im
Streiflicht, Eisblumen auf Glas, Winterlicht auf Bütten — als Einzelbilder
unter `story/platten/{schnee,eis,papier}/`. `plattenbild()` nimmt sie von
selbst und rechnet nichts mehr.

**Fertig gerendert, aber nicht im Container.** Der Egress-Filter dieser
Sitzung sperrt Runways Asset-Hosts (403 auf `dnznrvs05pmza.cloudfront.net`
und `api.runwayml.com`). Diese Aufgaben liegen bei Runway bereit:

| Aufgabe | Inhalt |
|---|---|
| `03a4f394-dd38-4aba-a192-74eedd594e65` | Ein Tropfen schwarze Tinte fällt in klares Wasser, Makro, weiß, 5 s. Tinte auf Papier ist Velums eigenes Material — die richtige Ebene für den Auftakt. |
| `2b030bda-e83e-4b43-b95c-f77a61c66a42` | Staub in einem harten Schacht Winterlicht, tiefschwarzer Raum, 5 s. Für den Schluss. |
| `cd935e08-1711-4a7e-9d4e-cfa0c4b9520a` | 10 s Klavier: langsam, sparsam, Moll, ohne Aufbau. |

Wer sie herunterlädt, legt die Einzelbilder ab und ruft neu auf:

```
ffmpeg -i tinte.mp4 -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  story/platten/tinte/%04d.jpg
```

Und für den Ton, `story/musik.mp4`:

```
ffmpeg -i velum-reel.mp4 -i musik.mp4 -filter_complex \
  "[1:a]atrim=0:38.4,afade=t=in:st=0:d=1.5,afade=t=out:st=36.4:d=2,volume=0.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -shortest velum-reel-ton.mp4
```
