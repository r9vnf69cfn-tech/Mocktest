#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bilder-erzeugen.py — Der Erzeuger für Velums Bildmaterial
==========================================================

Warum es dieses Werkzeug gibt
-----------------------------
Der Entwurf ist eine stille graue Oberfläche. Eine solche Oberfläche muss
beweisen, dass sie mit bunten Fotos zusammenarbeitet statt gegen sie zu
kämpfen — sonst ist die Ruhe nur eine Behauptung, die beim ersten echten
Bild zerbricht. Freie Bildquellen sind aus diesem Container nicht
erreichbar (picsum.photos und images.unsplash.com antworten mit 403).
Also werden die Bilder erzeugt.

Der Anspruch
------------
Ein erzeugtes Bild darf nicht wie eine CSS-Fläche aussehen. Es muss die
Merkmale echter Fotografie tragen:

  · ein Motiv mit Vorder- und Hintergrund, nicht eine Fläche
  · Tiefenunschärfe — der Hintergrund weicher als der Vordergrund
  · Korn, fein und über das ganze Bild
  · eine schwache Vignette
  · natürliche Farbtemperatur und eine Lichtrichtung, die im ganzen Bild
    stimmt
  · keine perfekte Symmetrie, keine perfekt geraden Kanten

Wie das erreicht wird
---------------------
Der Kern ist ein kleiner Renderer, kein Filterstapel:

  1. Gerechnet wird in LINEAREM Licht (sRGB wird beim Start dekodiert und
     erst ganz am Ende wieder kodiert). Das ist der wichtigste einzelne
     Unterschied: Unschärfe, Bokeh und Überstrahlung verhalten sich nur im
     linearen Raum wie in einer echten Optik. Im sRGB-Raum weichgezeichnete
     Lichter werden grau statt hell.

  2. Jede Form entsteht als Maske, deren Kante mit tieffrequentem Rauschen
     aufgebrochen wird. Es gibt deshalb keine mathematisch gerade Kante im
     ganzen Bild.

  3. Jede Form bekommt aus ihrer eigenen Maske eine Wölbung: der Gradient
     der weichgezeichneten Maske ist näherungsweise die Flächennormale am
     Rand. Damit fällt Licht auf die zum Licht zeigende Kante und der
     Gegenrand wird dunkel — dreidimensional, ohne dass irgendwo ein
     Verlauf von Hand gesetzt wird.

  4. Jede Form wirft einen Kontaktschatten, immer in dieselbe Richtung.
     EIN Lichtvektor je Szene, an alle Aufrufe durchgereicht.

  5. Die Szene wird in Ebenen gebaut (Hintergrund, Mittelgrund,
     Vordergrund). Jede Ebene wird mit eigenem Radius weichgezeichnet und
     dann komponiert — das ist die Tiefenschärfe.

  6. Am Ende läuft immer dieselbe Kamera-Nachbearbeitung: Bokeh-Bloom,
     Filmkurve, Farbtemperatur mit warmen Lichtern und kühlen Schatten,
     Vignette, chromatische Aberration, Objektiv-Weichheit, Korn.

Determinismus
-------------
Jedes Bild hat einen festen, aus seinem Namen abgeleiteten Zufallsstartwert.
Zwei Läufe ergeben bitgleiche Dateien — sonst würden die Bilder bei jedem
Screenshot durchrauschen und Vergleiche wären wertlos.

Ausgabe
-------
JPEG (Qualität 82) für alles Fotografische, PNG nur, wo Transparenz
gebraucht wird (aktuell nirgends — deshalb entsteht kein PNG).

Aufruf
------
    python3 tools/bilder-erzeugen.py
    python3 tools/bilder-erzeugen.py --nur journal
"""

import argparse
import hashlib
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# --------------------------------------------------------------------------
# Pfade
# --------------------------------------------------------------------------

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(WURZEL, "mockups", "assets", "bilder")

JPEG_QUALITAET = 82


# ==========================================================================
# 1 · Grundlagen — Farbraum, Rauschen, Weichzeichnen
# ==========================================================================

def srgb_zu_linear(a):
    """sRGB (0..1) nach linearem Licht. Alles Rechnen passiert hier drin."""
    a = np.clip(a, 0.0, 1.0)
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def linear_zu_srgb(a):
    """Zurück nach sRGB — genau einmal, ganz am Ende."""
    a = np.clip(a, 0.0, 1.0)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * (a ** (1 / 2.4)) - 0.055)


def farbe(hexwert):
    """'#RRGGBB' → linearer RGB-Vektor. Bequemlichkeit beim Szenenbau."""
    h = hexwert.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return srgb_zu_linear(np.array([r, g, b], dtype=np.float32))


def startwert(name):
    """Fester Zufallsstartwert aus dem Dateinamen — reproduzierbar."""
    return int(hashlib.sha256(name.encode("utf-8")).hexdigest()[:8], 16)


def _kastenpass(a, r, achse):
    """Ein Kastenfilter über eine Achse, in O(n) über die Summenreihe."""
    if r < 1:
        return a
    n = a.shape[achse]
    polster = [(0, 0)] * a.ndim
    polster[achse] = (r + 1, r)
    gepolstert = np.pad(a, polster, mode="edge")
    summe = np.cumsum(gepolstert, axis=achse, dtype=np.float32)
    hoch = [slice(None)] * a.ndim
    tief = [slice(None)] * a.ndim
    hoch[achse] = slice(2 * r + 1, 2 * r + 1 + n)
    tief[achse] = slice(0, n)
    return (summe[tuple(hoch)] - summe[tuple(tief)]) / np.float32(2 * r + 1)


def _kern_weich(a, sigma):
    """Echte separable Gauß-Faltung — für kleine Radien, wo Genauigkeit zählt."""
    r = max(1, int(math.ceil(sigma * 3.0)))
    x = np.arange(-r, r + 1, dtype=np.float32)
    k = np.exp(-(x * x) / (2.0 * sigma * sigma))
    k /= k.sum()
    for achse in (0, 1):
        polster = [(0, 0)] * a.ndim
        polster[achse] = (r, r)
        gepolstert = np.pad(a, polster, mode="edge")
        aus = np.zeros_like(a)
        for i, g in enumerate(k):
            schnitt = [slice(None)] * a.ndim
            schnitt[achse] = slice(i, i + a.shape[achse])
            aus += gepolstert[tuple(schnitt)] * g
        a = aus
    return a


def weich(a, radius):
    """
    Gauß-Weichzeichnen für Fließkomma-Felder (HxW oder HxWx3).

    Pillow kann 'F'-Bilder nicht weichzeichnen, deshalb steht hier eine
    eigene Fassung. Zwei Wege: kleine Radien exakt als Faltung, große
    Radien über drei Kastenfilter — die laufen unabhängig vom Radius in
    linearer Zeit und nähern die Gaußkurve so gut an, dass man den
    Unterschied im Bild nicht sieht.
    """
    sigma = float(radius)
    if sigma <= 0.02:
        return a
    a = np.ascontiguousarray(a, dtype=np.float32)
    if sigma < 1.6:
        return _kern_weich(a, sigma)
    # Kastenbreite für drei Durchgänge (Standardnäherung)
    breite = math.sqrt(12.0 * sigma * sigma / 3.0 + 1.0)
    r = max(1, int(round((breite - 1.0) / 2.0)))
    for _ in range(3):
        a = _kastenpass(a, r, 0)
        a = _kastenpass(a, r, 1)
    return a


def _gitter_rauschen(rng, h, w, zellen_y, zellen_x):
    """Ein Zufallsgitter, bikubisch auf volle Größe gezogen — Wertrauschen."""
    zellen_y = max(2, int(zellen_y))
    zellen_x = max(2, int(zellen_x))
    roh = rng.random((zellen_y, zellen_x)).astype(np.float32)
    bild = Image.fromarray(roh, mode="F").resize((w, h), Image.BICUBIC)
    return np.asarray(bild, dtype=np.float32)


def rauschen(rng, h, w, skala, oktaven=4, dehnung=1.0, abfall=0.5):
    """
    Fraktales Wertrauschen, Ergebnis grob 0..1.

    skala    Kantenlänge der gröbsten Zelle in Pixeln
    oktaven  wie viele Verfeinerungen daraufgelegt werden
    dehnung  >1 streckt das Rauschen waagerecht (für Fasern, Maserung)
    abfall   wie schnell die feineren Oktaven leiser werden
    """
    summe = np.zeros((h, w), dtype=np.float32)
    gewicht_summe = 0.0
    gewicht = 1.0
    s = float(skala)
    for _ in range(oktaven):
        summe += gewicht * _gitter_rauschen(rng, h, w, h / s, w / (s * dehnung))
        gewicht_summe += gewicht
        gewicht *= abfall
        s *= 0.5
        if s < 1.6:
            break
    n = summe / max(gewicht_summe, 1e-6)
    # Wichtig: Das Mitteln mehrerer Oktaven schrumpft die Streuung stark
    # (Zentraler Grenzwertsatz). Ohne diese Normierung liefert `rauschen`
    # ein fast konstantes Feld um 0,5 — und jede damit texturierte Fläche
    # sieht aus wie eine CSS-Fläche. Genau daran scheitern gerechnete
    # Bilder als Erstes.
    n = (n - n.mean()) / (n.std() + 1e-6)
    return np.clip(n * 0.21 + 0.5, 0.0, 1.0)


def normiere(a, lo=0.0, hi=1.0):
    """Streckt ein Feld auf einen Bereich — nach Rauschen fast immer nötig."""
    mn, mx = float(a.min()), float(a.max())
    if mx - mn < 1e-6:
        return np.full_like(a, (lo + hi) * 0.5)
    return lo + (a - mn) / (mx - mn) * (hi - lo)


def sanft(x):
    """Smoothstep 0..1 — weiche Kanten ohne sichtbaren Knick."""
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def koordinaten(h, w):
    """Normierte Bildkoordinaten (0..1) als zwei Felder."""
    y = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    x = np.linspace(0.0, 1.0, w, dtype=np.float32)[None, :]
    return y + 0 * x, x + 0 * y


# ==========================================================================
# 2 · Masken — Formen mit unruhigen Kanten
# ==========================================================================

def maske_zeichnen(h, w, zeichnen, ueberabtastung=2, bereich=None):
    """
    Zeichnet eine Form mit ImageDraw in doppelter Auflösung und verkleinert
    sie danach. Das ergibt saubere Halbtöne an der Kante statt Treppen.

    `bereich` = (x0, y0, x1, y1) in Pixeln grenzt die Rasterung auf den
    Ausschnitt ein, in dem die Form überhaupt liegt. Ohne diese Grenze
    kostet ein zwei Pixel großes Blatt genauso viel wie der ganze Himmel —
    und eine Szene mit sechshundert Blättern läuft nicht mehr durch.
    Die Zeichenfunktion bekommt (draw, faktor, ox, oy) und rechnet den
    Versatz selbst heraus.
    """
    f = ueberabtastung
    if bereich is None:
        x0, y0, x1, y1 = 0, 0, w, h
    else:
        x0, y0, x1, y1 = bereich
        x0 = max(0, min(w - 1, int(math.floor(x0))))
        y0 = max(0, min(h - 1, int(math.floor(y0))))
        x1 = max(x0 + 1, min(w, int(math.ceil(x1))))
        y1 = max(y0 + 1, min(h, int(math.ceil(y1))))
    bw, bh = x1 - x0, y1 - y0
    bild = Image.new("L", (bw * f, bh * f), 0)
    zeichnen(ImageDraw.Draw(bild), f, x0 * f, y0 * f)
    klein = np.asarray(bild.resize((bw, bh), Image.LANCZOS),
                       dtype=np.float32) / 255.0
    if bw == w and bh == h:
        return klein
    voll = np.zeros((h, w), dtype=np.float32)
    voll[y0:y1, x0:x1] = klein
    return voll


def _rahmen(punkte, h, w, rand_px):
    """Umschließendes Rechteck einer Punktliste (normiert) in Pixeln."""
    xs = [p[0] * w for p in punkte]
    ys = [p[1] * h for p in punkte]
    return (min(xs) - rand_px, min(ys) - rand_px,
            max(xs) + rand_px, max(ys) + rand_px)


def maske_blatt(h, w, cx, cy, gr, streckung, drehung, lappen=5, weichheit=1.0):
    """
    Ein Blatt. Eine gedrehte Ellipse reicht dafür nicht — sie liest sich als
    Kiesel, und mit Rauschen aufgebrochen als Amöbe. Ein Blatt hat statt
    dessen wenige, REGELMÄSSIGE Lappen, eine Spitze und einen Stiel. Diese
    Form trägt die Erkennbarkeit; die Unregelmäßigkeit kommt danach aus
    Drehung, Größe und Farbe, nicht aus der Kontur.
    """
    r0 = math.radians(drehung)
    co, si = math.cos(r0), math.sin(r0)
    punkte = []
    n = 56
    for i in range(n):
        a = 2 * math.pi * i / n
        # Lappen + Verjüngung zur Spitze hin
        r = 1.0 + 0.20 * math.cos(lappen * a)
        r *= 1.0 - 0.30 * max(0.0, math.cos(a)) ** 2 * 0.0
        ex = gr * r * math.cos(a)
        ey = gr * r * streckung * math.sin(a)
        # Spitze: die Seite bei a≈0 wird ausgezogen
        ex *= 1.0 + 0.35 * max(0.0, math.cos(a)) ** 3
        punkte.append((cx + ex * co - ey * si * (h / w),
                       cy + ex * si * (w / h) + ey * co))
    # Stiel
    stiel_laenge = gr * 0.85
    punkte_stiel = [
        (cx - gr * 0.95 * co, cy - gr * 0.95 * si * (w / h)),
        (cx - (gr * 0.95 + stiel_laenge) * co,
         cy - (gr * 0.95 + stiel_laenge) * si * (w / h))]
    m = maske_polygon(h, w, punkte, weichheit)
    if gr * w > 12:
        m = np.clip(m + maske_strich(h, w, punkte_stiel, gr * 0.10,
                                     weichheit) * 0.9, 0, 1)
    return m


def kante_aufbrechen(maske, rng, amplitude=3.0, skala=90.0, oktaven=4):
    """
    Verschiebt die Maskenkante um `amplitude` Pixel, unregelmäßig.

    Das ist die Regel „keine perfekt geraden Kanten" als Werkzeug: eine
    exakt gerade Tischkante verrät ein gerechnetes Bild sofort.

    Der Weg dahin ist nicht offensichtlich. Rauschen einfach auf die Maske
    zu addieren verschiebt die Kante nur um Bruchteile eines Pixels, weil
    der Übergang ohnehin schon in zwei Pixeln von 0 auf 1 springt. Deshalb
    wird die Kante erst VERBREITERT, dann verschoben und danach wieder
    zusammengezogen — so entspricht die Amplitude echten Pixeln.
    """
    h, w = maske.shape
    r = max(1.0, amplitude)
    breit = weich(maske, r)
    # Die Amplitude MUSS unter 0,5 bleiben. Sonst hebt das Rauschen auch
    # weit außerhalb der Form Werte über die Schwelle, und statt einer
    # unruhigen Kante entstehen Phantomflecken über das ganze Bild.
    stoerung = (rauschen(rng, h, w, skala, oktaven=oktaven) - 0.5) * 0.68
    verzogen = breit + stoerung
    # Wieder schärfen: der Übergang landet ungefähr auf seiner alten Breite
    return np.clip((verzogen - 0.5) * 4.0 + 0.5, 0.0, 1.0)


def maske_ellipse(h, w, cx, cy, rx, ry, drehung=0.0, weichheit=1.5, ecken=72):
    """
    Ellipse in Bildkoordinaten 0..1, frei gedreht, mit weicher Kante.
    Sie wird als feines Polygon gezeichnet — das erlaubt beliebige Drehung
    ohne Zwischenbild und liefert dieselbe Kantenqualität.
    """
    r = math.radians(drehung)
    co, si = math.cos(r), math.sin(r)
    punkte = []
    for i in range(ecken):
        a = 2 * math.pi * i / ecken
        ex, ey = rx * math.cos(a), ry * math.sin(a)
        punkte.append((cx + ex * co - ey * si * (h / w),
                       cy + ex * si * (w / h) + ey * co))
    return maske_polygon(h, w, punkte, weichheit)


def maske_polygon(h, w, punkte, weichheit=1.2):
    """Polygon aus normierten Punkten [(x,y), …]."""
    rand = max(4.0, weichheit * 3.0)

    def zeichnen(d, f, ox, oy):
        d.polygon([(x * w * f - ox, y * h * f - oy) for x, y in punkte], fill=255)

    m = maske_zeichnen(h, w, zeichnen, bereich=_rahmen(punkte, h, w, rand))
    return weich(m, weichheit)


def maske_rechteck(h, w, x0, y0, x1, y1, radius=0.0, weichheit=1.2):
    """Rechteck, optional mit runden Ecken."""
    rand = max(4.0, weichheit * 3.0)

    def zeichnen(d, f, ox, oy):
        kasten = [x0 * w * f - ox, y0 * h * f - oy, x1 * w * f - ox, y1 * h * f - oy]
        if radius > 0:
            d.rounded_rectangle(kasten, radius=radius * w * f, fill=255)
        else:
            d.rectangle(kasten, fill=255)

    m = maske_zeichnen(h, w, zeichnen,
                       bereich=_rahmen([(x0, y0), (x1, y1)], h, w, rand))
    return weich(m, weichheit)


def maske_strich(h, w, punkte, breite, weichheit=1.0):
    """Freier Streckenzug — für Stifte, Kabel, Kreidespuren, Zweige."""
    rand = max(4.0, weichheit * 3.0) + breite * w * 0.6

    def zeichnen(d, f, ox, oy):
        pw = [(x * w * f - ox, y * h * f - oy) for x, y in punkte]
        d.line(pw, fill=255, width=max(1, int(breite * w * f)), joint="curve")
        r = breite * w * f / 2.0
        for px, py in (pw[0], pw[-1]):
            d.ellipse([px - r, py - r, px + r, py + r], fill=255)

    m = maske_zeichnen(h, w, zeichnen, bereich=_rahmen(punkte, h, w, rand))
    return weich(m, weichheit)


# ==========================================================================
# 3 · Licht und Material
# ==========================================================================

class Licht:
    """
    EIN Licht je Szene. `x`/`y` zeigen vom Motiv ZUM Licht
    (Bildkoordinaten, y läuft nach unten). Alles im Bild richtet sich
    danach — Kantenlichter, Glanzpunkte und Schattenwurf.
    """

    def __init__(self, richtung_grad, waerme=0.0, staerke=1.0):
        r = math.radians(richtung_grad)
        self.x = math.cos(r)
        self.y = -math.sin(r)          # Grad zählen gegen den Uhrzeigersinn
        self.waerme = waerme           # −1 kühl … +1 warm
        self.staerke = staerke

    @property
    def ton(self):
        """Lichtfarbe als linearer Multiplikator — Kerze bis Schattenlicht."""
        w = self.waerme
        return np.array([1.0 + 0.16 * w, 1.0 + 0.01 * w, 1.0 - 0.20 * w],
                        dtype=np.float32)


def form_setzen(bild, maske, grundfarbe, licht, rng=None, *,
                textur=None, textur_staerke=0.0,
                woelbung=0.5, woelbungs_radius=None,
                glanz=0.0, glanz_haerte=18.0,
                kontakt=0.0, kontakt_weite=8.0, kontakt_weichheit=10.0):
    """
    Setzt eine Form ins Bild — der einzige Weg, wie in diesem Werkzeug
    etwas Sichtbares entsteht. Vier Dinge passieren immer:

      1. Kontaktschatten auf den Untergrund, entgegen der Lichtrichtung.
      2. Wölbung aus der Maskennormale — Kantenlicht und Gegenschatten.
      3. Textur moduliert die Helligkeit (nie die Sättigung, sonst wird es
         bunt statt körnig).
      4. Glanzpunkt auf der lichtzugewandten Kante, mit der Lichtfarbe.

    `bild` wird an Ort und Stelle verändert und zurückgegeben.
    """
    h, w = maske.shape
    if woelbungs_radius is None:
        woelbungs_radius = max(2.0, min(h, w) * 0.012)

    # Ausschnitt: Ein Blatt von zwölf Pixeln darf nicht so viel kosten wie
    # der ganze Himmel. Liegt die Form in einem kleinen Teil des Bildes,
    # wird nur dieser Teil bearbeitet und danach zurückgeschrieben. Der
    # Rand muss groß genug sein für Wölbung und Schattenwurf.
    aktiv = maske > 0.002
    zeilen = np.flatnonzero(aktiv.any(axis=1))
    if zeilen.size == 0:
        return bild
    spalten = np.flatnonzero(aktiv.any(axis=0))
    rand = int(math.ceil(kontakt_weite + 3.0 * kontakt_weichheit +
                         3.0 * woelbungs_radius + 6.0))
    y0 = max(0, int(zeilen[0]) - rand)
    y1 = min(h, int(zeilen[-1]) + 1 + rand)
    x0 = max(0, int(spalten[0]) - rand)
    x1 = min(w, int(spalten[-1]) + 1 + rand)
    if (y1 - y0) * (x1 - x0) < 0.6 * h * w:
        def schneiden(a):
            if isinstance(a, np.ndarray) and a.ndim >= 2 and a.shape[:2] == (h, w):
                return a[y0:y1, x0:x1]
            return a
        teil = np.ascontiguousarray(bild[y0:y1, x0:x1])
        form_setzen(teil, np.ascontiguousarray(maske[y0:y1, x0:x1]),
                    schneiden(grundfarbe), licht, rng,
                    textur=schneiden(textur), textur_staerke=textur_staerke,
                    woelbung=woelbung, woelbungs_radius=woelbungs_radius,
                    glanz=glanz, glanz_haerte=glanz_haerte,
                    kontakt=kontakt, kontakt_weite=kontakt_weite,
                    kontakt_weichheit=kontakt_weichheit)
        bild[y0:y1, x0:x1] = teil
        return bild

    # (1) Kontaktschatten — er macht aus „aufgeklebt" ein „liegt darauf"
    if kontakt > 0.001:
        dx = int(round(-licht.x * kontakt_weite))
        dy = int(round(-licht.y * kontakt_weite))
        schatten = weich(np.roll(maske, (dy, dx), axis=(0, 1)), kontakt_weichheit)
        schatten = np.clip(schatten - maske * 0.85, 0.0, 1.0)
        bild *= (1.0 - kontakt * schatten)[:, :, None]

    # (2) Wölbung: Gradient der weichen Maske ≈ Normale am Rand
    weiche_maske = weich(maske, woelbungs_radius)
    gy, gx = np.gradient(weiche_maske)
    laenge = np.sqrt(gx * gx + gy * gy)
    nx = gx / (laenge + 1e-6)
    ny = gy / (laenge + 1e-6)
    randstaerke = np.tanh(laenge * 90.0)          # nur am Rand wirksam
    zum_licht = -(nx * licht.x + ny * licht.y)    # Gradient zeigt nach innen
    schattierung = 1.0 + woelbung * zum_licht * randstaerke

    # (3) Farbe der Form
    if isinstance(grundfarbe, np.ndarray) and grundfarbe.ndim == 3:
        flaeche = grundfarbe.copy()
    else:
        flaeche = np.ones((h, w, 3), dtype=np.float32) * np.asarray(
            grundfarbe, dtype=np.float32)[None, None, :]

    if textur is not None and textur_staerke > 0.001:
        flaeche *= (1.0 + (textur - 0.5) * 2.0 * textur_staerke)[:, :, None]

    flaeche *= schattierung[:, :, None]

    # (4) Glanz — additiv, in der Lichtfarbe
    if glanz > 0.001:
        spekular = np.power(np.clip(zum_licht, 0.0, 1.0), glanz_haerte) * randstaerke
        flaeche += (spekular * glanz)[:, :, None] * licht.ton[None, None, :]

    a = np.clip(maske, 0.0, 1.0)[:, :, None]
    bild *= (1.0 - a)
    bild += flaeche * a
    return bild


def globales_licht(bild, licht, staerke=0.22, mitte=(0.5, 0.5)):
    """
    Eine einzige Lichtrampe über das ganze Bild — sie sorgt dafür, dass die
    Lichtrichtung nicht nur an jeder Kante, sondern auch großflächig stimmt.
    Ohne sie wirkt jedes Objekt richtig beleuchtet und die Szene trotzdem
    flach.
    """
    h, w = bild.shape[:2]
    y, x = koordinaten(h, w)
    rampe = (x - mitte[0]) * licht.x + (y - mitte[1]) * licht.y
    faktor = 1.0 + staerke * rampe * 2.0
    return bild * faktor[:, :, None]


def punktlicht(bild, licht, cx, cy, radius, staerke, farbton=None):
    """
    Ein lokales Licht — Lampe, Fenster, Projektor. Additiv im linearen Raum,
    deshalb überstrahlt es Kanten wie eine echte Lichtquelle.
    """
    h, w = bild.shape[:2]
    y, x = koordinaten(h, w)
    d = np.sqrt(((x - cx) * (w / h)) ** 2 + (y - cy) ** 2)
    abfall = np.exp(-(d / max(radius, 1e-3)) ** 2)
    ton = licht.ton if farbton is None else np.asarray(farbton, dtype=np.float32)
    return bild + (abfall * staerke)[:, :, None] * ton[None, None, :]


# ==========================================================================
# 3b · Oberflächen, Gebrauchsspuren, Schrift
# ==========================================================================
#
# Diese drei Helfer beantworten die Frage, woran gerechnete Bilder am
# häufigsten scheitern: an der leeren Fläche. Eine echte Tischplatte hat
# Struktur auf JEDER Größenskala, dazu Kratzer, Staub und Ränder. Eine
# gerechnete hat einen Farbwert. Der Unterschied ist der ganze Unterschied.

def oberflaeche(rng, h, w, grob=70, fein=5, dehnung=1.0, anteil_fein=0.45,
                kontrast=1.6):
    """
    Mehrskalige Materialstruktur: grobe Wolken plus feines Korn, beides in
    einer Richtung dehnbar (Holzmaserung, Faserlauf, Bürstenspuren).
    """
    a = rauschen(rng, h, w, grob, oktaven=4, dehnung=dehnung)
    b = rauschen(rng, h, w, fein, oktaven=3, dehnung=dehnung)
    m = a * (1.0 - anteil_fein) + b * anteil_fein
    return np.clip((m - 0.5) * kontrast + 0.5, 0.0, 1.0)


def gebrauchsspuren(bild, maske, rng, *, kratzer=0, kratzer_laenge=0.10,
                    staub=0, richtung=0.0, staerke=0.16):
    """
    Kratzer und Staub auf eine Fläche legen. Beides sind schmale
    Helligkeitsstörungen, keine Farbe — genau so verhalten sich echte
    Gebrauchsspuren im Streiflicht.
    """
    h, w = maske.shape
    for _ in range(kratzer):
        x0, y0 = rng.random(), rng.random()
        laenge = kratzer_laenge * (0.3 + rng.random() * 1.4)
        winkel = richtung + (rng.random() - 0.5) * 0.9
        punkte = []
        for k in range(4):
            t = k / 3.0
            punkte.append((x0 + math.cos(winkel) * laenge * t +
                           (rng.random() - 0.5) * 0.006,
                           y0 + math.sin(winkel) * laenge * t * (w / h) +
                           (rng.random() - 0.5) * 0.006))
        s = maske_strich(h, w, punkte, 0.0006 + rng.random() * 0.0014,
                         weichheit=0.7)
        hell = rng.random() < 0.55
        f = 1.0 + s * maske * staerke * (1.0 if hell else -1.2) * \
            (0.3 + rng.random())
        bild *= f[:, :, None]
    for _ in range(staub):
        px, py = rng.random(), rng.random()
        r = 0.0009 + rng.random() * 0.0028
        p = maske_ellipse(h, w, px, py, r, r * (0.6 + rng.random() * 0.8),
                          rng.random() * 180, weichheit=0.8)
        bild *= (1.0 - p * maske * (0.10 + rng.random() * 0.28))[:, :, None]
    return bild


def schriftzeile(h, w, rng, x0, y, laenge, groesse, *, neigung=0.0,
                 gedruckt=True, dichte=1.0):
    """
    Eine Zeile Text als Maske — in Worte zerlegt, nicht als durchgehender
    Balken. Der Unterschied ist entscheidend: ein gleichmäßiger Balken
    liest sich als Fortschrittsanzeige, erst die unregelmäßigen Wortlücken
    lesen sich als Text.

    `gedruckt=False` ergibt Handschrift: ein welliger, in der Stärke
    schwankender Strich mit Ober- und Unterlängen.
    """
    maske = np.zeros((h, w), dtype=np.float32)
    x = x0
    ende = x0 + laenge
    while x < ende:
        wort = groesse * (1.2 + rng.random() * 4.2)
        wort = min(wort, ende - x)
        if wort < groesse * 0.5:
            break
        yv = y + (x - x0) * neigung
        if gedruckt:
            # Gedruckt: kompakter Block mit leicht welliger Oberkante
            n = max(2, int(wort / (groesse * 0.55)))
            for k in range(n):
                bx = x + wort * k / n
                bh = groesse * (0.72 + rng.random() * 0.5)
                maske += maske_rechteck(
                    h, w, bx, yv - bh * 0.5,
                    bx + wort / n * (0.72 + rng.random() * 0.22), yv + bh * 0.5,
                    weichheit=0.8) * (0.55 + rng.random() * 0.45) * dichte
        else:
            # Handschrift. Eine reine Sinusbahn ergibt ein gleichmäßiges
            # Zickzack — das liest sich als Muster, nicht als Schrift. Echte
            # Kursive besteht aus Buchstaben unterschiedlicher Höhe mit
            # gelegentlichen Ober- und Unterlängen, und die Grundlinie
            # driftet über das Wort. Genau das wird hier gebaut.
            buchstaben = max(2, int(wort / (groesse * 0.46)))
            drift = (rng.random() - 0.5) * groesse * 0.5
            punkte = []
            for b in range(buchstaben):
                bt0 = b / buchstaben
                bt1 = (b + 1) / buchstaben
                grund = yv + drift * bt0
                hoch = groesse * (0.24 + rng.random() * 0.34)
                if rng.random() < 0.20:
                    hoch = groesse * (0.75 + rng.random() * 0.45)   # Oberlänge
                tief = groesse * (0.20 + rng.random() * 0.26)
                if rng.random() < 0.14:
                    tief = groesse * (0.65 + rng.random() * 0.40)   # Unterlänge
                for tt, dy in ((0.00, tief * 0.35), (0.28, -hoch),
                               (0.58, tief), (0.85, -hoch * 0.35)):
                    t = bt0 + (bt1 - bt0) * tt
                    punkte.append((x + wort * t + (rng.random() - .5) * groesse * 0.05,
                                   grund + dy + (rng.random() - .5) * groesse * 0.09))
            maske += maske_strich(h, w, punkte, groesse * (0.16 + rng.random() * 0.09),
                                  weichheit=0.7) * (0.55 + rng.random() * 0.45) * dichte
        x += wort + groesse * (0.5 + rng.random() * 0.7)
    return np.clip(maske, 0.0, 1.0)


# ==========================================================================
# 4 · Kamera — Tiefenschärfe, Bokeh, Nachbearbeitung
# ==========================================================================

class Ebene:
    """Eine Tiefenebene: eigenes Bild, eigene Deckung, eigener Unschärferadius."""

    def __init__(self, h, w, unschaerfe=0.0, grundfarbe=None):
        self.h, self.w = h, w
        self.unschaerfe = unschaerfe
        if grundfarbe is None:
            self.bild = np.zeros((h, w, 3), dtype=np.float32)
            self.alpha = np.zeros((h, w), dtype=np.float32)
        else:
            self.bild = np.ones((h, w, 3), dtype=np.float32) * np.asarray(
                grundfarbe, dtype=np.float32)[None, None, :]
            self.alpha = np.ones((h, w), dtype=np.float32)

    def form(self, maske, farbwert, licht, **kw):
        """Form in diese Ebene setzen und die Deckung mitziehen."""
        form_setzen(self.bild, maske, farbwert, licht, **kw)
        self.alpha = np.clip(self.alpha + maske, 0.0, 1.0)
        return self


def ebenen_stapeln(ebenen):
    """
    Von hinten nach vorn komponieren. Jede Ebene wird VOR dem Komponieren
    weichgezeichnet — Bild und Deckung gemeinsam, sonst franst die Kante
    einer unscharfen Vordergrundform in Schwarz aus.
    """
    ergebnis = None
    for e in ebenen:
        b, a = e.bild, e.alpha
        if e.unschaerfe > 0.01:
            b = weich(b * a[:, :, None], e.unschaerfe)
            a = weich(a, e.unschaerfe)
            b = b / (a[:, :, None] + 1e-4)
        if ergebnis is None:
            ergebnis = b * a[:, :, None]
        else:
            ergebnis = ergebnis * (1.0 - a[:, :, None]) + b * a[:, :, None]
    return ergebnis


def bokeh(h, w, rng, punkte, radius, helligkeit, farbton):
    """
    Unscharfe Lichter im Hintergrund. Echtes Bokeh ist keine Gaußglocke,
    sondern eine Scheibe mit hellerem Rand (die Blendenöffnung bildet sich
    ab). Genau das wird hier gezeichnet — es ist eines der stärksten
    Fotografie-Merkmale, das eine gerechnete Grafik nie zufällig hat.
    """
    feld = np.zeros((h, w), dtype=np.float32)
    for cx, cy, r_faktor, hell in punkte:
        r = radius * r_faktor
        scheibe = maske_ellipse(h, w, cx, cy, r / w, r / h,
                                weichheit=max(1.0, r * 0.10))
        rand = np.clip(scheibe - weich(scheibe, r * 0.30), 0.0, 1.0)
        feld += scheibe * hell * 0.75 + rand * hell * 0.9
    feld = weich(feld, radius * 0.10)
    return feld[:, :, None] * np.asarray(farbton, dtype=np.float32)[None, None, :] * helligkeit


def filmkurve(bild, schulter=0.82):
    """
    Weiche Lichterkompression. Digital abgeschnittene Lichter (harte 1.0)
    sind ein sofort erkennbares Merkmal gerechneter Bilder; Film und
    Sensor-Tonemapping rollen sie stattdessen ab.
    """
    x = np.maximum(bild, 0.0)
    return (x * (1.0 + x / (schulter ** 2))) / (1.0 + x)


def farbstimmung(bild, waerme=0.0, schatten_kuehle=0.06, saettigung=1.0):
    """
    Natürliche Farbtemperatur: Lichter laufen zur Lichtfarbe, Schatten ins
    Kühle (Himmelslicht in den Schatten). Diese Trennung macht den
    Unterschied zwischen „koloriert" und „fotografiert".
    """
    lum = (bild[:, :, 0] * 0.2126 + bild[:, :, 1] * 0.7152 +
           bild[:, :, 2] * 0.0722)
    hoch = sanft(normiere(lum, 0.0, 1.0))
    warm = np.array([1.0 + 0.10 * waerme, 1.0 + 0.01 * waerme,
                     1.0 - 0.12 * waerme], dtype=np.float32)
    kuehl = np.array([1.0 - schatten_kuehle, 1.0 - schatten_kuehle * 0.25,
                      1.0 + schatten_kuehle * 1.1], dtype=np.float32)
    faktor = (hoch[:, :, None] * warm[None, None, :] +
              (1.0 - hoch)[:, :, None] * kuehl[None, None, :])
    bild = bild * faktor
    if abs(saettigung - 1.0) > 0.001:
        grau = (bild[:, :, 0] * 0.2126 + bild[:, :, 1] * 0.7152 +
                bild[:, :, 2] * 0.0722)[:, :, None]
        bild = grau + (bild - grau) * saettigung
    return bild


def vignette(bild, staerke=0.16, weite=0.78):
    """Schwacher Lichtabfall zu den Ecken — jedes Objektiv hat ihn."""
    h, w = bild.shape[:2]
    y, x = koordinaten(h, w)
    d = np.sqrt(((x - 0.5) * 1.0) ** 2 + ((y - 0.5) * (h / w)) ** 2)
    d = d / (0.5 * math.sqrt(1 + (h / w) ** 2))
    faktor = 1.0 - staerke * sanft((d - weite) / max(1e-3, 1.0 - weite + 0.35))
    return bild * faktor[:, :, None]


def chromatische_aberration(bild, staerke=0.0009):
    """
    Rot- und Blaukanal minimal gegeneinander skaliert. Zum Rand hin
    entstehen dadurch farbige Säume von unter einem Pixel — unauffällig,
    aber das Auge liest es als Optik.
    """
    h, w = bild.shape[:2]
    aus = bild.copy()
    for k, s in ((0, 1.0 + staerke), (2, 1.0 - staerke)):
        kanal = Image.fromarray(bild[:, :, k], mode="F")
        nw, nh = int(round(w * s)), int(round(h * s))
        skaliert = kanal.resize((nw, nh), Image.BICUBIC)
        ox, oy = (nw - w) // 2, (nh - h) // 2
        aus[:, :, k] = np.asarray(
            skaliert.crop((ox, oy, ox + w, oy + h)), dtype=np.float32)
    return aus


def koernung(bild_srgb, rng, staerke=0.016, chroma=0.30):
    """
    Korn — fein und über das ganze Bild, aber in den Mitteltönen am
    kräftigsten (so verhält sich Filmkorn und so rauscht auch ein Sensor
    nach dem Entrauschen). Ein Hauch Farbrauschen dazu; völlig farbloses
    Korn wirkt digital.
    """
    h, w = bild_srgb.shape[:2]
    lum = bild_srgb.mean(axis=2)
    gewicht = 1.0 - np.abs(lum - 0.45) * 1.25
    gewicht = np.clip(gewicht, 0.25, 1.0)

    luma_korn = rng.normal(0.0, 1.0, (h, w)).astype(np.float32)
    luma_korn = weich(luma_korn, 0.55)             # Korn ist kein Pixelrauschen
    luma_korn /= (luma_korn.std() + 1e-6)

    aus = bild_srgb + (luma_korn * gewicht * staerke)[:, :, None]
    if chroma > 0.001:
        farbkorn = rng.normal(0.0, 1.0, (h, w, 3)).astype(np.float32)
        farbkorn = weich(farbkorn, 1.4)
        farbkorn /= (farbkorn.std() + 1e-6)
        aus += farbkorn * gewicht[:, :, None] * staerke * chroma
    return aus


def kamera(bild, rng, *, belichtung=1.0, waerme=0.0, schatten_kuehle=0.06,
           saettigung=1.0, vignette_staerke=0.16, korn=0.016,
           objektiv=0.45, aberration=0.0009, schulter=0.82):
    """
    Die immer gleiche Nachbearbeitung. Reihenfolge ist nicht beliebig:
    Optik-Effekte (Weichheit, Aberration, Vignette) gehören ins lineare
    Licht VOR die Tonkurve, Korn gehört danach in den Anzeigeraum — so
    entsteht es wie in der Kamera, nicht wie ein Filter obendrauf.
    """
    b = bild * belichtung
    if objektiv > 0.01:
        b = weich(b, objektiv)
    if aberration > 0:
        b = chromatische_aberration(b, aberration)
    b = vignette(b, vignette_staerke)
    b = farbstimmung(b, waerme, schatten_kuehle, saettigung)
    b = filmkurve(b, schulter)
    s = linear_zu_srgb(b)
    s = koernung(s, rng, korn)
    return np.clip(s, 0.0, 1.0)


# ==========================================================================
# 5 · Speichern
# ==========================================================================

_ERZEUGT = []


def speichern(bild_srgb, unterordner, name, breiten):
    """
    Schreibt ein Bild in einer oder mehreren Breiten.
    Die kleineren Fassungen entstehen durch Verkleinern der großen — so
    wird auch das Korn mitverkleinert und sieht in der Vorschau richtig
    aus statt künstlich nachgeschärft.
    """
    ordner = os.path.join(ZIEL, unterordner)
    os.makedirs(ordner, exist_ok=True)
    voll = Image.fromarray((bild_srgb * 255.0 + 0.5).astype(np.uint8), "RGB")
    pfade = []
    for b in breiten:
        if b >= voll.width:
            img = voll
        else:
            hoehe = int(round(voll.height * b / voll.width))
            img = voll.resize((b, hoehe), Image.LANCZOS)
        dateiname = f"{name}-{img.width}.jpg"
        pfad = os.path.join(ordner, dateiname)
        img.save(pfad, "JPEG", quality=JPEG_QUALITAET, optimize=True,
                 subsampling=1, progressive=True)
        pfade.append(pfad)
        _ERZEUGT.append((os.path.relpath(pfad, ZIEL), os.path.getsize(pfad)))
    return pfade


# ==========================================================================
# 6 · Journal-Fotos
# ==========================================================================

def journal_labor(h, w, rng):
    """
    Laborsituation. Blick über eine Bank: hinten unscharfe Regalflaschen mit
    Bokeh-Lichtern, vorn Petrischalen und eine Pipette.
    Licht: Fensterlicht von links oben, neutral bis leicht kühl.
    """
    licht = Licht(150, waerme=-0.12)

    # -- Hintergrund: Regal, Flaschen, Fensterschimmer -----------------
    hg = Ebene(h, w, unschaerfe=w * 0.020, grundfarbe=farbe("#8E9498"))
    wand = rauschen(rng, h, w, 220, oktaven=4)
    hg.bild *= (0.82 + 0.30 * wand)[:, :, None]

    # Fensterfläche links oben — Ursprung des Lichts, deshalb dort hell
    fenster = maske_rechteck(h, w, -0.05, -0.05, 0.30, 0.46, weichheit=w * 0.02)
    hg.bild += fenster[:, :, None] * farbe("#DDE6EA")[None, None, :] * 1.5

    # Regalbrett
    brett = kante_aufbrechen(
        maske_rechteck(h, w, -0.05, 0.40, 1.05, 0.455, weichheit=2.0),
        rng, 4.4, 120)
    hg.form(brett, farbe("#6E6A63"), licht, woelbung=0.5)

    # Flaschen: verschiedene Höhen, leicht gekippt, teils farbige Füllung
    for i in range(11):
        x = 0.045 + i * 0.092 + (rng.random() - 0.5) * 0.02
        bh = 0.11 + rng.random() * 0.15
        bw = 0.020 + rng.random() * 0.017
        kipp = (rng.random() - 0.5) * 0.012
        koerper = maske_polygon(h, w, [
            (x - bw + kipp, 0.44 - bh), (x + bw + kipp, 0.44 - bh),
            (x + bw, 0.452), (x - bw, 0.452)], weichheit=1.6)
        koerper = kante_aufbrechen(koerper, rng, 4.4, 70)
        glas = [farbe("#B9C6C4"), farbe("#C8CBBE"), farbe("#9FB2B6"),
                farbe("#D2CBB6")][i % 4]
        hg.form(koerper, glas, licht, woelbung=0.9, glanz=0.55, glanz_haerte=9,
                kontakt=0.30, kontakt_weite=w * 0.010)
        # Füllstand — hier darf Farbe sein, es ist ein Foto
        if i % 3 != 1:
            fuell = maske_polygon(h, w, [
                (x - bw * 0.92 + kipp * 0.5, 0.44 - bh * (0.30 + rng.random() * 0.3)),
                (x + bw * 0.92 + kipp * 0.5, 0.44 - bh * (0.30 + rng.random() * 0.3)),
                (x + bw * 0.92, 0.449), (x - bw * 0.92, 0.449)], weichheit=1.4)
            ton = [farbe("#C8A24E"), farbe("#7FA8B8"), farbe("#B06A55"),
                   farbe("#8FA96B")][(i * 3) % 4]
            hg.form(fuell, ton, licht, woelbung=0.4, glanz=0.25)

    # Bokeh: Reflexe auf Glas und Chrom
    lichter = [(0.06 + rng.random() * 0.90, 0.14 + rng.random() * 0.28,
                0.55 + rng.random() * 0.9, 0.30 + rng.random() * 0.75)
               for _ in range(14)]
    hg.bild += bokeh(h, w, rng, lichter, w * 0.030, 0.70, farbe("#EAF0F2"))

    # -- Mittelgrund: Arbeitsplatte -------------------------------------
    mg = Ebene(h, w, unschaerfe=w * 0.0045)
    platte = kante_aufbrechen(
        maske_rechteck(h, w, -0.05, 0.505, 1.05, 1.05, weichheit=2.0),
        rng, 3.5, 200)
    maserung = oberflaeche(rng, h, w, grob=34, fein=3.5, dehnung=10.0,
                           anteil_fein=0.55, kontrast=2.0)
    mg.form(platte, farbe("#3A3E42"), licht, textur=maserung,
            textur_staerke=0.30, woelbung=0.7, glanz=0.14, glanz_haerte=16)
    # Eine Laborbank ohne Kratzer und Tropfenränder gibt es nicht.
    gebrauchsspuren(mg.bild, platte, rng, kratzer=46, kratzer_laenge=0.14,
                    staub=40, richtung=0.08, staerke=0.30)
    # Spiegelung des Fensters auf der Platte — Kunststoff spiegelt weich
    y, x = koordinaten(h, w)
    spiegel = np.exp(-((x - 0.16) ** 2) / 0.020) * np.exp(-((y - 0.66) ** 2) / 0.030)
    mg.bild += (spiegel * platte * 0.30)[:, :, None] * farbe("#CFDDE2")[None, None, :]

    # Kante der Bank, leicht schräg — nichts ist waagerecht
    kante = kante_aufbrechen(
        maske_polygon(h, w, [(-0.05, 0.495), (1.05, 0.487),
                             (1.05, 0.512), (-0.05, 0.520)], weichheit=1.4),
        rng, 2.2, 150)
    mg.form(kante, farbe("#5B6167"), licht, woelbung=1.1, glanz=0.45)

    # -- Vordergrund: Petrischalen, Pipette, Röhrchen --------------------
    vg = Ebene(h, w, unschaerfe=w * 0.0012)

    for cx, cy, r, drehung in ((0.235, 0.775, 0.135, 4),
                               (0.415, 0.700, 0.108, -7),
                               (0.330, 0.885, 0.120, 11)):
        schale = maske_ellipse(h, w, cx, cy, r, r * 0.60, drehung, weichheit=2.0)
        schale = kante_aufbrechen(schale, rng, 1.3, 130)
        agar = rauschen(rng, h, w, 26, oktaven=5)
        vg.form(schale, farbe("#C8C6AE") * (0.85 + 0.3 * rng.random()), licht,
                textur=agar, textur_staerke=0.12,
                woelbung=1.0, glanz=0.5, glanz_haerte=7,
                kontakt=0.55, kontakt_weite=w * 0.014, kontakt_weichheit=w * 0.012)
        # Deckelrand als schmaler Ring
        innen = maske_ellipse(h, w, cx, cy - 0.004, r * 0.86, r * 0.50, drehung,
                              weichheit=2.0)
        ring = np.clip(schale - innen, 0, 1)
        vg.form(ring, farbe("#DCDCD2"), licht, woelbung=1.2, glanz=0.7)
        # Kolonien — kleine Punkte, unregelmäßig verteilt
        for _ in range(int(9 + rng.random() * 10)):
            a = rng.random() * 2 * math.pi
            d = math.sqrt(rng.random()) * 0.72
            k = maske_ellipse(h, w, cx + math.cos(a) * r * d,
                              cy + math.sin(a) * r * 0.58 * d,
                              0.004 + rng.random() * 0.005,
                              0.0055 + rng.random() * 0.006, weichheit=1.6)
            vg.form(k, farbe("#E4E0C6"), licht, woelbung=1.3, glanz=0.5)

    # Pipette, diagonal — bricht die Waagerechte der Bank
    pip = maske_strich(h, w, [(0.60, 0.62), (0.83, 0.74), (0.96, 0.815)],
                       0.017, weichheit=1.4)
    vg.form(pip, farbe("#D8DBDA"), licht, woelbung=1.5, glanz=0.9, glanz_haerte=6,
            kontakt=0.55, kontakt_weite=w * 0.012, kontakt_weichheit=w * 0.010)
    spitze = maske_polygon(h, w, [(0.58, 0.612), (0.605, 0.605),
                                  (0.612, 0.632), (0.588, 0.636)], weichheit=1.2)
    vg.form(spitze, farbe("#8C93A0"), licht, woelbung=1.2, glanz=0.5)

    # Röhrchenständer rechts
    for i in range(5):
        x = 0.665 + i * 0.048
        r_koerper = maske_rechteck(h, w, x - 0.014, 0.845 - i * 0.004,
                                   x + 0.014, 1.02, 0.010, weichheit=1.5)
        r_koerper = kante_aufbrechen(r_koerper, rng, 1.8, 60)
        vg.form(r_koerper, farbe("#CBD3D4"), licht, woelbung=1.2, glanz=0.75,
                glanz_haerte=8, kontakt=0.4, kontakt_weite=w * 0.010)
        fuellung = maske_rechteck(h, w, x - 0.0115, 0.925 + i * 0.006,
                                  x + 0.0115, 1.02, 0.006, weichheit=1.4)
        vg.form(fuellung, [farbe("#B4574B"), farbe("#C9A24C"), farbe("#6F94A8"),
                           farbe("#B4574B"), farbe("#7E9C6A")][i], licht,
                woelbung=0.6, glanz=0.35)

    bild = ebenen_stapeln([hg, mg, vg])
    bild = globales_licht(bild, licht, 0.26, (0.18, 0.24))
    bild = punktlicht(bild, licht, 0.14, 0.20, 0.42, 0.12)
    return kamera(bild, rng, belichtung=1.02, waerme=-0.10,
                  schatten_kuehle=0.075, saettigung=0.94,
                  vignette_staerke=0.20, korn=0.017)


def journal_mikroskop(h, w, rng):
    """
    Ein Mikroskop auf der Bank, gegen ein helles Fenster. Das Instrument
    steht als dunkle, plastische Silhouette im Gegenlicht — die härteste
    Prüfung für die Lichtrichtung, weil jede Kante zum Licht hin aufleuchten
    muss.
    """
    licht = Licht(60, waerme=-0.06)

    hg = Ebene(h, w, unschaerfe=w * 0.026, grundfarbe=farbe("#5E6669"))
    # Fenster mit Sprossen, stark überstrahlt
    scheibe = maske_rechteck(h, w, 0.24, -0.04, 0.92, 0.72, 0.01, weichheit=6.0)
    hg.bild += scheibe[:, :, None] * farbe("#D9E4E8")[None, None, :] * 1.55
    for xr in (0.47, 0.70):
        sprosse = maske_rechteck(h, w, xr, -0.04, xr + 0.012, 0.72, weichheit=3.0)
        hg.bild *= (1.0 - sprosse * 0.55)[:, :, None]
    quer = maske_rechteck(h, w, 0.24, 0.34, 0.92, 0.352, weichheit=3.0)
    hg.bild *= (1.0 - quer * 0.5)[:, :, None]
    # Etwas Grün draußen — Bäume vor dem Fenster, völlig aufgelöst
    gruen = rauschen(rng, h, w, 60, oktaven=3)
    draussen = scheibe * sanft(normiere(gruen, -0.4, 1.3))
    hg.bild = hg.bild * (1 - draussen * 0.45)[:, :, None] + \
        (draussen * 0.45)[:, :, None] * farbe("#7E9463")[None, None, :] * 1.9
    hg.bild += bokeh(h, w, rng,
                     [(0.30 + rng.random() * 0.60, 0.05 + rng.random() * 0.55,
                       0.5 + rng.random(), 0.35 + rng.random() * 0.6)
                      for _ in range(9)], w * 0.034, 0.55, farbe("#E8F0EA"))
    # Wand links neben dem Fenster
    wandmaske = maske_rechteck(h, w, -0.05, -0.05, 0.25, 0.78, weichheit=6.0)
    wandton = rauschen(rng, h, w, 180, oktaven=4)
    hg.form(wandmaske, farbe("#77797A"), licht, textur=wandton,
            textur_staerke=0.14, woelbung=0.0)

    # Mittelgrund: Tischplatte
    mg = Ebene(h, w, unschaerfe=w * 0.004)
    tisch = kante_aufbrechen(
        maske_polygon(h, w, [(-0.05, 0.735), (1.05, 0.715),
                             (1.05, 1.05), (-0.05, 1.05)], weichheit=2.0),
        rng, 3.1, 190)
    holz = oberflaeche(rng, h, w, grob=30, fein=3.2, dehnung=12.0,
                       anteil_fein=0.55, kontrast=2.0)
    mg.form(tisch, farbe("#4A443C"), licht, textur=holz, textur_staerke=0.36,
            woelbung=0.6, glanz=0.24, glanz_haerte=14)
    gebrauchsspuren(mg.bild, tisch, rng, kratzer=34, kratzer_laenge=0.14,
                    staub=30, richtung=0.04, staerke=0.26)

    # Vordergrund: das Mikroskop
    vg = Ebene(h, w, unschaerfe=w * 0.0010)
    korpus = farbe("#343A41")
    # Lackiertes Gerätemetall ist nicht spiegelglatt: feine Schleifspuren,
    # Staub und Fingerabdrücke. Ohne diese Textur bleiben die Flächen
    # mathematisch sauber, und das Bild liest sich als CAD-Rendering statt
    # als Aufnahme. Es ist der Unterschied, der bei diesem Motiv am meisten
    # trägt, weil das Gerät fast das ganze Bild einnimmt.
    lack = oberflaeche(rng, h, w, grob=44, fein=4.0, dehnung=2.5,
                       anteil_fein=0.55, kontrast=1.7)

    fuss = kante_aufbrechen(maske_polygon(h, w, [
        (0.18, 0.965), (0.52, 0.945), (0.545, 0.885), (0.205, 0.895)],
        weichheit=2.0), rng, 0.006, 90)
    vg.form(fuss, korpus * 0.86, licht, textur=lack, textur_staerke=0.16,
            woelbung=1.4, glanz=1.0, glanz_haerte=9,
            kontakt=0.72, kontakt_weite=w * 0.016, kontakt_weichheit=w * 0.016)

    arm = kante_aufbrechen(maske_polygon(h, w, [
        (0.375, 0.895), (0.470, 0.888), (0.505, 0.470), (0.560, 0.360),
        (0.505, 0.330), (0.430, 0.455)], weichheit=2.0), rng, 0.005, 110)
    vg.form(arm, korpus, licht, textur=lack, textur_staerke=0.15,
            woelbung=1.6, glanz=1.5, glanz_haerte=7)
    # Lichtkante am Arm: lackiertes Metall im Gegenlicht hat einen langen,
    # schmalen Glanzstreifen, keinen Punkt. Ohne ihn bleibt der Arm eine
    # Scherenschnitt-Fläche.
    kante_arm = maske_strich(h, w, [(0.392, 0.884), (0.418, 0.640),
                                    (0.470, 0.470), (0.545, 0.352)],
                             0.009, weichheit=1.4)
    vg.form(kante_arm * arm, farbe("#9AA4AE"), licht, woelbung=0.8, glanz=0.6)

    tischchen = kante_aufbrechen(maske_polygon(h, w, [
        (0.215, 0.700), (0.455, 0.688), (0.458, 0.735), (0.218, 0.748)],
        weichheit=1.6), rng, 0.005, 80)
    vg.form(tischchen, farbe("#3C424A"), licht, textur=lack, textur_staerke=0.14,
            woelbung=1.5, glanz=1.4, glanz_haerte=7)
    # Objektträger — heller Streifen, fängt das Fensterlicht
    traeger = maske_polygon(h, w, [(0.245, 0.694), (0.395, 0.688),
                                   (0.397, 0.706), (0.247, 0.712)], weichheit=1.2)
    vg.form(traeger, farbe("#C3D0D4"), licht, woelbung=1.2, glanz=1.4,
            glanz_haerte=5)

    revolver = maske_ellipse(h, w, 0.320, 0.610, 0.072, 0.040, -6, weichheit=1.8)
    vg.form(revolver, farbe("#2E343B"), licht, woelbung=1.7, glanz=1.6,
            glanz_haerte=7)
    for dx, laenge in ((-0.038, 0.055), (0.002, 0.075), (0.040, 0.045)):
        obj = maske_polygon(h, w, [
            (0.320 + dx - 0.017, 0.625), (0.320 + dx + 0.017, 0.622),
            (0.320 + dx + 0.011, 0.625 + laenge), (0.320 + dx - 0.011, 0.628 + laenge)],
            weichheit=1.2)
        vg.form(obj, farbe("#33383E"), licht, woelbung=1.4, glanz=0.8)
        ring = maske_rechteck(h, w, 0.320 + dx - 0.013, 0.622 + laenge * 0.72,
                              0.320 + dx + 0.013, 0.628 + laenge * 0.80,
                              weichheit=1.0)
        vg.form(ring, farbe("#9A8A5E"), licht, woelbung=1.0, glanz=0.9)

    tubus = kante_aufbrechen(maske_polygon(h, w, [
        (0.300, 0.575), (0.395, 0.565), (0.560, 0.335), (0.505, 0.300)],
        weichheit=1.8), rng, 0.004, 100)
    vg.form(tubus, farbe("#383E45"), licht, textur=lack, textur_staerke=0.15,
            woelbung=1.7, glanz=1.7, glanz_haerte=7)
    kante_tubus = maske_strich(h, w, [(0.318, 0.560), (0.520, 0.318)],
                               0.008, weichheit=1.3)
    vg.form(kante_tubus * tubus, farbe("#A8B2BC"), licht, woelbung=0.8, glanz=0.7)
    okular = maske_ellipse(h, w, 0.545, 0.318, 0.040, 0.030, -34, weichheit=1.6)
    vg.form(okular, farbe("#191C20"), licht, woelbung=1.8, glanz=1.6,
            glanz_haerte=5)

    trieb = maske_ellipse(h, w, 0.487, 0.782, 0.040, 0.041, 0, weichheit=1.8)
    vg.form(trieb, farbe("#404750"), licht, woelbung=1.8, glanz=1.6,
            glanz_haerte=6)
    trieb_klein = maske_ellipse(h, w, 0.487, 0.782, 0.020, 0.021, 0, weichheit=1.4)
    vg.form(trieb_klein, farbe("#3A3F45"), licht, woelbung=1.5, glanz=0.9)

    # Notizblock daneben, angeschnitten — Vordergrundtiefe
    vg2 = Ebene(h, w, unschaerfe=w * 0.007)
    block = kante_aufbrechen(maske_polygon(h, w, [
        (0.660, 0.930), (1.06, 0.858), (1.06, 1.06), (0.700, 1.06)],
        weichheit=2.0), rng, 0.008, 120)
    papier = rauschen(rng, h, w, 22, oktaven=5)
    vg2.form(block, farbe("#C9C4B6"), licht, textur=papier, textur_staerke=0.10,
             woelbung=1.0, glanz=0.2, kontakt=0.6, kontakt_weite=w * 0.014,
             kontakt_weichheit=w * 0.014)
    for i in range(7):
        t = 0.952 + i * 0.020
        zeile = schriftzeile(h, w, rng, 0.700, t, 0.18 + rng.random() * 0.10,
                             0.0105, neigung=-0.190, gedruckt=False)
        vg2.form(zeile * block * (0.5 + rng.random() * 0.4),
                 farbe("#4B4A46"), licht, woelbung=0.0)

    geraet = np.clip(fuss + arm + tubus + tischchen + revolver + trieb, 0, 1)
    gebrauchsspuren(vg.bild, geraet, rng, kratzer=26, kratzer_laenge=0.06,
                    staub=34, richtung=1.2, staerke=0.30)

    bild = ebenen_stapeln([hg, mg, vg, vg2])
    bild = globales_licht(bild, licht, 0.30, (0.60, 0.30))
    return kamera(bild, rng, belichtung=0.96, waerme=-0.05,
                  schatten_kuehle=0.09, saettigung=0.90,
                  vignette_staerke=0.24, korn=0.019, schulter=0.70)


def journal_hoersaal(h, w, rng):
    """
    Hörsaal — aufgenommen VON EINEM PLATZ AUS, nicht von der Tür.

    Der erste Versuch zeigte den Saal von hinten und modellierte hundert
    Köpfe. Das Ergebnis sah aus wie eine Schale Pralinen: bei dieser Größe
    trägt keine gerechnete Kopfform. Diese Fassung dreht die Aufgabe um und
    nutzt aus, was eine Kamera hier ohnehin tut — offene Blende im dunklen
    Saal. Scharf ist nur das eigene Pult mit dem aufgeschlagenen Heft; der
    Saal dahinter zerfällt zu Tonmassen, und genau daran erkennt man ein
    Foto. Das Motiv bleibt dasselbe, die Erzählung wird sogar besser: es ist
    der eigene Platz in der Vorlesung.

    Licht: die Leinwand. Sie steht vorn und oben, ist kühl und die einzige
    nennenswerte Quelle — alles bekommt seinen Saum von dort.
    """
    licht = Licht(94, waerme=-0.22)

    # -- Hintergrund: Wand und Leinwand, weit außerhalb der Schärfe ------
    hg = Ebene(h, w, unschaerfe=w * 0.014, grundfarbe=farbe("#33322F"))
    wand = oberflaeche(rng, h, w, grob=140, fein=10, anteil_fein=0.42)
    hg.bild *= (0.66 + 0.60 * wand)[:, :, None]

    leinwand = maske_polygon(h, w, [(0.300, 0.075), (0.735, 0.062),
                                    (0.742, 0.352), (0.294, 0.344)],
                             weichheit=3.0)
    leinwand = kante_aufbrechen(leinwand, rng, 1.5, 220)
    hg.bild = hg.bild * (1 - leinwand)[:, :, None] + \
        leinwand[:, :, None] * farbe("#C2D0DA")[None, None, :] * 1.42
    # Auf der Folie: ein Zellschema und Textzeilen — erkennbar als Inhalt,
    # unlesbar als Text. Genau so sieht eine Folie aus zwölf Reihen aus.
    zelle = maske_ellipse(h, w, 0.402, 0.222, 0.052, 0.070, 8, weichheit=2.0)
    ring = np.clip(zelle - maske_ellipse(h, w, 0.402, 0.222, 0.043, 0.058, 8,
                                         weichheit=2.4), 0, 1)
    hg.bild = hg.bild * (1 - ring * 0.8)[:, :, None] + \
        (ring * 0.8)[:, :, None] * farbe("#41505C")[None, None, :] * 1.5
    kern = maske_ellipse(h, w, 0.414, 0.240, 0.019, 0.024, -12, weichheit=1.8)
    hg.bild = hg.bild * (1 - kern * 0.7)[:, :, None] + \
        (kern * 0.7)[:, :, None] * farbe("#4C5A66")[None, None, :] * 1.5
    for i in range(6):
        zeile = schriftzeile(h, w, rng, 0.500, 0.128 + i * 0.038,
                             0.075 + rng.random() * 0.150, 0.0125,
                             gedruckt=True)
        hg.bild = hg.bild * (1 - zeile * 0.72)[:, :, None] + \
            (zeile * 0.72)[:, :, None] * farbe("#46525D")[None, None, :] * 1.5
    # Streulicht von der Leinwand in den Raum
    hg.bild += weich(leinwand, w * 0.06)[:, :, None] * \
        farbe("#9FB6C6")[None, None, :] * 0.34

    # Notausgangschild und zwei gedimmte Deckenleuchten
    hg.bild += (maske_rechteck(h, w, 0.055, 0.135, 0.098, 0.166, 0.004,
                               weichheit=w * 0.004))[:, :, None] * \
        farbe("#5BB07A")[None, None, :] * 1.4
    for x in (0.19, 0.86):
        hg.bild += (maske_ellipse(h, w, x, 0.030, 0.052, 0.013,
                                  weichheit=w * 0.007))[:, :, None] * \
            farbe("#E8D6B4")[None, None, :] * 0.85

    # -- Die Reihen dazwischen: reine Tonmassen, stark aufgelöst ---------
    # Bei diesem Unschärferadius ist eine Kopfform ohnehin nicht mehr
    # lesbar — es zählt nur noch, wo dunkel und wo hell ist.
    for j, (yb, unschaerfe, hoehe, dichte) in enumerate((
            (0.366, w * 0.013, 0.052, 13),
            (0.424, w * 0.019, 0.072, 11),
            (0.502, w * 0.029, 0.098, 9))):
        e = Ebene(h, w, unschaerfe=unschaerfe)
        pult = maske_polygon(h, w, [
            (-0.08, yb + 0.030), (1.08, yb + 0.022),
            (1.08, yb + hoehe), (-0.08, yb + hoehe)], weichheit=2.0)
        e.form(kante_aufbrechen(pult, rng, 3.0, 120),
               farbe("#8E7C5E") * (1.55 + j * 0.30), licht,
               textur=oberflaeche(rng, h, w, 40, 5, dehnung=8.0),
               textur_staerke=0.26, woelbung=1.2, glanz=0.55, glanz_haerte=14)
        for k in range(dichte):
            if rng.random() < 0.22:
                continue
            px = (k + 0.5) / dichte + (rng.random() - 0.5) * 0.05
            kr = (0.026 + j * 0.014) * (0.8 + rng.random() * 0.5)
            kopf = maske_ellipse(h, w, px, yb - kr * 0.55,
                                 kr * (0.78 + rng.random() * 0.3), kr,
                                 (rng.random() - 0.5) * 24, weichheit=2.0)
            rumpf = maske_polygon(h, w, [
                (px - kr * 0.8, yb - kr * 0.1), (px + kr * 0.8, yb - kr * 0.1),
                (px + kr * 2.0, yb + hoehe), (px - kr * 2.0, yb + hoehe)],
                weichheit=2.0)
            e.form(np.clip(kopf + rumpf, 0, 1),
                   farbe(["#24262A", "#2C2724", "#1E2125", "#302A27"][(j * 5 + k) % 4])
                   * (0.30 + rng.random() * 0.45), licht,
                   woelbung=1.4, glanz=0.75, glanz_haerte=16)
        hg = hg  # Ebene wird unten gestapelt
        if j == 0:
            reihen = [e]
        else:
            reihen.append(e)

    # -- Das eigene Pult: der scharfe Vordergrund ------------------------
    vg = Ebene(h, w, unschaerfe=w * 0.0009)
    pult = maske_polygon(h, w, [(-0.08, 0.612), (1.08, 0.585),
                                (1.08, 1.08), (-0.08, 1.08)], weichheit=2.0)
    pult = kante_aufbrechen(pult, rng, 3.5, 190)
    holz = oberflaeche(rng, h, w, grob=30, fein=3.5, dehnung=12.0,
                       anteil_fein=0.55, kontrast=1.9)
    vg.form(pult, farbe("#6A5A44"), licht, textur=holz, textur_staerke=0.34,
            woelbung=1.3, glanz=0.55, glanz_haerte=12)
    # Die Vorderkante fängt das Leinwandlicht — ein heller, schmaler Saum
    kante = maske_polygon(h, w, [(-0.08, 0.610), (1.08, 0.583),
                                 (1.08, 0.601), (-0.08, 0.628)], weichheit=1.2)
    vg.form(kante_aufbrechen(kante, rng, 1.6, 160), farbe("#9C8A6E"), licht,
            woelbung=1.4, glanz=0.9, glanz_haerte=9)
    gebrauchsspuren(vg.bild, pult, rng, kratzer=34, kratzer_laenge=0.13,
                    staub=26, richtung=0.05, staerke=0.24)

    # Aufgeschlagenes Heft, leicht schief — das eigene Mitschreiben
    heft = maske_polygon(h, w, [(0.115, 0.700), (0.680, 0.662),
                                (0.735, 1.08), (0.075, 1.08)], weichheit=1.6)
    heft = kante_aufbrechen(heft, rng, 2.4, 150)
    vg.form(heft, farbe("#8E8878"), licht,
            textur=oberflaeche(rng, h, w, 18, 3, anteil_fein=0.6),
            textur_staerke=0.11, woelbung=1.2, glanz=0.30, glanz_haerte=13,
            kontakt=0.55, kontakt_weite=w * 0.012, kontakt_weichheit=w * 0.014)
    y, x = koordinaten(h, w)
    bund = np.exp(-((x - 0.398 - (y - 0.85) * 0.070) ** 2) / 0.0016)
    vg.bild *= (1.0 - bund * heft * 0.34)[:, :, None]
    # Linierung, dann Handschrift darüber — links voller als rechts
    for i in range(11):
        t = 0.735 + i * 0.0315
        lin = maske_polygon(h, w, [(0.140, t), (0.660, t - 0.036),
                                   (0.660, t - 0.0335), (0.140, t + 0.0025)],
                            weichheit=0.9)
        vg.form(lin * heft * 0.30, farbe("#6E6A5E"), licht, woelbung=0.0)
    for i in range(9):
        t = 0.728 + i * 0.0315
        zeile = schriftzeile(h, w, rng, 0.155,
                             t - (0.155 - 0.140) * 0.069,
                             0.190 + rng.random() * 0.055, 0.0105,
                             neigung=-0.069, gedruckt=False)
        vg.form(zeile * heft * (0.55 + rng.random() * 0.30),
                farbe("#242A34"), licht, woelbung=0.0)
    for i in range(5):
        t = 0.760 + i * 0.0315
        zeile = schriftzeile(h, w, rng, 0.430,
                             t - (0.430 - 0.140) * 0.069,
                             0.120 + rng.random() * 0.090, 0.0105,
                             neigung=-0.069, gedruckt=False)
        vg.form(zeile * heft * (0.45 + rng.random() * 0.30),
                farbe("#242A34"), licht, woelbung=0.0)

    # Stift und ein angeschnittener Becher
    stift = maske_strich(h, w, [(0.205, 1.045), (0.470, 0.982), (0.628, 0.938)],
                         0.0135, weichheit=1.2)
    vg.form(stift, farbe("#1C1F24"), licht, woelbung=1.6, glanz=1.1,
            glanz_haerte=8, kontakt=0.55, kontakt_weite=w * 0.010,
            kontakt_weichheit=w * 0.010)
    becher = np.clip(
        maske_ellipse(h, w, 0.885, 0.780, 0.098, 0.062, -4, weichheit=1.8) +
        maske_rechteck(h, w, 0.787, 0.780, 0.983, 1.02, 0.05, weichheit=1.8), 0, 1)
    vg.form(kante_aufbrechen(becher, rng, 1.6, 130), farbe("#A9A296"), licht,
            woelbung=1.3, glanz=0.7, glanz_haerte=10, kontakt=0.6,
            kontakt_weite=w * 0.014, kontakt_weichheit=w * 0.014)
    vg.form(maske_ellipse(h, w, 0.885, 0.780, 0.079, 0.047, -4, weichheit=1.6),
            farbe("#231710"), licht, woelbung=0.9, glanz=1.3, glanz_haerte=6)

    bild = ebenen_stapeln([hg] + reihen + [vg])
    bild = globales_licht(bild, licht, 0.20, (0.50, 0.20))
    bild = punktlicht(bild, licht, 0.51, 0.21, 0.42, 0.20, farbe("#AFC6D6"))
    return kamera(bild, rng, belichtung=1.06, waerme=-0.10,
                  schatten_kuehle=0.13, saettigung=0.88,
                  vignette_staerke=0.34, korn=0.028, schulter=0.66)


def journal_schreibtisch(h, w, rng):
    """
    Schreibtisch am Abend. Eine Lampe von links oben wirft einen warmen
    Lichtkegel auf Papier und Tastatur; alles außerhalb fällt in kühles
    Dunkel. Das ist das dunkelste Bild der Reihe — es prüft, ob die
    Oberfläche auch mit einem fast schwarzen Foto zurechtkommt.
    """
    licht = Licht(140, waerme=0.55)

    hg = Ebene(h, w, unschaerfe=w * 0.022, grundfarbe=farbe("#191B20"))
    wand = oberflaeche(rng, h, w, grob=150, fein=11, anteil_fein=0.40)
    hg.bild *= (0.55 + 0.85 * wand)[:, :, None]
    # Fenster mit Nachtblau und ein paar fernen Lichtern
    fenster = maske_rechteck(h, w, 0.62, -0.05, 1.05, 0.42, 0.01, weichheit=4.0)
    hg.bild = hg.bild * (1 - fenster * 0.9)[:, :, None] + \
        (fenster * 0.9)[:, :, None] * farbe("#1B2733")[None, None, :] * 1.15
    hg.bild += bokeh(h, w, rng,
                     [(0.66 + rng.random() * 0.36, 0.06 + rng.random() * 0.32,
                       0.35 + rng.random() * 0.7, 0.3 + rng.random() * 0.9)
                      for _ in range(12)], w * 0.020, 0.55, farbe("#E8C98A"))
    # Regalbrett links, angeschnitten
    regal = kante_aufbrechen(
        maske_rechteck(h, w, -0.05, 0.16, 0.34, 0.195, weichheit=3.0),
        rng, 2.2, 120)
    hg.form(regal, farbe("#463C33"), licht, woelbung=0.8, glanz=0.2)
    for i in range(6):
        x = 0.02 + i * 0.045
        buch = maske_rechteck(h, w, x, 0.045 + rng.random() * 0.04,
                              x + 0.030 + rng.random() * 0.012, 0.17,
                              weichheit=2.0)
        hg.form(buch, farbe(["#5A4038", "#3E4A44", "#584B33", "#42383E",
                             "#4E4A3C", "#3A4048"][i]), licht,
                woelbung=0.9, glanz=0.18)

    # Lampenschirm oben links — Ursprung des Lichts, sichtbar im Bild
    schirm = maske_polygon(h, w, [(0.055, 0.055), (0.245, 0.045),
                                  (0.295, 0.205), (0.010, 0.215)],
                           weichheit=2.0)
    schirm = kante_aufbrechen(schirm, rng, 1.3, 110)
    hg.form(schirm, farbe("#7A6448"), licht, woelbung=1.2, glanz=0.5)
    innen = maske_polygon(h, w, [(0.020, 0.200), (0.288, 0.192),
                                 (0.283, 0.222), (0.024, 0.230)], weichheit=3.0)
    hg.bild += innen[:, :, None] * farbe("#FFD9A0")[None, None, :] * 3.4

    # Tischplatte
    mg = Ebene(h, w, unschaerfe=w * 0.0030)
    platte = kante_aufbrechen(
        maske_polygon(h, w, [(-0.05, 0.415), (1.05, 0.395),
                             (1.05, 1.05), (-0.05, 1.05)], weichheit=2.0),
        rng, 2.6, 210)
    # Eichenmaserung: grobe Adern plus feines Porenkorn, beides in
    # Faserrichtung gedehnt. Dazu Kratzer, Ringe und Staub — eine
    # Tischplatte ohne Gebrauchsspuren ist der sicherste Hinweis darauf,
    # dass ein Bild gerechnet wurde.
    maserung = oberflaeche(rng, h, w, grob=26, fein=3.0, dehnung=15.0,
                           anteil_fein=0.52, kontrast=2.0)
    adern = np.abs(np.sin(maserung * 19.0)) * 0.45 + maserung * 0.55
    mg.form(platte, farbe("#4C3A2A"), licht, textur=adern,
            textur_staerke=0.34, woelbung=0.7, glanz=0.26, glanz_haerte=14)
    gebrauchsspuren(mg.bild, platte, rng, kratzer=40, kratzer_laenge=0.16,
                    staub=34, richtung=-0.03, staerke=0.26)

    # Vordergrund
    vg = Ebene(h, w, unschaerfe=w * 0.0012)

    # Aufgeschlagenes Heft, leicht gedreht — der hellste Gegenstand
    heft = kante_aufbrechen(maske_polygon(h, w, [
        (0.155, 0.560), (0.615, 0.520), (0.660, 0.955), (0.140, 1.010)],
        weichheit=2.0), rng, 0.007, 140)
    papierton = rauschen(rng, h, w, 20, oktaven=5)
    vg.form(heft, farbe("#D6CDBA"), licht, textur=papierton, textur_staerke=0.09,
            woelbung=1.0, glanz=0.22, kontakt=0.65, kontakt_weite=w * 0.016,
            kontakt_weichheit=w * 0.016)
    # Bundsteg — die Mitte des Hefts liegt tiefer
    y, x = koordinaten(h, w)
    steg = np.exp(-((x - 0.402 - (y - 0.75) * 0.045) ** 2) / 0.0014)
    vg.bild *= (1.0 - steg * heft * 0.30)[:, :, None]
    # Handschrift, links dichter als rechts. Die Zeilen folgen der Neigung
    # des Hefts, nicht der Bildkante.
    neigung = -0.087
    for i in range(12):
        t = 0.585 + i * 0.0335
        zeile = schriftzeile(h, w, rng, 0.185, t, 0.135 + rng.random() * 0.075,
                             0.0115, neigung=neigung, gedruckt=False)
        vg.form(zeile * heft * (0.55 + rng.random() * 0.35),
                farbe("#2C3138"), licht, woelbung=0.0)
    for i in range(8):
        t = 0.578 + i * 0.0335
        zeile = schriftzeile(h, w, rng, 0.435, t - 0.0218,
                             0.090 + rng.random() * 0.100, 0.0115,
                             neigung=neigung, gedruckt=False)
        vg.form(zeile * heft * (0.45 + rng.random() * 0.35),
                farbe("#2C3138"), licht, woelbung=0.0)
    # Zwei Unterstreichungen — jemand hat etwas wichtig gefunden
    for a, b in (((0.190, 0.652), (0.330, 0.639)),
                 ((0.440, 0.712), (0.560, 0.701))):
        u = maske_strich(h, w, [a, b], 0.0035, weichheit=0.9)
        vg.form(u * heft * 0.8, farbe("#2C3138"), licht, woelbung=0.0)

    # Stift, quer über dem Heft
    stift = maske_strich(h, w, [(0.245, 0.905), (0.470, 0.845), (0.600, 0.795)],
                         0.014, weichheit=1.3)
    vg.form(stift, farbe("#20242A"), licht, woelbung=1.6, glanz=1.0,
            glanz_haerte=6, kontakt=0.6, kontakt_weite=w * 0.011,
            kontakt_weichheit=w * 0.010)
    kappe = maske_strich(h, w, [(0.575, 0.803), (0.625, 0.784)], 0.013, weichheit=1.2)
    vg.form(kappe, farbe("#8A7A52"), licht, woelbung=1.4, glanz=1.0)

    # Tasse rechts. Sie wird als Körper AUFGEBAUT — leicht konischer
    # Rumpf, elliptischer Rand, Henkel als Ring —, nicht aus einem
    # Rechteck und einer Ellipse zusammengeklebt. Der erste Versuch ergab
    # einen Topf mit Beulen; ein Gefäß muss eine durchgehende Silhouette
    # haben, sonst liest das Auge es sofort als Fehler.
    tx, ty = 0.800, 0.632
    rumpf = maske_polygon(h, w, [
        (tx - 0.086, ty), (tx + 0.086, ty),
        (tx + 0.070, ty + 0.170), (tx - 0.070, ty + 0.170)], weichheit=1.6)
    boden = maske_ellipse(h, w, tx, ty + 0.170, 0.070, 0.026, 0, weichheit=1.6)
    # Henkel: großer Ring minus kleinerer, nur die rechte Hälfte
    henkel = np.clip(
        maske_ellipse(h, w, tx + 0.108, ty + 0.072, 0.050, 0.050, 0, weichheit=1.4) -
        maske_ellipse(h, w, tx + 0.108, ty + 0.072, 0.028, 0.028, 0, weichheit=1.6),
        0, 1) * maske_rechteck(h, w, tx + 0.070, 0.0, 1.2, 1.2, weichheit=1.2)
    koerper = kante_aufbrechen(np.clip(rumpf + boden + henkel, 0, 1), rng, 1.4, 130)
    vg.form(koerper, farbe("#BCB4A6"), licht, woelbung=1.5, glanz=0.85,
            glanz_haerte=9, kontakt=0.75, kontakt_weite=w * 0.017,
            kontakt_weichheit=w * 0.017)
    rand = maske_ellipse(h, w, tx, ty, 0.086, 0.031, 0, weichheit=1.4)
    vg.form(rand, farbe("#D2CABB"), licht, woelbung=1.6, glanz=1.1,
            glanz_haerte=8)
    kaffee = maske_ellipse(h, w, tx, ty + 0.004, 0.072, 0.024, 0, weichheit=1.4)
    vg.form(kaffee, farbe("#241811"), licht, woelbung=1.0, glanz=1.5,
            glanz_haerte=5)
    dampf = rauschen(rng, h, w, 55, oktaven=3)
    dampfform = maske_ellipse(h, w, tx + 0.010, ty - 0.090, 0.070, 0.075, 0,
                              weichheit=w * 0.020)
    vg.bild += (dampfform * sanft(normiere(dampf, -0.5, 1.4)) * 0.15)[:, :, None] * \
        farbe("#FFE7C4")[None, None, :]
    vg.alpha = np.clip(vg.alpha + dampfform * 0.35, 0, 1)

    # Kram, der auf jedem Schreibtisch liegt. Er steht hier nicht zur
    # Dekoration: eine leere Fläche ist der zuverlässigste Hinweis auf ein
    # gerechnetes Bild, weil kein Mensch so aufgeräumt arbeitet.
    mg2 = Ebene(h, w, unschaerfe=w * 0.0045)

    # Bücherstapel rechts hinten, leicht versetzt gestapelt
    yb = 0.512
    for i, (dicke, ton, versatz) in enumerate((
            (0.048, "#4A3A33", 0.000), (0.036, "#3D4640", 0.014),
            (0.030, "#544631", 0.004), (0.040, "#3A3540", -0.011))):
        band = maske_polygon(h, w, [
            (0.700 + versatz, yb - dicke), (0.985 + versatz * 0.4, yb - dicke - 0.012),
            (0.990 + versatz * 0.4, yb - 0.012), (0.705 + versatz, yb)],
            weichheit=1.4)
        band = kante_aufbrechen(band, rng, 1.4, 90)
        mg2.form(band, farbe(ton), licht, woelbung=1.3, glanz=0.35,
                 glanz_haerte=12, kontakt=0.5, kontakt_weite=w * 0.010,
                 kontakt_weichheit=w * 0.010)
        # Der Schnitt des Buchblocks: viele feine helle Linien
        for k in range(7):
            hy = dicke * (0.15 + k * 0.105)
            bl = maske_polygon(h, w, [
                (0.702 + versatz, yb - hy),
                (0.987 + versatz * 0.4, yb - hy - 0.012),
                (0.987 + versatz * 0.4, yb - hy - 0.0105),
                (0.702 + versatz, yb - hy + 0.0015)], weichheit=0.8)
            mg2.form(bl * band * 0.34, farbe("#9A9078"), licht, woelbung=0.0)
        yb -= dicke

    vg2 = Ebene(h, w, unschaerfe=w * 0.0018)

    # Stiftebecher links hinten
    becher = np.clip(
        maske_polygon(h, w, [(0.184, 0.430), (0.278, 0.426),
                             (0.270, 0.552), (0.192, 0.556)], weichheit=1.6) +
        maske_ellipse(h, w, 0.231, 0.430, 0.048, 0.017, 0, weichheit=1.4), 0, 1)
    vg2.form(kante_aufbrechen(becher, rng, 1.4, 110), farbe("#3E4348"), licht,
             woelbung=1.3, glanz=0.7, glanz_haerte=11, kontakt=0.6,
             kontakt_weite=w * 0.012, kontakt_weichheit=w * 0.012)
    for dx, hoehe, ton in ((-0.022, 0.088, "#7A4A3A"), (0.002, 0.112, "#2A2E34"),
                           (0.020, 0.070, "#5A6A4A"), (0.032, 0.098, "#6A5F3A")):
        stab = maske_strich(h, w, [(0.231 + dx, 0.438),
                                   (0.231 + dx + (rng.random() - .5) * 0.024,
                                    0.438 - hoehe)], 0.0085, weichheit=1.0)
        vg2.form(stab, farbe(ton), licht, woelbung=1.4, glanz=0.6, glanz_haerte=10)

    # Handy neben dem Heft, dunkel und spiegelnd
    handy = maske_polygon(h, w, [(0.905, 0.712), (1.070, 0.688),
                                 (1.090, 0.902), (0.936, 0.930)], weichheit=1.4)
    vg2.form(kante_aufbrechen(handy, rng, 1.2, 130), farbe("#131518"), licht,
             woelbung=1.5, glanz=0.9, glanz_haerte=9, kontakt=0.65,
             kontakt_weite=w * 0.012, kontakt_weichheit=w * 0.012)
    # Auf dem schwarzen Glas spiegelt sich der Lampenschirm
    yk, xk = koordinaten(h, w)
    reflex = np.exp(-(((xk - 0.975) ** 2) / 0.0028 + ((yk - 0.790) ** 2) / 0.0060))
    vg2.bild += (reflex * handy * 0.60)[:, :, None] * \
        farbe("#FFCE94")[None, None, :]

    # Ein Kabel, das über die Platte läuft — es bricht die leere Fläche
    kabel = maske_strich(h, w, [(1.05, 0.598), (0.870, 0.572), (0.712, 0.606),
                                (0.648, 0.664)], 0.0058, weichheit=1.0)
    vg2.form(kabel, farbe("#22242A"), licht, woelbung=1.5, glanz=0.7,
             glanz_haerte=10, kontakt=0.45, kontakt_weite=w * 0.007,
             kontakt_weichheit=w * 0.008)

    # Ein loses Blatt, halb unter dem Heft
    blatt = maske_polygon(h, w, [(0.590, 0.910), (0.800, 0.958),
                                 (0.748, 1.06), (0.528, 1.03)], weichheit=1.4)
    vg2.form(kante_aufbrechen(blatt, rng, 2.0, 120), farbe("#B8AE9A"), licht,
             woelbung=1.0, glanz=0.20, kontakt=0.45, kontakt_weite=w * 0.010,
             kontakt_weichheit=w * 0.012)

    # Laptopkante links, angeschnitten und unscharf
    vg3 = Ebene(h, w, unschaerfe=w * 0.011)
    laptop = kante_aufbrechen(maske_polygon(h, w, [
        (-0.06, 0.470), (0.115, 0.455), (0.145, 1.06), (-0.06, 1.06)],
        weichheit=2.0), rng, 1.3, 130)
    vg3.form(laptop, farbe("#2A2D31"), licht, woelbung=1.2, glanz=0.6,
             kontakt=0.5, kontakt_weite=w * 0.012)

    bild = ebenen_stapeln([hg, mg, mg2, vg, vg2, vg3])
    bild = globales_licht(bild, licht, 0.34, (0.16, 0.16))
    bild = punktlicht(bild, licht, 0.155, 0.215, 0.30, 0.55, farbe("#FFCE8E"))
    bild = punktlicht(bild, licht, 0.32, 0.74, 0.34, 0.16, farbe("#FFD9A8"))
    return kamera(bild, rng, belichtung=1.06, waerme=0.42,
                  schatten_kuehle=0.13, saettigung=0.95,
                  vignette_staerke=0.34, korn=0.026, schulter=0.62)


def journal_herbstweg(h, w, rng):
    """
    Weg zur Uni im Herbst — nach unten fotografiert, im Gehen.

    Zwei Anläufe auf Augenhöhe sind gescheitert, und der Grund ist lehrreich:
    Ein Blick den Weg entlang braucht echte Perspektive. Ohne sie liegt der
    Boden als senkrechte Wand im Bild, der Horizont wird eine schnurgerade
    Waagerechte, und alle Bäume stehen auf derselben Linie. Man kann das mit
    Rauschen nicht kaschieren — es ist ein geometrischer Fehler, kein
    Oberflächenfehler.

    Diese Fassung dreht die Kamera nach unten. Damit verschwindet der
    Horizont aus dem Bild, und die Tiefe wird durch das ausgedrückt, was
    hier ohnehin überzeugt: Der Boden ist in FÜNF Tiefenbändern gebaut, von
    hinten nach vorn immer schärfer und mit immer größeren Blättern. Oben
    ragt noch der Fuß zweier Stämme herein, völlig aufgelöst. Das ist die
    Aufnahme, die man tatsächlich macht, wenn einem das Laub auffällt.

    Es bleibt das farbigste Bild der Reihe — der Prüfstein dafür, ob die
    stille graue Karte ein sattes Foto trägt.
    """
    licht = Licht(38, waerme=0.70)
    laub_toene = ["#B5762C", "#C98F33", "#8E6A2A", "#A85F27", "#D2A644",
                  "#7E6B33", "#C07B2E", "#96501F", "#DCB65A"]

    # -- Der Grund: Erde und Kies, feucht, mit Struktur auf drei Skalen --
    grund = Ebene(h, w, unschaerfe=0.0, grundfarbe=farbe("#5E5334"))
    y, x = koordinaten(h, w)
    # Nach hinten (oben) wird alles heller und flauer — Luftperspektive.
    # Sie ersetzt hier die fehlende geometrische Perspektive.
    tiefe = np.clip(1.0 - y * 1.25, 0.0, 1.0)
    erde = oberflaeche(rng, h, w, grob=56, fein=7.0, anteil_fein=0.42,
                       kontrast=2.3)
    grund.bild *= (0.42 + 1.20 * erde)[:, :, None]

    # Der Weg selbst: heller Kies, der schräg durchs Bild läuft. Seine
    # Ränder sind keine Linien, sondern Übergänge — deshalb entstehen sie
    # aus Rauschen, nicht aus einem Polygon.
    achse = x - 0.50 - (y - 0.5) * 0.42
    unruhe = (rauschen(rng, h, w, 150, oktaven=4) - 0.5) * 0.30
    wegmaske = sanft(1.0 - (np.abs(achse + unruhe) - 0.13) / 0.20)
    kies = oberflaeche(rng, h, w, grob=20, fein=4.5, anteil_fein=0.55,
                       kontrast=2.5)
    grund.form(wegmaske, farbe("#847356"), licht, textur=kies,
               textur_staerke=0.42, woelbung=0.0, glanz=0.20)
    # Feuchte Stellen: dunkler und glänzender als der Rest
    nass = sanft((rauschen(rng, h, w, 90, oktaven=4) - 0.56) * 7.0)
    grund.bild *= (1.0 - nass * 0.30)[:, :, None]
    grund.bild += (nass * 0.10)[:, :, None] * farbe("#FFE3B4")[None, None, :]

    ebenen = [grund]

    # -- Fünf Tiefenbänder ------------------------------------------------
    # Jedes Band hat seine eigene Schärfe und seine eigene Objektgröße.
    # Genau diese Staffelung liest das Auge als Tiefe.
    for j, (y0, y1, unschaerfe, groesse, anzahl) in enumerate((
            (-0.05, 0.26, w * 0.020, 0.30, 150),
            (0.20, 0.46, w * 0.011, 0.50, 170),
            (0.40, 0.66, w * 0.0055, 0.72, 180),
            (0.60, 0.88, w * 0.0022, 1.00, 170),
            (0.80, 1.06, w * 0.0009, 1.45, 120))):
        e = Ebene(h, w, unschaerfe=unschaerfe)

        # Grashalme und Zweige am Wegrand
        for _ in range(int(anzahl * 0.45)):
            px = rng.random() * 1.12 - 0.06
            py = y0 + rng.random() * (y1 - y0)
            if abs(px - 0.50 - (py - 0.5) * 0.42) < 0.11:
                continue                     # auf dem Kies wächst nichts
            hoehe = groesse * (0.012 + rng.random() * 0.030)
            halm = maske_strich(h, w, [
                (px, py),
                (px + (rng.random() - .5) * hoehe * 1.2, py - hoehe * 0.6),
                (px + (rng.random() - .5) * hoehe * 2.0, py - hoehe)],
                groesse * 0.0022, weichheit=0.8)
            e.form(halm, farbe(["#6E6A33", "#867A3C", "#5C6330", "#9A8B44",
                                "#4E5530"][int(rng.random() * 5)]) *
                   (0.55 + rng.random() * 0.9), licht, woelbung=1.0, glanz=0.30)

        # Blätter. Sie liegen flach, sind gedreht, überlappen einander und
        # haben eine sichtbare Mittelrippe — ohne die liest man Ellipsen.
        for _ in range(anzahl):
            px = rng.random() * 1.14 - 0.07
            py = y0 + rng.random() * (y1 - y0)
            gr = groesse * (0.011 + rng.random() * 0.026)
            dreh = rng.random() * 180.0
            blatt = maske_blatt(h, w, px, py, gr,
                                0.44 + rng.random() * 0.34, dreh,
                                lappen=[3, 5, 5, 7][int(rng.random() * 4)],
                                weichheit=max(0.7, gr * w * 0.035))
            ton = farbe(laub_toene[int(rng.random() * len(laub_toene))]) * \
                (0.45 + rng.random() * 0.95)
            e.form(blatt, ton, licht, woelbung=1.25, glanz=0.45,
                   glanz_haerte=9, kontakt=0.26,
                   kontakt_weite=w * groesse * 0.0035,
                   kontakt_weichheit=w * groesse * 0.011)
            # Mittelrippe, nur bei den größeren
            if gr * w > 14:
                r = math.radians(dreh)
                rippe = maske_strich(h, w, [
                    (px - math.cos(r) * gr * 0.85,
                     py - math.sin(r) * gr * 0.85 * (w / h)),
                    (px + math.cos(r) * gr * 0.85,
                     py + math.sin(r) * gr * 0.85 * (w / h))],
                    gr * 0.09, weichheit=0.8)
                e.form(rippe * blatt * 0.55, ton * 0.55, licht, woelbung=0.0)

        # Ein paar Kastanien und Eicheln, sie geben Größenmaßstab
        for _ in range(int(anzahl * 0.05)):
            px = rng.random() * 1.10 - 0.05
            py = y0 + rng.random() * (y1 - y0)
            gr = groesse * (0.009 + rng.random() * 0.008)
            nuss = maske_ellipse(h, w, px, py, gr, gr * 0.88,
                                 rng.random() * 180, weichheit=1.0)
            e.form(nuss, farbe("#5A3418") * (0.7 + rng.random() * 0.7), licht,
                   woelbung=1.6, glanz=1.0, glanz_haerte=7, kontakt=0.5,
                   kontakt_weite=w * groesse * 0.005,
                   kontakt_weichheit=w * groesse * 0.006)
        ebenen.append(e)

    # -- Ganz oben: der Fuß zweier Stämme, völlig aufgelöst ---------------
    fern = Ebene(h, w, unschaerfe=w * 0.034)
    for sx, br in ((0.145, 0.052), (0.835, 0.041)):
        stamm = maske_polygon(h, w, [
            (sx - br, -0.06), (sx + br, -0.06),
            (sx + br * 1.5, 0.135), (sx - br * 1.5, 0.130)], weichheit=2.0)
        fern.form(kante_aufbrechen(stamm, rng, 3.0, 40), farbe("#4A3F35"),
                  licht, textur=oberflaeche(rng, h, w, 20, 3, dehnung=0.15),
                  textur_staerke=0.35, woelbung=1.3, glanz=0.5,
                  kontakt=0.55, kontakt_weite=w * 0.016,
                  kontakt_weichheit=w * 0.022)
    ebenen.insert(1, fern)

    bild = ebenen_stapeln(ebenen)

    # Luftperspektive: nach hinten heller, flauer, wärmer
    dunst = farbe("#E8D3A6")[None, None, :] * (tiefe ** 1.5)[:, :, None]
    bild = bild * (1.0 - (tiefe ** 2.0 * 0.24)[:, :, None]) + dunst * 0.24

    # Streiflicht der tiefen Sonne von rechts oben, dazu ein Blendenschleier
    bild = globales_licht(bild, licht, 0.26, (0.80, 0.18))
    bild = punktlicht(bild, licht, 0.86, 0.06, 0.52, 0.30, farbe("#FFDCA6"))
    # Der lange, weiche Schatten eines Baums quer über den Weg
    schattenkante = x * 0.55 + y * 1.0
    schatten = sanft((0.86 - schattenkante) * 3.4) * sanft((schattenkante - 0.30) * 3.4)
    bild *= (1.0 - schatten * 0.22)[:, :, None]

    return kamera(bild, rng, belichtung=1.02, waerme=0.52,
                  schatten_kuehle=0.055, saettigung=1.08,
                  vignette_staerke=0.24, korn=0.016, schulter=0.76)


def journal_kaffee(h, w, rng):
    """
    Kaffee neben aufgeschlagenem Buch, von schräg oben. Morgenlicht von
    links durch ein Fenster. Sehr flache Schärfe: die nahe Buchseite ist
    scharf, die Tasse leicht weich, der Tischrand hinten aufgelöst.
    """
    licht = Licht(163, waerme=0.34)

    hg = Ebene(h, w, unschaerfe=w * 0.024, grundfarbe=farbe("#6F6355"))
    hell = rauschen(rng, h, w, 130, oktaven=4)
    hg.bild *= (0.7 + 0.65 * hell)[:, :, None]
    fensterschein = maske_rechteck(h, w, -0.05, -0.05, 0.42, 0.30, weichheit=w * 0.03)
    hg.bild += fensterschein[:, :, None] * farbe("#F2E6D2")[None, None, :] * 1.7
    hg.bild += bokeh(h, w, rng,
                     [(rng.random() * 0.9, rng.random() * 0.22,
                       0.4 + rng.random() * 0.8, 0.25 + rng.random() * 0.6)
                      for _ in range(10)], w * 0.028, 0.5, farbe("#FFF0D8"))

    # Tischplatte in Eiche, Maserung diagonal
    mg = Ebene(h, w, unschaerfe=w * 0.0035)
    tisch = kante_aufbrechen(
        maske_polygon(h, w, [(-0.05, 0.225), (1.05, 0.180),
                             (1.05, 1.05), (-0.05, 1.05)], weichheit=2.2),
        rng, 3.1, 220)
    maser = oberflaeche(rng, h, w, grob=24, fein=3.0, dehnung=14.0,
                        anteil_fein=0.55, kontrast=2.1)
    aederung = np.abs(np.sin(maser * 20.0)) * 0.42 + maser * 0.58
    mg.form(tisch, farbe("#8A6A46"), licht, textur=aederung, textur_staerke=0.38,
            woelbung=0.5, glanz=0.28, glanz_haerte=14)
    gebrauchsspuren(mg.bild, tisch, rng, kratzer=38, kratzer_laenge=0.15,
                    staub=30, richtung=-0.06, staerke=0.24)

    # Buch, aufgeschlagen, leicht gedreht
    vg = Ebene(h, w, unschaerfe=w * 0.0010)
    buch = kante_aufbrechen(maske_polygon(h, w, [
        (0.045, 0.415), (0.615, 0.352), (0.680, 1.02), (0.030, 1.05)],
        weichheit=2.0), rng, 0.006, 150)
    faser = rauschen(rng, h, w, 18, oktaven=6)
    vg.form(buch, farbe("#DCD3C0"), licht, textur=faser, textur_staerke=0.10,
            woelbung=1.1, glanz=0.20, kontakt=0.62, kontakt_weite=w * 0.018,
            kontakt_weichheit=w * 0.020)
    # Der Bund: Papier wölbt sich zur Mitte, dort wird es dunkler
    y, x = koordinaten(h, w)
    mitte = 0.352 + (y - 0.70) * 0.055
    bund = np.exp(-((x - mitte) ** 2) / 0.0020)
    vg.bild *= (1.0 - bund * buch * 0.36)[:, :, None]
    # Seitenwölbung: außen heller, weil das Papier sich dem Licht zuneigt
    vg.bild *= (1.0 + np.abs(x - mitte) * buch * 0.30)[:, :, None]
    # Textblöcke, links und rechts, mit Absatzlücken
    for spalte, x0 in ((0, 0.085), (1, 0.395)):
        t = 0.470 - spalte * 0.030
        i = 0
        while t < 0.965:
            if i in (5, 12, 18):
                t += 0.020
            laenge = 0.215 + (rng.random() - 0.5) * 0.03
            if i in (4, 11, 17):
                laenge *= 0.4 + rng.random() * 0.3
            zeile = schriftzeile(h, w, rng, x0, t, laenge, 0.0072,
                                 neigung=-0.098, gedruckt=True)
            vg.form(zeile * buch * (0.62 + rng.random() * 0.22),
                    farbe("#31302E"), licht, woelbung=0.0)
            t += 0.0245
            i += 1

    # Tasse mit Untertasse, leicht weicher als das Buch
    vg2 = Ebene(h, w, unschaerfe=w * 0.0035)
    unter = maske_ellipse(h, w, 0.790, 0.545, 0.175, 0.130, 6, weichheit=2.0)
    unter = kante_aufbrechen(unter, rng, 1, 140)
    vg2.form(unter, farbe("#CFC9BE"), licht, woelbung=1.2, glanz=0.65,
             glanz_haerte=8, kontakt=0.55, kontakt_weite=w * 0.018,
             kontakt_weichheit=w * 0.020)
    tasse = maske_ellipse(h, w, 0.782, 0.512, 0.118, 0.088, 6, weichheit=1.8)
    vg2.form(tasse, farbe("#E2DCD1"), licht, woelbung=1.4, glanz=0.85,
             glanz_haerte=7, kontakt=0.45, kontakt_weite=w * 0.012,
             kontakt_weichheit=w * 0.013)
    henkel = maske_strich(h, w, [(0.888, 0.470), (0.945, 0.505), (0.905, 0.556)],
                          0.020, weichheit=1.4)
    vg2.form(np.clip(henkel - tasse, 0, 1), farbe("#DAD3C7"), licht,
             woelbung=1.4, glanz=0.8)
    kaffee = maske_ellipse(h, w, 0.782, 0.512, 0.098, 0.072, 6, weichheit=1.6)
    crema = rauschen(rng, h, w, 22, oktaven=5)
    vg2.form(kaffee, farbe("#3A2013"), licht, textur=crema, textur_staerke=0.22,
             woelbung=1.0, glanz=1.5, glanz_haerte=4)
    # Crema-Rand: heller Saum innen am Tassenrand
    saum = np.clip(kaffee - maske_ellipse(h, w, 0.782, 0.512, 0.086, 0.062, 6,
                                          weichheit=2.4), 0, 1)
    vg2.form(saum, farbe("#7A4A22"), licht, woelbung=0.6, glanz=0.5)

    # Löffel auf der Untertasse
    stiel = maske_strich(h, w, [(0.700, 0.628), (0.828, 0.612)], 0.011, weichheit=1.2)
    laffe = maske_ellipse(h, w, 0.688, 0.630, 0.030, 0.018, -6, weichheit=1.4)
    vg2.form(np.clip(stiel + laffe, 0, 1), farbe("#B6B9BC"), licht,
             woelbung=1.5, glanz=1.6, glanz_haerte=5,
             kontakt=0.4, kontakt_weite=w * 0.008, kontakt_weichheit=w * 0.008)

    bild = ebenen_stapeln([hg, mg, vg, vg2])
    bild = globales_licht(bild, licht, 0.28, (0.10, 0.16))
    bild = punktlicht(bild, licht, 0.06, 0.14, 0.55, 0.14, farbe("#FFE9C6"))
    return kamera(bild, rng, belichtung=1.04, waerme=0.30,
                  schatten_kuehle=0.07, saettigung=0.98,
                  vignette_staerke=0.20, korn=0.015)


def journal_seminarraum(h, w, rng):
    """
    Schreibtisch-Situation im Seminarraum: Tafel im unscharfen Hintergrund,
    davor ein Platz mit Buch und Karteikarten. Ergänzt die Reihe um eine
    mittelhelle, kühl-neutrale Szene.
    """
    licht = Licht(118, waerme=0.05)

    hg = Ebene(h, w, unschaerfe=w * 0.021, grundfarbe=farbe("#7C7E7A"))
    wand = rauschen(rng, h, w, 160, oktaven=4)
    hg.bild *= (0.80 + 0.34 * wand)[:, :, None]
    tafel = kante_aufbrechen(
        maske_rechteck(h, w, 0.10, 0.055, 0.96, 0.505, 0.006, weichheit=3.0),
        rng, 1, 200)
    schiefer = rauschen(rng, h, w, 40, oktaven=5)
    hg.form(tafel, farbe("#2F3A34"), licht, textur=schiefer, textur_staerke=0.22,
            woelbung=0.8, glanz=0.30, kontakt=0.4, kontakt_weite=w * 0.014,
            kontakt_weichheit=w * 0.016)
    # Kreide: Zellschema — Kreis mit Kern, ein paar Pfeile, Wortzeilen
    kreide = farbe("#CFD6CC")
    zelle = maske_ellipse(h, w, 0.320, 0.265, 0.088, 0.115, 8, weichheit=2.0)
    zelle = np.clip(zelle - maske_ellipse(h, w, 0.320, 0.265, 0.078, 0.103, 8,
                                          weichheit=2.4), 0, 1)
    hg.form(zelle * 0.85, kreide, licht, woelbung=0.0)
    kern = maske_ellipse(h, w, 0.336, 0.286, 0.030, 0.038, -12, weichheit=2.0)
    kern = np.clip(kern - maske_ellipse(h, w, 0.336, 0.286, 0.022, 0.029, -12,
                                        weichheit=2.2), 0, 1)
    hg.form(kern * 0.8, kreide, licht, woelbung=0.0)
    for a, b in (((0.430, 0.200), (0.520, 0.165)),
                 ((0.430, 0.330), (0.530, 0.375)),
                 ((0.372, 0.395), (0.400, 0.455))):
        pfeil = maske_strich(h, w, [a, b], 0.0035, weichheit=1.4)
        hg.form(pfeil * 0.75, kreide, licht, woelbung=0.0)
    for i in range(6):
        t = 0.150 + i * 0.052
        laenge = 0.10 + rng.random() * 0.19
        z = maske_strich(h, w, [(0.560, t), (0.560 + laenge, t - 0.004)],
                         0.0045, weichheit=1.4)
        hg.form(z * (0.45 + rng.random() * 0.35), kreide, licht, woelbung=0.0)

    # Tischreihe
    mg = Ebene(h, w, unschaerfe=w * 0.0035)
    tisch = kante_aufbrechen(
        maske_polygon(h, w, [(-0.05, 0.585), (1.05, 0.560),
                             (1.05, 1.05), (-0.05, 1.05)], weichheit=2.2),
        rng, 2.6, 200)
    dekor = rauschen(rng, h, w, 24, oktaven=5, dehnung=10.0)
    mg.form(tisch, farbe("#9C9384"), licht, textur=dekor, textur_staerke=0.16,
            woelbung=0.6, glanz=0.26)

    vg = Ebene(h, w, unschaerfe=w * 0.0012)
    # Aufgeschlagenes Buch, angeschnitten links
    buch = kante_aufbrechen(maske_polygon(h, w, [
        (-0.06, 0.700), (0.395, 0.655), (0.430, 1.06), (-0.06, 1.06)],
        weichheit=2.0), rng, 0.006, 150)
    vg.form(buch, farbe("#E0D9C9"), licht, woelbung=1.0, glanz=0.18,
            kontakt=0.55, kontakt_weite=w * 0.014, kontakt_weichheit=w * 0.016)
    for i in range(11):
        t = 0.725 + i * 0.029
        laenge = 0.20 + rng.random() * 0.14
        zeile = schriftzeile(h, w, rng, 0.020, t, laenge, 0.0080,
                             neigung=-0.090, gedruckt=True)
        vg.form(zeile * buch * (0.6 + rng.random() * 0.25),
                farbe("#33322F"), licht, woelbung=0.0)

    # Karteikarten, gefächert — jede um einen anderen Winkel gedreht
    for i, (cx, cy, drehung) in enumerate(((0.610, 0.800, -8),
                                           (0.665, 0.845, 3),
                                           (0.720, 0.885, 13))):
        halb_b, halb_h = 0.105, 0.072
        r = math.radians(drehung)
        co, si = math.cos(r), math.sin(r)
        punkte = []
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            ex, ey = sx * halb_b, sy * halb_h
            punkte.append((cx + ex * co - ey * si * (h / w),
                           cy + ex * si * (w / h) + ey * co))
        karte = kante_aufbrechen(maske_polygon(h, w, punkte, weichheit=1.4),
                                 rng, 1, 120)
        vg.form(karte, farbe("#EDE7DA") * (0.94 + i * 0.03), licht,
                woelbung=1.2, glanz=0.25, kontakt=0.5, kontakt_weite=w * 0.012,
                kontakt_weichheit=w * 0.012)
        for k in range(3):
            t = cy - 0.035 + k * 0.028
            zeile = maske_strich(h, w, [(cx - 0.070, t), (cx + 0.020 + rng.random() * 0.05, t - 0.008)],
                                 0.006, weichheit=1.2)
            vg.form(zeile * karte * 0.7, farbe("#3A3936"), licht, woelbung=0.0)

    bild = ebenen_stapeln([hg, mg, vg])
    bild = globales_licht(bild, licht, 0.22, (0.14, 0.20))
    return kamera(bild, rng, belichtung=1.00, waerme=0.06,
                  schatten_kuehle=0.06, saettigung=0.90,
                  vignette_staerke=0.22, korn=0.016)


# ==========================================================================
# 7 · Mikroskopie-Aufnahme für die Lernkarte
# ==========================================================================

def mikroskopie(h, w, rng):
    """
    Histologischer Schnitt, HE-ähnlich gefärbt: rosa Zytoplasma, violette
    Kerne. Fotografische Merkmale hier: Köhlersche Beleuchtung (Mitte etwas
    heller), sehr flache Schärfentiefe — ein Teil der Zellen liegt in einer
    anderen Ebene und ist deshalb weich —, Staub auf der Optik und ein
    leichter Farbsaum am Rand.
    """
    licht = Licht(115, waerme=0.05)

    grund = Ebene(h, w, unschaerfe=0.0, grundfarbe=farbe("#F0E4EC"))
    gewebe = rauschen(rng, h, w, 90, oktaven=5)
    grund.bild *= (0.86 + 0.26 * gewebe)[:, :, None]

    def zellschicht(anzahl, groesse, unschaerfe, deckung, tonwahl):
        """Eine Ebene Zellen — mehrere davon ergeben die Schärfentiefe."""
        e = Ebene(h, w, unschaerfe=unschaerfe)
        for _ in range(anzahl):
            cx, cy = rng.random(), rng.random()
            r = groesse * (0.6 + rng.random() * 0.9)
            zelle = maske_ellipse(h, w, cx, cy, r, r * (0.65 + rng.random() * 0.6),
                                  rng.random() * 180, weichheit=max(1.2, r * w * 0.06))
            zelle = kante_aufbrechen(zelle, rng, max(1.5, r * w * 0.085), 22)
            plasma = farbe(tonwahl[int(rng.random() * len(tonwahl))])
            innen = rauschen(rng, h, w, 26, oktaven=4)
            # Durchlichtmikroskopie ist FLACH — es gibt kein Streiflicht im
            # Präparat. Modellierte, glänzende Zellen sahen aus wie Perlen.
            e.form(zelle * deckung, plasma * (0.82 + rng.random() * 0.42), licht,
                   textur=innen, textur_staerke=0.26, woelbung=0.14, glanz=0.0)
            # Zellkern, außermittig
            kr = r * (0.30 + rng.random() * 0.16)
            kx = cx + (rng.random() - 0.5) * r * 0.55
            ky = cy + (rng.random() - 0.5) * r * 0.55
            kern = maske_ellipse(h, w, kx, ky, kr, kr * (0.8 + rng.random() * 0.35),
                                 rng.random() * 180, weichheit=max(1.0, kr * w * 0.08))
            kern = kante_aufbrechen(kern, rng, max(1.2, kr * w * 0.10), 18)
            e.form(kern * deckung, farbe(["#6B3D7A", "#57306B", "#7A4886",
                                          "#4E2A63"][int(rng.random() * 4)]) *
                   (0.8 + rng.random() * 0.5), licht,
                   woelbung=0.20, glanz=0.0)
        return e

    # Deutlich mehr Zellen als im ersten Versuch: ein histologischer Schnitt
    # ist dichtes Gewebe, keine Streusiedlung. Bei zu geringer Dichte liest
    # man einzelne Klumpen auf weißem Grund — das sah aus wie Popcorn.
    hinten = zellschicht(105, 0.056, w * 0.014, 0.88,
                         ["#D79BB2", "#C98BA6", "#E0AABC", "#BE7F9A"])
    mitte = zellschicht(90, 0.050, w * 0.0045, 0.94,
                        ["#DC9DB5", "#CE8CA8", "#E6B0C2", "#C2839E"])
    vorn = zellschicht(72, 0.045, w * 0.0010, 0.97,
                       ["#E0A2B9", "#D291AC", "#EAB6C7", "#C7889F"])

    bild = ebenen_stapeln([grund, hinten, mitte, vorn])

    # Köhlersche Beleuchtung: das Feld ist in der Mitte heller
    y, x = koordinaten(h, w)
    d = np.sqrt((x - 0.49) ** 2 + ((y - 0.52) * (h / w)) ** 2)
    bild *= (0.86 + 0.20 * np.exp(-(d / 0.42) ** 2))[:, :, None]

    # Staub und Schlieren auf der Optik — verrät ein echtes Gerät
    for _ in range(9):
        px, py = rng.random(), rng.random()
        r = 0.002 + rng.random() * 0.005
        fleck = maske_ellipse(h, w, px, py, r, r * (0.6 + rng.random()),
                              rng.random() * 180, weichheit=w * 0.004)
        bild *= (1.0 - fleck * (0.10 + rng.random() * 0.20))[:, :, None]
    schliere = weich(rauschen(rng, h, w, 260, oktaven=2), w * 0.02)
    bild *= (0.97 + 0.06 * schliere)[:, :, None]

    return kamera(bild, rng, belichtung=0.94, waerme=0.02,
                  schatten_kuehle=0.04, saettigung=1.00,
                  vignette_staerke=0.26, korn=0.014,
                  aberration=0.0016, schulter=0.86)


# ==========================================================================
# 8 · Medien-Kacheln (quadratisch)
# ==========================================================================

def medien_gel(h, w, rng):
    """
    Gelelektrophorese unter UV: dunkler Grund, leuchtende Banden. Das
    kontrastreichste Bild des Satzes — Prüfstein dafür, ob helle Schrift
    neben einem sehr dunklen Foto noch als Text lesbar bleibt.
    """
    licht = Licht(90, waerme=-0.35)
    e = Ebene(h, w, unschaerfe=0.0, grundfarbe=farbe("#0B1410"))
    grundrauschen = rauschen(rng, h, w, 70, oktaven=5)
    e.bild *= (0.5 + 1.4 * grundrauschen)[:, :, None]

    spuren = 8
    for i in range(spuren):
        x = 0.075 + i * 0.108 + (rng.random() - 0.5) * 0.008
        # Taschen oben
        tasche = maske_rechteck(h, w, x - 0.036, 0.055, x + 0.036, 0.082,
                                weichheit=2.5)
        e.form(tasche * 0.6, farbe("#1D3328"), licht, woelbung=0.6)
        anzahl = 2 + int(rng.random() * 4)
        for k in range(anzahl):
            y = 0.16 + rng.random() * 0.72
            hell = 0.35 + rng.random() * 1.5
            bande = maske_ellipse(h, w, x, y, 0.040, 0.011 + rng.random() * 0.010,
                                  (rng.random() - 0.5) * 3.0, weichheit=w * 0.006)
            bande = kante_aufbrechen(bande, rng, 6.6, 40)
            e.bild += bande[:, :, None] * farbe("#8FE8A6")[None, None, :] * hell
            # Streulicht um die Bande — Lumineszenz strahlt in den Gelgrund
            e.bild += weich(bande, w * 0.020)[:, :, None] * \
                farbe("#4FBF77")[None, None, :] * hell * 0.35
        # Leiter links: viele feine Banden
        if i == 0:
            for k in range(11):
                y = 0.14 + k * 0.070
                bande = maske_ellipse(h, w, x, y, 0.038, 0.007,
                                      (rng.random() - 0.5) * 2.0, weichheit=w * 0.005)
                e.bild += bande[:, :, None] * farbe("#B7F0C4")[None, None, :] * \
                    (0.5 + 0.9 * (1 - k / 11.0))

    # Ungleichmäßige Anregung von unten links
    y, x = koordinaten(h, w)
    e.bild *= (0.65 + 0.75 * np.exp(-(((x - 0.42) ** 2 + (y - 0.62) ** 2) / 0.30)))[:, :, None]

    bild = e.bild
    return kamera(bild, rng, belichtung=1.05, waerme=-0.28,
                  schatten_kuehle=0.03, saettigung=1.05,
                  vignette_staerke=0.34, korn=0.030, schulter=0.72)


def medien_pipette(h, w, rng):
    """Nahaufnahme: Pipettenspitze über einer Mikrotiterplatte."""
    licht = Licht(135, waerme=-0.10)

    hg = Ebene(h, w, unschaerfe=w * 0.028, grundfarbe=farbe("#8A9096"))
    hg.bild *= (0.78 + 0.36 * rauschen(rng, h, w, 140, oktaven=4))[:, :, None]
    hg.bild += bokeh(h, w, rng, [(rng.random(), rng.random() * 0.6,
                                  0.4 + rng.random(), 0.3 + rng.random() * 0.7)
                                 for _ in range(8)], w * 0.05, 0.5,
                     farbe("#E4EBEE"))

    mg = Ebene(h, w, unschaerfe=w * 0.004)
    platte = kante_aufbrechen(
        maske_polygon(h, w, [(-0.06, 0.470), (1.06, 0.425),
                             (1.06, 1.06), (-0.06, 1.06)], weichheit=2.2),
        rng, 2.2, 180)
    mg.form(platte, farbe("#C6C9C4"), licht, woelbung=0.9, glanz=0.35,
            kontakt=0.4, kontakt_weite=w * 0.02)
    for r in range(5):
        for c in range(8):
            cx = 0.075 + c * 0.122 + r * 0.012
            cy = 0.545 + r * 0.108
            napf = maske_ellipse(h, w, cx, cy, 0.046 + r * 0.004,
                                 0.030 + r * 0.003, 0, weichheit=1.6)
            mg.form(napf, farbe("#A5A9A6"), licht, woelbung=1.4, glanz=0.5,
                    glanz_haerte=8)
            if (r * 8 + c) % 3 != 2:
                fl = maske_ellipse(h, w, cx, cy, 0.038 + r * 0.003,
                                   0.024 + r * 0.002, 0, weichheit=1.4)
                ton = [farbe("#B8A972"), farbe("#8296A2"), farbe("#A87F72"),
                       farbe("#8E9C82")][(r * 3 + c) % 4]
                mg.form(fl, ton, licht, woelbung=0.7, glanz=0.9, glanz_haerte=6)

    vg = Ebene(h, w, unschaerfe=w * 0.0012)
    koerper = maske_polygon(h, w, [(0.395, -0.06), (0.560, -0.06),
                                   (0.545, 0.375), (0.430, 0.375)],
                            weichheit=1.8)
    koerper = kante_aufbrechen(koerper, rng, 1.1, 120)
    vg.form(koerper, farbe("#3B4046"), licht, woelbung=1.4, glanz=0.9,
            glanz_haerte=8)
    griff = maske_rechteck(h, w, 0.400, 0.075, 0.560, 0.135, 0.015, weichheit=1.4)
    vg.form(griff, farbe("#6B7278"), licht, woelbung=1.3, glanz=0.8)
    spitze = maske_polygon(h, w, [(0.437, 0.372), (0.540, 0.372),
                                  (0.512, 0.660), (0.470, 0.660)], weichheit=1.4)
    spitze = kante_aufbrechen(spitze, rng, 1, 90)
    vg.form(spitze, farbe("#D3D8DB"), licht, woelbung=1.5, glanz=1.3,
            glanz_haerte=6, kontakt=0.5, kontakt_weite=w * 0.014,
            kontakt_weichheit=w * 0.012)
    tropfen = maske_ellipse(h, w, 0.492, 0.678, 0.019, 0.024, 0, weichheit=1.2)
    vg.form(tropfen, farbe("#9FBFCE"), licht, woelbung=1.8, glanz=1.9,
            glanz_haerte=4)

    bild = ebenen_stapeln([hg, mg, vg])
    bild = globales_licht(bild, licht, 0.24, (0.20, 0.18))
    return kamera(bild, rng, belichtung=1.0, waerme=-0.08,
                  schatten_kuehle=0.07, saettigung=0.94,
                  vignette_staerke=0.24, korn=0.017)


def medien_tafel(h, w, rng):
    """Tafelanschrieb aus der Nähe: Kreide, Wischspuren, Streiflicht."""
    licht = Licht(160, waerme=0.10)

    e = Ebene(h, w, unschaerfe=0.0, grundfarbe=farbe("#2C3A34"))
    schiefer = rauschen(rng, h, w, 55, oktaven=6)
    e.bild *= (0.72 + 0.55 * schiefer)[:, :, None]
    # Wischspuren: breite, weiche Bögen aus altem Kreidestaub
    for _ in range(7):
        y0 = rng.random()
        spur = maske_strich(h, w, [(-0.1, y0), (0.4, y0 + (rng.random() - 0.5) * 0.16),
                                   (1.1, y0 + (rng.random() - 0.5) * 0.2)],
                            0.06 + rng.random() * 0.09, weichheit=w * 0.020)
        e.bild += (spur * (0.05 + rng.random() * 0.09))[:, :, None] * \
            farbe("#B9C4BC")[None, None, :]

    kreide = farbe("#D5DCD4")
    # Zellschema mittig, absichtlich schief
    zelle = maske_ellipse(h, w, 0.400, 0.470, 0.240, 0.290, 11, weichheit=2.2)
    zelle = np.clip(zelle - maske_ellipse(h, w, 0.400, 0.470, 0.222, 0.268, 11,
                                          weichheit=2.6), 0, 1)
    zelle = kante_aufbrechen(zelle, rng, 11, 30)
    e.form(zelle * 0.88, kreide, licht, woelbung=0.0)
    kern = maske_ellipse(h, w, 0.435, 0.520, 0.088, 0.100, -16, weichheit=2.0)
    kern = np.clip(kern - maske_ellipse(h, w, 0.435, 0.520, 0.070, 0.080, -16,
                                        weichheit=2.4), 0, 1)
    e.form(kern * 0.85, kreide, licht, woelbung=0.0)
    for _ in range(9):
        a = rng.random() * 2 * math.pi
        r = 0.10 + rng.random() * 0.10
        org = maske_ellipse(h, w, 0.400 + math.cos(a) * r,
                            0.470 + math.sin(a) * r * 1.2,
                            0.016 + rng.random() * 0.014,
                            0.010 + rng.random() * 0.012,
                            rng.random() * 180, weichheit=1.8)
        e.form(org * 0.7, kreide, licht, woelbung=0.0)
    # Pfeile und Beschriftungszeilen rechts
    for i in range(5):
        y0 = 0.180 + i * 0.150
        pfeil = maske_strich(h, w, [(0.640, y0), (0.720, y0 - 0.020)],
                             0.008, weichheit=1.5)
        e.form(pfeil * 0.8, kreide, licht, woelbung=0.0)
        for k in range(2):
            laenge = 0.06 + rng.random() * 0.14
            z = maske_strich(h, w, [(0.745, y0 - 0.024 + k * 0.042),
                                    (0.745 + laenge, y0 - 0.030 + k * 0.042)],
                             0.010, weichheit=1.6)
            e.form(z * (0.5 + rng.random() * 0.35), kreide, licht, woelbung=0.0)

    # Streiflicht von links — Kreide glitzert schräg
    y, x = koordinaten(h, w)
    e.bild *= (1.0 + 0.45 * np.exp(-((x - 0.05) ** 2) / 0.30))[:, :, None]

    return kamera(e.bild, rng, belichtung=1.0, waerme=0.08,
                  schatten_kuehle=0.05, saettigung=0.86,
                  vignette_staerke=0.28, korn=0.021)


def medien_notizseite(h, w, rng):
    """Abfotografierte Notizseite mit Handschrift, schräges Fensterlicht."""
    licht = Licht(150, waerme=0.28)

    hg = Ebene(h, w, unschaerfe=w * 0.018, grundfarbe=farbe("#6A6255"))
    hg.bild *= (0.75 + 0.5 * rauschen(rng, h, w, 120, oktaven=4))[:, :, None]

    vg = Ebene(h, w, unschaerfe=w * 0.0012)
    seite = kante_aufbrechen(maske_polygon(h, w, [
        (0.030, 0.055), (0.955, 0.020), (0.985, 0.965), (0.055, 1.005)],
        weichheit=2.0), rng, 0.005, 160)
    faser = rauschen(rng, h, w, 16, oktaven=6)
    vg.form(seite, farbe("#E3DBC9"), licht, textur=faser, textur_staerke=0.11,
            woelbung=1.0, glanz=0.18, kontakt=0.6, kontakt_weite=w * 0.020,
            kontakt_weichheit=w * 0.022)
    # Papier ist nie plan — leichte Wölbung als sanfte Helligkeitswelle
    y, x = koordinaten(h, w)
    welle = np.sin(x * 7.0 + y * 2.0) * 0.5 + np.sin(y * 4.3) * 0.5
    vg.bild *= (1.0 + welle * seite * 0.045)[:, :, None]

    tinte = farbe("#2B3550")
    # Überschrift
    ueber = maske_strich(h, w, [(0.100, 0.135), (0.520, 0.122)], 0.016, weichheit=1.4)
    vg.form(ueber * seite * 0.85, tinte, licht, woelbung=0.0)
    # Handschriftzeilen als leicht welliger Streckenzug
    t = 0.215
    i = 0
    while t < 0.94:
        laenge = 0.42 + rng.random() * 0.42
        if i % 6 == 5:
            laenge *= 0.45
        punkte = []
        n = 22
        for k in range(n + 1):
            px = 0.100 + laenge * k / n
            py = t + math.sin(k * 1.9 + i) * 0.0055 + (rng.random() - 0.5) * 0.003
            punkte.append((px, py))
        zeile = maske_strich(h, w, punkte, 0.0055, weichheit=1.2)
        vg.form(zeile * seite * (0.55 + rng.random() * 0.30), tinte, licht,
                woelbung=0.0)
        t += 0.058
        i += 1
    # Zwei Unterstreichungen und ein Randstrich
    for a, b, br in (((0.100, 0.163), (0.470, 0.157), 0.006),
                     ((0.100, 0.510), (0.400, 0.504), 0.005)):
        u = maske_strich(h, w, [a, b], br, weichheit=1.2)
        vg.form(u * seite * 0.8, tinte, licht, woelbung=0.0)
    rand = maske_strich(h, w, [(0.885, 0.300), (0.892, 0.560)], 0.006, weichheit=1.3)
    vg.form(rand * seite * 0.7, farbe("#8A5535"), licht, woelbung=0.0)

    bild = ebenen_stapeln([hg, vg])
    bild = globales_licht(bild, licht, 0.30, (0.14, 0.12))
    bild = punktlicht(bild, licht, 0.10, 0.10, 0.60, 0.13, farbe("#FFE8C8"))
    return kamera(bild, rng, belichtung=1.02, waerme=0.26,
                  schatten_kuehle=0.06, saettigung=0.92,
                  vignette_staerke=0.24, korn=0.016)


# ==========================================================================
# 9 · Notizbuch-Cover — Papiercharakter, nicht Farbe
# ==========================================================================
#
# Zwölf Untergründe, die NEBENEINANDER unterscheidbar sein müssen, ohne die
# Farbdisziplin zu brechen. Der Unterschied kommt aus der Struktur und dem
# Papierton, nicht aus Buntheit: alle Töne liegen unter 22 % Sättigung.
#
# Eine zweite, härtere Schranke kommt aus der Messung (probe.html §6): Der
# Notizbuch-Titel steht in Ink AUF dem Deckel. Ein Papier, das diesen Titel
# nicht mit mindestens 4,5:1 trägt, ist kein zulässiges Deckelpapier — auch
# nicht, wenn es schön aussieht. `kraft-graubraun` lag zuerst bei 4,29:1 und
# ist deshalb aufgehellt worden. Die Grenze liegt bei etwa L* 60; darunter
# muss der Titel unter das Bild wandern, so wie bei den Medien-Kacheln.
#
# Papier wird hier nicht gemalt, sondern beleuchtet: jede Sorte liefert ein
# Höhenfeld, aus dessen Gradient eine Flächennormale entsteht. Das Licht
# fällt bei allen zwölf aus derselben Richtung (links oben, 145°) — so wirkt
# das Regal wie ein Regal und nicht wie eine Sammlung von Mustern.

LICHT_COVER = Licht(145, waerme=0.10)


def _papier_beleuchten(hoehe, licht, staerke=1.0, relief=1.0):
    """
    Höhenfeld → Beleuchtungsfaktor. Der Kern aller Cover.

    Entscheidend ist der MASSSTAB, und daran ist der erste Versuch
    gescheitert: Papierstruktur ist wenige hundertstel Millimeter hoch.
    Behandelt man das Höhenfeld wie ein Gebirge — Normale aus dem Gradienten
    mal sechzig —, entsteht eine Reliefkarte. Die zwölf Cover sahen dann aus
    wie Satellitenaufnahmen von Dünen, nicht wie Papier: die Struktur fraß
    den Papierton vollständig auf.

    Deshalb wird die Steigung hier zuerst an ihrer eigenen mittleren Größe
    normiert und der Ausschlag danach hart auf wenige Prozent Helligkeit
    begrenzt. Struktur soll man SEHEN, nicht ertasten.
    """
    gy, gx = np.gradient(hoehe.astype(np.float32))
    d = gx * licht.x + gy * licht.y
    bezug = float(np.abs(d).mean()) * 3.0 + 1e-6
    return 1.0 + np.clip(d / bezug, -1.6, 1.6) * (0.075 * staerke * relief)


def _cover_abschluss(bild, rng, korn=0.012, vignette_staerke=0.13,
                     waerme=0.06, saettigung=0.92):
    """
    Gemeinsamer Abschluss aller Cover: leichte Randabdunklung (das Buch
    liegt in einem Regal), Objektiv-Weichheit, Korn. Kein Bokeh, keine
    starke Aberration — ein Buchdeckel wird flach fotografiert.
    """
    return kamera(bild, rng, belichtung=1.0, waerme=waerme,
                  schatten_kuehle=0.045, saettigung=saettigung,
                  vignette_staerke=vignette_staerke, korn=korn,
                  objektiv=0.35, aberration=0.0004, schulter=0.92)


def _cover_grund(h, w, ton, rng, unruhe=0.06, skala=260):
    """Grundton mit sanfter Fleckigkeit — Papier ist nie gleichmäßig."""
    e = np.ones((h, w, 3), dtype=np.float32) * farbe(ton)[None, None, :]
    mottle = rauschen(rng, h, w, skala, oktaven=4)
    return e * (1.0 - unruhe * 0.5 + unruhe * mottle)[:, :, None]


def _cover_kanten(bild, h, w, rng, staerke=0.10):
    """Der Deckel hat einen leicht dunkleren, unregelmäßigen Rand."""
    innen = maske_rechteck(h, w, 0.012, 0.009, 0.988, 0.991, 0.010,
                           weichheit=w * 0.012)
    innen = kante_aufbrechen(innen, rng, 1.8, 140)
    return bild * (1.0 - (1.0 - innen) * staerke)[:, :, None]


def cover_faser(h, w, rng, ton, dichte=1.0, kontrast=1.0):
    """
    Faserpapier: lange, gerichtete Zellulosefasern dicht unter der
    Oberfläche, dazu einzelne längere Fasern, die obenauf liegen.
    """
    hoehe = rauschen(rng, h, w, 26, oktaven=6, dehnung=6.0 * dichte) * 0.65
    hoehe += rauschen(rng, h, w, 8, oktaven=4, dehnung=0.35) * 0.35
    # ein paar einzelne, sichtbare Fasern
    einzeln = np.zeros((h, w), dtype=np.float32)
    for _ in range(int(70 * dichte)):
        x0, y0 = rng.random(), rng.random()
        laenge = 0.03 + rng.random() * 0.14
        winkel = rng.random() * math.pi
        punkte = [(x0, y0),
                  (x0 + math.cos(winkel) * laenge * 0.5 + (rng.random() - .5) * 0.02,
                   y0 + math.sin(winkel) * laenge * 0.5 * (w / h) + (rng.random() - .5) * 0.02),
                  (x0 + math.cos(winkel) * laenge,
                   y0 + math.sin(winkel) * laenge * (w / h))]
        einzeln += maske_strich(h, w, punkte, 0.0016 + rng.random() * 0.0018,
                                weichheit=0.8)
    hoehe = normiere(hoehe + np.clip(einzeln, 0, 1) * 0.16, 0.0, 1.0)

    bild = _cover_grund(h, w, ton, rng, unruhe=0.07)
    bild *= _papier_beleuchten(hoehe, LICHT_COVER, 0.9 * kontrast, 1.0)[:, :, None]
    bild = _cover_kanten(bild, h, w, rng)
    return _cover_abschluss(bild, rng)


def cover_leinen(h, w, rng, ton, feinheit=1.0):
    """
    Leinenbezug: gewebte Kett- und Schussfäden. Beide Fadenscharen werden
    einzeln als Höhenfeld erzeugt und mit einem Versatz überlagert, damit
    eine echte Bindung entsteht — abwechselnd liegt mal der eine, mal der
    andere Faden oben.
    """
    y, x = koordinaten(h, w)
    fx = 165.0 * feinheit
    fy = fx * (h / w) * 0.98            # nie exakt gleich → keine Symmetrie
    jitter_x = (rauschen(rng, h, w, 90, oktaven=3) - 0.5) * 0.6
    jitter_y = (rauschen(rng, h, w, 90, oktaven=3) - 0.5) * 0.6
    kette = np.abs(np.sin(x * fx * math.pi + jitter_x))
    schuss = np.abs(np.sin(y * fy * math.pi + jitter_y))
    # Bindung: Schachbrett entscheidet, welcher Faden oben liegt
    schach = (np.sin(x * fx * math.pi) * np.sin(y * fy * math.pi)) > 0
    hoehe = np.where(schach, kette * 0.85 + schuss * 0.25,
                     schuss * 0.85 + kette * 0.25)
    hoehe = hoehe * 0.72 + rauschen(rng, h, w, 40, oktaven=5) * 0.28
    hoehe = normiere(hoehe, 0.0, 1.0)

    bild = _cover_grund(h, w, ton, rng, unruhe=0.08, skala=200)
    bild *= _papier_beleuchten(hoehe, LICHT_COVER, 1.9, 1.0)[:, :, None]
    # Dickstellen im Garn — ungleichmäßige Schattierung über die Fläche
    bild *= (0.965 + 0.07 * rauschen(rng, h, w, 120, oktaven=4))[:, :, None]
    bild = _cover_kanten(bild, h, w, rng, 0.12)
    return _cover_abschluss(bild, rng, korn=0.013)


def cover_kraft(h, w, rng, ton, einschluesse=1.0):
    """
    Kraftpapier: grober, kurzfasriger Zellstoff mit sichtbaren dunklen
    Holzeinschlüssen und einer leicht rauen, wolkigen Oberfläche.
    """
    hoehe = rauschen(rng, h, w, 7, oktaven=5, dehnung=1.6) * 0.65
    hoehe += rauschen(rng, h, w, 40, oktaven=4) * 0.35
    hoehe = normiere(hoehe, 0.0, 1.0)

    bild = _cover_grund(h, w, ton, rng, unruhe=0.10, skala=150)
    bild *= _papier_beleuchten(hoehe, LICHT_COVER, 1.5, 1.2)[:, :, None]

    # Einschlüsse: dunkle Splitter und helle Flusen
    for _ in range(int(120 * einschluesse)):
        px, py = rng.random(), rng.random()
        laenge = 0.004 + rng.random() * 0.020
        winkel = rng.random() * math.pi
        fleck = maske_strich(h, w, [
            (px, py),
            (px + math.cos(winkel) * laenge, py + math.sin(winkel) * laenge * (w / h))],
            0.0016 + rng.random() * 0.002, weichheit=0.9)
        dunkel = rng.random() < 0.72
        f = 1.0 - fleck * (0.13 + rng.random() * 0.17) if dunkel else \
            1.0 + fleck * (0.09 + rng.random() * 0.13)
        bild *= f[:, :, None]
    bild = _cover_kanten(bild, h, w, rng, 0.14)
    # Kraftpapier ist von Natur aus der bunteste Ton der zwölf. Damit es die
    # Farbdisziplin nicht bricht, wird es stärker entsättigt als die anderen —
    # der Charakter soll aus der Faser kommen, nicht aus dem Braun.
    return _cover_abschluss(bild, rng, korn=0.016, saettigung=0.78)


def cover_marmoriert(h, w, rng, ton, ader_ton, staerke=1.0):
    """
    Marmorpapier. Die Adern entstehen nicht aus einer Zeichnung, sondern
    aus Domänenverzerrung: ein Streifenmuster wird mit tieffrequentem
    Rauschen verzogen, bis es fließt. Das ergibt Verläufe, die nie
    zweimal gleich sind und keine erkennbare Achse haben.
    """
    y, x = koordinaten(h, w)
    # Zwei Stufen Domänenverzerrung. Mit nur einer entstehen gleichmäßige
    # Wurmlinien — die erste Fassung sah aus wie ein Ölfilm auf Wasser.
    # Erst die zweite, gröbere Verzerrung bringt die großen Schwünge, die
    # ein gezogener Marmor hat: Bereiche mit dichten Adern wechseln sich
    # mit fast leeren Feldern ab.
    gross_x = (rauschen(rng, h, w, 420, oktaven=3) - 0.5) * 2.0
    gross_y = (rauschen(rng, h, w, 420, oktaven=3) - 0.5) * 2.0
    warp_x = (rauschen(rng, h, w, 150, oktaven=5) - 0.5) * 2.0
    warp_y = (rauschen(rng, h, w, 150, oktaven=5) - 0.5) * 2.0
    # Die Adern müssen GROSS sein. Im Regal steht der Deckel 168 pt breit,
    # das Bild ist 560 px breit — beim Verkleinern um mehr als das Dreifache
    # wird ein feines Adernmuster zu Moiré, und der Deckel sieht aus wie ein
    # Ölfilm auf Wasser statt wie gezogener Marmor. Die Frequenz ist deshalb
    # so gewählt, dass eine Ader auf dem verkleinerten Deckel noch mehrere
    # Punkte breit ist.
    u = (x * 0.95 + y * 0.32
         + gross_x * 1.5 + warp_x * 0.42
         + gross_y * 0.6)
    adern = np.abs(np.sin(u * math.pi * 0.80 + warp_y * 0.30))
    adern = np.power(adern, 5.5)
    # Dichteschwankung: nicht überall gleich viele Adern
    dichte = sanft((rauschen(rng, h, w, 260, oktaven=3) - 0.34) * 3.2)
    adern = adern * (0.30 + 0.85 * dichte)
    adern = weich(adern, 1.1)

    grund_hoehe = rauschen(rng, h, w, 30, oktaven=6) * 0.7 + adern * 0.3
    bild = _cover_grund(h, w, ton, rng, unruhe=0.07, skala=220)
    aderfarbe = farbe(ader_ton)
    mischung = np.clip(adern * staerke, 0, 1)[:, :, None]
    bild = bild * (1 - mischung * 0.62) + aderfarbe[None, None, :] * mischung * 0.62
    bild *= _papier_beleuchten(grund_hoehe, LICHT_COVER, 0.7, 0.9)[:, :, None]
    bild = _cover_kanten(bild, h, w, rng, 0.11)
    return _cover_abschluss(bild, rng, korn=0.012, saettigung=0.86)


def cover_buetten(h, w, rng, ton, linien=1.0):
    """
    Geripptes Büttenpapier: enge Rippenlinien vom Sieb (Vergé) und weit
    auseinanderliegende Kettlinien quer dazu, dazu die typische wolkige
    Blattbildung, die man gegen das Licht sieht.
    """
    y, x = koordinaten(h, w)
    wolke = rauschen(rng, h, w, 55, oktaven=5)
    verzug = (rauschen(rng, h, w, 300, oktaven=2) - 0.5) * 0.35
    rippen = np.sin((y + verzug * 0.02) * 300.0 * linien * math.pi) * 0.5 + 0.5
    ketten = np.sin((x + verzug * 0.03) * 11.0 * math.pi) * 0.5 + 0.5
    ketten = np.power(ketten, 6.0)
    hoehe = wolke * 0.30 + rippen * 0.55 + ketten * 0.15
    hoehe = normiere(hoehe, 0.0, 1.0)

    bild = _cover_grund(h, w, ton, rng, unruhe=0.09, skala=170)
    # Blattbildung: dünnere Stellen wirken heller (Durchlicht-Anmutung)
    bild *= (0.955 + 0.09 * wolke)[:, :, None]
    bild *= _papier_beleuchten(hoehe, LICHT_COVER, 1.7, 1.0)[:, :, None]
    bild = _cover_kanten(bild, h, w, rng, 0.13)
    return _cover_abschluss(bild, rng, korn=0.013)


def cover_millimeter(h, w, rng, ton, gitterton, deckung=1.0):
    """
    Millimeterpapier, sehr blass. Der Druck sitzt IN der Faser, nicht
    darauf: die Linien werden minimal weichgezeichnet und von der
    Papierstruktur moduliert — sonst sähe es aus wie eine CSS-Kachel, und
    genau das soll es nicht.
    """
    y, x = koordinaten(h, w)
    schritt = w / 56.0                       # ≈ 1 mm bei 560 px Breite
    px = np.arange(w, dtype=np.float32)[None, :] + (rauschen(rng, h, w, 400, 2) - 0.5) * 1.2
    py = np.arange(h, dtype=np.float32)[:, None] + (rauschen(rng, h, w, 400, 2) - 0.5) * 1.2

    def linien(koord, teilung, breite):
        rest = np.abs(((koord / teilung) % 1.0) - 0.0)
        rest = np.minimum(rest, 1.0 - rest) * teilung
        return sanft(1.0 - rest / breite)

    fein = np.maximum(linien(px, schritt, 0.65), linien(py, schritt, 0.65)) * 0.34
    mittel = np.maximum(linien(px, schritt * 5, 0.85), linien(py, schritt * 5, 0.85)) * 0.62
    grob = np.maximum(linien(px, schritt * 10, 1.15), linien(py, schritt * 10, 1.15)) * 1.0
    gitter = np.clip(np.maximum(np.maximum(fein, mittel), grob), 0, 1)
    gitter = weich(gitter, 0.55) * deckung

    hoehe = rauschen(rng, h, w, 22, oktaven=6, dehnung=3.0)
    bild = _cover_grund(h, w, ton, rng, unruhe=0.05, skala=240)
    # Tinte wird von der Faser unterschiedlich aufgenommen
    aufnahme = 0.75 + 0.5 * rauschen(rng, h, w, 18, oktaven=5)
    g = np.clip(gitter * aufnahme, 0, 1)[:, :, None]
    bild = bild * (1 - g) + farbe(gitterton)[None, None, :] * g
    bild *= _papier_beleuchten(hoehe, LICHT_COVER, 0.7, 0.7)[:, :, None]
    bild = _cover_kanten(bild, h, w, rng, 0.10)
    return _cover_abschluss(bild, rng, korn=0.011, saettigung=0.88)


# ==========================================================================
# 10 · Der Katalog — was erzeugt wird
# ==========================================================================

JOURNAL = [
    ("labor",         journal_labor,        1200, 800),
    ("mikroskop",     journal_mikroskop,    1200, 800),
    ("hoersaal",      journal_hoersaal,     1200, 800),
    ("schreibtisch",  journal_schreibtisch, 1200, 800),
    ("herbstweg",     journal_herbstweg,    1200, 800),
    ("kaffee",        journal_kaffee,       1200, 800),
]

# Ein siebtes Motiv, das die Reihe um eine mittelhelle Szene ergänzt.
# Es wird als Medien-Kachel und in der Probe verwendet, nicht als
# Journal-Foto — die sechs geforderten Journal-Bilder stehen oben.
ZUSATZ = [("seminarraum", journal_seminarraum, 1200, 800)]

MEDIEN = [
    ("gel",        medien_gel),
    ("pipette",    medien_pipette),
    ("tafel",      medien_tafel),
    ("notizseite", medien_notizseite),
]

# (Dateiname, Funktion, Argumente) — Ton-Werte bewusst gedeckt gewählt.
COVER = [
    ("faser-alabaster",  cover_faser,       dict(ton="#E9E6DF", dichte=1.0, kontrast=1.0)),
    ("faser-hanf",       cover_faser,       dict(ton="#D6CEBC", dichte=1.5, kontrast=1.25)),
    ("leinen-nebel",     cover_leinen,      dict(ton="#D3D4D1", feinheit=1.0)),
    ("leinen-sand",      cover_leinen,      dict(ton="#CBBFA9", feinheit=0.72)),
    ("kraft-natur",      cover_kraft,       dict(ton="#AE9A7E", einschluesse=1.0)),
    ("kraft-graubraun",  cover_kraft,       dict(ton="#9E9689", einschluesse=1.4)),
    ("marmor-schiefer",  cover_marmoriert,  dict(ton="#D9D8D4", ader_ton="#7C8085", staerke=1.0)),
    ("marmor-tinte",     cover_marmoriert,  dict(ton="#C3C6C9", ader_ton="#4E555E", staerke=0.85)),
    ("buetten-elfenbein", cover_buetten,    dict(ton="#EDE7D8", linien=1.0)),
    ("buetten-taupe",    cover_buetten,     dict(ton="#B8AFA2", linien=0.72)),
    ("millimeter-blass", cover_millimeter,  dict(ton="#F1EFE9", gitterton="#9AA6A2", deckung=0.75)),
    ("millimeter-stein", cover_millimeter,  dict(ton="#DCDAD3", gitterton="#7E8A93", deckung=1.0)),
]


# ==========================================================================
# 11 · Ablauf
# ==========================================================================

def erzeuge(gruppen):
    t0 = time.time()

    if "journal" in gruppen:
        for name, fn, breite, hoehe in JOURNAL:
            rng = np.random.default_rng(startwert("journal/" + name))
            print(f"  journal/{name} …", flush=True)
            bild = fn(hoehe, breite, rng)
            speichern(bild, "journal", name, [1200, 400])

    if "zusatz" in gruppen:
        for name, fn, breite, hoehe in ZUSATZ:
            rng = np.random.default_rng(startwert("journal/" + name))
            print(f"  journal/{name} …", flush=True)
            bild = fn(hoehe, breite, rng)
            speichern(bild, "journal", name, [1200, 400])

    if "medien" in gruppen:
        for name, fn in MEDIEN:
            rng = np.random.default_rng(startwert("medien/" + name))
            print(f"  medien/{name} …", flush=True)
            bild = fn(600, 600, rng)
            speichern(bild, "medien", name, [600])

    if "lernkarten" in gruppen:
        rng = np.random.default_rng(startwert("lernkarten/zellbiologie"))
        print("  lernkarten/zellbiologie …", flush=True)
        bild = mikroskopie(600, 900, rng)
        speichern(bild, "lernkarten", "zellbiologie", [900])

    if "cover" in gruppen:
        for name, fn, kw in COVER:
            rng = np.random.default_rng(startwert("cover/" + name))
            print(f"  cover/{name} …", flush=True)
            bild = fn(760, 560, rng, **kw)
            speichern(bild, "cover", name, [560])

    gesamt = sum(g for _, g in _ERZEUGT)
    print()
    for pfad, groesse in sorted(_ERZEUGT):
        print(f"  {groesse/1024:8.1f} kB  {pfad}")
    print(f"\n  {len(_ERZEUGT)} Dateien · {gesamt/1024/1024:.2f} MB · "
          f"{time.time()-t0:.1f} s")
    if gesamt > 6 * 1024 * 1024:
        print("  ACHTUNG: über 6 MB — Qualität oder Korn senken.")
    return gesamt


def main():
    p = argparse.ArgumentParser(description="Erzeugt Velums Bildmaterial.")
    p.add_argument("--nur", default="alle",
                   help="journal · zusatz · medien · lernkarten · cover · alle")
    args = p.parse_args()
    alle = ["journal", "zusatz", "medien", "lernkarten", "cover"]
    gruppen = alle if args.nur == "alle" else args.nur.split(",")
    os.makedirs(ZIEL, exist_ok=True)
    print(f"Ziel: {ZIEL}\n")
    erzeuge(gruppen)


if __name__ == "__main__":
    main()
