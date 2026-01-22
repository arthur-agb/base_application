// controllers/dashboard.tenant.controller.js
import asyncHandler from 'express-async-handler';
import {
  getUserDashboardData,
  getProjectDashboardData,
  getAdminDashboardData
} from '../services/dashboard.tenant.service.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * @desc    Get user dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
  const companyId = req.company?.id || null;
  const userId = req.user.id;

  const dashboardData = await getUserDashboardData(companyId, userId);

  res.status(200).json(dashboardData);
});

/**
 * @desc    Get project dashboard
 * @route   GET /api/dashboard/project/:projectId
 * @access  Private
 */
const getProjectDashboard = asyncHandler(async (req, res) => {
  const companyId = req.company?.id || null;
  const projectId = req.params.projectId;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Basic input validation
  if (!projectId) {
    throw new ErrorResponse('Project ID is required', 400);
  }

  const projectDashboard = await getProjectDashboardData(companyId, projectId, userId, userRole);

  res.status(200).json(projectDashboard);
});

/**
 * @desc    Get admin dashboard
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    throw new ErrorResponse('Not authorized to access admin dashboard', 403);
  }

  const companyId = req.company?.id || null;

  const adminDashboard = await getAdminDashboardData(companyId);

  res.status(200).json(adminDashboard);
});


export {
  getDashboard,
  getProjectDashboard,
  getAdminDashboard
};
