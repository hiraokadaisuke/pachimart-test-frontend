-- CreateEnum
CREATE TYPE "InventoryImportStatus" AS ENUM ('PREVIEWED', 'IMPORTED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "InventoryImportBatch" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileHash" TEXT,
  "totalRows" INTEGER NOT NULL,
  "successRows" INTEGER NOT NULL DEFAULT 0,
  "errorRows" INTEGER NOT NULL DEFAULT 0,
  "status" "InventoryImportStatus" NOT NULL DEFAULT 'PREVIEWED',
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "InventoryImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportRow" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "status" "InventoryImportStatus" NOT NULL,
  "errorMessage" TEXT,
  "rawData" JSONB NOT NULL,
  "inventoryItemId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryImportRow_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "InventoryImportBatch_ownerUserId_createdAt_idx" ON "InventoryImportBatch"("ownerUserId", "createdAt");
CREATE INDEX "InventoryImportBatch_ownerUserId_fileHash_status_idx" ON "InventoryImportBatch"("ownerUserId", "fileHash", "status");
CREATE INDEX "InventoryImportRow_batchId_rowNumber_idx" ON "InventoryImportRow"("batchId", "rowNumber");
CREATE INDEX "InventoryImportRow_inventoryItemId_idx" ON "InventoryImportRow"("inventoryItemId");

-- Foreign keys
ALTER TABLE "InventoryImportBatch" ADD CONSTRAINT "InventoryImportBatch_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryImportRow" ADD CONSTRAINT "InventoryImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryImportRow" ADD CONSTRAINT "InventoryImportRow_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
