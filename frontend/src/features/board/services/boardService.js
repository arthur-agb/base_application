// src/services/boardService.js
import { api } from '../../../services'; // Assuming 'api' is your pre-configured Axios instance

/**
 * Fetches detailed board data including columns and issues.
 * @param {string} boardId - The ID of the board to fetch.
 * @returns {Promise<object>} The board data payload.
 */
const getBoard = async (boardId) => {
  const url = `/boards/${boardId}`;
  console.log(`[boardService] GET ${url}`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Creates a new board within a project.
 * @param {string} projectId - The ID of the project to add the board to.
 * @param {object} boardData - Data for the new board (e.g., { name, type }).
 * @returns {Promise<object>} The newly created board object.
 */
const createBoard = async (projectId, boardData) => {
  const url = `/projects/${projectId}/boards`;
  console.log(`[boardService] POST ${url} with data:`, boardData);
  const response = await api.post(url, boardData);
  return response.data;
};

/**
 * Updates an existing board.
 * @param {string} boardId - The ID of the board to update.
 * @param {object} boardData - The updated board data.
 * @returns {Promise<object>} The updated board object.
 */
const updateBoard = async (boardId, boardData) => {
  const url = `/boards/${boardId}`;
  console.log(`[boardService] PUT ${url} with data:`, boardData);
  const response = await api.put(url, boardData);
  return response.data;
};

/**
 * Deletes a board.
 * @param {string} boardId - The ID of the board to delete.
 * @returns {Promise<object>} Response data (might be empty or confirmation).
 */
const deleteBoard = async (boardId) => {
  const url = `/boards/${boardId}`;
  console.log(`[boardService] DELETE ${url}`);
  const response = await api.delete(url);
  return response.data;
};

/**
 * Creates a new column on a board.
 * @param {string} boardId - The ID of the board to add the column to.
 * @param {object} columnData - Data for the new column (e.g., { name, position, limit }).
 * @returns {Promise<object>} The newly created column object.
 */
const createColumn = async (boardId, columnData) => {
  const url = `/boards/${boardId}/columns`;
  console.log(`[boardService] POST ${url} with data:`, columnData);
  const response = await api.post(url, columnData);
  return response.data;
};

/**
 * Updates an existing column.
 * @param {string} columnId - The ID of the column to update.
 * @param {object} columnData - The updated column data.
 * @returns {Promise<object>} The updated column object.
 */
const updateColumn = async (columnId, columnData) => {
  const url = `/columns/${columnId}`;
  console.log(`[boardService] PUT ${url} with data:`, columnData);
  const response = await api.put(url, columnData);
  return response.data;
};

/**
 * Deletes a column.
 * @param {string} columnId - The ID of the column to delete.
 * @returns {Promise<object>} Response data.
 */
const deleteColumn = async (columnId) => {
  const url = `/columns/${columnId}`;
  console.log(`[boardService] DELETE ${url}`);
  const response = await api.delete(url);
  return response.data;
};

/**
 * Searches for users based on a query string.
 * @param {string} searchQuery - The search term.
 * @returns {Promise<Array<object>>} A list of user objects.
 */
const searchUsers = async (searchQuery) => {
  if (!searchQuery || searchQuery.trim().length < 1) { // Min length check (optional, backend also checks)
    return [];
  }
  // The backend userController.searchUsers expects a 'query' parameter
  const url = `/users/search?query=${encodeURIComponent(searchQuery)}`;
  console.log(`[boardService] GET ${url}`);
  try {
    const response = await api.get(url);
    // Expected: [{ id, name, email, avatarUrl? }, ...]
    return response.data;
  } catch (error) {
    console.error("Error searching users in boardService:", error.response?.data || error.message);
    throw error; // Re-throw to be caught by React Query or calling function
  }
};

/**
 * Fetches a single issue by its ID (basic data).
 * @param {string} issueId - The ID of the issue to fetch.
 * @returns {Promise<object>} The issue object.
 */
const getIssue = async (issueId) => {
  const url = `/issues/${issueId}`;
  console.log(`[boardService] GET ${url} (basic)`);
  const response = await api.get(url);
  return response.data;
};


/**
 * Fetches a single issue by its ID with FULL details for the modal.
 * @param {string} issueId - The ID of the issue to fetch.
 * @returns {Promise<object>} The issue object with full details.
 */
const getIssueDetails = async (issueId) => {
  const url = `/issues/${issueId}`;
  console.log(`[boardService] GET ${url} (fetching details)`);
  const response = await api.get(url);
  return response.data;
};


/**
 * Creates a new issue.
 * @param {object} issueData - Data for the new issue.
 * @returns {Promise<object>} The newly created issue object.
 */
const createIssue = async (issueData) => {
  if (!issueData || typeof issueData !== 'object') {
    console.error('[boardService.createIssue] Invalid issueData:', issueData);
    throw new Error('Invalid issueData provided to boardService.createIssue');
  }
  // Example: Check for essential fields
  if (!issueData.projectId || !issueData.columnId || !issueData.title || !issueData.reporterId || !issueData.status) {
    console.error('[boardService.createIssue] Missing required fields in issueData:', issueData);
    throw new Error('Missing required fields in issueData for creating issue.');
  }

  const url = `/issues`;
  console.log(`[boardService.createIssue] POST ${url} with data:`, issueData);
  try {
    const response = await api.post(url, issueData);
    // Check if response or response.data is unexpectedly empty/null
    if (!response || !response.data || typeof response.data.id === 'undefined') {
      console.error('[boardService.createIssue] API call succeeded but response or response.data is invalid. Response:', response);
      throw new Error('API returned an invalid or empty response for createIssue.');
    }
    return response.data;
  } catch (err) {
    console.error('[boardService.createIssue] API POST request failed:', err.response?.data || err.message || err);
    // Ensure the re-thrown error has a message property
    if (err instanceof Error) {
      throw err; // Re-throw if it's already an Error instance
    } else {
      // If not an Error instance, wrap it or create a new one
      const errorMessage = (err && (err.message || (typeof err === 'string' ? err : JSON.stringify(err)))) || 'Unknown error during API call in createIssue';
      throw new Error(errorMessage);
    }
  }
};

/**
 * Updates an existing issue with partial or full details.
 * @param {string} issueId - The ID of the issue to update.
 * @param {object} updatedDetails - An object containing the fields to update.
 * @returns {Promise<object>} The updated issue object.
 */
const updateIssue = async (issueId, updatedDetails) => {
  if (!issueId) {
    throw new Error("boardService.updateIssue requires an issueId.");
  }
  if (!updatedDetails || Object.keys(updatedDetails).length === 0) {
    console.warn("[boardService.updateIssue] Called with no updatedDetails.");
    // Potentially throw an error or return early if this is not allowed
    // throw new Error("No details provided for updating the issue.");
  }
  const url = `/issues/${issueId}`;
  console.log(`[boardService] PATCH ${url} with data:`, updatedDetails);
  const response = await api.patch(url, updatedDetails); // Using PATCH for partial updates
  return response.data;
};

/**
 * Deletes an issue.
 * @param {string} issueId - The ID of the issue to delete.
 * @returns {Promise<object>} Response data.
 */
const deleteIssue = async (issueId) => {
  const url = `/issues/${issueId}`;
  console.log(`[boardService] DELETE ${url}`);
  const response = await api.delete(url);
  return response.data;
};

/**
 * Moves an issue to a new position.
 * @param {object} moveData - Object containing move details.
 * @param {string} moveData.issueId
 * @param {string} moveData.sourceColumnId
 * @param {string} moveData.destinationColumnId
 * @param {number} moveData.newPosition - The destination index.
 * @param {string} moveData.boardId
 * @returns {Promise<object>} Response data.
 */
const moveIssue = async (moveData) => {
  const { issueId, sourceColumnId, destinationColumnId, newPosition, boardId } = moveData;

  if (issueId === undefined || sourceColumnId === undefined || destinationColumnId === undefined || newPosition === undefined) {
    console.error("[boardService.moveIssue] Missing required fields in moveData:", moveData);
    throw new Error('Missing required fields for moving an issue. Ensure issueId, sourceColumnId, destinationColumnId, and newPosition are provided.');
  }
  if (boardId === undefined) {
    console.warn("[boardService.moveIssue] boardId is undefined. The backend might require it.");
  }

  const url = `/issues/${issueId}/position`;
  const requestBody = {
    sourceColumnId,
    destinationColumnId,
    position: newPosition,
    boardId,
  };

  console.log(`[boardService.moveIssue] Sending PUT to ${url} with body:`, requestBody);
  const response = await api.put(url, requestBody);
  return response.data;
};

/**
 * Fetches comments for a specific issue. Should return hierarchical comments.
 * @param {string} issueId - The ID of the issue.
 * @returns {Promise<Array<object>>} An array of comment objects.
 */
const getCommentsForIssue = async (issueId) => {
  if (!issueId) throw new Error('issueId is required to fetch comments.');
  const url = `/issues/${issueId}/comments`;
  console.log(`[boardService] GET ${url} (fetching comments)`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Adds a comment or reply to an issue.
 * @param {object} commentPayload - Data for the new comment/reply.
 * @param {string} commentPayload.issueId - The ID of the issue to comment on.
 * @param {string} commentPayload.text - The text content of the comment.
 * @param {string} [commentPayload.parentCommentId] - Optional ID of the parent comment for replies.
 * @returns {Promise<object>} The newly created comment object.
 */
const addComment = async (commentPayload) => {
  const { issueId, text, parentCommentId } = commentPayload;
  if (!issueId || typeof text !== 'string') {
    throw new Error("boardService.addComment requires 'issueId' and 'text' (string) in payload.");
  }
  const url = `/issues/${issueId}/comments`;
  const requestBody = {
    body: text,
    parentCommentId: parentCommentId || null
  };
  console.log(`[boardService] POST ${url} with body:`, requestBody);
  const response = await api.post(url, requestBody);
  return response.data;
};

/**
 * Updates an existing comment.
 * @param {string} commentId - The ID of the comment to update.
 * @param {object} commentData - Data for the update.
 * @param {string} commentData.text - The new comment body.
 * @returns {Promise<object>} The updated comment object.
 */
const updateComment = async (commentId, commentData) => {
  if (!commentId) throw new Error('commentId is required to update a comment.');
  if (!commentData || typeof commentData.text !== 'string') {
    throw new Error('Comment text (string) is required for update.');
  }
  const url = `/comments/${commentId}`;
  const payload = { body: commentData.text };
  console.log(`[boardService] PUT ${url} with body:`, payload);
  const response = await api.put(url, payload);
  return response.data;
};

/**
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<object>} Confirmation object (e.g., { id: commentId }).
 */
const deleteComment = async (commentId) => {
  if (!commentId) throw new Error('commentId is required to delete a comment.');
  const url = `/comments/${commentId}`;
  console.log(`[boardService] DELETE ${url}`);
  const response = await api.delete(url);
  return response.data;
};

/**
 * Toggles a reaction on a comment.
 * @param {string} commentId - The ID of the comment.
 * @param {object} reactionData - Reaction details.
 * @param {string} reactionData.type - The type of reaction (e.g., "like", "thumbsup").
 * @returns {Promise<object>} Object containing the updated reactions for the comment.
 */
const toggleReaction = async (commentId, reactionData) => {
  if (!commentId) throw new Error('commentId is required to toggle a reaction.');
  if (!reactionData || !reactionData.type) throw new Error('Reaction type is required.');
  const url = `/comments/${commentId}/reactions`;
  const payload = { type: reactionData.type };
  console.log(`[boardService] POST ${url} with body:`, payload);
  const response = await api.post(url, payload);
  return response.data;
};

/**
 * Searches for epics within a project based on a query string.
 * @param {string} projectId - The ID of the project to search within.
 * @param {string} searchQuery - The search term.
 * @returns {Promise<Array<object>>} A list of epic objects ({ id, title }).
 */
const searchEpics = async (projectId, searchQuery) => {
  if (!projectId || !searchQuery || searchQuery.trim().length < 1) {
    return [];
  }
  // Note: The backend controller uses the project *key*, not ID. We pass the key here.
  const url = `/projects/${projectId}/epics/search?query=${encodeURIComponent(searchQuery)}`;
  console.log(`[boardService] GET ${url}`);
  try {
    const response = await api.get(url);
    // Expected: [{ id, title }, ...]
    return response.data;
  } catch (error) {
    console.error("Error searching epics in boardService:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Searches for sprints within a project based on a query string.
 * @param {string} projectKey - The key of the project to search within (e.g., 'DEV').
 * @param {string} searchQuery - The search term.
 * @returns {Promise<Array<object>>} A list of sprint objects ({ id, title }).
 */
const searchSprints = async (projectKey, searchQuery) => {
  if (!projectKey || !searchQuery || searchQuery.trim().length < 1) {
    return [];
  }
  // Nested route structure in projectRoutes.js
  const url = `/projects/${projectKey}/sprints/search?query=${encodeURIComponent(searchQuery)}`;
  console.log(`[boardService] GET ${url}`);
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error searching sprints in boardService:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Searches for issues based on a query string.
 * @param {string} searchQuery - The search term.
 * @returns {Promise<Array<object>>} A list of issue objects.
 */
const searchIssues = async (searchQuery, boardId) => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }
  let url = `/search?type=issues&query=${encodeURIComponent(searchQuery)}`;
  if (boardId) {
    url += `&boardId=${boardId}`;
  }
  console.log(`[boardService] GET ${url}`);
  try {
    const response = await api.get(url);
    return response.data.issues || [];
  } catch (error) {
    console.error("Error searching issues in boardService:", error.response?.data || error.message);
    throw error;
  }
};

const inviteToBoard = async (boardId, email, role = 'MEMBER') => {
  const url = `/boards/${boardId}/invite`;
  console.log(`[boardService] POST ${url} with email: ${email}, role: ${role}`);
  const response = await api.post(url, { email, role });
  return response.data;
};

const updateMemberRole = async (boardId, userId, role) => {
  const url = `/boards/${boardId}/members/${userId}/role`;
  const response = await api.put(url, { role });
  return response.data;
};

const getEligibleUsers = async (boardId, query) => {
  const url = `/boards/${boardId}/eligible-users?query=${encodeURIComponent(query)}`;
  const response = await api.get(url);
  return response.data;
};

const joinBoard = async (boardId) => {
  const url = `/boards/${boardId}/join`;
  console.log(`[boardService] POST ${url}`);
  const response = await api.post(url);
  return response.data;
};

const boardService = {
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  getIssue,
  getIssueDetails,
  createIssue,
  updateIssue,
  deleteIssue,
  moveIssue,
  getCommentsForIssue,
  addComment,
  updateComment,
  deleteComment,
  toggleReaction,
  searchUsers,
  searchEpics,
  searchSprints,
  searchIssues,
  inviteToBoard,
  updateMemberRole,
  getEligibleUsers,
  joinBoard,
};

export default boardService;