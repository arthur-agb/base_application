import prisma from './prismaClient.js';
import Logger from './logger.js';

const ROLE_DESCRIPTIONS = {
    'OWNER': 'Full administrative control, including billing, workspace deletion, and ownership transfers.',
    'ADMIN': 'Can manage all users, workspace settings, projects, and boards.',
    'MANAGER': 'Can manage projects, boards, and invite new members to the workspace.',
    'MEMBER': 'Standard access to create and edit issues, boards, and projects.',
    'VIEWER': 'Read-only access to the workspace. Can view content and add comments.',
    'BILLING': 'Specialized access for managing subscriptions, invoices, and payment methods.'
};

/**
 * @desc Initializes the RoleDescription table with default values if it's empty.
 * Also checks if the table exists and creates it if it doesn't (as requested).
 */
export async function initializeRoleDescriptions() {
    try {
        // 1. Check if the table exists (PostgreSQL specific check)
        const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'companies' 
        AND table_name = 'company_role_descriptions'
      );
    `;

        if (!tableExists[0].exists) {
            Logger.info('CompanyRoleDescription table does not exist. Creating it...');
            // We use raw SQL to create it if we want to be truly "automatic" without migration files,
            // but since we added it to schema.prisma, a migration is better.
            // However, the user explicitly asked for an "automatic check... and if it doesnt then create the table".
            // Let's try to run the migration programmatically or just create it via raw SQL.

            // Creating the table via raw SQL to satisfy the "automatic" requirement
            await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "companies"."company_role_descriptions" (
          "role" "companies"."CompanyUserRole" NOT NULL,
          "description" TEXT NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "company_role_descriptions_pkey" PRIMARY KEY ("role")
        );
      `;
            Logger.info('CompanyRoleDescription table created successfully.');
        }

        // 2. Check if the table is empty or needs updates
        const count = await prisma.roleDescription.count();

        if (count === 0) {
            Logger.info('Populating CompanyRoleDescription table with default values...');
            const data = Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => ({
                role,
                description,
                updatedAt: new Date()
            }));

            await prisma.roleDescription.createMany({
                data
            });
            Logger.info('CompanyRoleDescription table populated successfully.');
        } else {
            // Optional: Update existing descriptions if they differ? 
            // For now, just ensuring it's not empty is enough.
            Logger.info('CompanyRoleDescription table already contains data.');
        }

        return true;
    } catch (error) {
        Logger.error('Error during RoleDescription initialization:', error);
        // If it fails because of missing enum or something, we might need to handle it.
        return false;
    }
}
