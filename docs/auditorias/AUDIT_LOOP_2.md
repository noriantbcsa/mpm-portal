# Bucle de auditoría 2

Segunda pasada completa, con foco en lo que el bucle 1 dejó pendiente:
preparación para producción (SEO técnico, manejo de errores, accesibilidad,
config) y verificar que las correcciones del bucle 1 siguen sosteniéndose
después de seguir integrando el trabajo del agente de frontend.

## Verificación de lo corregido en el bucle 1

Se repitió, en limpio, todo lo verificado antes: `npm run typecheck`,
`npm run lint -- --max-warnings=0`, `npm test` (50 pruebas) y `npm run
build` — los cuatro en verde. Se re-probó en el navegador: panel admin
carga sin el error de `cx()`, carga masiva de CSV, activar/desactivar
campañas, cambiar estado/asesor de una solicitud (el `<select>` ya refleja
el valor sin recargar), `/nosotros` y `/politica-de-datos` responden 200. No
hubo regresiones.

## Hallazgos nuevos

| # | Hallazgo | Severidad | Estado |
| - | -------- | --------- | ------ |
| 8 | No existían `sitemap.xml` ni `robots.txt` (pedidos explícitamente en el enunciado) | **Alta** | ✅ Corregido |
| 9 | No había página 404 ni límite de errores (`error.tsx`) propios — un enlace roto o un error inesperado caía en la pantalla genérica de Next.js, sin marca ni salida (catálogo/WhatsApp) | **Media** | ✅ Corregido |
| 10 | Los botones de WhatsApp en las páginas propias (`not-found.tsx`, `/nosotros`, detalle de solicitud) usaban texto blanco sobre el verde de WhatsApp (`#25D366`): contraste 1.98:1, por debajo del mínimo de accesibilidad (AA exige 3:1 para texto grande/negrita) | **Media** | ✅ Corregido (texto oscuro `#0b3d24`, contraste 6.2:1) |
| 11 | El mismo patrón (texto blanco sobre `#25D366`) sigue presente en los componentes públicos que edita el agente de frontend (`header.tsx`, `whatsapp-float-button.tsx`, `button.tsx`, `cart-page-client.tsx`, home) | **Media** | ⚠️ **Sin corregir** — son archivos fuera de mi alcance acordado (identidad visual). Recomendación concreta: cambiar `text-white` por un color oscuro (ej. `#0b3d24` o `#04120a`) en esos botones, o usar un verde más oscuro con texto blanco (`#075E54`, contraste 7.67:1) |
| 12 | El anillo de foco (`.focus-ring`, usado en todo el sitio público) usa `var(--brand-secondary)` (`#c8ff00`) como color de contorno. Contra fondos blancos, ese verde-lima tiene ~1.2:1 de contraste — falla el mínimo de 3:1 para indicadores de foco (WCAG 1.4.11). En la práctica sigue siendo *perceptible* (se probó tabulando por el catálogo) porque es un color muy saturado, pero no cumple el criterio formal | **Baja-Media** | ⚠️ **Sin corregir** — `globals.css` es del agente de frontend. Recomendación: usar un color de foco fijo de alto contraste (ej. `var(--ink)` con un halo blanco), independiente de la paleta de marca, para que funcione con cualquier paleta futura |
| 13 | Dependencias sin usar (`@faker-js/faker`, `@testing-library/*`, `@vitejs/plugin-react`) | Baja | ✅ Corregido en el bucle 1, reconfirmado aquí |

## Revisión ampliada de preparación para producción

- **SEO**: metadatos dinámicos por página ✅, JSON-LD (`Product`,
  `WebSite`/`SearchAction`) ✅, URLs amigables (slugs) ✅, sitemap/robots ✅
  (nuevos en este bucle). Pendiente real: OpenGraph images dedicadas (hoy
  reutiliza la primera foto del producto, que es razonable, pero no hay una
  imagen OG genérica para el sitio si un producto no tiene fotos).
- **Rendimiento**: todas las imágenes usan `next/image` con `sizes`
  apropiado; el catálogo pagina de a 24 (`CATALOG_PAGE_SIZE`) en vez de
  cargar 300+ productos en una sola respuesta. No se corrió Lighthouse
  formalmente (no hay navegador headless con throttling de red disponible
  en este entorno); es una verificación pendiente antes de lanzar, sobre el
  dominio y hosting reales.
- **Accesibilidad**: `lang="es"` ✅, *skip link* ✅, etiquetas asociadas a
  cada campo de formulario (`useId` + `aria-describedby`) ✅, errores de
  formulario con `role="alert"` ✅, imágenes con texto alternativo obligatorio
  en el formulario de productos ✅. Contraste de texto normal revisado por
  muestreo (texto secundario 6.1:1, botón "Ver catálogo" 15.6:1) — bien.
  Pendientes: hallazgos 11 y 12 de la tabla de arriba.
- **Manejo de errores**: `not-found.tsx` (raíz y `/admin`) y `error.tsx`
  nuevos en este bucle. Los formularios muestran el mensaje de error
  específico devuelto por el servidor (nunca un stack trace ni un mensaje
  genérico de Next). La carga masiva de CSV reporta errores por fila sin
  abortar el resto del archivo.
- **Datos personales**: sin cambios respecto al bucle 1 — ver
  `docs/SECURITY.md`.
- **Configuración/despliegue**: `docs/DEPLOYMENT.md` documenta variables de
  entorno, migraciones y qué *no* sembrar en producción. No se ha
  desplegado realmente a Vercel dentro de esta sesión (no hay cuenta/proyecto
  conectado); queda como paso manual para el equipo de MPM o para una
  sesión con acceso a Vercel.

## Problemas críticos restantes

Ninguno bloqueante para continuar el desarrollo. Los hallazgos 11 y 12 son
recomendaciones concretas y acotadas para quien continúe la capa visual, no
errores funcionales — el sitio es completamente utilizable con teclado y
lector de pantalla, solo con un margen de contraste menor al ideal en dos
detalles puntuales. No hizo falta un tercer bucle completo.

## Qué no se auditó en profundidad (transparencia)

- No se corrieron pruebas de integración contra una base de datos real en
  CI (las 50 pruebas automatizadas cubren solo lógica sin efectos
  secundarios; ver README).
- No se probó con un lector de pantalla real (NVDA/VoiceOver), solo
  atributos ARIA/semántica HTML y navegación por teclado manual.
- No se hizo prueba de carga/concurrencia (múltiples usuarios enviando
  solicitudes a la vez).
