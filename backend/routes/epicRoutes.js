import express from 'express';
const router = express.Router();

// Import controllers
import {
    getEpicById,
    updateEpic,
    deleteEpic,
    getEpicIssues
} from '../controllers/epic.tenant.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

/**
 * @swagger
 * tags:
 *   - name: Epics
 *     description: API for managing project epics. Actions performed on a specific epic via its ID.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EpicUserOwner:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxuser1230000mnoa1b2c3d4e\"
 *         name:
 *           type: string
 *           example: \"Alex Green\"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           example: \"https://ui-avatars.com/api/?name=Alex+Green\"
 *     Epic:
 *       type: object
 *       required:
 *         - title
 *         - projectId
 *       properties:
 *         id:
 *           type: string
 *           description: The epic ID.
 *           example: \"clxepic1230001qrstuv7w8x9yz\"
 *         title:
 *           type: string
 *           description: Title of the epic.
 *           example: \"User Authentication Feature\"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the epic.
 *           example: \"Implement complete user signup, login, and profile management.\"
 *         status:
 *           $ref: '#/components/schemas/EpicStatus'
 *           description: Status of the epic.
 *           example: \"OPEN\"
 *         startDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Start date of the epic.
 *           example: \"2025-06-01T00:00:00.000Z\"
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: End date of the epic.
 *           example: \"2025-09-01T00:00:00.000Z\"
 *         projectId:
 *           type: string
 *           description: ID of the project this epic belongs to.
 *           example: \"clxabc1230000mnoa1b2c3d4e\"
 *         ownerUserId:
 *           type: string
 *           nullable: true
 *           description: ID of the user who owns/leads the epic.
 *           example: \"clxuser1230000mnoa1b2c3d4e\"
 *         owner:
 *           oneOf:
 *             - $ref: '#/components/schemas/EpicUserOwner'
 *             - type: object
 *               nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of epic creation.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last epic update.
 *         project:
 *           $ref: '#/components/schemas/BoardProjectInfo'
 *     EpicUpdatePayload:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: \"Enhanced User Onboarding V2\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"Further optimize the onboarding flow based on V1 feedback.\"
 *         status:
 *           $ref: '#/components/schemas/EpicStatus'
 *           example: \"IN_PROGRESS\"
 *         ownerUserId:
 *           type: string
 *           nullable: true
 *           example: \"clxuserowner002mnoa1b2c3dgh\"
 *         startDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: \"2025-07-15\"
 *         endDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: \"2025-10-15\"
 *     EpicStatus:
 *       type: string
 *       enum: [OPEN, IN_PROGRESS, DONE, BLOCKED]
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// --- All routes are now relative to the mount point (e.g., /api/epics) ---

/**
 * @swagger
 * /epics/{id}:
 *   get:
 *     summary: Get a single Epic by ID
 *     tags: [Epics]
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
 *         description: The ID of the epic to retrieve.
 *         example: \"clxepic1230001qrstuv7w8x9yz\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved epic details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden, user is not authorized for this epic's project.
 *       '404':
 *         description: Epic not found.
 */
router.get(
    '/:id',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.VIEWER),
    Validators.validateId(),
    validate,
    getEpicById
);

/**
 * @swagger
 * /epics/{id}:
 *   put:
 *     summary: Update an Epic
 *     tags: [Epics]
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
 *           description: The ID of the epic to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EpicUpdatePayload'
 *     responses:
 *       '200':
 *         description: Epic updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *       '400':
 *         description: Bad Request (e.g., validation error).
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden, user is not authorized for this epic's project.
 *       '404':
 *         description: Epic not found.
 */
router.put(
    '/:id',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.MEMBER),
    Validators.validateId(),
    Validators.validateEpicUpdate(),
    validate,
    updateEpic
);

/**
 * @swagger
 * /epics/{id}:
 *   delete:
 *     summary: Delete an Epic
 *     tags: [Epics]
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
 *           description: The ID of the epic to delete.
 *     responses:
 *       '200':
 *         description: Epic deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: \"Epic removed successfully\"
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden (user is not the project lead or an admin).
 *       '404':
 *         description: Epic not found.
 */
router.delete(
    '/:id',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.MEMBER),
    Validators.validateId(),
    validate,
    deleteEpic
);

/**
 * @swagger
 * /epics/{id}/issues:
 *   get:
 *     summary: Get all issues associated with a specific Epic
 *     tags: [Epics, Issues]
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
 *           description: The ID of the epic.
 *           example: \"clxepic1230001qrstuv7w8x9yz\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved issues for the epic.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IssueSimple'
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden, user is not authorized for this epic's project.
 *       '404':
 *         description: Epic not found.
 */
router.get(
    '/:id/issues',
    protect,
    tenantContext,
    checkCompanyRole(CompanyUserRole.VIEWER),
    Validators.validateId(),
    validate,
    getEpicIssues
);

export default router;