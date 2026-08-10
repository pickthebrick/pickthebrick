import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import VerifyPhoneClient from "./VerifyPhoneClient";

// Landing point for a brand-new Google signup (see the isNewAccount branch
// in app/api/auth/google/callback/route.ts) - mirrors the mandatory
// verify-phone step LoginForm.tsx/AuthGate.tsx show inline right after
// signUp() for the email/password path.
export default async function VerifyPhonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/my-quotes";

  if (session.whatsappVerifiedAt || session.whatsappSkippedAt) redirect(dest);

  return <VerifyPhoneClient dest={dest} />;
}
