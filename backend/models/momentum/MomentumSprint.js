// MomentumSprint.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * @typedef {Object} MomentumSprint
 * @property {string} id - The unique identifier of the sprint.
 * @property {string} projectId - The ID of the project the sprint belongs to.
 * @property {string} title - The title of the sprint.
 * @property {string | null} goal - The goal of the sprint.
 * @property {string | null} description - The description of the sprint.
 * @property {('PLANNED' | 'ACTIVE' | 'COMPLETED')} status - The current status of the sprint.
 * @property {Date | null} startDate - The planned start date of the sprint.
 * @property {Date | null} endDate - The planned end date of the sprint.
 * @property {number | null} capacityPoints - The total story points or capacity for the sprint.
 * @property {Date} createdAt - The date and time the sprint was created.
 * @property {Date} updatedAt - The date and time the sprint was last updated.
 */

/**
 * @typedef {Object} MomentumSprintCreateInput
 * @property {string} projectId - The ID of the project the sprint belongs to.
 * @property {string} title - The title of the sprint.
 * @property {string} [goal] - The goal of the sprint.
 * @property {string} [description] - The description of the sprint.
 * @property {('PLANNED' | 'ACTIVE' | 'COMPLETED')} [status] - The initial status of the sprint.
 * @property {Date} [startDate] - The planned start date.
 * @property {Date} [endDate] - The planned end date.
 * @property {number} [capacityPoints] - The total story points or capacity.
 */

/**
 * @typedef {Object} MomentumSprintUpdateInput
 * @property {string} [title] - The updated title.
 * @property {string} [goal] - The updated goal.
 * @property {string} [description] - The updated description.
 * @property {('PLANNED' | 'ACTIVE' | 'COMPLETED')} [status] - The updated status.
 * @property {Date} [startDate] - The updated start date.
 * @property {Date} [endDate] - The updated end date.
 * @property {number} [capacityPoints] - The updated capacity.
 */

/**
 * @typedef {Object} MomentumSprintFindManyArgs
 * @property {string} [projectId] - Filters sprints by a specific project.
 * @property {('PLANNED' | 'ACTIVE' | 'COMPLETED')} [status] - Filters sprints by a specific status.
 */

/**
 * @typedef {Object} MomentumSprintWithRelations
 * @property {string} id
 * @property {string} title
 * @property {('PLANNED' | 'ACTIVE' | 'COMPLETED')} status
 * @property {Object} project - The related project object.
 * @property {Array<Object>} issues - An array of related issues.
 * @property {Array<Object>} members - An array of related members.
 */

const MomentumSprint = {
  /**
   * Creates a new sprint for a project.
   * @async
   * @param {MomentumSprintCreateInput} data - The data for the new sprint.
   * @returns {Promise<MomentumSprint | null>} The created sprint, or null if an error occurred.
   */
  async create(data) {
    try {
      return await prisma.momentumSprint.create({ data });
    } catch (error) {
      console.error('Error creating sprint:', error);
      return null;
    }
  },

  /**
   * Finds all sprints, with optional filtering.
   * @async
   * @param {MomentumSprintFindManyArgs} [filters] - Optional filters for the query.
   * @returns {Promise<MomentumSprint[] | null>} An array of sprints, or null if an error occurred.
   */
  async findAll(filters = {}) {
    try {
      const where = {};
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      if (filters.status) {
        where.status = filters.status;
      }
      return await prisma.momentumSprint.findMany({ where });
    } catch (error) {
      console.error('Error finding sprints:', error);
      return null;
    }
  },

  /**
   * Finds a sprint by its unique ID, including related issues and members.
   * @async
   * @param {string} id - The unique ID of the sprint.
   * @returns {Promise<MomentumSprintWithRelations | null>} The sprint with related data, or null if not found or an error occurred.
   */
  async findById(id) {
    try {
      return await prisma.momentumSprint.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              name: true,
              key: true,
            },
          },
          issues: true,
          members: {
            select: {
              user: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding sprint by ID:', error);
      return null;
    }
  },

  /**
   * Updates an existing sprint.
   * @async
   * @param {string} id - The unique ID of the sprint to update.
   * @param {MomentumSprintUpdateInput} data - The data to update.
   * @returns {Promise<MomentumSprint | null>} The updated sprint, or null if not found or an error occurred.
   */
  async update(id, data) {
    try {
      return await prisma.momentumSprint.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating sprint with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Deletes a sprint by its unique ID.
   * @async
   * @param {string} id - The unique ID of the sprint to delete.
   * @returns {Promise<MomentumSprint | null>} The deleted sprint, or null if not found or an error occurred.
   */
  async delete(id) {
    try {
      return await prisma.momentumSprint.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting sprint with ID ${id}:`, error);
      return null;
    }
  },
};

export default MomentumSprint;