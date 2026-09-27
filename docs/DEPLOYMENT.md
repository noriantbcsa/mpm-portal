# Despliegue

## Resumen

El portal es una app Next.js estándar (App Router) sin partes que requieran
un servidor propio de larga duración (no hay websockets, no hay colas): se
despliega bien en **Vercel**. Necesita una base de datos **PostgreSQL**
accesible desde internet (Vercel no incluye una).

## 1. Base de datos

Cualquier PostgreSQL 14+ gestionado sirve. Opciones habituales con Vercel:
Vercel Postgres (Neon por debajo), Neon, Supabase o Railway. Anota la cadena
de conexión — Prisma 7 necesita el modo *pooled* si el proveedor lo separa
del modo *direct* (algunos, como Neon, dan dos URLs distintas; usa la
*pooled* para `DATABASE_URL` en runtime, y opcionalmente la *direct* solo
para migraciones si el proveedor lo exige).

## 2. Variables de entorno en Vercel

Configura, como mínimo (Project Settings → Environment Variables):

| Variable | Notas |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de tu Postgres gestionado |
| `AUTH_SECRET` | Genera una nueva y distinta a la de desarrollo: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | El dominio final (`https://...`), para metadatos y JSON-LD |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Respaldo; el valor real se administra desde `/admin/ajustes` una vez desplegado |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Opcionales — actívalos cuando exista la cuenta definitiva |

No definas `NODE_ENV` manualmente (Vercel lo gestiona).

## 3. Build

Vercel detecta Next.js automáticamente. Verifica en el proyecto:

- **Build Command**: `next build` (por defecto).
- **Install Command**: `npm install` (por defecto).
- **Node.js Version**: 22.x (Project Settings → General). El `package.json`
  declara `engines.node 22.x` para evitar que el proveedor suba
  automáticamente a una versión mayor incompatible.

`next build` corre `prisma generate` automáticamente porque `@prisma/client`
está declarado con un script `postinstall` propio de Prisma 7 — si alguna
vez ves un error de "no se encontró el cliente de Prisma" en el build,
confirma que `prisma`/`@prisma/engines` siguen aprobados en el bloque
`allowScripts` de `package.json` (npm bloquea scripts de instalación no
declarados por seguridad; ver `docs/SECURITY.md`).

## 4. Migraciones y datos en producción

**Antes del primer despliegue** (o en cada deploy que agregue migraciones),
corre desde tu máquina (o un pipeline de CI) apuntando a la base de datos de
producción:

```bash
DATABASE_URL="<url-de-produccion>" npx prisma migrate deploy
```

`prisma migrate deploy` (a diferencia de `migrate dev`) no genera
migraciones nuevas ni pregunta nada: solo aplica las que ya existen en
`prisma/migrations/`. No lo corras automáticamente en cada build de Vercel
sin pensarlo — es razonable, pero significa que un build fallido a mitad de
migración necesita revisión manual.

### ¿Sembrar datos en producción?

`npm run db:seed` importa únicamente las 18 referencias reales entregadas
por MPM, retira los datos sintéticos de versiones anteriores y crea las dos
cuentas de prueba documentadas en el README. Para el primer arranque en
producción:

1. Corre las migraciones (`migrate deploy`).
2. Ejecuta `npm run db:seed` para cargar el catálogo real y crear las cuentas
   de prueba. Cambia sus contraseñas antes de abrir el portal al público.
3. Verifica las 18 referencias reales y completa sus datos desde
   `/admin/productos` cuando MPM los suministre.
4. Entra a `/admin/ajustes` y reemplaza la identidad provisional (colores,
   WhatsApp, textos) por los datos reales de MPM.

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

- [ ] `AUTH_SECRET` de producción generado y distinto al de desarrollo.
- [ ] Migraciones aplicadas (`prisma migrate deploy`).
- [ ] Al menos un usuario `ADMIN` real creado, con contraseña propia (no
      `CambiaEsto123!`).
- [ ] Las 18 referencias del catálogo real revisadas y sus 360 imágenes WebP visibles.
- [ ] `/admin/ajustes` con identidad/WhatsApp/contacto reales de MPM.
- [ ] `/politica-de-datos` revisada y aprobada por MPM (o su asesor legal) —
      hoy tiene un texto de ejemplo marcado explícitamente como provisional.
- [ ] `next.config.ts` → `images.remotePatterns` incluye todos los dominios
      de imagen que se vayan a usar en producción.
- [ ] `npm run build`, `npm run lint`, `npm run typecheck` y `npm test`
      pasan en limpio contra el commit que se despliega.
