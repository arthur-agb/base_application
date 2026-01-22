import asyncHandler from 'express-async-handler';
import { CompanyUserRole } from '@prisma/client';
import prisma from '../utils/prismaClient.js';

// Define role hierarchy. A user with a role can perform actions of roles below it.
const roleHierarchy = {
  [CompanyUserRole.OWNER]: 50,
  [CompanyUserRole.ADMIN]: 40,
  [CompanyUserRole.MANAGER]: 30,
  [CompanyUserRole.MEMBER]: 20,
  [CompanyUserRole.VIEWER]: 10,
  [CompanyUserRole.BILLING]: 5,
};

/**
 * Higher-order function to create a middleware that checks for a minimum company role.
 * It assumes a tenant context has already been resolved and attached to `req.company`.
 * This should be used AFTER 'protect' and a tenant resolver middleware.
 * @param {CompanyUserRole} requiredRole - The minimum role required (e.g., CompanyUserRole.MEMBER)
 */
export const checkCompanyRole = (requiredRole) =>
  asyncHandler(async (req, res, next) => {
    // Get tenant ID from the resolved company object on the request.
    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('Authentication required, user not found in request.');
    }

    if (!companyId) {
      // If there's no company context, we assume the user is in their personal workspace.
      // We allow the request to proceed and rely on individual resource controllers 
      // to handle membership/ownership checks (e.g., in projectService or through direct membership queries).
      return next();
    }

    // Find the user's membership details for the specific company
    const membership = await prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          userId,
          companyId,
        },
      },
      select: {
        role: true,
      }
    });

    if (!membership) {
      res.status(403); // Forbidden
      throw new Error('Access Denied: You are not a member of this tenant organization.');
    }

    // Check if the user's role level is sufficient
    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel >= requiredRoleLevel) {
      // User has the required permission level, proceed to the next middleware/handler
      req.userCompanyRole = membership.role;
      next();
    } else {
      res.status(403); // Forbidden
      throw new Error(`Access Denied: Requires ${requiredRole} role or higher for this tenant.`);
    }
  });
