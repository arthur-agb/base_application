// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import * as AuthService from '../services/auth.service.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Middleware to protect routes - verifies JWT token and attaches decoded payload to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized, no token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId || null,
    };
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ErrorResponse('Not authorized, token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new ErrorResponse('Not authorized, token is invalid', 401));
    } else {
      return next(new ErrorResponse('Not authorized', 401));
    }
  }
});

/**
 * Middleware to fetch the full user profile and attach to the request.
 */
const getFullUser = asyncHandler(async (req, res, next) => {
  const user = await AuthService.findUserWithCompaniesAndProjects(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  req.user = { ...req.user, ...user }; // Merge decoded info with full user profile
  next();
});

/**
 * Middleware to check if user is an admin.
 * This should be placed after the getFullUser middleware in the route chain.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    next(new ErrorResponse('Forbidden: requires admin privileges', 403));
  }
};

/**
 * Middleware to check if user is a member of the specific project.
 */
const projectMember = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  await AuthService.checkProjectMembership(req.user.id, projectId);
  next();
});

/**
 * Middleware to check if user is the project lead or an admin.
 */
const projectLeadOrAdmin = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  await AuthService.checkProjectLeadOrAdmin(req.user.id, req.user.role, projectId);
  next();
});

/**
 * Middleware to check if user is a member of the project associated with the board.
 */
const boardProjectMember = asyncHandler(async (req, res, next) => {
  const boardId = req.params.id;
  await AuthService.checkBoardProjectMembership(req.user.id, boardId);
  next();
});

/**
 * Middleware to check if user is the project lead or an admin of the project associated with the board.
 */
const boardProjectLeadOrAdmin = asyncHandler(async (req, res, next) => {
  const boardId = req.params.id;
  await AuthService.checkBoardProjectLeadOrAdmin(req.user.id, req.user.role, boardId);
  next();
});

/**
 * Middleware to check if user is a member of the project associated with the column.
 */
const columnProjectMember = asyncHandler(async (req, res, next) => {
  const columnId = req.params.id;
  await AuthService.checkColumnProjectMembership(req.user.id, columnId);
  next();
});

export {
  protect,
  getFullUser,
  admin,
  projectMember,
  projectLeadOrAdmin,
  boardProjectMember,
  boardProjectLeadOrAdmin,
  columnProjectMember,
};
