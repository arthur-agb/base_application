// src/features/board/hooks/useUpdateIssue.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn expects an object like { issueId, updatedDetails }
    mutationFn: ({ issueId, updatedDetails }) => boardService.updateIssue(issueId, updatedDetails),

    onSuccess: (updatedIssue, variables) => {
      // 'updatedIssue' is the full issue object returned from the API
      console.log('Issue updated successfully:', updatedIssue);

      // Invalidate the board query to reflect changes (e.g., title update on a card)
      // We assume the boardId is available, which we might need to pass through `variables`
      const boardId = variables.boardId;
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      }

      // Also, update the specific issue's details query cache
      // This ensures the issue modal has the latest data without a full refetch
      if (updatedIssue && updatedIssue.id) {
        queryClient.setQueryData(['issue', updatedIssue.id], (oldData) => {
          if (!oldData) return updatedIssue;
          return { ...oldData, ...updatedIssue };
        });
      }
    },

    onError: (error) => {
      console.error("Error updating issue:", error);
      // You can add user feedback here, like a toast notification
    },
  });
};