-- CreateEnum
CREATE TYPE "OutboundScheduleSourceType" AS ENUM ('MANUAL', 'DEALING', 'NAVI', 'EXHIBIT', 'ONLINE_INQUIRY', 'SEED');

-- AlterTable
ALTER TABLE "OutboundSchedule"
ADD COLUMN "sourceType" "OutboundScheduleSourceType",
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OutboundSchedule_dedupeKey_key" ON "OutboundSchedule"("dedupeKey");

-- CreateIndex
CREATE INDEX "OutboundSchedule_ownerUserId_sourceType_sourceId_idx" ON "OutboundSchedule"("ownerUserId", "sourceType", "sourceId");
