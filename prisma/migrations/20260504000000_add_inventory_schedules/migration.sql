-- CreateEnum
CREATE TYPE "InboundStatus" AS ENUM ('PLANNED', 'ARRIVAL_WAITING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('PLANNED', 'PICKING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InventoryShippingMethod" AS ENUM ('PREPAID', 'COLLECT', 'CHARTER', 'OTHER');

-- CreateTable
CREATE TABLE "InboundSchedule" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "supplierName" TEXT,
    "itemType" "InventoryItemType" NOT NULL,
    "makerNameSnapshot" TEXT,
    "modelNameSnapshot" TEXT NOT NULL,
    "frameColor" TEXT,
    "quantity" INTEGER NOT NULL,
    "destinationLocationId" TEXT,
    "status" "InboundStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InboundSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundSchedule" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "buyerName" TEXT,
    "itemType" "InventoryItemType" NOT NULL,
    "makerNameSnapshot" TEXT,
    "modelNameSnapshot" TEXT NOT NULL,
    "frameColor" TEXT,
    "quantity" INTEGER NOT NULL,
    "originLocationId" TEXT,
    "shippingMethod" "InventoryShippingMethod" NOT NULL,
    "status" "OutboundStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OutboundSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InboundSchedule_ownerUserId_status_expectedDate_idx" ON "InboundSchedule"("ownerUserId", "status", "expectedDate");
CREATE INDEX "InboundSchedule_inventoryItemId_expectedDate_idx" ON "InboundSchedule"("inventoryItemId", "expectedDate");
CREATE INDEX "OutboundSchedule_ownerUserId_status_expectedDate_idx" ON "OutboundSchedule"("ownerUserId", "status", "expectedDate");
CREATE INDEX "OutboundSchedule_inventoryItemId_expectedDate_idx" ON "OutboundSchedule"("inventoryItemId", "expectedDate");

ALTER TABLE "InboundSchedule" ADD CONSTRAINT "InboundSchedule_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InboundSchedule" ADD CONSTRAINT "InboundSchedule_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundSchedule" ADD CONSTRAINT "InboundSchedule_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OutboundSchedule" ADD CONSTRAINT "OutboundSchedule_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutboundSchedule" ADD CONSTRAINT "OutboundSchedule_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundSchedule" ADD CONSTRAINT "OutboundSchedule_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
