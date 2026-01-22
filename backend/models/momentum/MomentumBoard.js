// MomentumBoard.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    //'query', 'info',
    'warn', 'error'],
  errorFormat: 'pretty',
});

const includeIssueDetails = {
  reporter: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  assignee: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
  epic: { select: { id: true, title: true } },
  sprint: { select: { id: true, title: true } },
  parentIssue: { select: { id: true, title: true, type: true, status: true } },
  subTasks: { select: { id: true, title: true, type: true, status: true, priority: true, assignee: { select: { id: true, avatarUrl: true, displayName: true } } } },
};

/**
 * @typedef {object} MomentumBoard
 * @property {string} id
 * @property {string} projectId
 * @property {string} name
 * @property {string} type
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {object} [project] - The related project object.
 * @property {object[]} [columns] - The related columns on the board.
 */

/**
 * Service for handling MomentumBoard model interactions.
 * @module MomentumBoardService
 */
const MomentumBoardService = {
  /**
   * Creates a new MomentumBoard.
   * @async
   * @param {object} data - The data for the new board.
   * @param {string} data.projectId - The ID of the project the board belongs to.
   * @param {string} data.name - The name of the board.
   * @param {string} data.type - The type of the board (e.g., 'KANBAN', 'SCRUM').
   * @returns {Promise<MomentumBoard|null>} The created board object, or null on error.
   */
  async createBoard(data) {
    try {
      const newBoard = await prisma.momentumBoard.create({
        data,
      });
      return newBoard;
    } catch (error) {
      console.error('Error creating board:', error);
      return null;
    }
  },

  /**
   * Finds a single MomentumBoard by its ID.
   * @async
   * @param {string} boardId - The ID of the board to find.
   * @param {object} [options] - Optional parameters for including related data.
   * @param {boolean} [options.includeProject=false] - Whether to include the related Project.
   * @param {boolean} [options.includeColumns=false] - Whether to include the related Columns.
   * @returns {Promise<MomentumBoard|null>} The found board object, or null if not found or an error occurs.
   */
  async findBoardById(boardId, options = {}) {
    const { includeProject = false, includeColumns = false } = options;
    try {
      const board = await prisma.momentumBoard.findUnique({
        where: { id: boardId },
        include: {
          project: includeProject,
          columns: includeColumns,
        },
      });
      return board;
    } catch (error) {
      console.error('Error finding board by ID:', error);
      return null;
    }
  },



  /**
  * Finds a single MomentumBoard by its ID, with options to include related data.
  * This is the new, recommended method for getting a complete board view.
  * @async
  * @param {string} boardId - The ID of the board to find.
  * @returns {Promise<object|null>} The found board object with project, columns, and detailed issues, or null if not found.
  */
  async findBoardByIdWithDetails(boardId) {
    try {
      const board = await prisma.momentumBoard.findUnique({
        where: { id: boardId },
        include: {
          project: true, // Include the parent project details
          columns: {
            orderBy: { position: 'asc' },
            include: {
              issues: {
                orderBy: { position: 'asc' },
                include: includeIssueDetails, // Deeply include issue details
              },
            },
          },
        },
      });
      return board;
    } catch (error) {
      console.error('Error finding board by ID with details:', error);
      return null;
    }
  },

  /**
   * Finds all MomentumBoards for a given project.
   * @async
   * @param {string} projectId - The ID of the project to find boards for.
   * @returns {Promise<MomentumBoard[]|null>} An array of board objects, or null on error.
   */
  async findBoardsByProjectId(projectId) {
    try {
      const boards = await prisma.momentumBoard.findMany({
        where: { projectId },
        include: {
          columns: true, // Example of including related data by default for a common use case
          project: {
            select: {
              name: true,
              key: true,
            },
          },
        },
      });
      return boards;
    } catch (error) {
      console.error('Error finding boards by project ID:', error);
      return null;
    }
  },

  /**
   * Updates an existing MomentumBoard.
   * @async
   * @param {string} boardId - The ID of the board to update.
   * @param {object} data - The data to update the board with.
   * @returns {Promise<MomentumBoard|null>} The updated board object, or null on error.
   */
  async updateBoard(boardId, data) {
    try {
      const updatedBoard = await prisma.momentumBoard.update({
        where: { id: boardId },
        data,
      });
      return updatedBoard;
    } catch (error) {
      console.error('Error updating board:', error);
      return null;
    }
  },

  /**
   * Deletes a MomentumBoard.
   * @async
   * @param {string} boardId - The ID of the board to delete.
   * @returns {Promise<MomentumBoard|null>} The deleted board object, or null on error.
   */
  async deleteBoard(boardId) {
    try {
      const deletedBoard = await prisma.momentumBoard.delete({
        where: { id: boardId },
      });
      return deletedBoard;
    } catch (error) {
      console.error('Error deleting board:', error);
      return null;
    }
  },
};

export default MomentumBoardService;