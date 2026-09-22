# Portal MPM

Portal web para MPM (fábrica de ropa): catálogo visual, carrito de **pedidos**
sin pasarela de pago, campañas temáticas y un panel administrativo para el
equipo de ventas. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el
detalle de módulos y [docs/DATA_MODEL.md](docs/DATA_MODEL.md) para el modelo
de datos.

> **Nota de contexto:** este proyecto se construyó con dos agentes de IA
> trabajando en paralelo sobre el mismo repositorio: uno a cargo de la capa
> de datos/backend/panel administrativo (este documento y la mayoría de
> `src/lib`, `src/app/admin`, `prisma/`), y otro a cargo de la identidad
> visual y las páginas públicas (`src/components/ui`, `layout`, `catalog`,
> `product`, `cart`, `src/app/(public)`, `globals.css`). Ambos comparten el
> mismo esquema de datos y las mismas Server Actions/consultas en `src/lib`.
> Antes de producción, alguien debe revisar como un todo la identidad visual
> resultante (colores, tipografía) — hoy es un placeholder configurable, no
> la marca definitiva de MPM.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**
- **Tailwind CSS v4**
- **PostgreSQL** vía **Prisma 7** (patrón de *driver adapters*: `@prisma/adapter-pg`)
- Autenticación propia con **JWT firmado (jose)** + `bcryptjs` — no se usó
  NextAuth/Auth.js: en el momento de construir esto, la versión de Auth.js
  disponible era beta y no tenía compatibilidad confirmada con Next.js 16
  (que renombró `middleware.ts` a `proxy.ts`); el patrón implementado es el
  que la propia documentación de Next.js recomienda para este caso.
- **Cloudinary** (opcional, se activa solo si hay credenciales) para subir
  fotos de producto; mientras tanto se pegan URLs de imagen directamente.
- **WhatsApp** vía enlaces `wa.me` estructurados (sin integración de pago).
- **Vitest** para pruebas unitarias.
- Pensado para desplegar en **Vercel**.

## Requisitos

- Node.js **22+** (hay un `.nvmrc`; hay una razón concreta, ver más abajo).
- Docker (para levantar PostgreSQL local con el `docker-compose.yml`
  incluido) — o cualquier PostgreSQL 14+ accesible.

> **¿Por qué Node 22 y no 18?** El `create-next-app` original generó un
> proyecto con Next.js 16, cuyo mínimo soportado es Node 20.9. Se usa Node 22
> (LTS) en vez de 18 por esa razón; si tu máquina tiene Node 18 por defecto,
> usa `nvm use` (hay un `.nvmrc`) antes de cualquier comando de este README.

## Puesta en marcha (desarrollo local)

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
# Genera una clave de sesión propia:
openssl rand -base64 32   # pégala en AUTH_SECRET dentro de .env

# 3. Base de datos local (PostgreSQL en Docker, puerto 5544)
docker compose up -d db

# 4. Migraciones + generación del cliente Prisma
npm run db:migrate

# 5. Datos de ejemplo (usuarios, categorías, campañas y ~300 referencias)
npm run db:seed

# 6. Servidor de desarrollo
npm run dev
```

Abre http://localhost:3000.

### Credenciales de acceso al panel (`/login`), solo para desarrollo

El seed crea dos cuentas. **Cambia estas contraseñas antes de producción**
(o bórralas y crea cuentas reales desde `/admin/usuarios` una vez tengas un
administrador con una contraseña propia):

| Rol                | Correo             | Contraseña      |
| ------------------- | ------------------- | --------------- |
| Administrador general | `admin@mpm.local` | `CambiaEsto123!` |
| Equipo de ventas    | `ventas@mpm.local`  | `CambiaEsto123!` |

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Corre la suite de Vitest una vez |
| `npm run test:watch` | Vitest en modo watch |
| `npm run db:migrate` | Aplica migraciones en desarrollo (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Aplica migraciones en producción (`prisma migrate deploy`) |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run db:reset` | ⚠️ Borra y recrea la base de datos local desde cero |

## Catálogo de datos: qué es real y qué es de demostración

- **18 referencias reales** (con fotografía) en `public/catalogo/` —
  "Damas" y "Caballero" — entregadas por MPM. Ver
  [docs/CATALOG_ASSETS.md](docs/CATALOG_ASSETS.md) para el detalle de cómo
  se importaron.
- **~288 referencias sintéticas** (nombres/tallas/colores generados,
  fotos de stock vía picsum.photos) que completan el catálogo a más de 300
  referencias, para poder probar filtros, paginación, campañas y carga
  masiva a la escala real del proyecto. **Estas deben reemplazarse** por el
  catálogo definitivo de MPM, vía carga masiva CSV (`/admin/productos/carga-masiva`)
  o cargándolas una por una desde `/admin/productos`.

Ambos grupos los crea `prisma/seed.ts` (que reutiliza `prisma/seed-helpers.ts`
para los datos sintéticos). El seed es *idempotente*: puedes volver a
correrlo sin duplicar productos (usa `upsert` por SKU/slug) y no pisa
productos que ya hayas editado manualmente desde el panel.

## Cargar el catálogo real de MPM

1. En `/admin/categorias`, crea las categorías y subcategorías que
   necesites (o usa/edita el árbol ya sembrado).
2. En `/admin/productos/carga-masiva`, descarga la plantilla CSV y complétala
   (una fila por referencia; columnas multivaluadas como tallas/colores
   separadas por `;`).
3. Sube el archivo: las filas con una categoría inexistente se reportan como
   error (no se crean a medias); las referencias (SKU) que ya existen se
   actualizan, las nuevas se crean.
4. Fotos: mientras no haya Cloudinary configurado, pega URLs de imagen ya
   alojadas (columna `fotos`, separadas por `;`). En cuanto configures
   `CLOUDINARY_*` en `.env` (ver más abajo), `src/lib/cloudinary.ts` queda
   listo para subir imágenes desde el panel sin más cambios de código.

## Variables de entorno

Ver [.env.example](.env.example) para la lista completa y comentada. Las
más importantes:

- `DATABASE_URL` — cadena de conexión PostgreSQL.
- `AUTH_SECRET` — clave para firmar la sesión del panel (`openssl rand -base64 32`).
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` —
  opcionales; el portal funciona sin ellos (se pegan URLs de imagen a mano).
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — número de respaldo; el que realmente se
  usa en producción se edita desde `/admin/ajustes` (columna `SiteSettings`
  en base de datos) y tiene prioridad sobre esta variable.
- `NEXT_PUBLIC_SITE_URL` — usado para metadatos SEO (Open Graph, sitemap,
  `robots.txt`) y JSON-LD.

## Despliegue

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para la guía completa (Vercel +
Postgres administrado + variables de entorno + primer `db:migrate:deploy` +
`db:seed`).

## Pruebas y calidad

- `npm test` corre 50 pruebas unitarias (Vitest) sobre la lógica sin efectos
  secundarios: construcción de enlaces/mensajes de WhatsApp, formateo de
  precios/fechas, generación de slugs, parseo del CSV de carga masiva,
  esquemas de validación (zod) y el store de carrito (Zustand). Las
  consultas que dependen directamente de la base de datos (`src/lib/products.ts`,
  `categories.ts`, las acciones de `/admin`) se verificaron manualmente
  navegando la aplicación real (ver docs/AUDIT_LOOP_1.md y AUDIT_LOOP_2.md);
  un siguiente paso razonable es añadir pruebas de integración contra una
  base de datos de pruebas en CI.
- `npm run typecheck` y `npm run lint` deben quedar sin errores/warnings.
- `npm run build` debe completar sin errores. Revisa la lista de rutas que
  imprime: cualquier página que dependa de datos editables desde `/admin`
  (SiteSettings, campañas, productos) debe aparecer como `ƒ` (dinámica), no
  `○` (estática) — si no usa ninguna API de request (`cookies()`,
  `searchParams`, etc.), añade `export const dynamic = "force-dynamic";`.

## Estructura del proyecto (resumen)

```
prisma/               esquema, migraciones y siembra de datos
src/app/
  (public)/           sitio público (catálogo, producto, carrito, campañas…)
  admin/              panel administrativo (protegido, ver src/proxy.ts)
  login/              inicio de sesión
src/components/
  ui, layout, catalog, product, cart, campaign, seo/   UI del sitio público
  admin/              UI del panel (kit propio, sin depender del anterior)
  auth/               formulario de login
src/lib/              capa de datos y lógica de negocio (Prisma, validación,
                      WhatsApp, CSV, autenticación, Cloudinary…)
src/store/            estado de carrito en el navegador (Zustand)
src/proxy.ts           protección de rutas /admin (reemplaza a "middleware.ts")
tests/                 pruebas Vitest
docs/                  arquitectura, modelo de datos, despliegue, seguridad,
                      bitácoras de auditoría
```
