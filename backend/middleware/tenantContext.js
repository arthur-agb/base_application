// src/middleware/tenantContext.js
import asyncHandler from 'express-async-handler';
import * as TenantService from '../services/tenant.service.js'; 
import Logger from '../utils/logger.js';

/**
 * Middleware to establish a tenant (company) context from the JWT.
 * This should run AFTER the 'protect' middleware.
 * It sets `req.company` to the company object if a companyId is in the JWT,
 * or to `null` if the user is in their "personal" context.
 */

const tenantContext = asyncHandler(async (req, res, next) => {
  // The 'protect' middleware should have already attached the user to the request.
  if (!req.user) {
    // This case should ideally be blocked by 'protect' middleware, but it's good practice to check.
    return next();
  }

  const companyId = req.user?.companyId;

  if (companyId) {
    // A company context is specified in the token. Let's fetch it.
    const company = await TenantService.getCompanyById(companyId);
    req.company = company;
    Logger.info(`[TenantContext] Resolved company '${company.name}' from JWT for user '${req.user.id}'.`);
  } else {
    // No companyId in the token. User is operating in their personal workspace.
    req.company = null;
    Logger.info(`[TenantContext] User '${req.user.id}' is in personal context (no company in JWT).`);
  }

  next();
});

export default tenantContext;
