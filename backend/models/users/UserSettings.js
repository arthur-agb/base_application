// UserSettings.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserSettingsModel = {
  /**
   * Creates or updates a user's settings.
   * @param {object} data - The user settings data.
   * @param {string} data.userId - The ID of the user.
   * @param {string} [data.theme] - The user's preferred theme.
   * @param {string} [data.sidebarSize] - The size of the user's sidebar.
   * @param {boolean} [data.notificationsEnabled] - Whether notifications are enabled.
   * @returns {Promise<object>} The created or updated user settings object.
   * @throws {Error} If the database operation fails.
   */
  async createOrUpdate(data) {
    try {
      const { userId, ...settings } = data;
      const userSettings = await prisma.users_UserSettings.upsert({
        where: { userId },
        update: settings,
        create: {
          userId,
          ...settings,
        },
      });
      return userSettings;
    } catch (error) {
      console.error('Failed to create or update user settings:', error);
      throw new Error('Database operation failed to create or update user settings.');
    }
  },

  /**
   * Finds user settings by user ID.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object|null>} The user settings object or null if not found.
   * @throws {Error} If the database operation fails.
   */
  async findByUserId(userId) {
    try {
      const userSettings = await prisma.users_UserSettings.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              username: true,
              displayName: true,
            },
          },
        },
      });
      return userSettings;
    } catch (error) {
      console.error('Failed to find user settings by user ID:', error);
      throw new Error('Database operation failed to find user settings.');
    }
  },

  /**
   * Updates existing user settings.
   * @param {string} userId - The ID of the user.
   * @param {object} data - The settings data to update.
   * @returns {Promise<object>} The updated user settings object.
   * @throws {Error} If the user settings are not found or the database operation fails.
   */
  async update(userId, data) {
    try {
      const userSettings = await prisma.users_UserSettings.update({
        where: { userId },
        data,
      });
      return userSettings;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      if (error.code === 'P2025') {
        throw new Error(`User settings with ID ${userId} not found.`);
      }
      throw new Error('Database operation failed to update user settings.');
    }
  },

  /**
   * Deletes user settings by user ID.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>} The deleted user settings object.
   * @throws {Error} If the user settings are not found or the database operation fails.
   */
  async remove(userId) {
    try {
      const userSettings = await prisma.users_UserSettings.delete({
        where: { userId },
      });
      return userSettings;
    } catch (error) {
      console.error('Failed to delete user settings:', error);
      if (error.code === 'P2025') {
        throw new Error(`User settings with ID ${userId} not found.`);
      }
      throw new Error('Database operation failed to delete user settings.');
    }
  },
};

export default UserSettingsModel;