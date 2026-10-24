# Matriz funcional
| Funcionalidad | Implementación | Evidencia | Prueba | Resultado | Defecto | Prio |
|---|---|---|---|---|---|---|
| Autorización de acciones admin | requireRole/requireUser en cada export | grep: 16 exports / 16 guards | tests/user-actions, category-actions, solicitudes-actions… | PASS (estático + unitario) | — | — |
| Carrito público: enviar solicitud | carrito/actions.ts | log + BD | T-13 | FAIL antes / PASS tras corrección | H-05 | P0/P1 |
| Login/bloqueo | lib/auth/actions.ts | tests/login-lockout | npm test | PASS | — | — |
| Importación CSV | productos/actions.ts | tests/product-import-actions | npm test | PASS | — | — |
| Navegación móvil: home, catálogo, carrito, admin (productos, solicitudes, usuarios) | rutas existentes | capturas y DOM | T-08 | PASS (solo lectura) | H-04 | P3 |
| Alta de producto en admin (validación y guardado) | productos/actions.ts | BD desechable | T-11b/c | PASS | — | — |
| Editar producto / ocultar | productos/actions.ts | BD + público | T-16 | PASS | — | — |
| Campañas | campanas/actions.ts | BD + público | T-18 | PASS | — | — |
| Usuarios (alta, unicidad) | usuarios/actions.ts | BD | T-19 | PASS | H-07/H-08 corregidos | P2/P3 |
| Ajustes del sitio | ajustes/actions.ts | BD | T-20 | PASS (validación) | H-09, H-10 | P3/P2 |
| Importación CSV desde navegador | — | — | T-24 | NOT RUN (solo pruebas automáticas) | — | — |
