# NexusMarket — Frontend

Interfaz web de **NexusMarket**, el marketplace que conecta compradores y vendedores. Consume la API del repositorio [`nexusmarket-backend`](https://github.com/CamiloCT3105/nexusmarket-backend).

## Estado actual

| Módulo | Estado |
|---|---|
| Inicio de sesión y registro de compradores (con documento de identidad) | ✅ |
| Sesión con rol y rutas protegidas | ✅ |
| Inicio de cada rol con sus módulos | ✅ |
| Catálogo: búsqueda, filtros, orden, paginación y visibilidad por rol | ✅ |
| Detalle de producto con variantes | ✅ |
| Tema claro / oscuro | ✅ |
| Comprador: perfil, carrito, checkout, pedidos, devoluciones | Próxima fase |
| Vendedor, operador logístico, administrador y supervisor | Próximas fases |

## Stack

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript 5.9 | Interfaz (TypeScript estricto, igual que el backend) |
| Vite 8 | Servidor de desarrollo y compilación |
| React Router 8 | Rutas y protección por rol |
| TanStack Query 5 | Llamadas a la API, caché y paginación |
| Tailwind CSS 4 | Estilos, con la paleta definida como variables |
| lucide-react | Íconos |
| Inter + Space Grotesk | Tipografías (incluidas en el proyecto, sin depender de Google) |

Todas las versiones están fijadas exactamente en `package.json`.

## Requisitos

- Node.js 22.22 o superior
- El backend en ejecución (ver su README: `npm run db:up` y `npm run dev`), con `CORS_ORIGIN=http://localhost:5173`

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # en Windows (cmd): copy .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

| Variable | Descripción | Por defecto |
|---|---|---|
| `VITE_API_URL` | URL del backend | `http://localhost:3000` |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga instantánea (puerto 5173). |
| `npm run build` | Revisa los tipos y compila a `dist/`. |
| `npm run preview` | Sirve la versión compilada para probarla. |
| `npm run typecheck` | Solo revisa los tipos. |

## Paleta de colores

Negros, grises y blancos como base; **morado** como color de marca y **verde** como acento. Para que convivan se usa la regla **60-30-10**:

| Proporción | Color | Para qué se usa |
|---|---|---|
| 60 % | Neutros (negro `#09090b`, grises, blanco) | Fondos, tarjetas, texto |
| 30 % | Morado (`#7c3aed`, `#b79dfb` en oscuro) | Botón principal, navegación activa, enlaces, etiquetas de categoría |
| 10 % | Verde (`#059669`, `#6ee7b7` en oscuro) | Estados positivos: publicado, éxito, confirmaciones |

Reglas:
- Morado y verde saturados **nunca** van uno encima del otro ni del mismo tamaño. Se juntan solo en el degradado del logo.
- Cada color tiene un **rol**, no un uso decorativo: un botón morado siempre es "la acción principal"; algo verde siempre es "está bien".
- Los colores son variables CSS (`src/index.css`) con versión clara y oscura. Los componentes usan los nombres de rol (`bg-brand`, `text-accent-fg`, `text-muted`…), nunca un color fijo, así el cambio de tema es automático.
- El texto blanco sobre el morado de los botones cumple el contraste AA de accesibilidad.

## Estructura

```
src/
├── api/            # Cliente HTTP (token, errores) y llamadas por módulo
├── auth/           # Sesión, guardias de ruta y configuración de roles
├── components/
│   └── ui/         # Botón, campos, tarjeta, etiqueta, alerta, paginación…
├── features/       # Piezas de cada módulo (catálogo: tarjeta, ilustración, etiquetas)
├── layouts/        # Estructura con sesión (barra superior) y sin sesión (acceso)
├── lib/            # Utilidades: formato de moneda y fechas, clases, debounce
├── pages/          # Una pantalla por ruta
├── theme/          # Tema claro/oscuro
├── index.css       # Paleta y estilos base
├── main.tsx        # Punto de entrada
└── router.tsx      # Rutas
```

## Decisiones

- **La seguridad la aplica el backend.** El frontend oculta lo que un rol no puede usar, pero el backend valida cada petición.
- **La sesión se confirma al abrir la app** (`GET /api/auth/me`): si un administrador bloqueó la cuenta o cambió el rol, se refleja de inmediato. Un `401` durante el uso cierra la sesión.
- **El token se guarda en `localStorage`.** Es simple y suficiente para este proyecto; en producción convendría una cookie `HttpOnly` para protegerlo de ataques XSS.
- **Los filtros del catálogo viven en la URL** (`/catalogo?q=…&tipo=…&pagina=…`): se pueden compartir, el botón atrás funciona y sobreviven a una recarga.
- **Formato de página común** de la API (`{ items, page, pageSize, total, totalPages }`): un solo componente `Pagination` para todos los listados.
- **Validación doble en formularios:** se avisa en pantalla con las mismas reglas del backend, pero el mensaje final siempre es el del servidor.
- **Sin imágenes de producto** (el backend aún no las guarda): cada producto muestra una ilustración según su tipo.
