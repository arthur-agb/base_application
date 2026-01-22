-- Drop the enum if it exists (from partial migration)
DROP TYPE IF EXISTS "momentum"."ScheduleFrequency" CASCADE;

-- Drop the table if it exists (from partial migration)
DROP TABLE IF EXISTS "momentum"."mm_scheduled_issue" CASCADE;
