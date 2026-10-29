-- Búsqueda de duplicados en la ventana de 10 minutos del envío público.
CREATE INDEX "CartRequest_contactPhone_createdAt_idx" ON "CartRequest"("contactPhone", "createdAt");

-- Bandeja comercial: igualdad por estado/asesor y orden descendente por fecha.
CREATE INDEX "CartRequest_status_createdAt_idx" ON "CartRequest"("status", "createdAt");
CREATE INDEX "CartRequest_assignedToId_createdAt_idx" ON "CartRequest"("assignedToId", "createdAt");

-- Los índices compuestos cubren la columna inicial de los anteriores.
DROP INDEX "CartRequest_status_idx";
DROP INDEX "CartRequest_assignedToId_idx";
