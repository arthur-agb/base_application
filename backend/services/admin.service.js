// services/admin.service.js

import UserMain from '../models/users/UserMain.js';
import Logger from '../utils/logger.js';
import crypto from 'crypto';

//import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailSender.js';
import { UserStatus } from '@prisma/client';

// Fields to select for user lists to avoid exposing sensitive data
const selectUserListFields = {
  id: true,
  displayName: true,
  email: true,
  createdAt: true,
  isEmailVerified: true,
  status: true,
  role: true,
  avatarUrl: true,
};

/**
 * @desc    Finds and paginates users based on admin criteria.
 * @param   {object} options - Filtering, pagination, and sorting options.
 * @returns {Promise<object>} - An object containing users, pagination data, and total count.
 */
export const findUsers = async ({ status, page, limit, searchTerm, sortField, sortOrder }) => {
  const skip = (page - 1) * limit;
  let whereClause = {};

  if (status) {
    if (Array.isArray(status)) {
      whereClause.status = { in: status };
    } else {
      whereClause.status = status;
    }
  }

  if (searchTerm) {
    whereClause.OR = [
      { displayName: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const allowedSortFields = ['displayName', 'email', 'createdAt', 'status', 'role'];
  const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';
  const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const { users, totalUsers } = await UserMain.findUsersAdmin({
    where: whereClause,
    select: selectUserListFields,
    skip: skip,
    take: limit,
    orderBy: {
      [safeSortField]: safeSortOrder,
    },
  });

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    currentPage: page,
    totalPages,
    totalUsers,
  };
};

/**
 * @desc    Approves a user's registration and updates their status.
 * @param   {string} userId - The ID of the user to approve.
 * @param   {string} adminId - The ID of the admin performing the action.
 * @returns {Promise<object>} - The approved user object.
 */
export const approveUser = async (userId, adminId) => {
  const user = await UserMain.findUserByIdWithSelect(userId, {
    id: true,
    status: true,
    isEmailVerified: true,
    email: true,
    displayName: true
  });

  if (!user) {
    throw new Error(`User not found with ID: ${userId}`);
  }

  if (![UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION].includes(user.status)) {
    throw new Error(`User is not awaiting approval. Current status: ${user.status}`);
  }

  const approvedUser = await UserMain.updateUserWithSelect(userId, {
    status: 'ACTIVE',
    isEmailVerified: true,
  }, selectUserListFields);

  // TODO: Implement email sending to user
  // await sendApprovalEmail(approvedUser.email, approvedUser.name);

  Logger.info(
    `User ${approvedUser.email} (ID: ${userId}) approved by admin (ID: ${adminId})`
  );
  return approvedUser;
};

/**
 * @desc    Rejects a user's registration and updates their status.
 * @param   {string} userId - The ID of the user to reject.
 * @param   {string} adminId - The ID of the admin performing the action.
 * @param   {string} reason - The reason for rejection (optional).
 * @returns {Promise<object>} - The rejected user object.
 */
export const rejectUser = async (userId, adminId, reason) => {
  const user = await UserMain.findUserByIdWithSelect(userId, { id: true, status: true, email: true, displayName: true });

  if (!user) {
    throw new Error(`User not found with ID: ${userId}`);
  }

  if (![UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION].includes(user.status)) {
    throw new Error(`User is not awaiting rejection. Current status: ${user.status}`);
  }

  const rejectedUser = await UserMain.updateUserWithSelect(userId, {
    status: 'REJECTED',
  }, selectUserListFields);

  // TODO: Implement email sending to user
  // await sendRejectionEmail(rejectedUser.email, rejectedUser.name, reason);

  Logger.info(
    `User ${rejectedUser.email} (ID: ${userId}) rejected by admin (ID: ${adminId}). Reason: ${reason || 'N/A'}`
  );
  return rejectedUser;
};

/**
 * @desc    Resends a verification email for a specific user.
 * @param   {string} userId - The ID of the user.
 * @param   {string} adminId - The ID of the admin performing the action.
 * @returns {Promise<void>}
 */
export const resendVerificationEmail = async (userId, adminId) => {
  const user = await UserMain.findUserByIdWithSelect(userId, { id: true, status: true, email: true, displayName: true });

  if (!user) {
    throw new Error(`User not found with ID: ${userId}`);
  }

  if (user.status !== UserStatus.PENDING_VERIFICATION) {
    throw new Error(`User is not pending email verification. Current status: ${user.status}`);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const emailVerificationTokenExpiresAt = new Date(Date.now() + 3600000);

  await UserMain.updateUserWithSelect(userId, {
    emailVerificationToken,
    emailVerificationTokenExpiresAt
  }, { id: true });

  // TODO: Implement email sending logic
  // await sendVerificationEmail(user.email, user.name, verificationToken, 'https://your-frontend-origin.com');

  Logger.info(`Admin (ID: ${adminId}) triggered resend verification email for user ${user.email} (ID: ${userId})`);
};