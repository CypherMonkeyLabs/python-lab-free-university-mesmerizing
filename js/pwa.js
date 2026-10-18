/* Progressive Web App install prompt, offline status indicator, and splash screen preview dialog. */
import { zodiacMonkeySvg, BRAND_DOMAIN } from "./cm-shared.js";

let deferredPrompt = null;

export function isInstalledApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator?.standalone === true;
}

export function openInstallModal() {
  let dlg = document.getElementById("pwa-install-modal");
  if (!dlg) {
    dlg = document.createElement("div");
    dlg.id = "pwa-install-modal";
    dlg.className = "howto-scrim";
    dlg.innerHTML = `<section class="howto pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-dlg-title" tabindex="-1">
      <div class="howto-head">
        <span class="cm-zodiac-badge" aria-hidden="true">${zodiacMonkeySvg(38)}</span>
        <div>
          <h2 id="pwa-dlg-title">Install Python Lab App</h2>
          <p class="cm-sub-domain">${BRAND_DOMAIN} · Offline-ready Progressive Web App</p>
        </div>
        <button type="button" class="howto-x" id="pwa-dlg-close" aria-label="Close install window">&times;</button>
      </div>
      <div class="howto-body">
        <figure class="pwa-splash-preview">
          <img src="assets/splash.png" alt="Python Lab splash screen with CypherMonkey zodiac monkey symbol and cyphermonkeylabs.com" width="640" height="360" loading="lazy">
          <figcaption>App splash screen &amp; home-screen icon · Works offline once opened · Free educational project, no account required.</figcaption>
        </figure>
        <div class="howto-grid">
          <div class="howto-card" style="--c1:#22d3ee;--c2:#a78bfa">
            <span class="hc-ico">💻</span>
            <span><b>Desktop (Chrome / Edge)</b><span class="hc-t">Click <b>Install Now</b> below (when available) or click the install icon in your browser's address bar.</span></span>
          </div>
          <div class="howto-card" style="--c1:#fbbf24;--c2:#f472b6">
            <span class="hc-ico">📱</span>
            <span><b>iPhone &amp; iPad (Safari)</b><span class="hc-t">Tap the <b>Share</b> button in Safari, then choose <b>Add to Home Screen</b>.</span></span>
          </div>
          <div class="howto-card" style="--c1:#34d399;--c2:#22d3ee">
            <span class="hc-ico">🤖</span>
            <span><b>Android (Chrome)</b><span class="hc-t">Tap <b>Install Now</b> or open the browser menu (⋮) and tap <b>Add to Home screen / Install app</b>.</span></span>
          </div>
        </div>
      </div>
      <div class="howto-foot">
        <button type="button" class="primary" id="pwa-prompt-go">Install / Add to Home Screen</button>
        <button type="button" class="text-btn" id="pwa-dlg-ok">Close</button>
        <small id="pwa-install-status">Status: ${isInstalledApp() ? "Running as installed app" : "Ready for offline caching & home-screen install"} · ${BRAND_DOMAIN}</small>
      </div>
    </section>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", async (e) => {
      if (e.target === dlg || e.target.closest("#pwa-dlg-close") || e.target.closest("#pwa-dlg-ok")) {
        dlg.hidden = true;
      } else if (e.target.closest("#pwa-prompt-go")) {
        const st = dlg.querySelector("#pwa-install-status");
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: "dismissed" }));
          deferredPrompt = null;
          if (st) st.textContent = `Install prompt ${choice.outcome}. You can also install from your browser menu at any time.`;
        } else if (st) {
          st.textContent = "Use your browser's address-bar Install icon or Share → Add to Home Screen to finish installing.";
        }
      }
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "Escape") dlg.hidden = true;
    });
  }
  dlg.hidden = false;
  dlg.querySelector("#pwa-prompt-go")?.focus({ preventScroll: true });
}

export function initPWA() {
  if (isInstalledApp()) {
    document.documentElement.setAttribute("data-app-mode", "standalone");
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.documentElement.setAttribute("data-pwa-installable", "true");
    const btn = document.getElementById("pwa-install-btn");
    if (btn) btn.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    document.documentElement.setAttribute("data-app-mode", "standalone");
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-install-app]")) {
      e.preventDefault();
      openInstallModal();
    }
  });
}
