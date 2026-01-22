// src/features/tenants/services/groupService.js
import { api } from '../../../services'; // Using the central pre-configured Axios instance

/**
 * Fetches all groups for the current active tenant.
 * The tenant context is determined by the JWT on the backend.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of group objects.
 */
const getGroups = async () => {
  const url = '/tenant/groups';
  console.log(`[groupService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetches the details of a single group by its ID.
 * @param {string} groupId - The ID of the group to fetch.
 * @returns {Promise<object>} A promise that resolves to the detailed group object.
 */
const getGroupById = async (groupId) => {
  if (!groupId) {
    throw new Error('groupId is required to fetch group details.');
  }
  const url = `/tenant/groups/${groupId}`;
  console.log(`[groupService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

const groupService = {
  getGroups,
  getGroupById,
};

export default groupService;