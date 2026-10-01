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
    buildCommand: npm ci && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run build
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
| `NEXT_PUBLIC_SITE_URL` | El dominio asignado por Render (o el dominio propio una vez conectado) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Respaldo; el valor real se administra desde `/admin/ajustes` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Opcionales — actívalos cuando exista la cuenta definitiva |

## 2. Qué corre el `buildCommand`, y una advertencia importante

En cada despliegue (cada `git push` al branch conectado), Render ejecuta en
orden: `prisma generate` → `prisma migrate deploy` → **`npm run db:seed`** →
`next build`.

`prisma migrate deploy` es seguro de repetir (solo aplica migraciones
pendientes). **`npm run db:seed` NO es igual de inocuo**: además de
sembrar/actualizar las 18 referencias reales y las dos cuentas de prueba,
`prisma/seed.ts` llama a `removeDemoCatalogContent()`, que borra por `slug`
cualquier producto, categoría o campaña sintéticos de versiones anteriores
del portal — incluyendo una campaña con slug `carnaval-de-barranquilla`
(junto con `regreso-a-clases` y `liquidacion-fin-de-temporada`).

Esto fue pensado como una limpieza de una sola vez al migrar del catálogo
sintético al catálogo real. Pero como `db:seed` corre en **cada** build, si
alguna vez un administrador crea desde `/admin/campanas` una campaña real
usando por coincidencia uno de esos tres slugs, el próximo despliegue la
borrará sin aviso — sin que nada la recree, porque ya no existe un paso de
siembra de campañas en `main()`.

**Antes de usar este entorno de Render como el portal real y definitivo de
MPM** (no solo para una vista previa), hay que resolver esto: o se saca
`npm run db:seed` del `buildCommand` (y se corre manualmente, una sola vez,
desde la shell de Render, como ya se hace con `migrate deploy` en el punto
4), o se cambia `removeDemoCatalogContent()` para que no pueda borrar
contenido creado después de esa limpieza inicial (por ejemplo, limitándola a
una vez por entorno, o marcando el contenido sintético con un campo propio
en vez de identificarlo por slug).

## 3. Build

Render detecta Next.js automáticamente a través del `buildCommand` de
`render.yaml`. Node 22 queda fijado por `NODE_VERSION` (coincide con
`engines.node` en `package.json`).

## 4. Migraciones y datos: primer despliegue

El flujo normal ya queda cubierto por el `buildCommand`. Si necesitas
aplicar una migración o re-sembrar manualmente contra producción (por
ejemplo, para evitar el riesgo del punto 2 mientras no se resuelva), usa la
shell de Render o corre localmente apuntando a la base de datos de
producción:

```bash
DATABASE_URL="<url-de-produccion>" npx prisma migrate deploy
DATABASE_URL="<url-de-produccion>" npm run db:seed
```

Tras el primer arranque:

1. Verifica las 18 referencias reales y completa sus datos desde
   `/admin/productos` cuando MPM los suministre.
2. Entra a `/admin/ajustes` y reemplaza la identidad provisional (colores,
   WhatsApp, textos) por los datos reales de MPM.
3. Cambia la contraseña de `admin@mpm.local` (la de siembra,
   `CambiaEsto123!`, es pública en este mismo documento y en el README).

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

- [ ] Resuelto el riesgo del punto 2 (`db:seed` borrando campañas reales por
      coincidencia de slug) si este Render va a ser el portal definitivo.
- [ ] `AUTH_SECRET` de producción generado y distinto al de desarrollo
      (Render lo genera solo la primera vez — no lo pises a mano).
- [ ] Migraciones aplicadas (`prisma migrate deploy`).
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
