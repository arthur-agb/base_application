// PaidCampaign.js

import prisma from './prismaClient.js';

/**
 * @typedef {Object} PaidCampaign
 * @property {string} id - The unique identifier for the paid campaign.
 * @property {string} campaignId - The ID of the parent campaign.
 * @property {string} platform - The advertising platform (e.g., 'GOOGLE_ADS').
 * @property {number} budget - The total budget for the paid campaign.
 * @property {number | null} dailyBudget - The optional daily budget.
 * @property {object | null} details - Additional JSON details.
 * @property {boolean} isActive - Whether the campaign is currently active.
 * @property {Date} startDate - The start date of the campaign.
 * @property {Date | null} endDate - The optional end date of the campaign.
 * @property {Date} createdAt - The creation timestamp.
 * @property {Date} updatedAt - The last update timestamp.
 */

/**
 * The paidCampaignModel object provides a set of asynchronous functions to perform
 * CRUD operations on the PaidCampaign model using Prisma.
 * @namespace paidCampaignModel
 */
const paidCampaignModel = {
  /**
   * Creates a new paid campaign.
   *
   * @param {Object} data - The data for the new paid campaign.
   * @param {string} data.campaignId - The ID of the parent campaign.
   * @param {string} data.platform - The advertising platform.
   * @param {number} data.budget - The campaign budget.
   * @param {number} [data.dailyBudget] - The optional daily budget.
   * @param {object} [data.details] - Optional JSON details.
   * @param {boolean} [data.isActive=true] - Optional active status.
   * @param {Date} data.startDate - The campaign start date.
   * @param {Date} [data.endDate] - The optional end date.
   * @returns {Promise<PaidCampaign>} The created paid campaign object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newPaidCampaign = await prisma.paidCampaign.create({ data });
      return newPaidCampaign;
    } catch (error) {
      console.error("Error creating paid campaign:", error);
      throw new Error(`Failed to create paid campaign: ${error.message}`);
    }
  },

  /**
   * Finds all paid campaigns.
   *
   * @param {Object} [params={}] - Optional query parameters.
   * @param {boolean} [params.includeAdSets=false] - Whether to include related ad sets.
   * @returns {Promise<PaidCampaign[]>} An array of paid campaign objects.
   * @throws {Error} If the query fails.
   */
  async findAll({ includeAdSets = false } = {}) {
    try {
      return await prisma.paidCampaign.findMany({
        include: {
          adSets: includeAdSets,
        },
      });
    } catch (error) {
      console.error("Error finding paid campaigns:", error);
      throw new Error(`Failed to find paid campaigns: ${error.message}`);
    }
  },

  /**
   * Finds a paid campaign by its unique ID.
   *
   * @param {string} id - The unique ID of the paid campaign.
   * @param {Object} [params={}] - Optional query parameters.
   * @param {boolean} [params.includeAdSets=false] - Whether to include related ad sets.
   * @param {boolean} [params.includeCampaign=false] - Whether to include the parent campaign.
   * @param {Object} [params.select] - Prisma select object to specify fields.
   * @returns {Promise<PaidCampaign | null>} The paid campaign object or null if not found.
   * @throws {Error} If the query fails.
   */
  async findById(id, { includeAdSets = false, includeCampaign = false, select } = {}) {
    try {
      const paidCampaign = await prisma.paidCampaign.findUnique({
        where: { id },
        select,
        include: {
          adSets: includeAdSets,
          campaign: includeCampaign,
        },
      });
      return paidCampaign;
    } catch (error) {
      console.error(`Error finding paid campaign with ID ${id}:`, error);
      throw new Error(`Failed to find paid campaign by ID: ${error.message}`);
    }
  },

  /**
   * Updates an existing paid campaign.
   *
   * @param {string} id - The unique ID of the paid campaign to update.
   * @param {Object} data - The data to update.
   * @returns {Promise<PaidCampaign>} The updated paid campaign object.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      const updatedPaidCampaign = await prisma.paidCampaign.update({
        where: { id },
        data,
      });
      return updatedPaidCampaign;
    } catch (error) {
      console.error(`Error updating paid campaign with ID ${id}:`, error);
      throw new Error(`Failed to update paid campaign: ${error.message}`);
    }
  },

  /**
   * Deletes a paid campaign by its unique ID.
   *
   * @param {string} id - The unique ID of the paid campaign to delete.
   * @returns {Promise<PaidCampaign>} The deleted paid campaign object.
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      const deletedPaidCampaign = await prisma.paidCampaign.delete({
        where: { id },
      });
      return deletedPaidCampaign;
    } catch (error) {
      console.error(`Error deleting paid campaign with ID ${id}:`, error);
      throw new Error(`Failed to delete paid campaign: ${error.message}`);
    }
  },
};

export default paidCampaignModel;