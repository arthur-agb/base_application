// CompanyMain.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

const companyMain = {
  /**
   * Creates a new company record.
   * @param {object} companyData - The data for the new company.
   * @param {string} companyData.name - The name of the company.
   * @param {string} companyData.slug - The unique slug for the company.
   * @returns {Promise<object>} - The newly created company object.
   */
  async createCompany(companyData) {
    try {
      const newCompany = await prisma.companyMain.create({
        data: companyData,
      });
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company.');
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Finds a company by its unique ID.
   * @param {string} companyId - The ID of the company to find.
   * @returns {Promise<object | null>} - The company object, or null if not found.
   */
  async findCompanyById(companyId) {
    try {
      const company = await prisma.companyMain.findUnique({
        where: {
          id: companyId,
        },
        include: {
          users: true, // Example of including related data
          subscriptions: true,
        },
      });
      return company;
    } catch (error) {
      console.error('Error finding company by ID:', error);
      throw new Error('Failed to find company.');
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Finds a company by its slug, selecting specific fields.
   * @param {string} slug - The slug of the company to find.
   * @returns {Promise<object | null>} - The company object with selected fields, or null if not found.
   */
  async findCompanyBySlug(slug) {
    try {
      const company = await prisma.companyMain.findUnique({
        where: {
          slug: slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          projects: {
            select: {
              name: true,
              key: true,
            },
          },
        },
      });
      return company;
    } catch (error) {
      console.error('Error finding company by slug:', error);
      throw new Error('Failed to find company.');
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Updates an existing company record.
   * @param {string} companyId - The ID of the company to update.
   * @param {object} updateData - The data to update the company with.
   * @returns {Promise<object>} - The updated company object.
   */
  async updateCompany(companyId, updateData) {
    try {
      const updatedCompany = await prisma.companyMain.update({
        where: {
          id: companyId,
        },
        data: updateData,
      });
      return updatedCompany;
    } catch (error) {
      console.error('Error updating company:', error);
      throw new Error('Failed to update company.');
    } finally {
      await prisma.$disconnect();
    }
  },

  /**
   * Deletes a company record by ID.
   * @param {string} companyId - The ID of the company to delete.
   * @returns {Promise<object>} - The deleted company object.
   */
  async deleteCompany(companyId) {
    try {
      const deletedCompany = await prisma.companyMain.delete({
        where: {
          id: companyId,
        },
      });
      return deletedCompany;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw new Error('Failed to delete company.');
    } finally {
      await prisma.$disconnect();
    }
  },
};

export default companyMain;