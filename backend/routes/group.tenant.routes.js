import express from 'express';
const router = express.Router();

// Import controller functions
import {
  createGroup,
  getGroups,
  getGroupById,
} from '../controllers/group.tenant.controller.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js'; // The tenant resolver
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Tenant Groups
 *   description: Managing groups within the active tenant
 */

// All routes in this file are protected and require a tenant context.
// The middleware will run in this order:
// 1. protect: Authenticates the user via JWT.
// 2. tenantContext: Resolves the tenant (company) from the JWT and attaches it to req.company.
// 3. checkCompanyRole: Authorizes the user based on their role within that specific tenant.

router.route('/')
  /**
   * @swagger
   * /groups:
   *   post:
   *     summary: Create a new group within the active tenant
   *     tags: [Tenant Groups]
   *     security:
   *       - bearerAuth: []
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
   *                 example: "Marketing Team"
   *               description:
   *                 type: string
   *                 example: "Handles all marketing and outreach."
   *     responses:
   *       201:
   *         description: Group created successfully.
   *       403:
   *         description: Not authorized (user is not a Company ADMIN).
   */
  .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.ADMIN), createGroup)
  /**
   * @swagger
   * /groups:
   *   get:
   *     summary: Get all groups for the active tenant
   *     tags: [Tenant Groups]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of groups for the tenant.
   *       403:
   *         description: Not authorized (user is not a member of the tenant).
   */
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), getGroups);


router.route('/:groupId')
  /**
   * @swagger
   * /groups/{groupId}:
   *   get:
   *     summary: Get a single group's details
   *     tags: [Tenant Groups]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the group to retrieve.
   *     responses:
   *       200:
   *         description: Detailed information about the group.
   *       403:
   *         description: Not authorized (user is not a member of the tenant).
   *       404:
   *         description: Group not found.
   */
  .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), getGroupById);

export default router;
