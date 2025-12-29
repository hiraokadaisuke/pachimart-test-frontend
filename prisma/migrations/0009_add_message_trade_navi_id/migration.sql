-- Add missing tradeNaviId column to Message
ALTER TABLE "Message" ADD COLUMN "tradeNaviId" INTEGER NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Message" ADD CONSTRAINT "Message_tradeNaviId_fkey" FOREIGN KEY ("tradeNaviId") REFERENCES "TradeNavi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
