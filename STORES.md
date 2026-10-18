# Shipping Python Lab as a Real App (`STORES.md`)

> **Disclaimer & Educational Notice:** Python Lab is an independent, free, learning-only student project by **CypherMonkey Labs** (`cyphermonkeylabs.com`). It is not affiliated with or endorsed by the Python Software Foundation, OpenEDG, Apple, Google, Microsoft, or xAI. Python is a trademark of the Python Software Foundation. Nothing here is sold, and **no rewards, certifications, job offers, or income are promised**.

---

## Top Summary: Gaps, `UNKNOWN` Items & `[HUMAN INPUT REQUIRED]`

Before publishing to any store, review these items that cannot be automated inside a public git repository:

1. **`[HUMAN INPUT REQUIRED]` Developer Accounts & Identity Verification**
   - **Google Play Console:** Requires a Google Play Developer account, identity verification, and a one-time registration fee (historically USD \$25; exact current regional fee/tax on your account is `UNKNOWN` until checked in your Play Console). Personal accounts created after November 2023 must also complete Google Play's closed-testing requirement (20 testers opted-in for 14 days continuously — exact current threshold on your account is `UNKNOWN`).
   - **Apple Developer Program:** Requires an Apple Developer Program membership (historically USD \$99/year; fee waiver eligibility for non-profits/educational institutions on your account is `UNKNOWN`) and an Apple ID with two-factor authentication on a Mac running Xcode.
   - **Microsoft Partner Center (Windows Store):** Requires a Microsoft Partner Center developer account (individual registration fee/status on your account is `UNKNOWN`).
2. **`[HUMAN INPUT REQUIRED]` Private Signing Keys (Never Commit to Git)**
   - Android upload keystore (`.jks` / `.keystore`) and its `SHA-256` certificate fingerprint for `packaging/assetlinks.template.json`.
   - Apple Distribution Certificate and Provisioning Profile in Xcode.
3. **Unverified Hardware & Store Review Behaviour (`UNKNOWN`)**
   - **Real iOS/Android physical device GPU & memory:** Pyodide 314.0.7 (CPython 3.14.2 WebAssembly + NumPy + pandas) was verified in headless/desktop Chrome (`1440x900` and `390x844` touch emulation), but peak memory pressure on low-RAM physical phones (`<= 2 GB RAM`) and older iOS WKWebView devices is **`UNKNOWN`**.
   - **Apple App Store Guideline 4.2 (Minimum Functionality):** How a specific Apple reviewer evaluates a Capacitor-wrapped educational web studio without extra native iOS APIs (such as WidgetKit or Siri Shortcuts) is **`UNKNOWN`** until submitted.
   - **Screen readers (VoiceOver / TalkBack) on physical devices:** ARIA labels, roles, landmarks, and keyboard focus traps are tested in Playwright, but live VoiceOver (iOS/macOS) and TalkBack (Android) behaviour is **`UNKNOWN`**.

---

## 1. Progressive Web App (PWA) — Ready Now

Python Lab ships as a complete, installable Progressive Web App directly from the static repository:

- **Web App Manifest:** [`manifest.webmanifest`](manifest.webmanifest) with `display: "standalone"`, `start_url: "./"`, `scope: "./"`, app shortcuts (`Practice`, `Downloads`, `Games`), and screenshot metadata.
- **Brand Icons & Splash Screen:** Generated deterministically by [`scripts/make_media.py`](scripts/make_media.py) with the **CypherMonkey zodiac monkey symbol** and `cyphermonkeylabs.com`:
  - [`assets/favicon.svg`](assets/favicon.svg) (vector icon)
  - [`assets/icon-192.png`](assets/icon-192.png) (`192x192` PNG)
  - [`assets/icon-512.png`](assets/icon-512.png) (`512x512` PNG)
  - [`assets/icon-maskable-512.png`](assets/icon-maskable-512.png) (`512x512` maskable safe-zone PNG)
  - [`assets/apple-touch-icon.png`](assets/apple-touch-icon.png) (`180x180` iOS home-screen icon)
  - [`assets/splash.png`](assets/splash.png) (`1280x720` launch splash preview)
- **Offline Service Worker:** [`sw.js`](sw.js) precaches the core shell and uses a network-first-with-cache-fallback strategy scoped to `./`.
- **In-App Install Prompt:** [`js/pwa.js`](js/pwa.js) wires the top-bar **App** button (`#pwa-install-btn`) and Display menu item to open an install guide + splash preview modal and trigger `beforeinstallprompt` when supported.

---

## 2. Google Play Store Packaging (Android)

You have two prepared options in [`packaging/`](packaging/): **Option A (Trusted Web Activity / Bubblewrap)** for a lightweight wrapper around the live `cyphermonkeylabs.com` PWA, or **Option B (Capacitor)** for a fully bundled offline Android app.

### Option A: Trusted Web Activity (TWA) with Bubblewrap
1. **Config prepared:** [`packaging/twa-manifest.json`](packaging/twa-manifest.json) and [`packaging/assetlinks.template.json`](packaging/assetlinks.template.json).
2. **Steps Lucky runs locally (outside git):**
   ```bash
   # 1. Generate an upload keystore OUTSIDE the repository
   keytool -genkeypair -v -keystore ~/cyphermonkey-upload.jks -alias pythonlab \
     -keyalg RSA -keysize 2048 -validity 10000

   # 2. Copy packaging/twa-manifest.json to a scratch build folder and set signingKey.path
   npx @bubblewrap/cli build --manifest=packaging/twa-manifest.json
   ```
3. **Digital Asset Links (`assetlinks.json`):**
   - After uploading the signed `.aab` (Android App Bundle) to Google Play Console, copy the **App signing key certificate SHA-256 fingerprint** from **Play Console → Setup → App signing**.
   - Paste that SHA-256 fingerprint into [`packaging/assetlinks.template.json`](packaging/assetlinks.template.json) and publish it at `https://cyphermonkeylabs.com/.well-known/assetlinks.json`.
   - Without `assetlinks.json` on the root domain, Chrome on Android will display a URL bar at the top (Custom Tabs fallback) instead of full-screen standalone mode.

### Option B: Bundled Offline Android App with Capacitor
1. **Config prepared:** [`packaging/capacitor.config.json`](packaging/capacitor.config.json).
2. **Steps Lucky runs in a build directory:**
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio, choose **Build → Generate Signed App Bundle / APK**, sign with your upload key, and upload the `.aab` to Google Play Console.

---

## 3. Apple iOS & iPadOS Packaging (Capacitor)

Apple does not allow Trusted Web Activities on the App Store; use **Capacitor** ([`packaging/capacitor.config.json`](packaging/capacitor.config.json)) so all HTML/CSS/JS/WASM/media assets are bundled inside the `.ipa` and served over `capacitor://localhost`.

### Steps Lucky Must Do Himself (`[HUMAN INPUT REQUIRED]`)
1. On a Mac with Xcode installed, initialize Capacitor in a build workspace outside the git repo:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/splash-screen
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
2. In Xcode:
   - Select the **App** target → **Signing & Capabilities** → choose your Apple Developer Team (`[HUMAN INPUT REQUIRED]`) and set Bundle Identifier to `com.cyphermonkeylabs.pythonlab`.
   - Drop `assets/icon-512.png` (resized to `1024x1024` opaque PNG) into `Assets.xcassets/AppIcon.appiconset`.
   - Verify that `.wasm` files in `vendor/pyodide/` are served with `application/wasm` MIME type inside `WKWebView` (Capacitor 5+ handles `.wasm` MIME types natively; exact behaviour on your target iOS version is `UNKNOWN` until tested in Simulator/Device).
3. **App Store Review Guideline 4.2 Note:**
   - Apple reviewers sometimes reject pure web wrappers under Guideline 4.2 ("Minimum Functionality"). Because Python Lab bundles a full offline CPython 3.14 WebAssembly runtime, 11 3D worlds, 8 interactive games/puzzles, offline MP3 audio lessons, and downloadable study packs, highlight these offline capabilities in your **App Review Notes**.

---

## 4. Web Stores (Microsoft Store, Chrome Web Store & Desktop)

- **Microsoft Store (Windows 10/11):**
  - Config prepared at [`packaging/pwabuilder-msstore.json`](packaging/pwabuilder-msstore.json).
  - Open [pwabuilder.com](https://www.pwabuilder.com/), enter `https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/`, click **Package for stores → Windows (MSIX)**, fill in your Partner Center Publisher ID (`[HUMAN INPUT REQUIRED]`), and upload the `.msixbundle` to Microsoft Partner Center.
- **ChromeOS / Desktop Browser Install:**
  - Already active via `manifest.webmanifest` and `sw.js`. Users on Chrome, Edge, or Brave on macOS/Windows/Linux/ChromeOS can click **App** in the top bar or the address-bar install icon.

---

## 5. Policy, Trademark & Licence Checks for Store Submissions

| Check Area | Status in Repo | Store Policy Requirement |
| :--- | :--- | :--- |
| **Content Licence (`CC BY-NC-SA 4.0`)** | Verified (`LICENSE`) | Lesson text and media are licensed **Non-Commercial** (`CC BY-NC-SA 4.0`). **The app must be distributed 100% free of charge with zero ads, zero in-app purchases, and zero subscriptions.** |
| **Code & Vendored Runtime Licences** | Verified (`THIRD_PARTY_MANIFEST.json`, `THIRD_PARTY_NOTICES.md`) | App code is MIT. Vendored components are MPL-2.0 (Pyodide), BSD-3-Clause (NumPy, pandas, python-dateutil), MIT (Mermaid, pytz, six), and SIL OFL 1.1 (Atkinson Hyperlegible, Fraunces, IBM Plex Mono). Keep `THIRD_PARTY_NOTICES.md` accessible in the app (`#/sources` and `#/about`). |
| **Python Trademark Policy** | Verified | The app title is **"Python Lab · CypherMonkey Labs"** (using the CypherMonkey zodiac monkey icon, not the official PSF two-snakes logo) and explicitly states in `#site-footer`: *"Python is a trademark of the Python Software Foundation. It is not affiliated with or endorsed by any of them."* |
| **No Deceptive Claims / No Rewards or Income Promises** | Verified | Every certification note, study checklist, and footer states that this is unaccredited educational material and **never promises jobs, salaries, rewards, or income**. |
| **Privacy & Data Safety Questionnaire** | Verified (`localStorage` only) | The app collects **zero personal data**, has **no analytics/trackers**, **no accounts**, and **no network calls off-origin**. Progress, theme, and XP stay in browser `localStorage`. For Google Play / App Store privacy URLs, point to `https://cyphermonkeylabs.com/#privacy` (`[HUMAN INPUT REQUIRED: verify privacy section exists on root site]`). |

---

## 6. Adapting Python Lab for Microsoft Foundry, Gemini / Android Studio & Grok Bot

### A. Microsoft Foundry (Azure AI Foundry / Agent Service)
- **How to adapt:**
  1. Export the structured curriculum metadata ([`data/lesson-map.json`](data/lesson-map.json), [`downloads/modules/manifest.json`](downloads/modules/manifest.json), and [`downloads/python-lab-slides.md`](downloads/python-lab-slides.md)) as a **Foundry Knowledge Index** (grounding documents) so an Azure AI Foundry agent answers only from cited Python Lab lessons and official `docs.python.org` sources.
  2. Expose the lesson exercise schema (`starter`, `checks`) as an OpenAPI / Function Tool in Foundry so the agent can grade student code using a sandboxed Python session rather than hallucinating code output.
  3. **Unverified (`UNKNOWN`):** Live Azure AI Foundry SDK endpoints, quota limits, and authentication keys are external to this static repo (`UNKNOWN`). Never embed Azure API keys in client-side JS.

### B. Gemini / Android Studio
- **How to adapt:**
  1. **Android Studio + Gemini Code Assist:** Open the Capacitor Android project (`npx cap open android`) in Android Studio. Provide [`README.md`](README.md), [`STORES.md`](STORES.md), and [`data/lesson-map.json`](data/lesson-map.json) as project context so Gemini in Android Studio can generate native Kotlin extensions (for example, a native Android Home Screen Widget showing daily Python flashcards from `downloads/modules/manifest.json`).
  2. **Gemini Nano / Chrome Built-in AI (`window.ai`) or Vertex AI / Google AI Studio:** In [`js/botteach.js`](js/botteach.js), the deterministic Socratic hints can optionally call a local on-device model (when `window.ai` is available) with a strict system prompt that cites `js/content/sources.js` and falls back to the built-in static hints when offline.
  3. **Unverified (`UNKNOWN`):** Availability of Chrome's experimental `window.ai` API across target student devices and Android WebView versions is **`UNKNOWN`**.

### C. Grok Bot (xAI API / X Bot Integration)
- **How to adapt:**
  1. **Daily Python Challenge Bot:** Use a server-side worker (never client-side static JS) that reads one lesson or interview challenge per day from [`data/lesson-map.json`](data/lesson-map.json) and [`js/content/dsa.js`](js/content/dsa.js), formats a short question + deep link (`https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/#/lesson/...`), and uses Grok (`xAI` API) on the backend to reply to student questions with links to `#/sources`.
  2. **In-Lab Bot (`Py`) Adapter:** Keep `#lab-bot` 100% static and offline by default; if a self-hosted proxy is configured in the future, route optional "Ask Grok" queries through a rate-limited backend proxy with the canon disclaimer attached.
  3. **Unverified (`UNKNOWN`):** xAI API pricing, rate limits, and X developer automation policy rules for your account are **`UNKNOWN`**.
