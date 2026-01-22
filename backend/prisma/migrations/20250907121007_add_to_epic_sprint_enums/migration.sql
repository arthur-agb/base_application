/*
  Warnings:

  - The values [DONE] on the enum `EpicStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "momentum"."EpicStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
ALTER TABLE "momentum"."mm_epic" ALTER COLUMN "status" TYPE "momentum"."EpicStatus_new" USING ("status"::text::"momentum"."EpicStatus_new");
ALTER TYPE "momentum"."EpicStatus" RENAME TO "EpicStatus_old";
ALTER TYPE "momentum"."EpicStatus_new" RENAME TO "EpicStatus";
DROP TYPE "momentum"."EpicStatus_old";
COMMIT;

-- AlterEnum
ALTER TYPE "momentum"."SprintStatus" ADD VALUE 'ARCHIVED';
