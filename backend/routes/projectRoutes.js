import { Router } from 'express';

// Middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';
import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

// Project Controller methods
import {
  getProjects,
  createProject,
  getProjectByKey,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectStats,
} from '../controllers/project.tenant.controller.js';

// Board Controller method (for nested route)
import { createBoard } from '../controllers/board.tenant.controller.js';

// --- Epic Controller methods for nested routes ---
import {
  createEpic,
  getAllEpicsByProject,
  searchEpics,
} from '../controllers/epic.tenant.controller.js';

// --- Sprint Controller methods for nested routes ---
import {
  createSprint,
  getAllSprints,
  searchSprints,
} from '../controllers/sprint.tenant.controller.js';

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
 *
 *     UserBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxko2x9s000008l3gwpw0h9d\"
 *         name:
 *           type: string
 *           example: \"Jane Doe\"
 *         email:
 *           type: string
 *           format: email
 *           example: \"jane.doe@example.com\"
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: \"https://example.com/avatar/janedoe.png\"
 *         role:
 *           type: string
 *           nullable: true
 *           example: \"user\"
 *
 *     ProjectLead:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         avatarUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           email:
 *             type: string
 *             format: email
 *             nullable: true
 *
 *     ProjectMember:
 *       allOf:
 *         - $ref: '#/components/schemas/UserBasic'
 *         - type: object
 *           properties:
 *             isLead:
 *               type: boolean
 *               description: \"Indicates if this member is the project lead.\"
 *               example: false
 *
 *     ProjectBoardBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: \"clxkrg8ps000108l3b7wd1a2c\"
 *         name:
 *           type: string
 *           example: \"ECOMP Board\"
 *         type:
 *           type: string
 *           nullable: true
 *           example: \"kanban\"
 *
 *     ProjectListItem:
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
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"The main e-commerce project.\"
 *         lead:
 *           $ref: '#/components/schemas/ProjectLead'
 *         memberCount:
 *           type: integer
 *           example: 5
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProjectCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - key
 *       properties:
 *         name:
 *           type: string
 *           example: \"New Mobile App\"
 *         key:
 *           type: string
 *           description: \"Project key, will be uppercased and spaces removed.\"
 *           example: \"NMA\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"A brand new mobile application.\"
 *
 *     ProjectDetailed:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         key:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         lead:
 *           $ref: '#/components/schemas/ProjectLead'
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMember'
 *         boards:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectBoardBasic'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         totalIssues:
 *           type: integer
 *           nullable: true
 *           example: 25
 *
 *     GetProjectByKeyResponse:
 *       type: object
 *       properties:
 *         project:
 *           $ref: '#/components/schemas/ProjectDetailed'
 *         issueStats:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           example:
 *             TODO: 10
 *             IN_PROGRESS: 5
 *             DONE: 10
 *
 *     ProjectUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: \"Updated Project Name\"
 *         description:
 *           type: string
 *           nullable: true
 *           example: \"Updated project description.\"
 *         leadId:
 *           type: string
 *           description: \"ID of an existing project member to become the new lead.\"
 *           example: \"clxko2x9t000108l3h3q4a7z6\"
 *
 *     AddMemberRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: \"new.member@example.com\"
 *
 *     ProjectStatsResponse:
 *       type: object
 *       properties:
 *         # ... (existing stats properties)
 *
 *     BoardCreateRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: \"Sprint Planning Board\"
 *         type:
 *           type: string
 *           enum: [kanban, scrum]
 *           default: \"kanban\"
 *           example: \"kanban\"
 *
 *     BoardResponse:
 *       type: object
 *       properties:
 *         # ... (existing board properties)
 *         # --- ADDED: Epic-related schemas ---
 *     Epic:
 *       type: object
 *       required:
 *         - title
 *         - projectId
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
 *           # ... and other epic properties
 *     EpicCreationPayload:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/EpicStatus'
 *           # ... and other creation properties
 *     EpicStatus:
 *       type: string
 *       enum: [OPEN, IN_PROGRESS, DONE, BLOCKED]
 *
 * tags:
 *   - name: Projects
 *     description: Project management, members, and statistics
 *   - name: Boards
 *     description: Board management within projects
 *   - name: Epics
 *     description: API for managing project epics.
 *   - name: Sprints
 *     description: API for managing project sprints.
 */

// --- Project Routes ---

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
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
 *       '200':
 *         description: Successfully retrieved list of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectListItem'
 *       '401':
 *         description: Not authorized, token missing or invalid.
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
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectCreateRequest'
 *     responses:
 *       '201':
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDetailed'
 *       '400':
 *         description: Bad request (e.g., missing required fields, invalid key format, key already exists).
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
 *         description: Forbidden, user does not have permission to create projects.
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
router.route('/')
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getProjects)
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), createProject);

/**
 * @swagger
 * /api/projects/{key}:
 *   get:
 *     summary: Get project details by key
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project.
 *         example: \"ECOMP\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved project details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetProjectByKeyResponse'
 *       '400':
 *         description: Invalid project key format.
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
 *         description: Forbidden, user is not a member of this project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
 *   put:
 *     summary: Update project details by key
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project to update.
 *         example: \"ECOMP\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectUpdateRequest'
 *     responses:
 *       '200':
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDetailed'
 *       '400':
 *         description: Bad request (e.g., validation error, leadId is not a project member).
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
 *         description: Forbidden, user is not the project lead or an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
 *   delete:
 *     summary: Delete a project by key
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project to delete.
 *         example: \"ECOMP\"
 *     responses:
 *       '200':
 *         description: Project deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: \"Project deleted successfully\"
 *       '400':
 *         description: Invalid project key format.
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
 *         description: Forbidden, user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.route('/:key')
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getProjectByKey)
  .put(protect, tenantContext, checkCompanyRole(CompanyUserRole.MANAGER), updateProject)
  .delete(protect, tenantContext, checkCompanyRole(CompanyUserRole.ADMIN), deleteProject);

/**
 * @swagger
 * /api/projects/{key}/stats:
 *   get:
 *     summary: Get statistics for a project by key
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project.
 *         example: \"ECOMP\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved project statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIssues:
 *                   type: integer
 *                   example: 150
 *                 openIssues:
 *                   type: integer
 *                   example: 45
 *                 completedIssues:
 *                   type: integer
 *                   example: 105
 *                 issuesByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: \"In Progress\"
 *                       count:
 *                         type: integer
 *                         example: 20
 *                 issuesByPriority:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: \"High\"
 *                       count:
 *                         type: integer
 *                         example: 15
 *                 issuesByType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: \"Bug\"
 *                       count:
 *                         type: integer
 *                         example: 10
 *       '400':
 *         description: Invalid project key format.
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
 *         description: Forbidden, user is not a member of this project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.route('/:key/stats')
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getProjectStats);

// --- Project Member Routes ---

/**
 * @swagger
 * /api/projects/{key}/members:
 *   get:
 *     summary: Get members of a specific project
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project.
 *         example: \"ECOMP\"
 *     responses:
 *       '200':
 *         description: Successfully retrieved project members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectMember'
 *       '400':
 *         description: Invalid project key format.
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
 *         description: Forbidden, user is not a member of this project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
 *   post:
 *     summary: Add a member to a project by email
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project to add a member to.
 *         example: \"ECOMP\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMemberRequest'
 *     responses:
 *       '200':
 *         description: Member added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMember'
 *       '400':
 *         description: Bad request (e.g., invalid email, user already a member, user not found).
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
 *         description: Forbidden, user is not the project lead or an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.route('/:key/members')
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getProjectMembers)
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MANAGER), addProjectMember);

/**
 * @swagger
 * /api/projects/{key}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a specific project
 *     tags: [Projects]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique key of the project.
 *         example: \"ECOMP\"
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to remove.
 *         example: \"clxko2x9t000108l3h3q4a7z6\"
 *     responses:
 *       '200':
 *         description: Member removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: \"Member removed successfully\"
 *       '400':
 *         description: Invalid project key or user ID format.
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
 *         description: Forbidden, user is not the project lead or an admin, or attempting to remove self (if lead).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project or member not found.
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
router.route('/:key/members/:userId')
  .delete(protect, tenantContext, checkCompanyRole(CompanyUserRole.MANAGER), removeProjectMember);

// --- Nested Board Routes ---

/**
 * @swagger
 * /projects/{projectId}/boards:
 *   post:
 *     summary: Create a new board for a project
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to create the board for.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the board.
 *                 example: "Development Board"
 *               type:
 *                 type: string
 *                 enum: [KANBAN, scrum]
 *                 description: The type of the board.
 *                 example: "KANBAN"
 *     responses:
 *       201:
 *         description: Board created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 board:
 *                   $ref: '#/components/schemas/Board'
 *                 columnsCreated:
 *                   type: integer
 *                   description: The number of columns created for the board.
 *                   example: 3
 *       400:
 *         description: Bad request. Project ID or board name is missing.
 *       401:
 *         description: Not authorized. Authentication token is missing or invalid.
 *       403:
 *         description: Forbidden. User is not a member of the project.
 */
router.route('/:key/boards')
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), createBoard);

/**
 * @swagger
 * /api/projects/{projectId}/epics:
 *   post:
 *     summary: Create a new Epic for a project
 *     tags: [Projects, Epics]
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
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the project for which to create the epic.
 *           example: \"clxabc1230000mnoa1b2c3d4e\"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EpicCreationPayload'
 *     responses:
 *       '201':
 *         description: Epic created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *       '403':
 *         description: Forbidden, user not authorized for this project.
 *       '404':
 *         description: Project not found.
 *   get:
 *     summary: Get all Epics for a project
 *     tags: [Projects, Epics]
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
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the project to retrieve epics from.
 *           example: \"clxabc1230000mnoa1b2c3d4e\"
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/EpicStatus'
 *         description: Filter epics by status.
 *     responses:
 *       '200':
 *         description: Successfully retrieved list of epics.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Epic'
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Project not found.
 */
router.route('/:projectId/epics')
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), Validators.validateEpicCreate(), validate, createEpic)
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getAllEpicsByProject);


router.get(
  '/:projectId/epics/search',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  searchEpics
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints:
 *   get:
 *     summary: Get all Sprints for a project
 *     tags: [Projects, Sprints]
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
 *         required: true
 *         schema:
 *           type: string
 *           description: The key of the project to retrieve sprints from.
 *     responses:
 *       '200':
 *         description: \"List of sprints\"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 *   post:
 *     summary: Create a new Sprint for a project
 *     tags: [Projects, Sprints]
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
 *         required: true
 *         schema:
 *           type: string
 *           description: The key of the project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SprintCreatePayload'
 *     responses:
 *       '201':
 *         description: \"Sprint created\"
 */
router.route('/:projectId/sprints')
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getAllSprints)
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), createSprint);

/**
 * @swagger
 * /api/projects/{projectId}/sprints/search:
 *   get:
 *     summary: Search for sprints within a project by title
 *     tags: [Projects, Sprints]
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
 *         required: true
 *         schema:
 *           type: string
 *           description: The key of the project to search within.
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           description: The search term to match against sprint titles.
 *     responses:
 *       '200':
 *         description: A list of matching sprints that are either PLANNED or ACTIVE.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *       '403':
 *         description: Forbidden (user not a member of the project)
 *       '404':
 *         description: Project not found
 */
router.get(
  '/:projectId/sprints/search',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  searchSprints
);


export default router;