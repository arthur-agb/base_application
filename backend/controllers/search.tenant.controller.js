// controllers/search.tenant.controller.js
import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import * as searchService from '../services/search.service.js';

/**
 * @desc    Global search across all content
 * @route   GET /api/search
 * @access  Private
 */
const globalSearch = asyncHandler(async (req, res) => {
  // 1. Basic input validation
  const { query, type, projectId, boardId, limit } = req.query;
  if (!query || query.length < 2) {
    throw new ErrorResponse('Search query must be at least 2 characters', 400);
  }

  // 2. Call the corresponding service function
  const results = await searchService.performGlobalSearch({
    query,
    type,
    projectId,
    boardId,
    limit,
    user: req.user,
    company: req.company,
    userCompanyRole: req.userCompanyRole,
  });

  // 3. Handle the response
  res.status(200).json(results);
});

/**
 * @desc    JQL-like advanced search
 * @route   POST /api/search/advanced
 * @access  Private
 */
const advancedSearch = asyncHandler(async (req, res) => {
  // 1. Basic input validation is handled by the service
  const searchCriteria = req.body;
  const { page, limit } = searchCriteria;

  // 2. Call the corresponding service function
  const { issues, pagination } = await searchService.performAdvancedSearch({
    searchCriteria,
    user: req.user,
    company: req.company,
    userCompanyRole: req.userCompanyRole,
  });

  // 3. Handle the response
  res.status(200).json({ issues, pagination });
});

/**
 * @desc    Get search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Private
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
  // 1. Basic input validation
  const { query, type } = req.query;
  if (!query || query.length < 2) {
    throw new ErrorResponse('Query must be at least 2 characters', 400);
  }

  // 2. Call the corresponding service function
  const suggestions = await searchService.getSearchSuggestions({
    query,
    type,
    user: req.user,
    company: req.company,
    userCompanyRole: req.userCompanyRole,
  });

  // 3. Handle the response
  res.status(200).json(suggestions);
});

export {
  globalSearch,
  advancedSearch,
  getSearchSuggestions,
};
