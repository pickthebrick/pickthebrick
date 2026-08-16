import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { SPACES } from "@/lib/spaces";
import AdminShell from "../AdminShell";
import AiDesignerClient from "./AiDesignerClient";
import "../../dashboard.css";

const LAYOUT_SETTINGS_ID = "layout-settings";
const LAYOUT_CONSTITUTION_ID = "layout-constitution";

export default async function AdminAiDesignerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.super_admin) redirect(ROLE_HOME[session.role]);

  const [roomTypes, adjacencyRules, settings, constitution] = await Promise.all([
    prisma.layoutRoomType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.layoutAdjacencyRule.findMany(),
    prisma.layoutSettings.findUnique({ where: { id: LAYOUT_SETTINGS_ID } }),
    prisma.layoutConstitution.upsert({
      where: { id: LAYOUT_CONSTITUTION_ID },
      create: { id: LAYOUT_CONSTITUTION_ID, designPhilosophy: "", circulationStandards: "", roomSizingNotes: "", terminology: "" },
      update: {},
    }),
  ]);

  return (
    <AdminShell active="aiDesigner" isSuperAdmin>
      <h1>AI Designer</h1>
      <p className="sub">
        Configuration for the rule-based layout generator on the Design flow&apos;s handover step - minimum room
        sizes, which room types should (or shouldn&apos;t) sit next to each other, corridor/door widths, and the
        reference knowledge behind those numbers. Nothing here is seeded with real standards yet; the generator
        can&apos;t produce a layout for a room type until it has a row below.
      </p>
      <AiDesignerClient
        spaces={SPACES}
        roomTypes={roomTypes}
        adjacencyRules={adjacencyRules}
        settings={settings}
        constitution={constitution}
      />
    </AdminShell>
  );
}
