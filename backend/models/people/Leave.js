// Leave.js
import {
    PrismaClient
  } from '../node_modules/.prisma/client';
  
  const prisma = new PrismaClient();
  const leaveModel = prisma.leave;
  
  const Leave = {
    /**
     * Creates a new leave record.
     * @param {object} leaveData - The data for the new leave record.
     * @param {string} leaveData.employeeId - The ID of the employee requesting leave.
     * @param {string} leaveData.leaveType - The type of leave (e.g., 'ANNUAL', 'SICK').
     * @param {string} leaveData.status - The status of the leave request (e.g., 'PENDING', 'APPROVED').
     * @param {boolean} [leaveData.isActive=true] - Whether the leave record is active.
     * @param {Date} leaveData.startDate - The start date of the leave.
     * @param {Date} leaveData.endDate - The end date of the leave.
     * @returns {Promise<object>} The newly created leave record.
     * @throws {Error} Throws an error if the creation fails.
     */
    async create(leaveData) {
      try {
        const newLeave = await leaveModel.create({
          data: leaveData,
        });
        return newLeave;
      } catch (error) {
        console.error('Error creating leave record:', error);
        throw new Error('Failed to create leave record.');
      }
    },
  
    /**
     * Finds a single leave record by its unique ID.
     * @param {string} id - The unique ID of the leave record.
     * @returns {Promise<object|null>} The leave record if found, otherwise null.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findById(id) {
      try {
        const leave = await leaveModel.findUnique({
          where: {
            id
          },
          include: {
            employee: {
              select: {
                id: true,
                jobTitle: true,
                department: true,
                costCentre: true,
              },
            },
          },
        });
        return leave;
      } catch (error) {
        console.error('Error finding leave record by ID:', error);
        throw new Error('Failed to find leave record.');
      }
    },
  
    /**
     * Finds all leave records, with optional filtering and pagination.
     * @param {object} [options] - An object containing query options.
     * @param {string} [options.employeeId] - Filter by a specific employee's ID.
     * @param {string} [options.status] - Filter by leave status.
     * @param {number} [options.skip] - The number of records to skip for pagination.
     * @param {number} [options.take] - The number of records to take for pagination.
     * @returns {Promise<object[]>} An array of leave records.
     * @throws {Error} Throws an error if the database query fails.
     */
    async findAll(options = {}) {
      const {
        employeeId,
        status,
        skip,
        take
      } = options;
      const where = {};
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;
  
      try {
        const leaveRecords = await leaveModel.findMany({
          where,
          skip,
          take,
          include: {
            employee: true
          },
        });
        return leaveRecords;
      } catch (error) {
        console.error('Error finding all leave records:', error);
        throw new Error('Failed to retrieve leave records.');
      }
    },
  
    /**
     * Updates an existing leave record.
     * @param {string} id - The unique ID of the leave record to update.
     * @param {object} updateData - The data to update the leave record with.
     * @returns {Promise<object>} The updated leave record.
     * @throws {Error} Throws an error if the update fails.
     */
    async update(id, updateData) {
      try {
        const updatedLeave = await leaveModel.update({
          where: {
            id
          },
          data: updateData,
        });
        return updatedLeave;
      } catch (error) {
        console.error('Error updating leave record:', error);
        throw new Error('Failed to update leave record.');
      }
    },
  
    /**
     * Deletes a leave record by its unique ID.
     * @param {string} id - The unique ID of the leave record to delete.
     * @returns {Promise<object>} The deleted leave record.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async remove(id) {
      try {
        const deletedLeave = await leaveModel.delete({
          where: {
            id
          },
        });
        return deletedLeave;
      } catch (error) {
        console.error('Error deleting leave record:', error);
        throw new Error('Failed to delete leave record.');
      }
    },
  };
  
  export default Leave;