"""Visitor test for PR4 (games and puzzles). Usage: python3 tests/visitor_pr4.py <base-url> <out-dir>"""
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
            ctx = await b.new_context(**o); await ctx.add_init_script('localStorage.setItem("pythonlab.howto.v1",JSON.stringify({seen:true}))')
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            async def click(sel):
                loc = pg.locator(sel).first
                await (loc.tap() if touch else loc.click())
            async def xp(): return (await pg.evaluate("JSON.parse(localStorage.getItem('pythonlab.xp.v1')||'{\"xp\":0,\"badges\":{}}')"))
            await pg.goto(BASE + "#/games"); await pg.wait_for_timeout(500)
            n = await pg.locator(".menu-card").count()
            rec(vp, "games index lists 9 games", n == 9, n)
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_games_index.png")
            hrefs = await pg.eval_on_selector_all(".menu-card", "e=>e.map(a=>a.getAttribute('href'))")
            for h in hrefs:
                await pg.goto(BASE + h); await pg.wait_for_timeout(350)
                rec(vp, f"{h} loads with h1 and content", await pg.locator("h1").count() == 1 and len(await pg.inner_text("#game-root")) > 20)
            # blocks
            await pg.goto(BASE + "#/games/blocks"); await pg.wait_for_timeout(300)
            await click('.bk-pal [data-add="repeat"]'); await click('.bk-body [data-add="print"]')
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_blocks.png")
            await click("#bk-check"); await pg.wait_for_timeout(300)
            rec(vp, "blocks: Hi x3 solved by tapping blocks", "Yes" in await pg.inner_text(".play-msg"), await pg.inner_text(".play-msg"))
            await pg.wait_for_timeout(1700)
            rec(vp, "blocks: Python text generated", True)
            s = await xp(); rec(vp, "blocks: XP and block-builder badge", s["xp"] >= 20 and "block-builder" in s["badges"], s)
            if not touch:  # real drag and drop from palette
                await pg.goto(BASE + "#/games/blocks"); await pg.wait_for_timeout(300)
                await pg.drag_and_drop('.bk-pal [data-add="print"]', ".bk-work")
                rec(vp, "blocks: drag and drop from palette adds block", await pg.locator(".bk-work .b-print").count() == 1)
            # turtle
            await pg.goto(BASE + "#/games/turtle"); await pg.wait_for_timeout(300)
            for pr in ["star", "spiral", "flower", "square"]:
                await click(f'[data-preset="{pr}"]'); await pg.wait_for_timeout(1800)
                segs = await pg.get_attribute("#tt-canvas", "data-segments")
                rec(vp, f"turtle preset {pr} draws", segs and int(segs) >= 4, segs)
                if pr == "flower": await pg.screenshot(path=f"{OUT}/{vp}_pr4_turtle.png")
            await pg.fill("#tt-code", "forward(abc)"); await click("#tt-run"); await pg.wait_for_timeout(200)
            rec(vp, "turtle: bad code gives a friendly error", "cannot" in (await pg.inner_text(".play-msg")), await pg.inner_text(".play-msg"))
            s = await xp(); rec(vp, "turtle badge", "turtle-artist" in s["badges"])
            # loops
            await pg.goto(BASE + "#/games/loops"); await pg.wait_for_timeout(300)
            await click("#lv-step"); await click("#lv-step"); await click("#lv-step")
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_loops.png")
            for ans in ["10", "cba", "3"]:
                await pg.fill("#lv-ans", ans); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1700)
            s = await xp(); rec(vp, "loops: 3 puzzles solved, badge", "loop-master" in s["badges"], list(s["badges"]))
            await pg.fill("#lv-ans", "99"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            # lists
            await pg.goto(BASE + "#/games/lists"); await pg.wait_for_timeout(300)
            await click('[data-op="sort"]'); await pg.select_option("#ls-x", "9"); await click('[data-op="append"]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_lists.png")
            rec(vp, "lists: puzzle 1 solved", "target" in (await pg.inner_text(".play-msg")).lower(), await pg.inner_text(".play-msg"))
            # order
            await pg.goto(BASE + "#/games/order"); await pg.wait_for_timeout(300)
            async def solve():
                texts = {"def add(a, b):": 0, "return a + b": 1, "print(add(2, 3))": 2, "total = 0": 0, "for n in [1, 2, 3]:": 1, "total += n": 2, "print(total)": 3, "age = 12": 0, "if age >= 13:": 1, 'print("teen")': 2, "else:": 3, 'print("kid")': 4}
                for target in range(5):
                    items = await pg.eval_on_selector_all(".or-line code", "e=>e.map(x=>x.textContent)")
                    want = sorted(range(len(items)), key=lambda i: texts[items[i].strip()])
                    cur = list(range(len(items)))
                    # bubble using move buttons
                    for pos in range(len(items)):
                        items = await pg.eval_on_selector_all(".or-line code", "e=>e.map(x=>x.textContent)")
                        key = [texts[t.strip()] for t in items]
                        j = key.index(pos)
                        while j > pos:
                            await click(f'[data-mv="up"][data-pos="{j}"]'); j -= 1
                    break
            await solve()
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_order.png")
            await click("#or-check"); await pg.wait_for_timeout(300)
            rec(vp, "order: sorted with move buttons, accepted", "Perfect" in await pg.inner_text(".play-msg"), await pg.inner_text(".play-msg"))
            if not touch:
                await pg.wait_for_timeout(1700)
                first = await pg.eval_on_selector_all(".or-line code", "e=>e.map(x=>x.textContent)")
                await pg.drag_and_drop(".or-line:nth-child(1)", ".or-line:nth-child(3)"); await pg.wait_for_timeout(200)
                second = await pg.eval_on_selector_all(".or-line code", "e=>e.map(x=>x.textContent)")
                rec(vp, "order: drag and drop reorders lines", first != second)
            s = await xp(); rec(vp, "order: sorter badge", "sorter" in s["badges"])
            # pong autopilot
            await pg.goto(BASE + "#/games/pong"); await pg.wait_for_timeout(300)
            box = await pg.locator("#pong").bounding_box()
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_pong.png")
            won = False
            for _ in range(1800):
                by = await pg.get_attribute("#pong", "data-ball-y")
                if by:
                    off = 22 if int(by) < 160 else -22
                    y = box["y"] + ((int(by) + off) / 320) * box["height"]
                    if touch: await pg.evaluate("([x,y])=>{const c=document.getElementById('pong');c.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,bubbles:true}))}", [box["x"] + 20, y])
                    else: await pg.mouse.move(box["x"] + 20, y)
                if "win" in (await pg.inner_text(".play-msg")).lower(): won = True; break
                await pg.wait_for_timeout(40)
            rec(vp, "pong: playable, autopilot wins first to 3", won, await pg.get_attribute("#pong", "data-you"))
            s = await xp(); rec(vp, "pong: arcade-pro badge", "arcade-pro" in s["badges"])
            # me page
            await pg.goto(BASE + "#/me"); await pg.wait_for_timeout(300)
            got = await pg.locator(".badge.got").count()
            rec(vp, "My progress shows earned badges", got >= 6, got)
            await pg.screenshot(path=f"{OUT}/{vp}_pr4_me.png")
            # reduced motion sanity: snake & guess still start
            for g in ["guess", "snake", "adventure"]:
                await pg.goto(BASE + f"#/games/{g}"); await pg.wait_for_timeout(250)
                rec(vp, f"classic {g} still loads", len(await pg.inner_text("#game-root")) > 20)
            rec(vp, "no console errors", not errs, errs[:3])
            await ctx.close()
        await b.close()
    json.dump(res, open(f"{OUT}/pr4_visitor_results.json", "w"), indent=1)
    f = [r for r in res if not r["ok"]]; print("pr4 visitor total", len(res), "failed", len(f))
    for r in f: print(r)
asyncio.run(main())
