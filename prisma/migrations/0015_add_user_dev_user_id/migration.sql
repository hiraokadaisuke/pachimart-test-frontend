-- AlterTable
ALTER TABLE "User" ADD COLUMN "devUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_devUserId_key" ON "User"("devUserId");
