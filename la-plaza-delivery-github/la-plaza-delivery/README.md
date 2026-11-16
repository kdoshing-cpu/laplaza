# La Plaza Delivery

Sitio web de **La Plaza Delivery**, comida rápida y delivery en **Los Alerces, Labranza, Temuco, Chile**.

Landing page + carta digital + reseñas + información de horario, pagos, Junaeb y ubicación. Construido con HTML, CSS y JavaScript sin framework, y un servidor Node.js sin dependencias externas para compartir las reseñas.

![Portada de La Plaza Delivery](docs/screenshots/preview.jpg)

## Demo y ejecución

### Abrir como archivo

Abre `index.html` en el navegador. El sitio funciona completo; las reseñas se guardan en `localStorage` de ese navegador.

### Servidor local con reseñas compartidas

Requiere **Node.js 18 o superior**.

```bash
npm start
```

Abre <http://localhost:8080>.

También puedes usar el modo con recarga automática:

```bash
npm run dev
```

El puerto se puede cambiar con la variable de entorno `PORT`:

```powershell
$env:PORT=3000; npm start
```

Las reseñas se guardan en `data/reviews.json`. El archivo se crea automáticamente al iniciar el servidor y está excluido de Git para no publicar datos de usuarios.

## Funcionalidades

- Hero de marca con estado **Abierto / Cerrado** calculado en horario de Chile.
- Carta con 8 opciones, precios en CLP y menú del mes en oferta.
- Sección **Antes de pedir** con horario, medios de pago, Junaeb y ubicación.
- Formulario de reseñas con calificación de **0 a 5 estrellas**, promedio y comentarios compartidos.
- Enlaces directos a Instagram y WhatsApp.
- Imagen de ubicación de Los Alerces, Labranza, Temuco.
- Diseño responsive con navegación móvil y animaciones de entrada.
- Sin dependencias de npm: solo Node.js para el servidor de reseñas.

## Estructura

```text
.
├─ index.html              # Portada
├─ carta.html              # Carta y opciones
├─ creditos.html           # Créditos de imágenes
├─ styles.css              # Estilos globales
├─ carta.css               # Estilos de la carta
├─ reviews.css             # Estilos de reseñas
├─ script.js               # Navegación, estado y animaciones
├─ reviews.js              # Lógica de reseñas
├─ server.js               # Servidor estático + API /api/reviews
├─ data/
│  └─ .gitkeep             # reviews.json se genera en ejecución
├─ assets/
│  ├─ fonts/               # Anton, Barlow y Kaushan Script
│  └─ img/                 # Fotos, logos y mapa
├─ docs/
│  ├─ DEPLOY.md            # Guía de despliegue
│  └─ screenshots/         # Capturas del sitio
└─ .github/workflows/ci.yml
```

## Dónde editar el contenido

| Contenido | Archivo |
|---|---|
| Instagram, teléfono, horarios y textos de portada | `index.html` |
| Carta, productos y precios | `carta.html` |
| Estilos generales y variables de color | `styles.css` |
| Estilos de la carta | `carta.css` |
| Reseñas | `reviews.js`, `reviews.css`, `data/reviews.json` |
| Fotos y logos | `assets/img/` |
| Créditos y licencias de imágenes | `creditos.html` |

### Datos del negocio usados en el sitio

- **Instagram:** [@laplazadelivery](https://www.instagram.com/laplazadelivery/)
- **WhatsApp:** [+56 9 9851 9371](https://wa.me/56998519371)
- **Ubicación:** sector Los Alerces, Labranza, Temuco
- **Horario:** lunes a sábado 12:15–00:00; domingo 13:00–23:00
- **Precios:** valores de referencia en CLP; confirmar antes de publicar.

## Verificación

Antes de subir cambios:

```bash
npm run check
```

El workflow de GitHub Actions ejecuta la misma validación en cada push y pull request a `main`.

## Publicar en GitHub

El repositorio ya está inicializado localmente. Para conectarlo a tu cuenta:

1. Crea un repositorio vacío en GitHub llamado `la-plaza-delivery`.
2. Ejecuta:

```bash
git remote add origin https://github.com/TU-USUARIO/la-plaza-delivery.git
git branch -M main
git push -u origin main
```

No subas `data/reviews.json`, el ZIP de distribución ni archivos de entorno: ya están cubiertos por `.gitignore`.

### Publicar con GitHub Pages

El repositorio incluye `.github/workflows/pages.yml`, que publica automáticamente la web estática al hacer push a `main`.

1. En GitHub, entra a **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Haz push a `main` o ejecuta manualmente el workflow **Deploy static site to GitHub Pages**.
4. La web quedará en `https://TU-USUARIO.github.io/la-plaza-delivery/`.

GitHub Pages no ejecuta `server.js`: la carta, el diseño y la información funcionan, pero las reseñas se guardan en el navegador de cada visitante. Para reseñas compartidas usa la opción Node.js.

## Despliegue

El sitio puede publicarse como sitio estático, pero **las reseñas compartidas necesitan el servidor Node** y un disco persistente para `data/reviews.json`.

- **Sitio estático** (GitHub Pages, Netlify, Vercel estático): funciona la web y las reseñas locales del navegador.
- **Node.js** (Render, Railway, Fly.io o VPS): usa `npm start` y monta un volumen persistente para `data/`.

Instrucciones detalladas en [docs/DEPLOY.md](docs/DEPLOY.md).

## Créditos

Las fuentes e imágenes utilizadas están documentadas en [creditos.html](creditos.html). La foto de fachada, el logo de Junaeb y los logos de medios de pago fueron proporcionados por el negocio.

## Licencia

Proyecto privado de La Plaza Delivery. El código y la identidad visual no se distribuyen bajo una licencia abierta.
