# GoodNotes Canvas Mockup

Ein pixelnaher Nachbau der **GoodNotes-Whiteboard-Oberfläche** (unendliche
Zeichenfläche) als eigenständige Webseite — mit funktionierender Zeichen-Engine,
nicht nur als Attrappe.

Kein Build, keine Abhängigkeiten, keine externen Ressourcen: `index.html` im
Browser öffnen, fertig.

```
index.html
css/styles.css
js/  icons.js  geometry.js  shapes.js  model.js  renderer.js
     popovers.js  tools.js  toolmenu.js  chrome.js  app.js
```

---

## Aufbau der Oberfläche

Die obere Chrome besteht aus drei Ebenen — so wie im Whiteboard-Modus von
GoodNotes:

| Ebene | Höhe | Inhalt |
|---|---|---|
| Statusleiste | 20 px | Uhrzeit, WLAN, Batterie (rein optisch, Uhr läuft mit) |
| **Dokument-Tabs** | 44 px | Bibliothek · Tabs mit Boardtitel und Schließen-× · „+" für neuen Tab |
| **Navigationsleiste** | 52 px | **links:** Seitenleiste, Suche, AI, Ansichtsmodus — **Mitte:** Rückgängig/Wiederholen ‖ die elf Werkzeuge ‖ Zubehör — **rechts:** Board hinzufügen, Teilen, Mehr |
| **Werkzeugmenü** | 48 px | Schwebende Glaskapsel unter der Leiste, Inhalt je nach aktivem Werkzeug. Am Griff links an alle vier Bildschirmränder ziehbar; seitlich angedockt klappt sie auf vertikal um. |

Unten links liegt die **Minimap** (ziehen verschiebt die Ansicht, Doppelklick
passt alles ein), unten rechts die **Zoomsteuerung**.

## Die elf Werkzeuge

Reihenfolge und Verhalten folgen der GoodNotes-Vorlage. „Klebt" bedeutet: das
Werkzeug bleibt aktiv. Die übrigen springen nach ihrer Aktion zurück aufs Lasso
— das ist das Rückfallwerkzeug.

| # | Werkzeug | Taste | Klebt | Optionen im Werkzeugmenü |
|---|---|---|---|---|
| 1 | **Stift** | `1` `P` | ✔ | Stiftart (Füller, Kugelschreiber, Pinsel, Bleistift) · 3 Stärken · 3 Farben + Farbwähler · Druckempfindlichkeit, Glättung, gerade Linien |
| 2 | **Radierer** | `2` `E` | ✔ | Typ (Präzision, Standard, Strich) · 3 Größen · nur Textmarker · Bilder löschbar · Board leeren |
| 3 | **Textmarker** | `3` `H` | ✔ | 3 Stärken · 3 Farben · gerade Linien · unter der Tinte zeichnen |
| 4 | **Klebeband** | `4` | ✔ | 5 Muster (einfarbig, Streifen, Punkte, Karo, gerissen) · Farben · Breite · Deckkraft |
| 5 | **Formen** | `5` `S` | — | Füllung + Füllfarbe · Linienstil (durchgezogen, gestrichelt, gepunktet) · 3 Stärken · Farben · Ecken abrunden |
| 6 | **Lasso** | `6` `L` | ✔ | Freihand/Rechteck · fünf Filter (Handschrift, Bilder, Text, Formen, Elemente) |
| 7 | **Text** | `7` `T` | — | Schriftart · Größen-Stepper · **B** *I* U S̶ · Farbe · Ausrichtung · Zeilenabstand · Feldstil · Anheften |
| 8 | **Elemente** | `8` | — | 36 Sticker, Schnellauswahl und Größe |
| 9 | **Bild & Kamera** | `9` | — | öffnet direkt die Auswahl (Foto/Datei) |
| 10 | **Lineal** | `0` | Umschalter | Lineal/Winkelmesser · Winkel · Einrasten — ändert das aktive Werkzeug nicht |
| 11 | **Laserpointer** | `\` | ✔ | Farben · Spur: verblassend, bleibend, nur Punkt |

Ein zweiter Tipp auf das aktive Werkzeug klappt sein Menü ein und wieder aus.

## Zeichen-Engine

- **Unendliche Fläche** mit Kamera (`screen = welt · zoom + versatz`), Zoom von
  10 % bis 1600 %, Zoomen um den Cursor.
- **Variable Strichbreite**: Stiftdruck (`PointerEvent.pressure`) bei echten
  Stiften, sonst aus der Zeichengeschwindigkeit abgeleitet — schnell wird dünn.
  Die Kontur wird als gefülltes Polygon mit runden Kappen tesselliert; der
  Bleistift bekommt zusätzlich ein deterministisches Korn.
- **Stift schlägt Finger**: Sobald ein echter Stift benutzt wurde, verschiebt
  der Finger nur noch die Fläche (Handballenerkennung mit 700-ms-Nachlauf). Das
  Radiererende des Stifts schaltet vorübergehend auf den Radierer.
- `getCoalescedEvents()` holt alle Zwischenpunkte, damit schnelle Striche nicht
  eckig werden.
- **Formerkennung** (`js/shapes.js`): resampeln → Kreisfit, Ellipsenfit über die
  Kovarianz-Hauptachsen, Eckenerkennung über die Krümmung. Erkennt Linie, Pfeil,
  Rechteck, Quadrat, Kreis, Ellipse, Dreieck, Raute, Fünf-/Sechseck und Bogen;
  bei zu geringer Sicherheit bleibt der Freihandzug stehen.
- **Radierer**: Punkt-gegen-Polylinie mit Breite; der Standardtyp zerlegt den
  Strich in die Teile außerhalb des Kreises, der Strichtyp entfernt ihn ganz.
- **Lasso**: Ray-Casting, Auswahlkriterium wie in GoodNotes — ein Strich gilt
  als ausgewählt, wenn mindestens 60 % seiner Punkte im Polygon liegen.
- **Rendering** in drei Ebenen: Papier, ein zwischengespeichertes Offscreen-Bild
  aller festgeschriebenen Objekte, darüber der laufende Strich. Während des
  Zeichnens wird der Cache nur geblittet.
- **Textmarker** zeichnet mit `multiply` und 40 % Deckkraft in einem Pfad —
  Selbstüberschneidungen dunkeln dadurch nicht nach.

## Bedienung

| Kürzel | Wirkung |
|---|---|
| `1`–`0`, `\` | Werkzeug wählen |
| `⌘Z` / `⇧⌘Z` | Rückgängig / Wiederholen |
| Leertaste + Ziehen | Fläche verschieben |
| Scrollen / `⌘`+Scrollen | Verschieben / Zoomen |
| Zwei Finger | Verschieben und Zoomen |
| `F` | Alles einpassen |
| `⌘0` `⌘+` `⌘−` | Zoom 100 % / hinein / heraus |
| `⌘A` `⌘C` `⌘X` `⌘V` `⌘D` | Auswählen, Kopieren, Ausschneiden, Einfügen, Duplizieren |
| `⌫` | Auswahl löschen |
| `⌘F` `⌘\` `⇧⌘R` `⌘E` | Suchen · Seitenleiste · Lesemodus · PNG-Export |
| Umschalt beim Ziehen | Winkel rasten (Formen, Klebeband) |
| Am Strichende kurz halten | Strich begradigen |

Bilder lassen sich auf die Fläche ziehen oder mit `⌘V` einfügen. Der Stand wird
laufend im `localStorage` gesichert und beim nächsten Öffnen wiederhergestellt —
mit allen Boards, Inhalten, Kameraposition und Design.

## Wie originalgetreu ist das?

Die Oberfläche folgt einer recherchierten Spezifikation der GoodNotes-Whiteboard-
Ansicht: Aufbau der drei Leisten, Reihenfolge und Optionen der Werkzeuge,
Design-Tokens (Akzentfarbe `#00A99D` bzw. `#1FC7BA` im dunklen Design, iOS-
Grautöne, Maße, Radien, Schatten, Typografie) und die Popover-Struktur.

**Bewusst anders:**

- **Papier und Design sind zwei getrennte Achsen.** Das dunkle Design färbt nur
  die Bedienoberfläche; das Blatt bleibt weiß, bis man die Papierfarbe wechselt.
- **Nur angedeutet, weil im Browser nicht sinnvoll:** Kamera, Dokumentenscan,
  Audioaufnahme, die AI-Funktionen und das Anpassen der Werkzeugleiste. Diese
  Einträge sind im Menü sichtbar, aber deaktiviert und als solche beschriftet.
- **Ergänzt:** Export als PNG und JSON, Suche über Textfelder, Tastenkürzel-
  Übersicht — praktisch für ein Mockup, das man herumzeigen will.

**Nicht umgesetzt** (es bleibt ein Mockup, kein Produkt): Kollaborationslinks und
Präsentationsmodus im Teilen-Menü, das Drehen einer Auswahl samt der acht
Skaliergriffe, die Farbpipette und die Randlinie im Muster-Menü. Die Auswahl
bietet vier Eckgriffe und proportionales Skalieren.

Die Werkzeug-Icons sind neu gezeichnete SVGs im SF-Symbols-Duktus, keine Kopien
der GoodNotes-Grafiken. GoodNotes ist eine Marke von Time Base Technology
Limited; dieses Projekt steht in keiner Verbindung dazu und dient als
Gestaltungs- und Technikstudie.
