// UserActivity.js
import {
    PrismaClient
  } from '../node_modules/.prisma/client';
  
  const prisma = new PrismaClient();
  const userActivityModel = prisma.userActivity;
  
  const UserActivity = {
    /**
     * Creates a new user activity record.
     * @param {object} activityData - The data for the new activity record.
     * @param {string} activityData.userId - The ID of the user performing the action.
     * @param {string} activityData.action - A description of the action (e.g., 'LOGIN', 'CREATED_DOCUMENT').
     * @param {object} [activityData.details] - Optional JSON data with additional details about the action.
     * @returns {Promise<object>} The newly created user activity record.
     * @throws {Error} Throws an error if the creation fails.
     */
    async create(activityData) {
      try {
        const newActivity = await userActivityModel.create({
          data: activityData,
        });
        return newActivity;
      } catch (error) {
        console.error('Error creating user activity record:', error);
        throw new Error('Failed to create user activity record.');
      }
    },
  
    /**
     * Finds a single user activity record by its unique ID.
     * @param {string} id - The unique ID of the user activity record.
     * @returns {Promise<object|null>} The user activity record if found, otherwise null.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findById(id) {
      try {
        const activity = await userActivityModel.findUnique({
          where: {
            activityId: id
          },
          include: {
            user: {
              select: {
                username: true,
                email: true,
                role: true,
              },
            },
          },
        });
        return activity;
      } catch (error) {
        console.error('Error finding user activity by ID:', error);
        throw new Error('Failed to find user activity.');
      }
    },
  
    /**
     * Finds all user activity records for a specific user, with optional pagination.
     * @param {string} userId - The ID of the user to find activity for.
     * @param {object} [options] - An object containing query options.
     * @param {number} [options.skip] - The number of records to skip for pagination.
     * @param {number} [options.take] - The number of records to take for pagination.
     * @returns {Promise<object[]>} An array of user activity records.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findByUserId(userId, options = {}) {
      const {
        skip,
        take
      } = options;
      try {
        const activities = await userActivityModel.findMany({
          where: {
            userId
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take,
          select: {
            activityId: true,
            action: true,
            details: true,
            createdAt: true,
          },
        });
        return activities;
      } catch (error) {
        console.error('Error finding user activities by User ID:', error);
        throw new Error('Failed to retrieve user activity records.');
      }
    },
  
    /**
     * Deletes a user activity record by its unique ID.
     * @param {string} id - The unique ID of the user activity record to delete.
     * @returns {Promise<object>} The deleted user activity record.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async remove(id) {
      try {
        const deletedActivity = await userActivityModel.delete({
          where: {
            activityId: id
          },
        });
        return deletedActivity;
      } catch (error) {
        console.error('Error deleting user activity record:', error);
        throw new Error('Failed to delete user activity record.');
      }
    },
  };
  
  export default UserActivity;