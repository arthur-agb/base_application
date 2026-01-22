// services/search.service.js
import prisma from '../utils/prismaClient.js';
import Logger from '../utils/logger.js';

// Main global search function
export const performGlobalSearch = async ({ query, type, limit, user, company }) => {
  const companyId = company ? company.id : null;
  const limitNum = parseInt(limit, 10) || 10;
  const results = { issues: [], projects: [], users: [], comments: [] };

  if (!type || type === 'all' || type === 'users') {
    // Filter users by company membership to prevent cross-tenant data leaks
    const userWhereClause = {
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    };

    // Scope to company/context
    userWhereClause.companies = {
      some: {
        companyId: companyId,
      },
    };

    results.users = await prisma.userMain.findMany({
      where: userWhereClause,
      select: { id: true, displayName: true, email: true, avatarUrl: true, role: true },
      take: limitNum,
    });
  }

  Logger.info(`Global search "${query}" by user ${user.id} in company ${companyId}`);
  return results;
};

// Advanced search function
export const performAdvancedSearch = async () => {
  // Not supported in bare bones version
  return {
    issues: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  };
};

// Search suggestions function
export const getSearchSuggestions = async ({ query, type, user, company }) => {
  const companyId = company?.id;
  let suggestions = [];

  switch (type) {
    case 'users':
      // Filter users by company membership to prevent cross-tenant data leaks
      const userWhereClause = {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };

      // Scope to company/context
      userWhereClause.companies = {
        some: {
          companyId: companyId,
        },
      };

      const users = await prisma.userMain.findMany({
        where: userWhereClause,
        select: { id: true, displayName: true, email: true, avatarUrl: true },
        take: 5,
      });
      suggestions = users.map(user => ({
        type: 'user',
        value: user.id,
        label: user.displayName,
        avatar: user.avatarUrl,
      }));
      break;
    default:
      break;
  }

  return suggestions;
};

