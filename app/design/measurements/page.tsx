import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import { PACKAGE_LABELS, spaceKeysToLabels } from "@/lib/spaces";
import DesignStepper from "../DesignStepper";
import SubmitDesignRequestButton from "./SubmitDesignRequestButton";
import "../../marketing.css";

export default async function DesignMeasurementsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== session.id) redirect("/design");

  const packageLabel = PACKAGE_LABELS[request.packageKey] ?? request.packageKey;
  const spaces = spaceKeysToLabels(request.spaces);
  const alreadySubmitted = request.status !== DesignRequestStatus.draft;

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/design">Design</Link>
        </nav>
      </header>
      <main>
        <DesignStepper current={2} />
        <div className="hero">
          <span className="hero-eyebrow">Measurements</span>
          <h1>{alreadySubmitted ? "Request submitted" : "Just a little further"}</h1>
          <p>
            {alreadySubmitted
              ? "Your designer has this on their queue - you can track progress from your dashboard."
              : "Detailed room-by-room measurements come next; for now, review your request and submit it to your designer."}
          </p>
        </div>

        <div className="sqft-input-card" style={{ textAlign: "center" }}>
          <p style={{ marginBottom: spaces.length > 0 ? 12 : 0 }}>
            {packageLabel} package &middot; {Number(request.sqft).toLocaleString()} sqft
          </p>
          {spaces.length > 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Spaces: {spaces.join(", ")}</p>}
        </div>

        {alreadySubmitted ? (
          <div className="design-summary" style={{ justifyContent: "center" }}>
            <Link href="/my-quotes" className="design-start-btn">
              Go to my dashboard →
            </Link>
          </div>
        ) : (
          <SubmitDesignRequestButton id={id} />
        )}
      </main>
    </div>
  );
}
