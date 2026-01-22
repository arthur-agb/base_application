// MomentumComment.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

const MomentumComment = {
  /**
   * Creates a new comment.
   *
   * @param {object} commentData - The data for the new comment.
   * @param {string} commentData.issueId - The ID of the issue the comment belongs to.
   * @param {string} commentData.authorUserId - The ID of the user who authored the comment.
   * @param {string} [commentData.parentCommentId] - The ID of the parent comment if it's a reply.
   * @param {string} commentData.body - The content of the comment.
   * @returns {Promise<object>} The newly created comment object.
   * @throws {Error} If the comment creation fails.
   */
  async create(commentData) {
    try {
      const newComment = await prisma.momentumComment.create({
        data: commentData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error(`Could not create comment: ${error.message}`);
    }
  },

  /**
   * Finds a comment by its ID.
   *
   * @param {string} commentId - The ID of the comment to find.
   * @returns {Promise<object|null>} The comment object if found, otherwise null.
   * @throws {Error} If the database query fails.
   */
  async findById(commentId) {
    try {
      const comment = await prisma.momentumComment.findUnique({
        where: { id: commentId },
        include: {
          issue: true,
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          parentComment: true,
          replies: true,
        },
      });
      return comment;
    } catch (error) {
      console.error('Error finding comment by ID:', error);
      throw new Error(`Could not find comment: ${error.message}`);
    }
  },

  /**
   * Finds all comments for a specific issue.
   *
   * @param {string} issueId - The ID of the issue to find comments for.
   * @returns {Promise<array>} An array of comment objects.
   * @throws {Error} If the database query fails.
   */
  async findByIssueId(issueId) {
    try {
      const allComments = await prisma.momentumComment.findMany({
        where: { issueId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Build hierarchical structure
      const commentMap = new Map();
      const rootComments = [];

      // First pass: create map of all comments
      allComments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: build hierarchy
      allComments.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id);
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId);
          if (parent) {
            parent.replies.push(commentWithReplies);
          } else {
            // If parent not found, treat as root comment
            rootComments.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error finding comments by issue ID:', error);
      throw new Error(`Could not find comments for issue: ${error.message}`);
    }
  },

  /**
   * Updates an existing comment.
   *
   * @param {string} commentId - The ID of the comment to update.
   * @param {object} updateData - The data to update the comment with.
   * @returns {Promise<object>} The updated comment object.
   * @throws {Error} If the update fails.
   */
  async update(commentId, updateData) {
    try {
      const updatedComment = await prisma.momentumComment.update({
        where: { id: commentId },
        data: {
          ...updateData,
          edited: true,
          editedAt: new Date(),
        },
      });
      return updatedComment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error(`Could not update comment: ${error.message}`);
    }
  },

  /**
   * Deletes a comment by its ID.
   *
   * @param {string} commentId - The ID of the comment to delete.
   * @returns {Promise<object>} The deleted comment object.
   * @throws {Error} If the deletion fails.
   */
  async delete(commentId) {
    try {
      const deletedComment = await prisma.momentumComment.delete({
        where: { id: commentId },
      });
      return deletedComment;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error(`Could not delete comment: ${error.message}`);
    }
  },
};

export default MomentumComment;