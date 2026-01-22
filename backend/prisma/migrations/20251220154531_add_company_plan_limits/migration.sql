-- AlterTable
ALTER TABLE "companies"."company_plans" ADD COLUMN     "max_boards" INTEGER,
ADD COLUMN     "max_epics" INTEGER,
ADD COLUMN     "max_scheduled_issues" INTEGER,
ADD COLUMN     "max_sprints" INTEGER,
ADD COLUMN     "max_users" INTEGER;
