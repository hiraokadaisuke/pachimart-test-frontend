-- Add dev user identifier for mapping dev users to real accounts
ALTER TABLE "User" ADD COLUMN "devUserId" TEXT;

CREATE UNIQUE INDEX "User_devUserId_key" ON "User"("devUserId");
