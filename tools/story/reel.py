#!/usr/bin/env python3
"""reel.py — der Produktfilm. Ein iPad, eine Sitzung, sechs Module.

Der Unterschied zur Story (schnitt.py) ist nicht die Länge, sondern die Art
des Materials. Die Story ZEIGT das Produkt; das Reel BENUTZT es. Was hier
läuft, ist ein Mitschnitt: tools/story/ipad-sitzung.js drückt echte Knöpfe im
echten Prototyp, und die Übergänge sind die, die der Browser wirklich rechnet.
Kein Bild davon ist nachgestellt.

Was diesen Schnitt von einem Bildschirmvideo unterscheidet — die Liste, an
der man einen teuren Film von einem billigen trennt:

  1 · EIN RAUM.        Das Gerät steht nicht auf einer Farbfläche, sondern in
                       einem Licht: eine weiche Kuppel oben links, ein Abfall
                       nach unten rechts, eine Bodenspiegelung. Ohne Raum
                       klebt jeder Schirm wie ein Aufkleber im Bild.
  2 · EINE KAMERA.     Über jede Einstellung läuft eine sehr langsame Fahrt
                       (1,000 → 1,035) mit einem Hauch Drift. Ein absolut
                       stillstehendes Gerät liest sich als Standbild.
  3 · EIN SCHNITT.     Harte Schnitte auf den Zustandswechsel, und der
                       Hintergrund läuft ÜBER die Schnitte durch. Damit ist
                       es ein Film und nicht eine Reihe von Aufnahmen.
  4 · ERST BEHAUPTEN.  Die Zeile steht nie über dem Schirm, den sie meint,
                       sondern unter ihm, auf einem Schleier. Sie kommt eine
                       Viertelsekunde nach dem Schnitt und geht vor dem
                       nächsten — Schrift, die mit dem Bild wechselt, liest
                       sich als Untertitel, nicht als Werbung.
  5 · EINE FARBE.      Eine Korrektur und ein Korn über alles (S.veredeln).
                       Erst dadurch sind Mitschnitt, Ebene und Schrift ein
                       Bild und nicht drei.
"""
import os, sys, math, subprocess
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
# Jede Einstellung nennt ihr Fenster IM MITSCHNITT (Sekunden im Video, nicht
# Wanduhr — tools/story/marken.py misst sie am Bild, weil die Wanduhr der
# Aufnahme um bis zu anderthalb Sekunden von der Videozeit abweicht).
#
# 'von' liegt bewusst kurz VOR dem Handgriff: man soll den Zustand noch
# ruhig sehen, bevor er sich ändert. Ein Schnitt direkt auf die Bewegung
# wirkt gehetzt.
# ══════════════════════════════════════════════════════════════════════════

# 'nah' ist der Rhythmus des Films. Eine Reihe gleich großer Gerätebilder
# ermüdet nach dem dritten; ein teurer Schnitt wechselt die Einstellungsgröße.
# nah=1 heißt totale (das ganze Gerät mit Kante), nah>1,15 heißt: der Schirm
# füllt das Bild und läuft über die Ränder — dann sieht man die Schrift der
# App wirklich, statt sie zu erahnen. 'mitte' sagt, welcher Punkt des Geräts
# (0…1 in Breite und Höhe) dabei in die Bildmitte rückt.
EINSTELLUNGEN = [
    # Name        Tafel          von    bis   Dauer  nah   mitte
    ('heute',    'v-heute',       8.2,  13.4,  3.8,  1.00, (.50, .45)),
    ('notiz',    'v-notiz',      18.6,  24.6,  4.2,  1.22, (.50, .46)),
    ('karten',   'v-karten',     26.8,  29.7,  2.4,  1.00, (.50, .45)),
    ('lernen',   'v-lernen',     31.8,  36.6,  3.8,  1.20, (.46, .45)),
    ('canvas',   'v-canvas',     38.6,  46.6,  4.8,  1.00, (.50, .48)),
    ('biblio',   'v-biblio',     53.0,  58.9,  3.8,  1.00, (.50, .48)),
    ('aufgaben', 'v-aufgaben',   59.8,  67.7,  4.6,  1.00, (.50, .46)),
    ('journal',  'v-journal',    68.4,  73.9,  3.6,  1.14, (.52, .45)),
]
VOR, MITTE, NACH = 2.6, 1.6, 3.2          # Auftakt · Atempause · Schluss


# ══════════════════════════════════════════════════════════════════════════
# DER RAUM
# ══════════════════════════════════════════════════════════════════════════

_RAUM = None

def raum():
    """Das Studio, einmal gerechnet: eine Lichtkuppel oben links, ein tiefer
       Abfall nach unten rechts, und die Papierebene als Struktur darin.

       Warum nicht einfach eine dunkle Fläche: eine gleichmäßige Fläche hat
       keine Richtung. Sobald Licht eine Richtung hat, hat das Gerät darin
       eine Lage — und erst dann steht es irgendwo, statt zu schweben."""
    global _RAUM
    if _RAUM is not None:
        return _RAUM

    grund = Image.new('RGB', (W, H), (9, 10, 12))
    d = ImageDraw.Draw(grund)

    # Die Kuppel: ein sehr großer, sehr weicher Kreis oben links.
    licht = Image.new('L', (W // 4, H // 4), 0)
    ImageDraw.Draw(licht).ellipse([-W // 16, -H // 14, W // 4 + W // 10, H // 6],
                                  fill=255)
    licht = licht.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(190))
    grund = ImageChops.add(grund, Image.merge('RGB', (
        licht.point(lambda v: int(v * .105)),
        licht.point(lambda v: int(v * .116)),
        licht.point(lambda v: int(v * .142)))))

    # Der Boden: ein flacher, hellerer Streifen unter der Standlinie.
    boden = Image.new('L', (W, H), 0)
    db = ImageDraw.Draw(boden)
    for y in range(int(H * .60), H):
        t = (y - H * .60) / (H * .40)
        db.line([(0, y), (W, y)], fill=int(26 * (1 - abs(t - .32) * 1.5) ** 2))
    boden = boden.filter(ImageFilter.GaussianBlur(80))
    grund = ImageChops.add(grund, Image.merge('RGB', (boden, boden,
                                                      boden.point(lambda v: int(v * 1.14)))))

    # Die Papierebene als Struktur: stark weichgezeichnet, sehr dunkel
    # gerechnet. Man sieht sie nicht, man merkt sie.
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
    """Der Raum, plus eine sehr langsame Wanderung des Lichts. Die Bewegung
       ist kaum zu sehen und trotzdem der Unterschied zwischen einem Foto
       und einer Aufnahme."""
    b = raum().copy()
    t = nr / max(1, gesamt)
    dx = int(math.sin(t * math.pi * .7) * 26)
    dy = int(math.cos(t * math.pi * .5) * 14)
    return ImageChops.offset(b, dx, dy)


# ══════════════════════════════════════════════════════════════════════════
# DAS GERÄT
# ══════════════════════════════════════════════════════════════════════════

def zeile(grund, name, alpha):
    """Die Bildunterschrift, mit ihrem Schleier.

       Nicht S.tafel(..., unten=True) — das verschiebt die Tafel mit
       ImageChops.offset um ein Viertel der Bildhöhe, und offset UMLÄUFT den
       Rand: die Zeile stand dadurch nicht unter dem Gerät, sondern oben im
       Bild, wo sie wieder herauskam. Die Tafeln dieses Films sind bereits an
       ihrer Stelle gesetzt (reel-tafeln.js), also wird nur noch der Schleier
       daruntergelegt und beides eingeblendet."""
    if name not in S.TAFELN or alpha <= 0.004:
        return grund
    sch = S.schleier()
    sa = sch.split()[3].point(lambda v: int(v * alpha))
    sch = sch.copy(); sch.putalpha(sa)
    grund = Image.alpha_composite(grund, sch)
    t = S.TAFELN[name]
    ta = t.split()[3].point(lambda v: int(v * alpha))
    t = t.copy(); t.putalpha(ta)
    return Image.alpha_composite(grund, t)


def aufnahmebild(sekunde):
    """Ein Einzelbild des Mitschnitts."""
    n = int(round(sekunde * FPS)) + 1
    p = AUFN + '%05d.jpg' % max(1, n)
    if not os.path.exists(p):
        dateien = sorted(os.listdir(AUFN))
        p = AUFN + dateien[min(max(0, n - 1), len(dateien) - 1)]
    return Image.open(p).convert('RGBA')


_GLANZ = {}

def glanz(w, h):
    """Ein Streiflicht über dem Glas: schmal, sehr schräg, sehr schwach.
       Es ist der eine Handgriff, der aus einem eingesetzten Screenshot ein
       Gerät mit einer Scheibe macht."""
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
    """Das iPad liegt quer. Rahmen, Radius, Kante, Streiflicht.

       Der Rahmen ist nicht Zierat: ein Schirm ohne Kante hat keine Größe.
       Erst der Rahmen sagt dem Auge, wie groß das Ding ist, das da liegt."""
    q = schirm.height / schirm.width
    sw = int(breite); sh = int(sw * q)
    s = schirm.resize((sw, sh), Image.LANCZOS)

    # das Streiflicht auf dem Bild selbst, additiv und sehr schwach
    gl = glanz(sw, sh)
    s = ImageChops.add(s, Image.merge('RGBA', (gl, gl, gl, Image.new('L', (sw, sh), 0))))

    rand = max(4, int(sw * 0.0115))          # Gehäusekante
    r = int(sw * 0.030)                      # Eckenradius des Schirms
    gw, gh = sw + rand * 2, sh + rand * 2
    g = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    # Gehäuse
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand, fill=(24, 25, 29, 255))
    # obere Lichtkante — Aluminium fängt das Licht von oben
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand,
                        outline=(120, 126, 138, 255), width=max(1, rand // 3))
    d.arc([1, 1, gw - 2, gh - 2], 190, 350, fill=(178, 184, 196, 255),
          width=max(1, rand // 3))
    m = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=r, fill=255)
    g.paste(s, (rand, rand), m)

    if abs(neigung) > 0.001:
        g = g.rotate(neigung, resample=Image.BICUBIC, expand=True)
    return g


def spiegelung(g, hoehe=0.20, staerke=26):
    """Eine kurze, weiche Spiegelung unter dem Gerät. Sie kostet zwei
       Handgriffe und macht aus „Bild auf Fläche" ein „Ding auf Tisch"."""
    h = int(g.height * hoehe)
    sp = g.crop((0, g.height - h, g.width, g.height)).transpose(Image.FLIP_TOP_BOTTOM)
    verlauf = Image.new('L', (1, h), 0)
    dv = ImageDraw.Draw(verlauf)
    for y in range(h):
        dv.point((0, y), fill=int(staerke * (1 - y / h) ** 2.1))
    verlauf = verlauf.resize((sp.width, h), Image.BILINEAR)
    a = ImageChops.multiply(sp.split()[3], verlauf.point(lambda v: int(v * 255 / max(1, staerke))))
    a = a.point(lambda v: int(v * staerke / 255))
    sp.putalpha(a)
    return sp.filter(ImageFilter.GaussianBlur(5.5))


# ══════════════════════════════════════════════════════════════════════════
# DIE EINSTELLUNGEN
# ══════════════════════════════════════════════════════════════════════════

def A_auftakt(i, n, nr, gesamt):
    """0 – 2,6 s · Ein dunkler Raum, das Zeichen, ein Satz. Ein Reel hat
       keine Zeit für ein Rätsel — wer spricht, gehört ins erste Bild."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)
    # das Licht atmet auf
    auf = S.raus(min(1.0, t / .45))
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H),
                                         (int(150 + 105 * auf),) * 3 + (255,)))
    m = S.TAFELN.get('v-marke-nackt')
    if m is not None:
        a = min(1.0, S.raus(t / .32)) * (1.0 if t < .80 else max(0.0, 1 - (t - .80) / .20))
        mm = ImageChops.offset(m, 0, -int(H * .085))
        mm = mm.resize((W, H))
        al = mm.split()[3].point(lambda v: int(v * a))
        mm = mm.copy(); mm.putalpha(al)
        b = Image.alpha_composite(b, mm)
    z = S.TAFELN.get('v-auftakt')
    if z is not None:
        a = min(1.0, S.raus(max(0.0, (t - .24) / .30))) * (1.0 if t < .82 else max(0.0, 1 - (t - .82) / .18))
        zz = ImageChops.offset(z, 0, int(H * .085))
        al = zz.split()[3].point(lambda v: int(v * a))
        zz = zz.copy(); zz.putalpha(al)
        b = Image.alpha_composite(b, zz)
    return b


def B_sitzung(i, n, nr, gesamt, name, tafel, von, bis, nah=1.0, mitte=(.5, .45)):
    """Eine Einstellung aus dem Mitschnitt: Gerät, Schatten, Spiegelung,
       Zeile. Die Fahrt läuft über die ganze Einstellung durch."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)

    sek = von + (bis - von) * t
    schirm = aufnahmebild(sek)

    # Die Fahrt: 1,000 → 1,035 über die Einstellung, weich beschleunigt.
    zoom = 0.9280 * nah * (1.0 + 0.035 * S.sanft(t))
    neig = (0.30 if nah < 1.15 else 0.12) * math.sin((t - .5) * 1.2)
    g = geraet(schirm, int(W * zoom), neig)

    if nah < 1.15:
        # Totale: das ganze Gerät steht im Bild, mit Kante, Schatten und
        # der Andeutung eines Bodens darunter.
        x = (W - g.width) // 2
        y = int(H * .437) - g.height // 2 + int(6 * math.sin(t * math.pi))
        b.alpha_composite(spiegelung(g), (x, y + g.height + 6))
        b.alpha_composite(S.schatten(g, 52, 205), (x, y + 26))
        b.alpha_composite(g, (x, y))
    else:
        # Nah: der Schirm läuft über die Ränder. Kante und Spiegelung wären
        # ohnehin außerhalb — sie wegzulassen spart nicht nur Rechenzeit,
        # es verhindert auch eine halbe Gehäusekante am Bildrand.
        x = int(W * .5 - g.width * mitte[0])
        y = int(H * .437 - g.height * mitte[1]) + int(5 * math.sin(t * math.pi))
        b.alpha_composite(S.schatten(g, 60, 150), (x, y + 20))
        b.alpha_composite(g, (x, y))

    if tafel in S.TAFELN:
        # eine Viertelsekunde nach dem Schnitt herein, vor dem nächsten hinaus
        ein = 0.25 * FPS / n
        aus = 0.30 * FPS / n
        a = min(1.0, S.raus(max(0.0, (t - ein) / .16))) * \
            (1.0 if t < 1 - aus else max(0.0, (1 - t) / aus))
        b = zeile(b, tafel, a)
    return b


def C_mitte(i, n, nr, gesamt):
    """Eine Atempause in der Mitte. Zwei Sekunden ohne Produkt sind kein
       Verlust — sie sind der Grund, warum das Folgende wieder auffällt."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)
    z = S.TAFELN.get('v-mitte')
    if z is not None:
        a = min(1.0, S.raus(t / .28)) * (1.0 if t < .74 else max(0.0, 1 - (t - .74) / .26))
        al = z.split()[3].point(lambda v: int(v * a))
        zz = z.copy(); zz.putalpha(al)
        b = Image.alpha_composite(b, zz)
    return b


def D_schluss(i, n, nr, gesamt):
    """Zeichen, Module, Zeitpunkt — und ein Abgang ins Schwarze."""
    t = i / (n - 1)
    b = hintergrund(nr, gesamt)
    a = min(1.0, S.raus(t / .28))
    z = S.TAFELN.get('v-marke')
    if z is not None:
        al = z.split()[3].point(lambda v: int(v * a))
        zz = z.copy(); zz.putalpha(al)
        b = Image.alpha_composite(b, zz)
    if t > .84:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H),
                                               (0, 0, 0, int(255 * (t - .84) / .16))))
    return b


# ══════════════════════════════════════════════════════════════════════════
# BAUEN
# ══════════════════════════════════════════════════════════════════════════

def plan():
    p = [('auftakt', A_auftakt, VOR, None)]
    for k, (name, tafel, von, bis, dauer, nah, mitte) in enumerate(EINSTELLUNGEN):
        p.append((name, None, dauer, (name, tafel, von, bis, nah, mitte)))
        if k == 3:
            p.append(('mitte', C_mitte, MITTE, None))
    p.append(('schluss', D_schluss, NACH, None))
    return p


def tafeln_laden():
    """S.vorbereiten() kennt nur t-* (Story) und r-* (altes Reel). Die
       Tafeln dieses Films heißen v-* und fielen beim ersten Bauen still
       durch — der Film lief mit, nur ohne ein einziges Wort darin. Also
       lädt das Reel seine Schrift selbst und zählt sie laut."""
    import glob
    n = 0
    for f in sorted(glob.glob(S.QUELLE + 'v-*.png')):
        S.TAFELN[os.path.basename(f)[:-4]] = S.lade(f, (W, H))
        n += 1
    if not n:
        raise SystemExit('Keine v-*.png in ' + S.QUELLE +
                         ' — erst tools/story/reel-tafeln.js laufen lassen.')
    return n


def bauen(nur=None):
    S.vorbereiten()
    print('  Tafeln:', tafeln_laden())
    os.makedirs(BILDER, exist_ok=True)
    if not nur:
        # Nur beim vollen Bau räumen. Wird eine einzelne Einstellung
        # nachgezogen, müssen die übrigen Bilder liegen bleiben — sonst ist
        # der Nachschnitt ein Neubau.
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
