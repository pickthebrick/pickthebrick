import Link from "next/link";

export default function BrandMark({ role }: { role?: string }) {
  return (
    <Link href="/" className="brand-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="PickTheBrick" />
      {role && <span className="brand">&middot; {role}</span>}
    </Link>
  );
}
