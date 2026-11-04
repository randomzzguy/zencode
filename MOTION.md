# Zencode motion system

Built with Motion 14.9.0, bundled locally using esbuild. No animation CDN or runtime network dependency. Pinned versions and integrity hashes are in `package-lock.json`; MIT notices ship in `THIRD_PARTY_NOTICES.txt`.

## Upstream research

- Repository: https://github.com/motiondivision/motion
- Viewport observer source: https://github.com/motiondivision/motion/blob/main/packages/framer-motion/src/render/dom/viewport/index.ts
- Hover source: https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/gestures/hover.ts
- API references: https://motion.dev/docs/animate, https://motion.dev/docs/inview, https://motion.dev/docs/scroll, https://motion.dev/docs/hover

The observer source informed once-per-visit entrances and disconnection on cleanup. The hover source filters touch-emulated events and cleans up gesture listeners. We use the upstream implementation through the pinned package, rather than maintaining a copied fork. No premium examples or Motion+ assets are used.

## Choreography

- Headline lines enter with 130 ms separation; section headings and project groups enter with a restrained upward motion.
- Cards and process steps stagger by 45–90 ms. Offscreen targets are prepared in JavaScript and triggered 80 px ahead of the viewport; content already visible at initialization stays steady, preventing a visible-to-hidden reset. Text remains readable in the HTML before JavaScript and if the animation bundle cannot load.
- The home headline, scenic photography and large industrial interface studies have subtle scroll-linked movement. Scroll position remains native, including the horizontal project rail.
- Desktop buttons lift with a spring, project images lift and tilt slightly, arrows move, and button fills sweep upward. Coarse pointers do not receive spring hover handlers.
- Native service/FAQ details animate between measured heights and handle rapid reversals. Keyboard clicks use the same path.
- The mobile menu and visible filter results enter in short sequences.

## Motion preferences and lifecycle

The existing Pause motion control and OS reduced-motion preference disable the entire enhancement. In-flight controls and observers are cancelled, accordion state is settled, and animated inline styles are restored. A CSS fallback keeps content visible during any final animation-engine style flush. Manual pause survives reload and OS preference changes. Background tabs suspend the enhancement; back/forward restoration and viewport capability changes reinitialize it without replaying visited reveals.

Most movement uses transforms and opacity. Accordion height is the deliberate exception. Animation content is not pre-hidden in CSS, and navigation/form code remains in a separate script so a failed animation load cannot disable the site.

## Validation

Run `npm ci`, `npm run build`, `npm run check`, then `npm run dev`. With Python Playwright/Chromium available, `python scripts/smoke.py` covers all 20 routes at three widths and core interactions. `python scripts/motion-smoke.py` checks animation progression, hover, accordion reversals and preference cleanup. Form tests intercept requests and never send enquiries.
