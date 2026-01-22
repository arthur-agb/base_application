/*
  Warnings:

  - You are about to drop the column `company_id` on the `leads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "crm"."crm_feedback" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "marketing"."leads" DROP COLUMN "company_id";
