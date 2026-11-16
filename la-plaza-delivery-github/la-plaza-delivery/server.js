const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reviews.json');
const MAX_REVIEWS = 500;
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const submissions = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

async function ensureData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ reviews: [] }, null, 2));
  }
}

async function readReviews() {
  try {
    const raw = (await fs.readFile(DATA_FILE, 'utf8')).replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);
    return Array.isArray(data.reviews) ? data.reviews : [];
  } catch {
    return [];
  }
}

async function writeReviews(reviews) {
  const temporary = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporary, JSON.stringify({ reviews }, null, 2));
  await fs.rename(temporary, DATA_FILE);
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim()
    .slice(0, maxLength);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 20_000) throw new Error('Solicitud demasiado grande.');
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function canSubmit(ip) {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  submissions.set(ip, recent);
  return true;
}

async function handleReviewsApi(request, response) {
  if (request.method === 'GET') {
    const reviews = await readReviews();
    sendJson(response, 200, { reviews });
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { error: 'Método no permitido.' });
    return;
  }

  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    sendJson(response, 415, { error: 'El contenido debe enviarse como JSON.' });
    return;
  }

  const ip = request.socket.remoteAddress || 'local';
  if (!canSubmit(ip)) {
    sendJson(response, 429, { error: 'Recibimos demasiadas reseñas desde esta conexión. Intenta más tarde.' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const name = cleanText(body.name, 40);
    const comment = cleanText(body.comment, 500);
    const rating = Number(body.rating);

    if (name.length < 2) {
      sendJson(response, 400, { error: 'Escribe tu nombre para publicar la reseña.' });
      return;
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      sendJson(response, 400, { error: 'La calificación debe ser un número entre 0 y 5.' });
      return;
    }

    if (comment.length < 5) {
      sendJson(response, 400, { error: 'Cuéntanos un poco más sobre tu experiencia.' });
      return;
    }

    const reviews = await readReviews();
    const review = {
      id: randomUUID(),
      name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    const next = [review, ...reviews].slice(0, MAX_REVIEWS);
    await writeReviews(next);
    sendJson(response, 201, { review });
  } catch (error) {
    console.error('No se pudo guardar la reseña:', error.message);
    sendJson(response, 400, { error: 'No pudimos procesar tu reseña. Revisa los datos e intenta nuevamente.' });
  }
}

async function serveStatic(request, response) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  } catch {
    response.writeHead(400);
    response.end('Solicitud inválida.');
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  if (pathname.startsWith('/data/') || pathname === '/server.js' || pathname === '/package.json') {
    response.writeHead(404);
    response.end('No encontrado.');
    return;
  }

  let filePath = path.resolve(ROOT, `.${pathname}`);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end('Acceso denegado.');
    return;
  }

  try {
    let stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stats = await fs.stat(filePath);
    }

    const extension = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath);

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('No encontrado.');
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;

    if (pathname === '/api/reviews') {
      await handleReviewsApi(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    response.end('Error interno.');
  }
});

ensureData()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`La Plaza disponible en http://localhost:${PORT}`);
      console.log('Las reseñas se guardan en data/reviews.json');
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  });
