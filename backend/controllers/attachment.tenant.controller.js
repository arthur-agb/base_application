// controllers/attachment.tenant.controller.js
import asyncHandler from 'express-async-handler';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';
import SocketHandlers from '../utils/socketHandlers.js';
import redisClient from '../utils/redisClient.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * @desc    Upload attachment to an issue
 * @route   POST /api/issues/:id/attachments
 * @access  Private
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.company?.id || null;

  const issue = await prisma.momentumIssue.findFirst({
    where: {
      id: id,
      companyId: companyId,
    },
    include: {
      project: true
    }
  });

  if (!issue) {
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    throw new ErrorResponse('Issue not found or not accessible within your company', 404);
  }

  if (!issue.project.members.includes(req.user.id)) {
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    throw new ErrorResponse('Not authorized to upload attachments to this issue', 403);
  }

  if (!req.file) {
    throw new ErrorResponse('Please upload a file', 400);
  }

  const newAttachmentData = {
    filename: req.file.originalname,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user.id,
    uploadedAt: new Date(),
    issueId: issue.id,
    companyId: companyId,
  };

  const createdAttachment = await prisma.attachment.create({
    data: newAttachmentData
  });

  if (redisClient.isConnected) {
    await redisClient.del(`issue:${companyId}:${id}`);
  }

  Logger.info(`Attachment '${req.file.originalname}' uploaded to issue ${issue.key} by ${req.user.name} (${req.user.id}) for company ${companyId}`);

  const io = req.app.get('io');
  if (io) {
    io.to(`project:${issue.project.id}`).emit('issue:attachment', {
      issueId: issue.id,
      attachment: {
        id: createdAttachment.id,
        filename: createdAttachment.filename,
        path: `/uploads/${path.basename(createdAttachment.path)}`,
        mimetype: createdAttachment.mimetype,
        size: createdAttachment.size,
        uploadedBy: {
          id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        uploadedAt: createdAttachment.uploadedAt
      }
    });
  }

  res.status(200).json({
    id: createdAttachment.id,
    filename: createdAttachment.filename,
    path: `/uploads/${path.basename(createdAttachment.path)}`,
    mimetype: createdAttachment.mimetype,
    size: createdAttachment.size,
    uploadedBy: req.user.id,
    uploadedAt: createdAttachment.uploadedAt
  });
});

/**
 * @desc    Delete attachment from an issue
 * @route   DELETE /api/issues/:id/attachments/:attachmentId
 * @access  Private
 */
export const deleteAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;
  const companyId = req.company?.id || null;

  const issue = await prisma.momentumIssue.findFirst({
    where: {
      id: id,
      companyId: companyId,
    },
    include: {
      project: true,
      attachments: {
        where: { id: attachmentId, companyId: companyId }
      }
    }
  });

  if (!issue) {
    throw new ErrorResponse('Issue not found or not accessible within your company', 404);
  }

  if (!issue.project.members.includes(req.user.id)) {
    throw new ErrorResponse('Not authorized to delete attachments from this issue', 403);
  }

  const attachment = issue.attachments[0];

  if (!attachment) {
    throw new ErrorResponse('Attachment not found or not accessible within your company', 404);
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isProjectLead = issue.project.lead === req.user.id;
  const isUploader = attachment.uploadedBy && attachment.uploadedBy === req.user.id;

  if (!(isAdmin || isProjectLead || isUploader)) {
    throw new ErrorResponse('Not authorized to delete this attachment', 403);
  }

  try {
    await fs.unlink(attachment.path);
  } catch (error) {
    Logger.error('Error deleting file:', error);
  }

  await prisma.attachment.delete({
    where: {
      id: attachmentId,
      companyId: companyId,
      issueId: issue.id
    }
  });

  if (redisClient.isConnected) {
    await redisClient.del(`issue:${companyId}:${id}`);
  }

  Logger.info(`Attachment '${attachment.filename}' deleted from issue ${issue.key} by ${req.user.name} (${req.user.id}) for company ${companyId}`);

  const io = req.app.get('io');
  if (io) {
    io.to(`project:${issue.project.id}`).emit('issue:attachment_deleted', {
      issueId: issue.id,
      attachmentId
    });
  }

  res.status(200).json({
    message: 'Attachment deleted',
    attachmentId
  });
});

/**
 * @desc    Get an attachment
 * @route   GET /api/attachments/:filename
 * @access  Private
 */
export const getAttachment = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const companyId = req.company?.id || null;

  const attachment = await prisma.attachment.findFirst({
    where: {
      path: {
        contains: filename
      },
      companyId: companyId,
    },
    select: {
      path: true,
      issue: {
        select: {
          project: {
            select: {
              members: true,
              lead: true,
            }
          }
        }
      },
      uploadedBy: true
    }
  });

  if (!attachment) {
    throw new ErrorResponse('File not found or not accessible within your company', 404);
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isProjectLead = attachment.issue.project.lead === req.user.id;
  const isMember = attachment.issue.project.members.includes(req.user.id);
  const isUploader = attachment.uploadedBy === req.user.id;

  if (!(isAdmin || isProjectLead || isMember || isUploader)) {
    throw new ErrorResponse('Not authorized to access this file', 403);
  }

  const filePath = attachment.path;

  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    Logger.error(`Error serving file ${filePath}:`, error);
    throw new ErrorResponse('File not found on server', 404);
  }
});

/**
 * @desc    Upload multiple attachments (bulk upload)
 * @route   POST /api/attachments/bulk
 * @access  Private
 */
export const bulkUpload = asyncHandler(async (req, res) => {
  const { issueId } = req.body;
  const companyId = req.company?.id || null;

  if (!issueId) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await fs.unlink(file.path);
      }
    }
    throw new ErrorResponse('Issue ID is required', 400);
  }

  const issue = await prisma.momentumIssue.findFirst({
    where: {
      id: issueId,
      companyId: companyId,
    },
    include: {
      project: true
    }
  });

  if (!issue) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await fs.unlink(file.path);
      }
    }
    throw new ErrorResponse('Issue not found or not accessible within your company', 404);
  }

  if (!issue.project.members.includes(req.user.id)) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await fs.unlink(file.path);
      }
    }
    throw new ErrorResponse('Not authorized to upload attachments to this issue', 403);
  }

  if (!req.files || req.files.length === 0) {
    throw new ErrorResponse('Please upload at least one file', 400);
  }

  const attachmentsToCreate = [];
  const uploadedAttachmentsResponse = [];

  for (const file of req.files) {
    attachmentsToCreate.push({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      issueId: issue.id,
      companyId: companyId,
    });
  }

  const createdAttachments = await prisma.attachment.createManyAndReturn({
    data: attachmentsToCreate,
    skipDuplicates: true,
  });

  for (const created of createdAttachments) {
    uploadedAttachmentsResponse.push({
      id: created.id,
      filename: created.filename,
      path: `/uploads/${path.basename(created.path)}`,
      mimetype: created.mimetype,
      size: created.size,
      uploadedBy: created.uploadedBy,
      uploadedAt: created.uploadedAt
    });
  }

  if (redisClient.isConnected) {
    await redisClient.del(`issue:${companyId}:${issueId}`);
  }

  Logger.info(`${req.files.length} attachments uploaded to issue ${issue.key} by ${req.user.name} (${req.user.id}) for company ${companyId}`);

  const io = req.app.get('io');
  if (io) {
    io.to(`project:${issue.project.id}`).emit('issue:attachments_bulk', {
      issueId: issue.id,
      attachments: uploadedAttachmentsResponse
    });
  }

  res.status(200).json({
    message: `${req.files.length} attachments uploaded successfully`,
    attachments: uploadedAttachmentsResponse
  });
});
