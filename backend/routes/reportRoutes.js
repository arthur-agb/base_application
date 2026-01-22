import { Router } from 'express';
import { CompanyUserRole } from '@prisma/client';

// Import controllers
import {
  getSprintSummary,
  getEpicProgress,
  getUserWorkload,
  getSprintBurnupData,
} from '../controllers/report.tenant.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

const router = Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     ReportErrorResponse:
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
 *     SprintDetailsReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         goal:
 *           type: string
 *           nullable: true
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         status:
 *           $ref: '#/components/schemas/SprintStatus'
 *
 *     EpicDetailsReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/EpicStatus'
 *
 *     IssuesByStatusReport:
 *       type: object
 *       additionalProperties:
 *         type: integer
 *       example:
 *         TODO: 10
 *         IN_PROGRESS: 5
 *         DONE: 20
 *
 *     IssuesByTypeReport:
 *       type: object
 *       additionalProperties:
 *         type: integer
 *       example:
 *         STORY: 15
 *         TASK: 10
 *         BUG: 10
 *
 *     SprintSummaryResponse:
 *       type: object
 *       properties:
 *         sprintDetails:
 *           $ref: '#/components/schemas/SprintDetailsReport'
 *         issuesTotal:
 *           type: integer
 *           example: 35
 *         issuesCompleted:
 *           type: integer
 *           example: 20
 *         storyPointsTotal:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 50
 *         storyPointsCompleted:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 30
 *         issuesByStatus:
 *           $ref: '#/components/schemas/IssuesByStatusReport'
 *         issuesByType:
 *           $ref: '#/components/schemas/IssuesByTypeReport'
 *
 *     EpicProgressResponse:
 *       type: object
 *       properties:
 *         epicDetails:
 *           $ref: '#/components/schemas/EpicDetailsReport'
 *         issuesTotal:
 *           type: integer
 *           example: 50
 *         issuesCompleted:
 *           type: integer
 *           example: 25
 *         storyPointsTotal:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 100
 *         storyPointsCompleted:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 45
 *         issuesByStatus:
 *           $ref: '#/components/schemas/IssuesByStatusReport'
 *         issuesBySprint:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               sprintTitle:
 *                 type: string
 *               total:
 *                 type: integer
 *               completed:
 *                 type: integer
 *           example:
 *             "clxne3y9t000108l3h3q4a7z6": { sprintTitle: "Sprint 2.1", total: 10, completed: 5 }
 *
 *     UserWorkloadIssue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *         sprintId:
 *           type: string
 *           nullable: true
 *         sprintTitle:
 *           type: string
 *           nullable: true
 *         storyPoints:
 *           type: integer
 *           nullable: true
 *         type:
 *           $ref: '#/components/schemas/IssueType'
 *         priority:
 *           $ref: '#/components/schemas/IssuePriority'
 *
 *     UserWorkloadEntry:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/IssueUser'
 *         assignedIssues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserWorkloadIssue'
 *         totalAssignedIssues:
 *           type: integer
 *         totalStoryPoints:
 *           type: number
 *           format: float
 *
 *     UserWorkloadResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/UserWorkloadEntry'
 *
 *     BurnupDataPoint:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         totalScopePoints:
 *           type: number
 *           format: float
 *         completedPoints:
 *           type: number
 *           format: float
 *
 *     BurnupDataResponse:
 *       type: object
 *       properties:
 *         sprintId:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BurnupDataPoint'
 *         message:
 *           type: string
 *           example: "Burnup chart data generation is an advanced feature and requires historical data tracking."
 *
 *   tags:
 *     - name: Reports
 *       description: Endpoints for generating project and workflow reports
 */

/**
 * @swagger
 * /api/reports/sprint-summary/{sprintId}:
 *   get:
 *     summary: Get a summary report for a specific sprint
 *     tags: [Reports]
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
 *         name: sprintId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the sprint to summarize.
 *         example: "clxne3y9t000108l3h3q4a7z6"
 *     responses:
 *       '200':
 *         description: Successfully retrieved sprint summary.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SprintSummaryResponse'
 *       '400':
 *         description: Invalid sprint ID format.
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to view reports for this project.
 *       '404':
 *         description: Sprint not found.
 */
router.get(
  '/sprint-summary/:sprintId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('sprintId'),
  validate,
  getSprintSummary
);

/**
 * @swagger
 * /api/reports/epic-progress/{epicId}:
 *   get:
 *     summary: Get a progress report for a specific epic
 *     tags: [Reports]
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
 *         name: epicId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the epic.
 *         example: "clxne2x9s000008l3gwpw0h9d"
 *     responses:
 *       '200':
 *         description: Successfully retrieved epic progress.
 *       '400':
 *         description: Invalid epic ID format.
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Epic not found.
 */
router.get(
  '/epic-progress/:epicId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('epicId'),
  validate,
  getEpicProgress
);

/**
 * @swagger
 * /api/reports/user-workload:
 *   get:
 *     summary: Get a report on user workload
 *     tags: [Reports]
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
 *         description: Filter workload by a specific project ID. Required to scope the workload.
 *         required: true
 *         example: "clxko2x9s000008l3gwpw0h9d"
 *       - in: query
 *         name: sprintId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter workload by a specific sprint ID within the project."
 *         example: "clxne3y9t000108l3h3q4a7z6"
 *       - in: query
 *         name: statusCategory
 *         schema:
 *           type: string
 *           enum: [open, in_progress, done]
 *         description: '(Optional) Filter issues by a general status category: ''open'' (e.g., TODO, BACKLOG), ''in_progress'', ''done'' (e.g., DONE, CLOSED).'
 *         example: "in_progress"
 *     responses:
 *       '200':
 *         description: Successfully retrieved user workload.
 *       '400':
 *         description: Bad request (e.g., missing projectId or invalid query parameters).
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden.
 */
router.get(
  '/user-workload',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  validate,
  getUserWorkload
);

/**
 * @swagger
 * /api/reports/burnup-data/{sprintId}:
 *   get:
 *     summary: Get burnup chart data for a sprint (Advanced Feature - Placeholder)
 *     tags: [Reports]
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
 *         name: sprintId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the sprint.
 *         example: "clxne3y9t000108l3h3q4a7z6"
 *     responses:
 *       '200':
 *         description: Placeholder response for burnup data.
 *       '501':
 *         description: Not Implemented - Burnup chart data generation is an advanced feature.
 *       '400':
 *         description: Invalid sprint ID format.
 *       '401':
 *         description: Not authorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Sprint not found.
 */
router.get(
  '/burnup-data/:sprintId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('sprintId'),
  validate,
  getSprintBurnupData
);

export default router;