#!/usr/bin/env python3
"""reel.py — der Produktfilm. Ein iPad, eine Sitzung, sechs Module. 42 s.

Der Unterschied zur Story (schnitt.py) ist nicht die Länge, sondern die Art
des Materials. Die Story ZEIGT das Produkt; das Reel BENUTZT es. Was hier
läuft, ist ein Mitschnitt: tools/story/ipad-sitzung.js drückt echte Knöpfe im
echten Prototyp, und die Übergänge sind die, die der Browser wirklich rechnet.
Kein Bild davon ist nachgestellt.

DIE REGIE — nach dem Blick auf die Konkurrenz (Apple-Gerätefilme, GoodNotes,
Notion). Deren Grammatik besteht aus sechs Sätzen, und dieser Film spricht
alle sechs:

  1 · GEWICHT.     Das Gerät fliegt in Perspektive ein, dreht sich beim
                   Steigen ins Bild und federt beim Ankommen nach. Ein
                   iPad, das sich bewegt, als wöge es nichts, verrät sich
                   als Attrappe (C_einflug, _federt).
  2 · TIEFE.       Nicht jede Einstellung ist frontal. Das Gerät steht auch
                   im Dreiviertel-Profil, mit echtem Fluchtpunkt und
                   angedeuteter Gehäusekante (persp) — und einmal blättert
                   die Oberfläche selbst in die Tiefe auf: drei Karten
                   heben sich in Ebenen vom Schirm (X_heute).
  3 · NÄHE.        Punch-ins, in denen der Schirm das Bild füllt — man
                   liest die Schrift der App, statt sie zu erahnen.
  4 · EIN RAUM.    Ein Studio mit Lichtrichtung, das über die Schnitte
                   durchläuft. Auftakt und Finale sind ECHTE Ebenen aus
                   Runway (Tinte in Wasser · Staub im Winterlicht) — vom
                   Auftraggeber geliefert, nicht behauptet.
  5 · ERST BEHAUPTEN. Die Zeile steht unter dem Gerät, nie darauf, kommt
                   nach dem Schnitt und geht vor dem nächsten.
  6 · EINE FARBE.  Eine Korrektur und ein Korn über alles (S.veredeln) —
                   erst dadurch sind Mitschnitt, Runway-Ebene und Schrift
                   ein Film und nicht drei.

Und die Apple-Regel über allen: Klarheit vor Spektakel. Jeder Trick hier
zeigt etwas, das die App wirklich tut — keiner ersetzt es.
"""
import os, sys, math, glob, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '/home/user/story')
import schnitt as S                       # Werkzeug, Farbe, Korn, Vignette

W, H, FPS = S.W, S.H, S.FPS
HEIM   = '/home/user/story'
AUFN   = HEIM + '/aufn/'
BILDER = HEIM + '/reelbilder/'
KUPFER = (216, 155, 99)

# ══════════════════════════════════════════════════════════════════════════
# DER BAUPLAN
#
# 'von/bis' sind Sekunden IM MITSCHNITT (Videozeit, gemessen von marken.py —
# die Wanduhr der Aufnahme weicht um bis zu 1,5 s davon ab).
# 'stil' wählt die Einstellungsgröße: frontal · punch · persp.
# ══════════════════════════════════════════════════════════════════════════

EINSTELLUNGEN = [
    # Name        Tafel         von    bis   Dauer  Stil      Parameter
    ('notiz',    'v-notiz',     18.6,  24.6,  3.8, 'punch',  dict(nah=1.22, mitte=(.50, .46))),
    ('karten',   'v-karten',    26.8,  29.7,  2.6, 'persp',  dict(seite=+1)),
    ('lernen',   'v-lernen',    31.8,  36.6,  3.8, 'punch',  dict(nah=1.20, mitte=(.46, .45))),
    ('canvas',   'v-canvas',    38.9,  44.3,  4.8, 'frontal', dict()),
    ('biblio',   'v-biblio',    53.0,  58.9,  3.4, 'persp',  dict(seite=-1)),
    ('aufgaben', 'v-aufgaben',  59.8,  67.7,  4.6, 'frontal', dict(schlag=(62.1, 65.3))),
    ('journal',  'v-journal',   68.4,  73.9,  3.4, 'punch',  dict(nah=1.14, mitte=(.52, .45))),
]

TINTE_S, KLAIM_S, FLUG_S, HEUTE_S, MITTE_S, SCHLUSS_S = 3.2, 2.0, 2.2, 3.6, 1.6, 3.4
HEUTE_SEK = 7.9        # der ruhige Heute-Stand im Mitschnitt, für Einflug und Ebenen


# ══════════════════════════════════════════════════════════════════════════
# DIE EBENEN — Tinte und Staub sind echte Runway-Aufnahmen
# ══════════════════════════════════════════════════════════════════════════

def ebene(name, i):
    """Ein Bild einer gelieferten Ebene. 151 Bilder je; wer länger dreht,
       pendelt zurück statt zu springen."""
    dateien = sorted(glob.glob(HEIM + '/platten/' + name + '/*.jpg'))
    if not dateien:
        return Image.new('RGBA', (W, H), (10, 11, 13, 255))
    n = len(dateien)
    k = i % (2 * n - 2) if n > 1 else 0
    if k >= n:
        k = 2 * n - 2 - k
    return Image.open(dateien[k]).convert('RGBA').resize((W, H), Image.LANCZOS)


_STAUBMASKE = None

def staubgrund(i, hell=1.0):
    """Der Staub im Winterlicht, als Raum für die Schriftbilder.

       Zwei Eingriffe: Runway hat der Ebene trotz „no objects" ein
       Kamerastativ eingerechnet — es steht unten mittig und hat in einem
       Studienfilm nichts verloren. Der Beschnitt schiebt es an den Rand,
       der Bodenverlauf versenkt den Rest im Schwarz. Der Lichtschacht
       oben links bleibt unangetastet."""
    global _STAUBMASKE
    b = ebene('staub', i)
    # Beschnitt auf das obere Drittel-Fenster: das Stativ steht bei 68–93 %
    # der Höhe — ein Verlauf allein ließ seine Lichtkante stehen. Der
    # Ausschnitt hält das Seitenverhältnis exakt, sonst verzerrten die Motes.
    ah = int(H * .66); aw = int(ah * W / H)
    ax = (W - aw) // 2
    b = b.crop((ax, 0, ax + aw, ah)).resize((W, H), Image.LANCZOS)
    g = int(150 * hell)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (g, g, int(g * 1.06), 255)))
    if _STAUBMASKE is None:
        v = Image.new('L', (1, H), 255)
        dv = ImageDraw.Draw(v)
        for y in range(H):
            t = max(0.0, (y / H - .58) / .42)
            dv.point((0, y), fill=int(255 - 226 * (t ** 1.6)))
        _STAUBMASKE = Image.merge('RGBA', tuple([v.resize((W, H))] * 3) +
                                  (Image.new('L', (W, H), 255),))
    return ImageChops.multiply(b, _STAUBMASKE)


# ══════════════════════════════════════════════════════════════════════════
# DER RAUM — das Studio hinter den Gerätebildern
# ══════════════════════════════════════════════════════════════════════════

_RAUM = None

def raum():
    global _RAUM
    if _RAUM is not None:
        return _RAUM
    grund = Image.new('RGB', (W, H), (9, 10, 12))
    licht = Image.new('L', (W // 4, H // 4), 0)
    ImageDraw.Draw(licht).ellipse([-W // 16, -H // 14, W // 4 + W // 10, H // 6], fill=255)
    licht = licht.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(190))
    grund = ImageChops.add(grund, Image.merge('RGB', (
        licht.point(lambda v: int(v * .105)),
        licht.point(lambda v: int(v * .116)),
        licht.point(lambda v: int(v * .142)))))
    boden = Image.new('L', (W, H), 0)
    db = ImageDraw.Draw(boden)
    for y in range(int(H * .60), H):
        t = (y - H * .60) / (H * .40)
        db.line([(0, y), (W, y)], fill=int(26 * (1 - abs(t - .32) * 1.5) ** 2))
    boden = boden.filter(ImageFilter.GaussianBlur(80))
    grund = ImageChops.add(grund, Image.merge('RGB', (boden, boden,
                                                      boden.point(lambda v: int(v * 1.14)))))
    try:
        p = S.plattenbild('papier', 40, 150).convert('RGB')
        p = p.filter(ImageFilter.GaussianBlur(26))
        p = ImageChops.multiply(p, Image.new('RGB', (W, H), (26, 27, 31)))
        grund = ImageChops.add(grund, p)
    except Exception:
        pass
    _RAUM = grund.convert('RGBA')
    return _RAUM


def hintergrund(nr, gesamt):
    b = raum().copy()
    t = nr / max(1, gesamt)
    return ImageChops.offset(b, int(math.sin(t * math.pi * .7) * 26),
                             int(math.cos(t * math.pi * .5) * 14))


# ══════════════════════════════════════════════════════════════════════════
# DAS GERÄT
# ══════════════════════════════════════════════════════════════════════════

def aufnahmebild(sekunde):
    n = int(round(sekunde * FPS)) + 1
    p = AUFN + '%05d.jpg' % max(1, n)
    if not os.path.exists(p):
        dateien = sorted(os.listdir(AUFN))
        p = AUFN + dateien[min(max(0, n - 1), len(dateien) - 1)]
    return Image.open(p).convert('RGBA')


_GLANZ = {}

def glanz(w, h):
    if (w, h) in _GLANZ:
        return _GLANZ[(w, h)]
    g = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(g)
    d.polygon([(-w * .10, 0), (w * .30, 0), (w * .06, h), (-w * .34, h)], fill=30)
    d.polygon([(w * .34, 0), (w * .40, 0), (w * .16, h), (w * .10, h)], fill=14)
    g = g.filter(ImageFilter.GaussianBlur(w * .020))
    _GLANZ[(w, h)] = g
    return g


def geraet(schirm, breite, neigung=0.0):
    """Das iPad, quer. Der Rahmen ist bewusst so breit wie am echten Gerät
       (≈ 2,6 % der Breite rundum): ein zu dünner Rahmen liest sich als
       Bildschirmfoto mit Linie drumherum, nicht als Ding."""
    q = schirm.height / schirm.width
    sw = int(breite); sh = int(sw * q)
    s = schirm.resize((sw, sh), Image.LANCZOS)
    gl = glanz(sw, sh)
    s = ImageChops.add(s, Image.merge('RGBA', (gl, gl, gl, Image.new('L', (sw, sh), 0))))

    rand = max(6, int(sw * 0.026))
    r = int(sw * 0.032)
    gw, gh = sw + rand * 2, sh + rand * 2
    g = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand, fill=(16, 17, 20, 255))
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand,
                        outline=(104, 110, 122, 255), width=2)
    d.arc([1, 1, gw - 2, gh - 2], 195, 345, fill=(172, 178, 190, 255), width=2)
    # die Frontkamera in der oberen Blende — das kleinste Echtheitszeichen
    d.ellipse([gw / 2 - 3, rand / 2 - 3, gw / 2 + 3, rand / 2 + 3], fill=(6, 7, 9, 255))
    d.ellipse([gw / 2 - 1.5, rand / 2 - 1.5, gw / 2 + 1.5, rand / 2 + 1.5],
              fill=(38, 44, 58, 255))
    m = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=r, fill=255)
    g.paste(s, (rand, rand), m)
    if abs(neigung) > 0.001:
        g = g.rotate(neigung, resample=Image.BICUBIC, expand=True)
    return g


def spiegelung(g, hoehe=0.20, staerke=26):
    h = int(g.height * hoehe)
    sp = g.crop((0, g.height - h, g.width, g.height)).transpose(Image.FLIP_TOP_BOTTOM)
    verlauf = Image.new('L', (1, h), 0)
    dv = ImageDraw.Draw(verlauf)
    for y in range(h):
        dv.point((0, y), fill=int(staerke * (1 - y / h) ** 2.1))
    verlauf = verlauf.resize((sp.width, h), Image.BILINEAR)
    a = ImageChops.multiply(sp.split()[3], verlauf.point(lambda v: min(255, v * 10)))
    a = a.point(lambda v: int(v * staerke / 255))
    sp.putalpha(a)
    return sp.filter(ImageFilter.GaussianBlur(5.5))


# ══════════════════════════════════════════════════════════════════════════
# DIE PERSPEKTIVE — ein echter Fluchtpunkt, keine Scherung
# ══════════════════════════════════════════════════════════════════════════

def _koeffs(ziel, quelle):
    """PIL PERSPECTIVE bildet AUSGABE→EINGABE ab; die acht Koeffizienten
       kommen aus dem üblichen linearen System."""
    A, b = [], []
    for (x, y), (X, Y) in zip(ziel, quelle):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.append(X)
        A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.append(Y)
    return np.linalg.lstsq(np.array(A), np.array(b), rcond=None)[0]


def persp(img, gier, kipp=0.0, abstand=2.6):
    """Dreht die Bildebene um die Hoch- (gier) und Querachse (kipp) und
       projiziert sie mit Fluchtpunkt. Eine Scherung (affin) sähe billig
       aus — die nahe Kante muss wirklich größer sein als die ferne.

       Dazu die Gehäusetiefe: die Silhouette noch einmal, dunkel, um wenige
       Bildpunkte versetzt. Ohne sie ist das gedrehte Gerät ein Blatt
       Papier, kein Ding."""
    w, h = img.size
    gy, kx = math.radians(gier), math.radians(kipp)
    pts = []
    for x, y in [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]:
        x1 = x * math.cos(gy); z1 = x * math.sin(gy)
        y1 = y * math.cos(kx) - z1 * math.sin(kx)
        z2 = y * math.sin(kx) + z1 * math.cos(kx)
        f = (abstand * w) / (abstand * w - z2)
        pts.append((x1 * f, y1 * f))
    minx = min(p[0] for p in pts); miny = min(p[1] for p in pts)
    quad = [(p[0] - minx, p[1] - miny) for p in pts]
    W2 = int(max(p[0] for p in quad)) + 2
    H2 = int(max(p[1] for p in quad)) + 2
    co = _koeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)])
    vorn = img.transform((W2, H2), Image.PERSPECTIVE, tuple(co), Image.BICUBIC)

    dicke = max(2, int(w * 0.006 * abs(math.sin(gy)) * 3 + 2))
    dx = -dicke if gier > 0 else dicke
    kante = Image.new('RGBA', (W2 + abs(dx), H2 + 4), (0, 0, 0, 0))
    sil = Image.new('RGBA', vorn.size, (10, 11, 13, 255))
    sil.putalpha(vorn.split()[3])
    kante.alpha_composite(sil, (abs(dx) + dx if dx < 0 else 0, 3))
    kante.alpha_composite(vorn, (abs(dx) if dx < 0 else 0, 0))
    return kante


# ══════════════════════════════════════════════════════════════════════════
# DIE SCHRIFT
# ══════════════════════════════════════════════════════════════════════════

def zeile(grund, name, alpha, hub=0):
    """Bildunterschrift mit Schleier. Nicht S.tafel(unten=True): offset
       UMLÄUFT den Rand, die Zeile käme oben wieder heraus. 'hub' schiebt
       sie beim Erscheinen um wenige Punkte nach oben — Schrift, die steht,
       wirkt geschnitten; Schrift, die ankommt, wirkt gesetzt."""
    if name not in S.TAFELN or alpha <= 0.004:
        return grund
    sch = S.schleier()
    sa = sch.split()[3].point(lambda v: int(v * alpha))
    sch = sch.copy(); sch.putalpha(sa)
    grund = Image.alpha_composite(grund, sch)
    t = S.TAFELN[name]
    if hub:
        t = ImageChops.offset(t, 0, int(hub))
    ta = t.split()[3].point(lambda v: int(v * alpha))
    t = t.copy(); t.putalpha(ta)
    return Image.alpha_composite(grund, t)


def tafel_frei(grund, name, alpha, dy=0):
    if name not in S.TAFELN or alpha <= 0.004:
        return grund
    t = S.TAFELN[name]
    if dy:
        t = ImageChops.offset(t, 0, dy)
    ta = t.split()[3].point(lambda v: int(v * alpha))
    t = t.copy(); t.putalpha(ta)
    return Image.alpha_composite(grund, t)


# ══════════════════════════════════════════════════════════════════════════
# DIE EINSTELLUNGEN
# ══════════════════════════════════════════════════════════════════════════

def A_tinte(i, n, nr, gesamt):
    """0,0–3,2 s · Die Tinte. Eine echte Aufnahme: ein Tropfen fällt in
       Wasser und blüht auf. Tinte auf Papier ist Velums eigenes Material —
       der Film beginnt mit dem Stoff, aus dem die App gedacht ist. Über
       der Blüte erscheint die Wortmarke in Tintenfarbe; am Ende zieht das
       Bild ins Dunkel, aus dem der Rest des Films kommt."""
    t = i / (n - 1)
    b = ebene('tinte', i)
    m = S.TAFELN.get('v-wort-tinte')
    if m is not None and t > .30:
        a = min(1.0, S.raus((t - .30) / .28))
        ma = m.split()[3].point(lambda v: int(v * a))
        mm = m.copy(); mm.putalpha(ma)
        b = Image.alpha_composite(b, mm)
    if t > .86:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H),
                                               (0, 0, 0, int(255 * ((t - .86) / .14) ** 1.3))))
    return b


def B_klaim(i, n, nr, gesamt):
    """3,2–5,2 s · Der Staub, und ein Satz. Die Behauptung steht allein —
       im Licht der zweiten echten Ebene."""
    t = i / (n - 1)
    b = staubgrund(i, .9)
    a = min(1.0, S.raus(t / .30)) * (1.0 if t < .80 else max(0.0, 1 - (t - .80) / .20))
    return tafel_frei(b, 'v-auftakt', a, dy=int((1 - S.raus(min(1, t / .30))) * 26))


def _federt(t):
    """easeOutBack, weich: schnell heran, ein kleines Überschwingen, dann
       Stand. Das Überschwingen ist das Gewicht."""
    c1 = 1.2; c3 = c1 + 1
    u = t - 1
    return 1 + c3 * u ** 3 + c1 * u ** 2


def C_einflug(i, n, nr, gesamt):
    """5,2–7,4 s · Das Gerät kommt. Von unten, gedreht, mit Fluchtpunkt;
       beim Steigen dreht es sich ins Bild und federt in den Stand. In der
       schnellen Phase Bewegungsunschärfe aus Geistern — ein hartes
       Einzelbild mitten in einer schnellen Bewegung verrät die Rechnung."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)
    f = _federt(min(1.0, t / .82))

    schirm = aufnahmebild(HEUTE_SEK + t * 1.2)
    breite = int(W * (0.60 + 0.33 * f))
    gier = 26 * (1 - f)
    kipp = 9 * (1 - f)
    flach = geraet(schirm, breite)
    g = persp(flach, gier, kipp) if abs(gier) > 0.4 else flach

    x = (W - g.width) // 2
    y_von, y_bis = int(H * 1.02), int(H * .437) - g.height // 2
    y = int(y_von + (y_bis - y_von) * f)

    tempo = abs(_federt(min(1.0, (t + .04) / .82)) - _federt(min(1.0, max(0, t - .04) / .82)))
    if tempo > .06:
        for k in (1, 2):
            geist = g.copy()
            ga = geist.split()[3].point(lambda v: int(v * .22))
            geist.putalpha(ga)
            b.alpha_composite(geist, (x, y + int(tempo * (y_von - y_bis) * .16 * k)))
    b.alpha_composite(S.schatten(g, 52, int(120 + 85 * max(0.0, min(1.0, f)))), (x, y + 26))
    b.alpha_composite(g, (x, y))
    return b


# Die drei Karten des Heute-Schirms, als Anteile der Aufnahmefläche.
# (Kette · Heute in Zahlen · Heute fällig — gemessen am ruhigen Stand.)
KARTEN = [
    dict(box=(.253, .175, .870, .350), zug=(0, -1.0), rang=3),
    dict(box=(.645, .365, .870, .640), zug=(.55, -.6), rang=2),
    dict(box=(.253, .615, .630, .900), zug=(-.4, -.5), rang=1),
]


def X_heute(i, n, nr, gesamt):
    """7,4–11,0 s · Die Oberfläche blättert auf. Drei Karten heben sich in
       Ebenen vom Schirm — die Bildsprache jedes Apple-Gerätefilms, hier
       aber wörtlich genommen: die Karten SIND die Antwort des Produkts
       (die Kette, die Zahlen, das Fällige), nicht Zierde.

       Der Schirm dahinter tritt zurück (dunkler, einen Hauch unscharf),
       damit niemand die Karte doppelt sieht."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)

    hebung = S.raus(min(1.0, max(0.0, (t - .18) / .42)))       # 0 → 1
    schwebe = math.sin(t * math.pi * 2) * 3                      # Atmen im Stand

    schirm = aufnahmebild(HEUTE_SEK)
    breite = int(W * .93 * (1 + .022 * S.sanft(t)))
    g = geraet(schirm, breite)
    rand = max(6, int(breite * 0.026))

    if hebung > 0:
        s = g.crop((rand, rand, g.width - rand, g.height - rand))
        dunkel = ImageChops.multiply(
            s, Image.new('RGBA', s.size, (int(255 - 62 * hebung),) * 3 + (255,)))
        if hebung > .3:
            dunkel = dunkel.filter(ImageFilter.GaussianBlur(1.6 * hebung))
        g.paste(dunkel, (rand, rand))

    x = (W - g.width) // 2
    y = int(H * .437) - g.height // 2
    b.alpha_composite(spiegelung(g), (x, y + g.height + 6))
    b.alpha_composite(S.schatten(g, 52, 205), (x, y + 26))
    b.alpha_composite(g, (x, y))

    if hebung > 0:
        sw, sh = g.width - rand * 2, g.height - rand * 2
        quelle = schirm.resize((sw, sh), Image.LANCZOS)
        for k in sorted(KARTEN, key=lambda q: q['rang']):
            bx0, by0, bx1, by1 = k['box']
            c = quelle.crop((int(bx0 * sw), int(by0 * sh), int(bx1 * sw), int(by1 * sh)))
            skala = 1 + (.05 + .012 * k['rang']) * hebung
            c = c.resize((int(c.width * skala), int(c.height * skala)), Image.LANCZOS)
            m = Image.new('L', c.size, 0)
            ImageDraw.Draw(m).rounded_rectangle([0, 0, c.width - 1, c.height - 1],
                                                radius=int(14 * skala), fill=255)
            c.putalpha(m)
            zx, zy = k['zug']
            cx = x + rand + (bx0 + bx1) / 2 * sw - c.width / 2 + zx * 46 * hebung
            cy = (y + rand + (by0 + by1) / 2 * sh - c.height / 2 +
                  zy * (44 + 14 * k['rang']) * hebung + schwebe * (.5 + .25 * k['rang']))
            b.alpha_composite(S.schatten(c, 30, int(150 * hebung)),
                              (int(cx), int(cy + 10 + 8 * hebung)))
            b.alpha_composite(c, (int(cx), int(cy)))

    a = min(1.0, S.raus(max(0.0, (t - .10) / .18))) * (1.0 if t < .88 else max(0.0, (1 - t) / .12))
    return zeile(b, 'v-heute', a)


def B_sitzung(i, n, nr, gesamt, name, tafel, von, bis, stil, par):
    """Eine Einstellung aus dem Mitschnitt — frontal, nah oder im Profil."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)
    sek = von + (bis - von) * t
    schirm = aufnahmebild(sek)

    if stil == 'punch':
        nah = par.get('nah', 1.2); mitte = par.get('mitte', (.5, .45))
        zoom = 0.9280 * nah * (1.0 + 0.035 * S.sanft(t))
        g = geraet(schirm, int(W * zoom), 0.12 * math.sin((t - .5) * 1.2))
        x = int(W * .5 - g.width * mitte[0])
        y = int(H * .437 - g.height * mitte[1]) + int(5 * math.sin(t * math.pi))
        b.alpha_composite(S.schatten(g, 60, 150), (x, y + 20))
        b.alpha_composite(g, (x, y))

    elif stil == 'persp':
        seite = par.get('seite', 1)
        gier = seite * (15 - 6 * S.sanft(t))            # dreht sich langsam auf
        kipp = 5 - 2 * S.sanft(t)
        flach = geraet(schirm, int(W * 1.02 * (1 + .03 * S.sanft(t))))
        g = persp(flach, gier, kipp)
        x = (W - g.width) // 2 - seite * int(14 * (1 - S.sanft(t)))
        y = int(H * .430) - g.height // 2
        el = Image.new('RGBA', (g.width, 90), (0, 0, 0, 0))
        ImageDraw.Draw(el).ellipse([g.width * .10, 12, g.width * .90, 78],
                                   fill=(0, 0, 0, 120))
        b.alpha_composite(el.filter(ImageFilter.GaussianBlur(18)), (x, y + g.height - 30))
        b.alpha_composite(g, (x, y))

    else:  # frontal
        zoom = 0.9280 * (1.0 + 0.035 * S.sanft(t))
        # Der Schlag: bei jedem Ansichtswechsel im Bild ein kurzer Stoß in
        # der Brennweite — der Schnitt-Akzent der Gerätefilme, auf den
        # Moment gelegt, in dem die App wirklich umschaltet.
        for schlag in par.get('schlag', ()):
            zoom *= 1 + .016 * math.exp(-((sek - schlag) ** 2) / (2 * .14 ** 2))
        g = geraet(schirm, int(W * zoom), 0.30 * math.sin((t - .5) * 1.2))
        x = (W - g.width) // 2
        y = int(H * .437) - g.height // 2 + int(6 * math.sin(t * math.pi))
        b.alpha_composite(spiegelung(g), (x, y + g.height + 6))
        b.alpha_composite(S.schatten(g, 52, 205), (x, y + 26))
        b.alpha_composite(g, (x, y))

    ein = 0.25 * FPS / n
    aus = 0.30 * FPS / n
    auf = min(1.0, S.raus(max(0.0, (t - ein) / .16)))
    a = auf * (1.0 if t < 1 - aus else max(0.0, (1 - t) / aus))
    return zeile(b, tafel, a, hub=int((1 - auf) * 14))


def C_mitte(i, n, nr, gesamt):
    t = i / (n - 1)
    b = staubgrund(i + 40, .8)
    a = min(1.0, S.raus(t / .28)) * (1.0 if t < .74 else max(0.0, 1 - (t - .74) / .26))
    return tafel_frei(b, 'v-mitte', a)


def D_schluss(i, n, nr, gesamt):
    """Der Staub, das Zeichen, der Zeitpunkt — und ein Abgang ins Schwarze."""
    t = i / (n - 1)
    b = staubgrund(i + 70, 1.0)
    a = min(1.0, S.raus(t / .26))
    b = tafel_frei(b, 'v-marke', a, dy=int((1 - a) * 18))
    if t > .84:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H),
                                               (0, 0, 0, int(255 * (t - .84) / .16))))
    return b


# ══════════════════════════════════════════════════════════════════════════
# BAUEN
# ══════════════════════════════════════════════════════════════════════════

def tafeln_laden():
    """schnitt.vorbereiten() kennt nur t-* und r-*. Die Tafeln dieses Films
       heißen v-* und fielen beim ersten Bauen still durch — der Film lief,
       nur ohne ein einziges Wort darin. Also selbst laden, laut zählen."""
    n = 0
    for f in sorted(glob.glob(S.QUELLE + 'v-*.png')):
        S.TAFELN[os.path.basename(f)[:-4]] = S.lade(f, (W, H))
        n += 1
    if not n:
        raise SystemExit('Keine v-*.png in ' + S.QUELLE +
                         ' — erst tools/story/reel-tafeln.js laufen lassen.')
    return n


def plan():
    p = [('tinte', A_tinte, TINTE_S, None),
         ('klaim', B_klaim, KLAIM_S, None),
         ('einflug', C_einflug, FLUG_S, None),
         ('heute', X_heute, HEUTE_S, None)]
    for name, tafel, von, bis, dauer, stil, par in EINSTELLUNGEN:
        p.append((name, None, dauer, (name, tafel, von, bis, stil, par)))
        if name == 'lernen':
            p.append(('mitte', C_mitte, MITTE_S, None))
    p.append(('schluss', D_schluss, SCHLUSS_S, None))
    return p


def bauen(nur=None):
    S.vorbereiten()
    print('  Tafeln:', tafeln_laden())
    os.makedirs(BILDER, exist_ok=True)
    if not nur:
        for f in os.listdir(BILDER):
            os.remove(BILDER + f)

    schritte = plan()
    gesamt = sum(int(round(d * FPS)) for _, _, d, _ in schritte)
    nr = 0
    for name, fn, dauer, arg in schritte:
        n = int(round(dauer * FPS))
        if nur and name not in nur:
            nr += n
            continue
        for i in range(n):
            b = fn(i, n, nr, gesamt) if fn else B_sitzung(i, n, nr, gesamt, *arg)
            S.veredeln(b, nr).convert('RGB').save('%s%05d.jpg' % (BILDER, nr), quality=95)
            nr += 1
        print('  %-9s %3d Bilder  %4.1f s' % (name, n, dauer), flush=True)
    return gesamt


def kodieren(ziel=HEIM + '/velum-reel.mp4'):
    subprocess.run([S.ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(FPS),
                    '-i', BILDER + '%05d.jpg',
                    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ziel], check=True)
    return ziel


if __name__ == '__main__':
    nur = sys.argv[1:] or None
    n = bauen(nur)
    print('Bilder gesamt:', n, '=', round(n / FPS, 1), 's')
    print('Datei:', kodieren())
