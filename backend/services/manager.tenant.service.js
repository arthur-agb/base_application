import prisma from '../utils/prismaClient.js';
import { CompanyUserRole } from '@prisma/client';
import Logger from '../utils/logger.js';
import { getGlobal } from '../utils/globalsInitializer.js';

/**
 * @desc    Fetches and formats a list of users for a given company.
 * @param   {string} companyId - The ID of the company.
 * @returns {Array} An array of user objects.
 */
export const getCompanyUsers = async (companyId) => {
    const members = await prisma.companyUser.findMany({
        where: { companyId: companyId },
        select: {
            role: true,
            user: {
                select: {
                    id: true,
                    displayName: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                }
            }
        },
        orderBy: {
            user: {
                displayName: 'asc'
            }
        }
    });

    // Flatten the structure for an easier-to-use format on the frontend.
    const userList = members.map(member => ({
        id: member.user.id,
        name: member.user.displayName || member.user.username,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
    }));

    return userList;
};

/**
 * @desc    Invites a user to a company.
 * @param   {string} companyId - The ID of the company.
 * @param   {string} email - The email of the user to invite.
 * @param   {string} role - The role to assign (defaults to MEMBER).
 * @returns {object} The newly added user object.
 * @throws  Error 'UserNotFound' if the user doesn't exist.
 * @throws  Error 'UserAlreadyMember' if the user is already a member.
 */
export const inviteUser = async (companyId, email, role = CompanyUserRole.MEMBER) => {
    // The entire transaction and business logic is now encapsulated here.
    const newMembership = await prisma.$transaction(async (tx) => {
        // Step 1: Find the user by email in the main 'user_main' table.
        const userToInvite = await tx.userMain.findUnique({ where: { email } });

        if (!userToInvite) {
            // Throw a specific error that the controller can handle
            throw new Error('UserNotFound');
        }

        // Step 2: Check if this user is already part of the company.
        const existingMembership = await tx.companyUser.findUnique({
            where: {
                companyId_userId: {
                    userId: userToInvite.id,
                    companyId: companyId,
                }
            }
        });

        if (existingMembership) {
            // Throw a specific error that the controller can handle
            throw new Error('UserAlreadyMember');
        }

        // Step 3: Create the link in the 'company_users' pivot table.
        const createdMembership = await tx.companyUser.create({
            data: {
                userId: userToInvite.id,
                companyId: companyId,
                role: role || CompanyUserRole.MEMBER, // Specified or default role
            },
            select: {
                role: true,
                user: {
                    select: { id: true, displayName: true, username: true, email: true, avatarUrl: true }
                }
            }
        });
        return createdMembership;
    });

    // Transaction successful, format the user data for the response
    const addedUser = {
        id: newMembership.user.id,
        name: newMembership.user.displayName || newMembership.user.username,
        email: newMembership.user.email,
        avatarUrl: newMembership.user.avatarUrl,
        role: newMembership.role
    };

    return addedUser;
};
/**
 * @desc    Removes a user from a company.
 * @param   {string} companyId - The ID of the company.
 * @param   {string} userId - The ID of the user to remove.
 * @returns {boolean} True if successful.
 * @throws  Error 'LastOwner' if attempting to remove the last owner.
 */
export const removeUser = async (companyId, userId) => {
    // We must ensure the user being removed is not the last owner.
    const membership = await prisma.companyUser.findUnique({
        where: {
            companyId_userId: { userId, companyId }
        }
    });

    if (!membership) {
        throw new Error('UserNotMember');
    }

    if (membership.role === 'OWNER') {
        const ownerCount = await prisma.companyUser.count({
            where: {
                companyId: companyId,
                role: 'OWNER'
            }
        });

        if (ownerCount <= 1) {
            throw new Error('LastOwner');
        }
    }

    await prisma.companyUser.delete({
        where: {
            companyId_userId: { userId, companyId }
        }
    });

    return true;
};

/**
 * @desc    Updates a user's role in a company.
 * @param   {string} companyId - The ID of the company.
 * @param   {string} userId - The ID of the user.
 * @param   {string} newRole - The new role to assign.
 * @returns {object} The updated membership object.
 */
export const updateUserRole = async (companyId, userId, newRole) => {
    // 1. Check if membership exists
    const membership = await prisma.companyUser.findUnique({
        where: { companyId_userId: { userId, companyId } }
    });

    if (!membership) {
        throw new Error('UserNotMember');
    }

    // 2. Prevent removing the last owner's OWNER role
    if (membership.role === CompanyUserRole.OWNER && newRole !== CompanyUserRole.OWNER) {
        const ownerCount = await prisma.companyUser.count({
            where: { companyId, role: CompanyUserRole.OWNER }
        });

        if (ownerCount <= 1) {
            throw new Error('LastOwner');
        }
    }

    // 3. Update the role
    const updatedMembership = await prisma.companyUser.update({
        where: { companyId_userId: { userId, companyId } },
        data: { role: newRole },
        select: {
            role: true,
            user: {
                select: { id: true, displayName: true, username: true, email: true, avatarUrl: true }
            }
        }
    });

    return {
        id: updatedMembership.user.id,
        name: updatedMembership.user.displayName || updatedMembership.user.username,
        email: updatedMembership.user.email,
        avatarUrl: updatedMembership.user.avatarUrl,
        role: updatedMembership.role
    };
};

/**
 * @desc    Fetches detailed company info including subscription and cost.
 * @param   {string} companyId - The ID of the company.
 * @returns {object} Company details object.
 */
export const getCompanyDetails = async (companyId) => {
    const company = await prisma.companyMain.findUnique({
        where: { id: companyId },
        include: {
            subscriptions: {
                where: { status: 'ACTIVE' },
                include: {
                    plan: true,
                    addons: {
                        include: {
                            addon: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            _count: {
                select: { users: true }
            }
        }
    });

    if (!company) {
        throw new Error('CompanyNotFound');
    }

    const activeSubscription = company.subscriptions[0] || null;
    const plan = activeSubscription?.plan || null;

    // Calculate total cost (base price + addons)
    let totalCost = plan?.basePrice || 0;
    if (activeSubscription?.addons) {
        activeSubscription.addons.forEach(pa => {
            if (pa.isActive) {
                totalCost += pa.addon.basePrice;
            }
        });
    }

    return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        createdAt: company.createdAt,
        userCount: company._count.users,
        subscription: {
            planName: plan?.name || 'No Active Plan',
            status: activeSubscription?.status || 'INACTIVE',
            billingFrequency: plan?.billingFrequency || 'N/A',
            basePrice: plan?.basePrice || 0,
            currency: plan?.currency || 'USD',
            totalCost: totalCost,
            nextBillingDate: activeSubscription?.endDate || null, // Simplified
        }
    };
};

/**
 * @desc    Fetches all role descriptions from the database (via cache).
 * @returns {object} An object containing roles and their descriptions.
 */
export const getRoleDescriptions = async () => {
    try {
        return {
            roles: getGlobal('roles'),
            descriptions: getGlobal('roleDescriptions')
        };
    } catch (error) {
        // Fallback if cache is not initialized for some reason
        const descriptions = await prisma.roleDescription.findMany();
        return {
            roles: descriptions.map(d => d.role),
            descriptions: descriptions.reduce((acc, item) => {
                acc[item.role] = item.description;
                return acc;
            }, {})
        };
    }
};
