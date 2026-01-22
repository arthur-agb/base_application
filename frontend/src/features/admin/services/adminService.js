// src/services/adminService.js
import { api } from '../../../services';

const API_URL = '/admin/users'; // Base URL for admin user management

/**
 * Fetches users based on specified criteria (e.g., status, pagination, search, sort).
 * @param {object} params - Query parameters.
 * @param {string} params.status - User status to filter by (e.g., 'PENDING_APPROVAL'). Can be an array for multiple.
 * @param {number} params.page - Current page number.
 * @param {number} params.limit - Number of users per page.
 * @param {string} [params.searchTerm] - Search term for filtering.
 * @param {string} [params.sortField] - Field to sort by.
 * @param {string} [params.sortOrder] - 'asc' or 'desc'.
 * @returns {Promise<object>} The API response (e.g., { users, totalPages, currentPage, totalUsers }).
 */
const getPendingUsers = async (params) => {
  try {
    // Construct query parameters
    const queryParams = new URLSearchParams();
    if (params.status) {
        // If status can be multiple, backend should support "status=VALUE1&status=VALUE2"
        if (Array.isArray(params.status)) {
            params.status.forEach(s => queryParams.append('status', s));
        } else {
            queryParams.append('status', params.status);
        }
    }
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.sortField) queryParams.append('sortField', params.sortField);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await api.get(`${API_URL}?${queryParams.toString()}`);
    return response.data; // Assuming your API wrapper returns data in response.data
  } catch (error) {
    console.error('Error fetching pending users:', error.response?.data?.message || error.message);
    throw error.response?.data || new Error('Failed to fetch pending users');
  }
};

/**
 * Approves a user.
 * @param {string} userId - The ID of the user to approve.
 * @returns {Promise<object>} The API response.
 */
const approveUser = async (userId) => {
  try {
    const response = await api.put(`${API_URL}/${userId}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Error approving user ${userId}:`, error.response?.data?.message || error.message);
    throw error.response?.data || new Error('Failed to approve user');
  }
};

/**
 * Rejects a user.
 * @param {string} userId - The ID of the user to reject.
 * @param {string} [reason] - Optional reason for rejection.
 * @returns {Promise<object>} The API response.
 */
const rejectUser = async (userId, reason) => {
  try {
    const response = await api.put(`${API_URL}/${userId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting user ${userId}:`, error.response?.data?.message || error.message);
    throw error.response?.data || new Error('Failed to reject user');
  }
};

/**
 * Resends a verification email to a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The API response.
 */
const resendVerificationEmail = async (userId) => {
    try {
        const response = await api.post(`${API_URL}/${userId}/resend-verification`);
        return response.data;
    } catch (error) {
        console.error(`Error resending verification for user ${userId}:`, error.response?.data?.message || error.message);
        throw error.response?.data || new Error('Failed to resend verification email');
    }
};


const adminService = {
  getPendingUsers,
  approveUser,
  rejectUser,
  resendVerificationEmail,
};

export default adminService;