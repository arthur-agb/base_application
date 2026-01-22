import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService';

// Helper for consistent status mapping
const mapColumnNameToStatusOptimistic = (columnName) => {
  if (!columnName) return 'TODO';
  const upper = columnName.toUpperCase();
  switch (upper) {
    case 'TO DO': case 'TODO': return 'TODO';
    case 'IN PROGRESS': return 'IN_PROGRESS';
    case 'DONE': return 'DONE';
    case 'BACKLOG': return 'BACKLOG';
    case 'CLOSED': return 'CLOSED';
    default: return 'TODO';
  }
};

// Core logic to apply a move to the board state
const applyMoveToState = (boardData, moveData, options = {}) => {
  const { isOptimistic = false, mutationTimestamp } = options;
  const { issueId, sourceColumnId, destinationColumnId, newPosition } = moveData;

  if (!boardData || !boardData.columns) {
    return boardData;
  }

  // Deep copy
  const newState = JSON.parse(JSON.stringify(boardData));

  // Initialize or increment board version
  // If we are cementing (isOptimistic=false), we ideally want to keep the version high 
  // to preventing incoming stale socket events from invalidating us.
  newState.optimisticVersion = (newState.optimisticVersion || 0) + 1;
  const currentVersion = newState.optimisticVersion;

  // 1. FIND AND REMOVE ISSUE
  let movedIssue = null;
  const sourceCol = newState.columns.find(col => col.id.toString() === sourceColumnId.toString());

  // Try standard removal
  if (sourceCol && sourceCol.issues) {
    const index = sourceCol.issues.findIndex(i => i.id.toString() === issueId.toString());
    if (index > -1) {
      [movedIssue] = sourceCol.issues.splice(index, 1);
    }
  }

  // Emergency Search if not found in expected column
  if (!movedIssue) {
    for (const col of newState.columns) {
      const index = col.issues?.findIndex(i => i.id.toString() === issueId.toString());
      if (index > -1) {
        // Warning only if we are in optimistic phase; in success phase this might happen if
        // a background fetch moved it back to original spot.
        if (isOptimistic) {
          console.warn(`[MoveIssue] Issue ${issueId} not found in expected source ${sourceColumnId}. Found in ${col.id}.`);
        }
        [movedIssue] = col.issues.splice(index, 1);
        col.issues.forEach((iss, idx) => iss.position = idx); // Sanitize
        break;
      }
    }
  }

  if (!movedIssue) {
    console.error(`[MoveIssue] Critical: Issue ${issueId} could not be found to move.`);
    return boardData; // Return original if fail
  }

  // 2. PREPARE ISSUE
  movedIssue.columnId = destinationColumnId.toString();
  movedIssue.optimisticVersion = currentVersion;

  // 3. INSERT ISSUE
  const destCol = newState.columns.find(col => col.id.toString() === destinationColumnId.toString());
  if (destCol) {
    if (!destCol.issues) destCol.issues = [];

    // Update status
    movedIssue.status = mapColumnNameToStatusOptimistic(destCol.name);

    // Insert
    destCol.issues.splice(newPosition, 0, movedIssue);

    // Re-index
    destCol.issues.forEach((iss, idx) => { iss.position = idx; });
  } else {
    console.error(`[MoveIssue] Destination column ${destinationColumnId} not found.`);
  }

  // Re-index source if different
  if (sourceCol && sourceCol.id.toString() !== destinationColumnId.toString()) {
    sourceCol.issues.forEach((iss, idx) => { iss.position = idx; });
  }

  // Tag with mutation timestamp
  if (mutationTimestamp) {
    newState._lastMutationAt = mutationTimestamp;
  }

  return newState;
};

export const useMoveIssue = (boardIdForContext) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['moveIssue', boardIdForContext],
    mutationFn: (moveData) => boardService.moveIssue(moveData),

    onMutate: (moveData) => {
      const mutationTimestamp = Date.now();
      const { issueId } = moveData;

      const queryKey = ['board', boardIdForContext];

      // Cancel any outgoing refetches (so they dont overwrite us immediately)
      queryClient.cancelQueries({ queryKey });

      const previousBoardData = queryClient.getQueryData(queryKey);

      // FIX: Removed flushSync to prevent fighting with dnd library animations
      queryClient.setQueryData(queryKey, (oldData) => {
        const newState = applyMoveToState(oldData, moveData, {
          isOptimistic: true,
          mutationTimestamp
        });
        return newState;
      });

      return { previousBoardData, queryKey, mutationTimestamp, moveData };
    },

    onSuccess: (data, variables, context) => {
      // "Local Authority": We trust that the move succeeded (backend said 200 OK).
      // We enforce the new state in the cache, overriding any "ghost" data that 
      // might have slipped in from a race-condition fetch.
      queryClient.setQueryData(context.queryKey, (currentData) => {
        // Re-apply the move logic, but with isOptimistic: false
        const patchedState = applyMoveToState(currentData, variables, {
          isOptimistic: false,
          mutationTimestamp: context.mutationTimestamp
        });
        return patchedState;
      });
    },

    onError: (error, variables, context) => {
      console.error(`[MoveIssue] Backend refused move for ${variables.issueId}:`, error);
      if (context?.previousBoardData) {
        queryClient.setQueryData(context.queryKey, context.previousBoardData);
      }
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },

    onSettled: () => {
      // Do nothing to avoid flicker.
    }
  });
};