// controllers/comment.tenant.controller.js

import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';
import * as commentService from '../services/comment.service.js';
import Logger from '../utils/logger.js';


/**
 * @desc    Create a new comment for an issue
 * @route   POST /api/issues/:issueId/comments
 * @access  Private (Project Member)
 */
export const createComment = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { body, parentCommentId } = req.body;
    const userId = req.user.id;
    const companyId = req.company?.id || null;

    if (!body) {
        throw new ErrorResponse('Comment body is required', 400);
    }
    
    const result = await commentService.createComment(issueId, userId, companyId, body, parentCommentId);
    
    const io = req.app.get('io');
    if (io) {
        const payload = result.eventType === 'comment:reply'
            ? { issueId, parentCommentId, reply: result.comment }
            : { issueId, comment: result.comment };
        io.to(`project:${result.projectId}`).emit(result.eventType, payload);
        Logger.info(`Socket event ${result.eventType} emitted for project ${result.projectId}, issue ${issueId}`);
    }

    res.status(201).json(result.comment);
});


/**
 * @desc    Get all comments for an issue (including replies and reactions)
 * @route   GET /api/issues/:issueId/comments
 * @access  Private (Project Member)
 */
export const getCommentsForIssue = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const userId = req.user.id;
    const companyId = req.company?.id || null;

    const comments = await commentService.getCommentsForIssue(issueId, userId, companyId);

    res.status(200).json(comments);
});

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:commentId
 * @access  Private (Comment Author or Admin/Project Lead)
 */
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { body } = req.body;
    const userId = req.user.id;
    const companyId = req.company?.id || null;

    if (!body) {
        throw new ErrorResponse('Comment body is required for update', 400);
    }
    
    const result = await commentService.updateComment(commentId, userId, companyId, body);
    
    const io = req.app.get('io');
    if (io) {
        io.to(`project:${result.projectId}`).emit('comment:update', {
            issueId: result.updatedComment.issueId,
            comment: result.updatedComment,
        });
        Logger.info(`Socket event comment:update emitted for project ${result.projectId}, issue ${result.updatedComment.issueId}`);
    }

    res.status(200).json(result.updatedComment);
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private (Comment Author or Admin/Project Lead)
 */
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    const companyId = req.company?.id || null;
    
    const result = await commentService.deleteComment(commentId, userId, companyId);

    const io = req.app.get('io');
    if (io) {
        io.to(`project:${result.projectId}`).emit('comment:delete', {
            issueId: result.issueId,
            commentId: result.commentId,
            parentCommentId: result.parentCommentId,
        });
        Logger.info(`Socket event comment:delete emitted for project ${result.projectId}, issue ${result.issueId}`);
    }
    
    res.status(200).json({ message: 'Comment deleted successfully', id: result.commentId });
});


/**
 * @desc    Toggle a reaction to a comment
 * @route   POST /api/comments/:commentId/reactions
 * @access  Private (Project Member)
 */
export const toggleReaction = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;
    const companyId = req.company?.id || null;
    
    if (!type) {
        throw new ErrorResponse('Reaction type is required', 400);
    }
    
    const result = await commentService.toggleReaction(commentId, userId, companyId, type);
    
    const io = req.app.get('io');
    if (io) {
        io.to(`project:${result.projectId}`).emit('comment:reaction', {
            issueId: result.issueId,
            commentId: result.commentId,
            reactions: result.reactions,
            parentCommentId: result.parentCommentId,
        });
        Logger.info(`Socket event comment:reaction emitted for project ${result.projectId}, issue ${result.issueId}`);
    }
    
    res.status(200).json({
        commentId: result.commentId,
        reactions: result.reactions,
    });
});


/**
 * @desc    Get a user's comments with pagination
 * @route   GET /api/users/:userId/comments
 * @access  Private (Admin or Self)
 */
export const getUserComments = asyncHandler(async (req, res) => {
    const { userId: targetUserId } = req.params;
    const requestingUserId = req.user.id;
    const companyId = req.company?.id || null;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        throw new ErrorResponse('Invalid pagination parameters', 400);
    }

    if (req.user.role !== 'ADMIN' && requestingUserId !== targetUserId) {
        throw new ErrorResponse('Not authorized to view comments for this user', 403);
    }
    
    const result = await commentService.getUserComments(targetUserId, requestingUserId, companyId, pageNum, limitNum);
    
    res.status(200).json(result);
});
