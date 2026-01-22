-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "companies";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "crm";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "momentum";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "people";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateEnum
CREATE TYPE "finance"."BillingType" AS ENUM ('USER', 'COMPANY');

-- CreateEnum
CREATE TYPE "finance"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "finance"."TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'CREDIT');

-- CreateEnum
CREATE TYPE "crm"."CrmTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "crm"."CrmTicketPriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST');

-- CreateEnum
CREATE TYPE "crm"."CrmFeedbackType" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK');

-- CreateEnum
CREATE TYPE "crm"."CrmContactType" AS ENUM ('PHONE_CALL', 'EMAIL', 'MEETING');

-- CreateEnum
CREATE TYPE "people"."LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY');

-- CreateEnum
CREATE TYPE "people"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "marketing"."CampaignType" AS ENUM ('EMAIL', 'SOCIAL_MEDIA', 'PAID_ADVERTISING', 'CONTENT_MARKETING');

-- CreateEnum
CREATE TYPE "marketing"."CampaignStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "marketing"."SocialPlatform" AS ENUM ('FACEBOOK', 'TWITTER', 'INSTAGRAM', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "marketing"."InteractionType" AS ENUM ('CLICK', 'VIEW', 'CONVERSION', 'SHARE');

-- CreateEnum
CREATE TYPE "marketing"."AdPlatform" AS ENUM ('GOOGLE_ADS', 'FACEBOOK_ADS', 'LINKEDIN_ADS');

-- CreateEnum
CREATE TYPE "marketing"."AdBidStrategy" AS ENUM ('CPC', 'CPM', 'CPA');

-- CreateEnum
CREATE TYPE "marketing"."AdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "marketing"."AdCreativeType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT');

-- CreateEnum
CREATE TYPE "marketing"."KeywordMatchType" AS ENUM ('BROAD', 'PHRASE', 'EXACT');

-- CreateEnum
CREATE TYPE "users"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "users"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "users"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'TRIALING', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "users"."BillingFrequency" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "companies"."CompanyUserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'BILLING');

-- CreateEnum
CREATE TYPE "momentum"."BoardType" AS ENUM ('KANBAN', 'SCRUM');

-- CreateEnum
CREATE TYPE "momentum"."IssueType" AS ENUM ('STORY', 'TASK', 'BUG', 'EPIC');

-- CreateEnum
CREATE TYPE "momentum"."IssuePriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST');

-- CreateEnum
CREATE TYPE "momentum"."IssueStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BACKLOG');

-- CreateEnum
CREATE TYPE "momentum"."EpicStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "momentum"."SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "users"."user_plans" (
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_frequency" "users"."BillingFrequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "users"."user_addons" (
    "addon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_frequency" "users"."BillingFrequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addons_pkey" PRIMARY KEY ("addon_id")
);

-- CreateTable
CREATE TABLE "companies"."company_plans" (
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_frequency" "users"."BillingFrequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "companies"."company_addons" (
    "addon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_frequency" "users"."BillingFrequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_addons_pkey" PRIMARY KEY ("addon_id")
);

-- CreateTable
CREATE TABLE "finance"."finance_suppliers" (
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bank_details" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "people"."employees" (
    "employee_id" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "cost_centre" TEXT NOT NULL,
    "manager_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "marketing"."campaigns" (
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "marketing"."CampaignType" NOT NULL,
    "budget" DOUBLE PRECISION,
    "status" "marketing"."CampaignStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "finance"."finance_invoices" (
    "invoice_id" TEXT NOT NULL,
    "billing_type" "finance"."BillingType" NOT NULL,
    "billing_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "finance"."InvoiceStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "finance"."finance_costs" (
    "cost_id" TEXT NOT NULL,
    "cost_centre" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_costs_pkey" PRIMARY KEY ("cost_id")
);

-- CreateTable
CREATE TABLE "finance"."finance_transactions" (
    "transaction_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "transaction_type" "finance"."TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "people"."salaries" (
    "salary_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salaries_pkey" PRIMARY KEY ("salary_id")
);

-- CreateTable
CREATE TABLE "people"."employees_personal" (
    "personal_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "preferred_name" TEXT,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "personal_phone" TEXT,
    "personal_email" TEXT,
    "work_phone" TEXT,
    "work_email" TEXT NOT NULL,
    "addres_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "ni_number" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_number" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_personal_pkey" PRIMARY KEY ("personal_id")
);

-- CreateTable
CREATE TABLE "people"."employee_payment" (
    "payment_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "sort_code" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "people"."leave" (
    "leave_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" "people"."LeaveType" NOT NULL,
    "status" "people"."LeaveStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_pkey" PRIMARY KEY ("leave_id")
);

-- CreateTable
CREATE TABLE "marketing"."email_campaigns" (
    "email_camp_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "recipients" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("email_camp_id")
);

-- CreateTable
CREATE TABLE "marketing"."social_posts" (
    "social_post_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "platform" "marketing"."SocialPlatform" NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("social_post_id")
);

-- CreateTable
CREATE TABLE "marketing"."paid_campaigns" (
    "paid_camp_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "platform" "marketing"."AdPlatform" NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "daily_budget" DOUBLE PRECISION,
    "details" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paid_campaigns_pkey" PRIMARY KEY ("paid_camp_id")
);

-- CreateTable
CREATE TABLE "marketing"."ad_sets" (
    "ad_set_id" TEXT NOT NULL,
    "paid_camp_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_audience" JSONB NOT NULL,
    "bid_strategy" "marketing"."AdBidStrategy" NOT NULL,
    "status" "marketing"."AdStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_sets_pkey" PRIMARY KEY ("ad_set_id")
);

-- CreateTable
CREATE TABLE "marketing"."ad_content" (
    "ad_content_id" TEXT NOT NULL,
    "ad_set_id" TEXT NOT NULL,
    "creative_type" "marketing"."AdCreativeType" NOT NULL,
    "headline" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "image_url" TEXT,
    "destination_url" TEXT NOT NULL,
    "status" "marketing"."AdStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_content_pkey" PRIMARY KEY ("ad_content_id")
);

-- CreateTable
CREATE TABLE "marketing"."performance_metrics" (
    "performance_id" TEXT NOT NULL,
    "ad_content_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL,
    "revenue_generated" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("performance_id")
);

-- CreateTable
CREATE TABLE "marketing"."keywords" (
    "keyword_id" TEXT NOT NULL,
    "ad_set_id" TEXT NOT NULL,
    "keyword_text" TEXT NOT NULL,
    "match_type" "marketing"."KeywordMatchType" NOT NULL,
    "bid_amount" DOUBLE PRECISION,
    "status" "marketing"."AdStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("keyword_id")
);

-- CreateTable
CREATE TABLE "companies"."company_main" (
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_main_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "users"."user_main" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "role" "users"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "users"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_main_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "marketing"."leads" (
    "leads_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("leads_id")
);

-- CreateTable
CREATE TABLE "crm"."crm_tickets" (
    "ticket_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "crm"."CrmTicketStatus" NOT NULL,
    "priority" "crm"."CrmTicketPriority" NOT NULL,
    "assignee_notes" TEXT,
    "assigned_to_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "crm"."crm_messages" (
    "message_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "crm"."crm_feedback" (
    "feedback_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "feedback_type" "crm"."CrmFeedbackType" NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "crm"."crm_companies_contact" (
    "contact_id" TEXT NOT NULL,
    "comapny_id" TEXT NOT NULL,
    "contact_type" "crm"."CrmContactType" NOT NULL,
    "notes" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_companies_contact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "marketing"."analytics" (
    "analytics_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "interaction_type" "marketing"."InteractionType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("analytics_id")
);

-- CreateTable
CREATE TABLE "users"."user_settings" (
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "sidebar_size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users"."user_credentials" (
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "two_factor_secret" TEXT,
    "password_reset_token" TEXT,
    "email_verification_token" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users"."user_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "device_info" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "users"."user_activity" (
    "activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "users"."user_subscription" (
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "users"."SubscriptionStatus" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "users"."user_billing" (
    "billing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_due" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "finance"."InvoiceStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_billing_pkey" PRIMARY KEY ("billing_id")
);

-- CreateTable
CREATE TABLE "users"."user_plan_addons" (
    "subscription_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "user_plan_addons_pkey" PRIMARY KEY ("subscription_id","addon_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_project_main" (
    "project_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_project_main_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "companies"."company_subscription" (
    "subscription_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "users"."SubscriptionStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscription_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "companies"."company_billing" (
    "billing_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_due" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "finance"."InvoiceStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_billing_pkey" PRIMARY KEY ("billing_id")
);

-- CreateTable
CREATE TABLE "companies"."company_settings" (
    "setting_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "setting_name" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "companies"."company_users" (
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "companies"."CompanyUserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("company_id","user_id")
);

-- CreateTable
CREATE TABLE "companies"."company_plan_addons" (
    "subscription_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "company_plan_addons_pkey" PRIMARY KEY ("subscription_id","addon_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_board" (
    "board_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "momentum"."BoardType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_board_pkey" PRIMARY KEY ("board_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_column" (
    "column_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" INTEGER,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_column_pkey" PRIMARY KEY ("column_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_issue" (
    "issue_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "assignee_user_id" TEXT,
    "epic_id" TEXT,
    "sprint_id" TEXT,
    "parent_issue_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "momentum"."IssueType" NOT NULL,
    "priority" "momentum"."IssuePriority" NOT NULL,
    "status" "momentum"."IssueStatus" NOT NULL,
    "labels" TEXT[],
    "story_points" DOUBLE PRECISION,
    "due_date" TIMESTAMP(3),
    "position" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_issue_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_epic" (
    "epic_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner_uder_id" TEXT,
    "status" "momentum"."EpicStatus" NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_epic_pkey" PRIMARY KEY ("epic_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_sprint" (
    "sprint_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "description" TEXT,
    "status" "momentum"."SprintStatus" NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "capacity_points" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_sprint_pkey" PRIMARY KEY ("sprint_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_comment" (
    "comment_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "body" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "reactions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_activity" (
    "activity_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mm_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_project_members" (
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "mm_project_members_pkey" PRIMARY KEY ("project_id","user_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_board_members" (
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "mm_board_members_pkey" PRIMARY KEY ("board_id","user_id")
);

-- CreateTable
CREATE TABLE "momentum"."mm_sprint_members" (
    "sprint_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "mm_sprint_members_pkey" PRIMARY KEY ("sprint_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_suppliers_email_key" ON "finance"."finance_suppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cost_centre_key" ON "people"."employees"("cost_centre");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "people"."employees"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_invoices_invoice_number_key" ON "finance"."finance_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "finance_costs_supplier_id_idx" ON "finance"."finance_costs"("supplier_id");

-- CreateIndex
CREATE INDEX "finance_costs_cost_centre_idx" ON "finance"."finance_costs"("cost_centre");

-- CreateIndex
CREATE INDEX "finance_transactions_invoice_id_idx" ON "finance"."finance_transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "salaries_employee_id_idx" ON "people"."salaries"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_personal_employee_id_key" ON "people"."employees_personal"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_personal_personal_email_key" ON "people"."employees_personal"("personal_email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_personal_work_email_key" ON "people"."employees_personal"("work_email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_personal_ni_number_key" ON "people"."employees_personal"("ni_number");

-- CreateIndex
CREATE UNIQUE INDEX "employee_payment_employee_id_key" ON "people"."employee_payment"("employee_id");

-- CreateIndex
CREATE INDEX "leave_employee_id_idx" ON "people"."leave"("employee_id");

-- CreateIndex
CREATE INDEX "email_campaigns_campaign_id_idx" ON "marketing"."email_campaigns"("campaign_id");

-- CreateIndex
CREATE INDEX "social_posts_campaign_id_idx" ON "marketing"."social_posts"("campaign_id");

-- CreateIndex
CREATE INDEX "paid_campaigns_campaign_id_idx" ON "marketing"."paid_campaigns"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_sets_paid_camp_id_idx" ON "marketing"."ad_sets"("paid_camp_id");

-- CreateIndex
CREATE INDEX "ad_content_ad_set_id_idx" ON "marketing"."ad_content"("ad_set_id");

-- CreateIndex
CREATE INDEX "performance_metrics_ad_content_id_idx" ON "marketing"."performance_metrics"("ad_content_id");

-- CreateIndex
CREATE INDEX "keywords_ad_set_id_idx" ON "marketing"."keywords"("ad_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_main_slug_key" ON "companies"."company_main"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_main_email_key" ON "users"."user_main"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_main_username_key" ON "users"."user_main"("username");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "marketing"."leads"("company_id");

-- CreateIndex
CREATE INDEX "crm_tickets_user_id_idx" ON "crm"."crm_tickets"("user_id");

-- CreateIndex
CREATE INDEX "crm_tickets_company_id_idx" ON "crm"."crm_tickets"("company_id");

-- CreateIndex
CREATE INDEX "crm_tickets_assigned_to_user_id_idx" ON "crm"."crm_tickets"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "crm_messages_ticket_id_idx" ON "crm"."crm_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "crm_messages_sender_user_id_idx" ON "crm"."crm_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "crm_messages_company_id_idx" ON "crm"."crm_messages"("company_id");

-- CreateIndex
CREATE INDEX "crm_feedback_user_id_idx" ON "crm"."crm_feedback"("user_id");

-- CreateIndex
CREATE INDEX "crm_feedback_company_id_idx" ON "crm"."crm_feedback"("company_id");

-- CreateIndex
CREATE INDEX "crm_companies_contact_comapny_id_idx" ON "crm"."crm_companies_contact"("comapny_id");

-- CreateIndex
CREATE INDEX "crm_companies_contact_created_by_user_id_idx" ON "crm"."crm_companies_contact"("created_by_user_id");

-- CreateIndex
CREATE INDEX "analytics_campaign_id_idx" ON "marketing"."analytics"("campaign_id");

-- CreateIndex
CREATE INDEX "analytics_user_id_idx" ON "marketing"."analytics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_password_reset_token_key" ON "users"."user_credentials"("password_reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_email_verification_token_key" ON "users"."user_credentials"("email_verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "users"."user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "users"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_user_id_idx" ON "users"."user_activity"("user_id");

-- CreateIndex
CREATE INDEX "user_subscription_user_id_idx" ON "users"."user_subscription"("user_id");

-- CreateIndex
CREATE INDEX "user_subscription_plan_id_idx" ON "users"."user_subscription"("plan_id");

-- CreateIndex
CREATE INDEX "user_billing_user_id_idx" ON "users"."user_billing"("user_id");

-- CreateIndex
CREATE INDEX "user_billing_invoice_id_idx" ON "users"."user_billing"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "mm_project_main_company_id_key_key" ON "momentum"."mm_project_main"("company_id", "key");

-- CreateIndex
CREATE INDEX "company_subscription_company_id_idx" ON "companies"."company_subscription"("company_id");

-- CreateIndex
CREATE INDEX "company_subscription_plan_id_idx" ON "companies"."company_subscription"("plan_id");

-- CreateIndex
CREATE INDEX "company_billing_company_id_idx" ON "companies"."company_billing"("company_id");

-- CreateIndex
CREATE INDEX "company_billing_invoice_id_idx" ON "companies"."company_billing"("invoice_id");

-- CreateIndex
CREATE INDEX "company_settings_company_id_idx" ON "companies"."company_settings"("company_id");

-- CreateIndex
CREATE INDEX "mm_board_project_id_idx" ON "momentum"."mm_board"("project_id");

-- CreateIndex
CREATE INDEX "mm_column_board_id_idx" ON "momentum"."mm_column"("board_id");

-- CreateIndex
CREATE INDEX "mm_issue_project_id_board_id_column_id_idx" ON "momentum"."mm_issue"("project_id", "board_id", "column_id");

-- CreateIndex
CREATE INDEX "mm_issue_reporter_user_id_idx" ON "momentum"."mm_issue"("reporter_user_id");

-- CreateIndex
CREATE INDEX "mm_issue_assignee_user_id_idx" ON "momentum"."mm_issue"("assignee_user_id");

-- CreateIndex
CREATE INDEX "mm_issue_epic_id_idx" ON "momentum"."mm_issue"("epic_id");

-- CreateIndex
CREATE INDEX "mm_issue_sprint_id_idx" ON "momentum"."mm_issue"("sprint_id");

-- CreateIndex
CREATE INDEX "mm_issue_parent_issue_id_idx" ON "momentum"."mm_issue"("parent_issue_id");

-- CreateIndex
CREATE INDEX "mm_epic_project_id_idx" ON "momentum"."mm_epic"("project_id");

-- CreateIndex
CREATE INDEX "mm_sprint_project_id_idx" ON "momentum"."mm_sprint"("project_id");

-- CreateIndex
CREATE INDEX "mm_comment_issue_id_idx" ON "momentum"."mm_comment"("issue_id");

-- CreateIndex
CREATE INDEX "mm_comment_author_user_id_idx" ON "momentum"."mm_comment"("author_user_id");

-- CreateIndex
CREATE INDEX "mm_comment_parent_comment_id_idx" ON "momentum"."mm_comment"("parent_comment_id");

-- CreateIndex
CREATE INDEX "mm_activity_project_id_idx" ON "momentum"."mm_activity"("project_id");

-- AddForeignKey
ALTER TABLE "people"."employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "people"."employees"("employee_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "finance"."finance_costs" ADD CONSTRAINT "finance_costs_cost_centre_fkey" FOREIGN KEY ("cost_centre") REFERENCES "people"."employees"("cost_centre") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "finance"."finance_costs" ADD CONSTRAINT "finance_costs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "finance"."finance_suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."finance_transactions" ADD CONSTRAINT "finance_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."finance_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."salaries" ADD CONSTRAINT "salaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "people"."employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."employees_personal" ADD CONSTRAINT "employees_personal_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "people"."employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."employee_payment" ADD CONSTRAINT "employee_payment_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "people"."employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people"."leave" ADD CONSTRAINT "leave_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "people"."employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."email_campaigns" ADD CONSTRAINT "email_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."social_posts" ADD CONSTRAINT "social_posts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."paid_campaigns" ADD CONSTRAINT "paid_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."ad_sets" ADD CONSTRAINT "ad_sets_paid_camp_id_fkey" FOREIGN KEY ("paid_camp_id") REFERENCES "marketing"."paid_campaigns"("paid_camp_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."ad_content" ADD CONSTRAINT "ad_content_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "marketing"."ad_sets"("ad_set_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."performance_metrics" ADD CONSTRAINT "performance_metrics_ad_content_id_fkey" FOREIGN KEY ("ad_content_id") REFERENCES "marketing"."ad_content"("ad_content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."keywords" ADD CONSTRAINT "keywords_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "marketing"."ad_sets"("ad_set_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_tickets" ADD CONSTRAINT "crm_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_tickets" ADD CONSTRAINT "crm_tickets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_tickets" ADD CONSTRAINT "crm_tickets_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_messages" ADD CONSTRAINT "crm_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "crm"."crm_tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_messages" ADD CONSTRAINT "crm_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_messages" ADD CONSTRAINT "crm_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_feedback" ADD CONSTRAINT "crm_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_feedback" ADD CONSTRAINT "crm_feedback_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_companies_contact" ADD CONSTRAINT "crm_companies_contact_comapny_id_fkey" FOREIGN KEY ("comapny_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."crm_companies_contact" ADD CONSTRAINT "crm_companies_contact_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."analytics" ADD CONSTRAINT "analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."analytics" ADD CONSTRAINT "analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_subscription" ADD CONSTRAINT "user_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_subscription" ADD CONSTRAINT "user_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "users"."user_plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_billing" ADD CONSTRAINT "user_billing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_billing" ADD CONSTRAINT "user_billing_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."finance_invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_plan_addons" ADD CONSTRAINT "user_plan_addons_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "users"."user_subscription"("subscription_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_plan_addons" ADD CONSTRAINT "user_plan_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "users"."user_addons"("addon_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_project_main" ADD CONSTRAINT "mm_project_main_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_project_main" ADD CONSTRAINT "mm_project_main_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "marketing"."leads"("leads_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_subscription" ADD CONSTRAINT "company_subscription_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_subscription" ADD CONSTRAINT "company_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "companies"."company_plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_billing" ADD CONSTRAINT "company_billing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_billing" ADD CONSTRAINT "company_billing_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."finance_invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"."company_main"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_plan_addons" ADD CONSTRAINT "company_plan_addons_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "companies"."company_subscription"("subscription_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies"."company_plan_addons" ADD CONSTRAINT "company_plan_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "companies"."company_addons"("addon_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_board" ADD CONSTRAINT "mm_board_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_column" ADD CONSTRAINT "mm_column_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "momentum"."mm_board"("board_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "momentum"."mm_column"("column_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "momentum"."mm_board"("board_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "momentum"."mm_epic"("epic_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "momentum"."mm_sprint"("sprint_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_issue" ADD CONSTRAINT "mm_issue_parent_issue_id_fkey" FOREIGN KEY ("parent_issue_id") REFERENCES "momentum"."mm_issue"("issue_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "momentum"."mm_epic" ADD CONSTRAINT "mm_epic_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_epic" ADD CONSTRAINT "mm_epic_owner_uder_id_fkey" FOREIGN KEY ("owner_uder_id") REFERENCES "users"."user_main"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_sprint" ADD CONSTRAINT "mm_sprint_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_comment" ADD CONSTRAINT "mm_comment_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "momentum"."mm_issue"("issue_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_comment" ADD CONSTRAINT "mm_comment_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_comment" ADD CONSTRAINT "mm_comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "momentum"."mm_comment"("comment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "momentum"."mm_activity" ADD CONSTRAINT "mm_activity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_project_members" ADD CONSTRAINT "mm_project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "momentum"."mm_project_main"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_project_members" ADD CONSTRAINT "mm_project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_board_members" ADD CONSTRAINT "mm_board_members_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "momentum"."mm_board"("board_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_board_members" ADD CONSTRAINT "mm_board_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_sprint_members" ADD CONSTRAINT "mm_sprint_members_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "momentum"."mm_sprint"("sprint_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momentum"."mm_sprint_members" ADD CONSTRAINT "mm_sprint_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_main"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
