/*
  Warnings:

  - You are about to drop the column `owner_uder_id` on the `mm_epic` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "momentum"."mm_epic" DROP CONSTRAINT "mm_epic_owner_uder_id_fkey";

-- AlterTable
ALTER TABLE "momentum"."mm_epic" DROP COLUMN "owner_uder_id",
ADD COLUMN     "owner_user_id" TEXT;

-- AddForeignKey
ALTER TABLE "momentum"."mm_epic" ADD CONSTRAINT "mm_epic_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
