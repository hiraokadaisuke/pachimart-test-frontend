-- Ensure StorageLocation has all expected columns
ALTER TABLE "StorageLocation"
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "prefecture" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "handlingFeePerUnit" INTEGER,
  ADD COLUMN IF NOT EXISTS "shippingFeesByRegion" JSONB,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN;

ALTER TABLE "StorageLocation" ALTER COLUMN "address" DROP NOT NULL;
ALTER TABLE "StorageLocation" ALTER COLUMN "isActive" SET DEFAULT true;
UPDATE "StorageLocation" SET "isActive" = COALESCE("isActive", true);
ALTER TABLE "StorageLocation" ALTER COLUMN "isActive" SET NOT NULL;

-- Migrate data from MachineStorageLocation without dropping the legacy table
DO $$
DECLARE
  ms_record RECORD;
  target_id TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'MachineStorageLocation'
  ) THEN
    FOR ms_record IN SELECT * FROM "MachineStorageLocation" LOOP
      SELECT id
      INTO target_id
      FROM "StorageLocation"
      WHERE "ownerUserId" = ms_record."ownerUserId"
        AND name = ms_record.name
        AND COALESCE("address", '') = COALESCE(ms_record."addressLine", '')
        AND COALESCE("city", '') = COALESCE(ms_record.city, '')
      LIMIT 1;

      IF target_id IS NULL THEN
        target_id := ms_record.id;

        INSERT INTO "StorageLocation" (
          id,
          "ownerUserId",
          name,
          "address",
          "postalCode",
          "prefecture",
          "city",
          "handlingFeePerUnit",
          "shippingFeesByRegion",
          "isActive",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ms_record.id,
          ms_record."ownerUserId",
          ms_record.name,
          ms_record."addressLine",
          ms_record."postalCode",
          ms_record.prefecture,
          ms_record.city,
          ms_record."handlingFeePerUnit",
          ms_record."shippingFeesByRegion",
          COALESCE(ms_record."isActive", true),
          ms_record."createdAt",
          ms_record."updatedAt"
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "address" = EXCLUDED."address",
          "postalCode" = EXCLUDED."postalCode",
          "prefecture" = EXCLUDED."prefecture",
          "city" = EXCLUDED."city",
          "handlingFeePerUnit" = EXCLUDED."handlingFeePerUnit",
          "shippingFeesByRegion" = EXCLUDED."shippingFeesByRegion",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt";
      ELSE
        UPDATE "StorageLocation"
        SET
          "postalCode" = COALESCE("postalCode", ms_record."postalCode"),
          "prefecture" = COALESCE("prefecture", ms_record.prefecture),
          "city" = COALESCE("city", ms_record.city),
          "address" = COALESCE("address", ms_record."addressLine"),
          "handlingFeePerUnit" = COALESCE("handlingFeePerUnit", ms_record."handlingFeePerUnit"),
          "shippingFeesByRegion" = COALESCE("shippingFeesByRegion", ms_record."shippingFeesByRegion"),
          "isActive" = COALESCE("isActive", ms_record."isActive", true),
          "updatedAt" = GREATEST("updatedAt", ms_record."updatedAt")
        WHERE id = target_id;
      END IF;

      UPDATE "Listing"
      SET "storageLocationId" = target_id
      WHERE "storageLocationId" = ms_record.id;
    END LOOP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "StorageLocation_ownerUserId_idx" ON "StorageLocation"("ownerUserId");
CREATE INDEX IF NOT EXISTS "StorageLocation_isActive_idx" ON "StorageLocation"("isActive");
