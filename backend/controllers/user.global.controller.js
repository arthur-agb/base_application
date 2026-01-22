// controllers/user.global.controller.js
import asyncHandler from 'express-async-handler';
import * as userGlobalService from '../services/user.global.service.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * @desc    Get all users with pagination and search (for admin)
 * @route   GET /api/users/list-all
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, search } = req.query;
  const usersData = await userGlobalService.getAllUsers({ page, limit, sort, order, search });
  res.status(200).json(usersData);
});

/**
 * @desc    Get a single user by email
 * @route   GET /api/users/by-email
 * @access  Public (or Private)
 */
const getUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    throw new ErrorResponse('Email query parameter is required', 400);
  }
  const user = await userGlobalService.getSingleUser(email);
  res.status(200).json(user);
});

/**
 * @desc    Get a list of users for assignment purposes
 * @route   GET /api/users
 * @access  Private
 */
const listUsersForAssignment = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const companyId = req.user?.companyId || null;
  const userId = req.user?.id || null;
  const users = await userGlobalService.getUsersForAssignment(role, status, companyId, userId);
  res.status(200).json(users);
});

/**
 * @desc    Update user profile data
 * @route   PUT /api/users
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res) => {
  const { email } = req.query;
  const { profileSettings, ...directUserData } = req.body;
  if (!email) {
    throw new ErrorResponse('Original email query parameter is required', 400);
  }
  const updatedUser = await userGlobalService.updateUser(email, directUserData, profileSettings, req.user);
  res.status(200).json(updatedUser);
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:email
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { email } = req.params;
  if (!email) {
    throw new ErrorResponse('Email parameter is required', 400);
  }
  await userGlobalService.deleteUser(email, req.user);
  res.status(200).json({ message: 'User deleted successfully' });
});

/**
 * @desc    Get issues assigned to a user
 * @route   GET /api/users/:email/issues or /api/users/issues
 * @access  Private
 */
const getUserIssues = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const isMyIssuesRoute = req.originalUrl.endsWith('/api/users/issues');
  const issuesData = await userGlobalService.getUserIssues(email, req.query, req.user, isMyIssuesRoute);
  res.status(200).json(issuesData);
});

/**
 * @desc    Search users by name or email
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const companyId = req.user?.companyId || null;
  const userId = req.user?.id || null;
  const users = await userGlobalService.searchUsers(query, companyId, userId);
  res.status(200).json(users);
});

/**
 * @desc    Update current authenticated user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userGlobalService.updateMyProfile(
    req.user,
    req.body
  );
  res.status(200).json(updatedUser);
});

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new ErrorResponse('Not authorized, user ID unavailable.', 401);
  }

  console.log('[getMyProfile] req.user:', { id: req.user.id, companyId: req.user.companyId, role: req.user.role });
  console.log('[getMyProfile] req.company:', req.company);

  const activeCompanyId = req.company?.id || null;
  console.log('[getMyProfile] activeCompanyId:', activeCompanyId);

  const myProfile = await userGlobalService.getMyProfile(req.user.id, activeCompanyId);
  res.status(200).json(myProfile);
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    throw new ErrorResponse('Email query parameter is required for stats', 400);
  }
  const stats = await userGlobalService.getUserStats(email, req.user);
  res.status(200).json(stats);
});

/**
 * @desc    Get user notifications (Placeholder)
 * @route   GET /api/users/notifications
 * @access  Private
 */
const getUserNotifications = (req, res) => {
  res.status(200).json({
    notifications: [],
    count: 0,
    message: 'Notifications feature not implemented.',
  });
};

export {
  getUsers,
  getUserByEmail,
  listUsersForAssignment,
  updateUser,
  deleteUser,
  getUserIssues,
  searchUsers,
  updateProfile,
  getMyProfile,
  getUserStats,
  getUserNotifications,
};
