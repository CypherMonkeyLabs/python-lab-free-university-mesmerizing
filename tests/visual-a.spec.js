import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const shotDir = path.join("docs", "screenshots", "redesign-a");
fs.mkdirSync(shotDir, { recursive: true });

const seen = () => {
  localStorage.setItem("pythonlab.howto.v2", JSON.stringify({ seen: true }));
  localStorage.setItem("pythonlab.quality.v1", JSON.stringify({ choice: "flat" }));
};

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

async function openBot(page) {
  await page.locator("#lab-bot").click();
  await expect(page.locator("#bot-panel")).toBeVisible();
  await page.waitForTimeout(520);
}

function contrast(fg, bg) {
  const parse = (value) => {
    const m = String(value).match(/[\d.]+/g);
    if (!m) return [0, 0, 0];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  };
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const a = L(parse(fg));
  const b = L(parse(bg));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

test("chat log is tall enough at both sizes", async ({ browser }) => {
  for (const size of [
    { width: 390, height: 844, min: 300, name: "390" },
    { width: 1440, height: 900, min: 360, name: "1440" },
  ]) {
    const context = await browser.newContext({ viewport: size, hasTouch: size.width < 500, isMobile: size.width < 500 });
    await context.addInitScript(seen);
    const page = await context.newPage();
    await page.goto("/");
    await openBot(page);
    const height = await page.locator(".py-chat-log").evaluate((el) => el.getBoundingClientRect().height);
    expect(height, size.name).toBeGreaterThanOrEqual(size.min);
    const fits = await page.locator(".py-chat-log").evaluate((el) => {
      const sample = document.createElement("p");
      sample.textContent = Array.from({ length: 60 }, () => "word").join(" ");
      sample.style.margin = "0";
      sample.style.width = `${el.clientWidth - 16}px`;
      el.appendChild(sample);
      const block = sample.getBoundingClientRect().height;
      const room = el.getBoundingClientRect().height;
      sample.remove();
      return room + 1 >= block;
    });
    expect(fits, size.name).toBe(true);
    await page.screenshot({ path: path.join(shotDir, `chat-empty-${size.name}.png`) });
    await context.close();
  }
});

test("message design, chips, composer, and panel axe", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openBot(page);
  const panel = page.locator("#bot-panel");
  await expect(panel.locator(".py-chat-beta")).toHaveCount(1);
  await expect(panel.locator(".bp-bot")).toHaveCount(0);
  const avatar = panel.locator(".py-avatar").first();
  await expect(avatar).toBeVisible();
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox.width).toBeGreaterThanOrEqual(28);
  await expect(panel.locator(".py-msg-from").first()).toContainText("From:");
  const gap = await panel.locator(".py-actions").first().evaluate((el) => parseFloat(getComputedStyle(el).gap));
  expect(gap).toBeGreaterThanOrEqual(8);
  const chips = panel.locator(".py-chip");
  const chipCount = await chips.count();
  expect(chipCount).toBeLessThanOrEqual(5);
  for (let i = 0; i < chipCount; i += 1) {
    const box = await chips.nth(i).evaluate((el) => ({
      h: el.getBoundingClientRect().height,
      scroll: el.scrollHeight,
      client: el.clientHeight,
    }));
    expect(box.h).toBeLessThan(44);
    expect(box.scroll).toBeLessThanOrEqual(box.client + 1);
  }
  await expect(panel.locator(".py-chat-examples")).toHaveAttribute("aria-label", "Suggested questions");
  await page.locator("#py-chat-input").press("Enter");
  await expect(panel.locator("#py-chat-status")).toContainText("Type a question first.");
  await expect(panel.locator(".py-msg-user")).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).include("#bot-panel").analyze();
  const names = axe.violations.map((item) => item.id);
  expect(names).not.toContain("label-content-name-mismatch");
  const botAxe = await new AxeBuilder({ page }).include("#lab-bot").analyze();
  expect(botAxe.violations.map((item) => item.id)).not.toContain("label-content-name-mismatch");
});

test("retrieval fallback and three answers leave the log readable", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openBot(page);
  const input = page.locator("#py-chat-input");
  await input.fill("lambda");
  await input.press("Enter");
  await expect(page.locator(".py-msg-bot").last()).toContainText("I don't have that yet");
  await page.screenshot({ path: path.join(shotDir, "chat-fallback-1440.png") });
  await input.fill("show an example");
  await input.press("Enter");
  await expect(page.locator(".py-msg-bot").last()).toContainText("Which topic?");
  for (const q of ["what is a list", "what is a dictionary", "what is a function"]) {
    await input.fill(q);
    await input.press("Enter");
  }
  await expect(page.locator(".py-msg-user")).toHaveCount(5);
  await page.screenshot({ path: path.join(shotDir, "chat-answers-1440.png") });
  const bubble = await page.locator("#bot-bubble").innerText();
  const answers = await page.locator(".py-msg-bot .py-msg-text").allInnerTexts();
  for (const answer of answers) expect(bubble).not.toBe(answer);
});

test("docked bot stays off lesson text at 390", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["#/lesson/fundamentals/syntax", "#/practice", "#/track/fundamentals"]) {
    await page.goto(`/${route}`);
    await page.waitForTimeout(200);
    const hit = await page.evaluate(() => {
      const bot = document.querySelector("#lab-bot").getBoundingClientRect();
      const nodes = document.querySelectorAll("main p, main button, main a");
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const overlaps = rect.width > 0 && rect.height > 0
          && bot.left < rect.right && bot.right > rect.left
          && bot.top < rect.bottom && bot.bottom > rect.top;
        if (overlaps) return node.tagName + " " + (node.textContent || "").slice(0, 40);
      }
      return "";
    });
    expect(hit, route).toBe("");
  }
  const label = await page.locator("#lab-bot").getAttribute("aria-label");
  expect(label).toBe("Py, the lab bot: open helper");
});

test("games icons differ and slides hero uses a slides icon", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/games");
  await page.waitForTimeout(200);
  const icons = await page.locator("#main a[href^='#/games/'] .ico svg").evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
  expect(new Set(icons).size).toBe(icons.length);
  expect(icons.length).toBeGreaterThan(4);
  await page.screenshot({ path: path.join(shotDir, "games-1440.png") });
  await page.goto("/#/slides");
  await expect(page.locator(".sec-hero-ico svg")).toHaveAttribute("data-icon", "slides");
});

test("diagram fill follows the surface token", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/lesson/fundamentals/syntax");
  await page.waitForSelector(".diagram-host svg .node rect, .diagram-host svg .node polygon", { timeout: 15000 });
  for (const theme of ["ink", "paper", "terminal", "contrast"]) {
    await page.evaluate((name) => { document.documentElement.dataset.theme = name; }, theme);
    await expect.poll(async () => page.evaluate(() => {
      const node = document.querySelector(".diagram-host svg .node rect, .diagram-host svg .node polygon");
      const probe = document.createElement("span");
      probe.style.background = "var(--surface-2)";
      document.body.appendChild(probe);
      const surface = getComputedStyle(probe).backgroundColor;
      probe.remove();
      if (!node) return "";
      return getComputedStyle(node).fill === surface ? "ok" : `${getComputedStyle(node).fill} vs ${surface}`;
    }), { timeout: 8000 }).toBe("ok");
  }
  await page.screenshot({ path: path.join(shotDir, "diagram-1440.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(shotDir, "diagram-390.png") });
});

test("reduced motion leaves no running animations on home or a world", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ["/", "/#/worlds/0"]) {
    await page.goto(route);
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => document.getAnimations().filter((item) => item.playState === "running").length);
    expect(running, route).toBe(0);
  }
});

test("sampled text clears 4.5:1 on the listed surfaces", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const samples = [
    { theme: "ink", selector: ".pill" },
    { theme: "terminal", selector: "main p" },
    { theme: "paper", selector: "main p" },
  ];
  for (const sample of samples) {
    await page.evaluate((name) => { document.documentElement.dataset.theme = name; }, sample.theme);
    const ratio = await page.locator(sample.selector).first().evaluate((el) => {
      const style = getComputedStyle(el);
      const canvas = document.createElement("canvas");
      const rect = el.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" ? style.backgroundColor : getComputedStyle(el.parentElement).backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const counts = new Map();
      for (let i = 0; i < data.length; i += 16) {
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      let best = "0,0,0";
      let n = 0;
      counts.forEach((value, key) => { if (value > n) { n = value; best = key; } });
      return { fg: style.color, bg: `rgb(${best})` };
    });
    const score = contrast(ratio.fg, ratio.bg);
    expect(score, `${sample.theme} ${sample.selector} ${ratio.fg} on ${ratio.bg}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("the page policy blocks nothing and a Python check still runs", async ({ page }) => {
  test.setTimeout(90000);
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__csp.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/lesson/start/map");
  await page.locator("#editor").fill("def greet():\n    return 'Hello, lab'\n");
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#checks")).toContainText("passed", { timeout: 60000 });
  const blocked = await page.evaluate(() => window.__csp || []);
  expect(blocked).toEqual([]);
  expect(errors).toEqual([]);
});

test("mobile screenshots of chat, games, and a track", async ({ page }) => {
  await page.addInitScript(seen);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openBot(page);
  await page.screenshot({ path: path.join(shotDir, "chat-empty-390.png") });
  const input = page.locator("#py-chat-input");
  await input.fill("what is the weather in paris");
  await input.press("Enter");
  await expect(page.locator(".py-msg-bot").last()).toContainText("I don't have that yet");
  await page.screenshot({ path: path.join(shotDir, "chat-fallback-390.png") });
  for (const q of ["what is a list", "what is a dictionary", "what is a function"]) {
    await input.fill(q);
    await input.press("Enter");
  }
  await expect(page.locator(".py-msg-user")).toHaveCount(4);
  await page.screenshot({ path: path.join(shotDir, "chat-answers-390.png") });
  await page.goto("/#/games");
  await page.screenshot({ path: path.join(shotDir, "games-390.png") });
  await page.goto("/#/track/fundamentals");
  await page.screenshot({ path: path.join(shotDir, "track-390.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/track/fundamentals");
  await page.screenshot({ path: path.join(shotDir, "track-1440.png") });
  expect(errors).toEqual([]);
});
