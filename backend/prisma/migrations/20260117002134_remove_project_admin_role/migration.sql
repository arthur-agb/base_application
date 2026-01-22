/*
  Warnings:

  - The values [ADMIN] on the enum `ProjectMemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "momentum"."ProjectMemberRole_new" AS ENUM ('LEAD', 'MEMBER', 'VIEWER');
ALTER TABLE "momentum"."mm_project_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "momentum"."mm_project_members" ALTER COLUMN "role" TYPE "momentum"."ProjectMemberRole_new" USING ("role"::text::"momentum"."ProjectMemberRole_new");
ALTER TYPE "momentum"."ProjectMemberRole" RENAME TO "ProjectMemberRole_old";
ALTER TYPE "momentum"."ProjectMemberRole_new" RENAME TO "ProjectMemberRole";
DROP TYPE "momentum"."ProjectMemberRole_old";
ALTER TABLE "momentum"."mm_project_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;
