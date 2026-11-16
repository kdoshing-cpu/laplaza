# Despliegue

## Opción A — Sitio estático

Sirve `index.html`, `carta.html`, `creditos.html`, `styles.css`, `carta.css`, `reviews.css`, `script.js`, `reviews.js` y la carpeta `assets/`.

Funciona en GitHub Pages, Netlify, Cloudflare Pages o cualquier hosting estático. En este modo el formulario de reseñas usa `localStorage`: cada visitante ve únicamente sus propias reseñas.

## Opción B — Node.js con reseñas compartidas

Requisitos:

- Node.js 18 o superior.
- Disco persistente para `data/reviews.json`.
- Variable `PORT` opcional (por defecto `8080`).

Comando de inicio:

```bash
npm start
```

El servidor sirve el sitio y expone:

- `GET /api/reviews`
- `POST /api/reviews`

### Render / Railway / Fly.io / VPS

1. Conecta el repositorio de GitHub.
2. Usa `npm start` como comando de inicio.
3. Monta un volumen persistente en `data/`.
4. Configura el puerto que entregue la plataforma mediante `PORT`.

Sin un volumen persistente, las reseñas se perderán al reiniciar el servicio.

## GitHub Pages

El repositorio incluye `.github/workflows/pages.yml`, que construye un artefacto estático con las páginas, estilos, scripts y `assets/`.

1. En GitHub, ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Haz push a `main` o ejecuta el workflow **Deploy static site to GitHub Pages** desde la pestaña Actions.
4. La URL del proyecto será `https://TU-USUARIO.github.io/la-plaza-delivery/`.

GitHub Pages no ejecuta `server.js` ni la API `/api/reviews`. El formulario de reseñas detecta la ausencia de la API y cambia automáticamente a modo local (`localStorage`). Para reseñas compartidas, despliega la Opción B en un hosting Node con disco persistente.

## Checklist antes de publicar

- [ ] Confirmar precios y disponibilidad de productos.
- [ ] Confirmar dirección y horarios.
- [ ] Revisar enlaces de Instagram y WhatsApp.
- [ ] Probar el formulario en escritorio y móvil.
- [ ] Verificar que `data/reviews.json` no esté en Git.
- [ ] Ejecutar `npm run check`.
