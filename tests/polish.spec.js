import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const shotDir = path.join("docs", "screenshots", "polish");
fs.mkdirSync(shotDir, { recursive: true });

const seen = () => {
  localStorage.setItem("pythonlab.howto.v2", JSON.stringify({ seen: true }));
  localStorage.setItem("pythonlab.quality.v1", JSON.stringify({ choice: "flat" }));
};

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function overlap(page, selector) {
  return page.evaluate((sel) => {
    const bot = document.querySelector("#lab-bot");
    const style = getComputedStyle(bot);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
    const b = bot.getBoundingClientRect();
    return [...document.querySelectorAll(sel)].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (r.bottom < 0 || r.top > window.innerHeight) return false;
      const x = Math.min(b.right, r.right) - Math.max(b.left, r.left);
      const y = Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top);
      return x > 1 && y > 1;
    });
  }, selector);
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ context }) => { await context.addInitScript(seen); });

  test("progress labels match and the top label is fully visible", async ({ page }) => {
    const keys = [
      "start/how-to-use", "start/map", "start/runtime",
      "fundamentals/syntax", "fundamentals/types", "fundamentals/names",
      "fundamentals/control", "fundamentals/functions", "fundamentals/classes",
    ];
    await page.addInitScript((ids) => {
      localStorage.setItem("pythonlab.visited.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
      localStorage.setItem("pythonlab.progress.v1", JSON.stringify({
        lessons: Object.fromEntries(ids.slice(0, 6).map((id) => [id, "passed"])),
        quizzes: {},
      }));
    }, keys);
    await page.goto("/");
    const text = "9 of 56 lessons opened";
    await expect(page.locator(".tp-text")).toHaveText(text);
    await expect(page.locator(".side-foot-text")).toHaveText(text);
    await expect(page.locator(".bar-count")).toHaveText(text);
    const clipped = await page.locator(".tp-text").evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(clipped).toBe(false);
    await page.screenshot({ path: path.join(shotDir, "after-home-1440.png") });
  });

  test("voice preview keeps the bot visible, then returns to idle", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/#/");
    await page.locator("#audio-lessons").scrollIntoViewIfNeeded();
    const bot = page.locator("#lab-bot");
    await expect(bot).toBeVisible();
    await page.locator("#audio-lessons [data-voice-preview]").click();
    await expect(bot).toHaveClass(/is-speaking/);
    await expect(bot).toBeVisible();
    await expect(bot).not.toHaveClass(/is-speaking/, { timeout: 12000 });
    await expect(bot).toBeVisible();
    await expect(page.locator("#voice-credits")).toContainText("Linda");
    await expect(page.locator("#voice-credits")).toContainText("public domain");
    await expect(page.locator("#audio-lessons input[value='cori']")).toBeVisible();
    await page.locator("#audio-lessons input[value='cori']").check();
    await page.reload();
    await expect(page.locator("#audio-lessons input[value='cori']")).toBeChecked();
    await page.screenshot({ path: path.join(shotDir, "after-voice-1440.png") });
    expect(errors.filter((line) => !/favicon/i.test(line))).toEqual([]);
  });

  test("studio stations and concept explorer", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/#/studio");
    await expect(page.locator("h1")).toHaveText("Studio");
    await page.locator("[data-stack='push']").click();
    await expect(page.locator("[data-stack-view]")).toContainText("greet");
    await page.locator("[data-loop-step]").click();
    await expect(page.locator("[data-loop-readout]")).toContainText("n is 0");
    await page.screenshot({ path: path.join(shotDir, "after-studio-1440.png") });
    expect(errors.filter((line) => !/favicon/i.test(line))).toEqual([]);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("how-to Start Here is not covered by the bot", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("pythonlab.quality.v1", JSON.stringify({ choice: "flat" }));
    });
    await page.goto("/");
    const start = page.getByRole("link", { name: "Start Here", exact: true });
    await expect(start).toBeVisible();
    const covered = await overlap(page, "#howto a[href='#/section/start'], #howto-ok");
    expect(covered).toBe(false);
    await page.screenshot({ path: path.join(shotDir, "after-howto-390.png") });
  });

  test("footer lockup and disclaimer stay clear of the bot", async ({ page }) => {
    await page.addInitScript(seen);
    await page.goto("/");
    await page.locator(".wl-x").click({ timeout: 3000 }).catch(() => {});
    const panels = ".disclaimer-panel, .footer-zodiac-lockup, .brand-icons, .footer-bar";
    for (const y of [13000, 13200, 13400, 13600]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
      const hit = await overlap(page, panels);
      expect(hit, `bot overlaps a footer panel at scroll ${y}`).toBe(false);
    }
    await page.locator(".footer-zodiac-lockup").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    expect(await overlap(page, panels)).toBe(false);
    await page.screenshot({ path: path.join(shotDir, "after-footer-390.png") });
    await page.locator("h1").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await expect(page.locator("#lab-bot")).toBeVisible();
  });

  test("voice preview on a phone keeps the bot on screen", async ({ page }) => {
    await page.addInitScript(seen);
    await page.goto("/#/");
    await page.locator(".wl-x").click({ timeout: 3000 }).catch(() => {});
    await page.locator("#audio-lessons").scrollIntoViewIfNeeded();
    const bot = page.locator("#lab-bot");
    await page.locator("#audio-lessons [data-voice-preview]").tap();
    await expect(bot).toBeVisible();
    await expect(bot).toHaveClass(/is-speaking/);
    await expect(bot).not.toHaveClass(/is-speaking/, { timeout: 12000 });
    await expect(bot).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "after-voice-390.png") });
  });
});

test("offline home and a lesson", async ({ page, context }) => {
  await page.addInitScript(seen);
  await page.goto("/");
  await page.waitForFunction(async () => {
    const ready = await navigator.serviceWorker.ready;
    if (!ready.active) return false;
    const cache = await caches.open("pythonlab-pwa-v7");
    const shell = await cache.match("./js/app.js");
    const audio = await cache.match("./media/audio-syntax.mp3");
    const lesson = await cache.match("./js/content/start.js");
    const index = await cache.match("./js/content/pybot-index.json");
    return !!(shell && audio && lesson && index);
  }, 0, { timeout: 20000 });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Python Lab");
  await page.goto("/#/lesson/start/how-to-use");
  await expect(page.locator("h1")).toContainText("How to use");
  await page.screenshot({ path: path.join(shotDir, "after-offline-lesson.png") });
});
