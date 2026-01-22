import asyncHandler from 'express-async-handler';
import Logger from '../utils/logger.js';
// Import the new service file
import * as tenantService from '../services/manager.tenant.service.js';

/**
 * @desc    Get all users for the current company.
 * @route   GET /api/tenants/users
 * @access  Private (Company ADMIN or MANAGER)
 */
const getTenantUsers = asyncHandler(async (req, res) => {
    // req.company is guaranteed to be populated by prior middleware
    const { id: companyId } = req.company;

    // Call the service function to get the data
    const userList = await tenantService.getCompanyUsers(companyId);

    res.json(userList);
});

/**
 * @desc    Add an existing user to the current company by email.
 * @route   POST /api/tenants/invite
 * @access  Private (Company ADMIN or MANAGER)
 */
const inviteUserToTenant = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { id: companyId } = req.company;

    // Basic input validation remains in the controller
    if (!email) {
        res.status(400);
        throw new Error('Email address is required.');
    }

    try {
        // Call the service function to perform the complex logic
        const addedUser = await tenantService.inviteUser(companyId, email, role);

        res.status(201).json({
            message: `Successfully added ${addedUser.name} to the workspace.`,
            user: addedUser
        });
    } catch (error) {
        // Handle specific errors thrown by the service layer
        if (error.message === 'UserNotFound') {
            res.status(404).json({ message: 'A user with this email does not exist. Please ask them to register first.' });
            return;
        }
        if (error.message === 'UserAlreadyMember') {
            res.status(409).json({ message: 'This user is already a member of your workspace.' });
            return;
        }
        // Catch any other unexpected errors
        Logger.error(`Error inviting user with email ${email} to company ${companyId}:`, error);
        throw new Error('Internal server error while adding user.');
    }
});

/**
 * @desc    Get detailed company information.
 * @route   GET /api/tenants/details
 * @access  Private (Company OWNER)
 */
const getWorkspaceDetails = asyncHandler(async (req, res) => {
    const { id: companyId } = req.company;
    const details = await tenantService.getCompanyDetails(companyId);
    res.json(details);
});

/**
 * @desc    Remove a user from the current company.
 * @route   DELETE /api/tenants/users/:userId
 * @access  Private (Company OWNER)
 */
const removeUserFromTenant = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { id: companyId } = req.company;

    if (!userId) {
        res.status(400);
        throw new Error('User ID is required.');
    }

    try {
        await tenantService.removeUser(companyId, userId);
        res.status(200).json({ message: 'User removed successfully.' });
    } catch (error) {
        if (error.message === 'UserNotMember') {
            res.status(404).json({ message: 'User is not a member of this workspace.' });
            return;
        }
        if (error.message === 'LastOwner') {
            res.status(400).json({ message: 'Cannot remove the last owner of the workspace.' });
            return;
        }
        Logger.error(`Error removing user ${userId} from company ${companyId}:`, error);
        throw new Error('Internal server error while removing user.');
    }
});

/**
 * @desc    Update a user's role within the company.
 * @route   PUT /api/tenants/users/:userId/role
 * @access  Private (Company OWNER or ADMIN)
 */
const updateTenantUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const { id: companyId } = req.company;

    if (!userId || !role) {
        res.status(400);
        throw new Error('User ID and Role are required.');
    }

    try {
        const updatedUser = await tenantService.updateUserRole(companyId, userId, role);
        res.status(200).json({
            message: `Successfully updated role for ${updatedUser.name} to ${role}.`,
            user: updatedUser
        });
    } catch (error) {
        if (error.message === 'UserNotMember') {
            res.status(404).json({ message: 'User is not a member of this workspace.' });
            return;
        }
        if (error.message === 'LastOwner') {
            res.status(400).json({ message: 'Cannot demote the last owner of the workspace.' });
            return;
        }
        Logger.error(`Error updating role for user ${userId} in company ${companyId}:`, error);
        throw new Error('Internal server error while updating user role.');
    }
});

/**
 * @desc    Get all role descriptions.
 * @route   GET /api/tenants/roles/descriptions
 * @access  Private
 */
const getRoleDescriptions = asyncHandler(async (req, res) => {
    const descriptions = await tenantService.getRoleDescriptions();
    res.json(descriptions);
});

export {
    getTenantUsers,
    inviteUserToTenant,
    getWorkspaceDetails,
    removeUserFromTenant,
    updateTenantUserRole,
    getRoleDescriptions,
};
