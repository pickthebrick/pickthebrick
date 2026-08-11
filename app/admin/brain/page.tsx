import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import BrainWorkspace from "./BrainWorkspace";
import { SEED_CHECKLIST } from "./data";
import { inter, jetbrainsMono } from "./fonts";
import "./brain.css";

export default async function BrainPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.super_admin) redirect(ROLE_HOME[session.role]);

  const existingCount = await prisma.brainChecklistItem.count();
  if (existingCount === 0) {
    await prisma.brainChecklistItem.createMany({
      data: SEED_CHECKLIST.map((item, i) => ({ text: item.text, done: item.done, sortOrder: i })),
    });
  }

  const checklist = await prisma.brainChecklistItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <BrainWorkspace initialChecklist={checklist} />
    </div>
  );
}
