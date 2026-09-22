# Catálogo entregado

El 22 de septiembre de 2026 se incorporaron los dos archivos proporcionados por MPM en `public/catalogo/`:

- `DAMAS - PAGINA.zip`: 283 fotografías, 12 referencias o cápsulas.
- `CABALLERO - PAGINA.zip`: 77 fotografías, 6 referencias o cápsulas.

Las 360 fotos permanecen en su organización original por referencia. El importador `prisma/seed.ts` crea una referencia por carpeta y guarda todas sus fotos como una galería ordenada. El código de carpeta se conserva en el SKU (`DAM-*` y `CAB-*`).

## Datos inferidos con seguridad

- Público: se toma de la carpeta principal `DAMAS` o `CABALLERO`.
- Referencia: se toma literalmente del nombre de carpeta (`CMLD`, `CMCH`, etc.).
- Color: se toma del archivo cuando su nombre es un color legible. Los nombres automáticos de WhatsApp, UUID, `photo_...` y números se tratan solo como fotos adicionales.
- Talla única o XXL: solo se asigna cuando el nombre de carpeta lo declara.

No se inventan precios, composición, disponibilidad de inventario ni tablas de talla. Esos campos continúan listos para completar desde administración.
