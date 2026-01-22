// src/features/epics/index.js

// --- Page Components ---
export { default as EpicPage } from './pages/EpicPage';
export { default as EpicDetailPage } from './pages/EpicDetailPage';

// --- Feature-Specific UI Components (if any, based on EpicPage.jsx) ---
// If EpicFormModal or DeleteConfirmModal were moved to their own files,
// you would export them here. For now, they are internal to EpicPage.jsx.
// export { default as EpicFormModal } from './components/EpicFormModal';
// export { default as DeleteConfirmModal } from './components/DeleteConfirmModal';
//export { default as EpicFormModal } from './components/EpicFormModal';
//export { default as DeleteConfirmModal } from './components/DeleteConfirmModal';
//export { default as StatusBadge } from './components/StatusBadge'; // Assuming StatusBadge also gets its own file


// --- Service Exports ---
export { default as epicService } from './services/epicService';

// --- React Query Hooks for the Epics Feature ---
export { useEpics }      from './hooks/useEpics';
export { useCreateEpic } from './hooks/useCreateEpic';
export { useUpdateEpic } from './hooks/useUpdateEpic';
export { useDeleteEpic } from './hooks/useDeleteEpic';

// Add other epic-feature-specific hooks here as you create them