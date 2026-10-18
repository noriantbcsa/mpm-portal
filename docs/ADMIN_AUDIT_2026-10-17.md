# Auditoría de administración · 17 de octubre de 2026

Alcance: acceso y contraseñas, campañas, categorías, productos, importación CSV,
validación de datos, relaciones PostgreSQL y flujos de interfaz.

## Hallazgos corregidos

| Área | Problema | Resultado |
| --- | --- | --- |
| Contraseñas | No había control uniforme de visibilidad | Ojo accesible en ingreso, perfil y usuarios; campos ocultos inicialmente y botones independientes |
| Formularios | Un error de guardado podía resetear campos no controlados | Se conserva lo escrito y se enfoca el campo inválido o el mensaje recuperable |
| Campañas | Una expresión regular aceptaba días inexistentes | Validación del calendario, incluidos años bisiestos, orden de fechas y horario colombiano |
| Campañas | Selecciones obsoletas podían ignorarse o fallar sin explicación | Validación dentro de la transacción y mensajes recuperables; sin campañas creadas a medias |
| Campañas | El buscador ocultaba controles con `hidden`, pero `display:flex` podía volverlos visibles | Ocultación CSS explícita; los elementos filtrados conservan su selección al guardar |
| Campañas | Se podían destacar hijas de una categoría oculta | Mismas reglas de visibilidad que el catálogo |
| Categorías | Dos movimientos simultáneos podían formar un ciclo | Bloqueo transaccional durante la validación y el cambio de jerarquía |
| Categorías | El recorrido de descendientes podía repetirse indefinidamente ante un ciclo | Conjunto de nodos visitados para terminar el recorrido |
| Categorías | El listado mostraba cero prendas en una principal con productos en sus hijas | Conteo agregado y estado explícito cuando la principal oculta una hija |
| Categorías | Campos secundarios y enlace interno ocupaban espacio principal | Detalles opcionales agrupados y columna técnica de slug retirada |
| Listados móviles | Editar exigía desplazar tablas horizontalmente | Tarjetas compactas con estado y acceso directo a editar; tablas conservadas en escritorio |
| Productos | Precios cero, desproporcionados o mayorista mayor al detal | Validaciones antes de escribir; cotización mediante campos vacíos |
| Productos | Colores duplicados o fotos con colores ausentes del selector | Normalización común, colores de fotos incluidos automáticamente y tallas sin duplicados |
| Productos | Repetir una foto causaba opciones y claves duplicadas | Rechazo con mensaje específico de la foto repetida |
| Productos | URL aceptada por formulario pero rechazada al mostrarla | Solo fuentes compatibles con la configuración de imágenes: sitio y Cloudinary HTTPS |
| Productos | Editar una foto podía perder su identificador de Cloudinary | Se conserva `publicId` en el formulario de edición |
| Productos | Gestionar muchas fotos exigía recorrer todos sus campos | Miniaturas y editores plegables, campos opcionales agrupados y descripción accesible automática |
| CSV | Se ignoraba una subcategoría cuando la principal existía | Validación de la relación principal/hija y asignación a la subcategoría indicada |
| Guardados | Un registro eliminado podía producir una excepción técnica | Mensajes recuperables para relaciones inexistentes, duplicados y registros borrados |

## Base de datos

`scripts/audit-admin-data.mjs` ejecuta una transacción de **solo lectura** y no
consulta contraseñas ni información de clientes. En la base local examinada:
18 productos, 360 imágenes, 4 categorías y 0 campañas; 8 restricciones de las
tablas auditadas validadas. No se detectaron archivos de fotos inexistentes,
relaciones rotas, ciclos ni precios mayoristas superiores al detal.

Pendiente comercial: `DAM-CMLRD` no tiene precio. Se conserva su protección
`noindex` y su exclusión del sitemap hasta completar el dato; no se inventa
un valor ni se modifica su disponibilidad.

Este análisis de tablas corresponde a PostgreSQL local. No equivale a una
conexión SQL de auditoría a Render. La publicación usa las mismas validaciones
y transacciones; los datos comerciales de producción no se usan como fixtures.

## Pruebas mantenidas

- `tests/admin-audit-validation.test.ts`: fechas imposibles/bisiestas,
  precios incoherentes, fotos repetidas, orígenes de imágenes y colores.
- `tests/integration/admin-workflows.integration.test.ts`: acciones de
  administración contra PostgreSQL real, guardados completos, errores sin
  escrituras parciales, concurrencia y visibilidad heredada.
- `tests/product-import-actions.test.ts`: asignación de subcategorías y
  rechazo de una hija de otra rama, además de la importación parcial existente.
- `tests/admin-password-field.test.tsx`: contraseñas ocultas y selector de prendas.

La comprobación en navegador utiliza una cuenta y registros temporales de la
base local y los retira al terminar; no envía comunicaciones ni pedidos.

Resultado de la batería completa: **353 pruebas aprobadas**, incluidas las
pruebas PostgreSQL de concurrencia, sin omisiones. TypeScript, ESLint y la
compilación de producción completaron correctamente.
