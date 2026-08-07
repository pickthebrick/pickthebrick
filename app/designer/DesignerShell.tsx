import type { ReactNode } from "react";
import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";

export type DesignerSection = "requests" | "payments";

const NAV_ITEMS: { key: DesignerSection; label: string; href: string }[] = [
  { key: "requests", label: "Design requests", href: "/designer" },
  { key: "payments", label: "Payments", href: "/designer/payments" },
];

export default function DesignerShell({ active, children }: { active: DesignerSection; children: ReactNode }) {
  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Designer" />
      </header>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <nav>
            {NAV_ITEMS.map((item) => (
              <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
