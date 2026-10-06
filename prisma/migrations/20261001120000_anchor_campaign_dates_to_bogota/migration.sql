-- Las fechas de vigencia de campaña se guardaban como medianoche UTC del día
-- elegido (las 19:00 del día anterior en Bogotá). Desde ahora se guardan como
-- inicio (00:00) y fin (23:59:59.999) del día en Colombia (UTC-5).
-- Solo se ajustan los valores que aún tienen el formato anterior (hora 00:00
-- UTC exacta), así que la migración es segura aunque se aplique sobre datos
-- ya guardados con el formato nuevo.
UPDATE "Campaign"
SET "startDate" = "startDate" + INTERVAL '5 hours'
WHERE "startDate" IS NOT NULL AND "startDate"::time = TIME '00:00:00';

UPDATE "Campaign"
SET "endDate" = "endDate" + INTERVAL '29 hours' - INTERVAL '1 millisecond'
WHERE "endDate" IS NOT NULL AND "endDate"::time = TIME '00:00:00';
