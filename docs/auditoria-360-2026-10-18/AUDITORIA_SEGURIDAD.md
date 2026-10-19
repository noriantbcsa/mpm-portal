# Seguridad (revisión estática dirigida)
- Autorización: las 16 Server Actions admin llaman `await require…` (confirmado). Acciones públicas: carrito y login (por diseño).
- SQL: `$queryRaw/$executeRaw` solo como plantillas etiquetadas (parametrizadas); sin `*Unsafe`. Confirmado.
- XSS: único `dangerouslySetInnerHTML` (json-ld) con escape de `<` y nonce CSP. Confirmado.
- Cabeceras: X-Frame-Options, HSTS, Permissions-Policy presentes en next.config.ts; CSP con nonce vía proxy (no verificada en vivo).
- Secretos: `.env` existe localmente, está ignorado por `.gitignore` (regla `.env*`), no está versionado y nunca estuvo en el historial (`git log --all -- .env` vacío). Valores no reproducidos.
- Dependencias: producción 0 vulnerabilidades; dev 5 high (H-02).
- NO verificado: cookies en vivo, CSRF/origen de Server Actions, rate limiting bajo carga, subida de archivos, recuperación de cuenta.
