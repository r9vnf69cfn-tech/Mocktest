# assets/brand — der Platz des Zeichens

Hier gehören drei Dateien hin. Sie liegen noch **nicht** vor. Bis sie da sind,
zeigt jeder Entwurf an ihrer Stelle einen sichtbar leeren Rahmen mit dem
fehlenden Dateinamen. Das ist Absicht: das Zeichen wird nicht nachgezeichnet,
nicht angedeutet und nicht durch ein Ersatzzeichen vertreten.

## Die drei Dateien

| Datei | Wann sie erscheint | Größe |
|---|---|---|
| `velum-appicon-light.png`  | heller Modus (Vorgabe) | 1024 × 1024 px, PNG, undurchsichtig, ohne Eckenrundung |
| `velum-appicon-dark.png`   | dunkler Modus | 1024 × 1024 px, PNG, undurchsichtig, ohne Eckenrundung |
| `velum-appicon-tinted.png` | getönte Fassung (iOS 18) | 1024 × 1024 px, PNG, **Graustufen**, ohne Eckenrundung |

Alle drei ohne Alphakanal und ohne eigene Eckenrundung — iOS rundet selbst,
und die Mockups tun im Browser dasselbe (`border-radius: 22.37 %`,
Apples Squircle-Maß). Wer die Ecken mitliefert, bekommt sie doppelt.

Die getönte Fassung enthält keine Farbe: iOS legt die Tönung selbst darüber.
Nur Helligkeitswerte, das Motiv trägt sich über Kontrast, nicht über Farbton.

## Was passiert, sobald sie da sind

Nichts, was Handarbeit wäre. Der Baustein `.appicon` (system.css §11.1) lädt
genau diese drei Pfade per `<img>`; `mock.js` wählt die Fassung nach
`data-theme` und wechselt sie mit dem Hell/Dunkel-Umschalter mit. Beim ersten
erfolgreichen Laden verschwinden Rahmen und Beschriftung von selbst — an allen
Stellen gleichzeitig, ohne dass eine Zeile geändert wird.

Zwei Dinge sind danach nachzuziehen, und nur diese zwei:

1. **`--brand-copper` messen und ersetzen.** Der Wert steht vorläufig auf
   `#B5621A` — Velums eigener Journal-Akzent aus der März-Spec, also kein
   erfundener Ton, aber auch nicht der gemessene. Sobald das Zeichen vorliegt,
   wird der Kupferton daraus abgenommen und in `system.css` §11.2 ersetzt.
   Die Variable ist dort auf `.brandmark` beschränkt und existiert außerhalb
   nicht; sie kann also nirgends sonst hängengeblieben sein.
2. **Den Rahmen prüfen.** Der gestrichelte Platzhalterrahmen ist der einzige
   heutige Gebrauch von Kupfer. Mit dem ersten echten PNG ist er weg.

## Wo das Zeichen erscheint — und wo nicht

Onboarding und Start · Einstellungen → Über · Widget-Vorschauen ·
Sperrbildschirm-Mitteilung · Spotlight-Treffer · Teilen-Blatt · Store-Kontext.

**Nicht im laufenden Betrieb.** Keine Navigationsleiste, kein Tab, kein
Seitenkopf. Eine App, die ihr eigenes Logo dauernd mitführt, misstraut ihrer
Gestaltung.

## Amber lebt nur im Zeichen

Der Kupferton ist die einzige Buntfarbe der Marke und er kommt in der
Bedienoberfläche nicht vor: kein Knopf, kein Chip, keine Fläche, kein Zustand.
Genau diese Zurückhaltung ist der Grund, warum das Zeichen auffällt, wenn es
erscheint. Als Textfarbe wäre er ohnehin unzulässig — gerechnet 4,44:1 auf
hellem Papier und 3,96:1 auf dunklem, beides unter den 4,5:1, die für Text
gelten.

## Prüfen kann man es hier

`mockups/shared/faden-probe.html` zeigt den Baustein in allen drei Größen,
hell und dunkel, mit und ohne vorhandene Datei.
