# Despliegue

## Resumen

El portal se despliega en **Render** (`render.yaml` en la raíz del
repositorio): un servicio web Node + una base de datos **PostgreSQL**
administrada por Render, ambos definidos como código. Render lee ese archivo
automáticamente al conectar el repositorio.

## 1. `render.yaml`

```yaml
services:
  - type: web
    name: mpm-portal
    runtime: node
    plan: free
    buildCommand: npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm run start
    healthCheckPath: /healthz        # sin base de datos (src/app/healthz/route.ts)
    envVars:
      - key: NODE_VERSION
        value: "22"
      - key: DATABASE_URL
        fromDatabase: { name: mpm-portal-db, property: connectionString }
      - key: AUTH_SECRET
        generateValue: true
      - key: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
        sync: false                  # base64 de 16/24/32 bytes (openssl rand -base64 32)
      - key: NEXT_PUBLIC_SITE_URL
        sync: false

databases:
  - name: mpm-portal-db
    plan: free
```

`DATABASE_URL` y `AUTH_SECRET` se generan solos (Render conecta la base de
datos y genera el secreto). En producción, si
`AUTH_SECRET` tiene menos de 32 caracteres o falta `DATABASE_URL`
(`src/instrumentation.ts`), el servidor responde 500 a todo —incluido `/healthz`—
y el log dice qué falta; el health check de Render rechaza ese despliegue y
la versión anterior sigue sirviendo, en vez de quedar "sano" con un `/admin` que
redirige a `/login` sin explicación. Hay
que completar manualmente, desde el dashboard de Render (Environment), al menos:

| Variable | Notas |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Dominio propio una vez conectado (ej. `https://www.mpm.com.co`). Si no está definida se usa `RENDER_EXTERNAL_URL`, que Render define sola con la URL pública del servicio; sin ninguna de las dos, el sitemap, las canónicas y `og:image` apuntarían a `localhost` (así estaba producción hasta la auditoría 5). Un valor `http://localhost…` copiado del `.env.example` se ignora en producción si Render informa su URL |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Base64 válido de 16/24/32 bytes (`openssl rand -base64 32`). Imprescindible al escalar a más de una instancia; no pongas texto de relleno |
| `DATABASE_POOL_MAX` | Opcional. Máximo de conexiones del pool de Prisma (por defecto 5, pensado para el plan gratuito de la base) |
| `CLOUDINARY_*` | Reservadas: hoy ninguna pantalla las lee (ver §5). No hace falta definirlas |

El número de WhatsApp, el correo y la identidad **no** son variables de entorno:
se editan en `/admin/ajustes`. Mientras no se editen, el sitio publica los
valores provisionales (`573000000000`, `ventas@mpm-ejemplo.com`).

## 2. Qué corre el `buildCommand`

En cada despliegue (cada `git push` al branch conectado), Render ejecuta en
orden: `prisma generate` → `prisma migrate deploy` → `next build`. Ambos
pasos son seguros de repetir en cada build (`migrate deploy` solo aplica
migraciones pendientes; no modifica datos).

**`npm run db:seed` deliberadamente NO está en el `buildCommand`.** Antes sí
corría ahí en cada deploy, y `prisma/seed.ts` llamaba a una limpieza
(`removeDemoCatalogContent()`, pensada como un paso de una sola vez al migrar
del catálogo sintético al real) que borraba por `slug` cualquier campaña
coincidente — incluyendo `carnaval-de-barranquilla`. Como corría en cada
build, una campaña real creada después con ese mismo slug se habría borrado
sin aviso en el siguiente despliegue, sin nada que la recreara. Esa limpieza
ahora vive aparte, en `scripts/remove-demo-content.ts` — un script de una
sola ejecución que nunca corre automáticamente — y `db:seed` (que sigue
siendo seguro de repetir: solo hace upserts) se corre a mano cuando
realmente hace falta, no en cada deploy. Ver el punto 4.

## 3. Build

Render detecta Next.js automáticamente a través del `buildCommand` de
`render.yaml`. Node 22 queda fijado por `NODE_VERSION` (coincide con
`engines.node` en `package.json`).

## 4. Migraciones y datos: primer despliegue

Las migraciones ya quedan cubiertas por el `buildCommand`. La siembra inicial
(catálogo real + el administrador inicial) y, si alguna vez hace falta, la
limpieza de contenido de demostración, se corren a mano **una sola vez**,
desde la shell de Render o apuntando localmente a la base de datos de
producción:

```bash
DATABASE_URL="<url-de-produccion>" npx prisma migrate deploy
DATABASE_URL="<url-de-produccion>" SEED_ADMIN_PASSWORD="<contraseña-propia-de-10+-caracteres>" npm run db:seed
# Solo si el entorno todavía tiene categorías/productos/campañas de
# demostración de una versión anterior del portal (no debería, en un
# entorno nuevo):
DATABASE_URL="<url-de-produccion>" npm run db:remove-demo-content
```

Contra una base que no sea local, el seed **no** crea cuentas con la
contraseña pública de demostración: sin `SEED_ADMIN_PASSWORD` omite los
usuarios, y con ella crea solo `admin@mpm.local` con esa contraseña (nunca la
cuenta de ventas de prueba). Si la cuenta ya existe, no se modifica.

`npm run db:seed` es seguro de repetir: contra una base **local** reimporta las
referencias; contra una base **no local que ya tiene productos** omite el
catálogo (para no pisar fotos subidas desde `/admin`) salvo que lo confirmes con
`SEED_REFRESH_CATALOG=1`, y entonces en referencias existentes solo reemplaza las
fotos — nombre, descripción, categoría, tallas, etiquetas y precio editados
desde `/admin` se conservan, igual que la visibilidad, nombre, orden y portada de
las categorías. `npm run db:remove-demo-content` en cambio borra por nombre
de slug — solo corre esto si de verdad necesitas limpiar datos de
demostración; nunca lo agregues de vuelta al `buildCommand`.

Tras el primer arranque:

1. Verifica las 18 referencias reales y completa sus datos desde
   `/admin/productos` cuando MPM los suministre.
2. Entra a `/admin/ajustes` y reemplaza la identidad provisional (colores,
   WhatsApp, textos) por los datos reales de MPM.
3. Entra con `admin@mpm.local` y la contraseña de `SEED_ADMIN_PASSWORD`;
   crea las cuentas reales del equipo desde `/admin/usuarios` y, si quieres,
   cambia el correo/contraseña del administrador inicial.

## 5. Imágenes

Las fotos del catálogo viven en `public/catalogo/` y se guardan como rutas del
propio sitio (`/catalogo/…`); el panel también acepta URLs `http(s)` completas.
La subida directa a Cloudinary (`src/lib/cloudinary.ts`) está escrita pero **sin
conectar** al panel.

`next.config.ts` restringe `next/image` a una lista concreta de dominios
(`images.remotePatterns`): actualmente solo `res.cloudinary.com`. Si el equipo de contenido va
a pegar URLs de imagen desde otro origen (que no sea Cloudinary), agrega ese
dominio a la lista — si no, el build seguirá funcionando pero esas imágenes
puntuales no se optimizarán y Next lanzará un error en tiempo de ejecución
al intentar renderizarlas. Ver `docs/SECURITY.md` para el porqué de esta
lista (en vez de permitir cualquier dominio).

## 6. Dominio y WhatsApp Business

- Una vez asignado el dominio definitivo, actualiza `NEXT_PUBLIC_SITE_URL` y
  vuelve a desplegar (afecta metadatos/SEO, no el contenido).
- El número de WhatsApp que ve el público se administra por completo desde
  `/admin/ajustes` (columna `whatsappNumber`, formato solo dígitos con
  indicativo de país, ej. `573001234567`) — no requiere cambiar variables de
  entorno ni redeploy.
- Cuando MPM tenga WhatsApp Business API (en vez de solo la app), los
  enlaces `wa.me` actuales siguen funcionando igual (son independientes del
  tipo de cuenta); una integración más profunda (webhooks entrantes,
  respuestas automáticas) se conectaría en `src/lib/whatsapp.ts` sin tocar
  el resto del portal.

## 7. Checklist previo a salir a producción

- [ ] `AUTH_SECRET` de producción generado y distinto al de desarrollo
      (Render lo genera solo la primera vez — no lo pises a mano).
- [ ] Migraciones aplicadas (`prisma migrate deploy`), incluida
      `20261001120000_anchor_campaign_dates_to_bogota`, que corrige las
      fechas de campañas ya guardadas.
- [ ] Al menos un usuario `ADMIN` real creado, con contraseña propia (no
      `CambiaEsto123!`).
- [ ] Las 18 referencias del catálogo real revisadas y sus imágenes WebP visibles.
- [ ] `/admin/ajustes` con identidad/WhatsApp/contacto reales de MPM.
- [ ] `/politica-de-datos` revisada y aprobada por MPM (o su asesor legal) —
      hoy tiene un texto de ejemplo marcado explícitamente como provisional.
- [ ] `next.config.ts` → `images.remotePatterns` incluye todos los dominios
      de imagen que se vayan a usar en producción.
- [ ] `npm run build`, `npm run lint`, `npm run typecheck` y `npm test`
      pasan en limpio contra el commit que se despliega.
- [ ] `https://<dominio>/healthz` responde `ok`; `robots.txt` y `sitemap.xml`
      muestran el dominio real (no `localhost`).
- [ ] La base de datos de producción tiene respaldos (ver §8); el plan gratuito
      caduca y no es apto para datos de clientes reales.

## 8. Operación

### Despliegue y CI

Render despliega en cada push a `main`, **en paralelo** al CI de GitHub
(`.github/workflows/ci.yml`): un CI rojo no detiene el despliegue por sí solo.
Para que lo detenga, una vez que el job `verify` haya pasado en verde en GitHub:
añade `autoDeployTrigger: checksPass` al servicio en `render.yaml` (o "After CI
checks pass" en el dashboard) y protege `main` en GitHub exigiendo `verify`. No
se activó de entrada porque el workflow todavía no se había ejecutado en GitHub y
un fallo del propio workflow habría bloqueado todo despliegue.

`npm run build` necesita la base de datos (el ícono y la imagen Open Graph la
consultan): con la base caída o expirada el build falla y **no se puede
desplegar**; la versión anterior sigue sirviendo mientras tanto.

### Rollback

- **Código**: en el dashboard de Render, vuelve a un despliegue anterior con su
  opción *Rollback* (o `git revert` y push). Las migraciones **no** se revierten
  solas.
- **Migraciones**: son aditivas y se aplican antes de `next build`; si el build
  falla después, el código viejo corre sobre el esquema nuevo (por eso las
  migraciones deben ser compatibles hacia atrás: agregar, no renombrar/borrar en
  el mismo despliegue).
- **Una migración falló al aplicarse** (el build se detiene en
  `prisma migrate deploy` con `P3009`/`P3018`): corrige el SQL en una migración
  **nueva**, nunca edites una ya aplicada (checksum). Si quedó marcada como
  fallida: `DATABASE_URL=<url> npx prisma migrate resolve --rolled-back <nombre>`
  y vuelve a desplegar. (Le pasó a una migración durante el desarrollo, en una base local:
  `CREATE OR REPLACE VIEW` no puede cambiar el tipo de una columna; hace falta un
  cast.)

### Respaldos y caducidad de la base

El plan **gratuito** de PostgreSQL de Render caduca pasado un periodo limitado
(consulta el plazo vigente en la documentación de Render) y no está pensado para
datos que no se puedan perder; esta base guarda datos de clientes (solicitudes).
Antes de recibir tráfico real: pasa a un plan de pago con respaldos
(verifica en Render qué retención y restauración incluye el plan elegido) o
programa un `pg_dump` periódico a un almacenamiento propio:

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL" > mpm-$(date +%F).dump
# Restaurar en una base vacía:
pg_restore --no-owner --dbname "<url-destino>" mpm-AAAA-MM-DD.dump
```

El plan gratuito del servicio web además se duerme tras inactividad (el primer
visitante espera varios segundos). Un monitor externo sobre `/healthz` lo
mantiene despierto y avisa si el servicio cae.

### Rotación de secretos

- `AUTH_SECRET`: cambiarlo cierra la sesión de **todas** las personas del equipo
  (los JWT firmados con la clave anterior dejan de ser válidos). Hazlo tras
  cualquier sospecha de filtración, y en un horario tranquilo.
- Contraseñas de equipo: el administrador las restablece en `/admin/usuarios`
  (cierra las sesiones de esa persona); cada persona puede cambiar la suya en
  `/admin/perfil`.

### Datos personales: retención y borrado

La política de datos promete eliminar los datos a solicitud, pero el panel no
tiene todavía una acción de borrado ni una purga automática: hasta que exista,
se hace a mano contra la base (primero con `SELECT` para confirmar a quién
corresponde). Una solicitud se elimina junto con sus ítems y eventos (cascada):

```sql
SELECT id, "contactName", "contactPhone", "createdAt" FROM "CartRequest"
 WHERE "contactPhone" = '<teléfono tal como se guardó>';
DELETE FROM "CartRequest" WHERE id = '<id de arriba>';
-- Carritos con nombre/teléfono parcial guardados antes de enviar la solicitud:
UPDATE "CartSession" SET "contactNamePartial" = NULL, "contactPhonePartial" = NULL
 WHERE "contactPhonePartial" = '<valor guardado>';
```

La cookie del carrito dura 120 días.

### Registros (logs)

El servidor no escribe registros propios con datos personales. Los errores de
servidor salen por la salida estándar de Next.js con un `digest` (la pantalla de
error lo muestra al usuario para poder buscarlo en el log de Render). Si se
quiere conservar el histórico, reenvía los logs de Render a un destino externo.
