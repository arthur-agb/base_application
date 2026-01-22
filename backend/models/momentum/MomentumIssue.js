// MomentumIssue.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MomentumIssue = {
  /**
   * Creates a new MomentumIssue.
   * @param {object} data - The data for the new MomentumIssue.
   * @param {string} data.projectId - The ID of the project the issue belongs to.
   * @param {string} data.columnId - The ID of the column the issue belongs to.
   * @param {string} data.boardId - The ID of the board the issue belongs to.
   * @param {string} data.reporterUserId - The ID of the user who reported the issue.
   * @param {string} [data.assigneeUserId] - The ID of the user assigned to the issue (optional).
   * @param {string} [data.epicId] - The ID of the epic the issue belongs to (optional).
   * @param {string} [data.sprintId] - The ID of the sprint the issue belongs to (optional).
   * @param {string} [data.parentIssueId] - The ID of the parent issue (optional).
   * @param {string} data.title - The title of the issue.
   * @param {string} [data.description] - The description of the issue (optional).
   * @param {import('@prisma/client').IssueType} data.type - The type of the issue.
   * @param {import('@prisma/client').IssuePriority} data.priority - The priority of the issue.
   * @param {string} data.status - The status of the issue (column name).
   * @param {import('@prisma/client').IssueStatusCategory} [data.category] - The status category of the issue.
   * @param {string[]} [data.labels] - The labels for the issue (optional).
   * @param {number} [data.storyPoints] - The story points for the issue (optional).
   * @param {Date} [data.dueDate] - The due date for the issue (optional).
   * @param {number} [data.position] - The position of the issue within its column (optional).
   * @returns {Promise<import('@prisma/client').MomentumIssue>} The newly created MomentumIssue.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newIssue = await prisma.momentumIssue.create({
        data,
      });
      return newIssue;
    } catch (error) {
      console.error('Error creating MomentumIssue:', error);
      throw new Error(`Failed to create MomentumIssue: ${error.message}`);
    }
  },

  /**
   * Finds all MomentumIssues with optional filtering.
   * @param {object} [filter] - The filter criteria.
   * @param {string} [filter.projectId] - Filter by project ID.
   * @param {string} [filter.assigneeUserId] - Filter by assignee user ID.
   * @returns {Promise<import('@prisma/client').MomentumIssue[]>} A list of MomentumIssues.
   * @throws {Error} If the find operation fails.
   */
  async findAll(filter = {}) {
    try {
      const issues = await prisma.momentumIssue.findMany({
        where: filter,
        include: {
          project: true,
          reporter: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          assignee: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          epic: true,
          sprint: true,
        },
      });
      return issues;
    } catch (error) {
      console.error('Error finding all MomentumIssues:', error);
      throw new Error(`Failed to find MomentumIssues: ${error.message}`);
    }
  },

  /**
   * Finds a single MomentumIssue by its ID.
   * @param {string} id - The unique ID of the issue.
   * @returns {Promise<import('@prisma/client').MomentumIssue|null>} The MomentumIssue or null if not found.
   * @throws {Error} If the find operation fails.
   */
  async findById(id) {
    try {
      const issue = await prisma.momentumIssue.findUnique({
        where: { id },
        include: {
          project: true,
          board: true,
          column: true,
          reporter: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          assignee: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          epic: true,
          sprint: true,
          subTasks: true,
          parentIssue: true,
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
      return issue;
    } catch (error) {
      console.error('Error finding MomentumIssue by ID:', error);
      throw new Error(`Failed to find MomentumIssue by ID: ${error.message}`);
    }
  },

  /**
   * Updates an existing MomentumIssue.
   * @param {string} id - The unique ID of the issue to update.
   * @param {object} data - The data to update the issue with.
   * @returns {Promise<import('@prisma/client').MomentumIssue>} The updated MomentumIssue.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      const updatedIssue = await prisma.momentumIssue.update({
        where: { id },
        data,
      });
      return updatedIssue;
    } catch (error) {
      console.error('Error updating MomentumIssue:', error);
      throw new Error(`Failed to update MomentumIssue: ${error.message}`);
    }
  },

  /**
   * Deletes a MomentumIssue.
   * @param {string} id - The unique ID of the issue to delete.
   * @returns {Promise<import('@prisma/client').MomentumIssue>} The deleted MomentumIssue.
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      const deletedIssue = await prisma.momentumIssue.delete({
        where: { id },
      });
      return deletedIssue;
    } catch (error) {
      console.error('Error deleting MomentumIssue:', error);
      throw new Error(`Failed to delete MomentumIssue: ${error.message}`);
    }
  },
};

export default MomentumIssue;