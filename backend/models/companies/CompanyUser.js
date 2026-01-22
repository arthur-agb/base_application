// CompanyUser.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CompanyUser = {
  /**
   * Creates a new CompanyUser record.
   *
   * @param {object} data - The data for the new company user.
   * @param {string} data.companyId - The ID of the company.
   * @param {string} data.userId - The ID of the user.
   * @param {string} data.role - The role of the user within the company (e.g., 'OWNER', 'ADMIN').
   * @returns {Promise<object>} The newly created company user record.
   */
  async create(data) {
    try {
      const companyUser = await prisma.companyUser.create({
        data,
        select: {
          companyId: true,
          userId: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
      return companyUser;
    } catch (error) {
      console.error('Error creating company user:', error);
      throw new Error(`Could not create company user: ${error.message}`);
    }
  },

  /**
   * Finds a single company user by their composite primary key (companyId and userId).
   *
   * @param {string} companyId - The ID of the company.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object | null>} The company user record, or null if not found.
   */
  async findOne(companyId, userId) {
    try {
      const companyUser = await prisma.companyUser.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        include: {
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      });
      return companyUser;
    } catch (error) {
      console.error('Error finding company user:', error);
      throw new Error(`Could not find company user: ${error.message}`);
    }
  },

  /**
   * Finds all company users, optionally filtered by companyId or userId.
   *
   * @param {object} [filter] - An optional filter object.
   * @param {string} [filter.companyId] - The ID of the company to filter by.
   * @param {string} [filter.userId] - The ID of the user to filter by.
   * @returns {Promise<Array<object>>} An array of company user records.
   */
  async findMany(filter = {}) {
    try {
      const companyUsers = await prisma.companyUser.findMany({
        where: filter,
      });
      return companyUsers;
    } catch (error) {
      console.error('Error finding company users:', error);
      throw new Error(`Could not find company users: ${error.message}`);
    }
  },

  /**
   * Updates an existing company user record.
   *
   * @param {string} companyId - The ID of the company.
   * @param {string} userId - The ID of the user.
   * @param {object} data - The data to update.
   * @returns {Promise<object>} The updated company user record.
   */
  async update(companyId, userId, data) {
    try {
      const updatedCompanyUser = await prisma.companyUser.update({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        data,
      });
      return updatedCompanyUser;
    } catch (error) {
      console.error('Error updating company user:', error);
      throw new Error(`Could not update company user: ${error.message}`);
    }
  },

  /**
   * Deletes a company user record.
   *
   * @param {string} companyId - The ID of the company.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>} The deleted company user record.
   */
  async remove(companyId, userId) {
    try {
      const deletedCompanyUser = await prisma.companyUser.delete({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
      });
      return deletedCompanyUser;
    } catch (error) {
      console.error('Error deleting company user:', error);
      throw new Error(`Could not delete company user: ${error.message}`);
    }
  },
};

export default CompanyUser;