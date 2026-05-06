CREATE TYPE "InventoryUnitStatus" AS ENUM ('PROVISIONAL', 'IN_STOCK', 'RESERVED', 'SHIPPED', 'CANCELED');
CREATE TYPE "InventoryUnitCodeType" AS ENUM ('MAIN_BOARD', 'CERTIFICATE', 'BODY', 'FRAME', 'BOARD', 'OTHER', 'UNKNOWN');

CREATE TABLE "InventoryUnit" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "displayCode" TEXT,
  "rawQr" TEXT,
  "parsedQr" JSONB,
  "codeType" "InventoryUnitCodeType",
  "itemType" "InventoryItemType" NOT NULL,
  "status" "InventoryUnitStatus" NOT NULL DEFAULT 'PROVISIONAL',
  "storageLocationId" TEXT,
  "inboundScheduleId" TEXT,
  "outboundScheduleId" TEXT,
  "purchaseRecordId" TEXT,
  "salesRecordId" TEXT,
  "memo" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryUnit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryUnit_ownerUserId_displayCode_idx" ON "InventoryUnit"("ownerUserId", "displayCode");
CREATE INDEX "InventoryUnit_inventoryItemId_status_idx" ON "InventoryUnit"("inventoryItemId", "status");
CREATE INDEX "InventoryUnit_inboundScheduleId_idx" ON "InventoryUnit"("inboundScheduleId");
CREATE INDEX "InventoryUnit_outboundScheduleId_idx" ON "InventoryUnit"("outboundScheduleId");

ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_inboundScheduleId_fkey" FOREIGN KEY ("inboundScheduleId") REFERENCES "InboundSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_outboundScheduleId_fkey" FOREIGN KEY ("outboundScheduleId") REFERENCES "OutboundSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
