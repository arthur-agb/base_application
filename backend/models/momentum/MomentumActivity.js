// models/momentum/MomentumActivity.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {import('@prisma/client').Prisma.MomentumActivityCreateInput} MomentumActivityCreateInput
 * @typedef {import('@prisma/client').Prisma.MomentumActivityUpdateInput} MomentumActivityUpdateInput
 * @typedef {import('@prisma/client').Prisma.MomentumActivityWhereUniqueInput} MomentumActivityWhereUniqueInput
 * @typedef {import('@prisma/client').Prisma.MomentumActivityWhereInput} MomentumActivityWhereInput
 * @typedef {import('@prisma/client').MomentumActivity} MomentumActivity
 */

export const MomentumActivityModel = {
  /**
   * Creates a new MomentumActivity record.
   * @param {Omit<MomentumActivityCreateInput, 'user' | 'project'> & {userId: string, projectId: string}} data
   * @returns {Promise<MomentumActivity>} The newly created activity record.
   */
  async create(data, tx) {
    try {
      
      const db = tx || prisma;
      
      // The schema now uses direct scalar fields (userId, projectId),
      // so we don't need the explicit 'connect' object anymore.
      const activity = await db.momentumActivity.create({
        data,
      });
      return activity;
    } catch (error) {
      console.error('Error creating MomentumActivity:', error);
      throw new Error(`Failed to create new MomentumActivity: ${error.message}`);
    }
  },

  /**
   * Finds a single MomentumActivity record by a unique identifier.
   * Includes related Project and User data.
   * @param {MomentumActivityWhereUniqueInput} where - The unique identifier.
   * @returns {Promise<MomentumActivity | null>} The found record, or null.
   */
  async findUnique(where) {
    try {
      const activity = await prisma.momentumActivity.findUnique({
        where,
        include: {
          project: {
            select: {
              name: true,
              key: true,
            },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
      return activity;
    } catch (error) {
      console.error('Error finding unique MomentumActivity:', error);
      throw new Error(`Failed to find MomentumActivity: ${error.message}`);
    }
  },

  /**
   * Finds all MomentumActivity records that match the given criteria.
   * @param {MomentumActivityWhereInput} [where={}] - The filter criteria.
   * @returns {Promise<MomentumActivity[]>} An array of activity records.
   */
  async findMany(where = {}) {
    try {
      const activities = await prisma.momentumActivity.findMany({
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
      return activities;
    } catch (error) {
      console.error('Error finding many MomentumActivities:', error);
      throw new Error(`Failed to find MomentumActivities: ${error.message}`);
    }
  },

  /**
   * Updates a MomentumActivity record.
   * @param {MomentumActivityWhereUniqueInput} where - The unique identifier.
   * @param {MomentumActivityUpdateInput} data - The data to update with.
   * @returns {Promise<MomentumActivity>} The updated activity record.
   */
  async update(where, data) {
    try {
      const updatedActivity = await prisma.momentumActivity.update({
        where,
        data,
      });
      return updatedActivity;
    } catch (error) {
      console.error('Error updating MomentumActivity:', error);
      throw new Error(`Failed to update MomentumActivity: ${error.message}`);
    }
  },

  /**
   * Deletes a MomentumActivity record.
   * @param {MomentumActivityWhereUniqueInput} where - The unique identifier.
   * @returns {Promise<MomentumActivity>} The deleted activity record.
   */
  async delete(where) {
    try {
      const deletedActivity = await prisma.momentumActivity.delete({
        where,
      });
      return deletedActivity;
    } catch (error) {
      console.error('Error deleting MomentumActivity:', error);
      throw new Error(`Failed to delete MomentumActivity: ${error.message}`);
    }
  },
};