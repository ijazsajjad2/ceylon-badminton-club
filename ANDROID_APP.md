# Android app

The club site is now wrapped as a real installable Android app, in `android/`.
It's a **Trusted Web Activity (TWA)** — Google's official, recommended way to
turn an existing PWA into a Play Store app. It's a tiny native shell
(`com.google.androidbrowserhelper.trusted.LauncherActivity`) that opens
**https://ceylonbadminton.com** full-screen with no browser address bar. There's
no separate app code to maintain — the app always shows whatever is currently
live on the site, including the existing offline support (`sw.js`) and PWA
manifest already in `public/`.

Package name: `com.ceylonbadminton.app` · App name: **Ceylon Badminton Club**.

App polish built in: branded splash screen (navy + club crest), portrait
lock (matching the web manifest), adaptive launcher icons with Android 13+
themed-icon (Material You) support, a WebView fallback so the app opens
full-screen even on phones without Chrome, notification delegation (ready
for future web push), and App Links (`autoVerify`) so tapping
ceylonbadminton.com links opens the app once the domain verifies.

## Get the app (no Android Studio, no GitHub login needed)

The final, signed APK is published automatically to **GitHub Releases**:

> **https://github.com/ijazsajjad2/ceylon-badminton-club/releases/tag/android-latest**
> → download **`CeylonBadmintonClub.apk`**

That link always has the newest build — every push to `main` that touches
`android/` rebuilds and replaces it. Share the link directly with club
members; no GitHub account is needed to download.

Two other ways to get builds, from **GitHub → Actions → "Build Android app"**
(these do require being logged in):
- latest run → Artifacts → `ceylon-badminton-club-release-apk` (same APK)
  or `ceylon-badminton-club-debug-apk` (debug-signed variant)
- the **"Run workflow"** button triggers a fresh build anytime

(Building locally requires the Android SDK, which isn't available in this
sandboxed dev environment — CI is the real build/verify step for this app.)

### Signing

Both build types are signed with `android/keystore/debug.keystore` — the
standard Android debug keystore (universal well-known password `android`),
committed so every build carries the same signature. That's deliberate:
this repo is public, so no key stored here could be private anyway, and
one shared key means (a) any build verifies against the single fingerprint
in `assetlinks.json`, and (b) debug and release builds can install over
each other on members' phones. The one hard rule: this key must **never**
be used for the Play Store — Play publishing gets its own private key,
created locally and kept out of the repo (see below). If you ever want
CI to sign with a private key instead, put a keystore + passwords in
GitHub Actions secrets and reference them from the workflow.

## Install it on a phone

1. On the phone, open the Releases link above and download
   `CeylonBadmintonClub.apk` (or send the file over WhatsApp/Drive/USB).
2. Open it from the Downloads notification or Files app — Android will ask
   to allow installs from that source once. Install.
3. Open the app. First launch will look like a Chrome tab (with a URL bar)
   until the domain is verified (see below) — after that it opens full-screen
   with no browser chrome, indistinguishable from a native app. On phones
   without Chrome it falls back to a built-in WebView, still full-screen.

Or via `adb` with the phone connected over USB (developer mode + USB
debugging enabled): `adb install -r CeylonBadmintonClub.apk`.

All builds share one signature (see "Signing" below), so newer APKs install
straight over older ones — no uninstall needed.

## Domain verification (Digital Asset Links)

For Chrome to hide its UI and treat the app as the verified owner of
`ceylonbadminton.com`, the site must publish a signed statement matching the
app's signing certificate. That's already wired up:

- `public/.well-known/assetlinks.json` — published automatically at
  `https://ceylonbadminton.com/.well-known/assetlinks.json` on every deploy
  (verified locally: `vite build` copies it into `dist/` correctly).
- It lists the SHA-256 fingerprint of `android/keystore/debug.keystore`,
  which signs **all** builds (debug and release — see "Signing" above), so
  any build of the app verifies against the domain.
- Verification only works once `ceylonbadminton.com` is actually live and
  serving that file over HTTPS. Until then the app still works, it just shows
  a Chrome URL bar (falls back to a normal Custom Tab).

You can check it's live yourself once DNS is connected:
`https://ceylonbadminton.com/.well-known/assetlinks.json` should return the
JSON in that file. Chrome also has a checker: **Statement List Generator /
Digital Asset Links API** at
`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ceylonbadminton.com&relation=delegate_permission/common.handle_all_urls`.

## Publishing on the Google Play Store

This part needs **your own** Google account and can't be done for you end to
end — here's the exact path:

1. **Create a Play Console developer account** — [play.google.com/console](https://play.google.com/console),
   one-time $25 fee, your identity/organization gets verified (can take a
   day or two).
2. **Create a private upload signing key** — do NOT reuse the committed
   keystore for this (it's public). On any machine with a JDK:
   ```
   keytool -genkeypair -v -keystore play-upload.keystore \
     -alias ceylonbc -keyalg RSA -keysize 2048 -validity 10000
   ```
   Keep this file and its passwords private (password manager, not the
   repo). Google Play uses **Play App Signing**: you upload with this key,
   Google re-signs the app with its own managed key for distribution, so
   losing this key later isn't catastrophic (Play support can help you
   rotate it), but keep it safe.
3. **Point a release build at it** — in `android/app/build.gradle`, swap the
   `release` signing config's `storeFile`/passwords for your private
   keystore (locally — don't commit them), then build:
   `./gradlew bundleRelease` (Play wants an `.aab`, not an `.apk`).
4. **After the first upload**, get the fingerprint Play Console shows for
   your **App signing key** (Setup → App signing) and add it as another
   entry in `sha256_cert_fingerprints` in
   `public/.well-known/assetlinks.json` alongside the existing two, so the
   Play-distributed app also verifies.
5. **Store listing** — you'll need: a short/full description, a 512×512
   hi-res icon (already generated for you at
   `android/play-store-icon-512.png`), a feature graphic (1024×500), a
   handful of phone screenshots, a privacy policy URL, and to fill out the
   Data Safety form (this app itself collects no data beyond what the
   website already does — GA4 analytics, and the login system described in
   the main README).
6. **Target API level** — already set to 36 (Android 16), which meets
   Google Play's current new-app requirement.
7. Start on the **Internal testing** track first (instant, no review), then
   promote to Production once you're happy.

## Why a TWA instead of a "real" native rebuild

- **Zero duplicate code** — the app is the website. Every future site change
  (new sections, the scorekeeper/confirm system, etc.) ships to the app
  automatically, no app update needed.
- **Small** — a few hundred KB shell vs. megabytes for a full rebuild.
- **Already had the hard prerequisites** — a complete PWA manifest, icons,
  service worker and offline page were already built earlier for the site,
  which is exactly what a TWA needs.

If you outgrow this later — e.g. you want native push notifications beyond
web push, camera access, or a Play Store listing that looks less like "just
a website" — the natural next step is [Capacitor](https://capacitorjs.com/),
which bundles the built site with a real native project and native plugin
access. Not needed today.

## Everyone else: no app required

Since the site is already a full PWA, anyone can get an app-like icon on
their home screen today with zero install: open the site in Chrome → menu →
**"Add to Home Screen" / "Install app"**. The Android app above is for a
proper Play Store listing; the PWA install covers "I want an icon on my
phone" right now.
