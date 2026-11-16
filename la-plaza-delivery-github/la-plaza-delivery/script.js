(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
  });

  /* ---------- Store status in Santiago time ---------- */
  const statusFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const dayNumbers = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function getStoreState() {
    const parts = statusFormatter.formatToParts(new Date());
    const values = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') values[part.type] = part.value;
    });

    const day = dayNumbers[values.weekday] ?? new Date().getDay();
    const hours = Number(values.hour) % 24;
    const minutes = Number(values.minute);
    const nowInMinutes = hours * 60 + minutes;

    const opensAt = day === 0 ? 13 * 60 : 12 * 60 + 15;
    const closesAt = day === 0 ? 23 * 60 : 24 * 60;
    const isOpen = nowInMinutes >= opensAt && nowInMinutes < closesAt;

    let detail = '';

    if (isOpen) {
      detail = day === 0 ? 'hasta las 23:00' : 'hasta las 00:00';
    } else if (nowInMinutes < opensAt) {
      detail = day === 0 ? 'abre a las 13:00' : 'abre a las 12:15';
    } else {
      detail = 'abre mañana a las 12:15';
    }

    return {
      isOpen,
      label: isOpen ? 'Abierto ahora' : 'Cerrado ahora',
      detail
    };
  }

  function renderStoreStatus() {
    const state = getStoreState();
    body.classList.toggle('store-closed', !state.isOpen);

    document.querySelectorAll('[data-store-status]').forEach((el) => {
      el.setAttribute('aria-label', `${state.label}, ${state.detail}`);
    });

    document.querySelectorAll('[data-status-text]').forEach((el) => {
      el.textContent = state.label;
    });

    document.querySelectorAll('[data-status-detail]').forEach((el) => {
      el.textContent = state.detail;
    });
  }

  renderStoreStatus();
  window.setInterval(renderStoreStatus, 60 * 1000);

  /* ---------- Header progress + scrolled state ---------- */
  const header = document.querySelector('.site-header');
  const floatingOrder = document.querySelector('.floating-order');
  let ticking = false;

  function updateScrollUi() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(Math.max(scrollTop / scrollable, 0), 1) : 0;
    const nearPageEnd = scrollTop + window.innerHeight > document.documentElement.scrollHeight - 260;

    if (header) header.classList.toggle('is-scrolled', scrollTop > 24);
    if (floatingOrder) {
      floatingOrder.classList.toggle('is-visible', scrollTop > 620 && !nearPageEnd);
    }
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
    ticking = false;
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollUi);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollUi();

  /* ---------- Mobile navigation ---------- */
  const nav = document.getElementById('main-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a')) : [];
  const mobileQuery = window.matchMedia('(max-width: 1020px)');
  let lastFocused = null;

  function setNav(open, returnFocus = false) {
    if (!nav || !navToggle) return;

    nav.classList.toggle('is-open', open);
    body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    body.style.overflow = open ? 'hidden' : '';

    if (open) {
      lastFocused = document.activeElement;
      window.setTimeout(() => navLinks[0]?.focus(), 80);
    } else if (returnFocus) {
      (lastFocused instanceof HTMLElement ? lastFocused : navToggle).focus();
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNav(!isOpen, isOpen);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setNav(false));
  });

  document.addEventListener('keydown', (event) => {
    if (!nav || !navToggle) return;
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setNav(false, true);
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [navToggle, ...navLinks].filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) setNav(false);
  });

  /* ---------- Scroll reveal ---------- */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  document.querySelectorAll('.menu__grid, .info__grid, .catalog-grid').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--reveal-delay', `${Math.min(index * 85, 255)}ms`);
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.08 }
    );

    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Small pointer flourish on the hero ---------- */
  const hero = document.querySelector('.hero');
  const heroPhoto = document.querySelector('.hero__photo-wrap');
  if (hero && heroPhoto && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 8;

      if (!frame) {
        frame = window.requestAnimationFrame(movePhoto);
      }
    });

    hero.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      if (!frame) frame = window.requestAnimationFrame(movePhoto);
    });

    function movePhoto() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      heroPhoto.style.translate = `${currentX.toFixed(2)}px ${currentY.toFixed(2)}px`;

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        frame = window.requestAnimationFrame(movePhoto);
      } else {
        frame = 0;
      }
    }
  }

  /* ---------- Keyboard-friendly external links ---------- */
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    if (!link.getAttribute('rel')?.includes('noopener')) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
})();
