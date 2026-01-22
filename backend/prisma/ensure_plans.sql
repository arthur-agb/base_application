-- backend/prisma/ensure_plans.sql
-- Idempotent script to ensure default plans exist in the database.
-- This is critical for the backend to start successfully.

-- Set search path to include 'users' schema where user_plans table resides
SET search_path TO users, public;

-- 1. Free Tier
INSERT INTO "user_plans" (
    "plan_id", "name", "description", "base_price", "currency", "billing_frequency", 
    "is_active", "start_date", "created_at", "updated_at"
)
SELECT 
    '779fe505-9574-4237-aa1b-639d50b76426', -- Fixed ID for consistency
    'Free Tier', 
    'A basic, free plan with limited features.', 
    0, 
    'GBP', 
    'MONTHLY', 
    true, 
    NOW(), 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "user_plans" WHERE "name" = 'Free Tier'
);

-- 2. Pro Tier
INSERT INTO "user_plans" (
    "plan_id", "name", "description", "base_price", "currency", "billing_frequency", 
    "is_active", "start_date", "created_at", "updated_at"
)
SELECT 
    '16a1abe5-a9bc-4ece-be46-86eec4623f75', 
    'Pro Tier', 
    'Advanced features for professional use.', 
    9.99, 
    'GBP', 
    'MONTHLY', 
    true, 
    NOW(), 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "user_plans" WHERE "name" = 'Pro Tier'
);

-- 3. Pro Annual Tier
INSERT INTO "user_plans" (
    "plan_id", "name", "description", "base_price", "currency", "billing_frequency", 
    "is_active", "start_date", "created_at", "updated_at"
)
SELECT 
    'fa9f02a5-15c5-4d8c-a384-87f36093acac', 
    'Pro Annual Tier', 
    'Advanced features for professional use.', 
    89.99, 
    'GBP', 
    'YEARLY', 
    true, 
    NOW(), 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "user_plans" WHERE "name" = 'Pro Annual Tier'
);
