-- Ensure devUserId column exists for User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "devUserId" TEXT;

-- Ensure unique index exists for devUserId
CREATE UNIQUE INDEX IF NOT EXISTS "User_devUserId_key" ON "User"("devUserId");
