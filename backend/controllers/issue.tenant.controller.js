// controllers/issue.tenant.controller.js
import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import * as issueService from '../services/issue.service.js';

const createIssue = asyncHandler(async (req, res) => {
  const { title, projectId, columnId } = req.body;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  if (!title || !projectId || !columnId) {
    throw new ErrorResponse('Title, Project ID, and Column ID are required', 400);
  }

  // Delegate all business logic to the service
  const newIssue = await issueService.createIssue(req.body, userId, companyId);
  res.status(201).json(newIssue);
});

const getIssueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const companyId = req.company?.id || null;
  const userCompanyRole = req.userCompanyRole;

  if (!id) throw new ErrorResponse('Issue ID is required', 400);

  // Delegate all business logic to the service
  const issueResponse = await issueService.getIssueById(id, userId, companyId, userCompanyRole);
  res.status(200).json(issueResponse);
});

const updateIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const companyId = req.company?.id || null;
  const hasUpdates = Object.keys(req.body).length > 0;

  if (!hasUpdates) {
    // If no updates are provided, get the issue and return it
    const currentIssueFull = await issueService.getIssueById(id, userId, companyId);
    return res.status(200).json(currentIssueFull);
  }

  const updatedIssue = await issueService.updateIssue(id, req.body, userId, companyId);
  res.status(200).json(updatedIssue);
});

const deleteIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  if (!id) throw new ErrorResponse('Issue ID is required', 400);

  await issueService.deleteIssue(id, userId, companyId);
  res.status(200).json({ id, message: "Issue deleted successfully" });
});

const moveIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sourceColumnId, destinationColumnId, position } = req.body;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  const newPosition = parseInt(position, 10);
  if (!sourceColumnId || !destinationColumnId || isNaN(newPosition)) {
    throw new ErrorResponse('sourceColumnId, destinationColumnId, and a valid numerical position are required', 400);
  }

  const result = await issueService.moveIssue(id, sourceColumnId, destinationColumnId, newPosition, userId, companyId);

  res.status(200).json(result);
});

const searchIssues = asyncHandler(async (req, res) => {
  // This controller is a placeholder. Logic would be in the service.
  res.status(501).json({ success: false, message: 'Search issues logic is pending.' });
});

const getIssueSubtasks = asyncHandler(async (req, res) => {
  const { id: parentIssueId } = req.params;
  const userId = req.user.id;
  const companyId = req.company?.id || null;
  const userCompanyRole = req.userCompanyRole;

  if (!parentIssueId) throw new ErrorResponse('Parent Issue ID is required', 400);

  const subtasks = await issueService.getIssueSubtasks(parentIssueId, userId, companyId, userCompanyRole);
  res.status(200).json({ data: subtasks });
});

export {
  createIssue, getIssueById, updateIssue, deleteIssue, moveIssue,
  searchIssues, getIssueSubtasks,
};
