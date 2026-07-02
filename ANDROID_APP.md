# Android app

The club app is a **standalone Android app**, in `android/`. The production
build of the website is **bundled inside the APK** at build time and rendered
by an embedded WebView (`MainActivity` + `WebViewAssetLoader`, served over a
secure virtual origin so login/crypto work). That means:

- **No server, domain, or DNS needed** — the app runs entirely from the
  files inside the APK. It opens instantly and works fully offline.
- Online extras (Google Analytics, the optional Supabase live sync, YouTube
  thumbnails, external links) light up automatically when there's a
  connection.
- The flip side: the app shows the site *as of when the APK was built*. CI
  rebuilds and republishes the APK automatically on **every site change**,
  so "update the app" = re-download from the same link below.

> History: v1.0–1.1 used a Trusted Web Activity that loaded
> `https://ceylonbadminton.com` live — but until that domain's DNS is
> connected, a TWA has nothing to show (the app opened and immediately
> died). v1.2 switched to the bundled standalone architecture above, which
> doesn't depend on the domain at all.

Package name: `com.ceylonbadminton.app` · App name: **Ceylon Badminton Club**.

App polish built in: portrait lock, adaptive launcher icons with Android
13+ themed-icon (Material You) support, navy background matching the site
(no white flash on launch), external links opening in the right app
(WhatsApp/YouTube/browser) instead of inside the club app, and WebView
state preserved across rotation/backgrounding.

## Get the app (no Android Studio, no GitHub login needed)

The final, signed APK is published automatically to **GitHub Releases**:

> **https://github.com/ijazsajjad2/ceylon-badminton-club/releases/tag/android-latest**
> → download **`CeylonBadmintonClub.apk`**

That link always has the newest build — every push to `main` that changes
the site or the app shell rebuilds and replaces it. Share the link directly
with club members; no GitHub account is needed to download.

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
3. Open the app — the full club site loads instantly, full-screen, no
   browser UI, no internet required.

Or via `adb` with the phone connected over USB (developer mode + USB
debugging enabled): `adb install -r CeylonBadmintonClub.apk`.

All builds share one signature (see "Signing" below), so newer APKs install
straight over older ones — no uninstall needed.

## Domain verification (Digital Asset Links) — kept for later

The standalone app doesn't need the domain at all. But
`public/.well-known/assetlinks.json` (listing the committed keystore's
SHA-256 fingerprint) stays published at
`https://ceylonbadminton.com/.well-known/assetlinks.json` for when DNS is
connected — it enables App Links (ceylonbadminton.com links opening the
app) and a possible future switch back to a live-loading Trusted Web
Activity, whose code lives in this repo's history (v1.0–1.1).

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

## Why a bundled WebView instead of a "real" native rebuild

- **Zero duplicate code** — the app IS the website, byte for byte. One
  codebase; CI rebuilds the APK on every site change so the two never
  drift.
- **Works today, with nothing external** — no domain, no server, no DNS,
  no Chrome required on the phone. Fully offline.
- **A one-file native shell** — `MainActivity.java` (~100 lines) is the
  entire native surface. Easy to audit, nothing to maintain.

If you outgrow this later — e.g. you want native push notifications,
camera access, or other device APIs — the natural next step is
[Capacitor](https://capacitorjs.com/), which is this same architecture
plus a native plugin ecosystem. Not needed today.

## Everyone else: no app required

Since the site is also a full PWA, once `ceylonbadminton.com` is live
anyone can get an app-like icon with zero install: open the site in Chrome
→ menu → **"Add to Home Screen" / "Install app"**. The Android app above
works right now without the domain; the PWA install becomes a second
option once DNS is connected.
