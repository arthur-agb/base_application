// EmployeePayment.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} EmployeePaymentData
 * @property {string} employeeId - The unique identifier of the employee.
 * @property {string} bankName - The name of the bank.
 * @property {string} accountName - The name on the bank account.
 * @property {string} sortCode - The bank's sort code.
 * @property {string} accountNumber - The bank account number.
 * @property {boolean} [isActive=true] - Whether the payment information is currently active.
 */

/**
 * @typedef {Object} EmployeePaymentUpdateData
 * @property {string} [bankName] - The updated name of the bank.
 * @property {string} [accountName] - The updated name on the bank account.
 * @property {string} [sortCode] - The updated bank's sort code.
 * @property {string} [accountNumber] - The updated bank account number.
 * @property {boolean} [isActive] - The updated status of the payment information.
 * @property {Date} [endDate] - The date the payment information became inactive.
 */

/**
 * @typedef {import('@prisma/client').EmployeePayment} EmployeePayment
 * @typedef {import('@prisma/client').Prisma.EmployeePaymentFindManyArgs} EmployeePaymentFindManyArgs
 * @typedef {import('@prisma/client').Prisma.EmployeePaymentFindFirstArgs} EmployeePaymentFindFirstArgs
 */

/**
 * Service for interacting with the EmployeePayment model in the database.
 * @module EmployeePayment
 */
export const EmployeePayment = {
  /**
   * Creates a new employee payment record.
   * @async
   * @param {EmployeePaymentData} data - The data for the new employee payment record.
   * @returns {Promise<EmployeePayment>} The newly created employee payment record.
   * @throws {Error} If the database operation fails.
   */
  async create(data) {
    try {
      const newPayment = await prisma.employeePayment.create({
        data: {
          employee: { connect: { id: data.employeeId } },
          bankName: data.bankName,
          accountName: data.accountName,
          sortCode: data.sortCode,
          accountNumber: data.accountNumber,
          isActive: data.isActive,
        },
      });
      return newPayment;
    } catch (error) {
      console.error('Error creating employee payment:', error);
      throw new Error(`Failed to create employee payment: ${error.message}`);
    }
  },

  /**
   * Finds all employee payment records.
   * @async
   * @param {EmployeePaymentFindManyArgs} [query] - Optional query for filtering, ordering, and pagination.
   * @returns {Promise<EmployeePayment[]>} An array of employee payment records.
   * @throws {Error} If the database operation fails.
   */
  async findAll(query = {}) {
    try {
      const payments = await prisma.employeePayment.findMany({
        ...query,
        include: {
          employee: {
            select: {
              jobTitle: true,
              department: true,
              costCentre: true,
              personalDetails: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
      return payments;
    } catch (error) {
      console.error('Error finding all employee payments:', error);
      throw new Error(`Failed to find all employee payments: ${error.message}`);
    }
  },

  /**
   * Finds a single employee payment record by its ID.
   * @async
   * @param {string} paymentId - The unique identifier of the payment record.
   * @param {EmployeePaymentFindFirstArgs['include']} [include] - Optional fields to include from related models.
   * @returns {Promise<EmployeePayment | null>} The employee payment record, or null if not found.
   * @throws {Error} If the database operation fails.
   */
  async findById(paymentId, include) {
    try {
      const payment = await prisma.employeePayment.findUnique({
        where: { id: paymentId },
        include: {
          ...include,
          employee: {
            select: {
              jobTitle: true,
              department: true,
              costCentre: true,
              personalDetails: {
                select: {
                  firstName: true,
                  lastName: true,
                  personalEmail: true,
                },
              },
            },
          },
        },
      });
      return payment;
    } catch (error) {
      console.error('Error finding employee payment by ID:', error);
      throw new Error(`Failed to find employee payment: ${error.message}`);
    }
  },

  /**
   * Updates an existing employee payment record.
   * @async
   * @param {string} paymentId - The unique identifier of the payment record to update.
   * @param {EmployeePaymentUpdateData} data - The data to update the record with.
   * @returns {Promise<EmployeePayment>} The updated employee payment record.
   * @throws {Error} If the record is not found or the update fails.
   */
  async update(paymentId, data) {
    try {
      const updatedPayment = await prisma.employeePayment.update({
        where: { id: paymentId },
        data,
      });
      return updatedPayment;
    } catch (error) {
      console.error('Error updating employee payment:', error);
      throw new Error(`Failed to update employee payment: ${error.message}`);
    }
  },

  /**
   * Deletes an employee payment record by its ID.
   * @async
   * @param {string} paymentId - The unique identifier of the payment record to delete.
   * @returns {Promise<EmployeePayment>} The deleted employee payment record.
   * @throws {Error} If the record is not found or the deletion fails.
   */
  async remove(paymentId) {
    try {
      const deletedPayment = await prisma.employeePayment.delete({
        where: { id: paymentId },
      });
      return deletedPayment;
    } catch (error) {
      console.error('Error deleting employee payment:', error);
      throw new Error(`Failed to delete employee payment: ${error.message}`);
    }
  },
};