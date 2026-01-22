-- CreateEnum
CREATE TYPE "momentum"."ProjectMemberRole" AS ENUM ('LEAD', 'ADMIN', 'MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "momentum"."mm_project_members" ADD COLUMN     "role" "momentum"."ProjectMemberRole" NOT NULL DEFAULT 'MEMBER';
