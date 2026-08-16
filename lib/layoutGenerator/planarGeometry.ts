// Plain 2D Cartesian polygon math for the layout generator, plus the topological
// clip primitive borrowed from @turf/turf. turf's own area/centroid/buffer
// helpers assume geodesic (lng/lat degrees) input and would misinterpret a
// floor-plan boundary drawn in feet, so area/centroid/bbox here are hand-rolled
// shoelace-formula math instead. turf's intersect/difference are purely
// topological polygon clipping (unaffected by units), so those are reused as-is.
import { polygon as turfPolygon, featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";
import type { Point } from "./types";

const CLOSE_TOLERANCE = 1e-9;

export function dedupeClosingPoint(points: Point[]): Point[] {
  if (points.length > 1) {
    const [fx, fy] = points[0];
    const [lx, ly] = points[points.length - 1];
    if (Math.abs(fx - lx) < CLOSE_TOLERANCE && Math.abs(fy - ly) < CLOSE_TOLERANCE) {
      return points.slice(0, -1);
    }
  }
  return points;
}

export function polygonArea(points: Point[]): number {
  const pts = points;
  const n = pts.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function polygonBBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function boundaryEdges(points: Point[]): [Point, Point][] {
  const n = points.length;
  const edges: [Point, Point][] = [];
  for (let i = 0; i < n; i++) edges.push([points[i], points[(i + 1) % n]]);
  return edges;
}

function orientation(a: Point, b: Point, c: Point): 0 | 1 | 2 {
  const val = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  if (Math.abs(val) < 1e-9) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    Math.min(a[0], b[0]) - 1e-9 <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) + 1e-9 &&
    Math.min(a[1], b[1]) - 1e-9 <= c[1] &&
    c[1] <= Math.max(a[1], b[1]) + 1e-9
  );
}

function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;
  return false;
}

// Rejects self-intersecting boundaries - used both for the client-side draw
// tool and as a server-side guard before generation ever runs.
export function isSimplePolygon(points: Point[]): boolean {
  const pts = dedupeClosingPoint(points);
  const n = pts.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    const a1 = pts[i];
    const a2 = pts[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      if (adjacent) continue;
      const b1 = pts[j];
      const b2 = pts[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) return false;
    }
  }
  return true;
}

function toTurfPolygon(points: Point[]) {
  const ring = [...points];
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) ring.push(ring[0]);
  return turfPolygon([ring]);
}

export type ClipResult = { ok: boolean; points: Point[] | null };

// Intersects `subject` with an (axis-aligned) clip polygon - used to cut a
// polygon by an infinite line, since the clip rect's edge stands in for the
// line. Returns ok:false for a MultiPolygon or a polygon-with-holes result -
// both mean the cut fragmented the subject in a way the guillotine algorithm
// can't represent as a single leaf/child region, and the caller should treat
// that as "this axis doesn't work here."
export function clipToPolygon(clipRect: Point[], subject: Point[]): ClipResult {
  const rectFeature = toTurfPolygon(clipRect);
  const subjectFeature = toTurfPolygon(subject);
  let result;
  try {
    result = intersect(featureCollection([rectFeature, subjectFeature]));
  } catch {
    return { ok: false, points: null };
  }
  if (!result) return { ok: true, points: null };
  if (result.geometry.type === "MultiPolygon") return { ok: false, points: null };
  const coords = result.geometry.coordinates;
  if (coords.length > 1) return { ok: false, points: null }; // has holes
  const ring = coords[0] as Point[];
  return { ok: true, points: ring.slice(0, ring.length - 1) };
}

export function rectFromRange(coordLo: number, coordHi: number, otherMin: number, otherMax: number, axis: "x" | "y"): Point[] {
  if (axis === "x") {
    return [
      [coordLo, otherMin],
      [coordHi, otherMin],
      [coordHi, otherMax],
      [coordLo, otherMax],
      [coordLo, otherMin],
    ];
  }
  return [
    [otherMin, coordLo],
    [otherMax, coordLo],
    [otherMax, coordHi],
    [otherMin, coordHi],
    [otherMin, coordLo],
  ];
}

export function halfPlaneRect(
  axis: "x" | "y",
  side: "lo" | "hi",
  offset: number,
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  margin: number
): Point[] {
  const minX = bbox.minX - margin;
  const maxX = bbox.maxX + margin;
  const minY = bbox.minY - margin;
  const maxY = bbox.maxY + margin;
  if (axis === "x") {
    const xa = side === "lo" ? minX : offset;
    const xb = side === "lo" ? offset : maxX;
    return rectFromRange(xa, xb, minY, maxY, "x");
  }
  const ya = side === "lo" ? minY : offset;
  const yb = side === "lo" ? offset : maxY;
  return rectFromRange(ya, yb, minX, maxX, "y");
}

// Union of sub-intervals (along the non-`axis` coordinate) where the
// polygon's own boundary runs exactly along `coordValue` on `axis` - i.e.
// where this polygon touches a straight cut line. Used for door placement:
// a room's final leaf polygon still has an edge sitting exactly on the
// corridor-strip line it was clipped against, so no separate polygon-overlap
// test against the corridor is needed.
export function edgeIntervalsOnLine(points: Point[], axis: "x" | "y", coordValue: number, tolerance: number): [number, number][] {
  const idx = axis === "x" ? 0 : 1;
  const otherIdx = axis === "x" ? 1 : 0;
  const intervals: [number, number][] = [];
  for (const [a, b] of boundaryEdges(points)) {
    if (Math.abs(a[idx] - coordValue) < tolerance && Math.abs(b[idx] - coordValue) < tolerance) {
      const lo = Math.min(a[otherIdx], b[otherIdx]);
      const hi = Math.max(a[otherIdx], b[otherIdx]);
      if (hi - lo > tolerance) intervals.push([lo, hi]);
    }
  }
  return intervals;
}
