// src/features/board/index.js

// --- Page Components ---
export { default as BoardViewPage } from './pages/BoardView';
export { default as BoardJoinHandler } from './pages/BoardJoinHandler';

// --- Feature-Specific UI Components ---
export { default as IssueDetailModal } from './components/IssueDetailModal';
export { default as CommentItem } from './components/CommentItem';

export { default as BoardRedirector } from './utils/BoardRedirector';

// --- Redux Slice Exports (from ./slices/boardSlice.js) ---
export {
  selectIssue,       // Manages selectedIssueId UI state for the modal
  clearSelectedIssue,  // Clears selectedIssueId UI state
} from './slices/boardSlice';

// --- Service Exports ---
// Exporting the service provides a consistent way to access it if needed externally,
// though it's often primarily used by the slice's thunks or RQ hooks.
export { default as boardService } from './services/boardService';

// --- NEW: Export React Query Hooks for the Board Feature ---
// export { useBoardData } from './hooks/useBoardData';
// export { useAddIssue } from './hooks/useAddIssue';
// export { useMoveIssue } from './hooks/useMoveIssue';
// export { useIssueDetails } from './hooks/useIssueDetails';
// export { useIssueComments } from './hooks/useIssueComments';

export * from './hooks';