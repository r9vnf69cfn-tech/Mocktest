/* handschrift.js — eine Schrift aus Strichen, nicht aus Buchstaben.
 *
 * Warum das nötig ist: der Renderer bildet 'markerfelt' auf
 * "Marker Felt", "Comic Sans MS", "Segoe Print", cursive ab. Auf dem Rechner,
 * der den Film rechnet, ist keine davon installiert — cursive landet bei
 * DejaVu Serif. Auf dem Vorlesungsblatt stünde dann eine Times.
 *
 * Eine Zeitung setzt man in Times. Eine Vorlesungsmitschrift nicht. Und ein
 * Film über eine App, deren ganzer Sinn die Handschrift ist, darf an der
 * Stelle nicht schummeln. Also wird wirklich geschrieben: jeder Buchstabe
 * ist ein Zug oder zwei, und die Züge gehen als STROKE-Objekte ins Board —
 * dieselbe Sorte Objekt, die ein Stift erzeugt. Zoom, Radierer, Lasso und
 * der Dunkelmodus greifen darauf, weil es nichts anderes ist als Tinte.
 *
 * Das Koordinatennetz je Zeichen:
 *
 *      y = -0.76   Oberlänge (b d f h k l t · Versalien)
 *      y = -0.50   x-Höhe
 *      y =  0.00   Grundlinie
 *      y = +0.24   Unterlänge (g j p q y)
 *
 * x läuft von 0 bis zur Dickte des Zeichens. Alles in Vielfachen der
 * Schriftgröße, damit ein Zug bei 18 pt so aussieht wie bei 30 pt.
 */
(function (global) {
  'use strict';

  /* Ein Bogen als Streckenzug — die Schrift kennt nur gerade Stücke, die
     dicht genug liegen, dass das Auge eine Rundung sieht. */
  function bogen(cx, cy, rx, ry, von, bis, n) {
    var p = [], m = n || 9;
    for (var i = 0; i <= m; i++) {
      var a = von + (bis - von) * (i / m);
      p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return p;
  }
  var PI = Math.PI;

  /* Jedes Zeichen: { w: Dickte, z: [ Zug, Zug, … ] } */
  var G = {
    a: { w: .56, z: [bogen(.28, -.25, .24, .25, -.5 * PI, 1.35 * PI, 13), [[.52, -.5], [.52, 0]]] },
    b: { w: .56, z: [[[.05, -.76], [.05, 0]], bogen(.30, -.25, .25, .25, -1.35 * PI, .5 * PI, 12)] },
    c: { w: .52, z: [bogen(.27, -.25, .23, .25, .30 * PI, 1.70 * PI, 12)] },
    d: { w: .56, z: [bogen(.26, -.25, .23, .25, -.5 * PI, 1.5 * PI, 13), [[.51, -.76], [.51, 0]]] },
    e: { w: .52, z: [[[.05, -.27], [.49, -.28]], bogen(.27, -.25, .23, .25, 2 * PI, .30 * PI, 13)] },
    f: { w: .40, z: [bogen(.30, -.62, .17, .16, .1 * PI, 1.3 * PI, 8).concat([[.15, -.5], [.13, 0]]), [[.01, -.44], [.37, -.47]]] },
    g: { w: .56, z: [bogen(.28, -.25, .24, .25, -.5 * PI, 1.35 * PI, 13), [[.52, -.5], [.52, .12]].concat(bogen(.30, .12, .22, .14, 0, PI, 7))] },
    h: { w: .56, z: [[[.05, -.76], [.05, 0]], bogen(.29, -.28, .24, .22, PI, 2 * PI, 8).concat([[.53, -.28], [.53, 0]])] },
    i: { w: .24, z: [[[.11, -.5], [.11, 0]], [[.11, -.68], [.11, -.63]]] },
    j: { w: .26, z: [[[.14, -.5], [.14, .10]].concat(bogen(-.02, .10, .16, .13, 0, PI, 7)), [[.14, -.68], [.14, -.63]]] },
    k: { w: .52, z: [[[.05, -.76], [.05, 0]], [[.47, -.5], [.06, -.16]], [[.19, -.27], [.48, 0]]] },
    l: { w: .24, z: [[[.11, -.76], [.11, 0]]] },
    m: { w: .84, z: [[[.05, -.5], [.05, 0]], bogen(.26, -.29, .21, .21, PI, 2 * PI, 8).concat([[.47, -.29], [.47, 0]]), bogen(.68, -.29, .21, .21, PI, 2 * PI, 8).concat([[.89, -.29], [.89, 0]])] },
    n: { w: .56, z: [[[.05, -.5], [.05, 0]], bogen(.29, -.29, .24, .21, PI, 2 * PI, 8).concat([[.53, -.29], [.53, 0]])] },
    o: { w: .56, z: [bogen(.28, -.25, .24, .25, -.5 * PI, 1.5 * PI, 14)] },
    p: { w: .56, z: [[[.05, -.5], [.05, .24]], bogen(.30, -.25, .25, .25, -1.35 * PI, .5 * PI, 12)] },
    q: { w: .56, z: [bogen(.28, -.25, .24, .25, -.5 * PI, 1.35 * PI, 13), [[.52, -.5], [.52, .24]]] },
    r: { w: .40, z: [[[.05, -.5], [.05, 0]], bogen(.24, -.30, .19, .20, PI, 1.55 * PI, 6)] },
    s: { w: .46, z: [[[.41, -.44], [.30, -.51], [.17, -.47], [.14, -.38], [.21, -.31],
                      [.33, -.26], [.38, -.17], [.33, -.05], [.19, -.01], [.06, -.07]]] },
    t: { w: .38, z: [[[.16, -.70], [.16, -.10]].concat(bogen(.27, -.10, .12, .10, PI, 1.7 * PI, 5)), [[.01, -.50], [.35, -.52]]] },
    u: { w: .56, z: [[[.05, -.5], [.05, -.20]].concat(bogen(.29, -.20, .24, .21, PI, 0, 8)), [[.53, -.5], [.53, 0]]] },
    v: { w: .52, z: [[[.03, -.5], [.26, 0], [.50, -.5]]] },
    w: { w: .80, z: [[[.03, -.5], [.21, 0], [.40, -.40], [.59, 0], [.78, -.5]]] },
    x: { w: .50, z: [[[.04, -.5], [.47, 0]], [[.47, -.5], [.04, 0]]] },
    y: { w: .52, z: [[[.03, -.5], [.27, 0]], [[.51, -.5], [.16, .24]]] },
    z: { w: .48, z: [[[.04, -.5], [.45, -.5], [.05, 0], [.46, 0]]] },

    A: { w: .64, z: [[[.02, 0], [.32, -.76], [.62, 0]], [[.14, -.24], [.50, -.24]]] },
    B: { w: .58, z: [[[.06, 0], [.06, -.76], [.36, -.76]].concat(bogen(.36, -.58, .20, .18, -.5 * PI, .5 * PI, 7)).concat([[.06, -.40]]), [[.06, -.40], [.38, -.40]].concat(bogen(.38, -.20, .22, .20, -.5 * PI, .5 * PI, 7)).concat([[.06, 0]])] },
    C: { w: .62, z: [bogen(.33, -.38, .28, .38, .28 * PI, 1.72 * PI, 14)] },
    D: { w: .62, z: [[[.06, 0], [.06, -.76], [.28, -.76]].concat(bogen(.28, -.38, .32, .38, -.5 * PI, .5 * PI, 10)).concat([[.06, 0]])] },
    E: { w: .54, z: [[[.50, -.76], [.07, -.76], [.07, 0], [.50, 0]], [[.07, -.40], [.42, -.40]]] },
    F: { w: .52, z: [[[.48, -.76], [.07, -.76], [.07, 0]], [[.07, -.40], [.40, -.40]]] },
    G: { w: .66, z: [bogen(.34, -.38, .29, .38, .28 * PI, 1.72 * PI, 14), [[.63, -.44], [.63, -.30], [.42, -.31]]] },
    H: { w: .62, z: [[[.06, -.76], [.06, 0]], [[.56, -.76], [.56, 0]], [[.06, -.40], [.56, -.40]]] },
    I: { w: .24, z: [[[.11, -.76], [.11, 0]]] },
    J: { w: .44, z: [[[.38, -.76], [.38, -.14]].concat(bogen(.19, -.14, .19, .16, 0, PI, 8))] },
    K: { w: .60, z: [[[.06, -.76], [.06, 0]], [[.55, -.76], [.07, -.32]], [[.22, -.44], [.57, 0]]] },
    L: { w: .50, z: [[[.07, -.76], [.07, 0], [.48, 0]]] },
    M: { w: .78, z: [[[.05, 0], [.05, -.76], [.39, -.26], [.73, -.76], [.73, 0]]] },
    N: { w: .66, z: [[[.06, 0], [.06, -.76], [.60, 0], [.60, -.76]]] },
    O: { w: .70, z: [bogen(.35, -.38, .30, .38, -.5 * PI, 1.5 * PI, 16)] },
    P: { w: .56, z: [[[.06, 0], [.06, -.76], [.34, -.76]].concat(bogen(.34, -.56, .22, .20, -.5 * PI, .5 * PI, 8)).concat([[.06, -.36]])] },
    Q: { w: .70, z: [bogen(.35, -.38, .30, .38, -.5 * PI, 1.5 * PI, 16), [[.44, -.14], [.66, .10]]] },
    R: { w: .60, z: [[[.06, 0], [.06, -.76], [.34, -.76]].concat(bogen(.34, -.56, .22, .20, -.5 * PI, .5 * PI, 8)).concat([[.06, -.36]]), [[.28, -.36], [.57, 0]]] },
    S: { w: .56, z: [[[.50, -.63], [.37, -.75], [.19, -.72], [.13, -.60], [.22, -.49],
                      [.40, -.40], [.48, -.26], [.41, -.08], [.22, -.02], [.06, -.11]]] },
    T: { w: .58, z: [[[.02, -.76], [.56, -.76]], [[.29, -.76], [.29, 0]]] },
    U: { w: .64, z: [[[.06, -.76], [.06, -.22]].concat(bogen(.32, -.22, .26, .24, PI, 2 * PI, 10)).concat([[.58, -.76]])] },
    V: { w: .64, z: [[[.02, -.76], [.32, 0], [.62, -.76]]] },
    W: { w: .94, z: [[[.02, -.76], [.24, 0], [.47, -.56], [.70, 0], [.92, -.76]]] },
    X: { w: .62, z: [[[.04, -.76], [.58, 0]], [[.58, -.76], [.04, 0]]] },
    Y: { w: .62, z: [[[.03, -.76], [.31, -.36], [.59, -.76]], [[.31, -.36], [.31, 0]]] },
    Z: { w: .58, z: [[[.04, -.76], [.54, -.76], [.05, 0], [.55, 0]]] },

    0: { w: .54, z: [bogen(.27, -.38, .22, .38, -.5 * PI, 1.5 * PI, 14)] },
    1: { w: .34, z: [[[.06, -.60], [.20, -.76], [.20, 0]]] },
    2: { w: .52, z: [bogen(.26, -.56, .20, .20, -1.1 * PI, .35 * PI, 9).concat([[.04, 0], [.49, 0]])] },
    3: { w: .52, z: [[[.06, -.66], [.20, -.76], [.38, -.69], [.36, -.57], [.22, -.49],
                      [.39, -.44], [.46, -.29], [.37, -.11], [.19, -.05], [.05, -.13]]] },
    4: { w: .54, z: [[[.38, 0], [.38, -.76], [.03, -.22], [.51, -.22]]] },
    5: { w: .52, z: [[[.46, -.76], [.10, -.76], [.07, -.42]].concat(bogen(.26, -.22, .21, .22, -.75 * PI, .55 * PI, 10))] },
    6: { w: .52, z: [[[.42, -.68], [.29, -.76], [.15, -.65], [.08, -.44], [.09, -.21],
                      [.21, -.04], [.37, -.08], [.44, -.22], [.37, -.35], [.21, -.37], [.10, -.27]]] },
    7: { w: .50, z: [[[.03, -.76], [.47, -.76], [.18, 0]]] },
    8: { w: .52, z: [bogen(.26, -.56, .19, .18, -.5 * PI, 1.5 * PI, 11).concat(bogen(.26, -.19, .22, .19, -1.5 * PI, .5 * PI, 12))] },
    9: { w: .52, z: [bogen(.26, -.55, .21, .19, .6 * PI, -1.4 * PI, 11).concat([[.46, -.50], [.36, 0]])] },

    ' ': { w: .30, z: [] },
    '&': { w: .66, z: [[[.62, 0], [.20, -.42], [.12, -.56], [.18, -.70], [.32, -.72], [.38, -.62],
                       [.32, -.48], [.10, -.28], [.08, -.14], [.20, -.02], [.36, -.06], [.50, -.24], [.58, -.40]]] },
    '.': { w: .24, z: [[[.10, -.03], [.13, 0]]] },
    ',': { w: .24, z: [[[.13, -.03], [.07, .13]]] },
    ':': { w: .24, z: [[[.11, -.32], [.13, -.29]], [[.11, -.03], [.13, 0]]] },
    '-': { w: .38, z: [[[.04, -.26], [.34, -.27]]] },
    '—': { w: .70, z: [[[.03, -.28], [.67, -.29]]] },
    '–': { w: .48, z: [[[.03, -.27], [.45, -.28]]] },
    '/': { w: .40, z: [[[.03, .06], [.37, -.78]]] },
    '(': { w: .28, z: [bogen(.30, -.36, .24, .46, .72 * PI, 1.28 * PI, 8)] },
    ')': { w: .28, z: [bogen(-.02, -.36, .24, .46, -.28 * PI, .28 * PI, 8)] },
    '?': { w: .48, z: [bogen(.24, -.58, .18, .17, -1.15 * PI, .38 * PI, 8).concat([[.24, -.30], [.24, -.18]]), [[.24, -.03], [.26, 0]]] },
    '!': { w: .24, z: [[[.11, -.76], [.11, -.18]], [[.11, -.03], [.13, 0]]] },
    '=': { w: .54, z: [[[.05, -.44], [.49, -.45]], [[.05, -.24], [.49, -.25]]] },
    '+': { w: .54, z: [[[.05, -.34], [.49, -.35]], [[.27, -.56], [.27, -.13]]] },
    '×': { w: .44, z: [[[.08, -.46], [.36, -.20]], [[.36, -.46], [.08, -.20]]] },
    '%': { w: .70, z: [bogen(.16, -.58, .13, .13, -.5 * PI, 1.5 * PI, 8), bogen(.54, -.16, .13, .13, -.5 * PI, 1.5 * PI, 8), [[.62, -.74], [.08, -.02]]] },
    '·': { w: .26, z: [[[.11, -.28], [.14, -.25]]] },
    '’': { w: .22, z: [[[.12, -.76], [.07, -.58]]] },
    '“': { w: .36, z: [[[.09, -.76], [.04, -.58]], [[.24, -.76], [.19, -.58]]] },
    '”': { w: .36, z: [[[.05, -.58], [.10, -.76]], [[.20, -.58], [.25, -.76]]] },
    '"': { w: .34, z: [[[.09, -.76], [.09, -.58]], [[.24, -.76], [.24, -.58]]] },
    "'": { w: .20, z: [[[.10, -.76], [.10, -.58]]] },
    '#': { w: .60, z: [[[.14, -.62], [.08, -.06]], [[.40, -.62], [.34, -.06]], [[.04, -.46], [.52, -.48]], [[.03, -.24], [.51, -.26]]] },
    '⁴': { w: .34, z: [[[.24, -.42], [.24, -.80], [.03, -.54], [.32, -.54]]] },
    '⁶': { w: .32, z: [bogen(.17, -.68, .13, .12, -.35 * PI, -1.4 * PI, 7).concat(bogen(.16, -.54, .13, .12, .95 * PI, -1.05 * PI, 9))] },
  };

  /* Der Zug selbst: leicht verzogen, an den Enden dünner. Ohne das Verziehen
     sieht die Schrift aus wie ein Font — und ein Font ist genau das, was sie
     hier nicht sein soll. */
  function ziehen(punkte, x0, y0, groesse, wackel, saatFn) {
    var p = [];
    for (var i = 0; i < punkte.length - 1; i++) {
      var a = punkte[i], b = punkte[i + 1];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var laenge = Math.hypot(dx, dy) * groesse;
      var n = Math.max(1, Math.round(laenge / 3.2));
      for (var k = 0; k < n; k++) {
        var t = k / n;
        var jx = (saatFn() - .5) * wackel, jy = (saatFn() - .5) * wackel;
        p.push({
          x: x0 + (a[0] + dx * t) * groesse + jx,
          y: y0 + (a[1] + dy * t) * groesse + jy,
          p: 0.45 + 0.55 * Math.sin(PI * Math.min(1, Math.max(0, (i + t) / Math.max(1, punkte.length - 1)))),
        });
      }
    }
    var e = punkte[punkte.length - 1];
    p.push({ x: x0 + e[0] * groesse, y: y0 + e[1] * groesse, p: .45 });
    return p;
  }

  /* schreiben(…) gibt Punktlisten zurück, keine Objekte — wer sie ruft,
     entscheidet, mit welchem Stift und in welcher Farbe daraus Tinte wird. */
  function schreiben(text, x, y, groesse, opt) {
    var o = opt || {};
    var wackel = o.wackel === undefined ? groesse * .022 : o.wackel;
    var neigung = o.neigung === undefined ? -0.06 : o.neigung;   /* Rechtslage */
    var saat = o.saat || 1234567;
    function z() { saat = (saat * 1103515245 + 12345) % 2147483648; return saat / 2147483648; }

    var zuege = [];
    var zeilen = String(text).split('\n');
    var zeilenhoehe = groesse * (o.zeilen || 1.55);

    zeilen.forEach(function (zeile, zi) {
      var cx = x, cy = y + zi * zeilenhoehe;
      /* Die Grundlinie einer Handschrift ist nie ganz gerade. */
      var drift = (z() - .5) * groesse * .05;
      for (var i = 0; i < zeile.length; i++) {
        var ch = zeile[i];
        var g = G[ch];
        if (!g) { cx += groesse * .42; continue; }
        var hoch = (z() - .5) * groesse * .035;
        g.z.forEach(function (zug) {
          /* Neigung: jeder Punkt wandert nach rechts, je höher er steht. */
          var schief = zug.map(function (pt) { return [pt[0] - pt[1] * neigung, pt[1]]; });
          zuege.push(ziehen(schief, cx, cy + drift + hoch, groesse, wackel, z));
        });
        cx += g.w * groesse * (o.sperrung || 1.0) + groesse * .055;
      }
    });
    return zuege;
  }

  /* Wie breit wird das? Für Unterstreichungen und Textmarker. */
  function breite(text, groesse, opt) {
    var o = opt || {};
    var max = 0;
    String(text).split('\n').forEach(function (zeile) {
      var b = 0;
      for (var i = 0; i < zeile.length; i++) {
        var g = G[zeile[i]];
        b += (g ? g.w : .42) * groesse * (o.sperrung || 1.0) + groesse * .055;
      }
      if (b > max) max = b;
    });
    return max;
  }

  global.HANDSCHRIFT = { schreiben: schreiben, breite: breite, zeichen: G };
})(window);
