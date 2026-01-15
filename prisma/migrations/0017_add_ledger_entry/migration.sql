-- Create enums for LedgerEntry if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerEntryCategory') THEN
    CREATE TYPE "LedgerEntryCategory" AS ENUM ('PURCHASE', 'SALE', 'DEPOSIT', 'WITHDRAWAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerEntryKind') THEN
    CREATE TYPE "LedgerEntryKind" AS ENUM ('PLANNED', 'ACTUAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerEntrySource') THEN
    CREATE TYPE "LedgerEntrySource" AS ENUM ('TRADE_STATUS_TRANSITION', 'MANUAL_ADJUSTMENT');
  END IF;
END $$;

-- Create LedgerEntry table if it does not exist
CREATE TABLE IF NOT EXISTS "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" INTEGER,
    "category" "LedgerEntryCategory" NOT NULL,
    "kind" "LedgerEntryKind" NOT NULL DEFAULT 'PLANNED',
    "amountYen" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counterpartyName" TEXT,
    "makerName" TEXT,
    "itemName" TEXT,
    "memo" TEXT,
    "balanceAfterYen" INTEGER,
    "breakdown" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "source" "LedgerEntrySource" NOT NULL DEFAULT 'TRADE_STATUS_TRANSITION',
    "tradeStatusAtCreation" "TradeStatus",
    "dedupeKey" TEXT NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "LedgerEntry_userId_occurredAt_idx" ON "LedgerEntry"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "LedgerEntry_tradeId_idx" ON "LedgerEntry"("tradeId");
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerEntry_dedupeKey_key" ON "LedgerEntry"("dedupeKey");
