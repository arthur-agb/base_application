// Campaign.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * @typedef {Object} CampaignData
 * @property {string} name - The name of the campaign.
 * @property {string} type - The campaign type (e.g., 'EMAIL', 'SOCIAL_MEDIA').
 * @property {number} [budget] - The budget allocated for the campaign.
 * @property {string} status - The current status of the campaign (e.g., 'PLANNING', 'ACTIVE').
 * @property {boolean} [isActive=true] - Whether the campaign is currently active.
 * @property {Date} startDate - The start date of the campaign.
 * @property {Date} [endDate] - The end date of the campaign.
 */

/**
 * @typedef {Object} CampaignUpdateData
 * @property {string} [name] - The name of the campaign.
 * @property {string} [type] - The campaign type (e.g., 'EMAIL', 'SOCIAL_MEDIA').
 * @property {number} [budget] - The budget allocated for the campaign.
 * @property {string} [status] - The current status of the campaign (e.g., 'PLANNING', 'ACTIVE').
 * @property {boolean} [isActive] - Whether the campaign is currently active.
 * @property {Date} [startDate] - The start date of the campaign.
 * @property {Date} [endDate] - The end date of the campaign.
 */

const CampaignModel = {
  /**
   * Creates a new campaign in the database.
   * @async
   * @param {CampaignData} data - The data for the new campaign.
   * @returns {Promise<Object>} The newly created campaign object.
   * @throws {Error} If the database operation fails.
   */
  create: async (data) => {
    try {
      const newCampaign = await prisma.campaign.create({ data });
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  },

  /**
   * Finds a single campaign by its ID.
   * @async
   * @param {string} id - The unique ID of the campaign.
   * @param {Object} [options={}] - Optional parameters for including related data.
   * @param {boolean} [options.includeAnalytics=false] - Whether to include related marketing analytics.
   * @param {boolean} [options.includePaidCampaigns=false] - Whether to include related paid campaigns.
   * @returns {Promise<Object|null>} The campaign object if found, otherwise null.
   * @throws {Error} If the database operation fails.
   */
  findById: async (id, options = {}) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          analytics: options.includeAnalytics,
          paidCampaigns: options.includePaidCampaigns,
        },
      });
      return campaign;
    } catch (error) {
      console.error('Error finding campaign by ID:', error);
      throw new Error(`Failed to find campaign: ${error.message}`);
    }
  },

  /**
   * Finds all campaigns with optional filtering, pagination, and related data.
   * @async
   * @param {Object} [params={}] - Optional parameters for filtering, pagination, and sorting.
   * @param {Object} [params.where={}] - Prisma `where` clause for filtering.
   * @param {number} [params.skip] - Number of records to skip for pagination.
   * @param {number} [params.take] - Number of records to take for pagination.
   * @param {Object} [params.orderBy] - Prisma `orderBy` clause for sorting.
   * @returns {Promise<Object[]>} An array of campaign objects.
   * @throws {Error} If the database operation fails.
   */
  findAll: async (params = {}) => {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          budget: true,
        },
      });
      return campaigns;
    } catch (error) {
      console.error('Error finding all campaigns:', error);
      throw new Error(`Failed to retrieve campaigns: ${error.message}`);
    }
  },

  /**
   * Updates an existing campaign.
   * @async
   * @param {string} id - The unique ID of the campaign to update.
   * @param {CampaignUpdateData} data - The data to update the campaign with.
   * @returns {Promise<Object>} The updated campaign object.
   * @throws {Error} If the campaign is not found or the database operation fails.
   */
  update: async (id, data) => {
    try {
      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data,
      });
      return updatedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  },

  /**
   * Deletes a campaign from the database.
   * @async
   * @param {string} id - The unique ID of the campaign to delete.
   * @returns {Promise<Object>} The deleted campaign object.
   * @throws {Error} If the campaign is not found or the database operation fails.
   */
  delete: async (id) => {
    try {
      const deletedCampaign = await prisma.campaign.delete({
        where: { id },
      });
      return deletedCampaign;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  },
};

export default CampaignModel;