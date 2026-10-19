import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const shotDir = path.join("docs", "screenshots", "polish");
fs.mkdirSync(shotDir, { recursive: true });

const seen = () => {
  localStorage.setItem("pythonlab.howto.v2", JSON.stringify({ seen: true }));
  localStorage.setItem("pythonlab.quality.v1", JSON.stringify({ choice: "flat" }));
};

const QA = ["Level 1", "Level 2", "Level 3", "Foundations", "Audio", "Video", "Downloads", "Games", "Hints"];

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

function quiet(errors) {
  return errors.filter((line) => !/favicon/i.test(line));
}

async function openBot(page, touch) {
  const bot = page.locator("#lab-bot");
  if (touch) await bot.tap();
  else await bot.click();
  await expect(page.locator("#bot-panel")).toBeVisible();
  await page.waitForTimeout(520);
}

async function inputIsUsable(page) {
  return page.evaluate(() => {
    const input = document.querySelector("#py-chat-input");
    const form = document.querySelector(".py-chat-form");
    const bot = document.querySelector("#lab-bot");
    const ir = input.getBoundingClientRect();
    const fr = form.getBoundingClientRect();
    const br = bot.getBoundingClientRect();
    const view = window.visualViewport;
    const viewTop = view ? view.offsetTop : 0;
    const viewLeft = view ? view.offsetLeft : 0;
    const viewBottom = view ? view.offsetTop + view.height : window.innerHeight;
    const viewRight = view ? view.offsetLeft + view.width : window.innerWidth;
    const x = ir.left + ir.width / 2;
    const y = ir.top + ir.height / 2;
    const top = document.elementFromPoint(x, y);
    const overlap = fr.left < br.right - 1 && fr.right > br.left + 1 && fr.top < br.bottom - 1 && fr.bottom > br.top + 1;
    const onScreen = ir.top >= viewTop - 1 && ir.bottom <= viewBottom + 1 && ir.left >= viewLeft - 1 && ir.right <= viewRight + 1;
    return {
      overlap,
      onScreen,
      hit: !!(top && (top === input || input.contains(top))),
    };
  });
}

async function ask(page, text) {
  const input = page.locator("#py-chat-input");
  await input.fill(text);
  await input.press("Enter");
  await expect(page.locator(".py-msg-user").last()).toContainText(text);
}

for (const viewport of [
  { width: 1440, height: 900, touch: false, name: "1440" },
  { width: 390, height: 844, touch: true, name: "390" },
]) {
  test(`chat works at ${viewport.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });
    await context.addInitScript(seen);
    const page = await context.newPage();
    const errors = watchErrors(page);
    await page.goto("/");
    await openBot(page, viewport.touch);
    const panel = page.locator("#bot-panel");
    await expect(panel).toContainText("scripted offline helper, may miss questions");
    await expect(panel.locator(".py-chat-beta")).not.toContainText("Beta:");
    await expect(panel).toContainText("Where would you like to go");
    await expect(panel).toContainText("Try asking");
    await panel.locator("details.py-quick").evaluate((el) => { el.open = true; });
    await expect(panel).toContainText("Character name");
    await expect(panel.locator("#py-name")).toHaveCount(1);
    for (const label of QA) await expect(panel.locator(".bp-qa", { hasText: label })).toHaveCount(1);
    await expect(panel.locator("#py-chat-input")).toBeVisible();
    await expect(panel.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Clear chat" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Read aloud" }).first()).toBeVisible();
    const usable = await inputIsUsable(page);
    expect(usable.overlap, "bot covers the chat input").toBe(false);
    expect(usable.onScreen, "chat input is off screen").toBe(true);
    expect(usable.hit, "chat input is not the top element").toBe(true);
    const bars = await page.evaluate(() => {
      const panel = document.querySelector("#bot-panel").getBoundingClientRect();
      const top = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
      const bar = document.querySelector(".bottombar")?.getBoundingClientRect().top || window.innerHeight;
      return { clear: panel.top >= top - 1 && panel.bottom <= bar + 1, top: panel.top, bottom: panel.bottom, topBar: top, bottomBar: bar };
    });
    expect(bars.clear, `panel overlaps a bar ${JSON.stringify(bars)}`).toBe(true);

    const bot = page.locator("#lab-bot");
    await ask(page, "What is a list?");
    await expect(bot).toBeVisible();
    await expect(bot).toHaveClass(/is-speaking/);
    const answer = panel.locator(".py-msg-bot").last();
    await expect(answer.locator("a.py-msg-link")).toBeVisible();
    await expect(answer).toContainText(/Open (lesson|page)/);
    const still = await inputIsUsable(page);
    expect(still.overlap, "bot covers the input while answering").toBe(false);
    expect(still.hit, "input covered while answering").toBe(true);
    await page.screenshot({ path: path.join(shotDir, `py-chat-${viewport.name}.png`) });

    await panel.locator(".py-chat-chips [data-py-ask]").click();
    await expect(panel.locator(".py-msg-user")).toHaveCount(2);
    await panel.getByRole("button", { name: "Clear chat" }).click();
    await expect(panel.locator(".py-chat-log")).toContainText("Chat cleared");
    await expect(panel.locator(".py-msg-user")).toHaveCount(0);
    await context.close();
    expect(quiet(errors)).toEqual([]);
  });
}

test("chat input stays on screen at 390x430", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 430 },
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(seen);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto("/");
  await openBot(page, true);
  const panel = page.locator("#bot-panel");
  await expect(panel.locator("#py-chat-input")).toBeVisible();
  const usable = await inputIsUsable(page);
  expect(usable.overlap, "bot covers the chat input").toBe(false);
  expect(usable.onScreen, "chat input is off screen").toBe(true);
  expect(usable.hit, "chat input is not the top element").toBe(true);
  await ask(page, "What is a list?");
  const still = await inputIsUsable(page);
  expect(still.overlap, "bot covers the input while answering").toBe(false);
  expect(still.onScreen, "input left the screen while answering").toBe(true);
  expect(still.hit, "input covered while answering").toBe(true);
  const logBox = await panel.locator(".py-chat-log").evaluate((el) => ({
    height: el.clientHeight,
    overflow: getComputedStyle(el).overflowY,
  }));
  expect(logBox.height, "answer log is too short to read").toBeGreaterThanOrEqual(48);
  expect(logBox.overflow === "auto" || logBox.overflow === "scroll", "answer log does not scroll").toBe(true);
  await expect(panel.getByRole("button", { name: "Clear chat" })).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "py-chat-390x430.png") });
  await context.close();
  expect(quiet(errors)).toEqual([]);
});

test("chat history survives all four themes", async ({ page }) => {
  await page.addInitScript(seen);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openBot(page, false);
  await ask(page, "What is a list?");
  for (const theme of ["paper", "terminal", "contrast", "ink"]) {
    await page.keyboard.press("Escape");
    await expect(page.locator("#bot-panel")).toBeHidden();
    await page.locator(".display-menu").evaluate((el) => { el.open = true; });
    await page.locator(`[data-theme-set="${theme}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.locator(".display-menu").evaluate((el) => { el.open = false; });
    await openBot(page, false);
    await expect(page.locator(".py-msg-user")).toContainText("What is a list?");
    const colors = await page.locator("#py-chat-input").evaluate((el) => {
      const style = getComputedStyle(el);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(colors.color).not.toBe(colors.background);
    const usable = await inputIsUsable(page);
    expect(usable.hit, theme).toBe(true);
  }
  expect(quiet(errors)).toEqual([]);
});

test("reduced motion still answers and skips the speaking animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(seen);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openBot(page, false);
  await ask(page, "How do I run code?");
  const bot = page.locator("#lab-bot");
  await expect(bot).toBeVisible();
  await expect(bot).toHaveClass(/is-speaking/);
  await expect(page.locator(".py-msg-bot").last()).toContainText(/practice desk|Run code/i);
  const animation = await page.locator("#lab-bot .mouth").evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  expect(quiet(errors)).toEqual([]);
});

test("chat answers from the precached index while offline", async ({ page, context }) => {
  await page.addInitScript(seen);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForFunction(async () => {
    const ready = await navigator.serviceWorker.ready;
    if (!ready.active) return false;
    const cache = await caches.open("pythonlab-pwa-v8");
    const index = await cache.match("./js/content/pybot-index.json");
    const engine = await cache.match("./shared/pybot-chat/engine.js");
    const chat = await cache.match("./js/botchat.js");
    return !!(index && engine && chat);
  }, null, { timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  await openBot(page, false);
  await ask(page, "What is a list?");
  await expect(page.locator(".py-msg-bot").last()).toContainText(/list/i);
  await expect(page.locator(".py-msg-bot").last()).not.toContainText("did not load");
  await expect(page.locator("#lab-bot")).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "py-chat-offline.png") });
  expect(quiet(errors)).toEqual([]);
});
