//src/utils/globalsInitializer.js

import prisma from './prismaClient.js';
import Logger from './logger.js';

// An object to store all cached global data
const globalCache = {};

/**
 * @desc Fetches the IDs for key user plans and caches them in memory.
 * This function should be called once on application startup.
 */
export async function initializeGlobals() {
  try {
    const freePlan = await prisma.userPlan.findFirst({
      where: { name: 'Free Tier' },
    });

    const proPlan = await prisma.userPlan.findFirst({
      where: { name: 'Pro Tier' },
    });

    const proPlanAnnual = await prisma.userPlan.findFirst({
      where: { name: 'Pro Annual Tier' },
    });

    if (!freePlan) {
      Logger.error(`🚨 Default 'Free Tier' plan not found. Please ensure it exists in the database.`);
      return false;
    }

    if (!proPlan) {
      Logger.warn(`🚨 Default 'Pro Tier' plan not found.`);
    }

    if (!proPlanAnnual) {
      Logger.warn(`🚨 Default 'Pro Annual Tier' plan not found.`);
    }

    // Store the fetched data in the cache object
    globalCache.freePlanId = freePlan.id;
    globalCache.proPlanId = proPlan ? proPlan.id : null;
    globalCache.proPlanAnnualId = proPlanAnnual ? proPlanAnnual.id : null;

    // Cache Role Descriptions
    const descriptions = await prisma.roleDescription.findMany();
    globalCache.roleDescriptions = descriptions.reduce((acc, item) => {
      acc[item.role] = item.description;
      return acc;
    }, {});
    globalCache.roles = descriptions.map(d => d.role);

    Logger.info(`✅ Initialized global variables successfully.`);

    Logger.info(`   - Free plan ID: ${globalCache.freePlanId}`);
    if (globalCache.proPlanId) {
      Logger.info(`   - Pro plan ID: ${globalCache.proPlanId}`);
    }
    if (globalCache.proPlanAnnualId) {
      Logger.info(`   - Pro Annual plan ID: ${globalCache.proPlanAnnualId}`);
    }

    return true;

  } catch (error) {
    Logger.error('Error during global variable initialization:', error);
    return false;
  }
}

/**
 * @desc Gets a cached global value by key.
 * @param {string} key The key of the cached value (e.g., 'freePlanId').
 * @returns {*} The cached value.
 */
export const getGlobal = (key) => {
  if (!globalCache[key]) {
    throw new Error(`Global variable '${key}' has not been initialized.`);
  }
  return globalCache[key];
};