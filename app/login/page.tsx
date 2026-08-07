import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Forces per-request dynamic rendering so SSR sees the actual ?role=/&next=
// query string instead of a cached static shell rendered without them - the
// latter causes LoginForm's useSearchParams() to briefly mismatch between
// server and client output (a hydration warning, auto-corrected but
// avoidable) since this route's content is inherently request-specific.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
