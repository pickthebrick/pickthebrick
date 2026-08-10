import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

// One-off admin utility: resets the super_admin account's login email and
// password. Bearer-key protected like the sibling /api/admin/products
// routes - this is a standing "take over the top admin account" capability
// though, so it's meant to be deleted again right after the one task it was
// added for (see git history around when this file was introduced).
export async function POST(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const superAdmin = await prisma.user.findFirst({ where: { role: Role.super_admin } });
  if (!superAdmin) {
    return NextResponse.json({ error: "No super_admin account found" }, { status: 404 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: { email: email.trim().toLowerCase(), passwordHash },
  });

  return NextResponse.json({ success: true, id: superAdmin.id, email: email.trim().toLowerCase() });
}
