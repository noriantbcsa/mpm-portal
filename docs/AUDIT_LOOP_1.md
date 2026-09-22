# Bucle de auditoría 1

## Alcance auditado

Toda la capa que se construyó en este primer bucle: esquema de datos,
autenticación/permisos, lógica de carrito y solicitudes, panel
administrativo completo (productos, categorías, campañas, solicitudes,
carritos abandonados, usuarios, ajustes) y las páginas públicas que hacían
falta para que la navegación no tuviera enlaces rotos.

## Método

1. `npm run typecheck`, `npm run lint`, `npm run build` tras cada bloque de
   código nuevo (no solo al final).
2. Suite de pruebas unitarias (`npm test`) para la lógica sin efectos
   secundarios.
3. **Navegación real en un navegador** (servidor `next dev` + Playwright vía
   el panel de vista previa), no solo lectura de código: se hizo login como
   `ADMIN` y como `SALES`, se recorrió el flujo público completo (catálogo →
   filtros → producto → carrito → solicitud → confirmación → WhatsApp) y
   cada sección del panel, incluyendo escribir en formularios reales y subir
   un CSV de prueba.

Este último punto importa porque casi todos los problemas reales que
aparecieron **no los detectó ni TypeScript ni ESLint** — son errores de
límite servidor/cliente de React y de forma de los datos que solo aparecen
al ejecutar.

## Hallazgos y prioridad

| # | Hallazgo | Severidad | Cómo se detectó |
| - | -------- | --------- | --------------- |
| 1 | Todo el panel `/admin` estaba caído (`AdminCard` llamaba a una función exportada desde un módulo `"use client"`) | **Crítica** | Login como admin → pantalla de error en runtime |
| 2 | Sincronizar el carrito (`syncCartSessionAction`) fallaba con `PrismaClientValidationError` y hacía rollback silencioso del contador "agregados al carrito" | **Alta** | Log del servidor mientras se probaba el flujo de carrito |
| 3 | La plantilla CSV descargable no era válida contra su propio importador (una coma sin escapar partía una fila en 15 columnas contra 14 encabezados) | **Alta** | Prueba unitaria nueva (`tests/csv.test.ts`) |
| 4 | `/nosotros`, `/politica-de-datos` y `/campanas/[slug]` devolvían 404 (enlazadas desde el header, el pie de página y el checkbox de consentimiento del carrito, pero sin `page.tsx`) | **Alta** | Revisión de enlaces + navegación manual |
| 5 | `/`, `/carrito`, `/nosotros` y `/politica-de-datos` se generaban como HTML estático en el build (no usan ninguna API de request) pese a depender de contenido editable desde `/admin` | **Media** | Lectura de la tabla de rutas que imprime `next build` |
| 6 | El `<select>` de estado/asesor en el detalle de una solicitud quedaba visualmente desactualizado tras un cambio (no un bug de datos: el valor en base de datos era correcto, solo la UI no refrescaba sin recargar) | **Media** | Cambiar el estado en el navegador y observar que no se reflejaba hasta refrescar |
| 7 | Dependencias instaladas y no usadas (`@faker-js/faker`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`) | **Baja** | Revisión de `package.json` al escribir la documentación |

## Correcciones aplicadas

1. Se extrajo `cx()` a `src/components/admin/ui/cx.ts` (sin `"use client"`)
   para que los Server Components del panel puedan usarlo.
2. `syncCartSessionAction` ahora lista explícitamente las columnas de
   `CartSessionItem` (que no tiene `priceRefSnapshot`) en vez de esparcir el
   objeto completo del snapshot compartido con `CartRequestItem`.
3. `buildProductCsvTemplate()` ahora escapa campos con comas/comillas según
   RFC 4180.
4. Se crearon las tres páginas faltantes (`/nosotros`, `/politica-de-datos`
   con texto de política provisional basado en la Ley 1581 de 2012, y
   `/campanas/[slug]` con banner, categorías priorizadas y productos de la
   campaña).
5. Se agregó `export const dynamic = "force-dynamic"` a las cuatro páginas
   afectadas.
6. Se añadió `key={valor actual}` a los `<select>` de estado/asesor para
   forzar su remonte cuando el servidor confirma el nuevo valor.
7. Se desinstalaron las cuatro dependencias sin uso.

## Verificación tras las correcciones

- `npm run typecheck`, `npm run lint -- --max-warnings=0` y `npm test` (50
  pruebas) en verde.
- `npm run build`: las 26 rutas de la app aparecen como `ƒ` (dinámicas)
  salvo `/_not-found`; ninguna advertencia.
- Repetido en el navegador tras cada corrección: login ADMIN y SALES,
  crear/editar un producto, carga masiva con un CSV de prueba (1 fila nueva,
  1 actualización, 1 fila con categoría inexistente → se reportó el error
  sin romper las otras dos), activar/desactivar campañas (se confirmó que
  activar una desactiva automáticamente cualquier otra), cambiar estado y
  asesor de una solicitud (el `<select>` ya refleja el cambio de inmediato),
  agregar una nota, backdatear manualmente una `CartSession` para confirmar
  que aparece en "Carritos abandonados" tras 8 días.

## No se encontraron (o no se intentaron corregir) en este bucle

Quedan pendientes para el bucle 2: revisión de accesibilidad más formal,
SEO técnico (sitemap/robots), manejo de errores/páginas 404 dedicadas,
rendimiento (Core Web Vitals) y una pasada de seguridad más amplia. Ver
`docs/AUDIT_LOOP_2.md`.
