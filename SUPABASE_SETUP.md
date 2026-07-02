# Shared attendance roster & match ledger (Supabase) — setup

By default the club app stores "who's coming" and recorded matches **per
browser** (localStorage), so nothing is shared between members' phones.
Connecting a free Supabase project turns it into a **live, shared** experience:
- **Attendance** — everyone sees the same "Who's Going?" roster in real time;
  each member still RSVPs only for themselves.
- **Matches** — scores recorded by the club scorekeeper (`ijaz`) sync to every
  member's device, and anyone's "Confirm" tap syncs back too.

This is optional. Until it's configured, the app works exactly as it does now
(local-only per browser).

## One-time setup (~3 minutes)

1. **Create a project** — go to https://supabase.com → sign in → **New project**
   (the free tier is plenty). Pick any name/password/region.

2. **Create the tables** — in the project, open **SQL Editor → New query**, paste
   the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   This provisions both the `attendance` and `matches` tables. If you already ran
   an older version of this schema for attendance only, just re-run the current
   file — it's safe to re-run (`create table if not exists`).

3. **Grab your keys** — open **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long `eyJ...` string — safe to expose; it's protected
     by the row-level security in the schema)

4. **Give them to me** (or paste them yourself into `src/lib/supabase.js`):
   ```js
   export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xxxxxxxx.supabase.co'
   export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGci...'
   ```
   Redeploy, and the roster goes live and shared. The "Who's Going?" section will
   show a **🟢 Live across everyone's devices** badge.

## Notes
- The anon key is meant to be public; access is limited to the `attendance`
  and `matches` tables by the row-level-security policies in the schema.
- This gives a shared **roster** and **match ledger**. It does not replace the
  current members login (that's a separate step — real per-member auth via
  Supabase Auth — which we can add later so there are no passwords in the
  source at all).
- "Only `ijaz` can record scores" is enforced **client-side** (the app's UI
  gates the record-match flow to that one account). The anon key itself can't
  enforce that server-side without real per-user auth — same caveat as the
  rest of this lightweight login system. Match **confirmation**, by contrast,
  is intentionally open to any signed-in member.
