// CompanyAddon.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CompanyAddon = {
  /**
   * Creates a new company addon.
   * @param {object} data The data for the new company addon.
   * @returns {Promise<object>} The newly created company addon object.
   * @throws {Error} If the database operation fails.
   */
  async create(data) {
    try {
      const newAddon = await prisma.companyAddon.create({ data });
      return newAddon;
    } catch (error) {
      console.error("Error creating company addon:", error);
      throw new Error("Failed to create company addon.");
    }
  },

  /**
   * Finds a company addon by its ID.
   * @param {string} addonId The ID of the company addon.
   * @param {object} [options] Optional parameters for including related data.
   * @param {boolean} [options.includePlans=false] Whether to include related plan addons.
   * @returns {Promise<object|null>} The company addon object or null if not found.
   * @throws {Error} If the database operation fails.
   */
  async findById(addonId, { includePlans = false } = {}) {
    try {
      const addon = await prisma.companyAddon.findUnique({
        where: { id: addonId },
        include: {
          planAddons: includePlans,
        },
      });
      return addon;
    } catch (error) {
      console.error("Error finding company addon by ID:", error);
      throw new Error("Failed to find company addon.");
    }
  },

  /**
   * Finds all company addons with optional filtering and selection.
   * @param {object} [params] Optional parameters for filtering, pagination, and data selection.
   * @param {number} [params.skip] The number of records to skip.
   * @param {number} [params.take] The number of records to take.
   * @param {object} [params.where] The filtering conditions.
   * @param {object} [params.select] The fields to select from the model.
   * @returns {Promise<array>} An array of company addon objects.
   * @throws {Error} If the database operation fails.
   */
  async findAll({ skip, take, where, select } = {}) {
    try {
      const addons = await prisma.companyAddon.findMany({
        skip,
        take,
        where,
        select,
      });
      return addons;
    } catch (error) {
      console.error("Error finding all company addons:", error);
      throw new Error("Failed to retrieve company addons.");
    }
  },

  /**
   * Updates an existing company addon.
   * @param {string} addonId The ID of the company addon to update.
   * @param {object} data The updated data for the company addon.
   * @returns {Promise<object>} The updated company addon object.
   * @throws {Error} If the addon is not found or the update fails.
   */
  async update(addonId, data) {
    try {
      const updatedAddon = await prisma.companyAddon.update({
        where: { id: addonId },
        data,
      });
      return updatedAddon;
    } catch (error) {
      console.error("Error updating company addon:", error);
      throw new Error("Failed to update company addon.");
    }
  },

  /**
   * Deletes a company addon by its ID.
   * @param {string} addonId The ID of the company addon to delete.
   * @returns {Promise<object>} The deleted company addon object.
   * @throws {Error} If the addon is not found or the deletion fails.
   */
  async delete(addonId) {
    try {
      const deletedAddon = await prisma.companyAddon.delete({
        where: { id: addonId },
      });
      return deletedAddon;
    } catch (error) {
      console.error("Error deleting company addon:", error);
      throw new Error("Failed to delete company addon.");
    }
  },
};

export default CompanyAddon;