-- Align StorageLocation columns with the current Prisma schema
ALTER TABLE "StorageLocation"
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "handlingFeePerUnit" INTEGER,
  ADD COLUMN IF NOT EXISTS "shippingFeesByRegion" JSONB,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN;

ALTER TABLE "StorageLocation" ALTER COLUMN "address" DROP NOT NULL;
ALTER TABLE "StorageLocation" ALTER COLUMN "isActive" SET DEFAULT true;
UPDATE "StorageLocation" SET "isActive" = COALESCE("isActive", true);
ALTER TABLE "StorageLocation" ALTER COLUMN "isActive" SET NOT NULL;

-- Consolidate legacy addressLine column into address to avoid dual management
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'StorageLocation'
      AND column_name = 'addressLine'
  ) THEN
    UPDATE "StorageLocation"
    SET "address" = COALESCE("addressLine", "address")
    WHERE "addressLine" IS NOT NULL;

    ALTER TABLE "StorageLocation" DROP COLUMN "addressLine";
  END IF;
END $$;

-- Migrate any remaining machine storage locations into StorageLocation
DO $$
DECLARE
  ms_record RECORD;
  duplicate_id TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'MachineStorageLocation'
  ) THEN
    FOR ms_record IN SELECT * FROM "MachineStorageLocation" LOOP
      SELECT id
      INTO duplicate_id
      FROM "StorageLocation"
      WHERE "ownerUserId" = ms_record."ownerUserId"
        AND name = ms_record.name
        AND COALESCE("address", '') = COALESCE(ms_record."addressLine", '')
        AND COALESCE("city", '') = COALESCE(ms_record.city, '')
        AND COALESCE("prefecture", '') = COALESCE(ms_record.prefecture, '')
        AND COALESCE("postalCode", '') = COALESCE(ms_record."postalCode", '')
      LIMIT 1;

      IF duplicate_id IS NULL THEN
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
          COALESCE(ms_record."addressLine", ''),
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

        duplicate_id := ms_record.id;
      ELSE
        UPDATE "StorageLocation"
        SET
          "postalCode" = COALESCE("postalCode", ms_record."postalCode"),
          "prefecture" = COALESCE("prefecture", ms_record.prefecture),
          "city" = COALESCE("city", ms_record.city),
          "address" = COALESCE("address", ms_record."addressLine"),
          "handlingFeePerUnit" = COALESCE("handlingFeePerUnit", ms_record."handlingFeePerUnit"),
          "shippingFeesByRegion" = COALESCE("shippingFeesByRegion", ms_record."shippingFeesByRegion"),
          "updatedAt" = GREATEST("updatedAt", ms_record."updatedAt")
        WHERE id = duplicate_id;
      END IF;

      UPDATE "Listing"
      SET "storageLocationId" = duplicate_id
      WHERE "storageLocationId" = ms_record.id;
    END LOOP;

    DROP TABLE "MachineStorageLocation";
  END IF;
END $$;

-- Ensure listings reference an existing storage location
UPDATE "Listing" l
SET "storageLocationId" = (
  SELECT id
  FROM "StorageLocation" s
  WHERE s."ownerUserId" = l."sellerUserId"
  LIMIT 1
)
WHERE l."storageLocationId" IS NULL;

DO $$
DECLARE
  listing_record RECORD;
  fallback_id TEXT;
BEGIN
  FOR listing_record IN SELECT id, "sellerUserId" FROM "Listing" WHERE "storageLocationId" IS NULL LOOP
    SELECT id INTO fallback_id FROM "StorageLocation" WHERE "ownerUserId" = listing_record."sellerUserId" LIMIT 1;

    IF fallback_id IS NULL THEN
      fallback_id := concat('stor_', md5(random()::text || clock_timestamp()::text));

      INSERT INTO "StorageLocation" (
        id,
        "ownerUserId",
        name,
        "address",
        "isActive",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        fallback_id,
        listing_record."sellerUserId",
        'Migrated Storage',
        '',
        true,
        now(),
        now()
      );
    END IF;

    UPDATE "Listing" SET "storageLocationId" = fallback_id WHERE id = listing_record.id;
  END LOOP;
END $$;

ALTER TABLE "Listing" ALTER COLUMN "storageLocationId" SET NOT NULL;

-- Ensure useful indexes exist
CREATE INDEX IF NOT EXISTS "StorageLocation_isActive_idx" ON "StorageLocation"("isActive");
CREATE INDEX IF NOT EXISTS "Listing_storageLocationId_idx" ON "Listing"("storageLocationId");
