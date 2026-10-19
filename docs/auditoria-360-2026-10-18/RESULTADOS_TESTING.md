# Resultados de testing (Node 22.23.1, 18-oct-2026)
| ID | Comando | Esperado | Obtenido | Estado |
|---|---|---|---|---|
| T-01 | `npm run typecheck` | sin errores | sin salida de error | PASS |
| T-02 | `npm run lint` | sin errores | sin salida de error | PASS |
| T-03 | `npm test` | todo verde | 44 archivos, 355 pruebas OK (incluye integración contra PostgreSQL local :5544; no se confirmó que ninguna se saltara) | PASS |
| T-04 | `npm run build` | build OK | rutas generadas, sin error | PASS |
| T-05 | `npm audit --omit=dev` | 0 | 0 vulnerabilidades | PASS |
| T-06 | `npm audit` | 0 | 5 high (dev) | FAIL (H-02) |
| T-07 | `SHADOW_DATABASE_URL=…/mpm_portal_shadow npm run db:drift` | sin diferencia | "No difference detected", exit 0 (sin la variable falla por configuración, no por deriva) | PASS |
| T-08 | Navegador 375 px, servidor de producción local :3100: `/`, `/catalogo`, `/carrito`, `/admin/productos`, `/admin/solicitudes`, `/admin/usuarios` | sin desbordamiento horizontal, 1 h1, campos etiquetados | overflowX=0 en todas; 1 h1 y 1 main; 0 imágenes sin alt; 0 campos sin etiqueta; consola sin errores propios | PASS (comprobaciones automáticas + capturas de `/`, `/catalogo`, `/carrito`, `/admin/productos`) |
| T-09 | Objetivos táctiles ≥24 px | todos | enlaces de 16 px de alto en nav/pie (H-04) | FAIL (P3) |
| T-10 | CSP `frame-ancestors 'none'` | iframe bloqueado | el navegador bloqueó el marco | PASS |
| T-11a | Login con teclado (cuenta sembrada local, BD desechable) y acceso a `/admin/productos/nuevo` | entra y llega al panel | entró | PASS |
| T-11b | Alta de producto en admin: precio mayorista (50000) > detal (30000) | rechazo con mensaje y valores conservados | "El precio mayorista no puede superar el precio al detal", campos conservados | PASS |
| T-11c | Alta con mayorista 20000 | guardado y redirección a edición | fila `AUD-001` DISPONIBLE, 30000/20000, MUJER, tallas {S,M}, color {Negro}; ficha pública `/producto/producto-auditoria` y listado la muestran ("Sin foto disponible") | PASS |
| T-11d | Foco de teclado en `/catalogo` (60 controles) | indicador visible | enlaces con doble anillo (blanco 2 px + sombra oscura 4 px); las fichas de talla/color muestran anillo en la etiqueta al usar teclado (captura). 38 radios ocultos sin indicador propio: falso positivo | PASS |
| T-11e | Contraste de texto en `/catalogo` (cálculo WCAG con fondos sólidos) | ≥4.5:1 (≥3:1 texto grande) | 0 incumplimientos; no evalúa texto sobre imágenes/degradados | PASS parcial |
| T-16 | Editar producto (nombre, estado OCULTO) | guardado; oculto en público | BD actualizada; `/producto/…` 404, ausente del catálogo y del sitemap | PASS |
| T-17 | Borrar producto | — | No existe la acción (solo estado OCULTO; botones sin "eliminar") | N/A (diseño) |
| T-18 | Campañas: fechas invertidas / alta activa con 18 productos | rechazo / guardado y publicación | "La fecha de inicio debe ser anterior a la fecha de fin"; luego campaña activa, 18 productos, visible en la home y `/campanas/campana-auditoria` 200 | PASS |
| T-19 | Usuarios: correo duplicado en mayúsculas; alta nueva con mayúsculas | rechazo; correo guardado en minúsculas | "Ya existe un usuario con ese correo."; alta guardada como `vendedor.prueba@mpm.local` | PASS (H-08 corregido) |
| T-20 | Ajustes: color inválido | rechazo, BD intacta | "Usa un color hexadecimal"; BD sin cambios | PASS (H-09 pendiente) |
| T-21 | Maquetación a 768 px en 14 pantallas admin y a 320 px (public + admin) | sin elementos cortados ni scroll horizontal de página | /admin/usuarios cortada antes del arreglo (H-07); resto sin problemas; 320 px sin desbordamiento en home, catálogo, producto, carrito, usuarios y producto nuevo | FAIL → PASS |
| T-22 | Regresión tras H-07/H-08: typecheck, lint, `npm test`, build | todo verde | 44 archivos, 357 pruebas OK; build correcto | PASS |
| T-23 | Despliegue de 7336f2a en Render | — | `GET /healthz` = 200, lo que no demuestra qué versión corre; no se envió pedido de prueba en producción | NOT RUN |
| T-24 | Importación CSV desde el navegador (subida de archivo), lector de pantalla real, ediciones en categorías/solicitudes/perfil | — | La subida de archivos no es posible con las herramientas disponibles; CSV cubierto solo por 15 pruebas automáticas | NOT RUN |
| T-13 | Envío de solicitud real en navegador (BD desechable `mpm_portal_audit`, servidor :3200) | solicitud guardada | ANTES del arreglo: error 500, 0 filas. DESPUÉS: fila NUEVO con su ítem | FAIL → PASS (H-05) |
| T-14 | Validación del formulario: teléfono "abc" con nombre/ciudad escritos | error por campo y valores conservados | "Ingresa un número de teléfono válido." y campos conservados | PASS |
| T-15 | Regresión tras H-05: typecheck, lint, `npm test`, build | todo verde | typecheck/lint/build sin errores; 44 archivos, 356 pruebas OK (+1 nueva) | PASS |
| T-12 | Rendimiento / carga / E2E automatizado | — | — | NOT RUN |
