// CrmTicket.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CrmTicket = {
  /**
   * Creates a new CRM ticket.
   *
   * @param {object} data - The data for the new ticket.
   * @param {string} data.subject - The subject of the ticket.
   * @param {string} [data.description] - The detailed description of the ticket.
   * @param {string} data.userId - The ID of the user who created the ticket.
   * @param {string} data.companyId - The ID of the company associated with the ticket.
   * @param {CrmTicketStatus} data.status - The current status of the ticket.
   * @param {CrmTicketPriority} data.priority - The priority level of the ticket.
   * @param {string} [data.assigneeNotes] - Internal notes for the assigned user.
   * @param {string} [data.assignedToUserId] - The ID of the user assigned to the ticket.
   * @returns {Promise<object>} The newly created ticket object.
   * @throws {Error} If the ticket creation fails.
   */
  create: async (data) => {
    try {
      const newTicket = await prisma.crmTicket.create({
        data,
      });
      return newTicket;
    } catch (error) {
      console.error('Error creating CRM ticket:', error);
      throw new Error('Failed to create CRM ticket.');
    }
  },

  /**
   * Finds a CRM ticket by its unique ID.
   *
   * @param {string} ticketId - The unique ID of the ticket.
   * @returns {Promise<object|null>} The ticket object, or `null` if not found.
   * @throws {Error} If the database query fails.
   */
  findById: async (ticketId) => {
    try {
      const ticket = await prisma.crmTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
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
          assignedToUser: {
            select: {
              email: true,
              displayName: true,
            },
          },
          messages: {
            select: {
              body: true,
              sender: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });
      return ticket;
    } catch (error) {
      console.error('Error finding CRM ticket by ID:', error);
      throw new Error('Failed to find CRM ticket.');
    }
  },

  /**
   * Finds all CRM tickets with pagination, filtering, and sorting.
   *
   * @param {object} [options] - The options for the query.
   * @param {number} [options.skip=0] - The number of records to skip.
   * @param {number} [options.take=10] - The number of records to take.
   * @param {object} [options.where] - The filtering conditions.
   * @param {object} [options.orderBy] - The sorting order.
   * @returns {Promise<object[]>} An array of ticket objects.
   * @throws {Error} If the database query fails.
   */
  findAll: async (options = {}) => {
    try {
      const { skip = 0, take = 10, where = {}, orderBy = { createdAt: 'desc' } } = options;
      const tickets = await prisma.crmTicket.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          user: {
            select: {
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
      return tickets;
    } catch (error) {
      console.error('Error finding all CRM tickets:', error);
      throw new Error('Failed to retrieve CRM tickets.');
    }
  },

  /**
   * Updates an existing CRM ticket.
   *
   * @param {string} ticketId - The ID of the ticket to update.
   * @param {object} data - The data to update the ticket with.
   * @returns {Promise<object>} The updated ticket object.
   * @throws {Error} If the update operation fails.
   */
  update: async (ticketId, data) => {
    try {
      const updatedTicket = await prisma.crmTicket.update({
        where: { id: ticketId },
        data,
      });
      return updatedTicket;
    } catch (error) {
      console.error(`Error updating CRM ticket with ID ${ticketId}:`, error);
      throw new Error('Failed to update CRM ticket.');
    }
  },

  /**
   * Deletes a CRM ticket by its unique ID.
   *
   * @param {string} ticketId - The ID of the ticket to delete.
   * @returns {Promise<object>} The deleted ticket object.
   * @throws {Error} If the deletion operation fails.
   */
  delete: async (ticketId) => {
    try {
      const deletedTicket = await prisma.crmTicket.delete({
        where: { id: ticketId },
      });
      return deletedTicket;
    } catch (error) {
      console.error(`Error deleting CRM ticket with ID ${ticketId}:`, error);
      throw new Error('Failed to delete CRM ticket.');
    }
  },
};

export default CrmTicket;