-- Add unique constraint for storage locations per owner and name
CREATE UNIQUE INDEX IF NOT EXISTS "StorageLocation_name_ownerUserId_key" ON "StorageLocation"("name", "ownerUserId");
