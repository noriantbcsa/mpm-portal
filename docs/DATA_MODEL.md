# Modelo de datos

Fuente de verdad: [`prisma/schema.prisma`](../prisma/schema.prisma). Este
documento explica el *porqué* de las decisiones que no son obvias leyendo el
esquema.

## Diagrama (textual)

```
User ──< CartRequest (assignedTo)          Category ──< Category (parentId, árbol)
User ──< CartRequestEvent (author)             │
                                                ├──< Product
Campaign >──< Category (priorityCategories, m:n)
Campaign ──< Product (campaignId)

User ──< CartSession (handledBy)

Product ──< ProductImage
Product ──< CartSessionItem  (snapshot de nombre/sku; productId opcional)
Product ──< CartRequestItem  (snapshot de nombre/sku/precio; productId opcional)

CartSession ──< CartSessionItem
CartSession ──1:1?── CartRequest   (cartSessionId es único y opcional)

CartRequest ──< CartRequestItem
CartRequest ──< CartRequestEvent

SiteSettings  (fila única, id = "default")
```

## Por qué `CartSessionItem`/`CartRequestItem` no son solo una FK a `Product`

Ambas tablas **copian** `name`/`sku` (y `CartRequestItem` además el precio)
en el momento de agregar al carrito o enviar la solicitud, en vez de solo
guardar `productId` y hacer `JOIN`. Motivo: si un producto se renombra, cambia
de precio o se borra después, el historial de una solicitud ya enviada no
debe cambiar retroactivamente ni romperse. `productId` se conserva también
(con `onDelete: SetNull`) únicamente para poder enlazar de vuelta al producto
*si todavía existe* (por ejemplo, para mostrar su foto o enlazarlo desde el
panel), nunca como la fuente de verdad de esos datos.

## Por qué `CartSession` y `CartRequest` son entidades separadas

- `CartSession` = "lo que hay en el carrito de un visitante anónimo ahora
  mismo". Se crea y actualiza automáticamente mientras compra, sin pedirle
  ningún dato — es lo que permite detectar **carritos abandonados** (gente
  que nunca llegó a dejar sus datos).
- `CartRequest` = "solicitud comercial", solo existe una vez que el cliente
  deja sus datos de contacto **y** acepta la política de tratamiento de
  datos (`dataConsent: true`, con `consentedAt`). Es lo único que ve el
  equipo de ventas en `/admin/solicitudes`.

Modelarlos juntos (un único carrito con "estado borrador vs enviado")
habría mezclado dos ciclos de vida distintos y, más importante, habría hecho
mucho más fácil terminar guardando datos de contacto sin consentimiento
explícito. Mantenerlos separados hace que "no hay `CartRequest` → no hay
datos personales guardados" sea verdad por construcción.

`contactNamePartial`/`contactPhonePartial` existen en `CartSession` para un
futuro donde se quiera capturar contacto *progresivamente* (por ejemplo, si
el cliente empieza a llenar el formulario mas no lo envía) — hoy están sin
usar a propósito: capturar datos personales antes del checkbox de consentimiento
es una zona gris de privacidad que se prefirió no implementar sin una
decisión explícita de negocio/legal.

## Por qué `Category` es auto-referenciada en vez de dos tablas (`Category`/`Subcategory`)

El enunciado pide "categorías, subcategorías" y en la práctica se usan 2
niveles (p. ej. "Damas" → "Referencias Damas"). Una relación `parentId`
auto-referenciada (`Category.parent` / `Category.children`) evita dos tablas
casi idénticas, y `src/lib/categories.ts#getCategorySubtreeIds` permite que
filtrar por "Damas" incluya automáticamente todas sus subcategorías.

El esquema técnicamente admite cualquier profundidad, pero **el servidor impone
dos niveles** (`saveCategoryAction`): la regla de visibilidad pública
(`PUBLIC_CATEGORY_WHERE` y las vistas PHP) solo mira al padre directo, así que
una tercera capa bajo una categoría oculta seguiría siendo pública. La regla se
aplica al crear o al cambiar de padre; una categoría anterior a la regla puede
seguir editándose sin moverla.

## Por qué las etiquetas (`tags`) y no una tabla `Tag`

`Product.tags` es un arreglo del enum `ProductTagType` (`OFERTA`,
`TENDENCIA`, `NUEVO`, `RECOMENDADO`) directamente en la columna (PostgreSQL
soporta arreglos nativos y Prisma los mapea de forma directa), en vez de una
tabla `Tag` + tabla intermedia. Son 4 valores fijos y cerrados definidos por
el enunciado; una tabla aparte añadiría un JOIN sin aportar flexibilidad real
hoy. Si en el futuro las etiquetas necesitan ser gestionables por el admin
(crear/borrar etiquetas nuevas), es una migración acotada: nueva tabla `Tag`
+ relación m:n, sin tocar el resto del esquema.

## Estados y enums

| Enum | Valores | Dónde se usa |
| --- | --- | --- |
| `Role` | `ADMIN`, `SALES` | Permisos del panel |
| `ProductStatus` | `DISPONIBLE`, `BAJO_PEDIDO`, `AGOTADO`, `OCULTO` | Catálogo. `OCULTO` nunca se muestra al público; los otros tres sí (con badge) |
| `ProductTagType` | `OFERTA`, `TENDENCIA`, `NUEVO`, `RECOMENDADO` | Vitrinas de inicio y filtros |
| `Audience` | `HOMBRE`, `MUJER`, `NINO`, `NINA`, `UNISEX` | Filtro "Público" |
| `CartRequestStatus` | `NUEVO` → `CONTACTADO` → `EN_NEGOCIACION` → `VENDIDO` / `CERRADO` / `CANCELADO` | Seguimiento comercial |
| `CartRequestEventType` | `CREATED`, `NOTE`, `STATUS_CHANGE`, `ASSIGNMENT` | Timeline de una solicitud |
| `SeasonalThemeMode` | `AUTOMATIC`, `MANUAL`, `OFF` | Diseño festivo (`SiteSettings.seasonalThemeMode`) |
| `SeasonalThemePreset` | `DEFAULT`, `NEGROS_Y_BLANCOS`, `CARNAVAL`, `NAVIDAD`, … (16 valores, ver `schema.prisma`) | Celebración forzada en modo manual |

`CartRequestStatus` no tiene una transición forzada (un asesor puede pasar
de `NUEVO` a `CERRADO` directo); se decidió no restringir el flujo porque en
ventas reales el orden no siempre es lineal (un cliente puede escribir
"ya no me interesa" al segundo mensaje).

## Campos "provisionales" a vigilar

- `SiteSettings.primaryColor/secondaryColor/accentColor/whatsappNumber/logoUrl`:
  identidad provisional; reemplazar desde `/admin/ajustes` cuando MPM tenga
  logo/dominio/marca definitivos (ver README).
- `Product.priceRef`: precio de referencia opcional; solo se muestra al
  público si `SiteSettings.showPrices` está activo (por defecto, apagado —
  el modelo de negocio es "un asesor confirma el precio").
- El seed conserva únicamente las 18 referencias reales entregadas por MPM;
  no genera productos, categorías ni campañas sintéticas.

## Migraciones

Están en `prisma/migrations/` en orden cronológico (15 al 6 de octubre de
2026). Las que cambian datos o vistas, y conviene conocer:

- `20260922031350_init`: esquema inicial completo.
- `20260922043619_add_login_lockout`: `User.failedLoginAttempts` y
  `User.lockedUntil` (bloqueo de cuenta tras intentos fallidos).
- `20260927110000_cart_commercial_workflow`: renombra los estados
  (`CONFIRMADO` → `VENDIDO`, `PERDIDO` → `CANCELADO`, conservando el historial)
  y agrega el seguimiento comercial de los carritos sin solicitud
  (`CartSession.commercialStatus`, `handledById`, `handledAt`).
- `20260927143000_add_seasonal_themes` / `20260930120000_add_regional_seasonal_themes`:
  diseño festivo (los enums y las celebraciones regionales).
- `20260922185129_add_product_image_color` y `20260927170000_update_bogota_brand_defaults`:
  color por foto; corrige textos provisionales de la primera siembra sin pisar
  lo personalizado.
- `20260927160000_add_php_catalog_integration`: esquema `integration` con las
  vistas `catalog_*` de solo lectura para el sistema PHP (ver
  `docs/PHP_INTEGRATION.md`). Las vistas se reemplazan con `CREATE OR REPLACE`
  y **no pueden cambiar el tipo de una columna**: hace falta un cast
  (`::numeric(12,2)`) para conservar el tipo existente.
- `20261001040221_add_user_session_version`: `User.sessionVersion`.
- `20261001120000_anchor_campaign_dates_to_bogota`: corrige las fechas de
  campañas ya guardadas (datos).
- `20261001121000_php_views_respect_hidden_parent_category` y
  `20261006180000_php_view_respects_show_prices`: las vistas PHP respetan la
  categoría padre oculta y `SiteSettings.showPrices`.
- `20261001161846_add_catalog_search_indexes`: `pg_trgm` + índices GIN para el
  buscador y los filtros de tallas/colores/etiquetas.
- `20261006190000_lowercase_user_emails`: normaliza a minúsculas los correos
  existentes (datos; no toca un correo si ya existe otro igual en minúsculas).
- `20261006191000_add_fk_indexes`: índices en las claves foráneas con
  `ON DELETE SET NULL` (`CartSessionItem.productId`, `CartRequestItem.productId`,
  `CartRequestEvent.authorId`).

**Nunca edites una migración ya aplicada** (Prisma guarda su checksum). Para
comprobar que las migraciones producen exactamente `schema.prisma`:
`npm run db:drift` (necesita `SHADOW_DATABASE_URL`, una base desechable vacía).

Prisma 7 requiere un archivo `prisma.config.ts` (ya no se admite
`datasource.url` dentro de `schema.prisma`); ver
[docs/DEPLOYMENT.md](DEPLOYMENT.md) para cómo correr `prisma migrate deploy`
en producción.
