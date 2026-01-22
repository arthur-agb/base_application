import asyncHandler from 'express-async-handler';
import { createCompany as createCompanyService } from '../services/tenant.service.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * @desc    Create a new company
 * @route   POST /api/tenants
 * @access  Private
 */
export const createCompany = asyncHandler(async (req, res, next) => {
    const { name, slug } = req.body;

    if (!name || !slug) {
        return next(new ErrorResponse('Please provide a company name and organization URL (slug).', 400));
    }

    // Slug validation: lowercase, alphanumeric and hyphens only
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
        return next(new ErrorResponse('Organization URL (slug) must be lowercase and only contain letters, numbers, and hyphens.', 400));
    }

    const company = await createCompanyService(req.user.id, name, slug);

    res.status(201).json({
        success: true,
        data: company,
    });
});
