import { test, expect } from "@playwright/test";

test("practice desk runs a Python snippet under the CSP", async ({ page }) => {
  test.setTimeout(120000);
  const violations = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (/Content Security Policy|CSP_VIOLATION/i.test(text)) violations.push(text);
  });
  await page.addInitScript(() => {
    localStorage.setItem("pythonlab.howto.v2", JSON.stringify({ seen: true }));
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(`CSP_VIOLATION ${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  await page.goto("/#/practice");
  await page.locator("#editor").fill('print("csp-pyodide-ok")\n');
  await page.locator("#run-code").click();
  await expect(page.locator("#output")).toHaveText("csp-pyodide-ok", { timeout: 90000 });
  await expect(page.locator("#run-status")).toHaveText("Run finished.");
  expect(violations).toEqual([]);
});
