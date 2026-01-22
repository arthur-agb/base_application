// controllers/report.tenant.controller.js
import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import * as reportService from '../services/report.service.js';

/**
 * @controller getSprintSummary
 * @description Retrieves a summary report for a specific sprint by calling the report service.
 */
const getSprintSummary = asyncHandler(async (req, res) => {
  const { sprintId } = req.params;
  const { id: userId } = req.user;
  const { id: companyId } = req.company;

  // Controller is now lean, it only orchestrates the request.
  const summaryReport = await reportService.getSprintSummaryReport({
    sprintId,
    userId,
    companyId,
  });

  res.status(200).json(summaryReport);
});

/**
 * @controller getEpicProgress
 * @description Retrieves a progress report for a specific epic by calling the report service.
 */
const getEpicProgress = asyncHandler(async (req, res) => {
  const { epicId } = req.params;
  const { id: userId } = req.user;
  const { id: companyId } = req.company;

  const progressReport = await reportService.getEpicProgressReport({
    epicId,
    userId,
    companyId,
  });

  res.status(200).json(progressReport);
});

/**
 * @controller getUserWorkload
 * @description Retrieves a report on user workload by calling the report service.
 */
const getUserWorkload = asyncHandler(async (req, res) => {
  const { projectId, sprintId, statusCategory } = req.query;
  const { id: userId } = req.user;
  const { id: companyId } = req.company;

  if (!projectId) {
    throw new ErrorResponse('Project ID is required for user workload report.', 400);
  }

  const workloadReport = await reportService.getUserWorkloadReport({
    projectId,
    sprintId,
    statusCategory,
    userId,
    companyId,
  });

  res.status(200).json(workloadReport);
});

/**
 * @controller getSprintBurnupData
 * @description Placeholder for generating burnup chart data, now handled by the report service.
 */
const getSprintBurnupData = asyncHandler(async (req, res) => {
  const { sprintId } = req.params;
  const { id: userId } = req.user;
  const { id: companyId } = req.company;

  const burnupData = await reportService.getSprintBurnupData({
    sprintId,
    userId,
    companyId,
  });

  // The service returns a 501-like object, which the controller then sends.
  if (burnupData.success === false) {
    res.status(501).json(burnupData);
  } else {
    res.status(200).json(burnupData);
  }
});

export {
  getSprintSummary,
  getEpicProgress,
  getUserWorkload,
  getSprintBurnupData,
};
