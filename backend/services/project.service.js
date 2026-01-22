// services/project.service.js
import prisma from '../utils/prismaClient.js';
import Logger from '../utils/logger.js';
import ErrorResponse from '../utils/errorResponse.js';
import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import { MomentumActivityModel } from '../models/momentum/MomentumActivity.js';

/**
 * Get all projects a user is a member of, for a given context.
 * If companyId is provided, it fetches projects for that company.
 * If companyId is null, it fetches the user's personal projects.
 * @param {string | null} companyId - The ID of the company, or null for personal projects.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<{projects: Array, count: number}>}
 */
export const getProjectsForUser = async (companyId, userId, userCompanyRole, includeArchived = false, globalRole) => {
  const isGlobalAdmin = globalRole === 'ADMIN';
  // Narrowing the bypass: Only Company OWNER and ADMIN see all projects.
  // Company MANAGERS, MEMBERS, VIEWERS must be explicit project members or lead.
  const isHighLevelExempt = ['OWNER', 'ADMIN'].includes(userCompanyRole?.toUpperCase() || '');

  Logger.info(`[getProjectsForUser - V4 - ${new Date().toISOString()}] Context: ${companyId ? 'Company ' + companyId : 'Personal'}, User: ${userId}, GlobalRole: ${globalRole}, CompanyRole: ${userCompanyRole}`);

  const whereClause = {
    companyId: companyId,
  };

  if (!includeArchived) {
    whereClause.isArchived = false;
  }

  // Authorization Logic:
  // - Global Admins see everything.
  // - Company Owners/Admins see everything in their company.
  // - Others (MANAGER, MEMBER, VIEWER, and Personal Workspace users) only see projects where they are explicitly a member or the lead.
  if (!isGlobalAdmin && !isHighLevelExempt) {
    Logger.info(`[getProjectsForUser] Applying membership/lead filter for user ${userId}`);
    whereClause.OR = [
      {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      {
        projectLeadId: userId,
      }
    ];
  } else {
    Logger.info(`[getProjectsForUser] User ${userId} is high-level Admin/Owner/GlobalAdmin. No membership filter applied.`);
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      projectLead: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: { members: true, issues: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const count = await prisma.project.count({ where: whereClause });

  const formattedProjects = projects.map(p => ({
    ...p,
    memberCount: p._count.members,
    issueCount: p._count.issues,
  }));


  return { projects: formattedProjects, count };
};

/**
 * Creates a new project, board, and default columns in a single transaction.
 * @param {object} projectData The data for the new project.
 * @param {string} projectData.name The name of the project.
 * @param {string} projectData.key The key of the project.
 * @param {string} projectData.description The description of the project.
 * @param {string} companyId The ID of the company creating the project.
 * @param {string} userId The ID of the user creating the project (who will be the lead and first member).
 * @returns {Promise<object>} A promise that resolves to the newly created project with relations.
 */
export const createProjectTransaction = async (projectData, companyId, userId) => {
  const { name, key, description } = projectData;

  const projectKey = key.toUpperCase().replace(/\s+/g, '');
  if (!projectKey) {
    throw new ErrorResponse('Project key cannot be empty or just spaces', 400);
  }

  const keyExists = await prisma.project.findFirst({
    where: {
      key: projectKey,
      companyId: companyId,
    },
  });

  if (keyExists) {
    const scope = companyId ? 'your company' : 'your personal projects';
    throw new ErrorResponse(`Project key '${projectKey}' already exists in ${scope}`, 409);
  }

  try {
    return await prisma.$transaction(async (tx) => {

      // 1. Prepare the base data for project creation
      const projectCreateData = {
        name,
        key: projectKey,
        description: description || '',
        projectLead: { connect: { id: userId } },
        members: {
          create: [{
            user: { connect: { id: userId } }
          }]
        },
      };

      // 2. Conditionally add the company connection
      if (companyId) {
        projectCreateData.company = { connect: { id: companyId } };
      }

      // 3. Create the project
      const project = await tx.project.create({
        data: projectCreateData,
      });

      // 4. Prepare board data
      const board = await tx.momentumBoard.create({
        data: {
          name: `${projectKey} Board`,
          type: 'KANBAN',
          project: { connect: { id: project.id } },
        },
      });

      const defaultColumns = [
        { name: 'To Do', position: 0, boardId: board.id },
        { name: 'In Progress', position: 1, boardId: board.id },
        { name: 'Done', position: 2, boardId: board.id },
      ];

      await tx.momentumColumn.createMany({
        data: defaultColumns,
      });

      await MomentumHistoryModel.create({
        action: 'CREATE',
        entityType: 'PROJECT',
        entityId: project.id,
        newValue: name,
        userId: userId,
        companyId: companyId,
      }, tx);

      await MomentumActivityModel.create({
        action: 'CREATED_PROJECT',
        details: { projectName: name, projectKey: project.key },
        projectId: project.id,
        userId: userId,
      }, tx);

      return await tx.project.findUnique({
        where: { id: project.id },
        include: {
          projectLead: { select: { id: true, username: true, email: true, avatarUrl: true } },
          members: {
            include: {
              user: { select: { id: true, username: true, email: true, avatarUrl: true } }
            }
          },
          boards: { select: { id: true, name: true } },
        },
      });
    });
  } catch (error) {
    Logger.error(`Error creating project transaction: ${error.message}`, { stack: error.stack, code: error.code });
    if (error instanceof ErrorResponse) {
      throw error;
    }
    if (error.code === 'P2002') {
      const scope = companyId ? 'your company' : 'your personal projects';
      throw new ErrorResponse(`A project with this key already exists in ${scope}.`, 409);
    }
    throw new ErrorResponse('Failed to create project due to a server error', 500);
  }
};

/**
 * Fetches a single project by its key, including related data and issue statistics.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the current company.
 * @returns {Promise<object>} A promise that resolves to the project data and statistics.
 */
export const getProjectByKey = async (projectKey, companyId) => {
  const normalizedKey = projectKey.toUpperCase();
  const projectResult = await prisma.project.findFirst({
    where: {
      key: normalizedKey,
      companyId: companyId,
    },
    include: {
      projectLead: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      members: {
        select: {
          role: true,
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              email: true,
              role: true,
              companies: companyId ? {
                where: { companyId: companyId },
                select: { role: true }
              } : false
            },
          }
        },
        orderBy: { user: { displayName: 'asc' } },
      },
      boards: {
        select: { id: true, name: true, type: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { issues: true },
      },
    },
  });

  if (!projectResult) {
    return null;
  }

  let statusCounts = {};
  try {
    const issueStatsRaw = await prisma.momentumIssue.groupBy({
      by: ['status'],
      where: { projectId: projectResult.id },
      _count: { status: true },
    });
    statusCounts = issueStatsRaw.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {});
  } catch (statsError) {
    Logger.error(`Error calculating basic issue stats for project ${projectKey}: ${statsError.message}`);
  }

  const { _count, ...projectData } = projectResult;

  const membersWithLeadMarked = projectData.members.map(member => {
    // Extract company context role if it exists (via the relation in the query)
    const companyRole = member.user?.companies?.[0]?.role || null;
    return {
      ...member.user,
      companyRole,
      projectRole: member.role,
      isLead: member.user?.id === projectData.projectLeadId
    };
  });

  return {
    project: {
      ...projectData,
      members: membersWithLeadMarked,
      totalIssues: _count?.issues ?? 0,
    },
    issueStats: statusCounts,
  };
};

/**
 * Updates a project.
 * @param {string} projectKey The key of the project.
 * @param {object} updateData The data to update.
 * @param {string} companyId The ID of the current company.
 * @param {string} userId The ID of the user performing the update.
 * @returns {Promise<object>} A promise that resolves to the updated project data.
 */
export const updateProject = async (projectKey, updateData, companyId, userId) => {
  const normalizedKey = projectKey.toUpperCase();
  const projectToUpdate = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: { id: true, projectLeadId: true, name: true },
  });

  if (!projectToUpdate) {
    throw new ErrorResponse(`Project with key '${normalizedKey}' not found in your company`, 404);
  }

  const { projectLeadId, ...restOfUpdateData } = updateData;

  if (projectLeadId !== undefined && projectLeadId !== projectToUpdate.projectLeadId) {
    const newLeadIsMember = await prisma.momentumProjectMember.count({
      where: {
        projectId: projectToUpdate.id,
        userId: projectLeadId,
      },
    });
    if (newLeadIsMember === 0) {
      throw new ErrorResponse('Selected user is not a member of this project and cannot be made lead', 400);
    }
  }

  try {
    let updatedProject;

    if (projectLeadId && projectLeadId !== projectToUpdate.projectLeadId) {
      // Wrap in transaction to update leadId and member roles
      const [proj] = await prisma.$transaction([
        prisma.project.update({
          where: { id: projectToUpdate.id },
          data: {
            ...restOfUpdateData,
            projectLead: { connect: { id: projectLeadId } },
          },
        }),
        // Promote new lead
        prisma.momentumProjectMember.update({
          where: {
            projectId_userId: {
              projectId: projectToUpdate.id,
              userId: projectLeadId
            }
          },
          data: { role: 'LEAD' }
        }),
        // Demote old lead if they exist
        ...(projectToUpdate.projectLeadId ? [
          prisma.momentumProjectMember.update({
            where: {
              projectId_userId: {
                projectId: projectToUpdate.id,
                userId: projectToUpdate.projectLeadId
              }
            },
            data: { role: 'MEMBER' }
          })
        ] : [])
      ]);
      updatedProject = proj;
    } else {
      updatedProject = await prisma.project.update({
        where: { id: projectToUpdate.id },
        data: {
          ...restOfUpdateData,
          ...(projectLeadId && { projectLead: { connect: { id: projectLeadId } } }),
        },
      });
    }

    const historyPromises = Object.keys(updateData).map(field => {
      if (projectToUpdate[field] !== updatedProject[field]) {
        return MomentumHistoryModel.create({
          action: 'UPDATE',
          entityType: 'PROJECT',
          entityId: projectToUpdate.id,
          fieldChanged: field,
          oldValue: String(projectToUpdate[field]),
          newValue: String(updatedProject[field]),
          userId: userId,
          companyId: companyId,
        });
      }
      return null;
    }).filter(p => p);

    await Promise.all(historyPromises);

    return updatedProject;
  } catch (error) {
    Logger.error(`Error updating project ${projectKey}: ${error.message}`, { stack: error.stack, code: error.code });
    if (error.code === 'P2025') {
      throw new ErrorResponse(`Project with key '${normalizedKey}' vanished during update.`, 404);
    }
    throw new ErrorResponse('Could not update project due to a server error', 500);
  }
};

/**
 * Deletes a project.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the current company.
 * @param {string} userId The ID of the user performing the deletion.
 * @returns {Promise<string>} A promise that resolves to the deleted project's name.
 */
export const deleteProject = async (projectKey, companyId, userId) => {
  const normalizedKey = projectKey.toUpperCase();
  const project = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: { id: true, name: true },
  });

  if (!project) {
    return null;
  }

  try {
    await prisma.project.delete({
      where: { id: project.id },
    });

    await MomentumHistoryModel.create({
      action: 'DELETE',
      entityType: 'PROJECT',
      entityId: project.id,
      oldValue: project.name,
      userId: userId,
      companyId: companyId,
    });

    await MomentumActivityModel.create({
      action: 'DELETED_PROJECT',
      details: { projectName: project.name, projectKey: normalizedKey },
      projectId: project.id,
      userId: userId,
    });

    return project.name;
  } catch (error) {
    Logger.error(`Error deleting project ${normalizedKey}: ${error.message}`, { stack: error.stack, code: error.code });
    if (error.code === 'P2025') {
      throw new ErrorResponse(`Project with key '${normalizedKey}' vanished during deletion.`, 404);
    }
    throw new ErrorResponse('Could not delete project due to a server error', 500);
  }
};

/**
 * Adds a member to a project.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the company.
 * @param {string} emailToAdd The email of the user to add.
 * @param {string} currentUserId The ID of the user performing the action.
 * @returns {Promise<object>} A promise that resolves to the newly added member.
 */
export const addProjectMember = async (projectKey, companyId, emailToAdd, currentUserId) => {
  const normalizedKey = projectKey.toUpperCase();
  const normalizedEmail = emailToAdd.toLowerCase().trim();

  const project = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: { id: true, name: true },
  });

  if (!project) {
    throw new ErrorResponse(`Project with key '${normalizedKey}' not found in your company`, 404);
  }

  const userToAdd = await prisma.userMain.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, displayName: true },
  });

  if (!userToAdd) {
    throw new ErrorResponse(`User with email '${normalizedEmail}' not found`, 404);
  }

  // Validate Company Membership (if in a company context)
  if (companyId) {
    const isCompanyMember = await prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId: companyId, userId: userToAdd.id } }
    });

    if (!isCompanyMember) {
      throw new ErrorResponse('User is not a member of this company and cannot be added to the project', 400);
    }
  }

  const isAlreadyMember = await prisma.momentumProjectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: userToAdd.id } },
  });

  if (isAlreadyMember) {
    throw new ErrorResponse('User is already a member of this project', 409);
  }

  try {
    const newMember = await prisma.momentumProjectMember.create({
      data: {
        project: { connect: { id: project.id } },
        user: { connect: { id: userToAdd.id } },
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      }
    });

    await MomentumHistoryModel.create({
      action: 'ADD',
      entityType: 'PROJECT',
      entityId: project.id,
      associatedEntityType: 'USER',
      associatedEntityId: userToAdd.id,
      newValue: userToAdd.displayName,
      userId: currentUserId,
      companyId: companyId,
    });

    return newMember.user;
  } catch (error) {
    Logger.error(`Error adding member ${normalizedEmail} to project ${normalizedKey}: ${error.message}`);
    throw new ErrorResponse('Could not add member to project due to a server error', 500);
  }
};

/**
 * Removes a member from a project.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the company.
 * @param {string} userIdToRemove The ID of the user to remove.
 * @param {string} currentUserId The ID of the user performing the action.
 * @returns {Promise<boolean>} A promise that resolves to true if successful.
 */
export const removeProjectMember = async (projectKey, companyId, userIdToRemove, currentUserId) => {
  const normalizedKey = projectKey.toUpperCase();

  const project = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: { id: true, projectLeadId: true, name: true },
  });

  if (!project) {
    throw new ErrorResponse(`Project with key '${normalizedKey}' not found`, 404);
  }

  if (project.projectLeadId === userIdToRemove) {
    throw new ErrorResponse('Cannot remove the project lead. Please change the lead first.', 400);
  }

  const memberToRemove = await prisma.momentumProjectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: userIdToRemove } },
    include: { user: { select: { displayName: true } } }
  });

  if (!memberToRemove) {
    throw new ErrorResponse('User is not a member of this project.', 400);
  }

  try {
    await prisma.$transaction([
      prisma.momentumIssue.updateMany({
        where: { projectId: project.id, assigneeUserId: userIdToRemove },
        data: { assigneeUserId: null },
      }),
      prisma.momentumProjectMember.delete({
        where: { projectId_userId: { projectId: project.id, userId: userIdToRemove } },
      }),
    ]);

    await MomentumHistoryModel.create({
      action: 'REMOVE',
      entityType: 'PROJECT',
      entityId: project.id,
      associatedEntityType: 'USER',
      associatedEntityId: userIdToRemove,
      oldValue: memberToRemove.user.displayName,
      userId: currentUserId,
      companyId: companyId,
    });

    return true;
  } catch (error) {
    Logger.error(`Error removing member ${userIdToRemove} from project ${normalizedKey}: ${error.message}`);
    throw new ErrorResponse('Could not remove member from project due to a server error', 500);
  }
};

/**
 * Gets all members of a project.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the current company.
 * @returns {Promise<Array>} A promise that resolves to an array of project members.
 */
export const getProjectMembers = async (projectKey, companyId) => {
  const normalizedKey = projectKey.toUpperCase();
  const project = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: {
      id: true,
      projectLeadId: true,
      members: {
        select: {
          role: true,
          user: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          }
        },
        orderBy: { user: { displayName: 'asc' } },
      },
    },
  });

  if (!project) {
    return null;
  }

  return project.members.map(member => ({
    ...member.user,
    isLead: member.user.id === project.projectLeadId,
    projectRole: member.role,
  }));
};

/**
 * Fetches detailed statistics for a project.
 * @param {string} projectKey The key of the project.
 * @param {string} companyId The ID of the current company.
 * @returns {Promise<object>} A promise that resolves to the project statistics.
 */
export const getProjectStats = async (projectKey, companyId) => {
  const normalizedKey = projectKey.toUpperCase();
  const project = await prisma.project.findFirst({
    where: { key: normalizedKey, companyId: companyId },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const projectId = project.id;
  try {
    const [statusStatsRaw, typeStatsRaw, priorityStatsRaw, assigneeStatsRaw, recentIssues, recentComments] = await Promise.all([
      prisma.momentumIssue.groupBy({ by: ['status'], where: { projectId: projectId }, _count: { status: true }, orderBy: { _count: { status: 'desc' } } }),
      prisma.momentumIssue.groupBy({ by: ['type'], where: { projectId: projectId }, _count: { type: true }, orderBy: { _count: { type: 'desc' } } }),
      prisma.momentumIssue.groupBy({ by: ['priority'], where: { projectId: projectId }, _count: { priority: true }, orderBy: { _count: { priority: 'desc' } } }),
      prisma.momentumIssue.groupBy({ by: ['assigneeUserId'], where: { projectId: projectId, assigneeUserId: { not: null } }, _count: { assigneeUserId: true }, orderBy: { _count: { assigneeUserId: 'desc' } }, take: 5 }),
      prisma.momentumIssue.findMany({
        where: { projectId: projectId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          reporter: { select: { id: true, displayName: true, avatarUrl: true } },
          assignee: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      prisma.momentumComment.findMany({
        where: { issue: { projectId: projectId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { id: true, displayName: true, avatarUrl: true } },
          issue: { select: { id: true, title: true } },
        },
      }),
    ]);

    let assigneeStatsWithDetails = [];
    const validAssigneeIds = assigneeStatsRaw.map(stat => stat.assigneeUserId).filter(id => id != null);
    if (validAssigneeIds.length > 0) {
      const assignees = await prisma.userMain.findMany({ where: { id: { in: validAssigneeIds } }, select: { id: true, displayName: true, avatarUrl: true } });
      const assigneeMap = assignees.reduce((map, user) => ({ ...map, [user.id]: user }), {});
      assigneeStatsWithDetails = assigneeStatsRaw
        .map(stat => ({ assignee: assigneeMap[stat.assigneeUserId] || null, count: stat._count.assigneeUserId }))
        .filter(stat => stat.assignee !== null);
    }

    const formatStats = (stats, fieldName) => stats.map(s => ({ value: s[fieldName], count: s._count[fieldName] }));

    return {
      statusStats: formatStats(statusStatsRaw, 'status'),
      typeStats: formatStats(typeStatsRaw, 'type'),
      priorityStats: formatStats(priorityStatsRaw, 'priority'),
      assigneeStats: assigneeStatsWithDetails,
      recentActivity: { issues: recentIssues, comments: recentComments },
    };
  } catch (error) {
    Logger.error(`Error fetching stats for project ${normalizedKey}: ${error.message}`, { stack: error.stack });
    throw new ErrorResponse('Could not fetch project statistics due to a server error', 500);
  }
};

/**
 * @desc    Checks if a user is a member of a specific project within a company.
 * @param   {string} userId
 * @param   {string} companyId
 * @param   {string} projectId - Can be the project ID or key.
 * @param   {boolean} isAdmin - Flag to bypass membership check for admins.
 */
export const checkProjectMembership = async (userId, companyId, projectId, isAdmin) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { key: projectId.toUpperCase() }],
        companyId: companyId,
      },
      include: {
        members: {
          where: { userId: userId },
          select: { userId: true }
        }
      }
    });

    if (!project) {
      throw new ErrorResponse('Project not found in this company', 404);
    }

    const isMember = project.members.length > 0;

    if (!isMember && !isAdmin) {
      throw new ErrorResponse('Forbidden: You are not a member of this project', 403);
    }

    return project;
  } catch (error) {
    Logger.error(`[ProjectService.checkProjectMembership] Error for user ${userId} on project ${projectId}:`, error);
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse('Internal server error while verifying project membership.', 500);
  }
};

/**
 * @desc    Checks if a user is the project lead or an admin within a company.
 * @param   {string} userId
 * @param   {string} companyId
 * @param   {string} projectId - Can be the project ID or key.
 * @param   {boolean} isAdmin - Flag to bypass lead check for admins.
 */
export const checkProjectLeadOrAdmin = async (userId, companyId, projectId, isAdmin) => {
  try {
    let project;

    if (isAdmin) {
      project = await prisma.project.findFirst({
        where: {
          OR: [{ id: projectId }, { key: projectId.toUpperCase() }],
          companyId: companyId
        }
      });
    } else {
      project = await prisma.project.findFirst({
        where: {
          OR: [{ id: projectId }, { key: projectId.toUpperCase() }],
          companyId: companyId,
          projectLeadId: userId,
        }
      });
    }

    if (!project) {
      throw new ErrorResponse('Forbidden: You must be the project lead or an admin to perform this action', 403);
    }

    return project;
  } catch (error) {
    Logger.error(`[ProjectService.checkProjectLeadOrAdmin] Error for user ${userId} on project ${projectId}:`, error);
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse('Internal server error while verifying project lead privileges.', 500);
  }
};
