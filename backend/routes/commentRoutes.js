// routes/commentRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import {
    createComment,
    getCommentsForIssue,
    updateComment,
    deleteComment,
    toggleReaction,
    getUserComments
} from '../controllers/comment.tenant.controller.js';

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API for managing comments on issues, including replies and reactions.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSimple:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cluser123"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/avatar.png"
 *     ReactionMap:
 *       type: object
 *       description: A map of reaction types to an array of user IDs who made that reaction.
 *       additionalProperties:
 *         type: array
 *         items:
 *           type: string
 *           description: User ID
 *           example: ["cluser123", "cluser456"]
 *       example:
 *         thumbsup: ["cluser123", "cluser456"]
 *         heart: ["cluser123"]
 *     CommentBase: # Base for recursive definition
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clcomment789"
 *         body:
 *           type: string
 *           example: "This is a great point!"
 *         author:
 *           $ref: '#/components/schemas/UserSimple'
 *         issueId:
 *           type: string
 *           example: "clissue456"
 *         parentCommentId:
 *           type: string
 *           nullable: true
 *           example: "clcomment123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         edited:
 *           type: boolean
 *           example: false
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         editedBy:
 *           $ref: '#/components/schemas/UserSimple'
 *           nullable: true
 *         reactions:
 *           $ref: '#/components/schemas/ReactionMap'
 *           nullable: true
 *     CommentWithReplies: # Comment schema that includes replies
 *       allOf:
 *         - $ref: '#/components/schemas/CommentBase'
 *         - type: object
 *           properties:
 *             replies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentBase'
 *               description: Direct replies to this comment.
 *     CommentForUserList: # Simplified comment for user's comment list (no deep replies/reactions by default from controller)
 *       allOf:
 *         - $ref: '#/components/schemas/CommentBase'
 *         - type: object
 *           properties:
 *             issue: # Added based on getUserComments include
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clissue456"
 *                 title:
 *                   type: string
 *                   example: "Fix login button"
 *                 project:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "PROJ"
 *                     name:
 *                       type: string
 *                       example: "Project Phoenix"
 *     CommentCreateRequest:
 *       type: object
 *       required:
 *         - body
 *       properties:
 *         body:
 *           type: string
 *           description: The content of the comment.
 *           example: "Let's discuss this further."
 *         parentCommentId:
 *           type: string
 *           description: The ID of the parent comment if this is a reply.
 *           example: "clcomment123"
 *     CommentUpdateRequest:
 *       type: object
 *       required:
 *         - body
 *       properties:
 *         body:
 *           type: string
 *           description: The updated content of the comment.
 *           example: "I've updated my thoughts on this."
 *     ToggleReactionRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           description: The type of reaction (e.g., 'thumbsup', 'heart').
 *           example: "thumbsup"
 *     ToggleReactionResponse:
 *       type: object
 *       properties:
 *         commentId:
 *           type: string
 *           example: "clcomment789"
 *         reactions:
 *           $ref: '#/components/schemas/ReactionMap'
 *     DeleteCommentResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Comment deleted successfully"
 *         id:
 *           type: string
 *           example: "clcomment789"
 *     Pagination:
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
 *           example: 50
 *         pages:
 *           type: integer
 *           example: 5
 *     UserCommentsResponse:
 *       type: object
 *       properties:
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CommentForUserList'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Issue not found"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// --- Routes for comments related to a specific issue ---

/**
 * @swagger
 * /issues/{issueId}/comments:
 *   post:
 *     summary: Create a new comment or reply on an issue
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
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the issue to comment on.
 *         example: "clissue456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateRequest'
 *     responses:
 *       '201':
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentWithReplies'
 *       '400':
 *         description: Bad Request (e.g., comment body required).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token failed or no token.
 *       '403':
 *         description: Forbidden (user not authorized for this project).
 *       '404':
 *         description: Not Found (e.g., Issue or Parent Comment not found).
 *   get:
 *     summary: Get all comments for an issue
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
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the issue.
 *         example: "clissue456"
 *     responses:
 *       '200':
 *         description: Successfully retrieved comments. Returns top-level comments with their direct replies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentWithReplies'
 *       '401':
 *         description: Not authorized, token failed or no token.
 *       '403':
 *         description: Forbidden (user not authorized for this project).
 *       '404':
 *         description: Not Found (e.g., Issue not found).
 */
router.route('/issues/:issueId/comments')
    .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), createComment)
    .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getCommentsForIssue);

// --- Routes for specific comments ---
router.route('/comments/:commentId')
    .put(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), updateComment)
    .delete(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), deleteComment);

/**
 * @swagger
 * /comments/{commentId}:
 *   put:
 *     summary: Update a specific comment
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
 *         description: The ID of the comment to update.
 *         example: "clcomment789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdateRequest'
 *     responses:
 *       '200':
 *         description: Comment updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentWithReplies'
 *       '400':
 *         description: Bad Request (e.g., comment body required).
 *       '401':
 *         description: Not authorized, token failed or no token.
 *       '403':
 *         description: Forbidden (user not authorized to update this comment or access project).
 *       '404':
 *         description: Not Found (e.g., Comment, Issue, or Project not found).
 *   delete:
 *     summary: Delete a specific comment
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
 *         description: The ID of the comment to delete.
 *         example: "clcomment789"
 * */
// --- Route for reactions ---
router.route('/comments/:commentId/reactions')
    .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), toggleReaction);

/**
 * @swagger
 * /comments/{commentId}/reactions:
 *   post:
 *     summary: Toggle a reaction on a comment
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
 *         description: The ID of the comment to react to.
 *         example: "clcomment789"
 */
// --- Route for user's comments ---
router.route('/comments/user/:userId')
    .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getUserComments);

/**
 * @swagger
 * /comments/user/{userId}:
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose comments are to be retrieved.
 *         example: "cluser123"
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
 */

export default router;