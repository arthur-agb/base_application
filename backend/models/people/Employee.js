// Employee.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

/**
 * @typedef {Object} Employee
 * @property {string} id - The unique identifier for the employee.
 * @property {string} jobTitle - The employee's job title.
 * @property {string} department - The employee's department.
 * @property {string} costCentre - The employee's cost centre, which is unique.
 * @property {string|null} managerId - The ID of the employee's manager, or null if they don't have one.
 * @property {boolean} isActive - Whether the employee is currently active.
 * @property {Date} startDate - The date the employee started.
 * @property {Date|null} endDate - The date the employee's employment ended, or null if they are still employed.
 * @property {Date} createdAt - The creation timestamp.
 * @property {Date} updatedAt - The last update timestamp.
 */

const EmployeeModel = {
  /**
   * Creates a new employee record.
   * @param {Object} employeeData - The data for the new employee.
   * @param {string} employeeData.jobTitle - The employee's job title.
   * @param {string} employeeData.department - The employee's department.
   * @param {string} employeeData.costCentre - The employee's unique cost centre.
   * @param {string} [employeeData.managerId] - Optional ID of the employee's manager.
   * @param {Date} employeeData.startDate - The date the employee started.
   * @returns {Promise<Employee>} The created employee object.
   * @throws {Error} If the creation fails.
   */
  async create(employeeData) {
    try {
      const newEmployee = await prisma.people_Employee.create({
        data: employeeData,
      });
      return newEmployee;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw new Error("Could not create employee.");
    }
  },

  /**
   * Finds all employees with optional filtering, sorting, pagination, and related data.
   * @param {Object} [params] - The query parameters.
   * @param {Object} [params.where] - Filters to apply to the query.
   * @param {Object} [params.orderBy] - Specifies how to sort the results.
   * @param {number} [params.skip] - The number of records to skip for pagination.
   * @param {number} [params.take] - The number of records to take for pagination.
   * @returns {Promise<Employee[]>} An array of employee objects.
   * @throws {Error} If the find operation fails.
   */
  async findAll({ where = {}, orderBy = { createdAt: "desc" }, skip, take } = {}) {
    try {
      const employees = await prisma.people_Employee.findMany({
        where,
        orderBy,
        skip,
        take,
        // Include related data for a richer response
        include: {
          personalDetails: true,
          paymentInfo: true,
          salaries: {
            where: { isActive: true },
          },
          manager: {
            select: {
              id: true,
              jobTitle: true,
            },
          },
        },
      });
      return employees;
    } catch (error) {
      console.error("Error finding all employees:", error);
      throw new Error("Could not retrieve employees.");
    }
  },

  /**
   * Finds a single employee by their unique ID.
   * @param {string} id - The unique identifier of the employee.
   * @param {Object} [params] - The query parameters.
   * @param {Object} [params.select] - Specifies which fields to return.
   * @returns {Promise<Employee|null>} The employee object, or null if not found.
   * @throws {Error} If the find operation fails.
   */
  async findById(id, { select } = {}) {
    try {
      const employee = await prisma.people_Employee.findUnique({
        where: { id },
        // Use a select clause to show a different way of handling data
        select: select || {
          id: true,
          jobTitle: true,
          department: true,
          costCentre: true,
          personalDetails: {
            select: {
              firstName: true,
              lastName: true,
              workEmail: true,
            },
          },
          manager: {
            select: {
              id: true,
              jobTitle: true,
              personalDetails: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          salaries: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      return employee;
    } catch (error) {
      console.error(`Error finding employee with ID ${id}:`, error);
      throw new Error("Could not find employee.");
    }
  },

  /**
   * Updates an existing employee record.
   * @param {string} id - The unique identifier of the employee to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<Employee>} The updated employee object.
   * @throws {Error} If the update fails.
   */
  async update(id, updateData) {
    try {
      const updatedEmployee = await prisma.people_Employee.update({
        where: { id },
        data: updateData,
      });
      return updatedEmployee;
    } catch (error) {
      console.error(`Error updating employee with ID ${id}:`, error);
      throw new Error("Could not update employee.");
    }
  },

  /**
   * Deletes an employee record.
   * @param {string} id - The unique identifier of the employee to delete.
   * @returns {Promise<Employee>} The deleted employee object.
   * @throws {Error} If the deletion fails.
   */
  async remove(id) {
    try {
      const deletedEmployee = await prisma.people_Employee.delete({
        where: { id },
      });
      return deletedEmployee;
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error);
      throw new Error("Could not delete employee.");
    }
  },
};

export default EmployeeModel;