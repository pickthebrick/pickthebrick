/**
 * Seeds the catalog (categories/types/subtypes/products) straight out of the
 * prototype HTML's hardcoded `categoryMeta` / `catalog` / `enabledCategories`
 * JS objects, and creates one captain/contractor/admin test login for local
 * dev (role promotion otherwise has to be a manual edit via `npx prisma studio`).
 *
 * Usage: npm run seed  (or: npx prisma db seed)
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { Role } from "../app/generated/prisma/enums";

const prisma = new PrismaClient();

type Product = { name: string; rate: number; install: number };
type Subtype = { label: string; products: Product[] };
type Type = { label: string; subtypes: Record<string, Subtype> };
type CategoryMeta = {
  label: string;
  subtitle: string;
  unit: "sqm" | "lm" | "count";
  highlight: string;
};

function extractCatalogFromHtml(htmlPath: string) {
  const html = readFileSync(htmlPath, "utf-8");
  const start = html.indexOf("const categoryMeta");
  const end = html.indexOf("let state = {");
  if (start === -1 || end === -1) {
    throw new Error(
      "Could not find the catalog data block in the prototype HTML (markers 'const categoryMeta' / 'let state = {' not found)."
    );
  }
  const code = html.slice(start, end);
  const result = vm.runInNewContext(`${code}\n;({ categoryMeta, enabledCategories, catalog });`) as {
    categoryMeta: Record<string, CategoryMeta>;
    enabledCategories: string[];
    catalog: Record<string, Record<string, Type>>;
  };
  return result;
}

async function reseedCatalog(htmlPath: string) {
  const { categoryMeta, enabledCategories, catalog } = extractCatalogFromHtml(htmlPath);

  console.log("Clearing existing catalog rows (cascades to types/subtypes/products)...");
  await prisma.category.deleteMany();

  let categorySort = 0;
  for (const [catKey, meta] of Object.entries(categoryMeta)) {
    const category = await prisma.category.create({
      data: {
        key: catKey,
        label: meta.label,
        subtitle: meta.subtitle,
        unit: meta.unit,
        highlight: meta.highlight,
        enabled: enabledCategories.includes(catKey),
        sortOrder: categorySort++,
      },
    });

    const types = catalog[catKey];
    if (!types) continue;

    let typeSort = 0;
    for (const [typeKey, type] of Object.entries(types)) {
      const typeRow = await prisma.type.create({
        data: { categoryId: category.id, key: typeKey, label: type.label, sortOrder: typeSort++ },
      });

      let subtypeSort = 0;
      for (const [subtypeKey, subtype] of Object.entries(type.subtypes)) {
        const subtypeRow = await prisma.subtype.create({
          data: { typeId: typeRow.id, key: subtypeKey, label: subtype.label, sortOrder: subtypeSort++ },
        });

        // Pricing is a single all-inclusive rate now (no separate install
        // charge), so the prototype's install figure is folded straight in.
        await prisma.product.createMany({
          data: subtype.products.map((p, i) => ({
            subtypeId: subtypeRow.id,
            name: p.name,
            rate: p.rate + p.install,
            sortOrder: i,
          })),
        });
      }
    }
    console.log(`  seeded category "${meta.label}"`);
  }
}

async function ensureTestUser(email: string, role: Role, fullName: string) {
  const password = "PickTheBrick123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, fullName, role },
    update: { role, fullName },
  });

  console.log(`  ${role}: ${email} / ${password}`);
}

async function main() {
  const htmlPath = process.argv[2] ?? path.resolve(__dirname, "../pickthebrick-flooring-prototype.html");
  console.log(`Reading catalog data from ${htmlPath}`);
  await reseedCatalog(htmlPath);

  console.log("Seeding test staff logins (local/dev only)...");
  await ensureTestUser("captain@pickthebrick.test", Role.captain, "Test Captain");
  await ensureTestUser("contractor@pickthebrick.test", Role.contractor, "Test Contractor");
  await ensureTestUser("admin@pickthebrick.test", Role.admin, "Test Admin");
  await ensureTestUser("designer@pickthebrick.test", Role.designer, "Test Designer");

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
