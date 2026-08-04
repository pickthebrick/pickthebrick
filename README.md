# PickTheBrick

Office fitout aggregator (Dubai) - Client/Captain/Contractor/Admin roles.
Next.js app with a self-contained backend: SQLite (via Prisma) for the
database and hand-rolled cookie-session auth - no external accounts, no
cloud dashboard, nothing but this folder.

See `pickthebrick-flooring-prototype.html` for the original static prototype
this app replaces.

## Layout

- `app/` - the Next.js app (pages, Server Actions in `app/actions/`).
- `prisma/schema.prisma` - the data model (users/roles, catalog, quotes/approval workflow).
- `prisma/seed.ts` - loads the catalog straight out of the prototype HTML into
  the database, and creates test captain/contractor/admin logins.
- `lib/auth.ts` - password hashing + cookie session helpers.
- `proxy.ts` - redirects signed-out visitors to `/login` and routes each role to its own area.

## One-time setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to an **absolute** path to `prisma/dev.db`
(see the comments in `.env.example` for the exact format). A relative
`file:./dev.db` looks like it should work but isn't reliable across the
Prisma CLI vs. Next's dev/build server in this version - use an absolute path
to avoid a confusing "Unable to open the database file" error.

```bash
npx prisma migrate dev --name init   # creates prisma/dev.db and the schema
npm run seed                          # loads the catalog + test logins
npm run dev
```

Then open `http://localhost:3000`. That's it - no account to create anywhere, no
API keys, no external dashboard. `prisma/dev.db` is a plain SQLite file sitting
in this folder; delete it (and re-run the two commands above) any time you want
to start fresh.

Signing up through the app's own `/login` page gives you the `client` role
automatically. The seed script also creates three test logins for the other
roles (password is the same for all three):

- `captain@pickthebrick.test` / `PickTheBrick123!`
- `contractor@pickthebrick.test` / `PickTheBrick123!`
- `admin@pickthebrick.test` / `PickTheBrick123!`

## Everyday commands

- `npm run dev` - start the app.
- `npx prisma studio` - a local GUI to browse/edit the database in your browser (no account needed).
- `npm run seed` - re-import the catalog from the HTML prototype (wipes and reseeds catalog tables; leaves users/quotes alone).
- `npx prisma migrate dev --name <description>` - after changing `prisma/schema.prisma`, creates and applies a new migration.

## Notes / known gaps (v1)

- Promoting a user to `captain`/`contractor`/`admin` (other than the seeded
  test accounts) is a manual edit of the `role` column via `npx prisma studio`
  - there's no admin UI for it yet.
- Catalog editing (adding/reordering products) is also Studio-only for now;
  re-run `npm run seed` to re-import from the HTML prototype if you edit the
  catalog there instead.
- "Paid" is a manual status Admin sets after handling payment offline - no
  payment gateway is wired up.
- No Google/social sign-in - email/password only, by design (avoids the extra
  complexity of hand-rolling OAuth).
- `prisma/dev.db` is a single file on disk. That's perfect for local dev or a
  normal always-on server (a VPS, Render, Railway, etc.). It will **not**
  survive on a serverless host like Vercel's default deployment (no persistent
  disk between requests there) - if you deploy there later, swap the
  datasource for a hosted Postgres (e.g. Neon, Supabase, Railway) at that point.
