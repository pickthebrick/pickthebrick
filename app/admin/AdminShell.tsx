import type { ReactNode } from "react";
import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";
import { prisma } from "@/lib/prisma";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";

export type AdminSection =
  | "approvals"
  | "quotes"
  | "products"
  | "marketing"
  | "designer"
  | "applications"
  | "contractorPricing"
  | "projects"
  | "database"
  | "notifications"
  | "careers"
  | "team"
  | "applicants"
  | "brain";

const NAV_ITEMS: { key: AdminSection; label: string; href: string; superAdminOnly?: boolean }[] = [
  { key: "approvals", label: "Approvals", href: "/admin" },
  { key: "brain", label: "The Brain 🧠", href: "/admin/brain", superAdminOnly: true },
  { key: "quotes", label: "New Quotes", href: "/admin/quotes" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "marketing", label: "Marketing", href: "/admin/marketing" },
  { key: "designer", label: "Designer", href: "/admin/designer" },
  { key: "applications", label: "Applications", href: "/admin/applications" },
  { key: "contractorPricing", label: "Contractor Pricing", href: "/admin/contractor-pricing", superAdminOnly: true },
  { key: "projects", label: "Projects", href: "/admin/projects" },
  { key: "database", label: "Database", href: "/admin/database" },
  { key: "notifications", label: "Notifications", href: "/admin/notifications" },
  { key: "careers", label: "Careers", href: "/admin/careers" },
  { key: "team", label: "Team", href: "/admin/team", superAdminOnly: true },
  { key: "applicants", label: "Applicants", href: "/admin/applicants", superAdminOnly: true },
];

export default async function AdminShell({
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
  // Profile isn't in NAV_ITEMS/AdminSection (it's the shared /profile page
  // every role uses, not an admin-shell-wrapped section) - shown for every
  // admin/super_admin/marketing account, appended after the role filter above.

  // Red-flag count for design requests a designer hasn't delivered within
  // their 48h window - shown on the nav item itself so it's visible from
  // any admin/super-admin page, not just when already on the Designer tab.
  const overdueDesignCount =
    role === "Marketing"
      ? 0
      : await prisma.designRequest.count({
          where: { status: DesignRequestStatus.in_progress, claimDeadline: { lt: new Date() } },
        });

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
                {item.key === "designer" && overdueDesignCount > 0 && (
                  <span className="nav-flag" title={`${overdueDesignCount} design request(s) overdue`}>
                    🚩 {overdueDesignCount}
                  </span>
                )}
              </Link>
            ))}
            <Link href="/profile">Profile</Link>
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
