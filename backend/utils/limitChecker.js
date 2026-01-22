import prisma from './prismaClient.js';
import ErrorResponse from './errorResponse.js';

/**
 * Checks if a company has reached its limit for a specific feature.
 * @param {string} companyId The ID of the company.
 * @param {string} feature The feature to check (users, boards, sprints, epics, scheduledIssues).
 * @returns {Promise<boolean>} True if limit reached, false otherwise.
 */
export const checkLimit = async (companyId, feature) => {
    // 1. Get the current active plan for the company
    const subscription = await prisma.companySubscription.findFirst({
        where: {
            companyId,
            status: 'ACTIVE',
        },
        include: {
            plan: true,
        },
    });

    if (!subscription || !subscription.plan) {
        // If no active plan, we might want to default to something or throw
        // For now, let's assume no plan = Free Tier limits if we find it, or error
        const freePlan = await prisma.companyPlan.findUnique({ where: { name: 'Free Tier' } });
        if (!freePlan) throw new ErrorResponse('No active plan found and default plan missing.', 500);
        return await validateLimit(companyId, freePlan, feature);
    }

    return await validateLimit(companyId, subscription.plan, feature);
};

const validateLimit = async (companyId, plan, feature) => {
    let count = 0;
    let limit = 0;

    switch (feature) {
        case 'users':
            count = await prisma.companyUser.count({ where: { companyId } });
            limit = plan.maxUsers;
            break;
        case 'boards':
            // We need to count boards across all projects in the company
            count = await prisma.momentumBoard.count({
                where: {
                    project: {
                        companyId: companyId
                    }
                }
            });
            limit = plan.maxBoards;
            break;
        case 'sprints':
            count = await prisma.momentumSprint.count({
                where: {
                    project: {
                        companyId: companyId
                    }
                }
            });
            limit = plan.maxSprints;
            break;
        case 'epics':
            count = await prisma.momentumEpic.count({
                where: {
                    project: {
                        companyId: companyId
                    }
                }
            });
            limit = plan.maxEpics;
            break;
        case 'scheduledIssues':
            count = await prisma.scheduledIssue.count({
                where: {
                    board: {
                        project: {
                            companyId: companyId
                        }
                    }
                }
            });
            limit = plan.maxScheduledIssues;
            break;
        default:
            throw new Error(`Unknown feature limit check: ${feature}`);
    }

    // If limit is null, it means unlimited
    if (limit === null) return false;

    return count >= limit;
};

/**
 * Middleware wrapper for checking limits.
 */
export const enforceLimit = (feature) => async (req, res, next) => {
    const companyId = req.headers['x-tenant-id'] || req.user?.activeCompanyId;

    if (!companyId) {
        return next(new ErrorResponse('Company context required for limit check.', 400));
    }

    try {
        const isLimitReached = await checkLimit(companyId, feature);
        if (isLimitReached) {
            return next(new ErrorResponse(`You have reached the ${feature} limit for your current plan. Please upgrade to create more.`, 403));
        }
        next();
    } catch (error) {
        next(error);
    }
};
