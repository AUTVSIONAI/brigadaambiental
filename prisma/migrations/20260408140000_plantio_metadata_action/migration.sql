-- Add enum value for TaskType
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'TaskType' AND e.enumlabel = 'PLANTIO'
  ) THEN
    ALTER TYPE "TaskType" ADD VALUE 'PLANTIO';
  END IF;
END $$;

-- Add column
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
