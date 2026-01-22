// services/comment.service.js

import { MomentumHistoryModel } from '../models/momentum/MomentumHistory.js';
import MomentumComment from '../models/momentum/MomentumComment.js';

import prisma from '../utils/prismaClient.js';
import Logger from '../utils/logger.js';
import redisClient from '../utils/redisClient.js';
import ErrorResponse from '../utils/errorResponse.js';

import { HistoryAction } from '@prisma/client';

/**
 * A robust helper function to authorize a user against an issue's project.
 * It handles both users within a company context and those in a personal context.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} issueId - The ID of the issue being accessed.
 * @param {string|null} companyId - The company ID from the user's context, or null.
 * @returns {Promise<{issue: object, project: object}>}
 */
async function authorizeAndGetIssueProject(userId, issueId, companyId) {
    const issue = await prisma.momentumIssue.findUnique({
        where: { id: issueId },
        include: {
            project: {
                include: {
                    members: { select: { userId: true } },
                    projectLead: { select: { id: true } }
                }
            }
        }
    });

    if (!issue || !issue.project) {
        throw new ErrorResponse('Issue or its associated project not found', 404);
    }

    const { project } = issue;

    // Strictly enforce context isolation (null for personal, or specific company ID)
    if (project.companyId !== (companyId || null)) {
        throw new ErrorResponse('Not authorized to access this issue within your current workspace context', 403);
    }

    // Authorize the user against the project membership.
    const isMember = project.members.some(member => member.userId === userId);
    const isLead = project.projectLead?.id === userId;

    if (!isMember && !isLead) {
        throw new ErrorResponse('Not authorized to perform this action in this project', 403);
    }

    return { issue, project };
}


export const createComment = async (issueId, userId, companyId, body, parentCommentId) => {
    const { project } = await authorizeAndGetIssueProject(userId, issueId, companyId);

    const commentData = { body, issueId, authorUserId: userId };

    if (parentCommentId) {
        const parent = await MomentumComment.findById(parentCommentId);
        if (!parent || parent.issueId !== issueId) {
            throw new ErrorResponse('Parent comment not found or does not belong to this issue', 404);
        }
        commentData.parentCommentId = parentCommentId;
    }

    const newComment = await MomentumComment.create(commentData);

    await MomentumHistoryModel.create({
        action: HistoryAction.CREATE,
        entityType: 'ISSUE',
        entityId: issueId,
        associatedEntityType: 'COMMENT',
        associatedEntityId: newComment.id,
        userId: userId,
        companyId: companyId,
        newValue: newComment.body,
    });

    if (redisClient?.isConnected) {
        await redisClient.del(`issue:${issueId}:comments`).catch(e => Logger.error(`Cache clear failed: ${e.message}`));
    }

    return { comment: newComment, projectId: project.id, eventType: parentCommentId ? 'comment:reply' : 'comment:create' };
};

export const getCommentsForIssue = async (issueId, userId, companyId) => {
    await authorizeAndGetIssueProject(userId, issueId, companyId);

    const cacheKey = `issue:${issueId}:comments`;
    if (redisClient?.isConnected) {
        const cachedComments = await redisClient.get(cacheKey);
        if (cachedComments) return JSON.parse(cachedComments);
    }

    const comments = await MomentumComment.findByIssueId(issueId);

    if (redisClient?.isConnected) {
        await redisClient.set(cacheKey, JSON.stringify(comments), { EX: 3600 });
    }

    return comments;
};

export const updateComment = async (commentId, userId, companyId, body) => {
    const comment = await MomentumComment.findById(commentId);
    if (!comment) {
        throw new ErrorResponse('Comment not found', 404);
    }

    const { project } = await authorizeAndGetIssueProject(userId, comment.issueId, companyId);

    const isAuthor = comment.authorUserId === userId;
    const isProjectLead = project.projectLead?.id === userId;

    if (!isAuthor && !isProjectLead) {
        throw new ErrorResponse('Not authorized to update this comment', 403);
    }

    const originalBody = comment.body;
    const updatedComment = await MomentumComment.update(commentId, { body });

    await MomentumHistoryModel.create({
        action: HistoryAction.UPDATE,
        entityType: 'COMMENT',
        entityId: commentId,
        userId: userId,
        companyId: companyId,
        fieldChanged: 'body',
        oldValue: originalBody,
        newValue: updatedComment.body,
    });

    if (redisClient?.isConnected) {
        await redisClient.del(`issue:${comment.issueId}:comments`).catch(e => Logger.error(`Cache clear failed: ${e.message}`));
    }

    return { updatedComment, projectId: project.id };
};


export const deleteComment = async (commentId, userId, companyId) => {
    const comment = await MomentumComment.findById(commentId);
    if (!comment) {
        throw new ErrorResponse('Comment not found', 404);
    }

    const { project } = await authorizeAndGetIssueProject(userId, comment.issueId, companyId);

    const isAuthor = comment.authorUserId === userId;
    const isProjectLead = project.projectLead?.id === userId;

    if (!isAuthor && !isProjectLead) {
        throw new ErrorResponse('Not authorized to delete this comment', 403);
    }

    await MomentumComment.delete(commentId);

    await MomentumHistoryModel.create({
        action: HistoryAction.DELETE,
        entityType: 'COMMENT',
        entityId: commentId,
        userId: userId,
        companyId: companyId,
        oldValue: comment.body,
    });

    if (redisClient?.isConnected) {
        await redisClient.del(`issue:${comment.issueId}:comments`).catch(e => Logger.error(`Cache clear failed: ${e.message}`));
    }

    return { commentId, issueId: comment.issueId, parentCommentId: comment.parentCommentId, projectId: project.id };
};

export const toggleReaction = async (commentId, userId, companyId, type) => {
    if (!/^[a-zA-Z0-9_]+$/.test(type)) {
        throw new ErrorResponse('Invalid reaction type format.', 400);
    }

    const comment = await prisma.momentumComment.findUnique({
        where: { id: commentId },
        select: { id: true, reactions: true, issueId: true, parentCommentId: true },
    });

    if (!comment) {
        throw new ErrorResponse('Comment not found', 404);
    }

    const { project } = await authorizeAndGetIssueProject(userId, comment.issueId, companyId);

    let currentReactions = (comment.reactions && typeof comment.reactions === 'object' && !Array.isArray(comment.reactions)) ? { ...comment.reactions } : {};
    let userListForType = currentReactions[type] || [];
    const userIndex = userListForType.indexOf(userId);

    if (userIndex === -1) {
        userListForType.push(userId);
    } else {
        userListForType.splice(userIndex, 1);
    }

    if (userListForType.length === 0) {
        delete currentReactions[type];
    } else {
        currentReactions[type] = userListForType;
    }

    const updatedComment = await prisma.momentumComment.update({
        where: { id: commentId },
        data: { reactions: currentReactions },
        select: { reactions: true }
    });

    await MomentumHistoryModel.create({
        action: userIndex === -1 ? HistoryAction.ADD : HistoryAction.REMOVE,
        entityType: 'COMMENT',
        entityId: commentId,
        userId: userId,
        companyId: companyId,
        fieldChanged: 'reaction',
        newValue: type,
    });

    if (redisClient?.isConnected) {
        await redisClient.del(`issue:${comment.issueId}:comments`).catch(e => Logger.error(`Cache clear failed: ${e.message}`));
    }

    return { commentId, issueId: comment.issueId, reactions: updatedComment.reactions, parentCommentId: comment.parentCommentId, projectId: project.id };
};

export const getUserComments = async (targetUserId, requestingUserId, companyId, page, limit) => {
    // Authorization is handled by the controller
    const skip = (page - 1) * limit;

    const whereClause = {
        authorUserId: targetUserId,
        issue: {
            project: {
                // Strictly filter by the current context (company or personal)
                companyId: companyId || null
            }
        }
    };

    const [total, comments] = await prisma.$transaction([
        prisma.momentumComment.count({ where: whereClause }),
        prisma.momentumComment.findMany({
            where: whereClause,
            include: {
                issue: {
                    select: {
                        id: true,
                        title: true,
                        project: { select: { key: true, name: true } }
                    }
                },
                author: { select: { id: true, displayName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        })
    ]);

    return {
        comments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};