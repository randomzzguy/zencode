import asyncio,json
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch()
  page=await b.new_page(viewport={'width':1440,'height':1000})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://localhost:4173/',wait_until='networkidle')
  await page.wait_for_function("document.documentElement.classList.contains('motion-active')")
  await page.wait_for_timeout(1200)
  h=page.locator('.selected-work .section-head')
  await h.scroll_into_view_if_needed()
  await page.wait_for_timeout(90)
  print('Reveal mid-animation:',await h.evaluate('(e)=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,animations:e.getAnimations().length})'))
  await page.wait_for_timeout(1200)
  assert await h.evaluate('(e)=>getComputedStyle(e).opacity')=='1'
  await page.locator('.range-project').first.scroll_into_view_if_needed()
  await page.wait_for_timeout(1100)
  target=page.locator('.range-project').first.locator('.project-visual')
  before=await target.bounding_box()
  await page.locator('.range-project').first.hover()
  await page.wait_for_timeout(500)
  after=await target.bounding_box()
  assert after['y']<before['y']-2,(before,after)
  print('Hover lift:',round(before['y']-after['y'],2))
  details=page.locator('.service-accordion details').nth(1)
  await details.locator('summary').click()
  await page.wait_for_timeout(100)
  assert await details.evaluate('(e)=>e.style.height.endsWith("px")')
  await page.wait_for_timeout(600)
  assert await details.get_attribute('open') is not None
  await details.locator('summary').click()
  await page.wait_for_timeout(600)
  assert await details.get_attribute('open') is None
  await details.locator('summary').click()
  await page.wait_for_timeout(70)
  await details.locator('summary').dispatch_event('click')
  await page.wait_for_timeout(600)
  assert await details.get_attribute('open') is None
  await page.locator('.motion-toggle').click()
  await page.wait_for_function("!document.documentElement.classList.contains('motion-active')")
  assert await page.locator('.hero h1').evaluate('(e)=>getComputedStyle(e).transform')=='none'
  assert await page.locator('.resthouse-visual img').first.evaluate('(e)=>e.getAnimations().length')==0
  assert await h.evaluate('(e)=>getComputedStyle(e).opacity')=='1'
  await page.reload()
  assert not await page.locator('html').evaluate('(e)=>e.classList.contains("motion-active")')
  await page.locator('.motion-toggle').click()
  await page.wait_for_function("document.documentElement.classList.contains('motion-active')")
  await page.emulate_media(reduced_motion='reduce')
  await page.wait_for_function("!document.documentElement.classList.contains('motion-active')")
  await page.goto('http://localhost:4173/work/')
  await page.wait_for_timeout(200)
  assert await page.locator('.project-card').evaluate_all('(els)=>els.every(e=>getComputedStyle(e).opacity==="1")')
  assert not errors,errors
  print('PASS: scroll reveal, settled content, spring hover, accordion open/close/reversal, pause persistence, resume and OS reduced-motion cleanup; no JS errors.')
  await b.close()
asyncio.run(main())
