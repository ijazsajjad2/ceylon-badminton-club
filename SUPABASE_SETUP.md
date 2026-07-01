# Shared attendance roster (Supabase) — setup

By default the club app stores "who's coming" **per browser** (localStorage), so
it isn't shared between members' phones. Connecting a free Supabase project turns
it into a **live, shared roster** — everyone sees the same list in real time, and
each member still RSVPs only for themselves.

This is optional. Until it's configured, the app works exactly as it does now.

## One-time setup (~3 minutes)

1. **Create a project** — go to https://supabase.com → sign in → **New project**
   (the free tier is plenty). Pick any name/password/region.

2. **Create the table** — in the project, open **SQL Editor → New query**, paste
   the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

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
  table by the row-level-security policies in the schema.
- This gives a shared **roster**. It does not replace the current members login
  (that's a separate step — real per-member auth via Supabase Auth — which we can
  add later so there are no passwords in the source at all).
