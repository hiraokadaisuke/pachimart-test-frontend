DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageSenderRole') THEN
    CREATE TYPE "MessageSenderRole" AS ENUM ('buyer', 'seller');
  END IF;
END$$;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderRole" "MessageSenderRole";
