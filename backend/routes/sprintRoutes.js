import { Router } from 'express';

// Import controllers
import {
  getAllSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  getSprintIssues,
} from '../controllers/sprint.tenant.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Sprints
 *     description: API for managing project sprints, which are time-boxed iterations for development.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SprintStatus:
 *       type: string
 *       enum: [PLANNED, ACTIVE, COMPLETED, ARCHIVED]
 *     Sprint:
 *       type: object
 *       required:
 *         - title
 *         - goal
 *         - startDate
 *         - endDate
 *         - projectId
 *       properties:
 *         id:
 *           type: string
 *           description: The sprint's unique ID.
 *           example: \"clxsprnt1230001qrstuv7w8x9yz\"
 *         title:
 *           type: string
 *           description: Title of the sprint.
 *           example: \"June Sprint - User Authentication\"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the sprint.
 *           example: \"Focus on implementing OAuth2, JWT handling, and user profile endpoints.\"
 *         goal:
 *           type: string
 *           description: The primary objective of the sprint.
 *           example: \"By the end of this sprint, users will be able to sign up and log in securely.\"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the sprint.
 *           example: \"2025-06-03T09:00:00.000Z\"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the sprint.
 *           example: \"2025-06-17T17:00:00.000Z\"
 *         status:
 *           $ref: '#/components/schemas/SprintStatus'
 *         capacityPoints:
 *           type: integer
 *           format: int32
 *           nullable: true
 *           description: The team's estimated capacity in story points for this sprint.
 *           example: 35
 *         projectId:
 *           type: string
 *           description: ID of the project this sprint belongs to.
 *           example: \"clxproj1230000mnoa1b2c3d4e\"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SprintCreatePayload:
 *       type: object
 *       required: [title, goal, startDate, endDate, projectId]
 *       properties:
 *         title:
 *           type: string
 *           example: \"Sprint 2 - Payments\"
 *         description:
 *           type: string
 *           nullable: true
 *         goal:
 *           type: string
 *           example: \"Integrate Stripe for one-time payments.\"
 *         startDate:
 *           type: string
 *           format: date
 *           example: \"2025-06-18\"
 *         endDate:
 *           type: string
 *           format: date
 *           example: \"2025-07-02\"
 *         status:
 *           $ref: '#/components/schemas/SprintStatus'
 *           default: \"PLANNED\"
 *         capacityPoints:
 *           type: integer
 *           nullable: true
 *           example: 40
 *         projectId:
 *           type: string
 *           example: \"clxproj1230000mnoa1b2c3d4e\"
 *     SprintUpdatePayload:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         goal:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         status:
 *           $ref: '#/components/schemas/SprintStatus'
 *         capacityPoints:
 *           type: integer
 *           nullable: true
 */

// --- Base Route: /api/sprints ---

///**
// * @swagger
// * /api/sprints:
// *   post:
// *     summary: Create a new Sprint
// *     tags: [Sprints]
// *     security:
// *       - bearerAuth: []
// *     requestBody:
// *       required: true
// *       content:
// *         application/json:
// *           schema:
// *             $ref: '#/components/schemas/SprintCreatePayload'
// *     responses:
// *       '201':
// *         description: \"Sprint created\"
// *         content:
// *           application/json:
// *             schema:
// *               $ref: '#/components/schemas/Sprint'
// *       '400':
// *         description: \"Bad Request (e.g., missing fields)\"
// *       '403':
// *         description: \"Forbidden (user not a member of the project)\"
// */
//router.post('/', protect, /* Validators.createSprint(), validate, */ createSprint);

/**
 * @swagger
 * /api/sprints:
 *   get:
 *     summary: Get all Sprints for authorized projects
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: \"Filter sprints by a specific project ID. User must be a member.\"
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/SprintStatus'
 *         description: \"Filter sprints by status.\"
 *     responses:
 *       '200':
 *         description: \"List of sprints\"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 *       '403':
 *         description: \"Forbidden (if projectId is for an unauthorized project)\"
 */
router.get('/', protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getAllSprints);

/**
 * @swagger
 * /api/sprints/{id}:
 *   get:
 *     summary: Get a single Sprint by ID
 *     tags: [Sprints]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: \"ID of the sprint to retrieve.\"
 *     responses:
 *       '200':
 *         description: \"Sprint details\"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       '403':
 *         description: \"Forbidden\"
 *       '404':
 *         description: \"Sprint not found\"
 */
router.get(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId(),
  validate,
  getSprintById
);

/**
 * @swagger
 * /api/sprints/{id}:
 *   put:
 *     summary: Update a Sprint
 *     tags: [Sprints]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: \"ID of the sprint to update.\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SprintUpdatePayload'
 *     responses:
 *       '200':
 *         description: \"Sprint updated\"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       '403':
 *         description: \"Forbidden\"
 *       '404':
 *         description: \"Sprint not found\"
 */
router.put(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  /* Validators.updateSprint(), validate, */ updateSprint
);

/**
 * @swagger
 * /api/sprints/{id}:
 *   delete:
 *     summary: Delete a Sprint
 *     tags: [Sprints]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: \"ID of the sprint to delete. Issues in the sprint will be moved to the backlog.\"
 *     responses:
 *       '200':
 *         description: \"Sprint deleted successfully\"
 *       '403':
 *         description: \"Forbidden (Requires project lead or admin)\"
 *       '404':
 *         description: \"Sprint not found\"
 */
router.delete(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  validate,
  deleteSprint
);

/**
 * @swagger
 * /api/sprints/{id}/issues:
 *   get:
 *     summary: Get all issues within a specific Sprint
 *     tags: [Sprints, Issues]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: \"The ID of the sprint.\"
 *     responses:
 *       '200':
 *         description: \"List of issues in the sprint\"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Issue'
 *       '403':
 *         description: \"Forbidden\"
 *       '404':
 *         description: \"Sprint not found\"
 */
router.get(
  '/:id/issues',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId(),
  validate,
  getSprintIssues
);

export default router;