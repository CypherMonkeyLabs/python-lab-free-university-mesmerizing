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
  const startLabels = await panel.locator(".py-chip").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()).filter((text) => text === "Where do I start?"));
  expect(startLabels).toEqual(["Where do I start?"]);
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
  const caption = await page.locator(".bot-caption").innerText();
  const answers = await page.locator(".py-msg-bot .py-msg-text").allInnerTexts();
  expect(caption.trim()).toBe("");
  for (const answer of answers) {
    expect(bubble).not.toBe(answer);
    expect(caption).not.toContain(answer.slice(0, 40));
  }
  await input.fill("install python");
  await input.press("Enter");
  const download = page.locator(".py-msg-bot a.py-src-link").last();
  await expect(download).toHaveAttribute("href", "https://www.python.org/downloads/");
  await expect(download).toContainText("https://www.python.org/downloads/");
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

async function paintedRatio(page, locator) {
  const target = locator.first();
  await target.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  const fg = await target.evaluate((el) => getComputedStyle(el).color);
  const box = await target.evaluate((el) => {
    el.querySelectorAll("*").forEach((child) => {
      child.style.setProperty("color", "transparent", "important");
      child.style.setProperty("-webkit-text-fill-color", "transparent", "important");
    });
    el.style.setProperty("color", "transparent", "important");
    el.style.setProperty("-webkit-text-fill-color", "transparent", "important");
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const clip = {
    x: Math.max(0, Math.round(box.x)),
    y: Math.max(0, Math.round(box.y)),
    width: Math.max(1, Math.round(Math.min(box.width, 1440 - Math.max(0, box.x)))),
    height: Math.max(1, Math.round(Math.min(box.height, 900 - Math.max(0, box.y)))),
  };
  const png = await page.screenshot({ clip });
  await target.evaluate((el) => {
    el.style.removeProperty("color");
    el.style.removeProperty("-webkit-text-fill-color");
    el.querySelectorAll("*").forEach((child) => {
      child.style.removeProperty("color");
      child.style.removeProperty("-webkit-text-fill-color");
    });
  });
  const bg = await page.evaluate(async (data) => {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const x0 = Math.floor(canvas.width * 0.2);
    const x1 = Math.max(x0 + 1, Math.ceil(canvas.width * 0.8));
    const y0 = Math.floor(canvas.height * 0.25);
    const y1 = Math.max(y0 + 1, Math.ceil(canvas.height * 0.75));
    const counts = new Map();
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] < 16) continue;
        const key = `${pixels[i] >> 3},${pixels[i + 1] >> 3},${pixels[i + 2] >> 3}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    let best = "0,0,0";
    let n = 0;
    counts.forEach((value, key) => { if (value > n) { n = value; best = key; } });
    const [r, g, b] = best.split(",").map((part) => (Number(part) << 3) + 4);
    return `rgb(${r}, ${g}, ${b})`;
  }, png.toString("base64"));
  return { fg, bg, score: contrast(fg, bg) };
}

async function expectContrast(page, selector, theme) {
  const ratio = await paintedRatio(page, page.locator(selector));
  expect(ratio.score, `${theme} ${selector} ${ratio.fg} on ${ratio.bg}`).toBeGreaterThanOrEqual(4.5);
}

test("sampled text clears 4.5:1 on the listed surfaces", async ({ page }) => {
  test.setTimeout(180000);
  await page.addInitScript(seen);
  await page.addInitScript(() => {
    localStorage.setItem("pythonlab.prefs.v1", JSON.stringify({ tier: "off", sound: false }));
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const theme of ["ink", "paper", "terminal", "contrast"]) {
    await page.addInitScript((name) => { localStorage.setItem("pythonlab.theme", name); }, theme);
    await page.goto("/");
    await page.evaluate((name) => { document.documentElement.dataset.theme = name; }, theme);
    await expect(page.locator(".welcome .wl-t")).toBeVisible({ timeout: 8000 });
    await expectContrast(page, ".welcome .wl-t", theme);
    await expectContrast(page, ".welcome .wl-go", theme);
    await expectContrast(page, ".xp-chip", theme);
    await page.locator(".disclaimer-panel a").first().scrollIntoViewIfNeeded();
    await expectContrast(page, ".disclaimer-panel a", theme);
    await page.evaluate(async () => {
      const tour = await import("/js/tour.js");
      tour.startTour();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await expect(page.locator(".tour-card h2")).toBeVisible();
    await expectContrast(page, ".tour-card h2", theme);
    await page.evaluate(async () => {
      const tour = await import("/js/tour.js");
      tour.endTour();
      const fx = await import("/js/fx.js");
      fx.levelUp(4);
    });
    await expect(page.locator(".lu-ring span")).toBeVisible();
    await expectContrast(page, ".lu-ring span", theme);
    await page.evaluate(() => document.getElementById("levelup")?.remove());
    await page.evaluate(async () => {
      const teach = await import("/js/botteach.js");
      teach.react("think");
    });
    await expect(page.locator(".bot-mood")).toBeVisible();
    await expectContrast(page, ".bot-mood", theme);
    await page.goto("/#/slides/first-hour/2");
    await page.evaluate((name) => { document.documentElement.dataset.theme = name; }, theme);
    await expect(page.locator("#deck-stage .term-bar")).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll(".term3d").forEach((node) => { node.style.transform = "none"; });
    });
    await expectContrast(page, "#deck-stage .term-bar", theme);
    await page.goto("/#/games/blocks");
    await page.evaluate((name) => { document.documentElement.dataset.theme = name; }, theme);
    await expect(page.locator(".bk-chip").first()).toBeVisible();
    await expectContrast(page, ".bk-chip", theme);
  }
});

test("toast close removes the toast", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(async () => {
    const fx = await import("/js/fx.js");
    fx.toast("Saved your place", 20000);
  });
  const toast = page.locator(".fx-toast");
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".fx-toast")).toHaveCount(0);
});

test("chat header buttons do not wrap or clip at 1440", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openBot(page);
  const buttons = page.locator("#bot-panel .bp-head button, #bot-panel .py-chat-tools button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const box = await buttons.nth(i).evaluate((el) => ({
      name: el.getAttribute("aria-label") || el.textContent.trim(),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(box.scrollWidth, box.name).toBeLessThanOrEqual(box.clientWidth);
    expect(box.scrollHeight, box.name).toBeLessThanOrEqual(box.clientHeight + 1);
  }
  await expect(page.locator(".py-chat-beta")).toContainText("scripted offline helper, may miss questions");
  await expect(page.locator(".py-chat-beta")).not.toContainText("Beta:");
});

test("desktop figure stays off lesson text at 1440", async ({ page }) => {
  await page.addInitScript(seen);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/lesson/fundamentals/syntax");
  await page.waitForTimeout(300);
  const hit = await page.evaluate(() => {
    const bot = document.querySelector("#lab-bot").getBoundingClientRect();
    const nodes = document.querySelectorAll("main p, main li, main h1, main h2, main button, main a");
    const hits = [];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      const overlaps = rect.width > 0 && rect.height > 0
        && bot.left < rect.right && bot.right > rect.left
        && bot.top < rect.bottom && bot.bottom > rect.top;
      if (overlaps) hits.push(node.tagName + " " + (node.textContent || "").slice(0, 40));
    }
    return hits;
  });
  expect(hit).toEqual([]);
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
