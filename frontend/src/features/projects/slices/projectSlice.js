import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectService from '../services/projectService';

// --- Fetch All Projects ---
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (includeArchived = false, { rejectWithValue }) => {
    try {
      // Service call remains the same
      return await projectService.getProjects(includeArchived);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch projects';
      return rejectWithValue(message);
    }
  }
);

// --- Get Single Project by Key ---
export const getProjectByKey = createAsyncThunk(
  // Corrected Action Type String
  'projects/getProjectByKey',
  async (key, { rejectWithValue }) => {
    try {
      return await projectService.getProjectByKey(key);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch project';
      return rejectWithValue(message);
    }
  }
);


// --- Create Project ---
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      return await projectService.createProject(projectData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create project';
      return rejectWithValue(message);
    }
  }
);

// --- Update Project By Key ---
export const updateProject = createAsyncThunk(
  'projects/updateProjectByKey', // Renamed action type for clarity
  // Accepts key instead of id
  async ({ key, projectData }, { dispatch, rejectWithValue, getState }) => {
    try {
      const updatedProjectResponse = await projectService.updateProjectByKey(key, projectData);

      // After successful update, refetch the project details using the key
      // Check if the updated project is the current one before refetching
      const currentKey = getState().projects.currentProject?.project?.key;
      if (currentKey === key) {
        await dispatch(getProjectByKey(key)); // Use await if subsequent actions depend on fresh data
      }
      // Return the response from the service (might be the updated project or just success message)
      // We need the updated project data to update the list view correctly
      return updatedProjectResponse;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update project';
      return rejectWithValue(message);
    }
  }
);

// --- Delete Project By Key ---
export const deleteProject = createAsyncThunk(
  'projects/deleteProjectByKey', // Renamed action type for clarity
  // Accepts key instead of id
  async (key, { rejectWithValue }) => {
    try {
      await projectService.deleteProjectByKey(key);
      return key; // Return the key of the deleted project for filtering the list
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete project';
      return rejectWithValue(message);
    }
  }
);

// --- Get Project Members By Key ---
// Optional: If members are always included in getProjectByKey, this might be redundant
export const fetchProjectMembers = createAsyncThunk(
  'projects/fetchProjectMembersByKey', // Renamed action type for clarity
  // Accepts key instead of id
  async (key, { rejectWithValue }) => {
    try {
      return await projectService.getProjectMembersByKey(key);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch project members';
      return rejectWithValue(message);
    }
  }
);

// --- Add Project Member By Key ---
export const addProjectMember = createAsyncThunk(
  'projects/addProjectMemberByKey', // Renamed action type for clarity
  // Accepts key instead of id
  async ({ key, memberData }, { dispatch, rejectWithValue, getState }) => {
    try {
      // Service should return the updated member list or project data
      const result = await projectService.addProjectMemberByKey(key, memberData);

      // After adding a member, refetch the project to get the updated state
      const currentKey = getState().projects.currentProject?.project?.key;
      if (currentKey === key) {
        await dispatch(getProjectByKey(key)); // Use await if needed
      }
      // Return the result from the service if needed, otherwise rely on refetch
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add project member';
      return rejectWithValue(message);
    }
  }
);

// --- Remove Project Member By Key ---
export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMemberByKey', // Renamed action type for clarity
  // Accepts key instead of id
  async ({ key, userId }, { dispatch, rejectWithValue, getState }) => {
    try {
      await projectService.removeProjectMemberByKey(key, userId);

      // Option 1: Return identifiers to manually filter in reducer (less robust if state is complex)
      // return { projectKey: key, userId };

      // Option 2: Refetch the project data (simpler, ensures consistency)
      const currentKey = getState().projects.currentProject?.project?.key;
      if (currentKey === key) {
        await dispatch(getProjectByKey(key));
      }
      // Return something minimal if refetching handles state update
      return { projectKey: key, userId };

    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove project member';
      return rejectWithValue(message);
    }
  }
);


// Removed fetchProjectById thunk as getProjectByKey is primary

const initialState = {
  projects: [],         // List of projects for ProjectList view
  count: 0,             // To store the total count from the API
  currentProject: null, // Detailed data for ProjectDetail view { project: {...}, issueStats: {...} }
  loading: false,       // General loading for list or initial detail fetch
  updateLoading: false, // Specific loading for PUT/POST/DELETE operations on current project
  updateError: null,    // Specific error for update operations
  error: null           // General error for fetch operations
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // Renamed for clarity
    clearProjectUpdateError: (state) => {
      state.updateError = null;
    },
    // General fetch error clear might still be useful
    clearProjectFetchError: (state) => {
      state.error = null;
    },
    // Manual setting/clearing might be useful in some edge cases or optimistic updates
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Projects (List) ---
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.count = action.payload.count;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Error message from rejectWithValue
      })

      // --- Get Project By Key (Detail) ---
      .addCase(getProjectByKey.pending, (state) => {
        state.loading = true; // Use general loading for initial fetch
        state.currentProject = null; // Clear previous project while fetching new one
        state.error = null;
      })
      .addCase(getProjectByKey.fulfilled, (state, action) => {
        state.loading = false;
        // Assuming payload is the structured object { project: {...}, issueStats: {...} }
        // Or adjust based on what getProjectByKey actually returns from backend/service
        state.currentProject = action.payload;
        state.error = null; // Clear previous fetch errors on success
      })
      .addCase(getProjectByKey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Error message from rejectWithValue
        state.currentProject = null; // Ensure no stale data on error
      })

      // --- Create Project ---
      .addCase(createProject.pending, (state) => {
        state.updateLoading = true; // Use updateLoading for create operation
        state.updateError = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.projects.push(action.payload);
        state.count += 1; // Keep the count in sync
        state.updateError = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload; // Use updateError for create failure
      })

      // --- Update Project By Key ---
      .addCase(updateProject.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Refetching via getProjectByKey within the thunk handles currentProject update.
        // Update the project list state if the updated project is present
        const updatedProjectData = action.payload; // Assuming payload is the updated project
        if (updatedProjectData) {
          state.projects = state.projects.map(project =>
            project.key === updatedProjectData.key ? updatedProjectData : project
          );
        }
        state.updateError = null;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })

      // --- Delete Project By Key ---
      .addCase(deleteProject.pending, (state, action) => {
        // action.meta.arg contains the key passed to the thunk
        state.updateLoading = true; // Use updateLoading for deletion
        state.updateError = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.updateLoading = false;
        const deletedKey = action.payload;
        const originalLength = state.projects.length;
        state.projects = state.projects.filter(project => project.key !== deletedKey);
        // Only decrement count if an item was actually removed
        if (state.projects.length < originalLength) {
          state.count -= 1;
        }
        if (state.currentProject?.project?.key === deletedKey) {
          state.currentProject = null;
        }
        state.updateError = null;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })

      // --- Add Project Member By Key ---
      .addCase(addProjectMember.pending, (state) => {
        state.updateLoading = true; // Use update loading for member changes
        state.updateError = null;
      })
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.updateLoading = false;
        // State is updated via the getProjectByKey dispatch within the thunk.
        // No direct state manipulation here needed if refetch occurs.
        state.updateError = null;
      })
      .addCase(addProjectMember.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload; // Use updateError
      })

      // --- Remove Project Member By Key ---
      .addCase(removeProjectMember.pending, (state) => {
        state.updateLoading = true; // Use update loading for member changes
        state.updateError = null;
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        state.updateLoading = false;
        // State is updated via the getProjectByKey dispatch within the thunk.
        // No direct state manipulation here needed if refetch occurs.
        // If not refetching:
        // const { projectKey, userId } = action.payload;
        // if (state.currentProject?.project?.key === projectKey && state.currentProject.project.members) {
        //   state.currentProject.project.members = state.currentProject.project.members.filter(
        //     member => member.id !== userId
        //   );
        // }
        state.updateError = null;
      })
      .addCase(removeProjectMember.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload; // Use updateError
      });

    // Note: Removed handlers for fetchProjectMembers and fetchProjectById as they are likely redundant/replaced

  },
});

// Export appropriate actions
export const {
  clearProjectUpdateError,
  clearProjectFetchError,
  setCurrentProject,
  clearCurrentProject
} = projectSlice.actions;

export default projectSlice.reducer;