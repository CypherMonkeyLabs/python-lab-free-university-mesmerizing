import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:41731",
  },
  webServer: {
    command: "python3 -m http.server 41731 --bind 127.0.0.1",
    url: "http://127.0.0.1:41731",
    reuseExistingServer: true,
    timeout: 20000,
  },
});
