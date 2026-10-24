# Inventario técnico
Stack (leído de package.json): Next 16.4.0, React 19.2.8, Prisma 7.10 + adapter-pg, PostgreSQL, zod 4, jose (JWT HS256), bcryptjs, zustand, vitest 5, Tailwind 4. Node requerido 22.x (`.nvmrc`, `engines`); el `node` por defecto del sistema es 18.19.1 (usar nvm 22.23.1).
Documentación leída: AGENTS.md/CLAUDE.md (aviso: Next con cambios incompatibles; guías en node_modules/next/dist/docs — NO leídas en esta pasada), README, docs/auditorias/AUDIT_LOOP_5.md (parcial), ARCHITECTURE.md (parcial), memoria del proyecto.
| Módulo | Ubicación | Revisión |
|---|---|---|
| Portal público | src/app/(public), components/{ui,layout,catalog,product,cart} | Parcial: solo build y pruebas existentes (área del otro agente de diseño) |
| Catálogo/consultas | src/lib/products.ts | Parcial: SQL crudo revisado (plantillas parametrizadas) |
| Admin (productos, categorías, campañas, usuarios, solicitudes, ajustes, perfil, festividades) | src/app/admin/** | Autorización revisada (16/16 acciones con requireRole/requireUser) |
| Auth/sesión | src/lib/auth, src/proxy.ts | Solo cobertura de pruebas; sin lectura profunda |
| Carrito público | src/app/(public)/carrito/actions.ts | Sin guard por diseño (público); pruebas existentes (16) |
| Datos | prisma/schema.prisma, 24 migraciones | NO revisado en detalle |
| CI/Despliegue | .github/workflows/ci.yml, render.yaml | Leído render.yaml; ci.yml no revisado |
Herramientas disponibles: Bash, navegador integrado, Agent, vitest, eslint, tsc, npm audit, docker (Postgres local :5544). Sin Codex, sin skills de seguridad/BD específicas.
