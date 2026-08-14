#!/usr/bin/env python3
"""glas.py — findet den glühenden Schirm in Runways Kino-Material und
rechnet die echte Oberfläche darauf.

Das ist der Handschlag der Arbeitsteilung: Seedance hat die drei
Geräte-Shots mit ABSICHTLICH leerem, gleichmäßig glühendem Schirm
gerendert (so stand es im Prompt). Ein gleichmäßiges helles Viereck in
einer dunklen Szene lässt sich verfolgen; gerenderte Pseudo-UI hätte
man von Hand wegretuschieren müssen.

Der Tracker, Schritt für Schritt:
  1 · Leuchtdichte-Maske: heller als max(190, 0,82 · Bildmaximum).
  2 · Erosion/Dilatation (np.roll): Staubkörner und Lichtschachtsäume
      fliegen raus, die große Fläche bleibt.
  3 · Ecken über die Extremwerte von x+y und x−y — für ein konvexes
      Viereck in Bildlage genau die vier Schirmecken.
  4 · Zeitliche Glättung (gleitendes Mittel über 7 Bilder) — die Maske
      zittert um ±2 px, die Ecke darf es nicht.
  5 · Die UI wird mit der 8-Parameter-Projektion (reel._koeffs) auf das
      Viereck gerechnet. Als Alphakanal dient DIE MASKE SELBST: damit
      übernimmt die Montage Rundungen, Anschnitte und alles, was im
      Material vor dem Schirm schwebt.
  6 · Rücklicht: die Leuchtdichte des Originals (weichgezeichnet, aufs
      Mittel normiert) multipliziert die UI — der Glanz und der Lichtabfall
      des gerenderten Glases bleiben auf der echten Oberfläche liegen.
"""
import os, sys, glob
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '/home/user/story')
import reel as R

KINO = '/home/user/story/kino/'


def _erode(m, n=3):
    for _ in range(n):
        m = (m & np.roll(m, 1, 0) & np.roll(m, -1, 0) &
             np.roll(m, 1, 1) & np.roll(m, -1, 1))
    return m


def _dilate(m, n=3):
    for _ in range(n):
        m = (m | np.roll(m, 1, 0) | np.roll(m, -1, 0) |
             np.roll(m, 1, 1) | np.roll(m, -1, 1))
    return m


def maske(bild):
    """Die Schirmmaske eines Einzelbilds, oder None.

       Zwei Merkmale, nicht eins: Leuchtdichte allein reichte nicht — im
       Kran-Shot ist der Bodenfleck hinter dem Gerät hell genug, um mit
       der Schirmmaske zusammenzuwachsen; die Ecken wanderten in den Boden
       und die UI ragte als dunkler Klumpen über die Oberkante. Aber der
       Schirm glüht WARM (R ≥ B), der Winterboden streut KÜHL (B > R).
       Der Farbkanal trennt, was die Helligkeit nicht trennen kann."""
    rgb = np.asarray(bild.convert('RGB'), dtype=np.float32)
    a = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    schwelle = max(190.0, 0.82 * float(a.max()))
    warm = (rgb[..., 0] - rgb[..., 2]) > -4.0
    m = (a > schwelle) & warm
    m = _dilate(_erode(m, 4), 4)
    if m.sum() < 14000:
        return None, a
    return m, a


def ecken(m):
    """TL·TR·BR·BL über die Extremwerte — trägt für konvexe Vierecke."""
    ys, xs = np.nonzero(m)
    s = xs + ys; d = xs - ys
    tl = (xs[s.argmin()], ys[s.argmin()])
    br = (xs[s.argmax()], ys[s.argmax()])
    tr = (xs[d.argmax()], ys[d.argmax()])
    bl = (xs[d.argmin()], ys[d.argmin()])
    return [tl, tr, br, bl]


def spur(clip):
    """Die Eckenspur eines Clips: je Bild vier Ecken oder None, geglättet."""
    dateien = sorted(glob.glob(KINO + clip + '/*.jpg'))
    roh = []
    for f in dateien:
        m, _ = maske(Image.open(f))
        roh.append(ecken(m) if m is not None else None)
    # glätten: gleitendes Mittel über gültige Nachbarn (Fenster 7)
    glatt = []
    for i in range(len(roh)):
        if roh[i] is None:
            glatt.append(None)
            continue
        nachbarn = [roh[j] for j in range(max(0, i - 3), min(len(roh), i + 4))
                    if roh[j] is not None]
        p = np.array(nachbarn, dtype=np.float64).mean(axis=0)
        glatt.append([tuple(q) for q in p])
    return dateien, glatt


def einrechnen(bild, eckliste, ui, glanz_staerke=1.0):
    """Die UI auf das Viereck dieses Bilds — Maske als Alpha, Glanz bleibt."""
    m, L = maske(bild)
    if m is None or eckliste is None:
        return bild
    W2, H2 = bild.size
    quad = [tuple(map(float, p)) for p in eckliste]
    co = R._koeffs(quad, [(0, 0), (ui.width, 0), (ui.width, ui.height), (0, ui.height)])
    gelegt = ui.convert('RGBA').transform((W2, H2), Image.PERSPECTIVE,
                                          tuple(co), Image.BICUBIC)
    # Rücklicht: Original-Leuchtdichte, weich, aufs Maskenmittel normiert.
    # (Der Blur läuft auf uint8 — PIL kennt keinen Gauß auf Modus 'F'.)
    mittel = float(L[m].mean())
    weichlicht = Image.fromarray(L.astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))
    lich = np.clip(np.asarray(weichlicht, dtype=np.float32) / max(1.0, mittel),
                   0.55, 1.30 * glanz_staerke)[..., None]
    g = np.asarray(gelegt, dtype=np.float32)
    g[..., :3] = np.clip(g[..., :3] * lich, 0, 255)
    # Alphakanal = gefiederte Maske
    weich = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.4))
    g[..., 3] = np.asarray(weich, dtype=np.float32)
    aus = bild.convert('RGBA')
    aus.alpha_composite(Image.fromarray(g.astype(np.uint8)))
    return aus


if __name__ == '__main__':
    # Probelauf: Spur aller Clips, Deckungsbericht, drei markierte Bilder je Clip
    from PIL import ImageDraw
    for clip in ['a', 'b', 'kran']:
        dateien, gl = spur(clip)
        gut = [i for i, e in enumerate(gl) if e is not None]
        laeufe = []
        for i in gut:
            if laeufe and i == laeufe[-1][1] + 1:
                laeufe[-1][1] = i
            else:
                laeufe.append([i, i])
        print(clip, '· spurfest:', ' '.join('%d–%d' % (a, b) for a, b in laeufe))
        for k, i in enumerate([gut[0], gut[len(gut) // 2], gut[-1]] if gut else []):
            b = Image.open(dateien[i]).convert('RGB')
            d = ImageDraw.Draw(b)
            e = gl[i]
            d.line([*e[0], *e[1], *e[2], *e[3], *e[0]], fill=(255, 80, 60), width=4)
            b.save('/home/user/story/spur-%s-%d.jpg' % (clip, k), quality=88)
