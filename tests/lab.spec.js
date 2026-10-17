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
  "/#/section/start",
  "/#/section/flows",
  "/#/section/methods",
  "/#/section/modules",
  "/#/section/labs",
  "/#/section/games",
  "/#/section/integrations",
  "/#/section/lifetime",
  "/#/section/resources",
];

const SEEN = () => localStorage.setItem("pythonlab.howto.v1", JSON.stringify({ seen: true }));
test.beforeEach(async ({ context }) => { await context.addInitScript(SEEN); });

const brandHosts = new Set(["cyphermonkeylabs.com", "www.cyphermonkeylabs.com", "github.com", "www.github.com", "linktr.ee", "www.linktr.ee", "creativecommons.org", "www.creativecommons.org"]);

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
  await page.getByText("Display", { exact: true }).click();
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
  await page.getByText("Display", { exact: true }).click();
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

const SECTION_NAMES = ["Start Here", "Fundamentals", "Flows", "Methods", "Modules", "Labs", "Games", "Integrations", "Lifetime Learning", "Resources"];

test("desktop shell: left menu, top bar, bottom bar, 3D hero", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator("#topbar")).toBeVisible();
  await expect(page.locator("#bottombar")).toBeVisible();
  const side = page.locator("#sidemenu");
  await expect(side).toBeVisible();
  for (const name of SECTION_NAMES) {
    const item = side.locator(".side-item", { hasText: name }).first();
    await expect(item).toBeVisible();
    expect((await item.locator(".side-desc").innerText()).trim().length).toBeGreaterThan(8);
    expect(await item.locator("svg").count()).toBe(1);
  }
  await expect(page.locator(".hero3d .cube")).toBeVisible();
  const transform = await page.locator(".hero3d .scene3d").evaluate((el) => getComputedStyle(el).transformStyle);
  expect(transform).toBe("preserve-3d");
  await page.locator("#side-collapse").click();
  await page.waitForTimeout(450);
  const narrow = (await side.boundingBox()).width;
  expect(narrow).toBeLessThan(100);
  await page.locator("#side-collapse").click();
  await page.waitForTimeout(450);
  expect((await side.boundingBox()).width).toBeGreaterThan(250);
  await side.locator(".side-item", { hasText: "Flows" }).click();
  await expect(page).toHaveURL(/#\/section\/flows/);
  await expect(page.locator("h1")).toHaveText("Flows");
  await expect(side.locator('[aria-current="page"]')).toContainText("Flows");
  await page.locator("#bar-next").click();
  await expect(page).toHaveURL(/#\/section\/methods/);
  await page.locator("#top-search").fill("numpy");
  await expect(page.locator("#search-results .sr-item").first()).toContainText("NumPy");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/numpy|data/);
  expect(errors).toEqual([]);
});

test("phone shell: hamburger drawer and bottom bar", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await ctx.addInitScript(SEEN);
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator("#sidemenu")).not.toBeInViewport();
  await page.locator("#menu-toggle").tap();
  await expect(page.locator("#sidemenu")).toBeInViewport();
  for (const name of SECTION_NAMES) await expect(page.locator("#sidemenu .side-item", { hasText: name }).first()).toBeVisible();
  await page.locator("#sidemenu .side-item", { hasText: "Games" }).tap();
  await expect(page).toHaveURL(/#\/section\/games/);
  await expect(page.locator("#sidemenu")).not.toBeInViewport();
  await expect(page.locator("#bottombar")).toBeVisible();
  await ctx.close();
  expect(errors).toEqual([]);
});

test("bot opens a panel on click and tap, and still drags", async ({ browser }) => {
  for (const touch of [false, true]) {
    const ctx = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
    await ctx.addInitScript(SEEN);
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto("/");
    const bot = page.locator("#lab-bot");
    const panel = page.locator("#bot-panel");
    await expect(panel).toBeHidden();
    const before = await bot.boundingBox();
    if (touch) await bot.tap(); else await bot.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Where would you like to go");
    expect(await panel.locator("a").count()).toBeGreaterThan(5);
    const after = await bot.boundingBox();
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeLessThan(2);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    const box = await bot.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x - 120, box.y - 120, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await expect(panel).toBeHidden();
    const moved = await bot.boundingBox();
    expect(Math.abs(moved.x - box.x) + Math.abs(moved.y - box.y)).toBeGreaterThan(40);
    await ctx.close();
    expect(errors).toEqual([]);
  }
});

test("footer has the canon disclaimer, the brand icon bar, and the shortcut bar", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  const foot = page.locator("#site-footer");
  await foot.scrollIntoViewIfNeeded();
  await expect(foot.locator(".disclaimer-panel")).toContainText("independent, free, learning-only student project");
  await expect(foot.locator(".disclaimer-panel")).toContainText("not affiliated with or endorsed by");
  await expect(foot.locator(".brand-icons a.brand-icon")).toHaveCount(3);
  await expect(foot.locator(".footer-bar .fb-item")).toHaveCount(7);
  await expect(foot).toContainText("© 2026 CypherMonkeyLabs");
  const hrefs = await foot.locator(".brand-icons a").evaluateAll((els) => els.map((e) => e.href));
  expect(hrefs).toEqual(["https://cyphermonkeylabs.com/", "https://github.com/CypherMonkeyLabs", "https://linktr.ee/cypherMonkey"]);
  expect(errors).toEqual([]);
});

test("first visit shows the how-to dialog once, Help reopens it", async ({ browser }) => {
  for (const touch of [false, true]) {
    const ctx = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto("/");
    const dlg = page.locator("#howto");
    await expect(dlg).toBeVisible({ timeout: 4000 });
    await expect(dlg).toContainText("Left menu");
    await expect(dlg).toContainText("Cheat sheets");
    await expect(dlg).toContainText("Four themes");
    if (touch) await page.locator("#howto-ok").tap(); else await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await page.reload();
    await page.waitForTimeout(1500);
    await expect(page.locator("#howto")).toHaveCount(0);
    if (touch) await page.locator("#help-btn").tap(); else await page.locator("#help-btn").click();
    await expect(page.locator("#howto")).toBeVisible();
    await page.locator('[data-howto-theme="paper"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
    await page.locator("#howto-x").click();
    await expect(page.locator("#howto")).toBeHidden();
    await ctx.close();
    expect(errors).toEqual([]);
  }
});

test("the bot is labelled, colourful and animated", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#bot-bubble")).toContainText("Py");
  await expect(page.locator("#lab-bot .bot-svg text")).toHaveText("BOT");
  expect(await page.locator("#lab-bot .bulb").evaluate((el) => getComputedStyle(el).animationName)).toBe("bulb");
  expect(await page.locator("#lab-bot .eye").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("blink");
});

const diagramIds = ["how-python-runs", "function-call", "import-system", "event-loop", "task-lifecycle", "pandas-pipeline", "pyodide-architecture", "study-loop"];

test("every Archify diagram opens, loads its page, and has sources", async ({ page }) => {
  const errors = watchErrors(page);
  const bad = [];
  page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto("/#/diagrams");
  await expect(page.locator("h1")).toHaveText("Diagrams");
  await expect(page.locator(".dgrid .dcard")).toHaveCount(diagramIds.length);
  for (const id of diagramIds) {
    await page.goto(`/#/diagram/${id}`);
    await expect(page.locator("h1")).toBeVisible();
    const frame = page.frameLocator("iframe.dframe-view");
    await expect(frame.locator("svg").first()).toBeVisible({ timeout: 8000 });
    expect(await page.locator("main .notice li").count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator('main a[href^="#/sources/"]').count()).toBeGreaterThanOrEqual(2);
  }
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test("section pages carry diagram strips", async ({ page }) => {
  for (const id of ["flows", "modules", "methods", "integrations", "lifetime"]) {
    await page.goto(`/#/section/${id}`);
    await expect(page.locator(".dstrip .dcard").first()).toBeVisible();
  }
});
