// services/epic.service.js

import prisma from '../utils/prismaClient.js';

// Enum Import 
import { HistoryAction, EpicStatus } from '@prisma/client';

import ErrorResponse from '../utils/errorResponse.js';
import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import { MomentumActivityModel } from '../models/momentum/MomentumActivity.js';

// Helper function to check project membership
const checkProjectMembership = (project, userId) => {
  if (!project) {
    return false;
  }

  // Implicitly authorize the project lead (creator/admin)
  if (project.projectLeadId === userId) {
    return true;
  }

  // Check if member exists in the members list
  if (project.members) {
    return project.members.some(member => member && member.userId === userId);
  }

  return false;
};

// @desc    Create a new Epic for a project
export const createEpic = async ({
  title,
  description,
  status,
  ownerUserId,
  startDate,
  endDate,
  projectKey,
  userId,
  companyId,
  userCompanyRole,
  globalRole,
}) => {
  // 1. Resolve and validate project existence in this context
  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId: companyId },
    include: { members: true },
  });

  if (!project) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Project '${projectKey}' not found in ${workspaceName}. Please check your active workspace.`, 404);
  }

  // 2. Authorization check: Project Lead, Project Member, or Company Manager+ or Global Admin
  const isMember = project.members.some(m => m.userId === userId);
  const isLead = project.projectLeadId === userId;
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isMember && !isLead && !isCompanyExempt && !isGlobalAdmin) {
    throw new ErrorResponse('Not authorized to create epics for this project. Requires project membership or administrative role.', 403);
  }

  // 3. Create the epic
  const newEpic = await prisma.momentumEpic.create({
    data: {
      project: { connect: { id: project.id } },
      title,
      description,
      status: status || 'TODO',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      owner: (ownerUserId || userId) ? { connect: { id: ownerUserId || userId } } : undefined,
    },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      project: { select: { id: true, name: true, key: true, companyId: true } },
    }
  });

  await MomentumHistoryModel.create({
    // CHANGED: Use the directly imported enum.
    action: HistoryAction.CREATE,
    entityType: 'EPIC',
    entityId: newEpic.id,
    newValue: title,
    userId: userId,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'CREATED_EPIC',
    details: { epicTitle: newEpic.title, projectKey: project.key },
    projectId: project.id,
    userId: userId,
  });

  return newEpic;
};

/**
 * @desc    Get all Epics for a specific project
 */
export const getAllEpicsByProject = async ({
  projectKey,
  status,
  userId,
  companyId,
  userCompanyRole,
  globalRole,
}) => {
  // 1. Resolve and validate project existence in this context
  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId: companyId },
    include: { members: true },
  });

  if (!project) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Project '${projectKey}' not found in ${workspaceName}.`, 404);
  }

  // 2. Authorization check
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isCompanyExempt && !isGlobalAdmin) {
    const isMember = checkProjectMembership(project, userId);
    if (!isMember) {
      throw new ErrorResponse('Not authorized to view epics for this project', 403);
    }
  }

  // 3. Fetch epics
  const where = { projectId: project.id };
  if (status) {
    where.status = status;
  }

  const epics = await prisma.momentumEpic.findMany({
    where,
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { issues: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const count = await prisma.momentumEpic.count({ where });

  return {
    epics: epics.map(epic => ({
      ...epic,
      issueCount: epic._count?.issues ?? 0,
    })),
    count,
  };
};

/**
 * @desc    Get a single Epic by ID
 */
export const getEpicById = async ({ epicId, userId, companyId, userCompanyRole, globalRole }) => {
  const epic = await prisma.momentumEpic.findFirst({
    where: {
      id: epicId,
      project: { companyId: companyId }
    },
    include: {
      project: { include: { members: true, projectLead: true } },
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  if (!epic) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Epic not found in ${workspaceName}.`, 404);
  }

  // Authorization check
  const isMember = checkProjectMembership(epic.project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    throw new ErrorResponse('Not authorized to access this epic', 403);
  }

  return epic;
};

/**
 * @desc    Update an Epic
 */
export const updateEpic = async ({
  epicId,
  userId,
  companyId,
  userCompanyRole,
  globalRole,
  title,
  description,
  status,
  ownerUserId,
  startDate,
  endDate,
}) => {
  const epic = await prisma.momentumEpic.findFirst({
    where: { id: epicId, project: { companyId: companyId } },
    include: { project: { include: { members: true } } },
  });

  if (!epic || !epic.project) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Epic not found in ${workspaceName}.`, 404);
  }

  // Authorization check
  const isMember = checkProjectMembership(epic.project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    throw new ErrorResponse('Not authorized to update this epic', 403);
  }

  const originalEpic = { ...epic };
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (ownerUserId !== undefined) {
    updateData.owner = ownerUserId ? { connect: { id: ownerUserId } } : { disconnect: true };
  }

  if (status !== undefined) {
    if (!Object.values(EpicStatus).includes(status)) {
      throw new ErrorResponse(`'${status}' is not a valid status.`, 400);
    }
    updateData.status = status;
  }

  if (Object.keys(updateData).length === 0) {
    return epic;
  }

  const updatedEpic = await prisma.momentumEpic.update({
    where: { id: epicId },
    data: updateData,
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      project: { select: { id: true, name: true, key: true, companyId: true } }
    },
  });

  const historyPromises = Object.keys(updateData).map(field => {
    if (String(originalEpic[field]) !== String(updatedEpic[field])) {
      if (field === 'owner') {
        return MomentumHistoryModel.create({
          action: ownerUserId ? HistoryAction.ADD : HistoryAction.REMOVE,
          entityType: 'EPIC',
          entityId: epic.id,
          associatedEntityType: 'USER',
          associatedEntityId: ownerUserId || originalEpic.ownerUserId,
          fieldChanged: 'owner',
          newValue: ownerUserId || null,
          oldValue: originalEpic.ownerUserId || null,
          userId: userId,
          companyId: companyId,
        });
      }
      return MomentumHistoryModel.create({
        action: HistoryAction.UPDATE,
        entityType: 'EPIC',
        entityId: epic.id,
        fieldChanged: field,
        oldValue: String(originalEpic[field]),
        newValue: String(updatedEpic[field]),
        userId: userId,
        companyId: companyId,
      });
    }
    return null;
  }).filter(p => p !== null);

  await Promise.all(historyPromises);

  return updatedEpic;
};

/**
 * @desc    Delete an Epic
 */
export const deleteEpic = async ({ epicId, userId, userRole, companyId, userCompanyRole }) => {
  const epic = await prisma.momentumEpic.findFirst({
    where: { id: epicId, project: { companyId: companyId } },
    include: { project: { select: { projectLeadId: true, key: true }, } },
  });

  if (!epic || !epic.project) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Epic not found in ${workspaceName}.`, 404);
  }

  // Authorization check: Project Lead, Global Admin, or Company ADMIN+
  const isLead = epic.project.projectLeadId === userId;
  const isGlobalAdmin = userRole === 'ADMIN';
  const isCompanyAdmin = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isLead && !isGlobalAdmin && !isCompanyAdmin) {
    throw new ErrorResponse('Not authorized to delete this epic. Requires project lead or administrative role.', 403);
  }

  await prisma.momentumEpic.delete({ where: { id: epicId } });

  await MomentumHistoryModel.create({
    action: HistoryAction.DELETE,
    entityType: 'EPIC',
    entityId: epicId,
    oldValue: epic.title,
    userId: userId,
    companyId: companyId,
  });

  await MomentumActivityModel.create({
    action: 'DELETED_EPIC',
    details: { epicTitle: epic.title, projectKey: epic.project.key },
    projectId: epic.projectId,
    userId: userId,
  });

  return true;
};

/**
 * @desc    Get all issues associated with a specific Epic
 */
export const getEpicIssues = async ({ epicId, userId, companyId, userCompanyRole, globalRole }) => {
  const epic = await prisma.momentumEpic.findFirst({
    where: { id: epicId, project: { companyId: companyId } },
    include: { project: { include: { members: true } } },
  });

  if (!epic) {
    const workspaceName = companyId ? 'the selected company' : 'your personal workspace';
    throw new ErrorResponse(`Epic not found in ${workspaceName}.`, 404);
  }

  // Authorization check
  const isMember = checkProjectMembership(epic.project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    throw new ErrorResponse('Not authorized to view issues for this epic', 403);
  }

  return prisma.momentumIssue.findMany({
    where: { epicId },
    include: {
      reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      assignee: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      column: { select: { id: true, name: true } },
      sprint: { select: { id: true, title: true } },
    },
    orderBy: { position: 'asc' },
  });
};

/**
 * @desc    Search for epics within a project
 */
export const searchEpics = async ({ projectKey, query, userId, companyId, userCompanyRole, globalRole }) => {
  if (typeof query !== 'string') {
    return [];
  }

  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId: companyId },
    include: { members: true },
  });

  if (!project) {
    return [];
  }

  // Authorization check
  const isMember = checkProjectMembership(project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);
  const isGlobalAdmin = globalRole === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    return [];
  }

  const sanitizedQuery = query.replace(/[\\%_]/g, '\\$&');

  return prisma.momentumEpic.findMany({
    where: {
      projectId: project.id,
      title: { contains: sanitizedQuery, mode: 'insensitive' },
    },
    select: { id: true, title: true },
    take: 15,
  });
};