// FinanceSupplier.js

/**
 * @file This file contains an object of asynchronous functions for performing CRUD operations on the FinanceSupplier model using Prisma.
 * @description These functions include robust error handling and are designed for use in a Node.js backend application.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FinanceSupplier = {
  /**
   * Creates a new supplier in the database.
   * @param {object} data - The data for the new supplier.
   * @param {string} data.name - The name of the supplier.
   * @param {string} [data.contactName] - The name of the contact person.
   * @param {string} [data.email] - The email of the supplier. Must be unique if provided.
   * @param {string} [data.phone] - The phone number of the supplier.
   * @param {object} [data.bankDetails] - JSON object containing bank details.
   * @param {boolean} [data.isActive=true] - Whether the supplier is active.
   * @param {Date} data.startDate - The start date of the supplier relationship.
   * @returns {Promise<object>} The newly created supplier object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newSupplier = await prisma.financeSupplier.create({
        data,
      });
      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier.');
    }
  },

  /**
   * Finds a single supplier by its unique ID.
   * @param {string} id - The unique ID of the supplier.
   * @param {boolean} [includeCosts=false] - Whether to include related finance costs.
   * @returns {Promise<object|null>} The supplier object or null if not found.
   * @throws {Error} If the query fails.
   */
  async findById(id, includeCosts = false) {
    try {
      const supplier = await prisma.financeSupplier.findUnique({
        where: { id },
        include: {
          costs: includeCosts,
        },
      });
      return supplier;
    } catch (error) {
      console.error('Error finding supplier by ID:', error);
      throw new Error(`Failed to find supplier with ID: ${id}`);
    }
  },

  /**
   * Finds all suppliers, optionally including their related finance costs.
   * @param {object} [options] - Optional query parameters.
   * @param {boolean} [options.includeCosts=false] - Whether to include related costs.
   * @param {number} [options.limit] - The maximum number of suppliers to return.
   * @returns {Promise<Array<object>>} An array of supplier objects.
   * @throws {Error} If the query fails.
   */
  async findAll(options = {}) {
    try {
      const suppliers = await prisma.financeSupplier.findMany({
        take: options.limit,
        include: {
          costs: options.includeCosts,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return suppliers;
    } catch (error) {
      console.error('Error finding all suppliers:', error);
      throw new Error('Failed to retrieve suppliers.');
    }
  },

  /**
   * Updates an existing supplier.
   * @param {string} id - The unique ID of the supplier to update.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated supplier object.
   * @throws {Error} If the update fails or the supplier is not found.
   */
  async update(id, data) {
    try {
      const updatedSupplier = await prisma.financeSupplier.update({
        where: { id },
        data,
      });
      return updatedSupplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error(`Failed to update supplier with ID: ${id}`);
    }
  },

  /**
   * Deletes a supplier by its unique ID.
   * @param {string} id - The unique ID of the supplier to delete.
   * @returns {Promise<object>} The deleted supplier object.
   * @throws {Error} If the deletion fails or the supplier is not found.
   */
  async remove(id) {
    try {
      const deletedSupplier = await prisma.financeSupplier.delete({
        where: { id },
      });
      return deletedSupplier;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw new Error(`Failed to delete supplier with ID: ${id}`);
    }
  },
};

module.exports = FinanceSupplier;