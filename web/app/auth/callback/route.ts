import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both the Google OAuth redirect and email/password magic-link style
// confirmations - Supabase sends the browser here with a `code` to exchange
// for a session. proxy.ts takes it from there and routes to the right role home.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
