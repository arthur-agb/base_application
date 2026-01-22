// middleware/isCompanyOwner.js
import asyncHandler from 'express-async-handler';
import * as AuthService from '../services/auth.service.js';
import Logger from '../utils/logger.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Middleware to verify if the authenticated user is the OWNER
 * of the current company.
 */
const isCompanyOwner = asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const companyId = req.company?.id || null;

    if (!userId || !companyId) {
        Logger.warn('[isCompanyOwner] Missing userId or companyId in request context.');
        return next(new ErrorResponse('Not authorized, session is invalid.', 401));
    }

    await AuthService.checkCompanyOwner(userId, companyId);

    next();
});

export { isCompanyOwner };
