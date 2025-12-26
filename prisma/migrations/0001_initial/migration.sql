-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TradeNaviStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TradeNaviType" AS ENUM ('PHONE_AGREEMENT', 'ONLINE_INQUIRY');

-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('buyer', 'seller');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SOLD');

-- CreateEnum
CREATE TYPE "RemovalStatus" AS ENUM ('REMOVED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "address" TEXT,
    "tel" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeNavi" (
    "id" SERIAL NOT NULL,
    "status" "TradeNaviStatus" NOT NULL DEFAULT 'DRAFT',
    "naviType" "TradeNaviType" NOT NULL DEFAULT 'PHONE_AGREEMENT',
    "ownerUserId" TEXT NOT NULL,
    "buyerUserId" TEXT,
    "listingId" TEXT,
    "listingSnapshot" JSONB,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeNavi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL,
    "payload" JSONB,
    "naviId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "tradeNaviId" INTEGER NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderRole" "MessageSenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "kind" TEXT NOT NULL,
    "maker" TEXT,
    "machineName" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceExclTax" INTEGER,
    "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "removalStatus" "RemovalStatus" NOT NULL DEFAULT 'SCHEDULED',
    "removalDate" TIMESTAMP(3),
    "hasNailSheet" BOOLEAN NOT NULL DEFAULT false,
    "hasManual" BOOLEAN NOT NULL DEFAULT false,
    "pickupAvailable" BOOLEAN NOT NULL DEFAULT false,
    "storageLocation" TEXT NOT NULL,
    "storageLocationId" TEXT,
    "storageLocationSnapshot" JSONB,
    "shippingFeeCount" INTEGER NOT NULL,
    "handlingFeeCount" INTEGER NOT NULL,
    "allowPartial" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "prefecture" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineStorageLocation" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "handlingFeePerUnit" INTEGER NOT NULL,
    "shippingFeesByRegion" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineStorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerShippingAddress" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "label" TEXT,
    "companyName" TEXT,
    "postalCode" TEXT,
    "prefecture" TEXT,
    "city" TEXT,
    "addressLine" TEXT,
    "tel" TEXT,
    "contactName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerShippingAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_naviId_key" ON "Trade"("naviId");

-- CreateIndex
CREATE INDEX "Listing_sellerUserId_idx" ON "Listing"("sellerUserId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_isVisible_idx" ON "Listing"("isVisible");

-- CreateIndex
CREATE INDEX "Listing_updatedAt_idx" ON "Listing"("updatedAt");

-- CreateIndex
CREATE INDEX "StorageLocation_ownerUserId_idx" ON "StorageLocation"("ownerUserId");

-- CreateIndex
CREATE INDEX "MachineStorageLocation_ownerUserId_idx" ON "MachineStorageLocation"("ownerUserId");

-- CreateIndex
CREATE INDEX "MachineStorageLocation_isActive_idx" ON "MachineStorageLocation"("isActive");

-- CreateIndex
CREATE INDEX "BuyerShippingAddress_ownerUserId_isActive_idx" ON "BuyerShippingAddress"("ownerUserId", "isActive");

-- AddForeignKey
ALTER TABLE "TradeNavi" ADD CONSTRAINT "TradeNavi_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNavi" ADD CONSTRAINT "TradeNavi_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_naviId_fkey" FOREIGN KEY ("naviId") REFERENCES "TradeNavi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tradeNaviId_fkey" FOREIGN KEY ("tradeNaviId") REFERENCES "TradeNavi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineStorageLocation" ADD CONSTRAINT "MachineStorageLocation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

