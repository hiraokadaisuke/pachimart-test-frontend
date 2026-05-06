CREATE TYPE "RecordPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'CANCELED');
CREATE TYPE "LedgerSourceType" AS ENUM ('PURCHASE_RECORD', 'SALES_RECORD', 'PAYMENT_RECORD', 'MANUAL');
CREATE TYPE "LedgerEntryType" AS ENUM ('PURCHASE', 'SALES', 'FEE', 'PAYMENT', 'ADJUSTMENT');
CREATE TYPE "LedgerDirection" AS ENUM ('IN', 'OUT');
CREATE TYPE "PaymentSourceType" AS ENUM ('PURCHASE_RECORD', 'SALES_RECORD');
CREATE TYPE "PaymentType" AS ENUM ('BANK_TRANSFER', 'CASH', 'OFFSET', 'OTHER');
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PLANNED', 'PAID', 'CANCELED');

CREATE TABLE "PurchaseRecord" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "dealingId" INTEGER,
  "supplierCompanyId" TEXT,
  "purchaseDate" TIMESTAMP(3) NOT NULL,
  "unitCost" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "shippingCost" INTEGER NOT NULL DEFAULT 0,
  "otherCost" INTEGER NOT NULL DEFAULT 0,
  "totalCost" INTEGER NOT NULL,
  "paymentStatus" "RecordPaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesRecord" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "dealingId" INTEGER,
  "buyerCompanyId" TEXT,
  "salesDate" TIMESTAMP(3) NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "shippingFee" INTEGER NOT NULL DEFAULT 0,
  "platformFee" INTEGER NOT NULL DEFAULT 0,
  "otherFee" INTEGER NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL,
  "paymentStatus" "RecordPaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "sourceType" "LedgerSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "entryType" "LedgerEntryType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "memo" TEXT,
  "dedupeKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentRecord" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "sourceType" "PaymentSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "paymentType" "PaymentType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3),
  "status" "PaymentRecordStatus" NOT NULL,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LedgerEntry_dedupeKey_key" ON "LedgerEntry"("dedupeKey");
CREATE INDEX "PurchaseRecord_ownerUserId_purchaseDate_idx" ON "PurchaseRecord"("ownerUserId", "purchaseDate");
CREATE INDEX "PurchaseRecord_inventoryItemId_purchaseDate_idx" ON "PurchaseRecord"("inventoryItemId", "purchaseDate");
CREATE INDEX "SalesRecord_ownerUserId_salesDate_idx" ON "SalesRecord"("ownerUserId", "salesDate");
CREATE INDEX "SalesRecord_inventoryItemId_salesDate_idx" ON "SalesRecord"("inventoryItemId", "salesDate");
CREATE INDEX "LedgerEntry_ownerUserId_occurredAt_idx" ON "LedgerEntry"("ownerUserId", "occurredAt");
CREATE INDEX "LedgerEntry_sourceType_sourceId_idx" ON "LedgerEntry"("sourceType", "sourceId");
CREATE INDEX "PaymentRecord_ownerUserId_createdAt_idx" ON "PaymentRecord"("ownerUserId", "createdAt");
CREATE INDEX "PaymentRecord_sourceType_sourceId_idx" ON "PaymentRecord"("sourceType", "sourceId");

ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
