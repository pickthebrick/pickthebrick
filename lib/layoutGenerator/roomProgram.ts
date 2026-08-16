// Turns a DesignRequest's Spaces-step answers into the room program the
// layout algorithm consumes. The survey supplies WHAT rooms and HOW MANY;
// the admin-configured LayoutRoomType table supplies HOW BIG each one should
// be - chair/desk-count-based scaling is deliberately not implemented here,
// since no real sizing formula exists yet (see the architecture plan).
import { prisma } from "@/lib/prisma";
import { labelSpaceInstances } from "@/lib/spaces";
import type { RoomProgramEntry } from "./types";

export type RoomProgramOutcome =
  | { ok: true; rooms: RoomProgramEntry[]; totalMinArea: number }
  | { ok: false; reason: "no_spaces" | "missing_room_type_config"; detail: string };

export async function buildRoomProgram(designRequestId: string): Promise<RoomProgramOutcome> {
  const spaceEntries = await prisma.designRequestSpace.findMany({
    where: { designRequestId },
    orderBy: { sortOrder: "asc" },
  });
  if (spaceEntries.length === 0) {
    return {
      ok: false,
      reason: "no_spaces",
      detail: "This design request has no rooms yet - finish the Spaces step first.",
    };
  }

  const labeled = labelSpaceInstances(spaceEntries);
  const roomTypes = await prisma.layoutRoomType.findMany();
  const roomTypeByKey = new Map(roomTypes.map((rt) => [rt.spaceKey, rt]));

  const rooms: RoomProgramEntry[] = [];
  const missingKeys = new Set<string>();
  for (const entry of labeled) {
    const roomType = roomTypeByKey.get(entry.spaceKey);
    if (!roomType) {
      missingKeys.add(entry.spaceKey);
      continue;
    }
    rooms.push({
      spaceKey: entry.spaceKey,
      instanceLabel: entry.label,
      targetArea: roomType.targetArea,
      minWidth: roomType.minWidth,
      minLength: roomType.minLength,
      color: roomType.color,
    });
  }

  // A survey key with no matching admin config fails the whole mapping
  // rather than silently dropping that room from the generated layout.
  if (missingKeys.size > 0) {
    return {
      ok: false,
      reason: "missing_room_type_config",
      detail: `Layout rules aren't set up yet for: ${[...missingKeys].join(", ")}. Add them in Admin → AI Designer first.`,
    };
  }

  const totalMinArea = rooms.reduce((sum, r) => sum + r.minWidth * r.minLength, 0);
  return { ok: true, rooms, totalMinArea };
}

// Sanity check before even attempting generation - a soft signal only (the
// client can proceed past a "may be tight" warning; this never blocks).
export function checkFeasibility(sqft: number, totalMinArea: number, corridorOverheadPct: number) {
  const utilizationPct = sqft > 0 ? (totalMinArea * (1 + corridorOverheadPct)) / sqft : Infinity;
  return { feasible: utilizationPct <= 1, utilizationPct };
}
