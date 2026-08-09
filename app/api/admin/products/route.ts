import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Read-only product listing for scripted/agent use (e.g. Claude Cowork
// resolving a productId to attach files to, when it added those products
// through the admin UI directly rather than via /api/admin/products/import
// and so never got an id back). Same bearer-key auth as the sibling routes.

export async function GET(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      rate: true,
      unit: true,
      subtype: {
        select: {
          label: true,
          type: { select: { label: true, category: { select: { label: true } } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const results = products.map((p) => ({
    productId: p.id,
    name: p.name,
    rate: p.rate,
    unit: p.unit,
    category: p.subtype.type.category.label,
    type: p.subtype.type.label,
    subtype: p.subtype.label,
  }));

  return NextResponse.json({ products: results });
}

// Bulk delete, for cleaning up scripted/duplicate imports. Body: { productIds: string[] }.
export async function DELETE(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { productIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.productIds) || body.productIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: 'Body must be { "productIds": string[] }' }, { status: 400 });
  }
  const productIds = body.productIds as string[];

  const { count } = await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  return NextResponse.json({ requested: productIds.length, deleted: count });
}
