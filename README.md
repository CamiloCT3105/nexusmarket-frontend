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
| Comprador: perfil y direcciones | ✅ |
| Comprador: carrito y checkout | ✅ |
| Comprador: pedidos (pago simulado, factura y seguimiento del envío) | ✅ |
| Comprador: facturas imprimibles | ✅ |
| Comprador: devoluciones y reembolsos | ✅ |
| Vendedor: productos, variantes y estado | ✅ |
| Vendedor: bodegas e inventario (ingresos y unidades dañadas) | ✅ |
| Vendedor: pedidos con sus productos y devoluciones (aprobar / rechazar) | ✅ |
| Operador logístico: envíos (crear, despachar, entregar) con seguimiento | ✅ |
| Operador logístico: inventario y bodegas de todo el marketplace | ✅ |
| Administrador y supervisor | Próximas fases |

## Pantallas del comprador

| Ruta | Pantalla |
|---|---|
| `/perfil` | Datos de la cuenta, perfil de comprador y direcciones |
| `/carrito` | Carrito con cantidades, resumen y confirmación del pedido |
| `/pedidos` | Pedidos con filtro por estado |
| `/pedidos/:id` | Detalle: progreso, pago, factura, envío y solicitud de devoluciones |
| `/facturas`, `/facturas/:id` | Facturas; el detalle se puede imprimir o guardar como PDF |
| `/devoluciones` | Devoluciones y reembolsos |

Flujo: **completar perfil → agregar al carrito → confirmar pedido → pagar** → (el administrador emite la factura y el operador logístico despacha y entrega) → **solicitar devolución** → (el vendedor la aprueba y se genera el reembolso).

## Pantallas del vendedor

| Ruta | Pantalla |
|---|---|
| `/productos` | Sus productos en cualquier estado, con búsqueda y filtro |
| `/productos/nuevo` | Crear producto (se publica de inmediato) |
| `/productos/:id` | Estado (publicar, suspender, descontinuar), variantes e inventario por bodega |
| `/inventario` | Existencias por bodega, ingresos y unidades dañadas; pestaña de bodegas propias |
| `/pedidos`, `/pedidos/:id` | Pedidos con sus productos: solo sus líneas y su parte del total |
| `/devoluciones` | Devoluciones de sus productos, con aprobación o rechazo |

Flujo: (el administrador lo habilita como vendedor) → **crear bodega → crear producto → registrar ingreso** → el comprador compra → **revisar devoluciones**.

## Pantallas del operador logístico

| Ruta | Pantalla |
|---|---|
| `/envios` | Pedidos pagados por despachar (crear envío) y envíos por estado |
| `/envios/:id` | Guía, contenido con bodega de origen, historial y siguiente paso (despachar / confirmar entrega) con nota |
| `/inventario` | Existencias en cualquier bodega, ingresos y unidades dañadas; pestaña con todas las bodegas |

Flujo: pedido pagado → **crear envío** (En preparación, con guía `NX-…`) → **despachar** (En tránsito: el pedido pasa a Enviado y las unidades salen del inventario) → **confirmar entrega** (Entregado). Cada paso puede llevar una nota que el comprador ve en su pedido.

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
├── features/       # Piezas de cada módulo: catálogo, comprador, pedidos, vendedor (inventario), logística
├── layouts/        # Estructura con sesión (barra superior) y sin sesión (acceso)
├── lib/            # Utilidades: formato de moneda y fechas, clases, debounce
├── pages/          # Una pantalla por ruta (pages/buyer, pages/seller, pages/logistics)
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
- **El perfil de comprador es un paso aparte.** Registrarse crea la cuenta, pero el backend exige un perfil con dirección principal para usar el carrito. El frontend lo detecta (404) y guía a `/perfil` antes de comprar.
- **Carrito, pedidos y devoluciones guardan solo ids de producto:** los nombres se consultan aparte y se reutiliza la misma caché del detalle del producto.
- **El total del carrito es informativo:** usa el precio actual del catálogo; el precio definitivo lo fija el backend al confirmar el pedido.
- **El pago es simulado** (`POST /api/orders/:id/pay`): no se pide ningún medio de pago.
- **Factura y envío pueden no existir todavía:** un 404 se muestra como "pendiente", no como error.
- **Misma ruta, pantalla por rol:** `/pedidos` y `/devoluciones` muestran la vista del comprador o la del vendedor según la sesión (`ByRole`), así la navegación es la misma para todos.
- **La cuenta de vendedor la habilita el administrador.** Mientras `GET /api/sellers/:id` responda 404, las pantallas del vendedor explican que falta ese paso.
- **El vendedor solo ve sus líneas** de cada pedido y su subtotal (lo filtra el backend). El envío lo gestiona el operador logístico.
- **Aprobar o rechazar una devolución pide confirmación:** no se puede deshacer, y aprobar reingresa el stock y genera el reembolso.
- **Despachar y entregar piden confirmación:** ninguno de los dos se puede deshacer, y despachar descuenta el inventario.
- **En una bodega de vendedor solo se ingresan productos de ese vendedor** (en las del marketplace, de cualquiera). El backend lo permite, pero el formulario evita el error.
- **El operador no ve la dirección del comprador:** el backend no le da acceso al perfil del comprador. Queda como mejora del backend.
- **Al imprimir una factura** se ocultan la barra y los botones y se usa siempre la paleta clara.
- **Sin imágenes de producto** (el backend aún no las guarda): cada producto muestra una ilustración según su tipo.
