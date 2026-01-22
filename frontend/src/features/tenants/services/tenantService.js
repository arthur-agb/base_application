// This assumes you have a central configured axios instance.
// If not, you can import axios directly.
import { api } from '../../../services';

/**
 * Fetches the list of users for the current tenant.
 * The backend identifies the tenant via the JWT sent in the header.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
const getTenantUsers = async () => {
    const response = await api.get('/tenants/users');
    return response.data;
};

/**
 * Invites a user to the current tenant by their email and role.
 * @param {string} email The email of the user to invite.
 * @param {string} role The role to assign (default: MEMBER).
 * @returns {Promise<Object>} A promise that resolves to the backend response.
 */
const inviteUserToTenant = async (email, role = 'MEMBER') => {
    const response = await api.post('/tenants/invite', { email, role });
    return response.data;
};
const createCompany = async (companyData) => {
    const response = await api.post('/tenants', companyData);
    return response.data;
};

const getWorkspaceDetails = async () => {
    const response = await api.get('/tenants/details');
    return response.data;
};

const removeUserFromTenant = async (userId) => {
    const response = await api.delete(`/tenants/users/${userId}`);
    return response.data;
};

const updateUserRole = async (userId, role) => {
    const response = await api.put(`/tenants/users/${userId}/role`, { role });
    return response.data;
};

const getRoleDescriptions = async () => {
    const response = await api.get('/tenants/roles/descriptions');
    return response.data;
};

const tenantService = {
    getTenantUsers,
    inviteUserToTenant,
    createCompany,
    getWorkspaceDetails,
    removeUserFromTenant,
    updateUserRole,
    getRoleDescriptions,
};

export default tenantService;