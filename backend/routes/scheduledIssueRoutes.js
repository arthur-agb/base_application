import express from 'express';
import {
    createScheduledIssue,
    getScheduledIssuesByBoard,
    updateScheduledIssue,
    deleteScheduledIssue
} from '../controllers/scheduledIssue.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import tenantContext from '../middleware/tenantContext.js';
import { checkCompanyRole } from '../middleware/tenantRoleMiddleware.js';
import { CompanyUserRole } from '@prisma/client';

const router = express.Router();

router.route('/')
    .post(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), createScheduledIssue);

router.route('/board/:boardId')
    .get(protect, tenantContext, checkCompanyRole(CompanyUserRole.VIEWER), getScheduledIssuesByBoard);

router.route('/:id')
    .put(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), updateScheduledIssue)
    .delete(protect, tenantContext, checkCompanyRole(CompanyUserRole.MEMBER), deleteScheduledIssue);

export default router;
