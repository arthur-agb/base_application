/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `user_main` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users"."user_main" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "user_main_emailVerificationToken_key" ON "users"."user_main"("emailVerificationToken");
