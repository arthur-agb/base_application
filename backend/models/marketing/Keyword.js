// Keyword.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {object} Keyword
 * @property {string} id - The unique identifier of the keyword.
 * @property {string} adSetId - The ID of the ad set this keyword belongs to.
 * @property {string} keywordText - The text of the keyword.
 * @property {'BROAD'|'PHRASE'|'EXACT'} matchType - The match type of the keyword.
 * @property {number} [bidAmount] - The bid amount for the keyword.
 * @property {'ACTIVE'|'PAUSED'|'ARCHIVED'|'PENDING_REVIEW'} status - The status of the keyword.
 * @property {Date} createdAt - The creation timestamp.
 * @property {Date} updatedAt - The last update timestamp.
 */

/**
 * @typedef {object} AdSet
 * @property {string} id - The unique identifier of the ad set.
 * @property {string} paidCampaignId - The ID of the paid campaign this ad set belongs to.
 * @property {string} name - The name of the ad set.
 * @property {object} targetAudience - The target audience details.
 * @property {'CPC'|'CPM'|'CPA'} bidStrategy - The bid strategy for the ad set.
 * @property {'ACTIVE'|'PAUSED'|'ARCHIVED'|'PENDING_REVIEW'} status - The status of the ad set.
 */

/**
 * An object containing asynchronous functions for CRUD operations on the Keyword model.
 */
export const Keyword = {
  /**
   * Creates a new keyword.
   * @param {object} data - The data for the new keyword.
   * @param {string} data.adSetId - The ID of the ad set this keyword belongs to.
   * @param {string} data.keywordText - The text of the keyword.
   * @param {'BROAD'|'PHRASE'|'EXACT'} data.matchType - The match type of the keyword.
   * @param {number} [data.bidAmount] - The bid amount for the keyword.
   * @param {'ACTIVE'|'PAUSED'|'ARCHIVED'|'PENDING_REVIEW'} data.status - The status of the keyword.
   * @returns {Promise<Keyword>} The newly created keyword object.
   * @throws {Error} Throws an error if the creation fails.
   */
  async create(data) {
    try {
      const newKeyword = await prisma.keyword.create({
        data,
      });
      return newKeyword;
    } catch (error) {
      console.error('Error creating keyword:', error);
      throw new Error(`Failed to create keyword: ${error.message}`);
    }
  },

  /**
   * Finds a keyword by its unique ID.
   * @param {string} keywordId - The unique ID of the keyword.
   * @param {boolean} includeAdSet - Whether to include the related AdSet object.
   * @returns {Promise<Keyword|null>} The keyword object or null if not found.
   * @throws {Error} Throws an error if the query fails.
   */
  async findById(keywordId, includeAdSet = false) {
    try {
      const keyword = await prisma.keyword.findUnique({
        where: { id: keywordId },
        include: includeAdSet ? { adSet: true } : undefined,
      });
      return keyword;
    } catch (error) {
      console.error('Error finding keyword by ID:', error);
      throw new Error(`Failed to find keyword: ${error.message}`);
    }
  },

  /**
   * Finds all keywords, with optional filtering and pagination.
   * @param {object} [options={}] - Optional query options.
   * @param {number} [options.skip] - The number of keywords to skip.
   * @param {number} [options.take] - The number of keywords to return.
   * @param {string} [options.adSetId] - Filters keywords by the ad set ID.
   * @param {string} [options.keywordText] - Filters keywords by the keyword text (case-insensitive).
   * @param {boolean} [options.includeAdSet] - Whether to include the related AdSet object.
   * @returns {Promise<Keyword[]>} An array of keyword objects.
   * @throws {Error} Throws an error if the query fails.
   */
  async findAll({ skip, take, adSetId, keywordText, includeAdSet = false } = {}) {
    try {
      const keywords = await prisma.keyword.findMany({
        skip: skip,
        take: take,
        where: {
          ...(adSetId && { adSetId }),
          ...(keywordText && { keywordText: { contains: keywordText, mode: 'insensitive' } }),
        },
        include: includeAdSet ? { adSet: true } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return keywords;
    } catch (error) {
      console.error('Error finding all keywords:', error);
      throw new Error(`Failed to find all keywords: ${error.message}`);
    }
  },

  /**
   * Updates an existing keyword.
   * @param {string} keywordId - The unique ID of the keyword to update.
   * @param {object} data - The data to update.
   * @returns {Promise<Keyword>} The updated keyword object.
   * @throws {Error} Throws an error if the update fails or the keyword is not found.
   */
  async update(keywordId, data) {
    try {
      const updatedKeyword = await prisma.keyword.update({
        where: { id: keywordId },
        data,
      });
      return updatedKeyword;
    } catch (error) {
      console.error('Error updating keyword:', error);
      throw new Error(`Failed to update keyword: ${error.message}`);
    }
  },

  /**
   * Deletes a keyword by its unique ID.
   * @param {string} keywordId - The unique ID of the keyword to delete.
   * @returns {Promise<Keyword>} The deleted keyword object.
   * @throws {Error} Throws an error if the deletion fails or the keyword is not found.
   */
  async delete(keywordId) {
    try {
      const deletedKeyword = await prisma.keyword.delete({
        where: { id: keywordId },
      });
      return deletedKeyword;
    } catch (error) {
      console.error('Error deleting keyword:', error);
      throw new Error(`Failed to delete keyword: ${error.message}`);
    }
  },
};

export default Keyword;