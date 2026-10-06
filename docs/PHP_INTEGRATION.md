# Integración del catálogo con PHP

El portal usa PostgreSQL 16 y puede consultarse desde PHP con la extensión
`pdo_pgsql` (recomendada) o `pgsql`. Para evitar acoplar otro sistema a las
tablas internas de Prisma, la migración crea dos vistas de solo lectura:

- `integration.catalog_categories`
- `integration.catalog_products`

Ambas usan nombres `snake_case`, no requieren comillas en SQL y solo exponen
categorías visibles y productos públicos (con las mismas reglas que el sitio:
una subcategoría cuya categoría padre está oculta tampoco se expone, desde la
migración `20261001121000_php_views_respect_hidden_parent_category`). No
exponen usuarios, contraseñas, carritos, solicitudes ni información de
clientes.

## Aplicar el contrato

Primero aplica las migraciones desde un entorno con Node 22 y la URL de la
base de datos destino:

```bash
npm run db:migrate:deploy
```

Después, un administrador de PostgreSQL debe crear una credencial exclusiva
para el otro programa. Sustituye el nombre de base de datos y una contraseña
robusta; no reutilices la cuenta que utiliza Next.js.

```sql
CREATE ROLE mpm_php_catalog LOGIN PASSWORD 'una-contraseña-larga-y-unica';
GRANT CONNECT ON DATABASE mpm_portal TO mpm_php_catalog;
GRANT USAGE ON SCHEMA integration TO mpm_php_catalog;
GRANT SELECT ON integration.catalog_categories, integration.catalog_products TO mpm_php_catalog;
REVOKE ALL ON SCHEMA public FROM mpm_php_catalog;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM mpm_php_catalog;
ALTER ROLE mpm_php_catalog SET search_path = integration, pg_catalog;
```

En un proveedor gestionado, limita además la red de esa cuenta a la IP o red
del servidor PHP y exige TLS (`sslmode=require`). Nunca publiques esta
credencial en JavaScript, repositorios o archivos accesibles por HTTP.

## Ejemplo con PDO

Guarda los valores en variables de entorno del servidor PHP (`MPM_PG_HOST`,
`MPM_PG_DATABASE`, `MPM_PG_USER`, `MPM_PG_PASSWORD`), no en el código.

```php
<?php
$dsn = sprintf(
    'pgsql:host=%s;port=5432;dbname=%s;sslmode=require',
    getenv('MPM_PG_HOST'),
    getenv('MPM_PG_DATABASE')
);

$pdo = new PDO($dsn, getenv('MPM_PG_USER'), getenv('MPM_PG_PASSWORD'), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$statement = $pdo->prepare(
    'SELECT sku, name, slug, colors, sizes, price_ref, primary_image_url
     FROM integration.catalog_products
     WHERE category_slug = :category
     ORDER BY name ASC'
);
$statement->execute(['category' => 'damas']);

foreach ($statement as $product) {
    $product['colors'] = json_decode($product['colors'], true, flags: JSON_THROW_ON_ERROR);
    $product['sizes'] = json_decode($product['sizes'], true, flags: JSON_THROW_ON_ERROR);
    // Renderiza/consume $product según el otro programa.
}
```

Las columnas `sizes`, `colors` y `tags` se entregan como JSON para no obligar
a PHP a interpretar el formato interno `TEXT[]` de PostgreSQL. Usa consultas
preparadas incluso sobre las vistas.

## Límites deliberados

Esta integración es **solo de lectura**. El programa PHP no debe escribir
directamente en tablas de catálogo: podría saltarse validaciones, permisos,
auditoría y las acciones de administración del portal. Si necesita crear o
actualizar productos, se debe definir una API autenticada con el flujo y los
campos concretos que requiera.
