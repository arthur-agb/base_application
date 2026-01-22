--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Debian 15.12-1.pgdg120+1)
-- Dumped by pg_dump version 15.12 (Debian 15.12-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: companies; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA companies;


ALTER SCHEMA companies OWNER TO mm_admin_dev;

--
-- Name: crm; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA crm;


ALTER SCHEMA crm OWNER TO mm_admin_dev;

--
-- Name: finance; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA finance;


ALTER SCHEMA finance OWNER TO mm_admin_dev;

--
-- Name: marketing; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA marketing;


ALTER SCHEMA marketing OWNER TO mm_admin_dev;

--
-- Name: momentum; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA momentum;


ALTER SCHEMA momentum OWNER TO mm_admin_dev;

--
-- Name: people; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA people;


ALTER SCHEMA people OWNER TO mm_admin_dev;

--
-- Name: users; Type: SCHEMA; Schema: -; Owner: mm_admin_dev
--

CREATE SCHEMA users;


ALTER SCHEMA users OWNER TO mm_admin_dev;

--
-- Name: CompanyUserRole; Type: TYPE; Schema: companies; Owner: mm_admin_dev
--

CREATE TYPE companies."CompanyUserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'BILLING'
);


ALTER TYPE companies."CompanyUserRole" OWNER TO mm_admin_dev;

--
-- Name: CrmContactType; Type: TYPE; Schema: crm; Owner: mm_admin_dev
--

CREATE TYPE crm."CrmContactType" AS ENUM (
    'PHONE_CALL',
    'EMAIL',
    'MEETING'
);


ALTER TYPE crm."CrmContactType" OWNER TO mm_admin_dev;

--
-- Name: CrmFeedbackType; Type: TYPE; Schema: crm; Owner: mm_admin_dev
--

CREATE TYPE crm."CrmFeedbackType" AS ENUM (
    'BUG_REPORT',
    'FEATURE_REQUEST',
    'GENERAL_FEEDBACK'
);


ALTER TYPE crm."CrmFeedbackType" OWNER TO mm_admin_dev;

--
-- Name: CrmTicketPriority; Type: TYPE; Schema: crm; Owner: mm_admin_dev
--

CREATE TYPE crm."CrmTicketPriority" AS ENUM (
    'HIGHEST',
    'HIGH',
    'MEDIUM',
    'LOW',
    'LOWEST'
);


ALTER TYPE crm."CrmTicketPriority" OWNER TO mm_admin_dev;

--
-- Name: CrmTicketStatus; Type: TYPE; Schema: crm; Owner: mm_admin_dev
--

CREATE TYPE crm."CrmTicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE crm."CrmTicketStatus" OWNER TO mm_admin_dev;

--
-- Name: BillingType; Type: TYPE; Schema: finance; Owner: mm_admin_dev
--

CREATE TYPE finance."BillingType" AS ENUM (
    'USER',
    'COMPANY'
);


ALTER TYPE finance."BillingType" OWNER TO mm_admin_dev;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: finance; Owner: mm_admin_dev
--

CREATE TYPE finance."InvoiceStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'PAID',
    'OVERDUE',
    'VOID'
);


ALTER TYPE finance."InvoiceStatus" OWNER TO mm_admin_dev;

--
-- Name: TransactionType; Type: TYPE; Schema: finance; Owner: mm_admin_dev
--

CREATE TYPE finance."TransactionType" AS ENUM (
    'PAYMENT',
    'REFUND',
    'CREDIT'
);


ALTER TYPE finance."TransactionType" OWNER TO mm_admin_dev;

--
-- Name: AdBidStrategy; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."AdBidStrategy" AS ENUM (
    'CPC',
    'CPM',
    'CPA'
);


ALTER TYPE marketing."AdBidStrategy" OWNER TO mm_admin_dev;

--
-- Name: AdCreativeType; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."AdCreativeType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'CAROUSEL',
    'TEXT'
);


ALTER TYPE marketing."AdCreativeType" OWNER TO mm_admin_dev;

--
-- Name: AdPlatform; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."AdPlatform" AS ENUM (
    'GOOGLE_ADS',
    'FACEBOOK_ADS',
    'LINKEDIN_ADS'
);


ALTER TYPE marketing."AdPlatform" OWNER TO mm_admin_dev;

--
-- Name: AdStatus; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."AdStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'ARCHIVED',
    'PENDING_REVIEW'
);


ALTER TYPE marketing."AdStatus" OWNER TO mm_admin_dev;

--
-- Name: CampaignStatus; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."CampaignStatus" AS ENUM (
    'PLANNING',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE marketing."CampaignStatus" OWNER TO mm_admin_dev;

--
-- Name: CampaignType; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."CampaignType" AS ENUM (
    'EMAIL',
    'SOCIAL_MEDIA',
    'PAID_ADVERTISING',
    'CONTENT_MARKETING'
);


ALTER TYPE marketing."CampaignType" OWNER TO mm_admin_dev;

--
-- Name: InteractionType; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."InteractionType" AS ENUM (
    'CLICK',
    'VIEW',
    'CONVERSION',
    'SHARE'
);


ALTER TYPE marketing."InteractionType" OWNER TO mm_admin_dev;

--
-- Name: KeywordMatchType; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."KeywordMatchType" AS ENUM (
    'BROAD',
    'PHRASE',
    'EXACT'
);


ALTER TYPE marketing."KeywordMatchType" OWNER TO mm_admin_dev;

--
-- Name: SocialPlatform; Type: TYPE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TYPE marketing."SocialPlatform" AS ENUM (
    'FACEBOOK',
    'TWITTER',
    'INSTAGRAM',
    'LINKEDIN'
);


ALTER TYPE marketing."SocialPlatform" OWNER TO mm_admin_dev;

--
-- Name: BoardType; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."BoardType" AS ENUM (
    'KANBAN',
    'SCRUM'
);


ALTER TYPE momentum."BoardType" OWNER TO mm_admin_dev;

--
-- Name: EpicStatus; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."EpicStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE momentum."EpicStatus" OWNER TO mm_admin_dev;

--
-- Name: HistoryAction; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."HistoryAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'ADD',
    'REMOVE',
    'MOVE',
    'COMMENT'
);


ALTER TYPE momentum."HistoryAction" OWNER TO mm_admin_dev;

--
-- Name: IssuePriority; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."IssuePriority" AS ENUM (
    'HIGHEST',
    'HIGH',
    'MEDIUM',
    'LOW',
    'LOWEST'
);


ALTER TYPE momentum."IssuePriority" OWNER TO mm_admin_dev;

--
-- Name: IssueStatusCategory; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."IssueStatusCategory" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'DONE',
    'BACKLOG'
);


ALTER TYPE momentum."IssueStatusCategory" OWNER TO mm_admin_dev;

--
-- Name: IssueType; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."IssueType" AS ENUM (
    'STORY',
    'TASK',
    'BUG',
    'EPIC'
);


ALTER TYPE momentum."IssueType" OWNER TO mm_admin_dev;

--
-- Name: ScheduleFrequency; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."ScheduleFrequency" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'CUSTOM'
);


ALTER TYPE momentum."ScheduleFrequency" OWNER TO mm_admin_dev;

--
-- Name: SprintStatus; Type: TYPE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TYPE momentum."SprintStatus" AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE momentum."SprintStatus" OWNER TO mm_admin_dev;

--
-- Name: LeaveStatus; Type: TYPE; Schema: people; Owner: mm_admin_dev
--

CREATE TYPE people."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE people."LeaveStatus" OWNER TO mm_admin_dev;

--
-- Name: LeaveType; Type: TYPE; Schema: people; Owner: mm_admin_dev
--

CREATE TYPE people."LeaveType" AS ENUM (
    'ANNUAL',
    'SICK',
    'UNPAID',
    'MATERNITY',
    'PATERNITY'
);


ALTER TYPE people."LeaveType" OWNER TO mm_admin_dev;

--
-- Name: CompanyRole; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."CompanyRole" AS ENUM (
    'ADMIN',
    'MEMBER',
    'MANAGER'
);


ALTER TYPE public."CompanyRole" OWNER TO mm_admin_dev;

--
-- Name: EpicStatus; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."EpicStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'DONE',
    'BLOCKED'
);


ALTER TYPE public."EpicStatus" OWNER TO mm_admin_dev;

--
-- Name: FontSize; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."FontSize" AS ENUM (
    'SMALL',
    'MEDIUM',
    'LARGE'
);


ALTER TYPE public."FontSize" OWNER TO mm_admin_dev;

--
-- Name: IssuePriority; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."IssuePriority" AS ENUM (
    'HIGHEST',
    'HIGH',
    'MEDIUM',
    'LOW',
    'LOWEST'
);


ALTER TYPE public."IssuePriority" OWNER TO mm_admin_dev;

--
-- Name: IssueType; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."IssueType" AS ENUM (
    'STORY',
    'TASK',
    'BUG',
    'SUB_TASK'
);


ALTER TYPE public."IssueType" OWNER TO mm_admin_dev;

--
-- Name: SprintStatus; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."SprintStatus" AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);


ALTER TYPE public."SprintStatus" OWNER TO mm_admin_dev;

--
-- Name: ThemePreference; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."ThemePreference" AS ENUM (
    'LIGHT',
    'DARK',
    'SYSTEM'
);


ALTER TYPE public."ThemePreference" OWNER TO mm_admin_dev;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'DEVELOPER',
    'MANAGER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO mm_admin_dev;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: mm_admin_dev
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING_VERIFICATION',
    'PENDING_APPROVAL',
    'ACTIVE',
    'REJECTED',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO mm_admin_dev;

--
-- Name: BillingFrequency; Type: TYPE; Schema: users; Owner: mm_admin_dev
--

CREATE TYPE users."BillingFrequency" AS ENUM (
    'MONTHLY',
    'YEARLY'
);


ALTER TYPE users."BillingFrequency" OWNER TO mm_admin_dev;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: users; Owner: mm_admin_dev
--

CREATE TYPE users."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'TRIALING',
    'PAST_DUE'
);


ALTER TYPE users."SubscriptionStatus" OWNER TO mm_admin_dev;

--
-- Name: UserRole; Type: TYPE; Schema: users; Owner: mm_admin_dev
--

CREATE TYPE users."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'SUPPORT'
);


ALTER TYPE users."UserRole" OWNER TO mm_admin_dev;

--
-- Name: UserStatus; Type: TYPE; Schema: users; Owner: mm_admin_dev
--

CREATE TYPE users."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DELETED',
    'PENDING_VERIFICATION',
    'PENDING_APPROVAL'
);


ALTER TYPE users."UserStatus" OWNER TO mm_admin_dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company_addons; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_addons (
    addon_id text NOT NULL,
    name text NOT NULL,
    description text,
    base_price double precision NOT NULL,
    currency text NOT NULL,
    billing_frequency users."BillingFrequency" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_addons OWNER TO mm_admin_dev;

--
-- Name: company_billing; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_billing (
    billing_id text NOT NULL,
    company_id text NOT NULL,
    invoice_id text NOT NULL,
    amount_due double precision NOT NULL,
    amount_paid double precision NOT NULL,
    currency text NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    payment_date timestamp(3) without time zone,
    status finance."InvoiceStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_billing OWNER TO mm_admin_dev;

--
-- Name: company_main; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_main (
    company_id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_main OWNER TO mm_admin_dev;

--
-- Name: company_plan_addons; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_plan_addons (
    subscription_id text NOT NULL,
    addon_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone
);


ALTER TABLE companies.company_plan_addons OWNER TO mm_admin_dev;

--
-- Name: company_plans; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_plans (
    plan_id text NOT NULL,
    name text NOT NULL,
    description text,
    base_price double precision NOT NULL,
    currency text NOT NULL,
    billing_frequency users."BillingFrequency" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_plans OWNER TO mm_admin_dev;

--
-- Name: company_settings; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_settings (
    setting_id text NOT NULL,
    company_id text NOT NULL,
    setting_name text NOT NULL,
    setting_value text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_settings OWNER TO mm_admin_dev;

--
-- Name: company_subscription; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_subscription (
    subscription_id text NOT NULL,
    company_id text NOT NULL,
    plan_id text NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    status users."SubscriptionStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_subscription OWNER TO mm_admin_dev;

--
-- Name: company_users; Type: TABLE; Schema: companies; Owner: mm_admin_dev
--

CREATE TABLE companies.company_users (
    company_id text NOT NULL,
    user_id text NOT NULL,
    role companies."CompanyUserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ended_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE companies.company_users OWNER TO mm_admin_dev;

--
-- Name: crm_companies_contact; Type: TABLE; Schema: crm; Owner: mm_admin_dev
--

CREATE TABLE crm.crm_companies_contact (
    contact_id text NOT NULL,
    comapny_id text,
    contact_type crm."CrmContactType" NOT NULL,
    notes text,
    created_by_user_id text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE crm.crm_companies_contact OWNER TO mm_admin_dev;

--
-- Name: crm_feedback; Type: TABLE; Schema: crm; Owner: mm_admin_dev
--

CREATE TABLE crm.crm_feedback (
    feedback_id text NOT NULL,
    user_id text NOT NULL,
    company_id text,
    feedback_type crm."CrmFeedbackType" NOT NULL,
    body text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE crm.crm_feedback OWNER TO mm_admin_dev;

--
-- Name: crm_messages; Type: TABLE; Schema: crm; Owner: mm_admin_dev
--

CREATE TABLE crm.crm_messages (
    message_id text NOT NULL,
    ticket_id text NOT NULL,
    sender_user_id text NOT NULL,
    company_id text,
    subject text,
    body text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE crm.crm_messages OWNER TO mm_admin_dev;

--
-- Name: crm_tickets; Type: TABLE; Schema: crm; Owner: mm_admin_dev
--

CREATE TABLE crm.crm_tickets (
    ticket_id text NOT NULL,
    subject text NOT NULL,
    description text,
    user_id text NOT NULL,
    company_id text,
    status crm."CrmTicketStatus" NOT NULL,
    priority crm."CrmTicketPriority" NOT NULL,
    assignee_notes text,
    assigned_to_user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE crm.crm_tickets OWNER TO mm_admin_dev;

--
-- Name: finance_costs; Type: TABLE; Schema: finance; Owner: mm_admin_dev
--

CREATE TABLE finance.finance_costs (
    cost_id text NOT NULL,
    cost_centre text NOT NULL,
    description text,
    amount double precision NOT NULL,
    currency text NOT NULL,
    category text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    supplier_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE finance.finance_costs OWNER TO mm_admin_dev;

--
-- Name: finance_invoices; Type: TABLE; Schema: finance; Owner: mm_admin_dev
--

CREATE TABLE finance.finance_invoices (
    invoice_id text NOT NULL,
    billing_type finance."BillingType" NOT NULL,
    billing_id text NOT NULL,
    invoice_number text NOT NULL,
    amount double precision NOT NULL,
    vat_amount double precision NOT NULL,
    currency text NOT NULL,
    issue_date timestamp(3) without time zone NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    status finance."InvoiceStatus" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ended_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE finance.finance_invoices OWNER TO mm_admin_dev;

--
-- Name: finance_suppliers; Type: TABLE; Schema: finance; Owner: mm_admin_dev
--

CREATE TABLE finance.finance_suppliers (
    supplier_id text NOT NULL,
    name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    bank_details jsonb,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE finance.finance_suppliers OWNER TO mm_admin_dev;

--
-- Name: finance_transactions; Type: TABLE; Schema: finance; Owner: mm_admin_dev
--

CREATE TABLE finance.finance_transactions (
    transaction_id text NOT NULL,
    invoice_id text NOT NULL,
    transaction_type finance."TransactionType" NOT NULL,
    amount double precision NOT NULL,
    currency text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE finance.finance_transactions OWNER TO mm_admin_dev;

--
-- Name: ad_content; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.ad_content (
    ad_content_id text NOT NULL,
    ad_set_id text NOT NULL,
    creative_type marketing."AdCreativeType" NOT NULL,
    headline text NOT NULL,
    body_text text NOT NULL,
    image_url text,
    destination_url text NOT NULL,
    status marketing."AdStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.ad_content OWNER TO mm_admin_dev;

--
-- Name: ad_sets; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.ad_sets (
    ad_set_id text NOT NULL,
    paid_camp_id text NOT NULL,
    name text NOT NULL,
    target_audience jsonb NOT NULL,
    bid_strategy marketing."AdBidStrategy" NOT NULL,
    status marketing."AdStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.ad_sets OWNER TO mm_admin_dev;

--
-- Name: analytics; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.analytics (
    analytics_id text NOT NULL,
    campaign_id text NOT NULL,
    user_id text,
    interaction_type marketing."InteractionType" NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.analytics OWNER TO mm_admin_dev;

--
-- Name: campaigns; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.campaigns (
    campaign_id text NOT NULL,
    name text NOT NULL,
    type marketing."CampaignType" NOT NULL,
    budget double precision,
    status marketing."CampaignStatus" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.campaigns OWNER TO mm_admin_dev;

--
-- Name: email_campaigns; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.email_campaigns (
    email_camp_id text NOT NULL,
    campaign_id text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    sent_at timestamp(3) without time zone NOT NULL,
    recipients jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.email_campaigns OWNER TO mm_admin_dev;

--
-- Name: keywords; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.keywords (
    keyword_id text NOT NULL,
    ad_set_id text NOT NULL,
    keyword_text text NOT NULL,
    match_type marketing."KeywordMatchType" NOT NULL,
    bid_amount double precision,
    status marketing."AdStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.keywords OWNER TO mm_admin_dev;

--
-- Name: leads; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.leads (
    leads_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    source text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.leads OWNER TO mm_admin_dev;

--
-- Name: paid_campaigns; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.paid_campaigns (
    paid_camp_id text NOT NULL,
    campaign_id text NOT NULL,
    platform marketing."AdPlatform" NOT NULL,
    budget double precision NOT NULL,
    daily_budget double precision,
    details jsonb,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.paid_campaigns OWNER TO mm_admin_dev;

--
-- Name: performance_metrics; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.performance_metrics (
    performance_id text NOT NULL,
    ad_content_id text NOT NULL,
    date date NOT NULL,
    impressions integer NOT NULL,
    clicks integer NOT NULL,
    cost double precision NOT NULL,
    conversions integer NOT NULL,
    revenue_generated double precision NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.performance_metrics OWNER TO mm_admin_dev;

--
-- Name: social_posts; Type: TABLE; Schema: marketing; Owner: mm_admin_dev
--

CREATE TABLE marketing.social_posts (
    social_post_id text NOT NULL,
    campaign_id text NOT NULL,
    platform marketing."SocialPlatform" NOT NULL,
    content text NOT NULL,
    link text,
    published_at timestamp(3) without time zone NOT NULL,
    likes integer NOT NULL,
    shares integer NOT NULL,
    comments integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE marketing.social_posts OWNER TO mm_admin_dev;

--
-- Name: mm_activity; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_activity (
    activity_id text NOT NULL,
    project_id text NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE momentum.mm_activity OWNER TO mm_admin_dev;

--
-- Name: mm_board; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_board (
    board_id text NOT NULL,
    project_id text NOT NULL,
    name text NOT NULL,
    type momentum."BoardType" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE momentum.mm_board OWNER TO mm_admin_dev;

--
-- Name: mm_board_members; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_board_members (
    board_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ended_at timestamp(3) without time zone
);


ALTER TABLE momentum.mm_board_members OWNER TO mm_admin_dev;

--
-- Name: mm_column; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_column (
    column_id text NOT NULL,
    board_id text NOT NULL,
    name text NOT NULL,
    "limit" integer,
    "position" integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category momentum."IssueStatusCategory" DEFAULT 'TODO'::momentum."IssueStatusCategory" NOT NULL,
    width integer DEFAULT 300 NOT NULL,
    is_minimized boolean DEFAULT false NOT NULL
);


ALTER TABLE momentum.mm_column OWNER TO mm_admin_dev;

--
-- Name: mm_comment; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_comment (
    comment_id text NOT NULL,
    issue_id text NOT NULL,
    author_user_id text NOT NULL,
    parent_comment_id text,
    body text NOT NULL,
    edited boolean DEFAULT false NOT NULL,
    edited_at timestamp(3) without time zone,
    reactions jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE momentum.mm_comment OWNER TO mm_admin_dev;

--
-- Name: mm_epic; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_epic (
    epic_id text NOT NULL,
    project_id text NOT NULL,
    title text NOT NULL,
    description text,
    status momentum."EpicStatus" NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    owner_user_id text
);


ALTER TABLE momentum.mm_epic OWNER TO mm_admin_dev;

--
-- Name: mm_history; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_history (
    history_id text NOT NULL,
    action momentum."HistoryAction" NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    associated_entity_type text,
    associated_entity_id text,
    field_changed text,
    old_value text,
    new_value text,
    changes jsonb,
    user_id text NOT NULL,
    company_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE momentum.mm_history OWNER TO mm_admin_dev;

--
-- Name: mm_issue; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_issue (
    issue_id text NOT NULL,
    project_id text NOT NULL,
    column_id text NOT NULL,
    board_id text NOT NULL,
    reporter_user_id text NOT NULL,
    assignee_user_id text,
    epic_id text,
    sprint_id text,
    parent_issue_id text,
    title text NOT NULL,
    description text,
    type momentum."IssueType" NOT NULL,
    priority momentum."IssuePriority" NOT NULL,
    status text NOT NULL,
    labels text[],
    story_points double precision,
    due_date timestamp(3) without time zone,
    "position" double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category momentum."IssueStatusCategory" DEFAULT 'TODO'::momentum."IssueStatusCategory" NOT NULL
);


ALTER TABLE momentum.mm_issue OWNER TO mm_admin_dev;

--
-- Name: mm_project_main; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_project_main (
    project_id text NOT NULL,
    company_id text,
    name text NOT NULL,
    key text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    project_lead_id text
);


ALTER TABLE momentum.mm_project_main OWNER TO mm_admin_dev;

--
-- Name: mm_project_members; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_project_members (
    project_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ended_at timestamp(3) without time zone
);


ALTER TABLE momentum.mm_project_members OWNER TO mm_admin_dev;

--
-- Name: mm_scheduled_issue; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_scheduled_issue (
    scheduled_issue_id text NOT NULL,
    board_id text NOT NULL,
    title text NOT NULL,
    description text,
    frequency momentum."ScheduleFrequency" NOT NULL,
    cron_expression text,
    custom_config jsonb,
    next_run_at timestamp(3) without time zone NOT NULL,
    last_run_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    template jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE momentum.mm_scheduled_issue OWNER TO mm_admin_dev;

--
-- Name: mm_sprint; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_sprint (
    sprint_id text NOT NULL,
    project_id text NOT NULL,
    title text NOT NULL,
    goal text,
    description text,
    status momentum."SprintStatus" NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    capacity_points double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE momentum.mm_sprint OWNER TO mm_admin_dev;

--
-- Name: mm_sprint_members; Type: TABLE; Schema: momentum; Owner: mm_admin_dev
--

CREATE TABLE momentum.mm_sprint_members (
    sprint_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    ended_at timestamp(3) without time zone
);


ALTER TABLE momentum.mm_sprint_members OWNER TO mm_admin_dev;

--
-- Name: employee_payment; Type: TABLE; Schema: people; Owner: mm_admin_dev
--

CREATE TABLE people.employee_payment (
    payment_id text NOT NULL,
    employee_id text NOT NULL,
    bank_name text NOT NULL,
    account_name text NOT NULL,
    sort_code text NOT NULL,
    account_number text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE people.employee_payment OWNER TO mm_admin_dev;

--
-- Name: employees; Type: TABLE; Schema: people; Owner: mm_admin_dev
--

CREATE TABLE people.employees (
    employee_id text NOT NULL,
    job_title text NOT NULL,
    department text NOT NULL,
    cost_centre text NOT NULL,
    manager_id text,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE people.employees OWNER TO mm_admin_dev;

--
-- Name: employees_personal; Type: TABLE; Schema: people; Owner: mm_admin_dev
--

CREATE TABLE people.employees_personal (
    personal_id text NOT NULL,
    employee_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    preferred_name text,
    date_of_birth timestamp(3) without time zone NOT NULL,
    personal_phone text,
    personal_email text,
    work_phone text,
    work_email text NOT NULL,
    addres_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    postcode text NOT NULL,
    country text NOT NULL,
    ni_number text,
    emergency_contact_name text,
    emergency_contact_number text,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE people.employees_personal OWNER TO mm_admin_dev;

--
-- Name: leave; Type: TABLE; Schema: people; Owner: mm_admin_dev
--

CREATE TABLE people.leave (
    leave_id text NOT NULL,
    employee_id text NOT NULL,
    leave_type people."LeaveType" NOT NULL,
    status people."LeaveStatus" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE people.leave OWNER TO mm_admin_dev;

--
-- Name: salaries; Type: TABLE; Schema: people; Owner: mm_admin_dev
--

CREATE TABLE people.salaries (
    salary_id text NOT NULL,
    employee_id text NOT NULL,
    amount double precision NOT NULL,
    currency text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE people.salaries OWNER TO mm_admin_dev;

--
-- Name: Board; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."Board" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "projectId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Board" OWNER TO mm_admin_dev;

--
-- Name: Column; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."Column" (
    id text NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    "limit" integer DEFAULT 0 NOT NULL,
    "boardId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Column" OWNER TO mm_admin_dev;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "issueId" text NOT NULL,
    "authorId" text NOT NULL,
    edited boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "editedById" text,
    "parentCommentId" text,
    reactions jsonb,
    "companyId" text NOT NULL
);


ALTER TABLE public."Comment" OWNER TO mm_admin_dev;

--
-- Name: History; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."History" (
    id text NOT NULL,
    "fieldChanged" text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "issueId" text NOT NULL,
    "userId" text NOT NULL,
    changes jsonb,
    "commentId" text,
    "companyId" text NOT NULL
);


ALTER TABLE public."History" OWNER TO mm_admin_dev;

--
-- Name: Issue; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."Issue" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL,
    priority public."IssuePriority" DEFAULT 'MEDIUM'::public."IssuePriority" NOT NULL,
    type public."IssueType" NOT NULL,
    "reporterId" text NOT NULL,
    "assigneeId" text,
    "projectId" text NOT NULL,
    "columnId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "position" integer,
    labels text[] DEFAULT ARRAY[]::text[],
    epic_id text,
    parent_issue_id text,
    sprint_id text,
    story_points integer,
    "companyId" text NOT NULL
);


ALTER TABLE public."Issue" OWNER TO mm_admin_dev;

--
-- Name: ProfileSettings; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."ProfileSettings" (
    id text NOT NULL,
    "themePreference" public."ThemePreference" DEFAULT 'SYSTEM'::public."ThemePreference" NOT NULL,
    "fontSize" public."FontSize" DEFAULT 'MEDIUM'::public."FontSize" NOT NULL,
    "highContrast" boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProfileSettings" OWNER TO mm_admin_dev;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    description text,
    "leadId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Project" OWNER TO mm_admin_dev;

--
-- Name: User; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text NOT NULL,
    avatar text,
    bio text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailVerificationToken" text,
    "emailVerificationTokenExpiresAt" timestamp(3) without time zone,
    "emailVerifiedAt" timestamp(3) without time zone,
    status public."UserStatus" DEFAULT 'PENDING_VERIFICATION'::public."UserStatus" NOT NULL,
    username text NOT NULL,
    "isTwoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text
);


ALTER TABLE public."User" OWNER TO mm_admin_dev;

--
-- Name: _ProjectMembers; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public."_ProjectMembers" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ProjectMembers" OWNER TO mm_admin_dev;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO mm_admin_dev;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO mm_admin_dev;

--
-- Name: company_users; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public.company_users (
    "userId" text NOT NULL,
    "companyId" text NOT NULL,
    role public."CompanyRole" DEFAULT 'MEMBER'::public."CompanyRole" NOT NULL
);


ALTER TABLE public.company_users OWNER TO mm_admin_dev;

--
-- Name: epics; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public.epics (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."EpicStatus" DEFAULT 'OPEN'::public."EpicStatus" NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    project_id text NOT NULL,
    owner_user_id text,
    company_id text NOT NULL
);


ALTER TABLE public.epics OWNER TO mm_admin_dev;

--
-- Name: sprints; Type: TABLE; Schema: public; Owner: mm_admin_dev
--

CREATE TABLE public.sprints (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    goal text NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status public."SprintStatus" DEFAULT 'PLANNED'::public."SprintStatus" NOT NULL,
    capacity_points integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    project_id text NOT NULL,
    company_id text NOT NULL
);


ALTER TABLE public.sprints OWNER TO mm_admin_dev;

--
-- Name: user_activity; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_activity (
    activity_id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE users.user_activity OWNER TO mm_admin_dev;

--
-- Name: user_addons; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_addons (
    addon_id text NOT NULL,
    name text NOT NULL,
    description text,
    base_price double precision NOT NULL,
    currency text NOT NULL,
    billing_frequency users."BillingFrequency" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_addons OWNER TO mm_admin_dev;

--
-- Name: user_billing; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_billing (
    billing_id text NOT NULL,
    user_id text NOT NULL,
    invoice_id text NOT NULL,
    amount_due double precision NOT NULL,
    amount_paid double precision NOT NULL,
    currency text NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    payment_date timestamp(3) without time zone,
    status finance."InvoiceStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_billing OWNER TO mm_admin_dev;

--
-- Name: user_credentials; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_credentials (
    user_id text NOT NULL,
    password_hash text NOT NULL,
    two_factor_secret text,
    password_reset_token text,
    email_verification_token text,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_credentials OWNER TO mm_admin_dev;

--
-- Name: user_main; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_main (
    user_id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    display_name text,
    avatar_url text,
    role users."UserRole" DEFAULT 'USER'::users."UserRole" NOT NULL,
    status users."UserStatus" DEFAULT 'PENDING_VERIFICATION'::users."UserStatus" NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "emailVerificationToken" text,
    "emailVerificationTokenExpiresAt" timestamp(3) without time zone
);


ALTER TABLE users.user_main OWNER TO mm_admin_dev;

--
-- Name: user_plan_addons; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_plan_addons (
    subscription_id text NOT NULL,
    addon_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone
);


ALTER TABLE users.user_plan_addons OWNER TO mm_admin_dev;

--
-- Name: user_plans; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_plans (
    plan_id text NOT NULL,
    name text NOT NULL,
    description text,
    base_price double precision NOT NULL,
    currency text NOT NULL,
    billing_frequency users."BillingFrequency" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_plans OWNER TO mm_admin_dev;

--
-- Name: user_sessions; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_sessions (
    session_id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    ip_address text NOT NULL,
    device_info text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_sessions OWNER TO mm_admin_dev;

--
-- Name: user_settings; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_settings (
    user_id text NOT NULL,
    theme text DEFAULT 'SYSTEM'::text NOT NULL,
    sidebar_size text DEFAULT 'MEDIUM'::text NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_sidebar_open boolean DEFAULT true NOT NULL
);


ALTER TABLE users.user_settings OWNER TO mm_admin_dev;

--
-- Name: user_subscription; Type: TABLE; Schema: users; Owner: mm_admin_dev
--

CREATE TABLE users.user_subscription (
    subscription_id text NOT NULL,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    status users."SubscriptionStatus" NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE users.user_subscription OWNER TO mm_admin_dev;

--
-- Data for Name: company_addons; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_addons (addon_id, name, description, base_price, currency, billing_frequency, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_billing; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_billing (billing_id, company_id, invoice_id, amount_due, amount_paid, currency, due_date, payment_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_main; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_main (company_id, name, slug, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_plan_addons; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_plan_addons (subscription_id, addon_id, is_active, start_date, end_date, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: company_plans; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_plans (plan_id, name, description, base_price, currency, billing_frequency, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_settings (setting_id, company_id, setting_name, setting_value, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_subscription; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_subscription (subscription_id, company_id, plan_id, start_date, end_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_users; Type: TABLE DATA; Schema: companies; Owner: mm_admin_dev
--

COPY companies.company_users (company_id, user_id, role, is_active, ended_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_companies_contact; Type: TABLE DATA; Schema: crm; Owner: mm_admin_dev
--

COPY crm.crm_companies_contact (contact_id, comapny_id, contact_type, notes, created_by_user_id, "timestamp", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_feedback; Type: TABLE DATA; Schema: crm; Owner: mm_admin_dev
--

COPY crm.crm_feedback (feedback_id, user_id, company_id, feedback_type, body, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_messages; Type: TABLE DATA; Schema: crm; Owner: mm_admin_dev
--

COPY crm.crm_messages (message_id, ticket_id, sender_user_id, company_id, subject, body, "timestamp", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_tickets; Type: TABLE DATA; Schema: crm; Owner: mm_admin_dev
--

COPY crm.crm_tickets (ticket_id, subject, description, user_id, company_id, status, priority, assignee_notes, assigned_to_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: finance_costs; Type: TABLE DATA; Schema: finance; Owner: mm_admin_dev
--

COPY finance.finance_costs (cost_id, cost_centre, description, amount, currency, category, "timestamp", supplier_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: finance; Owner: mm_admin_dev
--

COPY finance.finance_invoices (invoice_id, billing_type, billing_id, invoice_number, amount, vat_amount, currency, issue_date, due_date, status, is_active, ended_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: finance_suppliers; Type: TABLE DATA; Schema: finance; Owner: mm_admin_dev
--

COPY finance.finance_suppliers (supplier_id, name, contact_name, email, phone, bank_details, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: finance_transactions; Type: TABLE DATA; Schema: finance; Owner: mm_admin_dev
--

COPY finance.finance_transactions (transaction_id, invoice_id, transaction_type, amount, currency, "timestamp", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ad_content; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.ad_content (ad_content_id, ad_set_id, creative_type, headline, body_text, image_url, destination_url, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ad_sets; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.ad_sets (ad_set_id, paid_camp_id, name, target_audience, bid_strategy, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.analytics (analytics_id, campaign_id, user_id, interaction_type, "timestamp", details, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.campaigns (campaign_id, name, type, budget, status, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_campaigns; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.email_campaigns (email_camp_id, campaign_id, subject, body, sent_at, recipients, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: keywords; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.keywords (keyword_id, ad_set_id, keyword_text, match_type, bid_amount, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.leads (leads_id, name, email, phone, source, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: paid_campaigns; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.paid_campaigns (paid_camp_id, campaign_id, platform, budget, daily_budget, details, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.performance_metrics (performance_id, ad_content_id, date, impressions, clicks, cost, conversions, revenue_generated, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: social_posts; Type: TABLE DATA; Schema: marketing; Owner: mm_admin_dev
--

COPY marketing.social_posts (social_post_id, campaign_id, platform, content, link, published_at, likes, shares, comments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mm_activity; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_activity (activity_id, project_id, action, details, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: mm_board; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_board (board_id, project_id, name, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mm_board_members; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_board_members (board_id, user_id, created_at, is_active, ended_at) FROM stdin;
\.


--
-- Data for Name: mm_column; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_column (column_id, board_id, name, "limit", "position", created_at, updated_at, category, width, is_minimized) FROM stdin;
\.


--
-- Data for Name: mm_comment; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_comment (comment_id, issue_id, author_user_id, parent_comment_id, body, edited, edited_at, reactions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mm_epic; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_epic (epic_id, project_id, title, description, status, start_date, end_date, created_at, updated_at, owner_user_id) FROM stdin;
\.


--
-- Data for Name: mm_history; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_history (history_id, action, entity_type, entity_id, associated_entity_type, associated_entity_id, field_changed, old_value, new_value, changes, user_id, company_id, created_at) FROM stdin;
\.


--
-- Data for Name: mm_issue; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_issue (issue_id, project_id, column_id, board_id, reporter_user_id, assignee_user_id, epic_id, sprint_id, parent_issue_id, title, description, type, priority, status, labels, story_points, due_date, "position", created_at, updated_at, category) FROM stdin;
\.


--
-- Data for Name: mm_project_main; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_project_main (project_id, company_id, name, key, description, created_at, updated_at, project_lead_id) FROM stdin;
\.


--
-- Data for Name: mm_project_members; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_project_members (project_id, user_id, created_at, is_active, ended_at) FROM stdin;
\.


--
-- Data for Name: mm_scheduled_issue; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_scheduled_issue (scheduled_issue_id, board_id, title, description, frequency, cron_expression, custom_config, next_run_at, last_run_at, is_active, template, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mm_sprint; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_sprint (sprint_id, project_id, title, goal, description, status, start_date, end_date, capacity_points, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mm_sprint_members; Type: TABLE DATA; Schema: momentum; Owner: mm_admin_dev
--

COPY momentum.mm_sprint_members (sprint_id, user_id, created_at, is_active, ended_at) FROM stdin;
\.


--
-- Data for Name: employee_payment; Type: TABLE DATA; Schema: people; Owner: mm_admin_dev
--

COPY people.employee_payment (payment_id, employee_id, bank_name, account_name, sort_code, account_number, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: people; Owner: mm_admin_dev
--

COPY people.employees (employee_id, job_title, department, cost_centre, manager_id, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees_personal; Type: TABLE DATA; Schema: people; Owner: mm_admin_dev
--

COPY people.employees_personal (personal_id, employee_id, first_name, last_name, preferred_name, date_of_birth, personal_phone, personal_email, work_phone, work_email, addres_line1, address_line2, city, postcode, country, ni_number, emergency_contact_name, emergency_contact_number, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave; Type: TABLE DATA; Schema: people; Owner: mm_admin_dev
--

COPY people.leave (leave_id, employee_id, leave_type, status, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: salaries; Type: TABLE DATA; Schema: people; Owner: mm_admin_dev
--

COPY people.salaries (salary_id, employee_id, amount, currency, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Board; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."Board" (id, name, type, "projectId", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Column; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."Column" (id, name, "position", "limit", "boardId", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."Comment" (id, body, "createdAt", "updatedAt", "issueId", "authorId", edited, "editedAt", "editedById", "parentCommentId", reactions, "companyId") FROM stdin;
\.


--
-- Data for Name: History; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."History" (id, "fieldChanged", "oldValue", "newValue", "createdAt", "issueId", "userId", changes, "commentId", "companyId") FROM stdin;
\.


--
-- Data for Name: Issue; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."Issue" (id, title, description, status, priority, type, "reporterId", "assigneeId", "projectId", "columnId", "createdAt", "updatedAt", "dueDate", "position", labels, epic_id, parent_issue_id, sprint_id, story_points, "companyId") FROM stdin;
\.


--
-- Data for Name: ProfileSettings; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."ProfileSettings" (id, "themePreference", "fontSize", "highContrast", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."Project" (id, name, key, description, "leadId", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."User" (id, email, name, password, avatar, bio, role, "createdAt", "updatedAt", "emailVerificationToken", "emailVerificationTokenExpiresAt", "emailVerifiedAt", status, username, "isTwoFactorEnabled", "twoFactorSecret") FROM stdin;
\.


--
-- Data for Name: _ProjectMembers; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public."_ProjectMembers" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d807e017-c822-4394-9f32-e5580e55df51	cf5b505372292d5528baa0bc98958e7dec7254f59a3fcf9febf5d162bc73895a	2026-01-13 23:30:03.382183+00	20250409185405_init	\N	\N	2026-01-13 23:30:03.319074+00	1
bad4b058-0705-4824-8a81-ce6f04affc40	a455833abb39aea1a3835e3d35e229f678d39620791cbdbe295305df4d35b7c6	2026-01-13 23:30:03.944069+00	20250816131950_optional_company_links	\N	\N	2026-01-13 23:30:03.939506+00	1
63ab8d33-937b-4f62-9930-8cf64b15b052	78918b34cb3b890a4e1cb2f8122c78cd560ca2c56025962ef58befbfcb7cc00b	2026-01-13 23:30:03.387705+00	20250412151902_add_issue_due_date	\N	\N	2026-01-13 23:30:03.383567+00	1
f72ab119-8b7a-436e-ba5e-a9a37680ccde	cec1c60d49e8ecdd58329ecdaf18b0116e8e04ae17b6343134737af049e7d946	2026-01-13 23:30:03.402228+00	20250417170949_add_profile_settings	\N	\N	2026-01-13 23:30:03.38907+00	1
ffec60f5-36e7-4bd9-8399-9e31ae613160	bf5b9aa2ebd7357097ea2baa84cc05f3e35c32cc9c2fec127f510520f7c58467	2026-01-13 23:30:04.034089+00	20251202053224_add_width_to_column	\N	\N	2026-01-13 23:30:04.029866+00	1
e56aa500-63ee-45a0-8a0b-43d4e4bb5fd6	496226a375c9a00b4cf35cd342b8182c8085c1d92b3dc3acfe96983fdbfe5c6f	2026-01-13 23:30:03.407943+00	20250417213337_add_issue_position	\N	\N	2026-01-13 23:30:03.403343+00	1
3e36941d-3335-4ccc-b21c-2e03b6c7b924	dbebaa085b75616c3651776999fbd4fd0f6a7f84cd87bcd35233e7a858641cf0	2026-01-13 23:30:03.951549+00	20250822110858_fix_project_lead_relation	\N	\N	2026-01-13 23:30:03.945595+00	1
c0308d61-4bfe-4883-88b3-eeea82648a23	cbcde9f8c29903b677e98bfd9cb95936e295a552fd865261c6bb125f7ff888b0	2026-01-13 23:30:03.414137+00	20250418114335_add_issue_labels	\N	\N	2026-01-13 23:30:03.40933+00	1
b5726760-41da-4c84-b353-28cd51e1078e	a6dbe4d2d8ed9d0710d73fd8ed4b551a2149ea7e454954370e8d60fe57fa4183	2026-01-13 23:30:03.427555+00	20250508193315_updated_comment_features	\N	\N	2026-01-13 23:30:03.415521+00	1
bb643729-90c6-45c1-ae6d-5e8f015c3477	d540d2fffb014527eefe56a71d8d1da16ba46fe3689140293e133b58609d84f9	2026-01-13 23:30:03.435134+00	20250519175329_add_user_verification_fields	\N	\N	2026-01-13 23:30:03.429031+00	1
e681ceb1-8f12-471f-ab87-bd69cef1b58a	3e0f653cda045d17cc7468981b050950e611a7676ad81b555489cd23731d880b	2026-01-13 23:30:03.957275+00	20250822141243_project_to_momentum_schema	\N	\N	2026-01-13 23:30:03.952919+00	1
ce5b4b71-18fe-49cc-8d42-9d67223842e7	fc446e95de649261d7561acb9c7b166297809ebfc5263af96a5671a7e35f139a	2026-01-13 23:30:03.498937+00	20250527192848_add_epics_sprints_features_manual_fix	\N	\N	2026-01-13 23:30:03.436629+00	1
430238d6-1553-43d3-87f7-47bbe22f2188	3f6a1d8150e454b38b1520eda7197b49d4b2bfad5fca82c840b0ec98a8f4fa75	2026-01-13 23:30:03.532249+00	20250612110158_add_multi_tenancy	\N	\N	2026-01-13 23:30:03.50045+00	1
ca65ba14-fcef-4635-bd8f-f306caedbbdc	b4f05b0e846ccfefce4354ff3274abecc053461072b274c46c516e734bce7ac4	2026-01-13 23:30:03.540447+00	20250614094037_add_2fa_to_users	\N	\N	2026-01-13 23:30:03.533973+00	1
d7a70d5a-7e0b-46a9-8ab7-580c53358fc9	8b55e32562bc6fdd85203d3e0d2fe67f84b83811fac8383ca21f751dc9a4e550	2026-01-13 23:30:03.975766+00	20250823133828_add_momentum_history_and_activity	\N	\N	2026-01-13 23:30:03.958666+00	1
c2ffcb2b-7012-4b69-9b75-19e9bd91af2a	e311871a455d1931b0ceaed05d01692e8680afef500b8271a72d231c68089eb0	2026-01-13 23:30:03.923919+00	20250809211720_big_ass_changes	\N	\N	2026-01-13 23:30:03.542994+00	1
2bb4c147-8a5b-4b63-9e4c-70ea6d2e7553	27577ae7028016709323352c68268d7b41ebf52b6a5a8e6e539454d02a0e158d	2026-01-13 23:30:03.932533+00	20250811210054_add_email_verification_fields_to_user	\N	\N	2026-01-13 23:30:03.925224+00	1
a16390d6-e891-4eaf-9b9b-143e13980e9e	964563878bb85df443273497f12de8991c05892119dff1d7e874880d7c33c1e7	2026-01-13 23:30:04.040037+00	20251204223339_add_is_minimized_to_column	\N	\N	2026-01-13 23:30:04.035513+00	1
8ae41f66-96de-43ea-a1c0-af6a180a1676	979296f74218e57f724489c6636571892d71e378471819562541261f53c86b36	2026-01-13 23:30:03.938123+00	20250814053616_add_status_enum	\N	\N	2026-01-13 23:30:03.933844+00	1
3bde13a1-1123-4f7c-a97c-bb5a65df4517	775d75f0636a4601d6248a052b5130e1ce550ca1dd43356c794ab4a61d1f2ca5	2026-01-13 23:30:03.989762+00	20250907121007_add_to_epic_sprint_enums	\N	\N	2026-01-13 23:30:03.977369+00	1
872c4f11-f342-4f29-9b18-9411e84b4bb3	0dbb43ceaa65df782f8fb9f84f5fbf26af0bf015a83c62ce77ead8fcdb205aae	2026-01-13 23:30:03.996794+00	20250907144739_fix_epic_col_name	\N	\N	2026-01-13 23:30:03.991251+00	1
bbccc18a-c11f-4e1a-9e3f-549f09049f78	39a305bca4a48180569c699c45aa7e321262fc359096d5fb2dc79059776e3013	2026-01-13 23:30:04.00258+00	20251127211338_add_status_to_momentum_column	\N	\N	2026-01-13 23:30:03.997969+00	1
896d2783-ddde-4137-bc77-8195967eb92f	011628cb65b87f97ca20694f1c78503e9ad7e04168a9e9a76d3b87f51563c63a	2026-01-13 23:30:04.045612+00	20251206171206_add_sidebar_settings	\N	\N	2026-01-13 23:30:04.04137+00	1
6bc03407-510c-4235-b95a-4a8cce47b130	b772873afaa2ea031e5859a571ca729e15eff69a6f217659d449f33e91131648	2026-01-13 23:30:04.028508+00	20251201193500_add_momentum_column_status	\N	\N	2026-01-13 23:30:04.00396+00	1
437ec0f7-3b01-409a-b670-9fc6409004be	1d22e56cee4081fe4403514d769ed90453dbe232edf4914c91c3c3cfc0016950	2026-01-13 23:30:04.058833+00	20251208175358_add_scheduled_issues	\N	\N	2026-01-13 23:30:04.047105+00	1
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public.companies (id, name, slug, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: company_users; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public.company_users ("userId", "companyId", role) FROM stdin;
\.


--
-- Data for Name: epics; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public.epics (id, title, description, status, start_date, end_date, created_at, updated_at, project_id, owner_user_id, company_id) FROM stdin;
\.


--
-- Data for Name: sprints; Type: TABLE DATA; Schema: public; Owner: mm_admin_dev
--

COPY public.sprints (id, title, description, goal, start_date, end_date, status, capacity_points, created_at, updated_at, project_id, company_id) FROM stdin;
\.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_activity (activity_id, user_id, action, details, created_at) FROM stdin;
\.


--
-- Data for Name: user_addons; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_addons (addon_id, name, description, base_price, currency, billing_frequency, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_billing; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_billing (billing_id, user_id, invoice_id, amount_due, amount_paid, currency, due_date, payment_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_credentials; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_credentials (user_id, password_hash, two_factor_secret, password_reset_token, email_verification_token, last_login_at, created_at, updated_at) FROM stdin;
cmjby5hcd0000ln3hurbmi6mk	$2a$10$iZmxOQV2nSuZGG19e8Cc4OR8VkbuJi9bYIeepSKPfUc.lVkqoXmFm	\N	\N	\N	\N	2026-01-13 23:31:51.032	2026-01-13 23:31:51.032
\.


--
-- Data for Name: user_main; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_main (user_id, email, username, display_name, avatar_url, role, status, is_email_verified, created_at, updated_at, "emailVerificationToken", "emailVerificationTokenExpiresAt") FROM stdin;
cmjby5hcd0000ln3hurbmi6mk	arthur@agbintegration.com	arthur	Arthur	https://ui-avatars.com/api/?name=Arthur&background=random&color=fff	ADMIN	ACTIVE	t	2026-01-13 23:31:51.032	2026-01-13 23:31:51.032	\N	\N
\.


--
-- Data for Name: user_plan_addons; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_plan_addons (subscription_id, addon_id, is_active, start_date, end_date, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_plans; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_plans (plan_id, name, description, base_price, currency, billing_frequency, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
779fe505-9574-4237-aa1b-639d50b76426	Free Tier	A basic, free plan with limited features.	0	GBP	MONTHLY	t	2026-01-13 23:30:08.29	\N	2026-01-13 23:30:08.29	2026-01-13 23:30:08.29
16a1abe5-a9bc-4ece-be46-86eec4623f75	Pro Tier	Advanced features for professional use.	9.99	GBP	MONTHLY	t	2026-01-13 23:30:08.292	\N	2026-01-13 23:30:08.292	2026-01-13 23:30:08.292
fa9f02a5-15c5-4d8c-a384-87f36093acac	Pro Annual Tier	Advanced features for professional use.	89.99	GBP	YEARLY	t	2026-01-13 23:30:08.293	\N	2026-01-13 23:30:08.293	2026-01-13 23:30:08.293
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_sessions (session_id, user_id, token, ip_address, device_info, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_settings (user_id, theme, sidebar_size, notifications_enabled, created_at, updated_at, is_sidebar_open) FROM stdin;
\.


--
-- Data for Name: user_subscription; Type: TABLE DATA; Schema: users; Owner: mm_admin_dev
--

COPY users.user_subscription (subscription_id, user_id, plan_id, status, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Name: company_addons company_addons_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_addons
    ADD CONSTRAINT company_addons_pkey PRIMARY KEY (addon_id);


--
-- Name: company_billing company_billing_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_billing
    ADD CONSTRAINT company_billing_pkey PRIMARY KEY (billing_id);


--
-- Name: company_main company_main_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_main
    ADD CONSTRAINT company_main_pkey PRIMARY KEY (company_id);


--
-- Name: company_plan_addons company_plan_addons_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_plan_addons
    ADD CONSTRAINT company_plan_addons_pkey PRIMARY KEY (subscription_id, addon_id);


--
-- Name: company_plans company_plans_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_plans
    ADD CONSTRAINT company_plans_pkey PRIMARY KEY (plan_id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: company_subscription company_subscription_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_subscription
    ADD CONSTRAINT company_subscription_pkey PRIMARY KEY (subscription_id);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (company_id, user_id);


--
-- Name: crm_companies_contact crm_companies_contact_pkey; Type: CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_companies_contact
    ADD CONSTRAINT crm_companies_contact_pkey PRIMARY KEY (contact_id);


--
-- Name: crm_feedback crm_feedback_pkey; Type: CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_feedback
    ADD CONSTRAINT crm_feedback_pkey PRIMARY KEY (feedback_id);


--
-- Name: crm_messages crm_messages_pkey; Type: CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_messages
    ADD CONSTRAINT crm_messages_pkey PRIMARY KEY (message_id);


--
-- Name: crm_tickets crm_tickets_pkey; Type: CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_tickets
    ADD CONSTRAINT crm_tickets_pkey PRIMARY KEY (ticket_id);


--
-- Name: finance_costs finance_costs_pkey; Type: CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_costs
    ADD CONSTRAINT finance_costs_pkey PRIMARY KEY (cost_id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: finance_suppliers finance_suppliers_pkey; Type: CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_suppliers
    ADD CONSTRAINT finance_suppliers_pkey PRIMARY KEY (supplier_id);


--
-- Name: finance_transactions finance_transactions_pkey; Type: CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_transactions
    ADD CONSTRAINT finance_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: ad_content ad_content_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.ad_content
    ADD CONSTRAINT ad_content_pkey PRIMARY KEY (ad_content_id);


--
-- Name: ad_sets ad_sets_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.ad_sets
    ADD CONSTRAINT ad_sets_pkey PRIMARY KEY (ad_set_id);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (analytics_id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (campaign_id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (email_camp_id);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (keyword_id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (leads_id);


--
-- Name: paid_campaigns paid_campaigns_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.paid_campaigns
    ADD CONSTRAINT paid_campaigns_pkey PRIMARY KEY (paid_camp_id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (performance_id);


--
-- Name: social_posts social_posts_pkey; Type: CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.social_posts
    ADD CONSTRAINT social_posts_pkey PRIMARY KEY (social_post_id);


--
-- Name: mm_activity mm_activity_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_activity
    ADD CONSTRAINT mm_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: mm_board_members mm_board_members_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_board_members
    ADD CONSTRAINT mm_board_members_pkey PRIMARY KEY (board_id, user_id);


--
-- Name: mm_board mm_board_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_board
    ADD CONSTRAINT mm_board_pkey PRIMARY KEY (board_id);


--
-- Name: mm_column mm_column_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_column
    ADD CONSTRAINT mm_column_pkey PRIMARY KEY (column_id);


--
-- Name: mm_comment mm_comment_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_comment
    ADD CONSTRAINT mm_comment_pkey PRIMARY KEY (comment_id);


--
-- Name: mm_epic mm_epic_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_epic
    ADD CONSTRAINT mm_epic_pkey PRIMARY KEY (epic_id);


--
-- Name: mm_history mm_history_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_history
    ADD CONSTRAINT mm_history_pkey PRIMARY KEY (history_id);


--
-- Name: mm_issue mm_issue_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_pkey PRIMARY KEY (issue_id);


--
-- Name: mm_project_main mm_project_main_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_main
    ADD CONSTRAINT mm_project_main_pkey PRIMARY KEY (project_id);


--
-- Name: mm_project_members mm_project_members_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_members
    ADD CONSTRAINT mm_project_members_pkey PRIMARY KEY (project_id, user_id);


--
-- Name: mm_scheduled_issue mm_scheduled_issue_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_scheduled_issue
    ADD CONSTRAINT mm_scheduled_issue_pkey PRIMARY KEY (scheduled_issue_id);


--
-- Name: mm_sprint_members mm_sprint_members_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_sprint_members
    ADD CONSTRAINT mm_sprint_members_pkey PRIMARY KEY (sprint_id, user_id);


--
-- Name: mm_sprint mm_sprint_pkey; Type: CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_sprint
    ADD CONSTRAINT mm_sprint_pkey PRIMARY KEY (sprint_id);


--
-- Name: employee_payment employee_payment_pkey; Type: CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employee_payment
    ADD CONSTRAINT employee_payment_pkey PRIMARY KEY (payment_id);


--
-- Name: employees_personal employees_personal_pkey; Type: CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employees_personal
    ADD CONSTRAINT employees_personal_pkey PRIMARY KEY (personal_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: leave leave_pkey; Type: CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.leave
    ADD CONSTRAINT leave_pkey PRIMARY KEY (leave_id);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (salary_id);


--
-- Name: Board Board_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Board"
    ADD CONSTRAINT "Board_pkey" PRIMARY KEY (id);


--
-- Name: Column Column_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Column"
    ADD CONSTRAINT "Column_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: History History_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."History"
    ADD CONSTRAINT "History_pkey" PRIMARY KEY (id);


--
-- Name: Issue Issue_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_pkey" PRIMARY KEY (id);


--
-- Name: ProfileSettings ProfileSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."ProfileSettings"
    ADD CONSTRAINT "ProfileSettings_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _ProjectMembers _ProjectMembers_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."_ProjectMembers"
    ADD CONSTRAINT "_ProjectMembers_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY ("userId", "companyId");


--
-- Name: epics epics_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.epics
    ADD CONSTRAINT epics_pkey PRIMARY KEY (id);


--
-- Name: sprints sprints_pkey; Type: CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: user_addons user_addons_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_addons
    ADD CONSTRAINT user_addons_pkey PRIMARY KEY (addon_id);


--
-- Name: user_billing user_billing_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_billing
    ADD CONSTRAINT user_billing_pkey PRIMARY KEY (billing_id);


--
-- Name: user_credentials user_credentials_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_credentials
    ADD CONSTRAINT user_credentials_pkey PRIMARY KEY (user_id);


--
-- Name: user_main user_main_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_main
    ADD CONSTRAINT user_main_pkey PRIMARY KEY (user_id);


--
-- Name: user_plan_addons user_plan_addons_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_plan_addons
    ADD CONSTRAINT user_plan_addons_pkey PRIMARY KEY (subscription_id, addon_id);


--
-- Name: user_plans user_plans_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_plans
    ADD CONSTRAINT user_plans_pkey PRIMARY KEY (plan_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: user_subscription user_subscription_pkey; Type: CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_subscription
    ADD CONSTRAINT user_subscription_pkey PRIMARY KEY (subscription_id);


--
-- Name: company_billing_company_id_idx; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE INDEX company_billing_company_id_idx ON companies.company_billing USING btree (company_id);


--
-- Name: company_billing_invoice_id_idx; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE INDEX company_billing_invoice_id_idx ON companies.company_billing USING btree (invoice_id);


--
-- Name: company_main_slug_key; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX company_main_slug_key ON companies.company_main USING btree (slug);


--
-- Name: company_settings_company_id_idx; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE INDEX company_settings_company_id_idx ON companies.company_settings USING btree (company_id);


--
-- Name: company_subscription_company_id_idx; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE INDEX company_subscription_company_id_idx ON companies.company_subscription USING btree (company_id);


--
-- Name: company_subscription_plan_id_idx; Type: INDEX; Schema: companies; Owner: mm_admin_dev
--

CREATE INDEX company_subscription_plan_id_idx ON companies.company_subscription USING btree (plan_id);


--
-- Name: crm_companies_contact_comapny_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_companies_contact_comapny_id_idx ON crm.crm_companies_contact USING btree (comapny_id);


--
-- Name: crm_companies_contact_created_by_user_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_companies_contact_created_by_user_id_idx ON crm.crm_companies_contact USING btree (created_by_user_id);


--
-- Name: crm_feedback_company_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_feedback_company_id_idx ON crm.crm_feedback USING btree (company_id);


--
-- Name: crm_feedback_user_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_feedback_user_id_idx ON crm.crm_feedback USING btree (user_id);


--
-- Name: crm_messages_company_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_messages_company_id_idx ON crm.crm_messages USING btree (company_id);


--
-- Name: crm_messages_sender_user_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_messages_sender_user_id_idx ON crm.crm_messages USING btree (sender_user_id);


--
-- Name: crm_messages_ticket_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_messages_ticket_id_idx ON crm.crm_messages USING btree (ticket_id);


--
-- Name: crm_tickets_assigned_to_user_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_tickets_assigned_to_user_id_idx ON crm.crm_tickets USING btree (assigned_to_user_id);


--
-- Name: crm_tickets_company_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_tickets_company_id_idx ON crm.crm_tickets USING btree (company_id);


--
-- Name: crm_tickets_user_id_idx; Type: INDEX; Schema: crm; Owner: mm_admin_dev
--

CREATE INDEX crm_tickets_user_id_idx ON crm.crm_tickets USING btree (user_id);


--
-- Name: finance_costs_cost_centre_idx; Type: INDEX; Schema: finance; Owner: mm_admin_dev
--

CREATE INDEX finance_costs_cost_centre_idx ON finance.finance_costs USING btree (cost_centre);


--
-- Name: finance_costs_supplier_id_idx; Type: INDEX; Schema: finance; Owner: mm_admin_dev
--

CREATE INDEX finance_costs_supplier_id_idx ON finance.finance_costs USING btree (supplier_id);


--
-- Name: finance_invoices_invoice_number_key; Type: INDEX; Schema: finance; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX finance_invoices_invoice_number_key ON finance.finance_invoices USING btree (invoice_number);


--
-- Name: finance_suppliers_email_key; Type: INDEX; Schema: finance; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX finance_suppliers_email_key ON finance.finance_suppliers USING btree (email);


--
-- Name: finance_transactions_invoice_id_idx; Type: INDEX; Schema: finance; Owner: mm_admin_dev
--

CREATE INDEX finance_transactions_invoice_id_idx ON finance.finance_transactions USING btree (invoice_id);


--
-- Name: ad_content_ad_set_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX ad_content_ad_set_id_idx ON marketing.ad_content USING btree (ad_set_id);


--
-- Name: ad_sets_paid_camp_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX ad_sets_paid_camp_id_idx ON marketing.ad_sets USING btree (paid_camp_id);


--
-- Name: analytics_campaign_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX analytics_campaign_id_idx ON marketing.analytics USING btree (campaign_id);


--
-- Name: analytics_user_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX analytics_user_id_idx ON marketing.analytics USING btree (user_id);


--
-- Name: email_campaigns_campaign_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX email_campaigns_campaign_id_idx ON marketing.email_campaigns USING btree (campaign_id);


--
-- Name: keywords_ad_set_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX keywords_ad_set_id_idx ON marketing.keywords USING btree (ad_set_id);


--
-- Name: paid_campaigns_campaign_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX paid_campaigns_campaign_id_idx ON marketing.paid_campaigns USING btree (campaign_id);


--
-- Name: performance_metrics_ad_content_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX performance_metrics_ad_content_id_idx ON marketing.performance_metrics USING btree (ad_content_id);


--
-- Name: social_posts_campaign_id_idx; Type: INDEX; Schema: marketing; Owner: mm_admin_dev
--

CREATE INDEX social_posts_campaign_id_idx ON marketing.social_posts USING btree (campaign_id);


--
-- Name: mm_activity_project_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_activity_project_id_idx ON momentum.mm_activity USING btree (project_id);


--
-- Name: mm_activity_user_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_activity_user_id_idx ON momentum.mm_activity USING btree (user_id);


--
-- Name: mm_board_project_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_board_project_id_idx ON momentum.mm_board USING btree (project_id);


--
-- Name: mm_column_board_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_column_board_id_idx ON momentum.mm_column USING btree (board_id);


--
-- Name: mm_comment_author_user_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_comment_author_user_id_idx ON momentum.mm_comment USING btree (author_user_id);


--
-- Name: mm_comment_issue_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_comment_issue_id_idx ON momentum.mm_comment USING btree (issue_id);


--
-- Name: mm_comment_parent_comment_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_comment_parent_comment_id_idx ON momentum.mm_comment USING btree (parent_comment_id);


--
-- Name: mm_epic_project_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_epic_project_id_idx ON momentum.mm_epic USING btree (project_id);


--
-- Name: mm_history_associated_entity_type_associated_entity_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_history_associated_entity_type_associated_entity_id_idx ON momentum.mm_history USING btree (associated_entity_type, associated_entity_id);


--
-- Name: mm_history_entity_type_entity_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_history_entity_type_entity_id_idx ON momentum.mm_history USING btree (entity_type, entity_id);


--
-- Name: mm_history_user_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_history_user_id_idx ON momentum.mm_history USING btree (user_id);


--
-- Name: mm_issue_assignee_user_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_assignee_user_id_idx ON momentum.mm_issue USING btree (assignee_user_id);


--
-- Name: mm_issue_epic_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_epic_id_idx ON momentum.mm_issue USING btree (epic_id);


--
-- Name: mm_issue_parent_issue_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_parent_issue_id_idx ON momentum.mm_issue USING btree (parent_issue_id);


--
-- Name: mm_issue_project_id_board_id_column_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_project_id_board_id_column_id_idx ON momentum.mm_issue USING btree (project_id, board_id, column_id);


--
-- Name: mm_issue_reporter_user_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_reporter_user_id_idx ON momentum.mm_issue USING btree (reporter_user_id);


--
-- Name: mm_issue_sprint_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_issue_sprint_id_idx ON momentum.mm_issue USING btree (sprint_id);


--
-- Name: mm_project_main_company_id_key_key; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX mm_project_main_company_id_key_key ON momentum.mm_project_main USING btree (company_id, key);


--
-- Name: mm_scheduled_issue_board_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_scheduled_issue_board_id_idx ON momentum.mm_scheduled_issue USING btree (board_id);


--
-- Name: mm_sprint_project_id_idx; Type: INDEX; Schema: momentum; Owner: mm_admin_dev
--

CREATE INDEX mm_sprint_project_id_idx ON momentum.mm_sprint USING btree (project_id);


--
-- Name: employee_payment_employee_id_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employee_payment_employee_id_key ON people.employee_payment USING btree (employee_id);


--
-- Name: employees_cost_centre_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employees_cost_centre_key ON people.employees USING btree (cost_centre);


--
-- Name: employees_manager_id_idx; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE INDEX employees_manager_id_idx ON people.employees USING btree (manager_id);


--
-- Name: employees_personal_employee_id_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employees_personal_employee_id_key ON people.employees_personal USING btree (employee_id);


--
-- Name: employees_personal_ni_number_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employees_personal_ni_number_key ON people.employees_personal USING btree (ni_number);


--
-- Name: employees_personal_personal_email_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employees_personal_personal_email_key ON people.employees_personal USING btree (personal_email);


--
-- Name: employees_personal_work_email_key; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX employees_personal_work_email_key ON people.employees_personal USING btree (work_email);


--
-- Name: leave_employee_id_idx; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE INDEX leave_employee_id_idx ON people.leave USING btree (employee_id);


--
-- Name: salaries_employee_id_idx; Type: INDEX; Schema: people; Owner: mm_admin_dev
--

CREATE INDEX salaries_employee_id_idx ON people.salaries USING btree (employee_id);


--
-- Name: Board_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Board_companyId_idx" ON public."Board" USING btree ("companyId");


--
-- Name: Board_projectId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Board_projectId_idx" ON public."Board" USING btree ("projectId");


--
-- Name: Column_boardId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Column_boardId_idx" ON public."Column" USING btree ("boardId");


--
-- Name: Column_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Column_companyId_idx" ON public."Column" USING btree ("companyId");


--
-- Name: Comment_authorId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Comment_authorId_idx" ON public."Comment" USING btree ("authorId");


--
-- Name: Comment_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Comment_companyId_idx" ON public."Comment" USING btree ("companyId");


--
-- Name: Comment_editedById_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Comment_editedById_idx" ON public."Comment" USING btree ("editedById");


--
-- Name: Comment_issueId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Comment_issueId_idx" ON public."Comment" USING btree ("issueId");


--
-- Name: Comment_parentCommentId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Comment_parentCommentId_idx" ON public."Comment" USING btree ("parentCommentId");


--
-- Name: History_commentId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "History_commentId_idx" ON public."History" USING btree ("commentId");


--
-- Name: History_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "History_companyId_idx" ON public."History" USING btree ("companyId");


--
-- Name: History_issueId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "History_issueId_idx" ON public."History" USING btree ("issueId");


--
-- Name: History_userId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "History_userId_idx" ON public."History" USING btree ("userId");


--
-- Name: Issue_assigneeId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_assigneeId_idx" ON public."Issue" USING btree ("assigneeId");


--
-- Name: Issue_columnId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_columnId_idx" ON public."Issue" USING btree ("columnId");


--
-- Name: Issue_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_companyId_idx" ON public."Issue" USING btree ("companyId");


--
-- Name: Issue_epic_id_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_epic_id_idx" ON public."Issue" USING btree (epic_id);


--
-- Name: Issue_parent_issue_id_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_parent_issue_id_idx" ON public."Issue" USING btree (parent_issue_id);


--
-- Name: Issue_projectId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_projectId_idx" ON public."Issue" USING btree ("projectId");


--
-- Name: Issue_reporterId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_reporterId_idx" ON public."Issue" USING btree ("reporterId");


--
-- Name: Issue_sprint_id_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Issue_sprint_id_idx" ON public."Issue" USING btree (sprint_id);


--
-- Name: ProfileSettings_userId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "ProfileSettings_userId_idx" ON public."ProfileSettings" USING btree ("userId");


--
-- Name: ProfileSettings_userId_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "ProfileSettings_userId_key" ON public."ProfileSettings" USING btree ("userId");


--
-- Name: Project_companyId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Project_companyId_idx" ON public."Project" USING btree ("companyId");


--
-- Name: Project_companyId_key_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "Project_companyId_key_key" ON public."Project" USING btree ("companyId", key);


--
-- Name: Project_leadId_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "Project_leadId_idx" ON public."Project" USING btree ("leadId");


--
-- Name: User_emailVerificationToken_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON public."User" USING btree ("emailVerificationToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: _ProjectMembers_B_index; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX "_ProjectMembers_B_index" ON public."_ProjectMembers" USING btree ("B");


--
-- Name: companies_slug_key; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);


--
-- Name: epics_company_id_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX epics_company_id_idx ON public.epics USING btree (company_id);


--
-- Name: sprints_company_id_idx; Type: INDEX; Schema: public; Owner: mm_admin_dev
--

CREATE INDEX sprints_company_id_idx ON public.sprints USING btree (company_id);


--
-- Name: user_activity_user_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_activity_user_id_idx ON users.user_activity USING btree (user_id);


--
-- Name: user_billing_invoice_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_billing_invoice_id_idx ON users.user_billing USING btree (invoice_id);


--
-- Name: user_billing_user_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_billing_user_id_idx ON users.user_billing USING btree (user_id);


--
-- Name: user_credentials_email_verification_token_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX user_credentials_email_verification_token_key ON users.user_credentials USING btree (email_verification_token);


--
-- Name: user_credentials_password_reset_token_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX user_credentials_password_reset_token_key ON users.user_credentials USING btree (password_reset_token);


--
-- Name: user_main_emailVerificationToken_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX "user_main_emailVerificationToken_key" ON users.user_main USING btree ("emailVerificationToken");


--
-- Name: user_main_email_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX user_main_email_key ON users.user_main USING btree (email);


--
-- Name: user_main_username_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX user_main_username_key ON users.user_main USING btree (username);


--
-- Name: user_sessions_token_key; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE UNIQUE INDEX user_sessions_token_key ON users.user_sessions USING btree (token);


--
-- Name: user_sessions_user_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_sessions_user_id_idx ON users.user_sessions USING btree (user_id);


--
-- Name: user_subscription_plan_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_subscription_plan_id_idx ON users.user_subscription USING btree (plan_id);


--
-- Name: user_subscription_user_id_idx; Type: INDEX; Schema: users; Owner: mm_admin_dev
--

CREATE INDEX user_subscription_user_id_idx ON users.user_subscription USING btree (user_id);


--
-- Name: company_billing company_billing_company_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_billing
    ADD CONSTRAINT company_billing_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_billing company_billing_invoice_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_billing
    ADD CONSTRAINT company_billing_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES finance.finance_invoices(invoice_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: company_plan_addons company_plan_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_plan_addons
    ADD CONSTRAINT company_plan_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES companies.company_addons(addon_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_plan_addons company_plan_addons_subscription_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_plan_addons
    ADD CONSTRAINT company_plan_addons_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES companies.company_subscription(subscription_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_subscription company_subscription_company_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_subscription
    ADD CONSTRAINT company_subscription_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_subscription company_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_subscription
    ADD CONSTRAINT company_subscription_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES companies.company_plans(plan_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_users company_users_user_id_fkey; Type: FK CONSTRAINT; Schema: companies; Owner: mm_admin_dev
--

ALTER TABLE ONLY companies.company_users
    ADD CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_companies_contact crm_companies_contact_comapny_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_companies_contact
    ADD CONSTRAINT crm_companies_contact_comapny_id_fkey FOREIGN KEY (comapny_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_companies_contact crm_companies_contact_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_companies_contact
    ADD CONSTRAINT crm_companies_contact_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_feedback crm_feedback_company_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_feedback
    ADD CONSTRAINT crm_feedback_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_feedback crm_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_feedback
    ADD CONSTRAINT crm_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_messages crm_messages_company_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_messages
    ADD CONSTRAINT crm_messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_messages crm_messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_messages
    ADD CONSTRAINT crm_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_messages crm_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_messages
    ADD CONSTRAINT crm_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES crm.crm_tickets(ticket_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_tickets crm_tickets_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_tickets
    ADD CONSTRAINT crm_tickets_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: crm_tickets crm_tickets_company_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_tickets
    ADD CONSTRAINT crm_tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: crm_tickets crm_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: mm_admin_dev
--

ALTER TABLE ONLY crm.crm_tickets
    ADD CONSTRAINT crm_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finance_costs finance_costs_cost_centre_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_costs
    ADD CONSTRAINT finance_costs_cost_centre_fkey FOREIGN KEY (cost_centre) REFERENCES people.employees(cost_centre);


--
-- Name: finance_costs finance_costs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_costs
    ADD CONSTRAINT finance_costs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES finance.finance_suppliers(supplier_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: mm_admin_dev
--

ALTER TABLE ONLY finance.finance_transactions
    ADD CONSTRAINT finance_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES finance.finance_invoices(invoice_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ad_content ad_content_ad_set_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.ad_content
    ADD CONSTRAINT ad_content_ad_set_id_fkey FOREIGN KEY (ad_set_id) REFERENCES marketing.ad_sets(ad_set_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ad_sets ad_sets_paid_camp_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.ad_sets
    ADD CONSTRAINT ad_sets_paid_camp_id_fkey FOREIGN KEY (paid_camp_id) REFERENCES marketing.paid_campaigns(paid_camp_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics analytics_campaign_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.analytics
    ADD CONSTRAINT analytics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES marketing.campaigns(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.analytics
    ADD CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_campaigns email_campaigns_campaign_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.email_campaigns
    ADD CONSTRAINT email_campaigns_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES marketing.campaigns(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: keywords keywords_ad_set_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.keywords
    ADD CONSTRAINT keywords_ad_set_id_fkey FOREIGN KEY (ad_set_id) REFERENCES marketing.ad_sets(ad_set_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: paid_campaigns paid_campaigns_campaign_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.paid_campaigns
    ADD CONSTRAINT paid_campaigns_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES marketing.campaigns(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: performance_metrics performance_metrics_ad_content_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.performance_metrics
    ADD CONSTRAINT performance_metrics_ad_content_id_fkey FOREIGN KEY (ad_content_id) REFERENCES marketing.ad_content(ad_content_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: social_posts social_posts_campaign_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: mm_admin_dev
--

ALTER TABLE ONLY marketing.social_posts
    ADD CONSTRAINT social_posts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES marketing.campaigns(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_activity mm_activity_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_activity
    ADD CONSTRAINT mm_activity_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_activity mm_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_activity
    ADD CONSTRAINT mm_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_board_members mm_board_members_board_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_board_members
    ADD CONSTRAINT mm_board_members_board_id_fkey FOREIGN KEY (board_id) REFERENCES momentum.mm_board(board_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_board_members mm_board_members_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_board_members
    ADD CONSTRAINT mm_board_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_board mm_board_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_board
    ADD CONSTRAINT mm_board_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_column mm_column_board_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_column
    ADD CONSTRAINT mm_column_board_id_fkey FOREIGN KEY (board_id) REFERENCES momentum.mm_board(board_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_comment mm_comment_author_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_comment
    ADD CONSTRAINT mm_comment_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_comment mm_comment_issue_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_comment
    ADD CONSTRAINT mm_comment_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES momentum.mm_issue(issue_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_comment mm_comment_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_comment
    ADD CONSTRAINT mm_comment_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES momentum.mm_comment(comment_id) ON DELETE CASCADE;


--
-- Name: mm_epic mm_epic_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_epic
    ADD CONSTRAINT mm_epic_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mm_epic mm_epic_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_epic
    ADD CONSTRAINT mm_epic_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_history mm_history_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_history
    ADD CONSTRAINT mm_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_issue mm_issue_assignee_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_assignee_user_id_fkey FOREIGN KEY (assignee_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mm_issue mm_issue_board_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_board_id_fkey FOREIGN KEY (board_id) REFERENCES momentum.mm_board(board_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mm_issue mm_issue_column_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_column_id_fkey FOREIGN KEY (column_id) REFERENCES momentum.mm_column(column_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mm_issue mm_issue_epic_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_epic_id_fkey FOREIGN KEY (epic_id) REFERENCES momentum.mm_epic(epic_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mm_issue mm_issue_parent_issue_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_parent_issue_id_fkey FOREIGN KEY (parent_issue_id) REFERENCES momentum.mm_issue(issue_id) ON DELETE SET NULL;


--
-- Name: mm_issue mm_issue_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_issue mm_issue_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mm_issue mm_issue_sprint_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_issue
    ADD CONSTRAINT mm_issue_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES momentum.mm_sprint(sprint_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mm_project_main mm_project_main_company_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_main
    ADD CONSTRAINT mm_project_main_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies.company_main(company_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_project_main mm_project_main_project_lead_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_main
    ADD CONSTRAINT mm_project_main_project_lead_id_fkey FOREIGN KEY (project_lead_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mm_project_members mm_project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_members
    ADD CONSTRAINT mm_project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_project_members mm_project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_project_members
    ADD CONSTRAINT mm_project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_scheduled_issue mm_scheduled_issue_board_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_scheduled_issue
    ADD CONSTRAINT mm_scheduled_issue_board_id_fkey FOREIGN KEY (board_id) REFERENCES momentum.mm_board(board_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_sprint_members mm_sprint_members_sprint_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_sprint_members
    ADD CONSTRAINT mm_sprint_members_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES momentum.mm_sprint(sprint_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_sprint_members mm_sprint_members_user_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_sprint_members
    ADD CONSTRAINT mm_sprint_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mm_sprint mm_sprint_project_id_fkey; Type: FK CONSTRAINT; Schema: momentum; Owner: mm_admin_dev
--

ALTER TABLE ONLY momentum.mm_sprint
    ADD CONSTRAINT mm_sprint_project_id_fkey FOREIGN KEY (project_id) REFERENCES momentum.mm_project_main(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_payment employee_payment_employee_id_fkey; Type: FK CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employee_payment
    ADD CONSTRAINT employee_payment_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES people.employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES people.employees(employee_id) ON DELETE SET NULL;


--
-- Name: employees_personal employees_personal_employee_id_fkey; Type: FK CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.employees_personal
    ADD CONSTRAINT employees_personal_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES people.employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leave leave_employee_id_fkey; Type: FK CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.leave
    ADD CONSTRAINT leave_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES people.employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salaries salaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: people; Owner: mm_admin_dev
--

ALTER TABLE ONLY people.salaries
    ADD CONSTRAINT salaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES people.employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Board Board_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Board"
    ADD CONSTRAINT "Board_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Board Board_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Board"
    ADD CONSTRAINT "Board_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Column Column_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Column"
    ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public."Board"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Column Column_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Column"
    ADD CONSTRAINT "Column_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_editedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comment Comment_issueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."Issue"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_parentCommentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES public."Comment"(id) ON DELETE CASCADE;


--
-- Name: History History_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."History"
    ADD CONSTRAINT "History_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: History History_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."History"
    ADD CONSTRAINT "History_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: History History_issueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."History"
    ADD CONSTRAINT "History_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."Issue"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: History History_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."History"
    ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Issue Issue_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Issue Issue_columnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES public."Column"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Issue Issue_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Issue Issue_epic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_epic_id_fkey" FOREIGN KEY (epic_id) REFERENCES public.epics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Issue Issue_parent_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_parent_issue_id_fkey" FOREIGN KEY (parent_issue_id) REFERENCES public."Issue"(id) ON DELETE SET NULL;


--
-- Name: Issue Issue_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Issue Issue_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Issue Issue_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_sprint_id_fkey" FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProfileSettings ProfileSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."ProfileSettings"
    ADD CONSTRAINT "ProfileSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Project Project_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ProjectMembers _ProjectMembers_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."_ProjectMembers"
    ADD CONSTRAINT "_ProjectMembers_A_fkey" FOREIGN KEY ("A") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ProjectMembers _ProjectMembers_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public."_ProjectMembers"
    ADD CONSTRAINT "_ProjectMembers_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_users company_users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT "company_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_users company_users_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT "company_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: epics epics_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.epics
    ADD CONSTRAINT epics_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: epics epics_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.epics
    ADD CONSTRAINT epics_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: epics epics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.epics
    ADD CONSTRAINT epics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sprints sprints_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sprints sprints_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mm_admin_dev
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT sprints_project_id_fkey FOREIGN KEY (project_id) REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_billing user_billing_invoice_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_billing
    ADD CONSTRAINT user_billing_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES finance.finance_invoices(invoice_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_billing user_billing_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_billing
    ADD CONSTRAINT user_billing_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_credentials user_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_credentials
    ADD CONSTRAINT user_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_plan_addons user_plan_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_plan_addons
    ADD CONSTRAINT user_plan_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES users.user_addons(addon_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_plan_addons user_plan_addons_subscription_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_plan_addons
    ADD CONSTRAINT user_plan_addons_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES users.user_subscription(subscription_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_subscription user_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_subscription
    ADD CONSTRAINT user_subscription_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES users.user_plans(plan_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_subscription user_subscription_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: mm_admin_dev
--

ALTER TABLE ONLY users.user_subscription
    ADD CONSTRAINT user_subscription_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.user_main(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

