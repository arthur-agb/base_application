/*
  Warnings:

  - A unique constraint covering the columns `[companyId,key]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CompanyRole" ADD VALUE 'MANAGER';

-- DropIndex
DROP INDEX "Project_key_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_key_key" ON "Project"("companyId", "key");
