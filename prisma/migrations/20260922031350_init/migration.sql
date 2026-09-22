-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SALES');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DISPONIBLE', 'BAJO_PEDIDO', 'AGOTADO', 'OCULTO');

-- CreateEnum
CREATE TYPE "ProductTagType" AS ENUM ('OFERTA', 'TENDENCIA', 'NUEVO', 'RECOMENDADO');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('HOMBRE', 'MUJER', 'NINO', 'NINA', 'UNISEX');

-- CreateEnum
CREATE TYPE "CartRequestStatus" AS ENUM ('NUEVO', 'CONTACTADO', 'EN_NEGOCIACION', 'CONFIRMADO', 'CERRADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "CartRequestEventType" AS ENUM ('NOTE', 'STATUS_CHANGE', 'ASSIGNMENT', 'CREATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "audience" "Audience" NOT NULL DEFAULT 'UNISEX',
    "sizes" TEXT[],
    "colors" TEXT[],
    "material" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "tags" "ProductTagType"[],
    "campaignId" TEXT,
    "priceRef" DECIMAL(12,2),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerImageUrl" TEXT,
    "colorPrimary" TEXT,
    "colorSecondary" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'MPM',
    "tagline" TEXT NOT NULL DEFAULT 'Ropa hecha para acompañar tu día a día',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1F4D3D',
    "secondaryColor" TEXT NOT NULL DEFAULT '#D9A441',
    "accentColor" TEXT NOT NULL DEFAULT '#F4EFE7',
    "whatsappNumber" TEXT NOT NULL DEFAULT '573000000000',
    "whatsappDefaultMessage" TEXT NOT NULL DEFAULT 'Hola MPM, quiero más información sobre sus prendas.',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "tiktokUrl" TEXT,
    "heroTitle" TEXT NOT NULL DEFAULT 'Prendas que se sienten bien',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Encuentra referencias para tu negocio, tu equipo o tu día a día. Te asesoramos para elegir.',
    "heroImageUrl" TEXT,
    "heroCtaLabel" TEXT NOT NULL DEFAULT 'Ver catálogo',
    "heroCtaHref" TEXT NOT NULL DEFAULT '/catalogo',
    "footerText" TEXT NOT NULL DEFAULT 'MPM Fábrica de ropa. Atención comercial personalizada.',
    "dataPolicyText" TEXT,
    "showPrices" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "contactNamePartial" TEXT,
    "contactPhonePartial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartSessionItem" (
    "id" TEXT NOT NULL,
    "cartSessionId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "productSkuSnapshot" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartRequest" (
    "id" TEXT NOT NULL,
    "cartSessionId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "companyName" TEXT,
    "comment" TEXT,
    "dataConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "status" "CartRequestStatus" NOT NULL DEFAULT 'NUEVO',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartRequestItem" (
    "id" TEXT NOT NULL,
    "cartRequestId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "productSkuSnapshot" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceRefSnapshot" DECIMAL(12,2),

    CONSTRAINT "CartRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartRequestEvent" (
    "id" TEXT NOT NULL,
    "cartRequestId" TEXT NOT NULL,
    "type" "CartRequestEventType" NOT NULL,
    "note" TEXT,
    "previousStatus" "CartRequestStatus",
    "newStatus" "CartRequestStatus",
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignPriorityCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignPriorityCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_campaignId_idx" ON "Product"("campaignId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_audience_idx" ON "Product"("audience");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_isActive_idx" ON "Campaign"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CartSession_sessionToken_key" ON "CartSession"("sessionToken");

-- CreateIndex
CREATE INDEX "CartSession_updatedAt_idx" ON "CartSession"("updatedAt");

-- CreateIndex
CREATE INDEX "CartSessionItem_cartSessionId_idx" ON "CartSessionItem"("cartSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartRequest_cartSessionId_key" ON "CartRequest"("cartSessionId");

-- CreateIndex
CREATE INDEX "CartRequest_status_idx" ON "CartRequest"("status");

-- CreateIndex
CREATE INDEX "CartRequest_assignedToId_idx" ON "CartRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "CartRequest_createdAt_idx" ON "CartRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CartRequestItem_cartRequestId_idx" ON "CartRequestItem"("cartRequestId");

-- CreateIndex
CREATE INDEX "CartRequestEvent_cartRequestId_idx" ON "CartRequestEvent"("cartRequestId");

-- CreateIndex
CREATE INDEX "_CampaignPriorityCategories_B_index" ON "_CampaignPriorityCategories"("B");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartSessionItem" ADD CONSTRAINT "CartSessionItem_cartSessionId_fkey" FOREIGN KEY ("cartSessionId") REFERENCES "CartSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartSessionItem" ADD CONSTRAINT "CartSessionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequest" ADD CONSTRAINT "CartRequest_cartSessionId_fkey" FOREIGN KEY ("cartSessionId") REFERENCES "CartSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequest" ADD CONSTRAINT "CartRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequestItem" ADD CONSTRAINT "CartRequestItem_cartRequestId_fkey" FOREIGN KEY ("cartRequestId") REFERENCES "CartRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequestItem" ADD CONSTRAINT "CartRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequestEvent" ADD CONSTRAINT "CartRequestEvent_cartRequestId_fkey" FOREIGN KEY ("cartRequestId") REFERENCES "CartRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRequestEvent" ADD CONSTRAINT "CartRequestEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignPriorityCategories" ADD CONSTRAINT "_CampaignPriorityCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignPriorityCategories" ADD CONSTRAINT "_CampaignPriorityCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
