// routes/columnRoutes.js
import express from 'express';
const router = express.Router();

// Import controllers
import {
  updateColumn,
  deleteColumn
} from '../controllers/board.tenant.controller.js';

// Import middleware
import { protect, columnProjectMember } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';

/**
 * @swagger
 * /api/columns/{id}:
 *   put:
 *     summary: Update a column
 *     description: Update a column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Column updated successfully
 */
/**
 * @route   PUT /api/columns/:id
 * @desc    Update a column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.put(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  columnProjectMember,
  Validators.validateId(),
  validate,
  updateColumn
);

/**
 * @swagger
 * /api/columns/{id}:
 *   delete:
 *     summary: Delete a column
 *     description: Delete a column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Column deleted successfully
 */
/**
 * @route   DELETE /api/columns/:id
 * @desc    Delete a column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.delete(
  '/:id',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  columnProjectMember,
  Validators.validateId(),
  validate,
  deleteColumn
);

/**
 * @swagger
 * /api/columns/{id}/position:
 *   put:
 *     summary: Reorder a column
 *     description: Reorder a column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reorder column function would be implemented here
 */
/**
 * @route   PUT /api/columns/:id/position
 * @desc    Reorder a column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.put(
  '/:id/position',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  columnProjectMember,
  Validators.validateId(),
  validate,
  (req, res) => {
    // This would typically be handled by a reorderColumn function in the boardController
    // This is a placeholder to show the route structure
    res.status(200).json({ message: 'Reorder column function would be implemented here' });
  }
);

/**
 * @swagger
 * /api/columns/{id}/issues:
 *   get:
 *     summary: Get all issues for a column
 *     description: Retrieve issues associated with a specific column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get column issues function would be implemented here
 */
/**
 * @route   GET /api/columns/:id/issues
 * @desc    Get all issues for a column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.get(
  '/:id/issues',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  Validators.validateId(),
  validate,
  (req, res) => {
    // This would typically be handled by a getColumnIssues function in a columnController
    // This is a placeholder to show the route structure
    res.status(200).json({ message: 'Get column issues function would be implemented here' });
  }
);

/**
 * @swagger
 * /api/columns/{id}/issues:
 *   post:
 *     summary: Create a new issue in a column
 *     description: Create a new issue within the specified column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Create issue in column function would be implemented here
 */
/**
 * @route   POST /api/columns/:id/issues
 * @desc    Create a new issue in a specific column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.post(
  '/:id/issues',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  columnProjectMember,
  Validators.validateId(),
  validate,
  (req, res) => {
    // This would typically be handled by a createIssueInColumn function
    // This is a placeholder to show the route structure
    res.status(200).json({ message: 'Create issue in column function would be implemented here' });
  }
);

/**
 * @swagger
 * /api/columns/{id}/limit:
 *   put:
 *     summary: Set WIP limit for a column
 *     description: Set the Work In Progress limit for a column.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company
 *         description: Company context required
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: Column ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Set column limit function would be implemented here
 */
/**
 * @route   PUT /api/columns/:id/limit
 * @desc    Set WIP (Work In Progress) limit for a column
 * @access  Private
 * @header  {string} company - Company context required
 */
router.put(
  '/:id/limit',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.MEMBER),
  columnProjectMember,
  Validators.validateId(),
  validate,
  (req, res) => {
    // This would typically be handled by a setColumnLimit function in the boardController
    // This is a placeholder to show the route structure
    res.status(200).json({ message: 'Set column limit function would be implemented here' });
  }
);

export default router;