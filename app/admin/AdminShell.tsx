import type { ReactNode } from "react";
import Link from "next/link";
import SignOutButton from "@/app/components/SignOutButton";
import BrandMark from "@/app/components/BrandMark";

export type AdminSection = "approvals" | "quotes" | "products" | "marketing" | "designer";

const NAV_ITEMS: { key: AdminSection; label: string; href: string }[] = [
  { key: "approvals", label: "Approvals", href: "/admin" },
  { key: "quotes", label: "New Quotes", href: "/admin/quotes" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "marketing", label: "Marketing", href: "/admin/marketing" },
  { key: "designer", label: "Designer", href: "/admin/designer" },
];

export default function AdminShell({ active, children }: { active: AdminSection; children: ReactNode }) {
  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Admin" />
        <SignOutButton className="signout" />
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
