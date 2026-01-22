// Lead.js
import {
    PrismaClient
  } from '../node_modules/.prisma/client';
  
  const prisma = new PrismaClient();
  const leadModel = prisma.lead;
  
  const Lead = {
    /**
     * Creates a new lead record.
     * @param {object} leadData - The data for the new lead record.
     * @param {string} leadData.name - The name of the lead.
     * @param {string} leadData.email - The email of the lead.
     * @param {string} leadData.source - The source of the lead (e.g., "Website", "Referral").
     * @param {string} [leadData.companyId] - The ID of the company associated with the lead.
     * @param {string} [leadData.phone] - The phone number of the lead.
     * @param {boolean} [leadData.isActive=true] - Whether the lead is currently active.
     * @param {Date} leadData.startDate - The date the lead was created.
     * @param {Date} [leadData.endDate] - The date the lead became inactive.
     * @returns {Promise<object>} The newly created lead record.
     * @throws {Error} Throws an error if the creation fails.
     */
    async create(leadData) {
      try {
        const newLead = await leadModel.create({
          data: leadData,
        });
        return newLead;
      } catch (error) {
        console.error('Error creating lead record:', error);
        throw new Error('Failed to create lead record.');
      }
    },
  
    /**
     * Finds a single lead record by its unique ID.
     * @param {string} id - The unique ID of the lead record.
     * @returns {Promise<object|null>} The lead record if found, otherwise null.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findById(id) {
      try {
        const lead = await leadModel.findUnique({
          where: {
            id
          },
          include: {
            company: {
              select: {
                name: true,
                slug: true,
              },
            },
            projects: {
              select: {
                name: true,
                key: true,
              },
            },
          },
        });
        return lead;
      } catch (error) {
        console.error('Error finding lead record by ID:', error);
        throw new Error('Failed to find lead record.');
      }
    },
  
    /**
     * Finds all lead records, with optional filtering and pagination.
     * @param {object} [options] - An object containing query options.
     * @param {string} [options.companyId] - Filter by a specific company's ID.
     * @param {boolean} [options.isActive] - Filter by active status.
     * @param {number} [options.skip] - The number of records to skip for pagination.
     * @param {number} [options.take] - The number of records to take for pagination.
     * @returns {Promise<object[]>} An array of lead records.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findAll(options = {}) {
      const {
        companyId,
        isActive,
        skip,
        take
      } = options;
      const where = {};
      if (companyId) where.companyId = companyId;
      if (isActive !== undefined) where.isActive = isActive;
  
      try {
        const leads = await leadModel.findMany({
          where,
          skip,
          take,
          include: {
            company: true
          },
        });
        return leads;
      } catch (error) {
        console.error('Error finding all lead records:', error);
        throw new Error('Failed to retrieve lead records.');
      }
    },
  
    /**
     * Updates an existing lead record.
     * @param {string} id - The unique ID of the lead record to update.
     * @param {object} updateData - The data to update the lead record with.
     * @returns {Promise<object>} The updated lead record.
     * @throws {Error} Throws an error if the update fails.
     */
    async update(id, updateData) {
      try {
        const updatedLead = await leadModel.update({
          where: {
            id
          },
          data: updateData,
        });
        return updatedLead;
      } catch (error) {
        console.error('Error updating lead record:', error);
        throw new Error('Failed to update lead record.');
      }
    },
  
    /**
     * Deletes a lead record by its unique ID.
     * @param {string} id - The unique ID of the lead record to delete.
     * @returns {Promise<object>} The deleted lead record.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async remove(id) {
      try {
        const deletedLead = await leadModel.delete({
          where: {
            id
          },
        });
        return deletedLead;
      } catch (error) {
        console.error('Error deleting lead record:', error);
        throw new Error('Failed to delete lead record.');
      }
    },
  };
  
  export default Lead;