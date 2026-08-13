# Die zwei Filme

Zwei Fassungen, zwei Aufgaben: die **Story** zeigt das Produkt, das
**Reel** benutzt es.

---

## Die Story — 15 s

15 s · 1080 × 1920 · 30 fps · ohne Ton.

```
node tools/story/screens.js     # echte Schirme aus dem Prototyp, 3×
node tools/story/tafeln.js      # Schrifttafeln, im Browser gesetzt
python3 tools/story/schnitt.py de     # → /home/user/story/velum-story.mp4
python3 tools/story/schnitt.py en     # → …-en.mp4
```

Beide Skripte brauchen `playwright-core` im `NODE_PATH`; `schnitt.py` holt
ffmpeg aus `imageio-ffmpeg` (`pip install imageio-ffmpeg`).

## Die Machart, und warum sie so ist

Der Auftrag war „nicht KI-mäßig, sondern real". Es gibt genau drei Stellen,
an denen erzeugtes Video auffliegt: **Schrift, Bedienoberflächen und Hände.**
Also kommt keine davon aus einem Modell.

| | woher |
|---|---|
| die App-Schirme | Bildpunkte aus dem laufenden Prototyp, 3× gerendert |
| die Schrift | im Browser gesetzt, mit `mockups/shared/system.css` |
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

## Zwei Kunstgriffe halten es zusammen

**Ein Korn über alles** und **eine Farbstimmung über alles** (§ `veredeln`).
Erst dadurch werden gerechnete Ebene und echter Schirm ein Bild. Genau das
tut eine Farbkorrektur im echten Schnitt auch.

## Runway

Drei Ebenen sind bei Runway gerendert und sehen dort ausgezeichnet aus —
Schnee im Streiflicht, Eisblumen auf Glas, Winterlicht auf Bütten. Sie sind
**nicht** in dieser Fassung: der Egress-Filter dieser Sitzung sperrt Runways
Asset-Hosts (403 auf `dnznrvs05pmza.cloudfront.net` und `api.runwayml.com`),
die Dateien kommen also nicht in den Container.

Wer sie hat, legt ihre Einzelbilder unter `story/platten/{schnee,eis,papier}/`
ab — `plattenbild()` nimmt sie dann von selbst und rechnet nichts mehr.
Ein Aufruf genügt:

```
ffmpeg -i schnee.mp4 -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" story/platten/schnee/%04d.jpg
```


---

# Das Reel — 29 s

Eine Sitzung am iPad, mit allem, was die App kann.

```
node tools/story/ipad-sitzung.js   # der Prototyp wird BEDIENT und aufgezeichnet
node tools/story/reel-tafeln.js    # die Bildunterschriften
python3 tools/story/reel.py        # → /home/user/story/velum-reel.mp4
```

## Warum das kein Bildschirmvideo ist, sondern eine Aufnahme

`ipad-sitzung.js` fährt mit einem sichtbaren Zeiger über den echten
Prototyp und drückt echte Knöpfe. Aufgezeichnet wird mit Playwrights
`recordVideo`, also in Echtzeit — jede CSS-Bewegung läuft so ab, wie der
Browser sie rechnet. Ein Einzelbild-Verfahren hätte die Übergänge zerhackt,
weil zwischen zwei Aufnahmen ungleich viel Zeit vergeht.

Das Skript schreibt `marken.json` mit den Zeitpunkten jedes Handgriffs;
`reel.py` schneidet danach. Angeschnitten wird jeweils kurz **vor** dem
Druck, damit man den Zeiger ankommen sieht — ein Schnitt direkt auf den
Druck wirkt gehetzt.

## Die sechs Abschnitte

| s | Bild | Zeile |
|---|---|---|
| 0,0–2,2 | Schnee, Wortmarke | — |
| 2,2–7,0 | Heute · Tap auf die Kette · Lernkarten | AUS EINER VORLESUNG — Ein Satz wird ein Stapel Karten. |
| 7,0–13,0 | Aufgaben · Planer · Board | AUFGABEN — Fünf Blicke auf dieselben sechs Sachen. |
| 13,0–16,8 | Bibliothek · Raster wird Liste | BIBLIOTHEK — Achtzehn Notizbücher, ein Regal. |
| 16,8–21,8 | Lernsitzung · Antwort zeigen | LERNEN — Und die Karte weiß, woher sie kommt. |
| 21,8–26,0 | Canvas | CANVAS — Eine Fläche, auf der du wirklich zeichnest. |
| 26,0–29,4 | Bütten, Wortmarke, THIS WINTER | — |

## Zwei Stolpersteine, die dokumentiert bleiben sollen

**Die Seite drumherum.** `.pv-glas` liegt in `div.pv-skala`, nicht im Body.
Eine Regel `body > *:not(.pv-glas){display:none}` versteckt darum den Träger
mit — die erste Aufnahme war komplett schwarz. Jetzt wird der Pfad von der
Glasscheibe bis zum Body abgelaufen und auf jeder Stufe nur das Geschwister
weggenommen, das nicht auf dem Pfad liegt.

**Die Gerätebreite.** Bei 1,005 × Rahmenbreite lagen die äußeren Spalten des
Planers außerhalb des Bildes. Eine Vorführung, die das Vorgeführte
abschneidet, führt nichts vor. Jetzt 0,94 → 0,978.

## Ton

Bei Runway liegt ein 10-s-Klavierstück (`veo-3.1`, Aufgabe
`cd935e08-1711-4a7e-9d4e-cfa0c4b9520a`): langsam, sparsam, Moll, ohne
Aufbau. Es ist **nicht** im Film — der Egress-Filter dieser Sitzung sperrt
Runways Asset-Hosts, die Datei kommt nicht in den Container.

Wer sie hat, legt sie als `story/musik.mp4` ab; dann:

```
ffmpeg -i velum-reel.mp4 -i musik.mp4 -filter_complex \
  "[1:a]atrim=0:29.4,afade=t=in:st=0:d=1.5,afade=t=out:st=27.4:d=2,volume=0.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -shortest velum-reel-ton.mp4
```
