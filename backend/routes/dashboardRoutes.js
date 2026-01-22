import express from 'express';
import { CompanyUserRole } from '@prisma/client';

// Import controllers
import {
  getDashboard,
  getAdminDashboard
} from '../controllers/dashboard.tenant.controller.js';

// Import middleware
import { protect, admin } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

const router = express.Router();

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
 *     UserDashboardCounts:
 *       type: object
 *       properties:
 *         projects:
 *           type: integer
 *           description: Number of projects the user is a member of.
 *           example: 3
 *         assignedIssues:
 *           type: integer
 *           description: Number of issues assigned to the user.
 *           example: 15
 *         reportedIssues:
 *           type: integer
 *           description: Number of issues reported by the user.
 *           example: 5
 *
 *     ProjectBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Project ID.
 *           example: "clxko2x9s000008l3gwpw0h9d"
 *         name:
 *           type: string
 *           description: Project name.
 *           example: "E-commerce Platform"
 *         key:
 *           type: string
 *           description: Project key.
 *           example: "ECOMP"
 *         projectLead:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Jane Doe"
 *             avatarUrl:
 *               type: string
 *               format: url
 *               nullable: true
 *               example: "https://example.com/avatar/janedoe.png"
 *
 *     IssueBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9t000108l3h3q4a7z6"
 *         title:
 *           type: string
 *           example: "Fix login button UI"
 *         key:
 *           type: string
 *           example: "ECOMP-101"
 *         status:
 *           type: string
 *           example: "In Progress"
 *         priority:
 *           type: string
 *           example: "High"
 *         type:
 *           type: string
 *           example: "Bug"
 *         project:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "E-commerce Platform"
 *             key:
 *               type: string
 *               example: "ECOMP"
 *         reporter:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "John Smith"
 *             avatarUrl:
 *               type: string
 *               format: url
 *               nullable: true
 *               example: "https://example.com/avatar/johnsmith.png"
 *         assignee:
 *           type: object
 *           nullable: true
 *           properties:
 *             name:
 *               type: string
 *               example: "Alice Wonderland"
 *             avatarUrl:
 *               type: string
 *               format: url
 *               nullable: true
 *               example: "https://example.com/avatar/alice.png"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-05-22T10:30:00.000Z"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-05-30T23:59:59.000Z"
 *
 *     GroupedCount:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The value of the grouped field (e.g., status name, priority name).
 *           example: "Open"
 *         count:
 *           type: integer
 *           description: The number of items in this group.
 *           example: 10
 *
 *     UserDashboard:
 *       type: object
 *       properties:
 *         recentProjects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectBasic'
 *           description: List of 5 most recently updated projects the user is a member of.
 *         assignedIssues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueBasic'
 *           description: List of 10 most recently updated issues assigned to the user.
 *         issuesByStatus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupedCount'
 *           description: Count of issues assigned to the user, grouped by status.
 *         issuesByPriority:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupedCount'
 *           description: Count of issues assigned to the user, grouped by priority.
 *         recentActivity:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueBasic'
 *           description: List of 10 most recently updated issues where the user is either assignee or reporter.
 *         dueSoonIssues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueBasic'
 *           description: List of 5 issues assigned to the user that are due in the next 7 days.
 *         counts:
 *           $ref: '#/components/schemas/UserDashboardCounts'
 *
 *     ProjectMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9s000008l3gwpw0h9d"
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/avatar/janedoe.png"
 *
 *     ProjectDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/ProjectBasic'
 *         - type: object
 *           properties:
 *             projectLead:
 *               $ref: '#/components/schemas/ProjectMember'
 *             members:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectMember'
 *
 *     BoardBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9u000208l3akf92dp0"
 *         name:
 *           type: string
 *           example: "Sprint Board"
 *         projectId:
 *           type: string
 *           example: "clxko2x9s000008l3gwpw0h9d"
 *
 *     AssigneeWithCount:
 *       type: object
 *       properties:
 *         assignee:
 *           $ref: '#/components/schemas/ProjectMember'
 *           nullable: true
 *         count:
 *           type: integer
 *           example: 5
 *
 *     CommentWithIssue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxko2x9v000308l3bskpe7x6"
 *         text:
 *           type: string
 *           example: "This looks good to me."
 *         user:
 *           $ref: '#/components/schemas/ProjectMember'
 *         issue:
 *           type: object
 *           properties:
 *             key:
 *               type: string
 *               example: "ECOMP-101"
 *             title:
 *               type: string
 *               example: "Fix login button UI"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     TrendDataItem:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           description: Month in YYYY-MM format.
 *           example: "2024-05"
 *         count:
 *           type: integer
 *           description: Count for that month.
 *           example: 25
 *
 *     ResolutionTime:
 *       type: object
 *       properties:
 *         average:
 *           type: number
 *           format: float
 *           description: Average resolution time in days.
 *           example: 3.45
 *         min:
 *           type: number
 *           format: float
 *           description: Minimum resolution time in days.
 *           example: 0.5
 *         max:
 *           type: number
 *           format: float
 *           description: Maximum resolution time in days.
 *           example: 10.2
 *
 *     ProjectDashboardCounts:
 *       type: object
 *       properties:
 *         totalIssues:
 *           type: integer
 *           example: 150
 *         openIssues:
 *           type: integer
 *           example: 45
 *         completedIssues:
 *           type: integer
 *           example: 105
 *
 *     ProjectDashboard:
 *       type: object
 *       properties:
 *         project:
 *           $ref: '#/components/schemas/ProjectDetails'
 *         boards:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BoardBasic'
 *         issuesByStatus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupedCount'
 *         issuesByPriority:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupedCount'
 *         issuesByType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GroupedCount'
 *         issuesByAssignee:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AssigneeWithCount'
 *         recentIssues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueBasic'
 *         recentComments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CommentWithIssue'
 *         trendData:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TrendDataItem'
 *         resolutionTime:
 *           $ref: '#/components/schemas/ResolutionTime'
 *           nullable: true
 *         counts:
 *           $ref: '#/components/schemas/ProjectDashboardCounts'
 *
 *     RecentUser:
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
 *         role:
 *           type: string
 *           enum: [user, admin, lead]
 *         active:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         userStats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             active:
 *               type: integer
 *             admins:
 *               type: integer
 *             trend:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrendDataItem'
 *             recent:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentUser'
 *         projectStats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             trend:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrendDataItem'
 *             recent:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectBasic'
 *         issueStats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             open:
 *               type: integer
 *             completed:
 *               type: integer
 *             byType:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupedCount'
 *             byPriority:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupedCount'
 *         systemStats:
 *           type: object
 *           properties:
 *             uptime:
 *               type: number
 *               description: System uptime in seconds.
 *             memory:
 *               type: object
 *               properties:
 *                 rss:
 *                   type: string
 *                   example: "50.25 MB"
 *                 heapTotal:
 *                   type: string
 *                   example: "30.10 MB"
 *                 heapUsed:
 *                   type: string
 *                   example: "20.50 MB"
 *                 external:
 *                   type: string
 *                   example: "1.00 MB"
 *             nodeVersion:
 *               type: string
 *               example: "v18.17.0"
 *
 *   tags:
 *     - name: Dashboard
 *       description: Dashboard related endpoints
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *     responses:
 *       200:
 *         description: Successfully retrieved user dashboard data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDashboard'
 *       401:
 *         description: Not authorized, no token or token failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  getDashboard
);



/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard data
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *     responses:
 *       200:
 *         description: Successfully retrieved admin dashboard data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminDashboard'
 *       401:
 *         description: Not authorized, no token or token failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to access admin dashboard.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/admin',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.ADMIN),
  admin,
  getAdminDashboard
);

export default router;