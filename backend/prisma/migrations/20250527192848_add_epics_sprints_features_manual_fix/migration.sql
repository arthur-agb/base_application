/*
  Warnings from Prisma (addressed by manual changes below):

  - The `priority` column on the `Issue` table would be dropped and recreated. (Manual: Altered to preserve data)
  - The `role` column on the `User` table would be dropped and recreated. (Manual: Altered to preserve data)
  - A unique constraint covering the columns `[username]` on the table `User` will be added. (Manual: Data populated to be unique)
  - Changed the type of `type` on the `Issue` table. No cast exists... (Manual: Altered to preserve data)
  - Added the required column `username` to the `User` table without a default value. (Manual: Added nullable, populated, then set to NOT NULL)
*/

-- CreateEnum: All enum types must be created before they are used.
CREATE TYPE "UserRole" AS ENUM ('USER', 'DEVELOPER', 'MANAGER', 'ADMIN');
CREATE TYPE "EpicStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED');
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "IssueType" AS ENUM ('STORY', 'TASK', 'BUG', 'SUB_TASK');
CREATE TYPE "IssuePriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST');

-- AlterTable "Issue": Add new columns first
ALTER TABLE "Issue"
    ADD COLUMN "epic_id" TEXT,
    ADD COLUMN "parent_issue_id" TEXT,
    ADD COLUMN "sprint_id" TEXT,
    ADD COLUMN "story_points" INTEGER;

-- Manually convert "Issue"."type" from TEXT to "IssueType" enum
-- Existing data from your sample: 'TASK', which matches 'TASK' in enum. Direct cast should work.
ALTER TABLE "Issue"
    ALTER COLUMN "type" TYPE "IssueType" USING "type"::text::"IssueType";
-- Ensure "type" remains NOT NULL (it was required before as per Prisma's error message)
ALTER TABLE "Issue"
    ALTER COLUMN "type" SET NOT NULL;

-- Manually convert "Issue"."priority" from TEXT to "IssuePriority" enum
-- Existing data from your sample: 'MEDIUM', which matches 'MEDIUM' in enum. Direct cast should work.

-- Step 1: Explicitly drop any old default BEFORE type conversion for "Issue"."priority"
ALTER TABLE "Issue" ALTER COLUMN "priority" DROP DEFAULT;

-- Step 2: Convert the column type for "Issue"."priority"
ALTER TABLE "Issue"
    ALTER COLUMN "priority" TYPE "IssuePriority" USING "priority"::text::"IssuePriority";

-- Step 3: Ensure "priority" remains NOT NULL and re-apply the new enum-based default
ALTER TABLE "Issue"
    ALTER COLUMN "priority" SET NOT NULL,
    ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"IssuePriority"; -- Explicitly cast to IssuePriority

-- AlterTable "User": Handle "username" and "role"

-- 1. Add "username" column as nullable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- 2. Populate "username" for existing users
-- This uses the part of the email before '@' and the first 8 chars of the CUID 'id'
-- to create likely unique initial usernames.
UPDATE "User"
SET "username" = COALESCE(
    LOWER(regexp_replace(substring("email" from '(.*)@'), '[^a-zA-Z0-9_]', '', 'g')), -- Sanitize and use email prefix
    'user'                                                                       -- Fallback if email prefix is null/empty
  ) || '_' || substring(CAST("id" AS TEXT) from 1 for 8)                         -- Append part of CUID for uniqueness
WHERE "username" IS NULL;

-- 3. Set "username" column to NOT NULL
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- 4. Manually convert "User"."role" from TEXT to "UserRole" enum
-- Existing data confirmed as 'user' and 'admin' (lowercase).
-- Update existing text values to match the enum's case (e.g., 'USER', 'ADMIN')
UPDATE "User" SET "role" = 'USER' WHERE "role"::text = 'user';
UPDATE "User" SET "role" = 'ADMIN' WHERE "role"::text = 'admin';
-- If other role strings existed, they would need mapping here. For example:
-- UPDATE "User" SET "role" = 'DEVELOPER' WHERE "role"::text = 'developer';
-- UPDATE "User" SET "role" = 'MANAGER' WHERE "role"::text = 'manager';
-- Or a more general approach if direct uppercase mapping is intended:
-- UPDATE "User" SET "role" = UPPER("role"::text) WHERE "role"::text IN ('user', 'admin', 'developer', 'manager');


-- Step 1: Explicitly drop any old default BEFORE type conversion for "User"."role"
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Convert the column type "User"."role" using the already updated values
ALTER TABLE "User"
    ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";

-- Step 3: Ensure "role" remains NOT NULL and re-apply default (Prisma schema default is USER)
ALTER TABLE "User"
    ALTER COLUMN "role" SET NOT NULL,
    ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole"; -- Explicitly cast to UserRole

-- CreateTable "epics" (New table - this is fine as generated)
CREATE TABLE "epics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EpicStatus" NOT NULL DEFAULT 'OPEN',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, -- Prisma client will handle updates
    "project_id" TEXT NOT NULL,
    "owner_user_id" TEXT,

    CONSTRAINT "epics_pkey" PRIMARY KEY ("id")
);

-- CreateTable "sprints" (New table - this is fine as generated)
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "capacity_points" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, -- Prisma client will handle updates
    "project_id" TEXT NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (These are fine as generated)
CREATE INDEX "Issue_epic_id_idx" ON "Issue"("epic_id");
CREATE INDEX "Issue_sprint_id_idx" ON "Issue"("sprint_id");
CREATE INDEX "Issue_parent_issue_id_idx" ON "Issue"("parent_issue_id");

-- CreateIndex for User.username (This is fine, comes after username is populated and NOT NULL)
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey (These are fine as generated)
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epics" ADD CONSTRAINT "epics_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "epics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_parent_issue_id_fkey" FOREIGN KEY ("parent_issue_id") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE NO ACTION;