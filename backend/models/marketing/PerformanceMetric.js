// PerformanceMetric.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * An object containing asynchronous functions for managing PerformanceMetric records.
 * @namespace PerformanceMetricModel
 */
export const PerformanceMetric = {
  /**
   * Creates a new performance metric record.
   * @async
   * @function create
   * @param {object} data The data for the new performance metric.
   * @returns {Promise<object>} The newly created performance metric object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newMetric = await prisma.performanceMetric.create({
        data,
      });
      return newMetric;
    } catch (error) {
      console.error('Error creating performance metric:', error);
      throw new Error('Failed to create performance metric.');
    }
  },

  /**
   * Finds all performance metric records, with an option to include the related ad content.
   * @async
   * @function findAll
   * @param {object} [options={}] Optional parameters.
   * @param {boolean} [options.includeAdContent=false] Whether to include the related AdContent.
   * @returns {Promise<Array<object>>} An array of performance metric objects.
   * @throws {Error} If the retrieval fails.
   */
  async findAll({ includeAdContent = false } = {}) {
    try {
      const metrics = await prisma.performanceMetric.findMany({
        include: {
          adContent: includeAdContent,
        },
      });
      return metrics;
    } catch (error) {
      console.error('Error finding all performance metrics:', error);
      throw new Error('Failed to retrieve performance metrics.');
    }
  },

  /**
   * Finds a performance metric by its unique ID.
   * @async
   * @function findById
   * @param {string} id The ID of the performance metric to find.
   * @param {object} [options={}] Optional parameters.
   * @param {boolean} [options.includeAdContent=false] Whether to include the related AdContent.
   * @returns {Promise<object|null>} The performance metric object or null if not found.
   * @throws {Error} If the retrieval fails.
   */
  async findById(id, { includeAdContent = false } = {}) {
    try {
      const metric = await prisma.performanceMetric.findUnique({
        where: { id },
        include: {
          adContent: includeAdContent,
        },
      });
      return metric;
    } catch (error) {
      console.error('Error finding performance metric by ID:', error);
      throw new Error('Failed to retrieve performance metric.');
    }
  },

  /**
   * Updates a performance metric record.
   * @async
   * @function update
   * @param {string} id The ID of the performance metric to update.
   * @param {object} data The data to update.
   * @returns {Promise<object>} The updated performance metric object.
   * @throws {Error} If the update fails or the record is not found.
   */
  async update(id, data) {
    try {
      const updatedMetric = await prisma.performanceMetric.update({
        where: { id },
        data,
      });
      return updatedMetric;
    } catch (error) {
      console.error('Error updating performance metric:', error);
      throw new Error('Failed to update performance metric.');
    }
  },

  /**
   * Deletes a performance metric record by ID.
   * @async
   * @function remove
   * @param {string} id The ID of the performance metric to delete.
   * @returns {Promise<object>} The deleted performance metric object.
   * @throws {Error} If the deletion fails or the record is not found.
   */
  async remove(id) {
    try {
      const deletedMetric = await prisma.performanceMetric.delete({
        where: { id },
      });
      return deletedMetric;
    } catch (error) {
      console.error('Error deleting performance metric:', error);
      throw new Error('Failed to delete performance metric.');
    }
  },
};