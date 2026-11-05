(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded','false'); };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  matchMedia('(min-width:851px)').addEventListener('change', closeMenu);

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButtons = [...document.querySelectorAll('.motion-toggle, .client-pause')];
  let manuallyPaused = false;
  try { manuallyPaused = localStorage.getItem('zencode-motion') === 'paused'; } catch {}
  let paused = motionQuery.matches || manuallyPaused;
  const updateMotion = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    const label = motionQuery.matches ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion';
    for (const button of motionButtons) {
      button.textContent = label;
      button.setAttribute('aria-pressed', String(paused));
      button.disabled = motionQuery.matches;
    }
  };
  for (const button of motionButtons) button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused; paused = manuallyPaused || motionQuery.matches; updateMotion();
    try { localStorage.setItem('zencode-motion', paused ? 'paused' : 'running'); } catch {}
  });
  motionQuery.addEventListener('change', () => { paused = motionQuery.matches || manuallyPaused; updateMotion(); });
  updateMotion();
  const rain = document.querySelector('#rain-container');
  for (let i=0; i<12; i++) {
    const stream = document.createElement('i');
    stream.className = 'data-stream';
    stream.style.cssText = `left:${(i*8.3+3)%100}%;height:${90+(i%4)*40}px;animation-delay:-${i*2.7}s;animation-duration:${17+(i%5)*4}s`;
    rain.append(stream);
  }
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('motion-paused', document.hidden || paused);
  });

  // Native scroll-snap keeps touch, trackpads and keyboard navigation familiar.
  const rail = document.querySelector('.work-rail');
  if (rail) {
    const slides = [...rail.querySelectorAll('.work-slide')];
    const prev = document.querySelector('.rail-prev');
    const next = document.querySelector('.rail-next');
    const count = document.querySelector('.rail-count');
    let current = 0;
    const position = i => slides[i].offsetLeft - slides[0].offsetLeft;
    const sync = () => {
      current = slides.reduce((best, slide, i) => Math.abs(position(i)-rail.scrollLeft) < Math.abs(position(best)-rail.scrollLeft) ? i : best, 0);
      if (rail.scrollLeft >= rail.scrollWidth-rail.clientWidth-3) current = slides.length-1;
      count.textContent = `${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      prev.disabled = current === 0;
      next.disabled = current === slides.length-1;
    };
    const go = i => rail.scrollTo({left:position(Math.max(0,Math.min(slides.length-1,i))),behavior:paused?'instant':'smooth'});
    prev.addEventListener('click',()=>go(current-1));
    next.addEventListener('click',()=>go(current+1));
    rail.addEventListener('scroll',sync,{passive:true});
    rail.addEventListener('keydown',event=>{
      if (event.target!==rail) return;
      const targets = {ArrowRight:current+1,ArrowLeft:current-1,Home:0,End:slides.length-1};
      if (event.key in targets) {event.preventDefault();go(targets[event.key]);}
    });
    new ResizeObserver(sync).observe(rail);
    sync();
  }
  const progress = document.querySelector('.reading-progress');
  let progressQueued = false;
  const updateProgress = () => {
    const height = document.documentElement.scrollHeight-innerHeight;
    progress.style.transform = `scaleX(${height>0?Math.min(1,Math.max(0,scrollY/height)):0})`;
    progressQueued = false;
  };
  addEventListener('scroll',()=>{if(!progressQueued){progressQueued=true;requestAnimationFrame(updateProgress);}}, {passive:true});
  addEventListener('resize',updateProgress);
  updateProgress();

  const projectGrid = document.querySelector('#project-grid');
  if (projectGrid) {
    const cards = [...projectGrid.querySelectorAll('.project-card')];
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const search = document.querySelector('#project-search');
    const count = document.querySelector('#results-count');
    let active = 'all';
    const readUrl = () => {
      const params = new URLSearchParams(location.search);
      active = buttons.some(b=>b.dataset.filter===params.get('category')) ? params.get('category') : 'all';
      search.value = params.get('q') || '';
    };
    const filter = (save=true) => {
      const query = search.value.trim().toLowerCase();
      let shown = 0;
      for (const card of cards) {
        const matches = (active === 'all' || card.dataset.category === active) && card.dataset.search.includes(query);
        card.hidden = !matches;
        if (matches) shown++;
      }
      for (const button of buttons) button.setAttribute('aria-pressed',String(button.dataset.filter===active));
      count.textContent = `${shown} project ${shown===1?'story':'stories'}${active==='all'&&!query?' · Client work, independent products & explorations':''}`;
      document.querySelector('#empty-state').hidden = shown !== 0;
      document.dispatchEvent(new CustomEvent('zencode:projects-filtered'));
      if (save) {
        const url = new URL(location.href);
        active === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category',active);
        query ? url.searchParams.set('q',search.value.trim()) : url.searchParams.delete('q');
        history.replaceState(null,'',url);
      }
    };
    for (const button of buttons) button.addEventListener('click',()=>{active=button.dataset.filter;filter();});
    search.addEventListener('input',()=>filter());
    document.querySelector('#reset-filters').addEventListener('click',()=>{active='all';search.value='';filter();buttons[0].focus();});
    addEventListener('popstate',()=>{readUrl();filter(false);});
    readUrl(); filter(false);
  }

  const form = document.querySelector('#contact-form');
  if (form) {
    const interests = [...document.querySelectorAll('[data-interest]')];
    const selectInterest = id => {
      for (const button of interests) {
        const selected = button.dataset.interest === id;
        button.setAttribute('aria-pressed',String(selected));
        if (selected) document.querySelector('#interest-value').value=button.querySelector('span').textContent;
      }
    };
    const requested = new URLSearchParams(location.search).get('interest');
    selectInterest(interests.some(b=>b.dataset.interest===requested)?requested:'unsure');
    interests.forEach(b=>b.addEventListener('click',()=>selectInterest(b.dataset.interest)));
    const status = document.querySelector('#form-status');
    const submit = form.querySelector('[type=submit]');
    const submitMarkup = submit.innerHTML;
    const setStatus = (message,state) => { status.textContent=message;status.dataset.state=state; };
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if (submit.disabled || !form.reportValidity()) return;
      const data = new FormData(form);
      if (data.get('botcheck')) return;
      if (!String(data.get('h-captcha-response')||'').trim()) {
        setStatus('Please complete the verification before sending. If it doesn’t load, you can email info@zencode.my or use WhatsApp.','error');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Sending your enquiry…';
      setStatus('Sending securely. Please keep this page open.','pending');
      try {
        const response = await fetch(form.action,{method:'POST',body:data,signal:AbortSignal.timeout(20000)});
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('delivery');
        form.reset();selectInterest('unsure');
        if (window.hcaptcha) window.hcaptcha.reset();
        setStatus('Thank you—your enquiry has been sent. We’ll be in touch at the email address you shared.','success');
      } catch {
        setStatus('We couldn’t confirm delivery. Your message is still here. Please try again, email info@zencode.my or reach us on WhatsApp.','error');
        if (window.hcaptcha) window.hcaptcha.reset();
      } finally {
        submit.disabled=false;submit.innerHTML=submitMarkup;
      }
    });
  }
})();
