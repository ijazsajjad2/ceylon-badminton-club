# Club operations release

The app now uses Supabase for member accounts, profiles, bookings, matches, confirmations, highlights, court rounds, contribution records, and notifications.

## Applied backend scripts

On this project, `schema.sql`, `admin-setup.sql`, `club-operations.sql`, `club-cron.sql`, and `club-push-cron.sql` have been applied. Do not rerun the non-idempotent operations migration on an existing database. Edge functions: `cbc-member-admin` and `cbc-club-ops`.

Bookings default to 20 places, two courts, and a two-hour cancellation cutoff. Administrators can edit capacity, cutoff, optional fee, notes, and cancellation in Club tools. Full sessions use an ordered waiting list. Cancelling a confirmed reservation or increasing capacity promotes waiting members under a database row lock. A member cannot directly write attendance rows.

Court rotation prioritises fewer appearances and longer rest. It penalises repeated partnerships and unequal skill. Rounds are shared and cannot overlap within a session. The organiser finishes a round before starting the next.

Score corrections require a reason and the previous revision. Stale corrections fail; the sync banner lets the organiser discard failed local changes and reload. Corrections clear prior confirmations and appear in correction history.

Contributions are immutable charges, payments, and credits. Members see their own ledger; administrators see all. Credits correct earlier entries. Receipts are downloadable acknowledgements. No online payment processor is configured.

## Owner account

The first administrator still needs the owner's real email address. Run `node scripts/bootstrap-owner.mjs --email <owner-email>` after confirming it. The one-time bootstrap token expires; regenerate it in the protected setup registry if needed. Credentials are written to a gitignored local file. No password or service-role key belongs in browser code or Git.

## Notifications and backups

Members explicitly enable device notifications and can disable them. Reminder preferences offer 1, 3, or 24 hours. Maintenance runs every 15 minutes; push dispatch runs every five minutes. Backend-only VAPID keys and the job key are in the RLS-protected `cbc_backend_settings` table. Browser clients cannot read them. The browser receives only the public VAPID key after sign-in. Real-device delivery still needs verification with a member account.

Club snapshots are taken at least every 23 hours and kept for 30 days in `cbc_backups`. They cover players, member profile links, sessions, attendance, matches, confirmations, contributions, highlights, rounds, audit history, and seasons. Notification preferences, device subscriptions, secrets, and Supabase authentication accounts are not part of these club snapshots. Enable a separate Supabase project backup for disaster recovery, and periodically export club snapshots off the database.

An administrator can download the latest snapshot. To rehearse restoring it without touching production:

```
node scripts/verify-backup.mjs downloaded-snapshot.json
```

This creates an in-memory PostgreSQL database, applies the schema, restores club rows, and validates counts and constraints. Placeholder auth IDs satisfy references during the rehearsal; it does not restore real sign-ins. The live snapshot was rehearsed successfully with 16 players, 26 sessions, and 8 matches.

## Deployment and checks

GitHub CI runs typechecking, unit/database/component tests, a production build, and browser smoke checks. The uptime workflow checks the public site and backend every 30 minutes once present on GitHub's default branch. GitHub failure notifications depend on account notification settings.

Arabic translations cover the public page and core new club tools with RTL layout. Some legacy portal, organiser form, and gallery labels remain English. Fees and the club contact method remain configurable; no fee or phone number was invented.

Local validation: 40 automated tests, three browser smoke tests, TypeScript check, production build, isolated snapshot restore. Live verification: unauthorized booking/job requests rejected with HTTP 401; authenticated scheduled push job returned HTTP 200 with zero notifications sent (there are no member accounts yet).
