// src/services/projectService.js
import { api } from '../../../services';

// --- GET /api/projects ---
// Fetches all projects accessible to the user
const getProjects = async (includeArchived = false) => {
  const response = await api.get(`/projects?includeArchived=${includeArchived}`);
  return response.data;
};

// --- GET /api/projects/:key ---
// Fetches a single project's details using its key
// Renamed function and parameter, updated URL
const getProjectByKey = async (key) => {
  if (!key) throw new Error("Project key is required."); // Basic validation
  const response = await api.get(`/projects/${key}`);
  return response.data;
};

// --- POST /api/projects ---
// Creates a new project
// No change needed here as it doesn't identify a specific project in the URL
const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

// --- PUT /api/projects/:key ---
// Updates a project's details using its key
// Renamed function and parameter, updated URL
const updateProjectByKey = async (key, projectData) => {
  if (!key) throw new Error("Project key is required for update.");
  const response = await api.put(`/projects/${key}`, projectData);
  return response.data;
};

// --- DELETE /api/projects/:key ---
// Deletes a project using its key
// Renamed function and parameter, updated URL
const deleteProjectByKey = async (key) => {
  if (!key) throw new Error("Project key is required for deletion.");
  const response = await api.delete(`/projects/${key}`);
  // DELETE often returns 204 No Content, response.data might be undefined
  // Return status or a standard success object if needed by the slice
  return response.data ?? { success: true, key };
};

// --- GET /api/projects/:key/members ---
// Gets the members list for a project using its key
// Renamed function and parameter, updated URL
const getProjectMembersByKey = async (key) => {
  if (!key) throw new Error("Project key is required to fetch members.");
  const response = await api.get(`/projects/${key}/members`);
  return response.data;
};

// --- POST /api/projects/:key/members ---
// Adds a member to a project using the project key
// Renamed function and parameters, updated URL and payload structure
const addProjectMemberByKey = async (key, memberData) => {
  // memberData should be an object, typically { email: 'user@example.com' }
  if (!key) throw new Error("Project key is required to add a member.");
  if (!memberData || !memberData.email) throw new Error("Member email is required.");
  const response = await api.post(`/projects/${key}/members`, memberData);
  // Backend should return the updated member list or project data
  return response.data;
};

// --- DELETE /api/projects/:key/members/:userId ---
// Removes a member from a project using the project key and user ID
// Renamed function and first parameter, updated URL
const removeProjectMemberByKey = async (key, userId) => {
  if (!key) throw new Error("Project key is required to remove a member.");
  if (!userId) throw new Error("User ID is required to remove a member.");
  const response = await api.delete(`/projects/${key}/members/${userId}`);
  // DELETE often returns 204 No Content
  return response.data ?? { success: true, key, userId };
};

// --- Export the service functions with updated names ---
const projectService = {
  getProjects,
  getProjectByKey,         // Updated name
  createProject,
  updateProjectByKey,      // Updated name
  deleteProjectByKey,      // Updated name
  getProjectMembersByKey,  // Updated name
  addProjectMemberByKey,   // Updated name
  removeProjectMemberByKey,  // Updated name
};

export default projectService;