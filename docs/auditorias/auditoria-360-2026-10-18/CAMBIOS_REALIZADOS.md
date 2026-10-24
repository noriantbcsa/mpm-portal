# Cambios realizados
H-05 (commit 7336f2a, push a `origin/main` autorizado por el usuario; el despliegue en Render no fue comprobado): 
- `src/app/(public)/carrito/actions.ts`: `items.create` mapea explícitamente los 7 campos de `CartRequestItem` (se excluye `priceWholesaleSnapshot`).
- `tests/cart-actions.test.ts`: prueba nueva con el ítem resuelto real (con precio mayorista); falló antes del arreglo, pasa después.
Revisado el diff (dos archivos). La BD desechable `mpm_portal_audit` se creó, se usó y se eliminó; la BD de desarrollo no se tocó. Ya no es cierto que no hubo cambios de código; lo siguiente era el estado inicial.
H-07 y H-08 (sin commit): `src/app/admin/usuarios/page.tsx` (grid), `src/app/admin/usuarios/actions.ts` y `src/components/admin/user-forms.tsx` (conservar nombre/correo/rol tras un error), `tests/user-actions.test.ts` (prueba nueva que falló antes). Verificados en navegador; 357 pruebas, typecheck, lint y build correctos.
Además Solo se añadió esta carpeta `docs/auditorias/auditoria-360-2026-10-18/` (sin commit). `npm run build` regeneró `.next/` (ignorado).
