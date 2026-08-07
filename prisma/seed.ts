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

// One row per notification event key, matching every sendXEmail helper in
// lib/email.ts - emailSubject/emailBody are today's hardcoded copy verbatim,
// so the templated refactor changes nothing until an admin edits a row from
// the Notifications tab. whatsappBody is a shorter plain-text equivalent,
// ready for the moment a WhatsApp API is wired up (see lib/whatsapp.ts).
const NOTIFICATION_TEMPLATES: { key: string; label: string; emailSubject: string; emailBody: string; whatsappBody: string }[] = [
  {
    key: "quote_submitted",
    label: "Quote submitted (to client)",
    emailSubject: "Your quote has been submitted",
    emailBody: "We've received your fitout quote and it's now with our team for review.",
    whatsappBody: "Your PickTheBrick quote has been submitted and is now with our team for review.",
  },
  {
    key: "captain_assigned",
    label: "Captain assigned (first assignment)",
    emailSubject: "A project has been assigned to you",
    emailBody: "You've been assigned as captain for project {{quoteId}}. Head to your dashboard to review and confirm it.",
    whatsappBody: "You've been assigned as captain for project {{quoteId}}. Check your dashboard to review and confirm it.",
  },
  {
    key: "captain_reassigned",
    label: "Captain assigned (mid-project reassignment)",
    emailSubject: "An active project has been assigned to you",
    emailBody:
      "You've taken over as captain for project {{quoteId}}, already in progress. All contractors, inspections, and payment claims on it are visible on your dashboard.",
    whatsappBody: "You've taken over as captain for project {{quoteId}}, already in progress. Check your dashboard for full details.",
  },
  {
    key: "captain_removed",
    label: "Captain removed from a project",
    emailSubject: "You've been reassigned off a project",
    emailBody: "You're no longer the captain on project {{quoteId}} - it's been handed to another captain.",
    whatsappBody: "You're no longer the captain on project {{quoteId}} - it's been handed to another captain.",
  },
  {
    key: "quote_confirmed",
    label: "Quote confirmed (to client)",
    emailSubject: "Your quote has been confirmed",
    emailBody: "A captain has confirmed your quote and assigned a contractor. It's now with our admin team for final approval.",
    whatsappBody: "A captain has confirmed your quote - it's now with our admin team for final approval.",
  },
  {
    key: "contractor_assigned",
    label: "Contractor assigned to a project",
    emailSubject: "You've been assigned a new job",
    emailBody: "You've been assigned to project {{quoteId}}. Check your dashboard for details.",
    whatsappBody: "You've been assigned to project {{quoteId}}. Check your dashboard for details.",
  },
  {
    key: "quote_approved",
    label: "Quote approved (to client)",
    emailSubject: "Your quote has been approved",
    emailBody: "Your fitout quote has been approved. We'll be in touch about next steps.",
    whatsappBody: "Your PickTheBrick quote has been approved. We'll be in touch about next steps.",
  },
  {
    key: "quote_paid",
    label: "Payment received (to client)",
    emailSubject: "Payment received",
    emailBody: "We've recorded payment for your project. Work can now proceed.",
    whatsappBody: "We've recorded payment for your project. Work can now proceed.",
  },
  {
    key: "contractor_payment_recorded",
    label: "Payment recorded (to contractor)",
    emailSubject: "Payment recorded on your project",
    emailBody: "Payment has been recorded for project {{quoteId}}. Work can proceed.",
    whatsappBody: "Payment has been recorded for project {{quoteId}}. Work can proceed.",
  },
  {
    key: "design_submitted",
    label: "Design survey submitted (to client)",
    emailSubject: "Your design survey has been submitted",
    emailBody: "Thanks for completing your design survey. A designer will pick it up shortly.",
    whatsappBody: "Thanks for completing your design survey. A designer will pick it up shortly.",
  },
  {
    key: "design_delivered",
    label: "Design delivered (to client)",
    emailSubject: "Your design has been delivered",
    emailBody: "Your designer has delivered your design submittal. Log in to view and download the files.",
    whatsappBody: "Your design has been delivered. Log in to view and download the files.",
  },
  {
    key: "designer_assigned",
    label: "Designer assigned",
    emailSubject: "A design request has been assigned to you",
    emailBody: "You've been assigned design request {{requestId}}. You have 24 hours from now to submit your files.",
    whatsappBody: "You've been assigned design request {{requestId}}. You have 24 hours to submit your files.",
  },
  {
    key: "designer_removed",
    label: "Designer removed from a request",
    emailSubject: "You've been reassigned off a design request",
    emailBody: "Design request {{requestId}} has been handed to another designer.",
    whatsappBody: "Design request {{requestId}} has been handed to another designer.",
  },
  {
    key: "contractor_application_received",
    label: "Application received (to applicant)",
    emailSubject: "We've received your application",
    emailBody: "Thanks for applying to partner with PickTheBrick. Our team will review your application shortly.",
    whatsappBody: "Thanks for applying to partner with PickTheBrick. Our team will review your application shortly.",
  },
  {
    key: "contractor_application_admin_alert",
    label: "New application (to admin)",
    emailSubject: "New contractor application to review",
    emailBody: "{{applicantEmail}} has submitted a new contractor application. Review it in the admin dashboard.",
    whatsappBody: "{{applicantEmail}} has submitted a new contractor application. Review it in the admin dashboard.",
  },
  {
    key: "contractor_application_approved",
    label: "Application approved",
    emailSubject: "Your application has been approved",
    emailBody: "Welcome aboard - your contractor application has been approved. You can now be assigned to projects.",
    whatsappBody: "Welcome aboard - your contractor application has been approved. You can now be assigned to projects.",
  },
  {
    key: "contractor_application_rejected",
    label: "Application not approved",
    emailSubject: "Update on your application",
    emailBody: "Your contractor application wasn't approved this time.{{noteLine}}",
    whatsappBody: "Your contractor application wasn't approved this time.{{noteLine}}",
  },
  {
    key: "contractor_application_blocked",
    label: "Partner account blocked",
    emailSubject: "Your partner account has been blocked",
    emailBody: "Your contractor account has been blocked and can no longer be assigned to projects.{{noteLine}}",
    whatsappBody: "Your contractor account has been blocked and can no longer be assigned to projects.{{noteLine}}",
  },
  {
    key: "designer_application_received",
    label: "Application received (to applicant)",
    emailSubject: "We've received your application",
    emailBody: "Thanks for applying to design with PickTheBrick. Our team will review your application shortly.",
    whatsappBody: "Thanks for applying to design with PickTheBrick. Our team will review your application shortly.",
  },
  {
    key: "designer_application_admin_alert",
    label: "New application (to admin)",
    emailSubject: "New designer application to review",
    emailBody: "{{applicantEmail}} has submitted a new designer application. Review it in the admin dashboard.",
    whatsappBody: "{{applicantEmail}} has submitted a new designer application. Review it in the admin dashboard.",
  },
  {
    key: "designer_application_approved",
    label: "Application approved",
    emailSubject: "Your application has been approved",
    emailBody: "Welcome aboard - your designer application has been approved. Training will follow before your first project.",
    whatsappBody: "Welcome aboard - your designer application has been approved. Training will follow before your first project.",
  },
  {
    key: "designer_application_rejected",
    label: "Application not approved",
    emailSubject: "Update on your application",
    emailBody: "Your designer application wasn't approved this time.{{noteLine}}",
    whatsappBody: "Your designer application wasn't approved this time.{{noteLine}}",
  },
  {
    key: "designer_application_blocked",
    label: "Partner account blocked",
    emailSubject: "Your partner account has been blocked",
    emailBody: "Your designer account has been blocked and can no longer be assigned to projects.{{noteLine}}",
    whatsappBody: "Your designer account has been blocked and can no longer be assigned to projects.{{noteLine}}",
  },
  {
    key: "progress_reported",
    label: "Progress reported (to captain)",
    emailSubject: "Progress update needs your review",
    emailBody: "The contractor on project {{quoteId}} has reported new progress. Review and approve it in your dashboard.",
    whatsappBody: "New progress reported on project {{quoteId}}. Review and approve it in your dashboard.",
  },
  {
    key: "progress_approved",
    label: "Progress approved (to contractor)",
    emailSubject: "Your reported progress was approved",
    emailBody: "Your captain approved your latest progress update on project {{quoteId}}. Your payment eligibility has been updated.",
    whatsappBody: "Your latest progress on project {{quoteId}} was approved. Your payment eligibility has been updated.",
  },
  {
    key: "site_inspection_requested",
    label: "Site inspection requested (to captain)",
    emailSubject: "Site inspection requested",
    emailBody: "A site inspection has been requested for project {{quoteId}}. Respond in your dashboard.",
    whatsappBody: "A site inspection has been requested for project {{quoteId}}. Respond in your dashboard.",
  },
  {
    key: "site_inspection_responded",
    label: "Site inspection responded (to contractor)",
    emailSubject: "Update on your site inspection request",
    emailBody: "Your site inspection request for project {{quoteId}} is now: {{status}}.",
    whatsappBody: "Your site inspection request for project {{quoteId}} is now: {{status}}.",
  },
  {
    key: "payment_claim_requested",
    label: "Payment claim submitted (to captain/admin)",
    emailSubject: "Payment claim submitted",
    emailBody: "A payment claim of {{amount}} has been submitted for project {{quoteId}}.",
    whatsappBody: "A payment claim of {{amount}} has been submitted for project {{quoteId}}.",
  },
  {
    key: "payment_claim_resolved",
    label: "Payment claim resolved (to contractor)",
    emailSubject: "Update on your payment claim",
    emailBody: "Your payment claim for project {{quoteId}} is now: {{status}}.",
    whatsappBody: "Your payment claim for project {{quoteId}} is now: {{status}}.",
  },
];

async function seedNotificationTemplates() {
  for (const t of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { key: t.key },
      create: t,
      update: {},
    });
  }
  console.log(`Seeded ${NOTIFICATION_TEMPLATES.length} notification templates.`);
}

async function seedJobPostings() {
  const count = await prisma.jobPosting.count();
  if (count > 0) return;
  const postings = [
    {
      title: "Site Coordinator",
      department: "Operations",
      location: "Dubai, UAE",
      employmentType: "Full-time",
      description:
        "Coordinate day-to-day activity across active fitout sites - scheduling contractor visits, tracking progress against the project timeline, and flagging issues to the assigned Captain before they become delays.",
      sortOrder: 0,
    },
    {
      title: "Interior Designer",
      department: "Design",
      location: "Dubai, UAE",
      employmentType: "Full-time",
      description:
        "Turn client space surveys into concept layouts and 3D visuals across our Essential/Advanced/Premium design packages, working directly with clients through revisions.",
      sortOrder: 1,
    },
  ];
  for (const p of postings) await prisma.jobPosting.create({ data: p });
  console.log(`Seeded ${postings.length} job postings.`);
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

  await seedNotificationTemplates();
  await seedJobPostings();

  console.log("Seeding test staff logins (local/dev only)...");
  await ensureTestUser("captain@pickthebrick.test", Role.captain, "Test Captain");
  await ensureTestUser("captain2@pickthebrick.test", Role.captain, "Test Captain Two");
  await ensureTestUser("contractor@pickthebrick.test", Role.contractor, "Test Contractor");
  await ensureTestUser("admin@pickthebrick.test", Role.admin, "Test Admin");
  await ensureTestUser("superadmin@pickthebrick.test", Role.super_admin, "Test Super Admin");
  await ensureTestUser("designer@pickthebrick.test", Role.designer, "Test Designer");
  await ensureTestUser("marketing@pickthebrick.test", Role.marketing, "Test Marketing");

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
