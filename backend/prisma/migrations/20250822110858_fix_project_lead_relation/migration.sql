/*
  Warnings:

  - You are about to drop the column `lead_id` on the `mm_project_main` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "momentum"."mm_project_main" DROP CONSTRAINT "mm_project_main_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing"."leads" DROP CONSTRAINT "leads_company_id_fkey";

-- DropIndex
DROP INDEX "marketing"."leads_company_id_idx";

-- AlterTable
ALTER TABLE "momentum"."mm_project_main" DROP COLUMN "lead_id",
ADD COLUMN     "project_lead_id" TEXT;

-- AddForeignKey
ALTER TABLE "momentum"."mm_project_main" ADD CONSTRAINT "mm_project_main_project_lead_id_fkey" FOREIGN KEY ("project_lead_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;