import express from 'express';
const router = express.Router();

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';
import * as commentController from '../controllers/comment.tenant.controller.js';

/**
 * @swagger
 * tags:
 *   - name: Comments
 *     description: Comment and reaction management (individual actions on comments)
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
 *     CommentAuthor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *         name:
 *           type: string
 *           example: \"Jane Doe\"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: \"https://example.com/avatar.png\"
 *     CommentReactionValue:
 *       type: array
 *       items:
 *         type: string
 *         description: User ID who reacted.
 *       example: [\"clxko2x9s000008l3gwpw0h9d\", \"clxko2x9t000108l3h3q4a7z6\"]
 *     CommentReactions:
 *       type: object
 *       additionalProperties:
 *         $ref: '#/components/schemas/CommentReactionValue'
 *       example:
 *         like: [\"clxko2x9s000008l3gwpw0h9d\"]
 *         heart: [\"clxko2x9t000108l3h3q4a7z6\", \"clxko2x9u000208l3akf92dp0\"]
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *         body:
 *           type: string
 *           example: \"This is a comment.\"
 *         author:
 *           $ref: '#/components/schemas/CommentAuthor'
 *         issueId:
 *           type: string
 *           example: \"clxko2x9t000108l3h3q4a7z6\"
 *         parentCommentId:
 *           type: string
 *           nullable: true
 *           example: null
 *         edited:
 *           type: boolean
 *           example: false
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         editedBy:
 *           $ref: '#/components/schemas/CommentAuthor'
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment' # Recursive definition for replies
 *         reactions:
 *           $ref: '#/components/schemas/CommentReactions'
 *           nullable: true
 *     CommentRequestBody:
 *       type: object
 *       required:
 *         - body
 *       properties:
 *         body:
 *           type: string
 *           description: The text content of the comment or reply.
 *           example: \"This is an insightful comment.\"
 *     ReactionRequestBody:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           description: The type of reaction (e.g., 'like', 'thumbsup', 'heart').
 *           example: \"like\"
 *     CommentReactionResponse:
 *       type: object
 *       properties:
 *         commentId:
 *           type: string
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *         reactions:
 *           $ref: '#/components/schemas/CommentReactions'
 *           nullable: true
 *     UserCommentIssueProject:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           example: \"PROJ\"
 *         name:
 *           type: string
 *           example: \"Project Alpha\"
 *     UserCommentIssue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxko2x9t000108l3h3q4a7z6\"
 *         title:
 *           type: string
 *           example: \"Fix login button\"
 *         project:
 *           $ref: '#/components/schemas/UserCommentIssueProject'
 *     UserCommentListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         body:
 *           type: string
 *         author:
 *           $ref: '#/components/schemas/CommentAuthor'
 *         editedBy:
 *           $ref: '#/components/schemas/CommentAuthor'
 *           nullable: true
 *         issue:
 *           $ref: '#/components/schemas/UserCommentIssue'
 *         createdAt:
 *           type: string
 *           format: date-time
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
 *     UserCommentsResponse:
 *       type: object
 *       properties:
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserCommentListItem'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationDetails'
 */

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the comment to update.
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentRequestBody'
 *     responses:
 *       '200':
 *         description: Comment updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       '400':
 *         description: Invalid input (e.g., commentId format, missing body).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User is not the author or lacks project permissions (Admin/Lead) to update.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Comment or associated issue/project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:commentId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId('commentId'),
  Validators.createComment(),
  validate,
  commentController.updateComment
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the comment to delete.
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *     responses:
 *       '200':
 *         description: Comment deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: \"Comment deleted successfully\"
 *                 id:
 *                   type: string
 *                   example: \"clxkrg8ps000008l3b7wd1a2b\"
 *       '400':
 *         description: Invalid commentId format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User is not the author or lacks project permissions (Admin/Lead) to delete.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Comment or associated issue/project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:commentId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId('commentId'),
  validate,
  commentController.deleteComment
);

/**
 * @swagger
 * /api/comments/{commentId}/replies:
 *   post:
 *     summary: Add a reply to a comment
 *     tags: [Comments]
 *     description: This endpoint creates a new comment that is a reply to the specified commentId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the parent comment to reply to.
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentRequestBody' # Reply also needs a body
 *     responses:
 *       '201':
 *         description: Reply added successfully. Returns the newly created reply comment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       '400':
 *         description: Invalid input (e.g., commentId format, missing body).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User is not a member of the comment's project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Parent comment, associated issue, or project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:commentId/replies',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId('commentId'),
  Validators.createComment(),
  validate,
  commentController.createComment
);

/**
 * @swagger
 * /api/comments/{commentId}/reactions:
 *   put:
 *     summary: Add or remove a reaction to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the comment to react to.
 *           example: \"clxkrg8ps000008l3b7wd1a2b\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReactionRequestBody'
 *     responses:
 *       '200':
 *         description: Reaction toggled successfully. Returns the updated reactions for the comment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentReactionResponse'
 *       '400':
 *         description: Invalid input (e.g., commentId format, missing or invalid reaction type).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User is not a member of the comment's project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Comment, associated issue, or project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:commentId/reactions',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId('commentId'),
  validate,
  commentController.toggleReaction
);

/**
 * @swagger
 * /api/comments/user/{userIdToQuery}:
 *   get:
 *     summary: Get all comments by a specific user
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: path
 *         name: userIdToQuery
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the user whose comments are to be fetched.
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
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
 *         description: Number of comments per page.
 *     responses:
 *       '200':
 *         description: Successfully retrieved user's comments.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCommentsResponse'
 *       '400':
 *         description: Invalid input (e.g., userIdToQuery format, invalid pagination).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User is not an Admin or not the user being queried.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/user/:userIdToQuery',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('userIdToQuery'),
  validate,
  commentController.getUserComments
);

export default router;