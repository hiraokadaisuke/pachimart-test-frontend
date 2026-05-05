-- Add user-level default storage location for inbound auto-completion
ALTER TABLE "User"
ADD COLUMN "defaultStorageLocationId" TEXT;

ALTER TABLE "User"
ADD CONSTRAINT "User_defaultStorageLocationId_fkey"
FOREIGN KEY ("defaultStorageLocationId") REFERENCES "StorageLocation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_defaultStorageLocationId_idx" ON "User"("defaultStorageLocationId");
