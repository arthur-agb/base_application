// services/sprint.service.js
import prisma from '../utils/prismaClient.js';
import { SprintStatus } from '@prisma/client';
import ErrorResponse from '../utils/errorResponse.js';
import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import { MomentumActivityModel } from '../models/momentum/MomentumActivity.js';

/**
 * @desc    Helper to check if a user is a member of a project.
 * @param   {object} project - The project object, including its members.
 * @param   {string} userId - The ID of the user.
 * @returns {boolean} True if the user is a member, false otherwise.
 */
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


/**
 * @desc    Creates a new sprint for a project.
 * @param   {object} sprintDetails - Contains all necessary details for sprint creation.
 * @returns {Promise<object>} The newly created sprint object.
 * @throws  {ErrorResponse} If the project is not found or the user is not authorized.
 */
export const createSprint = async ({ projectKey, userId, companyId, title, goal, startDate, endDate }) => {
  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId },
    include: { members: true },
  });

  if (!project || !checkProjectMembership(project, userId)) {
    throw new ErrorResponse('Project not found or you are not authorized to create a sprint.', 403);
  }

  const newSprint = await prisma.momentumSprint.create({
    data: {
      title,
      goal,
      status: SprintStatus.PLANNED,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      project: { connect: { id: project.id } },
    },
    include: { project: { select: { id: true, key: true, name: true } } },
  });

  // Create History Record
  await MomentumHistoryModel.create({
    action: 'CREATE',
    entityType: 'SPRINT',
    entityId: newSprint.id,
    newValue: title,
    userId: userId,
    companyId: companyId,
  });

  // Create Activity Record
  await MomentumActivityModel.create({
    action: 'CREATED_SPRINT',
    details: { sprintTitle: newSprint.title, projectKey: project.key },
    projectId: project.id,
    userId: userId,
  });


  return newSprint;
};

/**
 * @desc    Retrieves all sprints for a given project, with optional status filtering.
 * @param   {object} params - Contains projectKey, userId, companyId, and optional status.
 * @returns {Promise<Array<object>>} A list of sprints.
 */
export const getAllSprintsByProject = async ({ projectKey, userId, companyId, status, userCompanyRole }) => {
  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId },
    include: { members: true },
  });

  if (!project) {
    throw new ErrorResponse('Project not found in this workspace', 404);
  }

  const isMember = checkProjectMembership(project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isCompanyExempt) {
    throw new ErrorResponse('Not authorized to view sprints for this project', 403);
  }

  const filters = { projectId: project.id };
  if (status) {
    filters.status = status;
  }

  const sprints = await prisma.momentumSprint.findMany({
    where: filters,
    include: {
      _count: { select: { issues: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Add issue count to each sprint object
  return sprints.map(sprint => {
    const { _count, ...rest } = sprint;
    return { ...rest, issueCount: _count?.issues ?? 0 };
  });
};

/**
 * @desc    Retrieves a single sprint by its ID.
 * @param   {object} params - Contains sprintId, userId, and companyId.
 * @returns {Promise<object|null>} The requested sprint object or null.
 */
export const getSprintById = async ({ sprintId, userId, companyId, userCompanyRole }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: {
      id: sprintId,
      project: {
        companyId: companyId
      }
    },
    include: {
      project: {
        include: { members: true }
      },
    },
  });

  if (!sprint) {
    throw new ErrorResponse('Sprint not found', 404);
  }

  const isMember = sprint.project && checkProjectMembership(sprint.project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isCompanyExempt) {
    throw new ErrorResponse('Not authorized to access this sprint', 403);
  }

  return sprint;
};


/**
 * @desc    Updates an existing sprint.
 * @param   {object} updateParams - Contains sprintId, userId, companyId, and update data.
 * @returns {Promise<object|null>} The updated sprint object or null.
 */
export const updateSprint = async ({ sprintId, userId, companyId, ...updateData }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: { id: sprintId, project: { companyId } },
    include: { project: { include: { members: true } } },
  });

  if (!sprint || !sprint.project || !checkProjectMembership(sprint.project, userId)) {
    return null;
  }

  const originalSprint = { ...sprint };

  const dataToUpdate = {};
  if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
  if (updateData.goal !== undefined) dataToUpdate.goal = updateData.goal;
  if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
  if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
  if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
  if (updateData.endDate !== undefined) dataToUpdate.endDate = updateData.endDate ? new Date(updateData.endDate) : null;

  if (Object.keys(dataToUpdate).length === 0) {
    return sprint;
  }

  const updatedSprint = await prisma.momentumSprint.update({
    where: { id: sprintId },
    data: dataToUpdate,
  });

  // Create History Records for each change
  const historyPromises = Object.keys(dataToUpdate).map(field => {
    return MomentumHistoryModel.create({
      action: 'UPDATE',
      entityType: 'SPRINT',
      entityId: sprint.id,
      fieldChanged: field,
      oldValue: String(originalSprint[field]),
      newValue: String(updatedSprint[field]),
      userId: userId,
      companyId: companyId,
    });
  });

  await Promise.all(historyPromises);

  return updatedSprint;
};

/**
 * @desc    Deletes a sprint.
 * @param   {object} params - Contains sprintId, userId, userRole, and companyId.
 * @returns {Promise<boolean|null>} True on success, null on failure.
 */
export const deleteSprint = async ({ sprintId, userId, userRole, companyId }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: { id: sprintId, project: { companyId } },
    include: { project: { select: { projectLeadId: true, key: true } } },
  });

  if (!sprint) {
    return null;
  }

  const isLead = sprint.project?.projectLeadId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isLead && !isAdmin) {
    return null;
  }

  await prisma.momentumSprint.delete({
    where: { id: sprintId },
  });

  // Create History Record
  await MomentumHistoryModel.create({
    action: 'DELETE',
    entityType: 'SPRINT',
    entityId: sprintId,
    oldValue: sprint.title,
    userId: userId,
    companyId: companyId,
  });

  // Create Activity Record
  await MomentumActivityModel.create({
    action: 'DELETED_SPRINT',
    details: { sprintTitle: sprint.title, projectKey: sprint.project.key },
    projectId: sprint.projectId,
    userId: userId,
  });

  return true;
};

/**
 * @desc    Retrieves all issues for a specific sprint.
 * @param   {object} params - Contains sprintId, userId, and companyId.
 * @returns {Promise<Array<object>|null>} A list of issues or null.
 */
export const getSprintIssues = async ({ sprintId, userId, companyId, userCompanyRole }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: { id: sprintId, project: { companyId } },
    include: { project: { include: { members: true } } },
  });

  const isMember = sprint && sprint.project && checkProjectMembership(sprint.project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isCompanyExempt) {
    return null;
  }

  return await prisma.momentumIssue.findMany({
    where: { sprintId: sprintId },
    include: {
      reporter: { select: { id: true, displayName: true, avatarUrl: true } },
      assignee: { select: { id: true, displayName: true, avatarUrl: true } },
      column: { select: { id: true, name: true } },
    },
    orderBy: { position: 'asc' },
  });
};

/**
 * @desc    Searches for sprints within a project.
 * @param   {object} params - Contains projectKey, query, userId, and companyId.
 * @returns {Promise<Array<object>>} A list of matching sprints.
 */
export const searchSprints = async ({ projectKey, query, userId, companyId, userCompanyRole }) => {
  if (typeof query !== 'string') {
    return [];
  }

  const project = await prisma.project.findFirst({
    where: { key: projectKey, companyId },
    include: { members: true },
  });

  const isMember = project && checkProjectMembership(project, userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole);

  if (!isMember && !isCompanyExempt) {
    return [];
  }

  // Escape special characters to treat them as literals, not wildcards
  const sanitizedQuery = query.replace(/[\\%_]/g, '\\$&');

  return await prisma.momentumSprint.findMany({
    where: {
      projectId: project.id,
      title: { contains: sanitizedQuery, mode: 'insensitive' },
      status: { in: ['PLANNED', 'ACTIVE'] }
    },
    select: { id: true, title: true },
    take: 15,
  });
};

