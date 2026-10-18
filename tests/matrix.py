import asyncio, json, sys, shutil, re
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip("/") + "/"
OUT = sys.argv[2]
THEMES = ["ink", "paper", "terminal", "contrast"]
VPS = {"desktop1440": dict(viewport={"width":1440,"height":900}), "touch390": dict(viewport={"width":390,"height":844}, has_touch=True, is_mobile=True)}
DECKS=["first-hour","data-structures","functions-classes","modules-packages","async-flow","python-314","numpy-pandas","browser-python","lifetime-learning"]
GUIDES=["control-flow","iterators-generators","async-in-practice","functions-and-calls","classes-and-methods","import-system","packaging-and-environments","data-with-pandas","python-in-the-browser","study-plan","whats-new-314"]
DIAG=["how-python-runs","function-call","import-system","event-loop","task-lifecycle","pandas-pipeline","pyodide-architecture","study-loop"]
ROUTES=["#/","#/practice","#/games","#/games/guess","#/games/snake","#/games/adventure","#/quizzes","#/quiz/fundamentals","#/ecosystem/glossary","#/ecosystem/map","#/ecosystem/sisters","#/ecosystem/integrations","#/ecosystem/hooks","#/downloads","#/sources","#/about","#/rooms/lobby","#/rooms/syntax","#/diagrams","#/slides","#/guides"]+[f"#/section/{s}" for s in "start fundamentals flows methods modules labs games integrations lifetime resources".split()]+[f"#/slides/{d}" for d in DECKS]+[f"#/guide/{g}" for g in GUIDES]+[f"#/diagram/{d}" for d in DIAG]+["#/worlds"]+[f"#/worlds/{n}" for n in range(11)]+["#/diagram/level-map","#/diagram/lab-architecture","#/download-center"]
SEEN='localStorage.setItem("pythonlab.howto.v2",JSON.stringify({seen:true}))'
results=[]
def rec(vp,theme,name,ok,detail=""):
    results.append(dict(viewport=vp,theme=theme,test=name,ok=bool(ok),detail=detail))
async def openmenu(pg):
    sel="#menu-toggle"
    if await pg.get_attribute(sel,"aria-expanded")!="true":
        await pg.locator(sel).click(); await pg.wait_for_timeout(250)
async def main():
    chrome=shutil.which("google-chrome") or shutil.which("chromium")
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=chrome,args=["--no-sandbox"])
        for vp,opts in VPS.items():
            for theme in THEMES:
                ctx=await b.new_context(**opts)
                await ctx.add_init_script(SEEN)
                await ctx.add_init_script(f'localStorage.setItem("pythonlab.theme","{theme}")')
                pg=await ctx.new_page()
                errs=[];bad=[]
                pg.on("pageerror",lambda e:errs.append(str(e)))
                pg.on("console",lambda m:errs.append(m.text) if m.type=="error" else None)
                pg.on("response",lambda r:bad.append(f"{r.status} {r.url}") if r.status>=400 else None)
                for r in ROUTES:
                    errs.clear();bad.clear()
                    await pg.goto(BASE+r); await pg.wait_for_timeout(350)
                    m=await pg.evaluate("""()=>{const d=document.documentElement;const q=s=>document.querySelector(s);
                      const R=e=>e?e.getBoundingClientRect():null;const ov=(a,b)=>a&&b&&a.width&&b.width&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
                      const bot=R(q('#lab-bot'));
                      return {theme:d.dataset.theme,overflow:d.scrollWidth-d.clientWidth,scrollY:window.scrollY,h1:!!q('h1'),
                        botTop:ov(bot,R(q('.topbar'))),botBottom:ov(bot,R(q('#bottombar'))),botMenu:(getComputedStyle(q('.sidemenu')||document.body).display!=='none')&&ov(bot,R(q('.sidemenu'))),
                        loading:[...document.querySelectorAll('main *:not(.slide *):not(.deck-print *)')].some(e=>!e.children.length&&/^\\s*loading\\b/i.test(e.textContent||''))}}""")
                    ok=(m["theme"]==theme and m["overflow"]<=1 and m["h1"] and not m["botTop"] and not m["botBottom"] and not m["botMenu"] and m["scrollY"]<5 and not m["loading"] and not errs and not bad)
                    rec(vp,theme,"route "+r,ok,json.dumps(dict(m=m,errs=errs[:2],bad=bad[:2])) if not ok else "")
                # menu items (desktop: sidebar; touch: drawer)
                await pg.goto(BASE+"#/"); await pg.wait_for_timeout(300)
                if vp.startswith("touch"):
                    await openmenu(pg)
                links=await pg.eval_on_selector_all(".sidemenu a[href]","els=>els.map(e=>e.getAttribute('href'))")
                rec(vp,theme,"menu has links",len(links)>=10,str(len(links)))
                for h in links:
                    if vp.startswith("touch"):
                        await pg.goto(BASE+"#/"); await pg.wait_for_timeout(150)
                        await openmenu(pg)
                    errs.clear()
                    await pg.locator(f".sidemenu a[href='{h}']").first.click(); await pg.wait_for_timeout(250)
                    rec(vp,theme,"menu click "+h,pg.url.endswith(h) and not errs, pg.url+str(errs[:1]))
                # topbar buttons: help, display(theme), search
                await pg.goto(BASE+"#/"); await pg.wait_for_timeout(300)
                await pg.locator("#help-btn").click(); await pg.wait_for_timeout(300)
                rec(vp,theme,"help opens",await pg.locator("#howto").is_visible())
                await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
                rec(vp,theme,"help closes (Esc)",not await pg.locator("#howto").is_visible())
                await pg.keyboard.press("?"); await pg.wait_for_timeout(250)
                rec(vp,theme,"? key opens help",await pg.locator("#howto").is_visible())
                await pg.keyboard.press("Escape")
                # search
                await pg.keyboard.press("/"); await pg.wait_for_timeout(200)
                foc=await pg.evaluate("document.activeElement && document.activeElement.type")
                if vp.startswith("desktop"):
                    rec(vp,theme,"/ focuses search",foc in("search","text"),str(foc))
                    await pg.keyboard.type("slides"); await pg.wait_for_timeout(300)
                    rec(vp,theme,"search shows results",await pg.locator(".sr-item").count()>0)
                    await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300)
                    rec(vp,theme,"search Enter navigates",("slides" in pg.url),pg.url)
                # bot tap + panel
                await pg.goto(BASE+"#/"); await pg.wait_for_timeout(300)
                if vp.startswith("touch"): await pg.touchscreen.tap(*(lambda b:(b["x"]+b["width"]/2,b["y"]+b["height"]/2))(await pg.locator("#lab-bot").bounding_box()))
                else: await pg.locator("#lab-bot").click()
                await pg.wait_for_timeout(300)
                vis=await pg.locator("#bot-panel").is_visible()
                rec(vp,theme,"bot tap opens panel",vis)
                pb=await pg.evaluate("(()=>{const a=document.querySelector('#bot-panel').getBoundingClientRect();const b=document.querySelector('#bottombar').getBoundingClientRect();const t=document.querySelector('.topbar').getBoundingClientRect();return Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1||Math.min(a.bottom,t.bottom)-Math.max(a.top,t.top)>1})()") if vis else False
                rec(vp,theme,"bot panel clear of bottom bar",not pb)
                await pg.keyboard.press("Escape")
                # footer + footer bar links
                await pg.goto(BASE+"#/"); await pg.wait_for_timeout(300)
                fl=await pg.eval_on_selector_all(".footer-bar a[href]","els=>els.map(e=>e.getAttribute('href'))")
                rec(vp,theme,"footer bar present",len(fl)>=6,str(fl))
                rec(vp,theme,"disclaimer present",await pg.locator(".disclaimer-panel").count()>0)
                rec(vp,theme,"footer border icons",await pg.locator(".brand-icons a").count()==3)
                # slide keyboard/touch
                await pg.goto(BASE+"#/slides/python-314"); await pg.wait_for_timeout(400)
                await pg.locator("#deck-next").click(); await pg.wait_for_timeout(200)
                rec(vp,theme,"slide next click",pg.url.endswith("/2"),pg.url)
                if vp.startswith("desktop"):
                    await pg.locator("#deck-stage").focus(); await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(200)
                    rec(vp,theme,"slide ArrowRight",pg.url.endswith("/3"),pg.url)
                await pg.screenshot(path=f"{OUT}/{vp}_{theme}_deck.png")
                await pg.goto(BASE+"#/"); await pg.wait_for_timeout(500)
                await pg.screenshot(path=f"{OUT}/{vp}_{theme}_home.png")
                await ctx.close()
        await b.close()
    fails=[r for r in results if not r["ok"]]
    json.dump(dict(base=BASE,total=len(results),passed=len(results)-len(fails),failed=len(fails),results=results),open(f"{OUT}/results.json","w"),indent=1)
    print("total",len(results),"failed",len(fails))
    for f in fails[:40]: print(f["viewport"],f["theme"],f["test"],f["detail"][:300])
asyncio.run(main())
