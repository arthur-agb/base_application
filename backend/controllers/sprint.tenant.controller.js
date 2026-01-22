// controllers/sprint.tenant.controller.js
import asyncHandler from 'express-async-handler';
import * as sprintService from '../services/sprint.service.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create a new Sprint for a project
// @route   POST /api/projects/:projectKey/sprints
// @access  Private (Requires project membership)
const createSprint = asyncHandler(async (req, res, next) => {
  const { projectId, projectKey } = req.params;
  const key = projectKey || projectId;
  const { title, goal, startDate, endDate } = req.body;
  const { id: userId } = req.user;
  const companyId = req.company?.id || null;

  // Basic input validation
  if (!title) {
    return next(new ErrorResponse('Sprint title is required.', 400));
  }

  const sprintData = { projectKey: key, userId, companyId, title, goal, startDate, endDate };
  const newSprint = await sprintService.createSprint(sprintData);

  res.status(201).json(newSprint);
});

// @desc    Get all Sprints for a project
// @route   GET /api/projects/:projectKey/sprints
// @access  Private
const getAllSprints = asyncHandler(async (req, res, next) => {
  const { projectId, projectKey } = req.params;
  const key = projectKey || projectId; // Route uses :projectId but it holds the Key string
  const { status } = req.query;
  const { id: userId } = req.user;
  const companyId = req.company?.id || null;

  const sprints = await sprintService.getAllSprintsByProject({ projectKey: key, userId, companyId, status, userCompanyRole: req.userCompanyRole });

  res.status(200).json(sprints);
});

// @desc    Get a single Sprint by ID
// @route   GET /api/sprints/:id
// @access  Private
const getSprintById = asyncHandler(async (req, res, next) => {
  const { id: sprintId } = req.params;
  const { id: userId } = req.user;
  const companyId = req.company?.id || null;

  const sprint = await sprintService.getSprintById({ sprintId, userId, companyId, userCompanyRole: req.userCompanyRole });

  res.status(200).json(sprint);
});

// @desc    Update a Sprint
// @route   PUT /api/sprints/:id
// @access  Private
const updateSprint = asyncHandler(async (req, res, next) => {
  const { id: sprintId } = req.params;
  const { id: userId } = req.user;
  const updateData = req.body;
  const companyId = req.company?.id || null;

  const updatedSprint = await sprintService.updateSprint({ sprintId, userId, companyId, ...updateData });

  res.status(200).json(updatedSprint);
});

// @desc    Delete a Sprint
// @route   DELETE /api/sprints/:id
// @access  Private
const deleteSprint = asyncHandler(async (req, res, next) => {
  const { id: sprintId } = req.params;
  const { id: userId, role: userRole } = req.user;
  const companyId = req.company?.id || null;

  const result = await sprintService.deleteSprint({ sprintId, userId, userRole, companyId });

  res.status(200).json(result);
});

// @desc    Get all issues for a specific Sprint
// @route   GET /api/sprints/:id/issues
// @access  Private
const getSprintIssues = asyncHandler(async (req, res, next) => {
  const { id: sprintId } = req.params;
  const { id: userId } = req.user;
  const companyId = req.company?.id || null;

  const issues = await sprintService.getSprintIssues({ sprintId, userId, companyId, userCompanyRole: req.userCompanyRole });

  res.status(200).json(issues);
});


// @desc    Search for Sprints within a project
// @route   GET /api/projects/:projectKey/sprints/search
// @access  Private
const searchSprints = asyncHandler(async (req, res, next) => {
  const { projectId, projectKey } = req.params;
  const key = projectKey || projectId;
  const { query } = req.query;
  const { id: userId } = req.user;
  const companyId = req.company?.id || null;

  // Basic input validation
  if (!query) {
    return next(new ErrorResponse('A search query is required.', 400));
  }

  const sprints = await sprintService.searchSprints({ projectKey: key, userId, companyId, query, userCompanyRole: req.userCompanyRole });

  res.status(200).json(sprints);
});

export {
  createSprint,
  getAllSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  getSprintIssues,
  searchSprints,
};
