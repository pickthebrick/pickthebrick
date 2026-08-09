import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Unit } from "@/app/generated/prisma/enums";

// Partial update for a single existing product, keyed by the productId
// returned by /api/admin/products/import - lets a script (e.g. Claude
// Cowork) correct a rate or other field in place instead of re-running the
// import (which would create a duplicate row with a new id and orphan any
// files already attached via /api/admin/products/files). Same bearer-key
// auth as the sibling routes.

const UNITS = new Set(["sqm", "lm", "count"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: `No product with id "${id}"` }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { name?: string; rate?: number; unit?: Unit | null; description?: string | null; featured?: boolean } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if ("rate" in body) {
    if (typeof body.rate !== "number" || !Number.isFinite(body.rate) || body.rate < 0) {
      return NextResponse.json({ error: "rate must be a non-negative number" }, { status: 400 });
    }
    data.rate = body.rate;
  }
  if ("unit" in body) {
    if (body.unit !== null && !UNITS.has(body.unit as string)) {
      return NextResponse.json({ error: "unit must be sqm, lm, count, or null" }, { status: 400 });
    }
    data.unit = body.unit as Unit | null;
  }
  if ("description" in body) {
    if (body.description !== null && typeof body.description !== "string") {
      return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
    }
    data.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if ("featured" in body) {
    if (typeof body.featured !== "boolean") {
      return NextResponse.json({ error: "featured must be a boolean" }, { status: 400 });
    }
    data.featured = body.featured;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No recognized fields to update - use name, rate, unit, description, and/or featured" },
      { status: 400 },
    );
  }

  const updated = await prisma.product.update({ where: { id }, data });

  revalidatePath("/admin/products");
  revalidatePath("/build");

  return NextResponse.json({
    status: "updated",
    productId: updated.id,
    name: updated.name,
    rate: updated.rate,
    unit: updated.unit,
    description: updated.description,
    featured: updated.featured,
  });
}
