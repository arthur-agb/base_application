// CompanySetting.js
import prisma from './prismaClient.js';

const CompanySetting = {
  /**
   * Retrieves all company settings.
   *
   * @param {object} [options] - Optional parameters for the query.
   * @param {object} [options.where] - Filters to apply to the query.
   * @param {object} [options.include] - Relations to include in the query result.
   * @param {object} [options.select] - Fields to select in the query result.
   * @returns {Promise<Array<Object>|null>} A promise that resolves to an array of company settings or null on error.
   */
  findAll: async ({ where = {}, include = {}, select = {} } = {}) => {
    try {
      return await prisma.companySetting.findMany({ where, include, select });
    } catch (error) {
      console.error('Error fetching company settings:', error);
      return null;
    }
  },

  /**
   * Finds a single company setting by its ID.
   *
   * @param {string} settingId - The unique identifier of the company setting.
   * @param {object} [options] - Optional parameters for the query.
   * @param {object} [options.include] - Relations to include in the query result.
   * @param {object} [options.select] - Fields to select in the query result.
   * @returns {Promise<Object|null>} A promise that resolves to the company setting object or null if not found or an error occurs.
   */
  findById: async (settingId, { include = {}, select = {} } = {}) => {
    try {
      const setting = await prisma.companySetting.findUnique({
        where: { settingId },
        include: {
          company: true, // Example of including a related model
          ...include,
        },
        select: {
          settingName: true, // Example of selecting specific fields
          settingValue: true,
          company: {
            select: {
              name: true,
            },
          },
          ...select,
        },
      });
      return setting;
    } catch (error) {
      console.error('Error finding company setting by ID:', error);
      return null;
    }
  },

  /**
   * Creates a new company setting.
   *
   * @param {object} data - The data for the new company setting.
   * @param {string} data.companyId - The ID of the company the setting belongs to.
   * @param {string} data.settingName - The name of the setting.
   * @param {string} data.settingValue - The value of the setting.
   * @returns {Promise<Object|null>} A promise that resolves to the newly created company setting object or null on error.
   */
  create: async (data) => {
    try {
      const newSetting = await prisma.companySetting.create({ data });
      return newSetting;
    } catch (error) {
      console.error('Error creating company setting:', error);
      return null;
    }
  },

  /**
   * Updates an existing company setting.
   *
   * @param {string} settingId - The unique identifier of the company setting to update.
   * @param {object} data - The data to update the company setting with.
   * @returns {Promise<Object|null>} A promise that resolves to the updated company setting object or null on error.
   */
  update: async (settingId, data) => {
    try {
      const updatedSetting = await prisma.companySetting.update({
        where: { settingId },
        data,
      });
      return updatedSetting;
    } catch (error) {
      console.error('Error updating company setting:', error);
      return null;
    }
  },

  /**
   * Deletes a company setting.
   *
   * @param {string} settingId - The unique identifier of the company setting to delete.
   * @returns {Promise<Object|null>} A promise that resolves to the deleted company setting object or null on error.
   */
  remove: async (settingId) => {
    try {
      const deletedSetting = await prisma.companySetting.delete({
        where: { settingId },
      });
      return deletedSetting;
    } catch (error) {
      console.error('Error deleting company setting:', error);
      return null;
    }
  },
};

export default CompanySetting;