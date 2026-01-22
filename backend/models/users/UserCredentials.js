// UserCredentials.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserCredentialsModel = {
  /**
   * Creates new user credentials.
   *
   * @param {object} data - The data for the new user credentials.
   * @param {string} data.userId - The ID of the user.
   * @param {string} data.passwordHash - The hashed password.
   * @param {string} [data.twoFactorSecret] - The optional 2FA secret.
   * @returns {Promise<object>} The created user credentials.
   * @throws {Error} Throws an error if the creation fails.
   */
  async create(data) {
    try {
      return await prisma.userCredentials.create({ data });
    } catch (error) {
      console.error('Failed to create user credentials:', error);
      throw new Error('Could not create user credentials.');
    }
  },

  /**
   * Finds user credentials by their userId.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object | null>} The user credentials or null if not found.
   * @throws {Error} Throws an error if the query fails.
   */
  async findByUserId(userId) {
    try {
      return await prisma.userCredentials.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              username: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to find user credentials:', error);
      throw new Error('Could not retrieve user credentials.');
    }
  },

  /**
   * Updates user credentials by userId.
   *
   * @param {string} userId - The ID of the user whose credentials to update.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated user credentials.
   * @throws {Error} Throws an error if the update fails.
   */
  async update(userId, data) {
    try {
      return await prisma.userCredentials.update({
        where: { userId },
        data,
      });
    } catch (error) {
      console.error('Failed to update user credentials:', error);
      throw new Error('Could not update user credentials.');
    }
  },

  /**
   * Deletes user credentials by userId.
   *
   * @param {string} userId - The ID of the user whose credentials to delete.
   * @returns {Promise<object>} The deleted user credentials.
   * @throws {Error} Throws an error if the deletion fails.
   */
  async delete(userId) {
    try {
      return await prisma.userCredentials.delete({
        where: { userId },
      });
    } catch (error) {
      console.error('Failed to delete user credentials:', error);
      throw new Error('Could not delete user credentials.');
    }
  },
};

export default UserCredentialsModel;