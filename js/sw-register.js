if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {
    /* A locked browser can refuse the worker. The pages still open. */
  });
}
