import { animate, inView, scroll, hover } from 'motion';

// Motion (MIT): https://github.com/motiondivision/motion
// Progressive enhancement: HTML is visible before this bundle loads or if it fails.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width:851px)');
const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
const ease = [0.22, 1, 0.36, 1];
const seen = new WeakSet();
let dispose = null;

function mount() {
  const cleanups = [];
  const controls = new Set();
  const originals = new Map();
  let disposed = false;
  root.classList.add('motion-active');

  function remember(element) {
    if (!originals.has(element)) originals.set(element, element.getAttribute('style'));
    element.setAttribute('data-motion-surface', '');
  }
  function restore(element) {
    const style = originals.get(element);
    if (style == null) element.removeAttribute('style');
    else element.setAttribute('style', style);
  }
  function run(element, keyframes, options = {}, release = false) {
    remember(element);
    const control = animate(element, keyframes, { duration: 0.75, ease, ...options });
    controls.add(control);
    control.then(() => {
      controls.delete(control);
      if (release && !disposed) {
        control.cancel();
        // A reveal can finish while an accordion height animation is running.
        // Release only the properties owned by this reveal.
        Object.keys(keyframes).forEach(property => element.style.removeProperty(property));
      }
    });
    return control;
  }
  function listen(element, event, fn) {
    element.addEventListener(event, fn);
    cleanups.push(() => element.removeEventListener(event, fn));
  }

  // Prepare offscreen entrances before they can be seen. Starting an animation
  // from opacity 0 only after visible content crosses a threshold causes a flash.
  const reveals = new Map();
  function add(selector, step = 0, distance = 34) {
    document.querySelectorAll(selector).forEach((element, i) => {
      if (!reveals.has(element)) reveals.set(element, { delay: (i % 4) * step, distance });
    });
  }
  add('.hero h1 > span', 0.13, 65);
  add('.hero-topline, .hero-bottom, .hero-proof', 0.08, 20);
  add('.page-head h1, .case-head h1, .section-intro h1', 0, 50);
  add('.intro-work-deck, .capability-map, .intro-industry-gallery, .studio-identity', 0, 25);
  add('.page-head-bottom, .case-deck', 0, 24);
  add('.section-head, .range-heading, .service-block-title, .industry-heading', 0, 38);
  add('.project-card, .range-project, .all-work-tile', 0.09, 38);
  add('.need-grid > a, .process > li, .feature-list > article', 0.065, 28);
  add('.service-block-content > div, .industry-body > div, .case-overview > div', 0.075, 28);
  add('.studio-intro > div, .studio-rules article, .case-decisions article', 0.065, 28);
  // Native disclosures own their height animation; keep the control itself
  // stable and immediately interactive while the rest of a page enters.
  add('.belief-label, .belief-section h2, .belief-section .wrap > div', 0.1, 38);
  add('.footer-preamble, .footer-big-link, .footer-invite-bottom', 0.08, 32);
  // A project enters only when actually visible in both scroll axes.
  add('.work-slide-copy, .work-slide-visual', 0.1, 32);
  const pending = [...reveals.keys()].filter(element => !seen.has(element));
  for (const element of pending) {
    const box = element.getBoundingClientRect();
    const alreadyVisible = box.top < innerHeight + 80 && box.bottom > 0 && box.left < innerWidth && box.right > 0;
    if (alreadyVisible) {
      seen.add(element);
      continue;
    }
    remember(element);
    element.style.opacity = '0';
    element.style.transform = `translateY(${reveals.get(element).distance}px)`;
  }
  if (pending.length) cleanups.push(inView(pending, (element) => {
    if (seen.has(element) || disposed) return;
    seen.add(element);
    const { delay, distance } = reveals.get(element);
    // Keyboard navigation and fragment links should never wait for a reveal.
    const anchor = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (element.contains(document.activeElement) || (anchor && (anchor.contains(element) || element.contains(anchor)))) {
      element.style.removeProperty('opacity');
      element.style.removeProperty('transform');
      return;
    }
    run(element, { opacity: [0, 1], transform: [`translateY(${distance}px)`, 'translateY(0px)'] }, { delay, duration: 0.85 }, true);
  }, { margin: '0px 0px 80px 0px', amount: 0 }));

  // Scroll-linked transforms stay on the compositor; native scrolling is retained.
  function parallax(element, target, transforms, offset = ['start end', 'end start']) {
    remember(element);
    const animation = animate(element, { transform: transforms }, { ease: 'linear', autoplay: false });
    controls.add(animation);
    cleanups.push(scroll(animation, { target, offset }));
  }
  document.querySelectorAll('.resthouse-visual > img').forEach(image => {
    parallax(image, image.parentElement, ['translateY(-3%) scale(1.09)', 'translateY(3%) scale(1.09)']);
  });
  if (desktop.matches) {
    const hero = document.querySelector('.hero');
    if (hero) parallax(hero.querySelector('h1'), hero, ['translateY(0px)', 'translateY(55px)'], ['start start', 'end start']);
    document.querySelectorAll('.case-cover .system-frame').forEach(frame => {
      parallax(frame, frame.closest('.case-cover'), ['perspective(1600px) rotateX(4deg) rotateY(-3deg) translateY(18px)', 'perspective(1600px) rotateX(0deg) rotateY(1deg) translateY(-18px)']);
    });
  }

  // Hover's pointer filtering prevents sticky emulated hover on touch devices.
  if (finePointer.matches) {
    cleanups.push(hover('.button:not(.plain), .header-contact, .hero-scroll, .rail-controls button', element => {
      if (element.disabled) return;
      run(element, { y: -3, scale: 1.015 }, { type: 'spring', visualDuration: 0.32, bounce: 0.18 });
      return () => run(element, { y: 0, scale: 1 }, { type: 'spring', visualDuration: 0.4, bounce: 0.25 });
    }));
    cleanups.push(hover('.project-link, .range-project', element => {
      const image = element.querySelector('.card-image, .project-visual');
      if (!image) return;
      run(image, { y: -5, rotate: -0.5, scale: 1.012 }, { type: 'spring', visualDuration: 0.5, bounce: 0.12 });
      return () => run(image, { y: 0, rotate: 0, scale: 1 }, { type: 'spring', visualDuration: 0.55, bounce: 0.18 });
    }));
    cleanups.push(hover('.all-work-tile', element => {
      const number = element.querySelector('strong');
      run(number, { x: 10, rotate: -4 }, { type: 'spring', visualDuration: 0.5, bounce: 0.2 });
      return () => run(number, { x: 0, rotate: 0 }, { type: 'spring', visualDuration: 0.5, bounce: 0.2 });
    }));
  }

  // Animate native details height, including rapid reversals and keyboard clicks.
  document.querySelectorAll('.service-accordion details, .faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation;
    let wantedOpen = details.open;
    remember(details);
    listen(summary, 'click', event => {
      event.preventDefault();
      wantedOpen = !wantedOpen;
      const from = details.getBoundingClientRect().height;
      if (animation) animation.stop();
      details.style.height = '';
      details.open = wantedOpen;
      const to = details.getBoundingClientRect().height;
      details.open = true;
      details.style.overflow = 'clip';
      animation = run(details, { height: [`${from}px`, `${to}px`] }, { duration: 0.42 });
      const current = animation;
      current.then(() => {
        if (disposed || current !== animation) return;
        current.cancel();
        details.open = wantedOpen;
        restore(details);
        animation = null;
      });
    });
    cleanups.push(() => { if (animation) animation.cancel(); details.open = wantedOpen; });
  });

  listen(document, 'zencode:projects-filtered', () => {
    document.querySelectorAll('.project-card:not([hidden])').forEach((element, i) => {
      const box = element.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      seen.add(element);
      run(element, { opacity: [0.25, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, { duration: 0.45, delay: (i % 2) * 0.06 }, true);
    });
  });
  const menu = document.querySelector('.menu-toggle');
  if (menu) {
    const observer = new MutationObserver(() => {
      if (menu.getAttribute('aria-expanded') !== 'true') return;
      document.querySelectorAll('#main-nav > a').forEach((item, i) => {
        run(item, { opacity: [0, 1], transform: ['translateY(15px)', 'translateY(0px)'] }, { duration: 0.4, delay: i * 0.045 }, true);
      });
    });
    observer.observe(menu, { attributes: true, attributeFilter: ['aria-expanded'] });
    cleanups.push(() => observer.disconnect());
  }
  // Focusing an entering item immediately finishes its reveal.
  listen(document, 'focusin', event => {
    for (const element of reveals.keys()) if (element.contains(event.target)) {
      seen.add(element);
      element.getAnimations().forEach(animation => { if (animation.playState !== 'finished') animation.finish(); });
      element.style.removeProperty('opacity');
      element.style.removeProperty('transform');
    }
  });

  return () => {
    disposed = true;
    cleanups.forEach(cleanup => cleanup());
    controls.forEach(control => control.cancel());
    originals.forEach((_, element) => {
      // Completed hover animations may have committed their final styles.
      element.getAnimations().forEach(animation => animation.cancel());
      restore(element);
    });
    root.classList.remove('motion-active');
    // Motion may flush a final native/JS style write at the end of this frame.
    // Restore again after that flush, unless the visitor has already resumed.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!root.classList.contains('motion-active')) originals.forEach((_, element) => restore(element));
    }));
  };
}

function sync() {
  const enabled = !reduced.matches && !root.classList.contains('motion-paused') && !document.hidden;
  if (enabled && !dispose) dispose = mount();
  else if (!enabled && dispose) { const cleanup = dispose; dispose = null; cleanup(); }
}
new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
reduced.addEventListener('change', sync);
document.addEventListener('visibilitychange', sync);
// Reconfigure parallax and hover if a device's actual capabilities change.
function remount() { if (dispose) { dispose(); dispose = null; } sync(); }
desktop.addEventListener('change', remount);
finePointer.addEventListener('change', remount);
addEventListener('pagehide', () => { if (dispose) { dispose(); dispose = null; } });
addEventListener('pageshow', sync);
sync();
