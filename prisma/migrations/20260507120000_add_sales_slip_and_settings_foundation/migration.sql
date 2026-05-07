-- enums
CREATE TYPE "SalesSlipStatus" AS ENUM ('DRAFT','ISSUED','PAYMENT_PENDING','PAID','SHIPMENT_PENDING','SHIPPED','CANCELED');
CREATE TYPE "PartnerType" AS ENUM ('CUSTOMER','SUPPLIER','OTHER');
CREATE TYPE "CompanyLocationType" AS ENUM ('HEAD_OFFICE','BRANCH','WAREHOUSE','HALL','OTHER');
CREATE TYPE "TradeTermType" AS ENUM ('PURCHASE','SALE');

-- tables
CREATE TABLE "SalesSlip" (
  "id" TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "slipNumber" TEXT,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "salesContactName" TEXT,
  "status" "SalesSlipStatus" NOT NULL DEFAULT 'DRAFT',
  "contractedAt" TIMESTAMP(3),
  "paymentDueDate" TIMESTAMP(3),
  "paymentTimeText" TEXT,
  "paymentMethod" TEXT,
  "bankAccountId" TEXT,
  "shippingMethod" TEXT,
  "machineShipDate" TIMESTAMP(3),
  "documentShipDate" TIMESTAMP(3),
  "destinationName" TEXT,
  "destinationAddress" TEXT,
  "destinationPhone" TEXT,
  "carrierName" TEXT,
  "sharedShippingNote" TEXT,
  "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
  "taxAmount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL DEFAULT 0,
  "grossProfitAmount" INTEGER NOT NULL DEFAULT 0,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "SalesSlipLine" (
  "id" TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "salesSlipId" TEXT NOT NULL,
  "inventoryItemId" TEXT,
  "inventoryUnitId" TEXT,
  "makerName" TEXT,
  "machineName" TEXT NOT NULL,
  "itemType" "InventoryItemType" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "purchaseUnitPrice" INTEGER,
  "salesUnitPrice" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "nailSheet" BOOLEAN NOT NULL DEFAULT false,
  "frameColor" TEXT,
  "storageLocationName" TEXT,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "BusinessPartner" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"type" "PartnerType" NOT NULL,"name" TEXT NOT NULL,
  "postalCode" TEXT,"address" TEXT,"representativeName" TEXT,"phone" TEXT,"fax" TEXT,"invoiceNumber" TEXT,"email" TEXT,"memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "BusinessPartnerLocation" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"partnerId" TEXT NOT NULL,"name" TEXT NOT NULL,
  "postalCode" TEXT,"address" TEXT,"phone" TEXT,"fax" TEXT,"memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "CompanyProfile" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"name" TEXT NOT NULL,
  "postalCode" TEXT,"address" TEXT,"representativeName" TEXT,"phone" TEXT,"fax" TEXT,"registrationNumber" TEXT,"invoiceNumber" TEXT,"email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "CompanyLocation" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"companyProfileId" TEXT,
  "name" TEXT NOT NULL,"type" "CompanyLocationType" NOT NULL,
  "postalCode" TEXT,"address" TEXT,"phone" TEXT,"fax" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "StaffMember" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"companyLocationId" TEXT,
  "name" TEXT NOT NULL,"role" TEXT,"phone" TEXT,"email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "BankAccount" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"bankCode" TEXT,"bankName" TEXT NOT NULL,
  "branchCode" TEXT,"branchName" TEXT,"accountType" TEXT,"accountNumber" TEXT NOT NULL,"accountHolder" TEXT NOT NULL,"subjectCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "TradeTermTemplate" (
  "id" TEXT PRIMARY KEY,"ownerUserId" TEXT NOT NULL,"type" "TradeTermType" NOT NULL,"title" TEXT NOT NULL,"body" TEXT NOT NULL,"isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL
);

-- indexes
CREATE INDEX "SalesSlip_ownerUserId_createdAt_idx" ON "SalesSlip"("ownerUserId","createdAt");
CREATE INDEX "SalesSlipLine_ownerUserId_idx" ON "SalesSlipLine"("ownerUserId");
CREATE INDEX "SalesSlipLine_salesSlipId_idx" ON "SalesSlipLine"("salesSlipId");
CREATE INDEX "BusinessPartner_ownerUserId_idx" ON "BusinessPartner"("ownerUserId");
CREATE INDEX "BusinessPartnerLocation_ownerUserId_idx" ON "BusinessPartnerLocation"("ownerUserId");
CREATE INDEX "BusinessPartnerLocation_partnerId_idx" ON "BusinessPartnerLocation"("partnerId");
CREATE INDEX "CompanyProfile_ownerUserId_idx" ON "CompanyProfile"("ownerUserId");
CREATE INDEX "CompanyLocation_ownerUserId_idx" ON "CompanyLocation"("ownerUserId");
CREATE INDEX "StaffMember_ownerUserId_idx" ON "StaffMember"("ownerUserId");
CREATE INDEX "BankAccount_ownerUserId_idx" ON "BankAccount"("ownerUserId");
CREATE INDEX "TradeTermTemplate_ownerUserId_type_idx" ON "TradeTermTemplate"("ownerUserId","type");

-- fks
ALTER TABLE "SalesSlip" ADD CONSTRAINT "SalesSlip_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesSlip" ADD CONSTRAINT "SalesSlip_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesSlipLine" ADD CONSTRAINT "SalesSlipLine_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesSlipLine" ADD CONSTRAINT "SalesSlipLine_salesSlipId_fkey" FOREIGN KEY ("salesSlipId") REFERENCES "SalesSlip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesSlipLine" ADD CONSTRAINT "SalesSlipLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesSlipLine" ADD CONSTRAINT "SalesSlipLine_inventoryUnitId_fkey" FOREIGN KEY ("inventoryUnitId") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessPartner" ADD CONSTRAINT "BusinessPartner_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessPartnerLocation" ADD CONSTRAINT "BusinessPartnerLocation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessPartnerLocation" ADD CONSTRAINT "BusinessPartnerLocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyLocation" ADD CONSTRAINT "CompanyLocation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyLocation" ADD CONSTRAINT "CompanyLocation_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_companyLocationId_fkey" FOREIGN KEY ("companyLocationId") REFERENCES "CompanyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TradeTermTemplate" ADD CONSTRAINT "TradeTermTemplate_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
