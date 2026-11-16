(() => {
  'use strict';

  const form = document.getElementById('review-form');
  if (!form) return;

  const API_URL = '/api/reviews';
  const STORAGE_KEY = 'laplaza-reviews-v1';
  const nameInput = document.getElementById('review-name');
  const commentInput = document.getElementById('review-comment');
  const ratingInputs = Array.from(form.querySelectorAll('input[name="rating"]'));
  const ratingLabels = Array.from(form.querySelectorAll('.rating-star'));
  const zeroLabel = form.querySelector('.rating-zero');
  const ratingHint = form.querySelector('[data-rating-label]');
  const statusEl = form.querySelector('[data-review-status]');
  const modeEl = form.querySelector('[data-review-mode]');
  const submitButton = form.querySelector('.review-submit');
  const counter = form.querySelector('[data-comment-counter]');
  const listEl = document.querySelector('[data-review-list]');
  const emptyEl = document.querySelector('[data-review-empty]');
  const countEls = Array.from(document.querySelectorAll('[data-review-count]'));
  const averageEl = document.querySelector('[data-rating-average]');
  const averageStarsEl = document.querySelector('[data-average-stars]');
  const dateFormatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const floatingOrder = document.querySelector('.floating-order');
  const reviewsSection = document.querySelector('#resenas');

  let reviews = [];
  let mode = 'local';

  if (floatingOrder && reviewsSection && 'IntersectionObserver' in window) {
    const floatingObserver = new IntersectionObserver(
      ([entry]) => {
        floatingOrder.classList.toggle('floating-order--over-reviews', entry.isIntersecting);
      },
      { threshold: 0.04 }
    );
    floatingObserver.observe(reviewsSection);
  }

  function getRating() {
    const checked = ratingInputs.find((input) => input.checked);
    return checked ? Number(checked.value) : 0;
  }

  function paintRating(rating) {
    const value = Math.min(5, Math.max(0, Number(rating) || 0));
    ratingLabels.forEach((label) => {
      label.classList.toggle('is-filled', Number(label.dataset.value) <= value);
    });
    zeroLabel.classList.toggle('is-selected', value === 0);
    ratingHint.textContent = `${value} de 5 estrellas`;
  }

  function updateCounter() {
    counter.textContent = `${commentInput.value.length}/500`;
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', isError);
  }

  function clearInvalid() {
    nameInput.removeAttribute('aria-invalid');
    commentInput.removeAttribute('aria-invalid');
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
  }

  function makeStars(rating, className) {
    const wrap = document.createElement('span');
    wrap.className = className;
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', `${rating} de 5 estrellas`);

    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement('span');
      star.textContent = '★';
      star.className = i <= rating ? 'is-filled' : '';
      star.setAttribute('aria-hidden', 'true');
      wrap.appendChild(star);
    }

    return wrap;
  }

  function renderSummary() {
    countEls.forEach((el) => {
      el.textContent = String(reviews.length);
    });

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = reviews.length ? total / reviews.length : 0;
    averageEl.textContent = reviews.length ? average.toFixed(1).replace('.', ',') : '—';

    averageStarsEl.replaceChildren();
    const filled = reviews.length ? Math.round(average) : 0;
    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement('span');
      star.textContent = '★';
      star.className = i <= filled ? 'is-filled' : '';
      averageStarsEl.appendChild(star);
    }
  }

  function createReviewCard(review) {
    const article = document.createElement('article');
    article.className = 'review-card';

    const head = document.createElement('div');
    head.className = 'review-card__head';

    const avatar = document.createElement('span');
    avatar.className = 'review-card__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = (review.name.trim().charAt(0) || '?').toUpperCase();

    const author = document.createElement('div');
    author.className = 'review-card__author';

    const name = document.createElement('strong');
    name.textContent = review.name;
    const date = document.createElement('time');
    date.dateTime = review.createdAt;
    date.textContent = formatDate(review.createdAt);

    author.append(name, date);
    head.append(avatar, author);

    if (review.rating === 0) {
      const zero = document.createElement('span');
      zero.className = 'review-card__rating-zero';
      zero.textContent = '0 estrellas';
      head.appendChild(zero);
    } else {
      head.appendChild(makeStars(review.rating, 'review-card__rating'));
    }

    const comment = document.createElement('p');
    comment.className = 'review-card__comment';
    comment.textContent = review.comment;

    article.append(head, comment);
    return article;
  }

  function renderReviews() {
    listEl.replaceChildren();
    const sorted = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach((review) => {
      listEl.appendChild(createReviewCard(review));
    });

    emptyEl.hidden = sorted.length > 0;
    listEl.hidden = sorted.length === 0;
    renderSummary();
  }

  function readLocalReviews() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(stored)) return [];
      return stored.filter((review) => (
        review &&
        typeof review.name === 'string' &&
        Number.isInteger(review.rating) &&
        review.rating >= 0 &&
        review.rating <= 5 &&
        typeof review.comment === 'string' &&
        typeof review.createdAt === 'string'
      ));
    } catch {
      return [];
    }
  }

  function saveLocalReview(review) {
    const next = [review, ...readLocalReviews()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (mode === 'server') {
      modeEl.textContent = 'Tus reseñas se publican para todos los visitantes del sitio.';
    } else {
      modeEl.textContent = 'Modo local: tus reseñas se guardan solo en este navegador.';
    }
  }

  async function loadReviews() {
    if (window.location.protocol === 'file:') {
      reviews = readLocalReviews();
      setMode('local');
      renderReviews();
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('API no disponible');
      const data = await response.json();
      if (!Array.isArray(data.reviews)) throw new Error('Respuesta inválida');
      reviews = data.reviews;
      setMode('server');
    } catch {
      reviews = readLocalReviews();
      setMode('local');
    }

    renderReviews();
  }

  async function submitReview(name, rating, comment) {
    if (mode === 'server') {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment })
      });

      if (!response.ok) {
        let message = 'No pudimos publicar tu reseña. Intenta nuevamente.';
        try {
          const data = await response.json();
          if (data.error) message = data.error;
        } catch {
          // Keep the default message.
        }
        throw new Error(message);
      }

      const data = await response.json();
      reviews = [data.review, ...reviews];
    } else {
      const review = {
        id: `local-${Date.now()}`,
        name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      reviews = saveLocalReview(review);
    }

    renderReviews();

    form.reset();
    ratingInputs[0].checked = true;
    paintRating(0);
    updateCounter();
    setStatus(mode === 'server' ? '¡Gracias! Tu reseña ya está publicada.' : '¡Gracias! Tu reseña quedó guardada en este navegador.');
  }

  ratingInputs.forEach((input) => {
    input.addEventListener('change', () => {
      paintRating(input.value);
    });
  });

  commentInput.addEventListener('input', updateCounter);

  nameInput.addEventListener('input', () => nameInput.removeAttribute('aria-invalid'));
  commentInput.addEventListener('input', () => commentInput.removeAttribute('aria-invalid'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearInvalid();

    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();
    const rating = getRating();

    if (name.length < 2) {
      nameInput.setAttribute('aria-invalid', 'true');
      setStatus('Escribe tu nombre para publicar la reseña.', true);
      nameInput.focus();
      return;
    }

    if (comment.length < 5) {
      commentInput.setAttribute('aria-invalid', 'true');
      setStatus('Cuéntanos un poco más sobre tu experiencia.', true);
      commentInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    setStatus('Publicando reseña…');

    try {
      await submitReview(name, rating, comment);
    } catch (error) {
      setStatus(error.message || 'No pudimos publicar tu reseña. Intenta nuevamente.', true);
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
  });

  paintRating(0);
  updateCounter();
  loadReviews();
})();
