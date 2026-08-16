import "dotenv/config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";

async function main() {
  const roomTypes = [
    { spaceKey: "reception", minWidth: 8, minLength: 10, targetArea: 100, color: "#f4a259" },
    { spaceKey: "meetingRoom", minWidth: 10, minLength: 12, targetArea: 150, color: "#5b8dee" },
  ];
  for (const [i, rt] of roomTypes.entries()) {
    await prisma.layoutRoomType.upsert({ where: { spaceKey: rt.spaceKey }, create: { ...rt, sortOrder: i }, update: rt });
  }
  await prisma.layoutSettings.upsert({
    where: { id: "layout-settings" },
    create: { id: "layout-settings", corridorWidth: 4, doorWidth: 3, minRoomClearance: 0, estimatedCorridorOverheadPct: 0.15, currentAlgorithmVersion: 1 },
    update: { corridorWidth: 4, doorWidth: 3, estimatedCorridorOverheadPct: 0.15 },
  });

  const email = "boundary-test-client@pickthebrick.test";
  const passwordHash = await bcrypt.hash("TestClient123!", 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: Role.client, fullName: "Boundary Test Client" },
    update: { passwordHash },
  });

  await prisma.designRequest.deleteMany({ where: { clientId: user.id } });
  const request = await prisma.designRequest.create({
    data: {
      clientId: user.id,
      packageKey: "essential",
      sqft: 1000,
      status: DesignRequestStatus.submitted,
      submittedAt: new Date(),
      spaceEntries: {
        create: [
          { spaceKey: "reception", sortOrder: 0 },
          { spaceKey: "meetingRoom", sortOrder: 1 },
        ],
      },
    },
  });

  console.log("EMAIL", email);
  console.log("PASSWORD", "TestClient123!");
  console.log("DESIGN_REQUEST_ID", request.id);
}
main().catch((e) => { console.error("ERROR", e); process.exitCode = 1; }).finally(() => process.exit());
