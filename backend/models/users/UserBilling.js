// UserBilling.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * @typedef {import('@prisma/client').UserBilling} UserBilling
 * @typedef {import('@prisma/client').Prisma.UserBillingCreateInput} UserBillingCreateInput
 * @typedef {import('@prisma/client').Prisma.UserBillingUpdateInput} UserBillingUpdateInput
 * @typedef {import('@prisma/client').Prisma.UserBillingWhereUniqueInput} UserBillingWhereUniqueInput
 * @typedef {import('@prisma/client').Prisma.UserBillingWhereInput} UserBillingWhereInput
 * @typedef {import('@prisma/client').Prisma.UserBillingInclude} UserBillingInclude
 */

/**
 * An object containing asynchronous functions for common CRUD operations
 * on the UserBilling model.
 */
const UserBilling = {
  /**
   * Creates a new user billing record.
   * @async
   * @param {UserBillingCreateInput} data - The data for the new user billing record.
   * @returns {Promise<UserBilling>} The newly created user billing record.
   * @throws {Error} If the creation fails.
   */
  async create(data) {
    try {
      const newUserBilling = await prisma.userBilling.create({ data });
      return newUserBilling;
    } catch (error) {
      console.error('Error creating user billing:', error);
      throw new Error(`Failed to create user billing: ${error.message}`);
    }
  },

  /**
   * Finds a user billing record by its unique identifier.
   * @async
   * @param {UserBillingWhereUniqueInput} where - The unique identifier to find the record.
   * @param {UserBillingInclude} [include] - Optional relations to include in the query result.
   * @returns {Promise<UserBilling | null>} The found user billing record or null if not found.
   * @throws {Error} If the query fails.
   */
  async findUnique(where, include) {
    try {
      const userBilling = await prisma.userBilling.findUnique({
        where,
        include: include || { user: true, invoice: true },
      });
      return userBilling;
    } catch (error) {
      console.error('Error finding unique user billing:', error);
      throw new Error(`Failed to find user billing: ${error.message}`);
    }
  },

  /**
   * Finds all user billing records that match a specific filter.
   * @async
   * @param {UserBillingWhereInput} [where] - Optional filters to apply.
   * @param {UserBillingInclude} [include] - Optional relations to include in the query result.
   * @returns {Promise<UserBilling[]>} An array of user billing records.
   * @throws {Error} If the query fails.
   */
  async findMany(where = {}, include) {
    try {
      const userBillings = await prisma.userBilling.findMany({
        where,
        include: include || {
          user: { select: { id: true, username: true, email: true } },
          invoice: { select: { id: true, invoiceNumber: true, amount: true } },
        },
      });
      return userBillings;
    } catch (error) {
      console.error('Error finding many user billings:', error);
      throw new Error(`Failed to find user billings: ${error.message}`);
    }
  },

  /**
   * Updates a user billing record.
   * @async
   * @param {UserBillingWhereUniqueInput} where - The unique identifier of the record to update.
   * @param {UserBillingUpdateInput} data - The data to update the record with.
   * @returns {Promise<UserBilling>} The updated user billing record.
   * @throws {Error} If the update fails.
   */
  async update(where, data) {
    try {
      const updatedUserBilling = await prisma.userBilling.update({
        where,
        data,
      });
      return updatedUserBilling;
    } catch (error) {
      console.error('Error updating user billing:', error);
      throw new Error(`Failed to update user billing: ${error.message}`);
    }
  },

  /**
   * Deletes a user billing record.
   * @async
   * @param {UserBillingWhereUniqueInput} where - The unique identifier of the record to delete.
   * @returns {Promise<UserBilling>} The deleted user billing record.
   * @throws {Error} If the deletion fails.
   */
  async remove(where) {
    try {
      const deletedUserBilling = await prisma.userBilling.delete({ where });
      return deletedUserBilling;
    } catch (error) {
      console.error('Error deleting user billing:', error);
      throw new Error(`Failed to delete user billing: ${error.message}`);
    }
  },
};

export default UserBilling;