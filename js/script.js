/* ═══════════════════════════════════════════════
   IPE BATCH '31 — OPTIMA · script.js
   Preloader · Gear · Cursor · Parallax · Tilt · Roster · Catch
═══════════════════════════════════════════════ */

'use strict';

/* ─── MEMBERS (roll → name) ─── */
const MEMBERS = {
   3: 'TAHSIN',
   4: 'MUNTAHSIN',
   5: 'MORSHED',
   6: 'ANGSHU',
  10: 'AYON',
  12: 'ROKTIM',
  13: 'JISAN',
  15: 'FAHMI',
  17: 'OISHIK',
  23: 'SHAHRIYAR',
  30: 'ANIRBAN',
  32: 'DHRUBO',
  38: 'TAKI',
  39: 'ZINAN',
  40: 'RODELA',
  41: 'MAHDI',
  42: 'SAGOR',
  44: 'WASIMA',
  47: 'SABIK',
  49: 'SOUBIR',
  51: 'MOHAMMAD',
  52: 'RAFI',
  54: 'NISHITA',
  56: 'JUBAIR',
  58: 'TAS',
  59: 'SHAKHAET',
  60: 'MOFI',
  61: 'HASMIR',
  63: 'MUSFIQUE',
  64: 'JABIR',
  66: 'AHANAF',
  67: 'SHIFAT',
  68: 'ALIF',
  71: 'SUCHETA',
  72: 'AVIJITH',
  74: 'ADNAN',
  75: 'NUSAIBA',
  77: 'ALIZA',
  78: 'TAZIF',
  79: 'ADIBA',
  80: 'NABILA',
  84: 'RICHARD',
};

/* Sorted entries for iteration (by roll ascending) */
const MEMBERS_LIST = Object.entries(MEMBERS)
  .map(([roll, name]) => ({ roll: Number(roll), name }))
  .sort((a, b) => a.roll - b.roll);

/* ─── DEVICE ─── */
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const isTouch  = () => navigator.maxTouchPoints > 0;

/* ─── UTILS ─── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ═══════════════════════════════════════════════
   01 · PRELOADER
═══════════════════════════════════════════════ */
function initPreloader() {
  const loader   = qs('#preloader');
  const numEl    = qs('#pre-num');
  const barEl    = qs('#pre-bar');
  const nav      = qs('#main-nav');

  let count = 0;
  const duration = 2400; // ms total
  const steps    = 100;
  const interval = duration / steps;

  const tick = setInterval(() => {
    count++;
    numEl.textContent = count.toString().padStart(2, '0');
    barEl.style.width = count + '%';

    if (count >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add('done');
        nav.classList.add('visible');
        // Start hero reveals after preloader exits
        setTimeout(revealHeroItems, 400);
        // Init scroll-based reveals
        setupScrollReveal();
        // init parallax
        setupParallax();
      }, 400);
    }
  }, interval);
}

/* ═══════════════════════════════════════════════
   02 · GEAR CANVAS (Three.js-powered 3D Gear)
═══════════════════════════════════════════════ */
function buildGear(scene, opts = {}) {
  const {
    toothCount = 24,
    outerR = 1.8,
    innerR = 1.2,
    toothH = 0.35,
    depth   = 0.4,
    color   = 0x7c5ff0
  } = opts;

  const shape = new THREE.Shape();
  const twoPi = Math.PI * 2;
  const arc   = twoPi / toothCount;

  for (let i = 0; i < toothCount; i++) {
    const a0 = i * arc - arc * 0.25;
    const a1 = i * arc + arc * 0.25;
    const a2 = i * arc + arc * 0.5;

    const getRad = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

    if (i === 0) {
      const [x, y] = getRad(a0, innerR);
      shape.moveTo(x, y);
    }

    const [x0, y0] = getRad(a0, innerR);
    const [x1, y1] = getRad(a0, outerR);
    const [x2, y2] = getRad(a1, outerR);
    const [x3, y3] = getRad(a1, innerR);
    const [x4, y4] = getRad(a2, innerR);

    shape.lineTo(x0, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x3, y3);
    shape.lineTo(x4, y4);
  }

  shape.closePath();

  // Hub hole
  const holePath = new THREE.Path();
  const holeR    = 0.38;
  holePath.absarc(0, 0, holeR, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const extOpts = {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 3
  };

  const geo = new THREE.ExtrudeGeometry(shape, extOpts);
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.25,
    emissive: new THREE.Color(color).multiplyScalar(0.05)
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
}

function initGearCanvas(canvasId, opts = {}) {
  const canvas = qs('#' + canvasId);
  if (!canvas || typeof THREE === 'undefined') return null;

  const W = canvas.offsetWidth  || 700;
  const H = canvas.offsetHeight || 700;
  canvas.width  = W;
  canvas.height = H;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Lighting
  const amb = new THREE.AmbientLight(0x4040a0, 0.4);
  scene.add(amb);

  const dl1 = new THREE.DirectionalLight(0xa78bfa, 2.5);
  dl1.position.set(3, 4, 5);
  scene.add(dl1);

  const dl2 = new THREE.DirectionalLight(0x6ee7f7, 1.2);
  dl2.position.set(-4, -2, 2);
  scene.add(dl2);

  const pl = new THREE.PointLight(0x7c5ff0, 1.5, 15);
  pl.position.set(0, 0, 3);
  scene.add(pl);

  const gear = buildGear(scene, opts.gear || {});
  gear.rotation.z = 0.2;

  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let autoSpin = true;
  let autoAngle = 0;
  let raf;

  function animate() {
    raf = requestAnimationFrame(animate);

    if (autoSpin) {
      autoAngle += 0.003;
      gear.rotation.z = autoAngle;
      gear.rotation.x = Math.sin(autoAngle * 0.3) * 0.08;
    } else {
      currentRotX = lerp(currentRotX, targetRotX, 0.06);
      currentRotY = lerp(currentRotY, targetRotY, 0.06);
      gear.rotation.x = currentRotX;
      gear.rotation.y = currentRotY;
    }

    pl.intensity = 1.5 + Math.sin(Date.now() * 0.002) * 0.3;
    renderer.render(scene, camera);
  }

  animate();

  return {
    gear, renderer, scene, camera,
    setMouseInfluence(mx, my) {
      autoSpin = false;
      targetRotY = (mx - 0.5) * 0.8;
      targetRotX = -(my - 0.5) * 0.6;
    },
    resetToAuto() {
      autoSpin = true;
    },
    destroy() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    }
  };
}

/* ═══════════════════════════════════════════════
   03 · CURSOR (desktop only)
═══════════════════════════════════════════════ */
function initCursor() {
  if (isMobile() || isTouch()) return; // ← skip on mobile

  const dot  = qs('#cursor-dot');
  const ring = qs('#cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform  = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
  });

  function animateCursor() {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    ring.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px))`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover detection
  const hoverables = 'a, button, .name-card, .cta-btn, .nav-link';
  document.addEventListener('mouseover', e => {
    if (e.target.matches(hoverables) || e.target.closest(hoverables)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.matches(hoverables) || e.target.closest(hoverables)) {
      document.body.classList.remove('cursor-hover');
    }
  });
}

/* ═══════════════════════════════════════════════
   04 · NAV SCROLL STATE
═══════════════════════════════════════════════ */
function initNavScroll() {
  const nav = qs('#main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}

/* ═══════════════════════════════════════════════
   05 · HERO REVEALS
═══════════════════════════════════════════════ */
function revealHeroItems() {
  const items = qsa('#hero .reveal-item');
  items.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 150);
  });
}

/* ═══════════════════════════════════════════════
   06 · SCROLL REVEAL (Intersection Observer)
═══════════════════════════════════════════════ */
function setupScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  qsa('.reveal-item:not(#hero .reveal-item)').forEach(el => observer.observe(el));

  // Staggered name cards
  const cardObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cards = qsa('.name-card');
          const idx   = cards.indexOf(entry.target);
          const row   = Math.floor(idx / 6);
          const col   = idx % 6;
          const delay = (row * 40) + (col * 30);
          setTimeout(() => entry.target.classList.add('visible'), delay);
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
  );

  qsa('.name-card').forEach(el => cardObserver.observe(el));
}

/* ═══════════════════════════════════════════════
   07 · PARALLAX (desktop only)
═══════════════════════════════════════════════ */
function setupParallax() {
  if (isMobile()) return; // ← skip on mobile

  const heroGear = qs('#hero-gear-bg');
  const mGear    = qs('#mgear');
  let ticking    = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (heroGear) {
          heroGear.style.transform = `translateY(${sy * 0.3}px)`;
        }
        if (mGear) {
          const rect = mGear.getBoundingClientRect();
          const off  = rect.top * 0.15;
          mGear.style.transform = `translateY(-50%) translateY(${-off}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════════════
   08 · BANNER TILT (desktop only)
═══════════════════════════════════════════════ */
function initBannerTilt() {
  if (isMobile() || isTouch()) return; // ← skip on mobile

  const frame = qs('#banner-frame');
  const inner = qs('#tilt-target');
  if (!frame || !inner) return;

  frame.addEventListener('mousemove', e => {
    const rect  = frame.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const dx    = (e.clientX - cx) / (rect.width  / 2);
    const dy    = (e.clientY - cy) / (rect.height / 2);
    const rotY  = clamp(dx * 8, -8, 8);
    const rotX  = clamp(-dy * 5, -5, 5);
    inner.style.transform = `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale3d(1.02,1.02,1.02)`;
  });

  frame.addEventListener('mouseleave', () => {
    inner.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
    inner.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => { inner.style.transition = ''; }, 600);
  });
}

/* ═══════════════════════════════════════════════
   09 · ROSTER GRID
═══════════════════════════════════════════════ */
function buildRoster() {
  const grid = qs('#roster-grid');
  if (!grid) return;

  MEMBERS_LIST.forEach(({ roll, name }) => {
    const card = document.createElement('div');
    card.className = 'name-card';
    card.dataset.roll = roll;
    card.dataset.name = name;

    const idx  = document.createElement('span');
    idx.className = 'name-index';
    idx.textContent = roll.toString().padStart(2, '0');

    const txt  = document.createElement('span');
    txt.className = 'name-text';
    txt.textContent = name;

    const glow = document.createElement('div');
    glow.className = 'name-glow';

    card.appendChild(idx);
    card.appendChild(txt);
    card.appendChild(glow);
    grid.appendChild(card);

    card.addEventListener('click', () => {
      card.style.setProperty('--glow-size', '3');
      setTimeout(() => card.style.removeProperty('--glow-size'), 600);
    });
  });
}

/* ═══════════════════════════════════════════════
   10 · HERO GEAR (mouse-reactive, desktop only)
═══════════════════════════════════════════════ */
function initHeroGear() {
  if (typeof THREE === 'undefined') return;

  const g = initGearCanvas('gear-canvas', {
    gear: {
      toothCount: isMobile() ? 18 : 24, // fewer segments on mobile
      outerR: 1.9,
      innerR: 1.3,
      toothH: 0.3,
      depth: 0.5,
      color: 0x6a50d0
    }
  });
  if (!g) return;

  if (isMobile() || isTouch()) return; // no mouse tracking on touch

  const section = qs('#hero');
  section.addEventListener('mousemove', e => {
    const rect = section.getBoundingClientRect();
    const nx   = (e.clientX - rect.left) / rect.width;
    const ny   = (e.clientY - rect.top)  / rect.height;
    g.setMouseInfluence(nx, ny);
  });

  section.addEventListener('mouseleave', () => g.resetToAuto());
}

/* ═══════════════════════════════════════════════
   11 · CODA GEAR
═══════════════════════════════════════════════ */
function initCodaGear() {
  if (typeof THREE === 'undefined') return;
  initGearCanvas('coda-gear-canvas', {
    gear: {
      toothCount: 32,
      outerR: 1.7,
      innerR: 1.2,
      depth: 0.3,
      color: 0x4040a0
    }
  });
}

/* ═══════════════════════════════════════════════
   12 · UTILS — CATCH
   Random name roller with purpose + count + group
═══════════════════════════════════════════════ */
function initCatch() {
  const overlay   = qs('#catch-overlay');
  const openBtns  = qsa('.catch-open-btn');
  const closeBtn  = qs('#catch-close');
  const rollBtn   = qs('#catch-roll-btn');
  const resetBtn  = qs('#catch-reset-btn');
  const checkList = qs('#catch-checklist');
  const selAll    = qs('#catch-sel-all');
  const selNone   = qs('#catch-sel-none');
  const countInput= qs('#catch-count');
  const purposeInput = qs('#catch-purpose');
  const resultArea = qs('#catch-result');
  const drumEl    = qs('#catch-drum');

  if (!overlay) return;

  /* ── Build checklist ── */
  MEMBERS_LIST.forEach(({ roll, name }) => {
    const label = document.createElement('label');
    label.className = 'catch-check-label';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = roll;
    cb.checked = true;
    cb.className = 'catch-checkbox';
    cb.dataset.name = name;

    const span = document.createElement('span');
    span.className = 'catch-check-text';

    const rollSpan = document.createElement('span');
    rollSpan.className = 'catch-check-roll';
    rollSpan.textContent = roll.toString().padStart(2, '0');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'catch-check-name';
    nameSpan.textContent = name;

    span.appendChild(rollSpan);
    span.appendChild(nameSpan);
    label.appendChild(cb);
    label.appendChild(span);
    checkList.appendChild(label);
  });

  /* ── Open / close ── */
  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      resetCatch();
    });
  });

  function closeOverlay() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOverlay();
  });

  /* ── Select all / none ── */
  selAll.addEventListener('click', () => {
    checkList.querySelectorAll('.catch-checkbox').forEach(cb => cb.checked = true);
    updateSelectedCount();
  });
  selNone.addEventListener('click', () => {
    checkList.querySelectorAll('.catch-checkbox').forEach(cb => cb.checked = false);
    updateSelectedCount();
  });
  checkList.addEventListener('change', updateSelectedCount);

  function updateSelectedCount() {
    const n = checkList.querySelectorAll('.catch-checkbox:checked').length;
    qs('#catch-sel-count').textContent = n + ' selected';
  }
  updateSelectedCount();

  /* ── Reset UI ── */
  function resetCatch() {
    resultArea.classList.remove('show');
    resultArea.innerHTML = '';
    drumEl.textContent   = '';
    drumEl.classList.remove('show');
    rollBtn.disabled = false;
    rollBtn.textContent = 'Roll';
    resetBtn.style.display = 'none';
  }

  resetBtn.addEventListener('click', resetCatch);

  /* ── Drum roll animation ── */
  function drumRoll(pool, finalPicks, duration, onDone) {
    const allNames   = pool.map(p => p.name);
    const frameMs    = 60;
    const frames     = Math.floor(duration / frameMs);
    let   frame      = 0;
    drumEl.classList.add('show');

    const iv = setInterval(() => {
      frame++;
      // Pick random display names during roll
      const showing = [];
      for (let i = 0; i < finalPicks.length; i++) {
        showing.push(allNames[Math.floor(Math.random() * allNames.length)]);
      }
      drumEl.textContent = showing.join('   ·   ');

      if (frame >= frames) {
        clearInterval(iv);
        drumEl.textContent = finalPicks.map(p => p.name).join('   ·   ');
        onDone();
      }
    }, frameMs);
  }

  /* ── Count +/- buttons ── */
  qs('#count-inc').addEventListener('click', () => {
    const max = checkList.querySelectorAll('.catch-checkbox:checked').length;
    const cur = parseInt(countInput.value) || 1;
    if (cur < max) countInput.value = cur + 1;
  });
  qs('#count-dec').addEventListener('click', () => {
    const cur = parseInt(countInput.value) || 1;
    if (cur > 1) countInput.value = cur - 1;
  });

  /* ── Roll logic ── */
  rollBtn.addEventListener('click', () => {
    const checked = [...checkList.querySelectorAll('.catch-checkbox:checked')];
    if (!checked.length) {
      shakeEl(rollBtn);
      return;
    }

    const count = Math.max(1, Math.min(parseInt(countInput.value) || 1, checked.length));
    const pool  = checked.map(cb => ({
      roll: Number(cb.value),
      name: cb.dataset.name
    }));

    const purpose = purposeInput.value.trim();

    // Fisher-Yates shuffle → take first `count`
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picks = shuffled.slice(0, count);

    rollBtn.disabled = true;
    resultArea.classList.remove('show');
    resultArea.innerHTML = '';

    drumRoll(pool, picks, 2200, () => {
      setTimeout(() => {
        drumEl.classList.remove('show');
        renderResult(picks, purpose);
      }, 300);
    });
  });

  /* ── Render final result ── */
  function renderResult(picks, purpose) {
    resultArea.innerHTML = '';

    /* Cards for each caught person */
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'catch-result-cards';

    picks.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'catch-result-card';
      card.style.animationDelay = (i * 120) + 'ms';

      const rollBadge = document.createElement('span');
      rollBadge.className = 'catch-res-roll';
      rollBadge.textContent = p.roll.toString().padStart(2, '0');

      const nameTxt = document.createElement('span');
      nameTxt.className = 'catch-res-name';
      nameTxt.textContent = p.name;

      card.appendChild(rollBadge);
      card.appendChild(nameTxt);
      cardsWrap.appendChild(card);
    });

    /* Verdict line */
    const verdict = document.createElement('p');
    verdict.className = 'catch-verdict';
    const nameList = picks.map(p => p.name).join(', ');
    const haveText = picks.length === 1 ? 'has' : 'have';
    verdict.innerHTML = purpose
      ? `<em>${nameList}</em> ${haveText} been caught for <span class="catch-purpose-highlight">${purpose}</span>.`
      : `<em>${nameList}</em> ${haveText} been caught.`;

    resultArea.appendChild(cardsWrap);
    resultArea.appendChild(verdict);
    resultArea.classList.add('show');

    resetBtn.style.display = 'inline-flex';
    rollBtn.disabled = false;
    rollBtn.textContent = 'Roll Again';
  }

  /* ── Shake utility ── */
  function shakeEl(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
  }
}

/* ═══════════════════════════════════════════════
   13 · MOBILE NAV DRAWER
═══════════════════════════════════════════════ */
function initMobileNav() {
  const hamburger = qs('#nav-hamburger');
  const drawer    = qs('#nav-drawer');
  const backdrop  = qs('#nav-backdrop');
  const closeBtn  = qs('#nav-close');
  if (!hamburger || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Animate hamburger → X
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = 'translateY(6px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Restore hamburger bars
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }

  hamburger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Close on any drawer link click
  drawer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });
}

/* ═══════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  buildRoster();
  initCursor();
  initNavScroll();
  initBannerTilt();
  initHeroGear();
  initCodaGear();
  initCatch();
  initMobileNav();
  initPreloader(); // runs last — controls timing
});
