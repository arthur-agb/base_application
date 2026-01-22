// MomentumEpic.js

/**
 * @file This file contains an object of asynchronous functions for performing
 * CRUD (Create, Read, Update, Delete) operations on the MomentumEpic model
 * using Prisma. It is designed to be a reusable model script for a Node.js
 * backend application.
 */

const { PrismaClient } = require('@prisma/client/momentum');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * An object containing CRUD functions for the MomentumEpic model.
 * @namespace
 */
const MomentumEpic = {
  /**
   * Creates a new epic.
   * @async
   * @param {object} epicData The data for the new epic.
   * @param {string} epicData.projectId The ID of the project the epic belongs to.
   * @param {string} epicData.title The title of the epic.
   * @param {string} [epicData.description] The optional description of the epic.
   * @param {string} [epicData.ownerUserId] The optional ID of the user who owns the epic.
   * @param {'OPEN' | 'IN_PROGRESS' | 'DONE'} [epicData.status='OPEN'] The initial status of the epic.
   * @param {Date} [epicData.startDate] The optional start date of the epic.
   * @param {Date} [epicData.endDate] The optional end date of the epic.
   * @returns {Promise<object>} The newly created epic object.
   * @throws {Error} If the creation fails.
   */
  create: async (epicData) => {
    try {
      const newEpic = await prisma.momentumEpic.create({
        data: epicData,
      });
      return newEpic;
    } catch (error) {
      console.error('Error creating epic:', error);
      throw new Error(`Could not create epic: ${error.message}`);
    }
  },

  /**
   * Finds a single epic by its ID, optionally including its related project and owner.
   * @async
   * @param {string} epicId The ID of the epic to find.
   * @param {object} [options={}] Additional options for the query.
   * @param {boolean} [options.includeProject=false] A flag to include the related Project.
   * @param {boolean} [options.includeOwner=false] A flag to include the related Owner.
   * @returns {Promise<object|null>} The epic object if found, otherwise null.
   * @throws {Error} If the query fails.
   */
  findById: async (epicId, options = {}) => {
    try {
      const epic = await prisma.momentumEpic.findUnique({
        where: { id: epicId },
        include: {
          project: options.includeProject,
          owner: options.includeOwner,
        },
      });
      return epic;
    } catch (error) {
      console.error('Error finding epic by ID:', error);
      throw new Error(`Could not find epic with ID ${epicId}: ${error.message}`);
    }
  },

  /**
   * Finds all epics, with optional filtering, sorting, and pagination.
   * @async
   * @param {object} [params={}] The query parameters.
   * @param {object} [params.where] The Prisma `where` object for filtering.
   * @param {object} [params.orderBy] The Prisma `orderBy` object for sorting.
   * @param {number} [params.skip] The number of records to skip for pagination.
   * @param {number} [params.take] The number of records to take for pagination.
   * @returns {Promise<Array<object>>} A list of epic objects.
   * @throws {Error} If the query fails.
   */
  findAll: async (params = {}) => {
    try {
      const epics = await prisma.momentumEpic.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        // Using `select` to demonstrate how to limit returned fields
        select: {
          id: true,
          title: true,
          status: true,
          project: {
            select: {
              name: true,
              key: true,
            },
          },
          owner: {
            select: {
              displayName: true,
              email: true,
            },
          },
        },
      });
      return epics;
    } catch (error) {
      console.error('Error finding all epics:', error);
      throw new Error(`Could not find epics: ${error.message}`);
    }
  },

  /**
   * Updates an existing epic.
   * @async
   * @param {string} epicId The ID of the epic to update.
   * @param {object} updateData The data to update the epic with.
   * @returns {Promise<object>} The updated epic object.
   * @throws {Error} If the update fails.
   */
  update: async (epicId, updateData) => {
    try {
      const updatedEpic = await prisma.momentumEpic.update({
        where: { id: epicId },
        data: updateData,
      });
      return updatedEpic;
    } catch (error) {
      console.error('Error updating epic:', error);
      throw new Error(`Could not update epic with ID ${epicId}: ${error.message}`);
    }
  },

  /**
   * Deletes an epic by its ID.
   * @async
   * @param {string} epicId The ID of the epic to delete.
   * @returns {Promise<object>} The deleted epic object.
   * @throws {Error} If the deletion fails.
   */
  remove: async (epicId) => {
    try {
      const deletedEpic = await prisma.momentumEpic.delete({
        where: { id: epicId },
      });
      return deletedEpic;
    } catch (error) {
      console.error('Error deleting epic:', error);
      throw new Error(`Could not delete epic with ID ${epicId}: ${error.message}`);
    }
  },
};

module.exports = MomentumEpic;