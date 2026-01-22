// AdSet.js

import prisma from './prismaClient.js';

/**
 * @description AdSet model for performing CRUD operations on the `AdSet` table.
 * @exports {object} AdSet
 */
export default {
  /**
   * @description Creates a new AdSet.
   * @param {object} data - The data for the new AdSet.
   * @returns {Promise<object|null>} The newly created AdSet or null on error.
   */
  createAdSet: async (data) => {
    try {
      const adSet = await prisma.adSet.create({ data });
      return adSet;
    } catch (error) {
      console.error('Error creating AdSet:', error);
      throw new Error(`Failed to create AdSet: ${error.message}`);
    }
  },

  /**
   * @description Finds an AdSet by its unique ID.
   * @param {string} adSetId - The unique ID of the AdSet.
   * @returns {Promise<object|null>} The found AdSet with its paid campaign and related ad content, or null if not found.
   */
  findAdSetById: async (adSetId) => {
    try {
      const adSet = await prisma.adSet.findUnique({
        where: { id: adSetId },
        include: {
          paidCampaign: true,
          adContents: {
            select: {
              id: true,
              headline: true,
              creativeType: true,
            },
          },
        },
      });
      return adSet;
    } catch (error) {
      console.error('Error finding AdSet by ID:', error);
      throw new Error(`Failed to find AdSet: ${error.message}`);
    }
  },

  /**
   * @description Finds all AdSets, optionally filtered by a paid campaign ID.
   * @param {string|null} paidCampaignId - The ID of the paid campaign to filter by.
   * @returns {Promise<Array<object>>} An array of AdSets.
   */
  findAllAdSets: async (paidCampaignId = null) => {
    try {
      const whereClause = paidCampaignId ? { paidCampaignId } : {};
      const adSets = await prisma.adSet.findMany({
        where: whereClause,
      });
      return adSets;
    } catch (error) {
      console.error('Error finding all AdSets:', error);
      throw new Error(`Failed to find all AdSets: ${error.message}`);
    }
  },

  /**
   * @description Updates an existing AdSet.
   * @param {string} adSetId - The unique ID of the AdSet to update.
   * @param {object} data - The data to update the AdSet with.
   * @returns {Promise<object|null>} The updated AdSet or null if not found.
   */
  updateAdSet: async (adSetId, data) => {
    try {
      const adSet = await prisma.adSet.update({
        where: { id: adSetId },
        data,
      });
      return adSet;
    } catch (error) {
      console.error('Error updating AdSet:', error);
      throw new Error(`Failed to update AdSet: ${error.message}`);
    }
  },

  /**
   * @description Deletes an AdSet by its unique ID.
   * @param {string} adSetId - The unique ID of the AdSet to delete.
   * @returns {Promise<object|null>} The deleted AdSet or null if not found.
   */
  deleteAdSet: async (adSetId) => {
    try {
      const adSet = await prisma.adSet.delete({
        where: { id: adSetId },
      });
      return adSet;
    } catch (error) {
      console.error('Error deleting AdSet:', error);
      throw new Error(`Failed to delete AdSet: ${error.message}`);
    }
  },
};