// EmailCampaign.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * An object containing asynchronous functions for common CRUD operations on the EmailCampaign model.
 * @module EmailCampaign
 */
export const EmailCampaign = {
  /**
   * Creates a new email campaign.
   * @param {object} data - The data for the new email campaign.
   * @param {string} data.campaignId - The ID of the related parent campaign.
   * @param {string} data.subject - The subject line of the email.
   * @param {string} data.body - The body content of the email.
   * @param {Date} data.sentAt - The timestamp when the email was sent.
   * @param {any[]} data.recipients - A JSON array of recipients for the email.
   * @returns {Promise<object>} The newly created email campaign object.
   * @throws {Error} If the email campaign creation fails.
   */
  async create(data) {
    try {
      const newEmailCampaign = await prisma.marketing.emailCampaign.create({
        data,
      });
      return newEmailCampaign;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw new Error('Failed to create email campaign.');
    }
  },

  /**
   * Finds a single email campaign by its ID.
   * @param {string} id - The unique ID of the email campaign.
   * @returns {Promise<object|null>} The found email campaign object, or null if not found.
   * @throws {Error} If the database query fails.
   */
  async findOne(id) {
    try {
      const emailCampaign = await prisma.marketing.emailCampaign.findUnique({
        where: { id },
        include: {
          campaign: {
            select: {
              name: true,
              type: true,
              status: true,
            },
          },
        },
      });
      return emailCampaign;
    } catch (error) {
      console.error('Error finding email campaign:', error);
      throw new Error('Failed to find email campaign.');
    }
  },

  /**
   * Finds all email campaigns.
   * @param {object} [options={}] - Optional query options.
   * @param {number} [options.skip] - The number of records to skip.
   * @param {number} [options.take] - The number of records to take.
   * @returns {Promise<object[]>} An array of all email campaigns.
   * @throws {Error} If the database query fails.
   */
  async findAll(options = {}) {
    try {
      const emailCampaigns = await prisma.marketing.emailCampaign.findMany({
        ...options,
        include: {
          campaign: {
            select: {
              name: true,
              type: true,
              status: true,
            },
          },
        },
      });
      return emailCampaigns;
    } catch (error) {
      console.error('Error finding all email campaigns:', error);
      throw new Error('Failed to retrieve email campaigns.');
    }
  },

  /**
   * Updates an existing email campaign.
   * @param {string} id - The ID of the email campaign to update.
   * @param {object} data - The data to update the email campaign with.
   * @returns {Promise<object>} The updated email campaign object.
   * @throws {Error} If the email campaign update fails.
   */
  async update(id, data) {
    try {
      const updatedEmailCampaign = await prisma.marketing.emailCampaign.update({
        where: { id },
        data,
      });
      return updatedEmailCampaign;
    } catch (error) {
      console.error('Error updating email campaign:', error);
      throw new Error('Failed to update email campaign.');
    }
  },

  /**
   * Deletes an email campaign by its ID.
   * @param {string} id - The unique ID of the email campaign to delete.
   * @returns {Promise<object>} The deleted email campaign object.
   * @throws {Error} If the email campaign deletion fails.
   */
  async delete(id) {
    try {
      const deletedEmailCampaign = await prisma.marketing.emailCampaign.delete({
        where: { id },
      });
      return deletedEmailCampaign;
    } catch (error) {
      console.error('Error deleting email campaign:', error);
      throw new Error('Failed to delete email campaign.');
    }
  },
};