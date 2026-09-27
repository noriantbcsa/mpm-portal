# Bucle de auditoría 3

Tercera pasada integral del portal, enfocada en visibilidad del panel,
funcionamiento del diseño estacional colombiano, accesibilidad visual y
verificación real en escritorio y móvil.

## Cambios realizados

- Se hizo visible el acceso interno con el enlace **Acceso equipo MPM** en el
  pie de página. `/login` continúa sin indexación y `/admin` permanece
  protegido por sesión y rol.
- Se agregó `/admin/festividades`, accesible solo para `ADMIN`, con tres modos:
  automático, manual y apagado.
- El modo automático usa la zona horaria `America/Bogota` y contempla:
  Carnaval de Negros y Blancos, Carnaval de Barranquilla, San Juan/San Pedro/
  San Pablo, fiestas patrias, Amor y Amistad, Velitas y Navidad.
- Carnaval se calcula anualmente a partir de la Pascua; no queda amarrado a
  fechas fijas de 2026. El panel muestra las fechas calculadas para el año
  actual, su estado y una vista previa antes de guardar.
- La decoración es deliberadamente superficial: franja informativa, acento del
  encabezado y fondos suaves. No cambia logo, textos, fotos, navegación ni
  paleta principal de marca.
- Las credenciales de demostración se muestran dentro de `/login` únicamente
  en desarrollo; nunca aparecen en un build de producción.
- Se mantienen los arreglos de contraste de WhatsApp y del indicador de foco
  que estaban pendientes en `AUDIT_LOOP_2.md`.

## Verificación ejecutada

- `npm run typecheck`: correcto.
- `npm run lint -- --max-warnings=0`: correcto.
- `npm test`: **96 pruebas aprobadas en 15 archivos**, incluidas las pruebas de
  integración con PostgreSQL.
- Migraciones aplicadas correctamente tanto en desarrollo como en la base de
  pruebas.
- Build de producción completo con todas las rutas administrativas dinámicas.
- Prueba manual en navegador: login, dashboard, navegación a Diseño festivo,
  vista previa de San Pedro, guardado, aplicación en el portal público y
  restauración del modo automático.
- Revisión visual en escritorio y viewport móvil de 390 × 844 px.

## Estado final

El portal queda en modo automático. Al 27 de septiembre de 2026 no hay una
temporada visual activa; la próxima del calendario es Velitas, del 1 al 8 de
diciembre. Las campañas comerciales siguen siendo independientes del diseño
festivo y conservan sus propias fechas, productos y enlaces.

## Despliegue de pruebas en Render

`render.yaml` usa el seed completo de demostración durante el build para que
el ambiente de pruebas incluya las cuentas `admin@mpm.local` y
`ventas@mpm.local`, además del catálogo suficiente para recorrer filtros,
campañas, carrito y panel. Antes de convertir este servicio en producción se
debe volver a `npm run db:seed:catalog` y crear usuarios con contraseñas reales.
