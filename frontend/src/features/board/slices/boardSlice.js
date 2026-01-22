// src/features/board/slices/boardSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedIssueId: null,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {

    selectIssue: (state, action) => {
        const issueId = action.payload;
        if (issueId === undefined || issueId === null) {
            console.warn('[selectIssue] No valid issueId provided. Received:', issueId);
            return;
        }
        console.log(`[selectIssue] Selecting issue ID: ${issueId}`);
        state.selectedIssueId = issueId.toString(); 
    },

    clearSelectedIssue: (state) => {
        console.log('[clearSelectedIssue] Clearing selected issue state.');
        state.selectedIssueId = null;
    },
    // optimisticMoveIssue: REMOVED - Handled by useMoveIssue React Query hook.
    // _rebuildColumnsFromIssues: REMOVED - Data structure should come from useBoardData, transformations in its `select` option if needed.
    // handleBoardUpdate: REMOVED - WebSocket updates should invalidate React Query cache via queryClient.invalidateQueries in socketService.js.
    // handleCommentSocketUpdate: REMOVED - Same as handleBoardUpdate, for comment-related queries.
  },
  // extraReducers: REMOVED - All async thunks (fetchBoard, moveIssue, addIssue, fetchIssueDetails, updateIssue, deleteIssue, comment thunks)
  // and their corresponding reducers are removed. React Query handles these.
});

export const {
    selectIssue,
    clearSelectedIssue,
} = boardSlice.actions;

export default boardSlice.reducer;