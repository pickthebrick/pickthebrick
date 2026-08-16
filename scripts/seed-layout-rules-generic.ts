// Generic placeholder starting values for the AI Designer's LayoutRoomType/
// LayoutSettings tables - NOT real sizing standards, just plausible ballpark
// numbers so the generator has something to work with and the admin has
// something to look at/adjust from, instead of every field being blank.
// Edit these for real via /admin/ai-designer once actual standards are set.
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const ROOM_TYPES: { spaceKey: string; minWidth: number; minLength: number; targetArea: number; color: string; sortOrder: number }[] = [
  { spaceKey: "reception", minWidth: 10, minLength: 12, targetArea: 150, color: "#f4a259", sortOrder: 0 },
  { spaceKey: "meetingRoom", minWidth: 10, minLength: 14, targetArea: 180, color: "#5b8dee", sortOrder: 1 },
  { spaceKey: "openWorkstation", minWidth: 15, minLength: 15, targetArea: 300, color: "#7fb069", sortOrder: 2 },
  { spaceKey: "closedWorkstation", minWidth: 8, minLength: 10, targetArea: 90, color: "#9d8df1", sortOrder: 3 },
  { spaceKey: "executiveCabin", minWidth: 10, minLength: 12, targetArea: 140, color: "#d4a373", sortOrder: 4 },
  { spaceKey: "storeRoom", minWidth: 6, minLength: 8, targetArea: 60, color: "#a8a29e", sortOrder: 5 },
  { spaceKey: "serveRoom", minWidth: 6, minLength: 8, targetArea: 60, color: "#ca8a8a", sortOrder: 6 },
  { spaceKey: "prayerRoom", minWidth: 6, minLength: 8, targetArea: 60, color: "#8fb8a8", sortOrder: 7 },
  { spaceKey: "pantry", minWidth: 8, minLength: 10, targetArea: 90, color: "#e0b04d", sortOrder: 8 },
  { spaceKey: "washroom", minWidth: 6, minLength: 8, targetArea: 60, color: "#93a8c9", sortOrder: 9 },
];

async function main() {
  for (const rt of ROOM_TYPES) {
    await prisma.layoutRoomType.upsert({
      where: { spaceKey: rt.spaceKey },
      create: rt,
      update: rt,
    });
  }
  await prisma.layoutSettings.upsert({
    where: { id: "layout-settings" },
    create: {
      id: "layout-settings",
      corridorWidth: 4,
      doorWidth: 3,
      minRoomClearance: 1,
      estimatedCorridorOverheadPct: 0.15,
      currentAlgorithmVersion: 1,
    },
    update: {
      corridorWidth: 4,
      doorWidth: 3,
      minRoomClearance: 1,
      estimatedCorridorOverheadPct: 0.15,
    },
  });
  console.log(`Seeded ${ROOM_TYPES.length} generic room types + circulation settings.`);
}

main()
  .catch((e) => {
    console.error("ERROR", e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
