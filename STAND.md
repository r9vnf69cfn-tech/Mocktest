# Stand — 10. August, Abend

Alles ist eingecheckt und gepusht. Branch `claude/goodnotes-canvas-mockup-6ujblz`,
HEAD `91a68f9`. Nichts liegt uncommitted herum, nichts wartet in einem
Kladdeordner — der Container darf weg.

---

## Wo die Sachen liegen

| Was | Wo |
|---|---|
| Der begehbare Prototyp | `mockups/prototyp/` — `index.html` ist erzeugt, Quelle sind die Schirme in `mockups/app-next/` |
| Der Prototyp als eine Datei | `node tools/einzeldatei-bauen.js` → `/home/user/velum-prototyp.html` (3,9 MB, laeuft ueber `file://`, Canvas eingebettet) |
| Live | https://claude.ai/code/artifact/07eb7e23-beaf-49eb-ba37-9975e6cb8d5b |
| Der Ordner zum Herunterladen | `node tools/paket-bauen.js` → `/home/user/newmockup/` (29 MB, gezippt 25) |
| Das Canvas | `index.html` + `js/` + `css/` im Wurzelverzeichnis |
| Die Regeln, gegen die alles gebaut ist | `docs/04_velum-dna.md` — das Leitmotiv, die drei Grundformen, die sieben Serif-Rollen, die Nachtraege N1–N12 |

## Wie man etwas aendert

```
# Schirm geaendert (mockups/app-next/*.html):
node tools/prototyp-bauen.js          # baut mockups/prototyp/index.html neu

# Bedienung geaendert (mockups/prototyp/prototyp.js):
#   nichts zu bauen — index.html laedt die Datei extern

# Danach immer:
node tools/tote-knoepfe.js            # muss 0 tote <button> melden
node tools/wirkungsprobe.js           # STARR nur bei „du bist schon hier"

# Und zum Ausliefern:
node tools/einzeldatei-bauen.js       # Artefakt
node tools/paket-bauen.js             # newmockup/
node tools/paket-pruefen.js           # 46 Seiten, kein toter Verweis
```

`tools/rendern.js` erzeugt die Bilder in `mockups/_renders/`,
`tools/md2html.js` die sechs Dokumentseiten aus den Markdown-Quellen.

Playwright liegt nicht im Repo. Die Messwerkzeuge brauchen `playwright-core`
im `NODE_PATH` und den Browser unter
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

---

## Was in der letzten Runde passiert ist

Die Messung nach der Erzeugen-Runde fand **207 echte `<button>`**, die
dastanden wie Bedienung und keine waren. Jetzt sind es **null**, und
**203 von 234** oertlich wirkenden Elementen veraendern beim Druck
nachweislich das Bild.

Die Regel dazu steht in `mockups/prototyp/prototyp.js` §14 ganz oben:

> Ein `<button>` im Prototyp hat entweder einen Weg, oder eine sichtbare
> Wirkung an Ort und Stelle, oder er ist kein `<button>`.

§14 ist nach Familien geordnet (Umschalter · Seitenleisten · Filterchips ·
Symbole · Aufgaben-Detail · Lernsitzung · Editor · Uebergabe-Chips). **§14t
ist die Nachlese** und sammelt auf, was keine Familie hat — sie meldet jeden
Fund in der Konsole. Steht dort etwas, gehoert es in eine eigene Zeile, nicht
in die Nachlese.

Die drei Befunde der Abnahme davor sind weg: „Canvas-Blatt" liefert ein
leeres Blatt (`js/app.js` kennt jetzt `?leer=1`), die ERKANNT-Zeile liest
wirklich, was getippt wird, und die Kollision auf dem Lernkarten-iPhone ist
mit den beiden Tinte-Korrekturen verschwunden.

---

## Die Abnahme der zweiten Runde (11. August)

Acht Prüfer haben die Bedienung aus §14 in Dunkel, auf dem iPhone und bei
großer Schrift nachgemessen — alles Kombinationen, die beim Bauen nie
angesehen worden waren. Der Bericht liegt in
`scratchpad/abnahme-14.md` (flüchtig, aber die Befunde stehen hier).

**Repariert und nachgemessen:**

| Befund | Beleg | Behoben durch |
|---|---|---|
| Rückweg auf „Liste" zerstörte das zweispaltige Aufgaben-Layout für immer | `verbergen()` schrieb `style.display=''` und löschte das inline `display:grid` | `verbergen()` merkt sich den Inline-Wert (prototyp.js §8) |
| iPhone rollte im Brett 58 pt waagerecht | eine Zeile trug `translateX(88px)` aus einer Wisch-Vorführung | `.pv-brett__stapel > .row { transform: none }` |
| Ziffer im gefüllten Kalendertag war im Dunkeln weiß auf weiß | `--on-ink` gibt es nicht, Rückfall auf `#fff` | `var(--accent-on)` |
| drei tote Marken in prototyp.css | `--c-1/2/3` sind KLASSEN, keine Marken — die Deklaration fiel ungültig auf die Erbfarbe zurück | `var(--ink-1/2/3)` |
| `--rot` gibt es nicht | die Semantikfarbe heißt `--danger` und geht im Dunkeln mit | `var(--danger)` |
| Schriftgrößen-Leiter las sich klein → kleiner → Standard | „Kleiner" stand rechts von „Klein" | `Sehr klein · Klein · Standard · Groß · Sehr groß` |

**Noch offen aus der Abnahme, nach Dringlichkeit:**

1. **[schwer] Die Einstellungen haben auf dem iPhone gar keine neue
   Bedienung.** Gezählt in allen vier iPhone-Läufen: `aside` 0, `.navitem` 0,
   `.pv-einst` 0. Die elf Zeilen mit Chevron versprechen Navigation und sind
   tot. `seitenleisteBeleben` sucht `aside .navitem` — auf dem iPhone gibt es
   beides nicht.
2. **[schwer] Bei „Aa groß" laufen im Brett die Titel über die Kartenkante**,
   über die Spaltenkante und in die Nachbarspalte. Gemessen iPad hell groß,
   Planer: Textkante 818,9 gegen Kartenkante 783. Ein langes Wort kann in
   125 pt nicht umbrechen und wird nicht geklippt.
3. **[schwer] Bei „Aa groß" bricht die Bereichsliste der Einstellungen
   zusammen** — `.navitem` hat feste `height: 40px`.
4. **[schwer] Der AUS-Schalter ist im Dunkeln unsichtbar**: Knauf
   `rgb(23,25,28)` auf Kartengrund `rgb(23,25,28)` = 1,00:1. Der einzige
   Trenner ist ein fest verdrahteter schwarzer Schlagschatten.
5. **[schwer] Die Journal-Karte erfindet Orte.** Ausgezählt: kein einziger
   der gesuchten Ortsnamen kommt in irgendeinem Eintrag vor; die Ansicht
   zeigt trotzdem zwei und behauptet unter jedem „im Journal genannt". Der
   Prüfer rät, das Kartenfeld wegzulassen und nur die Liste zu behalten —
   ich halte das für richtig. Nichts erfinden ist die Regel, gegen die hier
   verstoßen wird.
6. **[mittel] Die Chips im Brett kürzen sich nicht**, sie werden mitten im
   Buchstaben abgeschnitten: `text-overflow: ellipsis` wirkt nicht auf einem
   Flex-Kasten.
7. **[mittel] Die Auswahl verliert im Brett zwei ihrer drei Merkmale** —
   Regel 2 (Fläche UND Ring UND Gewicht) bleibt nur das Gewicht.
8. **[mittel] Das Board widerspricht sich**: die einzige abgehakte Aufgabe
   steht unter „OFFEN", während „ERLEDIGT" „nichts" meldet. Ursache:
   `zeileErledigt` prüft `.is-done`, die Zeile trägt `.is-checking`.
9. **[mittel] Auf dem iPhone sortiert dasselbe Brett anders als auf dem
   iPad** — „Heute" leer, fünf von sechs unter „Ohne Termin".
10. **[mittel] Die Ortsmarken der Karte sind 24 pt hoch** statt 44, und bei
    „Aa groß" überlappen sie sich auf dem iPhone um 12 pt.
11. **[mittel] Die Zeile mit Schalter ist nicht antippbar** — nur der
    Schalter selbst, 46 × 28 pt.
12. **[mittel] „Abo" öffnet den Ausweichzustand** („AboUni"), weil der
    Schlüssel nicht trifft; die drei vorhandenen Abo-Zeilen werden nie
    benutzt.
13. **[mittel] Chevron-Zeilen in den Tafeln versprechen Navigation und tun
    nichts.**
14. **[klein]** Legende des Kalenders widerspricht der Zeichnung (jeder
    leere Tag IST ein Ring) · „ein Ring je Eintrag" auf der Karte gibt es
    nicht · der 13. sagt dem Bildschirmleser nicht, dass er heute ist · die
    Ansage sagt fest „drei Einstellungen" · jede Tafel verdeckt das
    Sync-Fehlerband · „Board" hat drei Spalten in einem Vier-Spalten-Raster ·
    das Aufgaben-Detail hat vier Umschaltzellen statt fünf.

## Was offen ist

**1 · Die drei Marken-PNG fehlen.**
`assets/brand/velum-appicon-{light,dark,tinted}.png`. Wo das Zeichen stuende,
steht ein leerer Rahmen mit dem Dateinamen — nachgezeichnet wird nichts. Das
ist die einzige Stelle, an der der Entwurf sichtbar unfertig ist, und sie ist
es mit Absicht: das Zeichen gehoert nicht mir. Sobald die drei Dateien
daliegen, erscheinen sie ueberall gleichzeitig (`.appicon` laedt genau diese
Pfade). Bis dahin meldet `tools/paket-pruefen.js` elf Seitenfehler; alle elf
sind diese drei Dateien.

**2 · Typo-Disziplin.**
`tools/paket-pruefen.js` meldet auf fast jedem Schirm **7 Schriftgroessen**,
die DNA erlaubt fuenf. Der Befund ist alt und steht seit Runde 2. Zu klaeren
waere zuerst, ob der Pruefer Systemchrome (Statusleiste, Tab-Leiste)
mitzaehlt, das nicht zum Entwurf gehoert — erst danach lohnt das Zusammen-
legen von Groessen.

**3 · Die Ueberlappungsprobe hat 16 Treffer**, alle in Schichten
(Tab-Leiste ueber Inhalt, Vorder- und Rueckseite der Lernkarte, klebende
Fusszeilen). Ich habe sie angesehen und als Artefakte der Messung eingestuft,
weil mein Pruefer keine Stapelkontexte kennt. Wer das haerten will, prueft je
Paar mit `elementFromPoint`, wer oben liegt, und ob der Obenliegende einen
deckenden Grund hat.

**4 · Das Paket verkleinert die Bilder** auf halbe Kantenlaenge und
palettiert die flaechigen (256 Farben) — sonst waeren es 132 MB statt 29. Die
vollen Fassungen liegen unter `mockups/_renders/`. Wer sie im Paket in voller
Groesse braucht, nimmt die Verkleinerung in `tools/paket-bauen.js` §2 heraus
und muss die Datei dann anders ausliefern als per Nachricht (Grenze 30 MB).

---

## Was ich als naechstes tun wuerde

In dieser Reihenfolge, jede Stufe fuer sich abgeschlossen:

1. **Der Prototyp auf einem echten Geraet.** Alles bisher ist in Chromium
   gemessen, bei 1700 × 1150 mit Maus. Ein iPad mit Finger und Pencil wird
   Dinge zeigen, die kein Skript findet — Trefferflaechen, Scrollketten, die
   Frage, ob die Uebergabe-Leiste unter dem Daumen liegt.
2. **Die Typo-Disziplin klaeren** (Punkt 2 oben) — es ist die letzte offene
   Zusage aus dem Runde-2-Auftrag.
3. **Das Zeichen** (Punkt 1 oben), sobald es da ist.

Was ich NICHT tun wuerde: weitere Schirme bauen. Siebzehn tragen die
Geschichte; der achtzehnte macht sie nicht besser, sondern nur laenger.
