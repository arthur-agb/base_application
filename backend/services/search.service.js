// services/search.service.js
import prisma from '../utils/prismaClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';

// A reusable function to get accessible project IDs for the user and company
const getUserAccessibleProjects = async (userId, companyId, projectId = null, userCompanyRole = null) => {
  // If a specific projectId is requested, validate its existence and user's membership
  if (projectId) {
    const whereClause = {
      id: projectId,
      companyId: companyId,
    };

    // If no company role, must be a project member
    if (!userCompanyRole) {
      whereClause.members = {
        some: {
          userId: userId,
        },
      };
    }

    const project = await prisma.project.findFirst({
      where: whereClause,
    });

    if (!project) {
      throw new ErrorResponse('Project not found or not accessible within your company', 404);
    }
    return [projectId];
  }

  // Otherwise, get all projects the user is a member of within the current company
  // OR all projects if they have a company role
  const whereClause = {
    companyId: companyId,
  };

  if (!userCompanyRole) {
    whereClause.members = {
      some: {
        userId: userId,
      },
    };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    select: {
      id: true,
      key: true
    },
  });

  return projects;
};

// Main global search function
export const performGlobalSearch = async ({ query, type, projectId, boardId, limit, user, company, userCompanyRole }) => {
  const companyId = company ? company.id : null;
  const userId = user.id;
  const limitNum = parseInt(limit, 10) || 10;
  const results = {};
  const role = userCompanyRole;

  // First, get the list of projects the user can access within the company
  const accessibleProjects = await getUserAccessibleProjects(userId, companyId, projectId, role);
  const accessibleProjectIds = accessibleProjects.map(p => typeof p === 'object' ? p.id : p);

  if (accessibleProjectIds.length === 0 && (!type || type !== 'users')) {
    // Return empty results if there are no accessible projects for non-user searches
    Logger.warn(`No accessible projects found for user ${userId} in company ${companyId}`);
    return { issues: [], projects: [], users: [], comments: [] };
  }

  // Conditionally execute searches based on 'type'
  if (!type || type === 'all' || type === 'issues') {
    results.issues = await prisma.momentumIssue.findMany({
      where: {
        projectId: { in: accessibleProjectIds },
        ...(boardId && { boardId: boardId }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        project: { select: { name: true, key: true } },
        reporter: { select: { displayName: true, avatarUrl: true } },
        assignee: { select: { displayName: true, avatarUrl: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: limitNum,
    });
  }

  if (!type || type === 'all' || type === 'projects') {
    results.projects = await prisma.project.findMany({
      where: {
        id: { in: accessibleProjectIds },
        companyId: companyId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { key: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { projectLead: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limitNum,
    });
  }

  if (!type || type === 'all' || type === 'users') {
    // Filter users by company membership to prevent cross-tenant data leaks
    const userWhereClause = {
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    };

    // Scope to company/context
    userWhereClause.companies = {
      some: {
        companyId: companyId, // Will handle both null (if supported in join table) and specific company IDs
      },
    };

    results.users = await prisma.userMain.findMany({
      where: userWhereClause,
      select: { id: true, displayName: true, email: true, avatarUrl: true, role: true },
      take: limitNum,
    });
  }

  if (!type || type === 'all' || type === 'comments') {
    const issuesForComments = await prisma.momentumIssue.findMany({
      where: {
        projectId: { in: accessibleProjectIds },
      },
      select: { id: true },
    });
    const issueIds = issuesForComments.map(issue => issue.id);

    if (issueIds.length > 0) {
      results.comments = await prisma.momentumComment.findMany({
        where: {
          issueId: { in: issueIds },
          body: { contains: query, mode: 'insensitive' }
        },
        include: {
          user: { select: { displayName: true, avatarUrl: true } },
          issue: {
            select: {
              key: true,
              title: true,
              project: {
                select: { name: true, key: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
      });
    } else {
      results.comments = [];
    }
  }

  Logger.info(`Global search "${query}" by user ${user.name} in company ${companyId}`);
  return results;
};

// Advanced search function
export const performAdvancedSearch = async ({ searchCriteria, user, company, userCompanyRole }) => {
  const {
    projectKeys,
    issueTypes,
    priorities,
    statuses,
    assignees,
    reporters,
    labels,
    createdAfter,
    createdBefore,
    updatedAfter,
    updatedBefore,
    text,
    page = 1,
    limit = 20
  } = searchCriteria;

  const companyId = company?.id || null;
  const userId = user.id;
  const role = userCompanyRole;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const issueWhereClause = {};

  const userProjects = await getUserAccessibleProjects(userId, companyId, null, role);
  const accessibleProjectIds = userProjects.map(p => p.id);

  if (accessibleProjectIds.length === 0) {
    return {
      issues: [],
      pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
    };
  }

  issueWhereClause.projectId = { in: accessibleProjectIds };

  // Apply filters
  if (projectKeys && projectKeys.length > 0) {
    const projectsWithKeys = await prisma.project.findMany({
      where: {
        key: { in: projectKeys },
        id: { in: accessibleProjectIds },
        companyId: companyId,
      },
      select: { id: true },
    });
    issueWhereClause.projectId = { in: projectsWithKeys.map(p => p.id) };
  }

  if (issueTypes && issueTypes.length > 0) {
    issueWhereClause.type = { in: issueTypes };
  }
  if (priorities && priorities.length > 0) {
    issueWhereClause.priority = { in: priorities };
  }
  if (statuses && statuses.length > 0) {
    issueWhereClause.status = { in: statuses };
  }
  if (assignees && assignees.length > 0) {
    if (assignees.includes('unassigned')) {
      const otherAssignees = assignees.filter(a => a !== 'unassigned');
      issueWhereClause.OR = [
        { assigneeId: { in: otherAssignees } },
        { assigneeId: null },
      ];
    } else {
      issueWhereClause.assigneeId = { in: assignees };
    }
  }
  if (reporters && reporters.length > 0) {
    issueWhereClause.reporterId = { in: reporters };
  }
  if (labels && labels.length > 0) {
    issueWhereClause.labels = { hasEvery: labels };
  }
  if (createdAfter || createdBefore) {
    issueWhereClause.createdAt = {};
    if (createdAfter) issueWhereClause.createdAt.gte = new Date(createdAfter);
    if (createdBefore) issueWhereClause.createdAt.lte = new Date(createdBefore);
  }
  if (updatedAfter || updatedBefore) {
    issueWhereClause.updatedAt = {};
    if (updatedAfter) issueWhereClause.updatedAt.gte = new Date(updatedAfter);
    if (updatedBefore) issueWhereClause.updatedAt.lte = new Date(updatedBefore);
  }

  if (text) {
    const textSearchConditions = [
      { title: { contains: text, mode: 'insensitive' } },
      { description: { contains: text, mode: 'insensitive' } }
    ];
    if (issueWhereClause.OR) {
      issueWhereClause.OR = [...issueWhereClause.OR, ...textSearchConditions];
    } else {
      issueWhereClause.OR = textSearchConditions;
    }
  }

  const total = await prisma.momentumIssue.count({ where: issueWhereClause });
  const issues = await prisma.momentumIssue.findMany({
    where: issueWhereClause,
    include: {
      project: { select: { name: true, key: true } },
      reporter: { select: { displayName: true, avatarUrl: true } },
      assignee: { select: { displayName: true, avatarUrl: true } },
      column: { select: { name: true } }
    },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: limitNum,
  });

  Logger.info(`Advanced search by user ${user.name} in company ${companyId}`);
  return {
    issues,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

// Search suggestions function
export const getSearchSuggestions = async ({ query, type, user, company, userCompanyRole }) => {
  const companyId = company.id;
  const userId = user.id;
  const role = userCompanyRole;

  const accessibleProjects = await getUserAccessibleProjects(userId, companyId, null, role);
  const accessibleProjectIds = accessibleProjects.map(p => p.id);
  const projectKeys = accessibleProjects.map(p => p.key);

  let suggestions = [];

  switch (type) {
    case 'issues':
      const issues = await prisma.momentumIssue.findMany({
        where: {
          projectId: { in: accessibleProjectIds },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true },
        take: 5,
      });
      suggestions = issues.map(issue => ({
        type: 'issue',
        value: issue.id,
        label: `${issue.title.substring(0, 40)}${issue.title.length > 40 ? '...' : ''}`,
      }));
      break;
    case 'users':
      // Filter users by company membership to prevent cross-tenant data leaks
      const userWhereClause = {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };

      // Scope to company/context
      userWhereClause.companies = {
        some: {
          companyId: companyId,
        },
      };

      const users = await prisma.userMain.findMany({
        where: userWhereClause,
        select: { id: true, displayName: true, email: true, avatarUrl: true },
        take: 5,
      });
      suggestions = users.map(user => ({
        type: 'user',
        value: user.id,
        label: user.displayName,
        avatar: user.avatarUrl,
      }));
      break;
    case 'projects':
      const projectSuggestions = await prisma.project.findMany({
        where: {
          id: { in: accessibleProjectIds },
          companyId: companyId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { key: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { name: true, key: true },
        take: 5,
      });
      suggestions = projectSuggestions.map(project => ({
        type: 'project',
        value: project.key,
        label: `${project.key}: ${project.name}`,
      }));
      break;
    case 'jql':
      // Simplified JQL suggestions logic remains in the service
      if (query.toLowerCase().startsWith('p')) {
        suggestions = [
          { type: 'jql', value: 'project = ', label: 'project = ' },
          ...projectKeys.slice(0, 5).map(key => ({
            type: 'jql',
            value: `project = ${key}`,
            label: `project = ${key}`,
          }))
        ];
      } else if (query.toLowerCase().startsWith('a')) {
        suggestions = [
          { type: 'jql', value: 'assignee = ', label: 'assignee = ' },
          { type: 'jql', value: 'assignee = currentUser()', label: 'assignee = currentUser()' },
          { type: 'jql', value: 'assignee is empty', label: 'assignee is empty' }
        ];
      } else if (query.toLowerCase().startsWith('s')) {
        suggestions = [
          { type: 'jql', value: 'status = ', label: 'status = ' },
          { type: 'jql', value: 'status = "To Do"', label: 'status = "To Do"' },
          { type: 'jql', value: 'status = "In Progress"', label: 'status = "In Progress"' },
          { type: 'jql', value: 'status = "Done"', label: 'status = "Done"' }
        ];
      } else {
        suggestions = [
          { type: 'jql', value: 'project = ', label: 'project = ' },
          { type: 'jql', value: 'assignee = ', label: 'assignee = ' },
          { type: 'jql', value: 'status = ', label: 'status = ' },
          { type: 'jql', value: 'priority = ', label: 'priority = ' },
          { type: 'jql', value: 'type = ', label: 'type = ' }
        ];
      }
      break;
    default:
      break;
  }

  return suggestions;
};
