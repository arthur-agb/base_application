import prisma from './prismaClient.js';
import Logger from './logger.js';

const DEFAULT_PLANS = [
    {
        name: 'Free Tier',
        description: 'A basic, free plan with limited features.',
        basePrice: 0,
        currency: 'GBP',
        billingFrequency: 'MONTHLY',
        maxUsers: 3,
        maxBoards: 1,
        maxScheduledIssues: 3,
        maxEpics: 1,
        maxSprints: 1,
        startDate: new Date('2025-01-01'),
    },
    {
        name: 'Pro Tier',
        description: 'Advanced features for professional use.',
        basePrice: 5,
        currency: 'GBP',
        billingFrequency: 'MONTHLY',
        maxUsers: 5,
        maxBoards: 5,
        maxScheduledIssues: 20,
        maxEpics: 10,
        maxSprints: 10,
        startDate: new Date('2025-01-01'),
    },
    {
        name: 'Pro Annual Tier',
        description: 'Advanced features for professional use (Yearly).',
        basePrice: 50,
        currency: 'GBP',
        billingFrequency: 'YEARLY',
        maxUsers: 5,
        maxBoards: 5,
        maxScheduledIssues: 20,
        maxEpics: 10,
        maxSprints: 10,
        startDate: new Date('2025-01-01'),
    }
];

/**
 * @desc Ensures that the default User and Company plans exist in the database.
 */
export async function initializePlans() {
    try {
        for (const planData of DEFAULT_PLANS) {
            // 1. Handle Company Plans (Unique by name)
            await prisma.companyPlan.upsert({
                where: { name: planData.name },
                update: {}, // Don't overwrite existing plans if they exist
                create: planData,
            });

            // 2. Handle User Plans (Personal Workspaces)
            // Note: UserPlan doesn't have a unique constraint on name in the schema yet,
            // so we use findFirst + create as a safe alternative.
            const existingUserPlan = await prisma.userPlan.findFirst({
                where: { name: planData.name }
            });

            if (!existingUserPlan) {
                const { maxUsers, maxBoards, maxScheduledIssues, maxEpics, maxSprints, ...userPlanFields } = planData;
                await prisma.userPlan.create({
                    data: userPlanFields
                });
            }
        }

        Logger.info('✅ Default plans initialized successfully.');
        return true;
    } catch (error) {
        Logger.error('❌ Error during plan initialization:', error);
        return false;
    }
}
