-- Se ejecuta automáticamente solo la primera vez que se crea el volumen de
-- datos (convención de la imagen oficial de Postgres:
-- /docker-entrypoint-initdb.d/*.sql). Crea una base de datos separada para
-- las pruebas de integración (tests/integration/**), para no mezclar datos
-- de prueba con los datos de desarrollo/demo de mpm_portal.
CREATE DATABASE mpm_portal_test;
