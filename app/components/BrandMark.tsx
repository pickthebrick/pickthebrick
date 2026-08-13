import Link from "next/link";

// logoUrl (User.logoUrl) is contractor-only for now - shows their own logo
// in place of PickTheBrick's on their dashboard, still linking home like
// every other use of this component.
export default function BrandMark({ role, logoUrl }: { role?: string; logoUrl?: string | null }) {
  return (
    <Link href="/" className="brand-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl || "/logo.png"} alt={logoUrl ? "" : "PickTheBrick"} />
      {role && <span className="brand">&middot; {role}</span>}
    </Link>
  );
}
