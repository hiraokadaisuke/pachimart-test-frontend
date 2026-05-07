-- CreateEnum
CREATE TYPE "InventoryStocktakeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE "InventoryStocktakeMatchStatus" AS ENUM ('MATCHED', 'QR_MATCHED', 'NOT_FOUND', 'DUPLICATE_SCAN', 'WRONG_LOCATION', 'EXPECTED_NOT_SCANNED', 'MANUAL_REVIEW');
CREATE TYPE "InventoryStocktakeMatchedBy" AS ENUM ('DISPLAY_CODE', 'RAW_QR', 'MANUAL');

CREATE TABLE "InventoryStocktakeSession" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "InventoryStocktakeStatus" NOT NULL DEFAULT 'DRAFT',
  "targetWarehouseId" TEXT,
  "targetStorageLocationId" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStocktakeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryStocktakeScan" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "inventoryUnitId" TEXT,
  "scannedRawQr" TEXT,
  "scannedDisplayCode" TEXT,
  "normalizedDisplayCode" TEXT,
  "matchStatus" "InventoryStocktakeMatchStatus" NOT NULL,
  "matchedBy" "InventoryStocktakeMatchedBy",
  "warehouseId" TEXT,
  "storageLocationId" TEXT,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryStocktakeScan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryStocktakeSession_ownerUserId_idx" ON "InventoryStocktakeSession"("ownerUserId");
CREATE INDEX "InventoryStocktakeSession_status_createdAt_idx" ON "InventoryStocktakeSession"("status", "createdAt");
CREATE INDEX "InventoryStocktakeSession_targetWarehouseId_idx" ON "InventoryStocktakeSession"("targetWarehouseId");
CREATE INDEX "InventoryStocktakeSession_targetStorageLocationId_idx" ON "InventoryStocktakeSession"("targetStorageLocationId");
CREATE INDEX "InventoryStocktakeScan_ownerUserId_idx" ON "InventoryStocktakeScan"("ownerUserId");
CREATE INDEX "InventoryStocktakeScan_sessionId_idx" ON "InventoryStocktakeScan"("sessionId");
CREATE INDEX "InventoryStocktakeScan_inventoryUnitId_idx" ON "InventoryStocktakeScan"("inventoryUnitId");
CREATE INDEX "InventoryStocktakeScan_normalizedDisplayCode_idx" ON "InventoryStocktakeScan"("normalizedDisplayCode");

ALTER TABLE "InventoryStocktakeSession" ADD CONSTRAINT "InventoryStocktakeSession_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeSession" ADD CONSTRAINT "InventoryStocktakeSession_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeSession" ADD CONSTRAINT "InventoryStocktakeSession_targetStorageLocationId_fkey" FOREIGN KEY ("targetStorageLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeScan" ADD CONSTRAINT "InventoryStocktakeScan_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeScan" ADD CONSTRAINT "InventoryStocktakeScan_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InventoryStocktakeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeScan" ADD CONSTRAINT "InventoryStocktakeScan_inventoryUnitId_fkey" FOREIGN KEY ("inventoryUnitId") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeScan" ADD CONSTRAINT "InventoryStocktakeScan_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryStocktakeScan" ADD CONSTRAINT "InventoryStocktakeScan_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
