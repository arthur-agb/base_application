// src/features/board/hooks/useIssueComments.js (New file)
import { useQuery } from '@tanstack/react-query';
import boardService from '../services/boardService'; // Adjust path as needed

export const useIssueComments = (issueId) => {
  return useQuery({
    queryKey: ['comments', issueId], // Unique query key for comments of a specific issue
    queryFn: () => boardService.getCommentsForIssue(issueId),
    enabled: !!issueId, // Only run if issueId is provided
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 1000 * 60 * 2, // Example: 2 minutes
  });
};