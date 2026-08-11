import Link from "next/link";
import JsonLd, { breadcrumbSchema } from "@/app/components/JsonLd";

const SITE_URL = "https://www.pickthebrick.com";

export default function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: "Home", href: "/" }, ...items].map((item) => ({ name: item.name, url: `${SITE_URL}${item.href ?? ""}` })),
        )}
      />
      <nav className="landing-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {items.map((item, i) => (
          <span key={i} style={{ display: "contents" }}>
            <span aria-hidden="true">/</span>
            {item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
          </span>
        ))}
      </nav>
    </>
  );
}
