# Arquitectura

## Visión general

Aplicación Next.js (App Router) monolítica pero **modular por capas**, para
poder extraer piezas a servicios separados el día que haga falta (CRM, ERP,
inventario, pagos, envíos, chatbot) sin reescribir lo existente:

```
┌─────────────────────────────────────────────────────────────┐
│  Portal público            │  Panel administrativo (/admin)  │
│  src/app/(public)/**       │  src/app/admin/**                │
│  src/components/{ui,...}   │  src/components/admin/**         │
└───────────────┬─────────────────────────┬────────────────────┘
                │                         │
                ▼                         ▼
          Server Actions (mutaciones) + consultas de solo lectura
                │
                ▼
        src/lib/**  (capa de dominio: validación zod, WhatsApp,
                      CSV, autenticación, consultas Prisma)
                │
                ▼
        src/lib/prisma.ts  (PrismaClient + @prisma/adapter-pg)
                │
                ▼
              PostgreSQL
```

Ambas mitades del portal (pública y administrativa) comparten exactamente la
misma base de datos, el mismo esquema Prisma y las mismas funciones de
`src/lib/**` — no hay una API HTTP intermedia ni una capa de "API pública":
las Server Actions y los Server Components llaman directamente a Prisma
dentro del proceso de Next.js. Esto es deliberado para el tamaño actual del
proyecto (menos piezas, menos latencia); si en el futuro se necesita una API
para un cliente externo (app móvil, integraciones), la capa `src/lib/**` ya
está separada de la capa de presentación y se puede envolver en Route
Handlers (`app/api/**`) sin duplicar lógica de negocio.

## Los 9 módulos del proyecto

1. **Portal público y experiencia visual** — `src/app/(public)/layout.tsx`,
   `src/components/{ui,layout}`. Mobile-first, con identidad provisional
   controlada por `SiteSettings` (ver más abajo).
2. **Catálogo de productos** — `src/lib/products.ts` (consultas con
   filtros/orden/paginación), `src/app/(public)/producto/[slug]`,
   `src/app/admin/productos/**` (alta/edición/carga masiva).
3. **Categorías, subcategorías, filtros y buscador** — `Category` es
   auto-referenciada (`parentId`); el servidor impone **dos niveles**
   (categoría → subcategoría) al crear o mover una categoría (ver
   `src/app/admin/categorias/actions.ts`); `src/lib/categories.ts` arma el árbol y también aplana subárboles enteros
   para que un filtro por categoría incluya sus subcategorías.
4. **Campañas temáticas dinámicas** — `Campaign` + relación m:n con
   `Category` (categorías priorizadas) y relación 1:n con `Product`
   (productos de la campaña). Solo una campaña puede tener `isActive: true`
   a la vez; se aplica de forma transaccional (ver
   `src/app/admin/campanas/actions.ts`).
5. **Carrito de pedidos (sin pago)** — ver la sección dedicada más abajo.
6. **Seguimiento de solicitudes y carritos abandonados** —
   `src/app/admin/solicitudes/**`, `src/app/admin/carritos-abandonados/**`,
   `src/lib/admin/{requests,carts}.ts`.
7. **Panel administrativo** — `src/app/admin/**`, protegido por
   `src/proxy.ts` (chequeo optimista de sesión) + `requireUser`/`requireRole`
   en cada página y Server Action (chequeo real contra la base de datos).
8. **Gestión de usuarios, roles y permisos** — modelo `User` con enum
   `Role` (`ADMIN` | `SALES`); ver la sección de permisos más abajo.
9. **SEO, rendimiento, analítica y accesibilidad** — metadatos dinámicos por
   página (`generateMetadata`), JSON-LD (`Product`, `WebSite`/`SearchAction`),
   `sitemap.ts`/`robots.ts` (dinámicos: leen la URL pública en cada petición,
   ver `src/lib/site-url.ts`), indicadores básicos en el dashboard
   (`src/lib/admin/dashboard.ts`). Operación: `/healthz` (sin base de datos,
   para Render y monitores) y `src/instrumentation.ts` (en producción el
   servidor no arranca sin `AUTH_SECRET` válida ni `DATABASE_URL`).

## Autenticación y permisos

- **Sesión**: JWT firmado con `HS256` (librería `jose`), guardado en una
  cookie `httpOnly`, `sameSite=lax`, `secure` en producción
  (`src/lib/auth/session.ts`). El payload solo lleva `sub` (id de usuario),
  `role`, `name` y `sessionVersion` (se compara con la base de datos en cada
  petición: subirlo cierra todas las sesiones de esa persona) — nunca datos
  sensibles.
- **Login/logout**: Server Actions en `src/lib/auth/actions.ts`, formulario
  en `src/components/auth/login-form.tsx`. Las contraseñas se guardan
  con `bcryptjs` (12 rondas).
- **Chequeo optimista** (`src/proxy.ts`, antes `middleware.ts` en Next < 16):
  solo verifica que la cookie exista y la firma sea válida, para redirigir
  rápido a `/login` sin tocar la base de datos en cada request. **Nunca** es
  la única barrera.
- **Chequeo real** (`src/lib/auth/dal.ts`): `requireUser()` confirma contra
  la base de datos que el usuario existe y sigue activo (`active: true`);
  `requireRole(["ADMIN"])` además exige el rol. Se llama al inicio de *cada*
  página de `/admin` y de *cada* Server Action de mutación — nunca se confía
  solo en que el layout ya validó, porque un Server Action es alcanzable por
  POST directo aunque no se muestre el botón en la UI.
- **Permisos por rol**:
  - `ADMIN`: acceso total (productos, categorías, campañas, usuarios,
    ajustes, solicitudes, carritos).
  - `SALES` (equipo de ventas): solo panel, solicitudes y carritos
    (abandonados/activos) — exactamente lo que pide el enunciado
    ("solicitudes, clientes autorizados, seguimiento, estados y notas").
    La barra lateral (`src/components/admin/sidebar-nav.tsx`) oculta las
    demás secciones, pero la protección real está en `requireRole` de cada
    página/acción, no en la UI.
  - Un usuario no puede desactivarse a sí mismo ni quitarse el rol de
    `ADMIN` a sí mismo (`src/app/admin/usuarios/actions.ts`), para evitar
    quedarse bloqueado por accidente.

## Carrito de pedidos, sesión anónima y carritos abandonados

No hay pagos ni cuentas de cliente. El modelo tiene tres piezas:

1. **`CartSession`** (identificada por una cookie anónima, no autenticada):
   representa "lo que hay en el carrito de un visitante ahora mismo",
   incluso si nunca llega a enviar una solicitud. Se sincroniza en segundo
   plano (`src/components/cart/cart-session-sync.tsx`, con debounce) cada
   vez que el carrito cambia en el navegador (Zustand +
   `localStorage`, `src/store/cart-store.ts`), llamando a
   `syncCartSessionAction`.
2. **`CartRequest`** ("solicitud comercial"): se crea solo cuando el
   visitante completa el formulario de contacto y acepta la política de
   datos. En ese momento se congela una *foto* de cada línea
   (`CartRequestItem`: nombre/SKU/precio en ese instante) para que el
   histórico de la solicitud no cambie si luego se edita o borra el
   producto. `CartRequest.cartSessionId` enlaza (opcionalmente) con la
   `CartSession` de origen.
3. **Detección de abandono**: una `CartSession` sin `CartRequest` asociada y
   sin actividad (`updatedAt`) en los últimos 8 días
   (`ABANDONED_CART_DAYS` en `src/lib/constants.ts`) se considera
   "abandonada" (`src/lib/admin/carts.ts`). No es un job en segundo plano:
   es un filtro de fecha aplicado en el momento de consultar
   `/admin/carritos-abandonados`, así que no hace falta cron para que
   funcione, pero tampoco hay hoy una notificación proactiva al equipo de
   ventas cuando un carrito *se vuelve* abandonado (ver
   `docs/AUDIT_LOOP_2.md`, sección de pendientes).

Al enviar la solicitud, el servidor **nunca confía en los datos del
carrito que manda el navegador** más allá del `productId` + talla/color/
cantidad: `src/lib/cart/resolve-items.ts` vuelve a consultar el producto
real (nombre, SKU, precio, y descarta productos ocultos o eliminados) antes
de construir el `CartRequestItem` y el mensaje de WhatsApp.

## WhatsApp: dos enlaces distintos, dos direcciones

- **Cliente → MPM** (`src/lib/whatsapp.ts#buildCartRequestMessage` +
  `buildWhatsAppLink`): al enviar la solicitud, se genera un
  `https://wa.me/<número de MPM>?text=...` con el detalle estructurado del
  pedido. Lo abre el cliente desde la pantalla de confirmación.
- **MPM → cliente** (`buildAdvisorWhatsAppLink`): en el detalle de una
  solicitud (`/admin/solicitudes/[id]`), el botón "Abrir WhatsApp con el
  cliente" genera `https://wa.me/<teléfono del cliente>?text=...` con un
  saludo inicial ya redactado, para que el asesor solo tenga que darle
  "enviar". Esta es la vía de "notificar al equipo de ventas" que pide el
  enunciado: no hay hoy un correo/webhook automático (ver
  `docs/AUDIT_LOOP_2.md`), pero la solicitud aparece de inmediato en
  `/admin/solicitudes` y el propio cliente suele completar el contacto por
  WhatsApp al enviar el formulario.

## Identidad visual provisional

`SiteSettings` es una fila única (`id = "default"`) con nombre del sitio,
colores, logo, textos del banner de inicio, mensaje de WhatsApp, redes,
texto del pie de página y el texto de política de datos. El layout raíz
(`src/app/layout.tsx`) inyecta los tres colores como variables CSS
(`--brand-primary`, `--brand-secondary`, `--brand-accent`) leídas en cada
request; Tailwind v4 las expone como utilidades (`bg-brand-primary`, etc.)
vía `@theme inline` en `globals.css`. Cambiar la identidad (mientras no haya
logo/dominio definitivo de MPM) es editar `/admin/ajustes` — no requiere
tocar código ni volver a desplegar.

## Extensibilidad futura (sin reestructurar)

- **Inventario/stock real**: hoy `Product.status` es un estado manual
  (disponible/bajo pedido/agotado/oculto). Se puede añadir una tabla
  `Stock`/`Variant` por talla-color sin tocar el resto del modelo.
- **Pagos**: el carrito ya modela líneas con precio de referencia
  (`priceRefSnapshot`); conectar una pasarela sería agregar un `Order` que
  referencie un `CartRequest` confirmado, sin tocar `CartSession`/`Product`.
- **CRM/ERP**: `CartRequest`, `CartRequestEvent` y `User` (equipo de ventas)
  ya tienen la forma de un mini-CRM; se pueden exponer vía Route Handlers
  para sincronizar con un CRM externo.
- **Chatbot**: `src/lib/whatsapp.ts` centraliza toda la construcción de
  mensajes; un webhook de WhatsApp Business API entrante se integraría ahí
  mismo sin duplicar lógica.
