// UserAddon.js
import {
    PrismaClient
  } from '@prisma/client';
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  /**
   * @typedef {object} UserAddonData
   * @property {string} name - The name of the addon.
   * @property {string} [description] - A description of the addon.
   * @property {number} basePrice - The base price of the addon.
   * @property {string} currency - The currency for the price.
   * @property {'MONTHLY'|'YEARLY'} billingFrequency - The billing frequency of the addon.
   * @property {boolean} [isActive=true] - Whether the addon is active.
   * @property {Date} startDate - The date the addon became available.
   * @property {Date} [endDate] - The date the addon is no longer available.
   */
  
  /**
   * @typedef {object} UserPlanAddonData
   * @property {string} addonId - The ID of the user addon.
   * @property {boolean} [isActive=true] - Whether the plan addon is active.
   * @property {Date} startDate - The start date of the plan addon.
   * @property {Date} [endDate] - The end date of the plan addon.
   * @property {Date} [expiresAt] - The expiration date of the plan addon.
   */
  
  const UserAddon = {
    /**
     * Creates a new user addon.
     * @param {UserAddonData} data - The data for the new addon.
     * @returns {Promise<object>} The newly created addon object.
     * @throws {Error} If the Prisma operation fails.
     */
    async create(data) {
      try {
        const newUserAddon = await prisma.userAddon.create({
          data,
        });
        return newUserAddon;
      } catch (error) {
        console.error('Error creating user addon:', error);
        throw new Error(`Could not create user addon: ${error.message}`);
      }
    },
  
    /**
     * Finds a single user addon by its ID, including related plan addons if specified.
     * @param {string} id - The unique identifier of the user addon.
     * @param {object} [options] - Options for the query.
     * @param {boolean} [options.includePlanAddons=false] - Whether to include related plan addons.
     * @returns {Promise<object|null>} The found addon object or null if not found.
     * @throws {Error} If the Prisma operation fails.
     */
    async findById(id, {
      includePlanAddons = false
    } = {}) {
      try {
        const addon = await prisma.userAddon.findUnique({
          where: {
            id
          },
          include: {
            planAddons: includePlanAddons,
          },
        });
        return addon;
      } catch (error) {
        console.error('Error finding user addon by ID:', error);
        throw new Error(`Could not find user addon: ${error.message}`);
      }
    },
  
    /**
     * Finds all user addons, with optional filtering and selection.
     * @param {object} [options] - Options for the query.
     * @param {string} [options.name] - Filter by addon name.
     * @param {boolean} [options.isActive] - Filter by active status.
     * @param {object} [options.select] - Prisma select object to return specific fields.
     * @returns {Promise<Array<object>>} An array of user addon objects.
     * @throws {Error} If the Prisma operation fails.
     */
    async findAll({
      name,
      isActive,
      select
    } = {}) {
      try {
        const where = {};
        if (name) where.name = {
          contains: name,
          mode: 'insensitive'
        };
        if (isActive !== undefined) where.isActive = isActive;
  
        const addons = await prisma.userAddon.findMany({
          where,
          select,
        });
        return addons;
      } catch (error) {
        console.error('Error finding all user addons:', error);
        throw new Error(`Could not retrieve user addons: ${error.message}`);
      }
    },
  
    /**
     * Updates a user addon by its ID.
     * @param {string} id - The unique identifier of the addon to update.
     * @param {Partial<UserAddonData>} data - The data to update.
     * @returns {Promise<object>} The updated addon object.
     * @throws {Error} If the addon is not found or the Prisma operation fails.
     */
    async update(id, data) {
      try {
        const updatedAddon = await prisma.userAddon.update({
          where: {
            id
          },
          data,
        });
        return updatedAddon;
      } catch (error) {
        console.error('Error updating user addon:', error);
        throw new Error(`Could not update user addon: ${error.message}`);
      }
    },
  
    /**
     * Deletes a user addon by its ID.
     * @param {string} id - The unique identifier of the addon to delete.
     * @returns {Promise<object>} The deleted addon object.
     * @throws {Error} If the addon is not found or the Prisma operation fails.
     */
    async delete(id) {
      try {
        const deletedAddon = await prisma.userAddon.delete({
          where: {
            id
          },
        });
        return deletedAddon;
      } catch (error) {
        console.error('Error deleting user addon:', error);
        throw new Error(`Could not delete user addon: ${error.message}`);
      }
    },
  };
  
  export default UserAddon;