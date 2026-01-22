import asyncHandler from 'express-async-handler';
import * as searchService from '../services/search.service.js';

/**
 * @desc    Global search across various content types
 * @route   GET /api/search
 * @access  Private
 */
export const globalSearch = asyncHandler(async (req, res) => {
    const { query, type = 'all', projectId, limit = 10 } = req.query;
    const { activeCompanyId } = req;

    if (!query || query.length < 2) {
        res.status(400);
        throw new Error('Search query must be at least 2 characters long');
    }

    const results = await searchService.globalSearch({
        query,
        type,
        projectId,
        limit: parseInt(limit, 10),
        companyId: activeCompanyId,
    });

    res.json(results);
});

/**
 * @desc    Advanced search for issues
 * @route   POST /api/search/advanced
 * @access  Private
 */
export const advancedSearch = asyncHandler(async (req, res) => {
    const { activeCompanyId } = req;
    const searchCriteria = req.body;

    const results = await searchService.advancedSearch({
        ...searchCriteria,
        companyId: activeCompanyId,
    });

    res.json(results);
});

/**
 * @desc    Get search suggestions for autocomplete
 * @route   GET /api/search/suggestions
 * @access  Private
 */
export const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { query, type = 'issues' } = req.query;
    const { activeCompanyId } = req;

    if (!query || query.length < 2) {
        res.status(400);
        throw new Error('Search query must be at least 2 characters long');
    }

    const suggestions = await searchService.getSearchSuggestions({
        query,
        type,
        companyId: activeCompanyId,
    });

    res.json(suggestions);
});
