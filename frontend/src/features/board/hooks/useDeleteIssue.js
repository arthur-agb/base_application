// src/features/board/hooks/useDeleteIssue.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useDeleteIssue = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId) => boardService.deleteIssue(issueId),

    // Optimistically remove the issue from the board
    onMutate: async (issueIdToDelete) => {
      const queryKey = ['board', boardId];
      await queryClient.cancelQueries({ queryKey });

      const previousBoardData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return;

        const newColumns = oldData.columns.map(column => ({
          ...column,
          issues: column.issues.filter(issue => issue.id.toString() !== issueIdToDelete.toString()),
        }));

        return { ...oldData, columns: newColumns };
      });

      return { previousBoardData, queryKey };
    },

    // If the mutation fails, roll back to the previous state
    onError: (err, variables, context) => {
      console.error("Error deleting issue, rolling back:", err);
      if (context?.previousBoardData) {
        queryClient.setQueryData(context.queryKey, context.previousBoardData);
      }
    },

    // On success or error, refetch the board data to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
};