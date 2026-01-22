// routes/commentsForIssueRoutes.js
import express from 'express';
const router = express.Router({ mergeParams: true }); // ESSENTIAL: to get :issueId from parent router
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js'; // Assuming your comment body validation is here
import * as commentController from '../controllers/comment.tenant.controller.js';

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API for managing comments on issues, including replies and reactions. (This section focuses on comments nested under a specific issue)
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
 *     CommentBase:
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
 *     CommentWithReplies:
 *       allOf:
 *         - $ref: '#/components/schemas/CommentBase'
 *         - type: object
 *           properties:
 *             replies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentBase'
 *               description: Direct replies to this comment.
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

/**
 * @swagger
 * /issues/{issueId}/comments:
 *   get:
 *     summary: Get all comments for a specific issue
 *     tags: [Comments]
 *     description: Retrieves all top-level comments for a given issue, along with their direct replies and reactions. User must be a member of the project to which the issue belongs.
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
 *         description: The ID of the issue for which to retrieve comments.
 *         example: "clissue456"
 *     responses:
 *       '200':
 *         description: Successfully retrieved comments for the issue.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentWithReplies'
 *       '401':
 *         description: Not authorized, token failed or no token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (e.g., user not a member of the project).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Issue not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Add a new comment or reply to an issue
 *     tags: [Comments]
 *     description: Creates a new comment or a reply to an existing comment on a specific issue. User must be a member of the project.
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
 *         description: The ID of the issue to add a comment to.
 *         example: "clissue456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateRequest'
 *     responses:
 *       '201':
 *         description: Comment or reply created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentWithReplies'
 *       '400':
 *         description: Bad Request (e.g., comment body is required, validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token failed or no token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (e.g., user not a member of the project).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Not Found (e.g., Issue not found, or parent comment not found).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/')
    .get(
        protect,
        tenantContext,
        checkCompanyRole(CompanyUserRole.VIEWER),
        commentController.getCommentsForIssue
    )
    .post(
        protect,
        tenantContext,
        checkCompanyRole(CompanyUserRole.MEMBER),
        Validators.createComment(),
        validate,
        commentController.createComment
    );

export default router;