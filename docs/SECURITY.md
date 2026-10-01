# Seguridad y privacidad

## Autenticación y sesiones

- Contraseñas con `bcryptjs`, 12 rondas (`src/lib/auth/passwords.ts`).
- Sesión = JWT firmado `HS256` (librería `jose`) en una cookie `httpOnly`,
  `sameSite=lax`, `secure` en producción, 7 días de duración
  (`src/lib/auth/session.ts`). El payload solo contiene `sub` (id), `role` y
  `name` — nunca contraseña, correo ni datos de clientes.
- Mensajes de error de login genéricos ("Correo o contraseña incorrectos")
  para no confirmar si un correo existe en el sistema.
- Cada página y Server Action de `/admin` vuelve a verificar el usuario
  contra la base de datos (`requireUser`/`requireRole`), no solo la cookie —
  ver "Autenticación y permisos" en `docs/ARCHITECTURE.md`. Esto importa
  porque las Server Actions de Next.js son alcanzables por POST directo
  aunque el botón correspondiente esté oculto en la UI.
- Un usuario no puede desactivarse ni quitarse el rol `ADMIN` a sí mismo.
- **Bloqueo por intentos fallidos**: tras 5 contraseñas incorrectas seguidas,
  la cuenta se bloquea 15 minutos (`User.failedLoginAttempts`/`lockedUntil`,
  `src/lib/auth/actions.ts`). Mientras está bloqueada, ni siquiera la
  contraseña correcta la desbloquea antes de tiempo — evita que alguien con
  la contraseña real pero comprometida por fuerza bruta se cuele por la
  ventana de bloqueo. Cualquier `ADMIN` puede desbloquear una cuenta antes de
  los 15 minutos desde `/admin/usuarios/[id]` (botón "Desbloquear ahora").
  Probado con un usuario de prueba real en el navegador (5 intentos fallidos
  → bloqueo → la contraseña correcta sigue rechazada → desbloqueo manual) y
  con pruebas unitarias (`tests/login-lockout.test.ts`).
- **Límite de frecuencia adicional**: el login se limita por IP y correo; la
  sincronización y el envío público del carrito se limitan por IP. Es una
  barrera local de proceso; al desplegar varias instancias debe complementarse
  con el WAF/rate limit del proveedor, porque esa memoria no se comparte.
- Las acciones de servidor tienen un límite explícito de cuerpo de 1 MB. Las
  listas del carrito se validan en servidor y aceptan como máximo 50 líneas.
- `AUTH_SECRET` se rechaza al arrancar si es el placeholder o tiene menos de
  32 caracteres. No reutilices secretos de desarrollo en producción.

## Datos personales

- El único lugar donde se guardan datos de un cliente (nombre, teléfono,
  ciudad, empresa) es `CartRequest`, y solo se crea si `dataConsent: true`
  (checkbox obligatorio enlazado a `/politica-de-datos`).
- `CartSession` (carrito anónimo, usado para detectar abandono) no exige ni
  captura datos de contacto — ver `docs/DATA_MODEL.md` para el porqué de
  mantener `contactNamePartial`/`contactPhonePartial` sin usar por ahora.
- El texto de `/politica-de-datos` es un placeholder alineado a la Ley 1581
  de 2012 (Colombia), marcado explícitamente como pendiente de revisión
  legal — no lo trates como texto legal final.
- Los datos de contacto de una solicitud solo son visibles dentro de
  `/admin` (autenticado); no hay ninguna URL pública que exponga nombre o
  teléfono de un cliente.

## Validación y sanitización

- Toda entrada de formulario (público y admin) se valida con `zod`
  (`src/lib/validation/**`) del lado del servidor, no solo en el cliente.
- El carrito nunca confía en el precio/nombre que manda el navegador:
  `src/lib/cart/resolve-items.ts` reconsulta el producto real antes de
  guardar cualquier cosa o construir el mensaje de WhatsApp.
- El CSV de carga masiva se parsea con `csv-parse` (no con `eval`/regex
  manual) y cada fila se valida con zod antes de tocar la base de datos;
  filas inválidas se reportan con su número de fila, no rompen el resto del
  archivo.
- JSON-LD se inyecta con `dangerouslySetInnerHTML` solo para datos
  estructurados generados por el propio servidor a partir de campos ya
  validados (nunca HTML/JS de terceros). Además se escapa `<` para que un
  posible `</script>` en un texto editable no pueda cerrar la etiqueta.
- Las URLs editables solo admiten `http`/`https`; el enlace principal también
  permite rutas internas, pero no esquemas ejecutables como `javascript:`.

## Cabeceras y CSP

- Todas las respuestas incluyen `X-Content-Type-Options: nosniff`, protección
  anti-embebido (`X-Frame-Options`/`frame-ancestors`), HSTS, una política de
  permisos restrictiva y `Referrer-Policy`.
- `src/proxy.ts` genera un nonce criptográfico por respuesta y aplica CSP con
  `script-src` estricto. Esto reduce XSS y clickjacking sin habilitar scripts
  inline arbitrarios. Si se añade una fuente externa de scripts, imágenes o
  conexiones, revísala explícitamente en esa política antes de permitirla.

## Imágenes remotas

`next.config.ts` limita `next/image` a una **lista concreta** de dominios
(`res.cloudinary.com`) en vez de un comodín (`hostname: "**"`). Next.js 16
además exige explícitamente declarar patrones para imágenes locales con
query string, como protección contra enumeración. Recomendación: cuando
Cloudinary sea la única fuente de imágenes en producción, reduce la lista a
solo `res.cloudinary.com`.

## Dependencias de terceros

`npm audit --omit=dev` reporta 4 vulnerabilidades "high" en dependencias
**transitivas de la CLI de Prisma** (`mysql2`, `deepmerge-ts` vía
`@prisma/config`). Prisma empaqueta drivers para varias bases de datos en su
CLI aunque el proyecto solo use PostgreSQL. Estas librerías **no se incluyen
en el bundle de la aplicación en runtime** (la app importa `@prisma/client`
+ `@prisma/adapter-pg`, no el paquete `prisma` en sí). La corrección que npm
propone es un salto incompatible hacia Prisma 6; Prisma 8 permanece en
release candidate, por lo que no se fuerza ningún cambio de major en
producción. Conviene repetir la auditoría antes de cada actualización de
Prisma y no ejecutar su CLI contra esquemas o configuraciones no confiables.

Se eliminó `xlsx` (SheetJS) del proyecto: la versión publicada en npm tiene
vulnerabilidades conocidas de *prototype pollution* y ReDoS sin parche
disponible vía npm (el parche solo se distribuye desde el CDN propio de
SheetJS). La carga masiva de catálogo usa **solo CSV** (`csv-parse`, sin
vulnerabilidades conocidas); Excel se soporta pidiendo al usuario que guarde
como CSV antes de subir el archivo — ver README, "Cargar el catálogo real de
MPM".

## Scripts de instalación (`npm`)

Este proyecto usa npm 12+, que bloquea por defecto los scripts
`preinstall`/`postinstall` de paquetes no aprobados explícitamente
(`allowScripts` en `package.json`). Solo están aprobados los que
necesitamos y son de confianza: `prisma`, `@prisma/engines` (descargan el
motor de consultas de Prisma) y `esbuild`/`unrs-resolver` (binarios nativos
de herramientas de build). No apruebes un script nuevo sin revisar qué
paquete lo pide y por qué.

## Qué falta antes de producción (ver también `docs/AUDIT_LOOP_2.md`)

- Revisión legal real del texto de `/politica-de-datos`.
- Generar un `AUTH_SECRET` de producción propio (nunca reusar el de
  desarrollo).
- Si se escala a más de una instancia, configurar
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` en el proveedor con el valor de
  `openssl rand -base64 32` **antes del build**. No usar una cadena aleatoria
  que no sea base64 válido.
- Cambiar o eliminar las credenciales de demostración (`admin@mpm.local` /
  `CambiaEsto123!`).
- Configurar un WAF/rate limiter distribuido en el CDN/proveedor antes de
  exponer ampliamente el panel. El límite local protege una instancia, pero
  no sustituye esa capa ante tráfico distribuido.
