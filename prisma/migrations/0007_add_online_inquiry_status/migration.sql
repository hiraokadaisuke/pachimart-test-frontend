-- CreateEnum
CREATE TYPE "OnlineInquiryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "OnlineInquiry" ADD COLUMN "status" "OnlineInquiryStatus" NOT NULL DEFAULT 'PENDING';
