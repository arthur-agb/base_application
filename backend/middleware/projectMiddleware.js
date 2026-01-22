// src/middleware/projectMiddleware.js
import asyncHandler from 'express-async-handler';
import * as ProjectService from '../services/project.service.js'; // Assuming a new ProjectService
import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';

/**
 * Middleware to check if a user is a member of the specific project.
 */
const projectMember = asyncHandler(async (req, res, next) => {
  const { projectId, id, key } = req.params;
  const identifier = projectId || id || key;

  if (!identifier) {
    return next(new ErrorResponse('Project identifier is missing in request parameters', 400));
  }

  // Delegate the authorization and project retrieval to the service layer.
  const project = await ProjectService.checkProjectMembership(req.user.id, req.company?.id, identifier, req.user.role === 'ADMIN');
  
  // Attach the full project object to the request for subsequent handlers.
  req.project = project; 
  next();
});

/**
 * Middleware to check if a user is the project lead or an admin.
 */
const projectLeadOrAdmin = asyncHandler(async (req, res, next) => {
  const { projectId, id, key } = req.params;
  const identifier = projectId || id || key;

  if (!identifier) {
    return next(new ErrorResponse('Project identifier is missing in request parameters', 400));
  }

  // Delegate the authorization and project retrieval to the service layer.
  const project = await ProjectService.checkProjectLeadOrAdmin(req.user.id, req.company?.id, identifier, req.user.role === 'ADMIN');

  // Attach the full project object to the request for subsequent handlers.
  req.project = project; 
  next();
});

export {
  projectMember,
  projectLeadOrAdmin
};
