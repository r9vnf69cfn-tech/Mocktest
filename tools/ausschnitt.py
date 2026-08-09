#!/usr/bin/env python3
"""ausschnitt.py — schneidet einen Ausschnitt aus einem Render und vergrößert ihn.

  python3 tools/ausschnitt.py <bild> <x> <y> <b> <h> <ziel> [zoom]

Die Koordinaten sind die des Bildes selbst (nicht der Anzeige). Wozu: die
Renders sind 2388 px breit; ein 6-pt-Punkt ist darin 12 px groß und im
angezeigten Bild nicht mehr zu beurteilen. Der Ausschnitt macht ihn prüfbar.
"""
import sys
from PIL import Image

def main():
    if len(sys.argv) < 7:
        print(__doc__); sys.exit(1)
    src, x, y, w, h, ziel = sys.argv[1:7]
    zoom = float(sys.argv[7]) if len(sys.argv) > 7 else 3.0
    x, y, w, h = int(x), int(y), int(w), int(h)
    im = Image.open(src).convert('RGB')
    x2, y2 = min(x + w, im.width), min(y + h, im.height)
    aus = im.crop((max(0, x), max(0, y), x2, y2))
    aus = aus.resize((int(aus.width * zoom), int(aus.height * zoom)), Image.LANCZOS)
    aus.save(ziel)
    print(f'{ziel}  {aus.width}×{aus.height}  aus {src} ({im.width}×{im.height})')

if __name__ == '__main__':
    main()
