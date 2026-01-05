-- Create new enum with expanded statuses
CREATE TYPE "TradeStatus_new" AS ENUM ('APPROVAL_REQUIRED', 'PAYMENT_REQUIRED', 'CONFIRM_REQUIRED', 'COMPLETED', 'CANCELED');

-- Migrate existing status values
ALTER TABLE "Dealing"
  ALTER COLUMN "status" TYPE "TradeStatus_new" USING (
    CASE "status"
      WHEN 'IN_PROGRESS' THEN 'PAYMENT_REQUIRED'::"TradeStatus_new"
      WHEN 'COMPLETED' THEN 'COMPLETED'::"TradeStatus_new"
      WHEN 'CANCELED' THEN 'CANCELED'::"TradeStatus_new"
    END
  );

-- Drop old enum and rename new one
DROP TYPE "TradeStatus";
ALTER TYPE "TradeStatus_new" RENAME TO "TradeStatus";

-- Add lifecycle timestamps
ALTER TABLE "Dealing"
  ADD COLUMN "paymentAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "canceledAt" TIMESTAMP(3);
