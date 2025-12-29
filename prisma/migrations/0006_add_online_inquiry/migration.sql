-- CreateTable
CREATE TABLE "OnlineInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "shippingAddress" TEXT,
    "contactPerson" TEXT,
    "desiredShipDate" TEXT,
    "desiredPaymentDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineInquiry_pkey" PRIMARY KEY ("id")
);
