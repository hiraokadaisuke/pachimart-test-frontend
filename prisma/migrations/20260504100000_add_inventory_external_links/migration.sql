-- CreateEnum
CREATE TYPE "InventoryExternalLinkType" AS ENUM ('EXHIBIT', 'NAVI', 'DEALING', 'ONLINE_INQUIRY');
CREATE TYPE "InventoryExternalRelationRole" AS ENUM ('SOURCE', 'DESTINATION', 'RELATED');
CREATE TYPE "InventoryExternalSyncStatus" AS ENUM ('ACTIVE', 'STALE', 'ERROR', 'CLOSED');

-- CreateTable
CREATE TABLE "InventoryExternalLink" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "linkType" "InventoryExternalLinkType" NOT NULL,
  "externalId" TEXT NOT NULL,
  "relationRole" "InventoryExternalRelationRole" NOT NULL,
  "syncStatus" "InventoryExternalSyncStatus" NOT NULL,
  "payloadSnapshot" JSONB,
  "syncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryExternalLink_ownerUserId_linkType_externalId_relationRole_key"
  ON "InventoryExternalLink"("ownerUserId", "linkType", "externalId", "relationRole");
CREATE INDEX "InventoryExternalLink_inventoryItemId_linkType_idx"
  ON "InventoryExternalLink"("inventoryItemId", "linkType");
CREATE INDEX "InventoryExternalLink_ownerUserId_syncStatus_idx"
  ON "InventoryExternalLink"("ownerUserId", "syncStatus");

-- AddForeignKey
ALTER TABLE "InventoryExternalLink"
  ADD CONSTRAINT "InventoryExternalLink_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryExternalLink"
  ADD CONSTRAINT "InventoryExternalLink_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
