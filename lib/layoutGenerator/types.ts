// Shared types for the rule-based auto layout generator (see algorithm.ts).
// Coordinates are plain Cartesian [x, y] pairs in the same unit as
// DesignRequest.sqft / LayoutRoomType areas (feet) - NOT lng/lat. This
// matters for algorithm.ts's choice to hand-roll area/centroid math instead
// of turf's area/buffer/distance helpers, which assume geodesic (degrees)
// input and would silently produce nonsense on plain floor-plan coordinates.
export type Point = [number, number];

export type LayoutAdjacencyRelationValue = "required" | "preferred" | "avoid";

export type AdjacencyRuleInput = {
  roomTypeA: string;
  roomTypeB: string;
  relation: LayoutAdjacencyRelationValue;
  weight: number;
};

export type LayoutSettingsInput = {
  corridorWidth: number;
  doorWidth: number;
  minRoomClearance: number;
};

// One instance to place - e.g. "Executive Cabin #2" - as produced by
// roomProgram.ts's buildRoomProgram().
export type RoomProgramEntry = {
  spaceKey: string;
  instanceLabel: string;
  targetArea: number;
  minWidth: number;
  minLength: number;
  color: string;
};

export type GeneratedDoor = {
  center: Point;
  // Axis the door opening runs along (a door on a wall parallel to the
  // x-axis has axis "x", etc.) - lets the renderer draw the gap correctly.
  axis: "x" | "y";
  width: number;
};

export type GeneratedRoom = {
  spaceKey: string;
  instanceLabel: string;
  color: string;
  polygon: Point[];
  doors: GeneratedDoor[];
};

export type GeneratedCorridor = {
  polygon: Point[];
};

export type LayoutResult = {
  rooms: GeneratedRoom[];
  corridors: GeneratedCorridor[];
};

export type GenerateLayoutFailureReason = "invalid_boundary" | "boundary_too_irregular";

export type GenerateLayoutOutcome =
  | { ok: true; result: LayoutResult }
  | { ok: false; reason: GenerateLayoutFailureReason; message: string };

// Doors/windows/columns the client marked on the drawing board -
// informational only (see DesignRequestLayout.annotationsJson in
// schema.prisma). The algorithm always places its own doors and never reads
// any of this back in.
export type LayoutLineMark = { start: Point; end: Point };
export type LayoutColumnShape = "rect" | "oval";
export type LayoutColumnMark = { shape: LayoutColumnShape; center: Point; width: number; height: number };
export type LayoutAnnotations = { doors: LayoutLineMark[]; windows: LayoutLineMark[]; columns: LayoutColumnMark[] };
