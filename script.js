/* ============================================================
   Aditya Verma — Portfolio Engine
   Cinematic Cosmic / Gravitational Time System
   ============================================================ */

(function particleEngine() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ---- 1. WebGL & Scene Setup ----
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.set(0, 0, 620);

  const isMobile = window.innerWidth < 760;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COUNT = isMobile ? 2400 : 5000;
  const SCALE = isMobile ? 0.72 : 1;

  // ---- 2. High-Precision Glow Texture Generator ----
  function createCosmicSprite() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const center = size / 2;

    const g = ctx.createRadialGradient(center, center, 0, center, center, center);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.2, 'rgba(255, 236, 190, 0.85)');
    g.addColorStop(0.5, 'rgba(217, 178, 106, 0.35)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const sprite = createCosmicSprite();

  // ---- 3. Math Helpers ----
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

  // ---- 4. Procedural Celestial Shape Generators ----

  // 4a. Hourglass (Time Flow & Sand Kinetics)
  function shapeHourglass(topFrac) {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const R = 150 * SCALE, H = 190 * SCALE;
    const nTop = Math.floor(COUNT * topFrac);

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, b;
      if (i < nTop) {
        const t = Math.pow(Math.random(), 0.55);
        const rad = t * R * rand(0.85, 1.0);
        const theta = rand(0, Math.PI * 2);
        const rr = rad * Math.sqrt(Math.random());
        x = Math.cos(theta) * rr;
        z = Math.sin(theta) * rr;
        y = t * H + gauss() * 4;
        b = 0.35 + t * 0.5 + Math.random() * 0.15;
      } else {
        const localT = (i - nTop) / (COUNT - nTop || 1);
        const spread = 0.4 + Math.pow(localT, 1.4) * 1.3;
        const rad = R * spread * Math.sqrt(Math.random()) * (0.5 + 0.5 * (1 - topFrac));
        const theta = rand(0, Math.PI * 2);
        x = Math.cos(theta) * rad;
        z = Math.sin(theta) * rad;
        y = -H * (0.15 + localT * 0.55) + gauss() * 5;
        b = 0.3 + (1 - localT) * 0.55 + Math.random() * 0.15;
      }
      // Falling Stream Thread
      if (Math.random() < 0.035) {
        x = gauss() * 2.5; z = gauss() * 2.5; y = rand(-H * 0.55, H * 0.55);
        b = 0.9 + Math.random() * 0.1;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i] = Math.min(1, b);
    }
    return { pos, col };
  }

  // 4b. Constellation / Node Volume
  function shapeConstellation() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const hubs = 7;
    const hubPos = [];
    for (let h = 0; h < hubs; h++) {
      hubPos.push([rand(-150, 150) * SCALE, rand(-100, 100) * SCALE, rand(-90, 90) * SCALE]);
    }
    for (let i = 0; i < COUNT; i++) {
      const hub = hubPos[i % hubs];
      const spread = 48 * SCALE;
      const x = hub[0] + gauss() * spread;
      const y = hub[1] + gauss() * spread;
      const z = hub[2] + gauss() * spread * 0.8;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      const d = Math.sqrt(x * x + y * y + z * z) / (180 * SCALE);
      col[i] = Math.max(0.2, 1 - d * 0.7) * (0.6 + Math.random() * 0.4);
    }
    return { pos, col };
  }

  // 4c. Lattice / Matrix Grid
  function shapeGrid() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const cols = 16, rows = 10, depth = 6;
    const spacingX = 24 * SCALE, spacingY = 24 * SCALE, spacingZ = 20 * SCALE;
    for (let i = 0; i < COUNT; i++) {
      const cx = i % cols;
      const cy = Math.floor(i / cols) % rows;
      const cz = Math.floor(i / (cols * rows)) % depth;
      pos[i * 3] = (cx - cols / 2) * spacingX + gauss() * 3;
      pos[i * 3 + 1] = (cy - rows / 2) * spacingY + gauss() * 3;
      pos[i * 3 + 2] = (cz - depth / 2) * spacingZ + gauss() * 3 - 20;
      col[i] = 0.35 + Math.random() * 0.5;
    }
    return { pos, col };
  }

  // 4d. Astronomical Clock Face
  function shapeClock() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const R = 155 * SCALE;
    const nRing = Math.floor(COUNT * 0.6);
    const nHourHand = Math.floor(COUNT * 0.16);
    const nMinHand = Math.floor(COUNT * 0.16);
    let idx = 0;

    for (; idx < nRing; idx++) {
      const tickIndex = idx % 60;
      const isHour = tickIndex % 5 === 0;
      const angle = (tickIndex / 60) * Math.PI * 2 - Math.PI / 2;
      const len = isHour ? rand(12, 18) : rand(4, 8);
      const rad = R - Math.random() * len;
      pos[idx * 3] = Math.cos(angle) * rad + gauss() * 2;
      pos[idx * 3 + 1] = Math.sin(angle) * rad + gauss() * 2;
      pos[idx * 3 + 2] = gauss() * 5;
      col[idx] = isHour ? 0.85 + Math.random() * 0.15 : 0.35 + Math.random() * 0.3;
    }
    const hourAngle = -Math.PI / 2 + Math.PI * 0.55;
    for (let k = 0; k < nHourHand; k++, idx++) {
      const rad = Math.random() * R * 0.55;
      pos[idx * 3] = Math.cos(hourAngle) * rad + gauss() * 2.5;
      pos[idx * 3 + 1] = Math.sin(hourAngle) * rad + gauss() * 2.5;
      pos[idx * 3 + 2] = gauss() * 4;
      col[idx] = 0.55 + (rad / (R * 0.55)) * 0.4;
    }
    const minAngle = -Math.PI / 2 + Math.PI * 1.15;
    for (let k = 0; k < nMinHand; k++, idx++) {
      const rad = Math.random() * R * 0.85;
      pos[idx * 3] = Math.cos(minAngle) * rad + gauss() * 2.5;
      pos[idx * 3 + 1] = Math.sin(minAngle) * rad + gauss() * 2.5;
      pos[idx * 3 + 2] = gauss() * 4;
      col[idx] = 0.6 + (rad / (R * 0.85)) * 0.4;
    }
    for (; idx < COUNT; idx++) {
      const rad = Math.random() * R * 0.9;
      const angle = rand(0, Math.PI * 2);
      pos[idx * 3] = Math.cos(angle) * rad;
      pos[idx * 3 + 1] = Math.sin(angle) * rad;
      pos[idx * 3 + 2] = gauss() * 10;
      col[idx] = 0.1 + Math.random() * 0.2;
    }
    return { pos, col };
  }

  // 4e. Planetary Orbit Planes
  function shapeOrbits() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const rings = [65, 110, 155, 200];
    for (let i = 0; i < COUNT; i++) {
      const ringI = i % rings.length;
      const R = rings[ringI] * SCALE;
      const angle = rand(0, Math.PI * 2);
      const jitter = gauss() * 3.5;
      const tilt = 0.35 * (ringI % 2 === 0 ? 1 : -1);
      const x = Math.cos(angle) * (R + jitter);
      const yFlat = Math.sin(angle) * (R + jitter);
      pos[i * 3] = x;
      pos[i * 3 + 1] = yFlat * Math.cos(tilt);
      pos[i * 3 + 2] = yFlat * Math.sin(tilt);
      col[i] = 0.3 + Math.random() * 0.55;
    }
    return { pos, col };
  }

  // 4f. Solar Starburst Core
  function shapeStarburst() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const r = Math.pow(Math.random(), 0.38) * 175 * SCALE;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.6;
      col[i] = Math.max(0.15, 1 - r / (175 * SCALE)) * (0.6 + Math.random() * 0.4);
    }
    return { pos, col };
  }

  // 4g. High-Density Nucleus
  function shapeCore() {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const r = Math.pow(Math.random(), 1.8) * 50 * SCALE;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      col[i] = Math.max(0.35, 1 - r / (50 * SCALE));
    }
    return { pos, col };
  }

  const shapes = [
    shapeHourglass(0.62),    // 0: Home
    shapeHourglass(0.18),    // 1: About (Drain)
    shapeConstellation(),    // 2: Skills
    shapeGrid(),             // 3: Projects
    shapeClock(),            // 4: Experience
    shapeOrbits(),           // 5: Education
    shapeStarburst(),        // 6: Achievements
    shapeCore()              // 7: Contact
  ];

  // ---- 5. Buffer Assembly & Material ----
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  positions.set(shapes[0].pos);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colorAttr = new Float32Array(COUNT * 3);
  const baseGold = new THREE.Color('#d9b26a');
  const baseBright = new THREE.Color('#fff3d6');
  const goldR = baseGold.r, goldG = baseGold.g, goldB = baseGold.b;
  const dR = baseBright.r - goldR, dG = baseBright.g - goldG, dB = baseBright.b - goldB;

  for (let i = 0; i < COUNT; i++) {
    const b = shapes[0].col[i];
    colorAttr[i * 3] = goldR + dR * b;
    colorAttr[i * 3 + 1] = goldG + dG * b;
    colorAttr[i * 3 + 2] = goldB + dB * b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

  const material = new THREE.PointsMaterial({
    size: isMobile ? 2.8 : 2.4,
    map: sprite,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    opacity: 0.88
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ---- 6. Cosmic Starfield Background ----
  const starCount = isMobile ? 350 : 800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = rand(-1000, 1000);
    starPos[i * 3 + 1] = rand(-700, 700);
    starPos[i * 3 + 2] = rand(-800, -250);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 1.5, map: sprite, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xdccba8, opacity: 0.45
  }));
  scene.add(stars);

  // ---- 7. Scroll Morph Computation ----
  let sectionOffsets = [];
  function computeOffsets() {
    const sections = document.querySelectorAll('[data-shape]');
    const total = document.documentElement.scrollHeight - window.innerHeight;
    sectionOffsets = Array.from(sections).map(s => ({
      frac: Math.max(0, s.offsetTop) / Math.max(1, total),
      idx: parseInt(s.dataset.shape, 10)
    }));
  }
  window.addEventListener('load', computeOffsets);

  let resizeDebounce;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      computeOffsets();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  });

  let targetA = 0, targetB = 0, morphT = 0;
  function updateMorphTarget() {
    if (sectionOffsets.length < 2) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const frac = total > 0 ? window.scrollY / total : 0;
    let a = sectionOffsets[0], b = sectionOffsets[sectionOffsets.length - 1];
    for (let i = 0; i < sectionOffsets.length - 1; i++) {
      if (frac >= sectionOffsets[i].frac && frac <= sectionOffsets[i + 1].frac) {
        a = sectionOffsets[i]; b = sectionOffsets[i + 1];
        const span = (b.frac - a.frac) || 1;
        morphT = (frac - a.frac) / span;
        break;
      }
    }
    targetA = a.idx; targetB = b.idx;
  }
  window.addEventListener('scroll', updateMorphTarget, { passive: true });

  // ---- 8. Inertial Cursor Physics Engine ----
  let targetMouseX = 0, targetMouseY = 0;
  let smoothMouseX = 0, smoothMouseY = 0;
  let tiltX = 0, tiltY = 0, baseSpin = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2; // Range [-1, 1]
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();

  // ---- 9. Main Render & Gravitational Animation Loop ----
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();
    updateMorphTarget();

    // Lerp cursor position for physical inertia
    smoothMouseX += (targetMouseX - smoothMouseX) * 0.06;
    smoothMouseY += (targetMouseY - smoothMouseY) * 0.06;

    const sA = shapes[targetA] || shapes[0];
    const sB = shapes[targetB] || shapes[0];
    const posArr = geometry.attributes.position.array;
    const colArr = geometry.attributes.color.array;

    // Convert smoothed cursor into 3D space projection
    const gravX = smoothMouseX * 220;
    const gravY = -smoothMouseY * 180;
    const gravRadius = 260;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Base shape morph interpolation
      const ax = sA.pos[i3], ay = sA.pos[i3 + 1], az = sA.pos[i3 + 2];
      const bx = sB.pos[i3], by = sB.pos[i3 + 1], bz = sB.pos[i3 + 2];
      let nx = ax + (bx - ax) * morphT;
      let ny = ay + (by - ay) * morphT;
      let nz = az + (bz - az) * morphT;

      if (!reducedMotion) {
        // Gravitational displacement field calculation
        const dx = nx - gravX;
        const dy = ny - gravY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < gravRadius) {
          const influence = Math.pow(1 - dist / gravRadius, 1.8);
          const push = influence * 38;
          nx += (dx / (dist || 1)) * push;
          ny += (dy / (dist || 1)) * push;
          nz += influence * 45; // Subtle depth displacement
        }

        // Idle harmonic vibration
        const phase = i * 0.15;
        nx += Math.sin(t * 0.8 + phase) * 1.2;
        ny += Math.cos(t * 0.7 + phase * 1.2) * 1.2;
      }

      posArr[i3] = nx;
      posArr[i3 + 1] = ny;
      posArr[i3 + 2] = nz;

      // Color lerp calculation
      const b = sA.col[i] + (sB.col[i] - sA.col[i]) * morphT;
      colArr[i3] = goldR + dR * b;
      colArr[i3 + 1] = goldG + dG * b;
      colArr[i3 + 2] = goldB + dB * b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    // Camera field rotation & lens tilt
    if (!reducedMotion) {
      baseSpin += 0.0008;
      stars.rotation.y += 0.0001;
    }

    tiltX += (smoothMouseY * 0.35 - tiltX) * 0.05;
    tiltY += (smoothMouseX * 0.35 - tiltY) * 0.05;

    points.rotation.x = tiltX;
    points.rotation.y = baseSpin + tiltY;

    camera.position.x += (smoothMouseX * 70 - camera.position.x) * 0.04;
    camera.position.y += (-smoothMouseY * 50 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  window.__particlesReady = true;
})();

/* ---------------------------------------------------------
   1b. RESUME FALLBACK & LINKS
--------------------------------------------------------- */
(function resumeLinks() {
  document.querySelectorAll('[data-resume-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      console.info('Resume link triggered.');
    });
  });
})();

/* ---------------------------------------------------------
   2. LOADER
--------------------------------------------------------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('done'), 600);
  }
});

/* ---------------------------------------------------------
   3. NAVIGATION INTERSECTION OBSERVER
--------------------------------------------------------- */
(function nav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
    }));
  }

  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const sideDots = document.querySelectorAll('.side-progress .dot');
  const sections = document.querySelectorAll('main section[id]');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        sideDots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => obs.observe(s));
})();

/* ---------------------------------------------------------
   4. SCROLL REVEAL ANIMATIONS
--------------------------------------------------------- */
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

/* ---------------------------------------------------------
   5. NUMERICAL STAT COUNTERS
--------------------------------------------------------- */
(function counters() {
  const nums = document.querySelectorAll('.stat .n[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1200;
      const start = performance.now();

      function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  nums.forEach(el => obs.observe(el));
})();

/* ---------------------------------------------------------
   6. SKILLS CATEGORY FILTER
--------------------------------------------------------- */
(function skillsFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.skill-card');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.classList.toggle('hidden', !show);
      });
    });
  });
})();

/* ---------------------------------------------------------
   7. BACK TO TOP BUTTON
--------------------------------------------------------- */
(function backTop() {
  const btn = document.querySelector('.back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 800);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------------------------------------------------------
   8. CONTACT FORM VALIDATION
--------------------------------------------------------- */
(function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  function setErr(id, msg) {
    const el = document.querySelector(`[data-err-for="${id}"]`);
    if (el) el.textContent = msg || '';
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    setErr('name', ''); setErr('email', ''); setErr('subject', ''); setErr('message', '');

    if (name.length < 2) { setErr('name', 'Enter your name.'); ok = false; }
    if (!validEmail(email)) { setErr('email', 'Enter a valid email address.'); ok = false; }
    if (subject.length < 2) { setErr('subject', 'Add a short subject.'); ok = false; }
    if (message.length < 10) { setErr('message', 'Message should be at least 10 characters.'); ok = false; }

    if (!ok) {
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'form-status bad';
      return;
    }

    status.textContent = 'Sending…';
    status.className = 'form-status';
    setTimeout(() => {
      status.textContent = 'Message ready — connect a backend endpoint to deliver.';
      status.className = 'form-status ok';
      form.reset();
    }, 600);
  });
})();