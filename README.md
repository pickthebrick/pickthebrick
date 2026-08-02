# PickTheBrick

Office fitout aggregator (Dubai) - Client/Captain/Contractor/Admin roles, backed by
Next.js + Supabase. See `pickthebrick-flooring-prototype.html` for the original static
prototype this backend replaces.

## Layout

- `web/` - the Next.js app (App Router, TypeScript).
- `supabase/migrations/` - schema + RLS policies + workflow RPC functions.
- `scripts/seed-catalog.ts` - loads the catalog (categories/types/subtypes/products)
  straight out of the prototype HTML into Supabase, and creates test captain/contractor/admin logins.

## One-time setup

Node.js is already installed on this machine. Docker is **not** required - this setup
links directly to a Supabase cloud project instead of running Supabase locally.

1. **Create a Supabase project**: go to [supabase.com/dashboard](https://supabase.com/dashboard),
   create a new (free tier is fine) project, and wait for it to finish provisioning.

2. **Get your credentials** from that project's *Settings > API* page:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this one secret - server/seed-script only)
   - Project ref (the short id in the URL / at the top of Settings > General)

3. **Fill in env files**:
   ```bash
   cp .env.local.example .env.local
   cp web/.env.local.example web/.env.local
   ```
   - In `.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`
   - In `web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (URL is the same value in both places.)

4. **Link the CLI and push the schema**:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npm run supabase:push
   ```

5. **Seed the catalog + test logins**:
   ```bash
   npm run seed
   ```
   This prints the test captain/contractor/admin emails and password (all
   `PickTheBrick123!`) - use them to try each dashboard once the app is running.

6. **Enable Google sign-in** (needed for the "Continue with Google" button - this step
   has to happen in your own Google Cloud + Supabase dashboard, it can't be done for you):
   - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create
     an OAuth 2.0 Client ID (Web application).
   - In Supabase: *Authentication > Sign In / Providers > Google*, paste the client ID/secret,
     and copy the callback URL Supabase shows you into the Google OAuth client's
     "Authorized redirect URIs".
   - Email/password sign-in works immediately with no extra setup.

7. **Run the app**:
   ```bash
   npm install --prefix web
   npm run dev
   ```
   Visit `http://localhost:3000`. Signing up as a normal user gives you the `client`
   role automatically; use the seeded logins from step 5 to see the Captain/Admin/Contractor
   dashboards.

## Notes / known gaps (v1)

- Promoting a user to `captain`/`contractor`/`admin` (other than the seeded test accounts)
  is a manual edit of the `role` column in Supabase Studio's table editor - there's no
  admin UI for it yet.
- Catalog editing (adding/reordering products) is also Studio-only for now; re-run
  `npm run seed` to re-import from the HTML prototype if you edit the catalog there instead.
- "Paid" is a manual status Admin sets after handling payment offline - no payment
  gateway is wired up.
- Regenerate `web/lib/database.types.ts` after any schema change:
  `npm run supabase:types`.
