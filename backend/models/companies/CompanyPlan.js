// src/models/CompanyPlan.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {Object} CompanyPlan
 * @property {string} id - The unique ID of the company plan.
 * @property {string} name - The name of the plan.
 * @property {string | null} description - The description of the plan.
 * @property {number} basePrice - The base price of the plan.
 * @property {string} currency - The currency of the plan.
 * @property {string} billingFrequency - The billing frequency of the plan (MONTHLY or YEARLY).
 * @property {boolean} isActive - The active status of the plan.
 * @property {Date} startDate - The start date of the plan.
 * @property {Date | null} endDate - The end date of the plan.
 * @property {Date} createdAt - The creation date of the plan.
 * @property {Date} updatedAt - The last update date of the plan.
 */

/**
 * Model script for interacting with the CompanyPlan table in the database.
 */
const CompanyPlan = {
  /**
   * Creates a new company plan.
   * @param {Object} data - The data for the new plan.
   * @returns {Promise<CompanyPlan>} The newly created company plan.
   * @throws {Error} If the plan creation fails.
   */
  async create(data) {
    try {
      const newPlan = await prisma.companyPlan.create({
        data,
      });
      return newPlan;
    } catch (error) {
      console.error('Error creating company plan:', error);
      throw new Error('Failed to create company plan.');
    }
  },

  /**
   * Finds a company plan by its unique ID.
   * @param {string} id - The unique ID of the plan.
   * @param {boolean} [includeSubscriptions=false] - Whether to include related subscriptions.
   * @returns {Promise<CompanyPlan | null>} The company plan if found, otherwise null.
   * @throws {Error} If the database query fails.
   */
  async findById(id, includeSubscriptions = false) {
    try {
      const plan = await prisma.companyPlan.findUnique({
        where: { id },
        ...(includeSubscriptions && {
          include: {
            subscriptions: true,
          },
        }),
      });
      return plan;
    } catch (error) {
      console.error('Error finding company plan by ID:', error);
      throw new Error('Failed to find company plan.');
    }
  },

  /**
   * Retrieves all company plans, with optional filtering.
   * @param {Object} [filters={}] - Optional filters for the query.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=100] - The number of records to take.
   * @returns {Promise<CompanyPlan[]>} A list of company plans.
   * @throws {Error} If the database query fails.
   */
  async findAll(filters = {}, skip = 0, take = 100) {
    try {
      const plans = await prisma.companyPlan.findMany({
        where: filters,
        skip,
        take,
        select: {
          id: true,
          name: true,
          basePrice: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return plans;
    } catch (error) {
      console.error('Error fetching all company plans:', error);
      throw new Error('Failed to retrieve company plans.');
    }
  },

  /**
   * Updates an existing company plan.
   * @param {string} id - The unique ID of the plan to update.
   * @param {Object} data - The data to update the plan with.
   * @returns {Promise<CompanyPlan>} The updated company plan.
   * @throws {Error} If the update fails.
   */
  async update(id, data) {
    try {
      const updatedPlan = await prisma.companyPlan.update({
        where: { id },
        data,
      });
      return updatedPlan;
    } catch (error) {
      console.error('Error updating company plan:', error);
      throw new Error(`Failed to update company plan with ID: ${id}.`);
    }
  },

  /**
   * Deletes a company plan by its unique ID.
   * @param {string} id - The unique ID of the plan to delete.
   * @returns {Promise<CompanyPlan>} The deleted company plan.
   * @throws {Error} If the deletion fails.
   */
  async delete(id) {
    try {
      const deletedPlan = await prisma.companyPlan.delete({
        where: { id },
      });
      return deletedPlan;
    } catch (error) {
      console.error('Error deleting company plan:', error);
      throw new Error(`Failed to delete company plan with ID: ${id}.`);
    }
  },
};

export default CompanyPlan;