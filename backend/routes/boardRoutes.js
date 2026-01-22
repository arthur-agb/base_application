// routes/boardRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  createColumn,
  inviteUserToBoard,
  joinBoard,
  updateProjectMemberRole,
  searchEligibleProjectMembers
} from '../controllers/board.tenant.controller.js';

// Import middleware
import { protect, boardProjectMember, boardProjectLeadOrAdmin } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: API for managing project boards and their columns.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BoardProjectInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Project ID
 *           example: "clxabc1230000mnoa1b2c3d4e"
 *         name:
 *           type: string
 *           description: Project Name
 *           example: "New App Development"
 *         key:
 *           type: string
 *           description: Project Key
 *           example: "NAD"
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "clxuser1230000mnoa1b2c3d4e"
 *               leadId:
 *                 type: string
 *                 example: "clxuserlead000mnoa1b2c3d4e"
 *
 *     Board:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The board ID.
 *           example: "clxbdf4560001qrstuv7w8x9yz"
 *         name:
 *           type: string
 *           description: Name of the board.
 *           example: "Sprint Board Alpha"
 *         type:
 *           type: string
 *           description: Type of the board (e.g., kanban, scrum).
 *           example: "kanban"
 *         projectId:
 *           type: string
 *           description: ID of the project this board belongs to.
 *           example: "clxabc1230000mnoa1b2c3d4e"
 *         project:
 *           $ref: '#/components/schemas/BoardProjectInfo'
 *
 *     BoardDetailed:
 *       allOf:
 *         - $ref: '#/components/schemas/Board'
 *         - type: object
 *           properties:
 *             projectKey:
 *               type: string
 *               description: Key of the project this board belongs to.
 *               example: "NAD"
 *             projectName:
 *               type: string
 *               description: Name of the project this board belongs to.
 *               example: "New App Development"
 *
 *     UserBoardView:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxuser1230000mnoa1b2c3d4e"
 *         name:
 *           type: string
 *           example: Jane Doe
 *         avatarUrl:
 *           type: string
 *           format: url
 *           example: "https://ui-avatars.com/api/?name=Jane+Doe"
 *
 *     IssueSimple:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxiss7890002efghijk3l4mno"
 *         columnId:
 *           type: string
 *           example: "clxcol1230003pqrstuv7w8x9yz"
 *         position:
 *           type: integer
 *           example: 0
 *         reporter:
 *           $ref: '#/components/schemas/UserBoardView'
 *         assignee:
 *           oneOf:
 *             - $ref: '#/components/schemas/UserBoardView'
 *             - type: object
 *               nullable: true
 *
 *     Column:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The column ID.
 *           example: "clxcol1230003pqrstuv7w8x9yz"
 *         name:
 *           type: string
 *           description: Name of the column.
 *           example: "To Do"
 *         boardId:
 *           type: string
 *           description: ID of the board this column belongs to.
 *           example: "clxbdf4560001qrstuv7w8x9yz"
 *         position:
 *           type: integer
 *           description: Position of the column in the board.
 *           example: 0
 *         limit:
 *           type: integer
 *           nullable: true
 *           description: WIP limit for the column.
 *           example: 5
 *
 *     ColumnWithIssues:
 *       allOf:
 *         - $ref: '#/components/schemas/Column'
 *         - type: object
 *           properties:
 *             issues:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IssueSimple'
 *
 *     BoardResponseFull:
 *       type: object
 *       properties:
 *         board:
 *           $ref: '#/components/schemas/BoardDetailed'
 *         columns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ColumnWithIssues'
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserBoardView'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message details.
 *           example: "Board not found"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /boards/{id}:
 *   get:
 *     summary: Get a board by ID with columns and issues
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the board to retrieve.
 *         example: "clxbdf4560001qrstuv7w8x9yz"
 *     responses:
 *       '200':
 *         description: Successfully retrieved board details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoardResponseFull'
 *       '401':
 *         description: Not authorized, token failed or no token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden, user not authorized to view this board.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Board not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId(),
  validate,
  getBoardById
);

/**
 * @swagger
 * /boards/{id}:
 *   put:
 *     summary: Update a board's details
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context identifier.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the board to update.
 *         example: "clxbdf4560001qrstuv7w8x9yz"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the board.
 *                 example: "Sprint Board Beta"
 *               type:
 *                 type: string
 *                 description: New type for the board (e.g., kanban, scrum).
 *                 example: "scrum"
 *     responses:
 *       '200':
 *         description: Board updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       '400':
 *         description: Bad Request (e.g., no update data provided, validation error).
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
 *         description: Forbidden, user not authorized to update this board.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Board not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectMember,
  Validators.validateId(),
  validate,
  updateBoard
);

/**
 * @swagger
 * /boards/{id}:
 *   delete:
 *     summary: Delete a board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context identifier.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the board to delete.
 *         example: "clxbdf4560001qrstuv7w8x9yz"
 *     responses:
 *       '200':
 *         description: Successfully deleted the board.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Board deleted successfully."
 *       '401':
 *         description: Not authorized, token failed or no token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden, user not authorized to delete this board.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Board not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectLeadOrAdmin,
  Validators.validateId(),
  validate,
  deleteBoard
);

/**
 * @swagger
 * /boards/{id}/columns:
 *   post:
 *     summary: Create a new column in the specified board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context identifier.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the board where the column will be created.
 *         example: "clxbdf4560001qrstuv7w8x9yz"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the new column.
 *                 example: "In Progress"
 *               position:
 *                 type: integer
 *                 description: Position of the new column.
 *                 example: 1
 *     responses:
 *       '201':
 *         description: Column created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Column'
 *       '400':
 *         description: Bad Request (e.g., no data provided, validation error).
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
 *         description: Forbidden, user not authorized to add columns to this board.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Board not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/columns',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectMember,
  Validators.validateId(),
  validate,
  createColumn
);

router.post(
  "/:id/join",
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  validate,
  joinBoard
);

router.post(
  "/:id/invite",
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectMember,
  Validators.validateId(),
  validate,
  inviteUserToBoard
);

router.put(
  "/:id/members/:userId/role",
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectMember, // Using member for now, service handles escalation if needed
  Validators.validateId(),
  validate,
  updateProjectMemberRole
);

router.get(
  "/:id/eligible-users",
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  boardProjectMember,
  Validators.validateId(),
  Validators.search(),
  validate,
  searchEligibleProjectMembers
);

export default router;