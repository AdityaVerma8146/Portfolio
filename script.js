/* ============================================================
   Aditya Verma — Portfolio
   Particle engine (Three.js) + site interactions
   ============================================================ */

/* ---------------------------------------------------------
   1. PARTICLE FIELD — scroll-morphing shape system
   --------------------------------------------------------- */
(function particleEngine(){
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.set(0, 0, 620);

  const isMobile = window.innerWidth < 760;
  const COUNT = isMobile ? 2200 : 4600;

  // ---- soft circular sprite for glow dots ----
  function makeSprite(){
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,236,190,0.8)');
    g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  const sprite = makeSprite();

  // ---- rng helpers ----
  function rand(a, b){ return a + Math.random() * (b - a); }
  function gauss(){ // approx normal via sum of uniforms
    return (Math.random()+Math.random()+Math.random()+Math.random()-2) / 2;
  }

  const SCALE = isMobile ? 0.72 : 1;

  /* -------------------------------------------------------
     Shape generators — each returns {pos: Float32Array(N*3), col: Float32Array(N)}
     col = brightness 0..1 per particle
  --------------------------------------------------------- */

  // 1. HOME — full hourglass, sand mostly at top
  function shapeHourglass(topFrac){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const R = 150 * SCALE, H = 190 * SCALE;
    const nTop = Math.floor(COUNT * topFrac);
    for (let i = 0; i < COUNT; i++){
      let x, y, z, b;
      if (i < nTop){
        // top cone: apex at waist(y=0), widening upward to y=H
        const t = Math.pow(Math.random(), 0.55); // bias toward rim (more mass up top)
        const rad = t * R * rand(0.85, 1.0);
        const theta = rand(0, Math.PI * 2);
        const rr = rad * Math.sqrt(Math.random());
        x = Math.cos(theta) * rr;
        z = Math.sin(theta) * rr;
        y = t * H + gauss() * 4;
        b = 0.35 + t * 0.5 + Math.random() * 0.15;
      } else {
        // bottom mound: settled sand, wider & flatter at bottom
        const t = Math.pow(Math.random(), 0.6);
        const bottomFrac = 1 - topFrac;
        const localT = (i - nTop) / (COUNT - nTop || 1);
        const spread = 0.4 + Math.pow(localT, 1.4) * 1.3; // mound flattens outward
        const rad = R * spread * Math.sqrt(Math.random()) * (0.5 + 0.5*(1-topFrac));
        const theta = rand(0, Math.PI * 2);
        x = Math.cos(theta) * rad;
        z = Math.sin(theta) * rad;
        y = -H * (0.15 + localT * 0.55) + gauss() * 5;
        b = 0.3 + (1 - localT) * 0.55 + Math.random() * 0.15;
      }
      // thin falling stream through the neck
      if (Math.random() < 0.02){
        x = gauss() * 2.2; z = gauss() * 2.2; y = rand(-H*0.5, H*0.5);
        b = 0.9 + Math.random() * 0.1;
      }
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      col[i] = Math.min(1, b);
    }
    return { pos, col };
  }

  // 2. ABOUT — hourglass mostly drained (echo of the journey)
  function shapeHourglassDrain(){ return shapeHourglass(0.18); }

  // 3. SKILLS — constellation / node network volume
  function shapeConstellation(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const hubs = 6;
    const hubPos = [];
    for (let h = 0; h < hubs; h++){
      hubPos.push([rand(-140,140)*SCALE, rand(-90,90)*SCALE, rand(-80,80)*SCALE]);
    }
    for (let i = 0; i < COUNT; i++){
      const hub = hubPos[i % hubs];
      const spread = 46 * SCALE;
      const x = hub[0] + gauss() * spread;
      const y = hub[1] + gauss() * spread;
      const z = hub[2] + gauss() * spread * 0.8;
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      const d = Math.sqrt(x*x + y*y + z*z) / (180*SCALE);
      col[i] = Math.max(0.2, 1 - d * 0.7) * (0.6 + Math.random()*0.4);
    }
    return { pos, col };
  }

  // 4. PROJECTS — structured grid lattice ("building blocks")
  function shapeGrid(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const cols = 14, rows = 9, depth = 5;
    const spacingX = 26 * SCALE, spacingY = 26 * SCALE, spacingZ = 22 * SCALE;
    for (let i = 0; i < COUNT; i++){
      const cx = i % cols;
      const cy = Math.floor(i / cols) % rows;
      const cz = Math.floor(i / (cols*rows)) % depth;
      const jx = gauss() * 3, jy = gauss() * 3, jz = gauss() * 3;
      const x = (cx - cols/2) * spacingX + jx;
      const y = (cy - rows/2) * spacingY + jy;
      const z = (cz - depth/2) * spacingZ + jz - 20;
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      col[i] = 0.35 + Math.random() * 0.5;
    }
    return { pos, col };
  }

  // 5. EXPERIENCE — clock face: 60 ticks + 12 marks + two hands
  function shapeClock(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const R = 150 * SCALE;
    const nRing = Math.floor(COUNT * 0.6);
    const nHourHand = Math.floor(COUNT * 0.16);
    const nMinHand = Math.floor(COUNT * 0.16);
    let idx = 0;
    // ring ticks
    for (; idx < nRing; idx++){
      const tickIndex = idx % 60;
      const isHour = tickIndex % 5 === 0;
      const angle = (tickIndex / 60) * Math.PI * 2 - Math.PI/2;
      const len = isHour ? rand(10,16) : rand(4,7);
      const t = Math.random();
      const rad = R - t * len;
      const jitter = gauss() * 2.5;
      pos[idx*3] = Math.cos(angle) * rad + jitter;
      pos[idx*3+1] = Math.sin(angle) * rad + jitter;
      pos[idx*3+2] = gauss() * 6;
      col[idx] = isHour ? 0.8 + Math.random()*0.2 : 0.35 + Math.random()*0.3;
    }
    // hour hand (short, angled)
    const hourAngle = -Math.PI/2 + Math.PI * 0.55;
    for (let k = 0; k < nHourHand; k++, idx++){
      const t = Math.random();
      const rad = t * R * 0.55;
      pos[idx*3] = Math.cos(hourAngle) * rad + gauss()*3;
      pos[idx*3+1] = Math.sin(hourAngle) * rad + gauss()*3;
      pos[idx*3+2] = gauss() * 4;
      col[idx] = 0.55 + t * 0.4;
    }
    // minute hand (long)
    const minAngle = -Math.PI/2 + Math.PI * 1.15;
    for (let k = 0; k < nMinHand; k++, idx++){
      const t = Math.random();
      const rad = t * R * 0.85;
      pos[idx*3] = Math.cos(minAngle) * rad + gauss()*3;
      pos[idx*3+1] = Math.sin(minAngle) * rad + gauss()*3;
      pos[idx*3+2] = gauss() * 4;
      col[idx] = 0.6 + t * 0.4;
    }
    // remaining: ambient dust in the face
    for (; idx < COUNT; idx++){
      const rad = Math.random() * R * 0.9;
      const angle = rand(0, Math.PI*2);
      pos[idx*3] = Math.cos(angle) * rad;
      pos[idx*3+1] = Math.sin(angle) * rad;
      pos[idx*3+2] = gauss() * 10;
      col[idx] = 0.1 + Math.random() * 0.2;
    }
    return { pos, col };
  }

  // 6. EDUCATION — concentric orbit rings
  function shapeOrbits(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    const rings = [60, 100, 145, 185];
    for (let i = 0; i < COUNT; i++){
      const ringI = i % rings.length;
      const R = rings[ringI] * SCALE;
      const angle = rand(0, Math.PI*2);
      const jitter = gauss() * 4;
      const tilt = 0.32 * (ringI % 2 === 0 ? 1 : -1);
      const x = Math.cos(angle) * (R + jitter);
      const yFlat = Math.sin(angle) * (R + jitter);
      const y = yFlat * Math.cos(tilt);
      const z = yFlat * Math.sin(tilt);
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      col[i] = 0.3 + Math.random() * 0.55;
    }
    // sprinkle a few bright "planet" clusters
    const planets = isMobile ? 3 : 5;
    for (let p = 0; p < planets; p++){
      const start = Math.floor((p / planets) * COUNT);
      const cnt = Math.floor(COUNT * 0.02);
      const ringI = p % rings.length;
      const R = rings[ringI] * SCALE;
      const angle = rand(0, Math.PI*2);
      const cx = Math.cos(angle) * R, cy = Math.sin(angle) * R * 0.9;
      for (let k = 0; k < cnt && (start+k) < COUNT; k++){
        const idx = start + k;
        pos[idx*3] = cx + gauss()*10;
        pos[idx*3+1] = cy + gauss()*10;
        pos[idx*3+2] = gauss()*10;
        col[idx] = 0.85 + Math.random()*0.15;
      }
    }
    return { pos, col };
  }

  // 7. ACHIEVEMENTS — starburst / sparkle cluster
  function shapeBurst(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++){
      const theta = rand(0, Math.PI*2);
      const phi = Math.acos(rand(-1,1));
      const r = Math.pow(Math.random(), 0.4) * 165 * SCALE;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) * 0.6;
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      col[i] = Math.max(0.15, 1 - r/(165*SCALE)) * (0.6 + Math.random()*0.4);
    }
    return { pos, col };
  }

  // 8. CONTACT — converge to a small bright core (bookend)
  function shapeCore(){
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++){
      const theta = rand(0, Math.PI*2);
      const phi = Math.acos(rand(-1,1));
      const r = Math.pow(Math.random(), 1.8) * 46 * SCALE;
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      col[i] = Math.max(0.3, 1 - r/(46*SCALE));
    }
    return { pos, col };
  }

  const shapes = [
    shapeHourglass(0.62),   // 0 home
    shapeHourglassDrain(),  // 1 about
    shapeConstellation(),   // 2 skills
    shapeGrid(),            // 3 projects
    shapeClock(),           // 4 experience
    shapeOrbits(),          // 5 education
    shapeBurst(),           // 6 achievements
    shapeCore()             // 7 contact
  ];

  // ---- geometry / material ----
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT); // brightness, expanded to rgb in shader via material color
  const displayPos = new Float32Array(COUNT * 3);
  positions.set(shapes[0].pos);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colorAttr = new Float32Array(COUNT * 3);
  const baseGold = new THREE.Color('#d9b26a');
  const baseBright = new THREE.Color('#fff3d6');
  function applyBrightness(brightArr){
    for (let i = 0; i < COUNT; i++){
      const b = brightArr[i];
      const c = baseGold.clone().lerp(baseBright, b);
      colorAttr[i*3] = c.r; colorAttr[i*3+1] = c.g; colorAttr[i*3+2] = c.b;
    }
  }
  applyBrightness(shapes[0].col);
  geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

  const material = new THREE.PointsMaterial({
    size: isMobile ? 2.6 : 2.2,
    map: sprite,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    opacity: 0.9
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // shift the whole field toward the right on wide viewports so it reads as
  // a companion visual beside the text rather than sitting directly behind it
  function updateFieldOffset(){
    const wide = window.innerWidth > 900;
    points.position.x = wide ? window.innerWidth * 0.155 : 0;
  }
  updateFieldOffset();
  window.addEventListener('resize', updateFieldOffset);

  // ---- background starfield (static-ish) ----
  const starCount = isMobile ? 300 : 700;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++){
    starPos[i*3] = rand(-900, 900);
    starPos[i*3+1] = rand(-600, 600);
    starPos[i*3+2] = rand(-700, -200);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 1.4, map: sprite, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xdccba8, opacity: 0.5
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- scroll-driven morph ----
  let sectionOffsets = []; // cumulative fraction breakpoints
  function computeOffsets(){
    const sections = document.querySelectorAll('[data-shape]');
    const total = document.documentElement.scrollHeight - window.innerHeight;
    sectionOffsets = Array.from(sections).map(s => ({
      frac: Math.max(0, s.offsetTop) / Math.max(1, total),
      idx: parseInt(s.dataset.shape, 10)
    }));
  }
  window.addEventListener('load', computeOffsets);
  window.addEventListener('resize', computeOffsets);
  setTimeout(computeOffsets, 400);

  let targetA = 0, targetB = 0, morphT = 0;
  function updateMorphTarget(){
    if (sectionOffsets.length < 2) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const frac = total > 0 ? window.scrollY / total : 0;
    let a = sectionOffsets[0], b = sectionOffsets[sectionOffsets.length-1];
    for (let i = 0; i < sectionOffsets.length - 1; i++){
      if (frac >= sectionOffsets[i].frac && frac <= sectionOffsets[i+1].frac){
        a = sectionOffsets[i]; b = sectionOffsets[i+1];
        const span = (b.frac - a.frac) || 1;
        morphT = (frac - a.frac) / span;
        break;
      }
    }
    if (frac < sectionOffsets[0].frac){ a = b = sectionOffsets[0]; morphT = 0; }
    if (frac > sectionOffsets[sectionOffsets.length-1].frac){ a = b = sectionOffsets[sectionOffsets.length-1]; morphT = 0; }
    targetA = a.idx; targetB = b.idx;
  }
  window.addEventListener('scroll', updateMorphTarget, { passive: true });

  // mouse parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  const clock = new THREE.Clock();
  const tmpBright = new Float32Array(COUNT);

  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    updateMorphTarget();

    const sA = shapes[targetA] || shapes[0];
    const sB = shapes[targetB] || shapes[0];
    const posArr = geometry.attributes.position.array;
    const colArr = geometry.attributes.color.array;

    for (let i = 0; i < COUNT; i++){
      const ax = sA.pos[i*3], ay = sA.pos[i*3+1], az = sA.pos[i*3+2];
      const bx = sB.pos[i*3], by = sB.pos[i*3+1], bz = sB.pos[i*3+2];
      const nx = ax + (bx-ax) * morphT;
      const ny = ay + (by-ay) * morphT;
      const nz = az + (bz-az) * morphT;
      // idle jitter (living dust)
      const phase = i * 12.9898;
      const jx = Math.sin(t*0.6 + phase) * 1.6;
      const jy = Math.cos(t*0.5 + phase*1.3) * 1.6;
      posArr[i*3] = nx + jx;
      posArr[i*3+1] = ny + jy;
      posArr[i*3+2] = nz;

      const cb = sA.col[i] + (sB.col[i]-sA.col[i]) * morphT;
      tmpBright[i] = cb;
    }
    // update colors occasionally lighter-weight: every frame acceptable at this count
    for (let i = 0; i < COUNT; i++){
      const b = tmpBright[i];
      const c = baseGold.clone().lerp(baseBright, b);
      colArr[i*3] = c.r; colArr[i*3+1] = c.g; colArr[i*3+2] = c.b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    points.rotation.y += 0.0009;
    points.rotation.x += (mouseY * 0.15 - points.rotation.x) * 0.02;
    points.rotation.y += (mouseX * 0.1) * 0.001;
    stars.rotation.y += 0.00012;

    camera.position.x += (mouseX * 30 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 20 - camera.position.y) * 0.02;
    camera.lookAt(0,0,0);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // signal ready for loader
  window.__particlesReady = true;
})();


/* ---------------------------------------------------------
   2. LOADER
--------------------------------------------------------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader && loader.classList.add('done'), 700);
});

/* ---------------------------------------------------------
   3. NAVBAR — mobile toggle + active section
--------------------------------------------------------- */
(function nav(){
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu){
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
      if (entry.isIntersecting){
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        sideDots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  sections.forEach(s => obs.observe(s));
})();

/* ---------------------------------------------------------
   4. SCROLL REVEAL
--------------------------------------------------------- */
(function reveal(){
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
})();

/* ---------------------------------------------------------
   5. ANIMATED COUNTERS (About stats)
--------------------------------------------------------- */
(function counters(){
  const nums = document.querySelectorAll('.stat .n[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1200;
      const start = performance.now();
      function step(now){
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1-p, 3);
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
   6. SKILLS FILTER
--------------------------------------------------------- */
(function skillsFilter(){
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
   7. BACK TO TOP
--------------------------------------------------------- */
(function backTop(){
  const btn = document.querySelector('.back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 900);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------------------------------------------------------
   8. CONTACT FORM VALIDATION
--------------------------------------------------------- */
(function contactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  function setErr(id, msg){
    const el = document.querySelector(`[data-err-for="${id}"]`);
    if (el) el.textContent = msg || '';
  }

  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    setErr('name',''); setErr('email',''); setErr('subject',''); setErr('message','');

    if (name.length < 2){ setErr('name','Enter your name.'); ok = false; }
    if (!validEmail(email)){ setErr('email','Enter a valid email address.'); ok = false; }
    if (subject.length < 2){ setErr('subject','Add a short subject.'); ok = false; }
    if (message.length < 10){ setErr('message','Message should be at least 10 characters.'); ok = false; }

    if (!ok){
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'form-status bad';
      return;
    }

    // NOTE: no backend is wired up yet. Connect this to a service like
    // Formspree, EmailJS, or your own API endpoint to actually deliver messages.
    status.textContent = 'Sending…';
    status.className = 'form-status';
    setTimeout(() => {
      status.textContent = 'Message ready — connect a backend (e.g. Formspree/EmailJS) to deliver it. Form validated successfully.';
      status.className = 'form-status ok';
      form.reset();
    }, 700);
  });
})();
