/* Scope is the directory that contains this file.
   The page registers it with { scope: "./" }, so on
   https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/
   the worker covers that folder only. A root scope would be
   rejected, because a worker cannot control paths above its script. */

const CACHE_NAME = "pythonlab-pwa-v6";
const CACHE_BUDGET_NOTE = "Precache stays under 3.5 MB: shell, lesson modules, default audio, short clips. Pyodide is not precached.";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/favicon.svg",
  "./assets/cyphermonkey-zodiac.svg",
  "./media/voices.json",
  "./css/bot.css",
  "./css/content.css",
  "./css/footer.css",
  "./css/fx.css",
  "./css/howto.css",
  "./css/play.css",
  "./css/shell.css",
  "./css/site.css",
  "./css/slides.css",
  "./css/studio.css",
  "./assets/fonts/atkinson-400.woff2",
  "./assets/fonts/atkinson-700.woff2",
  "./assets/fonts/fraunces-560.woff2",
  "./assets/fonts/plex-mono-400.woff2",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/splash.png",
  "./js/app.js",
  "./js/bot.js",
  "./js/botfx.js",
  "./js/botpanel.js",
  "./js/botchat.js",
  "./js/content/pybot-index.json",
  "./shared/pybot-chat/engine.js",
  "./shared/pybot-chat/ui.js",
  "./shared/pybot-chat/chat.css",
  "./js/botteach.js",
  "./js/cm-shared.js",
  "./js/content/applied.js",
  "./js/content/bot-hints.js",
  "./js/content/catalog.js",
  "./js/content/diagrams.js",
  "./js/content/downloads.js",
  "./js/content/dsa.js",
  "./js/content/ecosystem.js",
  "./js/content/fundamentals.js",
  "./js/content/guides.js",
  "./js/content/language.js",
  "./js/content/levels.js",
  "./js/content/path.js",
  "./js/content/sections.js",
  "./js/content/slides.js",
  "./js/content/sources.js",
  "./js/content/start.js",
  "./js/diagrams.js",
  "./js/display.js",
  "./js/downloadcenter.js",
  "./js/fx.js",
  "./js/games.js",
  "./js/guideviews.js",
  "./js/howto.js",
  "./js/icons.js",
  "./js/levelworlds.js",
  "./js/play.js",
  "./js/prefs.js",
  "./js/pwa.js",
  "./js/pycustom.js",
  "./js/runner.js",
  "./js/shell.js",
  "./js/slides.js",
  "./js/speech.js",
  "./js/studio-floor.js",
  "./js/studio/posters.js",
  "./js/studio/studio.js",
  "./js/studio/tiers.js",
  "./js/tour.js",
  "./js/util.js",
  "./js/views.js",
  "./js/views2.js",
  "./js/voice.js",
  "./js/welcome.js",
  "./js/worlds.js",
  "./js/xp.js",
  "./media/voice-preview-ljspeech.mp3",
  "./media/voice-preview-norman.mp3",
  "./media/voice-preview-cori.mp3",
  "./media/audio-syntax.mp3",
  "./media/audio-structures.mp3",
  "./media/audio-async.mp3",
  "./media/audio-interview.mp3",
  "./media/typing.mp4",
  "./media/dict-lookup.webm",
  "./media/indent.gif",
  "./media/async-loop.gif",
  "./media/list-comprehension.mp4",
  "./vendor/three/three.subset.min.js",
  "./media/audio-syntax-norman.mp3",
  "./media/audio-structures-norman.mp3",
  "./media/audio-async-norman.mp3",
  "./media/audio-interview-norman.mp3",
  "./media/audio-syntax-cori.mp3",
  "./media/audio-structures-cori.mp3",
  "./media/audio-async-cori.mp3",
  "./media/audio-interview-cori.mp3",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(SHELL_ASSETS.map((url) => cache.add(url).catch(() => null))))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const heavy = url.pathname.includes("/vendor/pyodide/") || url.pathname.endsWith(".wasm");
        const length = Number(res.headers.get("content-length") || 0);
        if (res && res.status === 200 && res.type === "basic" && !heavy && (length === 0 || length < 1500000)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
