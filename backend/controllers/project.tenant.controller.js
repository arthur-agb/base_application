// controllers/project.tenant.controller.js
import asyncHandler from 'express-async-handler';

// Utils imports
import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';

// New Service Layer imports
import * as projectService from '../services/project.service.js';

// @desc    Get all projects for the authenticated user for the current company
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res, next) => {
  const companyId = req.company?.id || null;
  const { id: userId, role: globalRole } = req.user;
  const userCompanyRole = req.userCompanyRole;
  const includeArchived = req.query.includeArchived === 'true';

  const projectsWithCount = await projectService.getProjectsForUser(companyId, userId, userCompanyRole, includeArchived, globalRole);
  res.status(200).json(projectsWithCount);
});

// @desc    Create a new project within the current company
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res, next) => {
  const { name, key, description } = req.body;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  if (!name || !key) {
    return next(new ErrorResponse('Please provide project name and key', 400));
  }

  try {
    const newProject = await projectService.createProjectTransaction({ name, key, description }, companyId, userId);
    Logger.info(`Project "${newProject.name}" (${newProject.key}) created successfully in company ${companyId} by ${req.user.email}`);
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
});

// @desc    Get a project by its Key from the current company
// @route   GET /api/projects/:key
// @access  Private (Project Member or Admin)
const getProjectByKey = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  const projectData = await projectService.getProjectByKey(projectKey, companyId);

  if (!projectData) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found`, 404));
  }

  const { project } = projectData;

  const isMember = project.members.some(member => member.id === userId);
  const isLead = project.projectLeadId === userId;
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(req.userCompanyRole);
  const isGlobalAdmin = req.user.role === 'ADMIN';

  if (!isMember && !isLead && !isCompanyExempt && !isGlobalAdmin) {
    return next(new ErrorResponse('Not authorized to view this project', 403));
  }

  res.status(200).json(projectData);
});

// @desc    Update a project (by Key) in the current company
// @route   PUT /api/projects/:key
// @access  Private (Project Lead or Admin)
const updateProject = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const userId = req.user.id;
  const companyId = req.company?.id || null;
  const { name, description, projectLeadId, isArchived } = req.body;
  const isAdmin = req.user.role === 'ADMIN';

  const projectToUpdate = await projectService.getProjectByKey(projectKey, companyId);
  if (!projectToUpdate) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }

  const isLead = projectToUpdate.project.projectLead?.id === userId;
  const isCompanyAdminOrManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(req.userCompanyRole);

  if (!isLead && !isCompanyAdminOrManager && !isAdmin) {
    return next(new ErrorResponse('Not authorized to update this project', 403));
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (projectLeadId !== undefined) updateData.projectLeadId = projectLeadId;
  if (isArchived !== undefined) updateData.isArchived = isArchived;


  if (Object.keys(updateData).length === 0) {
    return res.status(200).json(projectToUpdate);
  }

  try {
    const updatedProjectData = await projectService.updateProject(projectKey, updateData, companyId, userId);
    Logger.info(`Project "${updatedProjectData.name}" (${updatedProjectData.key}) updated by ${req.user.email}.`);
    res.status(200).json(updatedProjectData);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a project (by Key) from the current company
// @route   DELETE /api/projects/:key
// @access  Private (Project Lead or Admin)
const deleteProject = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  const project = await projectService.getProjectByKey(projectKey, companyId);

  if (!project) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }

  const isLead = project.project.projectLead?.id === userId;
  const isCompanyAdminOrManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(req.userCompanyRole);

  if (!isLead && !isCompanyAdminOrManager && req.user.role !== 'ADMIN') {
    return next(new ErrorResponse('Not authorized to delete this project', 403));
  }

  try {
    const deletedProjectName = await projectService.deleteProject(projectKey, companyId, userId);
    Logger.info(`Project "${deletedProjectName}" (${projectKey.toUpperCase()}) deleted by ${req.user.email}`);
    res.status(200).json({ message: `Project '${deletedProjectName}' deleted successfully` });
  } catch (error) {
    next(error);
  }
});

// @desc    Get members of a project (by Key) from the current company
// @route   GET /api/projects/:key/members
// @access  Private (Project Member or Admin)
const getProjectMembers = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  const members = await projectService.getProjectMembers(projectKey, companyId);

  if (!members) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }

  const isMember = members.some(member => member.id === userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(req.userCompanyRole);
  const isGlobalAdmin = req.user.role === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    return next(new ErrorResponse('Not authorized to view project members', 403));
  }

  res.status(200).json(members);
});

// @desc    Add a member to a project (by Key) in the current company
// @route   POST /api/projects/:key/members
// @access  Private (Project Lead or Admin)
const addProjectMember = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const { email: emailToAdd } = req.body;
  const currentUserId = req.user.id;
  const companyId = req.company?.id || null;

  if (!emailToAdd || typeof emailToAdd !== 'string' || !/\S+@\S+\.\S+/.test(emailToAdd)) {
    return next(new ErrorResponse('Valid user email is required', 400));
  }

  const projectMembers = await projectService.getProjectMembers(projectKey, companyId);
  if (!projectMembers) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }
  const projectLead = projectMembers.find(member => member.isLead);
  const isCompanyAdminOrManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(req.userCompanyRole);

  if (!(isCompanyAdminOrManager || req.user.role === 'ADMIN')) {
    return next(new ErrorResponse('Not authorized to add members to this project. Only company managers and above can manage project members.', 403));
  }

  try {
    const newMember = await projectService.addProjectMember(projectKey, companyId, emailToAdd, currentUserId);
    res.status(201).json(newMember);
  } catch (error) {
    next(error);
  }
});


// @desc    Remove a member from a project (by Key and User ID) in the current company
// @route   DELETE /api/projects/:key/members/:userId
// @access  Private (Project Lead or Admin)
const removeProjectMember = asyncHandler(async (req, res, next) => {
  const { key: projectKey, userId: userIdToRemove } = req.params;
  const currentUserId = req.user.id;
  const companyId = req.company?.id || null;

  const projectMembers = await projectService.getProjectMembers(projectKey, companyId);

  if (!projectMembers) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }

  const projectLead = projectMembers.find(member => member.isLead);
  const isCompanyAdminOrManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(req.userCompanyRole);

  if (!(isCompanyAdminOrManager || req.user.role === 'ADMIN')) {
    return next(new ErrorResponse('Not authorized to remove members from this project. Only company managers and above can manage project members.', 403));
  }

  if (projectLead?.id === userIdToRemove) {
    return next(new ErrorResponse('Cannot remove the project lead. Please change the lead first.', 400));
  }

  if (userIdToRemove === currentUserId && req.user.role !== 'ADMIN') {
    return next(new ErrorResponse('You cannot remove yourself from the project. Ask the Project Lead or an Admin.', 403));
  }

  // --- CORRECTED: Changed 'member.user.id' to 'member.id' ---
  const isMember = projectMembers.some(member => member.id === userIdToRemove);
  if (!isMember) {
    return next(new ErrorResponse(`User with ID ${userIdToRemove} is not a member of this project.`, 400));
  }

  try {
    await projectService.removeProjectMember(projectKey, companyId, userIdToRemove, currentUserId);
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});


// @desc    Get project statistics (by Key) for the current company
// @route   GET /api/projects/:key/stats
// @access  Private (Project Member or Admin)
const getProjectStats = asyncHandler(async (req, res, next) => {
  const projectKey = req.params.key;
  const userId = req.user.id;
  const companyId = req.company?.id || null;

  const projectMembers = await projectService.getProjectMembers(projectKey, companyId);
  if (!projectMembers) {
    return next(new ErrorResponse(`Project with key '${projectKey.toUpperCase()}' not found in your company`, 404));
  }

  const isMember = projectMembers.some(member => member.id === userId);
  const isCompanyExempt = ['OWNER', 'ADMIN'].includes(req.userCompanyRole);
  const isGlobalAdmin = req.user.role === 'ADMIN';

  if (!isMember && !isCompanyExempt && !isGlobalAdmin) {
    return next(new ErrorResponse('Not authorized to view project statistics', 403));
  }

  try {
    const stats = await projectService.getProjectStats(projectKey, companyId);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});


export {
  getProjects,
  createProject,
  getProjectByKey,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectStats
};
