-- CreateEnum
CREATE TYPE "InboundScheduleSourceType" AS ENUM ('MANUAL', 'DEALING', 'NAVI', 'EXHIBIT', 'ONLINE_INQUIRY', 'SEED');

-- AlterTable
ALTER TABLE "InboundSchedule"
ADD COLUMN "sourceType" "InboundScheduleSourceType",
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InboundSchedule_dedupeKey_key" ON "InboundSchedule"("dedupeKey");

-- CreateIndex
CREATE INDEX "InboundSchedule_ownerUserId_sourceType_sourceId_idx" ON "InboundSchedule"("ownerUserId", "sourceType", "sourceId");
