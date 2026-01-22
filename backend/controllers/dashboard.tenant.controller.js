// controllers/dashboard.tenant.controller.js
import asyncHandler from 'express-async-handler';

/**
 * @desc    Get user dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
  // Return simple data or whatever is needed for the "Services" view
  res.status(200).json({
    counts: {
      projects: 0,
      assignedIssues: 0
    },
    recentActivity: []
  });
});

/**
 * @desc    Get admin dashboard
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Not authorized to access admin dashboard');
  }

  res.status(200).json({
    message: "Admin Dashboard Placeholder"
  });
});


export {
  getDashboard,
  getAdminDashboard
};
