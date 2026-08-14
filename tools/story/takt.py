#!/usr/bin/env python3
"""takt.py — der Taktschnitt. ~30 s, 27 Schnitte, alles auf dem Raster.

Die Diagnose nach zwei Fassungen und einem GoodNotes-Vergleich: was dem
Film fehlte, war nie das Material — es war das TEMPO. GoodNotes schneidet
20–30 mal in 40 Sekunden, jede Einstellung zeigt genau EINEN Handgriff,
und alles sitzt auf dem Takt. Dieser Schnitt übernimmt die Disziplin:

  · Ein Beat-Raster (0,78 s). Jeder Schnitt fällt auf einen Schlag.
  · Jede Einstellung zeigt EINE Sache: den Haken, die Drehung, den
    Wechsel. Panoramen gibt es drei — Auftakt, Atempause, Schluss.
  · Punch-Ins sind ECHT SCHARF: die stehenden Ausschnitte kommen aus
    3-fach aufgelösten Neuaufnahmen des Prototyps (stills.js), nicht aus
    dem hochskalierten Mitschnitt. Bewegte Fenster (Kartendrehung,
    Canvas-Zoom, Ansichtswechsel) kommen nativ aus dem Mitschnitt.
  · Jeder Schnitt bekommt einen Impuls: 4 % Brennweite, in fünf Bildern
    abgebaut. Das ist der „Hit", der den Takt fühlbar macht.
  · Module heißen im Bild nur noch ein Wort (Chips, federn beim Schnitt
    ein). Sätze gehören den drei großen Karten.
  · Der Ton ist echt: das Tintenblubbern der Tinte-Ebene unter dem
    Auftakt, der Raumton der Staub-Ebene unter dem Rest (beide Ebenen
    sind Runway-Aufnahmen mit nativem Ton). Musik kommt als zweite
    Fassung, sobald das Klavier als Datei vorliegt.

Arbeitsteilung mit Runway (die drei Kino-Shots rendern parallel):
das Modell liefert Licht, Raum und Gerätegewicht mit LEEREM Schirm;
die echte Oberfläche wird hier aufs Glas gerechnet, sobald die Shots
im Container liegen. Bis dahin stehen die eigenen Gerätebilder drin —
vor der Staub-Ebene statt vor dem grauen Rechenraum.
"""
import os, sys, math, glob, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '/home/user/story')
import schnitt as S
import reel as R
import glas as G

W, H, FPS = S.W, S.H, S.FPS
HEIM   = '/home/user/story'
BILDER = HEIM + '/taktbilder/'
STILLS = HEIM + '/stills/'
NAH    = HEIM + '/nah/'

BEAT = 0.78          # Sekunden je Schlag — ruhig genug zum Lesen, schnell genug für Zug

# ══════════════════════════════════════════════════════════════════════════
# DER SCHNITTPLAN
#
# (Art, Beats, Parameter). Arten:
#   tinte    · die Tinten-Ebene, Wortmarke stempelt auf den Schlag
#   karte    · eine große Schriftkarte auf dem Staub
#   flug     · der Einflug (aus reel.py), vor der Staub-Ebene
#   ger      · Gerät vor der Staub-Ebene, Standbild aus stills/
#   voll     · Punch-In, formatfüllend — 'still' (scharf) oder 'nah' (bewegt)
#   kino     · Runway-Material; 'ui' rechnet die echte Oberfläche aufs Glas
#   schluss  · Staub, Wortmarke, THIS WINTER
# ══════════════════════════════════════════════════════════════════════════

EDL = [
    # Auftakt: die Tinte, die Behauptung, Runways Ankunft
    ('tinte',  2.8, {}),
    ('karte',  1.8, dict(tafel='v-auftakt')),
    ('kino',   2.0, dict(clip='a', ab=38)),
    ('kino',   1.6, dict(clip='kran', ab=100, ui='heute', chip='c-today')),

    # Die Kette: der Tap, die Notiz geht auf — echte Bedienung.
    # ab=130: knapp 1 s Panel, Tap ~5,3 s, die Notiz steht am Schluss offen.
    ('voll',   2.0, dict(szene='kette', ab=130, m=(.50, .45), h=.96)),
    ('voll',   1.5, dict(szene='rand', ab=100, m=(.80, .45), h=.60, chip='c-notes')),

    # DER Moment: die Zeile wird live getippt, die Chips springen mit
    ('voll',   3.4, dict(szene='tippen', ab=120, m=(.47, .175), h=.32, chip='c-tasks')),
    # Haken: Klick ~4,3 s, die Zeile verschwindet 5,4–5,8 s nach Done today —
    # 2,0 Beats (4,13–5,70 s) halten beides im Fenster.
    ('voll',   2.0, dict(szene='haken', ab=124, m=(.42, .40), h=.52)),
    # Planer: die Spalten stehen ab Bild 132; Crop auf TODAY+TOMORROW links —
    # mittig gecroppt zeigt der Hochkant-Ausschnitt nur die leersten Spalten.
    ('voll',   1.2, dict(szene='planer', ab=112, m=(.36, .42), h=.96)),
    ('voll',   1.4, dict(szene='brett', ab=125, m=(.50, .45), h=.96)),

    ('karte',  1.6, dict(tafel='v-mitte')),

    # DER zweite Moment: das Blatt zeichnet sich selbst.
    # ab=166: nach dem Szenenwechsel-Blitz (5,1–5,4 s) und nach dem deutschen
    # Neues-Blatt-Tab — reines englisches Wachsen ab „The C…". Die Titelzeile
    # ist 1155 px breit, das Fenster 900: also FÄHRT die Kamera der Hand
    # hinterher, von der Zeile hinunter zum wachsenden Zell-Diagramm.
    ('voll',   3.2, dict(szene='malen', ab=166, m=((.32, .36), (.53, .60)),
                         h=.80, chip='c-canvas')),
    # Zweiter Malen-Schnitt: NICHT die Rad-Zoom-Passage (die schiebt das
    # Blatt nach unten aus dem Bild — 1,2 s leeres Punktraster). Stattdessen
    # die rechte Spalte bei 8,0–9,2 s: die rote Fußnote schreibt sich zu
    # Ende, dann springt die gelbe Q/A-Karte aufs Blatt (8,4→8,5 s).
    ('voll',   1.6, dict(szene='malen', ab=238, m=(.73, .60), h=.72)),

    # Liste: der Grid→List-Klick fällt ~4,5 s — Fenster 3,93–5,03 s.
    ('voll',   1.4, dict(szene='liste', ab=118, m=(.50, .45), h=.96, chip='c-library')),
    ('kino',   1.5, dict(clip='b', ab=104, ui='canvas-hoch')),
    ('voll',   2.2, dict(szene='flip', ab=112, m=(.50, .45), h=.96, chip='c-review')),
    ('voll',   1.6, dict(szene='tagebuch', ab=118, m=(.50, .42), h=.80, chip='c-journal')),
    ('kino',   1.4, dict(clip='kran', ab=66, ui='journal')),

    ('schluss', 3.4, {}),
]



# ══════════════════════════════════════════════════════════════════════════
# QUELLEN
# ══════════════════════════════════════════════════════════════════════════

_STILLS, _NAH = {}, {}
_KINO, _SPUR = {}, {}

def kinobild(clip, i):
    if clip not in _KINO:
        _KINO[clip] = sorted(glob.glob('/home/user/story/kino/' + clip + '/*.jpg'))
    d = _KINO[clip]
    return Image.open(d[min(i, len(d) - 1)]).convert('RGB')


def kinospur(clip):
    if clip not in _SPUR:
        _, gl = G.spur(clip)
        _SPUR[clip] = gl
    return _SPUR[clip]

def still(name):
    if name not in _STILLS:
        if name == 'canvas-hoch':
            # Das Portrait-Glas des Orbit-Shots: Seedance hat das Gerät
            # hochkant gedreht. Das einzige Modul, das hochkant EHRLICH
            # funktioniert, ist das Canvas — eine unendliche Fläche hat
            # kein Querformat. Also ein stehender Ausschnitt des
            # Vorlesungsblatts: Zelle, Beschriftung, Randfragen.
            q = Image.open(STILLS + 'canvas.png').convert('RGB')
            qw, qh = q.size
            _STILLS[name] = q.crop((int(.05 * qw), int(.10 * qh),
                                    int(.50 * qw), int(.99 * qh)))
        else:
            _STILLS[name] = Image.open(STILLS + name + '.png').convert('RGB')
    return _STILLS[name]


def nahbild(name, i):
    if name not in _NAH:
        _NAH[name] = sorted(glob.glob(NAH + name + '-*.jpg'))
    d = _NAH[name]
    return Image.open(d[min(i, len(d) - 1)]).convert('RGB')


_CHOREO = {}

def choreobild(szene, i):
    """Ein Bild aus einer Aufführung (choreo.js): jede Szene ist eine
       eigene Aufnahme, die bei null beginnt — der Schnitt greift bildgenau."""
    if szene not in _CHOREO:
        _CHOREO[szene] = sorted(glob.glob('/home/user/story/choreo/' + szene + '/b-*.jpg'))
    d = _CHOREO[szene]
    return Image.open(d[min(i, len(d) - 1)]).convert('RGB')


# ══════════════════════════════════════════════════════════════════════════
# WERKZEUG
# ══════════════════════════════════════════════════════════════════════════

def schlag(t_frames, staerke=.045, dauer=6):
    """Der Impuls am Schnitt: ein Brennweitenstoß, in wenigen Bildern
       abgebaut. Klein genug, dass man ihn fühlt statt sieht."""
    if t_frames >= dauer:
        return 1.0
    u = t_frames / dauer
    return 1.0 + staerke * (1 - u) ** 2


def punch(quelle, m, h, zoom):
    """Ein Ausschnitt der Oberfläche, formatfüllend in 9:16.
       h ist die Ausschnitthöhe als Anteil der Quellhöhe; die Breite folgt
       aus dem Zielformat. Skaliert wird bevorzugt HERUNTER (Quelle 3×)."""
    qw, qh = quelle.size
    ch = h * qh / zoom
    cw = ch * (W / H)
    cx = min(max(m[0] * qw, cw / 2), qw - cw / 2)
    cy = min(max(m[1] * qh, ch / 2), qh - ch / 2)
    box = (int(cx - cw / 2), int(cy - ch / 2), int(cx + cw / 2), int(cy + ch / 2))
    return quelle.crop(box).resize((W, H), Image.LANCZOS).convert('RGBA')


_CHIPMASS = {}

def chip_zeigen(b, name, i):
    """Der Chip federt ein: Überschwingen in den ersten fünf Bildern, dann
       Stand. Skaliert wird um die eigene Mitte, nicht um die Bildmitte."""
    if name not in S.TAFELN:
        return b
    t = S.TAFELN[name]
    if name not in _CHIPMASS:
        _CHIPMASS[name] = t.getchannel('A').getbbox()
    bb = _CHIPMASS[name]
    if bb is None:
        return b
    if i >= 5:
        return Image.alpha_composite(b, t)
    u = i / 5
    skala = 1.28 - .28 * S.raus(u)
    alpha = S.raus(u * 1.6) if u < .625 else 1.0
    ausschnitt = t.crop(bb)
    aw, ah = int(ausschnitt.width * skala), int(ausschnitt.height * skala)
    gross = ausschnitt.resize((aw, ah), Image.BICUBIC)
    ga = gross.getchannel('A').point(lambda v: int(v * alpha))
    gross.putalpha(ga)
    mx, my = (bb[0] + bb[2]) // 2, (bb[1] + bb[3]) // 2
    b.alpha_composite(gross, (mx - aw // 2, my - ah // 2))
    return b


def karte_zeigen(b, name, i, n):
    """Große Schriftkarte: kommt mit Feder und leichtem Hub, geht hart —
       der nächste Schnitt übernimmt."""
    t = i / max(1, n - 1)
    if name not in S.TAFELN:
        return b
    auf = S.raus(min(1, t / .22))
    tafel = S.TAFELN[name]
    tafel = ImageChops.offset(tafel, 0, int((1 - auf) * 22))
    ta = tafel.getchannel('A').point(lambda v: int(v * auf))
    tafel = tafel.copy(); tafel.putalpha(ta)
    return Image.alpha_composite(b, tafel)


# ══════════════════════════════════════════════════════════════════════════
# DIE EINSTELLUNGEN
# ══════════════════════════════════════════════════════════════════════════

def E_tinte(i, n, nr, gesamt, par):
    t = i / (n - 1)
    b = R.ebene('tinte', i)
    m = S.TAFELN.get('v-wort-tinte')
    if m is not None and t > .32:
        u = min(1.0, (t - .32) / .16)
        skala = 1.10 - .10 * S.raus(u)
        alpha = S.raus(u)
        bb = m.getchannel('A').getbbox()
        aus = m.crop(bb)
        aw, ah = int(aus.width * skala), int(aus.height * skala)
        g = aus.resize((aw, ah), Image.BICUBIC)
        ga = g.getchannel('A').point(lambda v: int(v * alpha))
        g.putalpha(ga)
        mx, my = (bb[0] + bb[2]) // 2, (bb[1] + bb[3]) // 2
        b.alpha_composite(g, (mx - aw // 2, my - ah // 2))
    if t > .88:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H),
                                               (0, 0, 0, int(255 * ((t - .88) / .12) ** 1.2))))
    return b


def E_karte(i, n, nr, gesamt, par):
    b = R.staubgrund(nr % 260, .85)
    return karte_zeigen(b, par['tafel'], i, n)


def E_flug(i, n, nr, gesamt, par):
    """Der Einflug aus reel.py, aber vor der Staub-Ebene: der gerechnete
       Rechenraum war das Billigste am alten Schnitt."""
    t = i / (n - 1)
    b = R.staubgrund(nr % 260, .75)
    f = R._federt(min(1.0, t / .80))
    schirm = still('heute').resize((2388, 1668), Image.LANCZOS).convert('RGBA')
    breite = int(W * (0.62 + 0.31 * f))
    gier, kipp = 24 * (1 - f), 8 * (1 - f)
    flach = R.geraet(schirm, breite)
    g = R.persp(flach, gier, kipp) if abs(gier) > 0.4 else flach
    x = (W - g.width) // 2
    y_von, y_bis = int(H * 1.02), int(H * .44) - g.height // 2
    y = int(y_von + (y_bis - y_von) * f)
    b.alpha_composite(S.schatten(g, 52, int(130 + 75 * max(0, min(1, f)))), (x, y + 24))
    b.alpha_composite(g, (x, y))
    return b


def E_ger(i, n, nr, gesamt, par):
    t = i / (n - 1)
    b = R.staubgrund(nr % 260, .75)
    schirm = still(par['still']).convert('RGBA')
    zoom = 0.945 * schlag(i) * (1 + .028 * S.sanft(t))
    g = R.geraet(schirm, int(W * zoom), 0.22 * math.sin((t - .5)))
    x = (W - g.width) // 2
    y = int(H * .44) - g.height // 2 + int(4 * math.sin(t * math.pi))
    b.alpha_composite(R.spiegelung(g), (x, y + g.height + 6))
    b.alpha_composite(S.schatten(g, 52, 200), (x, y + 24))
    b.alpha_composite(g, (x, y))
    if 'chip' in par:
        b = chip_zeigen(b, par['chip'], i)
    return b


def E_voll(i, n, nr, gesamt, par):
    t = i / (n - 1)
    drift = 1 + .05 * S.sanft(t)          # die Fahrt innerhalb des Ausschnitts
    zoom = drift * schlag(i)
    if 'szene' in par:
        q = choreobild(par['szene'], par.get('ab', 0) + i)
    elif 'nah' in par:
        q = nahbild(par['nah'], i)
    else:
        q = still(par['still'])
    # m darf ein Paar (Start, Ende) sein: dann fährt das Fenster — z. B.
    # der schreibenden Hand hinterher, wenn die Zeile breiter ist als der
    # 9:16-Ausschnitt je sein kann.
    m = par['m']
    if isinstance(m[0], tuple):
        u = S.sanft(t)
        m = (m[0][0] + (m[1][0] - m[0][0]) * u,
             m[0][1] + (m[1][1] - m[0][1]) * u)
    b = punch(q, m, par['h'], zoom)
    # eine Spur Vignette, damit auch das flache Bild eine Mitte hat
    b = ImageChops.multiply(b, S.VIGNETTE)
    if 'chip' in par:
        b = chip_zeigen(b, par['chip'], i)
    return b


def E_kino(i, n, nr, gesamt, par):
    """Runways Kino-Material, bildgenau weitergedreht. Mit 'ui' wird die
       echte Oberfläche aufs Glas gerechnet: Maske als Alpha, der Glanz
       des gerenderten Glases bleibt auf der echten Schrift liegen."""
    fr = par['ab'] + i
    b = kinobild(par['clip'], fr).resize((W, H), Image.LANCZOS)
    if par.get('ui'):
        eckliste = kinospur(par['clip'])[min(fr, len(kinospur(par['clip'])) - 1)]
        ui = still(par['ui'])
        # Punch-Skala: die UI-Quelle ist 3×; fürs Warpen reicht die Hälfte
        if ui.width > 2000:
            ui = ui.resize((ui.width // 2, ui.height // 2), Image.LANCZOS)
        b = G.einrechnen(b, eckliste, ui).convert('RGB')
    if 'chip' in par:
        b = chip_zeigen(b.convert('RGBA'), par['chip'], i)
    return b.convert('RGBA')


def E_schluss(i, n, nr, gesamt, par):
    t = i / (n - 1)
    b = R.staubgrund(nr % 260, 1.0)
    auf = S.raus(min(1, t / .24))
    tafel = S.TAFELN.get('v-marke')
    if tafel is not None:
        tf = ImageChops.offset(tafel, 0, int((1 - auf) * 16))
        ta = tf.getchannel('A').point(lambda v: int(v * auf))
        tf = tf.copy(); tf.putalpha(ta)
        b = Image.alpha_composite(b, tf)
    if t > .86:
        b = Image.alpha_composite(b, Image.new('RGBA', (W, H),
                                               (0, 0, 0, int(255 * (t - .86) / .14))))
    return b


ARTEN = dict(tinte=E_tinte, karte=E_karte, flug=E_flug, ger=E_ger,
             voll=E_voll, kino=E_kino, schluss=E_schluss)


# ══════════════════════════════════════════════════════════════════════════
# BAUEN
# ══════════════════════════════════════════════════════════════════════════

def chips_laden():
    n = 0
    for f in sorted(glob.glob(S.QUELLE + 'c-*.png')):
        S.TAFELN[os.path.basename(f)[:-4]] = S.lade(f, (W, H))
        n += 1
    return n


def bauen(nur=None):
    S.vorbereiten()
    R.tafeln_laden()
    print('  Chips:', chips_laden())
    os.makedirs(BILDER, exist_ok=True)
    if not nur:
        for f in os.listdir(BILDER):
            os.remove(BILDER + f)
    gesamt = sum(int(round(beats * BEAT * FPS)) for _, beats, _ in EDL)
    nr = 0
    for k, (art, beats, par) in enumerate(EDL):
        n = int(round(beats * BEAT * FPS))
        if nur is not None and k not in nur:
            nr += n
            continue
        fn = ARTEN[art]
        for i in range(n):
            b = fn(i, n, nr, gesamt, par)
            S.veredeln(b, nr).convert('RGB').save('%s%05d.jpg' % (BILDER, nr), quality=95)
            nr += 1
        print('  %2d %-8s %4.1f Beats  %3d Bilder  %s' %
              (k, art, beats, n, par.get('chip', par.get('still', par.get('nah', '')))),
              flush=True)
    return gesamt


def ton(gesamtlaenge):
    """Das Klangbett aus den echten Ebenen: Tinte unter dem Auftakt, der
       Raumton der Staub-Ebene unter dem Rest. Kein erfundener Ton."""
    ff = S.ffmpeg()
    U = '/root/.claude/uploads/8aa0ee34-461f-58fa-8bbf-4e14fb86dc91/'
    tinte = U + '21b7f190-A_single_drop_of_black_ink_falling_into_clear_water_in_a_gla.mp4'
    staub = U + '019ae699-Dust_motes_drifting_slowly_through_a_single_hard_shaft_of_lo.mp4'
    dauer = gesamtlaenge / FPS
    tinte_s = EDL[0][1] * BEAT
    # endliche Schleife: die unendliche (-1) bringt ffmpeg in Kombination
    # mit atrim/amix zum Abbruch (Status 234).
    subprocess.run([ff, '-y', '-loglevel', 'error',
        '-i', tinte, '-stream_loop', '8', '-i', staub,
        '-filter_complex',
        ('[0:a]atrim=0:{ts:.3f},afade=t=out:st={tf:.3f}:d=0.5,volume=1.0[a0];'
         '[1:a]atrim=0:{d:.3f},afade=t=in:st={tf2:.3f}:d=1.2,afade=t=out:st={af:.3f}:d=1.6,volume=0.55[a1];'
         '[a0][a1]amix=inputs=2:duration=longest:normalize=0[a]').format(
            ts=tinte_s + .4, tf=tinte_s - .1, tf2=max(0, tinte_s - .8),
            d=dauer, af=dauer - 1.8),
        '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', HEIM + '/takt-ton.m4a'], check=True)
    return HEIM + '/takt-ton.m4a'


def kodieren(gesamt, ziel=HEIM + '/velum-takt.mp4'):
    tondatei = ton(gesamt)
    subprocess.run([S.ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(FPS),
                    '-i', BILDER + '%05d.jpg', '-i', tondatei,
                    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '19',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                    '-shortest', '-movflags', '+faststart', ziel], check=True)
    return ziel


if __name__ == '__main__':
    nur = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else None
    n = bauen(nur)
    print('Bilder gesamt:', n, '=', round(n / FPS, 1), 's ·', len(EDL), 'Einstellungen')
    if not nur:
        print('Datei:', kodieren(n))
