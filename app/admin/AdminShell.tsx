import type { ReactNode } from "react";
import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";

export type AdminSection =
  | "approvals"
  | "quotes"
  | "products"
  | "marketing"
  | "designer"
  | "designerApplications"
  | "contractors"
  | "contractorPricing"
  | "projects"
  | "database"
  | "notifications"
  | "careers"
  | "team"
  | "applicants";

const NAV_ITEMS: { key: AdminSection; label: string; href: string; superAdminOnly?: boolean }[] = [
  { key: "approvals", label: "Approvals", href: "/admin" },
  { key: "quotes", label: "New Quotes", href: "/admin/quotes" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "marketing", label: "Marketing", href: "/admin/marketing" },
  { key: "designer", label: "Designer", href: "/admin/designer" },
  { key: "designerApplications", label: "Designer Apps", href: "/admin/designer-applications" },
  { key: "contractors", label: "Contractors", href: "/admin/contractors" },
  { key: "contractorPricing", label: "Contractor Pricing", href: "/admin/contractor-pricing", superAdminOnly: true },
  { key: "projects", label: "Projects", href: "/admin/projects" },
  { key: "database", label: "Database", href: "/admin/database" },
  { key: "notifications", label: "Notifications", href: "/admin/notifications" },
  { key: "careers", label: "Careers", href: "/admin/careers" },
  { key: "team", label: "Team", href: "/admin/team", superAdminOnly: true },
  { key: "applicants", label: "Applicants", href: "/admin/applicants", superAdminOnly: true },
];

export default function AdminShell({
  active,
  children,
  role = "Admin",
  isSuperAdmin = false,
}: {
  active: AdminSection;
  children: ReactNode;
  role?: "Admin" | "Marketing";
  // Team/Applicants are only meaningful for the account that can create and
  // delete other admins (see app/admin/team) - a regular admin never sees
  // those two links, even though they can reach every other admin page.
  isSuperAdmin?: boolean;
}) {
  // Marketing's login is scoped to /admin/marketing only (see proxy.ts) -
  // give it a single-item nav rather than the full admin sidebar.
  const navItems =
    role === "Marketing"
      ? NAV_ITEMS.filter((item) => item.key === "marketing")
      : NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);
  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role={role} />
      </header>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <nav>
            {navItems.map((item) => (
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
