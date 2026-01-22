-- AlterTable
ALTER TABLE "momentum"."mm_project_main" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "crm"."crm_companies_contact" ALTER COLUMN "comapny_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "crm"."crm_messages" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "crm"."crm_tickets" ALTER COLUMN "company_id" DROP NOT NULL;
