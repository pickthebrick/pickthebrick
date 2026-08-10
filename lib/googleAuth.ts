import "server-only";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// Builds the URL to send the browser to for Google's consent screen.
// `redirectUri` is derived by the caller from the request's own origin
// (app/api/auth/google/route.ts) rather than a fixed env var, so the same
// code works in dev and prod without per-environment config - both origins
// just need registering as authorized redirect URIs in Google Cloud Console.
export function buildGoogleAuthorizeUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export type GoogleProfile = { googleId: string; email: string; name: string | null };

// Exchanges the authorization `code` from Google's callback for the
// person's Google account id + email + name. Throws on any failure - the
// callback route (app/api/auth/google/callback/route.ts) redirects to
// /login with an error rather than letting this throw uncaught.
export async function exchangeCodeForGoogleProfile(code: string, redirectUri: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!userRes.ok) throw new Error(`Google userinfo fetch failed: ${await userRes.text()}`);
  const profile = (await userRes.json()) as { sub: string; email: string; name?: string };

  return { googleId: profile.sub, email: profile.email.toLowerCase(), name: profile.name ?? null };
}
