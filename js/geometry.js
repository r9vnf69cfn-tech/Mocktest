/* ============================================================================
 * geometry.js — Mathematische Hilfsfunktionen
 *
 * Alles hier arbeitet in *Weltkoordinaten*. Die Umrechnung zwischen Welt und
 * Bildschirm übernimmt die Kamera im Renderer.
 * ========================================================================== */
(function (global) {
  'use strict';

  const GN = (global.GN = global.GN || {});
  const G = {};

  /* ── Skalare ─────────────────────────────────────────────────────────── */

  G.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  G.dist2 = (ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  };

  /* ── Bounding-Boxen ──────────────────────────────────────────────────── */

  G.emptyBox = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });

  G.growBox = (box, x, y, pad) => {
    const p = pad || 0;
    if (x - p < box.x0) box.x0 = x - p;
    if (y - p < box.y0) box.y0 = y - p;
    if (x + p > box.x1) box.x1 = x + p;
    if (y + p > box.y1) box.y1 = y + p;
    return box;
  };

  G.unionBox = (a, b) => {
    if (!a) return b && { ...b };
    if (!b) return { ...a };
    return {
      x0: Math.min(a.x0, b.x0),
      y0: Math.min(a.y0, b.y0),
      x1: Math.max(a.x1, b.x1),
      y1: Math.max(a.y1, b.y1),
    };
  };

  G.boxValid = (b) => !!b && b.x1 >= b.x0 && b.y1 >= b.y0 && isFinite(b.x0) && isFinite(b.y1);

  G.boxesOverlap = (a, b) => !(a.x1 < b.x0 || a.x0 > b.x1 || a.y1 < b.y0 || a.y0 > b.y1);

  G.boxContainsPoint = (b, x, y) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

  G.boxFromPoints = (pts, pad) => {
    const box = G.emptyBox();
    for (let i = 0; i < pts.length; i++) G.growBox(box, pts[i].x, pts[i].y, pad);
    return box;
  };

  G.inflateBox = (b, pad) => ({ x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad });

  /* ── Punkt/Segment ───────────────────────────────────────────────────── */

  /** Quadrierter Abstand von P zum Segment AB (inkl. Projektionsparameter). */
  G.pointSegmentDist2 = function (px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const len2 = vx * vx + vy * vy;
    let t = len2 > 0 ? (wx * vx + wy * vy) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + t * vx;
    const cy = ay + t * vy;
    const dx = px - cx;
    const dy = py - cy;
    return { d2: dx * dx + dy * dy, t };
  };

  /** Schneiden sich die Segmente AB und CD? */
  G.segmentsIntersect = function (ax, ay, bx, by, cx, cy, dx, dy) {
    const d1 = cross(cx, cy, dx, dy, ax, ay);
    const d2 = cross(cx, cy, dx, dy, bx, by);
    const d3 = cross(ax, ay, bx, by, cx, cy);
    const d4 = cross(ax, ay, bx, by, dx, dy);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    if (d1 === 0 && onSeg(cx, cy, dx, dy, ax, ay)) return true;
    if (d2 === 0 && onSeg(cx, cy, dx, dy, bx, by)) return true;
    if (d3 === 0 && onSeg(ax, ay, bx, by, cx, cy)) return true;
    if (d4 === 0 && onSeg(ax, ay, bx, by, dx, dy)) return true;
    return false;
  };

  function cross(ax, ay, bx, by, px, py) {
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  }
  function onSeg(ax, ay, bx, by, px, py) {
    return Math.min(ax, bx) <= px && px <= Math.max(ax, bx) && Math.min(ay, by) <= py && py <= Math.max(ay, by);
  }

  /* ── Polygone ────────────────────────────────────────────────────────── */

  /** Ray-Casting: liegt (x,y) innerhalb des Polygons? */
  G.pointInPolygon = function (x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
    }
    return inside;
  };

  /** Liegt *irgendein* Punkt der Polylinie im Polygon (bzw. schneidet sie es)? */
  G.polylineIntersectsPolygon = function (pts, poly) {
    for (let i = 0; i < pts.length; i++) if (G.pointInPolygon(pts[i].x, pts[i].y, poly)) return true;
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
        if (G.segmentsIntersect(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, poly[k].x, poly[k].y, poly[j].x, poly[j].y))
          return true;
      }
    }
    return false;
  };

  /** Liegen ALLE Punkte der Polylinie im Polygon? (GoodNotes-Lasso: vollständig umschlossen) */
  G.polylineInsidePolygon = function (pts, poly) {
    for (let i = 0; i < pts.length; i++) if (!G.pointInPolygon(pts[i].x, pts[i].y, poly)) return false;
    return pts.length > 0;
  };

  /* ── Punkt-Vereinfachung (Ramer–Douglas–Peucker) ─────────────────────── */

  G.simplify = function (pts, tolerance) {
    if (pts.length < 3) return pts.slice();
    const tol2 = tolerance * tolerance;
    const keep = new Uint8Array(pts.length);
    keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [first, last] = stack.pop();
      let maxD = 0;
      let index = -1;
      for (let i = first + 1; i < last; i++) {
        const { d2 } = G.pointSegmentDist2(pts[i].x, pts[i].y, pts[first].x, pts[first].y, pts[last].x, pts[last].y);
        if (d2 > maxD) {
          maxD = d2;
          index = i;
        }
      }
      if (maxD > tol2 && index > 0) {
        keep[index] = 1;
        stack.push([first, index], [index, last]);
      }
    }
    const out = [];
    for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
    return out;
  };

  /**
   * Fügt Zwischenpunkte ein, bis kein Segment länger als `maxStep` ist.
   * Nötig fürs Radieren: ein vereinfachter gerader Strich besteht nur aus
   * seinen Endpunkten — ohne Zwischenpunkte gäbe es dort nichts zu trennen.
   */
  G.densify = function (pts, maxStep) {
    if (pts.length < 2 || !(maxStep > 0)) return pts.slice();
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = G.dist(a.x, a.y, b.x, b.y);
      const n = Math.min(Math.ceil(d / maxStep), 400);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        out.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          p: a.p === undefined ? undefined : a.p + ((b.p === undefined ? a.p : b.p) - a.p) * t,
        });
      }
      out.push(b);
    }
    return out;
  };

  /* ── Glättung ────────────────────────────────────────────────────────── */

  /**
   * Exponentielle Glättung eingehender Zeigerpunkte. Liefert eine Funktion,
   * die pro Punkt den gefilterten Punkt zurückgibt — hält die Linie ruhig,
   * ohne spürbare Latenz (Faktor 0.4–0.6 fühlt sich wie ein echter Stift an).
   */
  G.makeSmoother = function (factor) {
    const f = factor === undefined ? 0.5 : factor;
    let sx = null;
    let sy = null;
    return function (x, y) {
      if (sx === null) {
        sx = x;
        sy = y;
      } else {
        sx += (x - sx) * f;
        sy += (y - sy) * f;
      }
      return { x: sx, y: sy };
    };
  };

  /* ── Transformationen ────────────────────────────────────────────────── */

  /** Skaliert/verschiebt Punkte relativ zu einem Ankerpunkt. */
  G.transformPoint = function (p, t) {
    // t: { dx, dy, sx, sy, ox, oy, rot }
    let x = p.x;
    let y = p.y;
    if (t.sx !== undefined) {
      x = t.ox + (x - t.ox) * t.sx;
      y = t.oy + (y - t.oy) * t.sy;
    }
    if (t.rot) {
      const c = Math.cos(t.rot);
      const s = Math.sin(t.rot);
      const rx = x - t.ox;
      const ry = y - t.oy;
      x = t.ox + rx * c - ry * s;
      y = t.oy + rx * s + ry * c;
    }
    return { x: x + (t.dx || 0), y: y + (t.dy || 0) };
  };

  /* ── Sonstiges ───────────────────────────────────────────────────────── */

  let idSeed = 0;
  G.uid = (prefix) => `${prefix || 'o'}_${(++idSeed).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  /** Winkel auf Vielfache von 15° einrasten (Shift beim Formen-Werkzeug). */
  G.snapAngle = function (ax, ay, bx, by, stepDeg) {
    const step = ((stepDeg || 15) * Math.PI) / 180;
    const len = Math.hypot(bx - ax, by - ay);
    const a = Math.round(Math.atan2(by - ay, bx - ax) / step) * step;
    return { x: ax + Math.cos(a) * len, y: ay + Math.sin(a) * len };
  };

  GN.geo = G;
})(window);
