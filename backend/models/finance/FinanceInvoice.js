// FinanceInvoice.js

import prisma from './prismaClient.js';

/**
 * @typedef {Object} FinanceInvoice
 * @property {string} id
 * @property {'USER' | 'COMPANY'} billingType
 * @property {string} billingId
 * @property {string} invoiceNumber
 * @property {number} amount
 * @property {number} vatAmount
 * @property {string} currency
 * @property {Date} issueDate
 * @property {Date} dueDate
 * @property {'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID'} status
 * @property {boolean} isActive
 * @property {Date} [endedAt]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Array<Object>} transactions - Related FinanceTransaction records
 * @property {Array<Object>} userBillings - Related UserBilling records
 * @property {Array<Object>} companyBillings - Related CompanyBilling records
 */

/**
 * @typedef {Object} FinanceInvoiceCreateInput
 * @property {'USER' | 'COMPANY'} billingType
 * @property {string} billingId
 * @property {string} invoiceNumber
 * @property {number} amount
 * @property {number} vatAmount
 * @property {string} currency
 * @property {Date} issueDate
 * @property {Date} dueDate
 * @property {'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID'} status
 */

/**
 * @typedef {Object} FinanceInvoiceUpdateInput
 * @property {'USER' | 'COMPANY'} [billingType]
 * @property {string} [billingId]
 * @property {string} [invoiceNumber]
 * @property {number} [amount]
 * @property {number} [vatAmount]
 * @property {string} [currency]
 * @property {Date} [issueDate]
 * @property {Date} [dueDate]
 * @property {'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID'} [status]
 * @property {boolean} [isActive]
 * @property {Date} [endedAt]
 */

const FinanceInvoice = {
  /**
   * Creates a new FinanceInvoice record.
   * @param {FinanceInvoiceCreateInput} data - The data for the new invoice.
   * @returns {Promise<FinanceInvoice>} The newly created FinanceInvoice object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const invoice = await prisma.financeInvoice.create({ data });
      return invoice;
    } catch (error) {
      console.error('Error creating FinanceInvoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  },

  /**
   * Finds a FinanceInvoice by its ID.
   * Includes related transactions.
   * @param {string} id - The unique ID of the invoice.
   * @param {boolean} [includeRelations=false] - Whether to include related records.
   * @returns {Promise<FinanceInvoice | null>} The FinanceInvoice object or null if not found.
   * @throws {Error} If the query fails.
   */
  async findById(id, includeRelations = false) {
    try {
      const invoice = await prisma.financeInvoice.findUnique({
        where: { id },
        include: includeRelations ? { transactions: true, userBillings: true, companyBillings: true } : undefined,
      });
      return invoice;
    } catch (error) {
      console.error('Error finding FinanceInvoice by ID:', error);
      throw new Error(`Failed to find invoice by ID: ${error.message}`);
    }
  },

  /**
   * Finds a FinanceInvoice by its invoice number.
   * Demonstrates a basic select clause.
   * @param {string} invoiceNumber - The unique invoice number.
   * @returns {Promise<Pick<FinanceInvoice, 'id' | 'invoiceNumber' | 'amount' | 'status'> | null>} A partial invoice object or null if not found.
   * @throws {Error} If the query fails.
   */
  async findByInvoiceNumber(invoiceNumber) {
    try {
      const invoice = await prisma.financeInvoice.findUnique({
        where: { invoiceNumber },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
        },
      });
      return invoice;
    } catch (error) {
      console.error('Error finding FinanceInvoice by number:', error);
      throw new Error(`Failed to find invoice by number: ${error.message}`);
    }
  },

  /**
   * Updates a FinanceInvoice record by its ID.
   * @param {string} id - The unique ID of the invoice to update.
   * @param {FinanceInvoiceUpdateInput} data - The data to update the invoice with.
   * @returns {Promise<FinanceInvoice>} The updated FinanceInvoice object.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      const invoice = await prisma.financeInvoice.update({
        where: { id },
        data,
      });
      return invoice;
    } catch (error) {
      console.error('Error updating FinanceInvoice:', error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }
  },

  /**
   * Deletes a FinanceInvoice record by its ID.
   * @param {string} id - The unique ID of the invoice to delete.
   * @returns {Promise<FinanceInvoice>} The deleted FinanceInvoice object.
   * @throws {Error} If the deletion fails.
   */
  async remove(id) {
    try {
      const invoice = await prisma.financeInvoice.delete({ where: { id } });
      return invoice;
    } catch (error) {
      console.error('Error deleting FinanceInvoice:', error);
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  },
};

export default FinanceInvoice;