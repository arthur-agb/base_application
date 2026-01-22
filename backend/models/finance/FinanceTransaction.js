// FinanceTransaction.js

import prisma from './prismaClient.js';

/**
 * @typedef {Object} FinanceTransactionCreateInput
 * @property {string} invoiceId - The ID of the related invoice.
 * @property {string} transactionType - The type of the transaction (e.g., 'PAYMENT', 'REFUND').
 * @property {number} amount - The transaction amount.
 * @property {string} currency - The currency of the transaction.
 * @property {Date} timestamp - The date and time of the transaction.
 */

/**
 * @typedef {Object} FinanceTransactionUpdateInput
 * @property {string} [invoiceId] - Optional new ID of the related invoice.
 * @property {string} [transactionType] - Optional new transaction type.
 * @property {number} [amount] - Optional new transaction amount.
 * @property {string} [currency] - Optional new currency.
 * @property {Date} [timestamp] - Optional new timestamp.
 */

/**
 * @typedef {Object} FinanceTransaction
 * @property {string} id - The unique ID of the transaction.
 * @property {string} invoiceId - The ID of the related invoice.
 * @property {string} transactionType - The type of the transaction.
 * @property {number} amount - The transaction amount.
 * @property {string} currency - The currency of the transaction.
 * @property {Date} timestamp - The date and time of the transaction.
 * @property {Date} createdAt - The creation date of the record.
 * @property {Date} updatedAt - The last update date of the record.
 */

/**
 * An object containing CRUD operations for the FinanceTransaction model.
 * @namespace
 */
export const FinanceTransaction = {
  /**
   * Creates a new financial transaction.
   * @param {FinanceTransactionCreateInput} data - The data for the new transaction.
   * @returns {Promise<FinanceTransaction>} The newly created transaction object.
   */
  async create(data) {
    try {
      const newTransaction = await prisma.financeTransaction.create({
        data,
      });
      return newTransaction;
    } catch (error) {
      console.error('Error creating finance transaction:', error);
      throw new Error(`Failed to create finance transaction: ${error.message}`);
    }
  },

  /**
   * Finds a single transaction by its unique ID.
   * @param {string} id - The unique ID of the transaction.
   * @param {Object} [options] - Optional Prisma query options.
   * @param {Object} [options.include] - Relations to include in the query result.
   * @param {Object} [options.select] - Fields to select in the query result.
   * @returns {Promise<FinanceTransaction|null>} The transaction object or null if not found.
   */
  async findUnique(id, options = {}) {
    try {
      const transaction = await prisma.financeTransaction.findUnique({
        where: { id },
        ...options,
        include: {
          invoice: true,
          ...options.include,
        },
      });
      return transaction;
    } catch (error) {
      console.error('Error finding finance transaction:', error);
      throw new Error(`Failed to find finance transaction: ${error.message}`);
    }
  },

  /**
   * Retrieves all transactions, optionally filtered and paginated.
   * @param {Object} [params] - Optional parameters for filtering, sorting, and pagination.
   * @param {Object} [params.where] - Prisma `where` clause for filtering.
   * @param {number} [params.skip] - Number of records to skip for pagination.
   * @param {number} [params.take] - Number of records to take for pagination.
   * @param {Object} [params.orderBy] - Prisma `orderBy` clause for sorting.
   * @returns {Promise<FinanceTransaction[]>} An array of transaction objects.
   */
  async findMany(params = {}) {
    try {
      const transactions = await prisma.financeTransaction.findMany({
        ...params,
      });
      return transactions;
    } catch (error) {
      console.error('Error finding multiple finance transactions:', error);
      throw new Error(`Failed to retrieve finance transactions: ${error.message}`);
    }
  },

  /**
   * Updates an existing financial transaction by its ID.
   * @param {string} id - The unique ID of the transaction to update.
   * @param {FinanceTransactionUpdateInput} data - The data to update the transaction with.
   * @returns {Promise<FinanceTransaction>} The updated transaction object.
   */
  async update(id, data) {
    try {
      const updatedTransaction = await prisma.financeTransaction.update({
        where: { id },
        data,
      });
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating finance transaction:', error);
      throw new Error(`Failed to update finance transaction: ${error.message}`);
    }
  },

  /**
   * Deletes a financial transaction by its ID.
   * @param {string} id - The unique ID of the transaction to delete.
   * @returns {Promise<FinanceTransaction>} The deleted transaction object.
   */
  async remove(id) {
    try {
      const deletedTransaction = await prisma.financeTransaction.delete({
        where: { id },
      });
      return deletedTransaction;
    } catch (error) {
      console.error('Error deleting finance transaction:', error);
      throw new Error(`Failed to delete finance transaction: ${error.message}`);
    }
  },
};