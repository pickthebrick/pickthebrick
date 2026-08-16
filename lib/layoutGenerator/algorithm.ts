// Rule-based (deterministic, not ML) office layout generator - see the plan
// at prisma/schema.prisma's LayoutRoomType/LayoutAdjacencyRule/LayoutSettings
// for the admin-configured inputs. Recursively partitions the client-drawn
// boundary with real polygon clipping (not bounding-box math), so it can
// handle non-rectangular (L-shaped, slightly irregular) boundaries - but not
// every boundary: deep concave notches, donut/courtyard shapes, and
// narrow-neck ("dumbbell") shapes can make every cut fragment a side into
// disjoint pieces, which this algorithm can't represent as a single
// leaf/child region. That is treated as a hard failure (boundary_too_irregular)
// rather than attempting a best-effort/broken layout - this was an explicit
// founder decision, not an oversight.
import {
  boundaryEdges,
  clipToPolygon,
  dedupeClosingPoint,
  edgeIntervalsOnLine,
  halfPlaneRect,
  isSimplePolygon,
  polygonArea,
  polygonBBox,
  rectFromRange,
} from "./planarGeometry";
import type {
  AdjacencyRuleInput,
  GeneratedDoor,
  GeneratedRoom,
  GenerateLayoutOutcome,
  LayoutSettingsInput,
  Point,
  RoomProgramEntry,
} from "./types";

const EDGE_TOLERANCE = 1e-6;
const BINARY_SEARCH_ITERATIONS = 24;

type BoundaryFace = { axis: "x" | "y"; coordValue: number };

// Signed pairwise score between two room-type keys, built once per
// generation from the admin-configured adjacency rules. required/avoid
// dominate preferred by a large fixed margin so the greedy bipartition
// below satisfies them first and only optimizes preferred pairs
// approximately, as documented in the architecture plan.
function buildAdjacencyLookup(rules: AdjacencyRuleInput[]) {
  const scores = new Map<string, number>();
  for (const rule of rules) {
    const score =
      rule.relation === "required" ? 10000 + rule.weight : rule.relation === "avoid" ? -(10000 + rule.weight) : rule.weight;
    const key = [rule.roomTypeA, rule.roomTypeB].sort().join("|");
    scores.set(key, score);
  }
  return {
    get(a: string, b: string): number {
      if (a === b) return 0;
      return scores.get([a, b].sort().join("|")) ?? 0;
    },
  };
}

type AdjacencyLookup = ReturnType<typeof buildAdjacencyLookup>;

// Greedy bipartition of a room subset into two sides, driven by adjacency
// weight rather than a search - the mechanism that makes "adjacency via
// split order" work: two rooms with a `required` link get pulled onto the
// same side early and stay together through the rest of the recursion.
function bipartitionRooms(rooms: RoomProgramEntry[], adjacency: AdjacencyLookup): { r1: RoomProgramEntry[]; r2: RoomProgramEntry[] } {
  if (rooms.length <= 1) return { r1: rooms, r2: [] };
  if (rooms.length === 2) return { r1: [rooms[0]], r2: [rooms[1]] };

  const weight = (a: RoomProgramEntry, b: RoomProgramEntry) => adjacency.get(a.spaceKey, b.spaceKey);

  let seedA = rooms[0];
  let seedB = rooms[1];
  let bestAvoid = Infinity;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const w = weight(rooms[i], rooms[j]);
      if (w < bestAvoid) {
        bestAvoid = w;
        seedA = rooms[i];
        seedB = rooms[j];
      }
    }
  }
  if (bestAvoid >= 0) {
    // No avoid relation anywhere in this subset - seed instead from the
    // least-connected room, and its weakest link, so a tightly-clustered
    // group of required/preferred rooms doesn't get needlessly split.
    let minDegree = Infinity;
    for (const r of rooms) {
      let degree = 0;
      for (const other of rooms) if (other !== r) degree += Math.abs(weight(r, other));
      if (degree < minDegree) {
        minDegree = degree;
        seedA = r;
      }
    }
    let minToSeedA = Infinity;
    for (const r of rooms) {
      if (r === seedA) continue;
      const w = weight(seedA, r);
      if (w < minToSeedA) {
        minToSeedA = w;
        seedB = r;
      }
    }
  }

  const r1: RoomProgramEntry[] = [seedA];
  const r2: RoomProgramEntry[] = [seedB];
  const remaining = rooms.filter((r) => r !== seedA && r !== seedB);

  const totalWeightMagnitude = (r: RoomProgramEntry) =>
    rooms.reduce((sum, other) => (other === r ? sum : sum + Math.abs(weight(r, other))), 0);
  remaining.sort((a, b) => totalWeightMagnitude(b) - totalWeightMagnitude(a));

  for (const room of remaining) {
    const scoreR1 = r1.reduce((sum, r) => sum + weight(room, r), 0);
    const scoreR2 = r2.reduce((sum, r) => sum + weight(room, r), 0);
    if (scoreR1 >= scoreR2) r1.push(room);
    else r2.push(room);
  }

  return { r1, r2 };
}

// Binary-searches the offset (along `axis`) that splits `polygon`'s actual
// area (not just its bounding box) into the given fraction on the "lo" side
// - necessary because a straight cut at a fixed fraction of the bbox width
// does not produce that same area fraction on an irregular polygon.
function findSplitOffset(
  polygon: Point[],
  axis: "x" | "y",
  targetFractionLo: number,
  bbox: ReturnType<typeof polygonBBox>,
  margin: number,
  totalArea: number
): number | null {
  let lo = axis === "x" ? bbox.minX : bbox.minY;
  let hi = axis === "x" ? bbox.maxX : bbox.maxY;
  const targetArea = totalArea * targetFractionLo;
  let mid = (lo + hi) / 2;
  for (let i = 0; i < BINARY_SEARCH_ITERATIONS; i++) {
    mid = (lo + hi) / 2;
    const loRect = halfPlaneRect(axis, "lo", mid, bbox, margin);
    const clip = clipToPolygon(loRect, polygon);
    if (!clip.ok) return null;
    const area = clip.points ? polygonArea(clip.points) : 0;
    if (area < targetArea) lo = mid;
    else hi = mid;
  }
  return mid;
}

type SplitWithCorridor = {
  loPoints: Point[];
  hiPoints: Point[];
  corridor: Point[] | null;
  loFaceCoord: number;
  hiFaceCoord: number;
};

// Finds a cut of `polygon` along `axis` achieving the target area ratio,
// then carves a corridorWidth-wide strip out along that cut line before
// handing back the two room-side polygons - so rooms on either side never
// overlap the corridor, and every room touches a corridor or a
// corridor-touching room by construction.
function trySplitWithCorridor(
  polygon: Point[],
  axis: "x" | "y",
  targetFractionLo: number,
  corridorWidth: number,
  minPieceArea: number
): SplitWithCorridor | null {
  const bbox = polygonBBox(polygon);
  const span = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
  const margin = span * 4 + 1000;
  const totalArea = polygonArea(polygon);
  if (totalArea < minPieceArea) return null;

  const offset = findSplitOffset(polygon, axis, targetFractionLo, bbox, margin, totalArea);
  if (offset === null) return null;

  const half = corridorWidth / 2;
  const loCoord = offset - half;
  const hiCoord = offset + half;

  const loRect = halfPlaneRect(axis, "lo", loCoord, bbox, margin);
  const hiRect = halfPlaneRect(axis, "hi", hiCoord, bbox, margin);
  const loClip = clipToPolygon(loRect, polygon);
  const hiClip = clipToPolygon(hiRect, polygon);
  if (!loClip.ok || !hiClip.ok || !loClip.points || !hiClip.points) return null;
  if (polygonArea(loClip.points) < minPieceArea || polygonArea(hiClip.points) < minPieceArea) return null;

  let corridor: Point[] | null = null;
  if (corridorWidth > 0) {
    const otherMin = axis === "x" ? bbox.minY - margin : bbox.minX - margin;
    const otherMax = axis === "x" ? bbox.maxY + margin : bbox.maxX + margin;
    const corridorRect = rectFromRange(loCoord, hiCoord, otherMin, otherMax, axis);
    const corridorClip = clipToPolygon(corridorRect, polygon);
    if (corridorClip.ok && corridorClip.points && polygonArea(corridorClip.points) > minPieceArea) {
      corridor = corridorClip.points;
    }
  }

  return { loPoints: loClip.points, hiPoints: hiClip.points, corridor, loFaceCoord: loCoord, hiFaceCoord: hiCoord };
}

// Places one door on a leaf room's boundary, on whichever recorded
// corridor-facing cut line gives it the longest run of shared straight
// edge - falling back to the room's own longest boundary edge if none of
// the recorded faces still touch it (can happen after further sibling
// splits reshape a room slightly).
function placeDoor(polygon: Point[], faces: BoundaryFace[], doorWidth: number): GeneratedDoor | null {
  let best: { interval: [number, number]; axis: "x" | "y"; coordValue: number } | null = null;
  for (const face of faces) {
    const intervals = edgeIntervalsOnLine(polygon, face.axis, face.coordValue, EDGE_TOLERANCE);
    for (const interval of intervals) {
      const len = interval[1] - interval[0];
      const bestLen = best ? best.interval[1] - best.interval[0] : -1;
      if (len > bestLen) best = { interval, axis: face.axis, coordValue: face.coordValue };
    }
  }

  if (!best) {
    const edges = boundaryEdges(polygon);
    if (edges.length === 0) return null;
    let longest = edges[0];
    let longestLen = -1;
    for (const e of edges) {
      const len = Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]);
      if (len > longestLen) {
        longestLen = len;
        longest = e;
      }
    }
    if (longestLen < EDGE_TOLERANCE) return null;
    const axis: "x" | "y" = Math.abs(longest[0][0] - longest[1][0]) >= Math.abs(longest[0][1] - longest[1][1]) ? "x" : "y";
    const center: Point = [(longest[0][0] + longest[1][0]) / 2, (longest[0][1] + longest[1][1]) / 2];
    return { center, axis, width: Math.min(doorWidth, longestLen) };
  }

  const mid = (best.interval[0] + best.interval[1]) / 2;
  const available = best.interval[1] - best.interval[0];
  const width = Math.max(Math.min(doorWidth, available - EDGE_TOLERANCE), 0);
  const center: Point = best.axis === "x" ? [best.coordValue, mid] : [mid, best.coordValue];
  return { center, axis: best.axis, width };
}

export type GenerateLayoutInput = {
  boundary: Point[];
  rooms: RoomProgramEntry[];
  adjacencyRules: AdjacencyRuleInput[];
  settings: LayoutSettingsInput;
};

export function generateLayout(input: GenerateLayoutInput): GenerateLayoutOutcome {
  const boundary = dedupeClosingPoint(input.boundary);
  if (input.rooms.length === 0) {
    return { ok: false, reason: "invalid_boundary", message: "No rooms to place - finish the Spaces step first." };
  }
  if (!isSimplePolygon(boundary)) {
    return {
      ok: false,
      reason: "invalid_boundary",
      message: "The drawn boundary isn't a valid shape - redraw it without crossing lines.",
    };
  }

  const adjacency = buildAdjacencyLookup(input.adjacencyRules);
  const rooms: GeneratedRoom[] = [];
  const corridors: { polygon: Point[] }[] = [];
  const totalTargetArea = input.rooms.reduce((s, r) => s + r.targetArea, 0);
  const minPieceArea = Math.max(totalTargetArea * 0.001, 1e-6);

  function recurse(polygon: Point[], subset: RoomProgramEntry[], faces: BoundaryFace[]): boolean {
    if (subset.length === 0) return true;

    if (subset.length === 1) {
      const entry = subset[0];
      const door = placeDoor(polygon, faces, input.settings.doorWidth);
      rooms.push({
        spaceKey: entry.spaceKey,
        instanceLabel: entry.instanceLabel,
        color: entry.color,
        polygon,
        doors: door ? [door] : [],
      });
      return true;
    }

    const { r1, r2 } = bipartitionRooms(subset, adjacency);
    if (r1.length === 0 || r2.length === 0) return false;

    const subsetTargetArea = subset.reduce((s, r) => s + r.targetArea, 0);
    const targetFractionLo = subsetTargetArea > 0 ? r1.reduce((s, r) => s + r.targetArea, 0) / subsetTargetArea : r1.length / subset.length;

    const bbox = polygonBBox(polygon);
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;
    const primaryAxis: "x" | "y" = width >= height ? "x" : "y";
    const axes: ("x" | "y")[] = [primaryAxis, primaryAxis === "x" ? "y" : "x"];

    for (const axis of axes) {
      const split = trySplitWithCorridor(polygon, axis, targetFractionLo, input.settings.corridorWidth, minPieceArea);
      if (!split) continue;

      // Tentatively commit this split's corridor/rooms, then roll back if a
      // deeper node fails - a geometrically valid split here can still lead
      // to an unsalvageable descendant, and the *other* axis at this same
      // node may avoid that problem entirely.
      const corridorsLenBefore = corridors.length;
      const roomsLenBefore = rooms.length;
      if (split.corridor) corridors.push({ polygon: split.corridor });

      const loFaces = [...faces, { axis, coordValue: split.loFaceCoord }];
      const hiFaces = [...faces, { axis, coordValue: split.hiFaceCoord }];
      const loOk = recurse(split.loPoints, r1, loFaces);
      const hiOk = loOk && recurse(split.hiPoints, r2, hiFaces);
      if (loOk && hiOk) return true;

      corridors.length = corridorsLenBefore;
      rooms.length = roomsLenBefore;
    }

    return false;
  }

  const success = recurse(boundary, input.rooms, []);
  if (!success) {
    return {
      ok: false,
      reason: "boundary_too_irregular",
      message: "This boundary shape is too irregular for auto-layout - simplify it or request a site visit.",
    };
  }

  return { ok: true, result: { rooms, corridors } };
}
