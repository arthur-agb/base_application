// middleware/isCompanyAdminOrManager.js
import asyncHandler from 'express-async-handler';
import * as AuthService from '../services/auth.service.js';
import Logger from '../utils/logger.js';
import ErrorResponse from '../utils/errorResponse.js'; // Assuming a custom error response class

/**
 * Middleware to verify if the authenticated user is an ADMIN or MANAGER
 * of the current company.
 * Assumes 'protect' (populating req.user) and a tenant resolver
 * (populating req.company) have already executed.
 */
const isCompanyAdminOrManager = asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const companyId = req.company?.id || null;

    if (!userId || !companyId) {
        Logger.warn('[isCompanyAdminOrManager] Missing userId or companyId in request context.');
        return next(new ErrorResponse('Not authorized, session is invalid.', 401));
    }

    // Delegate the complex business logic to the service layer
    await AuthService.checkCompanyAdminOrManager(userId, companyId);
    
    // If the above call doesn't throw, the user is authorized.
    next();
});

export { isCompanyAdminOrManager };
