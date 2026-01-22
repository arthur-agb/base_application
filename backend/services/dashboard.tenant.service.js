// services/dashboard.tenant.service.js
import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient.js';
import redisClient from '../utils/redisClient.js';
import Logger from '../utils/logger.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Helper function to map Prisma groupBy results to the expected format
 */
const mapGroupByResult = (result, groupByKey) => {
  return result.map(item => ({
    _id: item[groupByKey], // Keep _id for consistency if frontend expects it, or change to groupByKey name
    count: item._count?.[groupByKey] ?? item._count?._all ?? 0
  }));
};

/**
 * @desc Fetch user dashboard data for the current context (Company or Personal)
 * @param {string | null} companyId The company ID, or null for personal workspace
 * @param {string} userId The user ID
 * @returns {object} The dashboard data
 */
export const getUserDashboardData = async (companyId, userId) => {
  const context = companyId ? `company:${companyId}` : 'personal';
  const cacheKey = `dashboard:${context}:${userId}`;

  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        Logger.debug(`Cache hit for dashboard ${userId} in context ${context}`);
        return JSON.parse(cachedData);
      }
    }
  } catch (err) {
    Logger.error(`Redis GET error for key ${cacheKey}: ${err}`);
  }

  // Define date range for "upcoming" issues
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  // Define base "where" clauses to be reused
  const projectWhereClause = {
    companyId: companyId,
    members: {
      some: { userId: userId },
    },
  };

  const issueWhereClause = {
    project: {
      companyId: companyId,
    },
    OR: [
      { assigneeUserId: userId },
      { reporterUserId: userId },
    ],
  };

  const upcomingIssuesWhereClause = {
    ...issueWhereClause,
    status: { not: 'DONE' },
    dueDate: {
      gte: today,
      lte: nextWeek,
    },
  };

  const transactionPromises = [
    prisma.project.findMany({
      where: projectWhereClause,
      include: {
        projectLead: {
          select: { displayName: true, username: true, avatarUrl: true }, // Fetch both for fallback
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.momentumIssue.findMany({
      where: issueWhereClause,
      include: {
        project: {
          select: { name: true, key: true }, // CORRECTED: Project has 'name', not 'displayName'
        },
        reporter: {
          select: { displayName: true, username: true, avatarUrl: true }, // Fetch both
        },
        assignee: {
          select: { displayName: true, username: true, avatarUrl: true }, // Fetch both
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.momentumIssue.findMany({
      where: upcomingIssuesWhereClause,
      include: {
        project: {
          select: { name: true, key: true }, // CORRECTED: Project has 'name', not 'displayName'
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.momentumIssue.groupBy({
      by: ['status'],
      where: issueWhereClause,
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } }
    }),
    prisma.momentumIssue.groupBy({
      by: ['priority'],
      where: issueWhereClause,
      _count: { priority: true },
      orderBy: { _count: { priority: 'desc' } }
    }),
    prisma.project.count({
      where: projectWhereClause,
    }),
    // CORRECTED: Use relational filter for issue counts
    prisma.momentumIssue.count({
      where: {
        project: { companyId: companyId },
        assigneeUserId: userId,
      },
    }),
    prisma.momentumIssue.count({
      where: {
        project: { companyId: companyId },
        reporterUserId: userId,
      },
    }),
  ];

  const [
    rawProjects,
    rawRelevantIssues,
    upcomingIssues,
    issuesByStatusGroup,
    issuesByPriorityGroup,
    projectCount,
    assignedIssueCount,
    reportedIssueCount,
  ] = await prisma.$transaction(transactionPromises);

  // --- Post-processing for reliable names ---
  const projects = rawProjects.map(p => ({
    ...p,
    projectLead: p.projectLead ? { ...p.projectLead, display: p.projectLead.displayName || p.projectLead.username } : null,
  }));

  const relevantIssues = rawRelevantIssues.map(issue => ({
    ...issue,
    reporter: { ...issue.reporter, display: issue.reporter.displayName || issue.reporter.username },
    assignee: issue.assignee ? { ...issue.assignee, display: issue.assignee.displayName || issue.assignee.username } : null,
  }));
  // --- End post-processing ---

  const issuesByStatus = mapGroupByResult(issuesByStatusGroup, 'status');
  const issuesByPriority = mapGroupByResult(issuesByPriorityGroup, 'priority');

  const dashboardData = {
    recentProjects: projects, // Use processed data
    relevantIssues, // Use processed data
    upcomingIssues,
    issuesByStatus,
    issuesByPriority,
    counts: {
      projects: projectCount,
      assignedIssues: assignedIssueCount,
      reportedIssues: reportedIssueCount,
    },
  };

  try {
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(dashboardData), 'EX', 300);
    }
  } catch (err) {
    Logger.error(`Redis SET error for key ${cacheKey}: ${err}`);
  }

  return dashboardData;
};

/**
 * @desc Fetch project dashboard data
 * @param {string} companyId The company ID
 * @param {string} projectId The project ID
 * @param {string} userId The user ID
 * @param {string} userRole The user's role
 * @returns {object} The project dashboard data
 */
export const getProjectDashboardData = async (companyId, projectId, userId, userRole) => {
  const cacheKey = `dashboard:project:${companyId}:${projectId}`;
  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        Logger.debug(`Cache hit for project dashboard ${projectId} in company ${companyId}`);
        return JSON.parse(cachedData);
      }
    }
  } catch (err) {
    Logger.error(`Redis GET error for key ${cacheKey}: ${err}`);
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId: companyId
    },
    include: {
      projectLead: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true
        }
      },
      members: {
        select: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    throw new ErrorResponse('Project not found', 404);
  }

  const isMember = project.members.some(member => member.user.id === userId);
  if (!isMember && userRole !== 'ADMIN') {
    throw new ErrorResponse('Not authorized to view this project dashboard', 403);
  }

  const [
    boards,
    issuesByStatusGroup,
    issuesByPriorityGroup,
    issuesByTypeGroup,
    issuesByAssigneeGroup,
    recentIssues,
    recentComments,
    issuesTrendRaw,
    resolutionTimeAggregateRaw,
    totalIssuesCount,
    openIssuesCount,
    completedIssuesCount
  ] = await prisma.$transaction([
    prisma.momentumBoard.findMany({
      where: {
        projectId: projectId
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['status'],
      where: {
        projectId: projectId
      },
      _count: {
        status: true
      },
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['priority'],
      where: {
        projectId: projectId
      },
      _count: {
        priority: true
      },
      orderBy: {
        _count: {
          priority: 'desc'
        }
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['type'],
      where: {
        projectId: projectId
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['assigneeUserId'],
      where: {
        projectId: projectId,
        assigneeUserId: {
          not: null
        }
      },
      _count: {
        assigneeUserId: true
      },
      orderBy: {
        _count: {
          assigneeUserId: 'desc'
        }
      },
      take: 10
    }),
    prisma.momentumIssue.findMany({
      where: {
        projectId: projectId
      },
      include: {
        reporter: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        },
        assignee: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    }),
    prisma.momentumComment.findMany({
      where: {
        issue: {
          projectId: projectId
        }
      },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        },
        issue: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }),
    prisma.$queryRaw`
      SELECT date_trunc('month', "created_at") AS month, COUNT(*) AS count
      FROM momentum.mm_issue
      WHERE "project_id" = ${projectId}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12;
    `,
    prisma.$queryRaw`
      SELECT
          AVG(EXTRACT(EPOCH FROM ("updated_at" - "created_at")) / (60*60*24)) as "averageTime",
          MIN(EXTRACT(EPOCH FROM ("updated_at" - "created_at")) / (60*60*24)) as "minTime",
          MAX(EXTRACT(EPOCH FROM ("updated_at" - "created_at")) / (60*60*24)) as "maxTime"
      FROM momentum.mm_issue
      WHERE "project_id" = ${projectId} AND "status" = 'Done' AND "updated_at" IS NOT NULL AND "created_at" IS NOT NULL;
    `,
    prisma.momentumIssue.count({
      where: {
        projectId: projectId
      }
    }),
    prisma.momentumIssue.count({
      where: {
        projectId: projectId,
        status: {
          not: 'Done'
        }
      }
    }),
    prisma.momentumIssue.count({
      where: {
        projectId: projectId,
        status: 'Done'
      }
    })
  ]);

  const assigneeIds = issuesByAssigneeGroup
    .map(item => item.assigneeUserId)
    .filter(id => id !== null);

  let assignees = [];
  if (assigneeIds.length > 0) {
    assignees = await prisma.userMain.findMany({
      where: {
        id: {
          in: assigneeIds
        }
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
  }

  const issuesByStatus = mapGroupByResult(issuesByStatusGroup, 'status');
  const issuesByPriority = mapGroupByResult(issuesByPriorityGroup, 'priority');
  const issuesByType = mapGroupByResult(issuesByTypeGroup, 'type');
  const issuesByAssigneeWithDetails = issuesByAssigneeGroup.map(item => {
    const assignee = assignees.find(user => user.id === item.assigneeUserId);
    return {
      assignee: assignee ? assignee : null,
      count: item._count.assigneeUserId
    };
  });
  const trendData = issuesTrendRaw.map(item => ({
    month: item.month.toISOString().substring(0, 7),
    count: Number(item.count)
  })).reverse();
  const resolutionTimeData = resolutionTimeAggregateRaw[0];
  const resolutionTime = resolutionTimeData && resolutionTimeData.averageTime !== null ? {
    average: parseFloat(resolutionTimeData.averageTime.toFixed(2)),
    min: resolutionTimeData.minTime !== null ? parseFloat(resolutionTimeData.minTime.toFixed(2)) : 0,
    max: resolutionTimeData.maxTime !== null ? parseFloat(resolutionTimeData.maxTime.toFixed(2)) : 0
  } : null;

  const projectDashboard = {
    project,
    boards,
    issuesByStatus,
    issuesByPriority,
    issuesByType,
    issuesByAssignee: issuesByAssigneeWithDetails,
    recentIssues,
    recentComments,
    trendData,
    resolutionTime,
    counts: {
      totalIssues: totalIssuesCount,
      openIssues: openIssuesCount,
      completedIssues: completedIssuesCount,
    }
  };

  try {
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(projectDashboard), 'EX', 300);
    }
  } catch (err) {
    Logger.error(`Redis SET error for key ${cacheKey}: ${err}`);
  }

  return projectDashboard;
};

/**
 * @desc Fetch admin dashboard data
 * @param {string} companyId The company ID
 * @returns {object} The admin dashboard data
 */
export const getAdminDashboardData = async (companyId) => {
  const cacheKey = `dashboard:admin:${companyId}`;
  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        Logger.debug(`Cache hit for admin dashboard in company ${companyId}`);
        return JSON.parse(cachedData);
      }
    }
  } catch (err) {
    Logger.error(`Redis GET error for key ${cacheKey}: ${err}`);
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalUsers,
    activeUsers,
    admins,
    userTrendRaw,
    totalProjects,
    projectTrendRaw,
    totalIssues,
    openIssues,
    completedIssues,
    issuesByTypeGroup,
    issuesByPriorityGroup,
    recentProjects,
    recentUsers
  ] = await prisma.$transaction([
    prisma.userMain.count({
      where: {
        companies: {
          some: {
            companyId: companyId
          }
        }
      }
    }),
    prisma.userMain.count({
      where: {
        active: true,
        companies: {
          some: {
            companyId: companyId
          }
        }
      }
    }),
    prisma.userMain.count({
      where: {
        role: 'ADMIN',
        companies: {
          some: {
            companyId: companyId
          }
        }
      }
    }),
    prisma.$queryRaw`
      SELECT date_trunc('month', u."created_at") AS month, COUNT(*) AS count
      FROM users.users u
      JOIN companies.company_users cu ON u.user_id = cu."user_id"
      WHERE cu."company_id" = ${companyId} AND u."created_at" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC;
    `,
    prisma.project.count({
      where: {
        companyId: companyId
      }
    }),
    prisma.$queryRaw`
      SELECT date_trunc('month', "created_at") AS month, COUNT(*) AS count
      FROM momentum.mm_project_main
      WHERE "company_id" = ${companyId} AND "created_at" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC;
    `,
    prisma.momentumIssue.count({
      where: {
        companyId: companyId
      }
    }),
    prisma.momentumIssue.count({
      where: {
        companyId: companyId,
        status: {
          not: 'Done'
        }
      }
    }),
    prisma.momentumIssue.count({
      where: {
        companyId: companyId,
        status: 'Done'
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['type'],
      where: {
        companyId: companyId
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    }),
    prisma.momentumIssue.groupBy({
      by: ['priority'],
      where: {
        companyId: companyId
      },
      _count: {
        priority: true
      },
      orderBy: {
        _count: {
          priority: 'desc'
        }
      }
    }),
    prisma.project.findMany({
      where: {
        companyId: companyId
      },
      include: {
        projectLead: {
          select: {
            displayName: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }),
    prisma.userMain.findMany({
      where: {
        companies: {
          some: {
            companyId: companyId
          }
        }
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
  ]);

  const userTrendData = userTrendRaw.map(item => ({
    month: item.month.toISOString().substring(0, 7),
    count: Number(item.count)
  }));
  const projectTrendData = projectTrendRaw.map(item => ({
    month: item.month.toISOString().substring(0, 7),
    count: Number(item.count)
  }));
  const issuesByType = mapGroupByResult(issuesByTypeGroup, 'type');
  const issuesByPriority = mapGroupByResult(issuesByPriorityGroup, 'priority');

  const adminDashboard = {
    userStats: {
      total: totalUsers,
      active: activeUsers,
      admins,
      trend: userTrendData,
      recent: recentUsers
    },
    projectStats: {
      total: totalProjects,
      trend: projectTrendData,
      recent: recentProjects
    },
    issueStats: {
      total: totalIssues,
      open: openIssues,
      completed: completedIssues,
      byType: issuesByType,
      byPriority: issuesByPriority
    },
    systemStats: {
      uptime: process.uptime(),
      memory: {
        rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        external: (process.memoryUsage().external / 1024 / 1024).toFixed(2) + ' MB',
      },
      nodeVersion: process.version
    }
  };

  try {
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(adminDashboard), 'EX', 300);
    }
  } catch (err) {
    Logger.error(`Redis SET error for key ${cacheKey}: ${err}`);
  }

  return adminDashboard;
};