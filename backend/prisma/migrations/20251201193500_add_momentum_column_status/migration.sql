-- CreateEnum
CREATE TYPE "momentum"."IssueStatusCategory" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BACKLOG');

-- Add 'category' column to mm_column
ALTER TABLE "momentum"."mm_column" ADD COLUMN "category" "momentum"."IssueStatusCategory";

-- Update 'category' in mm_column based on 'status'
UPDATE "momentum"."mm_column" SET "category" = "status"::text::"momentum"."IssueStatusCategory";

-- Make 'category' required and set default
ALTER TABLE "momentum"."mm_column" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "momentum"."mm_column" ALTER COLUMN "category" SET DEFAULT 'TODO';

-- Drop 'status' from mm_column
ALTER TABLE "momentum"."mm_column" DROP COLUMN "status";


-- Add 'category' column to mm_issue
ALTER TABLE "momentum"."mm_issue" ADD COLUMN "category" "momentum"."IssueStatusCategory";

-- Update 'category' in mm_issue based on 'status'
UPDATE "momentum"."mm_issue" SET "category" = "status"::text::"momentum"."IssueStatusCategory";

-- Make 'category' required and set default
ALTER TABLE "momentum"."mm_issue" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "momentum"."mm_issue" ALTER COLUMN "category" SET DEFAULT 'TODO';

-- Convert 'status' in mm_issue to TEXT
ALTER TABLE "momentum"."mm_issue" ALTER COLUMN "status" TYPE TEXT USING "status"::text;

-- DropEnum
DROP TYPE "momentum"."IssueStatus";
