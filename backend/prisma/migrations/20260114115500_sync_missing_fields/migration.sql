-- AlterTable
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='momentum' AND table_name='mm_project_main' AND column_name='is_archived') THEN
        ALTER TABLE "momentum"."mm_project_main" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- CreateTable
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='companies' AND table_name='company_role_descriptions') THEN
        CREATE TABLE "companies"."company_role_descriptions" (
            "role" "companies"."CompanyUserRole" NOT NULL,
            "description" TEXT NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "company_role_descriptions_pkey" PRIMARY KEY ("role")
        );
    END IF;
END $$;
