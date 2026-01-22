// controllers/admin.global.controller.js

import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import {
  findUsers,
  approveUser,
  rejectUser,
  resendVerificationEmail,
} from '../services/admin.service.js';

/**
 * @desc    Get users by status with pagination, search, and sort
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getPendingUsers = asyncHandler(async (req, res, next) => {
  const {
    status,
    page = 1,
    limit = 10,
    searchTerm = '',
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return next(new ErrorResponse('Invalid page number.', 400));
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return next(new ErrorResponse('Invalid limit value.', 400));
  }

  const result = await findUsers({
    status,
    page: pageNum,
    limit: limitNum,
    searchTerm,
    sortField,
    sortOrder,
  });

  res.status(200).json(result);
});

/**
 * @desc    Approve a user's registration
 * @route   PUT /api/admin/users/:userId/approve
 * @access  Private/Admin
 */
export const approveUserController = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  try {
    const approvedUser = await approveUser(userId, req.user.id);
    res.status(200).json({
      message: 'User approved successfully.',
      user: approvedUser,
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Reject a user's registration
 * @route   PUT /api/admin/users/:userId/reject
 * @access  Private/Admin
 */
export const rejectUserController = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    const rejectedUser = await rejectUser(userId, req.user.id, reason);
    res.status(200).json({
      message: 'User rejected successfully.',
      user: rejectedUser,
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Resend verification email for a user
 * @route   POST /api/admin/users/:userId/resend-verification
 * @access  Private/Admin
 */
export const resendVerificationEmailController = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  try {
      await resendVerificationEmail(userId, req.user.id);
      res.status(200).json({ message: 'Verification email resend process initiated.' });
  } catch (error) {
      next(new ErrorResponse(error.message, 400));
  }
});
