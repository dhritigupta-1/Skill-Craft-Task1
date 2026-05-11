/* =====================================================================
   LUMINARY — script.js  v2 (3D Edition)
   ─ Nav scroll + progress + active link + mobile drawer
   ─ Hero multi-layer parallax (different Z speeds per element)
   ─ Mouse-tracking 3D card tilt + shine reflection
   ─ Scroll-driven rotateX section entrances
   ─ Ripple on nav click  |  Logo easter egg
   ===================================================================== */

(function () {
  'use strict';

  /* ── Selectors ─────────────────────────────────────────────────── */
  const nav         = document.getElementById('main-nav');
  const progress    = document.getElementById('nav-progress');
  const hamburger   = document.getElementById('nav-hamburger');
  const mobileMenu  = document.getElementById('nav-mobile-menu');
  const navLinks    = Array.from(document.querySelectorAll('.nav__link'));
  const mobileLinks = Array.from(document.querySelectorAll('.nav__mobile-link'));
  const sections    = Array.from(document.querySelectorAll('section[id]'));
  const contactForm = document.getElementById('contact-form');
  const contactOk   = document.getElementById('contact-success');

  /* ── Constants ─────────────────────────────────────────────────── */
  const SCROLL_THRESHOLD = 80;
  const TILT_MAX         = 14;   // max degrees of tilt for cards
  const TILT_SCALE       = 1.04; // uniform scale on hover
  const MOBILE_BREAK     = 768;

  /* ─────────────────────────────────────────────────────────────────
     1.  NAV SCROLL + PROGRESS BAR
  ───────────────────────────────────────────────────────────────── */
  function onScroll () {
    const scrollY = window.scrollY;
    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const pct     = docH > 0 ? (scrollY / docH) * 100 : 0;

    nav.classList.toggle('scrolled', scrollY > SCROLL_THRESHOLD);
    progress.style.width = pct + '%';

    updateActiveLink(scrollY);
    updateParallax(scrollY);
  }

  /* ─────────────────────────────────────────────────────────────────
     2.  ACTIVE LINK (scroll-position fallback)
  ───────────────────────────────────────────────────────────────── */
  function updateActiveLink (scrollY) {
    let currentSection = scrollY < SCROLL_THRESHOLD ? 'hero' : '';

    sections.forEach(sec => {
      const top    = sec.offsetTop - window.innerHeight * 0.4;
      const bottom = top + sec.offsetHeight;
      if (scrollY >= top && scrollY < bottom) currentSection = sec.id;
    });

    navLinks.forEach(link => {
      const matches = link.dataset.section === currentSection;
      link.classList.toggle('active', matches);
      link.setAttribute('aria-current', matches ? 'page' : 'false');
    });

    mobileLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === currentSection);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     3.  HERO MULTI-LAYER PARALLAX  (3D depth via translateY + scale)
  ───────────────────────────────────────────────────────────────── */
  const heroOrb1    = document.querySelector('.hero__orb--1');
  const heroOrb2    = document.querySelector('.hero__orb--2');
  const heroGrid    = document.querySelector('.hero__bg-grid');
  const heroContent = document.querySelector('.hero__content');
  const heroHint    = document.querySelector('.hero__scroll-hint');

  function updateParallax (scrollY) {
    if (window.innerWidth <= MOBILE_BREAK) return;

    const y = scrollY;

    /* Each layer moves at its own speed — slower = closer (foreground) */
    if (heroGrid)    heroGrid.style.transform    = `translateY(${y * 0.18}px)`;
    if (heroOrb1)    heroOrb1.style.transform    = `translateY(${y * 0.30}px) scale(${1 + y * 0.0003})`;
    if (heroOrb2)    heroOrb2.style.transform    = `translateY(${-y * 0.22}px) scale(${1 + y * 0.0002})`;
    if (heroContent) heroContent.style.transform = `translateY(${y * 0.08}px)`;
    if (heroHint)    heroHint.style.opacity      = Math.max(0, 1 - y / 200);
  }

  /* ─────────────────────────────────────────────────────────────────
     4.  SCROLL-DRIVEN 3D SECTION ENTRANCES  (rotateX → flat)
  ───────────────────────────────────────────────────────────────── */
  const sectionEls = document.querySelectorAll('.section:not(.section--hero)');

  sectionEls.forEach(sec => sec.classList.add('section-3d'));

  const entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entranceObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.04, rootMargin: '0px 0px -30px 0px' }
  );

  sectionEls.forEach(sec => entranceObserver.observe(sec));

  /* ─────────────────────────────────────────────────────────────────
     5.  ACTIVE LINK — Intersection Observer (primary driver)
  ───────────────────────────────────────────────────────────────── */
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            const matches = link.dataset.section === id;
            link.classList.toggle('active', matches);
            link.setAttribute('aria-current', matches ? 'page' : 'false');
          });
          mobileLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    {
      rootMargin: `-${Math.round(window.innerHeight * 0.35)}px 0px -${Math.round(window.innerHeight * 0.35)}px 0px`,
      threshold: 0
    }
  );

  sections.forEach(sec => sectionObserver.observe(sec));

  /* ─────────────────────────────────────────────────────────────────
     6.  3D MOUSE-TRACKING CARD TILT + SHINE
  ───────────────────────────────────────────────────────────────── */
  const tiltTargets = document.querySelectorAll(
    '.about__card, .feature, .pricing__card'
  );

  /* Add shine div & tilt-card class to each */
  tiltTargets.forEach(card => {
    card.classList.add('tilt-card');
    const shine = document.createElement('div');
    shine.className = 'tilt-shine';
    card.appendChild(shine);
  });

  function lerp (a, b, t) { return a + (b - a) * t; }

  /* Per-card state for smooth lerp */
  const cardState = new Map();

  tiltTargets.forEach(card => {
    cardState.set(card, { rx: 0, ry: 0, targetRx: 0, targetRy: 0, raf: null });
  });

  function animateTilt (card) {
    const state = cardState.get(card);
    const shine = card.querySelector('.tilt-shine');

    state.rx = lerp(state.rx, state.targetRx, 0.12);
    state.ry = lerp(state.ry, state.targetRy, 0.12);

    const dist    = Math.hypot(state.rx, state.ry);
    const scaleTo = state.hovering ? TILT_SCALE : 1;
    state.scale   = lerp(state.scale ?? 1, scaleTo, 0.1);

    card.style.transform =
      `perspective(800px) rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale3d(${state.scale},${state.scale},${state.scale})`;

    /* Update shine position based on tilt direction */
    const shineX = 50 + state.ry * 2;
    const shineY = 50 - state.rx * 2;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,${0.08 + dist * 0.006}) 0%, transparent 65%)`;
    }

    /* Keep animating until settled */
    const settled =
      Math.abs(state.rx - state.targetRx) < 0.01 &&
      Math.abs(state.ry - state.targetRy) < 0.01 &&
      Math.abs((state.scale ?? 1) - scaleTo) < 0.001;

    if (!settled) {
      state.raf = requestAnimationFrame(() => animateTilt(card));
    } else {
      state.raf = null;
    }
  }

  function startTiltAnimation (card) {
    const state = cardState.get(card);
    if (!state.raf) {
      state.raf = requestAnimationFrame(() => animateTilt(card));
    }
  }

  tiltTargets.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= MOBILE_BREAK) return;

      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);

      const state     = cardState.get(card);
      state.targetRx  = -dy * TILT_MAX;   // pulling toward mouse vertically
      state.targetRy  =  dx * TILT_MAX;   // tilting toward mouse horizontally
      state.hovering  = true;
      startTiltAnimation(card);
    });

    card.addEventListener('mouseleave', () => {
      const state    = cardState.get(card);
      state.targetRx = 0;
      state.targetRy = 0;
      state.hovering = false;
      startTiltAnimation(card);
    });

    /* Touch: reset on touch start */
    card.addEventListener('touchstart', () => {
      const state    = cardState.get(card);
      state.targetRx = 0;
      state.targetRy = 0;
      state.hovering = false;
    }, { passive: true });
  });

  /* ─────────────────────────────────────────────────────────────────
     7.  HERO MOUSE MOVE — subtle scene tilt (mouse tracks Z rotation)
  ───────────────────────────────────────────────────────────────── */
  const heroSection = document.getElementById('hero');
  let heroMouseState = { rx: 0, ry: 0, targetRx: 0, targetRy: 0, raf: null };

  function animateHeroTilt () {
    heroMouseState.rx = lerp(heroMouseState.rx, heroMouseState.targetRx, 0.06);
    heroMouseState.ry = lerp(heroMouseState.ry, heroMouseState.targetRy, 0.06);

    if (heroContent) {
      heroContent.style.transform =
        `perspective(1200px) rotateX(${heroMouseState.rx}deg) rotateY(${heroMouseState.ry}deg) translateY(${window.scrollY * 0.08}px)`;
    }

    const settled =
      Math.abs(heroMouseState.rx - heroMouseState.targetRx) < 0.005 &&
      Math.abs(heroMouseState.ry - heroMouseState.targetRy) < 0.005;

    if (!settled) {
      heroMouseState.raf = requestAnimationFrame(animateHeroTilt);
    } else {
      heroMouseState.raf = null;
    }
  }

  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= MOBILE_BREAK) return;

      const rect = heroSection.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      const dx   = (e.clientX - rect.left - cx) / cx;
      const dy   = (e.clientY - rect.top  - cy) / cy;

      heroMouseState.targetRx = -dy * 4;
      heroMouseState.targetRy =  dx * 4;

      if (!heroMouseState.raf) {
        heroMouseState.raf = requestAnimationFrame(animateHeroTilt);
      }
    });

    heroSection.addEventListener('mouseleave', () => {
      heroMouseState.targetRx = 0;
      heroMouseState.targetRy = 0;
      if (!heroMouseState.raf) {
        heroMouseState.raf = requestAnimationFrame(animateHeroTilt);
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     8.  SCROLL REVEAL (Intersection Observer) — unchanged
  ───────────────────────────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  const revealTargets = document.querySelectorAll(
    '.hero__content, .section__label, .section__title, .section__subtitle'
  );

  revealTargets.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* Stagger grids — ONLY outside section-3d to avoid opacity:0 conflict */
  document.querySelectorAll('.about__cards, .features__grid, .pricing__cards')
          .forEach(el => {
            if (!el.closest('.section-3d')) {
              el.classList.add('reveal-stagger');
            }
          });

  /* ─────────────────────────────────────────────────────────────────
     9.  MOBILE HAMBURGER MENU
  ───────────────────────────────────────────────────────────────── */
  function toggleMobileMenu () {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  }

  function closeMobileMenu () {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  hamburger.addEventListener('click', toggleMobileMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) closeMobileMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileMenu(); });

  /* ─────────────────────────────────────────────────────────────────
     10. CONTACT FORM MOCK SUBMIT
  ───────────────────────────────────────────────────────────────── */
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled    = true;

      setTimeout(() => {
        contactForm.reset();
        btn.textContent  = 'Send Message';
        btn.disabled     = false;
        contactOk.hidden = false;
        setTimeout(() => { contactOk.hidden = true; }, 4000);
      }, 1200);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     11. NAV LINK RIPPLE EFFECT
  ───────────────────────────────────────────────────────────────── */
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `@keyframes rippleAnim { to { transform:scale(1); opacity:0; } }`;
    document.head.appendChild(style);
  }

  navLinks.forEach(link => {
    link.style.position = 'relative';
    link.style.overflow = 'hidden';

    link.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect   = link.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 1.5;

      Object.assign(ripple.style, {
        position:     'absolute',
        width:        size + 'px',
        height:       size + 'px',
        left:         (e.clientX - rect.left - size / 2) + 'px',
        top:          (e.clientY - rect.top  - size / 2) + 'px',
        background:   'rgba(159,103,255,0.18)',
        borderRadius: '50%',
        transform:    'scale(0)',
        pointerEvents:'none',
        animation:    'rippleAnim 0.5s ease forwards'
      });

      link.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* ─────────────────────────────────────────────────────────────────
     12. LOGO RAINBOW EASTER EGG
  ───────────────────────────────────────────────────────────────── */
  const logoIcon = document.querySelector('.nav__logo-icon');
  let logoClicks = 0;
  let logoTimer;

  if (logoIcon) {
    if (!document.getElementById('logo-rainbow-style')) {
      const s = document.createElement('style');
      s.id = 'logo-rainbow-style';
      s.textContent = `
        @keyframes logoRainbow {
          0%   { filter: hue-rotate(0deg)   drop-shadow(0 0 8px #7c3aed); }
          50%  { filter: hue-rotate(180deg) drop-shadow(0 0 8px #06b6d4); }
          100% { filter: hue-rotate(360deg) drop-shadow(0 0 8px #f59e0b); }
        }`;
      document.head.appendChild(s);
    }

    logoIcon.addEventListener('click', () => {
      logoClicks++;
      clearTimeout(logoTimer);
      if (logoClicks >= 5) {
        logoIcon.style.animation = 'logoRainbow 1s linear infinite';
        logoClicks = 0;
      }
      logoTimer = setTimeout(() => {
        logoClicks = 0;
        logoIcon.style.animation = '';
      }, 3000);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     13. BINDING & INIT
  ───────────────────────────────────────────────────────────────── */
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

})();
