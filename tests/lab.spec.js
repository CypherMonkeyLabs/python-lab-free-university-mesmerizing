import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/#/track/fundamentals",
  "/#/lesson/fundamentals/syntax",
  "/#/lesson/fundamentals/control",
  "/#/lesson/async/coroutines",
  "/#/lesson/data/numpy",
  "/#/lesson/certifications/tracks",
  "/#/practice",
  "/#/games",
  "/#/games/guess",
  "/#/games/snake",
  "/#/games/adventure",
  "/#/quizzes",
  "/#/quiz/fundamentals",
  "/#/quiz/interview",
  "/#/ecosystem/glossary",
  "/#/ecosystem/map",
  "/#/ecosystem/sisters",
  "/#/ecosystem/integrations",
  "/#/ecosystem/hooks",
  "/#/downloads",
  "/#/sources",
  "/#/sources/pcep",
  "/#/about",
  "/#/rooms/lobby",
  "/#/rooms/syntax",
  "/#/rooms/data",
  "/#/rooms/agents",
  "/#/no-such-room",
];

const brandHosts = new Set(["cyphermonkeylabs.com", "www.cyphermonkeylabs.com", "github.com", "www.github.com", "linktr.ee", "www.linktr.ee"]);

async function assertLayout(page) {
  const h1 = page.locator("h1");
  await expect(h1).toBeVisible();
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const h1 = document.querySelector("h1").getBoundingClientRect();
    const bot = document.querySelector("#lab-bot").getBoundingClientRect();
    const overlap = Math.min(h1.right, bot.right) - Math.max(h1.left, bot.left) > 0.5
      && Math.min(h1.bottom, bot.bottom) - Math.max(h1.top, bot.top) > 0.5;
    const loading = [...document.querySelectorAll("body *")].some((el) => {
      if (el.children.length > 0) return false;
      return /^\s*loading\b/i.test(el.textContent || "");
    });
    const rooted = [];
    document.querySelectorAll("a[href], link[href], script[src], img[src], video[src], video[poster], source[src]").forEach((el) => {
      ["href", "src", "poster"].forEach((name) => {
        const value = el.getAttribute(name);
        if (value && value.startsWith("/") && !value.startsWith("//")) rooted.push(value);
      });
    });
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      overlap,
      loading,
      rooted,
      h1Top: h1.top,
    };
  });
  expect(metrics.rooted, "root-absolute URLs").toEqual([]);
  expect(metrics.overflow, "horizontal overflow").toBeLessThanOrEqual(1);
  expect(metrics.overlap, "bot covers h1").toBe(false);
  expect(metrics.loading, "loading placeholder").toBe(false);
}

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

for (const viewport of [
  { width: 390, height: 844, name: "phone" },
  { width: 1440, height: 900, name: "desk" },
]) {
  test(`routes stay inside the screen on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const errors = watchErrors(page);
    for (const route of routes) {
      await page.goto(route);
      await page.waitForSelector("h1");
      await assertLayout(page);
      if (!route.includes("/sources")) {
        const bad = await page.evaluate((allowed) => {
          const hosts = [];
          document.querySelectorAll("a[href]").forEach((anchor) => {
            const href = anchor.getAttribute("href") || "";
            if (!/^https?:/i.test(href)) return;
            const host = new URL(href).host;
            if (!allowed.includes(host)) hosts.push(href);
          });
          return hosts;
        }, [...brandHosts]);
        expect(bad, `off-list links on ${route}`).toEqual([]);
      }
    }
    expect(errors, "console or page errors").toEqual([]);
  });
}

test("the service worker scope is this directory", async ({ page }) => {
  await page.goto("/");
  const info = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration("./");
    const worker = reg && (reg.active || reg.installing || reg.waiting);
    return {
      scope: reg ? reg.scope : "",
      script: worker ? worker.scriptURL : "",
      expected: new URL("./", location.href).href,
    };
  });
  expect(info.scope).toBe(info.expected);
  expect(info.script).toBe(new URL("./sw.js", info.expected).href);
});

test("menu cards have a one-line description", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const cards = page.locator(".menu-card");
  const count = await cards.count();
  expect(count).toBeGreaterThan(15);
  for (let i = 0; i < count; i += 1) {
    const desc = cards.nth(i).locator(".menu-desc");
    await expect(desc).toBeVisible();
    expect((await desc.innerText()).trim().length).toBeGreaterThan(8);
  }
});

test("theme, filter, quiz, games, and downloads work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = watchErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Paper" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
  await page.locator("#menu-filter").fill("zzzz-no-topic");
  await expect(page.locator("#menu-empty")).toBeVisible();
  await page.locator("#menu-filter").fill("syntax");
  await expect(page.locator("#menu-empty")).toBeHidden();

  await page.goto("/#/quiz/start");
  await page.getByRole("button", { name: "A local Pyodide build of CPython 3.14.2" }).click();
  await expect(page.getByText("That matches the intended answer.")).toBeVisible();

  await page.goto("/#/games/guess");
  await page.locator("#guess-input").fill("40");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.locator(".guess-status")).not.toHaveText("No guess yet.");

  await page.goto("/#/games/adventure");
  const log = page.locator("#adv-log");
  const send = async (command) => {
    await page.locator("#adv-input").fill(command);
    await page.getByRole("button", { name: "Do" }).click();
  };
  await send("go east");
  await send("take beacon");
  await send("go west");
  await send("go west");
  await send("use beacon");
  await expect(log).toContainText("You did it");

  await page.goto("/#/games/snake");
  await expect(page.locator("#snake-canvas")).toBeVisible();

  const pdf = await page.request.get("/downloads/python-syntax-cheatsheet.pdf");
  expect(pdf.ok()).toBeTruthy();
  const body = await pdf.body();
  expect(body.subarray(0, 4).toString()).toBe("%PDF");
  const text = await page.request.get("/downloads/study-checklist.txt");
  expect(text.ok()).toBeTruthy();
  expect(await text.text()).toContain("does not estimate pay");

  await page.goto("/#/ecosystem/map");
  await expect(page.locator(".diagram-host svg")).toBeVisible({ timeout: 15000 });

  expect(errors).toEqual([]);
});

test("the bot snaps clear of the heading at 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Reset bot" }).click();
  await assertLayout(page);
  const bot = page.locator("#lab-bot");
  const box = await bot.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(30, 20, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await assertLayout(page);
  const saved = await page.evaluate(() => localStorage.getItem("pythonlab.bot.v1"));
  expect(saved).toContain("x");
});

test("a lesson check runs in the local runtime", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = watchErrors(page);
  await page.goto("/#/lesson/start/map");
  await page.locator("#editor").fill("def greet():\n    return 'Hello, lab'\n");
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#checks")).toContainText("passed", { timeout: 60000 });
  await page.goto("/#/lesson/data/numpy");
  await page.locator("#editor").fill("import numpy as np\n\ndef mean_of(values):\n    return float(np.asarray(values, dtype=float).mean())\n");
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#checks")).toContainText("passed", { timeout: 60000 });
  await page.goto("/#/lesson/data/pandas");
  await page.locator("#editor").fill("import pandas as pd\n\ndef column_sum(records, column):\n    frame = pd.DataFrame(records)\n    return int(frame[column].sum())\n");
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#checks")).toContainText("passed", { timeout: 60000 });
  await page.goto("/#/lesson/async/coroutines");
  await page.locator("#editor").fill("import asyncio\n\nasync def delayed_sum(a, b):\n    await asyncio.sleep(0)\n    return a + b\n");
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#checks")).toContainText("passed", { timeout: 60000 });
  expect(errors).toEqual([]);
});
