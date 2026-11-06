/*
 * Home page effects:
 *  1. Hero glyph field: a dot matrix that "decodes" into code glyphs around the
 *     pointer, ripples on click, and keeps itself busy with a wandering ghost
 *     cursor when nobody is touching it.
 *  2. Client orbit: every client plate on a draggable 3D sphere with a live
 *     network drawn between neighbours.
 * Both respect the site-wide Pause motion control and prefers-reduced-motion
 * (html.motion-paused), stop while offscreen or in a background tab, and fall
 * back to the static markup if this file never loads.
 */
(() => {
  const root = document.documentElement;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
  const allowed = () => !root.classList.contains('motion-paused') && !reducedQuery.matches;
  const controllers = [];
  const syncAll = () => controllers.forEach(c => c.sync());
  new MutationObserver(syncAll).observe(root, { attributes: true, attributeFilter: ['class'] });
  reducedQuery.addEventListener('change', syncAll);
  document.addEventListener('visibilitychange', syncAll);

  const INK = '#fffdf5', CORAL = '#e45258', PEACH = '#e2b6a1', BG = '#2d2627';

  /** Shared run-loop helper: runs `frame` only while allowed, visible and on screen. */
  function loop(element, frame, onStop) {
    let raf = 0, inView = false, last = 0;
    const tick = t => {
      const dt = Math.min(48, last ? t - last : 16.7) / 16.7;
      last = t;
      frame(t, dt);
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      const run = allowed() && inView && !document.hidden;
      if (run && !raf) { last = 0; raf = requestAnimationFrame(tick); }
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!run) onStop?.();
    };
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { rootMargin: '80px' }).observe(element);
    return { sync, get running() { return !!raf; } };
  }

  /* ------------------------------------------------------------------ */
  /* 1. Hero glyph field                                                  */
  /* ------------------------------------------------------------------ */
  function heroField(hero, canvas) {
    const ctx = canvas.getContext('2d');
    const GLYPHS = '01{}[]<>/\\=+*;:#$&?!_~^|01ABCDEF0x';
    const pointer = { x: -1e4, y: -1e4, last: -1e9, inside: false };
    const focus = { x: 0, y: 0, power: 0 };
    const ripples = [];
    let W = 0, H = 0, dpr = 1, gap = 22, count = 0, nextGhostRipple = 0;
    let hx, hy, ox, oy, vx, vy, energy, glyph;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gap = W < 600 ? 18 : W < 1100 ? 20 : 23;
      const cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
      const offX = (W - (cols - 1) * gap) / 2, offY = (H - (rows - 1) * gap) / 2;
      count = cols * rows;
      hx = new Float32Array(count); hy = new Float32Array(count);
      ox = new Float32Array(count); oy = new Float32Array(count);
      vx = new Float32Array(count); vy = new Float32Array(count);
      energy = new Float32Array(count); glyph = new Uint8Array(count);
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
        hx[i] = offX + c * gap; hy[i] = offY + r * gap;
        glyph[i] = (Math.random() * GLYPHS.length) | 0;
      }
      if (!focus.x) { focus.x = W * 0.62; focus.y = H * 0.4; }
      if (!controller.running) drawStatic();
    }

    // The field is wider than the hero copy, so track the pointer against the canvas itself.
    function local(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      return [x, y, x >= 0 && y >= 0 && x <= rect.width && y <= rect.height];
    }
    addEventListener('pointermove', e => {
      if (!controller.running) return;
      const [x, y, inside] = local(e);
      pointer.inside = inside;
      if (inside) { pointer.x = x; pointer.y = y; pointer.last = performance.now(); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; });
    addEventListener('pointerdown', e => {
      if (!controller.running) return;
      const [x, y, inside] = local(e);
      if (!inside) return;
      ripples.push({ x, y, t: performance.now(), power: 1 });
      if (ripples.length > 6) ripples.shift();
    }, { passive: true });

    function drawStatic() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = INK; ctx.globalAlpha = 0.09;
      for (let i = 0; i < count; i++) ctx.fillRect(hx[i] - 0.75, hy[i] - 0.75, 1.5, 1.5);
      ctx.globalAlpha = 1;
    }

    function frame(t, dt) {
      // Follow the real pointer; after 2.2 s of stillness a ghost cursor takes over.
      const live = pointer.inside && t - pointer.last < 2200;
      const gx = W * (0.55 + 0.33 * Math.sin(t * 0.00021) + 0.08 * Math.sin(t * 0.00063 + 2));
      const gy = H * (0.42 + 0.26 * Math.sin(t * 0.00031 + 1) + 0.06 * Math.cos(t * 0.00071));
      const tx = live ? pointer.x : gx, ty = live ? pointer.y : gy;
      const ease = live ? 0.2 : 0.045;
      focus.x += (tx - focus.x) * Math.min(1, ease * dt);
      focus.y += (ty - focus.y) * Math.min(1, ease * dt);
      focus.power += ((live ? 1 : 0.62) - focus.power) * 0.05 * dt;
      if (!live && t > nextGhostRipple) {
        ripples.push({ x: focus.x, y: focus.y, t, power: 0.55 });
        nextGhostRipple = t + 3400 + Math.random() * 2200;
      }

      const R = W < 600 ? 120 : 190, R2 = R * R;
      const spring = 0.055, damp = Math.pow(0.84, dt), decay = Math.pow(0.952, dt);
      const maxRipple = Math.hypot(W, H);
      for (let k = ripples.length - 1; k >= 0; k--) if ((t - ripples[k].t) * 0.6 > maxRipple * 0.7) ripples.splice(k, 1);

      for (let i = 0; i < count; i++) {
        const px = hx[i] + ox[i], py = hy[i] + oy[i];
        const dx = px - focus.x, dy = py - focus.y, d2 = dx * dx + dy * dy;
        let e = energy[i] * decay;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1, f = 1 - d / R, push = f * f * 1.9 * focus.power;
          vx[i] += (dx / d) * push * dt; vy[i] += (dy / d) * push * dt;
          if (f * focus.power > e) e = f * focus.power;
        }
        for (let k = 0; k < ripples.length; k++) {
          const rp = ripples[k], radius = (t - rp.t) * 0.6;
          const rx = hx[i] - rp.x, ry = hy[i] - rp.y, rd = Math.sqrt(rx * rx + ry * ry) || 1;
          const band = 1 - Math.abs(rd - radius) / 55;
          if (band > 0) {
            const p = band * rp.power * Math.max(0, 1 - radius / (maxRipple * 0.7));
            vx[i] += (rx / rd) * p * 2.4 * dt; vy[i] += (ry / rd) * p * 2.4 * dt;
            if (p > e) e = p;
          }
        }
        vx[i] = (vx[i] - ox[i] * spring * dt) * damp;
        vy[i] = (vy[i] - oy[i] * spring * dt) * damp;
        ox[i] += vx[i] * dt; oy[i] += vy[i] * dt;
        if (e > 0.2 && Math.random() < e * 0.18 * dt) glyph[i] = (Math.random() * GLYPHS.length) | 0;
        energy[i] = e;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Pass 1: idle dots with a slow diagonal shimmer.
      ctx.fillStyle = INK;
      const phase = t * 0.0009;
      for (let i = 0; i < count; i++) {
        if (energy[i] > 0.12) continue;
        const w = Math.sin(hx[i] * 0.011 + hy[i] * 0.007 - phase);
        ctx.globalAlpha = 0.06 + (w > 0 ? w * w * w * 0.16 : 0);
        ctx.fillRect(hx[i] + ox[i] - 0.75, hy[i] + oy[i] - 0.75, 1.5, 1.5);
      }
      // Pass 2: energised cells become code glyphs, warming from ink to coral.
      ctx.font = `500 ${gap < 20 ? 10 : 12}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [min, max, color] of [[0.12, 0.38, INK], [0.38, 0.66, PEACH], [0.66, 9, CORAL]]) {
        ctx.fillStyle = color;
        for (let i = 0; i < count; i++) {
          const e = energy[i];
          if (e <= min || e > max) continue;
          ctx.globalAlpha = Math.min(1, 0.2 + e * 0.95);
          ctx.fillText(GLYPHS[glyph[i]], hx[i] + ox[i], hy[i] + oy[i]);
        }
      }
      ctx.globalAlpha = 1;
      // Pointer HUD: corner brackets and live coordinates (desktop only).
      if (live && fineQuery.matches) {
        const s = 16, x = focus.x, y = focus.y;
        ctx.strokeStyle = CORAL; ctx.lineWidth = 1.5; ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.moveTo(x + sx * s, y + sy * (s - 6)); ctx.lineTo(x + sx * s, y + sy * s); ctx.lineTo(x + sx * (s - 6), y + sy * s);
        }
        ctx.stroke();
        ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        ctx.textAlign = 'left'; ctx.fillStyle = PEACH; ctx.globalAlpha = 0.85;
        ctx.fillText(`x ${String(Math.round(x)).padStart(4, '0')}  y ${String(Math.round(y)).padStart(4, '0')}`, x + s + 8, y + s + 4);
        ctx.globalAlpha = 1;
      }
    }

    const controller = loop(hero, frame, () => drawStatic());
    controllers.push(controller);
    new ResizeObserver(resize).observe(canvas);
    resize();
  }

  /* ------------------------------------------------------------------ */
  /* 2. Client orbit                                                      */
  /* ------------------------------------------------------------------ */
  function clientOrbit(section) {
    const stage = section.querySelector('.client-orbit');
    const canvas = section.querySelector('.client-orbit-net');
    const nodes = [...section.querySelectorAll('.client-node')];
    const nameOut = section.querySelector('.client-readout-name');
    const indexOut = section.querySelector('.client-readout-index');
    if (!stage || !canvas || nodes.length < 4) return;
    const ctx = canvas.getContext('2d');
    const N = nodes.length;
    const names = nodes.map(n => n.querySelector('figcaption')?.textContent || '');
    const total = String(N).padStart(2, '0');

    // Even distribution on a unit sphere (Fibonacci lattice).
    const pts = nodes.map((_, i) => {
      const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
    // Link each node to its three nearest neighbours.
    const edges = [], seen = new Set();
    pts.forEach((p, i) => {
      pts.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2])
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([j]) => { const key = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(key)) { seen.add(key); edges.push([i, j]); } });
    });
    const packets = Array.from({ length: 9 }, () => ({ edge: (Math.random() * edges.length) | 0, t: Math.random(), speed: 0.006 + Math.random() * 0.008, dir: Math.random() < 0.5 }));

    const AUTO = 0.0042;
    let W = 0, H = 0, dpr = 1, R = 200;
    let sizes = nodes.map(() => [140, 90]);
    let yaw = 0.4, pitch = -0.22, vYaw = AUTO, vPitch = 0;
    let drag = null, focusTarget = null, holdUntil = 0, hovered = -1, front = -1, hoverStage = false;
    const proj = pts.map(() => ({ x: 0, y: 0, z: 0, s: 1 }));

    function resize() {
      const rect = stage.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      // Stickers differ in size, so each one is centred on its own point.
      sizes = nodes.map(n => [n.offsetWidth || 140, n.offsetHeight || 90]);
      const avgW = sizes.reduce((sum, [w]) => sum + w, 0) / sizes.length;
      R = Math.max(110, Math.min(W, H) / 2 - avgW * 0.38);
    }

    const rotate = ([x, y, z], cy, sy, cp, sp) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
    };
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

    function focusOn(i, hold = 3600) {
      const [x, y, z] = pts[i];
      const h = Math.hypot(x, z);
      focusTarget = { yaw: Math.atan2(-x, z), pitch: Math.atan2(y, h) };
      holdUntil = performance.now() + hold;
    }

    function frame(t, dt) {
      if (drag) {
        // velocity set by pointer handlers
      } else if (focusTarget) {
        const dyaw = wrap(focusTarget.yaw - yaw), dp = focusTarget.pitch - pitch;
        yaw += dyaw * 0.09 * dt; pitch += dp * 0.09 * dt; vYaw = 0; vPitch = 0;
        if (Math.abs(dyaw) < 0.002 && Math.abs(dp) < 0.002 && t > holdUntil) focusTarget = null;
      } else {
        const target = hoverStage ? AUTO * 0.35 : AUTO;
        vYaw += (target - vYaw) * 0.03 * dt;
        vPitch += ((-0.22 - pitch) * 0.002 - vPitch * 0.06) * dt;
        yaw += vYaw * dt; pitch += vPitch * dt;
      }
      pitch = Math.max(-1.25, Math.min(1.25, pitch));
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cx = W / 2, cyy = H / 2, persp = 3.6;

      let best = -2, bestI = 0;
      for (let i = 0; i < N; i++) {
        const [x, y, z] = rotate(pts[i], cy, sy, cp, sp);
        const k = persp / (persp - z);
        const p = proj[i];
        p.x = cx + x * R * k; p.y = cyy - y * R * k; p.z = z; p.s = k;
        if (z > best) { best = z; bestI = i; }
      }
      for (let i = 0; i < N; i++) {
        const p = proj[i], depth = (p.z + 1) / 2;
        const scale = (0.42 + 0.48 * depth) * p.s * (i === hovered ? 1.12 : 1);
        const n = nodes[i].style;
        n.transform = `translate3d(${(p.x - sizes[i][0] / 2).toFixed(1)}px,${(p.y - sizes[i][1] / 2).toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
        n.opacity = (0.18 + 0.82 * depth ** 1.4).toFixed(3);
        n.zIndex = String(Math.round(depth * 100) + (i === hovered ? 200 : 0));
      }
      if (bestI !== front) {
        nodes[front]?.classList.remove('is-front');
        nodes[bestI].classList.add('is-front');
        front = bestI;
        if (nameOut) nameOut.textContent = names[bestI];
        if (indexOut) indexOut.textContent = `${String(bestI + 1).padStart(2, '0')} / ${total}`;
      }

      // Network: sphere silhouette, orbit rings, links and travelling packets.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = BG; ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.arc(cx, cyy, R * persp / (persp - 0.35), 0, Math.PI * 2); ctx.stroke();
      for (const tilt of [0, Math.PI / 3, -Math.PI / 3]) {
        for (let s = 0; s < 72; s++) {
          const a0 = s / 72 * Math.PI * 2, a1 = (s + 1) / 72 * Math.PI * 2;
          const ring = a => rotate([Math.cos(a), Math.sin(a) * Math.sin(tilt), Math.sin(a) * Math.cos(tilt)], cy, sy, cp, sp);
          const p0 = ring(a0), p1 = ring(a1), k0 = persp / (persp - p0[2]), k1 = persp / (persp - p1[2]);
          ctx.globalAlpha = 0.04 + 0.16 * ((p0[2] + 1) / 2) ** 2;
          ctx.beginPath(); ctx.moveTo(cx + p0[0] * R * k0, cyy - p0[1] * R * k0); ctx.lineTo(cx + p1[0] * R * k1, cyy - p1[1] * R * k1); ctx.stroke();
        }
      }
      for (const [a, b] of edges) {
        const pa = proj[a], pb = proj[b], depth = (pa.z + pb.z + 2) / 4;
        ctx.globalAlpha = 0.05 + 0.4 * depth ** 2;
        ctx.strokeStyle = a === front || b === front || a === hovered || b === hovered ? CORAL : BG;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      ctx.fillStyle = CORAL;
      for (const pk of packets) {
        pk.t += pk.speed * dt;
        if (pk.t >= 1) { pk.t = 0; pk.edge = (Math.random() * edges.length) | 0; pk.dir = Math.random() < 0.5; }
        const [a, b] = edges[pk.edge], pa = proj[pk.dir ? a : b], pb = proj[pk.dir ? b : a];
        const x = pa.x + (pb.x - pa.x) * pk.t, y = pa.y + (pb.y - pa.y) * pk.t, depth = (pa.z + pb.z + 2) / 4;
        ctx.globalAlpha = 0.15 + 0.85 * depth ** 2;
        ctx.beginPath(); ctx.arc(x, y, 1.5 + depth * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha *= 0.25;
        ctx.beginPath(); ctx.arc(x, y, 5 + depth * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Dragging with inertia. touch-action: pan-y keeps vertical page scrolling on phones.
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, node: e.target.closest('.client-node') };
      focusTarget = null;
    });
    stage.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) {
        if (e.pointerType === 'mouse') {
          const node = e.target.closest('.client-node');
          hovered = node ? nodes.indexOf(node) : -1;
          nodes.forEach((n, i) => n.classList.toggle('is-hover', i === hovered));
        }
        return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
        drag.moved = true;
        stage.classList.add('is-dragging');
        try { stage.setPointerCapture(drag.id); } catch {}
      }
      if (drag.moved) {
        vYaw = dx * 0.0065; vPitch = -dy * 0.0065;
        yaw += vYaw; pitch += vPitch;
      }
    });
    const endDrag = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && drag.node && e.type === 'pointerup') focusOn(nodes.indexOf(drag.node));
      stage.classList.remove('is-dragging');
      drag = null;
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hoverStage = true; });
    stage.addEventListener('pointerleave', () => {
      hoverStage = false; hovered = -1;
      nodes.forEach(n => n.classList.remove('is-hover'));
    });
    nodes.forEach((node, i) => node.addEventListener('focus', () => { if (section.classList.contains('is-orbit')) focusOn(i, 2500); }));

    let enabled = false;
    const setEnabled = on => {
      if (on === enabled) return;
      enabled = on;
      section.classList.toggle('is-orbit', on);
      nodes.forEach(n => {
        if (on) n.tabIndex = 0;
        else { n.removeAttribute('tabindex'); n.style.removeProperty('transform'); n.style.removeProperty('opacity'); n.style.removeProperty('z-index'); n.classList.remove('is-front', 'is-hover'); }
      });
      front = -1;
      if (on) resize();
    };
    const runner = loop(stage, frame);
    const controller = { sync() { setEnabled(allowed()); runner.sync(); } };
    controllers.push(controller);
    const sizeWatch = new ResizeObserver(() => { if (enabled) resize(); });
    sizeWatch.observe(stage);
    nodes.forEach(n => sizeWatch.observe(n));
    controller.sync();
  }

  const hero = document.querySelector('.hero');
  const field = hero?.querySelector('.hero-field');
  if (hero && field) heroField(hero, field);
  const clients = document.querySelector('.client-showcase');
  if (clients) clientOrbit(clients);
})();
