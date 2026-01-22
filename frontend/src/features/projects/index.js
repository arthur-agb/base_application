// src/features/projects/index.js

// --- Page Components ---
export { default as ProjectDetailPage } from './pages/ProjectDetail';
export { default as ProjectListPage } from './pages/ProjectList';

export { default as ProjectDetailSkeleton } from './skeletons/ProjectDetailSkeleton';
export { default as ProjectListSkeleton } from './skeletons/ProjectListSkeleton';

// --- Redux Slice Exports (from ./slices/projectSlice.js) ---
export {
  // Thunks
  fetchProjects,
  getProjectByKey,
  createProject,
  updateProject,
  deleteProject,
  fetchProjectMembers,
  addProjectMember,
  removeProjectMember,

  // Actions
  clearProjectUpdateError,
  clearProjectFetchError,
  setCurrentProject,
  clearCurrentProject
  // No specific selectors are exported from the slice in the same way as authSlice,
  // as components use state.projects directly.
} from './slices/projectSlice';

// --- Component Exports (Uncommon) ---