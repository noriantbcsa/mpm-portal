-- Estados comerciales explícitos y seguimiento de carritos sin solicitud.
-- Los dos RENAME conservan cualquier historial existente en producción.
ALTER TYPE "CartRequestStatus" RENAME VALUE 'CONFIRMADO' TO 'VENDIDO';
ALTER TYPE "CartRequestStatus" RENAME VALUE 'PERDIDO' TO 'CANCELADO';

ALTER TABLE "CartSession"
  ADD COLUMN "commercialStatus" "CartRequestStatus",
  ADD COLUMN "handledById" TEXT,
  ADD COLUMN "handledAt" TIMESTAMP(3);

CREATE INDEX "CartSession_commercialStatus_idx" ON "CartSession"("commercialStatus");
CREATE INDEX "CartSession_handledById_idx" ON "CartSession"("handledById");

ALTER TABLE "CartSession"
  ADD CONSTRAINT "CartSession_handledById_fkey"
  FOREIGN KEY ("handledById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
