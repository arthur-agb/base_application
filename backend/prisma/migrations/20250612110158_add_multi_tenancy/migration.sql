/*
  Warnings:

  - Added the required column `companyId` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Column` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `epics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `sprints` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "History" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "epics" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "company_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_users" (
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("userId","companyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "Board_companyId_idx" ON "Board"("companyId");

-- CreateIndex
CREATE INDEX "Column_companyId_idx" ON "Column"("companyId");

-- CreateIndex
CREATE INDEX "Comment_companyId_idx" ON "Comment"("companyId");

-- CreateIndex
CREATE INDEX "History_companyId_idx" ON "History"("companyId");

-- CreateIndex
CREATE INDEX "Issue_companyId_idx" ON "Issue"("companyId");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "epics_company_id_idx" ON "epics"("company_id");

-- CreateIndex
CREATE INDEX "sprints_company_id_idx" ON "sprints"("company_id");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epics" ADD CONSTRAINT "epics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
