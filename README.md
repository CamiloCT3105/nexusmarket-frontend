# NexusMarket — Frontend

Interfaz web de **NexusMarket**, el marketplace que conecta compradores y vendedores. Consume la API del repositorio [`nexusmarket-backend`](https://github.com/CamiloCT3105/nexusmarket-backend).

[![CI](https://github.com/CamiloCT3105/nexusmarket-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/CamiloCT3105/nexusmarket-frontend/actions/workflows/ci.yml)

## Estado actual

| Módulo                                                                                                | Estado |
| ----------------------------------------------------------------------------------------------------- | ------ |
| Inicio de sesión y registro de compradores (con documento de identidad)                               | ✅     |
| Sesión con rol y rutas protegidas                                                                     | ✅     |
| Inicio de cada rol con sus módulos                                                                    | ✅     |
| Catálogo: búsqueda, filtros, orden, paginación y visibilidad por rol                                  | ✅     |
| Detalle de producto con variantes                                                                     | ✅     |
| Tema claro / oscuro                                                                                   | ✅     |
| Comprador: perfil y direcciones                                                                       | ✅     |
| Comprador: carrito y checkout                                                                         | ✅     |
| Comprador: pedidos (pago simulado, factura y seguimiento del envío)                                   | ✅     |
| Comprador: facturas imprimibles                                                                       | ✅     |
| Comprador: devoluciones y reembolsos                                                                  | ✅     |
| Vendedor: productos, variantes y estado                                                               | ✅     |
| Vendedor: bodegas e inventario (ingresos y unidades dañadas)                                          | ✅     |
| Vendedor: pedidos con sus productos y devoluciones (aprobar / rechazar)                               | ✅     |
| Operador logístico: envíos (crear, despachar, entregar) con seguimiento                               | ✅     |
| Operador logístico: inventario y bodegas de todo el marketplace                                       | ✅     |
| Administrador: usuarios (crear, bloquear, cambiar rol) y cuentas de vendedor                          | ✅     |
| Administrador: pedidos, facturación, devoluciones y reembolsos                                        | ✅     |
| Administrador: bodegas (crear, reasignar), envíos y moderación de productos                           | ✅     |
| Reportes: resumen, ventas por periodo, inventario con bajo stock, logística y devoluciones            | ✅     |
| Supervisor: consulta de pedidos, envíos, inventario, devoluciones, usuarios y facturas (sin acciones) | ✅     |

## Pantallas del comprador

| Ruta                         | Pantalla                                                            |
| ---------------------------- | ------------------------------------------------------------------- |
| `/perfil`                    | Datos de la cuenta, perfil de comprador y direcciones               |
| `/carrito`                   | Carrito con cantidades, resumen y confirmación del pedido           |
| `/pedidos`                   | Pedidos con filtro por estado                                       |
| `/pedidos/:id`               | Detalle: progreso, pago, factura, envío y solicitud de devoluciones |
| `/facturas`, `/facturas/:id` | Facturas; el detalle se puede imprimir o guardar como PDF           |
| `/devoluciones`              | Devoluciones y reembolsos                                           |

Flujo: **completar perfil → agregar al carrito → confirmar pedido → pagar** → (el administrador emite la factura y el operador logístico despacha y entrega) → **solicitar devolución** → (el vendedor la aprueba y se genera el reembolso).

## Pantallas del vendedor

| Ruta                       | Pantalla                                                                        |
| -------------------------- | ------------------------------------------------------------------------------- |
| `/productos`               | Sus productos en cualquier estado, con búsqueda y filtro                        |
| `/productos/nuevo`         | Crear producto (se publica de inmediato)                                        |
| `/productos/:id`           | Estado (publicar, suspender, descontinuar), variantes e inventario por bodega   |
| `/inventario`              | Existencias por bodega, ingresos y unidades dañadas; pestaña de bodegas propias |
| `/pedidos`, `/pedidos/:id` | Pedidos con sus productos: solo sus líneas y su parte del total                 |
| `/devoluciones`            | Devoluciones de sus productos, con aprobación o rechazo                         |

Flujo: (el administrador lo habilita como vendedor) → **crear bodega → crear producto → registrar ingreso** → el comprador compra → **revisar devoluciones**.

## Pantallas del operador logístico

| Ruta          | Pantalla                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `/envios`     | Pedidos pagados por despachar (crear envío) y envíos por estado                                           |
| `/envios/:id` | Guía, contenido con bodega de origen, historial y siguiente paso (despachar / confirmar entrega) con nota |
| `/inventario` | Existencias en cualquier bodega, ingresos y unidades dañadas; pestaña con todas las bodegas               |

Flujo: pedido pagado → **crear envío** (En preparación, con guía `NX-…`) → **despachar** (En tránsito: el pedido pasa a Enviado y las unidades salen del inventario) → **confirmar entrega** (Entregado). Cada paso puede llevar una nota que el comprador ve en su pedido.

## Pantallas del administrador

| Ruta                         | Pantalla                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/usuarios`                  | Usuarios con búsqueda y filtros por rol y estado                                                                                       |
| `/usuarios/nuevo`            | Crear usuario de cualquier rol con contraseña inicial                                                                                  |
| `/usuarios/:id`              | Bloquear / desbloquear, cambiar rol; vendedor: habilitar cuenta, bodegas y productos; comprador: dirección, estado comercial y pedidos |
| `/pedidos`, `/pedidos/:id`   | Todos los pedidos (filtro por estado y comprador); el detalle genera la factura y muestra envío y devoluciones                         |
| `/facturas`, `/facturas/:id` | Todas las facturas, con los datos del cliente                                                                                          |
| `/devoluciones`              | Solicitudes de cualquier vendedor (aprobar / rechazar) y reembolsos por pagar (marcar como completados)                                |
| `/inventario`                | Lo mismo que el operador logístico, más crear bodegas (marketplace o de un vendedor) y reasignarlas                                    |
| `/envios`                    | Las mismas pantallas del operador logístico                                                                                            |
| `/catalogo/:id`              | Moderación: publicar, suspender o descontinuar cualquier producto                                                                      |

Flujo para incorporar un vendedor: **crear usuario** con rol Vendedor → **habilitar como vendedor** → **crear su bodega** → el vendedor ya puede publicar e ingresar mercancía.

## Reportes (administrador y supervisor)

| Ruta                           | Reporte                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/reportes`                    | Resumen: total facturado, pedidos, devoluciones por revisar; pedidos, usuarios y productos por estado                                 |
| `/reportes?vista=ventas`       | Ingresos, pedidos y ticket promedio en un rango de fechas (con atajos de 7 y 30 días); productos más vendidos e ingresos por vendedor |
| `/reportes?vista=inventario`   | Unidades, disponibles, dañadas y bajo stock con umbral ajustable; tabla ordenada por lo más urgente                                   |
| `/reportes?vista=logistica`    | Envíos por estado y pedidos pagados que aún no tienen envío                                                                           |
| `/reportes?vista=devoluciones` | Solicitudes por estado, reembolsos por pagar y ya pagados                                                                             |

Los filtros (fechas, umbral, "solo bajo stock") viven en la URL, como en el resto de la app.

## Pantallas del supervisor

El supervisor ve las mismas pantallas que el administrador (`/pedidos`, `/envios`, `/inventario`, `/devoluciones`, `/usuarios`, `/facturas`) **en modo consulta**: sin crear, aprobar, despachar, facturar, bloquear ni moderar. El backend tampoco se lo permite; la interfaz simplemente no muestra esas acciones.

## Stack

| Tecnología                | Uso                                                            |
| ------------------------- | -------------------------------------------------------------- |
| React 19 + TypeScript 5.9 | Interfaz (TypeScript estricto, igual que el backend)           |
| Vite 8                    | Servidor de desarrollo y compilación                           |
| React Router 8            | Rutas y protección por rol                                     |
| TanStack Query 5          | Llamadas a la API, caché y paginación                          |
| Tailwind CSS 4            | Estilos, con la paleta definida como variables                 |
| lucide-react              | Íconos                                                         |
| Inter + Space Grotesk     | Tipografías (incluidas en el proyecto, sin depender de Google) |
| Vitest + Testing Library  | Pruebas unitarias y de componentes                             |
| Playwright                | Pruebas de punta a punta contra el backend real                |
| ESLint + Prettier         | Calidad del código y formato uniforme                          |

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

| Variable       | Descripción     | Por defecto             |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | URL del backend | `http://localhost:3000` |

## Scripts

| Comando                 | Qué hace                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo con recarga instantánea (puerto 5173). |
| `npm run build`         | Revisa los tipos y compila a `dist/`.                         |
| `npm run preview`       | Sirve la versión compilada para probarla.                     |
| `npm run typecheck`     | Solo revisa los tipos.                                        |
| `npm run lint`          | Revisa la calidad del código con ESLint.                      |
| `npm run format`        | Da formato a todo el código con Prettier.                     |
| `npm test`              | Pruebas unitarias y de componentes (Vitest).                  |
| `npm run test:coverage` | Lo mismo, con reporte de cobertura en `coverage/`.            |
| `npm run test:e2e`      | Pruebas de punta a punta (Playwright). Ver "Pruebas".         |
| `npm run check`         | Tipos, lint, formato y pruebas: lo mismo que revisa la CI.    |

## Pruebas

**Unitarias y de componentes** (`src/**/*.test.ts(x)`, Vitest + Testing Library, sin backend): validaciones, cliente HTTP (filtros, token, errores, sesión vencida), guardias de ruta por rol, gráficos de reportes, confirmaciones, el formulario de inventario (solo productos del dueño de la bodega) y las devoluciones en modo consulta del supervisor.

**De punta a punta** (`e2e/`, Playwright): recorre la plataforma como lo haría una persona, con varias sesiones en el navegador:

1. El **comprador** se registra, completa su perfil, agrega una dirección de oficina, compra eligiéndola como dirección de entrega (se reserva la unidad) y paga.
2. El **administrador** genera la factura y el comprador la ve.
3. El **operador logístico** ve a dónde entregar, crea el envío, lo despacha (la unidad sale del inventario) y confirma la entrega.
4. El comprador ve su pedido entregado, y cada rol queda fuera de las pantallas que no le corresponden.
5. El **administrador** restringe comercialmente al comprador: conserva su carrito pero no puede confirmar; al quitar la restricción vuelve a poder.

Los datos (vendedor habilitado, bodega, producto con stock y operador) se crean por la API con un sufijo único en cada ejecución, así no dependen de datos previos. Necesitan un backend de **desarrollo o pruebas** (nunca producción):

```bash
# Con el backend corriendo (npm run dev en nexusmarket-backend)
E2E_API_URL=http://localhost:3000 E2E_ADMIN_EMAIL=<admin> E2E_ADMIN_PASSWORD=<clave> npm run test:e2e
```

El administrador es el que el backend crea al arrancar (`ADMIN_EMAIL` / `ADMIN_PASSWORD` de su `.env`). Si falta alguna variable, las pruebas se omiten con un aviso. Si algo falla, `npx playwright show-report` abre el reporte con capturas y la traza de cada paso.

## Integración continua

En cada PR y en cada cambio a `main`, GitHub Actions (`.github/workflows/ci.yml`) ejecuta:

1. **Calidad:** tipos, ESLint, formato, pruebas unitarias con cobertura y build de producción.
2. **Punta a punta:** levanta PostgreSQL y MongoDB vacíos, descarga y arranca el backend (rama `main`), y corre Playwright. El administrador y el secreto JWT se generan al azar en cada ejecución, así que no hay credenciales guardadas en el repositorio. Si falla, el reporte y el registro del backend quedan como artefacto.

## Paleta de colores

Negros, grises y blancos como base; **morado** como color de marca y **verde** como acento. Para que convivan se usa la regla **60-30-10**:

| Proporción | Color                                     | Para qué se usa                                                     |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 60 %       | Neutros (negro `#09090b`, grises, blanco) | Fondos, tarjetas, texto                                             |
| 30 %       | Morado (`#7c3aed`, `#b79dfb` en oscuro)   | Botón principal, navegación activa, enlaces, etiquetas de categoría |
| 10 %       | Verde (`#059669`, `#6ee7b7` en oscuro)    | Estados positivos: publicado, éxito, confirmaciones                 |

Reglas:

- Morado y verde saturados **nunca** van uno encima del otro ni del mismo tamaño. Se juntan solo en el degradado del logo.
- Cada color tiene un **rol**, no un uso decorativo: un botón morado siempre es "la acción principal"; algo verde siempre es "está bien".
- Los colores son variables CSS (`src/index.css`) con versión clara y oscura. Los componentes usan los nombres de rol (`bg-brand`, `text-accent-fg`, `text-muted`…), nunca un color fijo, así el cambio de tema es automático.
- El texto blanco sobre el morado de los botones cumple el contraste AA de accesibilidad.

## Estructura

```
.github/workflows/  # Integración continua
e2e/                # Pruebas de punta a punta (Playwright)
src/
├── api/            # Cliente HTTP (token, errores) y llamadas por módulo
├── auth/           # Sesión, guardias de ruta y configuración de roles
├── components/
│   └── ui/         # Botón, campos, tarjeta, etiqueta, alerta, paginación…
├── features/       # Piezas de cada módulo: catálogo, comprador, pedidos, vendedor (inventario), logística, administrador, reportes
├── layouts/        # Estructura con sesión (barra superior) y sin sesión (acceso)
├── lib/            # Utilidades: formato de moneda y fechas, clases, debounce
├── pages/          # Una pantalla por ruta (pages/buyer, pages/seller, pages/logistics, pages/admin, pages/reports)
├── theme/          # Tema claro/oscuro
├── index.css       # Paleta y estilos base
├── main.tsx        # Punto de entrada
├── test/           # Utilidades de pruebas (render con sesión, datos y rutas)
└── router.tsx      # Rutas (las pantallas de cada rol se cargan por separado)
```

## Decisiones

- **Las pantallas de cada rol se cargan por separado** (`lazy` en `router.tsx`): acceso, inicio y catálogo van en el paquete principal; el resto se descarga al abrirlo. El paquete principal bajó de 541 kB a 384 kB.
- **Formato automático con Prettier** (más el orden de clases de Tailwind) y **ESLint con reglas de tipos**: por ejemplo, exige marcar con `void` las promesas que no se esperan a propósito (`void navigate(...)`).
- **Dependencias de desarrollo:** `npm audit` reporta un aviso moderado en `minimatch` (usado solo por ESLint al buscar archivos). No llega al código que se publica; la corrección exige versiones de ESLint publicadas hace pocos días, así que se actualizará cuando estén asentadas.
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
- **Dirección de entrega en el pedido:** en el carrito el comprador elige a cuál de sus direcciones se envía (principal por defecto) y el pedido guarda una copia. El operador logístico la ve en cada envío ("Entregar en"), igual que el comprador, el administrador y la factura; el vendedor no la recibe. Los pedidos anteriores a este dato lo indican.
- **Las facturas no se generan solas al pagar:** las emite el administrador desde el detalle del pedido (así lo define el backend).
- **El administrador no puede bloquearse ni cambiarse el rol a sí mismo,** para no quedarse sin acceso. El backend no lo impide; lo evita la interfaz.
- **Bloquear, cambiar rol, completar un reembolso, reasignar una bodega o moderar un producto piden confirmación.** El cambio de rol aplica de inmediato porque el backend lee el rol actual en cada petición.
- **Un comprador restringido comercialmente no puede confirmar pedidos** (así lo define la especificación): conserva su acceso y su carrito, y el carrito le explica por qué no puede continuar.
- **Reasignar una bodega no cambia el dueño de lo que ya tiene guardado:** la interfaz lo advierte y lo recomienda para bodegas vacías o mal asignadas.
- **Con muchas secciones (administrador y supervisor), la barra completa aparece desde 1280 px** y sin el enlace "Inicio" (el logo lleva ahí); en pantallas menores se usa el menú.
- **Gráficos sin librería:** barras horizontales de una sola serie en morado (el color marca magnitud, no categorías), con la etiqueta y el valor siempre en texto y el detalle (participación sobre el total) al pasar el cursor o enfocar la fila. Lo que es una sola cifra se muestra como tarjeta, no como gráfico.
- **"Productos más vendidos" se ordena por unidades,** igual que el backend; los ingresos de cada producto aparecen en el detalle.
- **Las fechas del reporte de ventas se interpretan en UTC en el backend:** un pedido hecho de noche en Colombia (después de las 7 p. m.) cuenta para el día siguiente.
- **Supervisor en modo consulta con un solo hook (`useIsSupervisor`):** cada acción se oculta donde se dibuja, así las pantallas del administrador sirven para los dos roles sin duplicarlas.
- **Al imprimir una factura** se ocultan la barra y los botones y se usa siempre la paleta clara.
- **Sin imágenes de producto** (el backend aún no las guarda): cada producto muestra una ilustración según su tipo.
