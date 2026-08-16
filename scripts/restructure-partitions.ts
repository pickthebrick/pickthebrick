// One-off: restructure the Partitions category taxonomy per user spec.
// - Glass Partitions: relabel "Double Glazed (Acoustic)" -> "Double Glazed"
// - Gypsum Partitions: unchanged
// - Aluminium Framed Partitions: unchanged
// - Solid Partitions -> "Solid Walls": drop Studwork Wall (+ its 5 products),
//   add empty "Cement Board" subtype
// - Demountable Partitions -> retired: its Sliding Panel subtype (+ 5
//   products) moves to a new "Sliding Partitions" type; Modular Panel
//   subtype (+ 5 products) is dropped
// - Acoustic Partitions -> retired entirely (2 subtypes, 10 products)
// - New "Wall Lining (Cladding)" type with 4 empty subtypes: Acoustic
//   Lining, Wood Lining, Glass Lining, Green Wall
// Run with: npx tsx scripts/restructure-partitions.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const category = await prisma.category.findFirstOrThrow({
    where: { label: { equals: "Partitions", mode: "insensitive" } },
  });
  const categoryId = category.id;

  const glass = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "glass" } });
  const solid = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "solid" } });
  const demountable = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "demountable" } });
  const acoustic = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "acoustic" } });

  // 1. Glass: relabel Double Glazed (Acoustic) -> Double Glazed
  const doubleGlazed = await prisma.subtype.findFirstOrThrow({ where: { typeId: glass.id, key: "doubleGlazedAcoustic" } });
  await prisma.subtype.update({ where: { id: doubleGlazed.id }, data: { label: "Double Glazed" } });
  console.log("Relabeled Double Glazed (Acoustic) -> Double Glazed");

  // 2. Solid -> Solid Walls: drop Studwork Wall, add Cement Board
  await prisma.type.update({ where: { id: solid.id }, data: { label: "Solid Walls", sortOrder: 4 } });
  const studwork = await prisma.subtype.findFirst({ where: { typeId: solid.id, key: "studworkWall" } });
  if (studwork) {
    const { count } = await prisma.product.deleteMany({ where: { subtypeId: studwork.id } });
    await prisma.subtype.delete({ where: { id: studwork.id } });
    console.log(`Deleted Studwork Wall subtype (${count} products)`);
  }
  await prisma.subtype.create({ data: { typeId: solid.id, key: "cementBoard", label: "Cement Board", sortOrder: 1 } });
  console.log("Created empty Cement Board subtype under Solid Walls");

  // 3. New "Sliding Partitions" type, move Sliding Panel into it, drop Modular Panel, retire Demountable
  const sliding = await prisma.type.create({
    data: { categoryId, key: "sliding", label: "Sliding Partitions", sortOrder: 5 },
  });
  const slidingPanel = await prisma.subtype.findFirstOrThrow({ where: { typeId: demountable.id, key: "slidingPanel" } });
  await prisma.subtype.update({ where: { id: slidingPanel.id }, data: { typeId: sliding.id, sortOrder: 0 } });
  console.log("Moved Sliding Panel (+ its products) to new Sliding Partitions type");

  const modularPanel = await prisma.subtype.findFirst({ where: { typeId: demountable.id, key: "modularPanel" } });
  if (modularPanel) {
    const { count } = await prisma.product.deleteMany({ where: { subtypeId: modularPanel.id } });
    await prisma.subtype.delete({ where: { id: modularPanel.id } });
    console.log(`Deleted Modular Panel subtype (${count} products)`);
  }
  await prisma.type.delete({ where: { id: demountable.id } });
  console.log("Deleted now-empty Demountable Partitions type");

  // 4. Retire Acoustic Partitions entirely
  const acousticSubtypes = await prisma.subtype.findMany({ where: { typeId: acoustic.id } });
  let acousticProductCount = 0;
  for (const st of acousticSubtypes) {
    const { count } = await prisma.product.deleteMany({ where: { subtypeId: st.id } });
    acousticProductCount += count;
  }
  await prisma.type.delete({ where: { id: acoustic.id } });
  console.log(`Deleted Acoustic Partitions type (${acousticSubtypes.length} subtypes, ${acousticProductCount} products)`);

  // 5. New "Wall Lining (Cladding)" type with 4 empty subtypes
  const wallLining = await prisma.type.create({
    data: { categoryId, key: "wallLining", label: "Wall Lining (Cladding)", sortOrder: 2 },
  });
  const liningSubtypes = ["Acoustic Lining", "Wood Lining", "Glass Lining", "Green Wall"];
  for (let i = 0; i < liningSubtypes.length; i++) {
    const label = liningSubtypes[i];
    const key = label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+/g, "");
    await prisma.subtype.create({ data: { typeId: wallLining.id, key, label, sortOrder: i } });
  }
  console.log("Created Wall Lining (Cladding) type with 4 empty subtypes");

  // 6. Fix up sortOrder for the surviving types to match the requested order:
  // Glass, Gypsum, Wall Lining, Aluminium Framed, Solid Walls, Sliding
  const gypsum = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "gypsum" } });
  const aluminiumFramed = await prisma.type.findFirstOrThrow({ where: { categoryId, key: "aluminiumFramed" } });
  await prisma.type.update({ where: { id: glass.id }, data: { sortOrder: 0 } });
  await prisma.type.update({ where: { id: gypsum.id }, data: { sortOrder: 1 } });
  await prisma.type.update({ where: { id: aluminiumFramed.id }, data: { sortOrder: 3 } });

  console.log("\nDone. Final taxonomy:");
  const finalTypes = await prisma.type.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
    include: { subtypes: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } } },
  });
  for (const t of finalTypes) {
    console.log(`\n${t.label}`);
    for (const st of t.subtypes) console.log(`  - ${st.label} (${st._count.products} products)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
