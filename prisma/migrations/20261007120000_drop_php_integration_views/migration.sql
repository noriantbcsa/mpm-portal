-- La integración con PHP se retiró: ya no hay consumidores de las vistas de
-- solo lectura. Las migraciones anteriores que las crearon se conservan
-- (historial aplicado); este paso elimina el esquema y sus vistas.
DROP SCHEMA IF EXISTS integration CASCADE;
