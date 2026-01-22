// CompanySubscription.js

import prisma from './prismaClient.js';

/**
 * @typedef {Object} CompanySubscription
 * @property {string} id - The unique identifier for the subscription.
 * @property {string} companyId - The ID of the company.
 * @property {string} planId - The ID of the company plan.
 * @property {Date} startDate - The start date of the subscription.
 * @property {Date | null} endDate - The end date of the subscription, if applicable.
 * @property {import('@prisma/client').SubscriptionStatus} status - The status of the subscription.
 * @property {Date} createdAt - The timestamp when the record was created.
 * @property {Date} updatedAt - The timestamp when the record was last updated.
 */

const CompanySubscriptionModel = {
  /**
   * Creates a new company subscription record.
   * @async
   * @param {Object} data - The data for the new subscription.
   * @param {string} data.companyId - The ID of the company.
   * @param {string} data.planId - The ID of the plan.
   * @param {import('@prisma/client').SubscriptionStatus} data.status - The subscription status.
   * @param {Date} data.startDate - The subscription start date.
   * @param {Date | null} [data.endDate] - Optional end date.
   * @returns {Promise<CompanySubscription | null>} The newly created company subscription, or null if an error occurred.
   */
  async create(data) {
    try {
      return await prisma.companySubscription.create({
        data,
      });
    } catch (error) {
      console.error('Error creating company subscription:', error);
      return null;
    }
  },

  /**
   * Retrieves a single company subscription by its ID.
   * @async
   * @param {string} id - The ID of the subscription to retrieve.
   * @returns {Promise<CompanySubscription | null>} The found company subscription, or null if not found or an error occurred.
   */
  async findById(id) {
    try {
      return await prisma.companySubscription.findUnique({
        where: { id },
        include: {
          company: {
            select: { name: true, slug: true },
          },
          plan: {
            select: { name: true, basePrice: true, billingFrequency: true },
          },
        },
      });
    } catch (error) {
      console.error('Error finding company subscription by ID:', error);
      return null;
    }
  },

  /**
   * Finds all subscriptions for a specific company.
   * @async
   * @param {string} companyId - The ID of the company.
   * @returns {Promise<CompanySubscription[] | null>} An array of subscriptions, or null if an error occurred.
   */
  async findAllByCompanyId(companyId) {
    try {
      return await prisma.companySubscription.findMany({
        where: { companyId },
        include: {
          plan: {
            select: { name: true, basePrice: true },
          },
          addons: {
            include: {
              addon: {
                select: { name: true, basePrice: true },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding subscriptions by company ID:', error);
      return null;
    }
  },

  /**
   * Updates an existing company subscription.
   * @async
   * @param {string} id - The ID of the subscription to update.
   * @param {Object} data - The data to update.
   * @returns {Promise<CompanySubscription | null>} The updated subscription, or null if not found or an error occurred.
   */
  async update(id, data) {
    try {
      return await prisma.companySubscription.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating company subscription:', error);
      return null;
    }
  },

  /**
   * Deletes a company subscription by its ID.
   * @async
   * @param {string} id - The ID of the subscription to delete.
   * @returns {Promise<CompanySubscription | null>} The deleted subscription, or null if not found or an error occurred.
   */
  async remove(id) {
    try {
      return await prisma.companySubscription.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting company subscription:', error);
      return null;
    }
  },
};

export default CompanySubscriptionModel;