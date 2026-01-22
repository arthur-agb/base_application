// CrmMessage.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CrmMessage = {
  /**
   * Creates a new CRM message.
   * @param {object} data - The data for the new message.
   * @returns {Promise<object>} The created message object.
   * @throws {Error} If the message creation fails.
   */
  create: async (data) => {
    try {
      const crmMessage = await prisma.crmMessage.create({
        data,
      });
      return crmMessage;
    } catch (error) {
      console.error('Error creating CRM message:', error);
      throw new Error(`Failed to create a new message: ${error.message}`);
    }
  },

  /**
   * Finds all CRM messages, optionally filtered by ticket, sender, or company.
   * @param {object} [where] - Optional filter conditions.
   * @returns {Promise<Array<object>>} An array of messages.
   * @throws {Error} If fetching messages fails.
   */
  findAll: async (where = {}) => {
    try {
      const crmMessages = await prisma.crmMessage.findMany({
        where,
        include: {
          ticket: {
            select: {
              subject: true,
              status: true,
            },
          },
          sender: {
            select: {
              email: true,
              displayName: true,
            },
          },
          company: {
            select: {
              name: true,
            },
          },
        },
      });
      return crmMessages;
    } catch (error) {
      console.error('Error finding CRM messages:', error);
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  },

  /**
   * Finds a single CRM message by its unique ID.
   * @param {string} id - The unique ID of the message.
   * @returns {Promise<object|null>} The message object or null if not found.
   * @throws {Error} If fetching the message fails.
   */
  findById: async (id) => {
    try {
      const crmMessage = await prisma.crmMessage.findUnique({
        where: { id },
        include: {
          ticket: true,
          sender: true,
          company: true,
        },
      });
      return crmMessage;
    } catch (error) {
      console.error(`Error finding CRM message with ID ${id}:`, error);
      throw new Error(`Failed to retrieve message with ID ${id}: ${error.message}`);
    }
  },

  /**
   * Updates an existing CRM message.
   * @param {string} id - The unique ID of the message to update.
   * @param {object} data - The data to update the message with.
   * @returns {Promise<object>} The updated message object.
   * @throws {Error} If the update operation fails.
   */
  update: async (id, data) => {
    try {
      const updatedCrmMessage = await prisma.crmMessage.update({
        where: { id },
        data,
      });
      return updatedCrmMessage;
    } catch (error) {
      console.error(`Error updating CRM message with ID ${id}:`, error);
      throw new Error(`Failed to update message with ID ${id}: ${error.message}`);
    }
  },

  /**
   * Deletes a CRM message by its unique ID.
   * @param {string} id - The unique ID of the message to delete.
   * @returns {Promise<object>} The deleted message object.
   * @throws {Error} If the deletion operation fails.
   */
  delete: async (id) => {
    try {
      const deletedCrmMessage = await prisma.crmMessage.delete({
        where: { id },
      });
      return deletedCrmMessage;
    } catch (error) {
      console.error(`Error deleting CRM message with ID ${id}:`, error);
      throw new Error(`Failed to delete message with ID ${id}: ${error.message}`);
    }
  },
};

export default CrmMessage;