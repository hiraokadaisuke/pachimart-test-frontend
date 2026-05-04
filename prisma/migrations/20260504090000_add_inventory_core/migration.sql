-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('PACHINKO', 'SLOT');
CREATE TYPE "InventoryOwnershipType" AS ENUM ('STOCK', 'INSTALLED', 'NON_STOCK');
CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'IN_STOCK', 'NEGOTIATING', 'RESERVED', 'OUTBOUND_SCHEDULED', 'SOLD', 'INSTALLED', 'NON_STOCK', 'ARCHIVED');
CREATE TYPE "InventoryListingStatus" AS ENUM ('NOT_LISTED', 'LISTED', 'NEGOTIATING', 'CONTRACTED', 'SUSPENDED', 'CLOSED');
CREATE TYPE "InventoryMovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER');
CREATE TYPE "InventoryMovementStatus" AS ENUM ('PLANNED', 'COMMITTED', 'CANCELED');
CREATE TYPE "InventoryMovementSourceType" AS ENUM ('MANUAL', 'PURCHASE_RECORD', 'SALES_RECORD', 'EXHIBIT', 'DEALING', 'NAVI', 'SEED');

CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "makerId" TEXT,
  "machineModelId" TEXT,
  "makerNameSnapshot" TEXT,
  "modelNameSnapshot" TEXT NOT NULL,
  "itemType" "InventoryItemType" NOT NULL,
  "frameColor" TEXT,
  "ownershipType" "InventoryOwnershipType" NOT NULL,
  "inventoryStatus" "InventoryStatus" NOT NULL,
  "quantityOnHand" INTEGER NOT NULL,
  "storageLocationId" TEXT,
  "purchaseUnitPrice" INTEGER,
  "plannedSaleUnitPrice" INTEGER,
  "listingStatus" "InventoryListingStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "movementType" "InventoryMovementType" NOT NULL,
  "status" "InventoryMovementStatus" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "committedAt" TIMESTAMP(3),
  "sourceType" "InventoryMovementSourceType",
  "sourceId" TEXT,
  "dedupeKey" TEXT,
  "note" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryMovement_dedupeKey_key" ON "InventoryMovement"("dedupeKey");
CREATE INDEX "InventoryItem_ownerUserId_inventoryStatus_updatedAt_idx" ON "InventoryItem"("ownerUserId", "inventoryStatus", "updatedAt");
CREATE INDEX "InventoryItem_ownerUserId_listingStatus_idx" ON "InventoryItem"("ownerUserId", "listingStatus");
CREATE INDEX "InventoryMovement_inventoryItemId_committedAt_idx" ON "InventoryMovement"("inventoryItemId", "committedAt");
CREATE INDEX "InventoryMovement_ownerUserId_status_createdAt_idx" ON "InventoryMovement"("ownerUserId", "status", "createdAt");
CREATE INDEX "InventoryMovement_sourceType_sourceId_idx" ON "InventoryMovement"("sourceType", "sourceId");

ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_machineModelId_fkey" FOREIGN KEY ("machineModelId") REFERENCES "MachineModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
