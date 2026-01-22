// controllers/board.tenant.controller.js

import asyncHandler from 'express-async-handler';
import * as boardTenantService from '../services/board.tenant.service.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create a new board for a project
// @route   POST /api/projects/:projectId/boards
// @access  Private (Requires project membership)
export const createBoard = asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const { projectId } = req.params;
  const userId = req.user.id;

  if (!projectId || !name) {
    res.status(400);
    throw new ErrorResponse('Project ID and board name are required.', 400);
  }

  const { board, columns } = await boardTenantService.createBoard(projectId, userId, name, type);

  res.status(201).json({
    board,
    columnsCreated: columns.length,
  });
});

// @desc    Get a board by ID with columns and associated issues
// @route   GET /api/boards/:id
// @access  Private (Requires project membership)
export const getBoardById = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const userId = req.user.id;
  // Use the established company context from tenantContext middleware
  const activeCompanyId = req.company?.id || null;
  const userCompanyRole = req.userCompanyRole;

  const data = await boardTenantService.getBoardById(boardId, userId, activeCompanyId, userCompanyRole);

  res.status(200).json(data);
});

// @desc    Update a board's details (e.g., name, type)
// @route   PUT /api/boards/:id
// @access  Private (Requires project membership)
export const updateBoard = asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const boardId = req.params.id;
  const userId = req.user.id;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No update data provided' });
  }

  const updatedBoard = await boardTenantService.updateBoard(boardId, userId, updateData);

  res.status(200).json(updatedBoard);
});

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private (Requires project lead or admin role)
export const deleteBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const user = req.user;

  await boardTenantService.deleteBoard(boardId, user);

  res.status(200).json({ message: 'Board removed successfully' });
});

// @desc    Create a new column for a board
// @route   POST /api/boards/:boardId/columns
// @access  Private (Requires project membership)
export const createColumn = asyncHandler(async (req, res) => {
  const { name, limit, category, width } = req.body;
  const boardId = req.params.id;
  const userId = req.user.id;

  if (!boardId || !name) {
    res.status(400);
    throw new ErrorResponse('Board ID and column name are required.', 400);
  }

  const column = await boardTenantService.createColumn(boardId, userId, name, limit, category, width, req.user.companyId);

  res.status(201).json(column);
});

// @desc    Update a column's details (name, limit)
// @route   PUT /api/columns/:id
// @access  Private (Requires project membership)
export const updateColumn = asyncHandler(async (req, res) => {
  const { name, limit, category, position, width, isMinimized } = req.body;
  const columnId = req.params.id;
  const userId = req.user.id;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (limit !== undefined) updateData.limit = limit;
  if (category !== undefined) updateData.category = category;
  if (position !== undefined) updateData.position = position;
  if (width !== undefined) updateData.width = width;
  if (isMinimized !== undefined) updateData.isMinimized = isMinimized;

  const updatedColumn = await boardTenantService.updateColumn(columnId, userId, updateData, req.user.companyId);

  res.status(200).json(updatedColumn);
});

// @desc    Delete a column
// @route   DELETE /api/columns/:id
// @access  Private (Requires project membership)
export const deleteColumn = asyncHandler(async (req, res) => {
  const columnId = req.params.id;
  const userId = req.user.id;

  const result = await boardTenantService.deleteColumn(columnId, userId, req.user.companyId);

  res.status(200).json(result);
});

// @desc    Invite a user to a board by email
// @route   POST /api/boards/:id/invite
// @access  Private (Requires project membership)
export const inviteUserToBoard = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const boardId = req.params.id;
  const inviterId = req.user.id;
  const companyId = req.company?.id || null;

  if (!email) {
    res.status(400);
    throw new ErrorResponse('Email address is required.', 400);
  }

  const result = await boardTenantService.inviteUserToBoard(boardId, email, inviterId, companyId, role);

  res.status(200).json({
    message: `Successfully invited ${result.user.displayName || result.user.username} to the board.`,
    user: result.user,
  });
});

// @desc    Update project member role
// @route   PUT /api/boards/:id/members/:userId/role
// @access  Private (Requires project lead)
export const updateProjectMemberRole = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { userId } = req.params;
  const { role } = req.body;
  const updaterId = req.user.id;
  const companyId = req.company?.id || null;

  // Get board to find projectId
  const board = await boardTenantService.getBoardById(boardId, updaterId, companyId, req.userCompanyRole);
  const projectId = board.board.projectId;

  const result = await boardTenantService.updateProjectMemberRole(projectId, userId, role, updaterId, companyId);
  res.status(200).json(result);
});

// @desc    Search eligible company users to invite to project
// @route   GET /api/boards/:id/eligible-users
// @access  Private
export const searchEligibleProjectMembers = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { query } = req.query;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  // Get board to find projectId
  const board = await boardTenantService.getBoardById(boardId, userId, companyId, req.userCompanyRole);
  const projectId = board.board.projectId;

  const users = await boardTenantService.searchEligibleProjectMembers(projectId, query, companyId);
  res.status(200).json(users);
});

// @desc    Join a board by ID (for link sharing)
// @route   POST /api/boards/:id/join
// @access  Private (Authenticated users)
export const joinBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const userId = req.user.id;

  const board = await boardTenantService.joinBoard(boardId, userId);

  res.status(200).json({
    message: `You have successfully joined the board: ${board.name}`,
    boardId: board.id,
  });
});
