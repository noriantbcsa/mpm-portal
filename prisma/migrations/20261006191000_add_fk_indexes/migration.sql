-- Índices en las claves foráneas con ON DELETE SET NULL: al borrar un producto
-- o un usuario, PostgreSQL busca en estas tablas las filas que lo referencian;
-- sin índice recorre la tabla completa en cada borrado.
CREATE INDEX "CartSessionItem_productId_idx" ON "CartSessionItem"("productId");
CREATE INDEX "CartRequestItem_productId_idx" ON "CartRequestItem"("productId");
CREATE INDEX "CartRequestEvent_authorId_idx" ON "CartRequestEvent"("authorId");
