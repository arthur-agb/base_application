// MarketingAnalytic.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MarketingAnalytic = {
  /**
   * Creates a new marketing analytic record.
   * @param {object} data - The data for the new analytic record.
   * @param {string} data.campaignId - The ID of the associated campaign.
   * @param {string} [data.userId] - The ID of the associated user (optional).
   * @param {InteractionType} data.interactionType - The type of interaction (e.g., CLICK, VIEW).
   * @param {Date} data.timestamp - The timestamp of the interaction.
   * @param {object} [data.details] - A JSON object for additional details (optional).
   * @returns {Promise<object>} The newly created marketing analytic object.
   * @throws {Error} If the database operation fails.
   */
  async createAnalytic(data) {
    try {
      const newAnalytic = await prisma.marketingAnalytic.create({
        data,
      });
      return newAnalytic;
    } catch (error) {
      console.error("Error creating marketing analytic:", error);
      throw new Error(`Failed to create marketing analytic: ${error.message}`);
    }
  },

  /**
   * Finds a marketing analytic record by its ID.
   * @param {string} id - The ID of the analytic record to find.
   * @returns {Promise<object|null>} The found marketing analytic object, or null if not found.
   * @throws {Error} If the database operation fails.
   */
  async findAnalyticById(id) {
    try {
      const analytic = await prisma.marketingAnalytic.findUnique({
        where: { id },
        include: {
          campaign: {
            select: { name: true, type: true },
          },
          user: {
            select: { email: true, username: true },
          },
        },
      });
      return analytic;
    } catch (error) {
      console.error("Error finding marketing analytic:", error);
      throw new Error(`Failed to find marketing analytic: ${error.message}`);
    }
  },

  /**
   * Retrieves all marketing analytic records with optional filtering.
   * @param {object} [options] - Optional filtering and pagination options.
   * @param {object} [options.where] - A Prisma `where` object to filter the results.
   * @param {number} [options.skip] - The number of records to skip (for pagination).
   * @param {number} [options.take] - The number of records to take (for pagination).
   * @returns {Promise<Array<object>>} An array of marketing analytic objects.
   * @throws {Error} If the database operation fails.
   */
  async findAllAnalytics(options = {}) {
    try {
      const analytics = await prisma.marketingAnalytic.findMany({
        ...options,
        include: {
          campaign: {
            select: { name: true, type: true },
          },
        },
      });
      return analytics;
    } catch (error) {
      console.error("Error finding all marketing analytics:", error);
      throw new Error(`Failed to retrieve marketing analytics: ${error.message}`);
    }
  },

  /**
   * Updates an existing marketing analytic record.
   * @param {string} id - The ID of the analytic record to update.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated marketing analytic object.
   * @throws {Error} If the analytic record is not found or the database operation fails.
   */
  async updateAnalytic(id, data) {
    try {
      const updatedAnalytic = await prisma.marketingAnalytic.update({
        where: { id },
        data,
      });
      return updatedAnalytic;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Marketing analytic with ID ${id} not found.`);
      }
      console.error("Error updating marketing analytic:", error);
      throw new Error(`Failed to update marketing analytic: ${error.message}`);
    }
  },

  /**
   * Deletes a marketing analytic record by its ID.
   * @param {string} id - The ID of the analytic record to delete.
   * @returns {Promise<object>} The deleted marketing analytic object.
   * @throws {Error} If the analytic record is not found or the database operation fails.
   */
  async deleteAnalytic(id) {
    try {
      const deletedAnalytic = await prisma.marketingAnalytic.delete({
        where: { id },
      });
      return deletedAnalytic;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Marketing analytic with ID ${id} not found.`);
      }
      console.error("Error deleting marketing analytic:", error);
      throw new Error(`Failed to delete marketing analytic: ${error.message}`);
    }
  },
};

export default MarketingAnalytic;