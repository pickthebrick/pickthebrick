import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";

// Attaches a single local file (image, data sheet, or method statement) to
// an already-existing product - the multipart counterpart to
// app/api/admin/products/import/route.ts, which only accepts remote image
// URLs. Built for scripted/agent use (e.g. Claude Cowork) where the files
// are generated locally and were never hosted anywhere. Same bearer-key
// auth as the JSON import route; see proxy.ts for why /api/* skips the
// cookie-session gate.

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Maps the request's `type` field to this app's real vocabulary: the
// client-facing ProductModal.tsx only recognizes ProductDownload.kind
// values "datasheet"/"method"/"3d"/"other" (see DOWNLOAD_KINDS there and in
// ProductEditModal.tsx) - "data_sheet"/"method_statement" here are just the
// friendlier request-facing spellings of those two.
const DOWNLOAD_TYPES: Record<string, { kind: string; label: string }> = {
  data_sheet: { kind: "datasheet", label: "Data Sheet" },
  method_statement: { kind: "method", label: "Method Statement" },
};
const DOWNLOAD_EXTENSIONS = new Set(["pdf", "doc", "docx", "glb", "gltf", "zip", "jpg", "jpeg", "png"]);

export async function POST(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const productId = form.get("productId");
  const type = form.get("type");
  const file = form.get("file");
  const label = form.get("label");

  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "Missing productId (the Product.id returned by /api/admin/products/import)" }, { status: 400 });
  }
  if (typeof type !== "string" || (type !== "image" && !DOWNLOAD_TYPES[type])) {
    return NextResponse.json({ error: 'type must be "image", "data_sheet", or "method_statement"' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: `No product with id "${productId}"` }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (type === "image") {
    const ext = IMAGE_CONTENT_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: `Unsupported image type "${file.type}" - use JPG, PNG, WEBP, or GIF` }, { status: 400 });
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = await uploadToStorage("product-images", filename, buffer, file.type);
    const count = await prisma.productImage.count({ where: { productId } });
    const image = await prisma.productImage.create({ data: { productId, path, sortOrder: count } });

    revalidatePath("/admin/products");
    revalidatePath("/build");
    return NextResponse.json({ status: "created", kind: "image", id: image.id, url: path });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOWNLOAD_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Please upload a PDF, Word doc, GLB/GLTF, ZIP, JPG, or PNG file" }, { status: 400 });
  }
  const { kind, label: defaultLabel } = DOWNLOAD_TYPES[type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = await uploadToStorage("product-downloads", filename, buffer, file.type || undefined);
  const count = await prisma.productDownload.count({ where: { productId } });
  const download = await prisma.productDownload.create({
    data: {
      productId,
      label: typeof label === "string" && label.trim() ? label.trim() : defaultLabel,
      kind,
      filePath,
      sortOrder: count,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/build");
  return NextResponse.json({ status: "created", kind, id: download.id, url: filePath });
}
