// src/models/UserPlanAddon.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const UserPlanAddon = {
  /**
   * Creates a new UserPlanAddon record.
   *
   * @param {object} data - The data for the UserPlanAddon to be created.
   * @returns {Promise<object>} The newly created UserPlanAddon object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const userPlanAddon = await prisma.users_user_plan_addons.create({
        data,
        select: {
          subscriptionId: true,
          addonId: true,
          isActive: true,
          startDate: true,
          expiresAt: true,
          subscription: {
            select: {
              id: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
          addon: {
            select: {
              name: true,
            },
          },
        },
      });
      return userPlanAddon;
    } catch (error) {
      console.error('Error creating UserPlanAddon:', error);
      throw new Error(`Failed to create UserPlanAddon: ${error.message}`);
    }
  },

  /**
   * Finds a single UserPlanAddon by its composite key (subscriptionId and addonId).
   *
   * @param {string} subscriptionId - The ID of the user subscription.
   * @param {string} addonId - The ID of the addon.
   * @returns {Promise<object|null>} The found UserPlanAddon object or null if not found.
   * @throws {Error} If the find operation fails.
   */
  async findOne(subscriptionId, addonId) {
    try {
      const userPlanAddon = await prisma.users_user_plan_addons.findUnique({
        where: {
          subscriptionId_addonId: {
            subscriptionId,
            addonId,
          },
        },
        include: {
          subscription: true,
          addon: true,
        },
      });
      return userPlanAddon;
    } catch (error) {
      console.error('Error finding UserPlanAddon:', error);
      throw new Error(`Failed to find UserPlanAddon: ${error.message}`);
    }
  },

  /**
   * Finds all UserPlanAddon records, with optional filtering, pagination, and sorting.
   *
   * @param {object} [options={}] - An object containing query options.
   * @param {object} [options.where={}] - Prisma `where` clause for filtering.
   * @param {number} [options.skip] - Number of records to skip for pagination.
   * @param {number} [options.take] - Number of records to take for pagination.
   * @param {object} [options.orderBy] - Prisma `orderBy` clause for sorting.
   * @returns {Promise<object[]>} A list of UserPlanAddon objects.
   * @throws {Error} If the find operation fails.
   */
  async findMany(options = {}) {
    try {
      const userPlanAddons = await prisma.users_user_plan_addons.findMany({
        ...options,
        include: {
          subscription: {
            select: {
              id: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
          addon: {
            select: {
              name: true,
              basePrice: true,
              billingFrequency: true,
            },
          },
        },
      });
      return userPlanAddons;
    } catch (error) {
      console.error('Error finding multiple UserPlanAddons:', error);
      throw new Error(`Failed to find UserPlanAddons: ${error.message}`);
    }
  },

  /**
   * Updates an existing UserPlanAddon record by its composite key.
   *
   * @param {string} subscriptionId - The ID of the user subscription.
   * @param {string} addonId - The ID of the addon.
   * @param {object} data - The data to update the UserPlanAddon with.
   * @returns {Promise<object>} The updated UserPlanAddon object.
   * @throws {Error} If the update fails.
   */
  async update(subscriptionId, addonId, data) {
    try {
      const updatedUserPlanAddon = await prisma.users_user_plan_addons.update({
        where: {
          subscriptionId_addonId: {
            subscriptionId,
            addonId,
          },
        },
        data,
        select: {
          subscriptionId: true,
          addonId: true,
          isActive: true,
          endDate: true,
        },
      });
      return updatedUserPlanAddon;
    } catch (error) {
      console.error('Error updating UserPlanAddon:', error);
      throw new Error(`Failed to update UserPlanAddon: ${error.message}`);
    }
  },

  /**
   * Deletes a UserPlanAddon record by its composite key.
   *
   * @param {string} subscriptionId - The ID of the user subscription.
   * @param {string} addonId - The ID of the addon.
   * @returns {Promise<object>} The deleted UserPlanAddon object.
   * @throws {Error} If the deletion fails.
   */
  async delete(subscriptionId, addonId) {
    try {
      const deletedUserPlanAddon = await prisma.users_user_plan_addons.delete({
        where: {
          subscriptionId_addonId: {
            subscriptionId,
            addonId,
          },
        },
      });
      return deletedUserPlanAddon;
    } catch (error) {
      console.error('Error deleting UserPlanAddon:', error);
      throw new Error(`Failed to delete UserPlanAddon: ${error.message}`);
    }
  },
};

export default UserPlanAddon;