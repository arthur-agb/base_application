// File: CompanyBilling.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CompanyBilling = {
  /**
   * Creates a new company billing record.
   * @param {object} data The data for the new billing record.
   * @param {string} data.companyId The ID of the company.
   * @param {string} data.invoiceId The ID of the associated finance invoice.
   * @param {number} data.amountDue The amount due for the billing.
   * @param {number} data.amountPaid The amount already paid.
   * @param {string} data.currency The currency of the transaction.
   * @param {string} data.dueDate The due date of the invoice.
   * @param {string} [data.paymentDate] The payment date of the invoice.
   * @param {string} data.status The status of the invoice (e.g., 'PAID', 'OVERDUE').
   * @returns {Promise<object>} The newly created company billing record.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newBilling = await prisma.companies.companyBilling.create({
        data,
      });
      return newBilling;
    } catch (error) {
      console.error('Error creating company billing:', error);
      throw new Error('Failed to create company billing.');
    }
  },

  /**
   * Finds a company billing record by its unique ID.
   * @param {string} billingId The ID of the billing record to find.
   * @returns {Promise<object|null>} The company billing record or null if not found.
   * @throws {Error} If the database query fails.
   */
  async findById(billingId) {
    try {
      const billing = await prisma.companies.companyBilling.findUnique({
        where: { billingId },
        include: {
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
          invoice: {
            select: {
              invoiceNumber: true,
              amount: true,
              issueDate: true,
            },
          },
        },
      });
      return billing;
    } catch (error) {
      console.error('Error finding company billing by ID:', error);
      throw new Error('Failed to retrieve company billing.');
    }
  },

  /**
   * Finds all company billing records, with optional pagination.
   * @param {number} [skip] The number of records to skip for pagination.
   * @param {number} [take] The number of records to take for pagination.
   * @returns {Promise<object[]>} An array of company billing records.
   * @throws {Error} If the database query fails.
   */
  async findAll({ skip, take } = {}) {
    try {
      const billings = await prisma.companies.companyBilling.findMany({
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return billings;
    } catch (error) {
      console.error('Error finding all company billings:', error);
      throw new Error('Failed to retrieve company billings.');
    }
  },

  /**
   * Updates an existing company billing record.
   * @param {string} billingId The ID of the billing record to update.
   * @param {object} data The data to update.
   * @returns {Promise<object>} The updated company billing record.
   * @throws {Error} If the record is not found or the update fails.
   */
  async update(billingId, data) {
    try {
      const updatedBilling = await prisma.companies.companyBilling.update({
        where: { billingId },
        data,
      });
      return updatedBilling;
    } catch (error) {
      console.error('Error updating company billing:', error);
      throw new Error('Failed to update company billing.');
    }
  },

  /**
   * Deletes a company billing record.
   * @param {string} billingId The ID of the billing record to delete.
   * @returns {Promise<object>} The deleted company billing record.
   * @throws {Error} If the record is not found or the deletion fails.
   */
  async delete(billingId) {
    try {
      const deletedBilling = await prisma.companies.companyBilling.delete({
        where: { billingId },
      });
      return deletedBilling;
    } catch (error) {
      console.error('Error deleting company billing:', error);
      throw new Error('Failed to delete company billing.');
    }
  },
};

export default CompanyBilling;