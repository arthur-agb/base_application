// EmployeePersonal.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} EmployeePersonal
 * @property {string} id - The unique identifier for the personal details.
 * @property {string} employeeId - The ID of the associated employee.
 * @property {string} firstName - The employee's first name.
 * @property {string} lastName - The employee's last name.
 * @property {string|null} preferredName - The employee's preferred name.
 * @property {Date} dateOfBirth - The employee's date of birth.
 * @property {string|null} personalPhone - The employee's personal phone number.
 * @property {string|null} personalEmail - The employee's personal email address.
 * @property {string|null} workPhone - The employee's work phone number.
 * @property {string} workEmail - The employee's work email address.
 * @property {string} addressLine1 - The first line of the employee's address.
 * @property {string|null} addressLine2 - The second line of the employee's address.
 * @property {string} city - The city of the employee's address.
 * @property {string} postcode - The postcode of the employee's address.
 * @property {string} country - The country of the employee's address.
 * @property {string|null} niNumber - The employee's National Insurance number.
 * @property {string|null} emergencyContactName - The name of the emergency contact.
 * @property {string|null} emergencyContactNumber - The number of the emergency contact.
 * @property {Date} startDate - The start date of the employee's personal details record.
 * @property {Date|null} endDate - The end date of the employee's personal details record.
 * @property {Date} createdAt - The date the record was created.
 * @property {Date} updatedAt - The date the record was last updated.
 * @property {Employee} [employee] - The associated Employee model (included in some queries).
 */

/**
 * An object containing functions for CRUD operations on the EmployeePersonal model.
 * @module EmployeePersonal
 */
export const EmployeePersonal = {
  /**
   * Creates a new employee personal details record.
   * @async
   * @param {Object} data - The data for the new employee personal details.
   * @returns {Promise<EmployeePersonal>} The newly created employee personal details object.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      return await prisma.people.employeePersonal.create({
        data,
      });
    } catch (error) {
      console.error('Error creating employee personal details:', error);
      throw new Error(`Failed to create employee personal details: ${error.message}`);
    }
  },

  /**
   * Finds an employee personal details record by its ID.
   * @async
   * @param {string} id - The unique ID of the personal details record.
   * @returns {Promise<EmployeePersonal|null>} The found employee personal details object or null if not found.
   * @throws {Error} If the find operation fails.
   */
  async findById(id) {
    try {
      return await prisma.people.employeePersonal.findUnique({
        where: { id },
        include: {
          employee: true, // Include the related Employee model
        },
      });
    } catch (error) {
      console.error('Error finding employee personal details by ID:', error);
      throw new Error(`Failed to find employee personal details by ID: ${error.message}`);
    }
  },

  /**
   * Finds all employee personal details records with optional pagination.
   * @async
   * @param {Object} [options] - Options for the query.
   * @param {number} [options.skip=0] - The number of records to skip.
   * @param {number} [options.take=10] - The number of records to return.
   * @returns {Promise<EmployeePersonal[]>} An array of employee personal details objects.
   * @throws {Error} If the find operation fails.
   */
  async findAll(options = { skip: 0, take: 10 }) {
    try {
      return await prisma.people.employeePersonal.findMany({
        skip: options.skip,
        take: options.take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          employee: {
            select: {
              jobTitle: true,
              department: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding all employee personal details:', error);
      throw new Error(`Failed to find all employee personal details: ${error.message}`);
    }
  },

  /**
   * Updates an existing employee personal details record.
   * @async
   * @param {string} id - The ID of the personal details record to update.
   * @param {Object} data - The data to update the record with.
   * @returns {Promise<EmployeePersonal>} The updated employee personal details object.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      return await prisma.people.employeePersonal.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating employee personal details:', error);
      throw new Error(`Failed to update employee personal details: ${error.message}`);
    }
  },

  /**
   * Deletes an employee personal details record by its ID.
   * @async
   * @param {string} id - The ID of the personal details record to delete.
   * @returns {Promise<EmployeePersonal>} The deleted employee personal details object.
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      return await prisma.people.employeePersonal.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting employee personal details:', error);
      throw new Error(`Failed to delete employee personal details: ${error.message}`);
    }
  },
};