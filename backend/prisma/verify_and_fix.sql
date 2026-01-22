-- First, let's check what exists
SELECT typname FROM pg_type WHERE typname = 'ScheduleFrequency';

-- Check if table exists
SELECT tablename FROM pg_tables WHERE schemaname = 'momentum' AND tablename = 'mm_scheduled_issue';

-- If enum exists but table doesn't, create the table
-- (Run this only if the table doesn't exist)
CREATE TABLE IF NOT EXISTS "momentum"."mm_scheduled_issue" (
    "scheduled_issue_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "momentum"."ScheduleFrequency" NOT NULL,
    "cron_expression" TEXT,
    "custom_config" JSONB,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "template" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_scheduled_issue_pkey" PRIMARY KEY ("scheduled_issue_id")
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "mm_scheduled_issue_board_id_idx" ON "momentum"."mm_scheduled_issue"("board_id");

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'mm_scheduled_issue_board_id_fkey'
    ) THEN
        ALTER TABLE "momentum"."mm_scheduled_issue" 
        ADD CONSTRAINT "mm_scheduled_issue_board_id_fkey" 
        FOREIGN KEY ("board_id") 
        REFERENCES "momentum"."mm_board"("board_id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
