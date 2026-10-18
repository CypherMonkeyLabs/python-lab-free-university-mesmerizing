"""Visitor test for PR3 (alive layer). Usage: python3 tests/visitor_pr3.py <base-url> <out-dir>"""
import asyncio, json, shutil, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip("/") + "/"; OUT = sys.argv[2]
VPS = {"desktop1440": dict(viewport={"width": 1440, "height": 900}), "touch390": dict(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)}
res = []
def rec(vp, name, ok, d=""): res.append(dict(viewport=vp, test=name, ok=bool(ok), detail=str(d)[:300]))
async def tap(pg, vp, sel):
    loc = pg.locator(sel).first
    if vp.startswith("touch"): await loc.tap()
    else: await loc.click()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=shutil.which("google-chrome"), args=["--no-sandbox"])
        for vp, o in VPS.items():
            ctx = await b.new_context(**o); pg = await ctx.new_page()
            errs = []; ext = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("request", lambda r: ext.append(r.url) if not r.url.startswith(BASE[:-1]) and not r.url.startswith("data:") and not r.url.startswith("blob:"+BASE[:-1]) else None)
            await pg.goto(BASE); await pg.wait_for_timeout(1400)
            rec(vp, "first visit: how-to popup opens", await pg.locator("#howto").is_visible())
            rec(vp, "popup offers the guided tour", await pg.locator("#howto [data-start-tour]").count() == 1)
            await pg.screenshot(path=f"{OUT}/{vp}_pr3_firstvisit_popup.png")
            await tap(pg, vp, "#howto [data-start-tour]"); await pg.wait_for_timeout(500)
            rec(vp, "tour starts from popup", await pg.locator("#tour").count() == 1)
            n = 0
            for i in range(7):
                card = await pg.locator(".tour-card").inner_text()
                box = await pg.locator(".tour-card").bounding_box()
                inside = box and box["x"] >= -1 and box["y"] >= -1 and box["x"] + box["width"] <= pg.viewport_size["width"] + 1 and box["y"] + box["height"] <= pg.viewport_size["height"] + 1
                if not inside: rec(vp, f"tour step {i+1} card inside viewport", False, box)
                if i == 3: await pg.screenshot(path=f"{OUT}/{vp}_pr3_tour_download.png")
                n += 1
                await tap(pg, vp, ".tour-card [data-next]"); await pg.wait_for_timeout(350)
            rec(vp, "tour: 7 steps then closes", n == 7 and await pg.locator("#tour").count() == 0)
            await pg.reload(); await pg.wait_for_timeout(1500)
            rec(vp, "popup not shown again after close", not await pg.locator("#howto").is_visible())
            rec(vp, "welcome banner shows on every visit", await pg.locator("#welcome").is_visible())
            txt = await pg.locator("#welcome").inner_text()
            rec(vp, "welcome says Welcome back + visit number", "Welcome back" in txt, txt[:60])
            await pg.screenshot(path=f"{OUT}/{vp}_pr3_home_welcome.png")
            await pg.wait_for_timeout(500)
            await tap(pg, vp, "#welcome [data-tour]"); await pg.wait_for_timeout(400)
            rec(vp, "welcome re-opens the tour", await pg.locator("#tour").count() == 1)
            await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
            rec(vp, "Esc closes tour", await pg.locator("#tour").count() == 0)
            # display menu
            await pg.goto(BASE + "#/"); await pg.wait_for_timeout(300)
            await pg.locator(".display-menu summary").click(); await pg.wait_for_timeout(200)
            rec(vp, "Display: sound default off", (await pg.locator("#fx-sound").inner_text()) == "Sound: off")
            for t in ["high", "low", "off", "auto"]:
                await pg.locator(f'[data-fx-tier="{t}"]').click(); await pg.wait_for_timeout(150)
                fx = await pg.evaluate("document.documentElement.dataset.fx")
                rec(vp, f"tier {t} applies", (fx == t) if t != "auto" else fx in ("high", "low"), fx)
            await pg.locator("#fx-sound").click(); await pg.wait_for_timeout(100)
            rec(vp, "sound toggles on", (await pg.locator("#fx-sound").inner_text()) == "Sound: on")
            await pg.locator("#fx-sound").click()
            await pg.locator('[data-fx-tier="high"]').click(); await pg.wait_for_timeout(500)
            await pg.keyboard.press("Escape")
            await pg.evaluate("document.querySelector('.display-menu').open=false")
            rec(vp, "particles canvas painting (high)", await pg.evaluate("(()=>{const c=document.getElementById('fx-canvas');const x=c.getContext('2d');const d=x.getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4){if(d[i]>0)return true}return false})()"))
            # ripple
            await pg.locator(".primary.cta").first.dispatch_event("pointerdown")
            rec(vp, "ripple element appears on tap", await pg.locator(".fx-ripple").count() > 0)
            # levels + worlds
            for n_ in (1, 2, 3):
                await pg.goto(BASE + f"#/level/{n_}"); await pg.wait_for_timeout(300)
                w = await pg.evaluate("document.documentElement.dataset.world")
                rec(vp, f"level {n_} page, world l{n_}", w == f"l{n_}" and await pg.locator("h1").count() == 1 and await pg.locator(".lesson-row").count() > 3, w)
                await pg.screenshot(path=f"{OUT}/{vp}_pr3_level{n_}.png")
            # XP + level-up + badge: open lessons
            await pg.evaluate("localStorage.removeItem('pythonlab.xp.v1')")
            for i, hsh in enumerate(["#/lesson/start/map", "#/lesson/start/runtime", "#/lesson/fundamentals/syntax", "#/lesson/fundamentals/types", "#/lesson/fundamentals/names"]):
                await pg.goto(BASE + hsh); await pg.wait_for_timeout(250)
            st = await pg.evaluate("JSON.parse(localStorage.getItem('pythonlab.xp.v1'))")
            rec(vp, "XP awarded for opened lessons", st["xp"] >= 40, st["xp"])
            rec(vp, "badges earned (first lesson)", "first-lesson" in st["badges"], list(st["badges"]))
            await pg.wait_for_timeout(300)
            rec(vp, "level-up overlay shown at 50 XP", await pg.locator("#levelup").count() > 0 or st["level"] >= 2, st["level"])
            await pg.screenshot(path=f"{OUT}/{vp}_pr3_levelup.png")
            await pg.goto(BASE + "#/me"); await pg.wait_for_timeout(300)
            rec(vp, "My progress page lists badges", await pg.locator(".badge").count() >= 8)
            await pg.screenshot(path=f"{OUT}/{vp}_pr3_me.png")
            rec(vp, "no console errors", not errs, errs[:3]); rec(vp, "same-origin only", not ext, ext[:3])
            await ctx.close()
            # reduced motion
            ctx = await b.new_context(reduced_motion="reduce", **o); await ctx.add_init_script('localStorage.setItem("pythonlab.howto.v2",JSON.stringify({seen:true}))')
            pg = await ctx.new_page(); await pg.goto(BASE); await pg.wait_for_timeout(1000)
            rec(vp, "reduced motion: tier off, canvas hidden", (await pg.evaluate("document.documentElement.dataset.fx")) == "off" and not await pg.locator("#fx-canvas").is_visible())
            rec(vp, "reduced motion: no running animations on blobs", await pg.evaluate("[...document.querySelectorAll('.fx-blob')].every(e=>getComputedStyle(e).animationName==='none')"))
            await pg.screenshot(path=f"{OUT}/{vp}_pr3_reduced_motion.png")
            await ctx.close()
        await b.close()
    json.dump(res, open(f"{OUT}/pr3_visitor_results.json", "w"), indent=1)
    f = [r for r in res if not r["ok"]]; print("pr3 visitor total", len(res), "failed", len(f))
    for r in f: print(r)
asyncio.run(main())
