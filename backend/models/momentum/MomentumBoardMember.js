// MomentumBoardMember.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MomentumBoardMember = {
  /**
   * Creates a new MomentumBoardMember record.
   * @param {object} data - The data for the new board member.
   * @param {string} data.boardId - The ID of the board the member belongs to.
   * @param {string} data.userId - The ID of the user who is the board member.
   * @param {boolean} [data.isActive=true] - Whether the member is active on the board.
   * @returns {Promise<object|null>} The created board member object or null if an error occurs.
   */
  async create(data) {
    try {
      return await prisma.momentumBoardMember.create({ data });
    } catch (error) {
      console.error("Error creating MomentumBoardMember:", error);
      return null;
    }
  },

  /**
   * Finds a MomentumBoardMember by their boardId and userId.
   * @param {string} boardId - The ID of the board.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object|null>} The found board member object, including related board and user details, or null if not found or an error occurs.
   */
  async findByBoardAndUser(boardId, userId) {
    try {
      return await prisma.momentumBoardMember.findUnique({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
        select: {
          board: {
            select: {
              name: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              displayName: true,
            },
          },
          isActive: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error("Error finding MomentumBoardMember:", error);
      return null;
    }
  },

  /**
   * Finds all members for a specific board.
   * @param {string} boardId - The ID of the board.
   * @returns {Promise<Array<object>|null>} A list of board member objects, including user details, or null if an error occurs.
   */
  async findByBoardId(boardId) {
    try {
      return await prisma.momentumBoardMember.findMany({
        where: { boardId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error finding board members by board ID:", error);
      return null;
    }
  },

  /**
   * Updates an existing MomentumBoardMember record.
   * @param {string} boardId - The ID of the board.
   * @param {string} userId - The ID of the user.
   * @param {object} data - The data to update.
   * @param {boolean} data.isActive - Whether the member is active on the board.
   * @param {string} [data.endedAt] - The date the member ended their membership.
   * @returns {Promise<object|null>} The updated board member object or null if not found or an error occurs.
   */
  async update(boardId, userId, data) {
    try {
      return await prisma.momentumBoardMember.update({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
        data,
      });
    } catch (error) {
      console.error("Error updating MomentumBoardMember:", error);
      return null;
    }
  },

  /**
   * Deletes a MomentumBoardMember record.
   * @param {string} boardId - The ID of the board.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object|null>} The deleted board member object or null if not found or an error occurs.
   */
  async remove(boardId, userId) {
    try {
      return await prisma.momentumBoardMember.delete({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting MomentumBoardMember:", error);
      return null;
    }
  },
};

export default MomentumBoardMember;