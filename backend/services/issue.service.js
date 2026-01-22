// services/issue.service.js
import prisma from '../utils/prismaClient.js';
import Logger from '../utils/logger.js';
import SocketHandlers from '../utils/socketHandlers.js';
import redisClient from '../utils/redisClient.js';
import ErrorResponse from '../utils/errorResponse.js';

import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import { MomentumActivityModel } from '../models/momentum/MomentumActivity.js';

import { HistoryAction } from '@prisma/client';

// --- Helper function from the old controller, now in the service layer ---
const mapColumnNameToStatus = (columnName) => {
  if (!columnName) return 'TODO';
  switch (columnName.toUpperCase()) {
    case 'TO DO': case 'TODO': return 'TODO';
    case 'IN PROGRESS': return 'IN_PROGRESS';
    case 'DONE': return 'DONE';
    case 'BACKLOG': return 'BACKLOG';
    case 'CLOSED': return 'CLOSED';
    default:
      console.warn(`[Backend Mapping] Unknown column name "${columnName}" for status mapping, defaulting to TODO.`);
      return 'TODO';
  }
};

const includeIssueDetails = {
  reporter: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  assignee: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  column: { select: { id: true, name: true } },
  project: { select: { id: true, name: true, key: true, projectLead: { select: { id: true, username: true, displayName: true } } } },
  epic: { select: { id: true, title: true } },
  sprint: { select: { id: true, title: true } },
  parentIssue: { select: { id: true, title: true, type: true } },
};

// --- Extract business logic from `createIssue` controller function ---
export const createIssue = async (issueData, userId, companyId) => {
  const {
    title, description, type, priority, projectId, columnId, assigneeUserId, labels,
    epicId, sprintId, parentIssueId, storyPoints, dueDate,
  } = issueData;

  // 1. Validation Checks
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: userId },
        select: { userId: true }
      },
      projectLead: { select: { id: true } }
    }
  });

  if (!project) throw new ErrorResponse('Project not found', 404);

  // Company Context Check
  if (project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Cannot create issue for a project outside your current workspace context', 403);
  }

  // Authorization check
  const isMember = project.members.length > 0;
  const isLead = project.projectLead?.id === userId;
  if (!isMember && !isLead) {
    throw new ErrorResponse('Not authorized to create issues in this project', 403);
  }

  const column = await prisma.momentumColumn.findUnique({ where: { id: columnId }, include: { board: { select: { id: true, projectId: true } } } });
  if (!column) throw new ErrorResponse('Column not found', 404);
  if (!column.board || column.board.projectId !== projectId) {
    throw new ErrorResponse('Column does not belong to this project', 400);
  }

  if (column.limit && column.limit > 0) {
    const issueCount = await prisma.momentumIssue.count({ where: { columnId: columnId } });
    if (issueCount >= column.limit) throw new ErrorResponse(`Column '${column.name}' has reached its limit of ${column.limit} issues`, 400);
  }

  if (parentIssueId) {
    const parent = await prisma.momentumIssue.findUnique({ where: { id: parentIssueId } });
    if (!parent) throw new ErrorResponse(`Parent issue with ID ${parentIssueId} not found.`, 404);
    if (parent.projectId !== projectId) throw new ErrorResponse('Parent issue must belong to the same project.', 400);
    if (type === 'SUB_TASK' && parent.type === 'SUB_TASK') throw new ErrorResponse('A sub-task cannot be a parent of another sub-task (nesting level 1).', 400);
  }
  if (epicId) {
    const epic = await prisma.momentumEpic.findUnique({ where: { id: epicId } });
    if (!epic) throw new ErrorResponse(`Epic with ID ${epicId} not found.`, 404);
    if (epic.projectId !== projectId) throw new ErrorResponse('Epic must belong to the same project.', 400);
  }
  if (sprintId) {
    const sprint = await prisma.momentumSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new ErrorResponse(`Sprint with ID ${sprintId} not found.`, 404);
    if (sprint.projectId !== projectId) throw new ErrorResponse('Sprint must belong to the same project.', 400);
  }

  const highestPositionIssue = await prisma.momentumIssue.findFirst({
    where: { columnId: columnId },
    orderBy: { position: 'desc' },
    select: { position: true }
  });

  const position = (highestPositionIssue?.position !== null && highestPositionIssue?.position !== undefined) ? highestPositionIssue.position + 1 : 0;
  const status = issueData.status || column.name;

  const dataToCreate = {
    title: title,
    description: description || null,
    type: type || 'TASK',
    priority: priority || 'MEDIUM',
    status: status,
    category: column.category || 'TODO',
    position: position,
    labels: labels || [],
    storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
    dueDate: dueDate ? new Date(dueDate) : null,
    project: { connect: { id: projectId } },
    column: { connect: { id: columnId } },
    board: { connect: { id: column.board.id } },
    reporter: { connect: { id: userId } },
    ...(assigneeUserId && { assignee: { connect: { id: assigneeUserId } } }),
    ...(epicId && { epic: { connect: { id: epicId } } }),
    ...(sprintId && { sprint: { connect: { id: sprintId } } }),
    ...(parentIssueId && { parentIssue: { connect: { id: parentIssueId } } }),
  };

  // 2. Direct Prisma database interaction
  const newIssue = await prisma.momentumIssue.create({
    data: dataToCreate,
    include: includeIssueDetails
  });

  await MomentumHistoryModel.create({
    action: HistoryAction.CREATE,
    entityType: 'ISSUE',
    entityId: newIssue.id,
    userId: userId,
    companyId: companyId,
    newValue: newIssue.title,
    changes: { initial_status: newIssue.status, type: newIssue.type }
  });

  await MomentumActivityModel.create({
    action: 'CREATED_ISSUE',
    details: { title: newIssue.title, issueKey: `${project.key}-${newIssue.id}` },
    projectId: projectId,
    userId: userId,
  });

  Logger.info(`Issue created: ID ${newIssue.id} in project ${project.key} by user ${userId})`);

  // 3. Redis and Socket.IO interaction
  if (redisClient?.isConnected) {
    try { await redisClient.del(`project:${projectId}:issues`); }
    catch (err) { Logger.error(`Redis DEL error after creating issue ${newIssue.id}:`, err); }
  }

  const allProjectIssues = await prisma.momentumIssue.findMany({
    where: { projectId: projectId }, include: includeIssueDetails,
    orderBy: [{ columnId: 'asc' }, { position: 'asc' }]
  });

  const targetBoardId = column.board.id;
  if (targetBoardId) {
    const payload = {
      boardId: targetBoardId,
      issues: allProjectIssues,
      updatedIssueId: newIssue.id,
      action: 'create',
      actorId: userId
    };
    try {
      SocketHandlers.emitToRoom(`board_${targetBoardId}`, 'board_updated', payload);
      Logger.info(`Emitted 'board_updated' to room 'board_${targetBoardId}' after issue creation`);
    } catch (socketError) {
      Logger.error(`Failed to emit WebSocket event 'board_updated' to room 'board_${targetBoardId}':`, socketError);
    }
  }

  return newIssue;
};

export const getIssueById = async (id, userId, companyId, userCompanyRole) => {
  const cacheKey = `issue:${id}:details`;
  // ... Redis fetching logic (unchanged) ...

  const issue = await prisma.momentumIssue.findUnique({
    where: { id: id },
    include: {
      ...includeIssueDetails,
      comments: {
        include: {
          author: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' }
      },
      project: {
        select: {
          id: true,
          name: true,
          key: true,
          companyId: true,
          projectLead: {
            select: {
              id: true,
              displayName: true,
              username: true,
            }
          },
          members: {
            where: { userId: userId },
            select: { userId: true }
          }
        }
      },
      subTasks: { include: includeIssueDetails, orderBy: { position: 'asc' } }
    }
  });

  if (!issue) throw new ErrorResponse('Issue not found', 404);

  // Company Context Check
  if (issue.project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Issue not found in current workspace context', 404);
  }

  const isProjectLead = issue.project.projectLead?.id === userId;
  const isMember = issue.project.members.length > 0;
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isProjectLead && !isCompanyExempt) {
    throw new ErrorResponse('Not authorized to view this issue', 403);
  }

  const histories = await prisma.momentumHistory.findMany({
    where: {
      entityType: 'ISSUE',
      entityId: id,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const issueResponse = {
    ...issue,
    project: {
      id: issue.project.id,
      name: issue.project.name,
      key: issue.project.key,
      // FIXED: Changed to use the correct property name
      projectLead: issue.project.projectLead
    },
    histories: histories,
  };

  if (redisClient?.isConnected) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(issueResponse), 'EX', 3600);
      Logger.info(`Cached issue details: ${cacheKey}`);
    } catch (err) {
      Logger.error(`Redis SET error for ${cacheKey}:`, err);
    }
  }
  return issueResponse;
};

// --- Extract business logic from `updateIssue` controller function ---
export const updateIssue = async (id, updateFields, userId, companyId) => {
  const issue = await prisma.momentumIssue.findUnique({
    where: { id: id },
    include: {
      project: { select: { id: true, key: true, projectLeadId: true, companyId: true, members: { where: { userId: userId }, select: { userId: true } } } },
      column: { include: { board: { select: { id: true } } } },
      epic: { select: { id: true } }, sprint: { select: { id: true } }, parentIssue: { select: { id: true } }
    }
  });

  if (!issue) throw new ErrorResponse('Issue not found', 404);

  // Company Context Check
  if (issue.project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Issue not found in current workspace context', 404);
  }
  const isProjectLead = issue.project.projectLeadId === userId;
  const isMember = issue.project.members.length > 0;
  if (!isMember && !isProjectLead) throw new ErrorResponse('Not authorized to update this issue', 403);

  const dataToUpdate = {};
  const changes = [];

  const addChange = (field, oldValue, newValue) => {
    if (newValue === undefined) return;
    const actualNewValue = newValue === null ? null : newValue;
    let isValueChanged = false;

    if (field === 'labels') {
      const sortedOld = Array.isArray(oldValue) ? [...oldValue].sort() : [];
      const sortedNew = Array.isArray(actualNewValue) ? [...actualNewValue].sort() : [];
      isValueChanged = JSON.stringify(sortedOld) !== JSON.stringify(sortedNew);
    } else if (field === 'storyPoints') {
      isValueChanged = oldValue !== (actualNewValue !== null ? parseInt(actualNewValue, 10) : null);
    } else if (field === 'dueDate') {
      const oldDateStr = oldValue ? new Date(oldValue).toISOString() : null;
      const newDateStr = actualNewValue ? new Date(actualNewValue).toISOString() : null;
      isValueChanged = oldDateStr !== newDateStr;
    } else {
      isValueChanged = oldValue !== actualNewValue;
    }

    if (isValueChanged) {
      dataToUpdate[field] = actualNewValue;
      if (field === 'storyPoints' && actualNewValue !== null) dataToUpdate[field] = parseInt(actualNewValue, 10);
      if (field === 'dueDate' && actualNewValue !== null) dataToUpdate[field] = new Date(actualNewValue);

      changes.push({
        action: HistoryAction.UPDATE,
        entityType: 'ISSUE',
        entityId: id,
        userId: userId,
        companyId: companyId,
        fieldChanged: field,
        oldValue: String(oldValue),
        newValue: String(actualNewValue),
      });
    }
  };

  addChange('title', issue.title, updateFields.title);
  addChange('description', issue.description, updateFields.description);
  addChange('type', issue.type, updateFields.type);
  addChange('priority', issue.priority, updateFields.priority);
  addChange('assigneeUserId', issue.assigneeUserId, updateFields.assigneeUserId);
  addChange('labels', issue.labels, updateFields.labels);
  addChange('dueDate', issue.dueDate, updateFields.dueDate);
  addChange('epicId', issue.epicId, updateFields.epicId);
  addChange('sprintId', issue.sprintId, updateFields.sprintId);
  addChange('parentIssueId', issue.parentIssueId, updateFields.parentIssueId);
  addChange('storyPoints', issue.storyPoints, updateFields.storyPoints);

  if (dataToUpdate.parentIssueId && dataToUpdate.parentIssueId !== issue.parentIssueId) {
    if (dataToUpdate.parentIssueId === id) throw new ErrorResponse('An issue cannot be its own parent.', 400);
    const parent = await prisma.momentumIssue.findUnique({ where: { id: dataToUpdate.parentIssueId } });
    if (!parent) throw new ErrorResponse(`Parent issue with ID ${dataToUpdate.parentIssueId} not found.`, 404);
    if (parent.projectId !== issue.projectId) throw new ErrorResponse('Parent issue must belong to the same project.', 400);
    if (dataToUpdate.type === 'SUB_TASK' && parent.type === 'SUB_TASK') throw new ErrorResponse('A sub-task cannot be a parent of another sub-task.', 400);
  }
  if (dataToUpdate.epicId && dataToUpdate.epicId !== issue.epicId) {
    const epicToLink = await prisma.momentumEpic.findUnique({ where: { id: dataToUpdate.epicId } });
    if (!epicToLink) throw new ErrorResponse(`Epic with ID ${dataToUpdate.epicId} not found.`, 404);
    if (epicToLink.projectId !== issue.projectId) throw new ErrorResponse('Epic must belong to the same project.', 400);
  }
  if (dataToUpdate.sprintId && dataToUpdate.sprintId !== issue.sprintId) {
    const sprintToLink = await prisma.momentumSprint.findUnique({ where: { id: dataToUpdate.sprintId } });
    if (!sprintToLink) throw new ErrorResponse(`Sprint with ID ${dataToUpdate.sprintId} not found.`, 404);
    if (sprintToLink.projectId !== issue.projectId) throw new ErrorResponse('Sprint must belong to the same project.', 400);
  }

  let oldColumnId = issue.columnId;
  let newColumnIdProvided = updateFields.columnId;
  let oldStatus = issue.status;

  if (newColumnIdProvided !== undefined && newColumnIdProvided !== oldColumnId) {
    const newCol = await prisma.momentumColumn.findUnique({ where: { id: newColumnIdProvided }, include: { board: { select: { id: true, projectId: true } } } });
    if (!newCol) throw new ErrorResponse('New column not found', 404);
    if (!newCol.board || newCol.board.projectId !== issue.projectId) throw new ErrorResponse('Cannot move issue to a column in a different project', 400);
    if (newCol.limit && newCol.limit > 0) {
      const issueCountInNewCol = await prisma.momentumIssue.count({ where: { columnId: newColumnIdProvided, NOT: { id: id } } });
      if (issueCountInNewCol >= newCol.limit) {
        throw new ErrorResponse(`Column '${newCol.name}' has reached its limit of ${newCol.limit} issues`, 400);
      }
    }
    addChange('columnId', oldColumnId, newColumnIdProvided);
    const newStatus = newCol.name;
    const newCategory = newCol.category;

    if (newStatus !== oldStatus) {
      addChange('status', oldStatus, newStatus);
    }
    // Always update category when moving columns
    dataToUpdate.category = newCategory;
  }

  let updatedIssueResult;
  if (Object.keys(dataToUpdate).length > 0) {
    await prisma.$transaction(async (tx) => {
      updatedIssueResult = await tx.momentumIssue.update({ where: { id: id }, data: dataToUpdate, include: includeIssueDetails });
      if (changes.length > 0) {
        await tx.momentumHistory.createMany({ data: changes });
      }
    });
    Logger.info(`Issue updated: ID ${updatedIssueResult.id} by user ${userId}. Changes: ${changes.map(c => c.fieldChanged).join(', ')}`);

    if (redisClient?.isConnected) {
      try {
        await redisClient.del(`issue:${id}:details`);
        await redisClient.del(`project:${issue.projectId}:issues`);
        if (dataToUpdate.parentIssueId || issue.parentIssueId) {
          await redisClient.del(`issue:${dataToUpdate.parentIssueId || issue.parentIssueId}:subtasks`);
        }
      } catch (err) {
        Logger.error(`Redis DEL error after updating issue ${id}:`, err);
      }
    }

    const allProjectIssues = await prisma.momentumIssue.findMany({
      where: { projectId: issue.projectId }, include: includeIssueDetails,
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }]
    });

    const boardIdToEmit = (await prisma.momentumColumn.findUnique({ where: { id: updatedIssueResult.columnId }, select: { boardId: true } }))?.boardId;
    if (boardIdToEmit) {
      const payload = {
        boardId: boardIdToEmit,
        issues: allProjectIssues,
        updatedIssueId: updatedIssueResult.id,
        action: 'update',
        actorId: userId
      };
      try {
        SocketHandlers.emitToRoom(`board_${boardIdToEmit}`, 'board_updated', payload);
        Logger.info(`Emitted 'board_updated' to room 'board_${boardIdToEmit}' after issue update`);
      } catch (socketError) {
        Logger.error(`Failed to emit WebSocket event 'board_updated' to room 'board_${boardIdToEmit}':`, socketError);
      }
    }
  } else {
    Logger.info(`Issue update requested for ID ${id} but no actual field values changed.`);
    updatedIssueResult = await prisma.momentumIssue.findUnique({ where: { id }, include: includeIssueDetails });
  }

  return updatedIssueResult;
};

// --- Extract business logic from `deleteIssue` controller function ---
export const deleteIssue = async (id, userId, companyId) => {
  const issue = await prisma.momentumIssue.findUnique({
    where: { id: id },
    include: {
      project: { select: { id: true, key: true, projectLeadId: true, companyId: true } },
      column: { include: { board: { select: { id: true } } } },
      subTasks: { select: { id: true } }
    }
  });

  if (!issue) throw new ErrorResponse('Issue not found', 404);

  // Company Context Check
  if (issue.project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Issue not found in current workspace context', 404);
  }

  if (issue.subTasks && issue.subTasks.length > 0) {
    throw new ErrorResponse(`Cannot delete issue ${id} as it has ${issue.subTasks.length} sub-task(s). Resolve sub-tasks first.`, 400);
  }

  const isAdmin = false; // Placeholder
  const isProjectLead = issue.project.projectLeadId === userId;
  const isReporter = issue.reporterUserId === userId;
  if (!(isAdmin || isProjectLead || isReporter)) {
    throw new ErrorResponse('Not authorized to delete this issue', 403);
  }

  const { columnId, position, projectId, parentIssueId } = issue;
  const targetBoardId = issue.column?.board?.id;
  // companyId is now from function parameter, not redeclared

  try {
    await prisma.$transaction(async (tx) => {

      await tx.momentumHistory.create({
        data: {
          action: HistoryAction.DELETE,
          entityType: 'ISSUE',
          entityId: id,
          userId: userId,
          companyId: companyId,
          oldValue: issue.title,
          changes: { full_issue_title: issue.title, issue_key: `${issue.project.key}-${issue.id}` }
        }
      });

      await MomentumActivityModel.create({
        action: 'DELETED_ISSUE',
        details: { title: issue.title, issueKey: `${issue.project.key}-${issue.id}` },
        projectId: projectId,
        userId: userId,
      });

      await tx.momentumIssue.delete({ where: { id: id } });
      if (position !== null && position !== undefined && columnId) {
        await tx.momentumIssue.updateMany({ where: { columnId: columnId, position: { gt: position } }, data: { position: { decrement: 1 } } });
      }
    });
    Logger.info(`Issue deleted: ID ${id} from project ${projectId} by user ${userId}.`);

    if (redisClient?.isConnected) {
      try {
        await redisClient.del(`issue:${id}:details`);
        await redisClient.del(`project:${projectId}:issues`);
        if (parentIssueId) {
          await redisClient.del(`issue:${parentIssueId}:subtasks`);
          await redisClient.del(`issue:${parentIssueId}:details`);
        }
      } catch (err) {
        Logger.error(`Redis DEL error after deleting issue ${id}:`, err);
      }
    }

    const allProjectIssues = await prisma.momentumIssue.findMany({
      where: { projectId: projectId }, include: includeIssueDetails,
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }]
    });

    if (targetBoardId) {
      const payload = {
        boardId: targetBoardId,
        issues: allProjectIssues,
        deletedIssueId: id,
        action: 'delete',
        actorId: userId
      };
      try {
        SocketHandlers.emitToRoom(`board_${targetBoardId}`, 'board_updated', payload);
        Logger.info(`Emitted 'board_updated' to room 'board_${targetBoardId}' after issue deletion`);
      } catch (socketError) {
        Logger.error(`Failed to emit WebSocket event 'board_updated' to room 'board_${targetBoardId}':`, socketError);
      }
    } else {
      Logger.warn(`Could not determine target board ID for WebSocket emission after deleting issue ${id}`);
    }
  } catch (error) {
    Logger.error(`Error deleting issue ${id}:`, error);
    if (error.code) {
      throw new ErrorResponse(`Database error during delete: ${error.message}`, 500);
    }
    throw new ErrorResponse(error.message || 'Failed to delete issue', error.statusCode || 500);
  }
};

// --- Extract business logic from `moveIssue` controller function ---
export const moveIssue = async (id, sourceColumnId, destinationColumnId, newPosition, userId, companyId) => {
  if (newPosition < 0) {
    throw new ErrorResponse('Position cannot be negative', 400);
  }

  // Fetch necessary data in parallel for efficiency
  const [issueToMove, destColumn, sourceCol] = await Promise.all([
    prisma.momentumIssue.findUnique({
      where: { id },
      include: { project: { select: { id: true, key: true, name: true, projectLeadId: true, companyId: true, members: { where: { userId: userId }, select: { userId: true } } } } }
    }),
    prisma.momentumColumn.findUnique({ where: { id: destinationColumnId }, include: { board: { select: { id: true, projectId: true } } } }),
    prisma.momentumColumn.findUnique({ where: { id: sourceColumnId }, include: { board: { select: { id: true, projectId: true } } } })
  ]);

  // Validation checks
  if (!issueToMove) throw new ErrorResponse(`Issue with ID ${id} not found`, 404);

  // Company Context Check
  if (issueToMove.project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Cannot move issue in a different workspace context', 403);
  }

  if (!destColumn) throw new ErrorResponse(`Destination column with ID ${destinationColumnId} not found`, 404);
  if (!sourceCol) throw new ErrorResponse(`Source column with ID ${sourceColumnId} not found`, 404);

  if (issueToMove.project.id !== destColumn.board.projectId || issueToMove.project.id !== sourceCol.board.projectId) {
    throw new ErrorResponse('Issue, source column, and destination column must belong to the same project', 400);
  }

  const isProjectLead = issueToMove.project.projectLeadId === userId;
  const isMember = issueToMove.project.members.length > 0;
  if (!isMember && !isProjectLead) {
    throw new ErrorResponse('Not authorized to move this issue', 403);
  }

  // Check column issue limits (UNCHANGED)
  if (sourceColumnId !== destinationColumnId && destColumn.limit && destColumn.limit > 0) {
    const issueCountInDestCol = await prisma.momentumIssue.count({ where: { columnId: destinationColumnId } });
    if (issueToMove.columnId !== destinationColumnId && issueCountInDestCol >= destColumn.limit) {
      throw new ErrorResponse(`Destination column '${destColumn.name}' limit (${destColumn.limit}) reached`, 400);
    }
  }

  // Define essential variables from the fetched issue
  const oldColumnId = issueToMove.columnId; // <--- Defined here
  const oldPosition = issueToMove.position; // <--- Defined here
  const currentIssue = issueToMove;         // <--- Defined here (used for old status)
  const targetBoardId = destColumn.board.id;
  const projectId = issueToMove.project.id;

  // 🐛 FIX: Wrap the complex database logic in a Prisma transaction
  // 🐛 FIX: Wrap the complex database logic in a Prisma transaction
  try {
    const historyChanges = [];

    await prisma.$transaction(async (tx) => {
      const currentIssue = await tx.momentumIssue.findUnique({ where: { id } });
      const oldPosition = currentIssue.position;
      const oldColumnId = currentIssue.columnId;

      // Logic for moving within the same column
      if (destinationColumnId === oldColumnId) {
        if (oldPosition === newPosition) return; // No change needed

        if (oldPosition === null || oldPosition === undefined) {
          // Safe Fallback: Issue had no position, so just insert it at the new spot
          await tx.momentumIssue.updateMany({
            where: { columnId: oldColumnId, position: { gte: newPosition } },
            data: { position: { increment: 1 } }
          });
        } else if (oldPosition < newPosition) {
          // Moving down: Decrement positions of issues between old and new position
          await tx.momentumIssue.updateMany({
            where: { columnId: oldColumnId, position: { lte: newPosition, gt: oldPosition } },
            data: { position: { decrement: 1 } }
          });
        } else {
          // Moving up: Increment positions of issues between new and old position
          // Note: 'lt: oldPosition' avoids colliding with the old position of the moving item, though effectively it doesn't matter since we overwrite it.
          await tx.momentumIssue.updateMany({
            where: { columnId: oldColumnId, position: { gte: newPosition, lt: oldPosition } },
            data: { position: { increment: 1 } }
          });
        }
        // Update the moved issue's position
        await tx.momentumIssue.update({ where: { id: id }, data: { position: newPosition } });
      } else {
        // Logic for moving to a different column
        const newStatus = destColumn.name;
        const newCategory = destColumn.category;

        // 1. Remove from Old Column: Decrement positions below the old position
        // GUARD: Only attempt to decrement if the old position was valid.
        if (oldPosition !== null && oldPosition !== undefined) {
          await tx.momentumIssue.updateMany({
            where: { columnId: oldColumnId, position: { gt: oldPosition } },
            data: { position: { decrement: 1 } }
          });
        }

        // 2. Insert into New Column: Increment positions at or below the new position
        await tx.momentumIssue.updateMany({
          where: { columnId: destinationColumnId, position: { gte: newPosition } },
          data: { position: { increment: 1 } }
        });

        // 3. Update the moved issue's column, position, status, and category
        await tx.momentumIssue.update({
          where: { id: id },
          data: {
            columnId: destinationColumnId,
            position: newPosition,
            status: newStatus,
            category: newCategory
          }
        });

        // Record history for the column move
        historyChanges.push({
          action: HistoryAction.MOVE,
          entityType: 'ISSUE',
          entityId: id,
          userId, companyId,
          fieldChanged: 'columnId',
          oldValue: String(oldColumnId),
          newValue: String(destinationColumnId),
          changes: { from_column: sourceCol.name, to_column: destColumn.name }
        });

        if (newStatus !== currentIssue.status) {
          historyChanges.push({
            action: HistoryAction.UPDATE,
            entityType: 'ISSUE',
            entityId: id,
            userId, companyId,
            fieldChanged: 'status',
            oldValue: String(currentIssue.status),
            newValue: String(newStatus)
          });
        }
      }

      // Create history records
      if (historyChanges.length > 0) {
        await tx.momentumHistory.createMany({ data: historyChanges });
      }
    });

    Logger.info(`Transaction for move issue ${id} completed successfully.`);

    // Clear relevant caches (UNCHANGED)
    if (redisClient?.isConnected) {
      try {
        await redisClient.del(`issue:${id}:details`);
        await redisClient.del(`project:${issueToMove.projectId}:issues`);
        if (sourceColumnId !== destinationColumnId) {
          // If moved between columns, both might need clearing if caches were more granular
          // But usually project-level cache covers it.
        }
      } catch (err) {
        Logger.error(`Redis DEL error after moving issue ${id}:`, err);
      }
    }

    // Refetch all issues for the WebSocket broadcast to other clients (UNCHANGED)
    const allProjectIssues = await prisma.momentumIssue.findMany({
      where: { projectId: issueToMove.projectId },
      include: includeIssueDetails,
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }]
    });

    // Emit WebSocket event to update other clients in real-time (UNCHANGED)
    if (targetBoardId) {
      const optimisticVersion = Date.now(); // Monotonic version for optimistic sync
      const payload = {
        boardId: targetBoardId,
        issues: allProjectIssues,
        movedIssueId: id,
        action: 'move',
        actorId: userId, // Include actor ID to prevent self-refetching on frontend
        optimisticVersion, // New field for versioning
      };
      SocketHandlers.emitToRoom(`board_${targetBoardId}`, 'board_updated', payload);
      Logger.info(`Emitted 'board_updated' to room 'board_${targetBoardId}' after issue move`);
    } else {
      Logger.warn(`Could not determine target board ID for WebSocket emission for moved issue ${id}`);
    }

    return { success: true, message: "Issue moved successfully." };

  } catch (error) { // The outer catch block
    Logger.error(`Error moving issue ${id}:`, error);
    if (error.code) {
      throw new ErrorResponse(`Database error during move: ${error.message}`, 500);
    }
    throw new ErrorResponse(error.message || 'Failed to move issue', error.statusCode || 500);
  }
};

// --- Extract business logic from `getIssueSubtasks` controller function ---
export const getIssueSubtasks = async (parentIssueId, userId, companyId, userCompanyRole) => {
  const parentIssue = await prisma.momentumIssue.findUnique({
    where: { id: parentIssueId },
    select: { id: true, projectId: true, project: { select: { projectLeadId: true, companyId: true, members: { where: { userId: userId }, select: { userId: true } } } } }
  });

  if (!parentIssue) throw new ErrorResponse('Parent issue not found', 404);

  // Company Context Check
  if (parentIssue.project.companyId !== (companyId || null)) {
    throw new ErrorResponse('Parent issue not found in current workspace context', 404);
  }

  const isProjectLead = parentIssue.project.projectLeadId === userId;
  const isMember = parentIssue.project.members.length > 0;
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isProjectLead && !isCompanyExempt) {
    throw new ErrorResponse('Not authorized to view sub-tasks for this issue', 403);
  }

  const cacheKey = `issue:${parentIssueId}:subtasks`;
  if (redisClient?.isConnected) {
    try {
      const cachedSubtasks = await redisClient.get(cacheKey);
      if (cachedSubtasks) {
        Logger.info(`Cache hit for subtasks: ${cacheKey}`);
        return JSON.parse(cachedSubtasks);
      }
      Logger.info(`Cache miss for subtasks: ${cacheKey}`);
    } catch (err) {
      Logger.error(`Redis GET error for ${cacheKey}:`, err);
    }
  }

  const subtasks = await prisma.momentumIssue.findMany({
    where: { parentIssueId: parentIssueId },
    include: includeIssueDetails,
    orderBy: { position: 'asc' }
  });

  if (redisClient?.isConnected && subtasks) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(subtasks), 'EX', 3600);
      Logger.info(`Cached subtasks: ${cacheKey}`);
    } catch (err) {
      Logger.error(`Redis SET error for ${cacheKey}:`, err);
    }
  }
  return subtasks;
};