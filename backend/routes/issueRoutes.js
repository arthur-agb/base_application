import { Router } from 'express';

// Import controllers
import {
  createIssue,
  getIssueById,
  updateIssue,
  deleteIssue,
  moveIssue,
  searchIssues,
  getIssueSubtasks,
} from '../controllers/issue.tenant.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';
import { validate } from '../middleware/validationMiddleware.js';
import { upload, handleUploadErrors } from '../middleware/uploadMiddleware.js';
import Validators from '../utils/validators.js';

const router = Router();

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
 *     IssueUser:
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
 *     IssueColumnBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxkrg8ps000108l3b7wd1a2c\"
 *         name:
 *           type: string
 *           example: \"To Do\"
 *     IssueProjectBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *         name:
 *           type: string
 *           example: \"E-commerce Platform\"
 *         key:
 *           type: string
 *           example: \"ECOMP\"
 *     EpicBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxne2x9s000008l3gwpw0h9d\"
 *         title:
 *           type: string
 *           example: \"Q3 Feature Rollout\"
 *     SprintBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxne3y9t000108l3h3q4a7z6\"
 *         title:
 *           type: string
 *           example: \"Sprint 2.1 - Payments Integration\"
 *     IssueBasicLink: # For parentIssue linking
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *         title:
 *           type: string
 *           example: \"Parent Task Title\"
 *         type:
 *           type: string
 *           enum: [STORY, TASK, BUG, SUB_TASK]
 *           example: \"TASK\"
 *     IssueComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         body:
 *           type: string
 *         author:
 *           $ref: '#/components/schemas/IssueUser'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     IssueHistoryEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/IssueUser'
 *         fieldChanged:
 *           type: string
 *           example: \"status\"
 *         oldValue:
 *           type: string
 *           nullable: true
 *           example: \"TODO\"
 *         newValue:
 *           type: string
 *           nullable: true
 *           example: \"IN_PROGRESS\"
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Issue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *         title:
 *           type: string
 *           example: \"Implement OAuth login\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"Users should be able to log in using Google and GitHub.\"
 *         type:
 *           type: string
 *           enum: [STORY, TASK, BUG, SUB_TASK] # Updated
 *           example: \"STORY\"
 *         priority:
 *           type: string
 *           enum: [HIGHEST, HIGH, MEDIUM, LOW, LOWEST] # Updated
 *           example: \"HIGH\"
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE, BACKLOG, CLOSED] # Retained from original for mapping logic
 *           example: \"TODO\"
 *         reporter:
 *           $ref: '#/components/schemas/IssueUser'
 *         assignee:
 *           $ref: '#/components/schemas/IssueUser'
 *           nullable: true
 *         column:
 *           $ref: '#/components/schemas/IssueColumnBasic'
 *         project:
 *           $ref: '#/components/schemas/IssueProjectBasic'
 *         projectId:
 *           type: string
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *         columnId:
 *           type: string
 *           example: \"clxkrg8ps000108l3b7wd1a2c\"
 *         position:
 *           type: integer
 *           example: 0
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *           example: [\"frontend\", \"auth\"]
 *         estimatedTime: # Kept from original
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 8.5
 *         dueDate: # Kept from original
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         epicId: # New
 *           type: string
 *           nullable: true
 *           example: \"clxne2x9s000008l3gwpw0h9d\"
 *         sprintId: # New
 *           type: string
 *           nullable: true
 *           example: \"clxne3y9t000108l3h3q4a7z6\"
 *         parentIssueId: # New
 *           type: string
 *           nullable: true
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *         storyPoints: # New
 *           type: integer
 *           format: int32
 *           nullable: true
 *           example: 5
 *         epic: # New
 *           $ref: '#/components/schemas/EpicBasic'
 *           nullable: true
 *         sprint: # New
 *           $ref: '#/components/schemas/SprintBasic'
 *           nullable: true
 *         parentIssue: # New
 *           $ref: '#/components/schemas/IssueBasicLink'
 *           nullable: true
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueComment'
 *           description: Included when fetching a single issue by ID.
 *         histories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueHistoryEntry'
 *           description: Included when fetching a single issue by ID.
 *
 *     IssueCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - projectId
 *         - columnId
 *       properties:
 *         title:
 *           type: string
 *           example: \"Setup CI/CD Pipeline\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"Automate build, test, and deployment processes.\"
 *         type:
 *           type: string
 *           enum: [STORY, TASK, BUG, SUB_TASK] # Updated
 *           default: \"TASK\"
 *           example: \"TASK\"
 *         priority:
 *           type: string
 *           enum: [HIGHEST, HIGH, MEDIUM, LOW, LOWEST] # Updated
 *           default: \"MEDIUM\"
 *           example: \"HIGH\"
 *         status: # Retained from original
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE, BACKLOG, CLOSED]
 *           nullable: true
 *           description: \"If not provided, derived from column name.\"
 *           example: \"TODO\"
 *         projectId:
 *           type: string
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *         columnId:
 *           type: string
 *           example: \"clxkrg8ps000108l3b7wd1a2c\"
 *         assigneeId:
 *           type: string
 *           nullable: true
 *           example: \"clxko2x9t000108l3h3q4a7z6\"
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *           example: [\"devops\", \"automation\"]
 *         epicId: # New
 *           type: string
 *           nullable: true
 *         sprintId: # New
 *           type: string
 *           nullable: true
 *         parentIssueId: # New
 *           type: string
 *           nullable: true
 *         storyPoints: # New
 *           type: integer
 *           nullable: true
 *         dueDate: # Retained from original Issue schema
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     IssueUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: \"Refactor User Service\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"Improve performance and readability of the User service.\"
 *         type:
 *           type: string
 *           enum: [STORY, TASK, BUG, SUB_TASK] # Updated
 *         priority:
 *           type: string
 *           enum: [HIGHEST, HIGH, MEDIUM, LOW, LOWEST] # Updated
 *         assigneeId:
 *           type: string
 *           nullable: true
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *         estimatedTime: # Retained from original
 *           type: number
 *           format: float
 *           nullable: true
 *         dueDate: # Retained from original
 *           type: string
 *           format: date-time
 *           nullable: true
 *         columnId:
 *           type: string
 *           description: \"If changed, status might also be updated based on new column name.\"
 *         epicId: # New
 *           type: string
 *           nullable: true
 *         sprintId: # New
 *           type: string
 *           nullable: true
 *         parentIssueId: # New
 *           type: string
 *           nullable: true
 *         storyPoints: # New
 *           type: integer
 *           format: int32
 *           nullable: true
 *
 *     IssueMoveRequest:
 *       type: object
 *       required:
 *         - position
 *         - sourceColumnId
 *         - destinationColumnId
 *       properties:
 *         position:
 *           type: integer
 *           description: \"The new zero-based index for the issue in the destination column.\"
 *           example: 0
 *         sourceColumnId:
 *           type: string
 *           description: \"The ID of the column the issue is being moved from.\"
 *           example: \"clxkrg8ps000108l3b7wd1a2c\"
 *         destinationColumnId:
 *           type: string
 *           description: \"The ID of the column the issue is being moved to.\"
 *           example: \"clxkrg8ps000108l3b7wd1a2d\"
 *
 *     IssueMoveResponse:
 *       type: object
 *       properties:
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Issue'
 *           description: \"Array of all issues in the project after the move, reflecting new positions/columns.\"
 *
 *     AttachmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fileName:
 *           type: string
 *         url:
 *           type: string
 *           format: url
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *
 *     IssueListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Issue'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *
 * tags:
 *   - name: Issues
 *     description: Issue tracking and management
 */

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IssueCreateRequest'
 *     responses:
 *       '201':
 *         description: Issue created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       '400':
 *         description: Bad request (e.g., missing required fields, validation error, column limit reached).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to create issues in this project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project or Column not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.createIssue(),
  validate,
  createIssue
);

/**
 * @swagger
 * /api/issues/{id}:
 *   get:
 *     summary: Get issue by ID
 *     tags: [Issues]
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
 *           description: The ID of the issue to retrieve.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved issue details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       '400':
 *         description: Invalid issue ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to view this issue.
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
 */
router.get(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId(),
  validate,
  getIssueById
);

/**
 * @swagger
 * /api/issues/{id}:
 *   patch:
 *     summary: Update an existing issue (partial updates allowed)
 *     tags: [Issues]
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
 *           description: The ID of the issue to update.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IssueUpdateRequest' # Updated
 *     responses:
 *       '200':
 *         description: Issue updated successfully. Returns the updated issue.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       '400':
 *         description: Bad request (e.g., validation error, new column limit reached).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to update this issue.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Issue or new Column not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  validate,
  updateIssue
);

/**
 * @swagger
 * /api/issues/{id}:
 *   delete:
 *     summary: Delete an issue
 *     tags: [Issues]
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
 *           description: The ID of the issue to delete.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *     responses:
 *       '200':
 *         description: Issue deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: \"clxkrg8ps000208l3b7wd1a2d\"
 *                 message: # Added for clarity
 *                   type: string
 *                   example: \"Issue deleted successfully\"
 *       '400':
 *         description: Invalid issue ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to delete this issue (not Admin, Project Lead, or Reporter).
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
 */
router.delete(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  validate,
  deleteIssue
);

/**
 * @swagger
 * /api/issues/{id}/position:
 *   put:
 *     summary: Move an issue between columns or reorder within a column
 *     tags: [Issues]
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
 *           description: The ID of the issue to move.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IssueMoveRequest'
 *     responses:
 *       '200':
 *         description: Issue moved successfully. Returns all issues for the project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueMoveResponse'
 *       '400':
 *         description: Bad request (e.g., missing fields, invalid position, column limit reached in destination).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized for this action.
 *       '404':
 *         description: Issue or Column not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id/position',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  Validators.validateId(),
  validate,
  moveIssue
);

/**
 * @swagger
 * /api/issues/{id}/attachments:
 *   post:
 *     summary: Upload an attachment to an issue
 *     tags: [Issues]
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
 *           description: The ID of the issue to attach the file to.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *     responses:
 *       '200':
 *         description: Attachment uploaded successfully (actual controller pending).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttachmentResponse'
 *       '400':
 *         description: Bad request (e.g., invalid issue ID, no file uploaded, file type not allowed, upload error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to attach files to this issue.
 *       '404':
 *         description: Issue not found.
 *       '501':
 *         description: Not Implemented - Attachment upload controller logic is pending.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/attachments',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  Validators.validateId(),
  validate,
  upload.single('file'),
  handleUploadErrors,
  (req, res) => {
    // TODO: Implement attachment controller logic
    res.status(501).json({ success: false, message: 'Attachment upload route defined, controller pending.' });
  }
);

/**
 * @swagger
 * /api/issues/search:
 *   get:
 *     summary: Search issues based on criteria
 *     description: Retrieve issues based on various filter parameters with pagination.
 *     tags: [Issues]
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
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string (searches title, description).
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter issues by project ID.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE, BACKLOG, CLOSED]
 *         description: Filter issues by status.
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter issues by assignee ID.
 *       - in: query
 *         name: reporterId
 *         schema:
 *           type: string
 *         description: Filter issues by reporter ID.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [STORY, TASK, BUG, SUB_TASK]
 *         description: Filter issues by type.
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [HIGHEST, HIGH, MEDIUM, LOW, LOWEST]
 *         description: Filter issues by priority.
 *       - in: query
 *         name: epicId
 *         schema:
 *           type: string
 *         description: Filter issues by Epic ID.
 *       - in: query
 *         name: sprintId
 *         schema:
 *           type: string
 *         description: Filter issues by Sprint ID.
 *       - in: query
 *         name: storyPoints
 *         schema:
 *           type: integer
 *         description: Filter issues by exact story points.
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
 *         description: Number of issues per page.
 *     responses:
 *       '200':
 *         description: Successfully retrieved issues matching search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueListResponse'
 *       '400':
 *         description: Bad request (e.g., invalid search parameters).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '501':
 *         description: Not Implemented - Search issues controller logic is pending.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/search',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  Validators.search(), // Note: Validators.search() would need to be updated for new query params
  validate,
  searchIssues // Changed from inline 501 to controller function
);

/**
 * @swagger
 * /api/issues/user/{userId}:
 *   get:
 *     summary: Get issues assigned to or reported by a specific user
 *     tags: [Issues]
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
 *         schema:
 *           type: string
 *           required: true
 *           description: The ID of the user.
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assigned, reported]
 *           default: assigned
 *         description: Type of issues to retrieve (assigned to the user or reported by the user).
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
 *         description: Number of issues per page.
 *     responses:
 *       '200':
 *         description: Successfully retrieved user's issues (actual controller pending).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueListResponse'
 *       '400':
 *         description: Bad request (e.g., invalid user ID or query parameters).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to view these issues.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '501':
 *         description: Not Implemented - Get issues by user controller logic is pending.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/user/:userId',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  Validators.validateId('userId'),
  validate,
  (req, res) => {
    // TODO: Implement get issues by user controller logic
    res.status(501).json({ success: false, message: 'Get issues by user route defined, controller pending.' });
  }
);

/**
 * @swagger
 * /api/issues/project/{projectId}:
 *   get:
 *     summary: Get all issues for a specific project
 *     tags: [Issues]
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
 *         name: projectId
 *         schema:
 *           type: string
 *           required: true
 *           description: The ID of the project.
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
 *         description: Number of issues per page.
 *     responses:
 *       '200':
 *         description: Successfully retrieved project issues (actual controller pending).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueListResponse'
 *       '400':
 *         description: Bad request (e.g., invalid project ID or query parameters).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user is not a member of this project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '501':
 *         description: Not Implemented - Get issues by project controller logic is pending.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/project/:projectId',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('projectId'),
  validate,
  (req, res) => {
    // TODO: Implement get issues by project controller logic
    res.status(501).json({ success: false, message: 'Get issues by project route defined, controller pending.' });
  }
);

/**
 * @swagger
 * /api/issues/{id}/subtasks:
 *   get:
 *     summary: Get sub-tasks for a given parent issue
 *     tags: [Issues]
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
 *         schema:
 *           type: string
 *           required: true
 *           description: The ID of the parent issue.
 *           example: \"clxkrg8ps000208l3b7wd1a2d\"
 *       - in: query
 *         name: page # Optional: Add pagination if needed
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit # Optional: Add pagination if needed
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of issues per page.
 *     responses:
 *       '200':
 *         description: Successfully retrieved sub-tasks.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IssueListResponse' # Or an array of Issue directly if pagination is not immediately implemented
 *       '400':
 *         description: Invalid parent issue ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to view these sub-tasks.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Parent issue not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '501':
 *         description: Not Implemented - Get sub-tasks controller logic is pending.
 */
router.get(
  '/:id/subtasks',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId('id'), // Validates the parent issue ID from path
  validate,
  getIssueSubtasks
);


export default router;