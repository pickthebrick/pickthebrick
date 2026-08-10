import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

// Same reasoning as app/login/page.tsx - this route reads ?token= via
// useSearchParams(), so it needs per-request dynamic rendering to avoid a
// server/client hydration mismatch against a cached static shell.
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
