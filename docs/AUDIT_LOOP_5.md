# Bucle de auditoría 5 (6 de octubre de 2026)

Auditoría independiente sobre el estado ya validado del bucle 4. Método: cinco
revisiones de solo lectura en paralelo (seguridad, tienda pública, datos y
rendimiento, calidad de código, despliegue) **y verificación de cada hallazgo
contra el código antes de actuar** — los informes de los revisores se tratan
como hipótesis: las correcciones aquí listadas están reproducidas o probadas.

## Línea base (antes de los cambios)

- `typecheck`, `lint`: correctos. `npm test`: 137 pruebas. Build: correcto.
- `npm audit`: 6 *high* (2 avisos nuevos desde el bucle 4).
- Sin CI en el repositorio.

## Bucle 1 — problemas y correcciones

| Prioridad | Problema (cómo se verificó) | Corrección |
| --- | --- | --- |
| **Alta** | En **producción** el sitemap, `og:image` y las canónicas apuntaban a `http://localhost:3000` (`curl` a `/sitemap.xml` y a la home): `NEXT_PUBLIC_SITE_URL` no está definida en Render | `src/lib/site-url.ts`: `NEXT_PUBLIC_SITE_URL` → `RENDER_EXTERNAL_URL` → localhost solo en desarrollo; 5 usos reemplazados; 4 pruebas |
| **Alta** | Cada vista de producto y cada "agregar al carrito" reescribía `Product.updatedAt` (reproducido: `prisma.update` lo cambia), que es el orden por defecto del catálogo, el de "relacionados" y el `lastmod` del sitemap → el catálogo se reordenaba con el tráfico y la paginación saltaba/repetía filas | Contadores con SQL directo (no tocan `updatedAt`); desempate por `id` en todos los órdenes; 2 pruebas de integración |
| **Alta** | Formulario del carrito: cualquier error de validación **borraba lo escrito** (React 19 reinicia los campos de un `<form action>`); verificado en navegador, incluido el `<select>` | La acción devuelve los valores y errores por campo; `defaultValue` + `key` en el select; error enlazado al campo (`aria-invalid`) |
| **Alta** | Carrera en el bloqueo del login: leer + sumar + escribir absoluto con bcrypt de ~250 ms permitía esquivar los 5 intentos | `{ increment: 1 }` atómico; prueba actualizada |
| **Alta** | `buckets.clear()` del limitador al llenarse: ~10 000 correos inventados borraban los contadores de todos (carrito incluido) | Se descartan solo las claves más antiguas; límite adicional por IP en el login; 2 pruebas |
| **Alta** | Opciones de filtro: lectura completa de todos los productos en cada visita y una segunda lectura completa al filtrar por color (coste lineal con el catálogo; el brief prevé 300+ SKU) | `SELECT DISTINCT unnest(colors)` (decenas de filas) + memoización de 60 s de las opciones; 2 pruebas de integración contra PostgreSQL |
| Media | La vista PHP exponía `price_ref` aunque `showPrices` esté apagado | Migración `20261006180000_…` (con `::numeric(12,2)`: la primera versión falló al aplicarse y se corrigió); prueba de integración |
| Media | Reactivar una cuenta o cambiarle el rol no cerraba sus sesiones (solo la contraseña) | `updateUserAction` sube `sessionVersion`; 6 pruebas |
| Media | Un vendedor solo gestiona lo libre o suyo — sin pruebas | 12 pruebas de acciones (propiedad, `WHERE` condicional, carrera `count=0`, destinatarios inactivos) |
| Media | `?estado=` inválido en solicitudes → 500; `?pagina=` sin tope (`skip` desbordable) y canónica de páginas fuera de rango = duplicado de la última | Validación del enum; tope 10 000; redirección a la página real |
| Media | Categorías con profundidad ilimitada pero visibilidad calculada solo con el padre directo | Máximo dos niveles en el servidor; 4 pruebas |
| Media | Favicon e imagen Open Graph congelados en el build | `revalidate = 300` (el build ahora muestra `5m` en ambas rutas) |
| Media | Accesibilidad: foco de teclado invisible en las fichas de talla/color, selects sin etiqueta, grupos sin `fieldset/legend`, patrón `tablist` incompleto en la galería | Anillo de foco compartido (verificado por estilos calculados), `aria-label`, `fieldset/legend`, botones con `aria-pressed` |
| Media | Carrito: "−" desde 1 borraba la línea sin avisar; cantidades solo con ±; botones de 26 px | Cantidad editable (tope 500, verificado en navegador), "−" se detiene en 1, objetivos de 40 px |
| Media | Los 404 dentro del sitio perdían cabecera, pie y enlace de salto | `(public)/not-found.tsx` (verificado: 404 real, `<header>`, `<footer>`, un solo `<main>`, `noindex`) |
| Media | Consulta duplicada del producto (metadatos + página); producto sin `cache()` | `React.cache` sobre `getProductBySlug` |
| Media | Pool de Prisma sin límite de espera | `max` 5 (configurable) y `connectionTimeoutMillis` |
| Baja | Sin cabecera COOP; `X-Powered-By` activo; fondos estacionales sin caché | `Cross-Origin-Opener-Policy`, `poweredByHeader: false`, caché de 1 día en `/seasonal/*` |
| Baja | Contraseña de login sin máximo | `.max(200)` |
| Baja | Código muerto (`getFeaturedProducts`) | Eliminado |
| Baja | `npm audit`: `source-map-js` | `npm audit fix` (solo lockfile). Producción: 0 vulnerabilidades |
| **Nueva función** | Pedido del dueño: ajuste del perfil de cada vendedor | `/admin/perfil`: carga de trabajo, nombre y **cambio de contraseña propio** (contraseña actual, límite de intentos, cierra las otras sesiones y conserva la actual); 6 pruebas; verificado en navegador |
| **DevOps** | No existía CI; no había comprobación de deriva migraciones↔esquema | `.github/workflows/ci.yml` (PostgreSQL real, deriva, tipos, lint, pruebas, build, `npm audit --omit=dev`) y `npm run db:drift` (resultado local: "No difference detected") |

### Hallazgos de los revisores que se verificaron y NO se aplican (o se difieren)

- *"Cualquiera puede bloquear la cuenta admin"*: cierto por diseño de un
  bloqueo por cuenta; se documenta como riesgo aceptado con sus mitigaciones
  (SECURITY.md) en vez de reemplazar el mecanismo.
- *Vistas de producto/`addToCartCount` sin límite*: ahora no mueven el orden;
  limitar por IP queda como mejora (los contadores solo alimentan el panel).
- *Caché pública de páginas*: el nonce de la CSP exige render por petición; la
  alternativa (CSP con hashes) es un cambio de arquitectura. Se mitiga con
  `cache()`, memoización de opciones y menos consultas. Pendiente.
- *Redimensionar los WebP estacionales*: son recursos de diseño del otro
  agente; solo se añadió caché. Pendiente de diseño.
- *`robots.txt` con `Disallow: /` en la primera consulta a producción*:
  observado una vez, **no reproducible** en 5 consultas posteriores (todas
  correctas). Probable arranque en frío del plan gratuito; no se actuó.
- *Un fallo propio*: al aplicar el filtro de tallas reutilicé por error el
  normalizador de colores (borraba tallas como "38"); se detectó al revisar el
  diff y se corrigió con `isFilterableCatalogSize` y pruebas, antes de commitear.

## Resultados del bucle 1

`typecheck` y `lint` limpios; 188 pruebas; build correcto; `npm audit --omit=dev`: 0.
El bucle 1 se cerró con un commit local (`7b7f4d3`) antes de empezar el 2.

## Bucle 2 — re-auditoría desde el estado corregido

Método: (a) probar contra un **servidor de producción local que simula Render**
(`NEXT_PUBLIC_SITE_URL` vacía + `RENDER_EXTERNAL_URL`), (b) tres revisiones de solo
lectura en paralelo (regresiones del commit del bucle 1, calidad de código y
documentación, DevOps/producción) y (c) **verificar cada hallazgo contra el código o
en vivo antes de actuar**. Uno de los informes se equivocó (afirmó que
`src/components/campaign` no existe: existe); otro quedó corto (ver la primera fila).

| Prioridad | Problema (cómo se verificó) | Corrección |
| --- | --- | --- |
| **Crítica** | **Ningún producto sembrado se podía guardar desde el panel**: el campo de foto era `<input type="url">` y el navegador rechaza las rutas `/catalogo/…` con las que se siembran las 360 fotos (en vivo: 12 campos inválidos, ni un POST). Además, los 4 validadores de URL del servidor llamaban `new URL()` dentro de un `refine` que Zod ejecuta aunque `z.url()` ya falló → `TypeError` → **500** al guardar Ajustes (banner relativo), categorías raíz o la carga masiva (reproducido con el esquema real) | `src/lib/validation/url.ts` único y sin excepciones (`http(s)` o ruta del sitio, nunca `//host`); `type="text"` + `aria-label` en las fotos; 20 pruebas; **verificado en el navegador**: un producto sembrado, Ajustes y las categorías Damas/Referencias Damas guardan |
| **Alta** | Un `%00` en la URL o en un parámetro llegaba a PostgreSQL ("invalid byte sequence") y daba **500** (`/catalogo/a%00b`) o error genérico (`?q=%00`, `?talla=%00`); reproducido en el servidor de producción | `src/proxy.ts` responde 400 a `%00` (ruta y consulta; `%2500` sigue siendo texto); los textos del carrito se validan en el servidor; 12 pruebas; re-verificado en vivo (400 en los 4 casos) |
| **Alta** | Un fallo momentáneo de la base de datos tumbaba **todo** el sitio (layout raíz → `getSiteSettings` sin protección: `/`, `/login`, el 404…; reproducido por el revisor de DevOps) | `getSiteSettings` sirve la última lectura correcta ante un fallo (nunca valores inventados: el admin también la lee); `statement_timeout` de 30 s en el pool; 3 pruebas |
| **Alta** | `robots.txt`/`sitemap.xml` se congelaban en el build con la URL de entonces (en producción, `localhost`) | `force-dynamic` en ambos; verificado en el build que simula Render (host `mpm-portal.onrender.com`); una `NEXT_PUBLIC_SITE_URL=http://localhost…` copiada del `.env.example` se ignora en producción si Render da su URL |
| **Alta** | Entrar con `Ventas@…` (el teclado del móvil capitaliza) fallaba y se podían crear dos cuentas que solo difieren en mayúsculas | Correo normalizado a minúsculas (login y alta de usuarios); migración `20261006190000` (no toca un correo si colisionaría); **verificado en vivo** entrando con `Admin@MPM.local` |
| Media | El seed pisaba lo editado en el panel (visibilidad, nombre, orden y portada de las categorías) en cada ejecución y reimportaba el catálogo contra una base no local sin confirmación | `update: {}` en las categorías; en una base no local con productos exige `SEED_REFRESH_CATALOG=1` |
| Media | La regla de dos niveles bloqueaba renombrar u ocultar una categoría anterior a la regla (A→B→C); el selector de padre ofrecía subcategorías | La regla solo se aplica si el padre cambia; el selector ofrece solo categorías principales (más el padre actual si es antiguo); 3 pruebas |
| Media | Cambio de contraseña propio: los errores de tipeo en la confirmación consumían los 5 intentos; y cambiarla desde `/admin/usuarios` desconectaba a quien se editaba a sí mismo | El límite va después de validar; se renueva la cookie de la propia sesión; 4 pruebas |
| Media | Carrito: botón "−"/"+" `disabled` perdía el foco del teclado, la cantidad no se anunciaba, pegar "1,000" daba 100; mensajes de máximo en inglés; texto truncado sin aviso | `aria-disabled`, región `role="status"`, 4 dígitos + tope; mensajes en español (verificado en el DOM) |
| Media | El test del limitador de frecuencia era vacuo (pasaba también con el `clear()` antiguo); las pruebas de integración se **saltaban en silencio** en CI | Test reforzado (probado con una mutación: ahora falla con el código antiguo); `connectOrSkip` en las 7 suites: con `CI=true` falla si no hay base |
| Media | La acción pública del carrito (único punto que guarda datos personales) y la importación masiva no tenían pruebas | `tests/cart-actions.test.ts` (16) y `tests/product-import-actions.test.ts` (15), ambas verificadas con mutaciones; el `catch {}` mudo de la importación ahora registra el tipo de error (sin datos de la fila) |
| Media | Sin comprobación de vida; `AUTH_SECRET`/`DATABASE_URL` no se validaban al arrancar (SECURITY.md decía que sí); un error en `/admin` caía en la pantalla pública | `/healthz` (sin base de datos) + `healthCheckPath` en `render.yaml`; `src/instrumentation.ts` (verificado con un servidor real: responde 500 a todo, incluido `/healthz`, así que Render rechaza el despliegue); `src/app/admin/error.tsx` |
| Baja | 3 claves foráneas con `SET NULL` sin índice; columnas CSV sin tope; Dependabot ausente; `date-fns` y `@types/bcryptjs` sin uso; caché de `/seasonal` demasiado larga para archivos que cambian en el mismo nombre; sin runbook | Migración `20261006191000`; topes en tallas/colores/material/categorías; `.github/dependabot.yml`; dependencias retiradas; 1 h + 1 día; `docs/DEPLOYMENT.md` §8 (rollback, migración fallida, respaldos, rotación de secretos, borrado de datos personales) |
| Docs | Describían lo que el código no hace: `NEXT_PUBLIC_WHATSAPP_NUMBER` ("respaldo") no se lee en ningún sitio; Cloudinary "listo" pero sin conectar; payload de sesión, profundidad de categorías, sitemap "pendiente", lista de scripts y de suites, migraciones, "Pendiente" inexistente | README, ARCHITECTURE, DATA_MODEL, SECURITY, DEPLOYMENT y `.env.example` corregidos (cada afirmación nueva se comprobó contra el código/migraciones) |

### Hallazgos de este bucle verificados y NO aplicados (con motivo)

- *`autoDeployTrigger: checksPass`*: bloquearía todos los despliegues si el propio
  workflow (aún nunca ejecutado en GitHub) fallara. Queda documentado en
  DEPLOYMENT.md §8 para activarlo cuando `verify` haya pasado en verde.
- *Redirección permanente para páginas fuera de rango*: el rango cambia con el
  catálogo; un 308 cacheado sería incorrecto. Se corrigió el comentario engañoso
  y la canónica apunta a la última página real.
- *`ChangePasswordForm` vacía los campos tras un error*: es deliberado para una
  contraseña (no se reenvía al navegador).
- *`NEXT_PUBLIC_SITE_URL` literal en `render.yaml`*: el dominio definitivo aún no
  existe; con `RENDER_EXTERNAL_URL` el sitio ya queda correcto.
- *Acciones de solicitudes que devuelven `void` en silencio ante un permiso
  denegado* y *`mapPrismaError` unificado*: la interfaz del vendedor ya es de solo
  lectura para lo ajeno; se deja como mejora de consistencia.
- *Componentes sin uso (`ui/card`, `ui/spinner`, `category-chips`), SVG de plantilla
  en `public/`, 32 MB de imágenes versionadas*: son del área visual del otro agente.
- *Orden de expulsión del limitador* (un bucket antiguo y activo se expulsa
  primero): exige ≥10 000 claves distintas; riesgo bajo, documentado.

## Bucle 6 — verificación en móvil (7 de octubre de 2026)

Línea base: `typecheck`, `lint` limpios; 259 pruebas; `npm audit --omit=dev`: 0.

| Prioridad | Problema (cómo se verificó) | Corrección |
| --- | --- | --- |
| Media | En móvil (375 px) las 5 tablas del admin miden 640 px y la acción "Editar"/"Ver" queda fuera de pantalla (x=627) sin pista de scroll; el nombre de la fila no era enlace → no se descubría cómo editar un producto, categoría, usuario, campaña o solicitud | La celda principal de cada fila enlaza a la misma página de edición; la columna "Editar" se conserva. Verificado en navegador: el nombre abre "Editar producto" |

Corregido después: enlaces de cabecera del admin ("Panel MPM", "Ver sitio público")
pasaron de 16 px a 32–40 px de alto táctil. Pendiente: un servidor `next start` antiguo en el puerto 3000 responde 500
en `/login` por quedar desfasado respecto de `.next` (el `next dev` del 3001 funciona).

### Retiro de la integración PHP y código muerto (7 de octubre de 2026)

Por decisión del dueño: se eliminó la integración con PHP — migración
`20261007120000_drop_php_integration_views` (`DROP SCHEMA integration CASCADE`; las
migraciones antiguas se conservan como historial), `docs/PHP_INTEGRATION.md` y su prueba
de integración (−2 pruebas: 257). Código muerto verificado por búsqueda de usos y
retirado: `src/lib/cloudinary.ts` y la dependencia `cloudinary` (la CSP y
`remotePatterns` de `res.cloudinary.com` se conservan para URLs pegadas),
`ui/spinner`, `ui/card`, `catalog/category-chips`, `buildGeneralInquiryMessage`,
`SUGGESTED_SIZES/COLORS`, `CART_REQUEST_OPEN_STATUSES` y las 5 SVG de plantilla de
`public/`. `typecheck`, `lint`, 257 pruebas y `db:drift` limpios; audit: 0.

### Bucle 6 (cont.) — marcador del seed en el carrito

| Prioridad | Problema (cómo se verificó) | Corrección |
| --- | --- | --- |
| Media | Un producto sembrado sin talla/color (`"Consultar disponibilidad"`) lo preseleccionaba y llegaba al carrito como "Talla Consultar disponibilidad · Consultar disponibilidad" (verificado en el carrito a 375 px) | `getProductBySlug` (vista pública) filtra el marcador con `withoutPlaceholderOptions`; el admin lo sigue viendo. Prueba de integración (258 en total); verificado en el navegador: `size`/`color` = `null` |

Revisado sin hallazgos: catálogo y carrito a 375 px sin desbordamiento, aviso de "agregado" anunciado, envío vacío bloqueado con foco en el primer campo. Pendiente (área del otro agente): enlaces del pie con 16 px de alto táctil.

### Bucle 6 (cont.) — colores, banner de campaña y campaña nueva

- **Colores**: el color elegido se pinta con su tono (muestra); `MEGENTA` (error de tipeo en los nombres de foto) no tenía muestra → alias a `MAGENTA`; un color sin muestra ahora muestra un estado seleccionado visible (antes no cambiaba nada). Prueba que fija los 52 colores reales del catálogo. Verificado en vivo (Cacao, Café, Chocolate, Rosado, Amarillo, V. Cali, Hoja Seca, Magenta, Negro, Blanco).
- **Banner de campaña**: aviso superior más grande (texto 20 px en escritorio, etiqueta y enlace mayores), sin tocar `globals.css`.
- **Campaña nueva**: formulario precargado (descripción, inicio hoy en hora de Colombia, fin a 14 días, inactiva) con vista previa en vivo del aviso y recomendación de longitud (`src/lib/campaign-defaults.ts`, 2 pruebas).

### Retiro de "Consultar disponibilidad" y escala XS–XXL (7 de octubre de 2026)

Migración `20261007140000_remove_availability_placeholder`: las referencias con el marcador pasan a tallas XS–XXL, se quita el marcador de colores y la frase de relleno "Consulta disponibilidad de talla y color con un asesor MPM." de las descripciones sembradas. El seed ya no lo genera. El filtro de tallas ofrece siempre XS–XXL (más las reales extra, p. ej. "Talla única"). En la ficha la talla ya **no se preselecciona** y es obligatoria. Las funciones que filtran el marcador (`isFilterableCatalogSize/Color`, `withoutPlaceholderOptions`) se conservan como defensa. Verificado: filtro M → 14 referencias; ficha inválida hasta elegir talla.

### Público y tallas (7 de octubre de 2026)

Filtro del catálogo: Todos/Hombre/Mujer (`CATALOG_AUDIENCES`) y tallas XS–XXL sin "Talla única". Formulario de producto: el público solo ofrece Hombre/Mujer y es obligatorio en productos nuevos (antes UNISEX por defecto); un producto antiguo con otro valor lo conserva. **Carga masiva CSV**: `publico` solo acepta hombre/mujer y es obligatorio al crear una referencia (al actualizar una existente, vacío conserva el valor); la plantilla de ejemplo usa "mujer". 2 pruebas nuevas.

### Rediseño de campañas (8 de octubre de 2026)

Por pedido del dueño, referencia de estilo: Koaj, H&M, Seven Seven, Zara, Arturo Calle (editorial, sobrio, la imagen como protagonista). Se retiró la decoración (círculos y rayas verde neón, contador "01 / 01", marco y sello "Selección MPM", etiqueta "Oferta especial"). **Aviso superior**: barra lisa negra, nombre en mayúsculas + texto + "Ver más". **Inicio**: bloque claro con título grande en mayúsculas, texto y "Ver colección", con la imagen al lado si existe. **Página de la campaña**: portada a todo ancho con la imagen de fondo (o bloque liso sin imagen), vigencia discreta y encabezado "Colección" con el conteo. Formulario admin: ayuda sobre la imagen de portada. Verificado en navegador en escritorio y móvil, con y sin imagen.

**Formato fijo y sobrio (decisión del dueño)**: las campañas siempre usan el mismo diseño sin imagen (bloque claro, título grande en mayúsculas, texto, vigencia y "Colección"), para que la estética no dependa de lo que se suba; se descartó la portada con foto automática. El campo de imagen se quitó del formulario del admin y la acción ya no escribe `bannerImageUrl` (la columna sigue en la base, sin uso).

### Fondo festivo continuo y carrusel de portada (8 de octubre de 2026)

Pedido del dueño: fondos de festividades continuos, no cortados ni separados, con las tres pinturas integradas a lo largo de la página y funcionando en computador, portátil, tablet y celular; portada en carrusel; fotos completas (camisas sin recortar).

- **Fondo**: `SeasonalBackdrop` reparte las 3 pinturas de cada festividad arriba/en medio/abajo de la página, ancladas al lado del motivo, escaladas por unidades de contenedor (`cqw`) para que el motivo quepa **completo** en cualquier ancho (alto = el menor entre el que deja el motivo dentro de la pantalla y el que cubre el ancho, mín. 28rem), con bordes difuminados hacia el color de papel. Datos en `src/lib/seasonal-art-manifest.json` (generado por `npm run seasonal:manifest`, 15 festividades; prueba que verifica archivos y valores). Se eliminaron las formas CSS y los rectángulos con posiciones fijas anteriores. Las pinturas de fondo oscuro (Velitas) se funden con un resplandor radial. Bandas y tarjetas pasan a ser translúcidas con festividad para que el fondo continúe detrás; el texto sobre la pintura lleva un halo de papel.
- **Carrusel** (`src/components/home/hero-carousel.tsx`): portada, Damas, Caballero y Nosotros; táctil con snap, flechas, puntos, avance automático pausable y respeta "reducir movimiento"; fotos 3:4 con `object-contain`.
- **Fotos completas**: tarjetas de producto y galería pasan de `object-cover` a `object-contain` (había ~60 fotos más angostas que 3:4 que recortaban la prenda).
- Verificado en navegador a 375, 768, 1024, 1280 y 1440 px, con Carnaval, Velitas y Día del Hombre; las 15 festividades renderizan sus 3 capas.

### Ajustes del fondo festivo y revisión de filtros (8 de octubre de 2026)

- **Alternancia izquierda–derecha–izquierda**: las tres pinturas se reflejan (`seasonal-art--flip`) cuando el motivo está del lado contrario; se verificó con la hoja de contactos de las 45 imágenes que ninguna tiene letras. Prueba (`tests/seasonal-backdrop.test.tsx`) que lo garantiza en las 15 festividades.
- **Texto sobre el fondo**: halo de papel heredado en todo el contenido (excepto texto blanco y botones llenos) y **vidrio esmerilado** (`.seasonal-glass`: velo 54 % + desenfoque) en encabezado y banda del catálogo, Nosotros, carrito, política y migas de pan. Hero del inicio: fotos a la izquierda y texto a la derecha en escritorio; velo en celular. Verificado a 375, 768, 1280 y 1440 px.
- **Ficha de producto**: la foto principal tenía el alto de la columna de texto (hasta 1369 px) y `object-contain` dejaba una franja vacía; ahora marco fijo 3:4.
- **Filtros verificados contra SQL** (todas las opciones): público (6/12), 4 etiquetas, 6 tallas, 46 colores, 4 categorías, búsqueda y combinaciones (Hombre + XXL + Blanco = 2, coincide). Dos correcciones: (1) **Nombre A–Z no era alfabético** (PostgreSQL ordena en binario: "CMLR" antes de "Camisón"); ahora ordena con `Intl.Collator("es")` (sin mayúsculas/acentos, números naturales) con paginación estable; prueba de integración. (2) El filtro de **etiquetas** ofrecía opciones sin productos (3 de 4 en desarrollo); ahora solo aparecen las que alguna prenda tiene (más las activas en la URL).

**Continuidad hasta el pie**: con festividad, el margen entre el contenido y el pie pasa al fondo festivo (`padding-bottom` en `main`, `margin-top: 0` en el pie) para que no asome la base blanca. Verificado además en Amor y Amistad, Negros y Blancos y Navidad (inicio, catálogo, Nosotros, política, carrito vacío y con prenda).

**Revisión visual de las 15 festividades** (catálogo a 1280 px en cada una; inicio y catálogo en móvil en San Pedro y Vallenato): texto legible en todas. Ajuste: el gris secundario (`--color-ink-soft`) se oscurece (#3b444a) dentro de las zonas de vidrio.

### El diseño festivo y la campaña conviven (9 de octubre de 2026)

Decisión del dueño. Una regla del 8 de octubre apagaba **todo** el diseño festivo mientras hubiera una campaña activa (layout raíz y público), por lo que con campaña activa el sitio se veía sin festividad. Se retiró: el diseño sigue el calendario (o lo elegido en el panel) y la campaña se muestra en su barra y su página. En modo automático el calendario no tiene festividad entre el 6 de octubre y el 30 de noviembre (San Pacho termina el 5/oct; Velitas empieza el 1/dic): en ese hueco solo se ve diseño si se elige uno manual en `/admin/festividades`.
