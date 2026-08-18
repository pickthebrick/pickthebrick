import Link from "next/link";
import { getSession } from "@/lib/auth";
import "../build.css";

// Deliberately its own small, mostly-static route rather than a view-state
// swap inside BuildClient - that in-place swap (setView("success")) was
// where an intermittent, production-only React hydration crash (#418) was
// showing up as a black-screen flash right after "I'm done". A hard
// navigation here to a fresh, lightweight page sidesteps it: there's no
// large stateful component tree left to hydrate against, just this.
export default async function QuoteSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const session = await getSession();

  return (
    <div className="ptb-build">
      <div className="preview-wrap">
        <div className="preview-card success-state">
          <div className="icon">&#10003;</div>
          <h2>Quote saved</h2>
          <p>
            Your PickTheBrick quote is locked in{ref ? ` (ref. ${ref})` : ""} and a copy is on its way to your
            email. A Captain from our team will be in touch shortly to help turn this into a real fitout.
          </p>
          <div className="action-row" style={{ marginTop: 24 }}>
            {session && (
              <Link className="action-btn primary" href="/my-quotes" style={{ textDecoration: "none" }}>
                View my quotes
              </Link>
            )}
            <Link
              className={session ? "action-btn secondary" : "action-btn primary"}
              href="/"
              style={{ textDecoration: "none" }}
            >
              Go to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
