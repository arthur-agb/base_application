-- prisma/dev_startup.sql
-- This script creates or updates the default admin user for the development environment.
-- It ensures the user exists, is verified, and has the ADMIN role with a default password.

-- The search_path helps handle the multi-schema setup
SET search_path TO users, public;

-- 1. Create or Update the Profile
INSERT INTO "user_main" (
    "user_id",
    "email",
    "username",
    "display_name",
    "avatar_url",
    "role",
    "status",
    "is_email_verified",
    "created_at",
    "updated_at"
) VALUES (
    'cmjby5hcd0000ln3hurbmi6mk',
    'arthur@agbintegration.com',
    'arthur',
    'Arthur',
    'https://ui-avatars.com/api/?name=Arthur&background=random&color=fff',
    'ADMIN',
    'ACTIVE',
    true,
    NOW(),
    NOW()
) 
ON CONFLICT (email) DO UPDATE SET
    "role" = 'ADMIN',
    "status" = 'ACTIVE',
    "is_email_verified" = true,
    "updated_at" = NOW();

-- 2. Create or Update the Credentials (Password: mm_password_dev)
-- Hash generated for "mm_password_dev" using bcrypt (10 rounds)
INSERT INTO "user_credentials" (
    "user_id",
    "password_hash",
    "created_at",
    "updated_at"
) VALUES (
    'cmjby5hcd0000ln3hurbmi6mk',
    '$2a$10$iZmxOQV2nSuZGG19e8Cc4OR8VkbuJi9bYIeepSKPfUc.lVkqoXmFm',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;


