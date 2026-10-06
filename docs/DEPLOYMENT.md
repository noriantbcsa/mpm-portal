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
    envVars:
      - key: NODE_VERSION
        value: "22"
      - key: DATABASE_URL
        fromDatabase: { name: mpm-portal-db, property: connectionString }
      - key: AUTH_SECRET
        generateValue: true
      - key: NEXT_PUBLIC_SITE_URL
        sync: false
      - key: NEXT_PUBLIC_WHATSAPP_NUMBER
        sync: false

databases:
  - name: mpm-portal-db
    plan: free
```

`DATABASE_URL` y `AUTH_SECRET` se generan solos (Render conecta la base de
datos y genera el secreto). Hay que completar manualmente, desde el
dashboard de Render (Environment), al menos:

| Variable | Notas |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Dominio propio una vez conectado (ej. `https://www.mpm.com.co`). Si no está definida se usa `RENDER_EXTERNAL_URL`, que Render define sola con la URL pública del servicio; sin ninguna de las dos, el sitemap, las canónicas y `og:image` apuntarían a `localhost` (así estaba producción hasta la auditoría 5) |
| `DATABASE_POOL_MAX` | Opcional. Máximo de conexiones del pool de Prisma (por defecto 5, pensado para el plan gratuito de la base) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Respaldo; el valor real se administra desde `/admin/ajustes` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Opcionales — actívalos cuando exista la cuenta definitiva |

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
(catálogo real + las dos cuentas de prueba) y, si alguna vez hace falta, la
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

`npm run db:seed` es seguro de repetir más adelante (por ejemplo, para
actualizar las fotos cuando MPM entregue nuevas): en referencias existentes
solo reemplaza las fotos — nombre, descripción, categoría, tallas, etiquetas
y precio editados desde `/admin` se conservan. `npm run db:remove-demo-content` en cambio borra por nombre
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

## 5. Imágenes remotas

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
