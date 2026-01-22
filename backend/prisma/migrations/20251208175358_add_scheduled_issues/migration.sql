-- CreateEnum
CREATE TYPE "momentum"."ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "momentum"."mm_scheduled_issue" (
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

-- CreateIndex
CREATE INDEX "mm_scheduled_issue_board_id_idx" ON "momentum"."mm_scheduled_issue"("board_id");

-- AddForeignKey
ALTER TABLE "momentum"."mm_scheduled_issue" ADD CONSTRAINT "mm_scheduled_issue_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "momentum"."mm_board"("board_id") ON DELETE CASCADE ON UPDATE CASCADE;
