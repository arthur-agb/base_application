// UserPlan.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * A collection of CRUD (Create, Read, Update, Delete) operations for the UserPlan model.
 *
 * @namespace userPlanModel
 */
export const UserPlan = {
  /**
   * Creates a new user plan in the database.
   *
   * @async
   * @param {object} planData - The data for the new user plan.
   * @param {string} planData.name - The name of the plan.
   * @param {string} planData.currency - The currency of the plan price.
   * @param {number} planData.basePrice - The base price of the plan.
   * @param {'MONTHLY'|'YEARLY'} planData.billingFrequency - How often the plan is billed.
   * @param {Date} planData.startDate - The start date of the plan.
   * @param {string} [planData.description] - An optional description for the plan.
   * @param {boolean} [planData.isActive] - Whether the plan is active. Defaults to true.
   * @param {Date} [planData.endDate] - The end date of the plan.
   * @returns {Promise<object>} The newly created user plan object.
   * @throws {Error} If the database operation fails.
   */
  async create(planData) {
    try {
      const newUserPlan = await prisma.users_user_plans.create({
        data: planData,
      });
      return newUserPlan;
    } catch (error) {
      console.error('Error creating user plan:', error);
      throw new Error(`Failed to create user plan: ${error.message}`);
    }
  },

  /**
   * Finds a user plan by its unique ID.
   *
   * @async
   * @param {string} planId - The unique ID of the user plan.
   * @param {object} [options] - Optional query options.
   * @param {boolean} [options.includeSubscriptions=false] - Whether to include the subscriptions associated with the plan.
   * @returns {Promise<object|null>} The user plan object if found, otherwise null.
   * @throws {Error} If the database operation fails.
   */
  async findById(planId, { includeSubscriptions = false } = {}) {
    try {
      const userPlan = await prisma.users_user_plans.findUnique({
        where: { id: planId },
        include: {
          subscriptions: includeSubscriptions,
        },
      });
      return userPlan;
    } catch (error) {
      console.error('Error finding user plan by ID:', error);
      throw new Error(`Failed to find user plan by ID: ${error.message}`);
    }
  },

  /**
   * Finds all user plans with optional filtering and pagination.
   *
   * @async
   * @param {object} [params] - Optional query parameters.
   * @param {number} [params.skip=0] - The number of records to skip for pagination.
   * @param {number} [params.take=10] - The number of records to take for pagination.
   * @param {object} [params.where] - A filter object to apply to the query.
   * @param {object} [params.select] - A select object to specify which fields to return.
   * @returns {Promise<Array<object>>} An array of user plan objects.
   * @throws {Error} If the database operation fails.
   */
  async findAll(params = {}) {
    try {
      const { skip = 0, take = 10, where = {}, select } = params;
      const userPlans = await prisma.users_user_plans.findMany({
        skip,
        take,
        where,
        select,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return userPlans;
    } catch (error) {
      console.error('Error finding all user plans:', error);
      throw new Error(`Failed to find user plans: ${error.message}`);
    }
  },

  /**
   * Updates an existing user plan by its unique ID.
   *
   * @async
   * @param {string} planId - The unique ID of the user plan to update.
   * @param {object} updateData - The data to update the user plan with.
   * @returns {Promise<object>} The updated user plan object.
   * @throws {Error} If the database operation fails or the plan is not found.
   */
  async update(planId, updateData) {
    try {
      const updatedUserPlan = await prisma.users_user_plans.update({
        where: { id: planId },
        data: updateData,
      });
      return updatedUserPlan;
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw new Error(`Failed to update user plan with ID ${planId}: ${error.message}`);
    }
  },

  /**
   * Deletes a user plan by its unique ID.
   *
   * @async
   * @param {string} planId - The unique ID of the user plan to delete.
   * @returns {Promise<object>} The deleted user plan object.
   * @throws {Error} If the database operation fails or the plan is not found.
   */
  async delete(planId) {
    try {
      const deletedUserPlan = await prisma.users_user_plans.delete({
        where: { id: planId },
      });
      return deletedUserPlan;
    } catch (error) {
      console.error('Error deleting user plan:', error);
      throw new Error(`Failed to delete user plan with ID ${planId}: ${error.message}`);
    }
  },
};