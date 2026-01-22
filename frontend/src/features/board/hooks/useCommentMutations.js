// src/features/board/hooks/useCommentMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useCommentMutations = (issueId) => {
  const queryClient = useQueryClient();
  const queryKey = ['comments', issueId];

  // --- ADD COMMENT ---
  const addComment = useMutation({
    mutationFn: (commentPayload) => boardService.addComment(commentPayload), // { issueId, text, parentCommentId }
    onSuccess: () => {
      // Refetch comments after a new one is added
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- UPDATE COMMENT ---
  const updateComment = useMutation({
    mutationFn: ({ commentId, commentData }) => boardService.updateComment(commentId, commentData), // { text }
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- DELETE COMMENT ---
  const deleteComment = useMutation({
    mutationFn: (commentId) => boardService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { addComment, updateComment, deleteComment };
};