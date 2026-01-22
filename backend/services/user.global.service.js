// services/user.global.service.js
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import Logger from '../utils/logger.js';
import redisClient from '../utils/redisClient.js';
import prisma from '../utils/prismaClient.js';
import ErrorResponse from '../utils/errorResponse.js';

// --- Helper function to build a select clause excluding password and including settings ---
const userWithSettingsSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  settings: true,
};

/**
 * @desc    Service to get all users with pagination and search.
 */
export const getAllUsers = async ({ page = 1, limit = 20, sort = 'createdAt', order = 'desc', search = '' }) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (search) {
    where.OR = [
      // FIXED: Search by displayName, username, and email
      { displayName: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.userMain.count({ where });
  const users = await prisma.userMain.findMany({
    where,
    include: { settings: true },
    orderBy: { [sort]: order === 'asc' ? 'asc' : 'desc' },
    skip: skip,
    take: limitNum,
  });

  // Create a fallback for displayName and remove password
  const usersWithoutPassword = users.map(({ password, ...user }) => ({
    ...user,
    displayName: user.displayName || user.username,
  }));

  return {
    users: usersWithoutPassword,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * @desc    Service to get a single user by email, with caching.
 */
export const getSingleUser = async (email) => {
  const cacheKey = `user:${email}`;

  if (redisClient.isConnected) {
    try {
      const cachedUserData = await redisClient.get(cacheKey);
      if (cachedUserData && typeof cachedUserData === 'object') {
        Logger.debug(`Cache hit for user ${email}`);
        return cachedUserData;
      } else if (cachedUserData) {
        Logger.warn(`[Cache] Invalid data type retrieved for key ${cacheKey}. Fetching from DB.`);
      }
    } catch (err) {
      Logger.error(`Redis GET communication error for key ${cacheKey}: ${err.message}`);
    }
  }

  const user = await prisma.userMain.findUnique({
    where: { email },
    include: { settings: true },
  });

  if (!user) {
    throw new ErrorResponse(`User not found with email ${email}`, 404);
  }

  const { password, ...userWithoutPassword } = user;
  const userId = userWithoutPassword.id;

  const projectCount = await prisma.project.count({
    where: { members: { some: { id: userId } } },
  });
  const assignedIssuesCount = await prisma.momentumIssue.count({
    where: { assigneeId: userId },
  });

  const userWithStats = {
    ...userWithoutPassword,
    stats: {
      projectCount,
      assignedIssuesCount,
    },
  };

  if (redisClient.isConnected) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(userWithStats), 300);
    } catch (err) {
      Logger.error(`Redis SET error for key ${cacheKey}: ${err.message}`);
    }
  }

  return userWithStats;
};

/**
 * @desc    Service to list users for assignment purposes.
 * @param {string} role - Optional role filter
 * @param {string} status - Optional status filter
 * @param {string|null} companyId - Company ID to scope search to
 */
export const getUsersForAssignment = async (role, status, companyId = null, userId = null) => {
  const where = {};
  if (role) where.role = role.toUpperCase();
  if (status) where.status = status.toUpperCase();
  else where.status = 'ACTIVE';

  // Filter by company membership to prevent cross-tenant data leaks
  if (companyId) {
    where.companies = {
      some: {
        companyId: companyId,
      },
    };
  } else if (userId) {
    // In personal context, only show the user themselves
    where.id = userId;
  } else {
    // Fallback: if no context, return nothing to be safe
    return [];
  }

  try {
    const users = await prisma.userMain.findMany({
      where,
      select: {
        id: true,
        username: true, // Select username for fallback
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { displayName: 'asc' },
    });

    return users.map(user => ({
      ...user,
      displayName: user.displayName || user.username
    }));

  } catch (error) {
    Logger.error(`Error fetching users for assignment: ${error.message}`);
    if (error.code === 'P2023' || (error.message && error.message.includes('Invalid value for enum'))) {
      throw new ErrorResponse('Invalid role or status value provided for filtering.', 400);
    }
    throw new ErrorResponse('Failed to retrieve users for assignment.', 500);
  }
};

/**
 * @desc    Service to update a user's profile (for Admins).
 */
export const updateUser = async (originalEmail, directUserData, settings, actingUser) => {
  const userToUpdate = await prisma.userMain.findUnique({
    where: { email: originalEmail },
    select: { id: true, email: true },
  });

  if (!userToUpdate) {
    throw new ErrorResponse(`User not found with email ${originalEmail}`, 404);
  }

  const userUpdateData = {};
  const allowedUserFields = ['displayName', 'username', 'email', 'role'];

  if (directUserData.email && directUserData.email !== originalEmail) {
    const existingUser = await prisma.userMain.findUnique({
      where: { email: directUserData.email },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== userToUpdate.id) {
      throw new ErrorResponse('New email address is already in use', 409);
    }
    userUpdateData.email = directUserData.email;
  }

  allowedUserFields.forEach((key) => {
    if (directUserData[key] !== undefined && key !== 'email') {
      if (key === 'role') {
        const validRoles = ['USER', 'DEVELOPER', 'MANAGER', 'ADMIN'];
        if (!validRoles.includes(directUserData[key].toUpperCase())) {
          Logger.warn(`Skipping invalid role update: ${directUserData[key]}`);
          return;
        }
        userUpdateData[key] = directUserData[key].toUpperCase();
      } else {
        userUpdateData[key] = directUserData[key];
      }
    }
  });

  const settingsUpdateData = {};
  const allowedSettingsFields = ['theme', 'fontSize', 'highContrast', 'isSidebarOpen'];
  let hasSettingsUpdate = false;
  if (settings && typeof settings === 'object') {
    allowedSettingsFields.forEach((key) => {
      if (settings[key] !== undefined) {
        settingsUpdateData[key] = settings[key];
        hasSettingsUpdate = true;
      }
    });
  }

  const prismaUpdatePayload = { ...userUpdateData };
  if (hasSettingsUpdate) {
    prismaUpdatePayload.settings = {
      upsert: {
        create: settingsUpdateData,
        update: settingsUpdateData,
      },
    };
  }

  if (Object.keys(userUpdateData).length === 0 && !hasSettingsUpdate) {
    const currentUserData = await prisma.userMain.findUnique({
      where: { id: userToUpdate.id },
      include: { settings: true },
    });
    const { password, ...userWithoutPass } = currentUserData || {};
    return userWithoutPass;
  }

  const updatedUserWithSettings = await prisma.userMain.update({
    where: { id: userToUpdate.id },
    data: prismaUpdatePayload,
    include: { settings: true },
  });

  const { password, ...resultUser } = updatedUserWithSettings;

  if (redisClient.isConnected) {
    try {
      await redisClient.del(`user:${originalEmail}`);
      Logger.debug(`Cleared cache for user: ${originalEmail}`);
      if (userUpdateData.email && userUpdateData.email !== originalEmail) {
        await redisClient.del(`user:${userUpdateData.email}`);
        Logger.debug(`Cleared cache for user (new email): ${userUpdateData.email}`);
      }
    } catch (err) {
      Logger.error(`Redis DEL error during user update: ${err.message}`);
    }
  }

  Logger.info(
    `User ${(resultUser.displayName || resultUser.username)} (${resultUser.email}) updated by ${(actingUser?.displayName || actingUser?.username) || 'Unknown'}`
  );

  return resultUser;
};

/**
 * @desc    Service to delete a user and their associated data.
 */
export const deleteUser = async (email, actingUser) => {
  const user = await prisma.userMain.findUnique({
    where: { email },
    select: { id: true, username: true, displayName: true, email: true },
  });

  if (!user) {
    throw new ErrorResponse(`User not found with email ${email}`, 404);
  }

  if (user.email === actingUser.email) {
    throw new ErrorResponse('Cannot delete your own account', 400);
  }

  const userId = user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const projectsAsLeadCount = await tx.project.count({
        where: { leadId: userId },
      });
      if (projectsAsLeadCount > 0) {
        throw new ErrorResponse(
          'Cannot delete user who is a project lead. Reassign projects first.',
          400
        );
      }

      await tx.project.updateMany({
        where: { members: { some: { id: userId } } },
        data: {
          members: {
            disconnect: { id: userId },
          },
        },
      });

      await tx.momentumIssue.updateMany({
        where: { assigneeId: userId },
        data: { assigneeId: null },
      });

      await tx.comment.deleteMany({
        where: { authorId: userId },
      });

      await tx.history.deleteMany({
        where: { userId: userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    if (redisClient.isConnected) {
      try {
        await redisClient.del(`user:${email}`);
        Logger.debug(`Cleared cache for deleted user: ${email}`);
      } catch (err) {
        Logger.error(`Redis DEL error during user delete: ${err.message}`);
      }
    }

    Logger.info(
      `User ${(user.displayName || user.username)} (${user.email}) deleted by ${(actingUser.displayName || actingUser.username)} (${actingUser.email})`
    );

  } catch (error) {
    Logger.error(`Failed to delete user ${email}: ${error.message}`);
    if (error instanceof ErrorResponse) {
      throw error;
    }
    throw new ErrorResponse(`Failed to delete user: ${error.message}`, 500);
  }
};

/**
 * @desc    Service to get issues assigned to a user with filtering and pagination.
 */
export const getUserIssues = async (email, queryParams, actingUser, isMyIssuesRoute) => {
  let userIdToQuery;

  if (isMyIssuesRoute) {
    if (!actingUser || !actingUser.id) {
      throw new ErrorResponse('Not authorized, user data unavailable.', 401);
    }
    userIdToQuery = actingUser.id;
  } else {
    if (!actingUser || (email !== actingUser.email && actingUser.role !== 'ADMIN')) {
      throw new ErrorResponse('Not authorized to view issues assigned to this user', 403);
    }
    const user = await prisma.userMain.findUnique({
      where: { email: email },
      select: { id: true },
    });
    if (!user) {
      throw new ErrorResponse(`User not found with email ${email}`, 404);
    }
    userIdToQuery = user.id;
  }

  const { status, priority, type, page = 1, limit = 10, sort = 'updatedAt', order = 'desc' } = queryParams;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = { assigneeId: userIdToQuery };
  if (status) where.status = status;
  if (priority) where.priority = priority.toUpperCase();
  if (type) where.type = type.toUpperCase();

  const total = await prisma.momentumIssue.count({ where });

  const issues = await prisma.momentumIssue.findMany({
    where,
    include: {
      project: { select: { name: true, key: true } },
      reporter: { select: { username: true, displayName: true, avatarUrl: true } }, // Select both
      column: { select: { name: true } },
    },
    orderBy: { [sort]: order === 'asc' ? 'asc' : 'desc' },
    skip: skip,
    take: limitNum,
  });

  const issuesWithReporterFallback = issues.map(issue => ({
    ...issue,
    reporter: {
      ...issue.reporter,
      displayName: issue.reporter.displayName || issue.reporter.username,
    }
  }));

  return {
    issues: issuesWithReporterFallback,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * @desc    Service to search for users by name or email.
 * @param {string} query - Search query
 * @param {string|null} companyId - Company ID to scope search to
 */
export const searchUsers = async (query, companyId = null, userId = null) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const whereClause = {
    OR: [
      { displayName: { contains: query, mode: 'insensitive' } },
      { username: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ],
  };

  // Filter by company membership to prevent cross-tenant data leaks
  if (companyId) {
    whereClause.companies = {
      some: {
        companyId: companyId,
      },
    };
  } else if (userId) {
    // In personal context, only search for the user themselves
    whereClause.id = userId;
  } else {
    // Fallback: if no context, return nothing to be safe
    return [];
  }

  const users = await prisma.userMain.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
    },
    take: 10,
  });

  return users.map(user => ({
    ...user,
    displayName: user.displayName || user.username,
  }));
};

/**
 * @desc    Service to update the current authenticated user's profile.
 */
export const updateMyProfile = async (actingUser, updateData = {}) => {
  const { id: userId, email: userEmail } = actingUser;
  const { settings, ...directUserData } = updateData;

  if (!userId) {
    throw new ErrorResponse('Authentication required', 401);
  }

  const userUpdateData = {};
  if (directUserData.displayName !== undefined) userUpdateData.displayName = directUserData.displayName;
  if (directUserData.username !== undefined) userUpdateData.username = directUserData.username;
  if (directUserData.bio !== undefined) userUpdateData.bio = directUserData.bio;

  const settingsUpdateData = {};
  const allowedSettingsFields = ['theme', 'fontSize', 'highContrast', 'isSidebarOpen'];
  let hasSettingsUpdate = false;

  // Note: This block now correctly checks the 'settings' object we destructured above
  if (settings && typeof settings === 'object') {
    allowedSettingsFields.forEach((key) => {
      if (settings[key] !== undefined) {
        settingsUpdateData[key] = settings[key];
        hasSettingsUpdate = true;
      }
    });
  }

  const prismaUpdatePayload = { ...userUpdateData };
  if (hasSettingsUpdate) {
    prismaUpdatePayload.settings = {
      upsert: {
        create: settingsUpdateData,
        update: settingsUpdateData,
      },
    };
  }

  if (Object.keys(userUpdateData).length === 0 && !hasSettingsUpdate) {
    const currentUserData = await prisma.userMain.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    const { password, ...userWithoutPass } = currentUserData || {};
    return userWithoutPass;
  }

  // Perform the update and fetch relations needed for the frontend
  const updatedUser = await prisma.userMain.update({
    where: { id: userId },
    data: prismaUpdatePayload,
    include: {
      settings: true,
      companies: {
        select: {
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      credentials: {
        select: {
          twoFactorSecret: true,
        },
      },
    },
  });

  const { password, companies, credentials, ...resultUser } = updatedUser;

  // Map companies to the flat structure expected by the frontend
  const userCompanies = companies.map((c) => c.company);

  // Determine active company role (similar to getMyProfile)
  // Determine active company role (similar to getMyProfile)
  const activeCompanyId = actingUser.companyId;
  let companyRole = null;

  if (activeCompanyId) {
    const membership = companies.find((c) => c.company.id === activeCompanyId);
    companyRole = membership?.role;
  }

  if (redisClient.isConnected && userEmail) {
    try {
      await redisClient.del(`user:${userEmail}`);
      Logger.debug(`Cleared cache for self-updated profile: ${userEmail}`);
    } catch (err) {
      Logger.error(`Redis DEL error during profile self-update: ${err.message}`);
    }
  }

  Logger.info(`User ${(resultUser.displayName || resultUser.username)} (${resultUser.email}) updated their own profile.`);

  return {
    ...resultUser,
    companies: userCompanies,
    activeCompanyId,
    companyRole,
    isTwoFactorEnabled: !!credentials?.twoFactorSecret,
  };
};

/**
 * @desc    Service to get a user's statistics.
 */
export const getUserStats = async (email, actingUser) => {
  if (!actingUser || (email !== actingUser.email && actingUser.role !== 'ADMIN')) {
    throw new ErrorResponse('Not authorized to view stats for this user', 403);
  }

  const user = await prisma.userMain.findUnique({
    where: { email },
    select: { id: true, username: true, displayName: true, email: true },
  });

  if (!user) {
    throw new ErrorResponse(`User not found with email ${email}`, 404);
  }
  const userId = user.id;

  const projectCount = await prisma.project.count({
    where: { members: { some: { id: userId } } },
  });
  const assignedIssuesCount = await prisma.momentumIssue.count({
    where: { assigneeId: userId },
  });
  const reportedIssuesCount = await prisma.momentumIssue.count({
    where: { reporterId: userId },
  });
  const commentsCount = await prisma.comment.count({
    where: { authorId: userId },
  });
  const completedIssuesCount = await prisma.momentumIssue.count({
    where: { assigneeId: userId, status: 'DONE' },
  });

  const recentActivityIssues = await prisma.momentumIssue.findMany({
    where: {
      OR: [{ assigneeId: userId }, { reporterId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: { id: true, title: true, updatedAt: true, status: true, project: { select: { key: true } } },
  });

  return {
    userId: userId,
    userName: user.displayName || user.username,
    userEmail: user.email,
    stats: {
      projectMembershipCount: projectCount,
      assignedIssuesCount,
      reportedIssuesCount,
      commentsMadeCount: commentsCount,
      completedIssuesCount,
      recentActivity: recentActivityIssues.map((issue) => ({
        type: 'issue_update',
        issueId: issue.id,
        issueTitle: issue.title,
        projectKey: issue.project.key,
        status: issue.status,
        timestamp: issue.updatedAt,
      })),
    },
  };
};

/**
 * @desc    Service to get the current authenticated user's profile.
 */
export const getMyProfile = async (userId, activeCompanyId = null) => {
  if (!prisma || !prisma.userMain) {
    throw new ErrorResponse('Database client not initialized.', 500);
  }

  console.log('[getMyProfile Service] Called with:', { userId, activeCompanyId });

  const userProfile = await prisma.userMain.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      credentials: {
        select: {
          twoFactorSecret: true,
        },
      },
      companies: {
        select: {
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!userProfile) {
    throw new ErrorResponse('User profile not found.', 404);
  }

  const { credentials, companies, ...userData } = userProfile;

  console.log('[getMyProfile Service] User companies:', companies.map(c => ({
    companyId: c.company.id,
    companyName: c.company.name,
    role: c.role
  })));

  const userCompanies = companies.map((c) => c.company);
  let companyRole = null;

  console.log('[getMyProfile Service] Looking for activeCompanyId:', activeCompanyId);

  if (activeCompanyId) {
    const membership = companies.find((c) => c.company.id === activeCompanyId);
    console.log('[getMyProfile Service] Found membership:', membership ? { role: membership.role, companyId: membership.company.id } : 'NOT FOUND');
    companyRole = membership?.role;
  } else {
    console.log('[getMyProfile Service] activeCompanyId is null/undefined, skipping role lookup');
  }

  console.log('[getMyProfile Service] Final companyRole:', companyRole);

  return {
    ...userData,
    name: userData.displayName || userData.username,
    companies: userCompanies,
    activeCompanyId: activeCompanyId,
    companyRole,
    isTwoFactorEnabled: !!credentials?.twoFactorSecret,
  };
};