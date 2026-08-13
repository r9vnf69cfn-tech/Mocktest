#!/usr/bin/env python3
"""
reel.py — das Instagram-Reel: eine Sitzung am iPad, mit allem, was die App kann.

Der Unterschied zur Story (schnitt.py) ist nicht die Länge, sondern die Art
des Materials. Die Story ZEIGT das Produkt; das Reel BENUTZT es. Was hier
läuft, ist ein Mitschnitt: ein Zeiger fährt über den echten Prototyp, drückt
echte Knöpfe, und die Übergänge sind die, die der Browser wirklich rechnet
(story-ipad.js). Kein Bild davon ist nachgestellt.

Drumherum liegt dasselbe Winterbild wie in der Story — die Runway-Ebenen,
die inzwischen vorliegen. Und darüber liegt dieselbe Farbstimmung und
dasselbe Korn, damit Mitschnitt, Winterbild und Schrift ein Film sind und
nicht drei.
"""
import os, sys, math, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schnitt as S                       # Werkzeug, Farbe, Korn, Vignette

W, H, FPS = S.W, S.H, S.FPS
HEIM  = S.HEIM
AUFN  = HEIM + '/aufn/'
BILDER = HEIM + '/reelbilder/'

# Zeitmarken aus dem Mitschnitt (story-ipad.js schreibt sie mit).
# Angeschnitten wird jeweils kurz VOR dem Handgriff, damit man den Zeiger
# noch ankommen sieht — ein Schnitt direkt auf den Druck wirkt gehetzt.
SEGMENTE = [
    ('r-notiz',    5.6, 10.4),    # Heute · Tap auf die Kette · die Notiz geht auf
    ('r-aufgaben', 12.6, 18.6),   # Aufgaben · Planer · Board
    ('r-biblio',   19.6, 23.4),   # Bibliothek · Raster wird Liste
    ('r-lernen',   24.0, 29.0),   # Lernsitzung · Antwort zeigen
    ('r-canvas',   35.2, 39.4),   # Canvas · die Zeichenfläche
]
VOR, NACH = 2.2, 3.4              # Winterbild am Anfang und am Ende


def aufnahmebild(sekunde):
    """Ein Einzelbild des Mitschnitts. 1157 Bilder liegen als JPG bereit."""
    n = int(round(sekunde * FPS)) + 1
    p = AUFN + '%05d.jpg' % max(1, n)
    if not os.path.exists(p):
        dateien = sorted(os.listdir(AUFN))
        p = AUFN + dateien[min(max(0, n - 1), len(dateien) - 1)]
    return Image.open(p).convert('RGBA')


def geraet_quer(schirm, breite):
    """Das iPad liegt quer. Rahmen und Radius wie beim Telefon, nur flacher —
       ein Gerät im Bild braucht eine Kante, sonst schwebt der Schirm."""
    q = schirm.height / schirm.width
    sw = int(breite); sh = int(sw * q)
    s = schirm.resize((sw, sh), Image.LANCZOS)
    rand = max(3, int(sw * 0.008))
    r = int(sw * 0.026)
    gw, gh = sw + rand * 2, sh + rand * 2
    g = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand, fill=(26, 28, 32, 255))
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand,
                        outline=(92, 98, 108, 255), width=max(1, rand // 2))
    m = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=r, fill=255)
    g.paste(s, (rand, rand), m)
    return g


def grund(i, n):
    """Der Winterhintergrund hinter dem Gerät: die Schnee-Ebene, weit
       heruntergenommen. Sie soll das Gerät tragen, nicht mit ihm streiten."""
    b = S.plattenbild('schnee', i % 150, 150)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (44, 48, 56, 255)))
    return Image.alpha_composite(Image.new('RGBA', (W, H), (10, 11, 13, 255)), b)


def A_auftakt(i, n):
    """0,0–2,2 s · Schnee, und die Wortmarke steht schon da. Ein Reel hat
       keine Zeit für ein Rätsel — wer es ist, gehört ins erste Bild."""
    t = i / (n - 1)
    b = S.plattenbild('schnee', i, n)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (168, 174, 186, 255)))
    a = min(1.0, S.raus(t / .35)) * (1.0 if t < .86 else max(0.0, 1 - (t - .86) / .14))
    m = S.TAFELN.get('t-marke-nackt')
    if m is not None:
        mm = ImageChops.offset(m, 0, -int(H * .02))
        if a < 1:
            al = mm.split()[3].point(lambda v: int(v * a))
            mm = mm.copy(); mm.putalpha(al)
        b = Image.alpha_composite(b, mm)
    return b


def B_sitzung(i, n, name, von, bis):
    """Der Mitschnitt. Das iPad steht in der Mitte, die Zeile darunter.

       Zwei Handgriffe machen aus einem Bildschirmvideo eine Aufnahme:
       eine sehr langsame Fahrt (1,0 → 1,05) und das Winterbild dahinter.
       Ohne sie klebt das Gerät im Bild wie ein aufgeklebter Screenshot."""
    t = i / (n - 1)
    b = grund(i, n)

    sek = von + (bis - von) * t
    schirm = aufnahmebild(sek)

    # 0,94 statt 1,005: der ganze Schirm muss im Bild sein. Die Fahrt bleibt,
    # aber sie holt heran, ohne über die Kante zu laufen.
    breite = int(W * (.940 + .038 * S.sanft(t)))
    g = geraet_quer(schirm, breite)
    x = (W - g.width) // 2
    y = int(H * .425) - g.height // 2
    b.alpha_composite(S.schatten(g, 48, 190), (x, y + 22))
    b.alpha_composite(g, (x, y))

    a = min(1.0, S.raus(t / .16)) * (1.0 if t < .90 else max(0.0, 1 - (t - .90) / .10))
    if name in S.TAFELN:
        b = S.tafel(b, name, a, unten=False)
    return b


def C_schluss(i, n):
    """Papier, Zeichen, Zeitpunkt. Dieselbe Schlusskarte wie in der Story —
       ein Absender soll über zwei Filme derselbe sein."""
    t = i / (n - 1)
    b = S.plattenbild('papier', i, n)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (104, 108, 118, 255)))
    b = Image.alpha_composite(b, Image.new('RGBA', (W, H), S.TINTE + (int(255 * .30),)))
    a = min(1.0, S.raus(t / .32))
    b = S.tafel(b, 't-marke', a)
    if t > .84:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H), (0, 0, 0, int(255 * (t - .84) / .16))))
    return b


def bauen():
    S.vorbereiten()
    os.makedirs(BILDER, exist_ok=True)
    for f in os.listdir(BILDER):
        os.remove(BILDER + f)

    plan = [('auftakt', A_auftakt, VOR, None)]
    for name, von, bis in SEGMENTE:
        plan.append((name, None, bis - von, (name, von, bis)))
    plan.append(('schluss', C_schluss, NACH, None))

    nr = 0
    for name, fn, dauer, arg in plan:
        n = int(round(dauer * FPS))
        for i in range(n):
            b = fn(i, n) if fn else B_sitzung(i, n, *arg)
            S.veredeln(b, nr).convert('RGB').save('%s%05d.jpg' % (BILDER, nr), quality=95)
            nr += 1
        print('  %-10s %3d Bilder  %4.1f s' % (name, n, dauer), flush=True)
    return nr


def kodieren(ziel=HEIM + '/velum-reel.mp4'):
    subprocess.run([S.ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(FPS),
                    '-i', BILDER + '%05d.jpg',
                    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ziel], check=True)
    return ziel


if __name__ == '__main__':
    n = bauen()
    print('Bilder gesamt:', n, '=', round(n / FPS, 1), 's')
    print('Datei:', kodieren())
