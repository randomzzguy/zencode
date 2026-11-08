import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('dist')
Path('.preview').mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  context=await browser.new_context()
  await context.route('https://web3forms.com/client/script.js',lambda r:r.fulfill(status=200,body=''))
  await context.route('https://api.web3forms.com/**',lambda r:r.abort())
  page=await context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  routes=['/'+str(f.relative_to(ROOT)).replace('\\','/').removesuffix('index.html') for f in ROOT.rglob('*.html')]
  for width in [1440,390,320]:
   await page.set_viewport_size({'width':width,'height':900})
   for route in routes:
    response=await page.goto('http://localhost:4173'+route,wait_until='domcontentloaded')
    assert response.status==200,(route,response.status)
    await page.locator('h1').wait_for()
    await page.evaluate('document.fonts.ready')
    assert await page.locator('h1').count()==1,route
    overflow=await page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    assert not overflow,(width,route,'horizontal overflow')
    assert await page.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.complete ? i.naturalWidth>0 : true)'),route
   print('Routes passed:',width,len(routes),flush=True)
  await page.set_viewport_size({'width':1440,'height':1000})
  await page.goto('http://localhost:4173/')
  assert await page.locator('.work-slide').count()==4
  assert   await page.locator('.rail-prev').is_disabled()
  await page.locator('.rail-next').scroll_into_view_if_needed()
  await page.wait_for_timeout(400)
  await page.locator('.rail-next').click()
  await page.wait_for_function("document.querySelector('.rail-count').textContent==='02 / 04'")
  await page.wait_for_timeout(700)
  for index in range(3,5):
   await page.locator('.rail-next').click()
   await page.wait_for_function("document.querySelector('.rail-count').textContent==="+repr(f'{index:02d} / 04'))
   await page.wait_for_timeout(700)
  await page.wait_for_function("document.querySelector('.rail-next').disabled")
  await page.wait_for_timeout(700)
  await page.locator('.work-rail').focus()
  await page.keyboard.press('Home')
  await page.wait_for_function("document.querySelector('.rail-prev').disabled")
  await page.wait_for_timeout(700)
  await page.keyboard.press('End')
  await page.wait_for_function("document.querySelector('.rail-next').disabled")
  await page.goto('http://localhost:4173/work/')
  await page.get_by_role('button',name='Websites',exact=True).click()
  assert await page.locator('.project-card:visible').count()==3
  await page.locator('#project-search').fill('physio')
  assert await page.locator('.project-card:visible').count()==1 # search also covers descriptions
  await page.locator('#project-search').fill('healthcare')
  assert await page.locator('.project-card:visible').count()==1
  await page.reload()
  assert await page.locator('.project-card:visible').count()==1
  await page.locator('#project-search').fill('not-a-project')
  assert await page.locator('#empty-state').is_visible()
  await page.locator('#reset-filters').click()
  assert await page.locator('.project-card:visible').count()==13
  await page.locator('#project-search').fill('fleet')
  assert await page.locator('.project-card:visible').count()==2
  await page.locator('#project-search').fill('')
  await page.screenshot(path='.preview/work-desktop.png',full_page=True)
  await page.goto('http://localhost:4173/contact/?interest=ai')
  assert await page.locator('[data-interest=ai]').get_attribute('aria-pressed')=='true'
  await page.locator('[name=name]').fill('Test visitor')
  await page.locator('[name=email]').fill('test@example.com')
  await page.locator('[name=message]').fill('This is a local automated test that is never sent.')
  await page.locator('[type=submit]').click()
  assert 'verification' in await page.locator('#form-status').inner_text()
  await page.evaluate('''()=>{let input=document.createElement('input');input.type='hidden';input.name='h-captcha-response';input.value='local-test-only';document.querySelector('form').append(input)}''')
  await page.route('https://api.web3forms.com/submit',lambda r:r.fulfill(status=500,content_type='application/json',body='{"success":false}'))
  await page.locator('[type=submit]').click()
  await page.wait_for_function("document.querySelector('#form-status').dataset.state==='error'")
  assert await page.locator('[name=message]').input_value()!=''
  await page.unroute('https://api.web3forms.com/submit')
  await page.route('https://api.web3forms.com/submit',lambda r:r.fulfill(status=200,content_type='application/json',body='{"success":true}'))
  await page.locator('[type=submit]').click()
  await page.wait_for_function("document.querySelector('#form-status').dataset.state==='success'")
  assert await page.locator('[name=message]').input_value()==''
  assert not await page.locator('[type=submit]').is_disabled()
  assert await page.locator('.submit-button svg.icon-arrow').count()==1
  await page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
  await page.screenshot(path='.preview/contact-desktop.png',full_page=True)
  await page.goto('http://localhost:4173/capabilities/')
  await page.locator('summary').first.click()
  assert await page.locator('details').first.get_attribute('open') is not None
  await page.goto('http://localhost:4173/work/pcms/')
  await page.screenshot(path='.preview/case-desktop.png',full_page=True)
  await page.set_viewport_size({'width':390,'height':844})
  await page.goto('http://localhost:4173/contact/')
  await page.screenshot(path='.preview/contact-mobile.png',full_page=True)
  await page.locator('.menu-toggle').click()
  assert await page.locator('#main-nav').is_visible()
  await page.keyboard.press('Escape')
  assert not await page.locator('#main-nav').is_visible()
  await page.locator('.motion-toggle').click()
  await page.reload()
  assert 'motion-paused' in await page.locator('html').get_attribute('class')
  await page.emulate_media(reduced_motion='reduce')
  await page.wait_for_function("document.querySelector('.motion-toggle').disabled")
  await page.goto('http://localhost:4173/missing-route/')
  assert 'NOT THIS WAY.' in await page.locator('h1').inner_text()
  assert not errors, errors
  print('PASS: 60 responsive route checks; project rail/buttons/keyboard; filters/search/persistence; empty-state reset; interest prefill; form validation and mocked failure/success; mobile menu/Escape; reduced motion; FAQ; 404; no browser JS errors. No enquiries sent.',flush=True)
  await browser.close()
asyncio.run(main())
