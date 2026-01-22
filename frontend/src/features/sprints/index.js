// src/features/sprints/index.js

// --- Page Components ---
export { default as SprintPage } from './pages/SprintPage';
export { default as SprintDetailPage } from './pages/SprintDetailPage';

// --- Feature-Specific UI Components ---
export { default as CreateSprintModal } from './components/CreateSprintModal';
export { default as SprintListItem } from './components/SprintListItem';
export { default as SprintIssueList } from './components/SprintIssueList';


// --- Service Exports ---
export { default as sprintService } from './services/sprintService';

// --- React Query Hooks for the Sprints Feature ---
export { useSprints } from './hooks/useSprints';
export { useSprintDetails } from './hooks/useSprintDetails';
export { useSprintIssues } from './hooks/useSprintIssues';
export { useCreateSprint } from './hooks/useCreateSprint';
export { useUpdateSprint } from './hooks/useUpdateSprint';
export { useDeleteSprint } from './hooks/useDeleteSprint';

// --- Redux Slice and Actions ---
export { 
    default as sprintReducer,
    selectSprint,
    clearSelectedSprint,
    openCreateSprintModal,
    closeCreateSprintModal 
} from './slices/sprintSlice';