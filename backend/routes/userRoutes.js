// routes/userRoutes.js
import express from 'express';
const router = express.Router();

// Ensure all necessary controllers are imported, including the new getMyProfile
import {
  getUsers,
  listUsersForAssignment,
  updateUser,
  updateProfile,
  getMyProfile,
  deleteUser,
  getUserIssues,
  searchUsers,
  getUserByEmail,
} from '../controllers/user.global.controller.js';

import { protect, admin } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         stack:
 *           type: string
 *           nullable: true
 *
 *     UserRoleEnum:
 *       type: string
 *       enum: [USER, DEVELOPER, MANAGER, ADMIN]
 *       example: DEVELOPER
 *
 *     UserStatusEnum:
 *       type: string
 *       enum: [PENDING_VERIFICATION, PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED]
 *       example: ACTIVE
 *
 *     FontSizeEnum:
 *       type: string
 *       enum: [SMALL, MEDIUM, LARGE]
 *       example: MEDIUM
 *
 *     ThemePreferenceEnum:
 *       type: string
 *       enum: [LIGHT, DARK, SYSTEM]
 *       example: SYSTEM
 *
 *     IssueTypeEnum:
 *       type: string
 *       enum: [STORY, TASK, BUG, SUB_TASK]
 *       example: TASK
 *
 *     IssuePriorityEnum:
 *       type: string
 *       enum: [HIGHEST, HIGH, MEDIUM, LOW, LOWEST]
 *       example: MEDIUM
 *
 *     UserProfileSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: "ID of the profile settings record."
 *         userId:
 *           type: string
 *           description: "ID of the user these settings belong to."
 *         themePreference:
 *           $ref: '#/components/schemas/ThemePreferenceEnum'
 *           default: "SYSTEM"
 *         fontSize:
 *           $ref: '#/components/schemas/FontSizeEnum'
 *           default: "MEDIUM"
 *         highContrast:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserBase:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9s000008l3gwpw0h9d"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           nullable: true
 *           example: "John Doe"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/avatar.png"
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Software Developer"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/UserBase'
 *         - type: object
 *           properties:
 *             profileSettings:
 *               $ref: '#/components/schemas/UserProfileSettings'
 *               nullable: true
 *
 *     UserAssignmentItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9s000008l3gwpw0h9d"
 *         name:
 *           type: string
 *           nullable: true
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.assign@example.com"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/avatar_jane.png"
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *
 *     UserStats:
 *       type: object
 *       properties:
 *         projectCount:
 *           type: integer
 *           example: 5
 *         assignedIssuesCount:
 *           type: integer
 *           example: 10
 *         reportedIssuesCount:
 *           type: integer
 *           example: 3
 *         commentsMadeCount:
 *           type: integer
 *           example: 25
 *         completedIssuesCount:
 *           type: integer
 *           example: 7
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "issue_update"
 *               issueId:
 *                 type: string
 *               issueTitle:
 *                 type: string
 *               projectKey:
 *                 type: string
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *
 *     UserWithStatsResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/UserResponse'
 *         - type: object
 *           properties:
 *             stats:
 *               type: object
 *               properties:
 *                 projectCount:
 *                   type: integer
 *                   example: 2
 *                 assignedIssuesCount:
 *                   type: integer
 *                   example: 5
 *
 *     UserListAdminItem:
 *       $ref: '#/components/schemas/UserResponse'
 *
 *     PaginationDetails:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         pages:
 *           type: integer
 *           example: 10
 *
 *     UserListAdminResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserListAdminItem'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationDetails'
 *
 *     UserUpdateRequestAdmin:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Jane Doe Updated"
 *         email:
 *           type: string
 *           format: email
 *           description: "New email address. If provided and different, will be updated."
 *           example: "jane.doe.updated@example.com"
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *           example: "ADMIN"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Senior Software Developer"
 *         profileSettings:
 *           type: object
 *           properties:
 *             themePreference:
 *               $ref: '#/components/schemas/ThemePreferenceEnum'
 *             fontSize:
 *               $ref: '#/components/schemas/FontSizeEnum'
 *             highContrast:
 *               type: boolean
 *
 *     UserProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "My New Name"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "My updated bio."
 *         profileSettings:
 *           type: object
 *           properties:
 *             themePreference:
 *               $ref: '#/components/schemas/ThemePreferenceEnum'
 *             fontSize:
 *               $ref: '#/components/schemas/FontSizeEnum'
 *             highContrast:
 *               type: boolean
 *
 *     UserIssueListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *         priority:
 *           $ref: '#/components/schemas/IssuePriorityEnum'
 *         type:
 *           $ref: '#/components/schemas/IssueTypeEnum'
 *         project:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             key:
 *               type: string
 *             reporter:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                   format: url
 *                   nullable: true
 *             column:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserIssuesResponse:
 *       type: object
 *       properties:
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserIssueListItem'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationDetails'
 *
 *     UserSearchItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: "oldSecurePassword123"
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "newVerySecurePassword456"
 *
 * tags:
 *   - name: Users
 *     description: User management and profile operations
 */

// --- Non-Admin Routes ---

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get a list of users for assignment purposes
 *     description: Retrieve a list of users, filterable by role and status. Defaults to ACTIVE users if status is not provided.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *         required: false
 *         description: Filter users by their role (e.g., DEVELOPER, MANAGER).
 *         example: "DEVELOPER"
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/UserStatusEnum'
 *         required: false
 *         description: "Filter users by their status. Defaults to ACTIVE if not specified."
 *         example: "ACTIVE"
 *     responses:
 *       '200':
 *         description: Successfully retrieved a list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAssignmentItem'
 *       '400':
 *         description: Bad request (e.g., invalid role or status value).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 */
router.get('/', protect, listUsersForAssignment); // MODIFIED: Uses listUsersForAssignment

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by name or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           minLength: 2
 *         required: true
 *         description: Search query (min 2 characters).
 *         example: "john"
 *     responses:
 *       '200':
 *         description: A list of users matching the search query.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSearchItem'
 *       '400':
 *         description: Bad request (e.g., query parameter validation failed if Validators.search() is used).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 */
router.get('/search', protect, Validators.search(), validate, searchUsers);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved current user's profile, including profile settings.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '404':
 *         description: User profile not found.
 *   put:
 *     summary: Update current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdateRequest'
 *     responses:
 *       '200':
 *         description: Profile updated successfully. Returns the updated user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 */
router.get('/profile', protect, tenantContext, getMyProfile); // MODIFIED: Uses getMyProfile controller
router.put('/profile', protect, tenantContext, updateProfile);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       '200':
 *         description: Password changed successfully (Not Implemented).
 *       '400':
 *         description: Bad request (e.g., current password incorrect, new password doesn't meet criteria) (Not Implemented).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '501':
 *         description: Not Implemented.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put('/password', protect, (req, res) => {
  res.status(501).json({ message: 'Change password function not implemented yet' });
});

/**
 * @swagger
 * /api/users/issues:
 *   get:
 *     summary: Get issues assigned to the current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by issue status.
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/IssuePriorityEnum'
 *         description: Filter by issue priority.
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/IssueTypeEnum'
 *         description: Filter by issue type.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "updatedAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *     responses:
 *       '200':
 *         description: A list of issues assigned to the current user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserIssuesResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 */
router.get('/issues', protect, getUserIssues);

/**
 * @swagger
 * /api/users/projects:
 *   get:
 *     summary: Get projects the current user is a member of
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '501':
 *         description: Not Implemented.
 */
router.get('/projects', protect, (req, res) => {
  res.status(501).json({ message: 'Get user projects function not implemented yet' });
});

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload avatar for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The avatar image file to upload.
 *     responses:
 *       '200':
 *         description: Avatar uploaded successfully (Not Implemented).
 *       '400':
 *         description: Bad request (e.g., no file, invalid file type) (Not Implemented).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '501':
 *         description: Not Implemented.
 */
router.post('/avatar', protect, (req, res) => {
  res.status(501).json({ message: 'Upload avatar function not implemented yet' });
});

/**
 * @swagger
 * /api/users/activity:
 *   get:
 *     summary: Get activity log for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '501':
 *         description: Not Implemented.
 */
router.get('/activity', protect, (req, res) => {
  res.status(501).json({ message: 'Get user activity function not implemented yet' });
});

// --- Admin Routes ---

/**
 * @swagger
 * /api/users/list-all:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "createdAt"
 *         description: Field to sort by.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: Sort order.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email.
 *     responses:
 *       '200':
 *         description: A paginated list of users.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListAdminResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user is not an admin.
 */
router.get('/list-all', protect, admin, getUsers);

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Update any user by email query parameter (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: The original email of the user to update.
 *         example: "user.to.update@example.com"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequestAdmin'
 *     responses:
 *       '200':
 *         description: User updated successfully. Returns the updated user data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       '400':
 *         description: Bad request.
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 *       '409':
 *         description: Conflict, new email address is already in use.
 */
router.put('/', protect, admin, updateUser); // This is PUT /api/users (Admin)

/**
 * @swagger
 * /api/users/{email}:
 *   delete:
 *     summary: Delete any user by email (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: The email of the user to delete.
 *         example: "user.to.delete@example.com"
 *     responses:
 *       '200':
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       '400':
 *         description: Bad request (e.g., cannot delete own account, user is project lead).
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 */
router.delete('/:email', protect, admin, deleteUser);


export default router;