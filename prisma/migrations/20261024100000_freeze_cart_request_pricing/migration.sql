-- Congela en cada solicitud la modalidad (detal/mayorista), el precio unitario
-- aplicado y el total que se mostró al cliente. Las solicitudes existentes
-- quedan con valores nulos (no se puede reconstruir lo que vio el cliente).
ALTER TABLE "CartRequest"
  ADD COLUMN "isWholesale" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "totalAmount" DECIMAL(14,2);

ALTER TABLE "CartRequestItem"
  ADD COLUMN "priceWholesaleSnapshot" DECIMAL(12,2),
  ADD COLUMN "unitPriceApplied" DECIMAL(12,2);
