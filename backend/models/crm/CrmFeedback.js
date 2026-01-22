// CrmFeedback.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CrmFeedback = {
  /**
   * Creates a new CRM feedback entry.
   * @param {object} feedbackData - The data for the new feedback.
   * @param {string} feedbackData.userId - The ID of the user submitting the feedback.
   * @param {string} feedbackData.companyId - The ID of the company associated with the feedback.
   * @param {string} feedbackData.feedbackType - The type of feedback (e.g., 'BUG_REPORT', 'FEATURE_REQUEST').
   * @param {string} feedbackData.body - The main content of the feedback.
   * @returns {Promise<object>} The newly created feedback object.
   * @throws {Error} Throws an error if the creation fails.
   */
  createFeedback: async (feedbackData) => {
    try {
      const newFeedback = await prisma.crmFeedback.create({
        data: feedbackData,
      });
      return newFeedback;
    } catch (error) {
      console.error('Error creating CRM feedback:', error);
      throw new Error(`Could not create feedback: ${error.message}`);
    }
  },

  /**
   * Finds a single CRM feedback entry by its unique ID.
   * @param {string} feedbackId - The ID of the feedback to find.
   * @returns {Promise<object | null>} The feedback object if found, otherwise null.
   * @throws {Error} Throws an error if the database query fails.
   */
  findFeedbackById: async (feedbackId) => {
    try {
      const feedback = await prisma.crmFeedback.findUnique({
        where: { id: feedbackId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
      return feedback;
    } catch (error) {
      console.error('Error finding CRM feedback by ID:', error);
      throw new Error(`Could not find feedback by ID: ${error.message}`);
    }
  },

  /**
   * Finds all CRM feedback entries, with optional filtering and pagination.
   * @param {object} [options] - Optional query parameters.
   * @param {number} [options.skip=0] - The number of records to skip for pagination.
   * @param {number} [options.take=100] - The number of records to take for pagination.
   * @param {object} [options.where={}] - The filter conditions.
   * @returns {Promise<object[]>} An array of feedback objects.
   * @throws {Error} Throws an error if the database query fails.
   */
  findAllFeedback: async (options = {}) => {
    const { skip = 0, take = 100, where = {} } = options;
    try {
      const allFeedback = await prisma.crmFeedback.findMany({
        skip,
        take,
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });
      return allFeedback;
    } catch (error) {
      console.error('Error finding all CRM feedback:', error);
      throw new Error(`Could not retrieve feedback entries: ${error.message}`);
    }
  },

  /**
   * Updates an existing CRM feedback entry.
   * @param {string} feedbackId - The ID of the feedback to update.
   * @param {object} updateData - The data to update the feedback with.
   * @returns {Promise<object>} The updated feedback object.
   * @throws {Error} Throws an error if the update fails.
   */
  updateFeedback: async (feedbackId, updateData) => {
    try {
      const updatedFeedback = await prisma.crmFeedback.update({
        where: { id: feedbackId },
        data: updateData,
      });
      return updatedFeedback;
    } catch (error) {
      console.error('Error updating CRM feedback:', error);
      throw new Error(`Could not update feedback: ${error.message}`);
    }
  },

  /**
   * Deletes a CRM feedback entry by its unique ID.
   * @param {string} feedbackId - The ID of the feedback to delete.
   * @returns {Promise<object>} The deleted feedback object.
   * @throws {Error} Throws an error if the deletion fails.
   */
  deleteFeedback: async (feedbackId) => {
    try {
      const deletedFeedback = await prisma.crmFeedback.delete({
        where: { id: feedbackId },
      });
      return deletedFeedback;
    } catch (error) {
      console.error('Error deleting CRM feedback:', error);
      throw new Error(`Could not delete feedback: ${error.message}`);
    }
  },
};

export default CrmFeedback;