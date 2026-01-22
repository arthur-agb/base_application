// src/features/board/hooks/useAddIssue.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService'; // Adjust path as needed

export const useAddIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueData) => boardService.createIssue(issueData), // issueData should include all necessary fields
    onSuccess: (data, variables) => {
      // data is the newly created issue from the backend
      // variables is the object passed to mutate() (issueData)
      console.log('[useAddIssue] Issue added successfully:', data);
      // Invalidate the board data query to refetch and include the new issue.
      // We need boardId from the variables if it was passed.
      // If createIssue was called with { boardId, columnId, title, ... }
      if (variables.boardId) {
        queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
      } else if (data.projectId) {
        // If the created issue response has projectId and you have a way to map it
        // to a boardId for invalidation, or just invalidate a broader scope.
        // For now, relying on boardId in variables is common.
        // As a fallback, you might invalidate all 'board' queries, but this is less targeted.
        // queryClient.invalidateQueries({ queryKey: ['board'] });
        console.warn("[useAddIssue] boardId not available in mutation variables for precise invalidation. Consider passing it or refining invalidation strategy.");
      }

      if (variables.parentIssueId) {
        queryClient.invalidateQueries({ queryKey: ['issue', variables.parentIssueId] });
      }
    },
    onError: (error) => {
      console.error("[useAddIssue] Error adding issue:", error);
      // Handle error (e.g., display a toast notification)
    },
  });
};