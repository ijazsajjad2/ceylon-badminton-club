# Session-reminder push notifications (OneSignal) — setup

By default the site has no push notifications — nothing changes for visitors,
nothing is fetched, no service worker is touched. Connecting a free OneSignal
account turns on a "Get session reminders" opt-in (shown near the Visit
section) that pushes a "starts in 1 hour" notification before every
Wednesday-night and Saturday-morning session.

This is optional and entirely additive. Until it's configured, the app works
exactly as it does now.

## Why OneSignal

Real Web Push requires a server to hold the (secret) key that authorizes
sending notifications — it can't be done from static client code alone.
OneSignal's free tier handles that server piece (subscriber storage + the
actual push delivery) without you standing up your own push server; this repo
only needs to (a) load their client SDK when configured, and (b) call their
REST API on a schedule to actually fire the "starts in 1 hour" message.

## Part 1 — One-time OneSignal account setup (~5 minutes)

1. Go to https://onesignal.com → sign up (free) → **New App/Website**.
2. Choose **Web Push** as the platform, then **Typical Site**.
3. Enter your site's URL (whatever domain/Vercel URL the club site is deployed
   at) and finish the wizard. Icons etc. are optional — defaults are fine.
4. Open **Settings → Keys & IDs** and copy:
   - **OneSignal App ID** (a UUID, e.g. `12345678-abcd-...`)
   - **REST API Key** (a long secret string — this one is sensitive, never put
     it in client code or commit it to the repo)

## Part 2 — Client-side (lets people subscribe)

Set this as an environment variable wherever the site is built/deployed
(e.g. Vercel → Project → Settings → Environment Variables), then redeploy:

```
VITE_ONESIGNAL_APP_ID=12345678-abcd-...
```

That's it for the client side — the "Get session reminders" card will appear
near the Visit section, and clicking it prompts the browser for notification
permission via OneSignal's SDK (loaded from their CDN only once this variable
is set).

### ⚠️ Important: merge with the existing service worker

This site already ships its own service worker (`public/sw.js`) so the app
installs and works offline (this matters a lot for the bundled Android app —
see `ANDROID_APP.md`). OneSignal's SDK normally wants to register its own
separate worker file, but a page can really only have one active service
worker per scope — a second one would silently replace the offline shell.

`src/lib/push.js` already points OneSignal at your **existing** `sw.js`
(`serviceWorkerPath: 'sw.js'`) instead of letting it install its own — but for
that to work, OneSignal's push-handling code needs to be merged *into*
`public/sw.js`. Add this line as the very first line of `public/sw.js`:

```js
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js') } catch { /* offline first load — push just won't be available yet */ }
```

The `try/catch` matters: on a fully offline first load (e.g. the Android app
with no connectivity yet) this import would otherwise throw and could break
the *entire* service worker, taking the offline shell down with it. With the
`try/catch`, a failed fetch just means push isn't available yet — everything
else (offline installs, caching) keeps working exactly as before.

**Test after merging**: reload the site, confirm it still installs/works
offline (airplane mode + reload), *then* confirm the reminder opt-in still
prompts for permission correctly. Don't ship the merge without checking both.

## Part 3 — Actually sending the "1 hour before" reminders

Subscribing is only half of it — something has to trigger the send at the
right time. Two options, pick whichever is less setup:

### Option A — Zero code: send manually from the OneSignal dashboard

Before each session, go to OneSignal → **Messages → New Push** → target "All
Subscribed Users" → write the message → **Send now** (or **Schedule** for
next Wed/Sat). No Supabase involved. Totally fine if someone's happy to spend
30 seconds twice a week.

### Option B — Automated: Supabase Edge Function + pg_cron

This repo includes a scaffold for fully automatic sending:

1. **Deploy the Edge Function** (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```
   supabase functions deploy send-session-reminder
   supabase secrets set ONESIGNAL_APP_ID=12345678-abcd-... ONESIGNAL_API_KEY=<your REST API key>
   ```
2. **Schedule it** — in the Supabase SQL Editor, open
   [`supabase/cron-session-reminders.sql`](supabase/cron-session-reminders.sql),
   fill in your project ref + anon key where marked, and run it. It schedules
   two `pg_cron` jobs (Wed 19:00 Riyadh and Sat 07:00 Riyadh — both converted
   to UTC in the file, with the math explained in its comments) that call the
   Edge Function, which then calls OneSignal's REST API to actually send.
3. To stop the automated sends later: run the two `cron.unschedule(...)`
   lines at the bottom of that same SQL file.

## Notes

- Nothing above touches the `attendance`/`matches` tables or RLS policies from
  `SUPABASE_SETUP.md` — this is a separate, independent piece of the same
  optional Supabase project (or none, if you only want Option A).
- The REST API Key is a secret — it lives only in Supabase's Edge Function
  secrets (Part 3), never in client code or `VITE_*` variables.
- Web Push works in every modern desktop/mobile browser except iOS Safari
  before iOS 16.4, and requires the browser install/PWA route to actually
  receive notifications when the site tab is closed on some platforms — this
  is a OneSignal/browser platform limitation, not something this integration
  can change.
