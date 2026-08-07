import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, ContractorApplicationStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import BrandMark from "@/app/components/BrandMark";
import ContractorApplyClient from "./ContractorApplyClient";
import "../../dashboard.css";

export default async function ContractorApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.contractor) redirect(ROLE_HOME[session.role]);

  const [me, application, categories, types] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id }, select: { fullName: true, company: true, phone: true } }),
    prisma.contractorApplication.findUnique({
      where: { contractorId: session.id },
      select: {
        status: true,
        reviewNote: true,
        licenseFilePath: true,
        submittedAt: true,
        companyName: true,
        contactPhone: true,
        officeLocation: true,
        categories: { select: { categoryId: true } },
        types: { select: { typeId: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
    prisma.type.findMany({ select: { id: true, categoryId: true, label: true } }),
  ]);

  if (application?.status === ContractorApplicationStatus.approved) redirect("/contractor");

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Contractor" />
      </header>
      <main>
        <div className="apply-hero">
          <span className="apply-hero-icon">🤝</span>
          <div>
            <h1>Become a PickTheBrick partner</h1>
            <p>Tell us about your business and which categories you cover, share your trade license, and get in front of clients ready to build.</p>
          </div>
        </div>
        <ContractorApplyClient
          categories={categories}
          types={types}
          defaults={{ name: me?.fullName ?? "", company: me?.company ?? "", phone: me?.phone ?? "" }}
          application={
            application
              ? {
                  status: application.status,
                  reviewNote: application.reviewNote,
                  licenseFilePath: application.licenseFilePath,
                  submittedAt: application.submittedAt,
                  companyName: application.companyName,
                  contactPhone: application.contactPhone,
                  officeLocation: application.officeLocation,
                  categoryIds: application.categories.map((c) => c.categoryId),
                  typeIds: application.types.map((t) => t.typeId),
                }
              : null
          }
        />
      </main>
    </div>
  );
}
