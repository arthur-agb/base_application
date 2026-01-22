// services/board.tenant.service.js

import { PrismaClient, HistoryAction } from '@prisma/client';
import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import { MomentumActivityModel } from '../models/momentum/MomentumActivity.js';
import ErrorResponse from '../utils/errorResponse.js';
import MomentumBoardService from '../models/momentum/MomentumBoard.js';
import MomentumColumn from '../models/momentum/MomentumColumn.js';
import MomentumIssue from '../models/momentum/MomentumIssue.js';
import MomentumProjectMember from '../models/momentum/MomentumProjectMember.js';

const prisma = new PrismaClient();

const includeIssueDetails = {
  reporter: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  assignee: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  column: { select: { id: true, name: true } },
  project: { select: { id: true, name: true, key: true } },
  epic: { select: { id: true, title: true } },
  sprint: { select: { id: true, title: true } },
  parentIssue: { select: { id: true, title: true, type: true } },
};

// Helper function to check project membership
const checkProjectMembership = async (projectId, userId) => {
  const member = await MomentumProjectMember.findByProjectAndUser(projectId, userId);
  return !!member;
};

// Helper function to check if a user is a project lead or admin
const checkProjectLeadOrAdmin = async (projectId, user) => {
  if (user.role === 'ADMIN') {
    return true;
  }
  const project = await prisma.momentumProject.findUnique({
    where: { id: projectId },
    select: { leadId: true },
  });
  return project?.leadId === user.id;
};

// --- Board Operations ---

/**
 * Creates a new board and its default columns.
 * @param {string} projectId - The ID of the project.
 * @param {string} userId - The ID of the user creating the board.
 * @param {string} name - The name of the new board.
 * @param {string} [type='KANBAN'] - The type of board ('KANBAN' or 'scrum').
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The created board and columns.
 */
export const createBoard = async (projectId, userId, name, type = 'KANBAN', companyId) => {
  const isMember = await checkProjectMembership(projectId, userId);
  if (!isMember) {
    throw new Error('Not authorized to create a board for this project');
  }

  const project = await prisma.momentumProject.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Project not found');
  }

  // Company Context Check
  if (project.companyId !== (companyId || null)) {
    throw new Error('Cannot create board for a project outside your current workspace context');
  }

  const newBoard = await MomentumBoardService.createBoard({ projectId, name, type });
  if (!newBoard) {
    throw new Error('Failed to create board');
  }

  // --- History and Activity Logging ---
  await MomentumHistoryModel.create({
    action: HistoryAction.CREATE,
    entityType: 'BOARD',
    entityId: newBoard.id,
    newValue: name,
    userId: userId,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'CREATED_BOARD',
    details: { boardName: newBoard.name, boardType: newBoard.type },
    projectId: projectId,
    userId: userId,
  });
  // --- End Logging ---

  const columnData = [];
  if (type === 'scrum') {
    columnData.push(
      { name: 'Backlog', boardId: newBoard.id, position: 0, category: 'BACKLOG' },
      { name: 'To Do', boardId: newBoard.id, position: 1, category: 'TODO' },
      { name: 'In Progress', boardId: newBoard.id, position: 2, category: 'IN_PROGRESS' },
      { name: 'Review', boardId: newBoard.id, position: 3, category: 'IN_REVIEW' },
      { name: 'Done', boardId: newBoard.id, position: 4, category: 'DONE' }
    );
  } else {
    columnData.push(
      { name: 'To Do', boardId: newBoard.id, position: 0, category: 'TODO' },
      { name: 'In Progress', boardId: newBoard.id, position: 1, category: 'IN_PROGRESS' },
      { name: 'Done', boardId: newBoard.id, position: 2, category: 'DONE' }
    );
  }

  await prisma.momentumColumn.createMany({
    data: columnData,
    skipDuplicates: true,
  });

  const columns = await MomentumColumn.findByBoardId(newBoard.id);

  return { board: newBoard, columns };
};

/**
 * Retrieves a board, its columns, and associated issues and project members.
 * @param {string} boardId - The ID of the board.
 * @param {string} userId - The ID of the user requesting the board.
 * @returns {Promise<object>} The board data including columns, issues, and users.
 */
export const getBoardById = async (boardId, userId, activeCompanyId, userCompanyRole) => {
  // --- MODIFICATION: Call the new, refactored model method ---
  const boardWithDetails = await MomentumBoardService.findBoardByIdWithDetails(boardId);

  if (!boardWithDetails) {
    throw new Error('Board not found');
  }

  // Debug Log
  console.log(`[getBoardById] BoardId: ${boardId}, UserId: ${userId}`);
  console.log(`[getBoardById] Project CompanyId: ${boardWithDetails.project?.companyId}, Active Context: ${activeCompanyId}`);

  // Company Context Check
  // Ensure the board belongs to the company context the user is currently in.
  // If activeCompanyId is null/undefined (Personal Workspace), the board's project companyId must also be null.
  // If activeCompanyId is a string (Company Workspace), the board's project companyId must match it.
  if (boardWithDetails.project.companyId !== (activeCompanyId || null)) {
    console.error(`[getBoardById] Context Mismatch! Expected: ${activeCompanyId || null}, Found: ${boardWithDetails.project.companyId}`);
    throw new ErrorResponse('Board not found in current workspace context', 404);
  }

  // Authorization check
  const isMember = await checkProjectMembership(boardWithDetails.projectId, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isCompanyExempt) {
    throw new ErrorResponse('Not authorized to view this board', 403);
  }

  // Fetch project members separately
  const members = await MomentumProjectMember.findByProject(boardWithDetails.projectId, {
    include: { user: { select: { id: true, email: true, displayName: true, avatarUrl: true } } },
  });
  const users = members.map(member => ({
    ...member.user,
    projectRole: member.role,
  }));

  // Structure the final response object
  return {
    board: {
      id: boardWithDetails.id,
      name: boardWithDetails.name,
      type: boardWithDetails.type,
      projectId: boardWithDetails.projectId,
      projectKey: boardWithDetails.project.key,
      projectName: boardWithDetails.project.name,
      companyId: boardWithDetails.project.companyId,
      leadId: boardWithDetails.project.leadId,
    },
    columns: boardWithDetails.columns,
    users,
  };
};

/**
 * Updates a board's details.
 * @param {string} boardId - The ID of the board to update.
 * @param {string} userId - The ID of the user performing the update.
 * @param {object} updateData - The data to update.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The updated board object.
 */
export const updateBoard = async (boardId, userId, updateData, companyId) => {
  const board = await MomentumBoardService.findBoardById(boardId, {
    includeProject: true,
  });

  if (!board) {
    throw new Error('Board not found');
  }

  // Company Context Check
  if (board.project.companyId !== (companyId || null)) {
    throw new Error('Board not found in current workspace context');
  }

  const isMember = await checkProjectMembership(board.projectId, userId);
  if (!isMember) {
    throw new Error('Not authorized to update this board');
  }

  const originalBoard = { ...board };
  const updatedBoard = await MomentumBoardService.updateBoard(boardId, updateData);

  // --- History Logging for each field changed ---
  const historyPromises = Object.keys(updateData).map(field => {
    return MomentumHistoryModel.create({
      action: HistoryAction.UPDATE,
      entityType: 'BOARD',
      entityId: board.id,
      fieldChanged: field,
      oldValue: String(originalBoard[field]),
      newValue: String(updatedBoard[field]),
      userId: userId,
      companyId: companyId,
    });
  });
  await Promise.all(historyPromises);
  // --- End Logging ---

  return updatedBoard;
};

/**
 * Deletes a board.
 * @param {string} boardId - The ID of the board to delete.
 * @param {object} user - The user object performing the deletion.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The deleted board object.
 */
export const deleteBoard = async (boardId, user, companyId) => {
  const board = await MomentumBoardService.findBoardById(boardId, {
    includeProject: true,
  });

  if (!board) {
    throw new Error('Board not found');
  }

  // Company Context Check
  if (board.project.companyId !== (companyId || null)) {
    throw new Error('Board not found in current workspace context');
  }

  const isAuthorized = await checkProjectLeadOrAdmin(board.projectId, user);
  if (!isAuthorized) {
    throw new Error('Not authorized to delete this board');
  }

  // Check and delete related entities if Prisma cascade is not configured
  const issues = await MomentumIssue.findAll({ projectId: board.projectId });
  if (issues.length > 0) {
    await prisma.momentumIssue.deleteMany({
      where: { projectId: board.projectId }
    });
  }

  const columns = await MomentumColumn.findByBoardId(boardId);
  if (columns.length > 0) {
    await prisma.momentumColumn.deleteMany({
      where: { boardId: boardId }
    });
  }

  const deletedBoard = await MomentumBoardService.deleteBoard(boardId);

  // --- History and Activity Logging ---
  await MomentumHistoryModel.create({
    action: HistoryAction.DELETE,
    entityType: 'BOARD',
    entityId: boardId,
    oldValue: board.name,
    userId: user.id,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'DELETED_BOARD',
    details: { boardName: board.name },
    projectId: board.projectId,
    userId: user.id,
  });
  // --- End Logging ---

  return deletedBoard;
};

// --- Column Operations ---

/**
 * Creates a new column for a board.
 * @param {string} boardId - The ID of the board.
 * @param {string} userId - The ID of the user creating the column.
 * @param {string} name - The name of the new column.
 * @param {number} [limit] - The optional issue limit.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The created column object.
 */
export const createColumn = async (boardId, userId, name, limit, category, width, companyId) => {
  const board = await MomentumBoardService.findBoardById(boardId, {
    includeProject: true,
  });

  if (!board) {
    throw new Error('Board not found');
  }

  // Company Context Check
  if (board.project.companyId !== (companyId || null)) {
    throw new Error('Board not found in current workspace context');
  }

  const isMember = await checkProjectMembership(board.projectId, userId);
  if (!isMember) {
    throw new Error('Not authorized to create a column for this board');
  }

  const highestPositionColumn = await prisma.momentumColumn.findFirst({
    where: { boardId: boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = highestPositionColumn ? highestPositionColumn.position + 1 : 0;

  const newColumn = await MomentumColumn.create({
    boardId,
    name,
    position,
    limit: limit !== undefined ? parseInt(limit, 10) : null,
    category: category || 'TODO', // Default to TODO if not provided
    width: width !== undefined ? parseInt(width, 10) : 300,
  });

  // --- History and Activity Logging ---
  await MomentumHistoryModel.create({
    action: HistoryAction.CREATE,
    entityType: 'COLUMN',
    entityId: newColumn.id,
    newValue: name,
    userId: userId,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'CREATED_COLUMN',
    details: { columnName: newColumn.name, boardName: board.name },
    projectId: board.projectId,
    userId: userId,
  });
  // --- End Logging ---

  return newColumn;
};

/**
 * Updates an existing column.
 * @param {string} columnId - The ID of the column to update.
 * @param {string} userId - The ID of the user performing the update.
 * @param {object} updateData - The data to update.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The updated column object.
 */
export const updateColumn = async (columnId, userId, updateData, companyId) => {
  const column = await MomentumColumn.findById(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  const board = await MomentumBoardService.findBoardById(column.boardId, {
    includeProject: true,
  });
  const isMember = await checkProjectMembership(board.projectId, userId);
  if (!isMember) {
    throw new Error('Not authorized to update this column');
  }

  const originalColumn = { ...column };
  const updatedColumn = await MomentumColumn.update(columnId, updateData);

  // --- History Logging for each field changed ---
  const historyPromises = Object.keys(updateData).map(field => {
    return MomentumHistoryModel.create({
      action: HistoryAction.UPDATE,
      entityType: 'COLUMN',
      entityId: column.id,
      fieldChanged: field,
      oldValue: String(originalColumn[field]),
      newValue: String(updatedColumn[field]),
      userId: userId,
      companyId: companyId,
    });
  });
  await Promise.all(historyPromises);
  // --- End Logging ---

  if (updateData.name && updateData.name !== column.name) {
    // If column name changes, update all issues in that column to have the new status string
    await prisma.momentumIssue.updateMany({
      where: { columnId },
      data: { status: updateData.name },
    });
  }

  if (updateData.category && updateData.category !== column.category) {
    // If column category changes, update all issues in that column to have the new category
    await prisma.momentumIssue.updateMany({
      where: { columnId },
      data: { category: updateData.category },
    });
  }

  return updatedColumn;
};

/**
 * Deletes a column.
 * @param {string} columnId - The ID of the column to delete.
 * @param {string} userId - The ID of the user performing the deletion.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The deleted column's ID.
 */
export const deleteColumn = async (columnId, userId, companyId) => {
  const column = await MomentumColumn.findById(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  const board = await MomentumBoardService.findBoardById(column.boardId, {
    includeProject: true,
  });
  const isMember = await checkProjectMembership(board.projectId, userId);
  if (!isMember) {
    throw new Error('Not authorized to delete this column');
  }

  const issueCount = await prisma.momentumIssue.count({
    where: { columnId },
  });

  if (issueCount > 0) {
    throw new Error('Cannot delete column because it contains issues. Move issues to another column first.');
  }

  await MomentumColumn.delete(columnId);

  // --- History and Activity Logging ---
  await MomentumHistoryModel.create({
    action: HistoryAction.DELETE,
    entityType: 'COLUMN',
    entityId: columnId,
    oldValue: column.name,
    userId: userId,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'DELETED_COLUMN',
    details: { columnName: column.name, boardName: board.name },
    projectId: board.projectId,
    userId: userId,
  });
  // --- End Logging ---

  await prisma.momentumColumn.updateMany({
    where: {
      boardId: column.boardId,
      position: { gt: column.position },
    },
    data: {
      position: { decrement: 1 },
    },
  });

  return { message: 'Column deleted successfully', id: columnId };
};

/**
 * Invites a user to a board by email, adding them to project and company if necessary.
 * @param {string} boardId - The ID of the board.
 * @param {string} email - The email of the user to invite.
 * @param {string} inviterId - The ID of the user sending the invitation.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The invited user object.
 */
/**
 * Invites a user to a board by email, adding them to project and company if necessary.
 * @param {string} boardId - The ID of the board.
 * @param {string} email - The email of the user to invite.
 * @param {string} inviterId - The ID of the user sending the invitation.
 * @param {string} companyId - The ID of the company.
 * @param {string} [role='MEMBER'] - The project role to assign.
 * @returns {Promise<object>} The invited user object.
 */
export const inviteUserToBoard = async (boardId, email, inviterId, companyId, role = 'MEMBER') => {
  // Step 1: Find the user by email
  const userToInvite = await prisma.userMain.findUnique({
    where: { email },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });

  if (!userToInvite) {
    throw new Error('User not found. They must register first.');
  }

  // Step 2: Find the board to get project details and verify context
  const board = await prisma.momentumBoard.findUnique({
    where: { id: boardId },
    select: {
      projectId: true,
      name: true,
      project: {
        select: { companyId: true }
      }
    },
  });

  if (!board || !board.project) {
    throw new Error('Board or project not found.');
  }

  // Company Context Check
  if (board.project.companyId !== (companyId || null)) {
    throw new Error('Board not found in current workspace context');
  }

  const projectId = board.projectId;

  // Step 3: Run memberships updates in a transaction
  await prisma.$transaction(async (tx) => {
    // A. Ensure company membership
    await tx.companyUser.upsert({
      where: {
        companyId_userId: {
          userId: userToInvite.id,
          companyId: companyId,
        },
      },
      update: {}, // No update needed if already exists
      create: {
        userId: userToInvite.id,
        companyId: companyId,
        role: 'MEMBER',
      },
    });

    // B. Ensure project membership
    await tx.momentumProjectMember.upsert({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userToInvite.id,
        },
      },
      update: {
        isActive: true,
        role: role
      },
      create: {
        projectId: projectId,
        userId: userToInvite.id,
        isActive: true,
        role: role
      },
    });

    // C. Ensure board membership
    await tx.momentumBoardMember.upsert({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: userToInvite.id,
        },
      },
      update: { isActive: true },
      create: {
        boardId: boardId,
        userId: userToInvite.id,
        isActive: true,
      },
    });
  });

  // --- Activity Logging ---
  await MomentumActivityModel.create({
    action: 'INVITED_USER_TO_BOARD',
    details: { invitedUser: userToInvite.username, boardName: board.name, role: role },
    projectId: projectId,
    userId: inviterId,
  });
  // --- End Logging ---

  return { user: userToInvite };
};

/**
 * Updates a project member's role.
 * @param {string} projectId - The ID of the project.
 * @param {string} userIdToUpdate - The ID of the user whose role is being updated.
 * @param {string} newRole - The new ProjectMemberRole.
 * @param {string} updaterId - The ID of the user performing the update.
 * @param {string} companyId - The active company context.
 * @returns {Promise<object>} The updated member.
 */
export const updateProjectMemberRole = async (projectId, userIdToUpdate, newRole, updaterId, companyId) => {
  // Authorization: Must be project lead or company admin
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { leadId: true, companyId: true }
  });

  if (!project) throw new ErrorResponse('Project not found', 404);
  if (project.companyId !== companyId) throw new ErrorResponse('Unauthorized context', 403);

  // Simple authorization check for now
  if (project.leadId !== updaterId) {
    // Also check company role via another query if needed, but for now leadId is primary
  }

  const updatedMember = await prisma.momentumProjectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId: userIdToUpdate
      }
    },
    data: { role: newRole }
  });

  // If role is LEAD, update Project.leadId and demote old lead
  if (newRole === 'LEAD') {
    const oldLeadId = project.leadId;

    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { leadId: userIdToUpdate }
      }),
      // Demote old lead to MEMBER if they are in the project
      ...(oldLeadId ? [
        prisma.momentumProjectMember.update({
          where: {
            projectId_userId: {
              projectId,
              userId: oldLeadId
            }
          },
          data: { role: 'MEMBER' }
        })
      ] : [])
    ]);
  }

  return updatedMember;
};

/**
 * Searches for users in the company who are NOT yet in the project.
 * @param {string} projectId - The project to exclude.
 * @param {string} query - The search query.
 * @param {string} companyId - The active company context.
 */
export const searchEligibleProjectMembers = async (projectId, query, companyId) => {
  if (!query || query.length < 2) return [];

  const whereClause = {
    AND: [
      {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      },
      // Only filter by company if we are in a company context
      ...(companyId ? [{
        companies: {
          some: { companyId: companyId }
        }
      }] : []),
      {
        projectMemberships: {
          none: { projectId: projectId }
        }
      }
    ]
  };

  const eligibleUsers = await prisma.userMain.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true
    },
    take: 10
  });

  return eligibleUsers.map(u => ({
    ...u,
    displayName: u.displayName || u.username
  }));
};

/**
 * Allows a user to join a board (and its project/company) by board ID.
 * @param {string} boardId - The ID of the board.
 * @param {string} userId - The ID of the user joining.
 * @returns {Promise<object>} The joined board.
 */
export const joinBoard = async (boardId, userId) => {
  // Step 1: Find the board to get project details
  const board = await prisma.momentumBoard.findUnique({
    where: { id: boardId },
    select: { id: true, projectId: true, name: true, project: { select: { companyId: true } } },
  });

  if (!board) {
    throw new Error('Board not found.');
  }

  const projectId = board.projectId;
  const companyId = board.project.companyId;

  // Step 2: Run memberships updates in a transaction
  await prisma.$transaction(async (tx) => {
    // A. Ensure company membership
    await tx.companyUser.upsert({
      where: {
        companyId_userId: {
          userId: userId,
          companyId: companyId,
        },
      },
      update: {},
      create: {
        userId: userId,
        companyId: companyId,
        role: 'MEMBER',
      },
    });

    // B. Ensure project membership
    await tx.momentumProjectMember.upsert({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId,
        },
      },
      update: { isActive: true },
      create: {
        projectId: projectId,
        userId: userId,
        isActive: true,
      },
    });

    // C. Ensure board membership
    await tx.momentumBoardMember.upsert({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: userId,
        },
      },
      update: { isActive: true },
      create: {
        boardId: boardId,
        userId: userId,
        isActive: true,
      },
    });
  });

  // --- Activity Logging ---
  await MomentumActivityModel.create({
    action: 'JOINED_BOARD',
    details: { boardName: board.name },
    projectId: projectId,
    userId: userId,
  });
  // --- End Logging ---

  return board;
};

export default {
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  inviteUserToBoard,
  joinBoard,
};
