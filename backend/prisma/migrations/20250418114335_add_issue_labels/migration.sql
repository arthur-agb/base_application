-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];
