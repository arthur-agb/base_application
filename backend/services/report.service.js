// services/report.service.js
import prisma from '../utils/prismaClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';

// Define statuses considered "completed" for reporting
const COMPLETED_ISSUE_STATUSES = ['DONE', 'CLOSED'];
const IN_PROGRESS_ISSUE_STATUSES = ['IN_PROGRESS'];
const OPEN_ISSUE_STATUSES = ['TODO', 'BACKLOG'];

/**
 * @description Helper function to check if a user has access to a project within a company.
 * @param {string} projectId The ID of the project.
 * @param {string} userId The ID of the user.
 * @param {string} companyId The ID of the company.
 * @returns {Promise<object>} The project object if access is granted.
 * @throws {ErrorResponse} If the project is not found or the user is not authorized.
 */
export const checkProjectAccess = async (projectId, userId, companyId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId: companyId,
    },
    include: {
      members: { where: { userId: userId }, select: { userId: true } },
      projectLead: { select: { id: true } },
    },
  });
  if (!project) {
    throw new ErrorResponse('Project not found', 404);
  }
  if (project.projectLead?.id !== userId && project.members.length === 0) {
    throw new ErrorResponse('Not authorized to access reports for this project', 403);
  }
  return project;
};

/**
 * @service getSprintSummaryReport
 * @description Fetches data and generates a summary report for a specific sprint.
 * @param {object} params
 * @param {string} params.sprintId The ID of the sprint.
 * @param {string} params.userId The ID of the user requesting the report.
 * @param {string} params.companyId The ID of the company.
 * @returns {Promise<object>} The formatted sprint summary report.
 * @throws {ErrorResponse} If the sprint is not found or the user has no access.
 */
export const getSprintSummaryReport = async ({ sprintId, userId, companyId }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: {
      id: sprintId,
      project: {
        companyId: companyId,
      },
    },
    include: {
      project: { select: { id: true } },
      issues: {
        select: {
          status: true,
          type: true,
          storyPoints: true,
        },
      },
    },
  });

  if (!sprint) {
    throw new ErrorResponse('Sprint not found', 404);
  }

  // Business logic: check access to the sprint's project
  await checkProjectAccess(sprint.projectId, userId, companyId);

  const issuesTotal = sprint.issues.length;
  let issuesCompleted = 0;
  let storyPointsTotal = 0;
  let storyPointsCompleted = 0;
  const issuesByStatus = {};
  const issuesByType = {};

  sprint.issues.forEach(issue => {
    if (typeof issue.storyPoints === 'number') {
      storyPointsTotal += issue.storyPoints;
      if (COMPLETED_ISSUE_STATUSES.includes(issue.status?.toUpperCase())) {
        storyPointsCompleted += issue.storyPoints;
      }
    }

    if (COMPLETED_ISSUE_STATUSES.includes(issue.status?.toUpperCase())) {
      issuesCompleted++;
    }

    const statusKey = issue.status || 'UNDEFINED';
    issuesByStatus[statusKey] = (issuesByStatus[statusKey] || 0) + 1;

    const typeKey = issue.type || 'UNDEFINED';
    issuesByType[typeKey] = (issuesByType[typeKey] || 0) + 1;
  });

  return {
    sprintDetails: {
      id: sprint.id,
      title: sprint.title,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
    },
    issuesTotal,
    issuesCompleted,
    storyPointsTotal,
    storyPointsCompleted,
    issuesByStatus,
    issuesByType,
  };
};

/**
 * @service getEpicProgressReport
 * @description Fetches data and generates a progress report for a specific epic.
 * @param {object} params
 * @param {string} params.epicId The ID of the epic.
 * @param {string} params.userId The ID of the user requesting the report.
 * @param {string} params.companyId The ID of the user's company.
 * @returns {Promise<object>} The formatted epic progress report.
 * @throws {ErrorResponse} If the epic is not found or the user has no access.
 */
export const getEpicProgressReport = async ({ epicId, userId, companyId }) => {
  const epic = await prisma.momentumEpic.findFirst({
    where: {
      id: epicId,
      project: {
        companyId: companyId,
      },
    },
    include: {
      project: { select: { id: true } },
      issues: {
        select: {
          id: true,
          status: true,
          storyPoints: true,
          sprintId: true,
          sprint: { select: { id: true, title: true } }
        },
      },
    },
  });

  if (!epic) {
    throw new ErrorResponse('Epic not found', 404);
  }

  // Business logic: check access to the epic's project
  await checkProjectAccess(epic.projectId, userId, companyId);

  const issuesTotal = epic.issues.length;
  let issuesCompleted = 0;
  let storyPointsTotal = 0;
  let storyPointsCompleted = 0;
  const issuesByStatus = {};
  const issuesBySprint = {};

  epic.issues.forEach(issue => {
    if (typeof issue.storyPoints === 'number') {
      storyPointsTotal += issue.storyPoints;
      if (COMPLETED_ISSUE_STATUSES.includes(issue.status?.toUpperCase())) {
        storyPointsCompleted += issue.storyPoints;
      }
    }
    if (COMPLETED_ISSUE_STATUSES.includes(issue.status?.toUpperCase())) {
      issuesCompleted++;
    }

    const statusKey = issue.status || 'UNDEFINED';
    issuesByStatus[statusKey] = (issuesByStatus[statusKey] || 0) + 1;

    const sprintKey = issue.sprintId || 'UNASSIGNED';
    if (!issuesBySprint[sprintKey]) {
      issuesBySprint[sprintKey] = {
        sprintTitle: issue.sprint?.title || (sprintKey === 'UNASSIGNED' ? 'Unassigned' : 'Unknown Sprint'),
        total: 0,
        completed: 0,
      };
    }
    issuesBySprint[sprintKey].total++;
    if (COMPLETED_ISSUE_STATUSES.includes(issue.status?.toUpperCase())) {
      issuesBySprint[sprintKey].completed++;
    }
  });

  return {
    epicDetails: {
      id: epic.id,
      title: epic.title,
      description: epic.description,
      status: epic.status,
    },
    issuesTotal,
    issuesCompleted,
    storyPointsTotal,
    storyPointsCompleted,
    issuesByStatus,
    issuesBySprint,
  };
};

/**
 * @service getUserWorkloadReport
 * @description Fetches data and generates a workload report for users in a project.
 * @param {object} params
 * @param {string} params.projectId The ID of the project.
 * @param {string} [params.sprintId] The ID of the sprint (optional).
 * @param {string} [params.statusCategory] The status category to filter by (optional).
 * @param {string} params.userId The ID of the user requesting the report.
 * @param {string} params.companyId The ID of the user's company.
 * @returns {Promise<object[]>} The formatted user workload report.
 * @throws {ErrorResponse} If the project is not found or the user has no access.
 */
export const getUserWorkloadReport = async ({ projectId, sprintId, statusCategory, userId, companyId }) => {
  // Business logic: check project access before proceeding
  await checkProjectAccess(projectId, userId, companyId);

  const issueWhereClause = {
    projectId: projectId,
    assigneeUserId: { not: null },
  };

  if (sprintId) {
    issueWhereClause.sprintId = sprintId;
  }

  if (statusCategory) {
    if (statusCategory === 'open') issueWhereClause.status = { in: OPEN_ISSUE_STATUSES };
    else if (statusCategory === 'in_progress') issueWhereClause.status = { in: IN_PROGRESS_ISSUE_STATUSES };
    else if (statusCategory === 'done') issueWhereClause.status = { in: COMPLETED_ISSUE_STATUSES };
  }

  const assignedIssues = await prisma.momentumIssue.findMany({
    where: issueWhereClause,
    select: {
      id: true,
      title: true,
      status: true,
      sprintId: true,
      sprint: { select: { title: true } },
      storyPoints: true,
      type: true,
      priority: true,
      assigneeUserId: true,
      assignee: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: {
      assigneeUserId: 'asc'
    }
  });

  const userWorkloadMap = new Map();

  assignedIssues.forEach(issue => {
    if (!issue.assignee) return;

    if (!userWorkloadMap.has(issue.assigneeUserId)) {
      userWorkloadMap.set(issue.assigneeUserId, {
        user: {
          id: issue.assignee.id,
          name: issue.assignee.displayName,
          avatarUrl: issue.assignee.avatarUrl,
        },
        assignedIssues: [],
        totalAssignedIssues: 0,
        totalStoryPoints: 0,
      });
    }

    const userEntry = userWorkloadMap.get(issue.assigneeUserId);
    userEntry.assignedIssues.push({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      sprintId: issue.sprintId,
      sprintTitle: issue.sprint?.title,
      storyPoints: issue.storyPoints,
      type: issue.type,
      priority: issue.priority,
    });
    userEntry.totalAssignedIssues++;
    if (typeof issue.storyPoints === 'number') {
      userEntry.totalStoryPoints += issue.storyPoints;
    }
  });

  return Array.from(userWorkloadMap.values());
};

/**
 * @service getSprintBurnupData
 * @description Placeholder for generating burnup chart data, with logic now contained here.
 * @param {object} params
 * @param {string} params.sprintId The ID of the sprint.
 * @param {string} params.userId The ID of the user requesting the report.
 * @param {string} params.companyId The ID of the user's company.
 * @returns {Promise<object>} A response indicating that the feature is not yet implemented.
 * @throws {ErrorResponse} If the sprint is not found or the user has no access.
 */
export const getSprintBurnupData = async ({ sprintId, userId, companyId }) => {
  const sprint = await prisma.momentumSprint.findFirst({
    where: {
      id: sprintId,
      project: {
        companyId: companyId,
      },
    },
    select: { projectId: true }
  });

  if (!sprint) {
    throw new ErrorResponse('Sprint not found', 404);
  }

  // Business logic: check project access
  await checkProjectAccess(sprint.projectId, userId, companyId);

  // The placeholder logic is now in the service layer.
  Logger.warn(`Burnup data requested for sprint ${sprintId}. This is an advanced feature requiring historical data tracking not yet implemented.`);

  return {
    success: false,
    message: 'Not Implemented - Burnup chart data generation is an advanced feature and requires dedicated historical data tracking.',
  };
};
