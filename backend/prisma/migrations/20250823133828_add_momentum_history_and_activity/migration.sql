/*
  Warnings:

  - You are about to drop the column `updated_at` on the `mm_activity` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `mm_activity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "momentum"."HistoryAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ADD', 'REMOVE', 'MOVE', 'COMMENT');

-- AlterTable
ALTER TABLE "momentum"."mm_activity" DROP COLUMN "updated_at",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "momentum"."mm_history" (
    "history_id" TEXT NOT NULL,
    "action" "momentum"."HistoryAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "associated_entity_type" TEXT,
    "associated_entity_id" TEXT,
    "field_changed" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "changes" JSONB,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mm_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE INDEX "mm_history_entity_type_entity_id_idx" ON "momentum"."mm_history"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "mm_history_associated_entity_type_associated_entity_id_idx" ON "momentum"."mm_history"("associated_entity_type", "associated_entity_id");

-- CreateIndex
CREATE INDEX "mm_history_user_id_idx" ON "momentum"."mm_history"("user_id");

-- CreateIndex
CREATE INDEX "mm_activity_user_id_idx" ON "momentum"."mm_activity"("user_id");

-- AddForeignKey
ALTER TABLE "momentum"."mm_activity" ADD CONSTRAINT "mm_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_history" ADD CONSTRAINT "mm_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
