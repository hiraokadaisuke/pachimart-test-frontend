-- Add missing tradeNaviId column to Message (idempotent)
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "tradeNaviId" INTEGER;

-- Add foreign key constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Message_tradeNaviId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_tradeNaviId_fkey"
      FOREIGN KEY ("tradeNaviId")
      REFERENCES "TradeNavi"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;
