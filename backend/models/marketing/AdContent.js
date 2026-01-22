// AdContent.js
import {
    PrismaClient
  } from '../node_modules/.prisma/client';
  
  const prisma = new PrismaClient();
  const adContentModel = prisma.adContent;
  
  const AdContent = {
    /**
     * Creates a new ad content record.
     * @param {object} adContentData - The data for the new ad content.
     * @param {string} adContentData.adSetId - The ID of the ad set this content belongs to.
     * @param {string} adContentData.creativeType - The creative type of the ad (e.g., 'IMAGE', 'VIDEO').
     * @param {string} adContentData.headline - The headline for the ad.
     * @param {string} adContentData.bodyText - The body text for the ad.
     * @param {string} adContentData.destinationUrl - The URL the ad links to.
     * @param {string} adContentData.status - The current status of the ad (e.g., 'ACTIVE', 'PAUSED').
     * @param {string} [adContentData.imageUrl] - The URL of the image for the ad.
     * @returns {Promise<object>} The newly created ad content record.
     * @throws {Error} Throws an error if the creation fails.
     */
    async create(adContentData) {
      try {
        const newAdContent = await adContentModel.create({
          data: adContentData,
        });
        return newAdContent;
      } catch (error) {
        console.error('Error creating ad content:', error);
        throw new Error('Failed to create ad content.');
      }
    },
  
    /**
     * Finds a single ad content record by its unique ID.
     * @param {string} id - The unique ID of the ad content.
     * @returns {Promise<object|null>} The ad content record if found, otherwise null.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findById(id) {
      try {
        const adContent = await adContentModel.findUnique({
          where: {
            id
          },
          include: {
            adSet: {
              select: {
                name: true,
                bidStrategy: true,
                paidCampaign: {
                  select: {
                    campaign: {
                      select: {
                        name: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
            performance: true,
          },
        });
        return adContent;
      } catch (error) {
        console.error('Error finding ad content by ID:', error);
        throw new Error('Failed to find ad content.');
      }
    },
  
    /**
     * Finds all ad content records, with optional filtering and pagination.
     * @param {object} [options] - An object containing query options.
     * @param {string} [options.adSetId] - Filter by a specific ad set ID.
     * @param {string} [options.status] - Filter by ad status.
     * @param {number} [options.skip] - The number of records to skip for pagination.
     * @param {number} [options.take] - The number of records to take for pagination.
     * @returns {Promise<object[]>} An array of ad content records.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findAll(options = {}) {
      const {
        adSetId,
        status,
        skip,
        take
      } = options;
      const where = {};
      if (adSetId) where.adSetId = adSetId;
      if (status) where.status = status;
  
      try {
        const adContents = await adContentModel.findMany({
          where,
          skip,
          take,
          include: {
            adSet: true
          },
        });
        return adContents;
      } catch (error) {
        console.error('Error finding all ad content records:', error);
        throw new Error('Failed to retrieve ad content records.');
      }
    },
  
    /**
     * Updates an existing ad content record.
     * @param {string} id - The unique ID of the ad content to update.
     * @param {object} updateData - The data to update the ad content with.
     * @returns {Promise<object>} The updated ad content record.
     * @throws {Error} Throws an error if the update fails.
     */
    async update(id, updateData) {
      try {
        const updatedAdContent = await adContentModel.update({
          where: {
            id
          },
          data: updateData,
        });
        return updatedAdContent;
      } catch (error) {
        console.error('Error updating ad content:', error);
        throw new Error('Failed to update ad content.');
      }
    },
  
    /**
     * Deletes an ad content record by its unique ID.
     * @param {string} id - The unique ID of the ad content to delete.
     * @returns {Promise<object>} The deleted ad content record.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async remove(id) {
      try {
        const deletedAdContent = await adContentModel.delete({
          where: {
            id
          },
        });
        return deletedAdContent;
      } catch (error) {
        console.error('Error deleting ad content:', error);
        throw new Error('Failed to delete ad content.');
      }
    },
  };
  
  export default AdContent;