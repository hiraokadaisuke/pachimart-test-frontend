-- Add postalCode column to StorageLocation
ALTER TABLE "StorageLocation" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
