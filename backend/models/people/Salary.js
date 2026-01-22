// models/Salary.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} Salary
 * @property {string} id - The unique identifier for the salary.
 * @property {string} employeeId - The unique identifier of the associated employee.
 * @property {number} amount - The salary amount.
 * @property {string} currency - The currency of the salary.
 * @property {boolean} isActive - The active status of the salary record.
 * @property {Date} startDate - The start date of the salary.
 * @property {Date} [endDate] - The end date of the salary (optional).
 * @property {Date} createdAt - The creation timestamp.
 * @property {Date} updatedAt - The last update timestamp.
 */

/**
 * @typedef {import('@prisma/client').Prisma.SalaryCreateInput} SalaryCreateInput
 * @typedef {import('@prisma/client').Prisma.SalaryUpdateInput} SalaryUpdateInput
 */

const SalaryModel = {
  /**
   * Creates a new salary record.
   * @param {SalaryCreateInput} data - The data for the new salary record.
   * @returns {Promise<Salary>} The created salary object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newSalary = await prisma.salary.create({
        data,
      });
      return newSalary;
    } catch (error) {
      console.error('Error creating salary:', error);
      throw new Error(`Failed to create salary: ${error.message}`);
    }
  },

  /**
   * Finds a salary record by its unique ID.
   * @param {string} id - The unique ID of the salary to find.
   * @returns {Promise<Salary | null>} The salary object if found, otherwise null.
   * @throws {Error} If the query fails.
   */
  async findById(id) {
    try {
      const salary = await prisma.salary.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              jobTitle: true,
              department: true,
            },
          },
        },
      });
      return salary;
    } catch (error) {
      console.error('Error finding salary by ID:', error);
      throw new Error(`Failed to find salary by ID: ${error.message}`);
    }
  },

  /**
   * Finds all salary records, with optional filtering and pagination.
   * @param {Object} [params] - Optional parameters for filtering.
   * @param {string} [params.employeeId] - Filter by employee ID.
   * @param {boolean} [params.isActive] - Filter by active status.
   * @param {number} [params.take] - The number of records to return.
   * @param {number} [params.skip] - The number of records to skip.
   * @returns {Promise<Salary[]>} An array of salary objects.
   * @throws {Error} If the query fails.
   */
  async findMany({ employeeId, isActive, take, skip } = {}) {
    try {
      const salaries = await prisma.salary.findMany({
        where: {
          employeeId,
          isActive,
        },
        take,
        skip,
        include: {
          employee: {
            select: {
              id: true,
              jobTitle: true,
              department: true,
            },
          },
        },
      });
      return salaries;
    } catch (error) {
      console.error('Error finding many salaries:', error);
      throw new Error(`Failed to find salaries: ${error.message}`);
    }
  },

  /**
   * Updates an existing salary record.
   * @param {string} id - The unique ID of the salary to update.
   * @param {SalaryUpdateInput} data - The data to update the salary with.
   * @returns {Promise<Salary>} The updated salary object.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      const updatedSalary = await prisma.salary.update({
        where: { id },
        data,
      });
      return updatedSalary;
    } catch (error) {
      console.error('Error updating salary:', error);
      throw new Error(`Failed to update salary: ${error.message}`);
    }
  },

  /**
   * Deletes a salary record.
   * @param {string} id - The unique ID of the salary to delete.
   * @returns {Promise<Salary>} The deleted salary object.
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      const deletedSalary = await prisma.salary.delete({
        where: { id },
      });
      return deletedSalary;
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw new Error(`Failed to delete salary: ${error.message}`);
    }
  },
};

export default SalaryModel;