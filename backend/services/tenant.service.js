// src/services/tenant.service.js
import prisma from '../utils/prismaClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import Logger from '../utils/logger.js';

/**
 * @desc    Retrieves a company by its unique slug.
 * @param   {string} slug The slug of the company.
 * @returns {Promise<object>} A promise that resolves to the company object.
 */
export const getCompanyBySlug = async (slug) => {
  try {
    const company = await prisma.companyMain.findUnique({
      where: { slug: slug },
    });

    if (!company) {
      Logger.warn(`[TenantService] Company with slug '${slug}' not found.`);
      throw new ErrorResponse(`The organization at the provided URL was not found.`, 404);
    }

    return company;
  } catch (error) {
    Logger.error(`[TenantService] Database error resolving tenant for slug '${slug}':`, error);
    // Re-throw the custom error if it's already one, otherwise wrap in a generic 500 error.
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse('Internal Server Error while identifying organization.', 500);
  }
};

/**
 * @desc    Retrieves a company by its ID.
 * @param   {string} companyId The ID of the company to retrieve.
 * @returns {Promise<object>} A promise that resolves to the company object.
 */
export const getCompanyById = async (companyId) => {
  const company = await prisma.companyMain.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    Logger.warn(`[AuthService.getCompanyById] Company with ID '${companyId}' from JWT not found.`);
    throw new ErrorResponse('The organization associated with your session was not found.', 404);
  }

  return company;
};

/**
 * @desc    Creates a new company and links the creator as OWNER.
 * @param   {string} userId The ID of the user creating the company.
 * @param   {string} name The name of the company.
 * @param   {string} slug The unique slug for the company.
 * @returns {Promise<object>} The newly created company.
 */
export const createCompany = async (userId, name, slug) => {
  try {
    // 1. Validate if slug is already taken
    const existingCompany = await prisma.companyMain.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      throw new ErrorResponse('The organization URL (slug) is already taken. Please choose another one.', 400);
    }

    // 2. Get the Free Tier plan by default
    const freePlan = await prisma.companyPlan.findUnique({
      where: { name: 'Free Tier' },
    });

    if (!freePlan) {
      Logger.error('[TenantService] Free Tier plan not found in database. Seeding might be missing.');
      throw new ErrorResponse('Internal Server Error: Default subscription plan not found.', 500);
    }

    // 3. Create company, subscription, and link user in a transaction
    const company = await prisma.$transaction(async (tx) => {
      // Create the company
      const newCompany = await tx.companyMain.create({
        data: {
          name,
          slug,
        },
      });

      // Create the subscription
      await tx.companySubscription.create({
        data: {
          companyId: newCompany.id,
          planId: freePlan.id,
          startDate: new Date(),
          status: 'ACTIVE',
        },
      });

      // Link user as OWNER
      await tx.companyUser.create({
        data: {
          userId: userId,
          companyId: newCompany.id,
          role: 'OWNER',
        },
      });

      return newCompany;
    });

    return company;
  } catch (error) {
    Logger.error(`[TenantService] Error creating company '${name}':`, error);
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse('Internal Server Error while creating organization.', 500);
  }
};
