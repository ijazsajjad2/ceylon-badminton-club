# Live club backend

Project: `bxlfkdroglotfueigczh` (Asia Pacific / Singapore).
The existing project was restored on 2026-09-12. Its separate consular tables are
retained; the club uses `member_profiles`, `attendance`, `matches`, and
`match_confirmations`. All club tables have row-level security enabled.

The database contains the eight real match results from the repository. The
public API can read results but cannot write RSVPs or scores. Authenticated
members can RSVP only for their own player ID. Scorekeepers can record scores.
Confirmations are independent member-owned rows so simultaneous confirmations
cannot overwrite each other.

## First administrator

The administrator email must be supplied by the club owner. Then run:

```
node scripts/bootstrap-owner.mjs --email OWNER_EMAIL
```

This uses a one-time setup token held in `.cbc-bootstrap.local` (never committed).
The token is checked against an expiring server-side hash and atomically consumed.
The bootstrap account is `ijaz`, player `p15`, with the scorekeeper role. A random
initial password is saved locally in `.cbc-admin-credentials.local`. The script
verifies sign-in and the server profile. It sends no email.

The setup token expires after 24 hours. If setup expires before it is used, issue
a fresh token through the database owner. Never put a setup token in client code.

## Member accounts

Sign in with the administrator email/password and select **Manage members**.
Create accounts for the existing club players and share their initial passwords
directly. The same panel supports password resets. The `cbc-member-admin` Edge
Function validates the Supabase user and checks the administrator's server-side
profile for every operation. Its gateway JWT check is disabled because the body
performs explicit user verification and separately supports the one-time setup
token. No service-role key is sent to the browser.

Password sign-in is enabled. Email OTP is not the active UI flow; it needs an
email-template/SMTP configuration before it can be offered reliably. Public
Auth signups do not grant club access: only an administrator-created profile does.

## Frontend configuration

`.env.local` contains the project URL and publishable API key. These are public
client configuration; row-level security enforces access. Never replace the
publishable key with a service-role key. A production source deployment must set
these variables in Vercel as well:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The optional WhatsApp number/group link and session fee still need club details.
Profile edits, video collections and generated draws remain device-local and
are labelled in the portal. RSVPs and match results use the shared backend with
an offline outbox and explicit retry after failures.

## Reproducibility and checks

`supabase/schema.sql` creates the club data tables and policies.
`supabase/seed-matches.sql` imports the known results without overwriting rows.
`supabase/functions/cbc-member-admin/index.ts` contains the account endpoint.
The one-time setup table is service-role-only and contains no plaintext token.

Run `npm test`, `npm run typecheck`, `npm run build` and `npm run test:e2e`.
Database tests use a real embedded Postgres engine; live checks also verified
shared reads and rejection of anonymous writes and member administration.
Full authenticated cross-device checks still require provisioned member accounts.
