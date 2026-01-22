// src/features/sprints/services/sprintService.js
import { api } from '../../../services'; // Assuming 'api' is your pre-configured Axios instance

/**
 * Creates a new sprint for a given project.
 * @param {object} creationData - Data for the new sprint. Must include `projectKey`.
 * @returns {Promise<object>} The newly created sprint object.
 */
const createSprint = async (creationData) => {
  // Handle call pattern where all data, including the key, is in one object.
  const { projectKey, projectId, ...sprintData } = creationData;
  const key = projectKey || projectId; // Accommodate both prop names for robustness.

  if (!key) {
    throw new Error("createSprint requires a 'projectKey' or 'projectId' property in its argument object.");
  }

  const url = `/projects/${key}/sprints`;
  console.log(`[sprintService] POST ${url} with data:`, sprintData);
  const response = await api.post(url, sprintData);
  return response.data;
};

/**
 * Fetches all sprints for a given project.
 * @param {string} projectKey - The key of the project to fetch sprints for (e.g., 'ONE').
 * @param {object} filters - Filtering options (e.g., { status }).
 * @returns {Promise<Array<object>>} A list of sprint objects.
 */
const getAllSprints = async (projectKey, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = `/projects/${projectKey}/sprints?${params}`;
  console.log(`[sprintService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetches a single sprint by its ID.
 * @param {string} sprintId - The ID of the sprint to fetch.
 * @returns {Promise<object>} The sprint object.
 */
const getSprintById = async (sprintId) => {
  const url = `/sprints/${sprintId}`;
  console.log(`[sprintService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Updates an existing sprint.
 * @param {string} sprintId - The ID of the sprint to update.
 * @param {object} updateData - An object containing the fields to update.
 * @returns {Promise<object>} The updated sprint object.
 */
const updateSprint = async (sprintId, updateData) => {
  const url = `/sprints/${sprintId}`;
  console.log(`[sprintService] PUT ${url} with data:`, updateData);
  const response = await api.put(url, updateData);
  return response.data;
};

/**
 * Deletes a sprint.
 * @param {string} sprintId - The ID of the sprint to delete.
 * @returns {Promise<object>} Response data.
 */
const deleteSprint = async (sprintId) => {
  const url = `/sprints/${sprintId}`;
  console.log(`[sprintService] DELETE ${url}`);
  const response = await api.delete(url);
  return response.data;
};

/**
 * Fetches all issues associated with a specific sprint.
 * @param {string} sprintId - The ID of the sprint.
 * @returns {Promise<Array<object>>} A list of issue objects.
 */
const getSprintIssues = async (sprintId) => {
  const url = `/sprints/${sprintId}/issues`;
  console.log(`[sprintService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

const sprintService = {
  createSprint,
  getAllSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  getSprintIssues,
};

export default sprintService;