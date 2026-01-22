/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `company_plans` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "companies"."CompanyUserRole" ADD VALUE 'MANAGER';
ALTER TYPE "companies"."CompanyUserRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "users"."user_settings" ADD COLUMN     "last_active_company_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "company_plans_name_key" ON "companies"."company_plans"("name");
