// models/momentum/MomentumHistory.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {import('@prisma/client').Prisma.MomentumHistoryCreateInput} MomentumHistoryCreateInput
 * @typedef {import('@prisma/client').Prisma.MomentumHistoryUpdateInput} MomentumHistoryUpdateInput
 * @typedef {import('@prisma/client').Prisma.MomentumHistoryWhereUniqueInput} MomentumHistoryWhereUniqueInput
 * @typedef {import('@prisma/client').Prisma.MomentumHistoryWhereInput} MomentumHistoryWhereInput
 * @typedef {import('@prisma/client').MomentumHistory} MomentumHistory
 */

export const MomentumHistoryModel = {
  /**
   * Creates a new MomentumHistory record.
   * @param {Omit<MomentumHistoryCreateInput, 'user'> & {userId: string}} data
   * @returns {Promise<MomentumHistory>} The newly created history record.
   */
  async create(data) {
    try {
      const historyEntry = await prisma.momentumHistory.create({
        data,
      });
      return historyEntry;
    } catch (error) {
      console.error('Error creating MomentumHistory:', error);
      throw new Error(`Failed to create new MomentumHistory: ${error.message}`);
    }
  },

  /**
   * Finds a single MomentumHistory record by a unique identifier.
   * @param {MomentumHistoryWhereUniqueInput} where - The unique identifier.
   * @returns {Promise<MomentumHistory | null>} The found record, or null.
   */
  async findUnique(where) {
    try {
      const historyEntry = await prisma.momentumHistory.findUnique({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
      return historyEntry;
    } catch (error) {
      console.error('Error finding unique MomentumHistory:', error);
      throw new Error(`Failed to find MomentumHistory: ${error.message}`);
    }
  },

  /**
   * Finds all MomentumHistory records that match the given criteria.
   * @param {MomentumHistoryWhereInput} [where={}] - The filter criteria.
   * @returns {Promise<MomentumHistory[]>} An array of history records.
   */
  async findMany(where = {}) {
    try {
      const historyEntries = await prisma.momentumHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return historyEntries;
    } catch (error) {
      console.error('Error finding many MomentumHistories:', error);
      throw new Error(`Failed to find MomentumHistories: ${error.message}`);
    }
  },

  /**
   * Updates a MomentumHistory record. (Use with caution)
   * @param {MomentumHistoryWhereUniqueInput} where - The unique identifier.
   * @param {MomentumHistoryUpdateInput} data - The data to update with.
   * @returns {Promise<MomentumHistory>} The updated history record.
   */
  async update(where, data) {
    try {
      const updatedHistory = await prisma.momentumHistory.update({
        where,
        data,
      });
      return updatedHistory;
    } catch (error) {
      console.error('Error updating MomentumHistory:', error);
      throw new Error(`Failed to update MomentumHistory: ${error.message}`);
    }
  },

  /**
   * Deletes a MomentumHistory record. (Use with caution)
   * @param {MomentumHistoryWhereUniqueInput} where - The unique identifier.
   * @returns {Promise<MomentumHistory>} The deleted history record.
   */
  async delete(where) {
    try {
      const deletedHistory = await prisma.momentumHistory.delete({
        where,
      });
      return deletedHistory;
    } catch (error) {
      console.error('Error deleting MomentumHistory:', error);
      throw new Error(`Failed to delete MomentumHistory: ${error.message}`);
    }
  },
};