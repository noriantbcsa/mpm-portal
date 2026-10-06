-- Los correos pasan a guardarse y buscarse en minúsculas (el login ya no
-- distingue mayúsculas). Se normalizan las cuentas existentes, salvo que ya
-- exista otra con el correo en minúsculas (nunca se rompe la restricción
-- UNIQUE: esa cuenta se deja como está).
UPDATE "User" AS u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (
    SELECT 1 FROM "User" AS other WHERE other."email" = lower(u."email")
  );
