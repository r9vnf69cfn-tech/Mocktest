/* ============================================================================
 * shapes.js — Formerkennung für das Formen-Werkzeug
 *
 * Der Nutzer zeichnet freihändig; beim Absetzen wird der Zug analysiert und —
 * sofern sicher genug erkannt — durch eine saubere geometrische Form ersetzt.
 *
 * Ablauf:
 *   1. Vorverarbeitung  : Duplikate raus, auf N gleichabständige Punkte
 *                         resamplen, Schwerpunkt + AABB bestimmen.
 *   2. Geschlossenheit  : Abstand Start/Ende gegen Umfang bzw. AABB-Diagonale.
 *   3. Offene Züge      : Pfeil → Linie → Bogen (Kreisfit).
 *   4. Geschlossene Züge: Ecken über Krümmung → Polygon, sonst Kreis/Ellipse.
 *   5. Konfidenz        : 1 - normiertes Fit-Residuum, unter 0.55 → null.
 *
 * Alle Koordinaten sind Weltkoordinaten (Kamera-Transformation macht der
 * Renderer). Keine Abhängigkeiten, klassisches Script.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});

  /* ── Parameter ───────────────────────────────────────────────────────── */

  const N_RESAMPLE = 64; // Zielanzahl Punkte nach dem Resampling
  const MIN_POINTS = 4; // weniger Rohpunkte → keine Aussage möglich
  const MIN_PATH_LEN = 8; // kürzere Züge sind eher ein Tippen als eine Form

  const CLOSE_LEN_F = 0.22; // Lücke < 22 % der Bogenlänge → geschlossen
  const CLOSE_DIAG_F = 0.35; // … oder < 35 % der AABB-Diagonale

  const CORNER_WIN = 3; // Krümmungsfenster ±3 resamplete Punkte
  const CORNER_ANGLE = 38; // Grad — ab hier gilt ein Punkt als Ecken-Kandidat
  const SMOOTH_PASSES = 2; // Glättung vor der Krümmungsanalyse
  // Ein glatter Kreis liefert bei 64 Punkten und Fenster ±3 nur ~17° Änderung,
  // ein Sechseck dagegen 60°. Der Schwellwert liegt bewusst dazwischen, damit
  // verrauschte Kreise keine Scheinecken bekommen.
  const POLY_MARGIN = 0.85; // Polygon muss den Ellipsenfit deutlich schlagen

  const FIT_TOL_BASE = 0.16; // Referenz-Residuum (relativ) bei tolerance=0.22
  const MIN_CONFIDENCE = 0.55;

  const SNAP_STEP = 15; // Rasterwinkel für Linien/Pfeile
  const SNAP_TOL = 7; // Grad Fangbereich
  const SQUARE_LO = 0.88;
  const SQUARE_HI = 1.14;
  const RECT_AXIS_TOL = 15; // Grad — Kanten „nahe achsparallel“
  const DIAMOND_TOL = 0.14; // Ecknähe zu den AABB-Seitenmitten, rel. Diagonale
  const REGULAR_TOL = 0.25; // Radiusstreuung, bis zu der auf regelmäßig gesnappt wird

  const ARC_MIN_SWEEP = 50; // Grad — darunter ist es eher eine Linie
  const ARC_MAX_SWEEP = 300; // Grad — darüber ist es ein (fast) voller Kreis

  // Der Spitzenbereich wird großzügig abgesteckt: eine einfache Spitze („V“)
  // belegt nur die letzten ~18 % der Bogenlänge, eine zweiseitige Spitze wird
  // aber hin und zurück gezogen und frisst dann rund ein Drittel des Zuges.
  const ARROW_TAIL = 0.4; // hier darf die Spitze frühestens beginnen
  const ARROW_MIN_SHAFT = 0.5; // Schaftanteil an der Bogenlänge
  const ARROW_TURN = 70; // Grad — „scharfer“ Richtungswechsel
  const ARROW_TURN_HARD = 110; // Grad — Kehrtwende (reicht allein für ein „V“)

  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const EPS = 1e-9;

  /* ── Kleinkram ───────────────────────────────────────────────────────── */

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  function num(v, dflt) {
    const n = typeof v === 'number' ? v : NaN;
    return isFinite(n) ? n : dflt;
  }

  /** Rohpunkte prüfen und kopieren. Ein einziger nicht-endlicher Wert
   *  disqualifiziert den ganzen Zug (lieber gar nichts erkennen als Unsinn). */
  function sanitize(points) {
    if (!points || typeof points.length !== 'number') return null;
    const n = points.length | 0;
    if (n < MIN_POINTS) return null;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const p = points[i];
      if (!p || typeof p !== 'object') return null;
      const x = typeof p.x === 'number' ? p.x : NaN;
      const y = typeof p.y === 'number' ? p.y : NaN;
      if (!isFinite(x) || !isFinite(y)) return null;
      out[i] = { x: x, y: y };
    }
    return out;
  }

  /** Aufeinanderfolgende (fast) identische Punkte entfernen. */
  function dedupe(pts) {
    const box = bbox(pts);
    const diag = Math.hypot(box.w, box.h);
    const eps = Math.max(1e-7, diag * 1e-4);
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (dist(out[out.length - 1], pts[i]) > eps) out.push(pts[i]);
    }
    return out;
  }

  function pathLength(pts) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
    return s;
  }

  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x > x1) x1 = p.x;
      if (p.y > y1) y1 = p.y;
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 };
  }

  function centroid(pts) {
    let sx = 0, sy = 0;
    for (let i = 0; i < pts.length; i++) { sx += pts[i].x; sy += pts[i].y; }
    return { x: sx / pts.length, y: sy / pts.length };
  }

  /** Mittlerer Abstand der Punkte vom Schwerpunkt — dient als Größenmaß,
   *  gegen das alle Residuen normiert werden. */
  function meanRadius(pts, c) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) s += dist(pts[i], c);
    return s / pts.length;
  }

  /** Gleichabständiges Resampling nach Bogenlänge ($1-Recognizer-Verfahren). */
  function resample(pts, n) {
    const total = pathLength(pts);
    if (!(total > 0) || n < 2) return null;
    const step = total / (n - 1);
    const src = pts.slice();
    const out = [{ x: src[0].x, y: src[0].y }];
    let acc = 0;
    for (let i = 1; i < src.length && out.length < n; i++) {
      const a = src[i - 1], b = src[i];
      const d = dist(a, b);
      if (d <= 0) continue;
      if (acc + d >= step) {
        const t = (step - acc) / d;
        const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
        out.push(q);
        src.splice(i, 0, q); // ab dem neuen Punkt weitermessen
        acc = 0;
      } else {
        acc += d;
      }
    }
    const last = pts[pts.length - 1];
    while (out.length < n) out.push({ x: last.x, y: last.y });
    return out;
  }

  /** Leichte Glättung (Kern 1-2-1), damit Handzittern keine Ecken vortäuscht. */
  function smooth(pts, closed, passes) {
    const n = pts.length;
    let cur = pts;
    for (let s = 0; s < passes; s++) {
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const a = cur[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
        const b = cur[i];
        const c = cur[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        out[i] = { x: (a.x + 2 * b.x + c.x) / 4, y: (a.y + 2 * b.y + c.y) / 4 };
      }
      cur = out;
    }
    return cur;
  }

  /* ── Abstände und Ausgleichsgeraden ──────────────────────────────────── */

  function pointSegDist(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 < EPS) return dist(p, a);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    t = clamp(t, 0, 1);
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  /** Mittlerer senkrechter Abstand zur (unendlichen) Geraden a→b. */
  function meanPerp(pts, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < EPS) return Infinity;
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      s += Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
    }
    return s / pts.length;
  }

  /** Mittlerer Abstand der Punkte zum geschlossenen Polygonzug. */
  function meanPolyDist(pts, verts) {
    const m = verts.length;
    if (m < 2) return Infinity;
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      let best = Infinity;
      for (let k = 0; k < m; k++) {
        const d = pointSegDist(pts[i], verts[k], verts[(k + 1) % m]);
        if (d < best) best = d;
      }
      s += best;
    }
    return s / pts.length;
  }

  /** Ausgleichsgerade (Total Least Squares) über den Hauptachsen-Eigenvektor
   *  der Kovarianzmatrix. Liefert Stützpunkt c und Richtung d. */
  function fitLine(pts) {
    const n = pts.length;
    if (n < 2) return null;
    const c = centroid(pts);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = pts[i].x - c.x, dy = pts[i].y - c.y;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    const ev = principalAxis(sxx, sxy, syy);
    if (!ev) return null;
    return { c: c, d: ev };
  }

  /** Eigenvektor zum größeren Eigenwert einer symmetrischen 2x2-Matrix. */
  function principalAxis(sxx, sxy, syy) {
    const tr = sxx + syy;
    if (!(tr > EPS)) return null;
    const disc = Math.sqrt(Math.max(0, ((sxx - syy) * (sxx - syy)) / 4 + sxy * sxy));
    const l1 = tr / 2 + disc;
    let vx, vy;
    if (Math.abs(sxy) > EPS * tr) {
      vx = sxy; vy = l1 - sxx;
    } else {
      // Achsparallele Hauptachsen — Eigenvektor direkt ablesen
      if (sxx >= syy) { vx = 1; vy = 0; } else { vx = 0; vy = 1; }
    }
    const len = Math.hypot(vx, vy);
    if (len < EPS) return null;
    return { x: vx / len, y: vy / len, l1: l1, l2: tr / 2 - disc };
  }

  function intersectLines(a, b) {
    if (!a || !b) return null;
    const den = a.d.x * b.d.y - a.d.y * b.d.x;
    if (Math.abs(den) < 1e-6) return null; // nahezu parallel
    const rx = b.c.x - a.c.x, ry = b.c.y - a.c.y;
    const t = (rx * b.d.y - ry * b.d.x) / den;
    return { x: a.c.x + t * a.d.x, y: a.c.y + t * a.d.y };
  }

  /* ── Kreis- und Ellipsenfit ──────────────────────────────────────────── */

  /** Algebraischer Kreisfit nach Kåsa: minimiert Σ(|p-c|² - r²)².
   *  Um den Schwerpunkt zentriert, damit die Normalgleichungen stabil sind. */
  function fitCircle(pts) {
    const n = pts.length;
    if (n < 3) return null;
    const m = centroid(pts);
    let suu = 0, svv = 0, suv = 0, suuu = 0, svvv = 0, suvv = 0, svuu = 0;
    for (let i = 0; i < n; i++) {
      const u = pts[i].x - m.x, v = pts[i].y - m.y;
      suu += u * u; svv += v * v; suv += u * v;
      suuu += u * u * u; svvv += v * v * v;
      suvv += u * v * v; svuu += v * u * u;
    }
    const det = suu * svv - suv * suv;
    const scale = (suu + svv) * (suu + svv);
    if (!(Math.abs(det) > 1e-12 * Math.max(scale, EPS))) return null;
    const b1 = 0.5 * (suuu + suvv);
    const b2 = 0.5 * (svvv + svuu);
    const uc = (b1 * svv - b2 * suv) / det;
    const vc = (suu * b2 - suv * b1) / det;
    const r = Math.sqrt(Math.max(0, uc * uc + vc * vc + (suu + svv) / n));
    if (!isFinite(r) || r < EPS) return null;
    return { cx: uc + m.x, cy: vc + m.y, r: r };
  }

  /** Mittlere radiale Abweichung vom Kreis, relativ zum Radius. */
  function circleError(pts, ci) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) s += Math.abs(dist(pts[i], { x: ci.cx, y: ci.cy }) - ci.r);
    return s / pts.length / Math.max(ci.r, EPS);
  }

  /** Vorzeichenbehaftete Winkelabdeckung um (cx,cy) in Grad. */
  function angularSweep(pts, cx, cy) {
    let sweep = 0, prev = null;
    for (let i = 0; i < pts.length; i++) {
      const a = Math.atan2(pts[i].y - cy, pts[i].x - cx);
      if (prev !== null) {
        let d = a - prev;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        sweep += d;
      }
      prev = a;
    }
    return sweep * DEG;
  }

  /** Pragmatischer Ellipsenfit: Hauptachsen aus der Kovarianzmatrix, danach
   *  die beiden Radien per linearer Ausgleichsrechnung über
   *  A·u² + B·v² = 1  →  rx = 1/√A, ry = 1/√B. */
  function fitEllipse(pts) {
    const n = pts.length;
    if (n < 5) return null;
    const c = centroid(pts);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = pts[i].x - c.x, dy = pts[i].y - c.y;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    const ax = principalAxis(sxx, sxy, syy);
    if (!ax) return null;
    const rot = Math.atan2(ax.y, ax.x);
    const co = Math.cos(rot), si = Math.sin(rot);

    let u4 = 0, u2v2 = 0, v4 = 0, u2 = 0, v2 = 0, maxU = 0, maxV = 0;
    for (let i = 0; i < n; i++) {
      const dx = pts[i].x - c.x, dy = pts[i].y - c.y;
      const u = dx * co + dy * si;
      const v = -dx * si + dy * co;
      const uu = u * u, vv = v * v;
      u4 += uu * uu; v4 += vv * vv; u2v2 += uu * vv; u2 += uu; v2 += vv;
      if (Math.abs(u) > maxU) maxU = Math.abs(u);
      if (Math.abs(v) > maxV) maxV = Math.abs(v);
    }
    let rx, ry;
    const det = u4 * v4 - u2v2 * u2v2;
    const A = det !== 0 ? (u2 * v4 - v2 * u2v2) / det : 0;
    const B = det !== 0 ? (u4 * v2 - u2v2 * u2) / det : 0;
    if (A > EPS && B > EPS) {
      rx = 1 / Math.sqrt(A);
      ry = 1 / Math.sqrt(B);
    } else {
      rx = maxU; ry = maxV; // Rückfall: Halbachsen aus den Extremwerten
    }
    if (!(rx > EPS) || !(ry > EPS) || !isFinite(rx) || !isFinite(ry)) return null;
    return { cx: c.x, cy: c.y, rx: rx, ry: ry, rotation: rot };
  }

  /** Näherung des geometrischen Abstands zur Ellipse: radiale Abweichung mal
   *  lokalem Ellipsenradius in Blickrichtung. */
  function ellipseError(pts, e) {
    const co = Math.cos(e.rotation), si = Math.sin(e.rotation);
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - e.cx, dy = pts[i].y - e.cy;
      const u = dx * co + dy * si;
      const v = -dx * si + dy * co;
      const r = Math.sqrt((u * u) / (e.rx * e.rx) + (v * v) / (e.ry * e.ry));
      const rad = Math.hypot(u, v);
      s += Math.abs(r - 1) * (r > EPS ? rad / r : Math.min(e.rx, e.ry));
    }
    return s / pts.length;
  }

  /* ── Eckenerkennung ──────────────────────────────────────────────────── */

  /** Richtungsänderung je Punkt über ein Fenster von ±w Punkten, in Grad. */
  function turnAngles(pts, w, closed) {
    const n = pts.length;
    const out = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const ia = closed ? (i - w + n) % n : Math.max(0, i - w);
      const ib = closed ? (i + w) % n : Math.min(n - 1, i + w);
      const ax = pts[i].x - pts[ia].x, ay = pts[i].y - pts[ia].y;
      const bx = pts[ib].x - pts[i].x, by = pts[ib].y - pts[i].y;
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      if (la < EPS || lb < EPS) continue;
      const cross = ax * by - ay * bx;
      const dot = ax * bx + ay * by;
      out[i] = Math.abs(Math.atan2(cross, dot)) * DEG;
    }
    return out;
  }

  /** Ecken = lokale Maxima der Richtungsänderung über CORNER_ANGLE, zu
   *  Gruppen zusammengefasst (zirkulär) und mit Mindestabstand ausgedünnt. */
  function findCorners(ring, thresh) {
    const n = ring.length;
    const ang = turnAngles(ring, CORNER_WIN, true);
    const isC = new Array(n);
    let count = 0;
    for (let i = 0; i < n; i++) {
      isC[i] = ang[i] > thresh;
      if (isC[i]) count++;
    }
    if (count === 0 || count === n) return []; // gar keine bzw. überall Krümmung

    // Gruppenstart suchen: Kandidat, dessen Vorgänger keiner ist.
    let start = -1;
    for (let i = 0; i < n; i++) {
      if (isC[i] && !isC[(i - 1 + n) % n]) { start = i; break; }
    }
    if (start < 0) return [];

    const corners = [];
    let i = 0;
    while (i < n) {
      const idx = (start + i) % n;
      if (!isC[idx]) { i++; continue; }
      let best = idx, bestA = ang[idx], len = 0;
      while (len < n && isC[(start + i + len) % n]) {
        const j = (start + i + len) % n;
        if (ang[j] > bestA) { bestA = ang[j]; best = j; }
        len++;
      }
      corners.push({ i: best, a: bestA });
      i += len;
    }

    // Zu dicht beieinander liegende Ecken verschmelzen (schwächere fliegt raus)
    const minSep = Math.max(3, Math.floor(n / 12));
    let merged = true;
    while (merged && corners.length > 1) {
      merged = false;
      for (let k = 0; k < corners.length; k++) {
        const a = corners[k], b = corners[(k + 1) % corners.length];
        let d = (b.i - a.i + n) % n;
        if (d === 0) d = n;
        if (d < minSep) {
          corners.splice(a.a >= b.a ? corners.indexOf(b) : corners.indexOf(a), 1);
          merged = true;
          break;
        }
      }
    }
    corners.sort((p, q) => p.i - q.i);
    return corners.map((c) => c.i);
  }

  /** Ecken nachschärfen: je Kante eine Ausgleichsgerade durch die inneren
   *  Punkte legen und benachbarte Geraden schneiden. Das mittelt das Rauschen
   *  heraus und trifft die Ecke deutlich besser als der Rohpunkt. */
  function refineCorners(ring, idx) {
    const n = ring.length, m = idx.length;
    const lines = new Array(m);
    for (let k = 0; k < m; k++) {
      const ia = idx[k], ib = idx[(k + 1) % m];
      let span = (ib - ia + n) % n;
      if (span === 0) span = n;
      const trim = Math.max(1, Math.round(span * 0.2));
      const seg = [];
      for (let t = trim; t <= span - trim; t++) seg.push(ring[(ia + t) % n]);
      lines[k] = seg.length >= 2 ? fitLine(seg) : fitLine([ring[ia], ring[ib]]);
    }
    const box = bbox(ring);
    const maxShift = 0.4 * Math.hypot(box.w, box.h);
    const verts = new Array(m);
    for (let k = 0; k < m; k++) {
      const raw = ring[idx[k]];
      const p = intersectLines(lines[(k - 1 + m) % m], lines[k]);
      verts[k] = p && dist(p, raw) < maxShift ? p : { x: raw.x, y: raw.y };
    }
    return verts;
  }

  /* ── Winkel-Snapping ─────────────────────────────────────────────────── */

  /** Linie auf das 15°-Raster drehen, wenn sie nah genug dran liegt.
   *  Startpunkt und Länge bleiben erhalten. */
  function snapToGrid(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < EPS) return to;
    const a = Math.atan2(dy, dx) * DEG;
    const snapped = Math.round(a / SNAP_STEP) * SNAP_STEP;
    let d = a - snapped;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    if (Math.abs(d) > SNAP_TOL) return to;
    const r = snapped * RAD;
    return { x: from.x + len * Math.cos(r), y: from.y + len * Math.sin(r) };
  }

  /* ── Offene Züge ─────────────────────────────────────────────────────── */

  function recognizeOpen(rs, tol, fitTol, snapAngles) {
    const n = rs.length;
    const arrow = detectArrow(rs, tol, snapAngles);
    if (arrow) return arrow;

    const a = rs[0], b = rs[n - 1];
    const len = dist(a, b);
    const lineErr = len > EPS ? meanPerp(rs, a, b) / len : Infinity;
    const lineConf = clamp(1 - lineErr / Math.max(tol, EPS), 0, 1);

    // Sehr gerade Züge sind ohne weitere Prüfung eine Linie.
    if (lineErr < 0.4 * tol) return makeLine(a, b, lineConf, snapAngles);

    // Bogen? Kreisfit mit kleinem Residuum, aber Abdeckung < 300°.
    const ci = fitCircle(rs);
    if (ci) {
      const err = circleError(rs, ci);
      const sweep = angularSweep(rs, ci.cx, ci.cy);
      const abs = Math.abs(sweep);
      if (abs >= ARC_MIN_SWEEP && abs <= ARC_MAX_SWEEP) {
        const conf = clamp(1 - err / fitTol, 0, 1);
        if (conf > lineConf) {
          const s = Math.atan2(rs[0].y - ci.cy, rs[0].x - ci.cx);
          return {
            kind: 'arc',
            confidence: conf,
            center: { x: ci.cx, y: ci.cy },
            radius: ci.r,
            startAngle: s,
            endAngle: s + sweep * RAD,
          };
        }
      }
    }
    if (lineErr < tol) return makeLine(a, b, lineConf, snapAngles);
    return null;
  }

  function makeLine(a, b, conf, snapAngles) {
    const to = snapAngles ? snapToGrid(a, b) : { x: b.x, y: b.y };
    return { kind: 'line', confidence: conf, from: { x: a.x, y: a.y }, to: to };
  }

  /** Pfeil: gerader Schaft, dessen letzte ~18 % der Bogenlänge ein oder zwei
   *  scharfe Kehrtwenden enthalten (die zurückgezogene Spitze). */
  function detectArrow(rs, tol, snapAngles) {
    const n = rs.length;
    const tailStart = Math.floor(n * (1 - ARROW_TAIL));
    if (tailStart < 6) return null;
    const ang = turnAngles(rs, 2, false);

    // Vor dem Spitzenbereich darf der Schaft keine scharfe Wende haben.
    for (let i = 3; i < tailStart - 2; i++) if (ang[i] > ARROW_TURN) return null;

    // Scharfe Wenden im Endstück zu Gruppen zusammenfassen
    const groups = [];
    for (let i = tailStart; i < n - 2; i++) {
      if (ang[i] <= ARROW_TURN) continue;
      const g = groups[groups.length - 1];
      if (g && i - g.end <= 2) {
        g.end = i;
        if (ang[i] > g.a) { g.a = ang[i]; g.i = i; }
      } else {
        groups.push({ i: i, end: i, a: ang[i] });
      }
    }
    if (groups.length === 0) return null;
    const strong = groups.length >= 2 || groups[0].a > ARROW_TURN_HARD;
    if (!strong) return null;

    const tipIdx = groups[0].i;
    if (tipIdx < n * ARROW_MIN_SHAFT) return null; // Spitze muss am Ende liegen
    const shaft = rs.slice(0, tipIdx + 1);
    const a = shaft[0], b = shaft[shaft.length - 1];
    const len = dist(a, b);
    if (len < EPS) return null;
    const err = meanPerp(shaft, a, b) / len;
    if (!(err < 0.6 * tol)) return null; // Schaft muss klar gerade sein

    const conf = clamp(1 - err / Math.max(0.6 * tol, EPS), 0, 1);
    const to = snapAngles ? snapToGrid(a, b) : { x: b.x, y: b.y };
    return { kind: 'arrow', confidence: conf, from: { x: a.x, y: a.y }, to: to };
  }

  /* ── Geschlossene Züge ───────────────────────────────────────────────── */

  function recognizeClosed(pts, tol, fitTol, snapSquare) {
    // Ring gleichmäßig resamplen — inklusive der Schließkante Ende→Anfang.
    const ringSrc = pts.concat([{ x: pts[0].x, y: pts[0].y }]);
    const full = resample(ringSrc, N_RESAMPLE + 1);
    if (!full) return null;
    const ring = full.slice(0, N_RESAMPLE);
    const c = centroid(ring);
    const scale = meanRadius(ring, c);
    if (!(scale > EPS)) return null;

    // (a) Ellipsen-/Kreiskandidat
    let ellCand = null, ellErr = Infinity;
    const e = fitEllipse(ring);
    if (e) {
      ellErr = ellipseError(ring, e) / scale;
      ellCand = e;
    }

    // (b) Polygonkandidat über die Krümmung
    const sm = smooth(ring, true, SMOOTH_PASSES);
    const idx = findCorners(sm, CORNER_ANGLE);
    let polyCand = null, polyErr = Infinity;
    if (idx.length >= 3 && idx.length <= 6) {
      polyCand = buildPolygon(ring, idx, c, snapSquare);
      if (polyCand) polyErr = meanPolyDist(ring, polyCand.vertices) / scale;
    }

    // Direkter Vergleich der (gleich normierten) geometrischen Residuen. Der
    // Sicherheitsabstand verhindert, dass ein freies Vieleck ein verrauschtes
    // Oval nachzeichnet und dabei knapp „gewinnt“.
    if (polyCand && polyErr < ellErr * POLY_MARGIN) {
      polyCand.confidence = clamp(1 - polyErr / fitTol, 0, 1);
      return polyCand;
    }
    if (!ellCand) return null;

    const ratio = ellCand.rx / Math.max(ellCand.ry, EPS);
    let shape;
    if (ratio >= SQUARE_LO && ratio <= SQUARE_HI) {
      const r = (ellCand.rx + ellCand.ry) / 2;
      shape = { kind: 'circle', confidence: 0, cx: ellCand.cx, cy: ellCand.cy, rx: r, ry: r, rotation: 0 };
    } else {
      shape = {
        kind: 'ellipse', confidence: 0,
        cx: ellCand.cx, cy: ellCand.cy, rx: ellCand.rx, ry: ellCand.ry, rotation: ellCand.rotation,
      };
    }
    // Residuum gegen die *endgültige* Form messen (Snapping inklusive).
    const finalErr = ellipseError(ring, {
      cx: shape.cx, cy: shape.cy, rx: shape.rx, ry: shape.ry, rotation: shape.rotation,
    }) / scale;
    shape.confidence = clamp(1 - finalErr / fitTol, 0, 1);
    return shape;
  }

  /** Aus den erkannten Ecken die konkrete Polygonform bauen (inkl. Snapping). */
  function buildPolygon(ring, idx, c, snapSquare) {
    const verts = refineCorners(ring, idx);
    const m = verts.length;

    if (m === 3) return { kind: 'triangle', confidence: 0, vertices: verts };

    if (m === 4) {
      const box = bbox(verts);
      const diag = Math.hypot(box.w, box.h);
      if (!(diag > EPS)) return null;

      // Kantenwinkel gegen die Achsen prüfen (0…45°, kleiner = achsparalleler)
      let axisDev = 0;
      for (let k = 0; k < 4; k++) {
        const a = verts[k], b = verts[(k + 1) % 4];
        let ad = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * DEG) % 90;
        axisDev += Math.min(ad, 90 - ad);
      }
      axisDev /= 4;

      if (axisDev < RECT_AXIS_TOL) {
        // Rechteck: auf die AABB der nachgeschärften Ecken snappen
        let w = box.w, h = box.h;
        let x0 = box.x0, y0 = box.y0;
        const ratio = w / Math.max(h, EPS);
        let kind = 'rect';
        if (snapSquare && ratio >= SQUARE_LO && ratio <= SQUARE_HI) {
          const s = (w + h) / 2;
          x0 = box.x0 + (w - s) / 2;
          y0 = box.y0 + (h - s) / 2;
          w = s; h = s;
          kind = 'square';
        }
        return {
          kind: kind, confidence: 0,
          vertices: [
            { x: x0, y: y0 }, { x: x0 + w, y: y0 },
            { x: x0 + w, y: y0 + h }, { x: x0, y: y0 + h },
          ],
        };
      }

      // Raute: liegen die Ecken nahe an den Seitenmitten der AABB?
      const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
      const mids = [
        { x: cx, y: box.y0 }, { x: box.x1, y: cy },
        { x: cx, y: box.y1 }, { x: box.x0, y: cy },
      ];
      let dsum = 0;
      for (let k = 0; k < 4; k++) {
        let best = Infinity;
        for (let j = 0; j < 4; j++) best = Math.min(best, dist(verts[k], mids[j]));
        dsum += best;
      }
      if (dsum / 4 / diag < DIAMOND_TOL) {
        return { kind: 'diamond', confidence: 0, vertices: mids };
      }
      // Gedrehtes Viereck: ohne Snapping als Rechteck durchreichen
      return { kind: 'rect', confidence: 0, vertices: verts };
    }

    // Fünf-/Sechseck: auf regelmäßig snappen, sofern es annähernd regelmäßig ist
    const kind = m === 5 ? 'pentagon' : 'hexagon';
    let rsum = 0, rmin = Infinity, rmax = 0;
    for (let k = 0; k < m; k++) {
      const d = dist(verts[k], c);
      rsum += d;
      if (d < rmin) rmin = d;
      if (d > rmax) rmax = d;
    }
    const rmean = rsum / m;
    if (!(rmean > EPS)) return null;
    if ((rmax - rmin) / rmean <= REGULAR_TOL) {
      const a0 = Math.atan2(verts[0].y - c.y, verts[0].x - c.x);
      const out = new Array(m);
      for (let k = 0; k < m; k++) {
        const a = a0 + (2 * Math.PI * k) / m;
        out[k] = { x: c.x + rmean * Math.cos(a), y: c.y + rmean * Math.sin(a) };
      }
      // Umlaufsinn der Vorlage beibehalten
      if (signedArea(verts) * signedArea(out) < 0) out.reverse();
      return { kind: kind, confidence: 0, vertices: out };
    }
    return { kind: kind, confidence: 0, vertices: verts };
  }

  function signedArea(v) {
    let s = 0;
    for (let i = 0; i < v.length; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      s += a.x * b.y - b.x * a.y;
    }
    return s / 2;
  }

  /* ── Öffentliche API ─────────────────────────────────────────────────── */

  function recognize(points, opts) {
    try {
      const o = opts || {};
      const tol = Math.max(0.02, num(o.tolerance, 0.22));
      const snapSquare = o.snapSquare !== false;
      const snapAngles = o.snapAngles !== false;
      const fitTol = FIT_TOL_BASE * (tol / 0.22);

      const raw = sanitize(points);
      if (!raw) return null;
      const pts = dedupe(raw);
      if (pts.length < MIN_POINTS) return null;

      const len = pathLength(pts);
      const box = bbox(pts);
      const diag = Math.hypot(box.w, box.h);
      if (!(len > MIN_PATH_LEN) || !(diag > 1e-6)) return null;

      const gap = dist(pts[0], pts[pts.length - 1]);
      const closed = gap < CLOSE_LEN_F * len || gap < CLOSE_DIAG_F * diag;

      let shape;
      if (closed) {
        shape = recognizeClosed(pts, tol, fitTol, snapSquare);
      } else {
        const rs = resample(pts, N_RESAMPLE);
        shape = rs ? recognizeOpen(rs, tol, fitTol, snapAngles) : null;
      }
      if (!shape) return null;
      const conf = num(shape.confidence, 0);
      if (!(conf >= MIN_CONFIDENCE)) return null;
      shape.confidence = clamp(conf, 0, 1);
      return shape;
    } catch (err) {
      return null;
    }
  }

  /** Punktdichte für eine Kante: etwa alle 4 Weltunits ein Stützpunkt. */
  function stepsFor(len) {
    return clamp(Math.round(len / 4), 2, 96) | 0;
  }

  function pushSeg(out, a, b, includeLast) {
    const n = stepsFor(dist(a, b));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
    }
    if (includeLast) out.push({ x: b.x, y: b.y });
  }

  function pathFor(shape) {
    try {
      if (!shape || typeof shape !== 'object') return [];
      const out = [];
      const k = shape.kind;

      if (k === 'line' || k === 'arrow') {
        const a = shape.from, b = shape.to;
        if (!a || !b) return [];
        pushSeg(out, a, b, true);
        if (k === 'arrow') {
          const len = dist(a, b);
          if (len > EPS) {
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            const h = Math.min(len * 0.22, 34);
            const spread = 26 * RAD;
            const b1 = { x: b.x - h * Math.cos(ang - spread), y: b.y - h * Math.sin(ang - spread) };
            const b2 = { x: b.x - h * Math.cos(ang + spread), y: b.y - h * Math.sin(ang + spread) };
            pushSeg(out, b, b1, true);
            pushSeg(out, b1, b, true);
            pushSeg(out, b, b2, true);
          }
        }
        return out;
      }

      if (k === 'circle' || k === 'ellipse') {
        const rx = num(shape.rx, 0), ry = num(shape.ry, 0);
        const cx = num(shape.cx, 0), cy = num(shape.cy, 0);
        const rot = num(shape.rotation, 0);
        if (!(rx > 0) || !(ry > 0)) return [];
        const co = Math.cos(rot), si = Math.sin(rot);
        const steps = clamp(Math.round(Math.max(rx, ry) / 2), 32, 160) | 0;
        for (let i = 0; i <= steps; i++) {
          const t = (2 * Math.PI * i) / steps;
          const u = rx * Math.cos(t), v = ry * Math.sin(t);
          out.push({ x: cx + u * co - v * si, y: cy + u * si + v * co });
        }
        return out; // erster Punkt wird durch i === steps wiederholt
      }

      if (k === 'arc') {
        const c = shape.center;
        const r = num(shape.radius, 0);
        if (!c || !(r > 0)) return [];
        const a0 = num(shape.startAngle, 0), a1 = num(shape.endAngle, 0);
        const sweep = a1 - a0;
        const steps = clamp(Math.round((Math.abs(sweep) * r) / 4), 8, 192) | 0;
        for (let i = 0; i <= steps; i++) {
          const a = a0 + (sweep * i) / steps;
          out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
        }
        return out;
      }

      const v = shape.vertices;
      if (!v || v.length < 2) return [];
      for (let i = 0; i < v.length; i++) pushSeg(out, v[i], v[(i + 1) % v.length], false);
      out.push({ x: v[0].x, y: v[0].y }); // geschlossen: Startpunkt wiederholen
      return out;
    } catch (err) {
      return [];
    }
  }

  GN.shapes = { recognize: recognize, pathFor: pathFor };
})(window);
