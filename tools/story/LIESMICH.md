# Die Instagram-Story

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
