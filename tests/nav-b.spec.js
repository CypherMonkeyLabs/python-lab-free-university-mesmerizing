import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SEEN = () => localStorage.setItem("pythonlab.howto.v2", JSON.stringify({ seen: true, at: "2020-01-01" }));
test.beforeEach(async ({ context }) => { await context.addInitScript(SEEN); });

const DECKS = ["first-hour", "data-structures", "functions-classes", "modules-packages", "async-flow", "python-314", "numpy-pandas", "browser-python", "lifetime-learning"];
const GUIDES = ["control-flow", "iterators-generators", "async-in-practice", "functions-and-calls", "classes-and-methods", "import-system", "packaging-and-environments", "data-with-pandas", "python-in-the-browser", "study-plan", "whats-new-314"];
const DIAG = ["how-python-runs", "function-call", "import-system", "event-loop", "task-lifecycle", "pandas-pipeline", "pyodide-architecture", "study-loop"];
const MATRIX_ROUTES = [
  "#/", "#/path", "#/practice", "#/games", "#/games/guess", "#/games/snake", "#/games/adventure", "#/quizzes", "#/quiz/fundamentals", "#/ecosystem/glossary", "#/ecosystem/map", "#/ecosystem/sisters", "#/ecosystem/integrations", "#/ecosystem/hooks", "#/downloads", "#/sources", "#/about", "#/rooms/lobby", "#/rooms/syntax", "#/diagrams", "#/slides", "#/guides",
  ..."start fundamentals flows methods modules labs games integrations lifetime resources".split(" ").map((id) => `#/section/${id}`),
  ...DECKS.map((id) => `#/slides/${id}`),
  ...GUIDES.map((id) => `#/guide/${id}`),
  ...DIAG.map((id) => `#/diagram/${id}`),
  "#/worlds",
  ...Array.from({ length: 11 }, (_, n) => `#/worlds/${n}`),
  "#/diagram/level-map", "#/diagram/lab-architecture", "#/download-center",
];

test("search is wide on large screens and a magnifier below 1100", async ({ page }) => {
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/");
    const box = await page.locator("#top-search").boundingBox();
    expect(box.width, `search at ${width}`).toBeGreaterThanOrEqual(240);
    await expect(page.locator("#search-toggle")).toBeHidden();
  }
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/#/");
  const wide = await page.locator("#top-search").isVisible();
  const mag = await page.locator("#search-toggle").isVisible();
  expect(wide || mag).toBe(true);
});

test("dict search lists at least three results", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/");
  await page.locator("#top-search").fill("dict");
  const results = page.locator("#search-results .sr-item");
  await expect.poll(async () => results.count()).toBeGreaterThanOrEqual(3);
  const box = await page.locator("#search-results").boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(320);
  await expect(results.first().locator(".sr-kind")).toBeVisible();
});

test("top bar keeps at most seven focusable controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/");
  const count = await page.locator("#topbar").evaluate((bar) => {
    return [...bar.querySelectorAll("a, button, input, summary, select")].filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length;
  });
  expect(count).toBeLessThanOrEqual(7);
});

test("drawer closes on Escape and traps Tab", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  await page.locator("#menu-toggle").click();
  await expect(page.locator("#sidemenu")).toBeInViewport();
  await expect(page.locator("#menu-toggle")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Shift+Tab");
  const inside = await page.evaluate(() => !!document.activeElement.closest("#sidemenu"));
  expect(inside).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-toggle")).toBeFocused();
  await expect(page.locator("#sidemenu")).not.toBeInViewport();
});

test("next from syntax stays on the original five lessons", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#/lesson/fundamentals/syntax");
  const seen = [];
  for (let i = 0; i < 5; i += 1) {
    await page.locator("#bar-next").click();
    seen.push(new URL(page.url()).hash);
  }
  expect(seen).toEqual([
    "#/lesson/fundamentals/types",
    "#/lesson/fundamentals/names",
    "#/lesson/fundamentals/control",
    "#/lesson/fundamentals/functions",
    "#/lesson/fundamentals/classes",
  ]);
});

test("home previous is Start and the last page loops", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  await expect(page.locator("#bar-prev")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#bar-prev .bar-label")).toHaveText("Start");
  await expect(page.locator("#bar-where")).toHaveText("Home");
  const end = await page.evaluate(async () => {
    const { sequence } = await import("/js/content/sections.js");
    return sequence[sequence.length - 1].href;
  });
  await page.goto("/" + end);
  await expect(page.locator("#bar-next .bar-label")).toHaveText("Back to start ↺");
  await expect(page.locator("#bar-where")).toBeVisible();
});

test("phone pages do not overflow and keep large targets", async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/", { waitUntil: "domcontentloaded" });
  for (const route of MATRIX_ROUTES) {
    await page.evaluate((hash) => { location.hash = hash; }, route);
    // Slide decks rewrite the hash to /n after they open.
    await page.waitForFunction((hash) => {
      const now = location.hash;
      const here = now === hash || now.startsWith(`${hash}/`);
      return here && document.querySelector("h1");
    }, route);
    const report = await page.evaluate(() => {
      const bar = document.querySelector("#topbar");
      const overflow = document.documentElement.scrollWidth - 390;
      const barRight = bar ? bar.getBoundingClientRect().right : 0;
      const tiny = [...document.querySelectorAll("a, button, input, summary, select, textarea")].filter((el) => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
        if (rect.width >= 24 && rect.height >= 24) return false;
        if (el.tagName === "A" && el.closest("p, li, figcaption, .summary, .lede")) return false;
        return true;
      }).map((el) => {
        const rect = el.getBoundingClientRect();
        const label = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
        return `${el.tagName}.${el.className} ${Math.round(rect.width)}x${Math.round(rect.height)} ${label}`.slice(0, 140);
      });
      return { overflow, barRight, tiny };
    });
    expect(report.overflow, route).toBeLessThanOrEqual(1);
    expect(report.barRight, route).toBeLessThanOrEqual(390);
    expect(report.tiny, route).toEqual([]);
  }
});

test("read times follow the word formula and new lessons are linked", async ({ page }) => {
  await page.goto("/#/");
  const report = await page.evaluate(async () => {
    const { tracks } = await import("/js/content/catalog.js");
    const { lessonMinutes } = await import("/js/content/readtime.js");
    const { searchIndex } = await import("/js/content/sections.js");
    const ids = ["strings", "comprehensions", "lambdas", "iterators", "decorators", "with-blocks", "inheritance", "regular-expressions", "logging-well", "tracebacks", "when-which"];
    const mismatches = [];
    const found = [];
    tracks.forEach((track) => track.lessons.forEach((lesson) => {
      if (lesson.minutes !== lessonMinutes(lesson)) mismatches.push(`${track.id}/${lesson.id}`);
      if (ids.includes(lesson.id)) found.push(`${track.id}/${lesson.id}`);
    }));
    const index = searchIndex();
    const searchable = ids.filter((id) => index.some((row) => row.href.includes("/" + id)));
    return { mismatches, found, searchable };
  });
  expect(report.mismatches).toEqual([]);
  expect(report.found).toHaveLength(11);
  expect(report.searchable).toHaveLength(11);
  await page.goto("/#/path");
  await expect(page.locator("h1")).toHaveText("Curriculum map");
  await expect(page.locator("a[href='#/lesson/fundamentals/strings']")).toBeVisible();
});

test("new samples match the Pyodide runtime", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("/#/practice");
  const samples = await page.evaluate(async () => {
    const { tracks } = await import("/js/content/catalog.js");
    const ids = new Set(["strings", "comprehensions", "lambdas", "iterators", "decorators", "with-blocks", "inheritance", "regular-expressions", "logging-well", "tracebacks", "when-which"]);
    const rows = [];
    tracks.forEach((track) => track.lessons.forEach((lesson) => {
      if (ids.has(lesson.id) && lesson.sample) rows.push({ id: `${track.id}/${lesson.id}`, code: lesson.sample.code, output: lesson.sample.output });
    }));
    return rows;
  });
  expect(samples).toHaveLength(11);
  for (const sample of samples) {
    await page.locator("#editor").fill(sample.code);
    await page.locator("#output").evaluate((el) => { el.textContent = "waiting"; });
    await page.locator("#run-status").evaluate((el) => { el.textContent = ""; });
    await page.locator("#run-code").click();
    await expect(page.locator("#run-status")).toContainText("Run finished", { timeout: 120000 });
    await expect(page.locator("#output")).not.toHaveText("waiting", { timeout: 120000 });
    const actual = await page.locator("#output").innerText();
    expect(actual.replace(/\s+$/, ""), sample.id).toBe(sample.output.replace(/\s+$/, ""));
  }
});

const AXE_ROUTES = ["#/", "#/section/fundamentals", "#/lesson/fundamentals/syntax", "#/lesson/fundamentals/strings", "#/path", "#/practice", "#/downloads", "#/sources", "#/games", "#/about"];

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`axe finds no serious issues at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    const problems = [];
    for (const route of AXE_ROUTES) {
      await page.goto("/" + route);
      // diagrams/*.html belongs to the other workstream. Scan the lab page, not that iframe.
      const result = await new AxeBuilder({ page }).exclude("iframe").analyze();
      result.violations
        .filter((item) => item.impact === "serious" || item.impact === "critical")
        .forEach((item) => problems.push(`${route} ${item.id} ${item.help}`));
    }
    expect(problems).toEqual([]);
  });
}

test("help returns focus and the footer has no inline color styles", async ({ page }) => {
  await page.goto("/#/");
  await page.locator("#help-btn").click();
  await expect(page.locator("#howto")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#help-btn")).toBeFocused();
  const inline = await page.locator("body").evaluate((body) => body.innerHTML.includes('style="--c'));
  expect(inline).toBe(false);
});
