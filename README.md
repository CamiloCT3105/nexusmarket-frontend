# NexusMarket Frontend

[![CI](https://github.com/CamiloCT3105/nexusmarket-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/CamiloCT3105/nexusmarket-frontend/actions/workflows/ci.yml)

Interfaz web de NexusMarket, un marketplace que intermedia entre compradores y vendedores. Consume la API del repositorio [nexusmarket-backend](https://github.com/CamiloCT3105/nexusmarket-backend), donde también se encuentra la documentación de análisis y diseño del sistema.

**Demo:** [nexusmarket-frontend.vercel.app](https://nexusmarket-frontend.vercel.app) · **Estado de la API:** [nexusmarket-api.onrender.com/health](https://nexusmarket-api.onrender.com/health)

> La API se ejecuta en un plan gratuito que se suspende tras 15 minutos de inactividad. La primera petición posterior puede tardar alrededor de un minuto; la interfaz lo indica con un aviso.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Pantallas por rol](#pantallas-por-rol)
- [Tecnologías](#tecnologías)
- [Requisitos e instalación](#requisitos-e-instalación)
- [Scripts](#scripts)
- [Pruebas](#pruebas)
- [Despliegue e integración continua](#despliegue-e-integración-continua)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Diseño visual](#diseño-visual)
- [Decisiones técnicas](#decisiones-técnicas)
- [Licencia](#licencia)

## Funcionalidades

**Comunes**

- Inicio de sesión, registro de compradores y rutas protegidas por rol.
- Catálogo con búsqueda, filtros, orden y paginación; detalle de producto con variantes y foto.
- Tema claro y oscuro.

**Comprador**

- Perfil y direcciones de entrega.
- Carrito y confirmación del pedido con selección de dirección.
- Pedidos con pago simulado, factura imprimible y seguimiento del envío.
- Solicitud de devoluciones y consulta de reembolsos.

**Vendedor**

- Productos con foto, variantes y estado (publicado, suspendido, descontinuado).
- Bodegas e inventario: ingresos de mercancía y unidades dañadas.
- Pedidos que incluyen sus productos y gestión de devoluciones.

**Operador logístico**

- Creación, despacho y entrega de envíos, con historial y notas.
- Inventario y bodegas de todo el marketplace.

**Administrador**

- Usuarios (creación, bloqueo, cambio de rol) y habilitación de vendedores.
- Pedidos, facturación, devoluciones y reembolsos.
- Bodegas, envíos y moderación de productos.

**Supervisor**

- Consulta de toda la operación sin permisos de modificación.

**Reportes** (administrador y supervisor)

- Resumen general, ventas por periodo, inventario con stock bajo, logística y devoluciones.

## Pantallas por rol

### Comprador

| Ruta                         | Pantalla                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `/perfil`                    | Datos de la cuenta, perfil de comprador y direcciones                                    |
| `/carrito`                   | Carrito, resumen y confirmación del pedido                                               |
| `/pedidos`, `/pedidos/:id`   | Pedidos con filtro por estado; detalle con progreso, pago, factura, envío y devoluciones |
| `/facturas`, `/facturas/:id` | Facturas, imprimibles o exportables a PDF                                                |
| `/devoluciones`              | Devoluciones y reembolsos                                                                |

Flujo: completar el perfil, agregar productos al carrito, confirmar el pedido y pagar. El administrador emite la factura y el operador logístico despacha y entrega. Después, el comprador puede solicitar una devolución, que el vendedor aprueba o rechaza.

### Vendedor

| Ruta                       | Pantalla                                                     |
| -------------------------- | ------------------------------------------------------------ |
| `/productos`               | Productos propios en cualquier estado, con búsqueda y filtro |
| `/productos/nuevo`         | Creación de producto (se publica de inmediato)               |
| `/productos/:id`           | Foto, estado, variantes e inventario por bodega              |
| `/inventario`              | Existencias por bodega, ingresos y unidades dañadas          |
| `/pedidos`, `/pedidos/:id` | Pedidos con sus productos (solo sus líneas y su subtotal)    |
| `/devoluciones`            | Devoluciones de sus productos                                |

Flujo: una vez habilitado por el administrador, el vendedor crea su bodega, publica productos y registra el ingreso de mercancía.

### Operador logístico

| Ruta          | Pantalla                                                          |
| ------------- | ----------------------------------------------------------------- |
| `/envios`     | Pedidos pagados pendientes de envío y envíos por estado           |
| `/envios/:id` | Guía, contenido, dirección de entrega, historial y siguiente paso |
| `/inventario` | Existencias de todas las bodegas, ingresos y unidades dañadas     |

Flujo: a partir de un pedido pagado se crea el envío (en preparación, con guía `NX-…`), se despacha (en tránsito; el pedido pasa a enviado y las unidades salen del inventario) y se confirma la entrega. Cada paso admite una nota visible para el comprador.

### Administrador

| Ruta                           | Pantalla                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `/usuarios`, `/usuarios/nuevo` | Usuarios con búsqueda y filtros; creación de cuentas de cualquier rol        |
| `/usuarios/:id`                | Bloqueo, cambio de rol, habilitación de vendedor, bodegas y estado comercial |
| `/pedidos`, `/pedidos/:id`     | Todos los pedidos; emisión de facturas                                       |
| `/facturas`, `/facturas/:id`   | Todas las facturas                                                           |
| `/devoluciones`                | Solicitudes de devolución y reembolsos pendientes                            |
| `/inventario`                  | Inventario global, creación y reasignación de bodegas                        |
| `/envios`                      | Gestión de envíos                                                            |
| `/catalogo/:id`                | Moderación: cambio de estado y retiro de fotos                               |

### Reportes

| Ruta                           | Reporte                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `/reportes`                    | Total facturado, pedidos, devoluciones pendientes; pedidos, usuarios y productos por estado             |
| `/reportes?vista=ventas`       | Ingresos, pedidos y ticket promedio por rango de fechas; productos más vendidos e ingresos por vendedor |
| `/reportes?vista=inventario`   | Unidades disponibles, dañadas y con stock bajo, con umbral ajustable                                    |
| `/reportes?vista=logistica`    | Envíos por estado y pedidos pagados sin envío                                                           |
| `/reportes?vista=devoluciones` | Solicitudes por estado y reembolsos pendientes y pagados                                                |

### Supervisor

Accede a las mismas pantallas que el administrador en modo consulta: las acciones de creación, aprobación, despacho, facturación, bloqueo y moderación no se muestran, y la API tampoco las permite.

## Tecnologías

| Tecnología                                | Uso                                   |
| ----------------------------------------- | ------------------------------------- |
| React 19 y TypeScript 5.9 (modo estricto) | Interfaz                              |
| Vite 8                                    | Servidor de desarrollo y compilación  |
| React Router 8                            | Enrutamiento y protección por rol     |
| TanStack Query 5                          | Consumo de la API, caché y paginación |
| Tailwind CSS 4                            | Estilos basados en variables de tema  |
| lucide-react                              | Iconografía                           |
| Inter y Space Grotesk                     | Tipografías incluidas en el proyecto  |
| Vitest y Testing Library                  | Pruebas unitarias y de componentes    |
| Playwright                                | Pruebas de punta a punta              |
| ESLint y Prettier                         | Calidad y formato del código          |

Las versiones de las dependencias están fijadas en `package.json`.

## Requisitos e instalación

- Node.js 22.12 o superior.
- La API en ejecución (ver el README del backend), con `CORS_ORIGIN=http://localhost:5173`.

```bash
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

| Variable       | Descripción   | Valor por defecto       |
| -------------- | ------------- | ----------------------- |
| `VITE_API_URL` | URL de la API | `http://localhost:3000` |

## Scripts

| Comando                 | Descripción                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo con recarga instantánea (puerto 5173).                          |
| `npm run build`         | Verificación de tipos y compilación a `dist/`.                                         |
| `npm run preview`       | Sirve la versión compilada.                                                            |
| `npm run typecheck`     | Verificación de tipos.                                                                 |
| `npm run lint`          | Análisis estático con ESLint.                                                          |
| `npm run format`        | Formato del código con Prettier.                                                       |
| `npm test`              | Pruebas unitarias y de componentes.                                                    |
| `npm run test:coverage` | Pruebas con reporte de cobertura en `coverage/`.                                       |
| `npm run test:e2e`      | Pruebas de punta a punta con Playwright.                                               |
| `npm run check`         | Tipos, lint, formato y pruebas (las mismas verificaciones de la integración continua). |

## Pruebas

### Unitarias y de componentes

Ubicadas en `src/**/*.test.ts(x)` y ejecutadas con Vitest y Testing Library, sin depender de la API. Cubren validaciones, el cliente HTTP (filtros, token, errores y sesión vencida), los guardias de ruta por rol, los gráficos de reportes, las confirmaciones, el formulario de inventario, el modo consulta del supervisor, el aviso de reactivación del servidor y las fotos de producto.

### De punta a punta

Ubicadas en `e2e/` y ejecutadas con Playwright contra una API real, con varias sesiones de navegador:

1. El comprador se registra, completa su perfil, agrega una dirección adicional, compra con esa dirección y paga.
2. El administrador emite la factura y el comprador la consulta.
3. El operador logístico crea el envío, lo despacha y confirma la entrega.
4. El comprador ve el pedido entregado, y cada rol queda restringido a sus pantallas.
5. El administrador restringe comercialmente al comprador, que conserva su carrito pero no puede confirmar pedidos hasta que se retira la restricción.

Los datos se crean a través de la API con un sufijo único en cada ejecución. Las pruebas deben ejecutarse contra una API de desarrollo o de pruebas, nunca contra producción:

```bash
E2E_API_URL=http://localhost:3000 E2E_ADMIN_EMAIL=<correo> E2E_ADMIN_PASSWORD=<contraseña> npm run test:e2e
```

Las credenciales corresponden al administrador que la API crea al iniciar. Si falta alguna variable, las pruebas se omiten con un aviso. `npx playwright show-report` abre el reporte con capturas y trazas.

## Despliegue e integración continua

La aplicación se publica en Vercel con la configuración de [`vercel.json`](./vercel.json): compilación con Vite, redirección de todas las rutas a `index.html`, caché de un año para los recursos compilados y encabezados de seguridad. La única variable requerida es `VITE_API_URL`, que se fija durante la compilación. El procedimiento completo de la plataforma se describe en la [guía de despliegue del backend](https://github.com/CamiloCT3105/nexusmarket-backend/blob/main/DEPLOY.md).

Cada pull request y cada cambio en `main` se validan en GitHub Actions ([`ci.yml`](./.github/workflows/ci.yml)):

1. **Calidad:** tipos, ESLint, formato, pruebas unitarias con cobertura y compilación de producción.
2. **Punta a punta:** se crean PostgreSQL y MongoDB efímeros, se inicia la API desde la rama `main` del backend y se ejecuta Playwright. Las credenciales se generan aleatoriamente en cada ejecución y el reporte se conserva como artefacto si alguna prueba falla.

## Estructura del proyecto

```
.github/workflows/   Integración continua
e2e/                 Pruebas de punta a punta
src/
├── api/             Cliente HTTP y servicios por módulo
├── auth/            Sesión, guardias de ruta y roles
├── components/ui/   Componentes base (botones, campos, tarjetas, alertas, paginación)
├── features/        Componentes por módulo: catálogo, comprador, pedidos, vendedor, logística, administración, reportes
├── layouts/         Estructuras con y sin sesión
├── lib/             Utilidades de formato, validación y estilos
├── pages/           Una pantalla por ruta, agrupadas por rol
├── test/            Utilidades de pruebas
├── theme/           Tema claro y oscuro
├── index.css        Paleta y estilos base
├── main.tsx         Punto de entrada
└── router.tsx       Rutas con carga diferida por rol
```

## Diseño visual

La paleta usa neutros como base, morado como color de marca y verde como acento, en una proporción 60-30-10:

| Proporción | Color                                        | Uso                                                      |
| ---------- | -------------------------------------------- | -------------------------------------------------------- |
| 60 %       | Neutros (`#09090b`, grises, blanco)          | Fondos, tarjetas y texto                                 |
| 30 %       | Morado (`#7c3aed`; `#b79dfb` en tema oscuro) | Acción principal, navegación activa, enlaces y etiquetas |
| 10 %       | Verde (`#059669`; `#6ee7b7` en tema oscuro)  | Estados positivos y confirmaciones                       |

- Cada color cumple un rol semántico: el morado identifica la acción principal y el verde, un estado correcto.
- Los colores se definen como variables CSS con versión clara y oscura (`src/index.css`); los componentes usan nombres de rol (`bg-brand`, `text-muted`) en lugar de valores fijos.
- El texto blanco sobre el morado de los botones cumple el nivel de contraste AA.

## Decisiones técnicas

### Arquitectura

- **Carga diferida por rol:** el inicio de sesión, el inicio y el catálogo forman el paquete principal; las pantallas de cada rol se descargan al abrirlas. El paquete principal pasó de 541 kB a 384 kB.
- **Estado del servidor con TanStack Query:** caché compartida entre pantallas; carrito, pedidos y devoluciones reutilizan la misma caché de productos.
- **Filtros en la URL:** los filtros del catálogo y de los reportes se pueden compartir, sobreviven a una recarga y funcionan con el botón Atrás.
- **Paginación común:** la API usa un único formato de página, por lo que un solo componente atiende todos los listados.
- **Una ruta, una vista por rol:** `/pedidos` y `/devoluciones` muestran la vista del comprador o la del vendedor según la sesión, lo que mantiene una navegación uniforme.
- **Modo consulta del supervisor:** un único hook (`useIsSupervisor`) oculta cada acción donde se dibuja, de modo que las pantallas del administrador sirven para ambos roles.
- **Gráficos sin librería externa:** barras horizontales de una sola serie con etiquetas y valores en texto, accesibles con teclado.

### Seguridad y sesión

- **La API aplica la seguridad:** la interfaz oculta lo que un rol no puede usar, pero cada petición se valida en el servidor.
- **Validación de la sesión al iniciar** (`GET /api/auth/me`): un bloqueo o un cambio de rol se refleja de inmediato, y un `401` durante el uso cierra la sesión.
- **Token en `localStorage`:** suficiente para el alcance del proyecto. En un entorno productivo se recomienda una cookie `HttpOnly`.
- **Validación en dos niveles:** los formularios aplican las mismas reglas que la API, pero el mensaje definitivo siempre proviene del servidor.

### Reglas de negocio en la interfaz

- **Perfil de comprador como paso previo:** la API exige un perfil con dirección para usar el carrito; la interfaz lo detecta y guía al usuario a completarlo.
- **Total del carrito informativo:** se calcula con el precio vigente; el precio definitivo lo fija la API al confirmar el pedido.
- **Dirección de entrega en el pedido:** el comprador elige la dirección al confirmar y el pedido conserva una copia, visible para el operador logístico, el administrador y en la factura; el vendedor no la recibe.
- **Facturas emitidas por el administrador,** tal como lo define la API, y no generadas automáticamente al pagar.
- **Estados pendientes:** una factura o un envío que aún no existe se muestra como pendiente, no como error.
- **Restricción comercial:** un comprador restringido conserva su acceso y su carrito, y la interfaz explica por qué no puede confirmar pedidos.
- **Confirmación de acciones irreversibles:** aprobar o rechazar devoluciones, despachar, entregar, bloquear, cambiar roles, completar reembolsos, reasignar bodegas y moderar productos.
- **Protección del administrador:** la interfaz impide que un administrador se bloquee o cambie su propio rol.
- **Bodegas de vendedor:** en una bodega de vendedor solo se pueden ingresar productos de ese vendedor.
- **Fotos de producto por URL:** el vendedor indica el enlace `https` de una imagen y obtiene una vista previa antes de guardarla. Si el producto no tiene foto o el enlace falla, se muestra una ilustración según su tipo. El administrador puede retirar una foto sin suspender el producto.
- **Fechas de reportes en UTC:** la API agrupa las ventas por día en UTC, por lo que un pedido realizado después de las 7 p. m. en Colombia se contabiliza en el día siguiente.

### Mantenimiento

- **Formato y análisis estático:** Prettier (con orden de clases de Tailwind) y ESLint con reglas basadas en tipos, que exige, por ejemplo, marcar con `void` las promesas que no se esperan intencionalmente.
- **Dependencias de desarrollo:** `npm audit` reporta un aviso moderado en `minimatch`, utilizado únicamente por ESLint. No forma parte del código publicado y se actualizará cuando la versión corregida de ESLint esté consolidada.

## Licencia

Distribuido bajo la licencia MIT. Ver [`LICENSE`](./LICENSE).

## Autor

[@CamiloCT3105](https://github.com/CamiloCT3105)
