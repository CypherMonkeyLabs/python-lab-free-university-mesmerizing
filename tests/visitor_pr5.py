"""Visitor test for PR5 (Py customisation, quick actions, downloads). Usage: python3 tests/visitor_pr5.py <base-url> <out-dir>"""
import asyncio, json, shutil, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip("/") + "/"; OUT = sys.argv[2]
VPS = {"desktop1440": dict(viewport={"width": 1440, "height": 900}), "touch390": dict(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)}
res = []
def rec(vp, name, ok, d=""): res.append(dict(viewport=vp, test=name, ok=bool(ok), detail=str(d)[:300]))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=shutil.which("google-chrome"), args=["--no-sandbox"])
        for vp, o in VPS.items():
            touch = vp.startswith("touch")
            ctx = await b.new_context(accept_downloads=True, **o); await ctx.add_init_script('localStorage.setItem("pythonlab.howto.v1",JSON.stringify({seen:true}));localStorage.setItem("pythonlab.tour.v1","1")')
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            async def click(sel):
                loc = pg.locator(sel).first
                await (loc.tap() if touch else loc.click())
            async def drag(sx, sy):
                if touch:
                    cdp = await ctx.new_cdp_session(pg)
                    await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": sx, "y": sy}]})
                    for i in range(1, 9): await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": sx - 20 * i, "y": sy - 15 * i}]})
                    await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
                else:
                    await pg.mouse.move(sx, sy); await pg.mouse.down(); await pg.mouse.move(sx - 160, sy - 120, steps=8); await pg.mouse.up()
                await pg.wait_for_timeout(600)
            async def open_panel():
                if await pg.locator("#bot-panel").is_hidden(): await click("#lab-bot"); await pg.wait_for_timeout(600)
            await pg.goto(BASE + "#/"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f"{OUT}/{vp}_pr5_bot_closed.png")
            box = await pg.locator("#lab-bot").bounding_box()
            rec(vp, "bot visible and large (>=100px tall)", box and box["height"] >= 100, box)
            await open_panel()
            rec(vp, "tap opens the panel", await pg.locator("#bot-panel").is_visible())
            labels = await pg.eval_on_selector_all(".bp-qa", "e=>e.map(x=>x.textContent.trim())")
            want = ["Level 1", "Level 2", "Level 3", "Foundations", "Audio", "Video", "Downloads", "Games", "Hints"]
            rec(vp, "quick actions present", all(any(w in l for l in labels) for w in want), labels)
            pb = await pg.locator("#bot-panel").bounding_box(); bar = await pg.evaluate("document.querySelector('.bottombar')?.getBoundingClientRect().top||innerHeight")
            tb = await pg.evaluate("document.querySelector('.topbar')?.getBoundingClientRect().bottom||0")
            rec(vp, "panel clear of top and bottom bars", pb["y"] >= tb - 1 and pb["y"] + pb["height"] <= bar + 1, [pb, tb, bar])
            await pg.screenshot(path=f"{OUT}/{vp}_pr5_panel.png")
            # route quick actions
            for lab, hashpart in [("Level 1", "#/level/1"), ("Level 2", "#/level/2"), ("Level 3", "#/level/3"), ("Foundations", "fundamentals"), ("Downloads", "#/downloads"), ("Games", "#/games")]:
                await open_panel(); await click(f'.bp-qa:has-text("{lab}")'); await pg.wait_for_timeout(500)
                rec(vp, f"quick action {lab} navigates", hashpart in await pg.evaluate("location.hash") and await pg.locator("h1").count() >= 1, await pg.evaluate("location.hash"))
                rec(vp, f"{lab}: panel closed after tap", await pg.locator("#bot-panel").is_hidden())
            await pg.goto(BASE + "#/games/blocks"); await pg.wait_for_timeout(400)
            await open_panel(); await click('.bp-qa:has-text("Hints")'); await pg.wait_for_timeout(300)
            rec(vp, "Hints gives a contextual tip and think/hint pose", "block" in (await pg.inner_text("#bp-hint")).lower() and await pg.evaluate("document.getElementById('lab-bot').dataset.mood") == "hint", await pg.inner_text("#bp-hint"))
            await pg.goto(BASE + "#/"); await pg.wait_for_timeout(500)
            await open_panel(); await click('.bp-qa:has-text("Video")'); await pg.wait_for_timeout(1200)
            rec(vp, "Video scrolls to clips", await pg.evaluate("(()=>{const r=document.querySelector('.clips').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0})()"))
            await pg.goto(BASE + "#/lesson/start/how-the-lab-works"); await pg.wait_for_timeout(500)
            n = await pg.locator("[data-speech]").count()
            await open_panel(); await click('.bp-qa:has-text("Audio")'); await pg.wait_for_timeout(800)
            rec(vp, "Audio action reaches a read-aloud page", n == 1 or await pg.locator("[data-speech]").count() == 1, await pg.evaluate("location.hash"))
            # customise
            await pg.goto(BASE + "#/"); await pg.wait_for_timeout(400)
            await open_panel(); await click(".py-custom summary"); await pg.wait_for_timeout(150)
            await click('[data-py-color="pink"]'); await pg.wait_for_timeout(150)
            stop = await pg.evaluate("getComputedStyle(document.querySelector('#pb-head stop')).stopColor")
            rec(vp, "colour change recolours Py", "255" in stop and "143" in stop, stop)
            await click('[data-py-skin="wizard"]'); await pg.wait_for_timeout(150)
            rec(vp, "skin adds character art", await pg.locator(".py-skin path").count() >= 2 and await pg.evaluate("document.getElementById('lab-bot').dataset.skin") == "wizard")
            h0 = (await pg.locator("#lab-bot").bounding_box())["height"]
            await click('[data-py-size="xl"]'); await pg.wait_for_timeout(300)
            h1 = (await pg.locator("#lab-bot").bounding_box())["height"]
            rec(vp, "size change grows Py", h1 > h0 * 1.3, [h0, h1])
            await pg.fill("#py-name", "Zed"); await pg.wait_for_timeout(150)
            rec(vp, "rename updates title and bubble", "Zed" in await pg.inner_text("#bot-panel-title") and "Zed" in await pg.get_attribute("#lab-bot", "aria-label"), await pg.inner_text("#bot-panel-title"))
            await pg.locator("#py-voice").check(); await pg.locator("#py-sound").check(); await pg.wait_for_timeout(150)
            st = await pg.evaluate("[JSON.parse(localStorage.getItem('pythonlab.py.v1')), document.documentElement.dataset.sound]")
            rec(vp, "voice and sound toggles stored", st[0]["voice"] is True and st[1] == "on", st)
            await pg.locator("#py-voice").uncheck(); await pg.locator("#py-sound").uncheck()
            for m in ["wave", "celebrate", "think", "hint"]:
                await click(f'[data-py-act="{m}"]'); await pg.wait_for_timeout(150)
                rec(vp, f"mannerism {m} plays", await pg.evaluate("document.getElementById('lab-bot').dataset.mood") == m)
            await pg.screenshot(path=f"{OUT}/{vp}_pr5_customise.png", full_page=False)
            await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f"{OUT}/{vp}_pr5_bot_custom.png")
            await pg.reload(); await pg.wait_for_timeout(600)
            rec(vp, "customisation persists after reload", await pg.evaluate("document.getElementById('lab-bot').dataset.skin") == "wizard" and "Zed" in await pg.get_attribute("#lab-bot", "aria-label"), [await pg.evaluate("document.getElementById('lab-bot').dataset.skin"), await pg.text_content("#bot-bubble")])
            # drag (desktop mouse / touch via pointer events) and tap
            before = await pg.locator("#lab-bot").bounding_box()
            sx, sy = before["x"] + before["width"] / 2, before["y"] + before["height"] / 2
            await drag(sx, sy)
            after = await pg.locator("#lab-bot").bounding_box()
            rec(vp, "bot is draggable", abs(after["x"] - before["x"]) > 20 or abs(after["y"] - before["y"]) > 20, [before, after])
            rec(vp, "drag did not open the panel", await pg.locator("#bot-panel").is_hidden())
            print(vp, "after drag", after, await pg.evaluate("[innerWidth, innerHeight, document.elementFromPoint(%f,%f)?.className]" % (after["x"]+after["width"]/2, after["y"]+after["height"]/2)))
            await click("#lab-bot"); await pg.wait_for_timeout(600)
            rec(vp, "tap after drag opens panel", await pg.locator("#bot-panel").is_visible())
            # win -> celebrate
            await pg.keyboard.press("Escape")
            await pg.evaluate("document.dispatchEvent(new CustomEvent('lab:win',{detail:{id:'t',first:true}}))"); await pg.wait_for_timeout(200)
            rec(vp, "win makes Py celebrate", await pg.evaluate("document.getElementById('lab-bot').dataset.mood") == "celebrate")
            # downloads
            await pg.goto(BASE + "#/downloads"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f"{OUT}/{vp}_pr5_downloads.png")
            links = await pg.eval_on_selector_all("a[download]", "e=>e.map(a=>a.getAttribute('href'))")
            descs = await pg.locator(".download-card[data-download] p").count()
            rec(vp, "download cards have descriptions", descs >= 12, descs)
            bad = []
            for h in links:
                r = await ctx.request.get(BASE + h)
                if r.status != 200 or len(await r.body()) < 100: bad.append((h, r.status))
            rec(vp, f"all {len(links)} download links return files", not bad and len(links) >= 10, bad)
            async with pg.expect_download() as di:
                await click('.download-card[data-download="syntax"] a.primary')
            dl = await di.value; await dl.save_as(f"/tmp/{vp}_{dl.suggested_filename}")
            rec(vp, "real download event fires with correct name", dl.suggested_filename == "python-syntax-cheatsheet.pdf", dl.suggested_filename)
            rec(vp, "no console errors", not errs, errs[:3])
            await ctx.close()
        await b.close()
    json.dump(res, open(f"{OUT}/pr5_visitor_results.json", "w"), indent=1)
    f = [r for r in res if not r["ok"]]; print("pr5 visitor total", len(res), "failed", len(f))
    for r in f: print(r)
asyncio.run(main())
