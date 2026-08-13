# assets/brand — der Platz des Zeichens

**Stand 13. August: Das Markenpaket ist da, die Bilddateien noch nicht.**
Angekommen sind die drei Beipackzettel (Wortmarke, App-Icon) mit allen
Farbwerten und Dateinamen — die PNG selbst fehlen. Bis sie hier liegen,
zeigt jeder Entwurf an ihrer Stelle weiter einen sichtbar leeren Rahmen mit
dem fehlenden Dateinamen. Das bleibt Absicht: das Zeichen wird nicht
nachgezeichnet, nicht angedeutet und nicht durch ein Ersatzzeichen vertreten.

## Was hier hingehört

### Das Zeichen — drei Dateien, die der Code direkt lädt

| Datei hier | heißt im Paket | Wann sie erscheint |
|---|---|---|
| `velum-appicon-light.png`  | `AppIcon-light-1024.png`  | heller Modus (Vorgabe) |
| `velum-appicon-dark.png`   | `AppIcon-dark-1024.png`   | dunkler Modus |
| `velum-appicon-tinted.png` | `AppIcon-tinted-1024.png` | getönte Fassung (iOS 18) |

**Die Namen müssen beim Ablegen geändert werden** — `system.css` §11.1 lädt
genau die linke Spalte. Alle drei 1024 × 1024, full-bleed, **ohne**
Eckenrundung: iOS rundet selbst, und die Mockups tun im Browser dasselbe
(`border-radius: 22.37 %`, Apples Squircle-Maß). Wer die Ecken mitliefert,
bekommt sie doppelt. Aus `preview-rounded/` darf nichts hierher.

Die getönte Fassung enthält keine Farbe (Paket: `#26292F`, V `#C2C9D5`,
kein Punkt) — iOS legt die Tönung selbst darüber.

### Die Wortmarke — sechs Dateien, für die es noch keinen Baustein gibt

`wordmark-light.png` · `wordmark-dark.png` ·
`wordmark-ink-transparent.png` · `wordmark-onDark-transparent.png` ·
`lockup-light.png` · `lockup-dark.png` (Wortmarke + Eyebrow „INK STUDIO")

Für sie ist noch kein Platz gebaut. Der Grund steht unten unter „Die eine
offene Entscheidung".

## Die Farbwerte, nachgerechnet

Das Paket führt **zwei** Kupfertöne je Modus, und das ist kein Zufall:

| | Punkt (Grafik, ≥ 3:1) | Eyebrow (Text, ≥ 4,5:1) |
|---|---|---|
| hell | `#B5763F` — 3,30:1 | `#8A5426` — 5,49:1 |
| dunkel | `#D89B63` — 7,14:1 | `#D89B63` — 7,14:1 |

Gemessen auf den Markenflächen des Pakets (Papier `#EEF1F6`, Tinte
`#191C23`), WCAG 2.1. Auf Velums eigenen Flächen misst der Punkt 3,51:1 hell
und 7,37:1 dunkel. Alle vier Werte halten ihre Grenze.

`system.css` §11.2 steht seit dem 13. August auf diesen Werten; der
vorläufige `#B5621A` ist ersetzt. Die Sperre ist unverändert: `--brand-copper`
wird auf `.brandmark` deklariert und existiert außerhalb nicht. Kupfer lebt
im Zeichen und im Lockup — nicht in der Bedienung. Die Tinte hat drei Rollen,
und Kupfer ist keine davon.

## Die eine offene Entscheidung

Die Wortmarke des Pakets ist **Instrument Serif**. Die Serif des
Gestaltungssystems ist **New York** (DNA §5, sieben Rollen). Heute setzt
`.serif--wordmark` das Wort „Velum" als lebenden Text in New York — das ist
das Logo *nachgesetzt*, nicht das Logo *verwendet*, und damit derselbe Fehler
wie ein nachgezeichnetes Zeichen, nur in Typografie.

Sobald die Dateien da sind, gehört die Wortmarke als **Bild** in den Lockup
(Onboarding, Über, Splash, Store) — nicht als Text. `.serif--wordmark` bleibt
danach für genau einen Fall: wo „Velum" im Fließtext steht und kein Logo
gemeint ist.

Gebaut ist dieser Baustein noch nicht. Ohne die Dateien ließe er sich nicht
prüfen, und ungeprüfte Bausteine sind hier keine.

## Was passiert, sobald die drei Icon-PNG da sind

Nichts, was Handarbeit wäre. `.appicon` (system.css §11.1) lädt genau die
drei Pfade per `<img>`; `mock.js` wählt die Fassung nach `data-theme` und
wechselt sie mit dem Hell/Dunkel-Umschalter mit. Beim ersten erfolgreichen
Laden verschwinden Rahmen und Beschriftung von selbst — an allen Stellen
gleichzeitig, ohne dass eine Zeile geändert wird.

Danach bleibt genau eine Prüfung: `tools/paket-pruefen.js` meldet heute elf
Seitenfehler, und alle elf sind diese drei Dateien. Die Zahl muss auf null
gehen.
