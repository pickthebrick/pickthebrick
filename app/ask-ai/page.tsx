import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteFooter from "@/app/components/SiteFooter";
import AskAiClient from "./AskAiClient";
import "../marketing.css";

// Public "ask a question" page - linked from the footer (previously "FAQ",
// now a live chat backed by the Claude API, see app/actions/assistant.ts).
export default async function AskAiPage() {
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true },
  });

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
          <Link href="/build">Build</Link>
        </nav>
      </header>
      <main>
        <AskAiClient />
      </main>
      <SiteFooter categories={categories} />
    </div>
  );
}
