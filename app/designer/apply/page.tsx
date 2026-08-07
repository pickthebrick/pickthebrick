import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, DesignerApplicationStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import BrandMark from "@/app/components/BrandMark";
import DesignerApplyClient from "./DesignerApplyClient";
import "../../dashboard.css";

export default async function DesignerApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.designer) redirect(ROLE_HOME[session.role]);

  const [me, application] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id }, select: { fullName: true, whatsappNumber: true } }),
    prisma.designerApplication.findUnique({
      where: { designerId: session.id },
      select: {
        status: true,
        reviewNote: true,
        submittedAt: true,
        knowsRevit: true,
        location: true,
        country: true,
        whatsappNumber: true,
        portfolioUrl: true,
        cvFilePath: true,
      },
    }),
  ]);

  if (application?.status === DesignerApplicationStatus.approved) redirect("/designer");

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Designer" />
      </header>
      <main>
        <div className="apply-hero">
          <span className="apply-hero-icon">🎨</span>
          <div>
            <h1>Become a PickTheBrick designer</h1>
            <p>
              This is project-based freelance work, not full-time employment - you take on design requests as they
              come in, priced per project. We provide training once your application is approved. Tell us a bit
              about yourself and share your portfolio to get started.
            </p>
          </div>
        </div>
        <DesignerApplyClient
          defaults={{ name: me?.fullName ?? "", whatsappNumber: me?.whatsappNumber ?? "" }}
          application={application ?? null}
        />
      </main>
    </div>
  );
}
