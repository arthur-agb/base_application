import express from 'express';
const router = express.Router();

// Import controllers
import {
    getTenantUsers,
    inviteUserToTenant,
    getWorkspaceDetails,
    removeUserFromTenant,
    updateTenantUserRole,
    getRoleDescriptions,
} from '../controllers/manager.tenant.controller.js';
import { createCompany } from '../controllers/company.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

// Route to get all users in the current workspace
router.get(
    '/users',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.MANAGER),
    getTenantUsers
);

// Route to invite a user to the current workspace
router.post(
    '/invite',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.MANAGER),
    Validators.validateInvite(),
    validate,
    inviteUserToTenant
);

// Route to get detailed workspace information
router.get(
    '/details',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.OWNER),
    getWorkspaceDetails
);
// Route to remove a user from the workspace
router.delete(
    '/users/:userId',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.OWNER),
    Validators.validateId('userId'),
    validate,
    removeUserFromTenant
);

// Route to update a user's role in the workspace
router.put(
    '/users/:userId/role',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.OWNER),
    Validators.validateRoleUpdate(),
    validate,
    updateTenantUserRole
);

// Route to get role descriptions
router.get(
    '/roles/descriptions',
    protect,
    getRoleDescriptions
);

// Route to create a new company
router.post(
    '/',
    protect,
    createCompany
);

export default router;
