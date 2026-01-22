// controllers/epic.controller.js
import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import * as epicService from '../services/epic.service.js';

// @desc    Create a new Epic for a project
// @route   POST /api/projects/:projectKey/epics
// @access  Private (Requires project membership)
const createEpic = asyncHandler(async (req, res, next) => {
  const { title, description, status, ownerUserId, startDate, endDate } = req.body;
  const { projectKey } = req.params;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const epic = await epicService.createEpic({
    title,
    description,
    status,
    ownerUserId,
    startDate,
    endDate,
    projectKey,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole,
  });

  if (!epic) {
    return next(new ErrorResponse('Could not create epic', 500));
  }

  res.status(201).json(epic);
});

// @desc    Get all Epics for a project
// @route   GET /api/projects/:projectKey/epics
// @access  Private (Requires project membership)
const getAllEpicsByProject = asyncHandler(async (req, res, next) => {
  const { projectKey } = req.params;
  const { status } = req.query;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const epics = await epicService.getAllEpicsByProject({
    projectKey,
    status,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole
  });

  res.status(200).json(epics);
});

// @desc    Get a single Epic by ID
// @route   GET /api/epics/:id
// @access  Private
const getEpicById = asyncHandler(async (req, res, next) => {
  const { id: epicId } = req.params;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const epic = await epicService.getEpicById({
    epicId,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole
  });

  if (!epic) {
    return next(new ErrorResponse('Epic not found or not authorized', 404));
  }

  res.status(200).json(epic);
});

// @desc    Update an Epic
// @route   PUT /api/epics/:id
// @access  Private
const updateEpic = asyncHandler(async (req, res, next) => {
  const { id: epicId } = req.params;
  const { id: userId, role: globalRole } = req.user;
  const { title, description, status, ownerUserId, startDate, endDate } = req.body;
  const companyId = req.company?.id || null;

  const updatedEpic = await epicService.updateEpic({
    epicId,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole,
    title,
    description,
    status,
    ownerUserId,
    startDate,
    endDate,
  });

  if (!updatedEpic) {
    return next(new ErrorResponse('Epic not found or not authorized to update', 404));
  }

  res.status(200).json(updatedEpic);
});

// @desc    Delete an Epic
// @route   DELETE /api/epics/:id
// @access  Private
const deleteEpic = asyncHandler(async (req, res, next) => {
  const { id: epicId } = req.params;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const deleted = await epicService.deleteEpic({
    epicId,
    userId,
    userRole: globalRole,
    companyId,
    userCompanyRole: req.userCompanyRole
  });

  if (!deleted) {
    return next(new ErrorResponse('Epic not found or not authorized to delete', 404));
  }

  res.status(200).json({ message: 'Epic removed successfully' });
});

// @desc    Get all issues associated with a specific Epic
// @route   GET /api/epics/:id/issues
// @access  Private
const getEpicIssues = asyncHandler(async (req, res, next) => {
  const { id: epicId } = req.params;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const issues = await epicService.getEpicIssues({
    epicId,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole
  });

  if (!issues) {
    return next(new ErrorResponse('Epic not found or not authorized to view issues', 404));
  }

  res.status(200).json(issues);
});

// @desc    Search for epics within a project
// @route   GET /api/projects/:projectKey/epics/search
// @access  Private
const searchEpics = asyncHandler(async (req, res, next) => {
  const { projectKey } = req.params;
  const { query } = req.query;
  const { id: userId, role: globalRole } = req.user;
  const companyId = req.company?.id || null;

  const epics = await epicService.searchEpics({
    projectKey,
    query,
    userId,
    companyId,
    userCompanyRole: req.userCompanyRole,
    globalRole
  });

  res.status(200).json(epics);
});

export {
  createEpic,
  getAllEpicsByProject,
  getEpicById,
  updateEpic,
  deleteEpic,
  getEpicIssues,
  searchEpics,
};
