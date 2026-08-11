import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/enums";

// One-off admin utility: sets superadmin@pickthebrick.com's role to
// super_admin. The account was found signing in with role: admin instead -
// this repairs that in place without touching email/password. Bearer-key
// protected like the sibling /api/admin/products routes. Meant to be
// deleted again right after the one task it was added for (see git history
// around when this file was introduced).
export async function POST(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: "superadmin@pickthebrick.com" } });
  if (!user) {
    return NextResponse.json({ error: "No account with that email found" }, { status: 404 });
  }

  const before = user.role;
  await prisma.user.update({ where: { id: user.id }, data: { role: Role.super_admin } });

  return NextResponse.json({ success: true, id: user.id, roleBefore: before, roleAfter: Role.super_admin });
}
