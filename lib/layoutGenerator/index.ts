export { generateLayout } from "./algorithm";
export { isSimplePolygon } from "./planarGeometry";
export { buildRoomProgram, checkFeasibility } from "./roomProgram";
export type {
  AdjacencyRuleInput,
  GeneratedCorridor,
  GeneratedDoor,
  GeneratedRoom,
  GenerateLayoutFailureReason,
  GenerateLayoutOutcome,
  LayoutAdjacencyRelationValue,
  LayoutAnnotations,
  LayoutLineMark,
  LayoutResult,
  LayoutSettingsInput,
  Point,
  RoomProgramEntry,
} from "./types";
export type { GenerateLayoutInput } from "./algorithm";
export type { RoomProgramOutcome } from "./roomProgram";
