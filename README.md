# Portal MPM

Portal web para MPM (fábrica de ropa): catálogo visual, carrito de **pedidos**
sin pasarela de pago, campañas temáticas y un panel administrativo para el
equipo de ventas. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el
detalle de módulos y [docs/DATA_MODEL.md](docs/DATA_MODEL.md) para el modelo
de datos.

El panel incluye una sección de **Diseño festivo** (`/admin/festividades`):
puede aplicar automáticamente acentos visuales discretos según el calendario
colombiano, forzar una celebración de forma manual o mantener siempre el
diseño normal. Incluye Carnaval de Negros y Blancos, Carnaval de Barranquilla,
San Juan/San Pedro/San Pablo, fiestas patrias, Amor y Amistad, Velitas y
Navidad. Las fechas se interpretan en la zona horaria de Colombia.

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
- **Cloudinary**: reservado para subir fotos de producto. `src/lib/cloudinary.ts`
  existe pero **todavía no está conectado al panel**; hoy las fotos se pegan como
  URL (o rutas `/catalogo/…` del propio sitio).
- **WhatsApp** vía enlaces `wa.me` estructurados (sin integración de pago).
- **Vitest** para pruebas unitarias.
- Desplegado en **Render** (`render.yaml` en la raíz define el servicio web
  y la base de datos administrada).

Si otro sistema desarrollado en PHP debe consumir el catálogo, usa las vistas
de solo lectura documentadas en [docs/PHP_INTEGRATION.md](docs/PHP_INTEGRATION.md).
No conectes ese sistema con la cuenta principal del portal ni con acceso a las
tablas internas.

## Requisitos

- Node.js **22.x** (hay un `.nvmrc`; `engines` en `package.json` lo fija a 22.x; hay una razón concreta, ver más abajo).
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

# 5. Catálogo real de MPM y usuarios de prueba
npm run db:seed

# 6. Servidor de desarrollo
npm run dev
```

Abre http://localhost:3000.

El acceso del equipo está disponible en `/login` y también desde el enlace
"Acceso equipo MPM" del pie de página.

### Credenciales de acceso al panel (`/login`), solo para desarrollo

Contra la base local (Docker), el seed crea dos cuentas de prueba. Contra
cualquier otra base (p. ej. la de Render) **no** las crea: exige
`SEED_ADMIN_PASSWORD` y solo crea el administrador inicial con esa contraseña
(ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

| Rol                | Correo             | Contraseña      |
| ------------------- | ------------------- | --------------- |
| Administrador general | `admin@mpm.local` | `CambiaEsto123!` |
| Equipo de ventas    | `ventas@mpm.local`  | `CambiaEsto123!` |

### Mi perfil (cada persona del equipo)

Desde `/admin/perfil`, cada administrador o vendedor ve su carga de trabajo
(solicitudes asignadas por estado y las nuevas sin asignar), edita su nombre y
**cambia su propia contraseña** (exige la actual; cierra las sesiones abiertas
en otros dispositivos y mantiene la actual). Un vendedor solo gestiona las
solicitudes y carritos que están libres o son suyos; un administrador gestiona
todos.

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Corre la suite de Vitest una vez (unitarias + integración) |
| `npm run test:unit` | Solo las unitarias (sin base de datos) |
| `npm run test:integration` | Solo las de integración (base `mpm_portal_test`) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run db:migrate` | Aplica migraciones en desarrollo (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Aplica migraciones en producción (`prisma migrate deploy`) |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` (alias: `db:seed:catalog`). Contra una base no local que ya tiene productos no reimporta el catálogo salvo `SEED_REFRESH_CATALOG=1` |
| `npm run db:test:migrate` | Aplica las migraciones a la base de pruebas `mpm_portal_test` |
| `npm run db:remove-demo-content` | Borra contenido sintético de versiones antiguas (una sola vez, a mano; nunca en el build) |
| `npm run catalog:images:webp` / `catalog:images:audit` | Convierte fotos del catálogo a WebP / audita los archivos entregados |
| `npm run db:drift` | Comprueba que las migraciones producen exactamente `schema.prisma` (requiere `SHADOW_DATABASE_URL`, una base desechable; lo corre el CI) |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run db:reset` | ⚠️ Borra y recrea la base de datos local desde cero |

## Catálogo real de MPM

- **18 referencias reales** y **360 fotografías WebP** en `public/catalogo/`:
  12 referencias de Damas y 6 de Caballero, entregadas por MPM. Ver
  [docs/CATALOG_ASSETS.md](docs/CATALOG_ASSETS.md) para el detalle de la importación.
- No se publican productos, categorías, campañas ni fotografías de stock de
  demostración. Si una base antigua aún tiene datos sintéticos de versiones
  anteriores, se retiran a mano con `npm run db:remove-demo-content` (ver
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).
- Los archivos entregados no contienen referencias de medias.

## Cargar el catálogo real de MPM

1. En `/admin/categorias`, crea las categorías y subcategorías que
   necesites (o usa/edita el árbol ya sembrado).
2. En `/admin/productos/carga-masiva`, descarga la plantilla CSV y complétala
   (una fila por referencia; columnas multivaluadas como tallas/colores
   separadas por `;`).
3. Sube el archivo (separado por comas o por punto y coma, UTF-8 o la
   codificación de Excel): las filas con una categoría o campaña inexistente,
   o con un precio/estado/público no reconocido, se reportan como error (no
   se crean a medias); las referencias (SKU) que ya existen se actualizan y
   las nuevas se crean. Al actualizar, una celda opcional vacía conserva el
   valor actual. Los precios se aceptan como `39900`, `39.900` o `$ 39.900`.
4. Fotos: pega URLs de imagen ya alojadas (columna `fotos`, separadas por
   `;`; se aceptan URLs `http(s)` completas o rutas del propio sitio como
   `/catalogo/…`). La subida directa desde el panel con Cloudinary está
   pendiente de conectar (ver `src/lib/cloudinary.ts` y docs/DEPLOYMENT.md §5).

## Variables de entorno

Ver [.env.example](.env.example) para la lista completa y comentada. Las
más importantes:

- `DATABASE_URL` — cadena de conexión PostgreSQL.
- `AUTH_SECRET` — clave para firmar la sesión del panel (`openssl rand -base64 32`).
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` —
  reservadas: todavía no las lee ninguna pantalla (ver arriba).
- El número de WhatsApp, el correo y demás datos de contacto **no** son
  variables de entorno: se editan en `/admin/ajustes` (fila `SiteSettings`).
- `NEXT_PUBLIC_SITE_URL` — usado para metadatos SEO (Open Graph, sitemap,
  `robots.txt`, URLs canónicas) y JSON-LD. En producción debe ser el dominio
  real. Si no está definida se usa `RENDER_EXTERNAL_URL` (Render la define sola);
  solo en desarrollo se cae a `http://localhost:3000` (ver `src/lib/site-url.ts`).
- `DATABASE_POOL_MAX` — opcional; máximo de conexiones del pool (por defecto 5).
- `TEST_DATABASE_URL` / `SHADOW_DATABASE_URL` — solo para pruebas de integración
  y `npm run db:drift` (bases desechables; ver más abajo).
- En producción, si `AUTH_SECRET` (mín. 32 caracteres) o `DATABASE_URL` faltan o
  son inválidas, el servidor queda inservible (toda petición responde 500,
  incluido `/healthz`) y lo dice en el log (`src/instrumentation.ts`); el health
  check de Render rechaza ese despliegue.
- `SEED_ADMIN_PASSWORD` — solo para `npm run db:seed` contra una base no
  local: contraseña del administrador inicial (mínimo 10 caracteres).

## Despliegue

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para la guía completa (Render +
Postgres administrado + variables de entorno + migraciones + siembra de
datos).

## Pruebas y calidad

`npm test` corre dos tipos de pruebas (Vitest), incluyendo la resolución del
calendario festivo y sus modos automático/manual/apagado:

- **Unitarias** (`tests/*.test.ts`, sin base de datos): construcción de
  enlaces/mensajes de WhatsApp, formateo de precios/fechas, generación de
  slugs, parseo del CSV de carga masiva, esquemas de validación (zod: textos,
  URLs, correos, bytes nulos), el store de carrito (Zustand), la resolución de
  la URL pública, el limitador de frecuencia, el proxy (CSP, `%00`, protección de
  `/admin`), la validación de entorno al arrancar y las **Server Actions** más
  sensibles con Prisma mockeado: login y bloqueo de cuenta, cierre de sesión,
  usuarios, perfil propio, categorías y la propiedad de las solicitudes por
  vendedor. `npm run test:unit` corre solo estas.
- **De integración** (`tests/integration/*.integration.test.ts`, contra una
  base de datos PostgreSQL real; 7 suites): filtros, orden estable y paginación
  del catálogo (`listProducts`), opciones de filtro, recorrido del árbol de
  categorías, campañas activas, visibilidad pública, listado de solicitudes,
  detección de carritos abandonados y las vistas SQL para PHP (incluida la que
  oculta precios). Necesitan una base de datos de pruebas **separada** de la de
  desarrollo (para no mezclar datos):

  ```bash
  docker compose up -d db        # ya crea mpm_portal_test automáticamente
                                   # en una instalación nueva (ver
                                   # docker/postgres-init/); si tu volumen ya
                                   # existía de antes, créala una vez con:
                                   # docker exec mpm_portal_postgres psql -U mpm -d postgres -c "CREATE DATABASE mpm_portal_test;"
  npm run db:test:migrate        # aplica las migraciones a mpm_portal_test
  npm run test:integration       # o npm test para correr todo
  ```

  Si `mpm_portal_test` no existe o no es alcanzable, en tu máquina estas
  pruebas se saltan automáticamente (no rompen `npm test` sin Docker). **En CI
  (`CI=true`) no se saltan: fallan**, para que un `TEST_DATABASE_URL` mal puesto
  no dé un verde sin haber ejecutado ninguna.
  Las acciones de `/admin` restantes (productos, campañas, ajustes,
  festividades) y la acción pública del carrito no tienen pruebas
  automatizadas todavía; se verificaron navegando la aplicación (ver
  docs/AUDIT_LOOP_1.md … AUDIT_LOOP_5.md) y están listadas como pendientes en
  docs/AUDIT_LOOP_5.md.
- Los archivos de prueba corren en serie (`fileParallelism: false` en
  `vitest.config.mts`) porque las pruebas de integración comparten una única
  base de datos de pruebas.
- `npm run typecheck` y `npm run lint` deben quedar sin errores/warnings.
- Integración continua: `.github/workflows/ci.yml` corre en cada push/PR a
  `main` (PostgreSQL real, deriva de migraciones, tipos, lint, pruebas, build y
  `npm audit --omit=dev`). **Ojo:** Render despliega en cada push a `main` en
  paralelo al CI; para que un CI rojo bloquee el despliegue hay que activar
  `autoDeployTrigger: checksPass` en `render.yaml` (o "After CI checks pass" en el
  dashboard) y proteger la rama `main` exigiendo el job `verify` en GitHub
  (ver docs/DEPLOYMENT.md §8). `.github/dependabot.yml` abre PR semanales de dependencias.
- Bitácoras de auditoría: `docs/AUDIT_LOOP_1.md` … `docs/AUDIT_LOOP_5.md`
  (la 5 es la más reciente e incluye los riesgos pendientes).
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
