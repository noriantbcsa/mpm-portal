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

(ver sección final tras el bucle 2)
