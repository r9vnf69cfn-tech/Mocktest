#!/usr/bin/env python3
"""marken.py — wo im Mitschnitt welcher Schirm steht.

Warum nicht einfach die Zeitmarken aus der Aufnahme nehmen: ipad-sitzung.js
schreibt sie mit Date.now() mit, die Aufnahme selbst läuft aber mit variabler
Bildrate. Beim Umrechnen auf 30 Bilder je Sekunde dehnt und staucht ffmpeg
ungleichmäßig — zwischen Wanduhr und Videozeit lagen im Versuch mal 0,2 und
mal 1,5 Sekunden. Ein Schnitt, der sich darauf verlässt, sitzt zufällig.

Also wird nicht geglaubt, sondern gesehen: jedes Bild wird mit den geprüften
Schirmbildern aus buehne-pruefen.js verglichen und dem ähnlichsten zugeordnet.
Das Ergebnis ist eine Liste zusammenhängender Läufe — Schirm, Anfang, Ende,
und darin das ruhigste Fenster, denn genau dort will der Schnitt hin.
"""
import glob, json, os, sys
from PIL import Image, ImageChops

HEIM = '/home/user/story'
AUFN = HEIM + '/aufn'
PRUEF = HEIM + '/pruef'
KLEIN = (40, 28)          # so grob, dass Text egal ist, so fein, dass Aufbau zählt


def signatur(bild):
    g = bild.convert('L').resize(KLEIN, Image.BILINEAR)
    b = list(g.getdata())
    m = sum(b) / len(b)
    # auf den Mittelwert normiert: die Helligkeit eines Schirms schwankt beim
    # Überblenden, sein Aufbau nicht.
    return [x - m for x in b]


def abstand(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def laden_vorlagen():
    v = {}
    for p in sorted(glob.glob(PRUEF + '/*.png')):
        name = os.path.basename(p)[:-4]
        v[name] = signatur(Image.open(p))
    return v


def laufen(glaetten=7):
    vorlagen = laden_vorlagen()
    if not vorlagen:
        sys.exit('Keine Vorlagen in ' + PRUEF + ' — erst tools/story/buehne-pruefen.js laufen lassen.')
    bilder = sorted(glob.glob(AUFN + '/*.jpg'))
    if not bilder:
        sys.exit('Keine Bilder in ' + AUFN)

    roh, bewegung = [], [0.0]
    vorige = None
    for f in bilder:
        im = Image.open(f)
        s = signatur(im)
        if vorige is not None:
            bewegung.append(sum(abs(x - y) for x, y in zip(s, vorige)) / len(s))
        vorige = s
        roh.append(min(vorlagen, key=lambda k: abstand(s, vorlagen[k])))

    # Medianfilter: einzelne Ausreißer während einer Überblendung zählen nicht.
    fest = []
    for i in range(len(roh)):
        fenster = roh[max(0, i - glaetten):i + glaetten + 1]
        fest.append(max(set(fenster), key=fenster.count))

    laeufe = []
    a = 0
    for i in range(1, len(fest) + 1):
        if i == len(fest) or fest[i] != fest[a]:
            if i - a >= 15:                      # unter einer halben Sekunde ist kein Schirm
                laeufe.append({'schirm': fest[a], 'von': a, 'bis': i - 1})
            a = i

    # Das ruhigste Fenster in jedem Lauf: dort steht das Bild, dort schneidet man.
    for l in laeufe:
        n = l['bis'] - l['von'] + 1
        w = min(45, max(9, n // 3))
        bestes, ruhe = l['von'], 1e9
        for s in range(l['von'], l['bis'] - w + 2):
            r = sum(bewegung[s:s + w]) / w
            if r < ruhe:
                ruhe, bestes = r, s
        l['ruhig'] = bestes
        l['ruhe'] = round(ruhe, 2)
        l['bilder'] = n
    return laeufe, bewegung


if __name__ == '__main__':
    laeufe, bewegung = laufen()
    json.dump({'laeufe': laeufe, 'bewegung': [round(x, 2) for x in bewegung]},
              open(HEIM + '/schnittmarken.json', 'w'), indent=1)
    print('%-18s %8s %8s %7s %7s' % ('Schirm', 'von', 'bis', 'Länge', 'Ruhe'))
    for l in laeufe:
        print('%-18s %7.2f s %7.2f s %6.2f s  bei %.2f s (%.1f)' % (
            l['schirm'], l['von'] / 30, l['bis'] / 30, l['bilder'] / 30,
            l['ruhig'] / 30, l['ruhe']))
