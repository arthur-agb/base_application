// File: UserSession.js

/**
 * @file This module provides an interface for interacting with the UserSession model
 * in the database, using Prisma for common CRUD operations.
 * @module UserSessionModel
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserSessionModel = {
  /**
   * Creates a new user session.
   * @param {object} sessionData - The data for the new session.
   * @param {string} sessionData.userId - The ID of the user.
   * @param {string} sessionData.token - The unique session token.
   * @param {string} sessionData.ipAddress - The IP address of the user.
   * @param {string} sessionData.deviceInfo - The user's device information.
   * @param {Date} sessionData.expiresAt - The expiration date and time for the session.
   * @returns {Promise<object>} A promise that resolves to the newly created UserSession object.
   * @throws {Error} Throws an error if the session could not be created.
   */
  async createSession(sessionData) {
    try {
      const newSession = await prisma.userSession.create({
        data: sessionData,
      });
      return newSession;
    } catch (error) {
      console.error('Error creating user session:', error);
      throw new Error('Failed to create user session.');
    }
  },

  /**
   * Finds a user session by its unique session ID.
   * @param {string} sessionId - The unique ID of the session.
   * @param {object} [options] - Optional query options.
   * @param {object} [options.include] - An object specifying relations to include (e.g., `{ user: true }`).
   * @returns {Promise<object|null>} A promise that resolves to the UserSession object, or null if not found.
   * @throws {Error} Throws an error if the query fails.
   */
  async findSessionById(sessionId, options = {}) {
    try {
      const session = await prisma.userSession.findUnique({
        where: { sessionId },
        ...options,
      });
      return session;
    } catch (error) {
      console.error('Error finding user session by ID:', error);
      throw new Error('Failed to retrieve user session.');
    }
  },

  /**
   * Finds all active sessions for a given user.
   * @param {string} userId - The ID of the user.
   * @param {object} [options] - Optional query options.
   * @param {object} [options.select] - An object specifying fields to select.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of UserSession objects.
   * @throws {Error} Throws an error if the query fails.
   */
  async findActiveSessionsByUserId(userId, options = {}) {
    try {
      const activeSessions = await prisma.userSession.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(), // Sessions that haven't expired yet
          },
        },
        ...options,
      });
      return activeSessions;
    } catch (error) {
      console.error('Error finding active sessions by user ID:', error);
      throw new Error('Failed to retrieve user sessions.');
    }
  },

  /**
   * Updates an existing user session.
   * @param {string} sessionId - The unique ID of the session to update.
   * @param {object} updateData - The data to update.
   * @returns {Promise<object>} A promise that resolves to the updated UserSession object.
   * @throws {Error} Throws an error if the session could not be updated.
   */
  async updateSession(sessionId, updateData) {
    try {
      const updatedSession = await prisma.userSession.update({
        where: { sessionId },
        data: updateData,
      });
      return updatedSession;
    } catch (error) {
      console.error('Error updating user session:', error);
      throw new Error('Failed to update user session.');
    }
  },

  /**
   * Deletes a user session by its unique session ID.
   * @param {string} sessionId - The unique ID of the session to delete.
   * @returns {Promise<object>} A promise that resolves to the deleted UserSession object.
   * @throws {Error} Throws an error if the session could not be deleted.
   */
  async deleteSession(sessionId) {
    try {
      const deletedSession = await prisma.userSession.delete({
        where: { sessionId },
      });
      return deletedSession;
    } catch (error) {
      console.error('Error deleting user session:', error);
      throw new Error('Failed to delete user session.');
    }
  },

  /**
   * Deletes all sessions associated with a specific user.
   * @param {string} userId - The ID of the user whose sessions should be deleted.
   * @returns {Promise<object>} A promise that resolves to an object containing the count of deleted sessions.
   * @throws {Error} Throws an error if the sessions could not be deleted.
   */
  async deleteAllSessionsByUserId(userId) {
    try {
      const deleteResult = await prisma.userSession.deleteMany({
        where: { userId },
      });
      return deleteResult;
    } catch (error) {
      console.error('Error deleting all sessions for user:', error);
      throw new Error('Failed to delete user sessions.');
    }
  },
};

export default UserSessionModel;