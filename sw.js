/* Scope is the directory that contains this file.
   The page registers it with { scope: "./" }, so on
   https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/
   the worker covers that folder only. A root scope would be
   rejected, because a worker cannot control paths above its script. */

const CACHE_NAME = "pythonlab-pwa-v2";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/favicon.svg",
  "./assets/cyphermonkey-zodiac.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/splash.png",
  "./css/site.css",
  "./css/shell.css",
  "./css/footer.css",
  "./css/bot.css",
  "./css/howto.css",
  "./css/content.css",
  "./css/slides.css",
  "./css/fx.css",
  "./css/play.css",
  "./css/studio.css",
  "./js/app.js",
  "./js/cm-shared.js",
  "./js/pwa.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
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
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
