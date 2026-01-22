// models/FinanceCost.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} FinanceCost
 * @property {string} id - The unique identifier for the cost.
 * @property {string} costCentre - The cost centre associated with the employee.
 * @property {string | null} description - A description of the cost.
 * @property {number} amount - The amount of the cost.
 * @property {string} currency - The currency of the cost.
 * @property {string} category - The category of the cost.
 * @property {Date} timestamp - The timestamp of the cost.
 * @property {string | null} supplierId - The ID of the supplier.
 * @property {Date} createdAt - The creation date of the record.
 * @property {Date} updatedAt - The last update date of the record.
 */

/**
 * @typedef {Object} FinanceCostWithRelations
 * @property {string} id - The unique identifier for the cost.
 * @property {string} costCentre - The cost centre associated with the employee.
 * @property {string | null} description - A description of the cost.
 * @property {number} amount - The amount of the cost.
 * @property {string} currency - The currency of the cost.
 * @property {string} category - The category of the cost.
 * @property {Date} timestamp - The timestamp of the cost.
 * @property {string | null} supplierId - The ID of the supplier.
 * @property {Date} createdAt - The creation date of the record.
 * @property {Date} updatedAt - The last update date of the record.
 * @property {object} costCentreInfo - The related Employee object.
 * @property {object} supplier - The related FinanceSupplier object.
 */

/**
 * An object containing asynchronous functions for managing FinanceCost records.
 * @namespace
 */
export const FinanceCost = {
  /**
   * Creates a new FinanceCost record.
   * @async
   * @param {object} data - The data for the new FinanceCost.
   * @returns {Promise<FinanceCost|null>} The created FinanceCost object or null if an error occurs.
   */
  async create(data) {
    try {
      const newCost = await prisma.financeCost.create({ data });
      return newCost;
    } catch (error) {
      console.error('Error creating FinanceCost:', error);
      return null;
    }
  },

  /**
   * Finds a FinanceCost record by its unique ID.
   * Includes related `costCentreInfo` (Employee) and `supplier` (FinanceSupplier) data.
   * @async
   * @param {string} id - The unique ID of the FinanceCost.
   * @returns {Promise<FinanceCostWithRelations|null>} The found FinanceCost object with related data, or null if not found or an error occurs.
   */
  async findById(id) {
    try {
      const cost = await prisma.financeCost.findUnique({
        where: { id },
        include: {
          costCentreInfo: true,
          supplier: true,
        },
      });
      return cost;
    } catch (error) {
      console.error(`Error finding FinanceCost with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Retrieves a list of all FinanceCost records.
   * @async
   * @param {object} [options] - Optional query parameters for filtering, sorting, and pagination.
   * @returns {Promise<FinanceCost[]|null>} An array of FinanceCost objects, or null if an error occurs.
   */
  async findAll(options = {}) {
    try {
      const allCosts = await prisma.financeCost.findMany(options);
      return allCosts;
    } catch (error) {
      console.error('Error fetching all FinanceCosts:', error);
      return null;
    }
  },

  /**
   * Updates an existing FinanceCost record.
   * @async
   * @param {string} id - The unique ID of the FinanceCost to update.
   * @param {object} data - The updated data for the FinanceCost.
   * @returns {Promise<FinanceCost|null>} The updated FinanceCost object, or null if not found or an error occurs.
   */
  async update(id, data) {
    try {
      const updatedCost = await prisma.financeCost.update({
        where: { id },
        data,
      });
      return updatedCost;
    } catch (error) {
      console.error(`Error updating FinanceCost with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Deletes a FinanceCost record by its unique ID.
   * @async
   * @param {string} id - The unique ID of the FinanceCost to delete.
   * @returns {Promise<FinanceCost|null>} The deleted FinanceCost object, or null if not found or an error occurs.
   */
  async delete(id) {
    try {
      const deletedCost = await prisma.financeCost.delete({
        where: { id },
      });
      return deletedCost;
    } catch (error) {
      console.error(`Error deleting FinanceCost with ID ${id}:`, error);
      return null;
    }
  },
};