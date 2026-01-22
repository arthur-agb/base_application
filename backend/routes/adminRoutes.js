// routes/adminRoutes.js
import express from 'express';
const router = express.Router();

import {
  getPendingUsers,
  approveUserController,
  rejectUserController,
  resendVerificationEmailController,
} from '../controllers/admin.global.controller.js';

import { protect, admin, getFullUser } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   - name: Admin User Management
 *     description: API for admin to manage users, including approval, rejection, and fetching user lists.
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     UserListFields:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *           example: clx0k2z000000v9ps9z9g3z9g
 *         name:
 *           type: string
 *           description: User's name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date of registration
 *           example: '2024-01-01T12:00:00Z'
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *           example: false
 *
 *     PendingUsersResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserListFields'
 *         total:
 *           type: integer
 *           example: 5
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *
 *     AdminActionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: User approved successfully.
 *         user:
 *           $ref: '#/components/schemas/UserListFields'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Unauthorized
 *
 * paths:
 *   /admin/pending-users:
 *     get:
 *       tags:
 *         - Admin User Management
 *       summary: Get list of pending users awaiting admin approval
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Page number (default 1)
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Items per page (default 20)
 *       responses:
 *         '200':
 *           description: List of pending users
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PendingUsersResponse'
 *         '401':
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Forbidden - not an admin
 *
 *   /admin/users/{id}/approve:
 *     post:
 *       tags:
 *         - Admin User Management
 *       summary: Approve a pending user
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user to approve
 *       responses:
 *         '200':
 *           description: User approved
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminActionResponse'
 *         '401':
 *           $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Forbidden
 *
 *   /admin/users/{id}/reject:
 *     post:
 *       tags:
 *         - Admin User Management
 *       summary: Reject a pending user
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user to reject
 *       requestBody:
 *         required: false
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reason:
 *                   type: string
 *                   example: Invalid documents
 *       responses:
 *         '200':
 *           description: User rejected
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminActionResponse'
 *         '401':
 *           $ref: '#/components/schemas/ErrorResponse'
 *
 *   /admin/users/{id}/resend-verification:
 *     post:
 *       tags:
 *         - Admin User Management
 *       summary: Resend verification email to a user
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user to resend verification to
 *       responses:
 *         '200':
 *           description: Verification email resent
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminActionResponse'
 *         '401':
 *           $ref: '#/components/schemas/ErrorResponse'
 */

// --- Admin User Management Routes ---

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get users by status, with pagination, search, and sort
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter users by status (e.g., PENDING_APPROVAL, ACTIVE). Can be a single status or comma-separated for multiple.
 *         example: PENDING_APPROVAL
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page (max 100).
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for user name or email.
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [name, email, createdAt, status, role]
 *         description: Field to sort users by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending).
 *     responses:
 *       200:
 *         description: A list of users matching the criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserListFields'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalUsers:
 *                   type: integer
 *                   example: 48
 *       400:
 *         description: Invalid input for query parameters (e.g., page, limit).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authorized, token failed or no token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden, user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error while fetching users.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/users')
  .get(protect, getFullUser, admin, getPendingUsers);

/**
 * @swagger
 * /admin/users/{userId}/approve:
 *   put:
 *     summary: Approve a user's registration
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to approve.
 *         example: clx0k2z000000v9ps9z9g3z9g
 *     responses:
 *       200:
 *         description: User approved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User approved successfully.
 *                 user:
 *                   $ref: '#/components/schemas/UserListFields'
 *       400, 401, 403, 404, 500:
 *         description: Appropriate error response.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/users/:userId/approve')
  .put(protect, getFullUser, admin, approveUserController);

/**
 * @swagger
 * /admin/users/{userId}/reject:
 *   put:
 *     summary: Reject a user's registration
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to reject.
 *         example: clx0k2z000000v9ps9z9g3z9g
 *     requestBody:
 *       description: Optional reason for rejection.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejecting the user.
 *                 example: Information provided was insufficient.
 *     responses:
 *       200:
 *         description: User rejected successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User rejected successfully.
 *                 user:
 *                   $ref: '#/components/schemas/UserListFields'
 *       400, 401, 403, 404, 500:
 *         description: Appropriate error response.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/users/:userId/reject')
  .put(protect, getFullUser, admin, rejectUserController);

/**
 * @swagger
 * /admin/users/{userId}/resend-verification:
 *   post:
 *     summary: Resend verification email to a user
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to resend the verification email to.
 *         example: clx0k2z000000v9ps9z9g3z9g
 *     responses:
 *       200:
 *         description: Verification email resend process initiated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification email resend process initiated for user@example.com. (Email sending not yet implemented)
 *       400, 401, 403, 404, 500:
 *         description: Appropriate error response.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/users/:userId/resend-verification')
  .post(protect, getFullUser, admin, resendVerificationEmailController);

export default router;
