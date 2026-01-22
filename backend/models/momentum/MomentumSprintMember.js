// MomentumSprintMember.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MomentumSprintMember = {
  /**
   * Creates a new MomentumSprintMember record.
   * @async
   * @param {object} data - The data for the new sprint member.
   * @param {string} data.sprintId - The ID of the sprint.
   * @param {string} data.userId - The ID of the user.
   * @returns {Promise<object>} The created MomentumSprintMember object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newMember = await prisma.momentumSprintMember.create({
        data: {
          sprintId: data.sprintId,
          userId: data.userId,
        },
      });
      return newMember;
    } catch (error) {
      console.error('Error creating MomentumSprintMember:', error);
      throw new Error(`Could not create sprint member: ${error.message}`);
    }
  },

  /**
   * Finds a MomentumSprintMember by sprintId and userId.
   * @async
   * @param {string} sprintId - The ID of the sprint.
   * @param {string} userId - The ID of the user.
   * @param {object} [options] - Optional query options.
   * @param {boolean} [options.includeUser=false] - Whether to include the related UserMain object.
   * @param {boolean} [options.includeSprint=false] - Whether to include the related MomentumSprint object.
   * @returns {Promise<object|null>} The MomentumSprintMember object or null if not found.
   * @throws {Error} If the query fails.
   */
  async findUnique(sprintId, userId, { includeUser = false, includeSprint = false } = {}) {
    try {
      const member = await prisma.momentumSprintMember.findUnique({
        where: {
          sprintId_userId: {
            sprintId,
            userId,
          },
        },
        include: {
          user: includeUser,
          sprint: includeSprint,
        },
      });
      return member;
    } catch (error) {
      console.error('Error finding MomentumSprintMember:', error);
      throw new Error(`Could not find sprint member: ${error.message}`);
    }
  },

  /**
   * Finds all MomentumSprintMember records for a given sprint.
   * @async
   * @param {string} sprintId - The ID of the sprint.
   * @param {object} [options] - Optional query options.
   * @param {boolean} [options.includeUser=false] - Whether to include the related UserMain object.
   * @returns {Promise<object[]>} An array of MomentumSprintMember objects.
   * @throws {Error} If the query fails.
   */
  async findManyBySprint(sprintId, { includeUser = false } = {}) {
    try {
      const members = await prisma.momentumSprintMember.findMany({
        where: { sprintId },
        include: { user: includeUser },
      });
      return members;
    } catch (error) {
      console.error('Error finding sprint members by sprint:', error);
      throw new Error(`Could not find sprint members for sprint ${sprintId}: ${error.message}`);
    }
  },

  /**
   * Updates a MomentumSprintMember record.
   * @async
   * @param {string} sprintId - The ID of the sprint.
   * @param {string} userId - The ID of the user.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated MomentumSprintMember object.
   * @throws {Error} If the update fails.
   */
  async update(sprintId, userId, data) {
    try {
      const updatedMember = await prisma.momentumSprintMember.update({
        where: {
          sprintId_userId: {
            sprintId,
            userId,
          },
        },
        data,
      });
      return updatedMember;
    } catch (error) {
      console.error('Error updating MomentumSprintMember:', error);
      throw new Error(`Could not update sprint member: ${error.message}`);
    }
  },

  /**
   * Deletes a MomentumSprintMember record.
   * @async
   * @param {string} sprintId - The ID of the sprint.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>} The deleted MomentumSprintMember object.
   * @throws {Error} If the deletion fails.
   */
  async delete(sprintId, userId) {
    try {
      const deletedMember = await prisma.momentumSprintMember.delete({
        where: {
          sprintId_userId: {
            sprintId,
            userId,
          },
        },
      });
      return deletedMember;
    } catch (error) {
      console.error('Error deleting MomentumSprintMember:', error);
      throw new Error(`Could not delete sprint member: ${error.message}`);
    }
  },
};

export default MomentumSprintMember;