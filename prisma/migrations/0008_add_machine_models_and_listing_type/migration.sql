-- Ensure ListingType enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ListingType') THEN
    CREATE TYPE "ListingType" AS ENUM ('PACHINKO', 'SLOT');
  END IF;
END $$;

-- Add Listing.type column
ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "type" "ListingType";

UPDATE "Listing" SET "type" = COALESCE("type", 'PACHINKO');

ALTER TABLE "Listing"
  ALTER COLUMN "type" SET NOT NULL,
  ALTER COLUMN "type" SET DEFAULT 'PACHINKO';

-- Create Maker table
CREATE TABLE IF NOT EXISTS "Maker" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Maker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Maker_name_key" ON "Maker"("name");

-- Create MachineModel table
CREATE TABLE IF NOT EXISTS "MachineModel" (
  "id" TEXT NOT NULL,
  "makerId" TEXT NOT NULL,
  "type" "ListingType" NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "MachineModel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MachineModel_type_idx" ON "MachineModel"("type");
CREATE UNIQUE INDEX IF NOT EXISTS "MachineModel_makerId_type_name_key" ON "MachineModel"("makerId", "type", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MachineModel_makerId_fkey'
  ) THEN
    ALTER TABLE "MachineModel"
      ADD CONSTRAINT "MachineModel_makerId_fkey"
      FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
