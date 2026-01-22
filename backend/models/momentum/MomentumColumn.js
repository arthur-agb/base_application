// MomentumColumn.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MomentumColumn = {
  /**
   * Creates a new column for a board.
   * @param {object} columnData - The data for the new column.
   * @param {string} columnData.boardId - The ID of the board the column belongs to.
   * @param {string} columnData.name - The name of the column.
   * @param {number} [columnData.limit] - The optional issue limit for the column.
   * @param {number} columnData.position - The position of the column within the board.
   * @returns {Promise<object>} The newly created MomentumColumn object.
   * @throws {Error} If the creation fails.
   */
  create: async (columnData) => {
    try {
      const newColumn = await prisma.momentumColumn.create({
        data: columnData,
      });
      return newColumn;
    } catch (error) {
      console.error('Error creating MomentumColumn:', error);
      throw new Error(`Could not create MomentumColumn: ${error.message}`);
    }
  },

  /**
   * Finds a column by its unique ID.
   * @param {string} columnId - The unique ID of the column.
   * @param {object} [options] - Optional query options.
   * @param {boolean} [options.includeIssues=false] - Whether to include related issues.
   * @returns {Promise<object|null>} The found MomentumColumn object or null if not found.
   * @throws {Error} If the query fails.
   */
  findById: async (columnId, { includeIssues = false } = {}) => {
    try {
      const column = await prisma.momentumColumn.findUnique({
        where: {
          id: columnId,
        },
        include: {
          issues: includeIssues,
        },
      });
      return column;
    } catch (error) {
      console.error('Error finding MomentumColumn by ID:', error);
      throw new Error(`Could not find MomentumColumn: ${error.message}`);
    }
  },

  /**
   * Finds all columns for a given board.
   * @param {string} boardId - The unique ID of the board.
   * @param {object} [options] - Optional query options.
   * @param {boolean} [options.includeIssues=false] - Whether to include related issues.
   * @returns {Promise<Array<object>>} An array of MomentumColumn objects.
   * @throws {Error} If the query fails.
   */
  findByBoardId: async (boardId, { includeIssues = false } = {}) => {
    try {
      const columns = await prisma.momentumColumn.findMany({
        where: {
          boardId: boardId,
        },
        include: {
          issues: includeIssues,
        },
        orderBy: {
          position: 'asc',
        },
      });
      return columns;
    } catch (error) {
      console.error('Error finding MomentumColumns by Board ID:', error);
      throw new Error(`Could not find MomentumColumns: ${error.message}`);
    }
  },

  /**
   * Updates an existing column.
   * @param {string} columnId - The unique ID of the column to update.
   * @param {object} updateData - The data to update the column with.
   * @returns {Promise<object>} The updated MomentumColumn object.
   * @throws {Error} If the update fails.
   */
  update: async (columnId, updateData) => {
    try {
      const updatedColumn = await prisma.momentumColumn.update({
        where: {
          id: columnId,
        },
        data: updateData,
      });
      return updatedColumn;
    } catch (error) {
      console.error('Error updating MomentumColumn:', error);
      throw new Error(`Could not update MomentumColumn: ${error.message}`);
    }
  },

  /**
   * Deletes a column by its unique ID.
   * @param {string} columnId - The unique ID of the column to delete.
   * @returns {Promise<object>} The deleted MomentumColumn object.
   * @throws {Error} If the deletion fails.
   */
  delete: async (columnId) => {
    try {
      const deletedColumn = await prisma.momentumColumn.delete({
        where: {
          id: columnId,
        },
      });
      return deletedColumn;
    } catch (error) {
      console.error('Error deleting MomentumColumn:', error);
      throw new Error(`Could not delete MomentumColumn: ${error.message}`);
    }
  },
};

export default MomentumColumn;