// MomentumProjectMember.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MomentumProjectMember = {
  /**
   * Creates a new project member.
   * @param {object} data - The data for the new project member.
   * @returns {Promise<object>} The created project member object.
   * @throws {Error} If the creation fails.
   */
  create: async (data) => {
    try {
      return await prisma.momentumProjectMember.create({
        data,
      });
    } catch (error) {
      console.error("Error creating project member:", error);
      throw new Error(`Failed to create project member: ${error.message}`);
    }
  },

  /**
   * Finds a single project member by their project and user ID.
   * @param {string} projectId - The ID of the project.
   * @param {string} userId - The ID of the user.
   * @param {object} [options] - Optional Prisma find unique options.
   * @returns {Promise<object|null>} The project member object or null if not found.
   * @throws {Error} If the query fails.
   */
  findByProjectAndUser: async (projectId, userId, options = {}) => {
    try {
      const { include, select } = options;
      return await prisma.momentumProjectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        ... (include && { include }),
        ... (select && { select }),
      });
    } catch (error) {
      console.error("Error finding project member:", error);
      throw new Error(`Failed to find project member: ${error.message}`);
    }
  },

  /**
   * Finds all project members for a given project.
   * @param {string} projectId - The ID of the project.
   * @param {object} [options] - Optional Prisma find many options.
   * @returns {Promise<Array<object>>} A list of project member objects.
   * @throws {Error} If the query fails.
   */
  findByProject: async (projectId, options = {}) => {
    try {
      const { include, select } = options;
      return await prisma.momentumProjectMember.findMany({
        where: { projectId },
        ... (include && { include }),
        ... (select && { select }),
      });
    } catch (error) {
      console.error("Error finding project members by project:", error);
      throw new Error(`Failed to find project members for project ID ${projectId}: ${error.message}`);
    }
  },

  /**
   * Updates an existing project member.
   * @param {string} projectId - The ID of the project.
   * @param {string} userId - The ID of the user.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated project member object.
   * @throws {Error} If the update fails.
   */
  update: async (projectId, userId, data) => {
    try {
      return await prisma.momentumProjectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        data,
      });
    } catch (error) {
      console.error("Error updating project member:", error);
      throw new Error(`Failed to update project member: ${error.message}`);
    }
  },

  /**
   * Deletes a project member.
   * @param {string} projectId - The ID of the project.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>} The deleted project member object.
   * @throws {Error} If the deletion fails.
   */
  delete: async (projectId, userId) => {
    try {
      return await prisma.momentumProjectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting project member:", error);
      throw new Error(`Failed to delete project member: ${error.message}`);
    }
  },
};

export default MomentumProjectMember;