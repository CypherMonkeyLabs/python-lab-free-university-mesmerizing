/* Scope is the directory that contains this file.
   The page registers it with { scope: "./" }, so on
   https://cyphermonkeylabs.com/python-lab-free-university-mesmerizing/
   the worker covers that folder only. A root scope would be
   rejected, because a worker cannot control paths above its script. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
