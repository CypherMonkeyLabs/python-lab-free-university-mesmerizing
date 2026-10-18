"""Visitor test for PR13 (3D worlds, level downloads, one bot/popup/downloads). Usage: python3 tests/visitor_pr13.py <base-url> <out-dir>"""
import asyncio, json, shutil, sys, hashlib, urllib.request
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip("/") + "/"; OUT = sys.argv[2]
VPS = {"desktop1440": dict(viewport={"width": 1440, "height": 900}), "touch390": dict(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)}
res = []
def rec(vp, name, ok, d=""): res.append(dict(viewport=vp, test=name, ok=bool(ok), detail=str(d)[:300]))
async def main():
    async with async_playwright() as p:
        chrome_bin = shutil.which("google-chrome") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        b = await p.chromium.launch(executable_path=chrome_bin, args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        man = json.load(urllib.request.urlopen(BASE + "downloads/modules/manifest.json"))
        for vp, o in VPS.items():
            touch = vp.startswith("touch")
            async def tap(pg, sel):
                l = pg.locator(sel).first
                await (l.tap() if touch else l.click())
            # A. fresh visit: popup vs bot
            ctx = await b.new_context(accept_downloads=True, **o); pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            await pg.goto(BASE); await pg.wait_for_timeout(1800)
            rec(vp, "fresh: how-to popup opens", await pg.locator("#howto").is_visible())
            box = await pg.locator("#lab-bot").bounding_box()
            top = await pg.evaluate("(b)=>{const e=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return !!(e&&e.closest('#lab-bot'))}", box)
            rec(vp, "fresh: bot visible and topmost above popup", box and box["width"] > 40 and top, box)
            await pg.screenshot(path=f"{OUT}/{vp}_pr13_fresh_popup_bot.png")
            await tap(pg, "#lab-bot"); await pg.wait_for_timeout(500)
            rec(vp, "fresh: first bot tap dismisses popup", not await pg.locator("#howto").is_visible())
            await tap(pg, "#lab-bot"); await pg.wait_for_timeout(600)
            rec(vp, "fresh: second tap opens bot panel", await pg.locator("#bot-panel").is_visible())
            rec(vp, "exactly one bot", await pg.locator("#lab-bot").count() == 1 and await pg.locator("#bot-panel").count() == 1)
            labels = await pg.eval_on_selector_all(".bp-qa", "e=>e.map(x=>x.textContent.trim())")
            rec(vp, "bot quick actions (>=9)", len(labels) >= 9, labels)
            rec(vp, "bot has hint ladder/teach block", await pg.locator(".bp-teach").count() == 1)
            rec(vp, "bot customise controls", await pg.locator(".py-custom").count() == 1)
            await pg.screenshot(path=f"{OUT}/{vp}_pr13_bot_panel.png")
            await tap(pg, "#bp-close"); await pg.wait_for_timeout(300)
            await pg.reload(); await pg.wait_for_timeout(1800)
            rec(vp, "return: popup not shown again", not await pg.locator("#howto").is_visible())
            rec(vp, "return: welcome banner shows", await pg.locator("#welcome").is_visible())
            # tour from welcome
            if await pg.locator("#welcome [data-tour]").count():
                await tap(pg, "#welcome [data-tour]"); await pg.wait_for_timeout(500)
                rec(vp, "tour starts from welcome", await pg.locator("#tour").count() == 1)
                for i in range(12):
                    if not await pg.locator("#tour").count(): break
                    await tap(pg, ".tour-card [data-next]"); await pg.wait_for_timeout(300)
                rec(vp, "tour completes and closes", await pg.locator("#tour").count() == 0)
            rec(vp, "fresh flow: no console errors", not errs, errs[:3])
            await ctx.close()
            # B. worlds
            ctx = await b.new_context(accept_downloads=True, **o)
            await ctx.add_init_script('localStorage.setItem("pythonlab.howto.v2",JSON.stringify({seen:true}));localStorage.setItem("pythonlab.tour.v1","1")')
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            await pg.goto(BASE + "#/worlds"); await pg.wait_for_timeout(2500)
            cards = await pg.locator(".lvl-card").count()
            rec(vp, "worlds: 11 level cards", cards == 11, cards)
            await pg.screenshot(path=f"{OUT}/{vp}_pr13_worlds.png")
            for n in range(11):
                await pg.goto(BASE + f"#/worlds/{n}"); await pg.wait_for_timeout(3500)
                st = await pg.evaluate("()=>{const h=document.querySelector('[data-studio]');return h?{tier:h.dataset.tier,scene:h.dataset.scene,badge:h.querySelector('.sb-text')?.textContent,canvas:!h.querySelector('canvas').hidden,w:h.getBoundingClientRect().width}:null}")
                rec(vp, f"world {n}: studio mounted ({st and st['scene']}, tier {st and st['tier']}, canvas {st and st['canvas']})", st and st["w"] > 100 and st["tier"], st)
                if n in (0, 3, 7): await pg.screenshot(path=f"{OUT}/{vp}_pr13_world_{n}.png")
            # quality control
            await pg.goto(BASE + "#/worlds/1"); await pg.wait_for_timeout(2500)
            for q in ["off", "flat", "light", "full", "auto"]:
                if not await pg.evaluate("document.querySelector('.display-menu').open"):
                    await tap(pg, ".display-menu summary"); await pg.wait_for_timeout(300)
                loc = pg.locator(f"[data-quality={q}]").first
                try:
                    await loc.scroll_into_view_if_needed(); await (loc.tap() if touch else loc.click()); await pg.wait_for_timeout(1200)
                    t = await pg.evaluate("document.querySelector('[data-studio]')?.dataset.tier")
                    rec(vp, f"quality choice {q} -> tier {t}", t is not None and (q in ("auto",) or t == q or q == "full" and t in ("light", "full")), t)
                except Exception as e:
                    rec(vp, f"quality choice {q}", False, e)
            await pg.screenshot(path=f"{OUT}/{vp}_pr13_quality.png")
            # reduced motion
            ctx2 = await b.new_context(reduced_motion="reduce", **o); await ctx2.add_init_script('localStorage.setItem("pythonlab.howto.v2",JSON.stringify({seen:true}));localStorage.setItem("pythonlab.tour.v1","1")')
            p2 = await ctx2.new_page(); await p2.goto(BASE + "#/worlds/0"); await p2.wait_for_timeout(2000)
            rec(vp, "reduced motion -> still picture (off tier)", await p2.evaluate("document.querySelector('[data-studio]')?.dataset.tier") == "off"); await ctx2.close()
            # C. downloads: one catalogue
            await pg.goto(BASE + "#/downloads"); await pg.wait_for_timeout(1500)
            nmod = len(man["modules"])
            rec(vp, f"downloads: level cards ({nmod}) on the one page", await pg.locator(".dc-card").count() == nmod, await pg.locator(".dc-card").count())
            rec(vp, "downloads: legacy cards present", await pg.locator(".download-card[data-download]").count() >= 4, await pg.locator(".download-card[data-download]").count())
            await pg.goto(BASE + "#/download-center"); await pg.wait_for_timeout(1200)
            rec(vp, "old #/download-center still resolves to same catalogue", await pg.locator(".dc-card").count() == nmod)
            await pg.screenshot(path=f"{OUT}/{vp}_pr13_downloads.png", full_page=False)
            bad = []
            for m in man["modules"]:
                for f in m["files"]:
                    data = urllib.request.urlopen(BASE + "downloads/modules/" + f["name"]).read()
                    if hashlib.sha256(data).hexdigest() != f["sha256"]: bad.append(f["name"])
            rec(vp, f"all level files fetch and match SHA-256 ({sum(len(m['files']) for m in man['modules'])} files)", not bad, bad)
            # real browser downloads for each format of level 0, via click
            await pg.goto(BASE + "#/downloads/level-00_first-program"); await pg.wait_for_timeout(1200)
            for fmt in ["pdf", "docx", "pptx", "html", "png"]:
                try:
                    async with pg.expect_download(timeout=8000) as d:
                        loc = pg.locator(f".dc-file[data-format={fmt}] a").first
                        await (loc.tap() if touch else loc.click())
                    dl = await d.value; path = await dl.path()
                    rec(vp, f"click-download {fmt}: {dl.suggested_filename}", path and __import__("os").path.getsize(path) > 500)
                    if touch and fmt == "pdf":
                        hit = await pg.evaluate("""() => {
                          const a = document.querySelector('.dc-file[data-format="pdf"] a');
                          const bot = document.querySelector('#lab-bot').getBoundingClientRect();
                          const mid = bot.top + bot.height / 2;
                          const before = a.getBoundingClientRect();
                          window.scrollBy(0, (before.top + before.height / 2) - mid);
                          const r = a.getBoundingClientRect();
                          const y = Math.min(Math.max(r.top + 6, mid), r.bottom - 6);
                          const xs = [r.left + 8, r.left + r.width / 2, r.right - 8];
                          const hits = xs.map((x) => {
                            const e = document.elementFromPoint(x, y);
                            return { ok: !!(e && e.closest('a') === a), who: e ? (e.id || e.className || e.tagName) : null };
                          });
                          a.scrollIntoView({ block: 'end', inline: 'nearest' });
                          const end = a.getBoundingClientRect();
                          const ey = end.top + end.height / 2;
                          const ee = document.elementFromPoint(end.left + end.width / 2, ey);
                          return { hits, endOk: !!(ee && ee.closest('a') === a), endWho: ee ? (ee.id || ee.className || ee.tagName) : null };
                        }""")
                        rec(vp, "touch: download link left/center/right miss the bot", all(h["ok"] for h in hit["hits"]), hit["hits"])
                        rec(vp, "touch: scroll-end still hits the download link", hit["endOk"], hit["endWho"])
                except Exception as e:
                    rec(vp, f"click-download {fmt}", False, e)
            for sel, nm in [("#dc-q", "filter")]:
                await pg.fill("#dc-q", "functions"); await pg.wait_for_timeout(300)
                rec(vp, "downloads filter 'functions' -> 1 level", await pg.locator(".dc-card:not([hidden])").count() == 1)
            # D. hint ladder in bot on a lesson
            await pg.goto(BASE + "#/section/start"); await pg.wait_for_timeout(800)
            href = "#/lesson/start/map"
            if href:
                await pg.goto(BASE + href); await pg.wait_for_timeout(1000)
                await tap(pg, "#lab-bot"); await pg.wait_for_timeout(600)
                if await pg.locator("#bp-rung").count():
                    for i in range(4):
                        if await pg.locator("#bp-rung").count(): await tap(pg, "#bp-rung"); await pg.wait_for_timeout(300)
                    rec(vp, "hint ladder: 4 rungs revealed", await pg.locator(".bp-rung").count() == 4, await pg.locator(".bp-rung").count())
                    await pg.screenshot(path=f"{OUT}/{vp}_pr13_hint_ladder.png")
                else: rec(vp, "hint ladder button on " + href, False, "lesson has no exercise?")
            # E. diagrams iframes
            for d in ["level-map", "lab-architecture"]:
                await pg.goto(BASE + f"#/diagram/{d}"); await pg.wait_for_timeout(1800)
                fr = pg.frames
                rec(vp, f"archify diagram {d} renders", await pg.locator("iframe").count() >= 1 and any("diagrams/" in f.url for f in fr), [f.url[-30:] for f in fr])
            rec(vp, "worlds/downloads/bot: no console errors", not errs, errs[:3])
            await ctx.close()
        await b.close()
    json.dump(res, open(f"{OUT}/pr13_results.json", "w"), indent=1)
    for r in res: print(("PASS " if r["ok"] else "FAIL ") + r["viewport"] + " " + r["test"] + ("" if r["ok"] else " :: " + r["detail"]))
    print(sum(r["ok"] for r in res), "/", len(res))
asyncio.run(main())
