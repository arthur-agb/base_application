// src/models/UserSubscription.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} UserSubscription
 * @property {string} id - The unique ID of the user subscription.
 * @property {string} userId - The ID of the user.
 * @property {string} planId - The ID of the user plan.
 * @property {'ACTIVE'|'CANCELLED'|'TRIALING'|'PAST_DUE'} status - The status of the subscription.
 * @property {Date} startDate - The start date of the subscription.
 * @property {Date} [endDate] - The end date of the subscription.
 * @property {Date} createdAt - The creation timestamp.
 * @property {Date} updatedAt - The last update timestamp.
 */

/**
 * @typedef {Object} UserSubscriptionWithRelations
 * @property {string} id
 * @property {string} userId
 * @property {string} planId
 * @property {'ACTIVE'|'CANCELLED'|'TRIALING'|'PAST_DUE'} status
 * @property {Date} startDate
 * @property {Date} [endDate]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Object} user - The related user object.
 * @property {Object} plan - The related user plan object.
 */

/**
 * @typedef {Object} CreateUserSubscriptionInput
 * @property {string} userId - The ID of the user.
 * @property {string} planId - The ID of the user plan.
 * @property {'ACTIVE'|'CANCELLED'|'TRIALING'|'PAST_DUE'} status - The status of the subscription.
 * @property {Date} startDate - The start date of the subscription.
 * @property {Date} [endDate] - The end date of the subscription.
 */

/**
 * @typedef {Object} UpdateUserSubscriptionInput
 * @property {string} [userId] - The ID of the user.
 * @property {string} [planId] - The ID of the user plan.
 * @property {'ACTIVE'|'CANCELLED'|'TRIALING'|'PAST_DUE'} [status] - The status of the subscription.
 * @property {Date} [startDate] - The start date of the subscription.
 * @property {Date} [endDate] - The end date of the subscription.
 */

const UserSubscription = {
  /**
   * Creates a new user subscription.
   * @param {CreateUserSubscriptionInput} data - The data for the new subscription.
   * @returns {Promise<UserSubscription|null>} The created user subscription or null on error.
   */
  async create(data) {
    try {
      const newSubscription = await prisma.userSubscription.create({
        data,
      });
      return newSubscription;
    } catch (error) {
      console.error('Error creating user subscription:', error);
      return null;
    }
  },

  /**
   * Finds a user subscription by its unique ID.
   * @param {string} id - The ID of the subscription to find.
   * @returns {Promise<UserSubscriptionWithRelations|null>} The found subscription with related user and plan data, or null if not found or an error occurs.
   */
  async findById(id) {
    try {
      const subscription = await prisma.userSubscription.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, email: true, displayName: true },
          },
          plan: {
            select: { id: true, name: true, basePrice: true },
          },
        },
      });
      return subscription;
    } catch (error) {
      console.error(`Error finding user subscription with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Finds all user subscriptions, optionally filtered by user ID.
   * @param {string} [userId] - Optional ID of the user to filter subscriptions by.
   * @returns {Promise<UserSubscription[]|null>} An array of user subscriptions, or null on error.
   */
  async findAll(userId = null) {
    try {
      const whereClause = userId ? { userId } : {};
      const subscriptions = await prisma.userSubscription.findMany({
        where: whereClause,
      });
      return subscriptions;
    } catch (error) {
      console.error('Error finding all user subscriptions:', error);
      return null;
    }
  },

  /**
   * Updates a user subscription by its ID.
   * @param {string} id - The ID of the subscription to update.
   * @param {UpdateUserSubscriptionInput} data - The data to update the subscription with.
   * @returns {Promise<UserSubscription|null>} The updated user subscription or null on error.
   */
  async update(id, data) {
    try {
      const updatedSubscription = await prisma.userSubscription.update({
        where: { id },
        data,
      });
      return updatedSubscription;
    } catch (error) {
      console.error(`Error updating user subscription with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Deletes a user subscription by its ID.
   * @param {string} id - The ID of the subscription to delete.
   * @returns {Promise<UserSubscription|null>} The deleted user subscription or null on error.
   */
  async delete(id) {
    try {
      const deletedSubscription = await prisma.userSubscription.delete({
        where: { id },
      });
      return deletedSubscription;
    } catch (error) {
      console.error(`Error deleting user subscription with ID ${id}:`, error);
      return null;
    }
  },
};

export default UserSubscription;