// frontend/src/features/epics/services/epicService.js
import { api } from '../../../services';

/**
 * Fetches all epics for a given project.
 * Corresponds to: GET /api/projects/:projectId/epics
 * @param {string} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves to an array of epics.
 */
const getEpicsByProject = async (projectId) => {
    if (!projectId) throw new Error('projectId is required to fetch epics.');
    const url = `/projects/${projectId}/epics`;
    console.log(`[epicService] GET ${url}`);
    const { data } = await api.get(url);
    return data;
};

/**
 * --- ADDED: Fetches a single epic by its ID ---
 * Corresponds to: GET /api/epics/:id
 * @param {string} epicId - The ID of the epic to fetch.
 * @returns {Promise<object>} The epic object.
 */
const getEpicById = async (epicId) => {
    if (!epicId) throw new Error('epicId is required to fetch an epic.');
    const url = `/epics/${epicId}`;
    console.log(`[epicService] GET ${url}`);
    const { data } = await api.get(url);
    return data;
};

/**
 * --- ADDED: Fetches all issues associated with a specific epic ---
 * Corresponds to: GET /api/epics/:id/issues
 * @param {string} epicId - The ID of the epic.
 * @returns {Promise<Array>} A promise that resolves to an array of issues.
 */
const getEpicIssues = async (epicId) => {
    if (!epicId) throw new Error('epicId is required to fetch issues.');
    const url = `/epics/${epicId}/issues`;
    console.log(`[epicService] GET ${url}`);
    const { data } = await api.get(url);
    return data;
};

/**
 * Creates a new epic within a project.
 * Corresponds to: POST /api/projects/:projectId/epics
 * @param {string} projectId - The ID of the project to add the epic to.
 * @param {object} epicData - Data for the new epic (e.g., { title, description, status }).
 * @returns {Promise<object>} The newly created epic object.
 */
const createEpic = async (projectId, epicData) => {
    if (!projectId || !epicData || !epicData.title) {
        throw new Error('projectId and epic title are required to create an epic.');
    }
    const url = `/projects/${projectId}/epics`;
    console.log(`[epicService] POST ${url} with data:`, epicData);
    const { data } = await api.post(url, epicData);
    return data;
};

/**
 * Updates an existing epic.
 * Corresponds to: PUT /api/epics/:id
 * @param {string} epicId - The ID of the epic to update.
 * @param {object} updateData - An object containing the fields to update.
 * @returns {Promise<object>} The updated epic object.
 */
const updateEpic = async (epicId, updateData) => {
    if (!epicId) {
      throw new Error("epicService.updateEpic requires an epicId.");
    }
    // AMENDED: Removed '/api' prefix
    const url = `/epics/${epicId}`;
    console.log(`[epicService] PUT ${url} with data:`, updateData);
    const { data } = await api.put(url, updateData);
    return data;
};

/**
 * Deletes an epic.
 * Corresponds to: DELETE /api/epics/:id
 * @param {string} epicId - The ID of the epic to delete.
 * @returns {Promise<object>} A promise that resolves to a confirmation message.
 */
const deleteEpic = async (epicId) => {
    if (!epicId) throw new Error('epicId is required to delete an epic.');
    // AMENDED: Removed '/api' prefix
    const url = `/epics/${epicId}`;
    console.log(`[epicService] DELETE ${url}`);
    const { data } = await api.delete(url);
    return data;
};

const epicService = {
    getEpicsByProject,
    getEpicById,
    getEpicIssues,
    createEpic,
    updateEpic,
    deleteEpic,
};

export default epicService;