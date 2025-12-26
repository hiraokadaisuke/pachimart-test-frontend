-- DropForeignKey
ALTER TABLE "MachineStorageLocation" DROP CONSTRAINT "MachineStorageLocation_ownerUserId_fkey";

-- AlterTable
ALTER TABLE "StorageLocation" ADD COLUMN     "addressLine" TEXT,
ADD COLUMN     "handlingFeePerUnit" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "shippingFeesByRegion" JSONB,
ALTER COLUMN "address" DROP NOT NULL;

-- Migrate existing machine storage locations into StorageLocation
INSERT INTO "StorageLocation" (id, "ownerUserId", name, address, prefecture, city, "addressLine", "handlingFeePerUnit", "shippingFeesByRegion", "isActive", "createdAt", "updatedAt", "postalCode")
SELECT ms.id,
       ms."ownerUserId",
       ms.name,
       COALESCE(ms.prefecture, '') || COALESCE(ms.city, '') || COALESCE(ms."addressLine", ''),
       ms.prefecture,
       ms.city,
       ms."addressLine",
       ms."handlingFeePerUnit",
       ms."shippingFeesByRegion",
       ms."isActive",
       ms."createdAt",
       ms."updatedAt",
       ms."postalCode"
FROM "MachineStorageLocation" ms
WHERE NOT EXISTS (SELECT 1 FROM "StorageLocation" s WHERE s.id = ms.id);

-- Ensure listings always reference a storage location
UPDATE "Listing" l
SET "storageLocationId" = (
  SELECT id FROM "StorageLocation" s WHERE s."ownerUserId" = l."sellerUserId" LIMIT 1
)
WHERE l."storageLocationId" IS NULL;

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "storageLocationId" SET NOT NULL;

-- DropTable
DROP TABLE "MachineStorageLocation";

-- CreateIndex
CREATE INDEX "Listing_storageLocationId_idx" ON "Listing"("storageLocationId");

-- CreateIndex
CREATE INDEX "StorageLocation_isActive_idx" ON "StorageLocation"("isActive");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
