// CompanyPlanAddon.js
import {
    PrismaClient
  } from '../node_modules/.prisma/client';
  
  const prisma = new PrismaClient();
  const companyPlanAddonModel = prisma.companyPlanAddon;
  
  const CompanyPlanAddon = {
    /**
     * Creates a new CompanyPlanAddon record.
     * This is a join table, so a primary key is not auto-generated. The composite key is used for creation.
     * @param {object} addonData - The data for the new CompanyPlanAddon record.
     * @param {string} addonData.subscriptionId - The ID of the company subscription.
     * @param {string} addonData.addonId - The ID of the company addon.
     * @param {boolean} [addonData.isActive=true] - Whether the addon is active for the subscription.
     * @param {Date} addonData.startDate - The start date for the addon.
     * @param {Date} [addonData.endDate] - The end date for the addon.
     * @param {Date} [addonData.expiresAt] - The expiration date for the addon.
     * @returns {Promise<object>} The newly created CompanyPlanAddon record.
     * @throws {Error} Throws an error if the creation fails.
     */
    async create(addonData) {
      try {
        const newAddon = await companyPlanAddonModel.create({
          data: addonData,
        });
        return newAddon;
      } catch (error) {
        console.error('Error creating company plan addon record:', error);
        throw new Error('Failed to create company plan addon record.');
      }
    },
  
    /**
     * Finds a single CompanyPlanAddon record by its composite key.
     * @param {string} subscriptionId - The ID of the company subscription.
     * @param {string} addonId - The ID of the company addon.
     * @returns {Promise<object|null>} The CompanyPlanAddon record if found, otherwise null.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findByKeys(subscriptionId, addonId) {
      try {
        const addon = await companyPlanAddonModel.findUnique({
          where: {
            subscriptionId_addonId: {
              subscriptionId,
              addonId,
            },
          },
          include: {
            subscription: {
              select: {
                status: true,
                company: {
                  select: {
                    name: true
                  }
                },
              },
            },
            addon: {
              select: {
                name: true,
                description: true,
                basePrice: true,
              },
            },
          },
        });
        return addon;
      } catch (error) {
        console.error('Error finding company plan addon by keys:', error);
        throw new Error('Failed to find company plan addon record.');
      }
    },
  
    /**
     * Finds all addons for a specific company subscription.
     * @param {string} subscriptionId - The ID of the company subscription.
     * @param {object} [options] - Optional query options for pagination.
     * @param {number} [options.skip] - The number of records to skip.
     * @param {number} [options.take] - The number of records to take.
     * @returns {Promise<object[]>} An array of CompanyPlanAddon records.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findBySubscriptionId(subscriptionId, options = {}) {
      const {
        skip,
        take
      } = options;
      try {
        const addons = await companyPlanAddonModel.findMany({
          where: {
            subscriptionId
          },
          skip,
          take,
          include: {
            addon: true
          },
        });
        return addons;
      } catch (error) {
        console.error('Error finding addons by subscription ID:', error);
        throw new Error('Failed to retrieve company plan addon records.');
      }
    },
  
    /**
     * Updates an existing CompanyPlanAddon record.
     * @param {string} subscriptionId - The ID of the company subscription.
     * @param {string} addonId - The ID of the company addon.
     * @param {object} updateData - The data to update the record with.
     * @returns {Promise<object>} The updated CompanyPlanAddon record.
     * @throws {Error} Throws an error if the update fails.
     */
    async update(subscriptionId, addonId, updateData) {
      try {
        const updatedAddon = await companyPlanAddonModel.update({
          where: {
            subscriptionId_addonId: {
              subscriptionId,
              addonId,
            },
          },
          data: updateData,
        });
        return updatedAddon;
      } catch (error) {
        console.error('Error updating company plan addon:', error);
        throw new Error('Failed to update company plan addon.');
      }
    },
  
    /**
     * Deletes a CompanyPlanAddon record by its composite key.
     * @param {string} subscriptionId - The ID of the company subscription.
     * @param {string} addonId - The ID of the company addon.
     * @returns {Promise<object>} The deleted CompanyPlanAddon record.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async remove(subscriptionId, addonId) {
      try {
        const deletedAddon = await companyPlanAddonModel.delete({
          where: {
            subscriptionId_addonId: {
              subscriptionId,
              addonId,
            },
          },
        });
        return deletedAddon;
      } catch (error) {
        console.error('Error deleting company plan addon:', error);
        throw new Error('Failed to delete company plan addon.');
      }
    },
  };
  
  export default CompanyPlanAddon;