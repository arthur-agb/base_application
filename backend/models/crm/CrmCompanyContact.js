// CrmCompanyContact.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @typedef {import('@prisma/client').CrmCompanyContact} CrmCompanyContact
 * @typedef {import('@prisma/client').Prisma.CrmCompanyContactCreateInput} CrmCompanyContactCreateInput
 * @typedef {import('@prisma/client').Prisma.CrmCompanyContactUpdateInput} CrmCompanyContactUpdateInput
 * @typedef {import('@prisma/client').Prisma.CrmCompanyContactWhereUniqueInput} CrmCompanyContactWhereUniqueInput
 * @typedef {import('@prisma/client').Prisma.CrmCompanyContactWhereInput} CrmCompanyContactWhereInput
 * @typedef {import('@prisma/client').Prisma.CrmCompanyContactInclude} CrmCompanyContactInclude
 */

const CrmCompanyContactModel = {
  /**
   * Creates a new company contact record.
   * @async
   * @param {CrmCompanyContactCreateInput} contactData - The data for the new company contact.
   * @returns {Promise<CrmCompanyContact>} The newly created company contact.
   * @throws {Error} If the creation fails.
   */
  async create(contactData) {
    try {
      const newContact = await prisma.crmCompanyContact.create({
        data: contactData,
      });
      return newContact;
    } catch (error) {
      console.error('Error creating company contact:', error);
      throw new Error(`Failed to create company contact: ${error.message}`);
    }
  },

  /**
   * Finds a single company contact by its unique identifier.
   * @async
   * @param {CrmCompanyContactWhereUniqueInput} where - The unique identifier to find the contact.
   * @param {CrmCompanyContactInclude} [include] - Specifies related models to include.
   * @returns {Promise<CrmCompanyContact | null>} The found company contact or null if not found.
   * @throws {Error} If the query fails.
   */
  async findUnique(where, include = { company: true, createdByUser: true }) {
    try {
      const contact = await prisma.crmCompanyContact.findUnique({
        where,
        include,
      });
      return contact;
    } catch (error) {
      console.error('Error finding unique company contact:', error);
      throw new Error(`Failed to find company contact: ${error.message}`);
    }
  },

  /**
   * Finds all company contacts that match the given criteria.
   * @async
   * @param {CrmCompanyContactWhereInput} [where] - The filter criteria to find contacts.
   * @param {CrmCompanyContactInclude} [include] - Specifies related models to include.
   * @returns {Promise<CrmCompanyContact[]>} An array of company contacts.
   * @throws {Error} If the query fails.
   */
  async findMany(where = {}, include = { company: true, createdByUser: true }) {
    try {
      const contacts = await prisma.crmCompanyContact.findMany({
        where,
        include,
      });
      return contacts;
    } catch (error) {
      console.error('Error finding company contacts:', error);
      throw new Error(`Failed to find company contacts: ${error.message}`);
    }
  },

  /**
   * Updates an existing company contact record.
   * @async
   * @param {CrmCompanyContactWhereUniqueInput} where - The unique identifier of the contact to update.
   * @param {CrmCompanyContactUpdateInput} data - The data to update the contact with.
   * @returns {Promise<CrmCompanyContact>} The updated company contact.
   * @throws {Error} If the update fails.
   */
  async update(where, data) {
    try {
      const updatedContact = await prisma.crmCompanyContact.update({
        where,
        data,
      });
      return updatedContact;
    } catch (error) {
      console.error('Error updating company contact:', error);
      throw new Error(`Failed to update company contact: ${error.message}`);
    }
  },

  /**
   * Deletes a company contact record.
   * @async
   * @param {CrmCompanyContactWhereUniqueInput} where - The unique identifier of the contact to delete.
   * @returns {Promise<CrmCompanyContact>} The deleted company contact.
   * @throws {Error} If the deletion fails.
   */
  async delete(where) {
    try {
      const deletedContact = await prisma.crmCompanyContact.delete({
        where,
      });
      return deletedContact;
    } catch (error) {
      console.error('Error deleting company contact:', error);
      throw new Error(`Failed to delete company contact: ${error.message}`);
    }
  },
};

export default CrmCompanyContactModel;