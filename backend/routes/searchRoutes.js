import { Router } from 'express';
import { CompanyUserRole } from '@prisma/client';

// Import controllers
import {
  globalSearch,
  advancedSearch,
  getSearchSuggestions
} from '../controllers/search.tenant.controller.js';

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
 *     UserBasicSearch:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c724f0206e9a8d3e8bdd1"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         avatar:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/avatar/johndoe.png"
 *         role:
 *           type: string
 *           example: "user"
 *
 *     ProjectBasicSearch:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c724f0206e9a8d3e8bde0"
 *         name:
 *           type: string
 *           example: "Alpha Project"
 *         key:
 *           type: string
 *           example: "ALPHA"
 *         description:
 *           type: string
 *           nullable: true
 *         lead:
 *           $ref: '#/components/schemas/UserBasicSearch'
 *
 *     IssueBasicSearch:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c724f0206e9a8d3e8bcf0"
 *         key:
 *           type: string
 *           example: "ALPHA-123"
 *         title:
 *           type: string
 *           example: "Fix critical login bug"
 *         description:
 *           type: string
 *           nullable: true
 *         project:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             key:
 *               type: string
 *         reporter:
 *           $ref: '#/components/schemas/UserBasicSearch'
 *         assignee:
 *           $ref: '#/components/schemas/UserBasicSearch'
 *           nullable: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CommentBasicSearch:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c724f0206e9a8d3e8bdc0"
 *         content:
 *           type: string
 *           example: "This is a search result comment."
 *         user:
 *           $ref: '#/components/schemas/UserBasicSearch'
 *         issue:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             key:
 *               type: string
 *             title:
 *               type: string
 *             project:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 key:
 *                   type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     GlobalSearchResults:
 *       type: object
 *       properties:
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueBasicSearch'
 *         projects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectBasicSearch'
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserBasicSearch'
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CommentBasicSearch'
 *
 *     AdvancedSearchRequest:
 *       type: object
 *       properties:
 *         projectKeys:
 *           type: array
 *           items:
 *             type: string
 *           example: ["ALPHA", "BETA"]
 *         issueTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["BUG", "TASK"]
 *         priorities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["HIGH", "MEDIUM"]
 *         statuses:
 *           type: array
 *           items:
 *             type: string
 *           example: ["OPEN", "IN_PROGRESS"]
 *         assignees:
 *           type: array
 *           items:
 *             type: string
 *           description: "User IDs or 'unassigned'."
 *           example: ["605c724f0206e9a8d3e8bdd1", "unassigned"]
 *         reporters:
 *           type: array
 *           items:
 *             type: string
 *           description: "User IDs."
 *           example: ["605c724f0206e9a8d3e8bdd2"]
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *           example: ["frontend", "backend"]
 *         createdAfter:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdBefore:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updatedAfter:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updatedBefore:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         text:
 *           type: string
 *           nullable: true
 *           description: "Text to search in issue key, title, or description."
 *           example: "critical bug"
 *         page:
 *           type: integer
 *           default: 1
 *         limit:
 *           type: integer
 *           default: 20
 *
 *     IssueColumnBasic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *
 *     AdvancedSearchResultItem:
 *       allOf:
 *         - $ref: '#/components/schemas/IssueBasicSearch'
 *         - type: object
 *           properties:
 *             status:
 *               type: string
 *             type:
 *               type: string
 *             priority:
 *               type: string
 *             labels:
 *               type: array
 *               items:
 *                 type: string
 *             column:
 *               $ref: '#/components/schemas/IssueColumnBasic'
 *               nullable: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *
 *     PaginationDetails:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         pages:
 *           type: integer
 *
 *     AdvancedSearchResponse:
 *       type: object
 *       properties:
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdvancedSearchResultItem'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationDetails'
 *
 *     SearchSuggestion:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [issue, user, project, jql]
 *           example: "issue"
 *         value:
 *           type: string
 *           example: "ALPHA-123"
 *         label:
 *           type: string
 *           # +++ FIX: Enclosed the example string in single quotes to prevent YAML parsing errors +++
 *           example: 'ALPHA-123: Fix critical login bug'
 *         avatar:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: "Present for user suggestions."
 *           example: "https://example.com/avatar.png"
 *
 *   tags:
 *     - name: Search
 *       description: Endpoints for searching content
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search across various content types
 *     tags: [Search]
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
 *         name: query
 *         schema:
 *           type: string
 *           minLength: 2
 *         required: true
 *         description: The search term (minimum 2 characters).
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, issues, projects, users, comments]
 *           default: all
 *         description: The type of content to search.
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Optional. ID of a specific project to scope the search.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results per content type.
 *     responses:
 *       '200':
 *         description: Search results.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalSearchResults'
 *       '400':
 *         description: Bad request (e.g., query too short, project not found if projectId is invalid).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 *       '403':
 *         description: Forbidden, user not authorized to access the specified project.
 */
router.get(
  '/',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.search(),
  validate,
  globalSearch
);

/**
 * @swagger
 * /api/search/advanced:
 *   post:
 *     summary: Perform an advanced, JQL-like search for issues
 *     tags: [Search]
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
 *             $ref: '#/components/schemas/AdvancedSearchRequest'
 *     responses:
 *       '200':
 *         description: A list of issues matching the advanced criteria, with pagination.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdvancedSearchResponse'
 *       '400':
 *         description: Bad request (e.g., validation errors for request body fields).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 */
router.post(
  '/advanced',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  validate,
  advancedSearch
);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions for autocomplete
 *     tags: [Search]
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
 *         name: query
 *         schema:
 *           type: string
 *           minLength: 2
 *         required: true
 *         description: The partial search term (minimum 2 characters).
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [issues, users, projects, jql]
 *           default: issues
 *         description: The type of suggestions to retrieve.
 *     responses:
 *       '200':
 *         description: A list of search suggestions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchSuggestion'
 *       '400':
 *         description: Bad request (e.g., query too short).
 *       '401':
 *         description: Not authorized, token missing or invalid.
 */
router.get(
  '/suggestions',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.search(),
  validate,
  getSearchSuggestions
);

export default router;