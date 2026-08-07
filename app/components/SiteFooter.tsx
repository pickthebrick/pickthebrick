import Link from "next/link";

const OFFICE_ADDRESS = "Warehouse 3A, 21st Street, Umm Ramool, Dubai";
const OFFICE_PHONE = "+971523142272";

// Marketing footer for the public home page - the main content is a list of
// every catalog category, each linking to its own landing page
// (app/landing/[category]/page.tsx). Those pages exist purely so social/ads
// campaigns have a dedicated URL per category to point traffic at.
export default function SiteFooter({ categories }: { categories: { key: string; label: string }[] }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-col">
          <div className="site-footer-brand">PickTheBrick</div>
          <p className="site-footer-tagline">Dubai office fitouts, done the easy way - design, build, and install, all in one place.</p>
        </div>
        <div className="site-footer-col">
          <div className="site-footer-heading">Categories</div>
          <nav className="site-footer-links">
            {categories.map((c) => (
              <Link key={c.key} href={`/landing/${c.key}`}>
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="site-footer-col">
          <div className="site-footer-heading">Get started</div>
          <nav className="site-footer-links">
            <Link href="/design">Design</Link>
            <Link href="/build">Build</Link>
            <Link href="/ask-ai">Ask AI</Link>
          </nav>
        </div>
        <div className="site-footer-col">
          <div className="site-footer-heading">Work with us</div>
          <nav className="site-footer-links">
            <Link href="/login?next=%2Fcontractor%2Fapply&role=contractor">Become a contractor</Link>
            <Link href="/login?next=%2Fdesigner%2Fapply&role=designer">Become a designer</Link>
            <Link href="/careers">Join the team</Link>
          </nav>
        </div>
        <div className="site-footer-col">
          <div className="site-footer-heading">Contact</div>
          <div className="site-footer-contact">
            <span>{OFFICE_ADDRESS}</span>
            <a href={`tel:${OFFICE_PHONE}`}>{OFFICE_PHONE}</a>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>&copy; {new Date().getFullYear()} PickTheBrick. All rights reserved.</span>
        <span className="site-footer-disclaimer">PickTheBrick is a subsidiary of Arabesc Contracting LLC.</span>
      </div>
    </footer>
  );
}
