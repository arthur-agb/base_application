/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `user_main` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users"."user_main" ADD COLUMN     "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_main_google_id_key" ON "users"."user_main"("google_id");
