#!/usr/bin/env python3
"""
schnitt.py — die Instagram-Story für Velum, Bild für Bild gebaut.

DIE MACHART, und warum sie so ist:

  Der Auftrag war „nicht KI-mäßig, sondern real". Es gibt genau drei Stellen,
  an denen erzeugtes Video auffliegt: Schrift, Bedienoberflächen und Hände.
  Also kommt von Runway keine davon. Runway liefert nur, was fotografiert
  aussieht und sich nicht merken lässt — Schnee, Eisblumen, Licht auf Papier.

  Alles, was der Betrachter LIEST, ist echt:
    · die App-Schirme sind Bildpunkte aus dem laufenden Prototyp,
      gerendert in dreifacher Auflösung (story-screens.js)
    · die Schrift ist im Browser gesetzt, mit dem Stylesheet der App
      (story-tafeln.js)
    · die Wortmarke ist die gelieferte Datei, nicht nachgesetzt

  Und die Bewegung führe ich selbst: langsame Fahrten, echte Bewegungsunschärfe,
  eine Blende. Kein Modell darf die Oberfläche anfassen, sonst wird aus
  „8 heute fällig" ein Buchstabensalat, und genau daran erkennt man es.

  Zusammengehalten wird beides von zwei Kunstgriffen, die im echten Schnitt
  dieselbe Aufgabe haben: EIN Korn über alles und EINE Farbstimmung über
  alles. Erst dadurch werden erzeugte Ebene und echter Schirm ein Bild.
"""
import os, subprocess, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

W, H, FPS = 1080, 1920, 30
HEIM   = '/home/user/story'
QUELLE = HEIM + '/quellen/'
PLATTE = HEIM + '/platten/'
BILDER = HEIM + '/bilder/'
FFMPEG = None

TINTE  = (14, 15, 17)
KUPFER = (216, 155, 99)
PAPIER = (242, 243, 245)

random.seed(11)


def ffmpeg():
    global FFMPEG
    if FFMPEG is None:
        import imageio_ffmpeg
        FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    return FFMPEG


# ── Werkzeug ──────────────────────────────────────────────────────────────

def lade(pfad, groesse=None):
    b = Image.open(pfad).convert('RGBA')
    return b.resize(groesse, Image.LANCZOS) if groesse else b


def fuellen(b, w=W, h=H):
    """Auf Format bringen, ohne zu verzerren — beschneiden statt stauchen."""
    q = b.width / b.height
    z = w / h
    if q > z:
        neu = (int(h * q), h)
    else:
        neu = (w, int(w / q))
    b = b.resize(neu, Image.LANCZOS)
    return b.crop(((b.width - w) // 2, (b.height - h) // 2,
                   (b.width - w) // 2 + w, (b.height - h) // 2 + h))


def sanft(t):
    """easeInOutCubic — eine Fahrt, die anfährt und ausläuft, nie linear."""
    return 4 * t ** 3 if t < .5 else 1 - pow(-2 * t + 2, 3) / 2


def raus(t):
    return 1 - pow(1 - t, 3)


def plattenbild(name, i, gesamt):
    """Ein Einzelbild einer Atmosphären-Ebene.

       Liegen Bilder unter platten/<name>/, werden sie benutzt — dort landen
       die Runway-Ebenen, sobald sie jemand hereinreicht. Sonst wird die
       Ebene hier gerechnet.

       Die gerechnete Fassung ist mit Absicht ABSTRAKT: Licht und unscharfe
       Partikel, keine nachgebauten Gegenstände. Ein nachgebauter Schreibtisch
       sieht immer nach Rechner aus; ein unscharfer Lichtpunkt sieht nach
       Objektiv aus, weil er im Grunde nichts anderes IST als ein Objektiv,
       das nicht fokussiert. Deshalb ist das Bokeh der Weg und die Kulisse
       nicht."""
    ordner = PLATTE + name
    if os.path.isdir(ordner):
        dateien = sorted(f for f in os.listdir(ordner) if f.endswith(('.jpg', '.png')))
        if dateien:
            k = dateien[min(int(i / max(1, gesamt - 1) * (len(dateien) - 1)), len(dateien) - 1)]
            return fuellen(lade(ordner + '/' + k))
    return gerechnet(name, i, gesamt)


# ── Gerechnete Atmosphäre ─────────────────────────────────────────────────

FLOCKEN = None

def flocken_anlegen():
    """Drei Tiefenlagen. Was nah ist, ist groß, blass und sehr unscharf und
       fällt schnell; was fern ist, ist klein, schärfer und langsam. Genau
       diese Kopplung macht aus Punkten Bokeh — eine Kamera kann gar nicht
       anders."""
    lagen = []
    for tiefe, (n, r0, r1, weich, tempo, hell) in enumerate([
            (46, 2.0, 4.5,  1.2, 0.055, 150),     # fern
            (26, 6.0, 13.0, 5.0, 0.100, 120),     # mitte
            (11, 20.0, 46.0, 17.0, 0.165, 62)]):  # nah
        p = []
        for _ in range(n):
            p.append(dict(x=random.uniform(-.08, 1.08), y=random.uniform(-.15, 1.15),
                          r=random.uniform(r0, r1), v=tempo * random.uniform(.72, 1.3),
                          s=random.uniform(.5, 1.6), ph=random.uniform(0, 6.28),
                          a=int(hell * random.uniform(.55, 1.0))))
        lagen.append(dict(teilchen=p, weich=weich))
    return lagen


def lichtschacht(b, mitte=.5, breite=.20, staerke=54):
    """Ein Streiflicht, wie es durch ein hohes Fenster fällt. Es ist der
       Grund, warum man die Flocken überhaupt sieht."""
    l = Image.new('L', (W, 1), 0)
    d = ImageDraw.Draw(l)
    for x in range(W):
        t = abs(x / W - mitte) / breite
        d.point((x, 0), fill=int(staerke * math.exp(-t * t * 2.1)))
    l = l.resize((W, H), Image.BILINEAR)
    # oben heller als unten — Licht verliert sich
    v = Image.linear_gradient('L').rotate(180).resize((W, H), Image.BILINEAR)
    l = ImageChops.multiply(l, v.point(lambda x: 120 + x * 135 // 255))
    return ImageChops.add(b, Image.merge('RGBA', (l.point(lambda x: int(x * .82)),
                                                  l.point(lambda x: int(x * .92)), l,
                                                  Image.new('L', (W, H), 0))))


def gerechnet(name, i, gesamt):
    global FLOCKEN
    t = i / max(1, gesamt - 1)

    if name == 'papier':
        p = '/home/user/Mocktest/mockups/assets/bilder/cover/buetten-elfenbein-560.jpg'
        b = fuellen(lade(p)) if os.path.exists(p) else Image.new('RGBA', (W, H), (60, 62, 68, 255))
        b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (150, 152, 158, 255)))
        return lichtschacht(b, mitte=.30 + .28 * t, breite=.34, staerke=64)

    if name == 'eis':
        b = Image.new('RGBA', (W, H), (16, 18, 22, 255))
        return lichtschacht(b, mitte=.5, breite=.5, staerke=40)

    # Schnee
    if FLOCKEN is None:
        FLOCKEN = flocken_anlegen()
    b = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    b = lichtschacht(b)
    for lage in FLOCKEN:
        e = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(e)
        for f in lage['teilchen']:
            y = ((f['y'] + f['v'] * t) % 1.24) * H - .12 * H
            x = (f['x'] + .012 * math.sin(f['ph'] + t * 3.1 * f['s'])) * W
            d.ellipse([x - f['r'], y - f['r'], x + f['r'], y + f['r']], fill=f['a'])
        e = e.filter(ImageFilter.GaussianBlur(lage['weich']))
        b = ImageChops.add(b, Image.merge('RGBA', (
            e.point(lambda v: int(v * .88)), e.point(lambda v: int(v * .94)), e,
            Image.new('L', (W, H), 0))))
    return b


# ── Das Gerät ─────────────────────────────────────────────────────────────

def geraet(schirm, hoehe):
    """Ein Telefon um den echten Schirm. Kein glänzendes 3-D-Modell: ein
       dunkler Rahmen mit einer feinen Lichtkante, wie ihn eine Kamera sähe."""
    q = schirm.width / schirm.height
    sh = int(hoehe)
    sw = int(sh * q)
    s = schirm.resize((sw, sh), Image.LANCZOS)

    rand = max(3, int(sh * 0.009))
    r = int(sh * 0.058)
    gw, gh = sw + rand * 2, sh + rand * 2
    g = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand, fill=(28, 30, 34, 255))
    d.rounded_rectangle([0, 0, gw - 1, gh - 1], radius=r + rand,
                        outline=(96, 102, 112, 255), width=max(1, rand // 3))

    maske = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(maske).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=r, fill=255)
    g.paste(s, (rand, rand), maske)
    return g


def schatten(g, weich=42, tiefe=200):
    a = g.split()[3].filter(ImageFilter.GaussianBlur(weich))
    s = Image.new('RGBA', g.size, (0, 0, 0, 0))
    s.putalpha(a.point(lambda v: int(v * tiefe / 255)))
    return s


# ── Der Faden ─────────────────────────────────────────────────────────────

def faden(bild, x, y0, y1, breite=3, farbe=(150, 156, 168), alpha=255):
    """Das Leitmotiv: ein Strich, keine Fläche. Er wird gezogen, nicht
       eingeblendet — deshalb wächst y1 über die Zeit."""
    if y1 <= y0:
        return bild
    e = Image.new('RGBA', bild.size, (0, 0, 0, 0))
    ImageDraw.Draw(e).line([(x, y0), (x, y1)], fill=farbe + (alpha,), width=breite)
    return Image.alpha_composite(bild, e)


def punkt(bild, x, y, r, farbe, alpha=255, schein=0):
    e = Image.new('RGBA', bild.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(e)
    if schein:
        d.ellipse([x - r * schein, y - r * schein, x + r * schein, y + r * schein],
                  fill=farbe + (int(alpha * .16),))
        e = e.filter(ImageFilter.GaussianBlur(r * schein * .5))
        d = ImageDraw.Draw(e)
    d.ellipse([x - r, y - r, x + r, y + r], fill=farbe + (alpha,))
    return Image.alpha_composite(bild, e)


# ── Die Einstellungen ─────────────────────────────────────────────────────

def E1_schnee(i, n):
    """0,0–3,0 s · Schnee. Ein Kupferpunkt glimmt auf und zieht einen Faden
       nach unten. Das ist das Leitmotiv, bevor irgendetwas erklärt wird."""
    t = i / (n - 1)
    b = plattenbild('schnee', i, n)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (172, 178, 190, 255)))

    mx, my = W // 2, int(H * .40)
    if t > .18:
        a = min(1.0, (t - .18) / .18)
        b = punkt(b, mx, my, 9, KUPFER, int(255 * a), schein=7)
    if t > .34:
        z = raus(min(1.0, (t - .34) / .5))
        b = faden(b, mx, my, my + int(z * H * .30), 3, (150, 156, 168), 210)
    if t > .80:
        a = min(1.0, (t - .80) / .2)
        b = punkt(b, mx, my + int(H * .30), 7, (150, 156, 168), int(210 * a))
    return b


def E2_auftritt(i, n):
    """3,0–7,0 s · Das Telefon fährt aus dem Dunkel herauf. Der Schnee bleibt
       davor liegen — dieselbe Ebene, jetzt additiv, damit die Flocken vor dem
       Glas sind und nicht dahinter."""
    t = i / (n - 1)
    s = sanft(min(1.0, t / .62))

    b = Image.new('RGBA', (W, H), TINTE + (255,))
    dunst = plattenbild('schnee', i, n)
    dunst = ImageChops.multiply(dunst, Image.new('RGBA', (W, H), (52, 56, 64, 255)))
    b = ImageChops.add(b, dunst)

    # Instagram legt oben ~14 % und unten ~20 % eigene Bedienung über die
    # Story. Das Gerät bleibt darum in der Mitte und endet über dem unteren
    # Fünftel — dort steht die Zeile.
    hoehe = int(H * (.665 + .025 * t))
    g = geraet(SCHIRME['heute'], hoehe)
    x = (W - g.width) // 2
    y = int(H * (1.02 - .90 * s))
    b.alpha_composite(schatten(g), (x, y + 26))
    b.alpha_composite(g, (x, y))

    vorn = plattenbild('schnee', (i + 40) % n, n)
    vorn = ImageChops.multiply(vorn, Image.new('RGBA', (W, H), (78, 84, 96, 255)))
    b = ImageChops.add(b, vorn)

    return b


def E1b_satz(i, n):
    """2,5–4,5 s · Die Behauptung, allein über dem Schnee. Sie stand vorher
       über dem Telefon und lag damit mitten in der Aufgabenliste — unlesbar.
       Schrift und Gerät müssen sich das Bild nicht teilen; ein Teaser darf
       erst behaupten und dann beweisen."""
    t = i / (n - 1)
    b = plattenbild('schnee', i, n)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (150, 156, 168, 255)))
    # der Faden aus der ersten Einstellung steht weiter, ganz schwach
    mx, my = W // 2, int(H * .40)
    aus = max(0.0, 1.0 - t / .45)
    if aus > 0:
        b = faden(b, mx, my, my + int(H * .30), 3, (150, 156, 168), int(210 * aus))
        b = punkt(b, mx, my, 9, KUPFER, int(255 * aus), schein=7)
    a = min(1.0, raus(t / .30)) * (1.0 if t < .82 else max(0.0, 1 - (t - .82) / .18))
    return tafel(b, 't-faden-en' if SPRACHE == 'en' else 't-faden', a)


def E3_kette(i, n):
    """7,0–10,0 s · Die Fahrt auf die Kette. Kein Schnitt, kein Effekt: nur
       langsam näher. Was hier steht, ist der ganze Anspruch der App —
       Notiz wurde zu Karten, Karten sind heute fällig."""
    t = i / (n - 1)
    s = sanft(t)
    schirm = SCHIRME['heute']
    sw, sh = schirm.size

    # Ausschnitt auf die Ketten-Karte, langsam enger
    # Gemessen an der Ketten-Karte im Schirmbild: sie beginnt bei 17,4 % und
    # endet bei 44,8 % der Höhe. Vorher lief der Ausschnitt oben durch die
    # Datumszeile — ein Schnitt mitten durch eine Zeile sieht nach Versehen aus.
    y0 = int(sh * (.166 + .008 * s))
    y1 = int(sh * (.462 - .012 * s))
    x0 = int(sw * (.030 + .008 * s))
    x1 = int(sw * (.970 - .008 * s))
    aus = schirm.crop((x0, y0, x1, y1))
    ziel_h = int(W * aus.height / aus.width)
    aus = aus.resize((W, ziel_h), Image.LANCZOS)

    b = Image.new('RGBA', (W, H), TINTE + (255,))
    b.alpha_composite(aus, (0, (H - ziel_h) // 2))

    dunst = plattenbild('schnee', i, n)
    dunst = ImageChops.multiply(dunst, Image.new('RGBA', (W, H), (40, 44, 50, 255)))
    b = ImageChops.add(b, dunst)
    return b


def E4_lernen(i, n):
    """10,0–12,5 s · Eisblumen wischen über das Bild, dahinter steht die
       Lernkarte mit ihrem Herkunftsfaden. Der Übergang ist eine Blende, kein
       Effekt aus der Trickkiste."""
    t = i / (n - 1)
    b = Image.new('RGBA', (W, H), TINTE + (255,))

    hoehe = int(H * .70)
    g = geraet(SCHIRME['lernsitzung'], hoehe)
    x = (W - g.width) // 2
    y = (H - g.height) // 2 - int(H * .035) + int(18 * (1 - sanft(min(1, t / .5))))
    b.alpha_composite(schatten(g), (x, y + 26))
    b.alpha_composite(g, (x, y))

    eis = plattenbild('eis', i, n)
    a = 1.0 - min(1.0, max(0.0, (t - .05) / .45))
    eis = ImageChops.multiply(eis, Image.new('RGBA', (W, H), tuple([int(255 * a)] * 3) + (255,)))
    b = ImageChops.add(b, eis)
    return b


def E5_marke(i, n):
    """12,5–15,0 s · Papier, Licht, Zeichen. Die Wortmarke ist die gelieferte
       Datei — sie wird eingeblendet, nicht gesetzt."""
    t = i / (n - 1)
    b = plattenbild('papier', i, n)
    b = ImageChops.multiply(b, Image.new('RGBA', (W, H), (96, 100, 110, 255)))
    dunkel = Image.new('RGBA', (W, H), TINTE + (int(255 * .34),))
    b = Image.alpha_composite(b, dunkel)

    a = min(1.0, raus(t / .38))
    b = tafel(b, 't-marke', a)
    if t > .80:                                  # ausblenden auf Schwarz
        s = (t - .80) / .20
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H), (0, 0, 0, int(255 * s))))
    return b


SCHLEIER = None

def schleier():
    """Ein weicher Verlauf am unteren Rand. Schrift auf einem Schirmbild ist
       unlesbar — im ersten Schnitt lag „Jede Karte weiß" mitten in der
       Aufgabenliste. Ein Verlauf ist die Lösung, die jeder Filmtitel benutzt:
       er nimmt dem Grund das Detail, ohne ihn zuzudecken."""
    global SCHLEIER
    if SCHLEIER is None:
        g = Image.new('L', (1, H), 0)
        d = ImageDraw.Draw(g)
        for y in range(H):
            t = max(0.0, (y / H - .52) / .48)
            d.point((0, y), fill=int(215 * (t ** 1.5)))
        SCHLEIER = Image.merge('RGBA', tuple([Image.new('L', (W, H), 0)] * 3) +
                               (g.resize((W, H), Image.BILINEAR),))
    return SCHLEIER


def tafel(grund, name, alpha, unten=False):
    t = TAFELN[name]
    if unten:
        t = ImageChops.offset(t, 0, int(H * .255))
        s = schleier()
        if alpha < 1:
            sa = s.split()[3].point(lambda v: int(v * alpha))
            s = s.copy(); s.putalpha(sa)
        grund = Image.alpha_composite(grund, s)
    if alpha < 1:
        a = t.split()[3].point(lambda v: int(v * alpha))
        t = t.copy(); t.putalpha(a)
    return Image.alpha_composite(grund, t)


# ── Farbe und Korn ────────────────────────────────────────────────────────

KORN = None

def veredeln(b, i):
    """Eine Stimmung und ein Korn über alles. Das ist der Kunstgriff, der
       erzeugte Ebene und echten Schirm zu einem Bild macht — im echten
       Schnitt tut die Farbkorrektur nichts anderes."""
    global KORN
    r, g, bl, a = b.split()
    # kühl: Blau leicht an, Rot leicht zurück — Winterlicht, nicht Blaustich
    r = r.point(lambda v: min(255, int(v * 0.985)))
    bl = bl.point(lambda v: min(255, int(v * 1.035 + 3)))
    # Schwarz anheben, wie es Film tut; nichts säuft ab
    heben = lambda v: int(9 + v * (255 - 9) / 255)
    r, g, bl = r.point(heben), g.point(heben), bl.point(heben)
    b = Image.merge('RGBA', (r, g, bl, a))

    if KORN is None:
        KORN = []
        for k in range(12):
            n = Image.effect_noise((W // 2, H // 2), 13).resize((W, H), Image.BILINEAR)
            KORN.append(n.filter(ImageFilter.GaussianBlur(.4)))
    n = KORN[i % len(KORN)]
    rausch = Image.merge('RGBA', (n, n, n, Image.new('L', (W, H), 255)))
    b = ImageChops.add(ImageChops.subtract(b, Image.new('RGBA', (W, H), (7, 7, 7, 0))),
                       ImageChops.multiply(rausch, Image.new('RGBA', (W, H), (14, 14, 14, 255))))

    # Randabdunklung, sehr zurückhaltend
    global VIGNETTE
    b = ImageChops.multiply(b, VIGNETTE)
    return b


def vignette():
    v = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(v)
    d.ellipse([-W * .34, -H * .16, W * 1.34, H * 1.16], fill=255)
    v = v.filter(ImageFilter.GaussianBlur(190)).point(lambda x: int(190 + x * 65 / 255))
    return Image.merge('RGBA', (v, v, v, Image.new('L', (W, H), 255)))


# ── Bauplan ───────────────────────────────────────────────────────────────

EINSTELLUNGEN = [
    ('schnee',   E1_schnee,   2.5),   # Punkt und Faden — das Leitmotiv
    ('satz',     E1b_satz,    2.0),   # die Behauptung
    ('auftritt', E2_auftritt, 3.0),   # der Beweis kommt herauf
    ('kette',    E3_kette,    3.0),   # Notiz wurde zu Karten
    ('lernen',   E4_lernen,   2.0),   # und die Karte weiß es noch
    ('marke',    E5_marke,    2.5),   # Zeichen und Zeitpunkt
]

SCHIRME, TAFELN, VIGNETTE = {}, {}, None
SPRACHE = 'de'


def vorbereiten():
    global VIGNETTE
    for n in ('heute', 'lernsitzung', 'notiz', 'graph', 'journal'):
        p = QUELLE + n + '.png'
        if os.path.exists(p):
            SCHIRME[n] = lade(p)
    for n in ('t-faden', 't-faden-en', 't-winter', 't-marke', 't-marke-nackt'):
        p = QUELLE + n + '.png'
        if os.path.exists(p):
            TAFELN[n] = lade(p, (W, H))
    VIGNETTE = vignette()


def bauen(nur=None, probe=None):
    vorbereiten()
    os.makedirs(BILDER, exist_ok=True)
    for f in os.listdir(BILDER):
        os.remove(BILDER + f)
    nr = 0
    for name, fn, dauer in EINSTELLUNGEN:
        n = int(dauer * FPS)
        if nur and name not in nur:
            nr += n
            continue
        for i in range(n):
            b = veredeln(fn(i, n), nr)
            b.convert('RGB').save('%s%05d.jpg' % (BILDER, nr), quality=95)
            nr += 1
        print('  %-9s %3d Bilder' % (name, n), flush=True)
    return nr


def kodieren(ziel=HEIM + '/velum-story.mp4'):
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(FPS),
                    '-i', BILDER + '%05d.jpg',
                    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    '-vf', 'format=yuv420p', ziel], check=True)
    return ziel


if __name__ == '__main__':
    import sys
    SPRACHE = sys.argv[1] if len(sys.argv) > 1 else 'de'
    ziel = HEIM + ('/velum-story-en.mp4' if SPRACHE == 'en' else '/velum-story.mp4')
    n = bauen()
    print('Bilder gesamt:', n, '=', round(n / FPS, 1), 's ·', SPRACHE)
    print('Datei:', kodieren(ziel))
