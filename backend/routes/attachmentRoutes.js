// routes/attachmentRoutes.js
import express from 'express';
const router = express.Router();

import {
  uploadAttachment,
  deleteAttachment
} from '../controllers/attachment.tenant.controller.js';

import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

import { validate } from '../middleware/validationMiddleware.js';
import Validators from '../utils/validators.js';
import { upload, handleUploadErrors } from '../middleware/uploadMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: API for managing issue attachments.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Attachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The attachment ID.
 *           example: 60c72b2f9b1d8e001c8e4c8e
 *         filename:
 *           type: string
 *           description: The original name of the uploaded file.
 *           example: "report.pdf"
 *         path:
 *           type: string
 *           description: The server path to access the file.
 *           example: "/uploads/1623805387311-report.pdf"
 *         mimetype:
 *           type: string
 *           description: The MIME type of the file.
 *           example: "application/pdf"
 *         size:
 *           type: integer
 *           description: The size of the file in bytes.
 *           example: 102400
 *         uploadedBy:
 *           type: string
 *           description: The ID of the user who uploaded the attachment.
 *           example: "507f1f77bcf86cd799439011"
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the attachment was uploaded.
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Issue not found"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /issues/{id}/attachments:
 *   post:
 *     summary: Upload an attachment to an issue
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the issue to attach the file to.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *     responses:
 *       '200':
 *         description: Attachment uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attachment'
 *       '400':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/issues/:id/attachments',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  Validators.validateId(),
  validate,
  upload.single('file'),
  handleUploadErrors,
  uploadAttachment
);

/**
 * @swagger
 * /issues/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment from an issue
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the issue containing the attachment.
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the attachment to delete.
 *     responses:
 *       '200':
 *         description: Attachment deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Attachment deleted.
 *       '401':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden
 *       '404':
 *         $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/issues/:id/attachments/:attachmentId',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  Validators.validateId(),
  Validators.validateId('attachmentId'),
  validate,
  deleteAttachment
);

/**
 * @swagger
 * /attachments/{filename}:
 *   get:
 *     summary: Get an attachment (placeholder - normally served via static middleware)
 *     tags: [Attachments]
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
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename of the attachment to retrieve.
 *     responses:
 *       200:
 *         description: Placeholder response for attachment retrieval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get attachment function would be implemented here"
 *       401, 404:
 *         description: Error response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/attachments/:filename',
  protect,
  tenantContext,
  checkCompanyRole(CompanyUserRole.VIEWER),
  (req, res) => {
    res.status(200).json({ message: 'Get attachment function would be implemented here' });
  }
);

/**
 * @swagger
 * /attachments/bulk:
 *   post:
 *     summary: Upload multiple attachments (placeholder)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-company
 *         required: true
 *         schema:
 *           type: string
 *         description: Company context identifier.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 files to upload.
 *               issueId:
 *                 type: string
 *                 description: The ID of the issue to attach files to.
 *                 example: "60c72b2f9b1d8e001c8e4c8d"
 *     responses:
 *       200:
 *         description: Placeholder response for bulk attachment upload.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk upload function would be implemented here"
 *       400, 401:
 *         description: Error response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/attachments/bulk',
  protect,
  tenantContext, // Replaced ensureTenantContext with tenantContext
  upload.array('files', 10),
  handleUploadErrors,
  (req, res) => {
    res.status(200).json({ message: 'Bulk upload function would be implemented here' });
  }
);

export default router;