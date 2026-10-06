# Bucle de auditoría 4 (1 de octubre de 2026)

Auditoría integral en tres pasadas: seguridad/autorización, sitio público
(SEO, accesibilidad, rendimiento) y capa de datos. Cada pasada se validó con
typecheck, lint, pruebas (unitarias + integración contra PostgreSQL), build de
producción y recorrido real en navegador contra `next start`.

## Línea base (antes de los cambios)

- `typecheck`, `lint --max-warnings=0`: correctos. `npm test`: 118 pruebas.
- `npm audit`: 4 vulnerabilidades *high* (transitivas de la CLI de Prisma).

## Pasada 1 — problemas encontrados y corregidos

| Prioridad | Problema | Corrección |
| --- | --- | --- |
| Alta | Bucle infinito de redirecciones con una sesión revocada (contraseña cambiada / usuario desactivado): `/admin` → `/login` → `/admin`… | `src/proxy.ts` ya no redirige `/login` → `/admin`; lo hace la página tras validar en base. Verificado en navegador. |
| Alta | El seed podía recrear `admin@mpm.local` con la contraseña pública contra producción | `prisma/seed.ts` exige `SEED_ADMIN_PASSWORD` contra cualquier base no local y no crea la cuenta de ventas de prueba ahí. |
| Alta | Un admin no podía guardar su propia cuenta (rol/activa deshabilitados no se envían → error) | `updateUserAction` fija rol y estado en la propia cuenta. Verificado en navegador. |
| Alta | `?publico=x` / `?etiqueta=foo` en el catálogo → error 500 de Prisma | `src/lib/catalog-params.ts` valida enums, orden, longitud de búsqueda. |
| Alta | Campañas inactivas o vencidas accesibles e indexadas en el sitemap | `getLiveCampaignBySlug` + `liveCampaignWhere()` en página y sitemap (404 real). |
| Alta | Carrito: error de hidratación (servidor vacío vs. localStorage) | `useHasHydrated()` (`useSyncExternalStore`) + esqueleto de carga. |
| Alta | Corte de "carritos abandonados" fijado a la hora de arranque del servidor | `abandonedWhere()` se recalcula por consulta; listas limitadas a 200. |
| Alta | Fechas de campaña en medianoche UTC: empezaban 5 h antes y perdían su último día | Inicio/fin del día en Bogotá + migración `20261001120000_anchor_campaign_dates_to_bogota` + formateo en `America/Bogota`. |
| Alta | CSV: "39.900" se guardaba como 39,9; archivos de Excel con `;` o Windows-1252 fallaban | `parseCopPrice`, detección de delimitador, decodificación con respaldo Windows-1252, validación de encabezados obligatorios. |
| Alta | `npm audit`: 4 *high* (`mysql2`, `deepmerge-ts`) | `overrides` en `package.json`; 0 vulnerabilidades. CLI de Prisma verificada. |
| Media | Rate limit evadible falsificando `X-Forwarded-For` | Se prefiere `CF-Connecting-IP`/`X-Real-IP`. |
| Media | Un vendedor podía reclasificar carritos que gestiona otro | Regla de propiedad en servidor y UI (`changeCartSessionStatusAction`). |
| Media | Carreras en estado/asignación de solicitudes | `updateMany` condicional dentro de la transacción. |
| Media | Reimportar un CSV parcial borraba tallas/colores/campaña/precio y volvía visible un producto oculto | Celdas/columnas opcionales vacías conservan el valor; campaña/estado/público/etiquetas desconocidos son error de fila. |
| Media | Doble envío del carrito: 500 por `cartSessionId` único | Ver pasada 2. |
| Media | Carrito sin tope (cantidades > 500, > 50 líneas → rechazo con mensaje en inglés) | Tope en el store, botón "+" deshabilitado, mensajes en español. |
| Media | Carrito obsoleto: prendas eliminadas/ocultas/agotadas se descartaban en silencio, precios viejos | La sincronización devuelve prendas no disponibles y precios vigentes; el cliente las retira. El envío no se completa con líneas faltantes. Verificado en navegador. |
| Media | Productos de categorías ocultas (o con padre oculto) visibles en catálogo, ficha y sitemap | `PUBLIC_CATEGORY_WHERE` en todas las consultas públicas; vista PHP alineada (migración `20261001121000_…`). |
| Media | Sin URL canónica; variantes filtradas indexables | `alternates.canonical` en catálogo, categoría, producto y campaña; `noindex, follow` con filtros. |
| Media | JSON-LD de producto inválido sin precio / con precios ocultos; imágenes relativas | `offers` solo con precio público; URLs absolutas. |
| Media | Galería ampliada sin manejo de foco | Foco al abrir, Tab atrapado, Escape, scroll bloqueado, foco devuelto. |
| Media | Activación de campaña fuera de la transacción; `findFirst` sin orden | Activación dentro de la transacción + `orderBy updatedAt`. |
| Baja | Asignar a usuarios inexistentes/inactivos → 500 | Validación de destinatario activo. |
| Baja | `/\dominio` aceptado como enlace interno | Rechazado. |
| Baja | Colores de campaña sin validar | Solo hexadecimal `#rgb`/`#rrggbb`. |
| Baja | Menú móvil sin Escape / clic fuera / foco | Corregido. |
| Baja | Orden "relevancia" etiquetado "Más recientes"; "recientes" sin opción | Etiquetas corregidas y opción añadida. |
| Baja | `items` no-array en el envío del carrito → 500 | Validación `Array.isArray`. |
| Baja | Seed sobrescribía ediciones del admin en las 18 referencias | En existentes solo refresca fotos. |
| Baja | Sin campo anti-spam en el formulario público | Campo trampa `website`. |

Se mantuvieron (y verificaron) los cambios sin commit que ya existían en
`src/app/admin/solicitudes/*`: un vendedor solo gestiona solicitudes libres o
propias.

## Pasada 2 — revisión independiente del diff

Encontró y se corrigió:

- **Media**: columnas `publico`/`estado` ausentes seguían reseteando a
  UNISEX/DISPONIBLE (valores por defecto del esquema). Ahora quedan vacías.
- **Media**: un doble clic rápido (antes de existir la sesión de carrito)
  creaba **dos** solicitudes — reproducido en navegador. Ahora el envío se
  serializa por teléfono (`pg_advisory_xact_lock`) y descarta una solicitud
  idéntica en los últimos 10 minutos. Reverificado: 1 solicitud.
- **Media**: `True-Client-IP` puede venir del cliente si el borde no lo fija;
  ya no se usa.
- **Baja**: activación concurrente de campañas en READ COMMITTED → bloqueo
  transaccional.
- **Baja**: cambio de estado de un vendedor sin repetir la regla de propiedad
  en el `WHERE`.
- **Baja**: canónica de páginas 2+ apuntaba a la 1.
- **Baja**: etiquetas inválidas en CSV vaciaban las existentes.
- Además: `src/app/global-error.tsx` (no había frontera para errores del
  layout raíz) y `error.tsx` usa `retry()` (vuelve a pedir datos).
- Se descartó un `loading.tsx` genérico para páginas públicas: convertía los
  404 de campañas en "soft 404" (200 + `noindex`).

## Pasada 3

Revisión final del delta de la pasada 2 y revalidación completa (ver
resultados abajo).

## Resultados de validación (estado final)

- `npm run typecheck`: correcto.
- `npm run lint -- --max-warnings=0`: correcto.
- `npm test`: **135 pruebas, 18 archivos**, incluidas integración contra
  PostgreSQL (nuevo `tests/integration/public-visibility.integration.test.ts`).
  Los archivos de prueba ahora corren en serie (`fileParallelism: false`)
  porque comparten la base de pruebas.
- `npm run build`: correcto; todas las páginas HTML dinámicas.
- `npm audit`: 0 vulnerabilidades.
- Migraciones aplicadas en desarrollo y pruebas.
- Navegador (`next start`): rutas públicas (200/404/307 correctos), CSP con
  nonce, canónicas, `robots.txt`, sitemap, JSON-LD; producto → carrito →
  recarga sin errores de hidratación → retiro automático de prenda
  inexistente → envío → WhatsApp; doble clic → una sola solicitud; login,
  cambio de estado y asignación con historial, edición de la propia cuenta,
  sesión revocada sin bucle; móvil 375 px sin scroll horizontal, menú con
  Escape. Los datos de prueba creados se eliminaron.

## Seguimiento (mismo día): pendientes de código resueltos

- **404 reales**: `/producto/<inexistente>` y `/catalogo/<inexistente>`
  respondían 200 + `noindex` porque un `loading.tsx` ya había iniciado el
  streaming. El listado se movió a `src/app/(public)/catalogo/(listado)/`
  (su `loading.tsx` ya no envuelve `[categoria]`) y se retiró el de
  `/producto/[slug]`. Verificado: 404 en producto, categoría y campaña.
- **Índices** (migración `20261001161846_add_catalog_search_indexes`): GIN
  en `tags`/`sizes`/`colors`, B-tree en `updatedAt`/`createdAt` y trigram
  (`pg_trgm`) en `name`/`sku`/`description` para la búsqueda `contains`.
  `prisma migrate dev` no detecta deriva.
- **Importación CSV**: SKUs y slugs existentes se precargan en 2 consultas
  (antes 2 o más por fila); aviso en el navegador si el archivo supera 1 MB.
- **Cerrar sesión revoca el token** (`sessionVersion + 1`): un JWT copiado
  deja de servir de inmediato. Efecto: cierra también las sesiones de ese
  usuario en otros dispositivos. Verificado en navegador y con
  `tests/logout.test.ts`.
- Validación: typecheck, lint, **137 pruebas (19 archivos)**, build y
  `npm audit` (0) correctos.

## Pendiente / riesgos conocidos
- **Rate limit en memoria** por instancia: con varias instancias hace falta
  WAF/rate limit del proveedor. Verificar en Render que `CF-Connecting-IP`
  llega; si no, el límite cae al primer valor de `X-Forwarded-For`.
- **Bloqueo de cuenta por correo** (5 intentos / 15 min): un tercero puede
  bloquear temporalmente una cuenta conocida. Es el comportamiento estándar;
  mitigable con WAF.
- **Colores de campaña** guardados antes con formatos no hexadecimales deben
  reescribirse al editar (hoy no hay campañas en la base local).
- Un cliente que repite exactamente el mismo pedido con el mismo teléfono en
  menos de 10 minutos no genera una segunda solicitud (se le muestra éxito y
  el enlace de WhatsApp).
- La importación CSV sigue escribiendo fila por fila (máx. 2000 filas) para
  poder reportar errores por fila; con archivos muy grandes conviene
  dividirlos.
- 13 imágenes `public/seasonal/*-complemento.webp` sin seguimiento en git y
  sin referencia en el CSS (≈1,4 MB). Parecen trabajo en curso; no se
  tocaron.
- `NEXT_PUBLIC_SITE_URL` debe configurarse con el dominio real en Render: si
  no, canónicas y sitemap apuntan a `localhost`.
- Revisión legal de `/politica-de-datos` e identidad de marca definitiva
  (pendientes de bucles anteriores).
